# Add-module: Tích hợp Notification + Realtime cho nghiệp vụ mới

> Hướng dẫn sử dụng cho dev khi cần phát thông báo từ một domain khác (webhook, contribution,
> exchange session...). Gồm: quy trình tích hợp, phương thức `NotificationService`, cách hoạt động
> của realtime (Reverb) và các quy ước bắt buộc.

## 0. Nguyên tắc quan trọng (đọc trước khi code)

1. **Domain sở hữu nghiệp vụ quyết định lúc nào gửi và dùng type nào.** `NotificationService`
   chỉ lưu bản ghi và dispatch event — không chứa business rule của domain khác.
2. **Không bao giờ gọi `NotificationController` từ service khác.** Chỉ inject
   `NotificationService` và gọi `send()`.
3. **Mọi notification phải đi qua `NotificationService::send()`** — đó là cửa duy nhất để có
   realtime. Gọi `Notification::create()` trực tiếp sẽ không phát event Reverb.
4. **Gọi `send()` trong cùng DB transaction của nghiệp vụ** khi muốn notification rollback
   cùng nghiệp vụ (pattern hiện tại của `fund_due`, `monthly_contribution_*`).
   Event `NotificationCreated` implement `ShouldDispatchAfterCommit` nên chỉ phát sau khi
   commit — rollback thì client không bao giờ nhận event.
5. **Database chỉ lưu `type` + `data`** (payload động). Câu chữ đặt trong file `lang`, render
   theo `Accept-Language` lúc trả API; realtime gửi `title_key`/`body_key` + `data` để frontend
   tự dịch.
6. **Mỗi `type` phải có contract `data` rõ ràng** và được ghi vào bảng type ở
   `notification-overview.md` §9. Không đặt HTML hay URL tuyệt đối trong `data`.

## 1. Checklist tích hợp (5 bước)

### Bước 1 — Định nghĩa type và contract `data`

Chọn tên type dạng `snake_case`, đặt tên theo **sự kiện nghiệp vụ** (không theo người nhận).
Ví dụ:

```text
transaction_confirmed        → người dùng xác nhận thanh toán thành công
club_transaction_received    → quản trị CLB nhận tiền vào quỹ
```

Contract data ví dụ:

```text
transaction_confirmed:
  transaction_id, contribution_id, month, year, amount, reference_code, club_name

club_transaction_received:
  transaction_id, contribution_id, member_name, month, year, amount, reference_code, club_name
```

### Bước 2 — Thêm nội dung lang cho 2 locale

`lang/vi/domains/notification.php`:

```php
'types' => [
    // ... các type hiện có
    'transaction_confirmed' => [
        'title' => 'Thanh toán quỹ tháng :month/:year thành công',
        'body' => 'Khoản :amount của bạn tại CLB :club_name đã được xác nhận.',
    ],
    'club_transaction_received' => [
        'title' => 'CLB :club_name nhận khoản thu :amount',
        'body' => ':member_name đã đóng quỹ tháng :month/:year qua ngân hàng.',
    ],
],
```

`lang/en/domains/notification.php`: tương tự bằng tiếng Anh.

Placeholder `:tên_biến` phải khớp key trong `data`.

### Bước 3 — Inject `NotificationService` vào service nghiệp vụ

```php
use App\Domains\Notification\Services\NotificationService;

public function __construct(
    // ... dependencies hiện có
    protected NotificationService $notificationService,
) {}
```

### Bước 4 — Gọi `send()` tại đúng thời điểm nghiệp vụ

Gửi trong cùng DB transaction, ngay sau khi bản ghi nghiệp vụ được ghi:

```php
$this->notificationService->send(
    userId: (int) $contribution->user_id,
    type: 'transaction_confirmed',
    data: [
        'transaction_id' => (int) $transaction->id,
        'contribution_id' => (int) $contribution->id,
        'month' => (int) $period->month,
        'year' => (int) $period->year,
        'amount' => (float) $transaction->amount,
        'reference_code' => $transaction->reference_code,
        'club_name' => $clubName,
    ],
    clubId: (int) $contribution->club_id,
);
```

### Bước 5 — Realtime: KHÔNG cần làm gì thêm

`send()` tự dispatch `NotificationCreated`. Miễn là:

- `BROADCAST_CONNECTION=reverb`,
- queue worker `php artisan queue:work` đang chạy,
- Reverb server `php artisan reverb:start` đang chạy,

thì frontend subscribe `private-user.{userId}` và listen `.notification.created` sẽ nhận ngay.
Chi tiết vận hành xem `reverb-overview.md`.

### Bước 6 — Ghi nhận contract vào docs

Bổ sung type mới vào bảng §9 của `notification-overview.md` để frontend biết payload.

## 2. Gửi cho nhiều người (fan-out, ví dụ: tất cả quản trị CLB)

Không gọi HTTP endpoint nội bộ. Gọi thẳng **repository/service** để lấy danh sách user:

```php
// Lấy user_id các quản trị CLB (member có role active chứa permission
// update trên module "club") — dùng lại đúng logic của GET /members/getClubAdministrators
$adminUserIds = $this->clubMemberRepository
    ->getClubAdministrators($clubId)
    ->pluck('user_id')
    ->unique()
    ->values();

foreach ($adminUserIds as $adminUserId) {
    $this->notificationService->send(
        userId: (int) $adminUserId,
        type: 'club_transaction_received',
        data: [/* ... */],
        clubId: (int) $clubId,
    );
}
```

Lưu ý fan-out:

- Mỗi người nhận 1 dòng `notifications` riêng (bảng không có khái niệm broadcast row).
- Nếu người nhận có thể trùng nhau (vd. member vừa đóng quỹ cũng là quản trị), quyết định
  dedupe theo type: người đóng vẫn nhận `transaction_confirmed`, quản trị nhận
  `club_transaction_received` — 2 type khác语义 nên nên gửi cả hai; chỉ skip nếu cùng type.
- Với CLB ~20 người, loop đồng bộ trong transaction là đủ. Nếu sau này số người nhận lớn
  (hàng trăm), chuyển sang Job `CreateNotificationsJob` chạy queue, dispatch bằng
  `DB::afterCommit()`.

## 3. Các phương thức `NotificationService` — cách dùng và mục đích

File: `app/Domains/Notification/Services/NotificationService.php`

| Phương thức | Dùng để làm gì | Ai được gọi |
|---|---|---|
| `send(int $userId, string $type, array $data = [], ?int $clubId = null): Notification` | **Cửa vào duy nhất** để tạo notification từ domain khác. Lưu bản ghi + dispatch event realtime (`NotificationCreated`). Trả về model để caller dùng tiếp (vd. lấy id). | Service của domain sở hữu nghiệp vụ |
| `paginate(array $filters = []): LengthAwarePaginator` | Danh sách notification của user đang đăng nhập, filter `is_read`, `type`, `club_id`, phân trang. Chỉ dùng nội bộ controller `GET /notifications`. | NotificationController |
| `unreadCount(int $userId): int` | Đếm notification chưa đọc (`read_at IS NULL`) của 1 user — phục vụ badge. `GET /notifications/unread-count`. | NotificationController (hoặc dashboard cần đếm nhanh) |
| `markRead(int $id, int $userId): void` | Đánh dấu 1 notification đã đọc. Throw 404 nếu notification không thuộc user → không đọc hộ được người khác. | NotificationController |
| `markAllRead(int $userId): int` | Đánh dấu tất cả chưa đọc của user là đã đọc, trả số dòng cập nhật. | NotificationController |
| `deleteOwned(int $id, int $userId): void` | Soft delete 1 notification khỏi hộp thư của user (kiểm tra ownership, 404 nếu không phải của user). | NotificationController |

Quy ước:

- Các method `paginate/unreadCount/markRead/markAllRead/deleteOwned` phục vụ API HTTP của
  chính module Notification — domain khác **không gọi** các method này.
- Domain khác chỉ cần nhớ một method: **`send()`**.

## 4. Cơ chế realtime (tóm tắt — chi tiết ở `reverb-overview.md`)

```text
Domain service gọi NotificationService::send()
  → insert row notifications (trong DB transaction của nghiệp vụ)
  → NotificationCreated::dispatch() — ShouldDispatchAfterCommit
  → DB commit thành công
  → queue worker xử lý broadcast job
  → Reverb phát event "notification.created" trên private-user.{userId}
  → frontend Echo cập nhật badge + prepend danh sách
```

Payload realtime (từ `NotificationCreated::broadcastWith()`):

```json
{
  "notification": {
    "id": 101,
    "club": { "id": 1, "name": "..." },
    "type": "transaction_confirmed",
    "title_key": "notifications.types.transaction_confirmed.title",
    "body_key": "notifications.types.transaction_confirmed.body",
    "data": { "...": "..." },
    "is_read": false,
    "read_at": null,
    "created_at": "2026-08-20T10:00:00+07:00"
  },
  "unread_count": 4
}
```

Frontend không nhận câu văn sẵn — tự render từ `title_key`/`body_key` + `data` theo locale
đang chọn, giữ nhất quán với API list (API trả `title`/`body` đã dịch backend).

Endpoint HTTP của module:

| Method | Path | Mục đích |
|---|---|---|
| GET | `/api/v1/notifications` | Danh sách (filter `is_read`, `type`, `club_id`, `page`, `limit`) |
| GET | `/api/v1/notifications/unread-count` | Số chưa đọc |
| POST | `/api/v1/notifications/{id}/read` | Đánh dấu đã đọc |
| POST | `/api/v1/notifications/read-all` | Đánh dấu tất cả đã đọc |
| DELETE | `/api/v1/notifications/{id}` | Xóa khỏi hộp thư |

Tất cả đều yêu cầu `auth.jwt` và chỉ thao tác trên notification của user đang đăng nhập.

## 5. Ví dụ hoàn chỉnh: webhook SePay → member + quản trị CLB

Luồng mục tiêu:

```text
Member chuyển khoản (nội dung có payment code)
  → SePay gọi webhook
  → SePayWebhookService::handleWebhook()
       → TransactionService::createTransaction()          (Transaction + balance, row lock)
       → PaymentMatchingService::matchAndSettle()
            ├─ settle contribution → status=paid, paid_by=bank
            ├─ NotificationService::send('transaction_confirmed', member)      ← member
            └─ foreach quản trị CLB:
                 NotificationService::send('club_transaction_received', admin) ← admins
       → commit DB transaction
  → queue worker → Reverb phát notification.created trên private-user.{id} của từng người
  → member thấy "thanh toán thành công", admins thấy "CLB nhận khoản thu"
```

Điểm cần lưu ý khi code:

1. Lấy danh sách quản trị bằng `ClubMemberRepository::getClubAdministrators($clubId)` —
   đúng logic permission với endpoint `GET /members/getClubAdministrators` (role active có
   permission `update` trên module `club`). Webhook không có request context nên không dùng
   được middleware `club_slug`; `club_id` lấy từ `$transaction->club_id`.
2. Gọi cả hai `send()` bên trong `DB::transaction` của `matchAndSettle()` — fail thì rollback
   sạch, event không phát (after-commit).
3. `club_name` cần cho placeholder lang: lấy qua relation translation của club
   (xem cách `NotificationCreated::broadcastWith()` đọc `club.translation.name`).

## 6. Luồng thanh toán CASH (tiền mặt) — admin ghi nhận

Hiện trạng: `MonthlyContributionService::create()` / `update()` với
`status=paid, paid_by=cash` → `syncPayment()` → `ClubFundService::recordTransaction()`
(source=cash, income) → contribution gắn `transaction_id`. Hiện chỉ gửi
`monthly_contribution_created/updated` cho member — **thiếu** thông báo "đã đóng tiền mặt
thành công" cho member và thông báo thu cho các quản trị CLB.

### 6.1. Cấu trúc xử lý

```text
[Admin] POST /monthly-contributions (status=paid, paid_by=cash)
   hoặc PATCH /monthly-contributions/{id} (chuyển sang paid, paid_by=cash)
  → MonthlyContributionService::create()/update()   (DB transaction)
       → syncPayment() → recordTransaction(source=cash)  → Transaction + balance
       → gửi notification THEO THỨ TỰ:
            1. send('cash_payment_confirmed', userId: member)         ← người đóng
            2. send('club_transaction_received', userId: từng admin)  ← quản trị CLB
  → commit → queue → Reverb phát notification.created trên private-user.{id} từng người
```

### 6.2. Từng bước — làm gì, lấy gì, để làm gì

| Bước | Làm gì | Lấy gì từ đâu | Để làm gì |
|---|---|---|---|
| 1 | Inject `NotificationService` + `ClubMemberRepository` vào `MonthlyContributionService` | — | Có công cụ gửi thông báo và lấy danh sách quản trị |
| 2 | Thêm điều kiện phát: request vừa chuyển contribution sang `paid` với `paid_by=cash`. Với update dùng `$oldStatus !== paid` (biến đã có sẵn trong `update()`); với create là `status=paid && paid_by=cash` ngay từ request | `oldStatus`, `$contribution->status`, `paid_by` | Chỉ báo khi **mới thanh toán**, không báo lại khi admin chỉ sửa amount/payment_date (nhánh đó đã có `monthly_contribution_updated`) |
| 3 | Gửi cho member type `cash_payment_confirmed` | `contribution` (id, user_id, amount), `period` (month, year), `transaction` (id, transaction_date), club name (translation), tên admin xác nhận (user hiện tại qua auth) | Member biết tiền mặt đã được ghi nhận, có `transaction_id`/`contribution_id` để frontend điều hướng |
| 4 | Lấy danh sách quản trị | `ClubMemberRepository::getClubAdministrators($contribution->club_id)` → `pluck('user_id')` | Xác định người nhận thông báo thu — đúng logic permission với endpoint `getClubAdministrators` |
| 5 | Gửi cho từng quản trị type `club_transaction_received` (data thêm `paid_by: 'cash'`, `member_name`, `confirmed_by`) | Danh sách user_id bước 4 + payload như bước 3 + `member_name` từ `$contribution->user->fullname` | Admin khác biết quỹ vừa thu tiền mặt (dashboard/đối soát) |
| 6 | Không làm gì thêm cho realtime | — | `send()` tự dispatch event after-commit; commit xong queue → Reverb phát lên từng `private-user.{id}` |

### 6.3. Type và data contract mới

```text
cash_payment_confirmed (gửi cho member):
  transaction_id, contribution_id, period_id, month, year, amount,
  paid_by: 'cash', confirmed_by (tên admin), club_name

club_transaction_received (gửi cho quản trị — dùng chung cho bank + cash):
  transaction_id, contribution_id, member_name, month, year, amount,
  paid_by ('bank'|'cash'), reference_code (null với cash),
  confirmed_by (admin | 'system' khi webhook), club_name
```

Lang `vi`/`en` thêm tương ứng (xem bước 2 của checklist). Placeholder `:confirmed_by`,
`:member_name`, `:paid_by` phải có trong file lang.

### 6.4. Ghi chú

- Member đồng thời là quản trị sẽ nhận cả 2 type (khác ngữ cảnh) — chấp nhận, chỉ dedupe
  nếu trùng type + trùng user.
- Với luồng **bank webhook** (đã thiết kế ở §5): member nhận `transaction_confirmed`, admin
  nhận `club_transaction_received` với `paid_by: 'bank'`, `confirmed_by: 'system'` — cùng
  contract §6.3.
- Gọi `send()` trong cùng DB transaction của `create()`/`update()` — fail thì rollback cả
  contribution + transaction + notification.

## 7. Luồng tương lai: user YÊU CẦU thanh toán tiền mặt (module chưa có)

Mục tiêu: member bấm "thanh toán tiền mặt" → gửi thông báo đến toàn bộ quản trị → 1 admin
xác nhận → thông báo cho các quản trị còn lại + member đó.

### 7.1. Quyết định cốt lõi: LUÔN TẠO BẢN GHI MỚI, KHÔNG UPDATE NOTIFICATION CŨ

Notification là **nhật ký sự kiện bất biến (append-only)**. Mỗi chuyển đổi trạng thái nghiệp vụ
phát một notification mới. Lý do:

1. Nhiều người nhận — mỗi người một dòng riêng. "Update bản ghi cũ" không xác định được update
   dòng của ai trong N admin.
2. Người đã đọc sẽ thấy lịch sử bị sửa; mất giá trị audit (ai được báo gì, lúc nào).
3. Realtime chỉ có event `notification.created` — không tồn tại event "notification updated";
   muốn update phải thêm event mới + frontend merge, phức tạp hóa không đáng.
4. State thật của request phải sống ở **domain model**, không ở notification (frontend đối chiếu
   trạng thái hiện tại qua API contribution, không tin notification cũ).

**Trường hợp duy nhất được update bản ghi notification cũ:** `read_at` (đánh dấu đã đọc) và
soft delete (xóa khỏi hộp thư). Không bao giờ update `type`, `data`, `user_id`.

### 7.2. Vòng đời request + notification tương ứng

```text
[Member] bấm "thanh toán tiền mặt"
  → tạo REQUEST (xem 7.3)
  → send('cash_payment_requested', từng quản trị CLB)          ← BẢN GHI MỚI (1 dòng/admin)

[Admin A] xác nhận (hoặc từ chối)
  → contribution paid_by=cash + recordTransaction (luồng §6)
  → send('cash_payment_confirmed', member)                       ← BẢN GHI MỚI
  → send('club_transaction_received', từng quản trị)             ← BẢN GHI MỚI
      (admin A cũng nhận — frontend hiển thị "bạn đã xác nhận" theo confirmed_by)

Trường hợp từ chối:
  → send('cash_payment_rejected', member)                        ← BẢN GHI MỚI
  → send('cash_payment_request_resolved', từng quản trị)         ← BẢN GHI MỚI (tùy chọn)
```

Các notification `cash_payment_requested` cũ **giữ nguyên**, không sửa, không xóa. Frontend
biết request đã xử lý bằng cách đọc trạng thái contribution qua API (hoặc dựa vào
`data.request_id` → GET contribution hiện tại), không dựa vào notification cũ.

### 7.3. Nơi lưu trạng thái request (chưa chốt — 2 phương án)

| Phương án | Cách làm | Khi nào phù hợp |
|---|---|---|
| A (đề xuất, nhẹ) | Tận dụng `MonthlyContribution`: request = contribution `status=pending` + cột mới `cash_requested_at timestamp nullable`. Admin xác nhận → chuyển `paid, paid_by=cash` (luồng §6). | Member chỉ yêu cầu khi đã có contribution (kỳ quỹ đã sinh), lifecycle đơn giản |
| B | Bảng mới `payment_requests` (id, club_id, user_id, period_id, amount, status requested/confirmed/rejected, handled_by, handled_at) | Cần member yêu cầu cả khi chưa có contribution, cần lưu amount đề xuất, nhiều loại request sau này |

**Điểm cần chốt trước khi làm module này**: chọn A hay B. Với hiện trạng "kỳ quỹ sinh
contribution cho toàn member approved" thì A đủ dùng.

### 7.4. Type contract cho module tương lai

```text
cash_payment_requested (gửi quản trị):
  request_id (contribution_id nếu phương án A), member_name, month, year,
  amount, club_name

cash_payment_rejected (gửi member):
  request_id, month, year, amount, rejected_by, reason (nếu có), club_name
```

`cash_payment_confirmed` và `club_transaction_received` dùng lại contract §6.3.

## 8. Lỗi thường gặp khi tích hợp

| Hiện tượng | Nguyên nhân |
|---|---|
| Có bản ghi trong DB nhưng không có event realtime | Queue worker chưa chạy, hoặc `BROADCAST_CONNECTION` != `reverb` |
| Event phát ra nhưng nội dung sai | Thiếu key trong `data` so với placeholder lang (`:amount`...) |
| Client không nhận được event | Subscribe sai channel (`private-user.{id}`), thiếu dấu chấm `.notification.created`, hoặc JWT hết hạn ở `/api/broadcasting/auth` |
| Notification tạo ra nhưng nghiệp vụ đã rollback | Gọi `send()` ngoài DB transaction của nghiệp vụ, hoặc tách transaction riêng |
| Notification "báo oán" cho giao dịch chưa commit | Không xảy ra nếu đi qua `send()` — event after-commit; xảy ra nếu tự `Notification::create()` + broadcast tay |
