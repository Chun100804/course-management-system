# Hướng dẫn Postman Collection

Import `Course-Management.postman_collection.json` vào Postman. Mở collection variables, điền `adminEmail` và `adminPassword` bằng thông tin tài khoản Admin đã seed. Không lưu hoặc export collection kèm thông tin đăng nhập; không cần sửa request body hay điền token/ID thủ công. Request đăng ký tự tạo email học viên mới mỗi lần chạy.

Chạy các request theo thứ tự sau:

1. **Auth:** Register student, Login student, Login admin, Register second student for capacity test, Login second student.
2. **Courses:** List courses, Create course, Get course details, Update course, Create disposable course for delete, Delete empty course.
3. **Enrollments:** Enroll student, Reject duplicate enrollment, Reject enrollment when course is full, List my enrollments, List enrollments for course.
4. **Users:** Get current user.

Collection có các assertion kiểm tra mã trạng thái và role trả về (`STUDENT` khi đăng ký/đăng nhập học viên, `ADMIN` khi đăng nhập quản trị), tự sinh email học viên và tự lưu token cùng ID bản ghi vào collection variables. Gửi từng request bằng nút **Send** theo đúng thứ tự trên; không chạy riêng lẻ các request phụ thuộc token hoặc ID. Khóa học kiểm thử chính có capacity bằng 1: request ghi danh lặp xác nhận hệ thống từ chối học viên đã đăng ký; request của học viên thứ hai xác nhận hệ thống từ chối khi lớp đã hết chỗ. Các request sẽ tạo dữ liệu thử nghiệm trong database local.

Sau khi chạy request với API local đã cấu hình, lưu ảnh chụp màn hình vào `docs/screenshots/`. Ảnh cần hiển thị request body (đối với thao tác ghi dữ liệu) và response status. Không đưa mật khẩu hoặc token người dùng thật vào ảnh được commit.
