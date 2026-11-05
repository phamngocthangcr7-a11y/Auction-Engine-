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
    ROOMS: 'AE_ROOMS_V10_FINAL',
    USERS: 'AE_USERS_V10_FINAL',
    CURRENT_USER: 'AE_CURRENT_USER_V10_FINAL',
    DEPOSITS: 'AE_DEPOSITS_V10_FINAL',
    BIDS: 'AE_BIDS_V10_FINAL',
    EVENTS: 'AE_EVENTS_V10_FINAL',
    WATCHLIST: 'AE_WATCHLIST_V10_FINAL',
    NOTIFICATIONS: 'AE_NOTIFICATIONS_V10_FINAL',
    AUDIT_LOGS: 'AE_AUDIT_LOGS_V10_FINAL',
    CATEGORIES: 'AE_CATEGORIES_V10_FINAL',
    TRANSACTIONS: 'AE_TRANSACTIONS_V10_FINAL',
    VAULT: 'AE_VAULT_V10_FINAL',
    THEME: 'AE_THEME_V10_FINAL'
  };

  // Global Unified Lot Status Helper (Bug 6 / Nhóm 2)
  function getLotStatus(lot) {
    if (!lot) return 'ENDED';
    var now = Date.now();
    if (lot.status === 'ENDED') return 'ENDED';
    if (lot.status === 'LIVE') {
      if (lot.endTime && now >= new Date(lot.endTime).getTime()) {
        return 'ENDED';
      }
      return 'LIVE';
    }
    if (lot.status === 'WAITING' || lot.status === 'PENDING_APPROVAL' || !lot.status) {
      return 'WAITING';
    }
    return lot.status;
  }
  window.getLotStatus = getLotStatus;

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
        status: 'WAITING',
        durationMinutes: 45,
        durationSeconds: 2700,
        startTime: null,
        endTime: null,
        featured: true,
        leaderUid: 'usr-tan-2048',
        leaderName: 'Phan Minh Tân',
        leaderPaddleId: '#PD-2048',
        sellerId: 'usr-thang-6651',
        sellerName: 'Phạm Ngọc Thắng',
        sellerPaddleId: '#PD-6651',
        participantsCount: 22,
        likedBy: [],
        baseLikes: 46,
        likesCount: 46,
        images: [
          'assets/images/patek_nautilus_gold.jpg'
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
        status: 'WAITING',
        durationMinutes: 50,
        durationSeconds: 3000,
        startTime: null,
        endTime: null,
        featured: true,
        leaderUid: 'usr-bao-3390',
        leaderName: 'Trần Hoàng Bảo',
        leaderPaddleId: '#PD-3390',
        sellerId: 'usr-thang-6651',
        sellerName: 'Phạm Ngọc Thắng',
        sellerPaddleId: '#PD-6651',
        participantsCount: 18,
        likedBy: [],
        baseLikes: 39,
        likesCount: 39,
        images: [
          'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=85'
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
        status: 'WAITING',
        durationMinutes: 35,
        durationSeconds: 2100,
        startTime: null,
        endTime: null,
        featured: false,
        leaderUid: 'usr-tan-2048',
        leaderName: 'Phan Minh Tân',
        leaderPaddleId: '#PD-2048',
        sellerId: 'usr-thang-6651',
        sellerName: 'Phạm Ngọc Thắng',
        sellerPaddleId: '#PD-6651',
        participantsCount: 14,
        likedBy: [],
        baseLikes: 35,
        likesCount: 35,
        images: [
          'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1200&q=85'
        ],
        specs: {
          'Chất liệu': 'Platinum 950 Nguyên Khối',
          'Mặt số': 'Ice Blue dập vân tia sunburst độc quyền',
          'Bộ máy': 'Calibre 4130 Tự động Chronograph In-House',
          'Năm sản xuất': '2023 • Geneva, Thụy Sĩ'
        },
        appraisal: {
          inspector: "Christie's Watches Department",
          score: '9.8/10',
          certNo: 'RLX-CH-582019',
          provenance: 'Bộ sưu tập tư nhân Zurich'
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
        shortDesc: 'Đỉnh cao động cơ V8 tăng áp kép đặt giữa mạnh nhất Maranello, sơn đỏ Rosso Corsa huyền thoại kết hợp gói khí động học S-Duct carbon.',
        startPrice: 11200000000,
        currentPrice: 11500000000,
        stepPrice: 150000000,
        depositAmount: 1680000000,
        status: 'WAITING',
        durationMinutes: 40,
        durationSeconds: 2400,
        startTime: null,
        endTime: null,
        featured: false,
        leaderUid: 'usr-long-5521',
        leaderName: 'Hoàng Kim Long',
        leaderPaddleId: '#PD-5521',
        sellerId: 'usr-thang-6651',
        sellerName: 'Phạm Ngọc Thắng',
        sellerPaddleId: '#PD-6651',
        participantsCount: 11,
        likedBy: [],
        baseLikes: 32,
        likesCount: 32,
        images: [
          'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=85'
        ],
        specs: {
          'Động cơ': '3.9L Twin-Turbo V8',
          'Công suất': '720 Mã lực • 0-100 km/h: 2.9s',
          'Odometer': '580 km',
          'Năm sản xuất': '2023 • Maranello, Ý'
        },
        appraisal: {
          inspector: 'Ferrari Classiche Maranello Certified',
          score: '9.9/10 Pristine',
          certNo: 'FE-IT-488900',
          provenance: 'Chính chủ đặt hàng đợt 1 Ferrari S.p.A'
        }
      },
      {
        roomId: 'room-105',
        id: 'lot-105',
        lotNumber: '105',
        roomPin: '771029',
        title: 'Máy Ảnh Cơ Vintage Leica M6 Titanium Edition 1992',
        category: 'tech',
        categoryName: 'Thiết bị Công nghệ hiếm',
        shortDesc: 'Phiên bản kỷ niệm bọc da đà điểu tự nhiên, thân máy titan nguyên khối cơ khí chuẩn xác 100%, đi kèm ống kính Summilux-M 50mm f/1.4 Titanium.',
        startPrice: 180000000,
        currentPrice: 205000000,
        stepPrice: 5000000,
        depositAmount: 27000000,
        status: 'WAITING',
        durationMinutes: 30,
        durationSeconds: 1800,
        startTime: null,
        endTime: null,
        featured: false,
        leaderUid: 'usr-bao-3390',
        leaderName: 'Trần Hoàng Bảo',
        leaderPaddleId: '#PD-3390',
        sellerId: 'usr-thang-6651',
        sellerName: 'Phạm Ngọc Thắng',
        sellerPaddleId: '#PD-6651',
        participantsCount: 8,
        likedBy: [],
        baseLikes: 29,
        likesCount: 29,
        images: [
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=85'
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
        roomPin: '339182',
        title: 'Claude Monet "L\'Aube Dorée" 1878 (Museum Oil on Canvas)',
        category: 'art',
        categoryName: 'Tranh Nghệ thuật & Cổ vật',
        shortDesc: 'Kiệt tác trường phái Ấn tượng miêu tả bình minh sông Seine, có chữ ký gốc của danh họa Claude Monet, đầy đủ hồ sơ lai lịch 146 năm.',
        startPrice: 8500000000,
        currentPrice: 8850000000,
        stepPrice: 100000000,
        depositAmount: 1275000000,
        status: 'WAITING',
        durationMinutes: 60,
        durationSeconds: 3600,
        startTime: null,
        endTime: null,
        featured: false,
        leaderUid: 'usr-khoi-9912',
        leaderName: 'Nguyễn Minh Khôi',
        leaderPaddleId: '#PD-9912',
        sellerId: 'usr-thang-6651',
        sellerName: 'Phạm Ngọc Thắng',
        sellerPaddleId: '#PD-6651',
        participantsCount: 9,
        likedBy: [],
        baseLikes: 27,
        likesCount: 27,
        images: [
          'assets/images/french_oil_painting.jpg'
        ],
        specs: {
          'Họa sĩ': 'Claude Monet (1840 - 1926)',
          'Kỹ thuật': 'Sơn dầu trên toan (Oil on canvas)',
          'Kích thước': '65 x 81 cm (Chưa tính khung mạ vàng)',
          'Năm sáng tác': '1878 • Paris, Pháp'
        },
        appraisal: {
          inspector: "Wildenstein Plattner Institute (Paris)",
          score: '10/10 Museum Quality',
          certNo: 'ART-FR-339182',
          provenance: 'Bộ sưu tập tư nhân Durand-Ruel Paris'
        }
      },
      {
        roomId: 'room-107',
        id: 'lot-107',
        lotNumber: '107',
        roomPin: '662019',
        title: 'Audemars Piguet Royal Oak Gold Edition Chronometer',
        category: 'watches',
        categoryName: 'Đồng hồ Cơ Thụy Sĩ',
        shortDesc: 'Kiệt tác thể thao sang trọng vỏ vàng khối 18K, mặt số hoa văn Petite Tapisserie tinh xảo, bộ chuyển động tự động đỉnh cao Le Brassus.',
        startPrice: 1950000000,
        currentPrice: 2020000000,
        stepPrice: 35000000,
        depositAmount: 292500000,
        status: 'WAITING',
        durationMinutes: 30,
        durationSeconds: 1800,
        startTime: null,
        endTime: null,
        featured: false,
        leaderUid: 'usr-tan-2048',
        leaderName: 'Phan Minh Tân',
        leaderPaddleId: '#PD-2048',
        sellerId: 'usr-thang-6651',
        sellerName: 'Phạm Ngọc Thắng',
        sellerPaddleId: '#PD-6651',
        participantsCount: 15,
        likedBy: [],
        baseLikes: 25,
        likesCount: 25,
        images: [
          'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=85'
        ],
        specs: {
          'Chất liệu': 'Vàng hồng 18K Rose Gold',
          'Đường kính': '41 mm',
          'Mặt số': 'Họa tiết Petite Tapisserie dập nổi thủ công',
          'Năm sản xuất': '2023 • Le Brassus, Thụy Sĩ'
        },
        appraisal: {
          inspector: 'Geneva Horological Inspection Service',
          score: '9.9/10',
          certNo: 'AP-CH-662019',
          provenance: 'Đại lý ủy quyền chính thức Audemars Piguet Geneva'
        }
      },
      {
        roomId: 'room-108',
        id: 'lot-108',
        lotNumber: '108',
        roomPin: '884012',
        title: 'Mercedes-AMG GT Black Series Collector Edition',
        category: 'hypercars',
        categoryName: 'Siêu xe & Mô tô hiếm',
        shortDesc: 'Kỷ lục gia Nürburgring của Mercedes-AMG, động cơ V8 trục khuỷu phẳng flat-plane mạnh nhất lịch sử thương hiệu ngôi sao ba cánh.',
        startPrice: 16500000000,
        currentPrice: 16800000000,
        stepPrice: 200000000,
        depositAmount: 2475000000,
        status: 'WAITING',
        durationMinutes: 45,
        durationSeconds: 2700,
        startTime: null,
        endTime: null,
        featured: false,
        leaderUid: 'usr-long-5521',
        leaderName: 'Hoàng Kim Long',
        leaderPaddleId: '#PD-5521',
        sellerId: 'usr-thang-6651',
        sellerName: 'Phạm Ngọc Thắng',
        sellerPaddleId: '#PD-6651',
        participantsCount: 12,
        likedBy: [],
        baseLikes: 23,
        likesCount: 23,
        images: [
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=85'
        ],
        specs: {
          'Động cơ': '4.0L Bi-Turbo V8 Flat-Plane Crank',
          'Công suất': '730 Mã lực • Mô-men xoắn 800 Nm',
          'Odometer': '350 km',
          'Năm sản xuất': '2022 • Affalterbach, Đức'
        },
        appraisal: {
          inspector: 'AMG Performance Center Affalterbach',
          score: '9.9/10',
          certNo: 'MB-DE-884012',
          provenance: 'Bộ sưu tập Siêu xe Bavaria'
        }
      },
      {
        roomId: 'room-109',
        id: 'lot-109',
        lotNumber: '109',
        roomPin: '112093',
        title: 'Bình Gốm Cổ Men Lam Triều Minh Thế Kỷ 15 (Imperial Ming Dynasty)',
        category: 'art',
        categoryName: 'Tranh Nghệ thuật & Cổ vật',
        shortDesc: 'Cổ vật Cung đình Cảnh Đức Trấn thời Tuyên Đức (1426-1435), họa tiết mây rồng 5 móng vẽ men lam coban Sumali quý giá bậc nhất.',
        startPrice: 6200000000,
        currentPrice: 6500000000,
        stepPrice: 100000000,
        depositAmount: 930000000,
        status: 'WAITING',
        durationMinutes: 40,
        durationSeconds: 2400,
        startTime: null,
        endTime: null,
        featured: false,
        leaderUid: 'usr-khoi-9912',
        leaderName: 'Nguyễn Minh Khôi',
        leaderPaddleId: '#PD-9912',
        sellerId: 'usr-thang-6651',
        sellerName: 'Phạm Ngọc Thắng',
        sellerPaddleId: '#PD-6651',
        participantsCount: 7,
        likedBy: [],
        baseLikes: 21,
        likesCount: 21,
        images: [
          'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=85'
        ],
        specs: {
          'Niên đại': 'Thời Minh Tuyên Đức (1426 - 1435)',
          'Chất liệu': 'Gốm sứ tráng men lam cô-ban tự nhiên (Smalt Blue)',
          'Chiều cao': '38.5 cm • Đường kính miệng: 14 cm',
          'Tình trạng': 'Nguyên vẹn 100% không qua phục chế'
        },
        appraisal: {
          inspector: 'Oxford Authentication Thermoluminescence Laboratory',
          score: '10/10 Imperial Certified',
          certNo: 'TL-OX-112093',
          provenance: 'Bộ sưu tập Huệ Đức Đường Hương Cảng'
        }
      },
      {
        roomId: 'room-110',
        id: 'lot-110',
        lotNumber: '110',
        roomPin: '250196',
        title: 'Ferrari 250 GTO 1962 Classic Legend Scaglietti',
        category: 'hypercars',
        categoryName: 'Siêu xe & Mô tô hiếm',
        shortDesc: 'Bảo vật vĩ đại nhất lịch sử xe hơi thể thao toàn cầu, thân xe chế tác thủ công Scaglietti, khối động cơ Tipo 168/62 Colombo V12 nguyên bản.',
        startPrice: 25000000000,
        currentPrice: 25000000000,
        stepPrice: 500000000,
        depositAmount: 3750000000,
        status: 'WAITING',
        durationMinutes: 60,
        durationSeconds: 3600,
        startTime: null,
        endTime: null,
        featured: true,
        leaderUid: null,
        leaderName: null,
        leaderPaddleId: null,
        sellerId: 'usr-thang-6651',
        sellerName: 'Phạm Ngọc Thắng',
        sellerPaddleId: '#PD-6651',
        participantsCount: 3,
        likedBy: [],
        baseLikes: 19,
        likesCount: 19,
        images: [
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85'
        ],
        specs: {
          'Động cơ': '3.0L Colombo V12 Hút khí tự nhiên',
          'Khung sườn': 'Chassis #3445GT Số khung động cơ trùng khớp',
          'Năm sản xuất': '1962 • Maranello, Ý',
          'Thành tích': 'Chiến thắng giải đua Tour de France Automobile 1964'
        },
        appraisal: {
          inspector: 'Ferrari Classiche Maranello Red Book Certified',
          score: '10/10 Museum Legend',
          certNo: 'F250-GTO-1962',
          provenance: 'Bộ sưu tập Hoàng gia Monaco'
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
        status: 'WAITING',
        durationMinutes: 30,
        durationSeconds: 1800,
        startTime: null,
        endTime: null,
        featured: false,
        leaderUid: null,
        leaderName: null,
        leaderPaddleId: null,
        sellerId: 'usr-thang-6651',
        sellerName: 'Phạm Ngọc Thắng',
        sellerPaddleId: '#PD-6651',
        participantsCount: 4,
        likedBy: [],
        baseLikes: 18,
        likesCount: 18,
        images: [
          'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1000&q=85'
        ],
        specs: {
          'Bộ máy': 'Caliber 324 S C Tự động',
          'Chất liệu': 'Thép không gỉ 316L',
          'Đường kính': '40.8 mm',
          'Tình trạng': 'Mới 100% Fullset 2024'
        },
        appraisal: {
          inspector: 'Geneva Horology Bureau',
          score: '10/10',
          certNo: 'PP-5167A-648291',
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
        finalPrice: 8500000000,
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
        winnerPaddleId: '#PD-6651',
        sellerId: 'usr-bao-3390',
        sellerName: 'Trần Hoàng Bảo',
        sellerPaddleId: '#PD-3390',
        participantsCount: 16,
        likedBy: [],
        baseLikes: 58,
        likesCount: 58,
        images: [
          'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?auto=format&fit=crop&w=1200&q=85'
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
      },
      {
        roomId: 'room-113',
        id: 'lot-113',
        lotNumber: '113',
        roomPin: '772910',
        title: 'Rolls-Royce Phantom VIII Bespoke Celestial Edition',
        category: 'hypercars',
        categoryName: 'Siêu xe & Mô tô hiếm',
        shortDesc: 'Đỉnh cao xa xỉ của ngành xe hơi thế giới, trần sao Starlight Headliner khảm kim cương thật, sơn ngoại thất Diamond Black hai tông màu.',
        startPrice: 35000000000,
        currentPrice: 38200000000,
        finalPrice: 38200000000,
        stepPrice: 500000000,
        depositAmount: 5250000000,
        status: 'ENDED',
        durationMinutes: 60,
        durationSeconds: 3600,
        startTime: new Date(now - 14400000).toISOString(),
        endTime: new Date(now - 7200000).toISOString(),
        featured: false,
        leaderUid: 'usr-tan-2048',
        leaderName: 'Phan Minh Tân',
        leaderPaddleId: '#PD-2048',
        winnerUid: 'usr-tan-2048',
        winnerName: 'Phan Minh Tân',
        winnerPaddleId: '#PD-2048',
        sellerId: 'usr-thang-6651',
        sellerName: 'Phạm Ngọc Thắng',
        sellerPaddleId: '#PD-6651',
        participantsCount: 19,
        likedBy: [],
        baseLikes: 52,
        likesCount: 52,
        images: [
          'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=85'
        ],
        specs: {
          'Động cơ': '6.75L Twin-Turbo V12',
          'Nội thất': 'Da bò đực Bavaria thêu tay chỉ vàng',
          'Năm sản xuất': '2023 • Goodwood, Anh Quốc'
        },
        appraisal: {
          inspector: 'Rolls-Royce Motor Cars Goodwood Bureau',
          score: '10/10 Bespoke Pristine',
          certNo: 'RR-UK-772910',
          provenance: 'Giao dịch bảo mật khách hàng danh dự VIP'
        }
      },
      {
        roomId: 'room-114',
        id: 'lot-114',
        lotNumber: '114',
        roomPin: '720019',
        title: 'The Macallan 72 Years Old In Lalique Genesis Decanter',
        category: 'art',
        categoryName: 'Tranh Nghệ thuật & Cổ vật',
        shortDesc: 'Chai whisky mạch nha đơn cất 72 năm lâu đời nhất thế giới đặt trong bình pha lê Lalique chế tác thủ công tinh xảo, số lượng giới hạn toàn cầu.',
        startPrice: 2800000000,
        currentPrice: 3100000000,
        finalPrice: 3100000000,
        stepPrice: 50000000,
        depositAmount: 420000000,
        status: 'ENDED',
        durationMinutes: 45,
        durationSeconds: 2700,
        startTime: new Date(now - 21600000).toISOString(),
        endTime: new Date(now - 10800000).toISOString(),
        featured: false,
        leaderUid: 'usr-bao-3390',
        leaderName: 'Trần Hoàng Bảo',
        leaderPaddleId: '#PD-3390',
        winnerUid: 'usr-bao-3390',
        winnerName: 'Trần Hoàng Bảo',
        winnerPaddleId: '#PD-3390',
        sellerId: 'usr-thang-6651',
        sellerName: 'Phạm Ngọc Thắng',
        sellerPaddleId: '#PD-6651',
        participantsCount: 14,
        likedBy: [],
        baseLikes: 48,
        likesCount: 48,
        images: [
          'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=1200&q=85'
        ],
        specs: {
          'Dung tích': '700 ml • Nồng độ cồn: 42.0% ABV',
          'Bình đựng': 'Pha lê Lalique Crystal thủ công Pháp',
          'Năm đóng chai': '2018 (Chưng cất từ những năm 1940)'
        },
        appraisal: {
          inspector: 'International Rare Spirits Appraisal Board',
          score: '10/10 Collector Grade A+',
          certNo: 'MAC-72-LALIQUE',
          provenance: 'Kho lưu trữ tư nhân Speyside, Scotland'
        }
      }
    ];
  }

  function getInitialBids() {
    return [
  {
    "id": "bid-room-104-1",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-long-5521",
    "bidderName": "Hoàng Kim Long",
    "paddleId": "#PD-5521",
    "amount": 11500000000,
    "type": "MANUAL",
    "timestamp": 1793872802078
  },
  {
    "id": "bid-room-104-2",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-bao-3390",
    "bidderName": "Trần Hoàng Bảo",
    "paddleId": "#PD-3390",
    "amount": 11439285714,
    "type": "MANUAL",
    "timestamp": 1793872712078
  },
  {
    "id": "bid-room-104-3",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-khoi-9912",
    "bidderName": "Nguyễn Minh Khôi",
    "paddleId": "#PD-9912",
    "amount": 11378571429,
    "type": "MANUAL",
    "timestamp": 1793872622078
  },
  {
    "id": "bid-room-104-4",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-tan-2048",
    "bidderName": "Phan Minh Tân",
    "paddleId": "#PD-2048",
    "amount": 11317857143,
    "type": "AUTO",
    "timestamp": 1793872532078
  },
  {
    "id": "bid-room-104-5",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-thang-6651",
    "bidderName": "Phạm Ngọc Thắng",
    "paddleId": "#PD-6651",
    "amount": 11257142857,
    "type": "MANUAL",
    "timestamp": 1793872442078
  },
  {
    "id": "bid-room-104-6",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-duc-7740",
    "bidderName": "Lê Minh Đức",
    "paddleId": "#PD-7740",
    "amount": 11196428571,
    "type": "MANUAL",
    "timestamp": 1793872352078
  },
  {
    "id": "bid-room-104-7",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-vu-6452",
    "bidderName": "Vũ Bảo An",
    "paddleId": "#PD-6452",
    "amount": 11135714286,
    "type": "MANUAL",
    "timestamp": 1793872262078
  },
  {
    "id": "bid-room-104-8",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-trang-1188",
    "bidderName": "Đặng Thuỳ Trang",
    "paddleId": "#PD-1188",
    "amount": 11075000000,
    "type": "AUTO",
    "timestamp": 1793872172078
  },
  {
    "id": "bid-room-104-9",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-long-5521",
    "bidderName": "Hoàng Kim Long",
    "paddleId": "#PD-5521",
    "amount": 11014285714,
    "type": "MANUAL",
    "timestamp": 1793872082078
  },
  {
    "id": "bid-room-104-10",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-bao-3390",
    "bidderName": "Trần Hoàng Bảo",
    "paddleId": "#PD-3390",
    "amount": 10953571429,
    "type": "MANUAL",
    "timestamp": 1793871992078
  },
  {
    "id": "bid-room-104-11",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-khoi-9912",
    "bidderName": "Nguyễn Minh Khôi",
    "paddleId": "#PD-9912",
    "amount": 10892857143,
    "type": "MANUAL",
    "timestamp": 1793871902078
  },
  {
    "id": "bid-room-104-12",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-tan-2048",
    "bidderName": "Phan Minh Tân",
    "paddleId": "#PD-2048",
    "amount": 10832142857,
    "type": "AUTO",
    "timestamp": 1793871812078
  },
  {
    "id": "bid-room-104-13",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-thang-6651",
    "bidderName": "Phạm Ngọc Thắng",
    "paddleId": "#PD-6651",
    "amount": 10771428571,
    "type": "MANUAL",
    "timestamp": 1793871722078
  },
  {
    "id": "bid-room-104-14",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-duc-7740",
    "bidderName": "Lê Minh Đức",
    "paddleId": "#PD-7740",
    "amount": 10710714286,
    "type": "MANUAL",
    "timestamp": 1793871632078
  },
  {
    "id": "bid-room-104-15",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-vu-6452",
    "bidderName": "Vũ Bảo An",
    "paddleId": "#PD-6452",
    "amount": 10650000000,
    "type": "MANUAL",
    "timestamp": 1793871542078
  },
  {
    "id": "bid-room-104-16",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-trang-1188",
    "bidderName": "Đặng Thuỳ Trang",
    "paddleId": "#PD-1188",
    "amount": 10589285714,
    "type": "AUTO",
    "timestamp": 1793871452078
  },
  {
    "id": "bid-room-104-17",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-long-5521",
    "bidderName": "Hoàng Kim Long",
    "paddleId": "#PD-5521",
    "amount": 10528571429,
    "type": "MANUAL",
    "timestamp": 1793871362078
  },
  {
    "id": "bid-room-104-18",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-bao-3390",
    "bidderName": "Trần Hoàng Bảo",
    "paddleId": "#PD-3390",
    "amount": 10467857143,
    "type": "MANUAL",
    "timestamp": 1793871272078
  },
  {
    "id": "bid-room-104-19",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-khoi-9912",
    "bidderName": "Nguyễn Minh Khôi",
    "paddleId": "#PD-9912",
    "amount": 10407142857,
    "type": "MANUAL",
    "timestamp": 1793871182078
  },
  {
    "id": "bid-room-104-20",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-tan-2048",
    "bidderName": "Phan Minh Tân",
    "paddleId": "#PD-2048",
    "amount": 10346428571,
    "type": "AUTO",
    "timestamp": 1793871092078
  },
  {
    "id": "bid-room-104-21",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-thang-6651",
    "bidderName": "Phạm Ngọc Thắng",
    "paddleId": "#PD-6651",
    "amount": 10285714286,
    "type": "MANUAL",
    "timestamp": 1793871002078
  },
  {
    "id": "bid-room-104-22",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-duc-7740",
    "bidderName": "Lê Minh Đức",
    "paddleId": "#PD-7740",
    "amount": 10225000000,
    "type": "MANUAL",
    "timestamp": 1793870912078
  },
  {
    "id": "bid-room-104-23",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-vu-6452",
    "bidderName": "Vũ Bảo An",
    "paddleId": "#PD-6452",
    "amount": 10164285714,
    "type": "MANUAL",
    "timestamp": 1793870822078
  },
  {
    "id": "bid-room-104-24",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-trang-1188",
    "bidderName": "Đặng Thuỳ Trang",
    "paddleId": "#PD-1188",
    "amount": 10103571429,
    "type": "AUTO",
    "timestamp": 1793870732078
  },
  {
    "id": "bid-room-104-25",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-long-5521",
    "bidderName": "Hoàng Kim Long",
    "paddleId": "#PD-5521",
    "amount": 10042857143,
    "type": "MANUAL",
    "timestamp": 1793870642078
  },
  {
    "id": "bid-room-104-26",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-bao-3390",
    "bidderName": "Trần Hoàng Bảo",
    "paddleId": "#PD-3390",
    "amount": 9982142857,
    "type": "MANUAL",
    "timestamp": 1793870552078
  },
  {
    "id": "bid-room-104-27",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-khoi-9912",
    "bidderName": "Nguyễn Minh Khôi",
    "paddleId": "#PD-9912",
    "amount": 9921428571,
    "type": "MANUAL",
    "timestamp": 1793870462078
  },
  {
    "id": "bid-room-104-28",
    "roomId": "room-104",
    "roomPin": "488900",
    "uid": "usr-tan-2048",
    "bidderName": "Phan Minh Tân",
    "paddleId": "#PD-2048",
    "amount": 9860714286,
    "type": "AUTO",
    "timestamp": 1793870372078
  },
  {
    "id": "bid-room-101-1",
    "roomId": "room-101",
    "roomPin": "839201",
    "uid": "usr-vu-6452",
    "bidderName": "Vũ Bảo An",
    "paddleId": "#PD-6452",
    "amount": 2500000000,
    "type": "MANUAL",
    "timestamp": 1793872802078
  },
  {
    "id": "bid-room-101-2",
    "roomId": "room-101",
    "roomPin": "839201",
    "uid": "usr-trang-1188",
    "bidderName": "Đặng Thuỳ Trang",
    "paddleId": "#PD-1188",
    "amount": 2477272727,
    "type": "AUTO",
    "timestamp": 1793872712078
  },
  {
    "id": "bid-room-101-3",
    "roomId": "room-101",
    "roomPin": "839201",
    "uid": "usr-long-5521",
    "bidderName": "Hoàng Kim Long",
    "paddleId": "#PD-5521",
    "amount": 2454545455,
    "type": "MANUAL",
    "timestamp": 1793872622078
  },
  {
    "id": "bid-room-101-4",
    "roomId": "room-101",
    "roomPin": "839201",
    "uid": "usr-bao-3390",
    "bidderName": "Trần Hoàng Bảo",
    "paddleId": "#PD-3390",
    "amount": 2431818182,
    "type": "MANUAL",
    "timestamp": 1793872532078
  },
  {
    "id": "bid-room-101-5",
    "roomId": "room-101",
    "roomPin": "839201",
    "uid": "usr-khoi-9912",
    "bidderName": "Nguyễn Minh Khôi",
    "paddleId": "#PD-9912",
    "amount": 2409090909,
    "type": "MANUAL",
    "timestamp": 1793872442078
  },
  {
    "id": "bid-room-101-6",
    "roomId": "room-101",
    "roomPin": "839201",
    "uid": "usr-tan-2048",
    "bidderName": "Phan Minh Tân",
    "paddleId": "#PD-2048",
    "amount": 2386363636,
    "type": "AUTO",
    "timestamp": 1793872352078
  },
  {
    "id": "bid-room-101-7",
    "roomId": "room-101",
    "roomPin": "839201",
    "uid": "usr-thang-6651",
    "bidderName": "Phạm Ngọc Thắng",
    "paddleId": "#PD-6651",
    "amount": 2363636364,
    "type": "MANUAL",
    "timestamp": 1793872262078
  },
  {
    "id": "bid-room-101-8",
    "roomId": "room-101",
    "roomPin": "839201",
    "uid": "usr-duc-7740",
    "bidderName": "Lê Minh Đức",
    "paddleId": "#PD-7740",
    "amount": 2340909091,
    "type": "MANUAL",
    "timestamp": 1793872172078
  },
  {
    "id": "bid-room-101-9",
    "roomId": "room-101",
    "roomPin": "839201",
    "uid": "usr-vu-6452",
    "bidderName": "Vũ Bảo An",
    "paddleId": "#PD-6452",
    "amount": 2318181818,
    "type": "MANUAL",
    "timestamp": 1793872082078
  },
  {
    "id": "bid-room-101-10",
    "roomId": "room-101",
    "roomPin": "839201",
    "uid": "usr-trang-1188",
    "bidderName": "Đặng Thuỳ Trang",
    "paddleId": "#PD-1188",
    "amount": 2295454545,
    "type": "AUTO",
    "timestamp": 1793871992078
  },
  {
    "id": "bid-room-101-11",
    "roomId": "room-101",
    "roomPin": "839201",
    "uid": "usr-long-5521",
    "bidderName": "Hoàng Kim Long",
    "paddleId": "#PD-5521",
    "amount": 2272727273,
    "type": "MANUAL",
    "timestamp": 1793871902078
  },
  {
    "id": "bid-room-101-12",
    "roomId": "room-101",
    "roomPin": "839201",
    "uid": "usr-bao-3390",
    "bidderName": "Trần Hoàng Bảo",
    "paddleId": "#PD-3390",
    "amount": 2250000000,
    "type": "MANUAL",
    "timestamp": 1793871812078
  },
  {
    "id": "bid-room-101-13",
    "roomId": "room-101",
    "roomPin": "839201",
    "uid": "usr-khoi-9912",
    "bidderName": "Nguyễn Minh Khôi",
    "paddleId": "#PD-9912",
    "amount": 2227272727,
    "type": "MANUAL",
    "timestamp": 1793871722078
  },
  {
    "id": "bid-room-101-14",
    "roomId": "room-101",
    "roomPin": "839201",
    "uid": "usr-tan-2048",
    "bidderName": "Phan Minh Tân",
    "paddleId": "#PD-2048",
    "amount": 2204545455,
    "type": "AUTO",
    "timestamp": 1793871632078
  },
  {
    "id": "bid-room-101-15",
    "roomId": "room-101",
    "roomPin": "839201",
    "uid": "usr-thang-6651",
    "bidderName": "Phạm Ngọc Thắng",
    "paddleId": "#PD-6651",
    "amount": 2181818182,
    "type": "MANUAL",
    "timestamp": 1793871542078
  },
  {
    "id": "bid-room-101-16",
    "roomId": "room-101",
    "roomPin": "839201",
    "uid": "usr-duc-7740",
    "bidderName": "Lê Minh Đức",
    "paddleId": "#PD-7740",
    "amount": 2159090909,
    "type": "MANUAL",
    "timestamp": 1793871452078
  },
  {
    "id": "bid-room-101-17",
    "roomId": "room-101",
    "roomPin": "839201",
    "uid": "usr-vu-6452",
    "bidderName": "Vũ Bảo An",
    "paddleId": "#PD-6452",
    "amount": 2136363636,
    "type": "MANUAL",
    "timestamp": 1793871362078
  },
  {
    "id": "bid-room-101-18",
    "roomId": "room-101",
    "roomPin": "839201",
    "uid": "usr-trang-1188",
    "bidderName": "Đặng Thuỳ Trang",
    "paddleId": "#PD-1188",
    "amount": 2113636364,
    "type": "AUTO",
    "timestamp": 1793871272078
  },
  {
    "id": "bid-room-101-19",
    "roomId": "room-101",
    "roomPin": "839201",
    "uid": "usr-long-5521",
    "bidderName": "Hoàng Kim Long",
    "paddleId": "#PD-5521",
    "amount": 2090909091,
    "type": "MANUAL",
    "timestamp": 1793871182078
  },
  {
    "id": "bid-room-101-20",
    "roomId": "room-101",
    "roomPin": "839201",
    "uid": "usr-bao-3390",
    "bidderName": "Trần Hoàng Bảo",
    "paddleId": "#PD-3390",
    "amount": 2068181818,
    "type": "MANUAL",
    "timestamp": 1793871092078
  },
  {
    "id": "bid-room-101-21",
    "roomId": "room-101",
    "roomPin": "839201",
    "uid": "usr-khoi-9912",
    "bidderName": "Nguyễn Minh Khôi",
    "paddleId": "#PD-9912",
    "amount": 2045454545,
    "type": "MANUAL",
    "timestamp": 1793871002078
  },
  {
    "id": "bid-room-101-22",
    "roomId": "room-101",
    "roomPin": "839201",
    "uid": "usr-tan-2048",
    "bidderName": "Phan Minh Tân",
    "paddleId": "#PD-2048",
    "amount": 2022727273,
    "type": "AUTO",
    "timestamp": 1793870912078
  },
  {
    "id": "bid-room-102-1",
    "roomId": "room-102",
    "roomPin": "911300",
    "uid": "usr-khoi-9912",
    "bidderName": "Nguyễn Minh Khôi",
    "paddleId": "#PD-9912",
    "amount": 14900000000,
    "type": "MANUAL",
    "timestamp": 1793872802078
  },
  {
    "id": "bid-room-102-2",
    "roomId": "room-102",
    "roomPin": "911300",
    "uid": "usr-tan-2048",
    "bidderName": "Phan Minh Tân",
    "paddleId": "#PD-2048",
    "amount": 14822222222,
    "type": "AUTO",
    "timestamp": 1793872712078
  },
  {
    "id": "bid-room-102-3",
    "roomId": "room-102",
    "roomPin": "911300",
    "uid": "usr-thang-6651",
    "bidderName": "Phạm Ngọc Thắng",
    "paddleId": "#PD-6651",
    "amount": 14744444444,
    "type": "MANUAL",
    "timestamp": 1793872622078
  },
  {
    "id": "bid-room-102-4",
    "roomId": "room-102",
    "roomPin": "911300",
    "uid": "usr-duc-7740",
    "bidderName": "Lê Minh Đức",
    "paddleId": "#PD-7740",
    "amount": 14666666667,
    "type": "MANUAL",
    "timestamp": 1793872532078
  },
  {
    "id": "bid-room-102-5",
    "roomId": "room-102",
    "roomPin": "911300",
    "uid": "usr-vu-6452",
    "bidderName": "Vũ Bảo An",
    "paddleId": "#PD-6452",
    "amount": 14588888889,
    "type": "MANUAL",
    "timestamp": 1793872442078
  },
  {
    "id": "bid-room-102-6",
    "roomId": "room-102",
    "roomPin": "911300",
    "uid": "usr-trang-1188",
    "bidderName": "Đặng Thuỳ Trang",
    "paddleId": "#PD-1188",
    "amount": 14511111111,
    "type": "AUTO",
    "timestamp": 1793872352078
  },
  {
    "id": "bid-room-102-7",
    "roomId": "room-102",
    "roomPin": "911300",
    "uid": "usr-long-5521",
    "bidderName": "Hoàng Kim Long",
    "paddleId": "#PD-5521",
    "amount": 14433333333,
    "type": "MANUAL",
    "timestamp": 1793872262078
  },
  {
    "id": "bid-room-102-8",
    "roomId": "room-102",
    "roomPin": "911300",
    "uid": "usr-bao-3390",
    "bidderName": "Trần Hoàng Bảo",
    "paddleId": "#PD-3390",
    "amount": 14355555556,
    "type": "MANUAL",
    "timestamp": 1793872172078
  },
  {
    "id": "bid-room-102-9",
    "roomId": "room-102",
    "roomPin": "911300",
    "uid": "usr-khoi-9912",
    "bidderName": "Nguyễn Minh Khôi",
    "paddleId": "#PD-9912",
    "amount": 14277777778,
    "type": "MANUAL",
    "timestamp": 1793872082078
  },
  {
    "id": "bid-room-102-10",
    "roomId": "room-102",
    "roomPin": "911300",
    "uid": "usr-tan-2048",
    "bidderName": "Phan Minh Tân",
    "paddleId": "#PD-2048",
    "amount": 14200000000,
    "type": "AUTO",
    "timestamp": 1793871992078
  },
  {
    "id": "bid-room-102-11",
    "roomId": "room-102",
    "roomPin": "911300",
    "uid": "usr-thang-6651",
    "bidderName": "Phạm Ngọc Thắng",
    "paddleId": "#PD-6651",
    "amount": 14122222222,
    "type": "MANUAL",
    "timestamp": 1793871902078
  },
  {
    "id": "bid-room-102-12",
    "roomId": "room-102",
    "roomPin": "911300",
    "uid": "usr-duc-7740",
    "bidderName": "Lê Minh Đức",
    "paddleId": "#PD-7740",
    "amount": 14044444444,
    "type": "MANUAL",
    "timestamp": 1793871812078
  },
  {
    "id": "bid-room-102-13",
    "roomId": "room-102",
    "roomPin": "911300",
    "uid": "usr-vu-6452",
    "bidderName": "Vũ Bảo An",
    "paddleId": "#PD-6452",
    "amount": 13966666667,
    "type": "MANUAL",
    "timestamp": 1793871722078
  },
  {
    "id": "bid-room-102-14",
    "roomId": "room-102",
    "roomPin": "911300",
    "uid": "usr-trang-1188",
    "bidderName": "Đặng Thuỳ Trang",
    "paddleId": "#PD-1188",
    "amount": 13888888889,
    "type": "AUTO",
    "timestamp": 1793871632078
  },
  {
    "id": "bid-room-102-15",
    "roomId": "room-102",
    "roomPin": "911300",
    "uid": "usr-long-5521",
    "bidderName": "Hoàng Kim Long",
    "paddleId": "#PD-5521",
    "amount": 13811111111,
    "type": "MANUAL",
    "timestamp": 1793871542078
  },
  {
    "id": "bid-room-102-16",
    "roomId": "room-102",
    "roomPin": "911300",
    "uid": "usr-bao-3390",
    "bidderName": "Trần Hoàng Bảo",
    "paddleId": "#PD-3390",
    "amount": 13733333333,
    "type": "MANUAL",
    "timestamp": 1793871452078
  },
  {
    "id": "bid-room-102-17",
    "roomId": "room-102",
    "roomPin": "911300",
    "uid": "usr-khoi-9912",
    "bidderName": "Nguyễn Minh Khôi",
    "paddleId": "#PD-9912",
    "amount": 13655555556,
    "type": "MANUAL",
    "timestamp": 1793871362078
  },
  {
    "id": "bid-room-102-18",
    "roomId": "room-102",
    "roomPin": "911300",
    "uid": "usr-tan-2048",
    "bidderName": "Phan Minh Tân",
    "paddleId": "#PD-2048",
    "amount": 13577777778,
    "type": "AUTO",
    "timestamp": 1793871272078
  },
  {
    "id": "bid-room-103-1",
    "roomId": "room-103",
    "roomPin": "582019",
    "uid": "usr-thang-6651",
    "bidderName": "Phạm Ngọc Thắng",
    "paddleId": "#PD-6651",
    "amount": 1310000000,
    "type": "MANUAL",
    "timestamp": 1793872802078
  },
  {
    "id": "bid-room-103-2",
    "roomId": "room-103",
    "roomPin": "582019",
    "uid": "usr-duc-7740",
    "bidderName": "Lê Minh Đức",
    "paddleId": "#PD-7740",
    "amount": 1296875000,
    "type": "MANUAL",
    "timestamp": 1793872712078
  },
  {
    "id": "bid-room-103-3",
    "roomId": "room-103",
    "roomPin": "582019",
    "uid": "usr-vu-6452",
    "bidderName": "Vũ Bảo An",
    "paddleId": "#PD-6452",
    "amount": 1283750000,
    "type": "MANUAL",
    "timestamp": 1793872622078
  },
  {
    "id": "bid-room-103-4",
    "roomId": "room-103",
    "roomPin": "582019",
    "uid": "usr-trang-1188",
    "bidderName": "Đặng Thuỳ Trang",
    "paddleId": "#PD-1188",
    "amount": 1270625000,
    "type": "AUTO",
    "timestamp": 1793872532078
  },
  {
    "id": "bid-room-103-5",
    "roomId": "room-103",
    "roomPin": "582019",
    "uid": "usr-long-5521",
    "bidderName": "Hoàng Kim Long",
    "paddleId": "#PD-5521",
    "amount": 1257500000,
    "type": "MANUAL",
    "timestamp": 1793872442078
  },
  {
    "id": "bid-room-103-6",
    "roomId": "room-103",
    "roomPin": "582019",
    "uid": "usr-bao-3390",
    "bidderName": "Trần Hoàng Bảo",
    "paddleId": "#PD-3390",
    "amount": 1244375000,
    "type": "MANUAL",
    "timestamp": 1793872352078
  },
  {
    "id": "bid-room-103-7",
    "roomId": "room-103",
    "roomPin": "582019",
    "uid": "usr-khoi-9912",
    "bidderName": "Nguyễn Minh Khôi",
    "paddleId": "#PD-9912",
    "amount": 1231250000,
    "type": "MANUAL",
    "timestamp": 1793872262078
  },
  {
    "id": "bid-room-103-8",
    "roomId": "room-103",
    "roomPin": "582019",
    "uid": "usr-tan-2048",
    "bidderName": "Phan Minh Tân",
    "paddleId": "#PD-2048",
    "amount": 1218125000,
    "type": "AUTO",
    "timestamp": 1793872172078
  },
  {
    "id": "bid-room-103-9",
    "roomId": "room-103",
    "roomPin": "582019",
    "uid": "usr-thang-6651",
    "bidderName": "Phạm Ngọc Thắng",
    "paddleId": "#PD-6651",
    "amount": 1205000000,
    "type": "MANUAL",
    "timestamp": 1793872082078
  },
  {
    "id": "bid-room-103-10",
    "roomId": "room-103",
    "roomPin": "582019",
    "uid": "usr-duc-7740",
    "bidderName": "Lê Minh Đức",
    "paddleId": "#PD-7740",
    "amount": 1191875000,
    "type": "MANUAL",
    "timestamp": 1793871992078
  },
  {
    "id": "bid-room-103-11",
    "roomId": "room-103",
    "roomPin": "582019",
    "uid": "usr-vu-6452",
    "bidderName": "Vũ Bảo An",
    "paddleId": "#PD-6452",
    "amount": 1178750000,
    "type": "MANUAL",
    "timestamp": 1793871902078
  },
  {
    "id": "bid-room-103-12",
    "roomId": "room-103",
    "roomPin": "582019",
    "uid": "usr-trang-1188",
    "bidderName": "Đặng Thuỳ Trang",
    "paddleId": "#PD-1188",
    "amount": 1165625000,
    "type": "AUTO",
    "timestamp": 1793871812078
  },
  {
    "id": "bid-room-103-13",
    "roomId": "room-103",
    "roomPin": "582019",
    "uid": "usr-long-5521",
    "bidderName": "Hoàng Kim Long",
    "paddleId": "#PD-5521",
    "amount": 1152500000,
    "type": "MANUAL",
    "timestamp": 1793871722078
  },
  {
    "id": "bid-room-103-14",
    "roomId": "room-103",
    "roomPin": "582019",
    "uid": "usr-bao-3390",
    "bidderName": "Trần Hoàng Bảo",
    "paddleId": "#PD-3390",
    "amount": 1139375000,
    "type": "MANUAL",
    "timestamp": 1793871632078
  },
  {
    "id": "bid-room-103-15",
    "roomId": "room-103",
    "roomPin": "582019",
    "uid": "usr-khoi-9912",
    "bidderName": "Nguyễn Minh Khôi",
    "paddleId": "#PD-9912",
    "amount": 1126250000,
    "type": "MANUAL",
    "timestamp": 1793871542078
  },
  {
    "id": "bid-room-103-16",
    "roomId": "room-103",
    "roomPin": "582019",
    "uid": "usr-tan-2048",
    "bidderName": "Phan Minh Tân",
    "paddleId": "#PD-2048",
    "amount": 1113125000,
    "type": "AUTO",
    "timestamp": 1793871452078
  },
  {
    "id": "bid-room-106-1",
    "roomId": "room-106",
    "roomPin": "774120",
    "uid": "usr-vu-6452",
    "bidderName": "Vũ Bảo An",
    "paddleId": "#PD-6452",
    "amount": 720000000,
    "type": "MANUAL",
    "timestamp": 1793872802078
  },
  {
    "id": "bid-room-106-2",
    "roomId": "room-106",
    "roomPin": "774120",
    "uid": "usr-trang-1188",
    "bidderName": "Đặng Thuỳ Trang",
    "paddleId": "#PD-1188",
    "amount": 710000000,
    "type": "AUTO",
    "timestamp": 1793872712078
  },
  {
    "id": "bid-room-106-3",
    "roomId": "room-106",
    "roomPin": "774120",
    "uid": "usr-long-5521",
    "bidderName": "Hoàng Kim Long",
    "paddleId": "#PD-5521",
    "amount": 700000000,
    "type": "MANUAL",
    "timestamp": 1793872622078
  },
  {
    "id": "bid-room-106-4",
    "roomId": "room-106",
    "roomPin": "774120",
    "uid": "usr-bao-3390",
    "bidderName": "Trần Hoàng Bảo",
    "paddleId": "#PD-3390",
    "amount": 690000000,
    "type": "MANUAL",
    "timestamp": 1793872532078
  },
  {
    "id": "bid-room-106-5",
    "roomId": "room-106",
    "roomPin": "774120",
    "uid": "usr-khoi-9912",
    "bidderName": "Nguyễn Minh Khôi",
    "paddleId": "#PD-9912",
    "amount": 680000000,
    "type": "MANUAL",
    "timestamp": 1793872442078
  },
  {
    "id": "bid-room-106-6",
    "roomId": "room-106",
    "roomPin": "774120",
    "uid": "usr-tan-2048",
    "bidderName": "Phan Minh Tân",
    "paddleId": "#PD-2048",
    "amount": 670000000,
    "type": "AUTO",
    "timestamp": 1793872352078
  },
  {
    "id": "bid-room-106-7",
    "roomId": "room-106",
    "roomPin": "774120",
    "uid": "usr-thang-6651",
    "bidderName": "Phạm Ngọc Thắng",
    "paddleId": "#PD-6651",
    "amount": 660000000,
    "type": "MANUAL",
    "timestamp": 1793872262078
  },
  {
    "id": "bid-room-106-8",
    "roomId": "room-106",
    "roomPin": "774120",
    "uid": "usr-duc-7740",
    "bidderName": "Lê Minh Đức",
    "paddleId": "#PD-7740",
    "amount": 650000000,
    "type": "MANUAL",
    "timestamp": 1793872172078
  },
  {
    "id": "bid-room-106-9",
    "roomId": "room-106",
    "roomPin": "774120",
    "uid": "usr-vu-6452",
    "bidderName": "Vũ Bảo An",
    "paddleId": "#PD-6452",
    "amount": 640000000,
    "type": "MANUAL",
    "timestamp": 1793872082078
  },
  {
    "id": "bid-room-106-10",
    "roomId": "room-106",
    "roomPin": "774120",
    "uid": "usr-trang-1188",
    "bidderName": "Đặng Thuỳ Trang",
    "paddleId": "#PD-1188",
    "amount": 630000000,
    "type": "AUTO",
    "timestamp": 1793871992078
  },
  {
    "id": "bid-room-106-11",
    "roomId": "room-106",
    "roomPin": "774120",
    "uid": "usr-long-5521",
    "bidderName": "Hoàng Kim Long",
    "paddleId": "#PD-5521",
    "amount": 620000000,
    "type": "MANUAL",
    "timestamp": 1793871902078
  },
  {
    "id": "bid-room-106-12",
    "roomId": "room-106",
    "roomPin": "774120",
    "uid": "usr-bao-3390",
    "bidderName": "Trần Hoàng Bảo",
    "paddleId": "#PD-3390",
    "amount": 610000000,
    "type": "MANUAL",
    "timestamp": 1793871812078
  },
  {
    "id": "bid-room-106-13",
    "roomId": "room-106",
    "roomPin": "774120",
    "uid": "usr-khoi-9912",
    "bidderName": "Nguyễn Minh Khôi",
    "paddleId": "#PD-9912",
    "amount": 600000000,
    "type": "MANUAL",
    "timestamp": 1793871722078
  },
  {
    "id": "bid-room-106-14",
    "roomId": "room-106",
    "roomPin": "774120",
    "uid": "usr-tan-2048",
    "bidderName": "Phan Minh Tân",
    "paddleId": "#PD-2048",
    "amount": 590000000,
    "type": "AUTO",
    "timestamp": 1793871632078
  },
  {
    "id": "bid-room-107-1",
    "roomId": "room-107",
    "roomPin": "154070",
    "uid": "usr-long-5521",
    "bidderName": "Hoàng Kim Long",
    "paddleId": "#PD-5521",
    "amount": 3250000000,
    "type": "MANUAL",
    "timestamp": 1793872802078
  },
  {
    "id": "bid-room-107-2",
    "roomId": "room-107",
    "roomPin": "154070",
    "uid": "usr-bao-3390",
    "bidderName": "Trần Hoàng Bảo",
    "paddleId": "#PD-3390",
    "amount": 3220833333,
    "type": "MANUAL",
    "timestamp": 1793872712078
  },
  {
    "id": "bid-room-107-3",
    "roomId": "room-107",
    "roomPin": "154070",
    "uid": "usr-khoi-9912",
    "bidderName": "Nguyễn Minh Khôi",
    "paddleId": "#PD-9912",
    "amount": 3191666667,
    "type": "MANUAL",
    "timestamp": 1793872622078
  },
  {
    "id": "bid-room-107-4",
    "roomId": "room-107",
    "roomPin": "154070",
    "uid": "usr-tan-2048",
    "bidderName": "Phan Minh Tân",
    "paddleId": "#PD-2048",
    "amount": 3162500000,
    "type": "AUTO",
    "timestamp": 1793872532078
  },
  {
    "id": "bid-room-107-5",
    "roomId": "room-107",
    "roomPin": "154070",
    "uid": "usr-thang-6651",
    "bidderName": "Phạm Ngọc Thắng",
    "paddleId": "#PD-6651",
    "amount": 3133333333,
    "type": "MANUAL",
    "timestamp": 1793872442078
  },
  {
    "id": "bid-room-107-6",
    "roomId": "room-107",
    "roomPin": "154070",
    "uid": "usr-duc-7740",
    "bidderName": "Lê Minh Đức",
    "paddleId": "#PD-7740",
    "amount": 3104166667,
    "type": "MANUAL",
    "timestamp": 1793872352078
  },
  {
    "id": "bid-room-107-7",
    "roomId": "room-107",
    "roomPin": "154070",
    "uid": "usr-vu-6452",
    "bidderName": "Vũ Bảo An",
    "paddleId": "#PD-6452",
    "amount": 3075000000,
    "type": "MANUAL",
    "timestamp": 1793872262078
  },
  {
    "id": "bid-room-107-8",
    "roomId": "room-107",
    "roomPin": "154070",
    "uid": "usr-trang-1188",
    "bidderName": "Đặng Thuỳ Trang",
    "paddleId": "#PD-1188",
    "amount": 3045833333,
    "type": "AUTO",
    "timestamp": 1793872172078
  },
  {
    "id": "bid-room-107-9",
    "roomId": "room-107",
    "roomPin": "154070",
    "uid": "usr-long-5521",
    "bidderName": "Hoàng Kim Long",
    "paddleId": "#PD-5521",
    "amount": 3016666667,
    "type": "MANUAL",
    "timestamp": 1793872082078
  },
  {
    "id": "bid-room-107-10",
    "roomId": "room-107",
    "roomPin": "154070",
    "uid": "usr-bao-3390",
    "bidderName": "Trần Hoàng Bảo",
    "paddleId": "#PD-3390",
    "amount": 2987500000,
    "type": "MANUAL",
    "timestamp": 1793871992078
  },
  {
    "id": "bid-room-107-11",
    "roomId": "room-107",
    "roomPin": "154070",
    "uid": "usr-khoi-9912",
    "bidderName": "Nguyễn Minh Khôi",
    "paddleId": "#PD-9912",
    "amount": 2958333333,
    "type": "MANUAL",
    "timestamp": 1793871902078
  },
  {
    "id": "bid-room-107-12",
    "roomId": "room-107",
    "roomPin": "154070",
    "uid": "usr-tan-2048",
    "bidderName": "Phan Minh Tân",
    "paddleId": "#PD-2048",
    "amount": 2929166667,
    "type": "AUTO",
    "timestamp": 1793871812078
  },
  {
    "id": "bid-room-108-1",
    "roomId": "room-108",
    "roomPin": "209441",
    "uid": "usr-khoi-9912",
    "bidderName": "Nguyễn Minh Khôi",
    "paddleId": "#PD-9912",
    "amount": 10100000000,
    "type": "MANUAL",
    "timestamp": 1793872802078
  },
  {
    "id": "bid-room-108-2",
    "roomId": "room-108",
    "roomPin": "209441",
    "uid": "usr-tan-2048",
    "bidderName": "Phan Minh Tân",
    "paddleId": "#PD-2048",
    "amount": 10010000000,
    "type": "AUTO",
    "timestamp": 1793872712078
  },
  {
    "id": "bid-room-108-3",
    "roomId": "room-108",
    "roomPin": "209441",
    "uid": "usr-thang-6651",
    "bidderName": "Phạm Ngọc Thắng",
    "paddleId": "#PD-6651",
    "amount": 9920000000,
    "type": "MANUAL",
    "timestamp": 1793872622078
  },
  {
    "id": "bid-room-108-4",
    "roomId": "room-108",
    "roomPin": "209441",
    "uid": "usr-duc-7740",
    "bidderName": "Lê Minh Đức",
    "paddleId": "#PD-7740",
    "amount": 9830000000,
    "type": "MANUAL",
    "timestamp": 1793872532078
  },
  {
    "id": "bid-room-108-5",
    "roomId": "room-108",
    "roomPin": "209441",
    "uid": "usr-vu-6452",
    "bidderName": "Vũ Bảo An",
    "paddleId": "#PD-6452",
    "amount": 9740000000,
    "type": "MANUAL",
    "timestamp": 1793872442078
  },
  {
    "id": "bid-room-108-6",
    "roomId": "room-108",
    "roomPin": "209441",
    "uid": "usr-trang-1188",
    "bidderName": "Đặng Thuỳ Trang",
    "paddleId": "#PD-1188",
    "amount": 9650000000,
    "type": "AUTO",
    "timestamp": 1793872352078
  },
  {
    "id": "bid-room-108-7",
    "roomId": "room-108",
    "roomPin": "209441",
    "uid": "usr-long-5521",
    "bidderName": "Hoàng Kim Long",
    "paddleId": "#PD-5521",
    "amount": 9560000000,
    "type": "MANUAL",
    "timestamp": 1793872262078
  },
  {
    "id": "bid-room-108-8",
    "roomId": "room-108",
    "roomPin": "209441",
    "uid": "usr-bao-3390",
    "bidderName": "Trần Hoàng Bảo",
    "paddleId": "#PD-3390",
    "amount": 9470000000,
    "type": "MANUAL",
    "timestamp": 1793872172078
  },
  {
    "id": "bid-room-108-9",
    "roomId": "room-108",
    "roomPin": "209441",
    "uid": "usr-khoi-9912",
    "bidderName": "Nguyễn Minh Khôi",
    "paddleId": "#PD-9912",
    "amount": 9380000000,
    "type": "MANUAL",
    "timestamp": 1793872082078
  },
  {
    "id": "bid-room-108-10",
    "roomId": "room-108",
    "roomPin": "209441",
    "uid": "usr-tan-2048",
    "bidderName": "Phan Minh Tân",
    "paddleId": "#PD-2048",
    "amount": 9290000000,
    "type": "AUTO",
    "timestamp": 1793871992078
  },
  {
    "id": "bid-room-105-1",
    "roomId": "room-105",
    "roomPin": "632001",
    "uid": "usr-thang-6651",
    "bidderName": "Phạm Ngọc Thắng",
    "paddleId": "#PD-6651",
    "amount": 400000000,
    "type": "MANUAL",
    "timestamp": 1793872802078
  },
  {
    "id": "bid-room-105-2",
    "roomId": "room-105",
    "roomPin": "632001",
    "uid": "usr-duc-7740",
    "bidderName": "Lê Minh Đức",
    "paddleId": "#PD-7740",
    "amount": 392500000,
    "type": "MANUAL",
    "timestamp": 1793872712078
  },
  {
    "id": "bid-room-105-3",
    "roomId": "room-105",
    "roomPin": "632001",
    "uid": "usr-vu-6452",
    "bidderName": "Vũ Bảo An",
    "paddleId": "#PD-6452",
    "amount": 385000000,
    "type": "MANUAL",
    "timestamp": 1793872622078
  },
  {
    "id": "bid-room-105-4",
    "roomId": "room-105",
    "roomPin": "632001",
    "uid": "usr-trang-1188",
    "bidderName": "Đặng Thuỳ Trang",
    "paddleId": "#PD-1188",
    "amount": 377500000,
    "type": "AUTO",
    "timestamp": 1793872532078
  },
  {
    "id": "bid-room-105-5",
    "roomId": "room-105",
    "roomPin": "632001",
    "uid": "usr-long-5521",
    "bidderName": "Hoàng Kim Long",
    "paddleId": "#PD-5521",
    "amount": 370000000,
    "type": "MANUAL",
    "timestamp": 1793872442078
  },
  {
    "id": "bid-room-105-6",
    "roomId": "room-105",
    "roomPin": "632001",
    "uid": "usr-bao-3390",
    "bidderName": "Trần Hoàng Bảo",
    "paddleId": "#PD-3390",
    "amount": 362500000,
    "type": "MANUAL",
    "timestamp": 1793872352078
  },
  {
    "id": "bid-room-105-7",
    "roomId": "room-105",
    "roomPin": "632001",
    "uid": "usr-khoi-9912",
    "bidderName": "Nguyễn Minh Khôi",
    "paddleId": "#PD-9912",
    "amount": 355000000,
    "type": "MANUAL",
    "timestamp": 1793872262078
  },
  {
    "id": "bid-room-105-8",
    "roomId": "room-105",
    "roomPin": "632001",
    "uid": "usr-tan-2048",
    "bidderName": "Phan Minh Tân",
    "paddleId": "#PD-2048",
    "amount": 347500000,
    "type": "AUTO",
    "timestamp": 1793872172078
  },
  {
    "id": "bid-room-109-1",
    "roomId": "room-109",
    "roomPin": "519302",
    "uid": "usr-vu-6452",
    "bidderName": "Vũ Bảo An",
    "paddleId": "#PD-6452",
    "amount": 1200000000,
    "type": "MANUAL",
    "timestamp": 1793872802078
  },
  {
    "id": "bid-room-109-2",
    "roomId": "room-109",
    "roomPin": "519302",
    "uid": "usr-trang-1188",
    "bidderName": "Đặng Thuỳ Trang",
    "paddleId": "#PD-1188",
    "amount": 1175000000,
    "type": "AUTO",
    "timestamp": 1793872712078
  },
  {
    "id": "bid-room-109-3",
    "roomId": "room-109",
    "roomPin": "519302",
    "uid": "usr-long-5521",
    "bidderName": "Hoàng Kim Long",
    "paddleId": "#PD-5521",
    "amount": 1150000000,
    "type": "MANUAL",
    "timestamp": 1793872622078
  },
  {
    "id": "bid-room-109-4",
    "roomId": "room-109",
    "roomPin": "519302",
    "uid": "usr-bao-3390",
    "bidderName": "Trần Hoàng Bảo",
    "paddleId": "#PD-3390",
    "amount": 1125000000,
    "type": "MANUAL",
    "timestamp": 1793872532078
  },
  {
    "id": "bid-room-109-5",
    "roomId": "room-109",
    "roomPin": "519302",
    "uid": "usr-khoi-9912",
    "bidderName": "Nguyễn Minh Khôi",
    "paddleId": "#PD-9912",
    "amount": 1100000000,
    "type": "MANUAL",
    "timestamp": 1793872442078
  },
  {
    "id": "bid-room-109-6",
    "roomId": "room-109",
    "roomPin": "519302",
    "uid": "usr-tan-2048",
    "bidderName": "Phan Minh Tân",
    "paddleId": "#PD-2048",
    "amount": 1075000000,
    "type": "AUTO",
    "timestamp": 1793872352078
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
    this.setupGlobalRoomSync();
  }

  AppCore.prototype.getLotStatus = getLotStatus;

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
      var parsed = data ? JSON.parse(data) : null;
      if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
        var initial = getInitialRooms();
        localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(initial));
        return initial;
      }
      return parsed.map(function(r) {
        r.status = (typeof getLotStatus === "function") ? getLotStatus(r) : r.status;
        return r;
      });
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
    var winningBid = (bids && bids.length > 0) ? bids[0] : null;
    var finalPrice = winningBid ? winningBid.amount : (room.currentPrice || room.startPrice || 0);
    var winnerUid = winningBid ? (winningBid.bidderUid || winningBid.uid) : (room.leaderUid || '');
    var winnerName = winningBid ? winningBid.bidderName : (room.leaderName || '');
    var winnerPaddleId = winningBid ? winningBid.paddleId : (room.leaderPaddleId || '');

    var updated = this.updateRoom(room.roomId, {
      status: 'ENDED',
      currentPrice: finalPrice,
      finalPrice: finalPrice,
      amount: finalPrice,
      winnerUid: winnerUid,
      winnerName: winnerName,
      winnerPaddleId: winnerPaddleId
    });

    var deposits = this.getDeposits();
    var users = this.getUsers();
    var currUser = this.getCurrentUser();
    var self = this;

    // Bug 14 / Bug 15: 100% Full Auto Settlement on ENDED
    deposits.forEach(function (dep) {
      if ((dep.roomId === room.roomId || dep.roomId === room.roomPin || String(dep.roomId).replace('room-', '') === String(room.roomPin)) && dep.status === 'LOCKED') {
        if (winnerUid && dep.uid === winnerUid) {
          dep.status = 'APPLIED_TO_WIN';
          var winner = users.find(function(u) { return u.uid === winnerUid; });
          if (winner) {
            var depositPaid = dep.amount || Math.round(room.startPrice * 0.15);
            var remaining85 = Math.max(0, finalPrice - depositPaid);
            winner.walletAvailable = Math.max(0, (winner.walletAvailable || 0) - remaining85);
            winner.walletEscrow = Math.max(0, (winner.walletEscrow || 0) - depositPaid);
            // Record 100% full settlement transaction for winner
            self.addTransaction({
              uid: winner.uid,
              type: 'SETTLEMENT',
              method: 'Ví Escrow & Số Dư Khả Dụng',
              amount: finalPrice,
              title: 'Tất toán 100% phiên thắng đấu giá #' + (room.roomPin || room.roomId),
              status: 'COMPLETED'
            });
            // Add item to winner's Vault with estimatedValue = finalPrice
            self.addItemToVault(winner.uid, {
              id: 'vault-' + (room.roomPin || room.roomId),
              roomId: room.roomId,
              roomPin: room.roomPin,
              title: room.title,
              categoryName: room.categoryName || 'Tài Sản Đấu Giá',
              image: (room.images && room.images[0]) || 'assets/images/patek_nautilus_gold.jpg',
              estimatedValue: finalPrice,
              wonAt: new Date().toISOString(),
              status: 'OFFICIALLY_OWNED'
            });
            if (currUser && currUser.uid === winner.uid) {
              currUser.walletAvailable = winner.walletAvailable;
              currUser.walletEscrow = winner.walletEscrow;
              localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currUser));
            }
          }
        } else {
          // Loser: 100% deposit refunded to walletAvailable
          dep.status = 'REFUNDED';
          var loser = users.find(function (u) { return u.uid === dep.uid; });
          if (loser) {
            loser.walletAvailable = (loser.walletAvailable || 0) + dep.amount;
            loser.walletEscrow = Math.max(0, (loser.walletEscrow || 0) - dep.amount);
            // Record deposit refund transaction for Tab 4 & Tab 3
            self.addTransaction({
              uid: loser.uid,
              type: 'REFUND',
              method: 'Hoàn Tiền Ký Quỹ Escrow 100%',
              amount: dep.amount,
              title: '+' + self.formatCurrency(dep.amount) + ' | ĐÃ HOÀN TIỀN CỌC 100% VỀ TÀI KHOẢN (Kết thúc phiên #' + (room.roomPin || room.roomId) + ')',
              status: 'REFUNDED'
            });
            if (currUser && currUser.uid === loser.uid) {
              currUser.walletAvailable = loser.walletAvailable;
              currUser.walletEscrow = loser.walletEscrow;
              localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currUser));
            }
          }
        }
      }
    });

    localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(deposits));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    this.broadcast('AUCTION_SETTLED', { roomId: room.roomId, room: updated, winnerUid: winnerUid, finalPrice: finalPrice });
    return updated;
  };

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
      var data = localStorage.getItem('ae_active_session_user') || localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || localStorage.getItem('AE_V3_CURRENT_USER');
      if (data && data !== 'null' && data !== 'undefined') {
        var parsed = JSON.parse(data);
        if (parsed && (parsed.uid || parsed.paddleId)) {
          // Auto-upgrade user profile to official Phạm Ngọc Thắng (Admin - #PD-6651 - 25 Tỷ)
          if (parsed.uid === 'usr-thang-6651' || parsed.paddleId === '#PD-6651' || parsed.paddleId === '#PD-7256' || (parsed.fullName && parsed.fullName.includes('Thắng'))) {
            parsed.fullName = 'Phạm Ngọc Thắng';
            parsed.mssv = '6651071071';
            parsed.paddleId = '#PD-6651';
            parsed.role = 'admin';
            parsed.isAdmin = true;
            parsed.avatar = 'assets/images/user_thang.jpg';
            if (!parsed.email) parsed.email = 'thang.pn@auctionengine.vn';
            if (!parsed.password) parsed.password = 'admin';
            if (!parsed.walletAvailable || parsed.walletAvailable < 20000000000) {
              parsed.walletAvailable = 25000000000;
            }
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(parsed));
            localStorage.setItem('ae_active_session_user', JSON.stringify(parsed));
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
      localStorage.setItem('ae_active_session_user', JSON.stringify(target));
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
      if (u.role === 'admin' || u.uid === 'usr-thang-6651' || u.paddleId === '#PD-6651') {
        if (query === 'admin' || query === 'superadmin' || query === 'phamngocthangcr7@gmail.com' || query === 'thang' || query === 'thang.pn@auctionengine.vn' || query === 'thang.pn@aurelia.ch') {
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
      localStorage.setItem('ae_active_session_user', JSON.stringify(target));
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
    localStorage.removeItem('ae_active_session_user');
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
    if (isNaN(initBal) || initBal <= 0) initBal = 1000000000; // 10 Tỷ ₫ trải nghiệm mặc định

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
    localStorage.setItem('ae_active_session_user', JSON.stringify(newUser));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
    localStorage.setItem('AE_V3_CURRENT_USER', JSON.stringify(newUser));
    this.broadcast('USER_REGISTERED', { user: newUser });
    this.broadcast('USER_SWITCHED', { user: newUser });
    return { success: true, user: newUser };
  };

  AppCore.prototype.guestJoinByPin = function (pin, guestName) {
    var p = String(pin || '').trim();
    if (!p) return { success: false, message: 'Vui lòng nhập Mã PIN 6 số của phòng đấu giá!' };
    var curr = this.getCurrentUser();
    if (curr) {
      return { success: true, user: curr, pin: p };
    }
    var name = String(guestName || '').trim() || ('Nhà Sưu Tầm #' + p.slice(-3));
    var pinNum = String(Math.floor(1000 + Math.random() * 9000));
    var guestUser = {
      uid: 'usr-guest-' + Date.now(),
      fullName: name,
      email: 'guest.' + Date.now() + '@auctionengine.vn',
      password: 'guest',
      paddleId: '#PD-' + pinNum,
      walletAvailable: 10000000000, // 10 Tỷ ₫ trải nghiệm
      walletEscrow: 0,
      role: 'GUEST_BIDDER',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      createdAt: new Date().toISOString()
    };
    var users = this.getUsers();
    users.push(guestUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.removeItem('AURELIA_LOGGED_OUT');
    localStorage.removeItem('AE_AUTH_LOGGED_OUT');
    localStorage.setItem('ae_active_session_user', JSON.stringify(guestUser));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(guestUser));
    localStorage.setItem('AE_V3_CURRENT_USER', JSON.stringify(guestUser));
    this.broadcast('USER_SWITCHED', { user: guestUser });
    return { success: true, user: guestUser, pin: p };
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

    // Bug 10: Nếu chưa có trong danh sách thì tự động tạo tài khoản Demo cho email này để cấp mã OTP trực tiếp đặt mật khẩu mới
    if (!user) {
      var displayName = mail.split('@')[0];
      displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
      user = {
        uid: 'usr-' + Date.now().toString(36),
        fullName: displayName,
        email: mail,
        password: 'password123',
        paddleId: '#PD-' + Math.floor(1000 + Math.random() * 9000),
        role: 'VIP_BIDDER',
        walletAvailable: 1000000000,
        walletEscrow: 0,
        createdAt: new Date().toISOString()
      };
      users.push(user);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
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

    localStorage.setItem('AE_PWD_RESET_V10', JSON.stringify(resetData));

    return {
      success: true,
      message: 'Mã xác thực OTP đã được cấp: ' + otp + '. Quý khách có thể nhập mã này trực tiếp để đổi mật khẩu mới!',
      email: user.email,
      maskedEmail: user.email,
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

    var rawReset = localStorage.getItem('AE_PWD_RESET_V10');
    if (!rawReset) {
      return { success: false, message: 'Phiên đặt lại mật khẩu không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu lại!' };
    }

    var resetData = JSON.parse(rawReset);
    if (resetData.email.toLowerCase() !== mail) {
      return { success: false, message: 'Email xác thực không khớp với phiên gửi OTP!' };
    }

    if (Date.now() > resetData.expiresAt) {
      localStorage.removeItem('AE_PWD_RESET_V10');
      return { success: false, message: 'Mã xác thực OTP đã hết hiệu lực (quá 5 phút). Vui lòng yêu cầu gửi mã mới!' };
    }

    if (resetData.otp !== enteredOtp) {
      resetData.attempts = (resetData.attempts || 0) + 1;
      if (resetData.attempts >= 5) {
        localStorage.removeItem('AE_PWD_RESET_V10');
        return { success: false, message: 'Quý khách đã nhập sai mã OTP quá 5 lần. Phiên xác thực đã bị hủy vì lý do an toàn.' };
      }
      localStorage.setItem('AE_PWD_RESET_V10', JSON.stringify(resetData));
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
    localStorage.removeItem('AE_PWD_RESET_V10');

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
      var all = data ? JSON.parse(data) : null;
      if (!all || !Array.isArray(all) || all.length === 0) {
        all = getInitialDeposits();
        localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(all));
      }
      if (roomId) {
        var cleanId = String(roomId).replace('room-', '');
        return all.filter(function (d) {
          return d.roomId === roomId || d.roomId === cleanId || String(d.roomId).replace('room-', '') === cleanId;
        });
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
  AppCore.prototype.addBid = function (bid) {
    if (!bid || !bid.roomId) return;
    var all = this.getBids();
    if (!all.some(function (b) { return b.id === bid.id; })) {
      all.unshift(bid);
      localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(all));
      this.broadcast('NEW_BID', { roomId: bid.roomId, bid: bid });
    }
  };

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

    // Unified status check
    var currentStatus = (typeof getLotStatus === 'function') ? getLotStatus(room) : room.status;
    if (currentStatus !== 'LIVE') {
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

    // Reject bids less than or equal to current price
    if (bidAmount <= currentPrice) {
      return {
        success: false,
        message: 'Mức giá đề xuất (' + this.formatCurrency(bidAmount) + ') phải cao hơn mức giá hiện tại (' + this.formatCurrency(currentPrice) + ') tối thiểu 1 bước giá (+' + this.formatCurrency(stepPrice) + ')!'
      };
    }

    // Bug 13 / Nhóm 4: Chặn tuyệt đối việc trả giá vượt quá số tiền hiện có trong Ví
    var userDepositAmount = 0;
    var deposits = this.getDeposits();
    deposits.forEach(function (d) {
      if ((d.roomId === room.roomId || d.roomId === room.roomPin || String(d.roomId).replace('room-', '') === String(room.roomPin)) && d.uid === user.uid && d.status === 'LOCKED') {
        userDepositAmount += (d.amount || 0);
      }
    });
    if (userDepositAmount === 0 && room.depositAmount) {
      userDepositAmount = room.depositAmount;
    }
    var maxAffordable = (user.walletAvailable || 0) + userDepositAmount;
    if (bidAmount > maxAffordable) {
      return {
        success: false,
        isOverLimit: true,
        maxAffordable: maxAffordable,
        message: 'Số dư ví của bạn không đủ để đặt mức giá này! Khả năng thanh toán tối đa hiện tại của bạn là ' + this.formatCurrency(maxAffordable) + '. Vui lòng nạp thêm tiền vào ví!'
      };
    }

    // Reject duplicate price with existing bids
    var roomBids = this.getBids(room.roomId);
    var isDuplicate = roomBids.some(function(b) {
      return Number(b.amount) === bidAmount;
    });
    if (isDuplicate) {
      return {
        success: false,
        message: 'Mức giá ' + this.formatCurrency(bidAmount) + ' đã được người trả giá trước đó ghi nhận. Theo quy chuẩn sàn, người đặt trước được ưu tiên. Vui lòng tăng thêm tối thiểu 1 bước giá!'
      };
    }

    if (bidAmount < minRequired) {
      return {
        success: false,
        message: 'Mức giá trả tối thiểu yêu cầu cho lượt tiếp theo là: ' + this.formatCurrency(minRequired)
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

    // Save Bid with timestamp
    var bids = this.getBids();
    var newBid = {
      id: 'bid-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      roomId: room.roomId,
      roomPin: room.roomPin,
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
      participantsCount: Math.max((room.participantsCount || 1), roomBids.length + 1)
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
  AppCore.prototype.getWatchlist = function (customUserId) {
    try {
      var user = customUserId ? this.getUser(customUserId) : this.getCurrentUser();
      if (!user) return [];
      var userKey = (STORAGE_KEYS.WATCHLIST || 'AE_WATCHLIST_V10_FINAL') + '_' + user.uid;
      var data = localStorage.getItem(userKey);
      if (data) return JSON.parse(data);
      return [];
    } catch (e) {
      return [];
    }
  };

  AppCore.prototype.toggleWatchlist = function (idOrPin, customUserId) {
    var user = customUserId ? this.getUser(customUserId) : this.getCurrentUser();
    if (!user) {
      return { success: false, message: 'Vui lòng đăng nhập để lưu Watchlist!' };
    }

    var userKey = (STORAGE_KEYS.WATCHLIST || 'AE_WATCHLIST_V10_FINAL') + '_' + user.uid;
    var list = [];
    try {
      var data = localStorage.getItem(userKey);
      list = data ? JSON.parse(data) : [];
    } catch(e) {
      list = [];
    }

    var room = this.getRoom(idOrPin);
    var targetPin = room ? (room.roomPin || room.roomId) : String(idOrPin);
    var targetId = room ? room.roomId : String(idOrPin);

    var idx = list.indexOf(targetPin);
    if (idx === -1) idx = list.indexOf(targetId);

    var added = false;
    if (idx > -1) {
      list.splice(idx, 1);
      added = false;
    } else {
      list.push(targetPin);
      added = true;
    }
    localStorage.setItem(userKey, JSON.stringify(list));

    if (room) {
      if (!Array.isArray(room.likedBy)) room.likedBy = [];
      var uIdx = room.likedBy.indexOf(user.uid);
      if (added) {
        if (uIdx === -1) room.likedBy.push(user.uid);
      } else {
        if (uIdx > -1) room.likedBy.splice(uIdx, 1);
      }
      room.likesCount = (room.baseLikes || 20) + room.likedBy.length;
      this.updateRoom(room.roomId, { likedBy: room.likedBy, likesCount: room.likesCount });
    }

    this.broadcast('WATCHLIST_UPDATED', {
      userId: user.uid,
      list: list,
      targetId: targetId,
      roomPin: targetPin,
      added: added,
      likesCount: room ? room.likesCount : 0
    });

    // Auto sync wishlist badge in headers
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
    return { added: added, list: list, likesCount: room ? room.likesCount : 0 };
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

  AppCore.prototype.getTransactions = function (customUserId) {
    try {
      var user = customUserId ? this.getUser(customUserId) : this.getCurrentUser();
      if (!user) return [];
      var key = (STORAGE_KEYS.TRANSACTIONS || 'AE_TRANSACTIONS_V10_FINAL') + '_' + user.uid;
      var data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
      if (user.uid === 'usr-thang-6651') {
        var init = getInitialTransactions();
        localStorage.setItem(key, JSON.stringify(init));
        return init;
      }
      var initUserTx = [
        {
          id: 'tx-' + Date.now().toString(36),
          uid: user.uid,
          type: 'TOPUP',
          method: 'Ký Quỹ Ban Đầu Hệ Thống',
          amount: user.walletAvailable || 1000000000,
          timestamp: Date.now() - 3600000,
          status: 'SUCCESS',
          title: 'Khởi tạo số dư ví tham gia sàn'
        }
      ];
      localStorage.setItem(key, JSON.stringify(initUserTx));
      return initUserTx;
    } catch (e) {
      return [];
    }
  };

  AppCore.prototype.addTransaction = function (txData) {
    var uid = txData.uid;
    if (!uid) {
      var u = this.getCurrentUser();
      uid = u ? u.uid : 'usr-thang-6651';
    }
    var key = (STORAGE_KEYS.TRANSACTIONS || 'AE_TRANSACTIONS_V10_FINAL') + '_' + uid;
    var txs = [];
    try {
      var raw = localStorage.getItem(key);
      txs = raw ? JSON.parse(raw) : [];
    } catch (e) { txs = []; }

    var newTx = {
      id: 'tx-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
      uid: uid,
      type: txData.type || 'TRANSFER',
      method: txData.method || 'Giao dịch trực tuyến',
      amount: Number(txData.amount) || 0,
      timestamp: Date.now(),
      status: txData.status || 'SUCCESS',
      title: txData.title || 'Giao dịch ví'
    };

    txs.unshift(newTx);
    localStorage.setItem(key, JSON.stringify(txs));
    this.broadcast('TRANSACTION_ADDED', { transaction: newTx });
    return newTx;
  };

  AppCore.prototype.topupWallet = function (amount, method, customUserId) {
    var amt = Number(amount);
    if (!amt || amt <= 0) return { success: false, message: 'Vui lòng nhập số tiền hợp lệ lớn hơn 0 ₫!' };
    var user = customUserId ? this.getUser(customUserId) : this.getCurrentUser();
    if (!user) return { success: false, message: 'Vui lòng đăng nhập để nạp tiền vào ví!' };

    var users = this.getUsers();
    var target = users.find(function (u) { return u.uid === user.uid; });
    if (!target) target = user;

    target.walletAvailable = (target.walletAvailable || 0) + amt;
    user.walletAvailable = target.walletAvailable;

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

    var tx = this.addTransaction({
      uid: user.uid,
      type: 'TOPUP',
      method: method || 'Chuyển Khoản Ngân Hàng Tức Thời',
      amount: amt,
      title: 'Nạp tiền vào ví',
      status: 'SUCCESS'
    });

    this.broadcast('WALLET_UPDATED', { uid: user.uid, walletAvailable: target.walletAvailable, tx: tx });
    return { success: true, balance: target.walletAvailable, tx: tx };
  };

  AppCore.prototype.withdrawWallet = function (amount, method, customUserId) {
    var amt = Number(amount);
    if (!amt || amt <= 0) return { success: false, message: 'Vui lòng nhập số tiền hợp lệ lớn hơn 0 ₫!' };
    var user = customUserId ? this.getUser(customUserId) : this.getCurrentUser();
    if (!user) return { success: false, message: 'Vui lòng đăng nhập để rút tiền khỏi ví!' };

    if (amt > (user.walletAvailable || 0)) {
      return {
        success: false,
        message: 'Số dư khả dụng không đủ để rút tiền! Số tiền tối đa có thể rút hiện tại là ' + this.formatCurrency(user.walletAvailable || 0)
      };
    }

    var users = this.getUsers();
    var target = users.find(function (u) { return u.uid === user.uid; });
    if (!target) target = user;

    target.walletAvailable = Math.max(0, (target.walletAvailable || 0) - amt);
    user.walletAvailable = target.walletAvailable;

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

    var tx = this.addTransaction({
      uid: user.uid,
      type: 'WITHDRAW',
      method: method || 'Rút về tài khoản ngân hàng chính chủ',
      amount: amt,
      title: 'Rút tiền khỏi ví',
      status: 'SUCCESS'
    });

    this.broadcast('WALLET_UPDATED', { uid: user.uid, walletAvailable: target.walletAvailable, tx: tx });
    return { success: true, balance: target.walletAvailable, tx: tx };
  };

  AppCore.prototype.addItemToVault = function (uid, item) {
    var targetUid = uid;
    if (!targetUid) {
      var u = this.getCurrentUser();
      targetUid = u ? u.uid : 'usr-thang-6651';
    }
    var key = (STORAGE_KEYS.VAULT || 'AE_VAULT_V10_FINAL') + '_' + targetUid;
    var items = [];
    try {
      var raw = localStorage.getItem(key);
      items = raw ? JSON.parse(raw) : [];
    } catch(e) { items = []; }
    items.unshift(item);
    localStorage.setItem(key, JSON.stringify(items));
    return item;
  };

  AppCore.prototype.getUserInventory = function (uid) {
    var curr = this.getCurrentUser();
    var targetUid = uid || (curr ? curr.uid : 'usr-thang-6651');
    var key = (STORAGE_KEYS.VAULT || 'AE_VAULT_V10_FINAL') + '_' + targetUid;
    try {
      var raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
      if (targetUid === 'usr-thang-6651') {
        var initAdminVault = [
          {
            id: 'vault-192834',
            roomId: 'room-112',
            roomPin: '192834',
            title: 'Rolex Daytona Paul Newman Exotic Dial 1968 Ref. 6239',
            categoryName: 'Đồng Hồ Cơ Thụy Sĩ',
            image: 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?auto=format&fit=crop&w=1200&q=85',
            estimatedValue: 8500000000,
            wonAt: new Date(Date.now() - 3600000).toISOString(),
            status: 'OFFICIALLY_OWNED'
          }
        ];
        localStorage.setItem(key, JSON.stringify(initAdminVault));
        return initAdminVault;
      }
      return [];
    } catch(e) {
      return [];
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
  AppCore.prototype.STORAGE_KEYS = STORAGE_KEYS;
  
  AppCore.prototype.setupGlobalRoomSync = function () {
    var self = this;
    if (typeof mqtt === 'undefined' || typeof mqtt.connect !== 'function') return;

    try {
      var gClient = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
        clientId: 'ae_g_' + Math.random().toString(16).substring(2, 8),
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 10000
      });

      window.globalMqttClient = gClient;

      gClient.on('connect', function () {
        gClient.subscribe('aurelia/auction/global/rooms', { qos: 1 });
      });

      gClient.on('message', function (topic, message) {
        try {
          var data = JSON.parse(message.toString());
          if (!data || !data.room) return;

          if (data.type === 'NEW_GLOBAL_ROOM' || data.type === 'GLOBAL_ROOM_UPDATE') {
            var incoming = data.room;
            var rooms = self.getRooms();
            var idx = rooms.findIndex(function (r) {
              return r.roomId === incoming.roomId || r.roomPin === incoming.roomPin;
            });

            if (idx === -1) {
              rooms.unshift(incoming);
              localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
              self.notify('GLOBAL_ROOM_ADDED', incoming);
              window.dispatchEvent(new CustomEvent('aurelia:rooms-updated', { detail: incoming }));
              if (window.showToast && !data.silent) {
                window.showToast('Phiên đấu giá mới!', incoming.title + ' vừa xuất hiện (#PIN: ' + incoming.roomPin + ')', 'info', 4000);
              }
            } else {
              rooms[idx] = Object.assign(rooms[idx], incoming);
              localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
              self.notify('GLOBAL_ROOM_UPDATED', incoming);
              window.dispatchEvent(new CustomEvent('aurelia:rooms-updated', { detail: incoming }));
            }
          }
        } catch (e) {
          console.warn('[GlobalSync] message error', e);
        }
      });
    } catch (e) {
      console.warn('[GlobalSync] Init error:', e);
    }
  };

  var coreInstance = new AppCore();
  window.STORAGE_KEYS = STORAGE_KEYS;
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
