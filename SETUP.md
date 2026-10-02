# Hướng dẫn cài đặt và chạy BillTrack Local

## Bước 1: Tạo Database trên Neon (miễn phí)

1. Đăng ký tại https://neon.tech
2. Tạo project `billtrack`
3. Copy **Connection String** từ Dashboard:
   ```
   postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
4. Vào **SQL Editor** → Chạy nội dung file `backend/src/config/schema.sql`

> **Hoặc** dùng script tự động (sau khi cấu hình .env):
> ```bash
> cd backend && npm run db:init
> ```

## Bước 2: Cấu hình Backend

1. Vào thư mục `backend/`
2. Copy file `.env.example` thành `.env`
3. Mở `.env` và sửa:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://USER:PASS@ep-xxx.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=any_random_string_32chars
CLIENT_URL=http://localhost:5173
```

## Bước 3: Chạy Backend

```bash
cd backend
npm install   # nếu chưa cài
npm run dev
```
→ Server chạy tại **http://localhost:5000**
→ Test: http://localhost:5000/api/health → `{"success":true,"message":"BillTrack API is running!"}`

## Bước 4: Chạy Frontend

Mở terminal mới:
```bash
cd frontend
npm install   # nếu chưa cài
npm run dev
```
→ App chạy tại **http://localhost:5173**

## Kiểm tra ứng dụng

1. Truy cập http://localhost:5173
2. Click **"Đăng ký ngay"** → Tạo tài khoản
3. Đăng nhập → vào Dashboard
4. Thêm khoản thanh toán và kiểm tra các tính năng!

## Lỗi thường gặp

**Lỗi kết nối DB:**
- Kiểm tra DATABASE_URL đúng chưa
- Đảm bảo có `?sslmode=require` ở cuối URL
- Thử ping từ Neon SQL Editor trước

**CORS error:**
- Đảm bảo `CLIENT_URL=http://localhost:5173` trong backend `.env`
- Restart backend sau khi sửa `.env`

**Port bị chiếm:**
- Backend: đổi `PORT=5001` trong `.env`
- Frontend: `npm run dev -- --port 3000`
