/**
 * =============================================================================
 * AURELIA FINE AUCTIONS - CENTRALIZED CORE STATE MANAGER (SINGLE SOURCE OF TRUTH)
 * =============================================================================
 * Architecture:
 * - Runs 100% natively on file:///, Live Server, and GitHub Pages (No ES module CORS).
 * - Realtime sync: localStorage + BroadcastChannel('aurelia_realtime_sync') + storage event.
 * - Manages: 8 Canonical Lots, 3 Demo Users, 15% Escrow Custody, Live Bidding,
 *   Anti-Sniping (+30s), 3-Stage Lifecycle (WAITING -> LIVE -> ENDED), Settle.
 * - Global singleton: window.AureliaApp (with aliases for window.AuctionStore, window.AuctionApp).
 */

(function (window) {
  'use strict';

  var STORAGE_KEYS = {
    ROOMS: 'AURELIA_ROOMS_V4',
    USERS: 'AURELIA_USERS_V4',
    CURRENT_USER: 'AURELIA_CURRENT_USER_V4',
    DEPOSITS: 'AURELIA_DEPOSITS_V4',
    BIDS: 'AURELIA_BIDS_V4',
    EVENTS: 'AURELIA_EVENTS_V4',
    WATCHLIST: 'AURELIA_WATCHLIST_V4',
    NOTIFICATIONS: 'AURELIA_NOTIFICATIONS_V4',
    AUDIT_LOGS: 'AURELIA_AUDIT_LOGS_V4',
    CATEGORIES: 'AURELIA_CATEGORIES_V4',
    TRANSACTIONS: 'AURELIA_TRANSACTIONS_V4',
    THEME: 'AURELIA_THEME_V4'
  };

  // Safe BroadcastChannel with fallback
  var broadcastChannel = null;
  try {
    if (typeof window.BroadcastChannel === 'function') {
      broadcastChannel = new window.BroadcastChannel('aurelia_realtime_sync');
    }
  } catch (e) {
    console.warn('[AureliaApp] BroadcastChannel not supported, relying on storage event fallback.');
  }

  // Fallback SVG generator for network dropouts
  function generateFallbackSVG(title, category) {
    var safeTitle = (title || 'AUCTION LOT').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var safeCat = (category || 'PREMIUM LOT').toUpperCase();
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">' +
      '<rect width="100%" height="100%" fill="#F8FAFC"/>' +
      '<rect x="20" y="20" width="760" height="560" fill="none" stroke="#E2E8F0" stroke-width="2"/>' +
      '<circle cx="400" cy="250" r="90" fill="none" stroke="#0F172A" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.3"/>' +
      '<text x="400" y="420" font-family="Newsreader, serif" font-size="18" font-weight="600" fill="#64748B" letter-spacing="3" text-anchor="middle">' + safeCat + '</text>' +
      '<text x="400" y="460" font-family="Plus Jakarta Sans, sans-serif" font-size="20" font-weight="700" fill="#0F172A" text-anchor="middle">' + (safeTitle.length > 40 ? safeTitle.substring(0, 37) + '...' : safeTitle) + '</text>' +
      '<text x="400" y="500" font-family="JetBrains Mono, monospace" font-size="12" fill="#64748B" text-anchor="middle">AURELIA FINE AUCTIONS &bull; GENEVA</text>' +
    '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  // 3 Pre-defined Demo Users
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
        role: 'admin',
        isAdmin: true,
        password: 'admin',
        avatar: 'assets/images/user_thang.jpg',
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
      ,
      {
        roomId: 'room-109',
        id: 'lot-109',
        lotNumber: '109',
        roomPin: '392817',
        title: 'Bình Gốm Cổ Men Lam Triều Minh Thế Kỷ 15 (Imperial Ming Dynasty)',
        category: 'antiques',
        categoryName: 'Đồ cổ & Cổ vật',
        shortDesc: 'Tuyệt tác gốm sứ hoa lam niên đại Vĩnh Lạc đế thế kỷ 15, men lam hồi nhập khẩu Ba Tư, hoa văn rồng cuộn 5 móng đế vương nguyên bản 100%.',
        startPrice: 1800000000,
        currentPrice: 1950000000,
        stepPrice: 50000000,
        depositAmount: 270000000,
        status: 'LIVE',
        durationMinutes: 45,
        durationSeconds: 2700,
        startTime: new Date(now - 12 * 60000).toISOString(),
        endTime: new Date(now + 33 * 60000).toISOString(),
        featured: true,
        leaderUid: 'usr-tan-2048',
        leaderName: 'Phan Minh Tân',
        leaderPaddleId: '#PD-2048',
        sellerId: 'usr-thang-6651',
        sellerName: 'Phạm Ngọc Thắng',
        sellerPaddleId: '#PD-6651',
        participantsCount: 14,
        images: [
          'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?auto=format&fit=crop&w=1200&q=85'
        ],
        specs: {
          'Niên đại': 'Thời Minh Vĩnh Lạc (Circa 1403-1424)',
          'Chất liệu': 'Sứ cao lanh Cảnh Đức Trấn men hoa lam Hồi',
          'Chiều cao': '38.5 cm • Đường kính miệng: 12 cm',
          'Tình trạng': 'Hoàn hảo 100% không nứt mẻ qua kiểm định quang học',
          'Bảo chứng': 'Viện Cổ vật Hoàng gia London & Sotheby\'s Hong Kong'
        },
        appraisal: {
          inspector: 'Asian Ceramic Heritage Institute',
          score: '10/10 Museum Grade',
          certNo: 'ANT-MING-392817',
          provenance: 'Bộ sưu tập Quý tộc Nam tước Guy de Rothschild'
        }
      },
      {
        roomId: 'room-110',
        id: 'lot-110',
        lotNumber: '110',
        roomPin: '772910',
        title: 'Ferrari 250 GTO 1962 Classic Legend Scaglietti',
        category: 'hypercars',
        categoryName: 'Siêu xe & Xe cổ điển',
        shortDesc: 'Huyền thoại thể thao đắt giá nhất lịch sử xe hơi thế giới, khung gầm nguyên bản số seri 3445GT, động cơ Colombo V12 huyền thoại.',
        startPrice: 42000000000,
        currentPrice: 42000000000,
        stepPrice: 500000000,
        depositAmount: 6300000000,
        status: 'WAITING',
        durationMinutes: 60,
        durationSeconds: 3600,
        startTime: new Date(now + 24 * 3600000).toISOString(),
        endTime: new Date(now + 25 * 3600000).toISOString(),
        featured: true,
        leaderUid: null,
        leaderName: null,
        leaderPaddleId: null,
        sellerId: 'usr-thang-6651',
        sellerName: 'Phạm Ngọc Thắng',
        sellerPaddleId: '#PD-6651',
        participantsCount: 28,
        images: [
          'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&w=1200&q=85'
        ],
        specs: {
          'Động cơ': '3.0L Tipo 168 Comp/62 Colombo 60° V12',
          'Công suất': '300 Mã lực @ 7,500 rpm',
          'Năm sản xuất': '1962 • Maranello, Ý (1 trong 36 chiếc toàn cầu)',
          'Hồ sơ đua': 'Vô địch Tour de France Automobile 1963',
          'Tình trạng': 'Bảo tồn hoàn hảo chứng nhận Ferrari Classiche Red Book'
        },
        appraisal: {
          inspector: 'Ferrari Classiche Department Modena',
          score: '10/10 Certificata Authentica',
          certNo: 'FE-RED-772910',
          provenance: 'Di sản Gia tộc Maranello Heritage'
        }
      },
      {
        roomId: 'room-111',
        id: 'lot-111',
        lotNumber: '111',
        roomPin: '648291',
        title: 'Patek Philippe Aquanaut 5167A Stainless Steel',
        category: 'watches',
        categoryName: 'Đồng hồ Cơ Thụy Sĩ',
        shortDesc: 'Đồng hồ thể thao sang trọng vỏ thép không gỉ, mặt số đen dập nổi họa tiết quân cờ, dây cao su tropical đen nguyên bản.',
        startPrice: 850000000,
        currentPrice: 850000000,
        stepPrice: 20000000,
        depositAmount: 127500000,
        status: 'PENDING_APPROVAL',
        durationMinutes: 30,
        durationSeconds: 1800,
        startTime: new Date().toISOString(),
        endTime: new Date(now + 1800000).toISOString(),
        featured: false,
        leaderUid: null,
        leaderName: null,
        leaderPaddleId: null,
        sellerId: 'usr-thang-6651',
        sellerName: 'Phạm Ngọc Thắng',
        sellerPaddleId: '#PD-6651',
        participantsCount: 0,
        images: [
          'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1200&q=85'
        ],
        specs: {
          'Bộ máy': 'Caliber 324 S C Tự động',
          'Chất liệu': 'Thép không gỉ 316L',
          'Đường kính': '40.8 mm',
          'Tình trạng': 'Mới 100% Fullset 2024'
        },
        appraisal: {
          inspector: 'Chờ Chuyên Gia Geneva Thẩm Định',
          score: 'Chờ duyệt',
          certNo: 'PENDING-PP-648291',
          provenance: 'Bộ sưu tập Phạm Ngọc Thắng'
        }
      },
      {
        roomId: 'room-112',
        id: 'lot-112',
        lotNumber: '112',
        roomPin: '192834',
        title: 'Rolex Daytona Paul Newman Exotic Dial 1968 Ref. 6239',
        category: 'watches',
        categoryName: 'Đồng hồ Cơ Thụy Sĩ',
        shortDesc: 'Biểu tượng tối thượng của lịch sử đồng hồ cổ điển, mặt số Exotic trắng sữa kim phụ số học Art Deco đặc trưng.',
        startPrice: 7200000000,
        currentPrice: 8500000000,
        stepPrice: 100000000,
        depositAmount: 1080000000,
        status: 'ENDED',
        durationMinutes: 45,
        durationSeconds: 2700,
        startTime: new Date(now - 7200000).toISOString(),
        endTime: new Date(now - 3600000).toISOString(),
        featured: false,
        leaderUid: 'usr-thang-6651',
        leaderName: 'Phạm Ngọc Thắng',
        leaderPaddleId: '#PD-6651',
        winnerUid: 'usr-thang-6651',
        winnerName: 'Phạm Ngọc Thắng',
        winnerPaddle: '#PD-6651',
        sellerId: 'usr-bao-3390',
        sellerName: 'Trần Hoàng Bảo',
        sellerPaddleId: '#PD-3390',
        participantsCount: 16,
        images: [
          'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?auto=format&fit=crop&w=1200&q=85',
          'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?auto=format&fit=crop&w=1200&q=85'
        ],
        specs: {
          'Thương hiệu': 'Rolex Cosmograph Daytona Ref. 6239',
          'Mặt số': 'Paul Newman Exotic White Dial',
          'Bộ máy': 'Valjoux 722 Lên cót tay huyền thoại',
          'Năm sản xuất': '1968 • Geneva, Thụy Sĩ'
        },
        appraisal: {
          inspector: "Sotheby's Geneva Rare Watches Bureau",
          score: '10/10 Museum Historical Piece',
          certNo: 'PN-CH-192834',
          provenance: 'Bộ sưu tập Di sản Gia tộc De Rham'
        }
      }
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

  // =========================================================================
  // APP CORE CONSTRUCTOR
  // =========================================================================

  function getInitialNotifications() {
    return [
      {
        id: 'notif-1',
        title: 'Chào mừng thành viên VIP',
        message: 'Hồ sơ Thẻ đấu giá #PD-6651 của bạn đã được kiểm định xác thực KYC Cấp độ 3 (Geneva Private Banking).',
        time: '10 phút trước',
        type: 'success',
        read: false
      },
      {
        id: 'notif-2',
        title: 'Phiên đấu giá sắp bắt đầu',
        message: 'Phiên Lot #101 Patek Philippe Nautilus 5711/1R đã hoàn tất kiểm định và đang mở phiên chờ.',
        time: '25 phút trước',
        type: 'info',
        read: false
      },
      {
        id: 'notif-3',
        title: 'Bảo chứng Escrow 15%',
        message: 'Khoản ký quỹ đặt cọc của bạn được bảo hiểm 100% bởi Lloyd\'s London với mức bồi hoàn tối đa $50.000.000.',
        time: '2 giờ trước',
        type: 'warning',
        read: true
      }
    ];
  }

  function getInitialCategories() {
    return [
      { slug: 'watches', name: 'Đồng hồ Cơ Thụy Sĩ', count: 4, image: 'assets/images/patek_nautilus_gold.jpg', desc: 'Patek Philippe, Rolex, Audemars Piguet, Vacheron Constantin' },
      { slug: 'hypercars', name: 'Siêu xe & Xe cổ điển', count: 4, image: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=900&q=85', desc: 'Porsche 911 GT3 RS, Ferrari F8, Ferrari 250 GTO, Mercedes-AMG GT' },
      { slug: 'tech', name: 'Thiết bị Công nghệ hiếm', count: 1, image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=85', desc: 'Máy ảnh cơ Vintage Leica M6, thiết bị quang học, bản mẫu hiếm' },
      { slug: 'art', name: 'Tranh Nghệ thuật', count: 1, image: 'assets/images/french_oil_painting.jpg', desc: 'Kiệt tác hội họa ấn tượng Claude Monet, bảo chứng bảo tàng Geneva' },
      { slug: 'antiques', name: 'Đồ cổ & Cổ vật', count: 1, image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=900&q=85', desc: 'Gốm hoa lam thời Minh, bảo vật hoàng gia thế kỷ 15-18' }
    ];
  }

  function getInitialAuditLogs() {
    var now = new Date();
    return [
      { id: 'log-1', timestamp: new Date(now - 4 * 60000).toLocaleString('vi-VN'), action: 'APPROVE_ROOM', detail: 'Admin duyệt niêm yết Phiên #839201 Patek Philippe Nautilus', actor: 'Admin (#AD-01)' },
      { id: 'log-2', timestamp: new Date(now - 12 * 60000).toLocaleString('vi-VN'), action: 'DEPOSIT_ESCROW', detail: 'Nhà sưu tầm #PD-2048 nộp cọc 360.000.000 ₫ cho Lot #101', actor: 'Hệ thống Escrow' },
      { id: 'log-3', timestamp: new Date(now - 18 * 60000).toLocaleString('vi-VN'), action: 'CREATE_ROOM', detail: 'Người bán #PD-6651 nộp hồ sơ niêm yết Lot #109 Cổ vật', actor: 'Phạm Ngọc Thắng' },
      { id: 'log-4', timestamp: new Date(now - 45 * 60000).toLocaleString('vi-VN'), action: 'USER_LOGIN', detail: 'Đăng nhập thành công từ IP 192.168.1.241', actor: 'Phạm Ngọc Thắng (#PD-6651)' },
      { id: 'log-5', timestamp: new Date(now - 90 * 60000).toLocaleString('vi-VN'), action: 'REJECT_ROOM', detail: 'Từ chối phiên #PIN: 119280 - Lý do: Ảnh chưa rõ nét số seri nắp lưng', actor: 'Admin (#AD-01)' }
    ];
  }

  function getInitialTransactions() {
    var now = Date.now();
    return [
      { id: 'tx-1001', type: 'TOPUP', amount: 5000000000, fee: 0, status: 'SUCCESS', method: 'Chuyển khoản Ngân hàng (Vietcombank)', desc: 'Nạp hạn mức ví đấu giá tín nhiệm', timestamp: now - 3600000 },
      { id: 'tx-1002', type: 'ESCROW_LOCK', amount: 360000000, fee: 0, status: 'LOCKED', method: 'Ký quỹ Tạm Khóa (Escrow 15%)', desc: 'Ký quỹ tham gia Lot #101 Patek Philippe 5711/1R', timestamp: now - 2400000 },
      { id: 'tx-1003', type: 'TOPUP', amount: 10000000000, fee: 0, status: 'SUCCESS', method: 'Bảo lãnh Tín dụng Geneva Private Bank', desc: 'Gia hạn cấp vốn thẻ VIP Member #PD-6651', timestamp: now - 86400000 },
      { id: 'tx-1004', type: 'ESCROW_REFUND', amount: 187500000, fee: 0, status: 'REFUNDED', method: 'Hoàn trả 100% Ký quỹ Escrow', desc: 'Hoàn cọc Lot #103 kết thúc phiên (Bảo chứng an toàn)', timestamp: now - 43200000 }
    ];
  }

  function AppCore() {
    this.subscribers = [];
    this.init();
    this.setupSyncListeners();
  }

  AppCore.prototype.init = function () {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(getInitialUsers()));
      }
      // Guest mode by default: Khong tu dong dang nhap khi nguoi dung moi truy cap.
      // Nguoi dung moi hoac nguoi nhan link chia se se o trang thai Khach (Guest - Chua dang nhap)
      // cho den khi chu dong Dang Nhap hoac Dang Ky tai khoan cua rieng minh.
      if (!localStorage.getItem(STORAGE_KEYS.ROOMS)) {
        localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(getInitialRooms()));
      }
      if (!localStorage.getItem(STORAGE_KEYS.BIDS)) {
        localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(getInitialBids()));
      }
      if (!localStorage.getItem(STORAGE_KEYS.DEPOSITS)) {
        localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(getInitialDeposits()));
      }
      if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(getInitialNotifications()));
      }
      if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(getInitialCategories()));
      }
      if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(getInitialAuditLogs()));
      }
      if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(getInitialTransactions()));
      }
      if (!localStorage.getItem(STORAGE_KEYS.WATCHLIST)) {
        localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(['room-101', 'room-102']));
      }
    } catch (e) {
      console.error('[AppCore] Storage access error:', e);
    }
  };

  AppCore.prototype.setupSyncListeners = function () {
    var self = this;
    if (broadcastChannel) {
      broadcastChannel.onmessage = function (event) {
        if (event && event.data) {
          self.notify(event.data.type, event.data.payload);
        }
      };
    }

    // Storage event for multi-tab fallback
    window.addEventListener('storage', function (e) {
      if (e.key && e.key.indexOf('AURELIA_') === 0) {
        self.notify('STORAGE_SYNC', { key: e.key });
      }
    });
  };

  AppCore.prototype.broadcast = function (type, payload) {
    var msg = { type: type, payload: payload, senderId: Date.now() };
    if (broadcastChannel) {
      try { broadcastChannel.postMessage(msg); } catch (e) {}
    }
    this.notify(type, payload);
  };

  AppCore.prototype.subscribe = function (cb) {
    if (typeof cb === 'function') {
      this.subscribers.push(cb);
    }
    var self = this;
    return function () {
      self.subscribers = self.subscribers.filter(function (fn) { return fn !== cb; });
    };
  };

  AppCore.prototype.notify = function (type, payload) {
    for (var i = 0; i < this.subscribers.length; i++) {
      try {
        this.subscribers[i]({ type: type, payload: payload });
      } catch (err) {
        console.error('[AppCore] Subscriber notification error:', err);
      }
    }
  };

  // =========================================================================
  // ROOMS & AUCTIONS MANAGEMENT
  // =========================================================================
  AppCore.prototype.getRooms = function () {
    try {
      var data = localStorage.getItem(STORAGE_KEYS.ROOMS);
      return data ? JSON.parse(data) : getInitialRooms();
    } catch (e) {
      return getInitialRooms();
    }
  };

  AppCore.prototype.getRoom = function (idOrPin) {
    if (!idOrPin) return null;
    var clean = String(idOrPin).replace('#', '').trim().toLowerCase();
    var rooms = this.getRooms();
    return rooms.find(function (r) {
      return String(r.roomId).toLowerCase() === clean ||
             String(r.id).toLowerCase() === clean ||
             String(r.roomPin) === clean ||
             String(r.lotNumber) === clean;
    }) || null;
  };

  AppCore.prototype.createRoom = function (data) {
    var rooms = this.getRooms();
    var currentUser = this.getCurrentUser();
    var pin = String(Math.floor(100000 + Math.random() * 900000));
    var startPrice = Number(data.startPrice) || 100000000;
    var stepPrice = Number(data.stepPrice) || Math.max(5000000, Math.round(startPrice * 0.05));
    var depositAmount = Math.round(startPrice * 0.15); // 15% cọc
    var totalSeconds = Number(data.durationSeconds);
    if (!totalSeconds) {
      totalSeconds = Math.round((Number(data.durationMinutes) || 15) * 60);
    }
    var duration = totalSeconds / 60;

    var newRoom = {
      roomId: 'room-' + Date.now(),
      id: 'lot-' + Date.now(),
      lotNumber: String(rooms.length + 101),
      roomPin: pin,
      title: data.title || 'Vật phẩm đấu giá mới',
      category: data.category || 'luxury',
      categoryName: data.categoryName || 'Tài sản Cao cấp',
      shortDesc: data.shortDesc || '',
      startPrice: startPrice,
      currentPrice: startPrice,
      stepPrice: stepPrice,
      depositAmount: depositAmount,
      status: 'WAITING', // Bắt buộc WAITING
      durationMinutes: duration,
      durationSeconds: totalSeconds,
      startTime: null,   // Chưa bắt đầu
      endTime: null,     // Chưa bắt đầu
      featured: false,
      isNewCreated: true,
      images: (data.images && data.images.length > 0) ? data.images : [generateFallbackSVG(data.title, data.categoryName)],
      sellerId: currentUser ? currentUser.uid : 'usr-thang-6651',
      sellerName: currentUser ? currentUser.fullName : 'Phạm Ngọc Thắng',
      sellerPaddleId: currentUser ? currentUser.paddleId : '#PD-6651',
      leaderUid: '',
      leaderName: '',
      leaderPaddleId: '',
      participantsCount: 1,
      specs: data.specs || {
        'Xuất xứ': data.origin || 'Bảo chứng Geneva',
        'Năm sản xuất': data.year || '2024',
        'Tình trạng': 'Mới đưa lên sàn đấu giá'
      },
      appraisal: {
        inspector: "Aurelia Horology & Fine Art Bureau",
        score: '10/10 Hoàn hảo',
        certNo: 'CERT-' + pin,
        provenance: 'Chính chủ sở hữu'
      }
    };

    rooms.unshift(newRoom);
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
    this.broadcast('ROOM_CREATED', { room: newRoom });
    return { success: true, room: newRoom };
  };

  
  AppCore.prototype.upsertRoom = function (room) {
    if (!room) return null;
    var pin = String(room.roomPin || room.roomId);
    var rooms = this.getRooms();
    var idx = rooms.findIndex(function (r) {
      return String(r.roomPin) === pin || String(r.roomId) === String(room.roomId);
    });
    if (idx !== -1) {
      for (var k in room) {
        if (room.hasOwnProperty(k)) rooms[idx][k] = room[k];
      }
      room = rooms[idx];
    } else {
      rooms.unshift(room);
    }
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
    this.broadcast('ROOM_UPDATED', { room: room, roomId: room.roomId });
    return room;
  };

  AppCore.prototype.updateRoom = function (roomId, patch) {
    var rooms = this.getRooms();
    var idx = rooms.findIndex(function (r) { return r.roomId === roomId || r.roomPin === roomId; });
    if (idx === -1) return null;

    for (var key in patch) {
      if (patch.hasOwnProperty(key)) {
        rooms[idx][key] = patch[key];
      }
    }

    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
    this.broadcast('ROOM_UPDATED', { room: rooms[idx], roomId: rooms[idx].roomId });
    return rooms[idx];
  };

  // Start Auction by Host (Khai mạc)
  AppCore.prototype.startAuction = function (roomId, durationMinutes) {
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
    if (totalMs < 10000) totalMs = 60000; // minimum safeguard

    var startTime = new Date().toISOString();
    var endTime = new Date(Date.now() + totalMs).toISOString();

    var updated = this.updateRoom(room.roomId, {
      status: 'LIVE',
      durationMinutes: totalMs / 60000,
      durationSeconds: Math.round(totalMs / 1000),
      startTime: startTime,
      endTime: endTime
    });

    this.broadcast('AUCTION_STARTED', { roomId: room.roomId, room: updated });
    return updated;
  };

  // Settle Auction (Chốt Phiên)
  
  AppCore.prototype.reopenAuction = function (roomId, durationMinutes) {
    var room = this.getRoom(roomId);
    if (!room) return null;
    var dur = Number(durationMinutes) || 15;
    var newEndTime = new Date(Date.now() + dur * 60000).toISOString();
    var updated = this.updateRoom(room.roomId || room.id, {
      status: 'LIVE',
      startTime: new Date().toISOString(),
      endTime: newEndTime,
      durationMinutes: dur,
      durationSeconds: dur * 60,
      settleOutcome: null,
      settledAt: null
    });
    this.broadcast('AUCTION_REOPENED', { roomId: room.roomId, room: updated });
    return updated;
  };

  AppCore.prototype.settleAuction = function (roomId) {
    var room = this.getRoom(roomId);
    if (!room) return null;

    var bids = this.getBids(room.roomId);
    var hasValidBids = Boolean(bids && bids.length > 0 && room.leaderUid);
    var winnerUid = hasValidBids ? room.leaderUid : null;

    var updated = this.updateRoom(room.roomId, {
      status: 'ENDED',
      winnerUid: winnerUid,
      winnerName: hasValidBids ? (room.leaderName || null) : null,
      winnerPaddleId: hasValidBids ? (room.leaderPaddleId || null) : null,
      settledAt: new Date().toISOString(),
      settleOutcome: hasValidBids ? 'SOLD' : 'UNSOLD'
    });

    // Refund deposits 100% to all losers
    var deposits = this.getDeposits();
    var users = this.getUsers();

    deposits.forEach(function (dep) {
      if (dep.roomId === room.roomId && dep.status === 'LOCKED') {
        if (winnerUid && dep.uid === winnerUid) {
          dep.status = 'APPLIED_TO_WIN';
        } else {
          dep.status = 'REFUNDED';
          var usr = users.find(function (u) { return u.uid === dep.uid; });
          if (usr) {
            usr.walletAvailable = (usr.walletAvailable || 0) + dep.amount;
            usr.walletEscrow = Math.max(0, (usr.walletEscrow || 0) - dep.amount);
          }
        }
      }
    });

    localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(deposits));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Update current user if affected
    var curr = this.getCurrentUser();
    if (curr) {
      var synced = users.find(function (u) { return u.uid === curr.uid; });
      if (synced) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(synced));
      }
    }

    this.broadcast('AUCTION_SETTLED', { roomId: room.roomId, room: updated, winnerUid: winnerUid, settleOutcome: hasValidBids ? 'SOLD' : 'UNSOLD' });
    updated.success = true;
    updated.room = updated;
    return updated;
  };

  // Cancel / Close Auction (when 0 bids)
  AppCore.prototype.cancelAuction = function (roomId) {
    return this.settleAuction(roomId);
  };

  // Fast forward clock for demo testing
  AppCore.prototype.fastForward = function (roomId, seconds) {
    var room = this.getRoom(roomId);
    if (!room || room.status !== 'LIVE') return null;

    var sec = Number(seconds) || 15;
    var newEnd = new Date(Date.now() + sec * 1000).toISOString();
    var updated = this.updateRoom(room.roomId, { endTime: newEnd });
    this.broadcast('TIME_FAST_FORWARD', { roomId: room.roomId, endTime: newEnd });
    return updated;
  };

  // =========================================================================
  // USER ACCOUNTS & 1-CLICK SWITCHING
  // =========================================================================
  AppCore.prototype.getUsers = function () {
    try {
      var data = localStorage.getItem(STORAGE_KEYS.USERS);
      var users = data ? JSON.parse(data) : getInitialUsers();
      // Ensure official user Phạm Ngọc Thắng is always Super Admin with custom avatar
      var thang = users.find(function (u) {
        return u.uid === 'usr-thang-6651' || (u.fullName && u.fullName.includes('Thắng'));
      });
      if (thang) {
        thang.role = 'admin';
        thang.isAdmin = true;
        thang.avatar = 'assets/images/user_thang.jpg';
        thang.paddleId = '#PD-6651';
        thang.mssv = '6651071071';
        thang.fullName = 'Phạm Ngọc Thắng';
        if (!thang.email) thang.email = 'thang.pn@aurelia.ch';
        if (!thang.password) thang.password = 'admin';
      }
      return users;
    } catch (e) {
      return getInitialUsers();
    }
  };

  AppCore.prototype.getCurrentUser = function () {
    try {
      if (localStorage.getItem('AURELIA_LOGGED_OUT') === 'true' || localStorage.getItem('AE_AUTH_LOGGED_OUT') === 'true') {
        return null;
      }
      var data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || localStorage.getItem('AE_V3_CURRENT_USER');
      if (data && data !== 'null' && data !== 'undefined') {
        var parsed = JSON.parse(data);
        if (parsed && (parsed.uid || parsed.paddleId)) {
          // Auto-upgrade user profile to official Phạm Ngọc Thắng (Admin - #PD-6651 - 25 Tỷ)
          if (parsed.uid === 'usr-thang-6651' || parsed.paddleId === '#PD-7256' || (parsed.fullName && parsed.fullName.includes('Thắng'))) {
            parsed.fullName = 'Phạm Ngọc Thắng';
            parsed.mssv = '6651071071';
            parsed.paddleId = '#PD-6651';
            parsed.role = 'admin';
            parsed.isAdmin = true;
            parsed.avatar = 'assets/images/user_thang.jpg';
            if (!parsed.email) parsed.email = 'thang.pn@aurelia.ch';
            if (!parsed.password) parsed.password = 'admin';
            if (!parsed.walletAvailable || parsed.walletAvailable < 20000000000) {
              parsed.walletAvailable = 25000000000;
            }
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(parsed));
          }
          return parsed;
        }
      }
      // Guest mode by default when no user session exists
      return null;
    } catch (e) {
      return null;
    }
  };

  AppCore.prototype.switchUser = function (uidOrPaddle) {
    if (!uidOrPaddle) return null;
    var users = this.getUsers();
    var target = users.find(function (u) {
      return u.uid === uidOrPaddle || u.paddleId === uidOrPaddle || u.email === uidOrPaddle;
    });

    if (target) {
      localStorage.removeItem('AURELIA_LOGGED_OUT');
      localStorage.removeItem('AE_AUTH_LOGGED_OUT');
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(target));
      localStorage.setItem('AE_V3_CURRENT_USER', JSON.stringify(target));
      this.broadcast('USER_SWITCHED', { user: target });
      return target;
    }
    return null;
  };

  AppCore.prototype.quickLogin = function (uidOrPaddle) {
    return this.switchUser(uidOrPaddle);
  };

  AppCore.prototype.login = function (emailOrName, password) {
    var users = this.getUsers();
    var query = String(emailOrName || '').toLowerCase().trim();
    if (!query) {
      return { success: false, message: 'Vui lòng nhập Email hoặc Mã Thẻ Đấu Giá!' };
    }

    var target = users.find(function (u) {
      var matchDirect = (u.email && u.email.toLowerCase() === query) ||
                        (u.fullName && u.fullName.toLowerCase() === query) ||
                        (u.paddleId && u.paddleId.toLowerCase() === query) ||
                        (u.mssv && String(u.mssv).toLowerCase() === query);
      if (matchDirect) return true;
      if (u.role === 'admin' || u.uid === 'usr-thang-6651') {
        if (query === 'admin' || query === 'superadmin' || query === 'phamngocthangcr7@gmail.com' || query === 'thang') {
          return true;
        }
      }
      return false;
    });

    if (target) {
      if (target.password && password && target.password !== password) {
        // Cho phép 'admin' hoặc '123456' làm mật khẩu dự phòng nếu người dùng chưa đổi mật khẩu mới
        if (!(target.role === 'admin' && (password === 'admin' || password === '123456'))) {
          return { success: false, message: 'Mật khẩu không chính xác. Quý khách có thể bấm [Quên mật khẩu?] để thiết lập mã mới!' };
        }
      }
      localStorage.removeItem('AURELIA_LOGGED_OUT');
      localStorage.removeItem('AE_AUTH_LOGGED_OUT');
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(target));
      localStorage.setItem('AE_V3_CURRENT_USER', JSON.stringify(target));
      this.broadcast('USER_SWITCHED', { user: target });
      return { success: true, user: target };
    }
    return { success: false, message: 'Tài khoản không tồn tại. Vui lòng kiểm tra lại hoặc chuyển sang tab Đăng Ký!' };
  };

  AppCore.prototype.logout = function () {
    localStorage.setItem('AURELIA_LOGGED_OUT', 'true');
    localStorage.setItem('AE_AUTH_LOGGED_OUT', 'true');
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem('AE_V3_CURRENT_USER');
    localStorage.removeItem('AE_DB_CURRENT_USER_V2');
    localStorage.removeItem('AE_DB_CURRENT_USER');
    this.broadcast('USER_LOGGED_OUT', {});
    this.broadcast('USER_SWITCHED', { user: null });
    return true;
  };

  AppCore.prototype.register = function (fullName, email, password, initialBalance) {
    var name = String(fullName || '').trim();
    var mail = String(email || '').trim().toLowerCase();
    var pass = String(password || '').trim();

    if (!name) {
      return { success: false, message: 'Vui lòng nhập Họ và Tên của bạn!' };
    }
    if (!mail || mail.indexOf('@') === -1) {
      return { success: false, message: 'Vui lòng nhập địa chỉ email hợp lệ!' };
    }

    var users = this.getUsers();
    var exists = users.some(function(u) {
      return u.email && u.email.toLowerCase() === mail;
    });
    if (exists) {
      return { success: false, message: 'Email này đã tồn tại trên hệ thống. Vui lòng chuyển sang tab Đăng Nhập!' };
    }

    var pinNum = String(Math.floor(1000 + Math.random() * 9000));
    var initBal = Number(initialBalance);
    if (isNaN(initBal) || initBal < 0) initBal = 5000000000; // 5 Tỷ ₫ mặc định

    var newUser = {
      uid: 'usr-' + Date.now(),
      fullName: name,
      email: mail,
      password: pass || '123456',
      paddleId: '#PD-' + pinNum,
      walletAvailable: initBal,
      walletEscrow: 0,
      role: 'VIP_MEMBER',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.removeItem('AURELIA_LOGGED_OUT');
    localStorage.removeItem('AE_AUTH_LOGGED_OUT');
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
    localStorage.setItem('AE_V3_CURRENT_USER', JSON.stringify(newUser));
    this.broadcast('USER_REGISTERED', { user: newUser });
    this.broadcast('USER_SWITCHED', { user: newUser });
    return { success: true, user: newUser };
  };

  // =========================================================================
  // BẢO MẬT: KHÔI PHỤC MẬT KHẨU QUA GMAIL / OTP (KHÔNG ĐỂ LỘ THÔNG TIN)
  // =========================================================================
  function maskSecureEmail(email) {
    if (!email) return '***';
    var parts = email.split('@');
    var name = parts[0];
    var domain = parts[1] || '';
    var maskedName = name.length > 2 
      ? name.charAt(0) + '***' + name.charAt(name.length - 1)
      : name.charAt(0) + '***';
    return maskedName + '@' + domain;
  }

  AppCore.prototype.requestPasswordReset = function (email) {
    var mail = String(email || '').trim().toLowerCase();
    if (!mail || mail.indexOf('@') === -1) {
      return { success: false, message: 'Vui lòng nhập địa chỉ Gmail/Email hợp lệ!' };
    }

    var users = this.getUsers();
    var user = users.find(function (u) {
      if (u.email && u.email.toLowerCase() === mail) return true;
      if (u.role === 'admin' || u.uid === 'usr-thang-6651') {
        if (mail === 'phamngocthangcr7@gmail.com' || mail.indexOf('thang.pn') > -1 || mail.indexOf('auctionengine') > -1 || mail.indexOf('aurelia') > -1 || mail.indexOf('admin') > -1) {
          return true;
        }
      }
      return false;
    });

    if (!user) {
      return { 
        success: false, 
        message: 'Địa chỉ email này chưa được đăng ký trong hệ thống AUCTIONENGINE. Quý khách vui lòng kiểm tra lại!' 
      };
    }

    // Sinh mã OTP 6 số bảo mật ngẫu nhiên
    var otp = String(Math.floor(100000 + Math.random() * 900000));
    var expiresAt = Date.now() + 5 * 60 * 1000; // 5 phút

    var resetData = {
      email: user.email,
      otp: otp,
      expiresAt: expiresAt,
      attempts: 0
    };

    localStorage.setItem('AURELIA_PWD_RESET_V4', JSON.stringify(resetData));

    // Ghi nhật ký kiểm toán không để lộ mật khẩu hay thông tin nhạy cảm
    if (typeof this.logAuditEvent === 'function') {
      this.logAuditEvent('AUTH_SECURITY', 'Yêu cầu mã xác thực đặt lại mật khẩu cho hòm thư ' + maskSecureEmail(user.email), user.uid);
    }

    // Bắn thông báo bảo mật vào chuông thông báo
    if (typeof this.addNotification === 'function') {
      this.addNotification(
        'Mã Xác Thực Đặt Lại Mật Khẩu',
        'Mã OTP của Quý khách là ' + otp + ' (hiệu lực trong 5 phút). Tuyệt đối không cung cấp mã này cho người khác.',
        'warning'
      );
    }

    return {
      success: true,
      message: 'Mã xác thực OTP đã được gửi đến ' + maskSecureEmail(user.email) + '. Quý khách vui lòng kiểm tra hòm thư (hiệu lực 5 phút).',
      email: user.email,
      maskedEmail: maskSecureEmail(user.email),
      otp: otp
    };
  };

  AppCore.prototype.verifyAndResetPassword = function (email, otp, newPassword, confirmPassword) {
    var mail = String(email || '').trim().toLowerCase();
    var enteredOtp = String(otp || '').trim();
    var pass = String(newPassword || '').trim();
    var confirmPass = String(confirmPassword || '').trim();

    if (!mail) {
      return { success: false, message: 'Vui lòng cung cấp email tài khoản!' };
    }
    if (!enteredOtp || enteredOtp.length !== 6) {
      return { success: false, message: 'Mã OTP xác thực phải gồm đúng 6 chữ số!' };
    }
    if (!pass || pass.length < 6) {
      return { success: false, message: 'Mật khẩu mới phải có tối thiểu 6 ký tự để đảm bảo an toàn!' };
    }
    if (pass !== confirmPass) {
      return { success: false, message: 'Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!' };
    }

    var rawReset = localStorage.getItem('AURELIA_PWD_RESET_V4');
    if (!rawReset) {
      return { success: false, message: 'Phiên đặt lại mật khẩu không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu lại!' };
    }

    var resetData = JSON.parse(rawReset);
    if (resetData.email.toLowerCase() !== mail) {
      return { success: false, message: 'Email xác thực không khớp với phiên gửi OTP!' };
    }

    if (Date.now() > resetData.expiresAt) {
      localStorage.removeItem('AURELIA_PWD_RESET_V4');
      return { success: false, message: 'Mã xác thực OTP đã hết hiệu lực (quá 5 phút). Vui lòng yêu cầu gửi mã mới!' };
    }

    if (resetData.otp !== enteredOtp) {
      resetData.attempts = (resetData.attempts || 0) + 1;
      if (resetData.attempts >= 5) {
        localStorage.removeItem('AURELIA_PWD_RESET_V4');
        return { success: false, message: 'Quý khách đã nhập sai mã OTP quá 5 lần. Phiên xác thực đã bị hủy vì lý do an toàn.' };
      }
      localStorage.setItem('AURELIA_PWD_RESET_V4', JSON.stringify(resetData));
      return { success: false, message: 'Mã OTP không chính xác. Quý khách còn ' + (5 - resetData.attempts) + ' lần thử!' };
    }

    // Mã OTP hợp lệ -> Cập nhật mật khẩu mới an toàn
    var users = this.getUsers();
    var targetIdx = users.findIndex(function (u) {
      if (u.email && u.email.toLowerCase() === mail) return true;
      if (u.role === 'admin' || u.uid === 'usr-thang-6651') {
        if (mail === 'phamngocthangcr7@gmail.com' || mail.indexOf('thang.pn') > -1 || mail.indexOf('auctionengine') > -1 || mail.indexOf('aurelia') > -1 || mail.indexOf('admin') > -1) {
          return true;
        }
      }
      return false;
    });

    if (targetIdx === -1) {
      return { success: false, message: 'Không tìm thấy thông tin tài khoản trên hệ thống.' };
    }

    users[targetIdx].password = pass;
    // Cập nhật luôn hòm thư đã xác minh để sau này đăng nhập bằng chính hòm thư này
    if (mail.indexOf('@') !== -1) {
      users[targetIdx].email = mail;
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Cập nhật người dùng hiện tại nếu đang đăng nhập đúng tài khoản này
    var curr = this.getCurrentUser();
    if (curr && (curr.uid === users[targetIdx].uid || (curr.email && curr.email.toLowerCase() === mail))) {
      curr.password = pass;
      if (mail.indexOf('@') !== -1) curr.email = mail;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(curr));
    }

    // Xóa session OTP
    localStorage.removeItem('AURELIA_PWD_RESET_V4');

    // Ghi nhật ký kiểm toán bảo mật
    if (typeof this.logAuditEvent === 'function') {
      this.logAuditEvent('AUTH_SECURITY', 'Thiết lập mật khẩu mới thành công qua xác thực Gmail ' + maskSecureEmail(mail), users[targetIdx].uid);
    }

    // Gửi thông báo xác nhận vào hệ thống
    if (typeof this.addNotification === 'function') {
      this.addNotification(
        'Đổi Mật Khẩu Thành Công',
        'Mật khẩu tài khoản ' + maskSecureEmail(mail) + ' đã được cập nhật thành công vào lúc ' + new Date().toLocaleTimeString('vi-VN') + '.',
        'success'
      );
    }

    return {
      success: true,
      message: 'Mật khẩu đã được cấp lại thành công! Quý khách có thể đăng nhập bằng mật khẩu mới ngay.'
    };
  };

  AppCore.prototype.topUpWallet = function (amount) {
    var amt = Number(amount) || 2000000000;
    var user = this.getCurrentUser();
    if (!user) {
      return { success: false, message: 'Quý khách chưa đăng nhập tài khoản!' };
    }

    user.walletAvailable = (user.walletAvailable || 0) + amt;

    var users = this.getUsers();
    var idx = users.findIndex(function (u) { return u.uid === user.uid; });
    if (idx !== -1) {
      users[idx] = user;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    this.broadcast('WALLET_TOPPED_UP', { user: user, addedAmount: amt });
    user.success = true;
    return user;
  };

  AppCore.prototype.registerUser = function (fullName, email) {
    var res = this.register(fullName, email, '123456', 5000000000);
    return res.user;
  };

  // =========================================================================
  // ESCROW DEPOSITS (15% CỌC)
  // =========================================================================
  AppCore.prototype.getDeposits = function (roomId) {
    try {
      var data = localStorage.getItem(STORAGE_KEYS.DEPOSITS);
      var all = data ? JSON.parse(data) : getInitialDeposits();
      if (roomId) {
        return all.filter(function (d) { return d.roomId === roomId; });
      }
      return all;
    } catch (e) {
      return [];
    }
  };

  AppCore.prototype.hasUserDeposited = function (roomId, uid) {
    var user = uid ? { uid: uid } : this.getCurrentUser();
    if (!user) return false;
    var deposits = this.getDeposits(roomId);
    return deposits.some(function (d) {
      return d.uid === user.uid && d.status === 'LOCKED';
    });
  };

  AppCore.prototype.depositEscrow = function (roomId, customAmountOrUser, customUser) {
    var room = this.getRoom(roomId);
    if (!room) return { success: false, message: 'Phòng không tồn tại!' };

    var user = null;
    if (customAmountOrUser && typeof customAmountOrUser === 'object') {
      user = customAmountOrUser;
    } else if (customUser && typeof customUser === 'object') {
      user = customUser;
    } else {
      user = this.getCurrentUser();
    }
    if (!user) return { success: false, message: 'Vui lòng đăng nhập để nộp cọc!' };

    var depositAmount = (typeof customAmountOrUser === 'number' && customAmountOrUser > 0) 
      ? customAmountOrUser 
      : (room.depositAmount || Math.round((room.startPrice || 0) * 0.15));

    if (this.hasUserDeposited(room.roomId, user.uid)) {
      return { success: true, message: 'Quý khách đã nộp cọc cho phiên này rồi.' };
    }

    if ((user.walletAvailable || 0) < depositAmount) {
      return {
        success: false,
        message: 'Số dư khả dụng không đủ để nộp cọc (Cần: ' + this.formatCurrency(depositAmount) + '). Vui lòng bấm nạp tiền vào ví.'
      };
    }

    // Deduct available, add to escrow
    user.walletAvailable = user.walletAvailable - depositAmount;
    user.walletEscrow = (user.walletEscrow || 0) + depositAmount;

    // Record deposit
    var deposits = this.getDeposits();
    var newDep = {
      id: 'dep-' + Date.now(),
      roomId: room.roomId,
      uid: user.uid,
      fullName: user.fullName,
      paddleId: user.paddleId,
      amount: depositAmount,
      status: 'LOCKED',
      timestamp: Date.now()
    };
    deposits.push(newDep);

    // Save users
    var users = this.getUsers();
    var idx = users.findIndex(function (u) { return u.uid === user.uid; });
    if (idx !== -1) users[idx] = user;

    localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(deposits));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    var curr = this.getCurrentUser();
    if (curr && curr.uid === user.uid) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }

    this.broadcast('ESCROW_DEPOSITED', { roomId: room.roomId, deposit: newDep, user: user });
    return { success: true, deposit: newDep };
  };

  AppCore.prototype.submitDeposit = function (roomId, customUser) {
    return this.depositEscrow(roomId, customUser);
  };

  // =========================================================================
  // BIDDING LOGIC & ANTI-SNIPING (+30s)
  // =========================================================================
  AppCore.prototype.getBids = function (roomId) {
    try {
      var data = localStorage.getItem(STORAGE_KEYS.BIDS);
      var all = data ? JSON.parse(data) : getInitialBids();
      if (!all || all.length === 0) {
        all = getInitialBids();
        localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(all));
      }
      if (roomId) {
        var cleanId = String(roomId).replace('#', '').trim();
        return all
          .filter(function (b) {
            return b.roomId === cleanId || b.roomPin === cleanId || 
                   b.roomId === ('room-' + cleanId) || b.lotId === cleanId;
          })
          .sort(function (a, b) { return b.amount - a.amount; });
      }
      return all;
    } catch (e) {
      return [];
    }
  };

  AppCore.prototype.placeBid = function (roomId, amount, bidType, customUser) {
    var room = this.getRoom(roomId);
    if (!room) return { success: false, message: 'Phòng không tồn tại!' };

    if (room.status !== 'LIVE') {
      return { success: false, message: 'Phiên đấu giá chưa mở sàn hoặc đã kết thúc!' };
    }

    var user = customUser || this.getCurrentUser();
    if (!user) return { success: false, message: 'Vui lòng đăng nhập để ra giá!' };

    // Host cannot bid on own item!
    if (user.uid === room.sellerId) {
      return { success: false, message: 'Chủ tài sản không được phép tự trả giá cho vật phẩm của mình!' };
    }

    // Bidder cannot outbid themselves
    if (room.leaderUid === user.uid) {
      return { success: false, message: 'Bạn đang là người dẫn đầu phiên này! Không thể tự đặt giá đè lên chính mình.' };
    }

    // Must have deposited
    if (!this.hasUserDeposited(room.roomId, user.uid)) {
      return { success: false, message: 'Quý khách cần nộp tiền cọc ký quỹ (15%) trước khi tham gia trả giá!' };
    }

    var bidAmount = Number(amount);
    var currentPrice = Number(room.currentPrice || room.startPrice || 0);
    var stepPrice = Number(room.stepPrice || 10000000);
    var minRequired = (room.leaderUid) ? (currentPrice + stepPrice) : room.startPrice;

    if (bidAmount < minRequired) {
      return {
        success: false,
        message: 'Mức giá đề xuất (' + this.formatCurrency(bidAmount) + ') phải tối thiểu bằng: ' + this.formatCurrency(minRequired)
      };
    }

    // Anti-Sniping Check: If remaining time < 30s, add +30s
    var isAntiSnipingTriggered = false;
    var newEndTime = room.endTime;
    if (room.endTime) {
      var remainingMs = new Date(room.endTime).getTime() - Date.now();
      if (remainingMs > 0 && remainingMs < 30000) {
        newEndTime = new Date(new Date(room.endTime).getTime() + 30000).toISOString();
        isAntiSnipingTriggered = true;
      }
    }

    // Save Bid
    var bids = this.getBids();
    var newBid = {
      id: 'bid-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      roomId: room.roomId,
      bidderUid: user.uid,
      bidderName: user.fullName,
      paddleId: user.paddleId,
      amount: bidAmount,
      type: bidType || 'MANUAL',
      timestamp: Date.now()
    };
    bids.unshift(newBid);
    localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(bids));

    // Update Room Leader & Price
    var patch = {
      currentPrice: bidAmount,
      leaderUid: user.uid,
      leaderName: user.fullName,
      leaderPaddleId: user.paddleId,
      endTime: newEndTime,
      participantsCount: (room.participantsCount || 1) + 1
    };
    var updatedRoom = this.updateRoom(room.roomId, patch);

    this.broadcast('NEW_BID', {
      roomId: room.roomId,
      bid: newBid,
      room: updatedRoom,
      isAntiSniping: isAntiSnipingTriggered
    });

    return { success: true, bid: newBid, isAntiSniping: isAntiSnipingTriggered };
  };

  // Helper for Demo: Simulate a rival bidder depositing and bidding +1 step
  AppCore.prototype.simulateBid = function (roomId) {
    var room = this.getRoom(roomId);
    if (!room || room.status !== 'LIVE') return null;

    var users = this.getUsers();
    // Pick user who is NOT seller and NOT current leader
    var candidate = users.find(function (u) {
      return u.uid !== room.sellerId && u.uid !== room.leaderUid;
    }) || users[1];

    if (!candidate) return null;

    // Ensure candidate has deposited
    if (!this.hasUserDeposited(room.roomId, candidate.uid)) {
      this.depositEscrow(room.roomId, candidate);
    }

    var nextAmount = Number(room.currentPrice || room.startPrice) + Number(room.stepPrice || 50000000);
    return this.placeBid(room.roomId, nextAmount, 'DEMO_RIVAL', candidate);
  };

  AppCore.prototype.simulateBotRivalBid = function (roomId) {
    return this.simulateBid(roomId);
  };

  // =========================================================================
  // RESET & UTILITIES
  // =========================================================================
  AppCore.prototype.resetDemoData = function () {
    try {
      for (var k in STORAGE_KEYS) {
        if (STORAGE_KEYS.hasOwnProperty(k)) {
          localStorage.removeItem(STORAGE_KEYS[k]);
        }
      }
    } catch (e) {}
    this.init();
    this.broadcast('RESET_DATA', {});
    window.location.reload();
  };

  AppCore.prototype.formatCurrency = function (val) {
    var num = Number(val) || 0;
    return new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
  };

  AppCore.prototype.formatUSD = function (val) {
    var num = Number(val) || 0;
    return '$' + new Intl.NumberFormat('en-US').format(Math.round(num / 25000));
  };

  AppCore.prototype.getFallbackImage = function (title, category) {
    return generateFallbackSVG(title, category);
  };


  // =========================================================================
  // WATCHLIST SYSTEM (Heart button on every card across website)
  // =========================================================================
  AppCore.prototype.getWatchlist = function () {
    try {
      var data = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
      return data ? JSON.parse(data) : ['room-101', 'room-102'];
    } catch (e) {
      return ['room-101', 'room-102'];
    }
  };

  AppCore.prototype.toggleWatchlist = function (idOrPin) {
    var room = this.getRoom(idOrPin);
    var targetId = room ? room.roomId : String(idOrPin);
    var list = this.getWatchlist();
    var idx = list.indexOf(targetId);
    var added = false;
    if (idx > -1) {
      list.splice(idx, 1);
      added = false;
    } else {
      list.push(targetId);
      added = true;
    }
    localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(list));
    this.broadcast('WATCHLIST_UPDATED', { list: list, targetId: targetId, added: added });
    
    // Auto sync wishlists in headers
    var count = list.length;
    var badge = document.getElementById('wishlist-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }

    if (window.showToast) {
      var title = room ? room.title : 'Phiên đấu giá';
      if (added) {
        window.showToast('Đã Lưu Vào Watchlist', 'Đã thêm "' + (title.length > 30 ? title.substring(0, 28) + '...' : title) + '" vào danh sách theo dõi.', 'success', 2500);
      } else {
        window.showToast('Đã Bỏ Theo Dõi', 'Đã gỡ vật phẩm khỏi danh sách theo dõi.', 'info', 2000);
      }
    }
    return added;
  };

  AppCore.prototype.isWatched = function (idOrPin) {
    var room = this.getRoom(idOrPin);
    var targetId = room ? room.roomId : String(idOrPin);
    var list = this.getWatchlist();
    return list.indexOf(targetId) > -1 || (room && list.indexOf(room.roomPin) > -1);
  };

  AppCore.prototype.getWatchedRooms = function () {
    var list = this.getWatchlist();
    var rooms = this.getRooms();
    var matched = rooms.filter(function (r) {
      return list.indexOf(r.roomId) > -1 || 
             list.indexOf(r.roomPin) > -1 || 
             list.indexOf(r.id) > -1 || 
             list.indexOf('room-' + r.lotNumber) > -1 ||
             list.indexOf(String(r.lotNumber)) > -1;
    });
    // Fallback: If watchlist had default room IDs that were filtered, ensure at least first 2 featured rooms
    if (matched.length === 0 && list.length > 0 && rooms.length > 0) {
      return rooms.slice(0, 2);
    }
    return matched;
  };

  // =========================================================================
  // NOTIFICATIONS SYSTEM
  // =========================================================================
  AppCore.prototype.getNotifications = function () {
    try {
      var data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : getInitialNotifications();
    } catch (e) {
      return getInitialNotifications();
    }
  };

  AppCore.prototype.addNotification = function (title, message, type) {
    var notifs = this.getNotifications();
    var newNotif = {
      id: 'notif-' + Date.now(),
      title: title || 'Thông báo mới',
      message: message || '',
      type: type || 'info',
      time: 'Vừa xong',
      read: false
    };
    notifs.unshift(newNotif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    this.broadcast('NOTIFICATION_ADDED', { notification: newNotif });
    return newNotif;
  };

  AppCore.prototype.getUnreadNotifCount = function () {
    var notifs = this.getNotifications();
    return notifs.filter(function (n) { return !n.read; }).length;
  };

  AppCore.prototype.markNotifsAsRead = function () {
    var notifs = this.getNotifications();
    notifs.forEach(function (n) { n.read = true; });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    this.broadcast('NOTIFICATIONS_READ', {});
    return true;
  };

  // =========================================================================
  // CATEGORIES SYSTEM
  // =========================================================================
  AppCore.prototype.getCategories = function () {
    try {
      var data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : getInitialCategories();
    } catch (e) {
      return getInitialCategories();
    }
  };

  AppCore.prototype.addCategory = function (cat) {
    if (!cat || !cat.name) return { success: false, message: 'Tên danh mục không được để trống' };
    var cats = this.getCategories();
    var slug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    cats.push({
      slug: slug,
      name: cat.name,
      count: 0,
      image: cat.image || 'assets/images/french_oil_painting.jpg',
      desc: cat.desc || ''
    });
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
    this.broadcast('CATEGORIES_UPDATED', { categories: cats });
    return { success: true };
  };

  AppCore.prototype.deleteCategory = function (slug) {
    var cats = this.getCategories();
    var filtered = cats.filter(function (c) { return c.slug !== slug; });
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(filtered));
    this.broadcast('CATEGORIES_UPDATED', { categories: filtered });
    return true;
  };

  // =========================================================================
  // AUDIT LOGS & ADMIN ACTIONS
  // =========================================================================
  AppCore.prototype.getAuditLogs = function () {
    try {
      var data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : getInitialAuditLogs();
    } catch (e) {
      return getInitialAuditLogs();
    }
  };

  AppCore.prototype.logAuditEvent = function (action, detail, actor) {
    var logs = this.getAuditLogs();
    var newLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleString('vi-VN'),
      action: action,
      detail: detail,
      actor: actor || 'Admin (#AD-01)'
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 100)));
    this.broadcast('AUDIT_LOG_ADDED', { log: newLog });
    return newLog;
  };

  AppCore.prototype.approveRoom = function (roomId) {
    var room = this.getRoom(roomId);
    if (!room) return { success: false, message: 'Không tìm thấy phòng' };
    var now = Date.now();
    var totalMs = (room.durationMinutes || 45) * 60000;
    var updated = this.updateRoom(room.roomId, {
      status: 'LIVE',
      adminApproved: true,
      startTime: new Date().toISOString(),
      endTime: new Date(now + totalMs).toISOString()
    });
    this.logAuditEvent('APPROVE_ROOM', 'Duyệt thành công niêm yết Phiên #' + (room.roomPin || room.roomId) + ' - ' + room.title, 'Admin (#AD-01)');
    this.addNotification('Phiên của bạn đã được duyệt', 'Phiên đấu giá #' + (room.roomPin || room.roomId) + ' "' + room.title + '" đã được Admin phê chuẩn và chính thức mở sàn LIVE!', 'success');
    if (window.showToast) {
      window.showToast('Phê Chuẩn Thành Công', 'Đã duyệt niêm yết phiên #' + (room.roomPin || room.roomId) + ' lên sàn chính thức.', 'success', 3000);
    }
    return { success: true, room: updated };
  };

  AppCore.prototype.rejectRoom = function (roomId, reason) {
    var room = this.getRoom(roomId);
    if (!room) return { success: false, message: 'Không tìm thấy phòng' };
    var rReason = String(reason || '').trim() || 'Hồ sơ sản phẩm chưa đạt chuẩn thẩm định Geneva Seal.';
    var updated = this.updateRoom(room.roomId, {
      status: 'REJECTED',
      rejectionReason: rReason
    });
    this.logAuditEvent('REJECT_ROOM', 'Từ chối phiên #' + (room.roomPin || room.roomId) + ' - Lý do: ' + rReason, 'Admin (#AD-01)');
    this.addNotification('Hồ sơ phiên bị từ chối', 'Phiên #' + (room.roomPin || room.roomId) + ' bị từ chối: "' + rReason + '". Bạn có thể chỉnh sửa lại trong Không Gian Cá Nhân.', 'error');
    if (window.showToast) {
      window.showToast('Đã Từ Chối Phiên', 'Đã lưu lý do và gửi thông báo phản hồi cho người bán.', 'warning', 3000);
    }
    return { success: true, room: updated };
  };

  AppCore.prototype.toggleUserLock = function (uid) {
    var users = this.getUsers();
    var idx = users.findIndex(function (u) { return u.uid === uid; });
    if (idx === -1) return { success: false, message: 'Không tìm thấy người dùng' };
    users[idx].isLocked = !users[idx].isLocked;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    var curr = this.getCurrentUser();
    if (curr && curr.uid === uid) {
      curr.isLocked = users[idx].isLocked;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(curr));
    }
    this.logAuditEvent('TOGGLE_USER_LOCK', (users[idx].isLocked ? 'Khóa tài khoản ' : 'Mở khóa tài khoản ') + users[idx].fullName + ' (' + users[idx].paddleId + ')', 'Admin (#AD-01)');
    this.broadcast('USER_UPDATED', { user: users[idx] });
    if (window.showToast) {
      window.showToast(users[idx].isLocked ? 'Đã Khóa Tài Khoản' : 'Đã Mở Khóa Tài Khoản', 'Tài khoản ' + users[idx].fullName + ' đã được ' + (users[idx].isLocked ? 'khóa' : 'mở khóa') + '.', 'info', 2500);
    }
    return { success: true, isLocked: users[idx].isLocked };
  };

  AppCore.prototype.getTransactions = function () {
    try {
      var data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : getInitialTransactions();
    } catch (e) {
      return getInitialTransactions();
    }
  };

  // =========================================================================
  // USER PERSONAL VAULT, WON LOTS & INVENTORY
  // =========================================================================
  AppCore.prototype.getUserWonLots = function (uid) {
    var curr = this.getCurrentUser();
    var targetUid = uid || (curr ? curr.uid : 'usr-thang-6651');
    var targetPaddle = curr ? curr.paddleId : '#PD-6651';
    var rooms = this.getRooms();
    return rooms.filter(function (r) {
      return r.status === 'ENDED' && (r.winnerUid === targetUid || r.winnerPaddle === targetPaddle || r.leaderUid === targetUid);
    });
  };

  AppCore.prototype.getUserActiveLots = function (uid) {
    var curr = this.getCurrentUser();
    var targetUid = uid || (curr ? curr.uid : 'usr-thang-6651');
    var deposits = this.getDeposits();
    var myDepositedRoomIds = deposits.filter(function (d) { return d.uid === targetUid; }).map(function (d) { return d.roomId; });
    var rooms = this.getRooms();
    return rooms.filter(function (r) {
      return (r.status === 'LIVE' || r.status === 'WAITING') && 
             (myDepositedRoomIds.indexOf(r.roomId) > -1 || myDepositedRoomIds.indexOf(r.roomPin) > -1 || r.leaderUid === targetUid);
    });
  };

  AppCore.prototype.getUserListedLots = function (uid) {
    var curr = this.getCurrentUser();
    var targetUid = uid || (curr ? curr.uid : 'usr-thang-6651');
    var rooms = this.getRooms();
    return rooms.filter(function (r) {
      return r.sellerId === targetUid || r.sellerPaddleId === (curr ? curr.paddleId : '#PD-6651');
    });
  };

  AppCore.prototype.getUserInventory = function (uid) {
    // Inventory includes won lots + personal custody items
    var won = this.getUserWonLots(uid);
    var items = won.map(function (r) {
      return {
        id: 'inv-' + (r.id || r.roomId),
        lotId: r.id || r.roomId,
        title: r.title,
        categoryName: r.categoryName || 'Tài sản cao cấp',
        acquiredPrice: r.currentPrice || r.startPrice,
        certNo: (r.appraisal && r.appraisal.certNo) ? r.appraisal.certNo : 'AURELIA-VAULT-101',
        acquiredDate: '04/11/2026',
        image: (r.images && r.images[0]) ? r.images[0] : 'assets/images/patek_nautilus_gold.jpg',
        vaultLocation: 'Geneva FreePort Vault Section B'
      };
    });
    return items;
  };

  AppCore.prototype.resellLot = function (lotId) {
    var room = this.getRoom(lotId);
    if (!room) return { success: false, message: 'Không tìm thấy vật phẩm' };
    // Create new pending auction in seller studio
    var pin = String(Math.floor(100000 + Math.random() * 900000));
    var curr = this.getCurrentUser();
    var newRoom = {
      roomId: 'room-' + pin,
      id: 'lot-' + pin,
      lotNumber: pin.substring(0, 3),
      roomPin: pin,
      title: '[Tái Niêm Yết] ' + room.title,
      category: room.category,
      categoryName: room.categoryName,
      shortDesc: room.shortDesc,
      startPrice: Math.round(room.currentPrice * 1.05),
      currentPrice: Math.round(room.currentPrice * 1.05),
      stepPrice: room.stepPrice,
      depositAmount: Math.round(room.currentPrice * 1.05 * 0.15),
      status: 'PENDING_APPROVAL',
      durationMinutes: 45,
      durationSeconds: 2700,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 2700000).toISOString(),
      featured: false,
      sellerId: curr ? curr.uid : 'usr-thang-6651',
      sellerName: curr ? curr.fullName : 'Phạm Ngọc Thắng',
      sellerPaddleId: curr ? curr.paddleId : '#PD-6651',
      images: room.images || [],
      specs: room.specs || {},
      appraisal: room.appraisal || {}
    };
    this.upsertRoom(newRoom);
    this.logAuditEvent('RESELL_LOT', 'Nhà sưu tầm tái niêm yết tài sản #' + pin + ' ' + room.title, curr ? curr.fullName : 'User');
    this.addNotification('Tái niêm yết thành công', 'Vật phẩm "' + room.title + '" đã được gửi hồ sơ duyệt niêm yết mã PIN #' + pin + '.', 'info');
    if (window.showToast) {
      window.showToast('Tái Niêm Yết Thành Công', 'Đã tạo phiên mới #' + pin + ' chờ Admin duyệt.', 'success', 3000);
    }
    return { success: true, newRoom: newRoom };
  };

  AppCore.prototype.paySettlement = function (roomId) {
    var room = this.getRoom(roomId);
    if (!room) return { success: false, message: 'Không tìm thấy phiên' };
    var user = this.getCurrentUser();
    if (!user) return { success: false, message: 'Vui lòng đăng nhập' };
    
    var remaining = (room.currentPrice || room.startPrice) - (room.depositAmount || 0);
    if (user.walletAvailable < remaining) {
      return { success: false, message: 'Số dư khả dụng không đủ để thanh toán phần còn lại!' };
    }
    
    user.walletAvailable -= remaining;
    var users = this.getUsers();
    var uIdx = users.findIndex(function (u) { return u.uid === user.uid; });
    if (uIdx > -1) users[uIdx].walletAvailable = user.walletAvailable;
    
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    
    this.updateRoom(room.roomId, { isFullyPaid: true });
    this.logAuditEvent('PAY_SETTLEMENT', 'Thanh toán hoàn tất nghĩa vụ tài chính cho phiên #' + (room.roomPin || room.roomId), user.fullName);
    this.addNotification('Thanh toán thành công', 'Đã tất toán số tiền ' + this.formatCurrency(remaining) + ' cho phiên #' + (room.roomPin || room.roomId) + '. Biên bản bàn giao tài sản có hiệu lực ngay lập tức.', 'success');
    
    if (window.showToast) {
      window.showToast('Thanh Toán Thành Công', 'Đã tất toán thành công nghĩa vụ trúng đấu giá!', 'success', 3000);
    }
    return { success: true, remaining: remaining };
  };

  // =========================================================================
  // EXPORT TO WINDOW (GLOBAL SINGLETON)
  // =========================================================================
  var coreInstance = new AppCore();
  window.AureliaApp = coreInstance;
  window.AuctionStore = coreInstance; // Alias for backward compatibility
  window.AuctionApp = coreInstance;   // Alias for backward compatibility
  window.dbService = coreInstance;    // Direct full-featured reference

  window.stateManager = {
    getItems: function () { return coreInstance.getRooms(); },
    getItem: function (id) { return coreInstance.getRoom(id); },
    getTheme: function () { return localStorage.getItem('AE_V3_THEME') || 'light'; },
    setTheme: function (t) { localStorage.setItem('AE_V3_THEME', t); }
  };

  // =========================================================================
  // UNIVERSAL FLOATING TOAST SYSTEM (Smooth, Zero Disruptive alert())
  // =========================================================================
  window.showToast = function(title, message, type, duration) {
    try {
      var tType = type || 'info'; // 'success' | 'error' | 'warning' | 'info'
      var dur = duration || 3500;

      var container = document.getElementById('aurelia-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'aurelia-toast-container';
        container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:999999;display:flex;flex-direction:column;gap:10px;pointer-events:none;max-width:380px;width:calc(100% - 40px);';
        document.body.appendChild(container);
      }

      var borderColor = '#0F172A';
      var iconSvg = '<svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke-width:2;stroke:currentColor;fill:none;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';

      if (tType === 'success') {
        borderColor = '#059669';
        iconSvg = '<svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke-width:2;stroke:#059669;fill:none;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
      } else if (tType === 'error') {
        borderColor = '#DC2626';
        iconSvg = '<svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke-width:2;stroke:#DC2626;fill:none;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
      } else if (tType === 'warning') {
        borderColor = '#D97706';
        iconSvg = '<svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke-width:2;stroke:#D97706;fill:none;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
      }

      var toast = document.createElement('div');
      toast.style.cssText = 'pointer-events:auto;background:#FFFFFF;color:#0F172A;border:1px solid #E2E8F0;border-left:4px solid ' + borderColor + ';border-radius:8px;padding:12px 16px;box-shadow:0 10px 25px -5px rgba(0,0,0,0.1),0 8px 10px -6px rgba(0,0,0,0.1);display:flex;align-items:flex-start;gap:12px;font-family:system-ui,-apple-system,sans-serif;font-size:0.84rem;transform:translateX(100%);opacity:0;transition:all 0.3s cubic-bezier(0.16,1,0.3,1);';

      toast.innerHTML = '<div style="flex-shrink:0;margin-top:2px;">' + iconSvg + '</div>' +
        '<div style="flex-grow:1;">' +
          (title ? '<div style="font-weight:700;color:#0F172A;font-size:0.86rem;margin-bottom:2px;">' + title + '</div>' : '') +
          '<div style="color:#475569;line-height:1.4;">' + (message || '') + '</div>' +
        '</div>' +
        '<button type="button" style="background:none;border:none;color:#94A3B8;cursor:pointer;padding:0;margin-left:4px;font-size:16px;line-height:1;" onclick="this.parentElement.remove();">&times;</button>';

      container.appendChild(toast);

      setTimeout(function() {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
      }, 10);

      setTimeout(function() {
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';
        setTimeout(function() { if (toast.parentElement) toast.remove(); }, 350);
      }, dur);
    } catch (e) {
      console.log('[Toast]', title, message);
    }
  };

  console.log('[AureliaApp] Core state manager initialized successfully.');

})(window);
