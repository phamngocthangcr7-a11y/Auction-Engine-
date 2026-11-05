/**
 * AURELIA FINE AUCTIONS - HEADER COMPONENT (v5.0)
 * 2-Tier Swiss Editorial Header + Fully Responsive Mobile Drawer
 * 6 Main Navigation Links:
 * 1. Trang Chủ (index.html)
 * 2. Khám Phá & Bộ Lọc (auctions.html)
 * 3. Tạo Phiên Bán (seller-studio.html)
 * 4. Bảng Xếp Hạng (index.html#leaderboard-section)
 * 5. Không Gian Cá Nhân (dashboard.html)
 * 6. Quản Trị (Admin) (admin.html)
 * Plus: Notification Bell & Watchlist Heart with live counters.
 */

function renderHeader() {
  const headerContainer = document.getElementById('site-header-root');
  if (!headerContainer) return;

  const store = window.AureliaApp || window.AuctionStore || window.dbService;
  const currentUser = store ? store.getCurrentUser() : null;
  const walletAvailable = currentUser ? (currentUser.walletAvailable || 0) : 0;
  const paddleId = currentUser ? currentUser.paddleId : '#PD----';
  const userName = currentUser ? currentUser.fullName : 'Khách Thưởng Ngoạn';

  const theme = (window.stateManager && typeof window.stateManager.getTheme === 'function')
    ? window.stateManager.getTheme()
    : (localStorage.getItem('AURELIA_THEME_V4') || localStorage.getItem('AE_V3_THEME') || 'dark');
  document.documentElement.setAttribute('data-theme', theme);

  const unreadNotifCount = (store && typeof store.getUnreadNotifCount === 'function')
    ? store.getUnreadNotifCount()
    : 2;

  const watchlistCount = (store && typeof store.getWatchlist === 'function')
    ? store.getWatchlist().length
    : 2;

  const currentPath = window.location.pathname.toLowerCase();

  const formatMoney = (v) => {
    return (store && typeof store.formatCurrency === 'function')
      ? store.formatCurrency(v)
      : (v ? Number(v).toLocaleString('vi-VN') + ' ₫' : '0 ₫');
  };

  headerContainer.innerHTML = `
    <!-- =======================================================================
         TẦNG 1: UTILITY BAR (Desktop Only - Cao 38px, Nền mực in #0F172A)
         ======================================================================= -->
    <div class="utility-bar" role="region" aria-label="Thanh tiện ích và thị trường trực tiếp">
      <div class="container container--wide utility-bar__inner">
        
        <!-- Left: Realtime Market State -->
        <div class="utility-bar__left" title="Sàn Đấu Giá Trực Tuyến AUCTIONENGINE">
          <span class="utility-bar__dot"></span>
          <span class="utility-text-bold" style="color: #F8FAFC;">Sàn Đấu Giá Trực Tuyến <span style="color: #F59E0B; font-weight: 700;">AUCTIONENGINE</span></span>
        </div>

        <!-- Right: Quick PIN + Wallet + User Switcher + Theme -->
        <div class="utility-bar__right">
          
          <!-- Quick PIN Input -->
          <div class="utility-bar__pin-group" title="Nhập mã PIN 6 số để vào thẳng phòng đấu giá">
            <svg onclick="window.openPinModal()" title="Bấm để mở danh sách phòng đấu giá & mã PIN" viewBox="0 0 24 24" style="width: 12px; height: 12px; color: #94A3B8; cursor: pointer; flex-shrink: 0;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <input 
              type="text" 
              id="header-quick-pin" 
              maxlength="6" 
              placeholder="Mã PIN" 
              title="Nhập 6 số PIN để vào thẳng phòng đấu giá (Nhấn Enter)"
              onkeydown="if(event.key==='Enter'){event.preventDefault(); window.submitHeaderPin();}"
            />
            <button 
              type="button" 
              onclick="window.submitHeaderPin()" 
              title="Bấm để vào phòng đấu giá"
              class="utility-pin-btn"
            >
              Vào
            </button>
          </div>

          <span class="utility-sep">|</span>

          ${currentUser ? `
            <!-- Wallet Balance -->
            <button type="button" class="utility-wallet-btn" onclick="window.openWalletModal()" title="Ví ký quỹ: Bấm để nạp thêm hoặc kiểm tra số dư">
              <svg viewBox="0 0 24 24" style="width: 13px; height: 13px; color: #34D399; flex-shrink: 0;"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
              <span><span class="utility-wallet-label">Ví: </span><strong style="color: #34D399; font-family: var(--font-mono); white-space: nowrap;">${formatMoney(walletAvailable)}</strong></span>
            </button>

            <span class="utility-sep">|</span>

            <!-- Current User Profile -->
            <button type="button" class="utility-user-profile-btn" onclick="window.openAuthModal()" title="Hồ sơ tài khoản: ${userName} • MSSV: ${currentUser.mssv || '---'} • Thẻ ${paddleId}">
              <img src="${currentUser.avatar || 'assets/images/user_thang.jpg'}" alt="Avatar" style="width: 18px; height: 18px; border-radius: 50%; object-fit: cover; border: 1.5px solid #10B981; flex-shrink: 0;" onerror="this.style.display='none';" />
              <span class="utility-user-name">${userName}</span>
              <span class="utility-user-paddle">(<strong>${paddleId}</strong>)</span>
              ${currentUser && currentUser.mssv ? `<span class="utility-user-mssv" style="color: #94A3B8;">&bull; MSSV: ${currentUser.mssv}</span>` : ''}
              ${currentUser && (currentUser.role === 'admin' || currentUser.isAdmin) ? `<span class="utility-user-admin" style="color: #34D399; font-weight: 700;">&bull; ADMIN</span>` : ''}
            </button>

            <span class="utility-sep">|</span>

            <!-- Logout Button -->
            <button type="button" class="utility-logout-btn" onclick="window.logoutUser()" title="Đăng xuất khỏi tài khoản">
              <svg viewBox="0 0 24 24" style="width: 12px; height: 12px;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              <span>Đăng Xuất</span>
            </button>
          ` : `
            <!-- Logged Out State: Login / Register Button -->
            <button type="button" class="utility-bar__link" onclick="window.openAuthModal()" title="Đăng nhập hoặc đăng ký tài khoản đấu giá" style="font-weight: 600;">
              <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span style="color: #60A5FA;">Đăng Nhập / Đăng Ký</span>
            </button>
          `}

          <span class="utility-sep">|</span>

          <!-- Toggle Theme (Sáng / Tối) -->
          <button type="button" class="utility-bar__link btn-toggle-theme" title="Chuyển giao diện Sáng / Tối">
            ${theme === 'dark' ? `
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            ` : `
              <svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            `}
          </button>
        </div>
      </div>
    </div>

    <!-- =======================================================================
         TẦNG 2: MAIN NAVIGATION BAR (Cao 70px)
         ======================================================================= -->
    <header class="site-header">
      <div class="container container--wide site-header__inner">
        
        <!-- Left: Brand Logo + Nav Links -->
        <div class="site-header__left">
          <a href="index.html" class="site-header__logo" title="Trang chủ AUCTIONENGINE Fine Auctions">
            <span class="site-header__logo-brand" style="font-family: var(--font-heading); font-weight: 800; letter-spacing: -0.02em;">AUCTION<span style="color: #F59E0B;">ENGINE</span></span>
            <span class="site-header__logo-sub">SÀN ĐẤU GIÁ TRỰC TUYẾN</span>
          </a>

          <!-- Main Nav Links (6 Mandatory Links) -->
          <nav class="site-header__nav" aria-label="Điều hướng chính">
            <a href="index.html" class="nav-link ${currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/') || currentPath === '' ? 'active' : ''}">
              Trang Chủ
            </a>
            <a href="auctions.html" class="nav-link ${currentPath.includes('auctions') ? 'active' : ''}">
              Khám Phá & Bộ Lọc
            </a>
            <a href="seller-studio.html" class="nav-link ${currentPath.includes('seller-studio') || currentPath.includes('create-room') ? 'active' : ''}">
              Tạo Phiên Bán
            </a>
            <a href="index.html#leaderboard-section" class="nav-link">
              Bảng Xếp Hạng
            </a>
            <a href="dashboard.html" class="nav-link ${currentPath.includes('dashboard') ? 'active' : ''}">
              Không Gian Cá Nhân
            </a>
            <a href="admin.html" class="nav-link ${currentPath.includes('admin') ? 'active' : ''}" style="color: #059669; font-weight: 700;">
              Quản Trị (Admin)
            </a>
          </nav>
        </div>

        <!-- Right: Action Icons + Search + Create Room + User Button -->
        <div class="site-header__actions">
          
          <!-- Quick Search Bar (Desktop) -->
          <div class="site-header__search">
            <form action="auctions.html" method="GET" style="margin: 0; position: relative;">
              <input 
                type="text" 
                name="search" 
                class="form-control" 
                placeholder="Tìm đồng hồ, xe, nghệ thuật..." 
                style="padding: 7px 12px 7px 32px; font-size: 0.8rem; border-radius: var(--radius-sm); width: 190px; border: 1px solid var(--border-color); background: var(--bg-subtle); color: var(--text-primary);"
              />
              <svg style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: #64748B; pointer-events: none;" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </form>
          </div>

          <!-- Notification Bell Icon Button -->
          <button 
            type="button" 
            id="notif-bell-btn" 
            class="header-icon-btn" 
            onclick="window.openNotificationsModal()" 
            title="Thông báo mới (${unreadNotifCount})"
          >
            <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            <span id="notif-badge" class="header-badge" style="${unreadNotifCount > 0 ? 'display:inline-flex;' : 'display:none;'}">${unreadNotifCount}</span>
          </button>

          <!-- Watchlist Heart Icon Button -->
          <button 
            type="button" 
            id="wishlist-btn" 
            class="header-icon-btn" 
            onclick="window.openWatchlistModal()" 
            title="Danh sách theo dõi (${watchlistCount})"
          >
            <svg viewBox="0 0 24 24" style="stroke: #DC2626;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            <span id="wishlist-badge" class="header-badge header-badge--red" style="${watchlistCount > 0 ? 'display:inline-flex;' : 'display:none;'}">${watchlistCount}</span>
          </button>

          <!-- Create Room CTA Button (Desktop) -->
          <a href="seller-studio.html" class="btn btn-primary header-cta-btn" style="font-weight: 600; padding: 7px 14px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 5px;">
            <svg viewBox="0 0 24 24" style="width: 14px; height: 14px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Tạo Phiên Mới</span>
          </a>

          <!-- User Menu Button -->
          <button 
            type="button" 
            id="btn-header-user-menu"
            class="btn btn-outline header-user-btn" 
            style="padding: 6px 10px; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 5px;"
            onclick="window.openAuthModal()"
          >
            <svg viewBox="0 0 24 24" style="width: 14px; height: 14px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span>${currentUser ? paddleId : 'Đăng Nhập'}</span>
          </button>

          <!-- Mobile Hamburger Toggle Button -->
          <button 
            type="button" 
            id="btn-mobile-menu-toggle" 
            class="mobile-menu-toggle-btn" 
            aria-label="Mở menu di động"
            onclick="window.toggleMobileDrawer()"
          >
            <svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>

        </div>
      </div>
    </header>

    <!-- =======================================================================
         MOBILE NAVIGATION DRAWER (Slide-in off-canvas menu for Phones)
         ======================================================================= -->
    <div id="mobile-drawer-overlay" class="mobile-drawer-overlay" onclick="window.closeMobileDrawer()"></div>
    <div id="mobile-drawer" class="mobile-drawer" role="dialog" aria-modal="true" aria-label="Menu điều hướng điện thoại">
      <div class="mobile-drawer__header">
        <div style="display: flex; flex-direction: column;">
          <span style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text-primary);">AUCTION<span style="color: #F59E0B;">ENGINE</span></span>
          <span style="font-size: 0.55rem; letter-spacing: 0.15em; text-transform: uppercase; color: #059669; font-weight: 700;">SÀN ĐẤU GIÁ TRỰC TUYẾN</span>
        </div>
        <button type="button" class="mobile-drawer__close" onclick="window.closeMobileDrawer()" aria-label="Đóng menu">
          &times;
        </button>
      </div>

      <!-- User card inside Mobile Drawer -->
      <div class="mobile-drawer__user-card">
        ${currentUser ? `
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 36px; height: 36px; border-radius: 50%; overflow: hidden; border: 2px solid #059669; flex-shrink: 0;">
                <img src="${currentUser.avatar || 'assets/images/user_thang.jpg'}" alt="${userName}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                <div style="width: 100%; height: 100%; background: #059669; color: #FFF; display: none; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem;">
                  ${userName.charAt(0)}
                </div>
              </div>
              <div>
                <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                  <span>${userName}</span>
                  ${currentUser.role === 'admin' || currentUser.isAdmin ? '<span style="font-size: 0.65rem; background: #059669; color: #FFF; padding: 1px 6px; border-radius: 4px; font-weight: 700;">ADMIN</span>' : ''}
                </div>
                <div style="font-size: 0.72rem; color: var(--accent-emerald); font-weight: 600; font-family: var(--font-mono);">${paddleId} &bull; ${currentUser.mssv || 'VIP'}</div>
              </div>
            </div>
            <button type="button" onclick="window.logoutUser()" class="btn btn-outline" style="font-size: 0.7rem; padding: 4px 8px; color: #DC2626; border-color: rgba(220,38,38,0.3);">
              Đăng Xuất
            </button>
          </div>
          <div style="background: var(--bg-page); border: 1px solid var(--border-color); border-radius: 6px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.72rem; color: var(--text-muted);">Ví khả dụng:</span>
            <strong style="font-family: var(--font-mono); color: #059669; font-size: 0.88rem; white-space: nowrap;">${formatMoney(walletAvailable)}</strong>
          </div>
        ` : `
          <div style="text-align: center; padding: 8px 0;">
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 10px;">Đăng nhập để tham gia đấu giá trực tiếp</p>
            <button type="button" class="btn btn-primary" onclick="window.closeMobileDrawer(); window.openAuthModal();" style="width: 100%; font-size: 0.82rem; padding: 8px 12px;">
              Đăng Nhập / Đăng Ký
            </button>
          </div>
        `}
      </div>

      <!-- Quick PIN Box in Mobile Drawer -->
      <div style="padding: 0 16px 12px 16px;">
        <div style="display: flex; gap: 6px; background: var(--bg-page); border: 1px solid var(--border-color); border-radius: 6px; padding: 4px 6px;">
          <input 
            type="text" 
            id="mobile-quick-pin" 
            maxlength="6" 
            placeholder="Mã PIN 6 số..." 
            style="flex: 1; background: transparent; border: none; font-family: var(--font-mono); font-size: 0.8rem; font-weight: 700; text-align: center; color: var(--text-primary); outline: none;"
            onkeydown="if(event.key==='Enter'){event.preventDefault(); window.submitMobilePin();}"
          />
          <button type="button" class="btn btn-primary" onclick="window.submitMobilePin()" style="font-size: 0.72rem; padding: 4px 10px;">
            Vào Phòng
          </button>
        </div>
      </div>

      <!-- Mobile Navigation Links (6 Mandatory Links) -->
      <nav class="mobile-drawer__nav">
        <a href="index.html" class="mobile-nav-item ${currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/') || currentPath === '' ? 'active' : ''}">
          <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          <span>Trang Chủ</span>
        </a>
        <a href="auctions.html" class="mobile-nav-item ${currentPath.includes('auctions') ? 'active' : ''}">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <span>Khám Phá & Bộ Lọc</span>
        </a>
        <a href="seller-studio.html" class="mobile-nav-item ${currentPath.includes('seller-studio') || currentPath.includes('create-room') ? 'active' : ''}">
          <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>Tạo Phiên Bán</span>
        </a>
        <a href="index.html#leaderboard-section" class="mobile-nav-item" onclick="window.closeMobileDrawer()">
          <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          <span>Bảng Xếp Hạng</span>
        </a>
        <a href="dashboard.html" class="mobile-nav-item ${currentPath.includes('dashboard') ? 'active' : ''}">
          <svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
          <span>Không Gian Cá Nhân</span>
        </a>
        <a href="admin.html" class="mobile-nav-item ${currentPath.includes('admin') ? 'active' : ''}" style="color: #059669; font-weight: 700;">
          <svg viewBox="0 0 24 24" style="stroke: #059669;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          <span>Quản Trị (Admin)</span>
        </a>
        <a href="guide-about.html" class="mobile-nav-item ${currentPath.includes('guide-about') ? 'active' : ''}">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          <span>Quy Chuẩn Đấu Giá</span>
        </a>
      </nav>

      <!-- Footer Actions inside Drawer -->
      <div class="mobile-drawer__footer">
        <button type="button" class="btn btn-outline btn-toggle-theme" style="width: 100%; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
          ${theme === 'dark' ? `
            <svg viewBox="0 0 24 24" style="width:14px;height:14px;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            <span>Chuyển Sang Nền Sáng</span>
          ` : `
            <svg viewBox="0 0 24 24" style="width:14px;height:14px;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            <span>Chuyển Sang Nền Tối</span>
          `}
        </button>
      </div>
    </div>
  `;

  bindHeaderListeners();
}

function bindHeaderListeners() {
  // Toggle theme for all buttons with .btn-toggle-theme
  document.querySelectorAll('.btn-toggle-theme').forEach(btn => {
    btn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('AURELIA_THEME_V4', nextTheme);
      localStorage.setItem('AE_V3_THEME', nextTheme);
      if (window.stateManager && typeof window.stateManager.setTheme === 'function') {
        window.stateManager.setTheme(nextTheme);
      }
      renderHeader();
      if (window.showToast) {
        window.showToast(nextTheme === 'dark' ? 'Chế độ Nền Tối' : 'Chế độ Nền Sáng', 'Đã chuyển sang giao diện ' + (nextTheme === 'dark' ? 'nền tối Gallery' : 'nền sáng thanh lịch') + '.', 'info', 1800);
      }
    });
  });
}

// Mobile Drawer Open / Close Functions
window.toggleMobileDrawer = function() {
  const drawer = document.getElementById('mobile-drawer');
  const overlay = document.getElementById('mobile-drawer-overlay');
  if (drawer && overlay) {
    const isOpen = drawer.classList.contains('open');
    if (isOpen) {
      window.closeMobileDrawer();
    } else {
      drawer.classList.add('open');
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }
};

window.closeMobileDrawer = function() {
  const drawer = document.getElementById('mobile-drawer');
  const overlay = document.getElementById('mobile-drawer-overlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
};

window.submitMobilePin = function() {
  const input = document.getElementById('mobile-quick-pin');
  const val = input ? input.value.replace(/[^0-9]/g, '').trim() : '';
  if (val.length === 6) {
    window.closeMobileDrawer();
    window.location.href = 'live-room.html?room=' + encodeURIComponent(val);
  } else {
    window.closeMobileDrawer();
    window.openPinModal();
  }
};

// Global Quick PIN Submission & Entry Modal Trigger
window.submitHeaderPin = function() {
  const pinInput = document.getElementById('header-quick-pin');
  const val = pinInput ? pinInput.value.replace(/[^0-9]/g, '').trim() : '';
  if (val.length === 6) {
    if (typeof window.joinRoomByPin === 'function') {
      window.joinRoomByPin(val);
    } else {
      window.location.href = 'live-room.html?room=' + encodeURIComponent(val);
    }
  } else {
    if (typeof window.openEnterPinModal === 'function') {
      window.openEnterPinModal();
    } else if (typeof window.openModal === 'function') {
      window.openModal('modal-enter-pin');
    }
  }
};

window.openPinModal = function() {
  if (typeof window.openEnterPinModal === 'function') {
    window.openEnterPinModal();
  } else if (typeof window.openModal === 'function') {
    window.openModal('modal-enter-pin');
  }
};

window.openNotificationsModal = function() {
  if (typeof window.openModal === 'function') {
    window.openModal('modal-notifications');
    // Mark as read
    const store = window.AureliaApp || window.AuctionStore;
    if (store && typeof store.markNotifsAsRead === 'function') {
      store.markNotifsAsRead();
      const badge = document.getElementById('notif-badge');
      if (badge) badge.style.display = 'none';
    }
  }
};

window.openWatchlistModal = function() {
  if (typeof window.openModal === 'function') {
    window.openModal('modal-watchlist');
  } else {
    window.location.href = 'dashboard.html?tab=watchlist';
  }
};

window.logoutUser = function() {
  const store = window.AureliaApp || window.AuctionStore;
  if (store && typeof store.logout === 'function') {
    store.logout();
  } else {
    localStorage.setItem('AURELIA_LOGGED_OUT', 'true');
    localStorage.setItem('AE_AUTH_LOGGED_OUT', 'true');
    localStorage.removeItem('AURELIA_CURRENT_USER_V4');
  }
  renderHeader();
  if (window.showToast) {
    window.showToast('Đã Đăng Xuất', 'Quý khách đã đăng xuất tài khoản an toàn.', 'info', 2000);
  }
  setTimeout(() => {
    window.location.reload();
  }, 400);
};

// Re-render header on storage/broadcast changes
window.addEventListener('storage', (e) => {
  if (e.key && (e.key.includes('USER') || e.key.includes('USERS') || e.key.includes('WATCHLIST') || e.key.includes('NOTIF'))) {
    renderHeader();
  }
});

if (window.AureliaApp && typeof window.AureliaApp.on === 'function') {
  window.AureliaApp.on('*', () => {
    renderHeader();
  });
}

window.renderHeader = renderHeader;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderHeader);
} else {
  renderHeader();
}
