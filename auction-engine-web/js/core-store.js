/**
 * =============================================================================
 * AUCTION ENGINE - CORE STORE & REALTIME SYNC (SINGLE SOURCE OF TRUTH)
 * =============================================================================
 * Tương thích 100% khi chạy qua file:///, Live Server và GitHub Pages.
 * Không dùng cú pháp import/export thuần (tránh lỗi CORS trên file:///).
 * Đóng gói toàn bộ vào window.AuctionStore & window.AuctionApp.
 * Đồng bộ đa tab tức thì qua BroadcastChannel('auction_realtime_channel') + localStorage.
 */

(function (window) {
  'use strict';

  // 1. Storage Keys
  var STORAGE_KEYS = {
    ROOMS: 'AE_V3_ROOMS',
    USERS: 'AE_V3_USERS',
    CURRENT_USER: 'AE_V3_CURRENT_USER',
    DEPOSITS: 'AE_V3_DEPOSITS',
    BIDS: 'AE_V3_BIDS',
    EVENTS: 'AE_V3_EVENTS',
    WATCHLIST: 'AE_V3_WATCHLIST',
    THEME: 'AE_V3_THEME',
    AUDIO_MUTED: 'AE_V3_AUDIO_MUTED'
  };

  // 2. BroadcastChannel setup with safe fallback
  var broadcastChannel = null;
  try {
    if (typeof window.BroadcastChannel === 'function') {
      broadcastChannel = new window.BroadcastChannel('auction_realtime_channel');
    }
  } catch (e) {
    console.warn('[AuctionStore] BroadcastChannel không khả dụng, dùng LocalStorage Fallback.');
  }

  // 3. Fallback SVG Image Generator (Khi ảnh bị lỗi hoặc offline)
  function generateFallbackSVG(title, categoryName) {
    var safeTitle = (title || 'AUCTION LOT').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var safeCat = (categoryName || 'PREMIUM LOT').toUpperCase();
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">' +
      '<defs>' +
        '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="#0F172A"/>' +
          '<stop offset="50%" stop-color="#1E293B"/>' +
          '<stop offset="100%" stop-color="#020617"/>' +
        '</linearGradient>' +
        '<linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="#FDE047"/>' +
          '<stop offset="100%" stop-color="#CA8A04"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<rect width="100%" height="100%" fill="url(#bg)"/>' +
      '<circle cx="400" cy="250" r="140" fill="none" stroke="url(#gold)" stroke-width="2" stroke-dasharray="8 6" opacity="0.4"/>' +
      '<circle cx="400" cy="250" r="100" fill="rgba(245, 158, 11, 0.08)"/>' +
      '<path d="M370 230 L430 230 M400 200 L400 300 M360 270 L440 270" stroke="url(#gold)" stroke-width="4" stroke-linecap="round"/>' +
      '<text x="400" y="440" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#F59E0B" letter-spacing="3" text-anchor="middle">' + safeCat + '</text>' +
      '<text x="400" y="480" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" fill="#FFFFFF" text-anchor="middle">' + (safeTitle.length > 40 ? safeTitle.substring(0, 37) + '...' : safeTitle) + '</text>' +
      '<text x="400" y="520" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#94A3B8" text-anchor="middle">CHỨNG NHẬN THẨM ĐỊNH SỞ HỮU GỐC</text>' +
    '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  // 4. Initial 8 Canonical Real Products (Ảnh Unsplash thật, khớp 100% từng tên vật phẩm)
  function getInitialRooms() {
    var now = Date.now();
    return [
      {
        roomId: 'room-101',
        id: 'lot-101',
        lotNumber: '101',
        roomPin: '839201',
        title: 'Patek Philippe Nautilus 5711/1R Rose Gold 18K',
        category: 'watches',
        categoryName: 'Đồng hồ Cơ Thụy Sĩ',
        shortDesc: 'Tuyệt tác chế tác đỉnh cao Geneva, vỏ vàng hồng 18K nguyên khối, mặt số nâu ombre sọc ngang kinh điển, chứng nhận Geneva Seal.',
        startPrice: 2400000000,
        currentPrice: 2500000000,
        stepPrice: 50000000,
        depositAmount: 360000000, // 15%
        status: 'LIVE',
        durationMinutes: 45,
        durationSeconds: 2700,
        startTime: new Date(now - 7 * 60000).toISOString(),
        endTime: new Date(now + 38 * 60000).toISOString(),
        featured: true,
        leaderUid: 'usr-tan-2048',
        leaderName: 'Phan Minh Tân',
        leaderPaddleId: '#PD-2048',
        sellerId: 'usr-thang-6651',
        sellerName: 'Phạm Ngọc Thắng',
        sellerPaddleId: '#PD-6651',
        participantsCount: 8,
        images: [
          'assets/images/patek_nautilus_gold.jpg',
          'assets/images/patek_nautilus_caseback.jpg',
          'assets/images/patek_nautilus_profile.jpg'
        ],
        specs: {
          'Thương hiệu': 'Patek Philippe (Genève)',
          'Bộ máy': 'Caliber 324 S C Tự Động In-House',
          'Đường kính': '40 mm • Vàng hồng 18K Rose Gold nguyên khối',
          'Mặt số': 'Nâu Ombre Chocolate dập vân sọc ngang',
          'Dự trữ cót': '45 giờ liên tục • Chống nước: 120M',
          'Tình trạng': 'Mới 100% Nguyên Hộp Sổ Thẻ Bảo Hành Chính Hãng'
        },
        appraisal: {
          inspector: "Sotheby's Horology Geneva Bureau",
          score: '10/10 (Mint Pristine)',
          certNo: 'PP-CH-839201',
          provenance: 'Bộ sưu tập Hoàng gia Liechtenstein'
        }
      },
      {
        roomId: 'room-102',
        id: 'lot-102',
        lotNumber: '102',
        roomPin: '911300',
        title: 'Porsche 911 GT3 RS Weissach Package 2024',
        category: 'hypercars',
        categoryName: 'Siêu xe & Mô tô hiếm',
        shortDesc: 'Vũ khí đường đua đỉnh cao thế hệ 992, gói khí động học chủ động DRS, nắp capo và nóc carbon trần Weissach nguyên bản.',
        startPrice: 14500000000,
        currentPrice: 14900000000,
        stepPrice: 200000000,
        depositAmount: 2175000000, // 15%
        status: 'LIVE',
        durationMinutes: 50,
        durationSeconds: 3000,
        startTime: new Date(now - 8 * 60000).toISOString(),
        endTime: new Date(now + 42 * 60000).toISOString(),
        featured: true,
        leaderUid: 'usr-bao-3390',
        leaderName: 'Trần Hoàng Bảo',
        leaderPaddleId: '#PD-3390',
        sellerId: 'usr-thang-6651',
        sellerName: 'Phạm Ngọc Thắng',
        sellerPaddleId: '#PD-6651',
        participantsCount: 12,
        images: [
          'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=85'
        ],
        specs: {
          'Động cơ': '4.0L Hút khí tự nhiên Boxer 6 xi-lanh',
          'Công suất': '525 Mã lực • 0-100 km/h: 3.2s',
          'Gói tùy chọn': 'Weissach Package Carbon Lightweight',
          'Odometer': '120 km (Delivery Mileage)',
          'Năm sản xuất': '2024 • Stuttgart, Đức',
          'Tình trạng': 'Hoàn hảo như xe xuất xưởng bảo hành chính hãng'
        },
        appraisal: {
          inspector: 'Porsche Classic Center Stuttgart',
          score: '9.9/10',
          certNo: 'P-DE-911300',
          provenance: 'Phân bổ chính hãng đại lý Porsche Munich'
        }
      },
      {
        roomId: 'room-103',
        id: 'lot-103',
        lotNumber: '103',
        roomPin: '582019',
        title: 'Rolex Cosmograph Daytona Chronometer Platinum',
        category: 'watches',
        categoryName: 'Đồng hồ Cơ Thụy Sĩ',
        shortDesc: 'Bản kỷ niệm 50 năm mặt số Ice Blue độc quyền, vành bezel gốm Cerachrom nâu hạt dẻ, vỏ bạch kim 950 đầm chắc quý hiếm.',
        startPrice: 1250000000,
        currentPrice: 1310000000,
        stepPrice: 30000000,
        depositAmount: 187500000, // 15%
        status: 'LIVE',
        durationMinutes: 35,
        durationSeconds: 2100,
        startTime: new Date(now - 10 * 60000).toISOString(),
        endTime: new Date(now + 25 * 60000).toISOString(),
        featured: false,
        leaderUid: 'usr-tan-2048',
        leaderName: 'Phan Minh Tân',
        leaderPaddleId: '#PD-2048',
        sellerId: 'usr-thang-6651',
        sellerName: 'Phạm Ngọc Thắng',
        sellerPaddleId: '#PD-6651',
        participantsCount: 9,
        images: [
          'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=85'
        ],
        specs: {
          'Thương hiệu': 'Rolex (Genève)',
          'Mã tham chiếu': '116506 Ice Blue Dial',
          'Chất liệu': 'Bạch kim Platinum 950 nguyên khối',
          'Bộ máy': 'Caliber 4130 Tự động bấm giờ Superlative',
          'Đường kính': '40 mm',
          'Tình trạng': 'Mới 100% Fullset 2024'
        },
        appraisal: {
          inspector: 'Rolex Heritage Bureau Zurich',
          score: '10/10',
          certNo: 'RLX-CH-582019',
          provenance: 'Nhà phân phối ủy quyền Bucherer Luzern'
        }
      },
      {
        roomId: 'room-104',
        id: 'lot-104',
        lotNumber: '104',
        roomPin: '488900',
        title: 'Ferrari F8 Tributo Rosso Corsa Speciale',
        category: 'hypercars',
        categoryName: 'Siêu xe & Mô tô hiếm',
        shortDesc: 'Tuyệt phẩm động cơ V8 tăng áp kép mạnh mẽ nhất lịch sử Maranello, màu sơn đỏ huyền thoại Rosso Corsa và nội thất da Alcantara thủ công.',
        startPrice: 11200000000,
        currentPrice: 11500000000,
        stepPrice: 150000000,
        depositAmount: 1680000000, // 15%
        status: 'LIVE',
        durationMinutes: 55,
        durationSeconds: 3300,
        startTime: new Date(now - 7 * 60000).toISOString(),
        endTime: new Date(now + 48 * 60000).toISOString(),
        featured: false,
        leaderUid: 'usr-khoi-9912',
        leaderName: 'Nguyễn Minh Khôi',
        leaderPaddleId: '#PD-9912',
        sellerId: 'usr-thang-6651',
        sellerName: 'Phạm Ngọc Thắng',
        sellerPaddleId: '#PD-6651',
        participantsCount: 7,
        images: [
          'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=1200&q=85'
        ],
        specs: {
          'Động cơ': '3.9L Twin-Turbo V8 Award-Winning',
          'Công suất': '720 Mã lực • 0-100 km/h: 2.9s',
          'Màu sắc': 'Rosso Corsa • Mâm thể thao Forged Matt',
          'Odometer': '1,450 km',
          'Năm sản xuất': '2023 • Maranello, Ý',
          'Tình trạng': 'Bảo dưỡng định kỳ chính hãng Ferrari 7-Year'
        },
        appraisal: {
          inspector: 'Ferrari Classiche Department Modena',
          score: '9.8/10',
          certNo: 'FE-IT-488900',
          provenance: 'Bộ sưu tập tư nhân Monaco'
        }
      },
      {
        roomId: 'room-105',
        id: 'lot-105',
        lotNumber: '105',
        roomPin: '632001',
        title: 'Máy Ảnh Cơ Vintage Leica M6 Titanium Edition 1992',
        category: 'tech',
        categoryName: 'Công nghệ & Bản mẫu',
        shortDesc: 'Phiên bản máy ảnh cơ rangefinder bạc mờ thủ công, kính ngắm quang học sắc nét, đi kèm ống kính tiêu cự 50mm f/1.4 tráng phủ đa lớp.',
        startPrice: 380000000,
        currentPrice: 400000000,
        stepPrice: 10000000,
        depositAmount: 57000000, // 15%
        status: 'LIVE',
        durationMinutes: 30,
        durationSeconds: 1800,
        startTime: new Date(now - 10 * 60000).toISOString(),
        endTime: new Date(now + 20 * 60000).toISOString(),
        featured: false,
        leaderUid: 'usr-bao-3390',
        leaderName: 'Trần Hoàng Bảo',
        leaderPaddleId: '#PD-3390',
        sellerId: 'usr-thang-6651',
        sellerName: 'Phạm Ngọc Thắng',
        sellerPaddleId: '#PD-6651',
        participantsCount: 5,
        images: [
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85'
        ],
        specs: {
          'Loại máy': 'Mechanical Rangefinder 35mm',
          'Ống kính': 'Leitz Summilux-M 50mm f/1.4 Titanium',
          'Thân vỏ': 'Titanium nguyên khối & Da đà điểu tự nhiên',
          'Tình trạng': 'Hoạt động cơ khí chuẩn xác 100%',
          'Năm sản xuất': '1992 • Wetzlar, Đức (Bản giới hạn #288/1000)',
          'Phụ kiện': 'Bao da thủ công, nắp che kim loại nguyên bản'
        },
        appraisal: {
          inspector: 'European Camera Historical Society',
          score: '9.7/10',
          certNo: 'CAM-DE-632001',
          provenance: 'Lưu trữ Bảo tàng Nhiếp ảnh Berlin'
        }
      },
      {
        roomId: 'room-106',
        id: 'lot-106',
        lotNumber: '106',
        roomPin: '774120',
        title: 'Claude Monet "L\'Aube Dorée" 1878 (Museum Oil on Canvas)',
        category: 'art',
        categoryName: 'Nghệ thuật & Cổ vật',
        shortDesc: 'Kiệt tác hội họa ấn tượng phong cảnh bình minh hồ Geneva thế kỷ 19, màu sắc nguyên bản tuyệt hảo với đầy đủ chứng thư xuất xứ.',
        startPrice: 680000000,
        currentPrice: 720000000,
        stepPrice: 20000000,
        depositAmount: 102000000, // 15%
        status: 'LIVE',
        durationMinutes: 60,
        durationSeconds: 3600,
        startTime: new Date(now - 8 * 60000).toISOString(),
        endTime: new Date(now + 52 * 60000).toISOString(),
        featured: false,
        leaderUid: 'usr-tan-2048',
        leaderName: 'Phan Minh Tân',
        leaderPaddleId: '#PD-2048',
        sellerId: 'usr-thang-6651',
        sellerName: 'Phạm Ngọc Thắng',
        sellerPaddleId: '#PD-6651',
        participantsCount: 6,
        images: [
          'assets/images/french_oil_painting.jpg',
          'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?auto=format&fit=crop&w=1200&q=85'
        ],
        specs: {
          'Chất liệu': 'Sơn dầu trên toan nguyên bản',
          'Kích thước': '85 x 115 cm (có khung mạ vàng cổ)',
          'Niên đại': 'Cuối thế kỷ 19 (Circa 1878)',
          'Tình trạng': 'Bảo tồn hoàn hảo, không qua phục chế sai lệch',
          'Khung tranh': 'Khung gỗ sồi chạm trổ dát vàng lá nguyên bản',
          'Chứng chỉ': 'Lưu trữ danh mục bảo tàng Mỹ thuật Geneva'
        },
        appraisal: {
          inspector: "Musée d'Art et d'Histoire Genève",
          score: '10/10 Museum Grade',
          certNo: 'ART-CH-774120',
          provenance: 'Di sản Gia tộc De Rham Thụy Sĩ'
        }
      },
      {
        roomId: 'room-107',
        id: 'lot-107',
        lotNumber: '107',
        roomPin: '154070',
        title: 'Audemars Piguet Royal Oak Gold Edition Chronometer',
        category: 'watches',
        categoryName: 'Đồng hồ Cơ Thụy Sĩ',
        shortDesc: 'Thiết kế kinh điển của Gérald Genta với vành bát giác 8 ốc đinh tán, mặt số Grande Tapisserie vàng khối hoàn thiện thủ công tinh xảo.',
        startPrice: 3150000000,
        currentPrice: 3250000000,
        stepPrice: 50000000,
        depositAmount: 472500000, // 15%
        status: 'LIVE',
        durationMinutes: 40,
        durationSeconds: 2400,
        startTime: new Date(now - 9 * 60000).toISOString(),
        endTime: new Date(now + 31 * 60000).toISOString(),
        featured: false,
        leaderUid: 'usr-khoi-9912',
        leaderName: 'Nguyễn Minh Khôi',
        leaderPaddleId: '#PD-9912',
        sellerId: 'usr-thang-6651',
        sellerName: 'Phạm Ngọc Thắng',
        sellerPaddleId: '#PD-6651',
        participantsCount: 8,
        images: [
          'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?auto=format&fit=crop&w=1200&q=85'
        ],
        specs: {
          'Thương hiệu': 'Audemars Piguet (Le Brassus)',
          'Chất liệu': 'Vàng hồng 18K Rose Gold nguyên khối',
          'Bộ máy': 'Calibre 4302 Tự động in-house 70h cót',
          'Đường kính': '41 mm • Độ mỏng: 10.4 mm',
          'Kính': 'Sapphire chống phản chiếu 2 mặt',
          'Tình trạng': 'Mới 100% Fullset Thẻ NFC bảo hành'
        },
        appraisal: {
          inspector: 'Audemars Piguet Heritage Department',
          score: '9.9/10',
          certNo: 'AP-CH-154070',
          provenance: 'Đại lý chính hãng Audemars Piguet Geneva'
        }
      },
      {
        roomId: 'room-108',
        id: 'lot-108',
        lotNumber: '108',
        roomPin: '209441',
        title: 'Mercedes-AMG GT Black Series Collector Edition',
        category: 'hypercars',
        categoryName: 'Siêu xe & Mô tô hiếm',
        shortDesc: 'Vua vòng đua Nürburgring Nordschleife danh giá, động cơ V8 trục khuỷu phẳng flat-plane, cánh gió sợi carbon chủ động 2 tầng.',
        startPrice: 9800000000,
        currentPrice: 10100000000,
        stepPrice: 150000000,
        depositAmount: 1470000000, // 15%
        status: 'LIVE',
        durationMinutes: 50,
        durationSeconds: 3000,
        startTime: new Date(now - 5 * 60000).toISOString(),
        endTime: new Date(now + 45 * 60000).toISOString(),
        featured: false,
        leaderUid: 'usr-bao-3390',
        leaderName: 'Trần Hoàng Bảo',
        leaderPaddleId: '#PD-3390',
        sellerId: 'usr-thang-6651',
        sellerName: 'Phạm Ngọc Thắng',
        sellerPaddleId: '#PD-6651',
        participantsCount: 11,
        images: [
          'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=85'
        ],
        specs: {
          'Động cơ': '4.0L Bi-Turbo V8 Flat-Plane Crankshaft',
          'Công suất': '730 Mã lực • 800 Nm mô-men xoắn',
          'Khí động học': 'Cánh gió Carbon 2 tầng điều chỉnh cơ học',
          'Odometer': '480 km',
          'Năm sản xuất': '2023 • Affalterbach, Đức',
          'Tình trạng': 'Bộ sưu tập gia tộc tư nhân bảo quản nhiệt độ chuẩn'
        },
        appraisal: {
          inspector: 'Mercedes-Benz Classic Center Stuttgart',
          score: '9.9/10 Mint',
          certNo: 'MB-DE-209441',
          provenance: 'Giao dịch qua Sotheby’s Sealed Munich'
        }
      }
    ];
  }

  function getInitialUsers() {
    return [
      {
        uid: 'usr-thang-6651',
        fullName: 'Phạm Ngọc Thắng',
        mssv: '6651071071',
        email: 'thang.pn@aurelia.ch',
        paddleId: '#PD-6651',
        walletAvailable: 25000000000, // 25 Tỷ ₫
        walletEscrow: 0,
        role: 'VIP_COLLECTOR',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        creditLimit: 50000000000
      },
      {
        uid: 'usr-tan-2048',
        fullName: 'Phan Minh Tân',
        mssv: '6651072048',
        email: 'tan.pm@aurelia.ch',
        paddleId: '#PD-2048',
        walletAvailable: 18000000000, // 18 Tỷ ₫
        walletEscrow: 360000000,
        role: 'VIP_COLLECTOR',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        creditLimit: 30000000000
      },
      {
        uid: 'usr-khoi-9912',
        fullName: 'Nguyễn Minh Khôi',
        mssv: '6651079912',
        email: 'khoi.nm@aurelia.ch',
        paddleId: '#PD-9912',
        walletAvailable: 15000000000, // 15 Tỷ ₫
        walletEscrow: 2175000000,
        role: 'PRO_BIDDER',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        creditLimit: 25000000000
      },
      {
        uid: 'usr-bao-3390',
        fullName: 'Trần Hoàng Bảo',
        mssv: '6651073390',
        email: 'bao.th@aurelia.ch',
        paddleId: '#PD-3390',
        walletAvailable: 20000000000, // 20 Tỷ ₫
        walletEscrow: 2175000000,
        role: 'ART_CONNOISSEUR',
        avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80',
        creditLimit: 40000000000
      }
    ];
  }

  function getInitialDeposits() {
    var now = Date.now();
    return [
      { id: 'dep-101-1', roomId: 'room-101', roomPin: '839201', uid: 'usr-tan-2048', fullName: 'Phan Minh Tân', paddleId: '#PD-2048', amount: 360000000, status: 'LOCKED', timestamp: now - 18 * 60000 },
      { id: 'dep-101-2', roomId: 'room-101', roomPin: '839201', uid: 'usr-khoi-9912', fullName: 'Nguyễn Minh Khôi', paddleId: '#PD-9912', amount: 360000000, status: 'LOCKED', timestamp: now - 20 * 60000 },
      { id: 'dep-102-1', roomId: 'room-102', roomPin: '911300', uid: 'usr-bao-3390', fullName: 'Trần Hoàng Bảo', paddleId: '#PD-3390', amount: 2175000000, status: 'LOCKED', timestamp: now - 15 * 60000 },
      { id: 'dep-102-2', roomId: 'room-102', roomPin: '911300', uid: 'usr-khoi-9912', fullName: 'Nguyễn Minh Khôi', paddleId: '#PD-9912', amount: 2175000000, status: 'LOCKED', timestamp: now - 22 * 60000 },
      { id: 'dep-103-1', roomId: 'room-103', roomPin: '582019', uid: 'usr-tan-2048', fullName: 'Phan Minh Tân', paddleId: '#PD-2048', amount: 187500000, status: 'LOCKED', timestamp: now - 19 * 60000 },
      { id: 'dep-103-2', roomId: 'room-103', roomPin: '582019', uid: 'usr-bao-3390', fullName: 'Trần Hoàng Bảo', paddleId: '#PD-3390', amount: 187500000, status: 'LOCKED', timestamp: now - 25 * 60000 },
      { id: 'dep-104-1', roomId: 'room-104', roomPin: '488900', uid: 'usr-khoi-9912', fullName: 'Nguyễn Minh Khôi', paddleId: '#PD-9912', amount: 1680000000, status: 'LOCKED', timestamp: now - 24 * 60000 },
      { id: 'dep-105-1', roomId: 'room-105', roomPin: '632001', uid: 'usr-bao-3390', fullName: 'Trần Hoàng Bảo', paddleId: '#PD-3390', amount: 57000000, status: 'LOCKED', timestamp: now - 16 * 60000 },
      { id: 'dep-106-1', roomId: 'room-106', roomPin: '774120', uid: 'usr-tan-2048', fullName: 'Phan Minh Tân', paddleId: '#PD-2048', amount: 102000000, status: 'LOCKED', timestamp: now - 26 * 60000 },
      { id: 'dep-107-1', roomId: 'room-107', roomPin: '154070', uid: 'usr-khoi-9912', fullName: 'Nguyễn Minh Khôi', paddleId: '#PD-9912', amount: 472500000, status: 'LOCKED', timestamp: now - 28 * 60000 },
      { id: 'dep-108-1', roomId: 'room-108', roomPin: '209441', uid: 'usr-bao-3390', fullName: 'Trần Hoàng Bảo', paddleId: '#PD-3390', amount: 1470000000, status: 'LOCKED', timestamp: now - 17 * 60000 }
    ];
  }

  function getInitialBids() {
    var now = Date.now();
    return [
      // Lot 101 - Patek Philippe 5711
      { id: 'bid-101-2', roomId: 'room-101', roomPin: '839201', uid: 'usr-tan-2048', bidderName: 'Phan Minh Tân', paddleId: '#PD-2048', amount: 2500000000, type: 'MANUAL', timestamp: now - 8 * 60000 },
      { id: 'bid-101-1', roomId: 'room-101', roomPin: '839201', uid: 'usr-khoi-9912', bidderName: 'Nguyễn Minh Khôi', paddleId: '#PD-9912', amount: 2450000000, type: 'MANUAL', timestamp: now - 14 * 60000 },

      // Lot 102 - Porsche 911 GT3 RS
      { id: 'bid-102-2', roomId: 'room-102', roomPin: '911300', uid: 'usr-bao-3390', bidderName: 'Trần Hoàng Bảo', paddleId: '#PD-3390', amount: 14900000000, type: 'MANUAL', timestamp: now - 5 * 60000 },
      { id: 'bid-102-1', roomId: 'room-102', roomPin: '911300', uid: 'usr-khoi-9912', bidderName: 'Nguyễn Minh Khôi', paddleId: '#PD-9912', amount: 14700000000, type: 'MANUAL', timestamp: now - 12 * 60000 },

      // Lot 103 - Rolex Daytona Platinum
      { id: 'bid-103-2', roomId: 'room-103', roomPin: '582019', uid: 'usr-tan-2048', bidderName: 'Phan Minh Tân', paddleId: '#PD-2048', amount: 1310000000, type: 'MANUAL', timestamp: now - 7 * 60000 },
      { id: 'bid-103-1', roomId: 'room-103', roomPin: '582019', uid: 'usr-bao-3390', bidderName: 'Trần Hoàng Bảo', paddleId: '#PD-3390', amount: 1280000000, type: 'MANUAL', timestamp: now - 15 * 60000 },

      // Lot 104 - Ferrari F8 Tributo
      { id: 'bid-104-2', roomId: 'room-104', roomPin: '488900', uid: 'usr-khoi-9912', bidderName: 'Nguyễn Minh Khôi', paddleId: '#PD-9912', amount: 11500000000, type: 'MANUAL', timestamp: now - 6 * 60000 },
      { id: 'bid-104-1', roomId: 'room-104', roomPin: '488900', uid: 'usr-tan-2048', bidderName: 'Phan Minh Tân', paddleId: '#PD-2048', amount: 11350000000, type: 'MANUAL', timestamp: now - 18 * 60000 },

      // Lot 105 - Leica M6 Titanium
      { id: 'bid-105-2', roomId: 'room-105', roomPin: '632001', uid: 'usr-bao-3390', bidderName: 'Trần Hoàng Bảo', paddleId: '#PD-3390', amount: 400000000, type: 'MANUAL', timestamp: now - 4 * 60000 },
      { id: 'bid-105-1', roomId: 'room-105', roomPin: '632001', uid: 'usr-khoi-9912', bidderName: 'Nguyễn Minh Khôi', paddleId: '#PD-9912', amount: 390000000, type: 'MANUAL', timestamp: now - 11 * 60000 },

      // Lot 106 - Monet L'Aube Doree
      { id: 'bid-106-2', roomId: 'room-106', roomPin: '774120', uid: 'usr-tan-2048', bidderName: 'Phan Minh Tân', paddleId: '#PD-2048', amount: 720000000, type: 'MANUAL', timestamp: now - 9 * 60000 },
      { id: 'bid-106-1', roomId: 'room-106', roomPin: '774120', uid: 'usr-bao-3390', bidderName: 'Trần Hoàng Bảo', paddleId: '#PD-3390', amount: 700000000, type: 'MANUAL', timestamp: now - 21 * 60000 },

      // Lot 107 - Audemars Piguet Royal Oak
      { id: 'bid-107-2', roomId: 'room-107', roomPin: '154070', uid: 'usr-khoi-9912', bidderName: 'Nguyễn Minh Khôi', paddleId: '#PD-9912', amount: 3250000000, type: 'MANUAL', timestamp: now - 10 * 60000 },
      { id: 'bid-107-1', roomId: 'room-107', roomPin: '154070', uid: 'usr-tan-2048', bidderName: 'Phan Minh Tân', paddleId: '#PD-2048', amount: 3200000000, type: 'MANUAL', timestamp: now - 22 * 60000 },

      // Lot 108 - Mercedes-AMG GT Black Series
      { id: 'bid-108-2', roomId: 'room-108', roomPin: '209441', uid: 'usr-bao-3390', bidderName: 'Trần Hoàng Bảo', paddleId: '#PD-3390', amount: 10100000000, type: 'MANUAL', timestamp: now - 3 * 60000 },
      { id: 'bid-108-1', roomId: 'room-108', roomPin: '209441', uid: 'usr-khoi-9912', bidderName: 'Nguyễn Minh Khôi', paddleId: '#PD-9912', amount: 9950000000, type: 'MANUAL', timestamp: now - 13 * 60000 }
    ];
  }

  function getInitialEvents() {
    return [
      { id: 'ev-01', roomId: 'room-patek-6300g', message: 'Phiên đấu giá Patek Philippe 6300G chính thức mở sàn.', type: 'ROOM_START', timestamp: Date.now() - 30 * 60 * 1000 },
      { id: 'ev-02', roomId: 'room-patek-6300g', message: 'Minh Luxury (#PD-7719) nộp cọc 12,000,000 ₫ và gia nhập sàn.', type: 'DEPOSIT', timestamp: Date.now() - 25 * 60 * 1000 },
      { id: 'ev-03', roomId: 'room-patek-6300g', message: 'Phạm Ngọc Thắng (#PD-6651) nộp cọc 12,000,000 ₫ và tham gia trả giá.', type: 'DEPOSIT', timestamp: Date.now() - 20 * 60 * 1000 },
      { id: 'ev-04', roomId: 'room-patek-6300g', message: 'Minh Luxury (#PD-7719) vừa nâng giá lên 95,000,000 ₫!', type: 'BID', timestamp: Date.now() - 5 * 60 * 1000 }
    ];
  }

  // 7. Core Store Class
  function CoreStore() {
    this.listeners = [];
    this.init();
  }

  CoreStore.prototype.init = function () {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.ROOMS)) {
        localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(getInitialRooms()));
      }
      if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(getInitialUsers()));
      }
      if (!localStorage.getItem(STORAGE_KEYS.DEPOSITS)) {
        localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(getInitialDeposits()));
      }
      if (!localStorage.getItem(STORAGE_KEYS.BIDS)) {
        localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(getInitialBids()));
      }
      if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(getInitialEvents()));
      }
      if (!localStorage.getItem(STORAGE_KEYS.WATCHLIST)) {
        localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify([]));
      }
    } catch (e) {
      console.warn('[AuctionStore] Không thể truy cập LocalStorage (chế độ bảo mật), dùng bộ nhớ RAM.', e);
    }

    var self = this;
    // Cross-tab sync via storage event (works across all browsers on file:/// and http://)
    window.addEventListener('storage', function (e) {
      if (e.key && e.key.indexOf('AE_V3_') === 0) {
        self.notify({ type: 'STORAGE_CHANGE', key: e.key });
      }
    });

    // Cross-tab sync via BroadcastChannel
    if (broadcastChannel) {
      broadcastChannel.onmessage = function (ev) {
        if (ev && ev.data) {
          self.notify(ev.data);
        }
      };
    }
  };

  CoreStore.prototype.broadcast = function (type, payload) {
    var message = { type: type, payload: payload, timestamp: Date.now() };
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage(message);
      } catch (e) {}
    }
    this.notify(message);
    if (window.eventBus && typeof window.eventBus.publish === 'function') {
      window.eventBus.publish(type, payload);
    }
  };

  CoreStore.prototype.subscribe = function (callback) {
    this.listeners.push(callback);
    var self = this;
    return function () {
      self.listeners = self.listeners.filter(function (cb) { return cb !== callback; });
    };
  };

  CoreStore.prototype.notify = function (data) {
    for (var i = 0; i < this.listeners.length; i++) {
      try {
        this.listeners[i](data);
      } catch (err) {
        console.error('[AuctionStore] Lỗi listener:', err);
      }
    }
  };

  // =========================================================================
  // ROOMS & ITEMS QUERIES & MUTATIONS
  // =========================================================================

  CoreStore.prototype.getRooms = function () {
    try {
      var data = localStorage.getItem(STORAGE_KEYS.ROOMS);
      var rooms = data ? JSON.parse(data) : getInitialRooms();
      var now = Date.now();
      var needsSave = false;

      // Đảm bảo các phòng demo LIVE có đủ thời gian không bị hết hạn bất ngờ
      rooms.forEach(function (r) {
        if (r.status === 'LIVE') {
          var endMs = new Date(r.endTime).getTime();
          if (endMs <= now) {
            r.endTime = new Date(now + 25 * 60 * 1000).toISOString();
            needsSave = true;
          }
        }
      });

      if (needsSave) {
        localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
      }
      
    // Sanitize and migrate any old watch/art images
    rooms = rooms.map(function(r) {
      if (!r || !r.images) return r;
      var t = (r.title || '').toLowerCase();
      if (t.indexOf('patek') !== -1 || t.indexOf('nautilus') !== -1 || r.category === 'watches' || r.roomPin === '839201') {
        var first = r.images[0] || '';
        if (first.indexOf('1524805444758') !== -1 || first.indexOf('1523170335258') !== -1 || first.indexOf('1547996160') !== -1) {
          r.images = [
            'assets/images/patek_nautilus_gold.jpg',
            'assets/images/patek_nautilus_caseback.jpg',
            'assets/images/patek_nautilus_profile.jpg'
          ];
        }
      }
      if (t.indexOf('aube') !== -1 || t.indexOf('monet') !== -1 || r.roomPin === '774120' || r.id === 'lot-104') {
        var firstArt = r.images[0] || '';
        if (firstArt.indexOf('1578301978693') !== -1) {
          r.images = [
            'assets/images/french_oil_painting.jpg',
            'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=85'
          ];
        }
      }
      return r;
    });

    return rooms;
    } catch (e) {
      return getInitialRooms();
    }
  };

  CoreStore.prototype.getItems = function () {
    return this.getRooms();
  };

  CoreStore.prototype.getRoom = function (idOrPin) {
    if (!idOrPin) return null;
    var searchStr = String(idOrPin).trim().toLowerCase().replace(/^#/, '');
    var rooms = this.getRooms();
    return rooms.find(function (r) {
      return (r.roomId && r.roomId.toLowerCase() === searchStr) ||
             (r.id && r.id.toLowerCase() === searchStr) ||
             (r.roomPin && r.roomPin.toLowerCase() === searchStr) ||
             (r.slug && r.slug.toLowerCase() === searchStr);
    }) || null;
  };

  CoreStore.prototype.getItem = function (idOrPin) {
    return this.getRoom(idOrPin);
  };

  CoreStore.prototype.createRoom = function (roomData) {
    var rooms = this.getRooms();
    var pin = String(Math.floor(100000 + Math.random() * 900000));
    var currentUser = this.getCurrentUser();
    var startPrice = Number(roomData.startPrice || roomData.startingBid) || 10000000;
    var stepPrice = Number(roomData.stepPrice || roomData.minIncrement) || Math.max(500000, Math.round(startPrice * 0.05));
    var depositAmount = Number(roomData.depositAmount) || Math.round(startPrice * 0.15);
    var durationMinutes = Number(roomData.durationMinutes) || 15;
    var initialStatus = roomData.status || 'WAITING';
    var isLiveNow = initialStatus === 'LIVE';

    var newRoom = {
      roomId: 'room-' + Date.now(),
      id: 'lot-custom-' + Date.now(),
      roomPin: pin,
      title: roomData.title || 'Vật phẩm đấu giá mới',
      slug: (roomData.title || 'lot-new').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: roomData.category || 'luxury',
      categoryName: roomData.categoryName || 'Tài sản Cao cấp',
      shortDesc: roomData.shortDesc || '',
      fullDesc: roomData.fullDesc || roomData.shortDesc || '',
      startPrice: startPrice,
      currentPrice: startPrice,
      stepPrice: stepPrice,
      depositAmount: depositAmount,
      durationMinutes: durationMinutes,
      buyNowPrice: roomData.buyNowPrice ? Number(roomData.buyNowPrice) : null,
      startTime: isLiveNow ? (roomData.startTime || new Date().toISOString()) : null,
      endTime: isLiveNow ? (roomData.endTime || new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()) : null,
      status: initialStatus,
      featured: true,
      isNewCreated: true,
      images: (roomData.images && roomData.images.length > 0) ? roomData.images : [generateFallbackSVG(roomData.title, roomData.categoryName)],
      sellerId: currentUser ? currentUser.uid : 'usr-anonymous-host',
      sellerName: currentUser ? currentUser.fullName : 'Chủ Phòng Ẩn Danh',
      sellerPaddleId: currentUser ? currentUser.paddleId : '#HOST-001',
      leaderUid: '',
      leaderName: 'Chưa có lượt trả',
      leaderPaddleId: '',
      participantsCount: 1,
      antiSnipingCount: 0,
      specs: roomData.specs || {
        'Tình trạng': 'Mới đưa lên sàn đấu giá',
        'Xuất xứ': 'Bảo chứng chính chủ',
        'Thời gian tạo': new Date().toLocaleDateString('vi-VN')
      },
      appraisal: roomData.appraisal || {
        inspector: 'Hội đồng Thẩm định AUCTION ENGINE',
        score: '10/10 Hoàn hảo',
        certNo: 'CERT-' + pin
      }
    };

    // Luôn chèn phòng mới vào ĐẦU danh sách để index.html và auctions.html thấy ngay
    rooms.unshift(newRoom);
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));

    // Thêm event mở phòng
    this.addEvent(newRoom.roomId, 'Phiên đấu giá "' + newRoom.title + '" (#PIN: ' + pin + ') vừa được mở sàn trực tiếp!', 'ROOM_START');

    this.broadcast('ROOM_CREATED', { room: newRoom });
    return { success: true, room: newRoom };
  };

  CoreStore.prototype.updateRoom = function (roomId, updateFields) {
    var rooms = this.getRooms();
    var target = null;
    for (var i = 0; i < rooms.length; i++) {
      if (rooms[i].roomId === roomId || rooms[i].id === roomId || rooms[i].roomPin === roomId) {
        for (var k in updateFields) {
          if (updateFields.hasOwnProperty(k)) {
            rooms[i][k] = updateFields[k];
          }
        }
        target = rooms[i];
        break;
      }
    }
    if (target) {
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
      this.broadcast('ROOM_UPDATED', { room: target });
    }
    return target;
  };

  // =========================================================================
  // USER & AUTHENTICATION
  // =========================================================================

  CoreStore.prototype.getUsers = function () {
    try {
      var data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : getInitialUsers();
    } catch (e) {
      return getInitialUsers();
    }
  };

  CoreStore.prototype.getCurrentUser = function () {
    try {
      if (localStorage.getItem('AURELIA_LOGGED_OUT') === 'true' || localStorage.getItem('AE_AUTH_LOGGED_OUT') === 'true') {
        return null;
      }
      var data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || localStorage.getItem('AURELIA_CURRENT_USER_V4') || 
                 localStorage.getItem('AE_DB_CURRENT_USER_V2') || 
                 localStorage.getItem('AE_DB_CURRENT_USER');
      if (!data) return null;
      var parsed = JSON.parse(data);
      // Đảm bảo số dư đồng bộ với danh sách users
      var users = this.getUsers();
      var found = users.find(function (u) { return u.uid === parsed.uid; });
      return found || parsed;
    } catch (e) {
      return null;
    }
  };

  CoreStore.prototype.setCurrentUser = function (user) {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem('AURELIA_CURRENT_USER_V4');
      localStorage.removeItem('AE_DB_CURRENT_USER_V2');
      localStorage.removeItem('AE_DB_CURRENT_USER');
      localStorage.setItem('AURELIA_LOGGED_OUT', 'true');
      localStorage.setItem('AE_AUTH_LOGGED_OUT', 'true');
    } else {
      var userStr = JSON.stringify(user);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userStr);
      localStorage.setItem('AURELIA_CURRENT_USER_V4', userStr);
      localStorage.setItem('AE_DB_CURRENT_USER_V2', userStr);
      localStorage.setItem('AE_DB_CURRENT_USER', userStr);
      localStorage.removeItem('AURELIA_LOGGED_OUT');
      localStorage.removeItem('AE_AUTH_LOGGED_OUT');
    }
    this.broadcast('USER_CHANGED' , { user: user });
  };

  CoreStore.prototype.quickLogin = function (userKeyOrUid) {
    var users = this.getUsers();
    var target = null;
    if (userKeyOrUid === 'thang' || userKeyOrUid === 'usr-thang-vip') {
      target = users.find(function (u) { return u.uid === 'usr-thang-vip'; });
    } else if (userKeyOrUid === 'guest' || userKeyOrUid === 'usr-guest-a') {
      target = users.find(function (u) { return u.uid === 'usr-guest-a'; });
    } else if (userKeyOrUid === 'minh' || userKeyOrUid === 'usr-minh-02') {
      target = users.find(function (u) { return u.uid === 'usr-minh-02'; });
    } else if (userKeyOrUid === 'elena' || userKeyOrUid === 'usr-elena-03') {
      target = users.find(function (u) { return u.uid === 'usr-elena-03'; });
    } else {
      target = users.find(function (u) { return u.uid === userKeyOrUid || u.email === userKeyOrUid; });
    }

    if (!target && users.length > 0) {
      target = users[0];
    }

    if (target) {
      this.setCurrentUser(target);
      return { success: true, user: target };
    }
    return { success: false, message: 'Không tìm thấy người dùng!' };
  };

  CoreStore.prototype.registerOrLoginQuick = function (fullName, email) {
    var users = this.getUsers();
    var cleanEmail = (email || '').trim().toLowerCase();
    var found = cleanEmail ? users.find(function (u) { return u.email.toLowerCase() === cleanEmail; }) : null;

    if (found) {
      this.setCurrentUser(found);
      return { success: true, user: found, isNew: false };
    }

    var paddleNum = Math.floor(1000 + Math.random() * 9000);
    var newUser = {
      uid: 'usr-' + Date.now(),
      fullName: (fullName || 'Nhà Sưu Tầm Mới').trim(),
      email: cleanEmail || ('collector' + paddleNum + '@auction.io'),
      paddleId: '#PD-' + paddleNum,
      walletAvailable: 2500000000, // $100,000 khởi tạo
      walletEscrow: 0,
      role: 'VIP_COLLECTOR',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(newUser);
    return { success: true, user: newUser, isNew: true };
  };

  CoreStore.prototype.login = function (email, password) {
    var users = this.getUsers();
    var cleanEmail = (email || '').trim().toLowerCase();
    var found = users.find(function (u) {
      return (u.email && u.email.toLowerCase() === cleanEmail) ||
             (u.fullName && u.fullName.toLowerCase() === cleanEmail);
    });
    if (found) {
      this.setCurrentUser(found);
      return { success: true, user: found };
    }
    return this.registerOrLoginQuick((email || '').split('@')[0], email);
  };

  CoreStore.prototype.register = function (fullName, email, password) {
    return this.registerOrLoginQuick(fullName, email);
  };

  CoreStore.prototype.logout = function () {
    this.setCurrentUser(null);
    return { success: true };
  };

  CoreStore.prototype.topUpWallet = function (amount) {
    var user = this.getCurrentUser();
    if (!user) return { success: false, message: 'Vui lòng đăng nhập trước!' };
    var addVal = Number(amount) || 1250000000; // $50,000 mặc định
    user.walletAvailable = (user.walletAvailable || 0) + addVal;
    this.setCurrentUser(user);
    this.broadcast('WALLET_TOPPED_UP', { user: user, added: addVal });
    return { success: true, user: user, added: addVal };
  };

  // =========================================================================
  // DEPOSITS (ESCROW)
  // =========================================================================

  CoreStore.prototype.getDeposits = function (roomId) {
    try {
      var data = localStorage.getItem(STORAGE_KEYS.DEPOSITS);
      var all = data ? JSON.parse(data) : getInitialDeposits();
      if (!roomId) return all;
      return all.filter(function (d) { return d.roomId === roomId; });
    } catch (e) {
      return [];
    }
  };

  CoreStore.prototype.hasUserDeposited = function (roomId, uid) {
    if (!uid) {
      var curr = this.getCurrentUser();
      if (!curr) return false;
      uid = curr.uid;
    }
    var deps = this.getDeposits(roomId);
    return deps.some(function (d) {
      return d.uid === uid && (d.status === 'LOCKED' || d.status === 'APPLIED_TO_WIN');
    });
  };

  CoreStore.prototype.submitDeposit = function (roomId, customUser) {
    var user = customUser || this.getCurrentUser();
    if (!user) return { success: false, message: 'Vui lòng đăng nhập để nộp tiền cọc ký quỹ!' };

    var room = this.getRoom(roomId);
    if (!room) return { success: false, message: 'Phòng đấu giá không tồn tại!' };

    if (this.hasUserDeposited(room.roomId, user.uid)) {
      return { success: true, message: 'Bạn đã hoàn tất ký quỹ cho phòng này rồi!' };
    }

    var requiredDeposit = Number(room.depositAmount) || Math.round(room.startPrice * 0.15);
    if ((user.walletAvailable || 0) < requiredDeposit) {
      return {
        success: false,
        insufficientFunds: true,
        requiredDeposit: requiredDeposit,
        walletAvailable: user.walletAvailable || 0,
        message: 'Số dư ví khả dụng (' + this.formatCurrency(user.walletAvailable) + ') không đủ để ký quỹ ' + this.formatCurrency(requiredDeposit) + '!'
      };
    }

    // Trừ ví khả dụng -> chuyển sang ví Escrow đóng băng
    user.walletAvailable -= requiredDeposit;
    user.walletEscrow = (user.walletEscrow || 0) + requiredDeposit;
    if (!customUser) {
      this.setCurrentUser(user);
    }

    // Lưu bản ghi deposit
    var allDeposits = this.getDeposits();
    var depRecord = {
      id: 'dep-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      roomId: room.roomId,
      uid: user.uid,
      userName: user.fullName,
      paddleId: user.paddleId,
      amount: requiredDeposit,
      status: 'LOCKED',
      timestamp: Date.now()
    };
    allDeposits.push(depRecord);
    localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(allDeposits));

    // Cập nhật số người tham gia phòng
    this.updateRoom(room.roomId, {
      participantsCount: Math.max((room.participantsCount || 0) + 1, allDeposits.filter(function (d) { return d.roomId === room.roomId; }).length)
    });

    // Thêm event
    this.addEvent(room.roomId, user.fullName + ' (' + user.paddleId + ') đã nộp cọc ' + this.formatCurrency(requiredDeposit) + ' và mở khóa quyền trả giá!', 'DEPOSIT');

    this.broadcast('USER_DEPOSITED', { roomId: room.roomId, user: user, deposit: depRecord });
    return { success: true, deposit: depRecord };
  };

  // =========================================================================
  // LIVE BIDS & ANTI-SNIPING RULE
  // =========================================================================

  CoreStore.prototype.getBids = function (roomId) {
    try {
      var data = localStorage.getItem(STORAGE_KEYS.BIDS);
      var all = data ? JSON.parse(data) : getInitialBids();
      var filtered = roomId ? all.filter(function (b) { return b.roomId === roomId; }) : all;
      return filtered.sort(function (a, b) { return b.timestamp - a.timestamp; });
    } catch (e) {
      return [];
    }
  };

  CoreStore.prototype.placeBid = function (roomId, bidAmount, bidType, customBidder) {
    var user = customBidder || this.getCurrentUser();
    if (!user) return { success: false, message: 'Vui lòng đăng nhập để tham gia trả giá!' };

    var room = this.getRoom(roomId);
    if (!room) return { success: false, message: 'Phòng đấu giá không tồn tại!' };

    if (room.status === 'ENDED') {
      return { success: false, message: 'Phiên đấu giá này đã chính thức gõ búa kết thúc!' };
    }

    // 1. Kiểm tra đã nộp cọc chưa
    if (!this.hasUserDeposited(room.roomId, user.uid)) {
      return {
        success: false,
        requiresDeposit: true,
        depositAmount: room.depositAmount,
        message: 'Bạn cần nộp tiền đặt cọc ký quỹ (15%) để được cấp Thẻ Đấu Giá (#Paddle) và tham gia trả giá!'
      };
    }

    // 2. Chặn tự nâng giá đè lên chính mình
    if (room.leaderUid === user.uid) {
      return { success: false, message: 'Bạn đang là người dẫn đầu phiên này! Không thể tự nâng giá đè lên chính mình.' };
    }

    // 3. Kiểm tra bước giá
    var minValid = (room.currentPrice || room.startPrice) + (room.stepPrice || 2000000);
    var amount = Number(bidAmount);
    if (amount < minValid) {
      return {
        success: false,
        message: 'Mức giá tối thiểu phải từ ' + this.formatCurrency(minValid) + ' (Giá hiện tại + Bước giá ' + this.formatCurrency(room.stepPrice) + ')!'
      };
    }

    // 4. QUY TẮC ANTI-SNIPING (+30s nếu còn dưới 30s)
    var now = Date.now();
    var endMs = new Date(room.endTime).getTime();
    var remainingSeconds = Math.floor((endMs - now) / 1000);
    var antiSnipingTriggered = false;
    var newEndTime = room.endTime;
    var antiSnipingCount = room.antiSnipingCount || 0;

    if (remainingSeconds > 0 && remainingSeconds < 30) {
      antiSnipingTriggered = true;
      antiSnipingCount += 1;
      newEndTime = new Date(now + 30 * 1000).toISOString();
      this.addEvent(room.roomId, '[Anti-Sniping] Kích hoạt gia hạn KÍCH HOẠT! Phiên được tự động gia hạn thêm +30 giây để đảm bảo công bằng!', 'SNIPE_EXTEND');
    }

    // 5. Cập nhật phòng
    var updatedRoom = this.updateRoom(room.roomId, {
      currentPrice: amount,
      leaderUid: user.uid,
      leaderName: user.fullName,
      leaderPaddleId: user.paddleId,
      endTime: newEndTime,
      antiSnipingCount: antiSnipingCount
    });

    // 6. Ghi vào sổ lệnh
    var allBids = this.getBids();
    var newBid = {
      bidId: 'bid-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      roomId: room.roomId,
      uid: user.uid,
      userName: user.fullName,
      paddleId: user.paddleId,
      amount: amount,
      bidType: bidType || 'MANUAL',
      timestamp: Date.now()
    };
    allBids.unshift(newBid);
    localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(allBids));

    // 7. Thêm event
    this.addEvent(room.roomId, user.fullName + ' (' + user.paddleId + ') vừa giơ Thẻ Đấu Giá trả ' + this.formatCurrency(amount) + ' và vươn lên dẫn đầu!', 'BID');

    this.broadcast('BID_PLACED', {
      roomId: room.roomId,
      bid: newBid,
      room: updatedRoom,
      antiSnipingTriggered: antiSnipingTriggered
    });

    return {
      success: true,
      bid: newBid,
      room: updatedRoom,
      antiSnipingTriggered: antiSnipingTriggered,
      message: 'Đặt giá thành công ' + this.formatCurrency(amount) + '!'
    };
  };

  // 8. Giả Lập Đối Thủ Đấu Giá Tự Động (Live Rival Bot)
  CoreStore.prototype.simulateRivalBid = function (roomId) {
    var room = this.getRoom(roomId);
    if (!room) return { success: false, message: 'Phòng không tồn tại!' };
    if (room.status === 'ENDED') return { success: false, message: 'Phiên đấu giá đã kết thúc!' };

    var rivalList = [
      { uid: 'usr-rival-tan', fullName: 'Phan Minh Tân', paddleId: '#PD-2048', walletAvailable: 5000000000 },
      { uid: 'usr-rival-khoi', fullName: 'Khôi Nguyễn Sưu Tầm', paddleId: '#PD-9912', walletAvailable: 4500000000 },
      { uid: 'usr-rival-david', fullName: 'David Vũ Geneva', paddleId: '#PD-3388', walletAvailable: 7000000000 },
      { uid: 'usr-elena-03', fullName: 'Elena Zurich', paddleId: '#PD-9942', walletAvailable: 6000000000 }
    ];

    var candidates = rivalList.filter(function (r) { return r.uid !== room.leaderUid; });
    var rival = candidates[Math.floor(Math.random() * candidates.length)] || rivalList[0];

    // Nộp cọc nếu chưa nộp
    if (!this.hasUserDeposited(room.roomId, rival.uid)) {
      this.submitDeposit(room.roomId, rival);
    }

    var nextAmount = (room.currentPrice || room.startPrice) + (room.stepPrice || 2000000);
    var res = this.placeBid(room.roomId, nextAmount, 'BOT_RIVAL', rival);
    return {
      success: res.success,
      rival: rival,
      amount: nextAmount,
      message: res.message
    };
  };

  // 9. Tua Nhanh Đồng Hồ Còn 15 Giây Cuối (Test Anti-Sniping & Chốt Phiên)
  CoreStore.prototype.fastForwardTimer = function (roomId, seconds) {
    var room = this.getRoom(roomId);
    if (!room) return false;
    var sec = typeof seconds === 'number' ? seconds : 15;
    var newEnd = new Date(Date.now() + sec * 1000).toISOString();
    var updated = this.updateRoom(room.roomId, { endTime: newEnd });
    this.addEvent(room.roomId, 'Đã tua nhanh thời gian: Chỉ còn đúng ' + sec + ' giây để test chốt phiên & Anti-Sniping!', 'TIME_JUMP');
    this.broadcast('TIME_FAST_FORWARD', { roomId: room.roomId, endTime: newEnd });
    return updated;
  };

  // Khai mạc phiên đấu giá trực tiếp (Start Auction by Host)
  CoreStore.prototype.startAuction = function (roomId, durationMinutes) {
    var room = this.getRoom(roomId);
    if (!room) return null;
    var totalMs = 0;
    if (durationMinutes) {
      totalMs = Math.round(Number(durationMinutes) * 60000);
    } else if (room.durationSeconds) {
      totalMs = room.durationSeconds * 1000;
    } else {
      var dur = Number(room.durationMinutes || 15);
      totalMs = Math.round(dur * 60000);
    }
    if (totalMs < 10000) totalMs = 60000;
    var startTime = new Date().toISOString();
    var endTime = new Date(Date.now() + totalMs).toISOString();
    var updated = this.updateRoom(room.roomId, {
      status: 'LIVE',
      durationMinutes: totalMs / 60000,
      durationSeconds: Math.round(totalMs / 1000),
      startTime: startTime,
      endTime: endTime
    });
    this.addEvent(room.roomId, 'Chủ sàn đã phát lệnh mở phiên đấu giá trực tiếp (' + duration + ' phút). Chúc mừng các nhà sưu tầm!', 'ROOM_START');
    this.broadcast('AUCTION_STARTED', { roomId: room.roomId, room: updated });
    return updated;
  };

  // 10. Chốt Phiên Đấu Giá (Settle Auction & Hoàn Tiền Cọc 100% Cho Người Thua)
  CoreStore.prototype.settleAuction = function (roomId) {
    var room = this.getRoom(roomId);
    if (!room) return null;

    var updated = this.updateRoom(room.roomId, { status: 'ENDED' });

    // Hoàn tiền cọc 100% cho tất cả người không trúng thầu
    var allDeposits = this.getDeposits();
    var users = this.getUsers();
    var winnerUid = room.leaderUid;

    allDeposits.forEach(function (dep) {
      if (dep.roomId === room.roomId && dep.status === 'LOCKED') {
        if (winnerUid && dep.uid === winnerUid) {
          dep.status = 'APPLIED_TO_WIN';
        } else {
          dep.status = 'REFUNDED';
          // Trả tiền cọc lại ví khả dụng
          var usr = users.find(function (u) { return u.uid === dep.uid; });
          if (usr) {
            usr.walletAvailable = (usr.walletAvailable || 0) + dep.amount;
            usr.walletEscrow = Math.max(0, (usr.walletEscrow || 0) - dep.amount);
          }
        }
      }
    });

    localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(allDeposits));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Cập nhật lại user hiện tại nếu có
    var curr = this.getCurrentUser();
    if (curr) {
      var syncedCurr = users.find(function (u) { return u.uid === curr.uid; });
      if (syncedCurr) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(syncedCurr));
      }
    }

        var bids = this.getBids(room.roomId);
    var hasValidBids = Boolean(winnerUid && bids && bids.length > 0);

    if (!hasValidBids) {
      winnerUid = null;
    }

    var updatedSettle = this.updateRoom(room.roomId, {
      status: 'ENDED',
      winnerUid: winnerUid,
      settledAt: new Date().toISOString(),
      settleOutcome: hasValidBids ? 'SOLD' : 'UNSOLD'
    });

    if (hasValidBids) {
      var winnerText = room.leaderName + ' (' + room.leaderPaddleId + ')';
      this.addEvent(room.roomId, 'Phiên đấu giá kết thúc. Giá trúng thầu ' + this.formatCurrency(room.currentPrice) + ' thuộc về: ' + winnerText, 'ENDED');
    } else {
      this.addEvent(room.roomId, 'Phiên đấu giá kết thúc. Không có người trả giá - Đã hoàn trả 100% tiền ký quỹ cho người tham gia.', 'ENDED');
    }

    this.broadcast('AUCTION_SETTLED', { roomId: room.roomId, room: updatedSettle, winnerUid: winnerUid, settleOutcome: hasValidBids ? 'SOLD' : 'UNSOLD' });
    return updatedSettle;
  };

  // =========================================================================
  // EVENTS FEED & UTILITIES
  // =========================================================================

  CoreStore.prototype.getEvents = function (roomId) {
    try {
      var data = localStorage.getItem(STORAGE_KEYS.EVENTS);
      var all = data ? JSON.parse(data) : getInitialEvents();
      var filtered = roomId ? all.filter(function (e) { return e.roomId === roomId; }) : all;
      return filtered.sort(function (a, b) { return b.timestamp - a.timestamp; });
    } catch (e) {
      return [];
    }
  };

  CoreStore.prototype.addEvent = function (roomId, message, type) {
    var all = this.getEvents();
    var newEv = {
      id: 'ev-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      roomId: roomId,
      message: message,
      type: type || 'INFO',
      timestamp: Date.now()
    };
    all.unshift(newEv);
    if (all.length > 100) all.pop();
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(all));
    this.broadcast('NEW_EVENT', { roomId: roomId, event: newEv });
    return newEv;
  };

  CoreStore.prototype.formatCurrency = function (val) {
    var num = Number(val) || 0;
    return new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
  };

  CoreStore.prototype.formatUSD = function (val) {
    var num = Number(val) || 0;
    return '$' + new Intl.NumberFormat('en-US').format(Math.round(num / 25000));
  };

  CoreStore.prototype.getFallbackImage = function (title, category) {
    return generateFallbackSVG(title, category);
  };

  CoreStore.prototype.resetDemoData = function () {
    try {
      for (var k in STORAGE_KEYS) {
        if (STORAGE_KEYS.hasOwnProperty(k)) {
          localStorage.removeItem(STORAGE_KEYS[k]);
        }
      }
      localStorage.removeItem('AE_INIT_AUTH');
      localStorage.removeItem('AUCTION_ENGINE_ITEMS_V1');
      localStorage.removeItem('AE_DB_ROOMS_V2');
    } catch (e) {}
    this.init();
    this.broadcast('SYSTEM_RESET', {});
    window.location.reload();
  };


  // Convenience Aliases for Cross-Component Reliability
  CoreStore.prototype.depositEscrow = function (roomId, amount, user) {
    return this.submitDeposit(roomId, user);
  };
  CoreStore.prototype.fastForward = function (roomId, sec) {
    return this.fastForwardTimer(roomId, sec);
  };
  CoreStore.prototype.simulateBotRivalBid = function (roomId) {
    return this.simulateRivalBid(roomId);
  };
  CoreStore.prototype.resetAllData = function () {
    return this.resetDemoData();
  };

  // =========================================================================
  // EXPORT TO WINDOW (GLOBAL SINGLETON)
  // =========================================================================

  var storeInstance = new CoreStore();
  window.AuctionStore = storeInstance;
  window.AuctionApp = {
    store: storeInstance,
    getFallbackImage: generateFallbackSVG
  };

  // Compatibility Bridges for dbService & stateManager (To prevent breaking any legacy call)
  window.dbService = {
    getRooms: function () { return storeInstance.getRooms(); },
    getRoom: function (id) { return storeInstance.getRoom(id); },
    createRoom: function (data) { return storeInstance.createRoom(data); },
    startAuction: function (roomId, dur) { return storeInstance.startAuction(roomId, dur); },
    updateRoom: function (id, data) { return storeInstance.updateRoom(id, data); },
    getCurrentUser: function () { return storeInstance.getCurrentUser(); },
    setCurrentUser: function (u) { return storeInstance.setCurrentUser(u); },
    getUsers: function () { return storeInstance.getUsers(); },
    hasUserDeposited: function (roomId, uid) { return storeInstance.hasUserDeposited(roomId, uid); },
    getDeposits: function (roomId) { return storeInstance.getDeposits(roomId); },
    submitDeposit: function (roomId, u) { return storeInstance.submitDeposit(roomId, u); },
    getBids: function (roomId) { return storeInstance.getBids(roomId); },
    placeBid: function (roomId, amt, type, u) { return storeInstance.placeBid(roomId, amt, type, u); },
    simulateClientBid: function (roomId) { return storeInstance.simulateRivalBid(roomId); },
    getEvents: function (roomId) { return storeInstance.getEvents(roomId); },
    addEvent: function (roomId, msg, type) { return storeInstance.addEvent(roomId, msg, type); },
    refundAllLosers: function (roomId) { return storeInstance.settleAuction(roomId); },
    formatCurrency: function (v) { return storeInstance.formatCurrency(v); },
    subscribeRoom: function (roomId, cb) {
      return storeInstance.subscribe(function (payload) {
        if (!payload || !payload.roomId || payload.roomId === roomId) {
          cb({
            room: storeInstance.getRoom(roomId),
            bids: storeInstance.getBids(roomId),
            deposits: storeInstance.getDeposits(roomId),
            events: storeInstance.getEvents(roomId),
            eventData: payload
          });
        }
      });
    },
    logout: function () { return storeInstance.logout(); },
    login: function (email, pass) { return storeInstance.login(email, pass); },
    register: function (name, email, pass) { return storeInstance.register(name, email, pass); }
  };

  window.stateManager = {
    getItems: function () { return storeInstance.getRooms(); },
    getItem: function (id) { return storeInstance.getRoom(id); },
    saveItem: function (item) { return storeInstance.updateRoom(item.id || item.roomId, item); },
    getWallet: function () {
      var u = storeInstance.getCurrentUser();
      return u ? { balance: Math.round(u.walletAvailable / 25000), lockedEscrow: Math.round(u.walletEscrow / 25000) } : { balance: 250000, lockedEscrow: 50000 };
    },
    getTheme: function () {
      try {
        return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
      } catch (e) {
        return 'dark';
      }
    },
    setTheme: function (theme) {
      try {
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {}
    },
    isAudioMuted: function () {
      try {
        return localStorage.getItem(STORAGE_KEYS.AUDIO_MUTED) === 'true';
      } catch (e) {
        return false;
      }
    },
    setAudioMuted: function (muted) {
      try {
        localStorage.setItem(STORAGE_KEYS.AUDIO_MUTED, String(muted));
      } catch (e) {}
    },
    isSimulatorActive: function () { return true; },
    setSimulatorActive: function () {},
    addNotification: function (msg, type) {
      console.log('[Notification]', msg, type);
    },
    getWatchlist: function () {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.WATCHLIST)) || [];
      } catch (e) { return []; }
    },
    toggleWatchlist: function (itemId) {
      var wl = this.getWatchlist();
      var idx = wl.indexOf(itemId);
      if (idx !== -1) wl.splice(idx, 1);
      else wl.push(itemId);
      localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(wl));
      return idx === -1;
    }
  };

  // Safe global image error handler
  window.handleImgError = function (imgEl, title, category) {
    if (!imgEl) return;
    imgEl.onerror = null; // Prevent loop
    imgEl.src = generateFallbackSVG(title || imgEl.alt, category);
  };

  console.log('[AuctionEngine] CoreStore V3 Initialized successfully with 8 Real Products.');

})(window);
