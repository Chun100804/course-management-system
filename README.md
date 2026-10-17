# Hệ thống quản lý khóa học

Ứng dụng quản lý khóa học responsive, gồm frontend React/TypeScript và API Express/MongoDB. Học viên có thể tìm hiểu và ghi danh khóa học; quản trị viên có thể quản lý khóa học và theo dõi danh sách học viên của từng lớp.

## Yêu cầu

- Node.js phiên bản 20 trở lên và npm
- MongoDB chạy cục bộ hoặc một MongoDB URI có thể kết nối

## Cài đặt

1. Cài các gói phụ thuộc tại thư mục gốc dự án:

   ```sh
   npm install
   ```

2. Cấu hình API:

   ```powershell
   Copy-Item apps\api\.env.example apps\api\.env
   ```

   Cập nhật `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL` và `ADMIN_PASSWORD` trong `apps/api/.env`. Hãy dùng secret riêng cho môi trường local và mật khẩu quản trị dài ít nhất 12 ký tự. Không commit file `.env`.

3. Có thể cấu hình `apps/web/.env` bằng cách sao chép từ `apps/web/.env.example`. Mặc định, web app gửi request đến `http://localhost:3000/api`.

4. Tạo tài khoản quản trị ban đầu:

   ```sh
   npm run seed --workspace=@cms/api
   ```

   Script seed chỉ tạo tài khoản khi email cấu hình chưa được sử dụng; không ghi đè tài khoản đã tồn tại.

5. Khởi động frontend và API:

   ```sh
   npm run dev
   ```

   Web app chạy tại `http://localhost:5173`; API chạy tại `http://localhost:3000`.

## Deploy miễn phí với Vercel, Render và MongoDB Atlas

Frontend được deploy trên Vercel, API trên Render; cả hai workspace dùng chung `packages/shared` qua npm workspaces. Không deploy từ thư mục `apps/web` riêng lẻ: cấu hình Vercel với **Root Directory** là thư mục gốc repository để npm cài được workspace `@cms/shared`.

### Render (API)

Có thể tạo Web Service từ `render.yaml` tại repository root hoặc nhập cấu hình thủ công:

- **Root Directory:** repository root
- **Runtime:** Node
- **Build Command:** `npm ci --include=dev && npm run build --workspace=@cms/api`
- **Start Command:** `npm run start --workspace=@cms/api`

Nhập các biến môi trường sau trong Render:

| Biến | Giá trị |
|---|---|
| `NODE_ENV` | `production` |
| `WEB_ORIGIN` | Origin của frontend Vercel, ví dụ `https://ten-du-an.vercel.app` (không thêm path hoặc dấu `/` cuối) |
| `MONGODB_URI` | MongoDB Atlas connection string; thay username/password bằng thông tin DB user và mã hóa ký tự đặc biệt trong URI |
| `JWT_SECRET` | Secret ngẫu nhiên riêng cho production, tối thiểu 32 ký tự; Blueprint có thể tự sinh giá trị |

Render tự cấp `PORT`; API lắng nghe trên `0.0.0.0` và dùng biến này. Không cần tự cấu hình `PORT`. Cho phép IP kết nối trong Atlas Network Access theo hướng dẫn Atlas; nếu chọn `0.0.0.0/0` để dùng với IP động của dịch vụ cloud, hãy dùng DB user có quyền tối thiểu và mật khẩu mạnh.

Sau deploy, lấy URL API Render, ví dụ `https://ten-api.onrender.com`. API endpoint có tiền tố `/api`.

### Vercel (frontend)

Tạo Project từ cùng repository và cấu hình:

- **Root Directory:** `.` (repository root)
- **Framework Preset:** Vite
- **Build Command:** `npm run build --workspace=@cms/web`
- **Output Directory:** `apps/web/dist`
- **Install Command:** `npm ci`

`vercel.json` chứa các lệnh trên và rewrite SPA về `index.html`, nên các route React Router như `/courses/:id` và `/my-courses` hoạt động khi tải trực tiếp.

Thêm Environment Variable cho Production (và Preview nếu muốn thử preview):

| Biến | Giá trị |
|---|---|
| `VITE_API_BASE_URL` | URL API Render kèm `/api`, ví dụ `https://ten-api.onrender.com/api` |

Sau khi có domain Vercel ổn định, đặt đúng origin đó vào `WEB_ORIGIN` của Render. CORS hiện cho phép một origin chính xác; khi đổi domain Vercel cần cập nhật biến và deploy lại API.

### MongoDB Atlas và tạo Admin

Trong Atlas, tạo cluster (nếu chưa có), database user riêng, cấu hình Network Access và lấy MongoDB connection string từ mục Connect. Đặt chuỗi đó chỉ vào `MONGODB_URI` trên Render; không commit URI hoặc ghi vào `vercel.json`.

Tạo Admin một lần bằng script seed với `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL` và `ADMIN_PASSWORD` được cấp qua môi trường bảo mật; có thể chạy từ máy local trỏ vào Atlas. `ADMIN_PASSWORD` cần ít nhất 12 ký tự. Không bật đăng ký Admin công khai. Để tiết kiệm chi phí, chọn gói miễn phí phù hợp của Render/Vercel/Atlas và lưu ý dịch vụ miễn phí có thể sleep, giới hạn tài nguyên hoặc thay đổi điều khoản.

## Vai trò và chức năng

- **Student (học viên):** đăng ký/đăng nhập, tìm kiếm và xem khóa học, ghi danh mỗi khóa tối đa một lần, xem danh sách khóa học đã ghi danh tại trang cá nhân.
- **Admin (quản trị viên, role `ADMIN`):** tạo, cập nhật và xóa khóa học; cấu hình giảng viên, học phí và sĩ số; xem danh sách học viên từng lớp. Không thể xóa khóa học đã có ghi danh hoặc giảm sức chứa xuống thấp hơn số học viên hiện tại.
- Đăng ký công khai luôn tạo tài khoản học viên. Tài khoản quản trị được cấp riêng bằng lệnh seed.
- Các giá trị role thống nhất trong enum dùng chung: `ADMIN` và `STUDENT`. Không có role `STAFF` riêng trong phiên bản hiện tại.

## API

Tất cả endpoint có tiền tố `/api`. Các endpoint cần đăng nhập nhận token qua header `Authorization: Bearer <token>`.

| Phương thức | Endpoint | Quyền truy cập | Chức năng |
|---|---|---|---|
| POST | `/auth/register` | Công khai | Đăng ký học viên |
| POST | `/auth/login` | Công khai | Đăng nhập và nhận JWT |
| GET | `/users/me` | Đã đăng nhập | Lấy hồ sơ người dùng hiện tại |
| GET | `/courses?search=` | Công khai | Liệt kê/tìm kiếm khóa học |
| GET | `/courses/:id` | Công khai | Xem chi tiết khóa học |
| POST | `/courses` | Admin | Tạo khóa học |
| PUT | `/courses/:id` | Admin | Cập nhật khóa học |
| DELETE | `/courses/:id` | Admin | Xóa khóa học chưa có ghi danh |
| POST | `/enrollments` | Student | Ghi danh khóa học |
| GET | `/enrollments/mine` | Student | Liệt kê khóa học đã ghi danh của học viên hiện tại |
| GET | `/enrollments/course/:courseId` | Admin | Liệt kê học viên đã ghi danh khóa học |

API ghi danh bảo đảm mỗi cặp học viên/khóa học là duy nhất và giữ chỗ bằng kiểm tra sức chứa nguyên tử. Ghi danh trùng hoặc khóa học đã hết chỗ sẽ bị từ chối với HTTP 409.

## Cách chạy test

```sh
npm test
npm test --workspace=@cms/api
npm run typecheck
npm run lint
npm run build
```

`npm test` chạy test của các workspace. Backend có unit test và integration test dùng Supertest cùng MongoDB Memory Server; không cần MongoDB cài/chạy riêng cho integration test. Lần chạy đầu có thể cần tải MongoDB binary cho memory server.

## Cấu trúc thư mục docs

```text
docs/
├── api/
│   └── postman/
│       ├── Course-Management.postman_collection.json
│       └── README.md
├── database/
│   └── erd.md
├── screenshots/
└── erd.png
```

- `docs/erd.png`: ảnh ERD đã render.
- `docs/database/erd.md`: mã Mermaid và mô tả schema.
- `docs/api/postman/`: Postman Collection và hướng dẫn chạy API.
- `docs/screenshots/`: ảnh kiểm thử request/response; lưu ảnh thực tế sau khi chạy Postman, không đưa token hoặc mật khẩu thật vào ảnh.

## Cấu trúc workspace

- `apps/api`: Express API, Mongoose models, kiểm tra dữ liệu, xác thực JWT và phân quyền.
- `apps/web`: React app, các route được bảo vệ cho học viên/quản trị viên, giao diện responsive.
- `packages/shared`: hằng số và kiểu dữ liệu dùng chung.
- `docs`: ERD, API Collection và minh chứng kiểm thử.
