# BillTrack — Hướng dẫn Deploy (Neon PostgreSQL + Render + Vercel)

## 1. Tạo Database trên Neon PostgreSQL

1. Đăng ký tại https://neon.tech (miễn phí)
2. **Create Project** → Đặt tên `billtrack`
3. Chọn Region gần nhất (Singapore / Tokyo)
4. Sau khi tạo xong, vào **Connection Details**
5. Copy **Connection String** dạng:
   ```
   postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
6. Vào **SQL Editor** → Chạy toàn bộ nội dung file `backend/src/config/schema.sql`

> **Hoặc** chạy script tự động sau khi có DATABASE_URL:
> ```bash
> cd backend
> # Sửa .env với DATABASE_URL từ Neon
> npm run db:init
> ```

---

## 2. Deploy Backend lên Render

### Bước 1: Push code lên GitHub
```bash
cd BillTrack
git init
git add .
git commit -m "Initial commit: BillTrack with Neon PostgreSQL"
git remote add origin https://github.com/YOUR_USERNAME/billtrack.git
git push -u origin main
```

### Bước 2: Tạo Web Service trên Render
1. Vào https://render.com → **New** → **Web Service**
2. Kết nối GitHub repo `billtrack`
3. Cấu hình:
   - **Name**: `billtrack-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Region**: Singapore
   - **Plan**: Free

### Bước 3: Set Environment Variables
Trong Render → **Environment**:
```
NODE_ENV=production
PORT=10000
DATABASE_URL=<Connection string từ Neon>
JWT_SECRET=<chuỗi ngẫu nhiên 32+ ký tự>
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-app.vercel.app
```

### Bước 4: Deploy
Click **Create Web Service** → Chờ build xong (~2-3 phút)

Kiểm tra: `https://billtrack-backend.onrender.com/api/health`

> ⚠️ **Free tier Render**: Service sẽ "sleep" sau 15 phút không có request.
> Lần đầu gọi API có thể mất 30-60 giây để wake up.

---

## 3. Deploy Frontend lên Vercel

1. Vào https://vercel.com → **Add New Project**
2. Import GitHub repo `billtrack`
3. Cấu hình:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
4. **Environment Variables**:
   ```
   VITE_API_URL=https://billtrack-backend.onrender.com/api
   ```
5. Click **Deploy**

### Bước cuối: Update CORS
Sau khi có URL Vercel, vào Render → Environment:
```
CLIENT_URL=https://your-app-name.vercel.app
```
Redeploy backend.

---

## Checklist sau deploy

- [ ] `https://billtrack-backend.onrender.com/api/health` → `{"success":true}`
- [ ] Neon SQL Editor: chạy `SELECT * FROM users;` không báo lỗi
- [ ] Đăng ký tài khoản mới
- [ ] Đăng nhập → vào Dashboard
- [ ] Tạo / sửa / xóa bill
- [ ] Toggle thanh toán
- [ ] Thống kê hiển thị đúng

---

## Stack tóm tắt

| Layer | Service | Free tier |
|-------|---------|-----------|
| Database | Neon PostgreSQL | 500MB storage, 10 branches |
| Backend | Render Web Service | 750h/tháng |
| Frontend | Vercel | Unlimited |
