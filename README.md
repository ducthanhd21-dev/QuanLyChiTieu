# BillTrack — Quản lý khoản thanh toán cá nhân

Ứng dụng web full-stack thông minh giúp bạn theo dõi và quản lý các khoản thanh toán, hóa đơn và ngân sách hàng tháng.

## 🚀 Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Frontend | React + Vite + Ant Design + Chart.js + SheetJS (XLSX) |
| Backend | Node.js + Express.js + JWT + bcrypt + pg (PostgreSQL) |
| Database | Neon PostgreSQL (Serverless) |
| Deploy | Vercel (FE) + Render (BE) + Neon (DB) |

## ✨ Tính năng nổi bật

1. **🔐 Xác thực & Phân quyền**: Đăng ký, đăng nhập JWT, phân quyền Admin / User.
2. **💳 Quản lý hóa đơn CRUD**: Thêm, sửa, xóa, tìm kiếm, lọc theo tháng, danh mục, trạng thái.
3. **🔁 Hóa đơn định kỳ & Sao chép nhanh**: Đánh dấu bill định kỳ, sao chép toàn bộ hóa đơn từ tháng trước sang tháng mới với 1-click.
4. **🎯 Hạn mức chi tiêu & Cảnh báo ngân sách**: Đặt hạn mức chi tiêu hàng tháng, thanh tiến độ cảnh báo màu khi vượt ngân sách.
5. **⏰ Cảnh báo hạn thanh toán**: Banner thông báo tự động các khoản quá hạn và sắp đến hạn trong 3 ngày tới.
6. **📎 Đính kèm ảnh biên lai**: Tải lên ảnh chụp màn hình chuyển khoản / biên lai thanh toán và xem kích thước lớn.
7. **📑 Xuất báo cáo Excel**: Xuất file `.xlsx` danh sách hóa đơn theo tháng cho User và báo cáo người dùng cho Admin.
8. **👑 Bảng điều khiển Quản trị viên (Admin)**: Xem số tài khoản đăng ký và chi tiết hóa đơn mỗi tháng của từng người dùng.
9. **📊 Biểu đồ thống kê tròn & mềm mại**: Biểu đồ cột bo tròn và biểu đồ tròn phân tích chi tiêu theo danh mục.
10. **📱 PWA & Tối ưu Mobile UX**: Cài đặt trực tiếp về màn hình điện thoại như ứng dụng native, giao diện dạng thẻ (Card) tối ưu cho ngón tay.

## 📁 Cấu trúc thư mục

```
BillTrack/
├── frontend/             # React app (Vite)
│   ├── public/           # manifest.json, sw.js (PWA)
│   └── src/
│       ├── components/   # AppLayout, BillModal, ProtectedRoute
│       ├── contexts/     # AuthContext (JWT persistent)
│       ├── pages/        # Dashboard, Bills, Statistics, Settings, AdminPage, Login, Register
│       ├── services/     # api.js, budgetService, adminService, billService
│       └── utils/        # helpers, exportExcel (XLSX)
├── backend/              # Express API
│   └── src/
│       ├── config/       # database.js, schema.sql, initDb.js, make-admin.js
│       ├── controllers/  # auth, bill, dashboard, stats, admin, budget
│       ├── middleware/   # auth.js (JWT), adminAuth.js, validate.js
│       ├── models/       # userModel, billModel, budgetModel
│       ├── routes/       # auth, bills, dashboard, stats, admin, budget
│       └── server.js
└── README.md
```

## ⚡ Cài đặt & Chạy Local

### 1. Database (Neon PostgreSQL)
Lấy Connection String từ Neon Dashboard và lưu vào `backend/.env`.
Khởi tạo cấu trúc bảng:
```bash
cd backend
npm run db:init
```

### 2. Chạy Backend
```bash
cd backend
npm run dev
# Server chạy tại http://localhost:5000
```

### 3. Chạy Frontend
```bash
cd frontend
npm run dev
# App chạy tại http://localhost:5173
```

## 👑 Phân quyền Admin
Để cấp quyền Admin cho một email bất kỳ:
```bash
cd backend
npm run make-admin <email_nguoi_dung>
```
