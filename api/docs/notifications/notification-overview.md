# Thiết kế cơ bản module Notification đa ngôn ngữ

> Phạm vi tài liệu: thông báo trong ứng dụng (in-app notification), lưu trong database và trả qua API.
> Email, push notification và WebSocket có thể bổ sung sau, không phải yêu cầu của setup ban đầu.

## Trạng thái triển khai

Module in-app notification cơ bản đã được triển khai gồm:

```text
app/Domains/Notification/Controllers/NotificationController.php
app/Domains/Notification/Requests/FilterNotificationRequest.php
app/Domains/Notification/Services/NotificationService.php
app/Domains/Notification/Repositories/NotificationRepository.php
app/Domains/Notification/Models/Notification.php
app/Domains/Notification/Resources/NotificationResource.php
routes/api/v1/notification.php
lang/vi/domains/notification.php
lang/en/domains/notification.php
```

Migration điều chỉnh schema:

```text
database/migrations/2026_08_15_000000_adjust_notifications_for_in_app_i18n.php
```

Sự kiện đầu tiên đã tích hợp là `fund_due`, phát sinh tự động khi tạo kỳ quỹ.

## 1. Hiện trạng

Module hiện có:

```text
app/Domains/Notification/Model/Notification.php
database/migrations/2026_07_07_095107_create_notifications_table.php
```

Bảng `notifications` hiện tại có:

```text
id, club_id, user_id, type, data, is_read, read_at,
sort_order, is_active, created_at, updated_at, deleted_at
- mặc định sort_order:0 và is_active:true (sẽ không dùng sort_order và is_active ở notifications)
```

`type` xác định loại thông báo, ví dụ:

```text
club_invite
member_approved
fund_due
transaction_confirmed
exchange_session_created
```

`data` chứa dữ liệu động dùng để dựng nội dung:

```json
{
  "club_name": "Hanoi Badminton Club",
  "month": 8,
  "year": 2026,
  "amount": 200000,
  "contribution_id": 15
}
```

Hiện module chưa có Repository, Service, Controller, Resource, Request, route và file ngôn ngữ.

```text
app/Domains/Notification/Models/Notification.php
```

để đúng PSR-4 và thống nhất với các domain khác.

## 2. Có cần bảng `notification_translations` không?

### Kết luận cho giai đoạn cơ bản

**Không cần `notification_translations`.**

Thông báo là dữ liệu phát sinh theo từng người nhận. Nếu mỗi notification lại có hai hoặc nhiều dòng
translation, số bản ghi sẽ tăng nhanh và nội dung bị lặp. Với thông báo hệ thống có mẫu cố định, nên:

1. Database lưu `type` và `data`.
2. File `lang` lưu câu thông báo theo từng locale.
3. Backend render nội dung theo `Accept-Language` khi trả API.

Ví dụ:

```php
// lang/vi/domains/notification.php
return [
    'types' => [
        'fund_due' => [
            'title' => 'Nhắc đóng quỹ tháng :month/:year',
            'body' => 'Bạn cần đóng :amount cho câu lạc bộ :club_name.',
        ],
    ],
];
```

```php
// lang/en/domains/notification.php
return [
    'types' => [
        'fund_due' => [
            'title' => 'Fund payment reminder for :month/:year',
            'body' => 'You need to pay :amount to :club_name.',
        ],
    ],
];
```

API dùng key sau để render:

```php
$title = __("domains/notification.types.{$notification->type}.title", $params);
$body  = __("domains/notification.types.{$notification->type}.body", $params);
```

### Khi nào mới cần bảng template và translation?

Chỉ thêm khi admin được phép tự sửa nội dung thông báo trong giao diện mà không deploy code.
Khi đó không dùng `notification_translations` gắn vào từng notification, mà dùng hai bảng mẫu:

```text
notification_templates
  id, type, channel, is_active, timestamps

notification_template_translations
  id, notification_template_id, locale, title_template, body_template, timestamps
  UNIQUE(notification_template_id, locale)
```

Các bản ghi `notifications` vẫn chỉ lưu `type + data`. Đây là phạm vi mở rộng, chưa cần làm ở bản cơ bản.

## 3. Điều chỉnh schema đề xuất

Bảng hiện tại đủ làm nền tảng, nhưng nên điều chỉnh nhẹ:

```text
notifications
  id
  club_id          nullable, FK clubs
  user_id          FK users
  type             varchar(100)
  data             json nullable
  read_at          datetime nullable
  created_at
  updated_at
  deleted_at       tùy chọn
```

Đề xuất:

- Cho `club_id` nullable vì có thông báo cấp hệ thống không thuộc CLB.
- Dùng `read_at IS NULL` để xác định chưa đọc; `is_read` đang trùng ý nghĩa và có thể lệch với `read_at`.
- Chưa cần `sort_order`; danh sách mặc định sắp theo `created_at DESC`.
- Chưa cần `is_active`; notification là sự kiện đã phát sinh, không phải cấu hình bật/tắt.
- Giữ `data` là payload thuần, không lưu sẵn câu tiếng Việt hoặc tiếng Anh.
- Thêm index `user_id, read_at, created_at` phục vụ danh sách và đếm chưa đọc.
- Có thể giữ soft delete nếu sản phẩm cho phép người dùng xóa thông báo khỏi hộp thư.

Schema tối thiểu:

```php
Schema::create('notifications', function (Blueprint $table) {
    $table->id();
    $table->foreignId('club_id')->nullable()->constrained('clubs')->nullOnDelete();
    $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
    $table->string('type', 100);
    $table->json('data')->nullable();
    $table->timestamp('read_at')->nullable();
    $table->timestamps();
    $table->softDeletes();

    $table->index(['user_id', 'read_at', 'created_at']);
    $table->index(['club_id', 'user_id', 'created_at']);
});
```

Không sửa migration cũ nếu migration đã chạy ở môi trường dùng chung; tạo migration mới để alter bảng.

## 4. Locale của người dùng

Setup in-app cơ bản có thể render theo header `Accept-Language`; middleware `SetLocale` của dự án đã
phụ trách phần này. Vì vậy chưa bắt buộc thêm locale vào `users`.

Tuy nhiên, trước khi gửi email hoặc push notification chạy trong queue, request header không còn tồn tại.
Khi triển khai các channel đó, nên thêm:

```text
users.preferred_locale varchar(5) default 'vi'
```

Thứ tự chọn locale:

```text
Accept-Language của request
    → users.preferred_locale
    → config('app.fallback_locale')
```

## 5. Cấu trúc domain cơ bản

```text
app/Domains/Notification/
├── Controllers/NotificationController.php
├── Requests/FilterNotificationRequest.php
├── Services/NotificationService.php
├── Repositories/NotificationRepository.php
├── Models/Notification.php
└── Resources/NotificationResource.php

lang/vi/domains/notification.php
lang/en/domains/notification.php
routes/api/v1/notification.php
```

Trách nhiệm:

| Thành phần | Trách nhiệm |
|---|---|
| Repository | Query notification của user hiện tại, filter chưa đọc, phân trang, đếm chưa đọc |
| Service | Tạo notification, kiểm tra quyền sở hữu, đánh dấu đã đọc |
| Resource | Render `title` và `body` theo locale hiện tại |
| Controller | Validate request, gọi service, trả response chuẩn |

## 6. Response API đề xuất

```json
{
  "id": 25,
  "club": {
    "id": 1,
    "name": "Hanoi Badminton Club"
  },
  "type": "fund_due",
  "title": "Nhắc đóng quỹ tháng 8/2026",
  "body": "Bạn cần đóng 200.000 đ cho câu lạc bộ Hanoi Badminton Club.",
  "data": {
    "month": 8,
    "year": 2026,
    "amount": 200000,
    "contribution_id": 15
  },
  "is_read": false,
  "read_at": null,
  "created_at": "2026-08-15T10:00:00+07:00"
}
```

`is_read` có thể là field tính toán trong Resource:

```php
'is_read' => $this->read_at !== null,
```

Không nhất thiết phải lưu `is_read` trong database.

## 7. Endpoint cơ bản

Tất cả endpoint yêu cầu `auth.jwt` và chỉ thao tác notification của user đang đăng nhập.

| Method | Path | Mục đích |
|---|---|---|
| GET | `/api/v1/notifications` | Danh sách notification |
| GET | `/api/v1/notifications/unread-count` | Số notification chưa đọc |
| PATCH | `/api/v1/notifications/{id}/read` | Đánh dấu một notification đã đọc |
| PATCH | `/api/v1/notifications/read-all` | Đánh dấu tất cả đã đọc |
| DELETE | `/api/v1/notifications/{id}` | Xóa khỏi danh sách, nếu cần |

Filter ban đầu:

```text
is_read=0|1
type=fund_due
club_id=1
limit=15
page=1
```

Route tĩnh `/unread-count` và `/read-all` phải khai báo trước `/{id}`.

## 8. Luồng tạo notification

Domain sở hữu nghiệp vụ gọi `NotificationService`; không gọi Controller nội bộ.

### Khi tạo kỳ quỹ

Luồng thực tế:

```text
POST /api/v1/fund-periods
  → FundPeriodService tạo FundPeriod
  → MonthlyContributionService sinh contribution cho member approved + active
  → MonthlyContributionService xác định các contribution thực sự vừa tạo
  → gọi NotificationService::send() cho từng notification fund_due
  → commit toàn bộ database transaction
```

Mỗi notification nhận đúng `amount` của contribution tương ứng với giới tính thành viên. Các member
`pending`, `rejected`, `removed`, `banned`, inactive hoặc đã soft delete không nhận thông báo.

Nếu bất kỳ bước nào thất bại, transaction rollback cả kỳ quỹ, contribution và notification.

Quy ước ownership:

- `MonthlyContributionService` quyết định lúc nào gửi và dùng notification type nào.
- `NotificationService` chỉ lưu notification và dispatch event realtime.
- `NotificationService` không query hoặc chứa business rule của FundPeriod/MonthlyContribution.

Ví dụ sau khi sinh khoản đóng quỹ:

```php
$notificationService->send(
    userId: $contribution->user_id,
    clubId: $contribution->club_id,
    type: 'fund_due',
    data: [
        'month' => $period->month,
        'year' => $period->year,
        'amount' => $contribution->amount,
        'club_name' => $club->name,
        'contribution_id' => $contribution->id,
    ],
);
```

Nên tạo notification sau khi database transaction của nghiệp vụ thành công. Nếu chuyển sang Job,
dispatch bằng `DB::afterCommit()` hoặc cấu hình queue `after_commit=true` để tránh gửi thông báo cho
giao dịch đã rollback.

## 9. Quy ước `type` và `data`

Mỗi `type` phải có contract payload rõ ràng:

| Type | Data bắt buộc |
|---|---|
| `club_invite` | `club_id`, `club_name`, `invite_code` |
| `member_approved` | `club_id`, `club_name` |
| `fund_due` | `contribution_id`, `club_name`, `month`, `year`, `amount` |
| `transaction_confirmed` | `transaction_id`, `amount`, `reference_code` |
| `exchange_session_created` | `session_id`, `club_name`, `session_date`, `start_time` |
| `monthly_contribution_created` | `period_id`, `contribution_id`, `month`, `year`, `amount`, `status`, `paid_by` |
| `monthly_contribution_updated` | `period_id`, `contribution_id`, `month`, `year`, `amount`, `status`, `paid_by` |
| `monthly_contribution_cancelled` | `period_id`, `contribution_id`, `month`, `year`, `amount`, `status`, `paid_by` |
| `monthly_contribution_deleted` | `period_id`, `contribution_id`, `month`, `year`, `amount`, `status`, `paid_by` |

Không đặt HTML trong `data`. Frontend điều hướng dựa trên `type` và ID của đối tượng, thay vì lưu một
URL tuyệt đối dễ bị lỗi khi route frontend thay đổi.

### Notification của MonthlyContribution

`MonthlyContributionService` phát notification trong cùng database transaction với nghiệp vụ:

| Nghiệp vụ | Notification type |
|---|---|
| Tạo mới hoặc restore contribution đã soft delete | `monthly_contribution_created` |
| Cập nhật amount, period, payment hoặc trạng thái thông thường | `monthly_contribution_updated` |
| Chuyển trạng thái từ trạng thái khác sang `cancelled` | `monthly_contribution_cancelled` |
| Delete contribution đã trả bằng bank | `monthly_contribution_cancelled` |
| Soft delete contribution pending hoặc cash | `monthly_contribution_deleted` |

Delete contribution thanh toán bằng bank không xóa bản ghi vì transaction ngân hàng là bằng chứng đối
soát bất biến. Service chuyển contribution sang `cancelled`, `is_active=false` và gửi notification
cancelled. Với pending hoặc cash, contribution được soft delete và gửi notification deleted.

## 10. Queue và realtime

Setup đầu tiên có thể tạo notification đồng bộ trong cùng request. Khi số lượng người nhận lớn:

1. Tạo Job `CreateNotificationsJob`.
2. Dùng queue database hiện đã được cấu hình qua `QUEUE_CONNECTION=database`.
3. Chạy worker bằng `php artisan queue:work`.
4. Chỉ bổ sung broadcasting/WebSocket khi frontend cần notification xuất hiện tức thời.

Queue không thay đổi cách lưu đa ngôn ngữ: database vẫn lưu `type + data`; locale được áp dụng lúc
render API, hoặc lấy từ `users.preferred_locale` khi gửi email/push.

## 11. Thứ tự triển khai

1. Sửa vị trí model thành thư mục `Models`.
2. Tạo migration điều chỉnh schema hiện tại.
3. Tạo hai file ngôn ngữ `vi` và `en`.
4. Tạo Repository, Service, Resource và Controller theo kiến trúc chung.
5. Tạo endpoint list, unread-count, read và read-all.
6. Tích hợp thử một sự kiện, ưu tiên `fund_due`.
7. Viết test cho quyền sở hữu, filter chưa đọc và response theo hai locale.
8. Sau khi luồng cơ bản ổn định mới bổ sung queue, email, push hoặc realtime.

## 12. Kết luận

Với nhu cầu hiện tại, bảng `notifications` chỉ cần lưu `type`, `data`, người nhận và trạng thái đọc.
Nội dung đa ngôn ngữ nên đặt trong file `lang`, không cần bảng translation riêng.

Chỉ bổ sung `notification_templates` và `notification_template_translations` khi nội dung mẫu phải
được quản trị động trong database. Khi có email/push chạy nền, bổ sung `users.preferred_locale` để
xác định ngôn ngữ ngoài phạm vi HTTP request.
