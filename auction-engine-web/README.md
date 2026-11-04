# AURELIA FINE AUCTIONS &bull; GENÈVE
> **Nền Tảng Đấu Giá Trực Tuyến & Bảo Chứng Ký Quỹ Escrow Thụy Sĩ**  
> **Kiến trúc:** Realtime Multi-User Sync • BroadcastChannel + Storage Engine • Ký Quỹ Bảo Chứng Escrow 15% • Thuật toán Anti-Sniping (+30s) • Swiss Editorial Design System (Sotheby's &times; Bring a Trailer).

---

## 1. GIỚI THIỆU HỆ THỐNG
**AURELIA FINE AUCTIONS** là nền tảng đấu giá trực tuyến thời gian thực cao cấp dành cho 4 danh mục giám định: Đồng hồ Cơ Thụy Sĩ, Siêu xe & Xe Cổ Điển, Thiết bị Công nghệ Nguyên mẫu, và Tác phẩm Nghệ thuật.

- **Đồng bộ Thời Gian Thực (Multi-tab Realtime):** Sử dụng `BroadcastChannel('aurelia_realtime_sync')` và `window.addEventListener('storage', ...)` đồng bộ hóa tức thì giữa các tab trình duyệt trong < 0.1 giây mà không cần reload trang.
- **Ký Quỹ Bảo Chứng Escrow 15%:** Mọi thành viên tham gia đấu giá bắt buộc phải tạm khóa 15% giá khởi điểm để được cấp Thẻ Đấu Giá (#Paddle). Hệ thống **tự động hoàn tiền cọc 100%** về ví ngay khi phiên kết thúc nếu không trúng thầu.
- **Thuật Toán Anti-Sniping (+30s):** Nếu có người trả giá khi thời gian còn dưới 30 giây cuối cùng, hệ thống tự động gia hạn thêm +30 giây để ngăn chặn bot cướp cò phút chót.
- **Phân Định Vai Trò Rõ Ràng:**
  + **Chủ Phòng (Host):** Tạo phiên ở trạng thái `WAITING`, chủ động bấm "Khai Mạc Phiên Đấu Giá" để kích hoạt đếm ngược, bấm "Chốt Phiên & Gõ Búa" khi có người trả giá. Chủ phòng bị nghiêm cấm tự trả giá cho lô hàng của chính mình.
  + **Người Tham Gia (Bidder):** Nộp cọc 15%, giơ thẻ trả giá nhanh (+1 bước, +2 bước, +5 bước hoặc tùy chỉnh), tự động bị khóa nâng giá nếu đang giữ mức giá dẫn đầu.
- **Biên Bản Xác Nhận Kết Quả Điện Tử:** Thay thế màn hình gõ búa thô sơ bằng Chứng thư Thụy Sĩ (Official Certificate) hiển thị đầy đủ bên trúng thầu, giá gõ búa và cam kết hoàn cọc 100% cho các bên còn lại.

---

## 2. BỘ SƯU TẬP 8 LOT NIÊM YẾT CHÍNH THỨC
1. **Lot #101 (PIN #839201):** Patek Philippe Grand Complications Perpetual Calendar 5270P (Khởi điểm: 2.400.000.000 ₫ &bull; Bước: 50.000.000 ₫ &bull; Cọc 15%: 360.000.000 ₫ &bull; Trạng thái: LIVE).
2. **Lot #102 (PIN #911300):** Porsche 911 GT3 RS Weissach Package 2024 (Khởi điểm: 14.500.000.000 ₫ &bull; Bước: 200.000.000 ₫ &bull; Cọc 15%: 2.175.000.000 ₫ &bull; Trạng thái: LIVE).
3. **Lot #103 (PIN #552109):** Rolex Cosmograph Daytona Platinum Ice Blue Dial 126506 (Khởi điểm: 1.850.000.000 ₫ &bull; Bước: 50.000.000 ₫ &bull; Cọc 15%: 277.500.000 ₫ &bull; Trạng thái: LIVE).
4. **Lot #104 (PIN #488900):** Ferrari F8 Tributo Rosso Corsa Novitec Edition (Khởi điểm: 11.200.000.000 ₫ &bull; Bước: 150.000.000 ₫ &bull; Cọc 15%: 1.680.000.000 ₫ &bull; Trạng thái: WAITING - Chờ mở sàn).
5. **Lot #105 (PIN #306712):** Leica M6 TTL Titanium Limited Edition 0.72x (Khởi điểm: 320.000.000 ₫ &bull; Bước: 10.000.000 ₫ &bull; Cọc 15%: 48.000.000 ₫ &bull; Trạng thái: LIVE).
6. **Lot #106 (PIN #774120):** Tuyệt Tác Sơn Dầu "L'Aube Dorée" - Galerie de Paris (Khởi điểm: 680.000.000 ₫ &bull; Bước: 20.000.000 ₫ &bull; Cọc 15%: 102.000.000 ₫ &bull; Trạng thái: WAITING - Chờ mở sàn).
7. **Lot #107 (PIN #661982):** Audemars Piguet Royal Oak Skeleton Rose Gold 15407OR (Khởi điểm: 3.100.000.000 ₫ &bull; Bước: 50.000.000 ₫ &bull; Cọc 15%: 465.000.000 ₫ &bull; Trạng thái: LIVE).
8. **Lot #108 (PIN #209441):** Mercedes-AMG GT Black Series Collector Edition (Khởi điểm: 9.800.000.000 ₫ &bull; Bước: 100.000.000 ₫ &bull; Cọc 15%: 1.470.000.000 ₫ &bull; Trạng thái: WAITING - Chờ mở sàn).

---

## 3. BA TÀI KHOẢN MẪU TÍCH HỢP SẴN
Hệ thống tích hợp sẵn 3 tài khoản trong Modal Đổi Tài Khoản để thử nghiệm mọi kịch bản đa vai trò chỉ với 1 click:
1. **Phạm Ngọc Thắng (`#PD-6651`):** Chủ sở hữu các lô Patek Philippe, Porsche 911, Ferrari F8 &bull; Ví khả dụng: 15.000.000.000 ₫.
2. **Nguyễn Minh Quân (`#PD-8821`):** Nhà đấu giá độc lập &bull; Ví khả dụng: 10.000.000.000 ₫.
3. **Trần Hoàng Bảo (`#PD-3390`):** Nhà sưu tầm cổ vật &bull; Ví khả dụng: 8.000.000.000 ₫.

---

## 4. CẤU TRÚC THƯ MỤC
```
auction-engine-web/
├── CHAY_DEMO.bat                 <-- Tự động bật HTTP Server cục bộ hoặc mở index.html
├── index.html                    <-- Trang chủ: Hero Spotlight 1.1fr/0.9fr, Danh mục, 8 Lô niêm yết
├── auctions.html                 <-- Trang Khám Phá: Tìm kiếm từ khóa, Lọc đa danh mục, Sắp xếp giá
├── live-room.html                <-- Phòng Đấu Giá Trực Tiếp: Bục đấu giá, Đồng hồ 36px, Bàn phím trả giá, 2 Tab Sổ lệnh & Ký quỹ
├── seller-studio.html            <-- Studio Tạo Phiên: Form đa bước, 1-Click Demo Fill, Tính cọc 15%, Preview Card 360px
├── dashboard.html                <-- Trung Tâm Cá Nhân: Số dư ví, Lịch sử tạm khóa cọc, Các phiên đang tham gia
├── guide-about.html              <-- Quy chuẩn Thẩm định, Sơ đồ Anti-Sniping & Bảo chứng Escrow
├── item-detail.html              <-- Tự động điều hướng vào live-room theo mã PIN
├── login.html                    <-- Đăng nhập, Đăng ký & Đổi nhanh tài khoản mẫu
├── css/
│   ├── tokens.css                <-- Master Design Tokens (Warm Gallery Light & Dark)
│   ├── base.css                  <-- Khóa cứng SVG 18px, Khóa cứng ảnh, Typography, Buttons
│   ├── layout.css                <-- Container, 2-Tier Header, Footer, Grid Systems
│   ├── components.css            <-- Button styles, Form controls, Badges, Tables
│   └── pages.css                 <-- Bố cục chi tiết từng trang và Responsive Breakpoints
├── components/
│   ├── header.js                 <-- Header 2 tầng: PIN nhanh, Ví khả dụng, Đổi tài khoản, Logo, 5 Nav links
│   ├── footer.js                 <-- Footer 4 cột chuẩn Thụy Sĩ, Chứng nhận Lloyds $50M, Nút Reset Demo
│   └── modals.js                 <-- Modals: Nhập PIN, Đổi tài khoản, Ký quỹ 15%, Nạp tiền ví, Biên bản kết quả
└── js/
    └── app-core.js               <-- SINGLE SOURCE OF TRUTH: window.AureliaApp / window.AuctionStore
```

---

## 5. HƯỚNG DẪN KHỞI CHẠY (CLICK & RUN)

### Cách 1: Khởi chạy nhanh qua file .bat
Nhấp đúp chuột vào file `CHAY_DEMO.bat`. Tập lệnh sẽ tự động khởi chạy máy chủ Python nội bộ tại cổng `8080` và mở `http://localhost:8080/index.html`.

### Cách 2: Mở trực tiếp qua file:/// (Không cần cài đặt bất kỳ phần mềm nào)
Nhấp đúp chuột trực tiếp vào file `index.html` trong Windows File Explorer (đường dẫn dạng `file:///D:/BTLWeb/auction-engine-web/index.html`). Hệ thống được thiết kế hoàn toàn không dùng ES module thuần nên chạy mượt mà 100% offline, không lỗi CORS.

---

## 6. KỊCH BẢN THUYẾT TRÌNH DEMO (5 BƯỚC HOÀN HẢO)
1. **Bước 1: Trải nghiệm Trang Chủ (`index.html`)**
   - Giới thiệu Hero Spotlight Lot #101 Patek Philippe, ảnh hiển thị sắc nét, đếm ngược Tabular Mono.
   - Lướt qua 4 danh mục giám định (Đồng hồ, Siêu xe, Công nghệ, Nghệ thuật) và 8 lô sản phẩm niêm yết.
2. **Bước 2: Tạo Phiên Đấu Giá Mới (`seller-studio.html`)**
   - Bấm vào "+ Tạo Phiên Mới" trên thanh điều hướng.
   - Bấm nút **"Điền Nhanh Dữ Liệu Mẫu"** để tự động điền đầy đủ thông số siêu phẩm Audemars Piguet, ảnh Unsplash chuẩn, tự động tính cọc 15% (480.000.000 ₫).
   - Bấm **"Phát Hành Phiên & Mở Phòng Đấu Giá"**. Hệ thống cấp mã PIN 6 số và mở Modal chúc mừng. Bấm vào phòng đấu giá.
3. **Bước 3: Mở 2 Cửa Sổ Trình Duyệt Song Song Để Test Realtime**
   - **Cửa sổ 1 (Trái):** Là Chủ Phòng (Phạm Ngọc Thắng `#PD-6651`). Phòng ở trạng thái `WAITING`. Bấm nút **"Bắt Đầu Phiên Đấu Giá (Start Auction)"**. Phiên chuyển sang `LIVE` và đồng hồ bắt đầu đếm ngược.
   - **Cửa sổ 2 (Phải):** Mở cùng phòng, bấm "Đổi Tài Khoản" sang Nguyễn Minh Quân (`#PD-8821`). Bấm "Nộp Cọc Ký Quỹ (15%)". Thẻ đấu giá hợp lệ được cấp.
4. **Bước 4: Trả Giá & Thử Nghiệm Anti-Sniping**
   - Ở Cửa sổ 2, bấm **"+1x Bước"** -> Giá nâng lên, Cửa sổ 1 lập tức hiển thị Nguyễn Minh Quân đang dẫn đầu trong 0.1 giây.
   - Cửa sổ 2 hiển thị thông báo khóa nâng giá: "Quý khách đang giữ mức giá dẫn đầu cao nhất. Không thể tự nâng giá chính mình."
   - Ở Cửa sổ 1 (Chủ phòng), bấm **"Tua Nhanh Còn 15s"** để đưa đồng hồ vào vùng cảnh báo < 30s. Bấm trả giá để chứng kiến thuật toán Anti-Sniping tự động cộng thêm +30 giây.
5. **Bước 5: Chốt Phiên & In Biên Bản Xác Nhận Điện Tử**
   - Ở Cửa sổ 1, Chủ phòng bấm **"Chốt Phiên Ngay (Chấp Nhận Mức Giá Này)"**.
   - Màn hình hiển thị trang trọng **Biên Bản Xác Nhận Kết Quả Đấu Giá Điện Tử (Official Protocol)** ghi nhận người thắng thầu, mức giá gõ búa, và cam kết hoàn cọc 100% cho các bên còn lại.
   - Chuyển sang `dashboard.html` để kiểm tra số dư ví đã được cập nhật hoàn cọc chính xác.
