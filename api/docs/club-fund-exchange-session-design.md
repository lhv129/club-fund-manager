# Thiết kế buổi đánh & Giao lưu — Quyết định & Plan

> Phụ lục của `club-fund-design-overview.md`. Chỉ giải quyết các câu còn đau đầu:
> (1) giao lưu thanh toán gọn, (2) cron update khi sửa schedule, (3) nguồn đơn giá
> giao lưu, (4) tiền sân thu kiểu nào.
>
> Trạng thái: ✅ đã chốt hướng · 🟡 đã chốt hướng, chưa code · ⬜ tồn đọng.

## 0. Nguyên tắc cốt lõi (đã chốt cùng CLB)

- Đây là **hệ thống thống kê quỹ**, không phải hệ thống bán vé sân.
- 1 CLB có 20 người, 10 đóng quỹ → **không quan tâm** member đó hôm nay có đi hay
  không, cũng **không thu tiền sân** riêng cho member (quỹ tháng đã bao trùm).
- Chỉ **quan tâm tổng số người giao lưu** (không đóng quỹ) đi hôm đó, theo nam/nữ,
  để tính tổng **thu** từ giao lưu → bù đắp **chi** tiền sân.
- **Không theo dõi từng người chơi** ở mức thu tiền — chỉ cần tổng số nam/nữ.
- Giao lưu **không dùng webhook / payment code** → admin chốt tổng, tạo Transaction
  `cash`/`manual` gắn vào buổi. Webhook + payment code **chỉ** dành cho quỹ tháng
  (MonthlyContribution), luồng đã chạy OK, không đụng.

## 1. Sơ đồ luồng mới (buổi đánh + giao lưu)

```text
[Admin]  tạo PlayingSchedule (mẫu: weekday, court, giờ, auto_generate, weeks_ahead)
   │
   ▼
[Cron]   hàng ngày 00:05 → exchange-sessions:generate
   │     sinh ExchangeSession (8 tuần tới) — type=scheduled, status=upcoming
   │     snapshot court/giờ TẠI THỜI ĐIỂM TẠO từ schedule
   ▼
[Admin]  SỬA PlayingSchedule (giờ/sân/weekday/weeks_ahead)
   │  └─▶ CASCADE: đồng bộ court/giờ cho MỌI ExchangeSession upcoming
   │        (chưa completed/cancelled) của schedule đó
   │        — không đè session đã completed/cancelled
   │        — chạy tự động khi update schedule + có command chạy tay
   ▼
[Admin]  chốt buổi (status=completed):
   │  - nhập male_count / female_count (member đóng quỹ đi đánh) — chỉ thống kê
   │  - nhập exchange_male_count / exchange_female_count (giao lưu, không đóng quỹ)
   │  - đơn giá lấy từ FundPeriod của tháng đó:
   │      exchange_male_amount   / exchange_female_amount  (snapshot lên session)
   │  - total_amount = exchange_male_count * exchange_male_amount
   │                  + exchange_female_count * exchange_female_amount
   │  - (tuỳ chọn) tạo Transaction source=cash|manual, type=income, gắn
   │      exchange_session.transaction_id → đối soát thu
   ▼
[Done]   Buổi hoàn thành, có thống kê: tổng người, tổng thu giao lưu.
```

> Không còn luồng "member đăng ký → ExchangeSessionPlayer → thanh toán từng người".
> Bảng `exchange_session_players` được **loại bỏ** khỏi luồng tiền (xem §4).

## 2. Quyết định từng câu hỏi

### Câu 2 — Cron update khi sửa schedule ✅ chốt hướng, 🟡 chưa code

**Vấn đề:** Sửa PlayingSchedule (giờ/sân/weekday/weeks_ahead) thì các bản ghi
ExchangeSession do cron sinh trước đó có cập nhật không?

**Quyết định:** **Cascade upcoming chưa completed.**

- Khi `PlayingScheduleService::update()` chạy → gọi thêm
  `ExchangeSessionGeneratorService::syncUpcomingForSchedule($schedule)`.
- `syncUpcomingForSchedule`: cập nhật `court_name`, `court_address`, `start_time`,
  `end_time` cho mọi session thuộc schedule, `status=upcoming`, `type=scheduled`.
- **Không** đè lên session `completed`/`cancelled` (đã chốt số liệu / đã huỷ).
- `weeks_ahead` / `weekday`: logic tạo session mới nằm ở cron `exchange-sessions:generate`
  (đã idempotent), không thuộc scope cascade update. Nếu đổi `weekday` → các session
  đã sinh theo weekday cũ giữ nguyên `session_date` (snapshot), admin có thể xoá tay
  hoặc chạy command tạo lại. **Lưu ý corner case:** đổi `weekday` không tự đổi ngày
  các session cũ — đây là lựa chọn an toàn (không tự ý dời ngày buổi đã lên lịch).
- Thêm command `exchange-sessions:sync {scheduleId?}` để admin chạy tay khi cần
  (vd. sửa hàng loạt schedule qua tinker/seeder).

**Lý do chọn cascade-upcoming:** session upcoming chưa có số liệu chốt, đè an toàn;
session completed đã có thống kê/thu tiền, không được đụng. Đây là điểm cân bằng giữa
"schedule là mẫu" và "session là dữ liệu thực tế từng buổi".

### Câu 3 — Nguồn đơn giá giao lưu + có cần webhook không ✅ chốt hướng, 🟡 chưa code

**Vấn đề:**
- `male_amount`/`female_amount` trên `exchange_sessions` hiện lấy sai nguồn.
- Giao lưu người lạ chỉ cần nhập số nam/nữ → tính tổng.
- Giao lưu bạn của member (user_id) chỉ cần tên / tổng số lượng.
- Chưa rõ có cần webhook cho giao lưu không.

**Quyết định:**

- **Nguồn đơn giá:** lấy từ `fund_periods.exchange_male_amount` /
  `exchange_female_amount` (KHÔNG có cột `male_amount`/`female_amount` trên
  `exchange_sessions` — current schema đúng rồi, chỉ là code đang nhầm).
- **Không cần webhook cho giao lưu.** Giao lưu là dòng thu "thống kê", admin chốt
  tổng số nam/nữ → hệ thống tự nhân đơn giá → `total_amount`. Có thu thực hay không
  admin tự tạo `Transaction` (`source=cash` hoặc `manual`, `type=income`) gắn vào
  `exchange_session.transaction_id`. Không sinh `MemberPaymentCode`, không match
  webhook. Webhook chỉ phục vụ quỹ tháng.
- **Bạn của member (user_id):** vì đã bỏ `exchange_session_players`, không còn khái
  niệm gắn `user_id` cho người giao lưu. Chỉ đếm `exchange_male_count` /
  `exchange_female_count`. Nếu muốn nhớ "đây là bạn của A", admin ghi vào
  `exchange_session_translations.note` (text tự do). Không cần cấu trúc.

### Câu 4 — Tiền sân thu kiểu nào ✅ chốt hướng, 🟡 chưa code

**Vấn đề:** Tiền sân thu kiểu gì? Có cần theo dõi từng người chơi không?

**Quyết định:**

- **Tiền sân chi phí thuê:** là **chi** (expense) từ quỹ — admin tạo `Transaction`
  `source=manual|cash`, `type=expense` ghi nhận chi tiền sân. (Tuỳ chọn, ngoài scope
  luồng exchange_session — chỉ là ghi sổ quỹ.)
- **Tiền thu từ giao lưu:** là **thu** (income) bù chi — `exchange_session.total_amount`
  = tổng giao lưu (nam × đơn giá nam + nữ × đơn giá nữ). Admin có thể tạo
  `Transaction` `type=income` gắn `exchange_session.transaction_id` để đối soát.
- **Hai nguồn thu/chi độc lập**, không khớng khái niệm "chia tiền sân từng người".
- **Không theo dõi từng người chơi.** Chỉ tổng nam/nữ. Member đóng quỹ đi đánh
  → không thu thêm (quỹ tháng bao trùm). Giao lưu → thu theo nam/nữ.

## 3. Thay đổi schema

### `exchange_sessions` — thêm cột count + đơn giá snapshot

```php
// migration mới (thêm cột)
$table->unsignedSmallInteger('male_count')->default(0);                 // member nam đi đánh (thống kê)
$table->unsignedSmallInteger('female_count')->default(0);              // member nữ đi đánh (thống kê)
$table->unsignedSmallInteger('exchange_male_count')->default(0);       // giao lưu nam
$table->unsignedSmallInteger('exchange_female_count')->default(0);     // giao lưu nữ
$table->decimal('exchange_male_amount', 15, 2)->default(0);            // snapshot đơn giá từ FundPeriod
$table->decimal('exchange_female_amount', 15, 2)->default(0);           // snapshot đơn giá từ FundPeriod
// existing: player_count, amount_per_player, total_amount — xem §5
```

> **Snapshot đơn giá:** lưu `exchange_male_amount`/`exchange_female_amount` trực tiếp
> lên session khi chốt, để sau này đổi giá trong FundPeriod không làm sai số liệu
> lịch sử. Giống logic `court_name` lưu trực tiếp trên session.

### `exchange_session_players` — bỏ khỏi luồng tiền

- **Không xoá migration** (tránh rollback đau). Nhưng:
  - Ngừng dùng model/repository/controller/resource `ExchangeSessionPlayer*`.
  - Bỏ route `/exchange-sessions/{id}/players` (hoặc keep tạm, đánh dấu deprecated).
  - Generator/service không ghi vào bảng này nữa.
- Lý do: thay bằng `male_count`/`female_count`/`exchange_*_count` trên session.
  Không cần check-in / paid từng người ở mức tiền.

## 4. Thay đổi code

| File | Việc | Trạng thái |
|---|---|---|
| `app/Domains/ExchangeSession/Services/ExchangeSessionGeneratorService.php` | Thêm `syncUpcomingForSchedule()` — cascade update court/giờ cho session upcoming | 🟡 |
| `app/Domains/PlayingSchedule/Services/PlayingScheduleService.php` | Trong `update()`, gọi `syncUpcomingForSchedule()` | 🟡 |
| `app/Console/Commands/` | Thêm `SyncExchangeSessionsCommand` (`exchange-sessions:sync {scheduleId?}`) | 🟡 |
| `app/Domains/ExchangeSession/Models/ExchangeSession.php` | Thêm fillable `*_count` + `exchange_*_amount`; thêm method `recalculateTotal()` | 🟡 |
| `app/Domains/ExchangeSession/Services/ExchangeSessionService.php` | Thêm `complete()` / `recalculateTotal()`: tìm FundPeriod của `session_date` → snapshot đơn giá → tính `total_amount` | 🟡 |
| `app/Domains/ExchangeSession/Requests/Store/UpdateExchangeSessionRequest.php` | Thêm rule cho `male_count`/`female_count`/`exchange_*_count`; bỏ `player_count`/`amount_per_player` khỏi input (xem §5) | 🟡 |
| `app/Domains/ExchangeSession/Controllers/ExchangeSessionController.php` | Thêm action `complete` (PATCH `/{id}/complete`) → chốt buổi | 🟡 |
| `app/Domains/ExchangeSession/Repositories/ExchangeSessionRepository.php` | Thêm `getUpcomingForSchedule()`, `snapshotExchangeRates()` | 🟡 |
| `app/Domains/ExchangeSession/Requests/Store/UpdateExchangeSessionPlayerRequest.php` + Controller + Resource + Repository + Model | **Deprecate** — không xoá file, ngừng dùng, bỏ route | 🟡 |
| Migration | Thêm cột count + `exchange_*_amount` vào `exchange_sessions` | 🟡 |

## 5. Vấn đề đã giải quyết vs tồn đọng

### ✅ Đã giải quyết (luồng đã chạy, không đụng)

- **Quỹ tháng:** FundPeriod → MonthlyContribution → MemberPaymentCode → Transaction.
- **Webhook SePay:** nhận tiền → tạo Transaction → `PaymentMatchingService` match
  payment code → settle MonthlyContribution. Đã có guard `contribution.status=pending`
  chống replay. (Xem `PaymentMatchingService.php`.)
- **Cron generate:** `exchange-sessions:generate` hàng ngày 00:05, idempotent
  (`existsForScheduleAndDate`), `withoutOverlapping`. Sinh 8 tuần tới.
- **BankAccount + WebhookConfig:** đang hoạt động.

### 🟡 Đã chốt hướng, chưa code (plan §4)

- Cascade update session upcoming khi sửa schedule.
- Nguồn đơn giá giao lưu = `fund_periods.exchange_*_amount` + snapshot lên session.
- Giao lưu chỉ nhập `exchange_male_count`/`exchange_female_count` → tự tính `total_amount`.
- Bỏ luồng `exchange_session_players` (giữ file, deprecate route).
- Tiền sân: chi = Transaction `type=expense`; thu giao lưu = Transaction `type=income`
  gắn `exchange_session.transaction_id`. Quỹ tháng bao trùm cho member, không chia từng người.
- Action `complete` để chốt buổi.

### ⬜ Tồn đọng — cần quyết định thêm khi code

1. **`player_count` / `amount_per_player` trên `exchange_sessions`:** giờ không còn
   "chia tiền sân từng người" → hai cột này có thể:
   - (a) giữ `player_count = male_count + female_count` để backwards-compatible thống kê,
        bỏ `amount_per_player` (set 0); hoặc
   - (b) giữ cả hai nhưng `amount_per_player = total_amount / exchange_total_count`.
   - **Đề xuất (a)** — `amount_per_player` không còn ý nghĩa khi giá nam/nữ khác nhau.
   - Cần bạn chốt khi bắt đầu code.

2. **Đổi `weekday` trên schedule:** cascade hiện chỉ đồng bộ court/giờ, **không** dời
   `session_date` của session cũ theo weekday mới. Nếu muốn dời → phải tự xoá session
   upcoming + chạy lại generate. **Đề xuất giữ nguyên** (an toàn, không tự dời lịch).
   Cần bạn xác nhận.

3. **Thống kê "tổng người đi đánh"**: `male_count`/`female_count` (member) chỉ là số
   liệu ghi nhận lúc chốt, không phục vụ thu tiền. Có cần validate không vượt quá tổng
   member đóng quỹ của CLB? **Đề xuất KHÔNG validate** — chỉ là số liệu admin nhập.

4. **Chi tiền sân (expense) có gắn `exchange_session_id` không?** Hiện `transactions`
   không có FK tới `exchange_sessions`. Nếu muốn đối soát chi phí sân từng buổi:
   - (a) thêm `exchange_session_id` nullable vào `transactions`; hoặc
   - (b) ghi `session_id` vào `description`/`reference_code`, không thêm FK.
   - **Đề xuất (a)** khi làm báo cáo quỹ. Cần bạn chốt.

5. **Báo cáo quỹ**: khi nào cần? (tổng thu giao lưu / tổng chi sân / quỹ dư tháng).
   Ngoài scope bản này — ghi nhận để làm sau.

## 6. Thứ tự triển khai đề xuất

1. Migration: thêm `*_count` + `exchange_*_amount` vào `exchange_sessions`.
2. Model + Repository: fillable, `recalculateTotal()`, `getUpcomingForSchedule()`.
3. Service: `complete()`, tìm FundPeriod theo `session_date`, snapshot đơn giá.
4. Controller + Request: action `complete`, rule count.
5. `syncUpcomingForSchedule()` + gọi trong `PlayingScheduleService::update()`.
6. Command `exchange-sessions:sync`.
7. Deprecate `ExchangeSessionPlayer*` + bỏ route.
8. Cập nhật `club-fund-design-overview.md` (§4 luồng buổi đánh + §5 demo data).
