# Telegram Bot Integration

Website tạo đơn và mở Telegram bằng `orderId`. Bot tạo QR, xác nhận thanh toán rồi gọi callback về website. API Canboso chỉ được gọi từ backend website.

## Secrets

Đặt các giá trị sau trong environment của VPS, không đặt trong HTML/CSS/JS, GitHub, ảnh chụp màn hình hoặc tin nhắn:

```env
TELEGRAM_BOT_URL=https://t.me/YourBot
BOT_WEBHOOK_SECRET=<random-secret-1>
BOT_WEBHOOK_SIGNING_SECRET=<random-secret-2>
BOT_REQUIRE_SIGNATURE=true
BOT_REQUIRE_PAYMENT_REF=true
CANBOSO_API_BASE=https://canboso.com
CANBOSO_API_KEY=<new-rotated-key>
```

Hai bot secret phải khác nhau và dài tối thiểu 32 ký tự. API key đã từng được gửi qua chat phải được thu hồi và cấp lại trước production.

## 1. Website tạo đơn

```http
POST /api/orders
Content-Type: application/json
```

```json
{
  "productSlug": "tai-khoan-canva-pro",
  "quantity": 1,
  "customerEmail": "customer@example.com",
  "options": {
    "package": "Dùng riêng",
    "duration": "12 tháng"
  }
}
```

Response có `orderId`, số tiền do server tính và `telegramUrl`. Frontend không được tự gửi giá.

## 2. Bot lấy đơn

Tạo timestamp Unix theo giây và ký đường dẫn chính xác:

```text
HMAC_SHA256(BOT_WEBHOOK_SIGNING_SECRET, timestamp + ".GET./api/bot/orders/ord_xxxxx")
```

```http
GET /api/bot/orders/ord_xxxxx
X-Bot-Secret: <BOT_WEBHOOK_SECRET>
X-Bot-Timestamp: <unix-seconds>
X-Bot-Signature: sha256=<hex-signature>
```

Bot dùng đúng `amount` trong response để tạo QR.

## 3. Bot callback thanh toán

Body JSON phải được giữ nguyên khi tính chữ ký:

```json
{
  "orderId": "ord_xxxxx",
  "amount": 189000,
  "status": "paid",
  "telegramUserId": "123456789",
  "telegramUsername": "customer_username",
  "botPaymentRef": "unique-bank-transaction-id"
}
```

Tạo timestamp Unix theo giây. Tính chữ ký hex:

```text
HMAC_SHA256(BOT_WEBHOOK_SIGNING_SECRET, timestamp + "." + rawJsonBody)
```

Gửi request:

```http
POST /api/bot/order-paid
Content-Type: application/json
X-Bot-Secret: <BOT_WEBHOOK_SECRET>
X-Bot-Timestamp: <unix-seconds>
X-Bot-Signature: sha256=<hex-signature>
```

Server chỉ nhận callback trong 5 phút, bắt số tiền khớp chính xác và khóa `botPaymentRef` sau callback đầu tiên. Callback lặp dùng cùng order/ref không tạo giao dịch Canboso mới nhờ idempotency key.

## 4. Mapping Canboso

Admin cần cấu hình `Canboso product_id`, giá gốc, markup, slot months và yêu cầu email cho từng sản phẩm. Backend mua hàng sau callback hợp lệ. API key, giá vốn và response nội bộ không xuất hiện trong API public.
