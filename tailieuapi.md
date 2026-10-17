# Nhật ký triển khai và tài liệu API

Tài liệu này ghi lại các hạng mục đã được triển khai trong phiên làm việc để người khác có thể đánh giá, tiếp tục phát triển hoặc đối chiếu với yêu cầu hệ thống quản lý khóa học.

> **Lưu ý bảo mật:** Không lưu mật khẩu, JWT, chuỗi kết nối MongoDB hoặc giá trị bí mật trong tài liệu này. Nếu một giá trị bí mật đã từng được chia sẻ hoặc đưa vào ảnh chụp màn hình, hãy thay mới giá trị đó.

## 1. Phạm vi yêu cầu

Hệ thống có hai nhóm người dùng:

- **Student (học viên):** đăng ký, đăng nhập, tìm kiếm/xem khóa học, ghi danh và xem các khóa học đã ghi danh.
- **Admin (quản trị viên):** tạo, sửa, xóa khóa học; cấu hình giảng viên, học phí, capacity; xem danh sách học viên của từng khóa.

Các tiêu chí backend quan trọng:

- Ba thực thể dữ liệu: Users, Courses, Enrollments.
- Đăng ký và đăng nhập cấp JWT.
- API được xác thực và phân quyền theo vai trò.
- Chặn ghi danh trùng và chặn ghi danh khi khóa học hết chỗ.

Các tiêu chí bàn giao:

- ERD dạng ảnh trong `docs`.
- Postman Collection trong `docs`.
- Ảnh kiểm thử request/response.
- README hướng dẫn cài đặt và sử dụng.
- Kiểm thử tự động cho nghiệp vụ quan trọng.

## 2. Những hạng mục đã triển khai

### Backend

- Đăng ký tài khoản học viên, chuẩn hóa email, băm mật khẩu bằng bcrypt.
- Đăng nhập, cấp JWT và xác minh token ở các route cần đăng nhập.
- Enum role dùng chung `ADMIN`/`STUDENT`; middleware authorize, seed, route frontend, Postman và test đều dùng các giá trị này.
- Kiểm tra request body bằng Zod.
- API xem thông tin tài khoản hiện tại.
- API danh sách/tìm kiếm, xem chi tiết, tạo, cập nhật và xóa khóa học.
- API ghi danh, xem danh sách khóa học đã ghi danh của học viên và xem danh sách học viên theo khóa.
- Ghi danh dùng cập nhật atomically trên document khóa học để giữ chỗ theo capacity; nếu tạo enrollment thất bại thì hoàn lại chỗ.
- Index duy nhất trên cặp `(studentId, courseId)` ngăn dữ liệu ghi danh trùng.
- Không cho xóa khóa học đã có ghi danh; không cho giảm capacity thấp hơn số học viên hiện tại.
- Có script seed tài khoản admin. Script chỉ tạo khi email chưa tồn tại, không tự ghi đè tài khoản hiện hữu.
- Xử lý một số lỗi phổ biến gồm dữ liệu không hợp lệ, JSON sai định dạng và duplicate key.

### Frontend

- Trang chủ lấy danh sách khóa học từ API, tìm kiếm theo tên khóa học/giảng viên.
- Trang chi tiết khóa học hiển thị giảng viên, mô tả, học phí, số chỗ và thao tác ghi danh.
- Đăng ký, đăng nhập, đăng xuất.
- Sau khi đăng nhập hoặc đăng ký, Student được chuyển về trang chủ để xem khóa học; Admin được chuyển vào trang quản trị.
- Menu Student được giữ nguyên giữa trang chủ, danh sách khóa học cá nhân và trang chi tiết; mục “Khóa học của tôi” liệt kê các khóa đã ghi danh với liên kết xem chi tiết.
- Tự gửi bearer token trong request API; khôi phục phiên bằng endpoint hồ sơ người dùng.
- Route cá nhân chỉ dành cho Student; route quản trị chỉ dành cho Admin.
- Student xem khóa học đã ghi danh.
- Admin tạo/sửa/xóa khóa học và xem danh sách học viên theo lớp.
- Thêm trạng thái tải, rỗng, lỗi và thành công cho các luồng chính.
- CSS responsive cho giao diện nhỏ và lớn.
- Chuẩn bị cấu hình deploy Vercel SPA (`vercel.json`) và Render Web Service (`render.yaml`); API dùng `PORT`, bind `0.0.0.0`, CORS lấy `WEB_ORIGIN`, MongoDB/JWT lấy từ biến môi trường.

### Tài liệu và kiểm thử

- Cập nhật README tiếng Việt với yêu cầu cài đặt, cấu hình, chạy seed, chạy ứng dụng, vai trò và bảng API.
- Tạo hướng dẫn Postman bằng tiếng Việt.
- Tạo collection Postman với 17 request cho Auth, Courses, Enrollments và Users, gồm assertion mã trạng thái, assertion role `ADMIN`/`STUDENT` và lưu token/ID vào collection variables.
- Bổ sung test nghiệp vụ ghi danh, ngoài các test Mongoose model đã có.
- ERD ảnh `docs/erd.png` đã tồn tại từ trước; cập nhật tài liệu Mermaid `docs/database/erd.md`. Ảnh ERD không được tạo lại trong phần triển khai này.

## 3. API đã triển khai

API có tiền tố `/api`. Các request đã xác thực phải gửi:

```http
Authorization: Bearer <JWT>
```

### Xác thực

#### `POST /api/auth/register`

Tạo tài khoản Student. Client không được truyền role để tự nâng quyền.

Request:

```json
{
  "name": "Nguyen Van A",
  "email": "student@example.com",
  "password": "minimum-8-characters"
}
```

Kết quả thành công: `201 Created`, gồm JWT và thông tin user không có mật khẩu.

Các trường được kiểm tra: tên từ 2 đến 100 ký tự; email đúng định dạng, tối đa 254 ký tự; mật khẩu từ 8 đến 128 ký tự. Email được chuẩn hóa chữ thường. Email đã có tài khoản trả `409 Conflict`.

#### `POST /api/auth/login`

Request:

```json
{
  "email": "student@example.com",
  "password": "minimum-8-characters"
}
```

Kết quả thành công: `200 OK`, gồm JWT và thông tin user. Sai email/mật khẩu trả `401 Unauthorized`.

### Người dùng

#### `GET /api/users/me`

- Quyền: người dùng đã đăng nhập.
- Trả về ID, tên, email và role của tài khoản hiện tại.
- Không trả về hash mật khẩu.

### Khóa học

#### `GET /api/courses?search=<từ-khóa>`

- Quyền: công khai.
- Trả danh sách khóa học; `search` tìm theo title hoặc instructor.

#### `GET /api/courses/:id`

- Quyền: công khai.
- Trả chi tiết khóa học.
- ID sai định dạng trả lỗi `400`; không tìm thấy trả `404`.

#### `POST /api/courses`

- Quyền: Admin.
- Trả `201 Created`.

Request:

```json
{
  "title": "Course title",
  "description": "Course description",
  "instructor": "Instructor name",
  "fee": 1250000,
  "capacity": 20
}
```

Validation: title 2–160 ký tự; description 2–5000 ký tự; instructor 2–120 ký tự; fee là số hữu hạn không âm; capacity là số nguyên dương.

#### `PUT /api/courses/:id`

- Quyền: Admin.
- Cập nhật một hoặc nhiều trường khóa học.
- Body phải có ít nhất một trường.
- Không được giảm capacity thấp hơn `enrolledCount`; vi phạm trả `409 Conflict`.

#### `DELETE /api/courses/:id`

- Quyền: Admin.
- Xóa khóa học chưa có enrollment và trả `204 No Content`.
- Từ chối xóa khóa học đã có enrollment bằng `409 Conflict`.

### Ghi danh

#### `POST /api/enrollments`

- Quyền: Student.
- Thành công trả `201 Created`.

Request:

```json
{
  "courseId": "<course MongoDB ObjectId>"
}
```

Quy tắc:

- ID sai định dạng trả `400`; khóa học không tồn tại trả `404`.
- Nếu học viên đã ghi danh khóa này, trả `409 Conflict`.
- Nếu khóa học đủ chỗ, trả `409 Conflict`.
- Capacity được giữ bằng thao tác tăng `enrolledCount` có điều kiện nguyên tử (`enrolledCount < capacity`).
- Nếu tạo enrollment thất bại sau khi giữ chỗ, hệ thống giảm lại `enrolledCount`.
- Unique compound index vẫn là lớp bảo vệ dữ liệu chống trùng trong trường hợp request đồng thời.

#### `GET /api/enrollments/mine`

- Quyền: Student.
- Trả danh sách ghi danh của tài khoản hiện tại, kèm thông tin khóa học.

#### `GET /api/enrollments/course/:courseId`

- Quyền: Admin.
- Trả danh sách học viên đã ghi danh khóa học, gồm tên/email học viên và thời gian ghi danh.

## 4. Phân quyền

| Tác vụ | Công khai | Student | Admin |
|---|:---:|:---:|:---:|
| Xem/tìm khóa học | Có | Có | Có |
| Đăng ký/đăng nhập | Có | Có | Có |
| Xem hồ sơ cá nhân | Không | Có | Có |
| Ghi danh khóa học | Không | Có | Không |
| Xem ghi danh cá nhân | Không | Có | Không |
| Tạo/sửa/xóa khóa học | Không | Không | Có |
| Xem danh sách học viên theo khóa | Không | Không | Có |

Public registration luôn gán role Student. Tài khoản Admin được cấp thông qua script seed, không qua form đăng ký.

## 5. Tệp thay đổi chính

### API

- `apps/api/src/routes/index.ts`: đăng ký các router API.
- `apps/api/src/common/middleware/authenticate.ts`, `authorize.ts`, `validate.ts`: xác thực, phân quyền và validation.
- `apps/api/src/common/constants/roles.ts`: tái xuất enum role dùng chung từ `@cms/shared`.
- `packages/shared/src/constants/roles.ts`: nguồn enum role chuẩn `ADMIN` và `STUDENT`.
- `apps/api/src/common/utils/jwt.ts`, `password.ts`, `asyncHandler.ts`: helper JWT, bcrypt và async route handler.
- `apps/api/src/modules/auth/`: schema, service, controller và routes cho đăng ký/đăng nhập.
- `apps/api/src/modules/users/`: repository/service/controller/route cho hồ sơ hiện tại.
- `apps/api/src/modules/courses/`: repository/service/controller/route/schema cho khóa học.
- `apps/api/src/modules/enrollments/`: repository/service/controller/route/schema và test nghiệp vụ ghi danh.
- `apps/api/src/integration/api.integration.test.ts`: 8 kiểm thử tích hợp API bằng Supertest và MongoDB in-memory thật, không mock model/repository.
- `apps/api/src/test/setup.ts`, `apps/api/vitest.config.ts`: môi trường Vitest và cấu hình integration hooks/timeouts.
- `apps/api/src/app.ts`: export Express app độc lập với listener để Supertest có thể gửi request trực tiếp; `src/server.ts` là nơi kết nối DB và gọi `listen()`.
- `apps/api/src/scripts/seed.ts`: tạo tài khoản Admin ban đầu.
- `apps/api/.env.example`, `apps/api/package.json`: biến môi trường, lệnh seed và devDependencies kiểm thử.

### Web

- `apps/web/src/app/router.tsx`, `RequireRole.tsx`, `providers.tsx`: router, bảo vệ route và cung cấp auth context.
- `apps/web/src/features/auth/context/AuthContext.tsx`: trạng thái đăng nhập, restore session, sign-in/sign-up/logout.
- `apps/web/src/features/auth/pages/LoginPage.tsx`, `RegisterPage.tsx`: màn hình xác thực.
- `apps/web/src/features/courses/pages/CourseListPage.tsx`, `CourseDetailPage.tsx`: tra cứu và chi tiết khóa học.
- `apps/web/src/features/courses/pages/AdminCoursesPage.tsx`: CRUD khóa học cho Admin.
- `apps/web/src/features/enrollments/pages/MyCoursesPage.tsx`, `AdminEnrollmentsPage.tsx`: danh sách ghi danh cho Student/Admin.
- `apps/web/src/layouts/`: layout công khai, học viên và quản trị.
- `apps/web/src/lib/axios.ts`, `errors.ts`: API client và thông báo lỗi.
- `apps/web/src/styles/globals.css`: giao diện và responsive.

### Tài liệu và kiểm thử

- `README.md`: hướng dẫn tổng quan bằng tiếng Việt.
- `docs/api/postman/Course-Management.postman_collection.json`: Postman Collection.
- `docs/api/postman/README.md`: cách import và chạy collection bằng tiếng Việt.
- `docs/database/erd.md`: mô tả ERD bằng Mermaid.
- `docs/erd.png`: ảnh ERD đã có trong repository trước khi cập nhật tài liệu.
- `apps/api/src/modules/enrollments/enrollment.service.test.ts`: test cho trùng enrollment, hết chỗ, ghi danh thành công và request trùng đồng thời.
- `apps/api/src/common/middleware/authorize.test.ts`: kiểm tra Admin được phép và Student bị từ chối trên route yêu cầu Admin.
- `apps/api/src/modules/models.test.ts`: test model đã có, vẫn chạy cùng bộ test API.

### Phạm vi kiểm thử tích hợp API

Integration test kết nối app Express trực tiếp với `mongodb-memory-server`, tạo/xóa dữ liệu MongoDB thật giữa các test và không mock repository/model. Các kịch bản bao gồm:

1. Đăng ký `201`, email trùng `409`, mật khẩu dưới 8 ký tự `400`.
2. Đăng nhập đúng `200` có token, sai mật khẩu `401`.
3. Gọi `GET /api/users/me` không token trả `401`.
4. Student gọi `POST`/`PUT`/`DELETE /api/courses` trả `403`; Admin CRUD thành công.
5. Admin gọi `POST /api/enrollments` trả `403`.
6. Student ghi danh thành công `201`; ghi danh trùng trả `409`.
7. Hai Student gọi ghi danh đồng thời vào khóa capacity 1: đúng một response `201`, một response `409`; MongoDB xác nhận `enrolledCount` và số enrollment đều bằng 1.
8. Xóa khóa có enrollment trả `409`; giảm capacity xuống dưới số enrollment hiện tại trả `409`.

## 6. Chạy ứng dụng và tạo tài khoản Admin

Yêu cầu Node.js 20+ và MongoDB.

1. Cài dependencies:

   ```sh
   npm install
   ```

2. Tạo cấu hình API trên Windows PowerShell:

   ```powershell
   Copy-Item apps\api\.env.example apps\api\.env
   ```

3. Điền `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL` và `ADMIN_PASSWORD` vào `apps/api/.env`. Mật khẩu Admin cần tối thiểu 12 ký tự. Không commit `.env`.

4. Seed Admin:

   ```sh
   npm run seed --workspace=@cms/api
   ```

5. Chạy frontend và API:

   ```sh
   npm run dev
   ```

Mặc định web chạy tại `http://localhost:5173`, API tại `http://localhost:3000`.

## 7. Chạy Postman

Collection: `docs/api/postman/Course-Management.postman_collection.json`.

1. Import collection vào Postman.
2. Điền `adminEmail` và `adminPassword` trong collection variables, dùng tài khoản đã seed.
3. Chạy các request theo thứ tự trong `docs/api/postman/README.md`.
4. Collection tự sinh email học viên và lưu token/ID để dùng trong các request kế tiếp.
5. Các request ghi danh kiểm tra ghi danh thành công, ghi danh trùng và lớp đã đủ chỗ.

Các screenshot phản hồi thực tế chưa được tạo trong phần triển khai này. Cần chạy Postman với API và MongoDB local đã cấu hình, sau đó lưu ảnh hiển thị request body và response status vào `docs/screenshots/`. Không commit ảnh có mật khẩu/token thật.

## 8. Kiểm thử đã chạy

Các lệnh dưới đây đã chạy thành công:

```sh
npm run lint
npm test
npm run typecheck
npm run build
```

Kết quả `npm test`: API có 4 test files, 20 tests passed (8 integration tests cùng các test unit/model); workspace web chưa có test file và Vitest kết thúc thành công với thông báo không tìm thấy test. Lint, typecheck và build API/web đều thành công.

Đã xác thực cú pháp JSON của Postman Collection và chạy `git diff --check`.

## 9. Giới hạn và việc cần xác minh tiếp

- Bộ test API tích hợp chạy thành công với MongoDB in-memory; chưa chạy Postman collection với MongoDB/API server riêng đang hoạt động.
- Chưa thực thi các request Postman tới server thật và chưa chụp ảnh bằng chứng API.
- Ảnh `docs/erd.png` đã có từ trước; nội dung ảnh chưa được tái sinh sau khi cập nhật Mermaid source.
- Đăng xuất JWT được thực hiện phía client bằng cách xóa token; JWT stateless không có cơ chế thu hồi token phía server.
- Vai trò quản trị thống nhất là `ADMIN`; `STAFF` không phải role riêng trong phiên bản này.
- Chưa có màn hình quản trị CRUD Users; phạm vi đã triển khai tập trung vào CRUD Courses và quản lý danh sách Enrollments theo yêu cầu chính.

## 10. Lịch sử công việc trong phiên

1. Kiểm tra scaffold API/frontend và xác nhận các router ban đầu chưa được nối.
2. Hoàn thiện backend auth, role, validation, users, course CRUD và enrollment.
3. Bổ sung xử lý capacity nguyên tử, duplicate enrollment, xóa khóa đã ghi danh và chỉnh capacity.
4. Xây dựng frontend Student/Admin, luồng auth, trang danh sách/chi tiết và trang cá nhân/quản trị.
5. Thêm seed admin, Postman Collection, README tiếng Việt và test nghiệp vụ.
6. Chạy lint, test, typecheck, build và kiểm tra JSON collection/diff.
7. Việt hóa các file Markdown hướng dẫn, tạo tài liệu lịch sử này để bàn giao cho người đánh giá tiếp theo.
8. Bổ sung Supertest và mongodb-memory-server; thêm 8 kiểm thử API tích hợp dùng MongoDB thật trong bộ nhớ; chạy `npm test`, lint, typecheck và build thành công.
