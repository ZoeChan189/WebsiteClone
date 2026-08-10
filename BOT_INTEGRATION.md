# Telegram Bot Integration

Website tạo đơn hàng và chuyển khách sang Telegram bot bằng `orderId`.
Bot xử lý thanh toán/trả hàng, sau đó callback lại website để lưu doanh thu.

## Environment

```env
TELEGRAM_BOT_URL=https://t.me/YourBot
BOT_WEBHOOK_SECRET=change-this-secret
```

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
