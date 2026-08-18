const cashFlowMonth = Array.from({ length: 16 }, (_, index) => {
  const day = index + 1;
  const income = 650000 + (index % 5) * 240000 + (index % 3 === 0 ? 520000 : 0);
  const expense = 300000 + (index % 4) * 170000 + (index % 6 === 0 ? 430000 : 0);
  return { date: `2026-08-${String(day).padStart(2, "0")}`, label: `${String(day).padStart(2, "0")}/08`, income, expense, net: income - expense };
});

const cashFlowPreviousMonth = Array.from({ length: 31 }, (_, index) => {
  const day = index + 1;
  const income = 570000 + (index % 6) * 190000 + (index % 7 === 0 ? 480000 : 0);
  const expense = 280000 + (index % 5) * 150000 + (index % 8 === 0 ? 360000 : 0);
  return { date: `2026-07-${String(day).padStart(2, "0")}`, label: `${String(day).padStart(2, "0")}/07`, income, expense, net: income - expense };
});

const activityMonth = Array.from({ length: 16 }, (_, index) => {
  const male = 14 + (index % 6) * 2;
  const female = 9 + (index % 5) * 2;
  return { date: `2026-08-${String(index + 1).padStart(2, "0")}`, label: `${String(index + 1).padStart(2, "0")}/08`, male, female, groups: 3 + (index % 4), total: male + female };
});

const activityPreviousMonth = Array.from({ length: 31 }, (_, index) => {
  const male = 12 + (index % 7) * 2;
  const female = 8 + (index % 6) * 2;
  return { date: `2026-07-${String(index + 1).padStart(2, "0")}`, label: `${String(index + 1).padStart(2, "0")}/07`, male, female, groups: 2 + (index % 5), total: male + female };
});

// Legacy fixture retained for visual development only. The dashboard uses API hooks.
export const clubDashboardMockData = {
  members: [], memberTotal: 62,
  memberStats: { total: 62, active: 57, inactive: 5, new_members: 4, participating: 43, outstanding: 16 },
  fundPeriods: [{ id: 1, year: 2026, month: 8, male_amount: "200000", female_amount: "150000", is_active: true, is_locked: false }],
  contributions: [
    { id: 1, period_id: 1, amount: "400000", status: "pending", user: { id: 10, fullname: "Phạm Quang Huy" } },
    { id: 2, period_id: 1, amount: "280000", status: "pending", user: { id: 11, fullname: "Lê Thu Trang" } },
    { id: 3, period_id: 1, amount: "200000", status: "pending", user: { id: 12, fullname: "Vũ Đức Long" } },
    { id: 4, period_id: 1, amount: "200000", status: "paid", user: { id: 13, fullname: "Nguyễn Minh Anh" } },
    { id: 5, period_id: 1, amount: "150000", status: "paid", user: { id: 14, fullname: "Trần Thu Hà" } },
    { id: 6, period_id: 1, amount: "200000", status: "paid", user: { id: 15, fullname: "Hoàng Tuấn Kiệt" } },
    { id: 7, period_id: 1, amount: "150000", status: "cancelled", user: { id: 16, fullname: "Đỗ Ngọc Mai" } },
  ],
  sessions: [
    { id: 1, session_date: "2026-08-16", court_name: "Sân Cầu Giấy", court_address: "Cầu Giấy, Hà Nội", start_time: "19:00", end_time: "21:00", status: "upcoming", type: "scheduled", player_count: 18, total_amount: "1440000", amount_per_player: "80000" },
    { id: 2, session_date: "2026-08-18", court_name: "Sân Cầu Giấy", court_address: "Cầu Giấy, Hà Nội", start_time: "19:00", end_time: "21:00", status: "upcoming", type: "scheduled", player_count: 14, total_amount: "1120000", amount_per_player: "80000" },
    { id: 3, session_date: "2026-08-20", court_name: "Sân Mỹ Đình", court_address: "Nam Từ Liêm, Hà Nội", start_time: "19:30", end_time: "21:30", status: "upcoming", type: "manual", player_count: 11, total_amount: "880000", amount_per_player: "80000" },
  ],
  transactions: [
    { id: 55, type: "income", source: "webhook", amount: "200000", description: "Quỹ tháng 8", reference_code: "SEPAY12345", transaction_date: "2026-08-16T10:32:00+07:00", sender_name: "Nguyễn Minh Anh" },
    { id: 56, type: "expense", source: "cash", amount: "1200000", description: "Thanh toán sân", reference_code: null, transaction_date: "2026-08-16T09:15:00+07:00", sender_name: null },
    { id: 57, type: "income", source: "manual", amount: "80000", description: "Buổi đánh 18/08", reference_code: "MANUAL-57", transaction_date: "2026-08-15T20:10:00+07:00", sender_name: "Trần Hoàng Nam" },
    { id: 58, type: "income", source: "cash", amount: "150000", description: "Đóng quỹ tiền mặt", reference_code: null, transaction_date: "2026-08-15T18:20:00+07:00", sender_name: "Trần Thu Hà" },
    { id: 59, type: "expense", source: "webhook", amount: "2350000", description: "Mua cầu thi đấu", reference_code: "VCB99821", transaction_date: "2026-08-14T15:45:00+07:00", sender_name: "Sport One" },
  ], transactionTotal: 42, bankAccounts: [],
  cashFlow: [
    { date: "2026-08-10", label: "10/08", income: 900000, expense: 450000, net: 450000 },
    { date: "2026-08-11", label: "11/08", income: 1200000, expense: 700000, net: 500000 },
    { date: "2026-08-12", label: "12/08", income: 800000, expense: 350000, net: 450000 },
    { date: "2026-08-13", label: "13/08", income: 1500000, expense: 900000, net: 600000 },
    { date: "2026-08-14", label: "14/08", income: 1100000, expense: 650000, net: 450000 },
    { date: "2026-08-15", label: "15/08", income: 2200000, expense: 1000000, net: 1200000 },
    { date: "2026-08-16", label: "16/08", income: 950000, expense: 500000, net: 450000 },
  ],
  activity: [
    { date: "2026-08-10", label: "10/08", male: 18, female: 12, groups: 4, total: 30 }, { date: "2026-08-11", label: "11/08", male: 22, female: 14, groups: 5, total: 36 }, { date: "2026-08-12", label: "12/08", male: 20, female: 16, groups: 4, total: 36 }, { date: "2026-08-13", label: "13/08", male: 25, female: 17, groups: 6, total: 42 }, { date: "2026-08-14", label: "14/08", male: 23, female: 15, groups: 5, total: 38 }, { date: "2026-08-15", label: "15/08", male: 27, female: 18, groups: 6, total: 45 }, { date: "2026-08-16", label: "16/08", male: 25, female: 17, groups: 6, total: 42 },
  ],
  cashFlowByPeriod: { "7d": cashFlowMonth.slice(-7), month: cashFlowMonth, previous_month: cashFlowPreviousMonth },
  activityByPeriod: { "7d": activityMonth.slice(-7), month: activityMonth, previous_month: activityPreviousMonth },
};
