# Offline bundle

index.html dùng đường dẫn tương đối ổn định và không còn phụ thuộc vào query version. Khi chạy qua localhost hoặc GitHub Pages, cập nhật code không cần sửa lại index.html.

Nếu cần mở trực tiếp bằng file:// hoặc gửi một file duy nhất, chạy:

~~~powershell
powershell -ExecutionPolicy Bypass -File .\tools\build_offline_bundle.ps1
~~~

Lệnh tạo index.offline.html, nhúng CSS, JavaScript và toàn bộ thư mục assets thành data URI. File này nặng hơn đáng kể nhưng không còn request asset bên ngoài.

index.offline.html là file build cục bộ (~140MB, vượt giới hạn 100MB/file của GitHub) nên **không nằm trong git** (`.gitignore`) và không được deploy lên GitHub Pages. Chỉ build khi cần chơi bằng `file://` hoặc gửi một file duy nhất.

Chỉ rebuild index.offline.html khi được yêu cầu rõ ràng. Vì vậy `tools/run_regression_suite.js` mặc định bỏ qua `verify_offline_bundle`; sau khi rebuild, chạy:

~~~powershell
node tools/run_regression_suite.js --with-offline-bundle
~~~
