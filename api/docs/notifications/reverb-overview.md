# Laravel Reverb cho Notification realtime

> Tài liệu setup WebSocket realtime cho module Notification. Backend dùng Laravel Reverb, private
> channel theo user và JWT để xác thực subscription.

## 1. Thành phần đã cài đặt

```text
laravel/reverb:^1.11
pusher/pusher-php-server:^7.3
```

Các file chính:

```text
config/broadcasting.php
config/reverb.php
routes/channels.php
app/Domains/Notification/Events/NotificationCreated.php
app/Domains/Notification/Services/NotificationService.php
bootstrap/app.php
```

## 2. Kiến trúc luồng realtime

```text
FundPeriodService tạo kỳ quỹ trong DB transaction
  → MonthlyContributionService tạo contribution
  → NotificationService::send() lưu notification
  → NotificationCreated được đăng ký chờ after-commit
  → database transaction commit thành công
  → queue worker xử lý broadcast job
  → Reverb phát notification.created
  → private-user.{userId}
  → frontend cập nhật badge và danh sách notification
```

Nếu transaction rollback, event không được phát và client không nhận notification không tồn tại.

## 3. Biến môi trường backend

Local development:

```dotenv
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=local-club-fund
REVERB_APP_KEY=local-club-fund-key
REVERB_APP_SECRET=local-club-fund-secret

REVERB_HOST=127.0.0.1
REVERB_PORT=8080
REVERB_SCHEME=http

REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080

REVERB_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Phân biệt:

| Biến | Vai trò |
|---|---|
| `REVERB_SERVER_HOST/PORT` | Địa chỉ process Reverb bind để lắng nghe |
| `REVERB_HOST/PORT/SCHEME` | Địa chỉ Laravel và frontend dùng để kết nối Reverb |
| `REVERB_ALLOWED_ORIGINS` | Danh sách origin frontend được phép mở WebSocket |

Production phải dùng key/secret riêng và không commit `.env`.

## 4. Chạy local

Cần chạy ba process:

```bash
# API
php artisan serve --host=0.0.0.0 --port=8000

# Queue xử lý broadcast event
php artisan queue:work --queue=default --tries=3

# WebSocket server
php artisan reverb:start --host=0.0.0.0 --port=8080 --debug
```

Sau khi đổi `.env` hoặc config:

```bash
php artisan optimize:clear
php artisan reverb:restart
```

## 5. Private channel và JWT

Channel được khai báo tại `routes/channels.php`:

```php
Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
```

Laravel tự thêm prefix `private-` khi client subscribe:

```text
private-user.15
```

Endpoint xác thực channel:

```text
POST /api/broadcasting/auth
Middleware: api, auth.jwt
```

Frontend phải gửi JWT trong header:

```http
Authorization: Bearer <access-token>
Accept: application/json
```

User 15 chỉ được subscribe `private-user.15`; subscribe channel của user khác trả `403`.

## 6. Event NotificationCreated

Event name:

```text
notification.created
```

Event implement:

```text
ShouldBroadcast
ShouldDispatchAfterCommit
```

Payload mẫu:

```json
{
  "notification": {
    "id": 101,
    "club": {
      "id": 1,
      "name": "Hanoi Badminton Club"
    },
    "type": "fund_due",
    "title_key": "notifications.types.fund_due.title",
    "body_key": "notifications.types.fund_due.body",
    "data": {
      "period_id": 8,
      "contribution_id": 125,
      "month": 8,
      "year": 2026,
      "amount": 200000
    },
    "is_read": false,
    "read_at": null,
    "created_at": "2026-08-15T16:00:00+07:00"
  },
  "unread_count": 4
}
```

Realtime payload không lưu hoặc phát một câu tiếng Việt cố định. Frontend dùng `type`, translation key
và `data` để render theo locale hiện tại. API `GET /api/v1/notifications` vẫn trả `title` và `body` đã
được backend dịch theo `Accept-Language`.

## 7. Gửi notification từ domain khác

Domain sở hữu nghiệp vụ inject `NotificationService` và gọi:

```php
$this->notificationService->send(
    userId: $userId,
    type: 'transaction_confirmed',
    data: [
        'transaction_id' => $transaction->id,
        'amount' => (float) $transaction->amount,
        'reference_code' => $transaction->reference_code,
    ],
    clubId: $transaction->club_id,
);
```

Không gọi `NotificationController` từ service khác. Nếu đang nằm trong DB transaction, event tự chờ
commit rồi mới được đưa vào queue.

## 8. Frontend với Laravel Echo

Cài dependency trong project frontend:

```bash
npm install laravel-echo pusher-js
```

Ví dụ cấu hình TypeScript:

```ts
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

export function createEcho(accessToken: string) {
  return new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
    forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${import.meta.env.VITE_API_URL}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    },
  });
}
```

Subscribe sau khi login:

```ts
const echo = createEcho(accessToken);

echo.private(`user.${user.id}`)
  .listen('.notification.created', (event) => {
    notificationStore.prepend(event.notification);
    notificationStore.setUnreadCount(event.unread_count);
  });
```

Dấu chấm trong `.listen('.notification.created')` là bắt buộc vì backend dùng `broadcastAs()`.

Khi logout hoặc đổi tài khoản:

```ts
echo.leave(`user.${user.id}`);
echo.disconnect();
```

Frontend environment mẫu:

```dotenv
VITE_API_URL=http://localhost:8000
VITE_REVERB_APP_KEY=local-club-fund-key
VITE_REVERB_HOST=127.0.0.1
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

Frontend chỉ cần app key. Không đưa `REVERB_APP_SECRET` ra client.

## 9. Production

Khuyến nghị chạy Reverb và queue worker bằng Supervisor hoặc systemd. Reverb cần reverse proxy hỗ trợ
WebSocket upgrade và TLS.

Nginx tối thiểu:

```nginx
location /app {
    proxy_http_version 1.1;
    proxy_set_header Host $http_host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_pass http://127.0.0.1:8080;
}

location /apps {
    proxy_http_version 1.1;
    proxy_set_header Host $http_host;
    proxy_pass http://127.0.0.1:8080;
}
```

Production environment thường dùng:

```dotenv
REVERB_HOST=ws.example.com
REVERB_PORT=443
REVERB_SCHEME=https
REVERB_SERVER_HOST=127.0.0.1
REVERB_SERVER_PORT=8080
REVERB_ALLOWED_ORIGINS=https://app.example.com
```

Nếu chạy nhiều Reverb instance, bật scaling và dùng Redis:

```dotenv
REVERB_SCALING_ENABLED=true
```

## 10. Kiểm tra vận hành

```bash
php artisan route:list --path=broadcasting
php artisan queue:monitor default:100
php artisan reverb:start --debug
```

Kết quả route auth đúng:

```text
GET|POST /api/broadcasting/auth
middleware: api, auth.jwt
```

Checklist:

1. Reverb process đang chạy.
2. Queue worker đang chạy.
3. `BROADCAST_CONNECTION=reverb`.
4. Frontend origin nằm trong `REVERB_ALLOWED_ORIGINS`.
5. Client gửi JWT tới `/api/broadcasting/auth`.
6. Client listen `.notification.created` trên `private-user.{id}`.
7. Port WebSocket được mở hoặc reverse proxy đúng cấu hình.

## 11. Lỗi thường gặp

| Hiện tượng | Nguyên nhân thường gặp |
|---|---|
| Kết nối WebSocket được nhưng không có event | Queue worker chưa chạy |
| `/api/broadcasting/auth` trả 401 | JWT thiếu, hết hạn hoặc invalid |
| Auth trả 403 | User đang subscribe channel của user khác |
| Browser báo origin rejected | Thiếu origin trong `REVERB_ALLOWED_ORIGINS` |
| Local dùng `wss` nhưng server chỉ chạy HTTP | `VITE_REVERB_SCHEME` hoặc `forceTLS` sai |
| Event listener không chạy | Thiếu dấu chấm trong `.notification.created` |
| Đổi config nhưng server dùng giá trị cũ | Chạy `optimize:clear` và `reverb:restart` |
