# Production Deployment

## Bắt buộc trước khi chạy

1. Thu hồi API key đã từng gửi qua chat và tạo key Canboso mới.
2. Chuyển repository GitHub sang private. Repository hiện public nên mọi người có thể đọc backend dù website đã chặn tải `server.js`.
3. Dùng VPS Ubuntu, Nginx HTTPS và chỉ mở cổng 22, 80, 443. Port Node không được mở Internet.
4. Copy `.env.example` thành file environment nằm ngoài Git và thay toàn bộ placeholder.
5. Đặt `DATA_FILE=/var/lib/storetainguyen/db.json`; không dùng `data/db.json` làm database live.
6. Tắt hoàn toàn `DB_SYNC_TO_GITHUB`. Dữ liệu user/order không được commit vào repository.
7. Lưu `DATA_ENCRYPTION_KEY` trong password manager và một bản offline. Mất key này thì không giải mã được dữ liệu đơn đã mã hóa.
8. Giữ `ALLOW_REGISTRATION=false` nếu không dùng tài khoản khách; chỉ đổi thành `true` khi đã quyết định vận hành tính năng đăng ký.

## Quyền file

```bash
sudo install -d -m 700 -o storeapp -g storeapp /var/lib/storetainguyen
sudo install -d -m 700 -o storeapp -g storeapp /var/backups/storetainguyen
sudo chmod 600 /etc/storetainguyen.env
```

Process Node chạy bằng user riêng `storeapp`, không chạy bằng `root`.

Trên VPS dùng `HOST=127.0.0.1` để Node chỉ nhận kết nối từ Nginx. Với nền tảng bắt buộc bind public như Render, đặt `HOST=0.0.0.0` và vẫn không mở API/database bằng service khác.

## Systemd

Tạo `/etc/systemd/system/storetainguyen.service`:

```ini
[Unit]
Description=storetainguyen web service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=storeapp
Group=storeapp
WorkingDirectory=/opt/storetainguyen
EnvironmentFile=/etc/storetainguyen.env
ExecStart=/usr/bin/node /opt/storetainguyen/server.js
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/storetainguyen
UMask=0077

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now storetainguyen
sudo systemctl status storetainguyen
```

Không đặt secrets trực tiếp trong file service hoặc command line. File `/etc/storetainguyen.env` chỉ cho `root` đọc và phải được backup riêng khỏi source code.

## Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.example;

    client_max_body_size 300k;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Firewall chỉ cho Nginx truy cập `127.0.0.1:3000`. Bật HTTPS bằng Certbot hoặc Cloudflare Full (strict).

## Backup

Backup `/var/lib/storetainguyen/db.json` ít nhất mỗi ngày sang một nơi khác VPS. Giữ tối thiểu 7 bản ngày và 4 bản tuần. Test restore hàng tháng. Không đưa bản backup lên GitHub hoặc thư mục web public.

## Kiểm tra sau deploy

```bash
curl -I https://your-domain.example/
curl -i https://your-domain.example/data/db.json
curl -i https://your-domain.example/server.js
curl -i https://your-domain.example/api/health
```

Hai URL file riêng tư phải trả `404`; health phải trả `200`. Chạy một sản phẩm test giá thấp trước khi bật mua hàng thật.
