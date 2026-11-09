# TikTok Clone Backend API (Node.js & MySQL 8.4)

API Server cho dự án TikTok Clone với cơ sở dữ liệu lưu trữ trực tiếp bằng **MySQL 8.4**.

---

## 🗄️ Cấu trúc Database (MySQL)

Hệ cơ sở dữ liệu `tiktok_db` gồm các bảng:
- `users`: Thông tin tài khoản, avatar, tiểu sử, tick xanh, số lượng follow/like.
- `videos`: Danh sách video, caption, link video, nhạc nền, thống kê lượt xem/tim/chia sẻ/bình luận.
- `comments`: Bình luận video, trả lời bình luận (parent_id), thả tim bình luận.
- `lives`: Các phòng livestream trực tiếp, số mắt xem, lượt thả tim.
- `notifications`: Thông báo hoạt động (like, follow, comment, reply, mention).

---

## ⚙️ Cấu hình Môi trường (.env)

Tạo hoặc kiểm tra file `server/.env`:

```env
PORT=8080
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=1
DB_NAME=tiktok_db
```

---

## 🚀 Các lệnh khởi chạy (Scripts)

```bash
# 1. Cài đặt thư viện
npm install

# 2. Khởi tạo database & nạp dữ liệu mẫu ban đầu (Nếu chưa chạy)
npm run db:init

# 3. Nạp lại toàn bộ dữ liệu mẫu (Reset & Seed sạch sẽ)
npm run db:seed

# 4. Khởi chạy Server
npm start

# Hoặc chế độ Development (tự reload khi sửa code)
npm run dev
```

Server sẽ chạy tại: **`http://localhost:8080`**

---

## 📡 Danh sách các nhóm API

| Nhóm | Phương thức | Endpoint | Mô tả |
|---|---|---|---|
| **Auth** | `POST` | `/api/auth/login` | Đăng nhập tài khoản |
| | `POST` | `/api/auth/register` | Đăng ký tài khoản mới |
| | `GET` | `/api/auth/me` | Lấy thông tin tài khoản đang đăng nhập |
| **Search** | `GET` | `/api/users/search?q={keyword}&type={less\|more}` | Tìm kiếm tài khoản người dùng |
| | `GET` | `/api/videos/search?q={keyword}` | Tìm kiếm video |
| **Sidebar** | `GET` | `/api/users/suggested?page=1&per_page=5` | Danh sách gợi ý tài khoản |
| | `GET` | `/api/users/following?page=1` | Danh sách tài khoản đang Follow |
| **Profile** | `GET` | `/api/users/@:nickname` | Chi tiết trang cá nhân |
| | `PATCH` | `/api/users/@:nickname` | Cập nhật hồ sơ (Bio, Name, Avatar, Link) |
| | `GET` | `/api/users/@:nickname/videos` | Danh sách video của người dùng |
| **Follow** | `POST` | `/api/users/:id/follow` | Theo dõi tài khoản |
| | `POST` | `/api/users/:id/unfollow` | Hủy theo dõi tài khoản |
| **Video** | `GET` | `/api/videos?type={for-you\|following}` | Danh sách video Feeds (For You / Following) |
| | `GET` | `/api/videos/:id` | Chi tiết 1 video |
| | `POST` | `/api/videos` | Đăng video mới (Upload) |
| | `POST` | `/api/videos/:id/like` | Thả tim video |
| | `POST` | `/api/videos/:id/unlike` | Bỏ thả tim video |
| | `POST` | `/api/videos/:id/view` | Tăng lượt xem video |
| **Comments** | `GET` | `/api/videos/:id/comments` | Danh sách bình luận của video |
| | `POST` | `/api/videos/:id/comments` | Đăng bình luận mới (hỗ trợ reply & @mention) |
| | `POST` | `/api/comments/:id/like` | Thích bình luận |
| | `DELETE` | `/api/comments/:id` | Xóa bình luận |
| **Live** | `GET` | `/api/lives` | Danh sách phòng Livestream |
| | `GET` | `/api/lives/:id` | Chi tiết phòng livestream |
| **Notifications** | `GET` | `/api/notifications` | Danh sách thông báo tài khoản |
| | `GET` | `/api/notifications/unread-count` | Số lượng thông báo chưa đọc |
| | `PUT` | `/api/notifications/:id/read` | Đánh dấu đã đọc 1 thông báo |
| | `PUT` | `/api/notifications/read-all` | Đánh dấu đã đọc tất cả thông báo |
