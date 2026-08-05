# Thiết kế hệ thống Quản lý Quỹ CLB

> Tài liệu tổng quan — nắm module xử lý từ đâu đến đâu, dữ liệu demo ở các bảng.
> Chi tiết cột/migration xem trong `database/migrations/`.

## 1. Mục tiêu

- Quản lý quỹ tháng (FundPeriod + MonthlyContribution).
- Quản lý buổi đánh (PlayingSchedule + ExchangeSession).
- Thanh toán chuyển khoản + tiền mặt, đối soát qua webhook.
- Sinh và đối soát payment code.

## 2. Kiến trúc module

```text
Club
├── BankAccounts
│    └── WebhookConfigs
├── FundPeriods
│    └── MonthlyContributions
│          └── MemberPaymentCodes
├── PlayingSchedules
│    └── ExchangeSessions
│          ├── ExchangeSessionPlayers
│          └── ExchangeSessionTranslations
└── Transactions
```

Mỗi module tuân theo luồng `Request → Controller → Service → Repository → Model` (xem `api-overview.md`).

## 3. Luồng thanh toán quỹ tháng

```text
[Admin]  tạo FundPeriod (year + month + male/female/exchange amount)
   │
   ▼
[Admin]  sinh MonthlyContribution cho từng thành viên (amount theo giới tính)
   │
   ▼
[Member] bấm "Thanh toán" trên MonthlyContribution
   │
   ▼
[System] sinh MemberPaymentCode (8 ký tự, status=pending, expired_at)
   │
   ▼
[Member] chuyển khoản kèm payment_code trong nội dung
   │
   ▼
[Bank]   gửi webhook → tạo Transaction (source=webhook, type=income)
   │
   ▼
[System] match payment_code trong description của Transaction
   │  ├── tìm thấy MemberPaymentCode pending & chưa hết hạn
   │  │     → gắn transaction_id vào MonthlyContribution
   │  │     → MonthlyContribution.status = paid, paid_by = bank, payment_date = now
   │  │     → MemberPaymentCode.status = used, used_at = now
   │  └── không match → Transaction vẫn lưu, chờ admin đối soát tay (source=manual)
   ▼
[Admin]  có thể tạo Transaction tay (source=cash|manual) & gắn vào MonthlyContribution
```

**Variant tiền mặt:** Admin tạo Transaction `source=cash` → gắn vào MonthlyContribution với `paid_by=cash` → MonthlyContribution sang `paid`.

## 4. Luồng buổi đánh

```text
[Admin]  tạo PlayingSchedule (mẫu: weekday, court, start/end time, auto_generate, weeks_ahead)
   │
   ▼
[Cron]   mỗi tuần sinh ExchangeSession (8 tuần tới) từ PlayingSchedule
   │     type=scheduled, status=upcoming, playing_schedule_id NOT NULL
   ▼
[Admin]  có thể sửa từng ExchangeSession riêng, hoặc tạo tay (type=manual, playing_schedule_id=NULL)
   │
   ▼
[Member] đăng ký tham gia → ExchangeSessionPlayer (amount, paid=false, checked_in=false)
   │
   ▼
[Member] thanh toán tiền sân (chuyển khoản kèm code hoặc admin đánh paid tay)
   │
   ▼
[Admin]  check-in → ExchangeSessionPlayer.checked_in=true
   │
   ▼
[Admin]  chốt buổi → ExchangeSession.status=completed, total_amount & amount_per_player tính lại
```

## 5. Dữ liệu demo ở các bảng

> Ví dụ dữ liệu để hình dung quan hệ. Giả sử 1 CLB "Hanoi Badminton Club" (club_id=1).

### fund_periods + fund_period_translations

```text
fund_periods
 id | club_id | year | month | male_amount | female_amount | exchange_amount | is_locked | is_active
 1  | 1       | 2026 | 8     | 200000      | 150000        | 100000          | 0         | 1

fund_period_translations
 id | fund_period_id | locale | title           | description
 1  | 1              | vi     | Quỹ tháng 8/2026 | Đóng quỹ tháng 8
 2  | 1              | en     | Fund Aug 2026    | Monthly fund August
```

### monthly_contributions

```text
 id | period_id | club_id | user_id | transaction_id | amount  | status | paid_by | payment_date
 1  | 1         | 1       | 10      | NULL           | 200000  | pending| NULL    | NULL
 2  | 1         | 1       | 11      | NULL           | 150000  | pending| NULL    | NULL
 3  | 1         | 1       | 12      | 55             | 150000  | paid   | bank    | 2026-08-03 14:20
```

→ user 10 (nam) đóng 200000, user 11/12 (nữ) đóng 150000. user 12 đã thanh toán qua webhook → gắn transaction_id=55.

### member_payment_codes

```text
 id | monthly_contribution_id | payment_code | status | expired_at           | used_at
 1  | 1                       | AB12CD34     | pending| 2026-08-31 23:59:59 | NULL
 2  | 3                       | XY99ZW88     | used   | 2026-08-31 23:59:59 | 2026-08-03 14:20:11
```

→ user 12 bấm "Thanh toán" → sinh code XY99ZW88 → chuyển khoản kèm code → webhook match → status=used.

### transactions

```text
 id | club_id | user_id | bank_account_id | webhook_config_id | source | type   | amount  | reference_code | description                  | transaction_date
 55 | 1       | 12      | 1               | 1                 | webhook| income | 150000  | SEPAY12345      | XY99ZW88 Nguyen Van A dong quy | 2026-08-03 14:20:11
 60 | 1       | NULL    | NULL            | NULL              | cash   | income | 200000  | NULL            | Thu tien san tay user 10     | 2026-08-05 09:00:00
```

→ Transaction 55 match code XY99ZW88 → gắn vào MonthlyContribution 3.
→ Transaction 60 do admin tạo tay (cash), chờ gắn vào MonthlyContribution 1.

### bank_accounts + webhook_configs (đã hoạt động)

```text
bank_accounts
 id | club_id | bank_name | account_number | account_name | is_default
 1  | 1       | Vietcombank| 0123456789     | Hanoi BC     | 1

webhook_configs
 id | club_id | bank_account_id | type  | webhook_token              | is_active
 1  | 1       | 1                | sepay | a1b2c3d4e5f6               | 1
```

### playing_schedules + playing_schedule_translations

```text
playing_schedules
 id | club_id | weekday | court_name     | court_address     | start_time | end_time | auto_generate | weeks_ahead
 1  | 1       | 2       | Sansan Cau Giay| 12 Thai Ha, HN    | 19:00:00   | 21:00:00 | 1             | 8

playing_schedule_translations
 id | playing_schedule_id | locale | title           | note
 1  | 1                   | vi     | Tối thứ 3 hàng tuần | Đánh tại Sansan
 2  | 1                   | en     | Tuesday nights      | Play at Sansan
```

→ Buổi đánh tối thứ 3 (weekday=2) hàng tuần tại Sansan, tự sinh 8 tuần tới.

### exchange_sessions + exchange_session_translations

```text
exchange_sessions
 id | club_id | playing_schedule_id | transaction_id | session_date | court_name     | start_time | end_time | type     | status   | player_count | amount_per_player | total_amount
 1  | 1       | 1                   | NULL           | 2026-08-04   | Sansan Cau Giay| 19:00:00   | 21:00:00 | scheduled| upcoming | 0           | 0                 | 0
 2  | 1       | NULL                | NULL           | 2026-08-10   | Cau Long My Dinh| 18:00:00  | 20:00:00 | manual   | upcoming | 0           | 0                 | 0

exchange_session_translations
 id | exchange_session_id | locale | title           | note
 1  | 1                   | vi     | Buổi đánh 4/8    | Đánh tại Sansan
 2  | 1                   | en     | Session Aug 4    | Play at Sansan
```

→ Session 1 do cron sinh từ schedule 1 (type=scheduled). Session 2 admin tạo tay (type=manual, playing_schedule_id=NULL).

### exchange_session_players

```text
 id | exchange_session_id | user_id | player_name | amount  | paid | checked_in
 1  | 1                   | 10      | NULL        | 50000   | 1    | 1
 2  | 1                   | 11      | NULL        | 50000   | 1    | 0
 3  | 1                   | NULL    | Khách A     | 50000   | 0    | 0
```

→ user 10 đã check-in & trả tiền, user 11 trả tiền chưa check-in, "Khách A" là khách ngoài (user_id=NULL) chưa trả.

## 6. Module API

| Module | Endpoint prefix | Permission slug | Phạm vi |
|---|---|---|---|
| FundPeriod | `/api/v1/fund-periods` | `fund_period` | Full CRUD + translations |
| PlayingSchedule | `/api/v1/playing-schedules` | `playing_schedule` | Full CRUD + translations |
| ExchangeSession | `/api/v1/exchange-sessions` | `exchange_session` | Full CRUD + translations |
| ExchangeSessionPlayer | `/api/v1/exchange-sessions/{sessionId}/players` | `exchange_session` | Sub-resource CRUD |
| MemberPaymentCode | `/api/v1/monthly-contributions/{contributionId}/payment-code` | `member_payment_code` | Read-only + generate |
| Transaction | `/api/v1/transactions` | `transaction` | (đã có index) |
| BankAccount | `/api/v1/bank-accounts` | `bank_account` | (đã có, đang hoạt động) |
| WebhookConfig | `/api/v1/webhook-configs` | `webhook_config` | (đã có, đang hoạt động) |

## 7. Ghi chú

- Transaction luôn được tạo **trước** khi matching payment code.
- MonthlyContribution lưu `amount` thực tế (theo giới tính của thành viên trong FundPeriod).
- PlayingSchedule là **mẫu**, ExchangeSession là dữ liệu thực tế.
- `playing_schedule_id` nullable để hỗ trợ tạo ExchangeSession thủ công.
- `period_id` thay cho `year`/`month` trong MonthlyContribution (FK tới fund_periods).
- `court_name` / `court_address` lưu trực tiếp trên ExchangeSession để có thể chỉnh riêng từng buổi.
- MemberPaymentCode do hệ thống sinh, không có endpoint tạo/sửa thủ công qua API.
