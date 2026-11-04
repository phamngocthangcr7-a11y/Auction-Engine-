# AURELIA FINE AUCTIONS &bull; GENÈVE
> **Đồ Án Môn Học: Lập Trình & Thiết Kế Web (Web Design & Development Project)**  
> **Nền Tảng Đấu Giá Trực Tuyến Thời Gian Thực & Ký Quỹ Bảo Chứng Escrow Chuẩn Thụy Sĩ**  
> **Live Demo (Vercel):** *Sẽ tự động cập nhật sau khi liên kết Vercel*

---

## 👥 THÀNH VIÊN NHÓM THỰC HIỆN ĐỒ ÁN (GROUP MEMBERS)

| STT | Họ và Tên Sinh Viên | Mã Số Sinh Viên (MSSV) | Vai Trò Trong Dự Án | Nhiệm Vụ Phụ Trách |
| :-: | :--- | :-: | :--- | :--- |
| **1** | **Phạm Ngọc Thắng** | **6651071071** | **Trưởng Nhóm / Lead Developer** | Kiến trúc hệ thống, Admin Portal, bảo mật OTP, Realtime Engine |
| **2** | **Phan Minh Tân** | **6651072048** | **Frontend Developer** | Bố cục trang chủ, hệ thống Design Tokens Thụy Sĩ, Responsive UI |
| **3** | **Nguyễn Minh Khôi** | **6651079912** | **Logic & State Engineer** | Cơ chế Ký quỹ Escrow 15%, thuật toán Anti-Sniping (+30s), Sổ lệnh |
| **4** | **Trần Hoàng Bảo** | **6651073390** | **UI/UX & QA Tester** | Kiểm thử luồng tương tác, thẩm định hồ sơ Lot, tối ưu hóa di động |

---

## 🏛️ GIỚI THIỆU TỔNG QUAN HỆ THỐNG
**AURELIA FINE AUCTIONS** là hệ thống sàn đấu giá trực tuyến cao cấp, lấy cảm hứng từ các nhà đấu giá danh tiếng thế giới như **Sotheby's, Phillips và Loupe This**:

- **Đồng Bộ Đa Thiết Bị Thời Gian Thực (Cross-Device Realtime):** Tích hợp công nghệ MQTT WebSocket Relay và Broadcast Engine cho phép nhiều người dùng cùng tham gia trả giá, đếm ngược và gõ búa song song không có độ trễ (< 0.1s).
- **Cơ Chế Bảo Chứng Ký Quỹ Escrow 15%:** Người mua bắt buộc ký quỹ tạm khóa 15% giá khởi điểm để nhận Thẻ Đấu Giá (#PaddleId). Khi phiên kết thúc, tiền cọc của những người không trúng thầu được **tự động hoàn trả 100%** về ví ngay tức thì.
- **Thuật Toán Gia Hạn Chống Cướp Cò Anti-Sniping (+30s):** Nếu có lệnh trả giá hợp lệ trong 30 giây cuối cùng của phiên đấu giá, đồng hồ sẽ tự động cộng thêm +30 giây nhằm đảm bảo tính công bằng tuyệt đối cho sàn.
- **Hệ Thống Phân Quyền & Quản Trị Hệ Thống (Super Admin Portal):** Quản lý toàn bộ 12 phiên đấu giá, thẩm định tài sản, xét duyệt niêm yết, khóa tài khoản vi phạm và giám sát dòng tiền ký quỹ Escrow.
- **Bảo Mật Danh Tính Tuyệt Đối (Zero Leakage):** Cấp lại mật khẩu an toàn 2 bước qua mã xác thực OTP 6 số gửi về Gmail đăng ký, che giấu thông tin nhạy cảm.

---

## 🚀 CÁCH CHẠY DỰ ÁN TRÊN MÁY CỤC BỘ (LOCAL RUN)
1. Mở thư mục dự án và nhấp đúp vào file `CHAY_DEMO.bat` để khởi chạy Live Server.
2. Trình duyệt sẽ tự động mở trang web tại địa chỉ: `http://localhost:5500/auction-engine-web/index.html`.
3. Để thử nghiệm trên điện thoại cùng mạng Wi-Fi: Bấm **[Mời Tham Gia (PIN & QR)]** trong phòng đấu giá để quét mã QR bằng Camera điện thoại.

---

## 🌐 HƯỚNG DẪN NỘP BÀI & TRẢI NGHIỆM TRỰC TUYẾN
- **Link Mã Nguồn (GitHub):** Repository này chứa toàn bộ lịch sử Commit và đóng góp của các thành viên trong nhóm.
- **Link Ứng Dụng Chạy Trực Tiếp (Vercel Live Demo):** Được triển khai tự động qua nền tảng Vercel Cloud, hỗ trợ truy cập 24/7 từ mọi trình duyệt và mạng di động (4G/5G).
