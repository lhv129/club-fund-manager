# Test Flows — Quỹ CLB (JSON payload đầy đủ)

> File test hướng dẫn từ đầu đến cuối. Mọi request (trừ webhook) cần header:
>
> ```
> Authorization: Bearer <JWT>
> Accept: application/json
> Content-Type: application/json
> ```
>
> Base URL: `http://localhost:8000/api/v1`
>
> Giả định: club slug = `hanoi-bc`, club_id = `1`, admin đã login拿到 JWT.

---

## Bước 1 — Setup: BankAccount + WebhookConfig

### 1.1 Tạo BankAccount

`POST /clubs/hanoi-bc/bank-accounts`

```json
{
  "bank_name": "Vietcombank",
  "account_number": "0123456789",
  "account_name": "Hanoi BC",
  "is_default": true,
  "is_active": true
}
```

Response `201`:
```json
{
  "success": true,
  "message": "Tạo tài khoản ngân hàng thành công.",
  "data": { "id": 1, "bank_name": "Vietcombank", "account_number": "0123456789", "account_name": "Hanoi BC", "is_default": true }
}
```

### 1.2 Tạo WebhookConfig (SePay)

`POST /clubs/hanoi-bc/webhook-configs`

```json
{
  "bank_account_id": 1,
  "type": "sepay",
  "webhook_secret": "supersecretkey123",
  "is_active": true
}
```

Response `201`:
```json
{
  "success": true,
  "message": "...",
  "data": { "id": 1, "bank_account_id": 1, "type": "sepay", "webhook_token": "a1b2c3d4e5f6", "is_active": true }
}
```

> Ghi nhớ `webhook_token` (= `a1b2c3d4e5f6`) và `webhook_secret` (= `supersecretkey123`)
> để test webhook ở bước 4.

---

## Bước 2 — Tạo FundPeriod (kỳ quỹ) → tự sinh MonthlyContribution

`POST /clubs/hanoi-bc/fund-periods`

```json
{
  "year": 2026,
  "month": 8,
  "male_amount": 200000,
  "female_amount": 150000,
  "exchange_male_amount": 100000,
  "exchange_female_amount": 80000,
  "is_active": true,
  "translations": {
    "vi": { "title": "Quỹ tháng 8/2026", "description": "Đóng quỹ tháng 8" },
    "en": { "title": "Fund Aug 2026", "description": "Monthly fund August" }
  }
}
```

Response `201`:
```json
{
  "success": true,
  "message": "Tạo kỳ quỹ thành công.",
  "data": {
    "id": 1,
    "club_id": 1,
    "year": 2026,
    "month": 8,
    "male_amount": "200000.00",
    "female_amount": "150000.00",
    "exchange_male_amount": "100000.00",
    "exchange_female_amount": "80000.00"
  }
}
```

> Tạo xong sẽ **tự động** sinh MonthlyContribution (pending) cho mọi member approved.
> Giả sử member user_id=10 (nam, amount=200000), user_id=11 (nữ, amount=150000).

---

## Bước 3 — Tạo PlayingSchedule + sinh ExchangeSession qua cron

### 3.1 Tạo PlayingSchedule

`POST /clubs/hanoi-bc/playing-schedules`

```json
{
  "weekday": 2,
  "court_name": "Sansan Cau Giay",
  "court_address": "12 Thai Ha, HN",
  "start_time": "19:00:00",
  "end_time": "21:00:00",
  "auto_generate": true,
  "weeks_ahead": 8,
  "is_active": true,
  "translations": {
    "vi": { "title": "Tối thứ 3 hàng tuần", "note": "Đánh tại Sansan" },
    "en": { "title": "Tuesday nights", "note": "Play at Sansan" }
  }
}
```

Response `201`:
```json
{
  "success": true,
  "data": { "id": 1, "weekday": 2, "court_name": "Sansan Cau Giay", "auto_generate": true, "weeks_ahead": 8 }
}
```

### 3.2 Chạy cron sinh ExchangeSession

```bash
php artisan exchange-sessions:generate
```

Output:
```
+-----------------+------------------+--------------------------+
| Schedules xử lý | Session tạo mới  | Session bỏ qua (đã tồn tại) |
+-----------------+------------------+--------------------------+
| 1               | 8                | 0                        |
+-----------------+------------------+--------------------------+
```

### 3.3 Kiểm tra session đã sinh

`GET /clubs/hanoi-bc/exchange-sessions?status=upcoming&type=scheduled&limit=10`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "playing_schedule_id": 1,
      "session_date": "2026-08-04",
      "court_name": "Sansan Cau Giay",
      "start_time": "19:00",
      "end_time": "21:00",
      "type": "scheduled",
      "status": "upcoming",
      "player_count": 0,
      "total_amount": "0.00",
      "exchange_male_amount": "0.00",
      "exchange_female_amount": "0.00"
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 8, "last_page": 1 }
}
```

> Lưu ý `exchange_male_amount`/`exchange_female_amount` = 0 vì chưa chốt — sẽ snapshot
> từ FundPeriod khi `complete` (bước 6).

---

## Bước 4 — Member thanh toán quỹ tháng (webhook SePay)

### 4.1 Sinh MemberPaymentCode

`POST /clubs/hanoi-bc/monthly-contributions/1/payment-code/generate`

> (endpoint exact theo route file — sinh code 8 ký tự, status=pending, expired_at.)

Response `201`:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "monthly_contribution_id": 1,
    "payment_code": "Y5REQVV8",
    "status": "pending",
    "expired_at": "2026-08-31 23:59:59"
  }
}
```

### 4.2 Giả lập SePay webhook (income, có payment code trong nội dung)

`POST /sepay/webhook/a1b2c3d4e5f6`

Body (raw JSON):
```json
{
  "transferType": "in",
  "transferAmount": 200000,
  "accumulated": 5000000,
  "content": "Y5REQVV8 Nguyen Van A dong quy thang 8",
  "referenceCode": "SEPAY12345",
  "transactionDate": "2026-08-05 14:20:11"
}
```

Headers:
```
Content-Type: application/json
X-SePay-Timestamp: 1691233211
X-SePay-Signature: sha256=<HMAC>
```

Tính HMAC (PHP):
```php
$timestamp = '1691233211';
$body       = '{"transferType":"in","transferAmount":200000,...}';
$message    = $timestamp . '.' . $body;
$signature  = 'sha256=' . hash_hmac('sha256', $message, 'supersecretkey123');
```

> Dùng timestamp hiện tại (epoch giây). `|now - timestamp| <= 300s` nếu không bị reject.

Response `200`:
```json
{
  "success": true,
  "message": "Webhook đã xử lý.",
  "data": { "transaction_id": 1 }
}
```

### 4.3 Kiểm tra MonthlyContribution đã paid

`GET /clubs/hanoi-bc/monthly-contributions/1`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "period_id": 1,
    "user_id": 10,
    "transaction_id": 1,
    "amount": "200000.00",
    "status": "paid",
    "paid_by": "bank",
    "payment_date": "2026-08-05 14:20:11",
    "paymentCode": { "id": 1, "payment_code": "Y5REQVV8", "status": "used" }
  }
}
```

---

## Bước 5 — Sửa PlayingSchedule → cascade sync ExchangeSession upcoming

### 5.1 Đổi giờ schedule

`PUT /clubs/hanoi-bc/playing-schedules/1`

```json
{
  "start_time": "18:30:00",
  "end_time": "20:30:00",
  "court_name": "Sansan Cau Giay (mới)",
  "translations": {
    "vi": { "title": "Tối thứ 3 hàng tuần", "note": "Đánh tại Sansan" }
  }
}
```

### 5.2 Kiểm tra session upcoming đã đồng bộ

`GET /clubs/hanoi-bc/exchange-sessions?status=upcoming`

```json
{
  "data": [
    {
      "id": 1,
      "court_name": "Sansan Cau Giay (mới)",
      "start_time": "18:30",
      "end_time": "20:30"
    }
  ]
}
```

> Session `completed`/`cancelled` **không** bị đè (giữ court/giờ cũ).

### 5.3 Chạy sync tay (nếu cần)

```bash
php artisan exchange-sessions:sync --schedule-id=1
```

---

## Bước 6 — Giao lưu: thêm nhóm giao lưu + chốt buổi

> Mô hình: mỗi dòng `exchange_session_players` = 1 **nhóm giao lưu** do 1 member
> (`user_id`) mang đến, hoặc người lạ (`user_id=null`, `player_name` = JSON mảng tên).
> Cột `male`/`female` = **số lượng** nam/nữ trong nhóm. `amount` tự tính =
> `male × exchange_male_amount + female × exchange_female_amount`. Member đóng quỹ
> đi đánh KHÔNG tạo dòng ở đây (quỹ tháng đã bao trùm).

### 6.1 Thêm nhóm giao lưu của member (user_id=3, mang 3 nam + 2 nữ)

`POST /clubs/hanoi-bc/exchange-sessions/1/players`

```json
{
  "user_id": 3,
  "male": 3,
  "female": 2
}
```

> `player_name` để trống (có user_id). `amount` tự tính từ đơn giá session (0 nếu
> chưa chốt, sẽ recalc khi complete).

Response `201`:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "exchange_session_id": 1,
    "user_id": 3,
    "player_name": null,
    "male": 3,
    "female": 2,
    "transaction_id": null,
    "amount": "0.00",
    "paid": false,
    "checked_in": false,
    "user": { "id": 3, "fullname": "Nguyen Van C" }
  }
}
```

### 6.2 Thêm nhóm giao lưu người lạ (JSON mảng tên, 2 nam + 1 nữ)

`POST /clubs/hanoi-bc/exchange-sessions/1/players`

```json
{
  "player_name": ["Khách A", "Khách B", "Khách C"],
  "male": 2,
  "female": 1
}
```

Response `201`:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "user_id": null,
    "player_name": ["Khách A", "Khách B", "Khách C"],
    "male": 2,
    "female": 1,
    "amount": "0.00"
  }
}
```

### 6.3 Chốt buổi (snapshot đơn giá + tính lại amount mỗi nhóm + total)

`PATCH /clubs/hanoi-bc/exchange-sessions/1/complete`

> Service sẽ:
> 1. Tìm FundPeriod cho tháng 8/2026 (club_id=1) → OK.
> 2. Snapshot `exchange_male_amount=100000`, `exchange_female_amount=80000` lên session.
> 3. Tính lại `amount` mỗi nhóm = `male×100000 + female×80000`:
>    - Nhóm 1 (user_id=3): 3×100000 + 2×80000 = 460000
>    - Nhóm 2 (người lạ):  2×100000 + 1×80000 = 280000
> 4. `player_count` = sum(male+female) = (3+2) + (2+1) = 8 người.
> 5. `total_amount` = 460000 + 280000 = 740000.
> 6. Set `status=completed`.

Response `200`:
```json
{
  "success": true,
  "message": "Chốt buổi đánh thành công.",
  "data": {
    "id": 1,
    "status": "completed",
    "player_count": 8,
    "total_amount": "740000.00",
    "exchange_male_amount": "100000.00",
    "exchange_female_amount": "80000.00",
    "players": [
      { "id": 1, "user_id": 3, "male": 3, "female": 2, "amount": "460000.00", "paid": false },
      { "id": 2, "player_name": ["Khách A","Khách B","Khách C"], "male": 2, "female": 1, "amount": "280000.00", "paid": false }
    ]
  }
}
```

### 6.4 Đối soát `paid` cho nhóm giao lưu (2 cách)

**Cách A — Toggle tay** (admin thấy tiền vào tài khoản → toggle):

`PATCH /clubs/hanoi-bc/exchange-sessions/1/players/1/toggle-paid`

Response `200`: `{ "paid": true }`

> Khi toggle về `false` → `transaction_id` bị clear (không đối soát nữa).

**Cách B — Gắn `transaction_id` tay** (admin chọn 1 Transaction income → gắn vào nhóm):

`PUT /clubs/hanoi-bc/exchange-sessions/1/players/1`

```json
{
  "transaction_id": 3
}
```

> Service tự set `paid=true` khi `transaction_id` đổi sang ID khác. Có audit trail
> (biết tiền nào ứng với nhóm nào). Xem chi tiết qua `transaction` relation:

Response `200`:
```json
{
  "data": {
    "id": 1,
    "user_id": 3,
    "male": 3,
    "female": 2,
    "amount": "460000.00",
    "paid": true,
    "transaction_id": 3,
    "transaction": {
      "id": 3,
      "source": "cash",
      "type": "income",
      "amount": "460000.00",
      "description": "Thu tiền mặt giao lưu buổi 4/8",
      "transaction_date": "2026-08-05T21:30:00.000000Z"
    }
  }
}
```

---

## Bước 7 — Chi tiền sân (webhook expense + admin sửa mô tả)

### 7.1 SePay webhook expense (transferType=out — CLB trả tiền sân)

`POST /sepay/webhook/a1b2c3d4e5f6`

```json
{
  "transferType": "out",
  "transferAmount": 350000,
  "accumulated": 4650000,
  "content": "CHUYEN KHOAN THUE SAN",
  "referenceCode": "SEPAY67890",
  "transactionDate": "2026-08-05 16:00:00"
}
```

Response `200`:
```json
{ "success": true, "data": { "transaction_id": 2 } }
```

> Expense không match payment code — chỉ lưu Transaction. Admin vào sửa mô tả để biết
> lý do chi.

### 7.2 Admin sửa description (lý do chi)

`PATCH /clubs/hanoi-bc/transactions/2`

```json
{
  "description": "Tiền thuê sân buổi 4/8 tại Sansan (2h × 175k)"
}
```

Response `200`:
```json
{
  "success": true,
  "message": "Cập nhật giao dịch thành công.",
  "data": {
    "id": 2,
    "type": "expense",
    "source": "webhook",
    "amount": "350000.00",
    "description": "Tiền thuê sân buổi 4/8 tại Sansan (2h × 175k)",
    "transaction_date": "2026-08-05T16:00:00.000000Z"
  }
}
```

> Chỉ `description` được sửa. `amount` / `transaction_date` / `type` / `source` bị
> chặn ở service (bảo toàn dữ liệu ngân hàng).

---

## Bước 8 — Thu giao lưu (income manual, đối soát tay)

> Nếu admin nhận tiền mặt giao lưu, có thể tạo Transaction income manual rồi gắn
> vào session qua `transaction_id`.

### 8.1 Tạo Transaction income manual

`POST /clubs/hanoi-bc/transactions`

```json
{
  "source": "cash",
  "amount": 180000,
  "description": "Thu tiền mặt giao lưu buổi 4/8",
  "transaction_date": "2026-08-05 21:30:00"
}
```

Response `201`:
```json
{
  "success": true,
  "data": {
    "id": 3,
    "type": "income",
    "source": "cash",
    "amount": "180000.00"
  }
}
```

### 8.2 Gắn Transaction vào ExchangeSession

`PUT /clubs/hanoi-bc/exchange-sessions/1`

```json
{
  "transaction_id": 3,
  "translations": {
    "vi": { "title": "Buổi đánh 4/8", "note": "Đánh tại Sansan" }
  }
}
```

---

## Bước 9 — Danh sách Transaction + filter

### 9.1 Lọc chi (expense) trong tháng 8

`GET /clubs/hanoi-bc/transactions?type=expense&from_date=2026-08-01&to_date=2026-08-31`

```json
{
  "data": [
    {
      "id": 2,
      "type": "expense",
      "source": "webhook",
      "amount": "350000.00",
      "description": "Tiền thuê sân buổi 4/8 tại Sansan (2h × 175k)"
    }
  ],
  "meta": { "page": 1, "limit": 15, "total": 1, "last_page": 1 }
}
```

### 9.2 Search theo description

`GET /clubs/hanoi-bc/transactions?search=tiền+sân`

---

## Bước 10 — Case lỗi (verify guards)

### 10.1 Chốt buổi khi chưa có FundPeriod

Xoá FundPeriod tháng 8 (hoặc test với session tháng 9 chưa có FundPeriod), rồi:

`PATCH /clubs/hanoi-bc/exchange-sessions/{id}/complete`

```json
{
  "success": false,
  "message": "Chưa có kỳ quỹ (FundPeriod) cho tháng của buổi đánh. Vui lòng tạo kỳ quỹ trước khi chốt.",
  "errors": []
}
```

Status `422`.

### 10.2 Chốt buổi 2 lần

Buổi đã `status=completed` → gọi `complete` lại:

`PATCH /clubs/hanoi-bc/exchange-sessions/1/complete`

```json
{
  "success": false,
  "message": "Buổi đánh đã chốt hoặc đã huỷ, không thể chốt lại."
}
```

Status `422`.

### 10.3 Thêm nhóm giao lưu thiếu male/female (tổng = 0)

`POST /clubs/hanoi-bc/exchange-sessions/1/players`

```json
{ "user_id": 3 }
```

```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ.",
  "errors": { "male": ["Tổng số nam/nữ phải lớn hơn 0."] }
}
```

Status `422`.

### 10.4 Thêm player thiếu cả user_id lẫn player_name

`POST /clubs/hanoi-bc/exchange-sessions/1/players`

```json
{ "male": 2, "female": 1 }
```

```json
{
  "success": false,
  "errors": { "player_name": ["Phải có ít nhất user_id hoặc player_name."] }
}
```

### 10.5 Tạo Transaction expense manual → bị ép income

`POST /clubs/hanoi-bc/transactions`

```json
{ "source": "cash", "type": "expense", "amount": 100000 }
```

> Service **ép** `type=income` bất kể input. Response sẽ có `"type": "income"`.
> Expense chỉ qua webhook — không tạo manual.

### 10.6 Sửa Transaction field ngoài description → bị lờ đi

`PATCH /clubs/hanoi-bc/transactions/2`

```json
{ "amount": 999999, "type": "income" }
```

> Request rule chỉ chấp nhận `description` → `amount`/`type` bị filter khỏi
> `validated()`. Response giữ `amount=350000`, `type=expense` nguyên.

### 10.7 Webhook sai chữ ký HMAC

`POST /sepay/webhook/a1b2c3d4e5f6` với `X-SePay-Signature: sha256=sai`:

```json
{ "success": false, "message": "Chữ ký webhook không hợp lệ." }
```

Status `401`/`403`.

### 10.8 Webhook replay code đã used

Gọi lại cùng payload bước 4.2 → `PaymentMatchingService` guard `contribution.status=pending`
→ skip (log) vì contribution đã `paid`. Transaction mới vẫn được tạo nhưng không settle lại.

---

## Tóm tắt luồng

```text
FundPeriod ──(create)──▶ MonthlyContribution (pending)
                              │
                              ▼ bấm "Thanh toán"
                         MemberPaymentCode (pending)
                              │
                              ▼ chuyển khoản + code
                         SePay webhook (income)
                              │
                              ▼ PaymentMatching
                         MonthlyContribution (paid)

PlayingSchedule ──(cron)──▶ ExchangeSession (upcoming, scheduled)
                              │
                              ▼ sửa schedule → cascade sync upcoming
                              ▼ thêm nhóm giao lưu (user_id | player_name JSON, male, female)
                              ▼ PATCH /complete (snapshot đơn giá FundPeriod + recompute amount mỗi nhóm + total)
                         ExchangeSession (completed)

SePay webhook (expense) ──▶ Transaction (expense, source=webhook)
                              │
                              ▼ admin PATCH /{id} sửa description
                         Transaction (có lý do chi)

Admin tạo Transaction income manual ──▶ PUT /players/{id} {transaction_id} → paid=1
                                      (hoặc toggle-paid tay)
```
