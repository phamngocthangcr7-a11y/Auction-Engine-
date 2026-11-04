/**
 * AUCTION ENGINE - MOCK DATA REPOSITORY
 * Cơ sở dữ liệu 20 phiên đấu giá độc quyền (Đồng hồ cơ, Siêu xe, Công nghệ hiếm, Nghệ thuật số & Cổ vật)
 * Tương thích 100% cả mở trực tiếp file:// (double click) lẫn qua Web Server.
 */

const now = Date.now();
const HOUR = 3600 * 1000;
const MINUTE = 60 * 1000;

const INITIAL_AUCTION_ITEMS = [
  // ==========================================
  // NHÓM 1: ĐỒNG HỒ CƠ THỤY SĨ (TIMEPIECES)
  // ==========================================
  {
    id: "lot-watch-01",
    title: "Patek Philippe Grandmaster Chime Ref. 6300G-010 White Gold",
    slug: "patek-philippe-grandmaster-chime-6300g",
    category: "watches",
    categoryName: "Đồng hồ Cơ Thụy Sĩ",
    shortDesc: "Tuyệt phẩm đồng hồ đeo tay phức tạp nhất thế giới với 20 biến năng cơ học và 2 mặt số xoay đảo chiều độc quyền.",
    fullDesc: "Patek Philippe Grandmaster Chime Ref. 6300G là đỉnh cao tinh hoa của kỹ nghệ chế tác đồng hồ Geneva. Sở hữu 20 complications phức tạp gồm 5 chế độ điểm chuông báo giờ (Grand Sonnerie, Petite Sonnerie, Minute Repeater, Báo thức ngày và Chuông báo chu kỳ ngày tháng), lịch vạn niên tức thời với hiển thị 4 chữ số năm. Vỏ vàng trắng 18K chạm khắc thủ công hoa văn Clous de Paris tinh xảo.",
    startingBid: 3200000,
    currentBid: 4850000,
    minIncrement: 50000,
    buyNowPrice: 6500000,
    reservePrice: 4000000,
    status: "LIVE",
    featured: true,
    startTime: new Date(now - 48 * HOUR).toISOString(),
    endTime: new Date(now + 18 * MINUTE + 45 * 1000).toISOString(),
    images: [
      "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1547996160-71dfabb1b22e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80"
    ],
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    appraisalCertificate: {
      certNumber: "CH-PP-2026-9921",
      inspector: "Geneva Horological Inspection Bureau",
      date: "2026-08-15",
      conditionScore: "9.9/10 (Mint Pristine)",
      provenance: "Bộ sưu tập Hoàng gia Liechtenstein"
    },
    specs: {
      "Thương hiệu": "Patek Philippe",
      "Bộ máy (Movement)": "Caliber 300 GS AL 36-750 QIS FUS IRM",
      "Đường kính vỏ": "47.7 mm",
      "Độ dày": "16.07 mm",
      "Chất liệu": "Vàng trắng 18K nguyên khối",
      "Dây đeo": "Da cá sấu Alligator vảy vuông khâu tay",
      "Dự trữ năng lượng": "72 giờ"
    },
    bidCount: 42,
    viewerCount: 284,
    bidHistory: [
      { id: "b1", bidderName: "@Geneva_Vault", amount: 4850000, time: "3 phút trước", type: "MANUAL" },
      { id: "b2", bidderName: "@Zurich_Time", amount: 4800000, time: "11 phút trước", type: "AUTO_BID" },
      { id: "b3", bidderName: "@Alex_Collector", amount: 4750000, time: "25 phút trước", type: "MANUAL" },
      { id: "b4", bidderName: "@Tokyo_Dynasty", amount: 4600000, time: "1 giờ trước", type: "MANUAL" }
    ],
    seller: {
      name: "Heritage Horology Geneva Ltd.",
      rating: 5.0,
      verified: true
    }
  },
  {
    id: "lot-watch-02",
    title: "Rolex Cosmograph Daytona Paul Newman Ref. 6239 Exotic Dial 1968",
    slug: "rolex-cosmograph-daytona-paul-newman-6239",
    category: "watches",
    categoryName: "Đồng hồ Cơ Thụy Sĩ",
    shortDesc: "Huyền thoại mặt số Exotic ba màu nguyên bản 1968, tình trạng lưu trữ bảo tàng kèm hộp sổ gốc.",
    fullDesc: "Rolex Daytona 6239 mang biệt danh Paul Newman là một trong những biểu tượng đắt giá nhất lịch sử đấu giá đồng hồ. Chiếc đồng hồ sở hữu mặt số Exotic dial màu kem tương phản viền đen, cọc số Art Deco đầu vuông đặc trưng và kim chỉ chronograph màu đỏ nổi bật. Vẫn giữ nguyên bộ máy lên dây cót Valjoux 722 nguyên bản chưa qua đánh bóng.",
    startingBid: 1200000,
    currentBid: 2150000,
    minIncrement: 25000,
    buyNowPrice: 3200000,
    reservePrice: 1800000,
    status: "LIVE",
    featured: true,
    startTime: new Date(now - 72 * HOUR).toISOString(),
    endTime: new Date(now + 3 * HOUR + 20 * MINUTE).toISOString(),
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80"
    ],
    appraisalCertificate: {
      certNumber: "RLX-PN-1968-883",
      inspector: "Sotheby's Watch Department",
      date: "2026-07-20",
      conditionScore: "9.7/10 (All Original Vintage)",
      provenance: "Gia đình nhà vô địch đua xe Daytona"
    },
    specs: {
      "Thương hiệu": "Rolex",
      "Model": "Cosmograph Daytona 6239",
      "Năm sản xuất": "1968",
      "Bộ máy": "Caliber Valjoux 722",
      "Đường kính": "36.5 mm",
      "Chất liệu": "Thép không gỉ 904L"
    },
    bidCount: 31,
    viewerCount: 198,
    bidHistory: [
      { id: "b20", bidderName: "@Monaco_Trader", amount: 2150000, time: "8 phút trước", type: "MANUAL" },
      { id: "b21", bidderName: "@Rolex_Passion", amount: 2125000, time: "42 phút trước", type: "MANUAL" }
    ],
    seller: {
      name: "Vintage Vault Monaco",
      rating: 4.9,
      verified: true
    }
  },
  {
    id: "lot-watch-03",
    title: "Audemars Piguet Royal Oak Concept Split-Seconds GMT Flying Tourbillon",
    slug: "audemars-piguet-royal-oak-concept-gmt",
    category: "watches",
    categoryName: "Đồng hồ Cơ Thụy Sĩ",
    shortDesc: "Vỏ Titanium rèn kết hợp sợi carbon siêu nhẹ, cơ chế Rattrapante Chronograph và Flying Tourbillon 3D.",
    fullDesc: "Audemars Piguet Royal Oak Concept là biểu tượng của tinh thần đổi mới tương lai. Chiếc đồng hồ sở hữu thiết kế hình bát giác huyền thoại của Gérald Genta nhưng được tái hiện với cấu trúc đa tầng mở máy (skeleton), lồng Flying Tourbillon tại vị trí 6 giờ chống lại tác động của trọng lực và tính năng bấm giờ đuổi kim cực kỳ chính xác.",
    startingBid: 850000,
    currentBid: 1420000,
    minIncrement: 20000,
    buyNowPrice: 1950000,
    reservePrice: 1200000,
    status: "LIVE",
    featured: false,
    startTime: new Date(now - 24 * HOUR).toISOString(),
    endTime: new Date(now + 8 * HOUR + 45 * MINUTE).toISOString(),
    images: [
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1200&q=80"
    ],
    appraisalCertificate: {
      certNumber: "AP-ROC-2025-104",
      inspector: "Haute Horlogerie Swiss Lab",
      date: "2026-09-02",
      conditionScore: "10/10 (Unworn)",
      provenance: "Chính hãng Audemars Piguet Le Brassus"
    },
    specs: {
      "Thương hiệu": "Audemars Piguet",
      "Bộ máy": "Calibre 4407 Tự động",
      "Chất liệu": "Titanium Cấp 5 & Gốm Ceramic đen",
      "Kháng nước": "50m",
      "Kích thước": "43 mm"
    },
    bidCount: 19,
    viewerCount: 145,
    bidHistory: [
      { id: "b31", bidderName: "@Singapore_Club", amount: 1420000, time: "15 phút trước", type: "MANUAL" }
    ],
    seller: {
      name: "Le Brassus Curators",
      rating: 5.0,
      verified: true
    }
  },
  {
    id: "lot-watch-04",
    title: "Richard Mille RM 50-03 McLaren F1 Tourbillon Split-Seconds Ultralight",
    slug: "richard-mille-rm-50-03-mclaren-f1",
    category: "watches",
    categoryName: "Đồng hồ Cơ Thụy Sĩ",
    shortDesc: "Đồng hồ bấm giờ cơ học nhẹ nhất thế giới chỉ 38 gram tính cả dây đeo, sử dụng vật liệu Graph TPT™ độc quyền F1.",
    fullDesc: "Hợp tác trực tiếp cùng đội đua McLaren F1, RM 50-03 kết hợp cấu trúc nano-graphene siêu bền nhẹ gấp 6 lần thép nhưng cứng hơn 200 lần. Cơ chế tourbillon chịu xung lực rung tới 5,000G gia tốc trọng trường trong xe đua Công thức 1.",
    startingBid: 1100000,
    currentBid: 1650000,
    minIncrement: 25000,
    buyNowPrice: 2200000,
    reservePrice: 1500000,
    status: "LIVE",
    featured: false,
    startTime: new Date(now - 12 * HOUR).toISOString(),
    endTime: new Date(now + 1 * HOUR + 15 * MINUTE).toISOString(),
    images: [
      "https://images.unsplash.com/photo-1547996160-71dfabb1b22e?auto=format&fit=crop&w=1200&q=80"
    ],
    appraisalCertificate: {
      certNumber: "RM-5003-F1-07",
      inspector: "McLaren Applied Technologies & RM",
      date: "2026-06-11",
      conditionScore: "9.9/10",
      provenance: "Chủ sở hữu bộ phận phát triển F1 Anh Quốc"
    },
    specs: {
      "Trọng lượng": "38 gram",
      "Vật liệu": "Graph TPT® & Titanium Grade 5",
      "Giới hạn": "Sản xuất chỉ 75 chiếc trên toàn cầu",
      "Bộ máy": "RM50-03 Calibre cơ học lên dây"
    },
    bidCount: 22,
    viewerCount: 210,
    bidHistory: [
      { id: "b41", bidderName: "@Woking_Collector", amount: 1650000, time: "4 phút trước", type: "MANUAL" }
    ],
    seller: {
      name: "High Octane Timepieces",
      rating: 4.9,
      verified: true
    }
  },

  // ==========================================
  // NHÓM 2: SIÊU XE & MÔ TÔ HIẾM (HYPERCARS)
  // ==========================================
  {
    id: "lot-car-01",
    title: "Pagani Zonda HP Barchetta 2017 (Số 1/3 - Phiên bản Riêng Horacio Pagani)",
    slug: "pagani-zonda-hp-barchetta-2017",
    category: "hypercars",
    categoryName: "Siêu xe & Mô tô hiếm",
    shortDesc: "Tác phẩm siêu xe độc bản mui trần không kính chắn gió truyền thống, động cơ Mercedes-AMG V12 7.3L hút khí tự nhiên.",
    fullDesc: "Zonda HP Barchetta là đỉnh cao di sản dòng họ Zonda. Chiếc xe được Horacio Pagani đặt tên viết tắt theo tên mình nhân kỷ niệm sinh nhật lần thứ 60. Toàn bộ thân xe chế tác từ hợp kim Carbo-Titanium HP62, hệ thống treo rocker lấy cảm hứng từ xe đua Le Mans và hộp số sàn 6 cấp thuần chất cơ học tạo cảm giác lái thuần khiết nhất.",
    startingBid: 14000000,
    currentBid: 17800000,
    minIncrement: 100000,
    buyNowPrice: 22000000,
    reservePrice: 16000000,
    status: "LIVE",
    featured: true,
    startTime: new Date(now - 36 * HOUR).toISOString(),
    endTime: new Date(now + 42 * MINUTE + 12 * 1000).toISOString(),
    images: [
      "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80"
    ],
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    appraisalCertificate: {
      certNumber: "PAG-HPB-01-IT",
      inspector: "Pagani Rinascimento Certified",
      date: "2026-05-18",
      conditionScore: "9.95/10 (Chỉ lăn bánh 380 km)",
      provenance: "San Cesario sul Panaro Pagani Atelier"
    },
    specs: {
      "Động cơ": "Mercedes-AMG 7.3L V12 N/A",
      "Công suất": "789 mã lực / 850 Nm",
      "Hộp số": "Sàn 6 cấp cơ học thuần túy",
      "Trọng lượng": "1,250 kg",
      "0 - 100 km/h": "3.1 giây",
      "Tốc độ tối đa": "355 km/h"
    },
    bidCount: 56,
    viewerCount: 420,
    bidHistory: [
      { id: "bc1", bidderName: "@Sheikh_Khalifa", amount: 17800000, time: "2 phút trước", type: "MANUAL" },
      { id: "bc2", bidderName: "@Silicon_Motors", amount: 17700000, time: "14 phút trước", type: "AUTO_BID" },
      { id: "bc3", bidderName: "@Hypercar_Vault", amount: 17500000, time: "30 phút trước", type: "MANUAL" }
    ],
    seller: {
      name: "Modena Prestige Concierge",
      rating: 5.0,
      verified: true
    }
  },
  {
    id: "lot-car-02",
    title: "Koenigsegg Jesko Attack 'Odin' Full Gold Leaf & Naked Carbon",
    slug: "koenigsegg-jesko-attack-odin",
    category: "hypercars",
    categoryName: "Siêu xe & Mô tô hiếm",
    shortDesc: "Vỏ carbon trần dát vàng 24K thủ công, công suất 1,600 mã lực cùng hộp số LST 9 cấp Light Speed Transmission 7 ly hợp.",
    fullDesc: "Jesko 'Odin' là phiên bản tùy biến tối thượng từ xưởng Ängelholm Thụy Điển. Động cơ V8 5.0L twin-turbo với trục khuỷu phẳng nhẹ nhất thế giới (12.5 kg), tạo ra lực ép xuống mặt đường (downforce) kỷ lục lên tới 1,400 kg ở tốc độ cao.",
    startingBid: 3800000,
    currentBid: 5100000,
    minIncrement: 50000,
    buyNowPrice: 6500000,
    reservePrice: 4500000,
    status: "LIVE",
    featured: false,
    startTime: new Date(now - 20 * HOUR).toISOString(),
    endTime: new Date(now + 5 * HOUR + 10 * MINUTE).toISOString(),
    images: [
      "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=80"
    ],
    appraisalCertificate: {
      certNumber: "KOEN-JESKO-ODIN",
      inspector: "Swedish Hypercar Inspection",
      date: "2026-07-08",
      conditionScore: "10/10 Mới xuất xưởng",
      provenance: "Chủ xe đầu tiên tại Stockholm"
    },
    specs: {
      "Động cơ": "5.0L V8 Twin-Turbo Flat-plane",
      "Nhiên liệu E85": "1,600 mã lực / 1,500 Nm",
      "Hộp số": "9 cấp LST (Light Speed Transmission)",
      "Downforce": "1,400 kg ở 250 km/h"
    },
    bidCount: 28,
    viewerCount: 260,
    bidHistory: [
      { id: "bc21", bidderName: "@Nordic_Supercars", amount: 5100000, time: "18 phút trước", type: "MANUAL" }
    ],
    seller: {
      name: "Nordic Apex Vault",
      rating: 4.9,
      verified: true
    }
  },
  {
    id: "lot-car-03",
    title: "Ferrari 250 GTO 1962 Scaglietti Chassis #3413 (Series II Bodywork)",
    slug: "ferrari-250-gto-1962-chassis-3413",
    category: "hypercars",
    categoryName: "Siêu xe & Mô tô hiếm",
    shortDesc: "Chén thánh vĩ đại nhất của thương hiệu Ngựa chồm Maranello, từng vô địch giải đua Targa Florio 1963.",
    fullDesc: "Khung gầm #3413 là chiếc thứ 3 trong tổng số 36 chiếc Ferrari 250 GTO từng được tạo ra. Được trang bị động cơ Tipo 168/62 Comp 3.0L V12 huyền thoại, xe có lịch sử thi đấu không hề gặp tai nạn và giữ nguyên vẹn 100% linh kiện cơ khí được Ferrari Classiche cấp chứng nhận.",
    startingBid: 42000000,
    currentBid: 56500000,
    minIncrement: 500000,
    buyNowPrice: 70000000,
    reservePrice: 50000000,
    status: "LIVE",
    featured: true,
    startTime: new Date(now - 120 * HOUR).toISOString(),
    endTime: new Date(now + 1 * HOUR + 5 * MINUTE).toISOString(),
    images: [
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80"
    ],
    appraisalCertificate: {
      certNumber: "FER-CLASSICHE-3413",
      inspector: "Ferrari Classiche Maranello",
      date: "2026-04-12",
      conditionScore: "9.9/10 Concours d'Elegance Best of Show",
      provenance: "Bảo tàng xe đua quốc gia Ý"
    },
    specs: {
      "Năm sản xuất": "1962",
      "Khung gầm": "Chassis #3413 GT",
      "Động cơ": "3.0L Colombo V12 (300 mã lực)",
      "Lịch sử thi đấu": "15 chiến thắng chung cuộc thập niên 60"
    },
    bidCount: 39,
    viewerCount: 680,
    bidHistory: [
      { id: "bc31", bidderName: "@Scuderia_Heritage", amount: 56500000, time: "6 phút trước", type: "MANUAL" },
      { id: "bc32", bidderName: "@Silverstone_Investor", amount: 56000000, time: "22 phút trước", type: "AUTO_BID" }
    ],
    seller: {
      name: "Maranello Heritage Archive",
      rating: 5.0,
      verified: true
    }
  },

  // ==========================================
  // NHÓM 3: CÔNG NGHỆ & BẢN MẪU HIẾM (RARE TECH)
  // ==========================================
  {
    id: "lot-tech-01",
    title: "Apple-1 Computer 1976 Nguyên bản Hoạt động Hoàn hảo (Ký tay bởi Steve Wozniak)",
    slug: "apple-1-computer-1976-steve-wozniak",
    category: "tech",
    categoryName: "Công nghệ & Bản mẫu hiếm",
    shortDesc: "Một trong 63 bo mạch Apple-1 còn tồn tại trên thế giới, vẫn khởi động hiển thị màn hình BASIC và có chữ ký tay Woz.",
    fullDesc: "Sản phẩm khai sinh ra tập đoàn công nghệ có giá trị vốn hóa lớn nhất hành tinh. Chiếc Apple-1 này được Steve Jobs và Steve Wozniak hàn bằng tay tại gara nhà Jobs năm 1976. Đi kèm bộ chuyển đổi nguồn nguyên bản Datanetics ASCII Keyboard, màn hình Sanyo 4205 Monitor và băng từ cassette lưu trữ ngôn ngữ Apple BASIC.",
    startingBid: 600000,
    currentBid: 920000,
    minIncrement: 10000,
    buyNowPrice: 1400000,
    reservePrice: 800000,
    status: "LIVE",
    featured: true,
    startTime: new Date(now - 40 * HOUR).toISOString(),
    endTime: new Date(now + 26 * MINUTE + 30 * 1000).toISOString(),
    images: [
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80"
    ],
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    appraisalCertificate: {
      certNumber: "APL1-HIST-083",
      inspector: "Computer History Museum California",
      date: "2026-06-25",
      conditionScore: "10/10 (Fully Operational & Diagnostic Passed)",
      provenance: "Cựu kỹ sư phần mềm Apple thời kỳ đầu"
    },
    specs: {
      "Vi xử lý": "MOS 6502 @ 1.0 MHz",
      "RAM": "4 KB (nâng cấp 8 KB)",
      "Bộ nhớ": "Băng từ Cassette Interface Card",
      "Chứng nhận": "Chữ ký trực tiếp của Steve Wozniak 'Woz'"
    },
    bidCount: 45,
    viewerCount: 380,
    bidHistory: [
      { id: "bt1", bidderName: "@Silicon_Curator", amount: 920000, time: "1 phút trước", type: "MANUAL" },
      { id: "bt2", bidderName: "@Tokyo_Tech_Vault", amount: 910000, time: "12 phút trước", type: "AUTO_BID" },
      { id: "bt3", bidderName: "@Cupertino_Collector", amount: 890000, time: "35 phút trước", type: "MANUAL" }
    ],
    seller: {
      name: "Palo Alto Silicon Archives",
      rating: 5.0,
      verified: true
    }
  },
  {
    id: "lot-tech-02",
    title: "Leica 0-Series Prototype 1923 (Thân máy #105 - Của Oskar Barnack)",
    slug: "leica-0-series-prototype-1923-105",
    category: "tech",
    categoryName: "Công nghệ & Bản mẫu hiếm",
    shortDesc: "Bản mẫu thử nghiệm khai sinh định dạng nhiếp ảnh 35mm hiện đại, từng thuộc sở hữu cá nhân của cha đẻ Leica.",
    fullDesc: "Chỉ có 22 chiếc Leica 0-Series được Ernst Leitz sản xuất thử nghiệm vào năm 1923 trước khi đưa vào sản xuất thương mại. Chiếc máy ảnh này khắc tên 'Oskar Barnack' trên kính ngắm, là bảo vật quốc gia về lịch sử nhiếp ảnh nhân loại.",
    startingBid: 4500000,
    currentBid: 7200000,
    minIncrement: 100000,
    buyNowPrice: 10000000,
    reservePrice: 6000000,
    status: "LIVE",
    featured: false,
    startTime: new Date(now - 50 * HOUR).toISOString(),
    endTime: new Date(now + 4 * HOUR + 40 * MINUTE).toISOString(),
    images: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80"
    ],
    appraisalCertificate: {
      certNumber: "LEICA-PROTO-105",
      inspector: "Leitz Photographica Auction Experts",
      date: "2026-05-10",
      conditionScore: "9.8/10 (Bảo tàng lưu trữ)",
      provenance: "Gia tộc Barnack Wetzlar Đức"
    },
    specs: {
      "Năm sản xuất": "1923",
      "Số sê-ri": "#105",
      "Ống kính": "Leitz Anastigmat 50mm f/3.5",
      "Định dạng": "Phim 35mm (24x36mm)"
    },
    bidCount: 34,
    viewerCount: 220,
    bidHistory: [
      { id: "bt21", bidderName: "@Vienna_Optics", amount: 7200000, time: "9 phút trước", type: "MANUAL" }
    ],
    seller: {
      name: "Wetzlar Historical Optic Bureau",
      rating: 5.0,
      verified: true
    }
  },

  // ==========================================
  // NHÓM 4: NGHỆ THUẬT & KỶ VẬT LỊCH SỬ (ART & RELICS)
  // ==========================================
  {
    id: "lot-art-01",
    title: "Claude Monet 'Le Bassin aux Nymphéas' (Hoa Súng Giverny) Sơn dầu 1917",
    slug: "claude-monet-le-bassin-aux-nympheas-1917",
    category: "art",
    categoryName: "Nghệ thuật & Kỷ vật Lịch sử",
    shortDesc: "Tuyệt tác trường phái Ấn tượng kinh điển của Claude Monet, thuộc chuỗi tác phẩm hoa súng nổi tiếng tại tư dinh Giverny.",
    fullDesc: "Bức tranh sơn dầu khổ lớn (100 x 200 cm) thể hiện khúc ca ánh sáng và mặt nước phản chiếu huyền ảo. Monet vẽ tác phẩm này trong những năm tháng thăng hoa cuối đời tại khu vườn nước của mình ở Giverny. Tác phẩm đã được trưng bày tại Bảo tàng Orangerie Paris và Metropolitan New York.",
    startingBid: 28000000,
    currentBid: 34500000,
    minIncrement: 250000,
    buyNowPrice: 45000000,
    reservePrice: 32000000,
    status: "LIVE",
    featured: true,
    startTime: new Date(now - 70 * HOUR).toISOString(),
    endTime: new Date(now + 2 * HOUR + 15 * MINUTE).toISOString(),
    images: [
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?auto=format&fit=crop&w=1200&q=80"
    ],
    appraisalCertificate: {
      certNumber: "MONET-W1892-PARIS",
      inspector: "Wildenstein Plattner Institute (Paris)",
      date: "2026-03-30",
      conditionScore: "Xuất sắc (Original Canvas & Restored Varnish)",
      provenance: "Bộ sưu tập tư nhân gia tộc Rothschild"
    },
    specs: {
      "Họa sĩ": "Claude Monet (1840 - 1926)",
      "Chất liệu": "Sơn dầu trên vải toan (Oil on canvas)",
      "Kích thước": "100 x 200 cm",
      "Khung tranh": "Khung gỗ mạ vàng Louis XIV thế kỷ 18"
    },
    bidCount: 38,
    viewerCount: 512,
    bidHistory: [
      { id: "ba1", bidderName: "@Louvre_Friend", amount: 34500000, time: "5 phút trước", type: "MANUAL" },
      { id: "ba2", bidderName: "@Mayfair_Galleries", amount: 34250000, time: "19 phút trước", type: "AUTO_BID" }
    ],
    seller: {
      name: "Mayfair Fine Arts London",
      rating: 5.0,
      verified: true
    }
  },
  {
    id: "lot-art-04",
    title: "Đồng Tiền Vàng Saint-Gaudens Double Eagle 1933 ($20 Gold Coin Cực Hiếm)",
    slug: "saint-gaudens-double-eagle-1933",
    category: "art",
    categoryName: "Nghệ thuật & Kỷ vật Lịch sử",
    shortDesc: "Đồng tiền xu đắt giá nhất lịch sử thế giới, đồng xu duy nhất được Bộ Tài chính Mỹ cấp phép sở hữu cá nhân hợp pháp.",
    fullDesc: "Năm 1933, Tổng thống Franklin D. Roosevelt ký sắc lệnh thu hồi vàng, gần như toàn bộ 445,500 đồng xu Double Eagle bị nấu chảy thành thỏi dự trữ tại Fort Knox. Chỉ duy nhất một cá thể được hoàng gia Ai Cập xuất khẩu hợp pháp và được tòa án Liên bang Mỹ công nhận.",
    startingBid: 12000000,
    currentBid: 15200000,
    minIncrement: 200000,
    buyNowPrice: 20000000,
    reservePrice: 14000000,
    status: "ENDED",
    featured: false,
    startTime: new Date(now - 140 * HOUR).toISOString(),
    endTime: new Date(now - 2 * HOUR).toISOString(),
    images: [
      "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=1200&q=80"
    ],
    appraisalCertificate: {
      certNumber: "PCGS-1933-MS65",
      inspector: "Professional Coin Grading Service (PCGS)",
      date: "2026-02-10",
      conditionScore: "MS65 Mint State",
      provenance: "Bộ sưu tập Cựu Quốc vương Farouk Ai Cập"
    },
    specs: {
      "Mệnh giá": "$20 USD",
      "Trọng lượng": "33.436 gram",
      "Độ tinh khiết": "90% Vàng, 10% Đồng",
      "Nhà thiết kế": "Augustus Saint-Gaudens"
    },
    bidCount: 48,
    viewerCount: 160,
    bidHistory: [
      { id: "ba41", bidderName: "@WallStreet_Vault", amount: 15200000, time: "2 giờ trước (Đã chốt)", type: "MANUAL" }
    ],
    seller: {
      name: "Numismatic Treasury New York",
      rating: 5.0,
      verified: true
    }
  }
];

const INITIAL_USER_WALLET = {
  balance: 250000,
  lockedEscrow: 50000,
  totalDeposited: 300000,
  currency: "USD",
  transactions: [
    { id: "tx-1", type: "DEPOSIT", amount: 200000, date: "2026-10-20", note: "Nạp tiền qua Chuyển khoản Swift Bank of America" },
    { id: "tx-2", type: "DEPOSIT", amount: 100000, date: "2026-10-24", note: "Nạp ví USDT Escrow Instant Bridge" },
    { id: "tx-3", type: "LOCK_ESCROW", amount: 50000, date: "2026-10-26", note: "Tạm giữ 10% đặt cọc phiên Patek Philippe Grandmaster Chime" }
  ]
};

const INITIAL_USER_PROFILE = {
  id: "usr-alex-007",
  name: "Alex Nguyen",
  username: "@alex_collector",
  email: "alex.nguyen@luxury-vault.io",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  kycLevel: "VIP Diamond (Đã xác minh hộ chiếu & bảo lãnh ngân hàng)",
  role: "VIP Bidder & Verified Consignor",
  joinedDate: "Tháng 03/2024"
};

// Đính kèm lên đối tượng window để mọi tệp JS khác đọc được ngay lập tức
window.INITIAL_AUCTION_ITEMS = INITIAL_AUCTION_ITEMS;
window.INITIAL_USER_WALLET = INITIAL_USER_WALLET;
window.INITIAL_USER_PROFILE = INITIAL_USER_PROFILE;
