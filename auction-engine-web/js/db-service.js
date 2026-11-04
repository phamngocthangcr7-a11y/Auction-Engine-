/**
 * AUCTION ENGINE - REALTIME CLOUD & LOCAL DATABASE SERVICE
 * 
 * Kiến trúc:
 * 1. Quản lý Tài khoản & Định danh Nhà sưu tầm (Authentication & Paddle ID)
 * 2. Cấu trúc Bảng dữ liệu: users, auction_rooms, room_deposits, live_bids, room_events
 * 3. Đồng bộ Thời gian thực (Realtime Multi-User Sync) qua:
 *    - BroadcastChannel (đồng bộ tức thì giữa các tab/cửa sổ không độ trễ)
 *    - Cloud Database (Firebase / REST Realtime Sync khi có cấu hình Cloud)
 *    - LocalStorage Persistence Fallback an toàn tuyệt đối
 */


const DB_KEYS = {
  USERS: 'AE_DB_USERS_V2',
  ROOMS: 'AE_DB_ROOMS_V2',
  DEPOSITS: 'AE_DB_DEPOSITS_V2',
  BIDS: 'AE_DB_BIDS_V2',
  EVENTS: 'AE_DB_EVENTS_V2',
  CURRENT_USER: 'AE_DB_CURRENT_USER_V2',
  CLOUD_CONFIG: 'AE_DB_CLOUD_CONFIG_V2'
};


class RealtimeDatabaseService {
  constructor() {
    this.broadcastChannel = null;
    this.cloudConfig = null;
    this.firebaseApp = null;
    this.firebaseDb = null;
    this.listeners = new Map(); // roomId -> array of callbacks


    this.initBroadcastChannel();
    this.initDatabaseDefaults();
    this.loadCloudConfig();
  }


  /**
   * Khởi tạo kênh truyền thời gian thực BroadcastChannel giữa các Tab/Cửa sổ
   */
  initBroadcastChannel() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('AUCTION_ENGINE_REALTIME_BUS');
        this.broadcastChannel.onmessage = (event) => {
          this.handleBroadcastMessage(event.data);
        };
      }
    } catch (e) {
      console.warn('[DBService] BroadcastChannel không khả dụng, sử dụng Storage Event fallback.', e);
    }


    // Fallback qua Storage Event
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('AE_DB_')) {
          this.notifyAllListeners();
        }
      });
    }
  }


  /**
   * Xử lý gói tin đồng bộ nhận được từ Tab khác hoặc Cloud
   */
  handleBroadcastMessage(data) {
    if (!data || !data.type) return;
    console.log(`[DBService Realtime Sync] Nhận sự kiện: ${data.type}`, data.payload);


    // Kích hoạt callback cho các trang đang lắng nghe phòng tương ứng
    if (data.payload && data.payload.roomId) {
      this.notifyRoomListeners(data.payload.roomId, data);
    } else {
      this.notifyAllListeners(data);
    }


    // Đồng bộ số dư nếu có cập nhật ví
    if (data.type === 'WALLET_SYNC' && data.payload.uid === this.getCurrentUser()?.uid) {
      this.refreshCurrentUser();
    }
  }


  /**
   * Phát thông điệp đồng bộ tới tất cả các Tab / Thiết bị khác và cập nhật Tab hiện tại
   */
  broadcast(type, payload = {}) {
    const message = { type, payload, timestamp: Date.now() };
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
      } catch (e) {}
    }


    // Tự kích hoạt cho chính Tab hiện tại để UI cập nhật ngay tức thì 0 mili-giây
    if (payload && payload.roomId) {
      this.notifyRoomListeners(payload.roomId, message);
    } else {
      this.notifyAllListeners(message);
    }


    // Đồng bộ số dư nếu là sự kiện cập nhật ví
    if (type === 'USER_DEPOSITED' || type === 'DEPOSITS_REFUNDED') {
      this.refreshCurrentUser();
    }


    // Đồng bộ lên Cloud nếu đã cấu hình Firebase
    this.syncToCloud(type, payload);
  }


  /**
   * Khởi tạo dữ liệu mẫu ban đầu nếu LocalStorage rỗng
   */
  initDatabaseDefaults() {
    try {
      // 1. Khởi tạo danh sách Users mẫu
      if (!localStorage.getItem(DB_KEYS.USERS)) {
        const defaultUsers = [
          {
            uid: 'usr-alex-01',
            fullName: 'Alex Nguyễn',
            email: 'alex.nguyen@auction.io',
            paddleId: '#PD-8821',
            walletAvailable: 500000000, // 500 triệu VNĐ
            walletEscrow: 0,
            role: 'VIP_COLLECTOR',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            createdAt: new Date().toISOString()
          },
          {
            uid: 'usr-minh-02',
            fullName: 'Minh Luxury',
            email: 'minh.luxury@geneva.ch',
            paddleId: '#PD-7719',
            walletAvailable: 800000000,
            walletEscrow: 0,
            role: 'VIP_COLLECTOR',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
            createdAt: new Date().toISOString()
          },
          {
            uid: 'usr-elena-03',
            fullName: 'Elena Zurich',
            email: 'elena@artvault.ch',
            paddleId: '#PD-9942',
            walletAvailable: 650000000,
            walletEscrow: 0,
            role: 'VIP_COLLECTOR',
            avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
            createdAt: new Date().toISOString()
          }
        ];
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(defaultUsers));
      }


      // 2. Trạng thái người dùng ban đầu: Khách vào trang chủ trước.
      // Khi người dùng tự Đăng Nhập hoặc Đăng Ký, phiên sẽ được lưu vĩnh viễn vào DB.
      if (!localStorage.getItem('AE_INIT_AUTH')) {
        localStorage.setItem('AE_INIT_AUTH', 'true');
      }


      // 3. Khởi tạo danh sách Phòng Đấu Giá Thực Tế (Auction Rooms với PIN 6 số)
      if (!localStorage.getItem(DB_KEYS.ROOMS)) {
        const now = Date.now();
        const defaultRooms = [
          {
            roomId: 'room-patek-6300g',
            roomPin: '839201',
            title: 'Patek Philippe Grandmaster Chime 6300G White Gold',
            category: 'watches',
            categoryName: 'Đồng Hồ Cơ Thụy Sĩ',
            shortDesc: 'Đồng hồ cơ 20 biến năng cơ học phức tạp nhất thế giới, 2 mặt số xoay đảo chiều độc quyền.',
            images: [
              'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80',
              'https://images.unsplash.com/photo-1547996160-71dfabb1b22e?auto=format&fit=crop&w=1200&q=80'
            ],
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            sellerId: 'usr-heritage-geneva',
            sellerName: 'Geneva Horological Heritage',
            startPrice: 80000000, // 80 Triệu VNĐ
            currentPrice: 95000000, // 95 Triệu VNĐ
            stepPrice: 2000000,    // Bước giá: 2 Triệu VNĐ
            buyNowPrice: 150000000,
            depositAmount: 12000000, // Tiền cọc 15%: 12 Triệu VNĐ
            startTime: new Date(now - 30 * 60 * 1000).toISOString(),
            endTime: new Date(now + 25 * 60 * 1000).toISOString(), // Còn 25 phút
            status: 'LIVE',
            leaderUid: 'usr-minh-02',
            leaderName: 'Minh Luxury',
            leaderPaddleId: '#PD-7719',
            participantsCount: 14,
            antiSnipingCount: 0,
            specs: {
              'Hãng sản xuất': 'Patek Philippe (Genève)',
              'Bộ máy': 'Caliber 300 GS AL 36-750 QIS FUS IRM',
              'Đường kính': '47.7 mm',
              'Vật liệu': 'Vàng trắng 18K chạm khắc hoa văn Clous de Paris'
            },
            appraisal: {
              inspector: "Sotheby's Watch Department Geneva",
              score: '9.9/10 (Mint Pristine)',
              certNo: 'PP-CH-2026-8821'
            }
          },
          {
            roomId: 'room-pagani-zonda',
            roomPin: '492108',
            title: 'Pagani Zonda HP Barchetta 2017 (Số 1/3 Bản Riêng Horacio)',
            category: 'hypercars',
            categoryName: 'Siêu Xe & Mô Tô Hiếm',
            shortDesc: 'Siêu xe mui trần không kính chắn gió truyền thống, động cơ Mercedes-AMG V12 7.3L.',
            images: [
              'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
              'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=80'
            ],
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            sellerId: 'usr-modena-apex',
            sellerName: 'Modena Prestige Vault',
            startPrice: 250000000, // 250 Triệu VNĐ
            currentPrice: 285000000,
            stepPrice: 5000000, // Bước giá: 5 Triệu
            buyNowPrice: 400000000,
            depositAmount: 37500000, // Cọc 15%
            startTime: new Date(now - 10 * 60 * 1000).toISOString(),
            endTime: new Date(now + 12 * 60 * 1000).toISOString(), // Còn 12 phút
            status: 'LIVE',
            leaderUid: 'usr-elena-03',
            leaderName: 'Elena Zurich',
            leaderPaddleId: '#PD-9942',
            participantsCount: 22,
            antiSnipingCount: 0,
            specs: {
              'Động cơ': 'Mercedes-AMG 7.3L V12 N/A',
              'Công suất': '789 mã lực / 850 Nm',
              'Hộp số': 'Sàn 6 cấp cơ học thuần chất',
              'Khung vỏ': 'Carbo-Titanium HP62'
            },
            appraisal: {
              inspector: 'Pagani Rinascimento Certified',
              score: '10/10 (Odo 380 km)',
              certNo: 'PAG-HPB-01-IT'
            }
          },
          {
            roomId: 'room-apple-1-1976',
            roomPin: '675234',
            title: 'Apple-1 Computer 1976 Ký Tay Bởi Steve Wozniak',
            category: 'tech',
            categoryName: 'Công Nghệ & Bản Mẫu Hiếm',
            shortDesc: 'Bo mạch khai sinh tập đoàn Apple do Steve Wozniak và Steve Jobs tự hàn tay tại garage 1976.',
            images: [
              'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
              'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80'
            ],
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            sellerId: 'usr-silicon-curator',
            sellerName: 'Computer History Museum Palo Alto',
            startPrice: 40000000,
            currentPrice: 40000000,
            stepPrice: 1000000,
            buyNowPrice: 80000000,
            depositAmount: 6000000,
            startTime: new Date(now + 60 * 60 * 1000).toISOString(),
            endTime: new Date(now + 180 * 60 * 1000).toISOString(),
            status: 'UPCOMING',
            leaderUid: '',
            leaderName: 'Chưa có',
            leaderPaddleId: '',
            participantsCount: 8,
            antiSnipingCount: 0,
            specs: {
              'Vi xử lý': 'MOS 6502 @ 1.0 MHz',
              'RAM': '4 KB (nguyên bản)',
              'Bản chứng nhận': 'Chữ ký tay mực xanh của Steve Wozniak'
            },
            appraisal: {
              inspector: 'Computer History Museum Curators',
              score: '10/10 (Diagnostic Passed)',
              certNo: 'APL1-HIST-083'
            }
          }
        ];
        localStorage.setItem(DB_KEYS.ROOMS, JSON.stringify(defaultRooms));
      }


      // 4. Khởi tạo Ký Quỹ Mẫu (Deposits)
      if (!localStorage.getItem(DB_KEYS.DEPOSITS)) {
        const defaultDeposits = [
          {
            id: 'dep-01',
            roomId: 'room-patek-6300g',
            uid: 'usr-minh-02',
            userName: 'Minh Luxury',
            paddleId: '#PD-7719',
            amount: 12000000,
            status: 'LOCKED',
            timestamp: Date.now() - 25 * 60 * 1000
          },
          {
            id: 'dep-02',
            roomId: 'room-pagani-zonda',
            uid: 'usr-elena-03',
            userName: 'Elena Zurich',
            paddleId: '#PD-9942',
            amount: 37500000,
            status: 'LOCKED',
            timestamp: Date.now() - 9 * 60 * 1000
          }
        ];
        localStorage.setItem(DB_KEYS.DEPOSITS, JSON.stringify(defaultDeposits));
      }


      // 5. Khởi tạo Sổ Lệnh Trả Giá (Bids)
      if (!localStorage.getItem(DB_KEYS.BIDS)) {
        const defaultBids = [
          {
            bidId: 'bid-101',
            roomId: 'room-patek-6300g',
            uid: 'usr-minh-02',
            userName: 'Minh Luxury',
            paddleId: '#PD-7719',
            amount: 95000000,
            bidType: 'MANUAL',
            timestamp: Date.now() - 5 * 60 * 1000
          },
          {
            bidId: 'bid-100',
            roomId: 'room-patek-6300g',
            uid: 'usr-elena-03',
            userName: 'Elena Zurich',
            paddleId: '#PD-9942',
            amount: 90000000,
            bidType: 'MANUAL',
            timestamp: Date.now() - 15 * 60 * 1000
          },
          {
            bidId: 'bid-201',
            roomId: 'room-pagani-zonda',
            uid: 'usr-elena-03',
            userName: 'Elena Zurich',
            paddleId: '#PD-9942',
            amount: 285000000,
            bidType: 'MANUAL',
            timestamp: Date.now() - 3 * 60 * 1000
          }
        ];
        localStorage.setItem(DB_KEYS.BIDS, JSON.stringify(defaultBids));
      }


      // 6. Khởi tạo Dòng Sự Kiện Phòng (Events)
      if (!localStorage.getItem(DB_KEYS.EVENTS)) {
        const defaultEvents = [
          {
            id: 'ev-01',
            roomId: 'room-patek-6300g',
            message: 'Phiên đấu giá chính thức mở sàn.',
            type: 'ROOM_START',
            timestamp: Date.now() - 30 * 60 * 1000
          },
          {
            id: 'ev-02',
            roomId: 'room-patek-6300g',
            message: 'Nhà sưu tầm Minh Luxury (#PD-7719) nộp cọc 12,000,000 VNĐ và gia nhập sàn.',
            type: 'DEPOSIT',
            timestamp: Date.now() - 25 * 60 * 1000
          },
          {
            id: 'ev-03',
            roomId: 'room-patek-6300g',
            message: 'Minh Luxury (#PD-7719) vừa nâng giá lên 95,000,000 VNĐ!',
            type: 'BID',
            timestamp: Date.now() - 5 * 60 * 1000
          }
        ];
        localStorage.setItem(DB_KEYS.EVENTS, JSON.stringify(defaultEvents));
      }
    } catch (e) {
      console.error('[DBService] Lỗi khi nạp dữ liệu mẫu ban đầu:', e);
    }
  }


  // =========================================================================
  // 1. TÀI KHOẢN & AUTHENTICATION
  // =========================================================================


  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEYS.USERS)) || [];
    } catch (e) {
      return [];
    }
  }


  getCurrentUser() {
    try {
      if (localStorage.getItem('AE_AUTH_LOGGED_OUT') === 'true') {
        return null;
      }
      return JSON.parse(localStorage.getItem(DB_KEYS.CURRENT_USER)) || null;
    } catch (e) {
      return null;
    }
  }


  setCurrentUser(user) {
    if (!user) {
      localStorage.removeItem(DB_KEYS.CURRENT_USER);
      localStorage.setItem('AE_AUTH_LOGGED_OUT', 'true');
    } else {
      localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
      localStorage.removeItem('AE_AUTH_LOGGED_OUT');
      // Cập nhật lại trong danh sách users
      const users = this.getUsers();
      const idx = users.findIndex(u => u.uid === user.uid);
      if (idx !== -1) {
        users[idx] = user;
      } else {
        users.push(user);
      }
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    }


    this.broadcast('USER_AUTH_CHANGED', user);
    if (window.eventBus) window.eventBus.publish('USER_CHANGED', user);
  }


  refreshCurrentUser() {
    const curr = this.getCurrentUser();
    if (!curr) return null;
    const users = this.getUsers();
    const found = users.find(u => u.uid === curr.uid);
    if (found) {
      localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(found));
      if (window.eventBus) window.eventBus.publish('USER_CHANGED', found);
      return found;
    }
    return curr;
  }


  generatePaddleId() {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `#PD-${num}`;
  }


  /**
   * Đăng ký tài khoản mới kèm cấp Mã Thẻ Đấu Giá và Ví trải nghiệm
   */
  register(fullName, email, password) {
    const users = this.getUsers();
    const exist = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exist) {
      return { success: false, message: 'Email này đã tồn tại trong hệ thống!' };
    }


    const newUser = {
      uid: `usr-${Date.now()}`,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password: password,
      paddleId: this.generatePaddleId(),
      walletAvailable: 0, // Bắt đầu 0 VNĐ, người dùng chủ động nạp theo nhu cầu
      walletEscrow: 0,
      role: 'VIP_COLLECTOR',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName)}`,
      createdAt: new Date().toISOString()
    };


    users.push(newUser);
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(newUser);


    return { success: true, user: newUser };
  }


  /**
   * Đăng nhập bằng Email & Mật khẩu
   */
  login(email, password) {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { success: false, message: 'Tài khoản không tồn tại!' };
    }
    if (user.password && user.password !== password) {
      return { success: false, message: 'Mật khẩu không chính xác!' };
    }


    this.setCurrentUser(user);
    return { success: true, user };
  }


  /**
   * Đăng nhập nhanh bằng Tên hiển thị (Quick Join Guest)
   */
  quickGuestLogin(displayName) {
    const name = displayName.trim() || 'Nhà Sưu Tầm';
    const guestUser = {
      uid: `usr-guest-${Date.now()}`,
      fullName: name,
      email: `${name.toLowerCase().replace(/\s+/g, '')}@auction.guest`,
      paddleId: this.generatePaddleId(),
      walletAvailable: 0, // Bắt đầu 0 VNĐ
      walletEscrow: 0,
      role: 'GUEST_COLLECTOR',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      createdAt: new Date().toISOString()
    };


    this.setCurrentUser(guestUser);
    return { success: true, user: guestUser };
  }


  logout() {
    localStorage.removeItem(DB_KEYS.CURRENT_USER);
    localStorage.setItem('AE_AUTH_LOGGED_OUT', 'true');
    this.broadcast('USER_LOGOUT', {});
    if (window.eventBus) window.eventBus.publish('USER_CHANGED', null);
  }


  // =========================================================================
  // 2. PHÒNG ĐẤU GIÁ (AUCTION ROOMS)
  // =========================================================================


  getRooms() {
    try {
      let rooms = JSON.parse(localStorage.getItem(DB_KEYS.ROOMS)) || [];
      const now = Date.now();
      let hasUpdate = false;
      rooms = rooms.map(r => {
        // Luôn giữ các phòng chính hoạt động trực tiếp cho demo, không bao giờ bị gõ búa trước
        const isCoreDemoRoom = ['839201', '492108', '675234'].includes(r.roomPin);
        if (isCoreDemoRoom || (r.status === 'LIVE' && new Date(r.endTime).getTime() <= now)) {
          if (new Date(r.endTime).getTime() <= now || r.status === 'ENDED') {
            const addMin = r.roomPin === '839201' ? 30 : r.roomPin === '492108' ? 45 : 35;
            r.endTime = new Date(now + addMin * 60000).toISOString();
            r.status = 'LIVE';
            hasUpdate = true;
          }
        }
        return r;
      });
      if (hasUpdate) {
        localStorage.setItem(DB_KEYS.ROOMS, JSON.stringify(rooms));
      }
      return rooms;
    } catch (e) {
      return [];
    }
  }


  getRoom(roomIdOrPin) {
    const rooms = this.getRooms();
    return rooms.find(r => r.roomId === roomIdOrPin || r.roomPin === String(roomIdOrPin)) || null;
  }


  generateRoomPin() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }


  /**
   * Tạo phòng đấu giá mới với mã PIN 6 số và cọc 15%
   */
  createRoom(roomData) {
    let currentUser = this.getCurrentUser();
    if (!currentUser) {
      const users = this.getUsers();
      currentUser = users[0] || { uid: 'usr-guest-seller', fullName: 'Nhà Sưu Tầm Khách', paddleId: '#PD-0000' };
    }


    const rooms = this.getRooms();
    const roomPin = this.generateRoomPin();
    const roomId = `room-${Date.now()}`;
    const startPrice = Number(roomData.startPrice) || 10000000;
    const depositAmount = Number(roomData.depositAmount) || Math.round(startPrice * 0.15); // Tự động tính 15%


    const newRoom = {
      roomId,
      roomPin,
      title: roomData.title,
      category: roomData.category || 'luxury',
      categoryName: roomData.categoryName || 'Tài Sản Giá Trị Cao',
      shortDesc: roomData.shortDesc || '',
      images: roomData.images && roomData.images.length > 0 ? roomData.images : ['https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80'],
      videoUrl: roomData.videoUrl || '',
      sellerId: currentUser.uid,
      sellerName: currentUser.fullName,
      sellerPaddleId: currentUser.paddleId || '#PD-HOST',
      startPrice: startPrice,
      currentPrice: startPrice,
      stepPrice: Number(roomData.stepPrice) || Math.round(startPrice * 0.05),
      buyNowPrice: roomData.buyNowPrice ? Number(roomData.buyNowPrice) : null,
      depositAmount: depositAmount,
      startTime: roomData.startTime || new Date().toISOString(),
      endTime: roomData.endTime || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      status: 'LIVE',
      leaderUid: '',
      leaderName: 'Chưa có lượt trả',
      leaderPaddleId: '',
      participantsCount: 1,
      antiSnipingCount: 0,
      specs: roomData.specs || {},
      appraisal: roomData.appraisal || {
        inspector: "Sotheby's Certified Inspector",
        score: '10/10 Mint',
        certNo: `CERT-${roomPin}`
      }
    };


    rooms.unshift(newRoom);
    localStorage.setItem(DB_KEYS.ROOMS, JSON.stringify(rooms));


    // Ghi sự kiện tạo phòng
    this.addEvent(roomId, `Phòng đấu giá #${roomPin} đã được khởi tạo bởi ${currentUser.fullName}.`, 'ROOM_START');


    this.broadcast('ROOM_CREATED', { room: newRoom });
    return { success: true, room: newRoom };
  }


  updateRoom(roomId, updates) {
    const rooms = this.getRooms();
    const idx = rooms.findIndex(r => r.roomId === roomId);
    if (idx === -1) return false;


    rooms[idx] = { ...rooms[idx], ...updates };
    localStorage.setItem(DB_KEYS.ROOMS, JSON.stringify(rooms));


    this.broadcast('ROOM_UPDATED', { roomId, updates, room: rooms[idx] });
    return rooms[idx];
  }


  // =========================================================================
  // 3. ĐẶT CỌC KÝ QUỸ (ESCROW DEPOSIT LOGIC)
  // =========================================================================


  getDeposits(roomId) {
    try {
      const all = JSON.parse(localStorage.getItem(DB_KEYS.DEPOSITS)) || [];
      return roomId ? all.filter(d => d.roomId === roomId) : all;
    } catch (e) {
      return [];
    }
  }


  hasUserDeposited(roomId, uid) {
    const deposits = this.getDeposits(roomId);
    return deposits.some(d => d.uid === uid && (d.status === 'LOCKED' || d.status === 'APPLIED_TO_WIN'));
  }


  /**
   * Nộp tiền đặt cọc ký quỹ vào phòng đấu giá (15% giá khởi điểm)
   */
  submitDeposit(roomId, customUser = null) {
    const user = customUser || this.getCurrentUser();
    if (!user) return { success: false, message: 'Vui lòng đăng nhập trước khi nộp cọc!' };


    const room = this.getRoom(roomId);
    if (!room) return { success: false, message: 'Phòng đấu giá không tồn tại!' };


    if (this.hasUserDeposited(roomId, user.uid)) {
      return { success: true, message: 'Bạn đã hoàn tất nộp cọc cho phòng này rồi!' };
    }


    const requiredDeposit = room.depositAmount;
    if (user.walletAvailable < requiredDeposit) {
      return { 
        success: false, 
        insufficientFunds: true,
        message: `Số dư khả dụng (${this.formatCurrency(user.walletAvailable)}) không đủ để ký quỹ ${this.formatCurrency(requiredDeposit)}!` 
      };
    }


    // Trừ ví khả dụng -> chuyển sang ví Escrow đóng băng
    user.walletAvailable -= requiredDeposit;
    user.walletEscrow += requiredDeposit;
    if (!customUser) {
      this.setCurrentUser(user);
    }


    // Lưu bản ghi deposit
    const allDeposits = JSON.parse(localStorage.getItem(DB_KEYS.DEPOSITS)) || [];
    const depositRecord = {
      id: `dep-${Date.now()}`,
      roomId,
      uid: user.uid,
      userName: user.fullName,
      paddleId: user.paddleId,
      amount: requiredDeposit,
      status: 'LOCKED',
      timestamp: Date.now()
    };
    allDeposits.push(depositRecord);
    localStorage.setItem(DB_KEYS.DEPOSITS, JSON.stringify(allDeposits));


    // Tăng số người tham gia trong phòng
    this.updateRoom(roomId, { participantsCount: (room.participantsCount || 0) + 1 });


    // Ghi sự kiện
    this.addEvent(roomId, ` ${user.fullName} (${user.paddleId}) đã nộp cọc ${this.formatCurrency(requiredDeposit)} và mở khóa quyền trả giá!`, 'DEPOSIT');


    this.broadcast('USER_DEPOSITED', { roomId, user, depositRecord });
    return { success: true, deposit: depositRecord };
  }


  /**
   * Tự động hoàn lại 100% tiền cọc cho tất cả những người không thắng cuộc
   */
  refundAllLosers(roomId, winnerUid) {
    const allDeposits = JSON.parse(localStorage.getItem(DB_KEYS.DEPOSITS)) || [];
    const users = this.getUsers();
    let refundedCount = 0;


    allDeposits.forEach(dep => {
      if (dep.roomId === roomId && dep.status === 'LOCKED') {
        if (dep.uid === winnerUid) {
          dep.status = 'APPLIED_TO_WIN';
        } else {
          dep.status = 'REFUNDED';
          // Trả lại tiền cho user này
          const userObj = users.find(u => u.uid === dep.uid);
          if (userObj) {
            userObj.walletEscrow = Math.max(0, userObj.walletEscrow - dep.amount);
            userObj.walletAvailable += dep.amount;
            refundedCount++;
          }
        }
      }
    });


    localStorage.setItem(DB_KEYS.DEPOSITS, JSON.stringify(allDeposits));
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));


    // Đồng bộ lại tài khoản hiện tại nếu là một trong số người được hoàn cọc
    this.refreshCurrentUser();


    this.addEvent(roomId, ` Hệ thống đã hoàn trả 100% tiền đặt cọc ký quỹ cho tất cả các nhà sưu tầm không trúng thầu!`, 'REFUND');
    this.broadcast('DEPOSITS_REFUNDED', { roomId, winnerUid, refundedCount });
  }


  // =========================================================================
  // 4. SỔ LỆNH ĐẤU GIÁ (LIVE BIDS & ANTI-SNIPING)
  // =========================================================================


  getBids(roomId) {
    try {
      const all = JSON.parse(localStorage.getItem(DB_KEYS.BIDS)) || [];
      const filtered = roomId ? all.filter(b => b.roomId === roomId) : all;
      return filtered.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      return [];
    }
  }


  /**
   * Đặt giá trực tiếp theo mili-giây
   */
  placeBid(roomId, bidAmount, bidType = 'MANUAL', customBidder = null) {
    const user = customBidder || this.getCurrentUser();
    if (!user) return { success: false, message: 'Vui lòng đăng nhập để trả giá!' };


    const room = this.getRoom(roomId);
    if (!room) return { success: false, message: 'Phòng đấu giá không tồn tại!' };


    if (room.status === 'ENDED') {
      return { success: false, message: 'Phiên đấu giá này đã chính thức gõ búa kết thúc!' };
    }


    // 1. Kiểm tra quyền ký quỹ (Escrow Deposit Requirement)
    if (!this.hasUserDeposited(roomId, user.uid)) {
      return { 
        success: false, 
        requiresDeposit: true, 
        message: 'Bạn chưa nộp tiền đặt cọc ký quỹ (Escrow) để được cấp quyền trả giá!' 
      };
    }


    // 2. Chặn tự nâng giá đè lên chính mình
    if (room.leaderUid === user.uid) {
      return { success: false, message: 'Bạn đang là người dẫn đầu phiên này! Không thể tự nâng giá đè lên chính mình.' };
    }


    // 3. Kiểm tra bước giá hợp lệ
    const minValidBid = room.currentPrice + room.stepPrice;
    if (bidAmount < minValidBid) {
      return { 
        success: false, 
        message: `Mức giá phải tối thiểu từ ${this.formatCurrency(minValidBid)} (Giá hiện tại + Bước giá ${this.formatCurrency(room.stepPrice)})!` 
      };
    }


    // 4. THUẬT TOÁN ANTI-SNIPING 30S: Nếu còn dưới 30s mà có người trả giá -> Reset đồng hồ lên 30s
    const now = Date.now();
    const endMs = new Date(room.endTime).getTime();
    const remainingSeconds = Math.floor((endMs - now) / 1000);
    let antiSnipingTriggered = false;


    let newEndTime = room.endTime;
    let antiSnipingCount = room.antiSnipingCount || 0;


    if (remainingSeconds > 0 && remainingSeconds < 30) {
      antiSnipingTriggered = true;
      antiSnipingCount += 1;
      newEndTime = new Date(now + 30 * 1000).toISOString(); // Cộng đúng 30 giây tính từ thời điểm đặt giá


      this.addEvent(roomId, ` CƠ CHẾ ANTI-SNIPING KÍCH HOẠT! Thời gian kết thúc phiên được tự động gia hạn thêm 30 giây!`, 'SNIPE_EXTEND');
    }


    // 5. Cập nhật trạng thái phòng
    const previousLeaderUid = room.leaderUid;
    const updatedRoom = this.updateRoom(roomId, {
      currentPrice: bidAmount,
      leaderUid: user.uid,
      leaderName: user.fullName,
      leaderPaddleId: user.paddleId,
      endTime: newEndTime,
      antiSnipingCount
    });


    // 6. Ghi vào sổ lệnh Bids
    const allBids = JSON.parse(localStorage.getItem(DB_KEYS.BIDS)) || [];
    const newBid = {
      bidId: `bid-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      roomId,
      uid: user.uid,
      userName: user.fullName,
      paddleId: user.paddleId,
      amount: bidAmount,
      bidType,
      timestamp: Date.now()
    };
    allBids.unshift(newBid);
    localStorage.setItem(DB_KEYS.BIDS, JSON.stringify(allBids));


    // 7. Ghi sự kiện
    this.addEvent(roomId, ` ${user.fullName} (${user.paddleId}) vừa trả ${this.formatCurrency(bidAmount)} và vươn lên dẫn đầu!`, 'BID');


    // 8. Phát Broadcast đồng bộ tức thì cho tất cả các tab
    this.broadcast('BID_PLACED', {
      roomId,
      bid: newBid,
      room: updatedRoom,
      antiSnipingTriggered,
      previousLeaderUid
    });


    return { 
      success: true, 
      bid: newBid, 
      room: updatedRoom, 
      antiSnipingTriggered,
      message: `Đặt giá thành công ${this.formatCurrency(bidAmount)}!`
    };
  }


  // =========================================================================

  /**
   * Giả lập một khách VIP vào phòng nộp cọc và giơ Thẻ Đấu Giá trả giá
   * Dành cho Chủ phòng (Host) kiểm tra duyệt phiên hoặc thuyết trình đồ án
   */
  simulateClientBid(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return { success: false, message: 'Phòng đấu giá không tồn tại!' };
    if (room.status === 'ENDED') return { success: false, message: 'Phiên đấu giá này đã kết thúc!' };
    const simulatedClients = [
      { uid: 'usr-vip-long', fullName: 'Doanh nhân Trần Đình Long', paddleId: '#PD-7790', walletAvailable: 5000000000, walletEscrow: 0 },
      { uid: 'usr-vip-elena', fullName: 'Nhà sưu tập Elena Rostova', paddleId: '#PD-5512', walletAvailable: 3500000000, walletEscrow: 0 },
      { uid: 'usr-vip-tuan', fullName: 'Bác sĩ Hoàng Minh Tuấn', paddleId: '#PD-3388', walletAvailable: 2000000000, walletEscrow: 0 },
      { uid: 'usr-vip-david', fullName: 'Kiến trúc sư David Vũ', paddleId: '#PD-9921', walletAvailable: 4200000000, walletEscrow: 0 }
    ];
    let candidates = simulatedClients.filter(c => c.uid !== room.leaderUid);
    if (candidates.length === 0) candidates = simulatedClients;
    const client = candidates[Math.floor(Math.random() * candidates.length)];
    if (!this.hasUserDeposited(roomId, client.uid)) {
      this.submitDeposit(roomId, client);
    }
    const nextAmount = room.currentPrice + room.stepPrice;
    const bidRes = this.placeBid(roomId, nextAmount, 'MANUAL', client);
    return {
      success: bidRes.success,
      client,
      bidAmount: nextAmount,
      message: bidRes.message
    };
  }
    // 5. DÒNG SỰ KIỆN TRỰC TIẾP (LIVE ROOM EVENTS FEED)
  // =========================================================================


  getEvents(roomId) {
    try {
      const all = JSON.parse(localStorage.getItem(DB_KEYS.EVENTS)) || [];
      const filtered = roomId ? all.filter(e => e.roomId === roomId) : all;
      return filtered.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      return [];
    }
  }


  addEvent(roomId, message, type = 'EVENT') {
    const all = JSON.parse(localStorage.getItem(DB_KEYS.EVENTS)) || [];
    const newEvent = {
      id: `ev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      roomId,
      message,
      type,
      timestamp: Date.now()
    };
    all.unshift(newEvent);
    localStorage.setItem(DB_KEYS.EVENTS, JSON.stringify(all.slice(0, 50)));


    this.broadcast('ROOM_EVENT_ADDED', { roomId, event: newEvent });
    return newEvent;
  }


  // =========================================================================
  // 6. LẮNG NGHE THỜI GIAN THỰC (REALTIME SUBSCRIPTIONS)
  // =========================================================================


  subscribeRoom(roomId, callback) {
    if (!this.listeners.has(roomId)) {
      this.listeners.set(roomId, []);
    }
    this.listeners.get(roomId).push(callback);


    // Gửi ngay trạng thái ban đầu
    callback({
      type: 'INITIAL_LOAD',
      room: this.getRoom(roomId),
      bids: this.getBids(roomId),
      deposits: this.getDeposits(roomId),
      events: this.getEvents(roomId)
    });


    // Trả về hàm hủy đăng ký
    return () => {
      const arr = this.listeners.get(roomId) || [];
      this.listeners.set(roomId, arr.filter(cb => cb !== callback));
    };
  }


  notifyRoomListeners(roomId, eventData) {
    const callbacks = this.listeners.get(roomId) || [];
    const room = this.getRoom(roomId);
    const bids = this.getBids(roomId);
    const deposits = this.getDeposits(roomId);
    const events = this.getEvents(roomId);


    callbacks.forEach(cb => {
      try {
        cb({
          type: eventData ? eventData.type : 'UPDATE',
          room,
          bids,
          deposits,
          events,
          eventData
        });
      } catch (e) {
        console.error('[DBService] Lỗi listener callback:', e);
      }
    });
  }


  notifyAllListeners(eventData) {
    this.listeners.forEach((_, roomId) => {
      this.notifyRoomListeners(roomId, eventData);
    });
  }


  // =========================================================================
  // 7. CẤU HÌNH CLOUD DATABASE (FIREBASE / SUPABASE)
  // =========================================================================


  loadCloudConfig() {
    try {
      const cfg = localStorage.getItem(DB_KEYS.CLOUD_CONFIG);
      if (cfg) {
        this.cloudConfig = JSON.parse(cfg);
        console.log('[DBService] Đã nạp cấu hình Cloud Database:', this.cloudConfig.projectId || 'Custom Cloud');
      }
    } catch (e) {}
  }


  saveCloudConfig(configObj) {
    this.cloudConfig = configObj;
    localStorage.setItem(DB_KEYS.CLOUD_CONFIG, JSON.stringify(configObj));
    this.broadcast('CLOUD_CONFIG_UPDATED', configObj);
    return true;
  }


  getCloudConfig() {
    return this.cloudConfig;
  }


  /**
   * Đồng bộ lên Firebase REST API khi người dùng cấu hình Firebase
   */
  async syncToCloud(type, payload) {
    if (!this.cloudConfig || !this.cloudConfig.databaseURL) return;


    try {
      const url = `${this.cloudConfig.databaseURL}/auction_sync/${Date.now()}.json`;
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload, timestamp: Date.now() })
      });
    } catch (err) {
      // Bỏ qua lỗi cloud để tiếp tục chạy cục bộ
    }
  }


  // Tiện ích format tiền tệ
  formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  }
}


// Khởi tạo Singleton Database Service gắn lên Window
const dbService = new RealtimeDatabaseService();
window.dbService = dbService;
