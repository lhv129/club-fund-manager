# Club Dashboard

Tài liệu tổng quan cho dashboard câu lạc bộ tại route:

```text
/{locale}/club/{slug}/dashboard
```

Domain source:

```text
src/domains/dashboard/club/
```

Dashboard hiện là một operational information system sử dụng mock data. Khi API thống kê được triển khai, chỉ cần thay data source trong `useClubDashboardData.ts`; các component hiển thị không nên phụ thuộc trực tiếp vào API client.

## Cấu trúc thư mục

```text
club/
├── components/
│   ├── ActivityInteractive.tsx
│   ├── CashFlowInteractive.tsx
│   ├── ClubDashboard.tsx
│   ├── ClubDashboardHeader.tsx
│   ├── ClubFinancialSummary.tsx
│   ├── ClubFundOverview.tsx
│   ├── ClubMemberHealth.tsx
│   ├── ClubRecentTransactions.tsx
│   ├── ClubUpcomingSessions.tsx
│   ├── DashboardCard.tsx
│   ├── DashboardInsightsCharts.tsx
│   ├── DashboardPeriodFilter.tsx
│   ├── useDashboardChartColors.ts
│   ├── _group.css
│   └── index.ts
├── mockData.ts
├── types.ts
├── useClubDashboardData.ts
└── README.md
```

## Vai trò từng file

### Data và contracts

| File | Trách nhiệm |
| --- | --- |
| `types.ts` | Khai báo contract của dashboard và tái sử dụng type từ các module nghiệp vụ. |
| `mockData.ts` | Chứa toàn bộ mock data tài chính, thành viên, quỹ, giao dịch, buổi đánh và dữ liệu chart. |
| `useClubDashboardData.ts` | Data source duy nhất của dashboard. Hiện trả mock data và mô phỏng trạng thái refresh. |

`types.ts` sử dụng `Pick` từ các type thật như `FundPeriod`, `MonthlyContribution`, `ExchangeSession` và `Transaction`. Mock data phải tuân theo các contract này để việc chuyển sang API ít ảnh hưởng component.

### Composition

| File | Trách nhiệm |
| --- | --- |
| `ClubDashboard.tsx` | Component điều phối chính, quản lý period, chọn dataset và truyền dữ liệu xuống các section. |
| `ClubDashboardHeader.tsx` | Tiêu đề, period filter và thao tác refresh. |
| `DashboardPeriodFilter.tsx` | Điều khiển ba khoảng thời gian được hỗ trợ. |
| `DashboardCard.tsx` | Khung card dùng chung, header, icon, description và empty/loading state. |
| `index.ts` | Public export của domain component. |

### Operational sections

| File | Nội dung |
| --- | --- |
| `ClubFinancialSummary.tsx` | Số dư, tổng thu, tổng chi và khoản còn phải thu. |
| `ClubFundOverview.tsx` | Kỳ quỹ hiện tại và trạng thái đóng quỹ. |
| `ClubMemberHealth.tsx` | Tổng quan thành viên active, inactive, tham gia và nghĩa vụ chưa hoàn thành. |
| `ClubUpcomingSessions.tsx` | Các buổi đánh sắp tới. |
| `ClubRecentTransactions.tsx` | Danh sách giao dịch gần đây. |

### Charts

| File | Loại chart |
| --- | --- |
| `CashFlowInteractive.tsx` | Composed chart: area tổng thu, bar tổng chi và line dòng tiền ròng. |
| `ActivityInteractive.tsx` | Composed chart: area tổng người, line nam/nữ và bar nhóm giao lưu. |
| `DashboardInsightsCharts.tsx` | Donut trạng thái đóng quỹ, donut nguồn giao dịch và chart quy mô buổi đánh. |
| `useDashboardChartColors.ts` | Resolve semantic CSS variables thành giá trị màu thực để truyền cho SVG/Recharts. |
| `_group.css` | Animation và style phụ trợ dùng chung cho chart. Không phải nơi định nghĩa palette nghiệp vụ. |

## Luồng dữ liệu

```text
ClubDashboardHeader
        │
        │ onPeriodChange
        ▼
ClubDashboard period state
        │
        ├── cashFlowByPeriod[period]
        └── activityByPeriod[period]
                 │
                 ▼
       Chart components nhận mảng đã chọn
```

`ClubDashboardHeader` là nguồn điều khiển thời gian duy nhất. Chart không được tạo thêm select thời gian riêng.

Các period hợp lệ:

```ts
type DashboardChartPeriod = "7d" | "month" | "previous_month";
```

Mapping mock data:

```ts
cashFlowByPeriod: {
  "7d": DashboardCashFlowPoint[];
  month: DashboardCashFlowPoint[];
  previous_month: DashboardCashFlowPoint[];
}

activityByPeriod: {
  "7d": DashboardActivityPoint[];
  month: DashboardActivityPoint[];
  previous_month: DashboardActivityPoint[];
}
```

Khi period thay đổi, financial summary và hai interactive chart phải đổi dữ liệu đồng thời.

## Quy chuẩn màu sắc

Toàn bộ màu nền, chữ, border và primary phải sử dụng semantic design tokens trong `src/app/globals.css`.

### Semantic utilities

```text
bg-background
bg-background-subtle
bg-background-muted

text-foreground
text-foreground-muted

border-border
border-border-strong

bg-primary
text-primary
text-primary-foreground
hover:bg-primary-hover
```

Không sử dụng trực tiếp các màu như `bg-white`, `text-black`, `border-zinc-200` hoặc `dark:*` để mô tả theme. Dark mode được xử lý bằng cách thay giá trị CSS variables trên `.dark`.

Status colors có thể dùng trực tiếp khi màu mang ý nghĩa nghiệp vụ, ví dụ success, warning và danger.

## Chart color tokens

Palette chart được khai báo tập trung trong `src/app/globals.css` cho cả Light Mode và Dark Mode:

```css
--chart-income;
--chart-expense;
--chart-net;
--chart-total;
--chart-positive;
--chart-male;
--chart-female;
--chart-groups;
```

Ý nghĩa:

| Token | Ý nghĩa |
| --- | --- |
| `--chart-income` | Tiền thu hoặc dòng tiền vào. |
| `--chart-expense` | Tiền chi hoặc dòng tiền ra. |
| `--chart-net` | Dòng tiền ròng. |
| `--chart-total` | Tổng số người hoặc series tổng. |
| `--chart-positive` | Giá trị tăng trưởng hoặc trạng thái tích cực. |
| `--chart-male` | Thành viên nam. |
| `--chart-female` | Thành viên nữ. |
| `--chart-groups` | Nhóm giao lưu hoặc series nhóm. |

Không định nghĩa lại các token này trong component hoặc `_group.css`. Khi cần đổi palette chart toàn hệ thống, chỉ sửa `globals.css`.

## Sử dụng màu với Recharts

Không truyền CSS variable thô trực tiếp vào các thuộc tính SVG quan trọng nếu thư viện cần parse màu:

```tsx
// Không khuyến nghị
<Line stroke="var(--chart-net)" />
```

Sử dụng `useDashboardChartColors()` để lấy giá trị màu đã resolve:

```tsx
const colors = useDashboardChartColors();

<Line stroke={colors.net} />
<Bar fill={colors.expense} />
<CartesianGrid stroke={colors.grid} />
```

Hook theo dõi class/style của thẻ `<html>`, vì vậy chart sẽ cập nhật màu khi Light/Dark Mode thay đổi.

Gradient cũng phải nhận màu đã resolve:

```tsx
<linearGradient id="income-area" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0%" stopColor={colors.income} stopOpacity={0.22} />
  <stop offset="100%" stopColor={colors.income} stopOpacity={0.02} />
</linearGradient>
```

Mỗi chart phải sử dụng gradient id riêng để tránh xung đột SVG khi nhiều chart xuất hiện trên cùng trang.

## Quy chuẩn interactive chart

Interactive chart cần có:

- Metric strip tóm tắt số liệu quan trọng.
- Legend có thể bật/tắt từng series.
- Nút reset series dùng icon `RotateCcw`.
- Tooltip hiển thị dữ liệu chi tiết tại điểm hover.
- Animation có thời lượng lệch nhau giữa các series.
- `ResponsiveContainer` với chiều cao ổn định.
- Brush để phóng to hoặc thu hẹp khoảng dữ liệu hiển thị.
- Empty state khi dataset rỗng.
- Màu và tooltip tương thích Light/Dark Mode.

Interactive chart không được có period select riêng. Period được quản lý tại `ClubDashboardHeader`.

## Responsive behavior

- Mobile: metric strip chuyển thành danh sách dọc, chart giữ chiều cao tối thiểu và legend được wrap.
- Tablet: card chiếm toàn bộ chiều ngang nếu grid không đủ chỗ.
- Desktop: cash flow kết hợp member overview; activity kết hợp upcoming sessions theo dashboard grid.
- Nội dung metric phải dùng `min-w-0`, `truncate` hoặc xuống dòng hợp lý để tránh tràn card.
- Chart height phải cố định theo breakpoint để dữ liệu hoặc animation không làm layout dịch chuyển.

## Chuyển từ mock sang API

Khi backend có dashboard endpoint:

1. Giữ nguyên `ClubDashboardData` hoặc cập nhật contract tại `types.ts`.
2. Thay mock return trong `useClubDashboardData.ts` bằng query/API client.
3. Chuẩn hóa response thành `cashFlowByPeriod` và `activityByPeriod`, hoặc lưu từng response theo period.
4. Giữ raw amount ở dạng number/string theo type nghiệp vụ; chỉ format tiền tại presentation component.
5. Không gọi API trực tiếp trong từng card hoặc chart.
6. Giữ các trạng thái `isLoading`, `isFetching`, `isError` và `refetch` trong data hook.

Mục tiêu là thay data source mà không phải viết lại layout và chart components.

## Checklist khi mở rộng dashboard

- Đặt code trong `src/domains/dashboard/club`.
- Tái sử dụng type của module nghiệp vụ thay vì tạo type response trùng lặp.
- Mock data phải khớp contract dự kiến của API.
- Header là nguồn period duy nhất.
- Component chỉ nhận dữ liệu cần hiển thị.
- Nền, chữ, border và primary dùng semantic tokens.
- Palette chart chỉ định nghĩa trong `globals.css`.
- Recharts nhận màu đã resolve từ `useDashboardChartColors`.
- Status colors chỉ dùng cho ý nghĩa nghiệp vụ.
- Icon ưu tiên `lucide-react`.
- Kiểm tra Light Mode, Dark Mode, mobile, tablet và desktop.
- Chạy TypeScript, ESLint và `git diff --check` trước khi hoàn tất.
