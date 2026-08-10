# Telegram Bot Integration

Website tạo đơn hàng và chuyển khách sang Telegram bot bằng `orderId`.
Bot xử lý thanh toán/trả hàng, sau đó callback lại website để lưu doanh thu.

## Environment

```env
TELEGRAM_BOT_URL=https://t.me/YourBot
BOT_WEBHOOK_SECRET=change-this-secret
CANBOSO_API_BASE=https://canboso.com
CANBOSO_API_KEY=put-the-key-on-server-only
CANBOSO_MARKUP_VND=10000
```

Không đặt `CANBOSO_API_KEY` trong HTML/CSS/JS frontend hoặc GitHub public.
Key chỉ được đặt trong biến môi trường của VPS/Render.

## 1. Website Tạo Đơn

Frontend gọi:

```http
POST /api/orders
Content-Type: application/json
```

Body mua 1 sản phẩm:

```json
{
  "productSlug": "tai-khoan-canva-pro",
  "quantity": 1,
  "options": {
    "variant": "Dùng riêng",
    "duration": "12 tháng"
  }
}
```

Response:

```json
{
  "orderId": "ord_xxxxx",
  "status": "created",
  "amount": 189000,
  "telegramUrl": "https://t.me/YourBot?start=ord_xxxxx"
}
```

## 2. Bot Lấy Thông Tin Đơn

```http
GET /api/bot/orders/ord_xxxxx
X-Bot-Secret: change-this-secret
```

Response có `items`, `amount`, `status`, `createdAt`.

## 3. Bot Báo Thanh Toán Thành Công

```http
POST /api/bot/order-paid
Content-Type: application/json
X-Bot-Secret: change-this-secret
```

Body:

```json
{
  "orderId": "ord_xxxxx",
  "amount": 189000,
  "status": "paid",
  "telegramUserId": "123456789",
  "telegramUsername": "customer_username",
  "botPaymentRef": "bank_txn_or_bot_ref",
  "paidAt": "2026-08-10T12:00:00+07:00"
}
```

Website sẽ lưu đơn thành `paid` để admin/CTV đối soát doanh thu.
Nếu đơn có `canbosoProductId`, backend sẽ gọi Canboso `purchase` sau khi nhận callback paid.
Kết quả purchase và account trả về được lưu trong order để bot/admin xử lý giao hàng.

## 4. Mapping Sản Phẩm Canboso

Trong admin panel, mỗi sản phẩm cần set:

```text
Canboso product_id: _id từ API /api/v2/telegram-buyer/products
Giá gốc Canboso: giá vốn để tính lợi nhuận
Markup: ví dụ 10000
Slot months: chỉ dùng nếu sản phẩm cần slot_months
Cần email khách: bật nếu Canboso yêu cầu customer_email
```

Backend tự dùng:

```http
POST https://canboso.com/api/v2/telegram-buyer/purchase
Idempotency-Key: orderId-productId
```

API key chỉ nằm trên backend qua `CANBOSO_API_KEY`.
