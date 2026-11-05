/**
 * AUCTION ENGINE - SELECTIVE AUTH GUARD
 * Cho phép khách tự do truy cập: Trang Chủ, Khám Phá Lots, Tạo Phiên Đấu Giá, Phòng Live Room và Cẩm Nang.
 * Đảm bảo người dùng bấm " Tạo Phiên" luôn vào thẳng màn hình tạo phòng (seller-studio.html),
 * không bao giờ bị chặn hay bị chuyển hướng vòng lặp sang login.html!
 */
(function() {
  try {
    const currentPath = window.location.pathname.toLowerCase();
    
    // Chỉ bảo vệ trang Dashboard riêng tư cá nhân nếu đã chủ động đăng xuất
    const protectedPages = ['dashboard.html'];
    const isProtected = protectedPages.some(page => currentPath.endsWith(page));

    if (!isProtected) return;

    const isLoggedOut = localStorage.getItem('AE_AUTH_LOGGED_OUT') === 'true' || localStorage.getItem('AURELIA_LOGGED_OUT') === 'true';
    const currentUserRaw = localStorage.getItem('AURELIA_CURRENT_USER_V4') ||
                           localStorage.getItem('AE_V3_CURRENT_USER') || 
                           localStorage.getItem('AE_DB_CURRENT_USER_V2') || 
                           localStorage.getItem('AE_DB_CURRENT_USER');

    let currentUser = null;
    if (currentUserRaw && !isLoggedOut) {
      try {
        currentUser = JSON.parse(currentUserRaw);
      } catch (e) {
        currentUser = null;
      }
    }

    // Nếu vào Dashboard mà chưa có tài khoản -> Chuyển về login.html kèm redirect
    if (!currentUser) {
      const currentUrl = window.location.href;
      window.location.replace(`login.html?redirect=${encodeURIComponent(currentUrl)}`);
    }
  } catch (err) {
    console.error('[AuthGuard] Lỗi kiểm tra phiên:', err);
  }
})();
