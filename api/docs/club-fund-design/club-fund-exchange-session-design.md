# Thiết kế buổi đánh & Giao lưu — Quyết định & Plan

> Phụ lục của `club-fund-design-overview.md`. Giải quyết các câu đau đầu:
> (1) giao lưu thanh toán gọn, (2) cron update khi sửa schedule, (3) nguồn đơn giá
> giao lưu, (4) tiền sân thu kiểu nào.

## 0. Nguyên tắc cốt lõi (đã chốt cùng CLB)

- Đây là **hệ thống thống kê quỹ**, không phải hệ thống bán vé sân.
- 1 CLB có 20 người, 10 đóng quỹ → **không quan tâm** member đó hôm nay có đi hay
  không, cũng **không thu tiền sân** riêng cho member (quỹ tháng đã bao trùm).
- Chỉ **quan tâm tổng số người giao lưu** (không đóng quỹ) đi hôm đó, theo nam/nữ,
  để tính tổng **thu** từ giao lưu.
- **Mô hình giao lưu:** mỗi dòng `exchange_session_players` = 1 **nhóm giao lưu** do
  1 member (`user_id`) mang đến, hoặc người lạ (`user_id=NULL`, `group_name` = JSON
  mảng tên). Cột `male`/`female` = **số lượng** nam/nữ trong nhóm. `amount` tự tính =
  `male × exchange_male_amount + female × exchange_female_amount`. Member đóng quỹ
  đi đánh KHÔNG tạo dòng ở đây (quỹ tháng đã bao trùm).
- Giao lưu **không dùng webhook / payment code**. Đối soát `paid` = 2 cách:
  (a) admin **gắn `transaction_id` tay** → service tự set `paid=1` + có audit trail;
  (b) admin **toggle `paid` tay** (khi thấy tiền vào tài khoản). Không auto-match.
  Webhook + payment code **chỉ** dành cho quỹ tháng (MonthlyContribution).
- **Chi tiền sân** = Transaction `type=expense` do **webhook SePay** tạo
  (`transferType=out`). Admin **chỉ được sửa `description`** (lý do chi) — không
  sửa amount/date/type/source (bảo toàn dữ liệu ngân hàng).
- Module Transactions không cho tạo/xóa trực tiếp. Transaction phát sinh phải do service của nghiệp
  vụ sở hữu tạo nội bộ để tránh sửa số tiền ngoài luồng và hạn chế rò rỉ dữ liệu tài chính.
- **Thu giao lưu** (tuỳ chọn) = Transaction `type=income` do ExchangeSessionPlayerService tạo nội bộ
  (`source=manual|cash`), gắn vào `exchange_session_players.transaction_id` để đối soát.

## 1. Sơ đồ luồng (buổi đánh + giao lưu + chi sân)

```text
[Admin]  tạo PlayingSchedule (mẫu: weekday, court, giờ, auto_generate, weeks_ahead)
   │  └── auto_generate=true + active → sinh ExchangeSession ngay trong request tạo
   ▼
[System] mốc = đầu tháng FundPeriod active mới nhất; sinh đúng weeks_ahead buổi
   │     start_date/end_date (nếu có) vẫn giới hạn khoảng sinh
   ▼
[Cron]   hàng ngày 00:05 → exchange-sessions:generate (chạy bù/idempotent)
   │     └── complete session upcoming + active có ngày/giờ kết thúc đã qua
   │     └── sinh tiếp cho đến khi đủ weeks_ahead session upcoming
   ▼
[Admin]  SỬA PlayingSchedule (giờ/sân)
   │  └─▶ CASCADE: đồng bộ court/giờ cho mọi ExchangeSession upcoming + scheduled
   │        của schedule đó (KHÔNG đè completed/cancelled). Có command chạy tay.
   ▼
[Admin]  thêm nhóm giao lưu (exchange_session_players):
   │        - user_id (member) | group_name (tên người lạ, nhóm)
   │        - male / female (số lượng nam/nữ trong nhóm)
   │        - amount tự tính = male×exchange_male_amount + female×exchange_female_amount
   ▼
[Admin]  PATCH /complete — chốt buổi:
   │  - tìm FundPeriod của tháng session_date → nếu thiếu → 422
   │  - snapshot exchange_male_amount/exchange_female_amount lên session
   │  - recompute amount mỗi nhóm giao lưu theo rates
   │  - player_count = sum(male+female), total_amount = sum(amount)
   │  - status=completed
   ▼
[Chi sân]  SePay webhook transferType=out → Transaction type=expense, source=webhook
   │  └─▶ admin PATCH /transactions/{id} sửa description (lý do chi) — chỉ description
   ▼
[Thu giao lưu]  ExchangeSessionPlayerService tạo income manual/cash nội bộ
   │  └─▶ service gắn transaction_id → paid=1 (hoặc toggle-paid tay)
```

## 2. Schema (đã code)

### `exchange_sessions` — thêm cột snapshot đơn giá

```text
exchange_male_amount   decimal(15,2) default 0   -- snapshot đơn giá nam từ FundPeriod khi chốt
exchange_female_amount decimal(15,2) default 0   -- snapshot đơn giá nữ từ FundPeriod khi chốt
```

### `exchange_session_players` — nhóm giao lưu

```text
user_id        nullable FK users         -- member mang nhóm đến; NULL = người lạ
group_name    JSON nullable             -- mảng tên người lạ (vd. ["Khách A","Khách B"])
male           smallint default 0        -- số nam trong nhóm
female         smallint default 0        -- số nữ trong nhóm
transaction_id nullable FK transactions  -- admin gắn tay → paid=1
amount         decimal(15,2)             -- tự tính = male×rate + female×rate
paid           boolean
checked_in     boolean
```

> Không có cột `gender` (enum) — sai ý, đã bỏ. `group_name` là JSON (cast `array`).

### `transactions` — không thêm cột mới

Chi sân = expense qua webhook, admin chỉ sửa `description`. Thu giao lưu = income manual/cash do
ExchangeSessionPlayerService tạo nội bộ, sau đó gắn vào `exchange_session_players.transaction_id`.

### `club_funds` — số dư quỹ do hệ thống tự quản lý

```text
club_id  unique FK clubs
balance  decimal(15,2) default 0
```

- Income: `balance += transaction.amount`; expense: `balance -= transaction.amount`.
- Cập nhật balance và tạo Transaction trong cùng database transaction, có row lock.
- Migration backfill số dư các CLB cũ bằng tổng thu trừ tổng chi.
- `transactions.balance` là snapshot tương thích; không phụ thuộc `payload.accumulated`.

## 3. Quyết định từng câu hỏi

### Câu 2 — Cron update khi sửa schedule ✅
Sửa PlayingSchedule (giờ/sân) → cascade đồng bộ `court_name/court_address/start_time/end_time`
cho mọi session `type=scheduled, status=upcoming`. Không đè `completed`/`cancelled`.
Đổi `weekday` KHÔNG tự dời `session_date` session cũ (an toàn). Có command
`exchange-sessions:sync {--schedule-id=}` chạy tay.

### Bổ sung — Sinh lịch ngay và lấy mốc từ kỳ quỹ ✅
Tạo PlayingSchedule có `auto_generate=true` và `is_active=true` sẽ gọi generator ngay. Generator lấy
ngày đầu tháng của FundPeriod active mới nhất thuộc CLB làm mốc thay vì `today`, rồi sinh đúng
`weeks_ahead` ngày khớp `weekday`. Nếu không có FundPeriod thì fallback về `today`.

Cron generate còn gọi `completeExpiredUpcoming()`. Mỗi session quá hạn dùng lại nghiệp vụ
`ExchangeSessionService::complete()` để snapshot rates và tính totals. Xử lý độc lập từng session;
thiếu FundPeriod hoặc lỗi khác sẽ tăng bộ đếm lỗi + ghi warning, không rollback cả cron.

Cron chạy complete trước generate. Session `completed`/`cancelled` là lịch sử và không chiếm quota
`weeks_ahead`; vì vậy cửa sổ lịch tự cuốn sang tuần kế tiếp sau mỗi buổi hoàn thành.

### Câu 3 — Nguồn đơn giá giao lưu ✅
Lấy từ `fund_periods.exchange_male_amount/exchange_female_amount` → **snapshot** lên
`exchange_sessions` khi `complete`. Tính `amount` mỗi nhóm = `male×rate + female×rate`.
KHÔNG webhook cho giao lưu.

### Câu 4 — Tiền sân thu kiểu gì ✅
- Quỹ tháng bao trùm member → không thu thêm tiền sân cho member.
- Chi sân = Transaction `type=expense` qua **webhook SePay** (`transferType=out`).
  Admin **chỉ sửa `description`** (lý do chi) — không sửa amount/date/type/source.
- Thu giao lưu = Transaction `type=income` manual/cash do nghiệp vụ giao lưu tạo nội bộ, gắn vào
  `exchange_session_players.transaction_id` → tự set `paid=1`.
- Đối soát `paid` giao lưu: (a) gắn `transaction_id` tay [có audit trail]; (b) toggle tay.

## 4. Edge cases đã xử lý

1. Chốt buổi khi chưa có FundPeriod cho tháng `session_date` → 422.
2. Chốt buổi đã `completed`/`cancelled` → 422 "buổi đã chốt".
3. Sync schedule đè session `completed`/`cancelled` → skip (where clause chặn).
4. Nhóm giao lưu thiếu cả `user_id` lẫn `group_name` → 422.
5. Nhóm giao lưu `male + female = 0` → 422.
6. Edit player đổi `male`/`female` mà không gửi `amount` → tự tính lại từ rates.
7. Gắn `transaction_id` khác → tự set `paid=true`. Toggle paid=false → clear `transaction_id`.
8. Gọi API tạo/xóa Transaction trực tiếp → route không tồn tại; Transaction do nghiệp vụ sở hữu.
9. Sửa Transaction field ngoài `description` → rule filter, chỉ description được lưu.
10. `applySearch` Transaction cũ reference cột `title` không tồn tại → đã fix.
11. `UpdateExchangeSessionRequest` typo `'somtimes'` → đã fix `'sometimes'`.
12. `ExchangeSessionPlayerService::paginate/create/update/delete` xung đột signature
    với `BaseService` (PHP 8.3 strict) → đổi tên `*ForSession`/`*FromSession`.

## 5. Tồn đọng (ngoài scope)

- Báo cáo quỹ (tổng thu giao lưu / tổng chi sân / dư tháng).
- Validate `male`/`female` ≤ member đóng quỹ (KHÔNG validate — chỉ số liệu thống kê).
