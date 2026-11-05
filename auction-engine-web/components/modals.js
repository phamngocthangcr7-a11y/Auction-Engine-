/**
 * AUCTIONENGINE FINE AUCTIONS - MODAL DIALOGS SYSTEM
 * Style: Swiss Editorial (Sotheby's × Bring a Trailer × Loupe This)
 * Zero Emojis - Inline SVG Icons (stroke-width="1.75")
 * Real Authentication (Login / Register / Profile) - Zero Dummy Account Clutter
 */

let pendingDepositRoomId = null;

function renderModals() {
  const modalContainer = document.getElementById('modals-root') || document.getElementById('site-modals-root');
  if (!modalContainer) return;

  const store = window.AureliaApp || window.AuctionStore || window.dbService;
  const currentUser = store ? store.getCurrentUser() : null;

  modalContainer.innerHTML = `
    <!-- =======================================================================
         1. MODAL NHẬP MÃ PIN PHÒNG ĐẤU GIÁ (ENTER PIN MODAL)
         ======================================================================= -->
    <div class="modal" id="modal-enter-pin" aria-hidden="true" role="dialog">
      <div class="modal__backdrop" onclick="window.closeModal('modal-enter-pin')"></div>
      <div class="modal__container" style="max-width: 460px; text-align: center;">
        <div class="modal__header">
          <div class="flex items-center gap-2">
            <svg style="width: 18px; height: 18px; color: var(--text-primary);" viewBox="0 0 24 24"><path d="M21 2l-2 2m-1.5 1.5L16 7l-1.5-1.5L13 7l1.5 1.5L13 10l-1.5-1.5L10 10l1.5 1.5-3.5 3.5a5 5 0 11-7-7l3.5-3.5L6 6l1.5-1.5L6 3l1.5-1.5L9 3l1.5-1.5L12 3l1.5 1.5L15 3l1.5 1.5z"></path></svg>
            <h3 class="modal__title">Tham Gia Phiên Bằng Mã PIN</h3>
          </div>
          <button class="modal__close" onclick="window.closeModal('modal-enter-pin')" aria-label="Đóng">&times;</button>
        </div>
        <div class="modal__body">
          <p style="font-size: var(--font-size-xs); color: var(--text-secondary); line-height: 1.5; margin-bottom: var(--space-4);">
            Mỗi phiên đấu giá tại sàn AUCTIONENGINE được định danh bằng một <strong>Mã PIN 6 chữ số</strong>. Vui lòng nhập mã để vào thẳng phòng đấu giá:
          </p>

          <div class="form-group" style="margin-bottom: var(--space-4);">
            <div style="max-width: 280px; margin: 0 auto;">
              <input 
                type="text" 
                id="modal-pin-input-field" 
                maxlength="6" 
                placeholder="Ví dụ: 839201" 
                style="text-align: center; font-family: var(--font-mono); font-size: 1.8rem; font-weight: 700; letter-spacing: 0.2em; color: var(--text-primary); border: 2px solid var(--accent-navy); background: var(--bg-canvas); border-radius: var(--radius-sm); padding: 10px; width: 100%; box-shadow: inset 0 2px 4px rgba(0,0,0,0.04);"
              />
            </div>
          </div>

          <div style="margin-bottom: var(--space-4); text-align: left;">
            <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 8px;">
              Các phiên nổi bật đang mở:
            </div>
            <div id="modal-pin-quick-rooms-list" style="display: flex; flex-direction: column; gap: 6px;">
              <!-- Rendered via JS -->
            </div>
          </div>
        </div>
        <div class="modal__footer" style="justify-content: space-between;">
          <button type="button" class="btn btn--outline btn--sm" onclick="window.closeModal('modal-enter-pin')">Hủy</button>
          <button type="button" id="btn-modal-execute-pin" class="btn btn--primary btn--md" style="font-weight: 600;">
            <span>Vào Phòng Đấu Giá</span>
            <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- =======================================================================
         2. MODAL TÀI KHOẢN & ĐĂNG NHẬP / ĐĂNG KÝ (AUTH MODAL)
         ======================================================================= -->
    <div class="modal" id="modal-auth" aria-hidden="true" role="dialog">
      <div class="modal__backdrop" onclick="window.closeModal('modal-auth')"></div>
      <div class="modal__container" style="max-width: 480px;">
        <div class="modal__header">
          <div class="flex items-center gap-2">
            <svg style="width: 18px; height: 18px; color: var(--text-primary);" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <h3 class="modal__title" id="auth-modal-main-title">Tài Khoản & Thẻ Đấu Giá</h3>
          </div>
          <button class="modal__close" onclick="window.closeModal('modal-auth')" aria-label="Đóng">&times;</button>
        </div>
        <div class="modal__body">
          
          <!-- KHỐI 1: HIỂN THỊ KHI ĐÃ ĐĂNG NHẬP (USER PROFILE CARD) -->
          <div id="auth-view-profile" style="display: none;">
            <div style="background: var(--bg-canvas); border: 1px solid var(--border-hairline); border-radius: var(--radius-md); padding: 20px; margin-bottom: var(--space-4);">
              <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px;">
                <div id="auth-prof-avatar-circle" style="width: 52px; height: 52px; border-radius: 50%; background: var(--accent-navy); color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-family: var(--font-serif); font-size: 1.4rem; font-weight: 700; flex-shrink: 0;">
                  A
                </div>
                <div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <strong id="auth-prof-name" style="font-size: 1.1rem; color: var(--text-primary);">---</strong>
                    <span id="auth-prof-role-badge" class="badge badge--live" style="font-size: 0.65rem;">THÀNH VIÊN</span>
                  </div>
                  <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px;">
                    Mã Thẻ: <span id="auth-prof-paddle" class="font-mono text-emerald" style="font-weight: 700; font-size: 0.9rem;">#PD----</span> &bull; <span id="auth-prof-email" class="text-muted">---</span>
                  </div>
                </div>
              </div>

              <!-- Ví & Tiền cọc -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: var(--bg-surface); border: 1px solid var(--border-hairline); border-radius: var(--radius-sm); padding: 12px 14px;">
                <div>
                  <div style="font-size: 0.68rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Ví khả dụng</div>
                  <div id="auth-prof-wallet" class="font-mono text-emerald" style="font-size: 1.1rem; font-weight: 800; margin-top: 2px;">0 ₫</div>
                </div>
                <div>
                  <div style="font-size: 0.68rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Tạm khóa cọc</div>
                  <div id="auth-prof-escrow" class="font-mono" style="font-size: 1.1rem; font-weight: 700; color: var(--text-secondary); margin-top: 2px;">0 ₫</div>
                </div>
              </div>
            </div>

            <!-- Profile Actions -->
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <button type="button" class="btn btn--primary btn--md" onclick="window.closeModal('modal-auth'); window.openWalletModal();" style="width: 100%; font-weight: 600;">
                <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                <span>Nạp Thêm Tiền Vào Ví</span>
              </button>
              
              <div style="display: flex; gap: 8px;">
                <a href="dashboard.html" class="btn btn--secondary btn--sm" style="flex: 1; text-align: center; text-decoration: none;">
                  <span>Ví & Hồ Sơ Ký Quỹ</span>
                </a>
                <button type="button" class="btn btn--outline btn--sm" onclick="window.logoutUser()" style="color: #DC2626; border-color: #FECACA; background: #FEF2F2; font-weight: 600;">
                  <svg viewBox="0 0 24 24" style="stroke: #DC2626;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  <span>Đăng Xuất</span>
                </button>
              </div>
            </div>
          </div>

          <!-- KHỐI 2: HIỂN THỊ KHI CHƯA ĐĂNG NHẬP (LOGIN / REGISTER TABS) -->
          <div id="auth-view-guest">
            <div class="tab-group" style="margin-bottom: var(--space-4);">
              <button type="button" class="tab-item tab-item--active auth-tab-btn" data-tab="login" id="auth-btn-tab-login">
                Đăng Nhập
              </button>
              <button type="button" class="tab-item auth-tab-btn" data-tab="register" id="auth-btn-tab-register">
                Đăng Ký Mới
              </button>
            </div>

            <!-- Tab 1: Đăng Nhập Form -->
            <div id="auth-panel-login">
              <form id="auth-login-form">
                <div class="form-group">
                  <label class="form-label" for="modal-login-email">Email hoặc Mã Thẻ (#PD-xxxx)</label>
                  <input type="text" id="modal-login-email" class="form-control" placeholder="thang.pn@auctionengine.vn hoặc #PD-6651" required />
                </div>
                <div class="form-group">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <label class="form-label" for="modal-login-password" style="margin-bottom: 0;">Mật khẩu</label>
                    <a href="javascript:void(0)" onclick="window.switchAuthTabTo('forgot')" style="font-size: 0.75rem; color: #059669; font-weight: 600; text-decoration: none;">Quên mật khẩu?</a>
                  </div>
                  <input type="password" id="modal-login-password" class="form-control" placeholder="••••••••" required />
                </div>
                <button type="submit" class="btn btn--primary btn--md" style="width: 100%; margin-top: var(--space-2); font-weight: 600;">
                  Đăng Nhập Vào Hệ Thống
                </button>
                <div style="font-size: 0.75rem; color: var(--text-muted); text-align: center; margin-top: 12px;">
                  Chưa có tài khoản đấu giá? 
                  <a href="javascript:void(0)" onclick="window.switchAuthTabTo('register')" style="color: var(--text-primary); font-weight: 600; text-decoration: underline;">Đăng ký ngay tại đây</a>
                </div>
              </form>
            </div>

            <!-- Tab 2: Đăng Ký Form -->
            <div id="auth-panel-register" style="display: none;">
              <form id="auth-register-form">
                <div class="form-group">
                  <label class="form-label" for="modal-reg-fullname">Họ và Tên</label>
                  <input type="text" id="modal-reg-fullname" class="form-control" placeholder="Ví dụ: Hoàng Tuấn Anh" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="modal-reg-email">Email</label>
                  <input type="email" id="modal-reg-email" class="form-control" placeholder="tuananh@example.com" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="modal-reg-password">Mật khẩu</label>
                  <input type="password" id="modal-reg-password" class="form-control" placeholder="Tối thiểu 6 ký tự" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="modal-reg-balance">Hạn mức ví khởi tạo (VNĐ)</label>
                  <input type="number" id="modal-reg-balance" class="form-control" value="5000000000" step="500000000" required />
                  <div style="font-size: 0.72rem; color: var(--accent-bid); margin-top: 4px;">
                    Mặc định cấp 5.000.000.000 ₫ để tài khoản sẵn sàng đặt cọc ký quỹ và trả giá ngay.
                  </div>
                </div>
                <button type="submit" class="btn btn--primary btn--md" style="width: 100%; margin-top: var(--space-2); font-weight: 600;">
                  Hoàn Tất Đăng Ký Tài Khoản
                </button>
                <div style="font-size: 0.75rem; color: var(--text-muted); text-align: center; margin-top: 12px;">
                  Đã có tài khoản? 
                  <a href="javascript:void(0)" onclick="window.switchAuthTabTo('login')" style="color: var(--text-primary); font-weight: 600; text-decoration: underline;">Đăng nhập</a>
                </div>
              </form>
            </div>

            <!-- Tab 3: Khôi Phục / Quên Mật Khẩu (Bảo Mật OTP) -->
            <div id="auth-panel-forgot" style="display: none;">
              <!-- BƯỚC 1: NHẬP EMAIL XÁC THỰC -->
              <div id="auth-forgot-step1">
                <div style="background: rgba(5,150,105,0.08); border: 1px solid rgba(5,150,105,0.3); border-radius: 6px; padding: 12px 14px; margin-bottom: 14px; font-size: 0.8rem; color: var(--text-primary); line-height: 1.5;">
                  <strong style="color: #059669;">💡 Chế độ Demo Trực Tiếp:</strong> Hệ thống tự động cấp mã OTP 6 số <strong>ngay trên màn hình</strong> và tự động điền sẵn (bạn <strong>KHÔNG CẦN</strong> mở Gmail thật để lấy mã).
                </div>
                <form id="auth-forgot-form-step1">
                  <div class="form-group">
                    <label class="form-label" for="modal-forgot-email">Tài khoản Email cần đặt lại mật khẩu</label>
                    <input type="email" id="modal-forgot-email" class="form-control" value="thang.pn@auctionengine.vn" placeholder="thang.pn@auctionengine.vn" required />
                  </div>
                  <button type="submit" class="btn btn--primary btn--md" id="btn-forgot-send-otp" style="width: 100%; margin-top: var(--space-2); font-weight: 700; padding: 11px;">
                    ⚡ LẤY MÃ OTP & ĐẶT MẬT KHẨU MỚI (TRỰC TIẾP)
                  </button>
                </form>
              </div>

              <!-- BƯỚC 2: NHẬP OTP & ĐẶT MẬT KHẨU MỚI -->
              <div id="auth-forgot-step2" style="display: none;">
                <div style="background: rgba(5,150,105,0.08); border: 1px solid #059669; border-radius: 6px; padding: 10px 12px; margin-bottom: 14px; font-size: 0.78rem; color: var(--text-primary); line-height: 1.5;">
                  <div>Đã phát hành mã OTP tới hòm thư: <strong id="forgot-target-email-masked" class="font-mono text-emerald">...</strong></div>
                  <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 3px;">(Mã xác thực có hiệu lực trong 5 phút. Vui lòng kiểm tra chuông thông báo hoặc hòm thư)</div>
                </div>
                <form id="auth-forgot-form-step2">
                  <div class="form-group">
                    <label class="form-label" for="modal-forgot-otp">Mã xác thực OTP (6 chữ số)</label>
                    <input type="text" id="modal-forgot-otp" class="form-control font-mono" maxlength="6" placeholder="Nhập 6 số OTP" required style="letter-spacing: 5px; font-size: 1.15rem; text-align: center;" />
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="modal-forgot-newpass">Mật khẩu mới</label>
                    <input type="password" id="modal-forgot-newpass" class="form-control" placeholder="Tối thiểu 6 ký tự" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="modal-forgot-confirmpass">Xác nhận mật khẩu mới</label>
                    <input type="password" id="modal-forgot-confirmpass" class="form-control" placeholder="Nhập lại mật khẩu mới..." required />
                  </div>
                  <button type="submit" class="btn btn--primary btn--md" id="btn-forgot-confirm-pass" style="width: 100%; margin-top: var(--space-2); font-weight: 600;">
                    Xác Nhận & Cập Nhật Mật Khẩu
                  </button>
                </form>
              </div>

              <div style="font-size: 0.75rem; color: var(--text-muted); text-align: center; margin-top: 14px; border-top: 1px solid var(--border-color); padding-top: 10px;">
                <a href="javascript:void(0)" onclick="window.switchAuthTabTo('login')" style="color: var(--text-primary); font-weight: 600; text-decoration: underline;">&larr; Quay lại Đăng Nhập</a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- =======================================================================
         3. MODAL KÝ QUỸ ĐẶT CỌC 15% (ESCROW DEPOSIT MODAL)
         ======================================================================= -->
    <div class="modal" id="modal-escrow-deposit" aria-hidden="true" role="dialog">
      <div class="modal__backdrop" onclick="window.closeModal('modal-escrow-deposit')"></div>
      <div class="modal__container" style="max-width: 480px;">
        <div class="modal__header">
          <div class="flex items-center gap-2">
            <svg style="width: 18px; height: 18px; color: var(--accent-bid);" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <h3 class="modal__title">Ký Quỹ Bảo Chứng (15%)</h3>
          </div>
          <button class="modal__close" onclick="window.closeModal('modal-escrow-deposit')" aria-label="Đóng">&times;</button>
        </div>
        <div class="modal__body">
          <p style="font-size: var(--font-size-xs); color: var(--text-secondary); line-height: 1.5; margin-bottom: var(--space-4);">
            Theo quy định đấu giá quốc tế, mỗi người tham gia cần tạm khóa <strong>15% giá trị khởi điểm</strong> để nhận Thẻ Đấu Giá hợp lệ. Khoản tiền này được bảo toàn và <strong>hoàn trả 100% về ví ngay lập tức</strong> nếu bạn không trúng phiên.
          </p>

          <div style="background: var(--bg-canvas); border: 1px solid var(--border-hairline); border-radius: var(--radius-sm); padding: 14px 18px; margin-bottom: var(--space-4); display: flex; flex-direction: column; gap: 8px; font-size: 0.82rem;">
            <div class="flex justify-between">
              <span class="text-muted">Giá khởi điểm lô:</span>
              <strong id="deposit-modal-lot-price" class="font-mono">---</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">Tỷ lệ ký quỹ quy định:</span>
              <span>15%</span>
            </div>
            <div class="flex justify-between" style="border-top: 1px solid var(--border-hairline); padding-top: 8px;">
              <span style="font-weight: 600;">Số tiền tạm khóa:</span>
              <strong id="deposit-modal-amount-needed" class="font-mono text-emerald" style="font-size: 1.05rem;">---</strong>
            </div>
            <div class="flex justify-between" style="border-top: 1px dashed var(--border-hairline); padding-top: 6px;">
              <span class="text-muted">Số dư ví hiện tại:</span>
              <strong id="deposit-modal-user-balance" class="font-mono">---</strong>
            </div>
          </div>

          <button type="button" id="btn-confirm-submit-deposit" class="btn btn--bid btn--lg" style="width: 100%; font-weight: 600;">
            Xác Nhận Ký Quỹ & Mở Thẻ Đấu Giá
          </button>
        </div>
      </div>
    </div>

    <!-- =======================================================================
         4. MODAL VÍ & NẠP TIỀN TÙY CHỌN (WALLET MODAL)
         ======================================================================= -->
    <div class="modal" id="wallet-modal" aria-hidden="true" role="dialog">
      <div class="modal__backdrop" onclick="window.closeModal('wallet-modal')"></div>
      <div class="modal__container" style="max-width: 480px;">
        <div class="modal__header">
          <div class="flex items-center gap-2">
            <svg style="width: 18px; height: 18px; color: var(--text-primary);" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
            <h3 class="modal__title">Ví Ký Quỹ Đấu Giá</h3>
          </div>
          <button class="modal__close" onclick="window.closeModal('wallet-modal')" aria-label="Đóng">&times;</button>
        </div>
        <div class="modal__body">
          <div style="background: var(--bg-canvas); border: 1px solid var(--border-hairline); padding: 16px 20px; border-radius: var(--radius-sm); margin-bottom: var(--space-4);">
            <div style="font-size: 0.68rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.05em;">Số dư khả dụng hiện tại</div>
            <div id="modal-wallet-curr-val" class="font-mono" style="font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin-top: 2px;">
              0 ₫
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 6px;">
              Số dư đang tạm khóa trong các phiên: <span id="modal-wallet-escrow-val" class="font-mono text-emerald" style="font-weight: 600;">0 ₫</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="wallet-custom-input">Nhập số tiền muốn nạp (VNĐ)</label>
            <input 
              type="number" 
              id="wallet-custom-input" 
              class="form-control" 
              placeholder="Ví dụ: 2000000000" 
              style="font-family: var(--font-mono); font-size: 1.15rem; font-weight: 600;"
            />
            <div id="wallet-preview-text" style="font-size: 0.75rem; color: var(--accent-bid); margin-top: 6px; font-weight: 600; min-height: 18px;"></div>
          </div>

          <div style="margin-bottom: var(--space-4);">
            <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 600; margin-bottom: 6px;">Mức gợi ý nhanh:</div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
              <button type="button" class="btn btn--secondary btn--sm topup-quick-btn" data-amt="500000000">+500 Tr</button>
              <button type="button" class="btn btn--secondary btn--sm topup-quick-btn" data-amt="1000000000">+1 Tỷ</button>
              <button type="button" class="btn btn--secondary btn--sm topup-quick-btn" data-amt="2000000000">+2 Tỷ</button>
              <button type="button" class="btn btn--secondary btn--sm topup-quick-btn" data-amt="5000000000">+5 Tỷ</button>
            </div>
          </div>

          <button type="button" id="btn-submit-wallet-topup" class="btn btn--primary btn--md" style="width: 100%; font-weight: 600;">
            Xác Nhận Nạp Tiền Vào Ví
          </button>
        </div>
      </div>
    </div>

    <!-- =======================================================================
         5. MODAL BIÊN BẢN XÁC NHẬN KẾT QUẢ ĐẤU GIÁ (OFFICIAL AUCTION RESULT MODAL)
         ======================================================================= -->
    <div class="modal" id="modal-auction-result" aria-hidden="true" role="dialog">
      <div class="modal__backdrop" onclick="window.closeModal('modal-auction-result')"></div>
      <div class="modal__container" style="max-width: 600px;">
        <div class="modal__header" style="background: var(--bg-canvas);">
          <div>
            <div style="font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.16em; color: var(--text-muted); font-weight: 700;">AUCTIONENGINE Fine Auctions &bull; Official Protocol</div>
            <h3 class="modal__title" style="margin-top: 2px;">Biên Bản Xác Nhận Kết Quả Đấu Giá</h3>
          </div>
          <button class="modal__close" onclick="window.closeModal('modal-auction-result')" aria-label="Đóng">&times;</button>
        </div>
        <div class="modal__body" id="modal-result-print-area">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: var(--space-4); padding: 12px 16px; background: var(--bg-subtle); border-radius: var(--radius-sm); border-left: 3px solid var(--accent-bid);">
            <svg id="result-status-icon" style="width: 22px; height: 22px; color: var(--accent-bid); flex-shrink: 0;" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <div>
              <div id="result-headline" style="font-weight: 700; color: var(--text-primary); font-size: 0.92rem;">Phiên đấu giá đã kết thúc thành công</div>
              <div id="result-subline" style="font-size: 0.72rem; color: var(--text-secondary);">Giao dịch được đối soát và bảo hiểm toàn phần theo tiêu chuẩn Thụy Sĩ.</div>
            </div>
          </div>

          <table class="result-table">
            <tbody>
              <tr>
                <td>Mã Phiên Đấu Giá</td>
                <td id="result-room-pin" class="font-mono" style="font-weight: 700; color: var(--accent-primary);">------</td>
              </tr>
              <tr>
                <td>Tài Sản Đấu Giá</td>
                <td id="result-lot-title" style="font-weight: 600;">---</td>
              </tr>
              <tr>
                <td>Trạng Thái Kết Thúc</td>
                <td id="result-settle-status" style="font-weight: 600;">Đấu giá thành công</td>
              </tr>
              <tr>
                <td>Nhà Đầu Tư Trúng Giá</td>
                <td id="result-winner-info">---</td>
              </tr>
              <tr>
                <td>Mức Giá Chốt Cuối Cùng</td>
                <td id="result-final-price" class="font-mono text-emerald" style="font-size: 1.15rem; font-weight: 800;">---</td>
              </tr>
              <tr>
                <td>Trạng Thái Ký Quỹ</td>
                <td id="result-escrow-status" style="font-size: 0.78rem; color: var(--text-secondary);">
                  Đã hoàn trả tự động 100% tiền cọc cho các thành viên không trúng giá.
                </td>
              </tr>
              <tr>
                <td>Thời Gian Xác Lập</td>
                <td id="result-timestamp" class="font-mono" style="font-size: 0.78rem; color: var(--text-muted);">---</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal__footer">
          <button type="button" class="btn btn--outline btn--sm" onclick="window.closeModal('modal-auction-result')">
            Đóng
          </button>
          <button type="button" class="btn btn--primary btn--sm" onclick="window.print()">
            <svg viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            <span>In Biên Bản (PDF)</span>
          </button>
        </div>
      </div>
    </div>

    <!-- =======================================================================
         6. MODAL MỜI THAM GIA PHÒNG & MÃ QR THẬT (ROOM INVITE MODAL)
         ======================================================================= -->
    <div class="modal" id="modal-room-invite" aria-hidden="true" role="dialog">
      <div class="modal__backdrop" onclick="window.closeModal('modal-room-invite')"></div>
      <div class="modal__container" style="max-width: 480px; text-align: center;">
        <div class="modal__header">
          <div class="flex items-center gap-2">
            <svg style="width: 18px; height: 18px; color: var(--accent-emerald);" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            <h3 class="modal__title">Mời Tham Gia Phòng Đấu Giá</h3>
          </div>
          <button class="modal__close" onclick="window.closeModal('modal-room-invite')" aria-label="Đóng">&times;</button>
        </div>
        <div class="modal__body">
          <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); font-weight: 700;">
            MÃ PIN ĐỊNH DANH PHÒNG ĐẤU GIÁ
          </div>
          <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin: 4px 0 14px;">
            <div id="invite-room-pin-display" class="font-mono text-emerald" style="font-size: 2.2rem; font-weight: 800; letter-spacing: 0.15em;">
              ------
            </div>
            <button type="button" class="btn btn--outline btn--sm" id="btn-quick-copy-pin" style="font-size: 0.72rem; padding: 4px 8px;" title="Sao chép PIN">
              <svg viewBox="0 0 24 24" style="width: 13px; height: 13px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Chép PIN</span>
            </button>
          </div>

          <!-- Real Scannable QR Code -->
          <div style="background: #FFFFFF; padding: 14px; border: 1px solid var(--border-hairline); border-radius: var(--radius-sm); display: inline-block; margin-bottom: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); text-align: center;">
            <img id="invite-qr-img" src="" alt="Mã QR phòng đấu giá" width="180" height="180" style="display: block; margin: 0 auto; object-fit: contain; min-width: 180px; min-height: 180px; background: #FFF;" />
            <div style="font-size: 0.7rem; color: #64748B; margin-top: 8px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 4px;">
              <svg viewBox="0 0 24 24" style="width: 14px; height: 14px;"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
              <span>Quét mã QR bằng Camera điện thoại để vào phòng</span>
            </div>
          </div>

          <!-- Online Vercel & Mobile Scanning Notice -->
          <div style="background: rgba(5, 150, 105, 0.08); border: 1px solid rgba(5, 150, 105, 0.25); border-radius: var(--radius-sm); padding: 10px 14px; margin-bottom: 12px; font-size: 0.75rem; color: #065F46; text-align: left; line-height: 1.45;">
            <div style="font-weight: 700; margin-bottom: 3px; display: flex; align-items: center; gap: 6px;">
              <svg viewBox="0 0 24 24" style="width: 15px; height: 15px; stroke: #059669; flex-shrink: 0;"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              <span>Kết Nối Mọi Thiết Bị (4G / 5G / Wi-Fi Toàn Cầu):</span>
            </div>
            <div>Mã QR và Link đã được <strong>liên kết trực tiếp lên Vercel Online</strong> (https://auction-engine-071.vercel.app). Bất kỳ điện thoại hay máy tính nào chỉ cần bật camera quét là vào thẳng phòng đấu giá ngay!</div>
          </div>

          <!-- Base Server / Domain Switcher with 1-Click Fast Buttons -->
          <div class="form-group" style="text-align: left; margin-bottom: 12px;">
            <label class="form-label" for="invite-server-host" style="font-size: 0.74rem; font-weight: 600; display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>Máy chủ phát hành liên kết:</span>
              <span style="font-weight: 400; color: var(--text-muted);">Vercel Online hoặc IP Wi-Fi</span>
            </label>
            <div class="flex gap-2" style="margin-bottom: 6px;">
              <input type="text" id="invite-server-host" class="form-control" style="font-size: 0.75rem; font-family: var(--font-mono); padding: 7px 10px;" placeholder="https://auction-engine-071.vercel.app" />
            </div>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              <button type="button" id="btn-use-vercel" class="btn btn--secondary btn--sm" style="font-size: 0.7rem; padding: 4px 10px; font-weight: 700; background: #059669; color: #FFF; border-color: #059669;">
                🌐 Vercel Online (Mọi mạng 4G/Wi-Fi)
              </button>
              <button type="button" id="btn-use-lan-ip" class="btn btn--outline btn--sm" style="font-size: 0.7rem; padding: 3px 8px;">
                📲 Wi-Fi LAN: 192.168.1.175:5500
              </button>
              <button type="button" id="btn-use-localhost" class="btn btn--outline btn--sm" style="font-size: 0.7rem; padding: 3px 8px;">
                💻 Localhost:5500
              </button>
            </div>
          </div>

          <!-- Direct Invite URL (with State Hydration Data) -->
          <div class="form-group" style="text-align: left; margin-bottom: 6px;">
            <label class="form-label" for="invite-url-input" style="font-size: 0.74rem; font-weight: 700; margin-bottom: 4px;">
              Đường Dẫn Trực Tiếp Vào Phòng (Tự động đồng bộ sang máy khác):
            </label>
            <div class="flex gap-2">
              <input type="text" id="invite-url-input" class="form-control font-mono" readonly style="font-size: 0.72rem; background: var(--bg-canvas); padding: 7px 10px;" />
              <button type="button" id="btn-copy-invite-url" class="btn btn--primary btn--sm" style="flex-shrink: 0; font-weight: 600; padding: 6px 14px;">
                <svg viewBox="0 0 24 24" style="width: 14px; height: 14px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                <span>Sao Chép</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    
    <!-- =======================================================================
         MODAL 8: NOTIFICATIONS DIALOG (Live System Alerts)
         ======================================================================= -->
    <div class="modal" id="modal-notifications" aria-hidden="true" role="dialog">
      <div class="modal__backdrop" onclick="window.closeModal('modal-notifications')"></div>
      <div class="modal__container" style="max-width: 520px;">
        <div class="modal__header" style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(5, 150, 105, 0.12); display: flex; align-items: center; justify-content: center; color: #059669;">
              <svg viewBox="0 0 24 24" style="width: 17px; height: 17px; stroke: currentColor; fill: none; stroke-width: 2;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </div>
            <div>
              <h3 class="modal__title" style="margin: 0; font-size: 1.05rem;">Thông Báo Hệ Thống</h3>
              <p style="margin: 2px 0 0 0; font-size: 0.72rem; color: var(--text-muted);">Biến động giá, khớp lệnh và chứng thực ký quỹ</p>
            </div>
          </div>
          <button type="button" class="modal__close" onclick="window.closeModal('modal-notifications')">&times;</button>
        </div>
        <div class="modal__body" style="padding: 18px 24px; max-height: 55vh; overflow-y: auto;">
          <div id="modal-notifs-list" style="display: flex; flex-direction: column; gap: 10px;">
            <!-- Populated via openNotificationsModal -->
          </div>
        </div>
        <div class="modal__footer" style="padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; background: var(--bg-subtle);">
          <button type="button" class="btn btn-outline" onclick="window.markAllNotifsRead()" style="font-size: 0.78rem; padding: 6px 14px;">
            Đánh Dấu Đã Đọc Tất Cả
          </button>
          <button type="button" class="btn btn-primary" onclick="window.closeModal('modal-notifications')" style="font-size: 0.78rem; padding: 6px 16px;">
            Đóng
          </button>
        </div>
      </div>
    </div>

    <!-- =======================================================================
         MODAL 9: WATCHLIST DIALOG (Danh Sách Phiên Đang Theo Dõi)
         ======================================================================= -->
    <div class="modal" id="modal-watchlist" aria-hidden="true" role="dialog">
      <div class="modal__backdrop" onclick="window.closeModal('modal-watchlist')"></div>
      <div class="modal__container" style="max-width: 580px;">
        <div class="modal__header" style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(220, 38, 38, 0.12); display: flex; align-items: center; justify-content: center; color: #DC2626;">
              <svg viewBox="0 0 24 24" style="width: 17px; height: 17px; stroke: currentColor; fill: #DC2626; stroke-width: 2;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </div>
            <div>
              <h3 class="modal__title" style="margin: 0; font-size: 1.05rem;">Danh Sách Theo Dõi (Watchlist)</h3>
              <p style="margin: 2px 0 0 0; font-size: 0.72rem; color: var(--text-muted);">Các phiên đấu giá bạn đã bấm trái tim lưu lại</p>
            </div>
          </div>
          <button type="button" class="modal__close" onclick="window.closeModal('modal-watchlist')">&times;</button>
        </div>
        <div class="modal__body" style="padding: 18px 24px; max-height: 55vh; overflow-y: auto;">
          <div id="modal-watchlist-items" style="display: flex; flex-direction: column; gap: 12px;">
            <!-- Populated via openWatchlistModal -->
          </div>
          <div id="modal-watchlist-empty" style="display: none; padding: 36px 20px; text-align: center;">
            <svg viewBox="0 0 24 24" style="width: 40px; height: 40px; color: #94A3B8; margin: 0 auto 10px auto; display: block; stroke: currentColor; fill: none;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary); margin-bottom: 4px;">Chưa có vật phẩm nào</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 14px;">Bấm biểu tượng trái tim trên thẻ đấu giá để lưu lại theo dõi nhanh.</div>
            <a href="auctions.html" class="btn btn-primary" onclick="window.closeModal('modal-watchlist')" style="font-size: 0.78rem;">Khám Phá Sàn Đấu Giá</a>
          </div>
        </div>
        <div class="modal__footer" style="padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; background: var(--bg-subtle);">
          <a href="dashboard.html?tab=watchlist" class="btn btn-outline" onclick="window.closeModal('modal-watchlist')" style="font-size: 0.78rem; padding: 6px 14px;">
            Quản Lý Trong Không Gian Cá Nhân &rarr;
          </a>
          <button type="button" class="btn btn-primary" onclick="window.closeModal('modal-watchlist')" style="font-size: 0.78rem; padding: 6px 16px;">
            Đóng
          </button>
        </div>
      </div>
    </div>

    <!-- =======================================================================
         MODAL 10: ADMIN REJECT REASON
         ======================================================================= -->
    <div class="modal" id="modal-admin-reject-reason" aria-hidden="true" role="dialog">
      <div class="modal__backdrop" onclick="window.closeModal('modal-admin-reject-reason')"></div>
      <div class="modal__container" style="max-width: 480px;">
        <div class="modal__header" style="display: flex; justify-content: space-between; align-items: center;">
          <h3 class="modal__title" style="margin: 0; font-size: 1.05rem; color: #DC2626;">Từ Chối Phê Duyệt Phiên</h3>
          <button type="button" class="modal__close" onclick="window.closeModal('modal-admin-reject-reason')">&times;</button>
        </div>
        <div class="modal__body" style="padding: 20px 24px;">
          <p id="admin-reject-room-title" style="font-weight: 600; font-size: 0.88rem; color: var(--text-primary); margin: 0 0 12px 0;"></p>
          <label style="display: block; font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px;">LÝ DO TỪ CHỐI THẨM ĐỊNH (BẮT BUỘC):</label>
          <textarea id="admin-reject-reason-text" class="form-control" rows="3" placeholder="Nhập lý do chi tiết..." style="width: 100%; padding: 10px; font-size: 0.85rem; border: 1px solid var(--border-color); border-radius: 6px;"></textarea>
        </div>
        <div class="modal__footer" style="padding: 14px 24px; display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn btn-outline" onclick="window.closeModal('modal-admin-reject-reason')">Hủy</button>
          <button type="button" class="btn btn-primary" style="background: #DC2626; border-color: #DC2626;" onclick="window.submitAdminRejectReason()">Xác Nhận Từ Chối</button>
        </div>
      </div>
    </div>

    <!-- =======================================================================
         MODAL 11: CERTIFICATE OF SALE (SWISS FIDUCIARY PRINTABLE)
         ======================================================================= -->
    <div class="modal" id="modal-print-certificate" aria-hidden="true" role="dialog">
      <div class="modal__backdrop" onclick="window.closeModal('modal-print-certificate')"></div>
      <div class="modal__container" style="max-width: 680px; max-height: 90vh; display: flex; flex-direction: column;">
        <div class="modal__header" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 24px;">
          <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.12em; color: #059669; font-weight: 800;">
            OFFICIAL CERTIFICATE OF SALE &bull; GENEVA CONFIRMATION
          </div>
          <button type="button" class="modal__close" onclick="window.closeModal('modal-print-certificate')">&times;</button>
        </div>
        <div class="modal__body" id="modal-certificate-printable" style="padding: 24px; background: #FFFFFF; color: #0F172A; font-family: var(--font-sans); overflow-y: auto;">
          <div style="border: 2px solid #0F172A; padding: 24px; border-radius: 4px; position: relative;">
            <div style="text-align: center; border-bottom: 2px solid #0F172A; padding-bottom: 16px; margin-bottom: 20px;">
              <div style="font-family: var(--font-serif); font-size: 1.8rem; font-weight: 800; letter-spacing: 0.08em; margin-bottom: 2px;">AUCTIONENGINE FINE AUCTIONS</div>
              <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.25em; color: #475569;">GENÈVE &bull; MONACO &bull; PARIS &bull; ZÜRICH</div>
              <div style="margin-top: 10px; font-family: var(--font-serif); font-size: 1.15rem; font-style: italic; color: #059669; font-weight: 700;">Biên Bản & Chứng Thư Xác Nhận Trúng Đấu Giá</div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 0.82rem; margin-bottom: 18px;">
              <div>
                <div style="color: #64748B; font-size: 0.7rem; text-transform: uppercase; font-weight: 700;">VẬT PHẨM ĐẤU GIÁ (LOT):</div>
                <div id="cert-lot-title" style="font-weight: 700; font-size: 0.95rem; margin-top: 2px;">Patek Philippe Nautilus 5711/1R</div>
                <div id="cert-lot-specs" style="color: #475569; font-size: 0.75rem; margin-top: 2px;">Vàng hồng 18K Rose Gold &bull; Caliber 324 S C</div>
              </div>
              <div style="text-align: right;">
                <div style="color: #64748B; font-size: 0.7rem; text-transform: uppercase; font-weight: 700;">MÃ LOT & PIN ĐỊNH DANH:</div>
                <div id="cert-lot-pin" style="font-family: var(--font-mono); font-weight: 800; font-size: 1rem; color: #0F172A; margin-top: 2px;">LOT #101 &bull; PIN #839201</div>
                <div id="cert-timestamp" style="font-size: 0.75rem; color: #64748B; margin-top: 2px;"></div>
              </div>
            </div>

            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 14px 18px; margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 8px;">
                <span style="color: #64748B;">Nhà Sưu Tầm Thắng Thầu:</span>
                <strong id="cert-winner-name" style="color: #0F172A;">Phạm Ngọc Thắng (#PD-6651)</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 8px;">
                <span style="color: #64748B;">Mã Số Sinh Viên / CCCD:</span>
                <strong id="cert-winner-mssv" style="font-family: var(--font-mono); color: #0F172A;">6651071071</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.95rem; border-top: 1px dashed #CBD5E1; padding-top: 8px; margin-top: 8px;">
                <span style="font-weight: 700; color: #0F172A;">Giá Khớp Lệnh Gõ Búa:</span>
                <strong id="cert-hammer-price" style="font-family: var(--font-mono); font-weight: 800; color: #059669; font-size: 1.15rem;">2.500.000.000 ₫</strong>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 16px; border-top: 1px solid #E2E8F0; font-size: 0.72rem; color: #64748B;">
              <div>
                <div>Bảo chứng Escrow: Ngân hàng Giám định Thụy Sĩ (UBS Geneva)</div>
                <div>Chữ ký số SHA-256 mã hóa lưu trữ vĩnh viễn trên sổ cái AUCTIONENGINE.</div>
              </div>
              <div style="text-align: center;">
                <div style="width: 80px; height: 80px; border: 2px dashed #94A3B8; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 4px auto; color: #059669; font-weight: 800; font-size: 0.65rem; text-transform: uppercase;">
                  GENEVA SEAL
                </div>
                <div>AUCTIONENGINE Authorized</div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal__footer" style="padding: 14px 24px; display: flex; justify-content: space-between; background: var(--bg-subtle);">
          <button type="button" class="btn btn-outline" onclick="window.closeModal('modal-print-certificate')">Đóng</button>
          <button type="button" class="btn btn-primary" onclick="window.print()" style="display: inline-flex; align-items: center; gap: 6px;">
            <svg viewBox="0 0 24 24" style="width: 15px; height: 15px;"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            <span>In Chứng Thư (Print / PDF)</span>
          </button>
        </div>
      </div>
    </div>
`;

  bindModalEvents();
}

function bindModalEvents() {
  // 1. Nhập PIN và vào sàn
  const executePinBtn = document.getElementById('btn-modal-execute-pin');
  const pinInput = document.getElementById('modal-pin-input-field');

  const executeJoin = () => {
    const pin = pinInput ? pinInput.value.trim() : '';
    if (!pin) {
      if (window.showToast) {
        window.showToast('Thiếu mã PIN', 'Vui lòng nhập mã PIN 6 số của phòng đấu giá!', 'warning');
      } else {
        alert('Vui lòng nhập mã PIN 6 số!');
      }
      return;
    }
    window.joinRoomByPin(pin);
  };

  if (executePinBtn) executePinBtn.addEventListener('click', executeJoin);
  if (pinInput) {
    pinInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') executeJoin();
    });
  }

  // 2. Auth tabs switching (Login / Register only)
  document.querySelectorAll('.auth-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      window.switchAuthTabTo(target);
    });
  });

  // 3. Login form
  const loginForm = document.getElementById('auth-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('modal-login-email').value.trim();
      const pass = document.getElementById('modal-login-password').value.trim();
      const store = window.AureliaApp || window.AuctionStore || window.dbService;
      if (store) {
        const res = store.login(email, pass);
        if (res && res.success) {
          if (window.showToast) {
            window.showToast('Đăng nhập thành công', `Chào mừng ${res.user.fullName} (${res.user.paddleId})!`, 'success');
          }
          window.closeModal('modal-auth');
          if (typeof window.renderHeader === 'function') window.renderHeader();
          setTimeout(() => {
            if (window.location.pathname.includes('login.html')) {
              window.location.href = 'index.html';
            } else {
              window.location.reload();
            }
          }, 350);
        } else {
          if (window.showToast) {
            window.showToast('Đăng nhập thất bại', (res && res.message) || 'Thông tin tài khoản không chính xác!', 'error');
          } else {
            alert((res && res.message) || 'Đăng nhập thất bại!');
          }
        }
      }
    });
  }

  // 4. Register form
  const regForm = document.getElementById('auth-register-form');
  if (regForm) {
    regForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('modal-reg-fullname').value.trim();
      const email = document.getElementById('modal-reg-email').value.trim();
      const pass = document.getElementById('modal-reg-password').value.trim();
      const balance = Number(document.getElementById('modal-reg-balance')?.value) || 5000000000;
      const store = window.AureliaApp || window.AuctionStore || window.dbService;
      if (store) {
        const res = store.register(name, email, pass, balance);
        if (res && res.success) {
          if (window.showToast) {
            window.showToast('Cấp thẻ thành công', `Chào mừng ${res.user.fullName}! Mã thẻ của bạn là: ${res.user.paddleId}`, 'success');
          }
          window.closeModal('modal-auth');
          if (typeof window.renderHeader === 'function') window.renderHeader();
          setTimeout(() => {
            if (window.location.pathname.includes('login.html')) {
              window.location.href = 'index.html';
            } else {
              window.location.reload();
            }
          }, 350);
        } else {
          if (window.showToast) {
            window.showToast('Đăng ký không thành công', (res && res.message) || 'Vui lòng kiểm tra lại thông tin.', 'error');
          }
        }
      }
    });
  }

  // 4b. Forgot Password Step 1: Send OTP
  const forgotForm1 = document.getElementById('auth-forgot-form-step1');
  if (forgotForm1) {
    forgotForm1.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = document.getElementById('modal-forgot-email').value.trim();
      const store = window.AureliaApp || window.AuctionStore || window.dbService;
      if (!store) return;

      const res = store.requestPasswordReset 
        ? store.requestPasswordReset(email) 
        : { success: false, message: 'Tính năng khôi phục mật khẩu đang khởi động...' };

      if (res && res.success) {
        if (window.showToast) {
          window.showToast('Mã OTP Bảo Mật Đã Phát Hành', res.message, 'success', 5000);
        }
        const s1 = document.getElementById('auth-forgot-step1');
        const s2 = document.getElementById('auth-forgot-step2');
        const maskedEl = document.getElementById('forgot-target-email-masked');
        if (maskedEl) maskedEl.textContent = res.maskedEmail || email;
        if (s1) s1.style.display = 'none';
        if (s2) s2.style.display = 'block';

        // Auto-fill OTP in input as a hint for presentation/demo
        const otpInput = document.getElementById('modal-forgot-otp');
        if (otpInput && res.otp) {
          otpInput.placeholder = `Mã OTP: ${res.otp}`;
          otpInput.value = res.otp; // Convenience for teacher demo
        }
      } else {
        if (window.showToast) {
          window.showToast('Không Thể Cấp Mã', (res && res.message) || 'Email không hợp lệ.', 'error', 4000);
        } else {
          alert((res && res.message) || 'Email không hợp lệ.');
        }
      }
    });
  }

  // 4c. Forgot Password Step 2: Confirm OTP & Set New Password
  const forgotForm2 = document.getElementById('auth-forgot-form-step2');
  if (forgotForm2) {
    forgotForm2.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = document.getElementById('modal-forgot-email').value.trim();
      const otp = document.getElementById('modal-forgot-otp').value.trim();
      const newPass = document.getElementById('modal-forgot-newpass').value.trim();
      const confirmPass = document.getElementById('modal-forgot-confirmpass').value.trim();

      const store = window.AureliaApp || window.AuctionStore || window.dbService;
      if (!store) return;

      const res = store.verifyAndResetPassword
        ? store.verifyAndResetPassword(email, otp, newPass, confirmPass)
        : { success: false, message: 'Tính năng khôi phục mật khẩu đang khởi động...' };

      if (res && res.success) {
        if (window.showToast) {
          window.showToast('Cấp Lại Mật Khẩu Thành Công', res.message, 'success', 4000);
        }
        // Switch back to login with email prefilled
        window.switchAuthTabTo('login');
        const loginEmail = document.getElementById('modal-login-email');
        if (loginEmail) loginEmail.value = email;
        const loginPass = document.getElementById('modal-login-password');
        if (loginPass) {
          loginPass.value = newPass;
          loginPass.focus();
        }
      } else {
        if (window.showToast) {
          window.showToast('Xác Thực Thất Bại', (res && res.message) || 'Mã OTP không đúng.', 'error', 4000);
        } else {
          alert((res && res.message) || 'Xác thực thất bại.');
        }
      }
    });
  }

  // 5. Escrow deposit submission
  const confirmDepositBtn = document.getElementById('btn-confirm-submit-deposit');
  if (confirmDepositBtn) {
    confirmDepositBtn.addEventListener('click', () => {
      if (!pendingDepositRoomId) return;
      const store = window.AureliaApp || window.AuctionStore || window.dbService;
      if (store) {
        const res = store.submitDeposit(pendingDepositRoomId);
        if (res.success) {
          if (window.showToast) {
            window.showToast('Ký quỹ thành công', 'Đã tạm khóa 15% cọc bảo chứng và kích hoạt thẻ đấu giá!', 'success');
          }
          // Realtime Relay: Broadcast NEW_DEPOSIT to all devices over MQTT
          try {
            var client = window.mqttClient;
            var cleanPin = String(pendingDepositRoomId || '').replace(/[^0-9]/g, '');
            var topic = window.mqttTopic || ('aurelia/auction/room/' + cleanPin);
            var u = store.getCurrentUser();
            var depObj = res.deposit || {};
            var depPayload = {
              id: depObj.id || ('dep-' + Date.now() + '-' + Math.floor(Math.random() * 1000)),
              roomId: pendingDepositRoomId,
              uid: depObj.uid || (u ? u.uid : 'usr-cust'),
              fullName: depObj.fullName || depObj.userName || (u ? u.fullName : 'Nhà Sưu Tầm'),
              userName: depObj.fullName || depObj.userName || (u ? u.fullName : 'Nhà Sưu Tầm'),
              paddleId: depObj.paddleId || (u ? u.paddleId : '#PD-0000'),
              amount: depObj.amount || 150000,
              status: depObj.status || 'LOCKED',
              timestamp: depObj.timestamp || Date.now()
            };

            if (client && client.connected) {
              client.publish(topic, JSON.stringify({
                type: 'NEW_DEPOSIT',
                senderId: window.mqttClientId || ('ae_client_' + Date.now()),
                roomId: pendingDepositRoomId,
                deposit: depPayload
              }), { qos: 1 });
            } else if (typeof mqtt !== 'undefined' && typeof mqtt.connect === 'function') {
              var tempC = mqtt.connect('wss://broker.emqx.io:8084/mqtt', { clientId: 'ae_dep_' + Math.random().toString(16).substring(2, 8), clean: true });
              tempC.on('connect', function() {
                tempC.publish(topic, JSON.stringify({
                  type: 'NEW_DEPOSIT',
                  senderId: 'ae_dep_sender',
                  roomId: pendingDepositRoomId,
                  deposit: depPayload
                }), { qos: 1 }, function() {
                  setTimeout(function() { tempC.end(); }, 1200);
                });
              });
            }
          } catch(e) {
            console.warn('[MQTT Deposit Broadcast Error]:', e);
          }
          window.closeModal('modal-escrow-deposit');
          if (typeof window.renderRoom === 'function') {
            window.renderRoom();
            if (typeof window.switchRoomTab === 'function') {
              window.switchRoomTab('deposits');
            }
          }
          if (typeof window.renderHeader === 'function') {
            window.renderHeader();
          }
        } else {
          if (res.insufficientFunds) {
            if (window.showToast) {
              window.showToast('Số dư không đủ', 'Vui lòng nạp thêm tiền vào ví để hoàn tất ký quỹ.', 'warning');
            }
            window.closeModal('modal-escrow-deposit');
            window.openWalletModal();
          } else {
            if (window.showToast) {
              window.showToast('Ký quỹ thất bại', res.message, 'error');
            } else {
              alert(res.message);
            }
          }
        }
      }
    });
  }

  // 6. Topup quick buttons & Custom Input
  const walletCustomInput = document.getElementById('wallet-custom-input');
  const walletPreviewText = document.getElementById('wallet-preview-text');
  const submitWalletTopupBtn = document.getElementById('btn-submit-wallet-topup');

  if (walletCustomInput && walletPreviewText) {
    walletCustomInput.addEventListener('input', () => {
      const val = Number(walletCustomInput.value);
      const store = window.AureliaApp || window.AuctionStore || window.dbService;
      if (val > 0 && store) {
        walletPreviewText.textContent = `Số tiền sẽ nạp: ${store.formatCurrency(val)}`;
      } else {
        walletPreviewText.textContent = '';
      }
    });
  }

  document.querySelectorAll('.topup-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const amt = Number(btn.getAttribute('data-amt'));
      if (walletCustomInput) {
        const curr = Number(walletCustomInput.value) || 0;
        walletCustomInput.value = curr + amt;
        const store = window.AureliaApp || window.AuctionStore || window.dbService;
        if (walletPreviewText && store) {
          walletPreviewText.textContent = `Số tiền sẽ nạp: ${store.formatCurrency(Number(walletCustomInput.value))}`;
        }
      }
    });
  });

  if (submitWalletTopupBtn) {
    submitWalletTopupBtn.addEventListener('click', () => {
      const amt = Number(walletCustomInput?.value);
      if (!amt || amt <= 0) {
        if (window.showToast) {
          window.showToast('Thiếu số tiền', 'Vui lòng nhập hoặc chọn số tiền bạn muốn nạp vào ví!', 'warning');
        } else {
          alert('Vui lòng nhập số tiền muốn nạp!');
        }
        return;
      }
      const store = window.AureliaApp || window.AuctionStore || window.dbService;
      if (store) {
        const res = store.topUpWallet(amt);
        if (res && res.success) {
          if (window.showToast) {
            window.showToast('Nạp tiền thành công', `Đã nạp thành công ${store.formatCurrency(amt)} vào ví khả dụng!`, 'success');
          }
          window.closeModal('wallet-modal');
          if (typeof window.renderHeader === 'function') window.renderHeader();
          setTimeout(() => window.location.reload(), 400);
        } else {
          if (window.showToast) {
            window.showToast('Chưa đăng nhập', 'Vui lòng đăng nhập để nạp tiền vào ví!', 'warning');
          }
        }
      }
    });
  }

  // 7. Copy Invite URL button
  const copyBtn = document.getElementById('btn-copy-invite-url');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const input = document.getElementById('invite-url-input');
      if (input) {
        input.select();
        navigator.clipboard.writeText(input.value);
        copyBtn.textContent = 'Đã Sao Chép';
        if (window.showToast) {
          window.showToast('Đã sao chép link', 'Đường dẫn phòng đấu giá đã được lưu vào bộ nhớ tạm!', 'success');
        }
        setTimeout(() => { copyBtn.textContent = 'Sao Chép'; }, 2000);
      }
    });
  }
}

// Global Modal Helpers
window.openModal = function(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.setAttribute('aria-hidden', 'false');
  el.classList.add('modal--active');
  document.body.style.overflow = 'hidden';
};

window.closeModal = function(id) {
  const el = document.getElementById(id);
  if (el) {
    el.setAttribute('aria-hidden', 'true');
    el.classList.remove('modal--active');
  }
  const remaining = document.querySelectorAll('.modal.modal--active, .modal[aria-hidden="false"]');
  if (remaining.length === 0) {
    document.body.style.overflow = '';
  }
};

window.switchAuthTabTo = function(tabName) {
  document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('tab-item--active'));
  const btn = document.getElementById(`auth-btn-tab-${tabName}`);
  if (btn) btn.classList.add('tab-item--active');
  
  const loginPanel = document.getElementById('auth-panel-login');
  const regPanel = document.getElementById('auth-panel-register');
  const forgotPanel = document.getElementById('auth-panel-forgot');
  const tabGroup = document.querySelector('#auth-view-guest .tab-group');
  const modalTitle = document.getElementById('auth-modal-main-title');

  if (loginPanel) loginPanel.style.display = tabName === 'login' ? 'block' : 'none';
  if (regPanel) regPanel.style.display = tabName === 'register' ? 'block' : 'none';
  if (forgotPanel) forgotPanel.style.display = tabName === 'forgot' ? 'block' : 'none';

  if (tabName === 'forgot') {
    if (tabGroup) tabGroup.style.display = 'none';
    if (modalTitle) modalTitle.textContent = 'Đặt Lại Mật Khẩu (Mã OTP Trực Tiếp)';
    const s1 = document.getElementById('auth-forgot-step1');
    const s2 = document.getElementById('auth-forgot-step2');
    if (s1) s1.style.display = 'block';
    if (s2) s2.style.display = 'none';
    const emailInput = document.getElementById('modal-forgot-email');
    if (emailInput && !emailInput.value) {
      emailInput.value = 'thang.pn@auctionengine.vn';
    }
  } else {
    if (tabGroup) tabGroup.style.display = 'flex';
    if (modalTitle) modalTitle.textContent = 'Đăng Nhập / Đăng Ký Tài Khoản';
  }
};

window.openEnterPinModal = function() {
  window.openModal('modal-enter-pin');
  const listEl = document.getElementById('modal-pin-quick-rooms-list');
  if (listEl) {
    const store = window.AureliaApp || window.AuctionStore || window.dbService;
    const rooms = store ? store.getRooms() : [];
    if (rooms.length > 0) {
      listEl.innerHTML = rooms.slice(0, 4).map(r => `
        <button type="button" class="btn btn--secondary btn--sm" style="text-align: left; justify-content: space-between; padding: 7px 12px;" onclick="window.joinRoomByPin('${r.roomPin}')">
          <span><strong>#${r.roomPin}</strong> &bull; ${r.title}</span>
          <span class="badge ${r.status === 'LIVE' ? 'badge--live' : 'badge--waiting'}">${r.status === 'LIVE' ? 'Đang Live' : 'Phòng Chờ'}</span>
        </button>
      `).join('');
    }
  }
  setTimeout(() => {
    const input = document.getElementById('modal-pin-input-field');
    if (input) {
      input.value = '';
      input.focus();
    }
  }, 100);
};

window.joinRoomByPin = function(pin) {
  const store = window.AureliaApp || window.AuctionStore || window.dbService;
  const cleanPin = String(pin || '').replace('#', '').trim();
  if (!cleanPin) {
    if (window.showToast) {
      window.showToast('Thiếu mã PIN', 'Vui lòng nhập mã PIN phòng đấu giá!', 'warning');
    }
    return;
  }
  const rooms = store ? store.getRooms() : [];
  const room = rooms.find(r => 
    String(r.roomPin) === cleanPin || 
    String(r.roomId).toLowerCase() === cleanPin.toLowerCase() ||
    String(r.roomId).endsWith(cleanPin) ||
    String(r.id).endsWith(cleanPin) ||
    String(r.lotNumber) === cleanPin
  );
  if (room) {
    window.location.href = `live-room.html?room=${room.roomPin}`;
  } else {
    // Chuyển hướng trực tiếp để live-room có thể giải mã hydrate từ tham số hoặc URL
    window.location.href = `live-room.html?room=${cleanPin}`;
  }
};

window.openAuthModal = function(defaultTab) {
  const store = window.AureliaApp || window.AuctionStore || window.dbService;
  const user = store ? store.getCurrentUser() : null;

  const profileView = document.getElementById('auth-view-profile');
  const guestView = document.getElementById('auth-view-guest');
  const modalTitle = document.getElementById('auth-modal-main-title');

  if (user) {
    // Show logged-in profile
    if (profileView) profileView.style.display = 'block';
    if (guestView) guestView.style.display = 'none';
    if (modalTitle) modalTitle.textContent = 'Hồ Sơ & Thẻ Đấu Giá';

    const avatarInitial = (user.fullName || 'A').trim().charAt(0).toUpperCase();
    const avatarEl = document.getElementById('auth-prof-avatar-circle');
    if (avatarEl) {
      if (user.avatar) {
        avatarEl.innerHTML = `<img src="${user.avatar}" alt="${user.fullName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" onerror="this.onerror=null; this.parentElement.textContent='${avatarInitial}';" />`;
      } else {
        avatarEl.textContent = avatarInitial;
      }
    }

    document.getElementById('auth-prof-name').textContent = user.fullName;
    const roleBadge = document.getElementById('auth-prof-role-badge');
    if (roleBadge) {
      if (user.role === 'admin' || user.isAdmin) {
        roleBadge.textContent = 'QUẢN TRỊ VIÊN HỆ THỐNG (SUPER ADMIN)';
        roleBadge.className = 'badge badge--live';
        roleBadge.style.background = '#059669';
        roleBadge.style.color = '#FFFFFF';
      } else {
        roleBadge.textContent = user.role || 'VIP MEMBER';
        roleBadge.className = 'badge badge--live';
      }
    }
    document.getElementById('auth-prof-paddle').textContent = user.paddleId || '#PD----';
    document.getElementById('auth-prof-email').textContent = user.email || '';
    document.getElementById('auth-prof-wallet').textContent = store.formatCurrency(user.walletAvailable || 0);
    document.getElementById('auth-prof-escrow').textContent = store.formatCurrency(user.walletEscrow || 0);
  } else {
    // Show guest login / register forms
    if (profileView) profileView.style.display = 'none';
    if (guestView) guestView.style.display = 'block';
    if (modalTitle) modalTitle.textContent = 'Đăng Nhập / Đăng Ký Tài Khoản';
    window.switchAuthTabTo(defaultTab || 'login');
  }

  window.openModal('modal-auth');
};

window.switchUser = function(userKey) {
  const store = window.AureliaApp || window.AuctionStore || window.dbService;
  if (store) {
    store.quickLogin(userKey);
    window.closeModal('modal-auth');
    if (typeof window.renderHeader === 'function') window.renderHeader();
    setTimeout(() => window.location.reload(), 300);
  }
};

window.logoutUser = function() {
  const store = window.AureliaApp || window.AuctionStore || window.dbService;
  if (store) {
    store.logout();
    if (window.showToast) {
      window.showToast('Đã đăng xuất', 'Quý khách đã đăng xuất tài khoản an toàn.', 'info');
    }
    window.closeModal('modal-auth');
    if (typeof window.renderHeader === 'function') window.renderHeader();
    setTimeout(() => {
      window.location.reload();
    }, 400);
  }
};

window.openWalletModal = function() {
  const store = window.AureliaApp || window.AuctionStore || window.dbService;
  const user = store ? store.getCurrentUser() : null;
  if (user) {
    const modalVal = document.getElementById('modal-wallet-curr-val');
    const modalEscrow = document.getElementById('modal-wallet-escrow-val');
    if (modalVal) modalVal.textContent = store.formatCurrency(user.walletAvailable);
    if (modalEscrow) modalEscrow.textContent = store.formatCurrency(user.walletEscrow || 0);
  } else {
    window.openAuthModal('login');
    if (window.showToast) {
      window.showToast('Yêu cầu tài khoản', 'Vui lòng đăng nhập để xem và nạp tiền vào ví của bạn!', 'info');
    }
    return;
  }
  const input = document.getElementById('wallet-custom-input');
  if (input) input.value = '';
  const preview = document.getElementById('wallet-preview-text');
  if (preview) preview.textContent = '';
  window.openModal('wallet-modal');
};

window.openEscrowDepositModal = function(roomId) {
  pendingDepositRoomId = roomId;
  const store = window.AureliaApp || window.AuctionStore || window.dbService;
  const room = store ? store.getRoom(roomId) : null;
  const user = store ? store.getCurrentUser() : null;

  if (!user) {
    window.openAuthModal('login');
    if (window.showToast) {
      window.showToast('Yêu cầu đăng nhập', 'Quý khách vui lòng đăng nhập hoặc đăng ký để nộp cọc và nhận mã thẻ đấu giá!', 'info');
    }
    return;
  }

  if (!room) return;

  const needed = room.depositAmount || Math.round(room.startPrice * 0.15);
  document.getElementById('deposit-modal-lot-price').textContent = store.formatCurrency(room.startPrice);
  document.getElementById('deposit-modal-amount-needed').textContent = store.formatCurrency(needed);
  document.getElementById('deposit-modal-user-balance').textContent = store.formatCurrency(user.walletAvailable);

  window.openModal('modal-escrow-deposit');
};

window.openDepositModal = window.openEscrowDepositModal;

// Official Auction Result Modal Handler
window.openAuctionResultModal = function(data) {
  if (!data) return;
  const store = window.AureliaApp || window.AuctionStore || window.dbService;

  const hasWinner = !!(data.winnerName && data.winnerPaddleId && data.winnerName !== 'Không có người trúng thầu');
  const headlineEl = document.getElementById('result-headline');
  const sublineEl = document.getElementById('result-subline');
  const iconEl = document.getElementById('result-status-icon');

  if (headlineEl && sublineEl) {
    if (hasWinner) {
      headlineEl.textContent = 'Phiên đấu giá đã kết thúc thành công';
      sublineEl.textContent = 'Biên bản đã được xác lập và gửi đến các bên có quyền lợi liên quan.';
      if (iconEl) iconEl.style.color = 'var(--accent-bid)';
    } else {
      headlineEl.textContent = 'Phiên đấu giá đã đóng (Không có giao dịch)';
      sublineEl.textContent = 'Không có lượt trả giá nào phát sinh trong thời gian diễn ra phiên.';
      if (iconEl) iconEl.style.color = 'var(--text-muted)';
    }
  }

  document.getElementById('result-room-pin').textContent = `#${data.roomPin || '------'}`;
  document.getElementById('result-lot-title').textContent = data.title || 'Vật phẩm đấu giá';
  document.getElementById('result-settle-status').textContent = hasWinner ? 'Đấu giá thành công' : 'Đóng phiên không có người mua';
  document.getElementById('result-winner-info').textContent = hasWinner ? `${data.winnerName} (${data.winnerPaddleId})` : 'Không có';
  document.getElementById('result-final-price').textContent = hasWinner ? (store ? store.formatCurrency(data.amount) : `${data.amount} ₫`) : '0 ₫';
  document.getElementById('result-timestamp').textContent = new Date().toLocaleString('vi-VN');

  window.openModal('modal-auction-result');
};

window.openWinningCertModal = window.openAuctionResultModal;

window.openRoomInviteModal = function(roomId) {
  const store = window.AureliaApp || window.AuctionStore || window.dbService;
  const room = store ? store.getRoom(roomId) : null;
  if (!room) return;

  const pinDisplay = document.getElementById('invite-room-pin-display');
  if (pinDisplay) pinDisplay.textContent = room.roomPin;

  // 1. Tự động xác định host phù hợp (Ưu tiên Vercel Online công khai để điện thoại quét QR kết nối được ngay)
  const vercelPublicOrigin = 'https://auction-engine-071.vercel.app';
  const isFileProto = window.location.protocol === 'file:';
  const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const detectedLanIp = '192.168.1.175';
  const currentPort = window.location.port || '5500';
  const hostInput = document.getElementById('invite-server-host');
  
  // Mặc định luôn ưu tiên link Vercel để quét bằng điện thoại (4G / 5G / Wi-Fi) không bao giờ bị lỗi kết nối
  let defaultHost = vercelPublicOrigin;
  if (!isLocalHost && !isFileProto && window.location.origin && window.location.origin !== 'null') {
    defaultHost = window.location.origin;
  }

  if (hostInput) {
    hostInput.value = defaultHost;
  }

  const updateInviteUrls = function() {
    let baseHost = (hostInput ? hostInput.value.trim() : '').replace(/\/+$/, '');
    if (!baseHost) {
      baseHost = defaultHost;
    }

    let folderPath = '/auction-engine-web';
    if (!isFileProto && window.location.pathname) {
      const p = window.location.pathname;
      if (p.includes('/auction-engine-web')) {
        folderPath = '/auction-engine-web';
      } else {
        folderPath = p.substring(0, p.lastIndexOf('/')) || '';
      }
    }

    // Link ngắn gọn, chuẩn 100%, không chứa chuỗi base64 khổng lồ để quét QR cực nhanh
    const cleanTitle = encodeURIComponent(String(room.title || '').trim().substring(0, 40));
    const shareUrl = `${baseHost}${folderPath}/live-room.html?room=${room.roomPin}&t=${cleanTitle}&sp=${room.startPrice || 0}&cat=${room.category || 'watches'}`;
    const urlInput = document.getElementById('invite-url-input');
    if (urlInput) urlInput.value = shareUrl;

    // Render Mã QR Code to rõ, ô nét, quét bằng camera điện thoại siêu nhạy trong 0.1s
    const qrImg = document.getElementById('invite-qr-img');
    if (qrImg) {
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=6&data=${encodeURIComponent(shareUrl)}`;
      qrImg.src = qrApiUrl;
      qrImg.onerror = function() {
        this.onerror = null;
        this.src = `https://chart.googleapis.com/chart?chs=260x260&cht=qr&chl=${encodeURIComponent(shareUrl)}&choe=UTF-8`;
      };
    }
  };

  updateInviteUrls();

  if (hostInput) {
    hostInput.oninput = updateInviteUrls;
  }
  const btnUseVercel = document.getElementById('btn-use-vercel');
  if (btnUseVercel) {
    btnUseVercel.onclick = function() {
      if (hostInput) hostInput.value = vercelPublicOrigin;
      updateInviteUrls();
    };
  }
  const btnUseLan = document.getElementById('btn-use-lan-ip');
  if (btnUseLan) {
    btnUseLan.onclick = function() {
      if (hostInput) hostInput.value = `http://${detectedLanIp}:${currentPort}`;
      updateInviteUrls();
    };
  }
  const btnUseLocal = document.getElementById('btn-use-localhost');
  if (btnUseLocal) {
    btnUseLocal.onclick = function() {
      if (hostInput) hostInput.value = `http://localhost:${currentPort}`;
      updateInviteUrls();
    };
  }

  // Nút sao chép mã PIN nhanh
  const btnQuickCopyPin = document.getElementById('btn-quick-copy-pin');
  if (btnQuickCopyPin) {
    btnQuickCopyPin.onclick = function() {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(room.roomPin).then(function() {
          if (window.showToast) {
            window.showToast('Đã sao chép mã PIN', 'Mã PIN #' + room.roomPin + ' đã lưu vào bộ nhớ tạm.', 'success');
          } else {
            alert('Đã chép mã PIN: ' + room.roomPin);
          }
        });
      }
    };
  }

  // Nút sao chép liên kết trực tiếp
  const copyBtn = document.getElementById('btn-copy-invite-url');
  if (copyBtn) {
    copyBtn.onclick = function() {
      const inp = document.getElementById('invite-url-input');
      if (inp) {
        inp.select();
        navigator.clipboard.writeText(inp.value).then(function() {
          if (window.showToast) {
            window.showToast('Đã sao chép liên kết', 'Đường dẫn chia sẻ (kèm dữ liệu phòng) đã được lưu vào bộ nhớ tạm!', 'success');
          } else {
            alert('Đã sao chép liên kết phòng vào bộ nhớ tạm!');
          }
        }).catch(function() {
          document.execCommand('copy');
          if (window.showToast) {
            window.showToast('Đã sao chép liên kết', 'Đường dẫn chia sẻ đã được lưu vào bộ nhớ tạm!', 'success');
          }
        });
      }
    };
  }

  window.openModal('modal-room-invite');
};

function pinToNum(pin) {
  let n = 0;
  for (let i = 0; i < (pin || '').length; i++) n += pin.charCodeAt(i);
  return n;
}

// Escape key to close modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.modal--active, .modal[aria-hidden="false"]').forEach(m => {
      window.closeModal(m.id);
    });
  }
});

window.renderModals = renderModals;

function checkUrlModalParams() {
  try {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('modal');
    if (m === 'auth' || m === 'login' || m === 'forgot') {
      setTimeout(() => {
        window.openAuthModal(m === 'forgot' ? 'forgot' : (params.get('tab') || 'login'));
      }, 400);
    } else if (m === 'pin') {
      setTimeout(() => window.openEnterPinModal(), 400);
    } else if (m === 'wallet') {
      setTimeout(() => window.openWalletModal(), 400);
    } else if (m === 'notif') {
      setTimeout(() => window.openNotificationsModal(), 400);
    } else if (m === 'watchlist') {
      setTimeout(() => window.openWatchlistModal(), 400);
    }
  } catch (e) {}
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('modal-enter-pin')) window.renderModals();
    checkUrlModalParams();
  });
} else {
  if (!document.getElementById('modal-enter-pin')) window.renderModals();
  checkUrlModalParams();
}


// =========================================================================
// NOTIFICATIONS & WATCHLIST HANDLERS
// =========================================================================
window.openNotificationsModal = function() {
  const store = window.AureliaApp || window.AuctionStore;
  const listEl = document.getElementById('modal-notifs-list');
  if (store && listEl) {
    const notifs = store.getNotifications();
    if (notifs.length === 0) {
      listEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:0.8rem;">Không có thông báo mới</div>';
    } else {
      listEl.innerHTML = notifs.map(n => {
        const borderC = n.type === 'success' ? '#059669' : (n.type === 'error' ? '#DC2626' : (n.type === 'warning' ? '#D97706' : '#3B82F6'));
        return `
          <div style="background:var(--bg-page);border:1px solid var(--border-color);border-left:3px solid ${borderC};border-radius:6px;padding:10px 12px;position:relative;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
              <strong style="font-size:0.82rem;color:var(--text-primary);">${n.title}</strong>
              <span style="font-size:0.68rem;color:var(--text-muted);">${n.time}</span>
            </div>
            <div style="font-size:0.75rem;color:var(--text-secondary);line-height:1.4;">${n.message}</div>
          </div>
        `;
      }).join('');
    }
  }
  window.openModal('modal-notifications');
};

window.markAllNotifsRead = function() {
  const store = window.AureliaApp || window.AuctionStore;
  if (store && typeof store.markNotifsAsRead === 'function') {
    store.markNotifsAsRead();
    const badge = document.getElementById('notif-badge');
    if (badge) badge.style.display = 'none';
    if (window.showToast) window.showToast('Thành Công', 'Đã đánh dấu tất cả thông báo là đã đọc.', 'success', 2000);
    window.openNotificationsModal();
  }
};

window.openWatchlistModal = function() {
  const store = window.AureliaApp || window.AuctionStore;
  const listEl = document.getElementById('modal-watchlist-items');
  const emptyEl = document.getElementById('modal-watchlist-empty');
  if (store && listEl) {
    const rooms = store.getWatchedRooms();
    if (rooms.length === 0) {
      listEl.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
    } else {
      if (emptyEl) emptyEl.style.display = 'none';
      listEl.innerHTML = rooms.map(r => `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--bg-page);border:1px solid var(--border-color);border-radius:8px;padding:10px 14px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="${(r.images && r.images[0]) || 'assets/images/patek_nautilus_gold.jpg'}" alt="" style="width:48px;height:48px;border-radius:6px;object-fit:cover;border:1px solid var(--border-color);" />
            <div>
              <div style="font-weight:700;font-size:0.82rem;color:var(--text-primary);">${r.title}</div>
              <div style="font-size:0.72rem;color:var(--text-muted);">
                <strong style="color:#059669;font-family:var(--font-mono);">${store.formatCurrency(r.currentPrice || r.startPrice)}</strong> &bull; PIN: #${r.roomPin || r.roomId}
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
            <a href="live-room.html?room=${r.roomPin || r.roomId}" class="btn btn--primary btn--sm" style="font-size:0.72rem;padding:4px 8px;">Vào Phòng</a>
            <button type="button" class="btn btn--outline btn--sm" style="font-size:0.72rem;padding:4px 6px;color:#DC2626;" onclick="window.removeWatchlistItem('${r.roomId}')">&times;</button>
          </div>
        </div>
      `).join('');
    }
  }
  window.openModal('modal-watchlist');
};

window.removeWatchlistItem = function(roomId) {
  const store = window.AureliaApp || window.AuctionStore;
  if (store) {
    store.toggleWatchlist(roomId);
    window.openWatchlistModal();
  }
};

window.openAdminRejectModal = function(roomId) {
  const store = window.AureliaApp || window.AuctionStore;
  const room = store ? store.getRoom(roomId) : null;
  if (!room) return;
  document.getElementById('admin-reject-room-id').value = room.roomId;
  document.getElementById('admin-reject-room-title').textContent = 'Từ chối phiên: ' + room.title + ' (PIN: #' + (room.roomPin || room.roomId) + ')';
  document.getElementById('admin-reject-reason-text').value = '';
  window.openModal('modal-admin-reject-reason');
};

window.confirmAdminReject = function() {
  const roomId = document.getElementById('admin-reject-room-id').value;
  const reason = document.getElementById('admin-reject-reason-text').value;
  if (!reason.trim()) {
    alert('Vui lòng nhập lý do từ chối cụ thể!');
    return;
  }
  const store = window.AureliaApp || window.AuctionStore;
  if (store && typeof store.rejectRoom === 'function') {
    store.rejectRoom(roomId, reason);
    window.closeModal('modal-admin-reject-reason');
    if (typeof window.refreshAdminView === 'function') {
      window.refreshAdminView();
    }
  }
};

window.openCertificateModal = function(roomId) {
  const store = window.AureliaApp || window.AuctionStore;
  const room = store ? store.getRoom(roomId || 'room-112') : null;
  if (room) {
    const winnerName = room.winnerName || 'Phạm Ngọc Thắng (#PD-6651)';
    const hammer = room.currentPrice || room.startPrice;
    const escrow = room.depositAmount || Math.round(hammer * 0.15);
    const rem = hammer - escrow;

    const elCode = document.getElementById('cert-code-no');
    if (elCode) elCode.textContent = 'CERTIFICATE ID: AUCTIONENGINE-' + (room.roomPin || '192834');
    const elTitle = document.getElementById('cert-item-title');
    if (elTitle) elTitle.textContent = room.title;
    const elPin = document.getElementById('cert-lot-pin');
    if (elPin) elPin.textContent = 'LOT #' + (room.lotNumber || '112') + ' • PIN #' + (room.roomPin || '192834');
    const elWin = document.getElementById('cert-winner-name');
    if (elWin) elWin.textContent = winnerName + ' • MSSV: 6651071071';
    const elPrice = document.getElementById('cert-hammer-price');
    if (elPrice) elPrice.textContent = store.formatCurrency(hammer);
    const elDep = document.getElementById('cert-escrow-amount');
    if (elDep) elDep.textContent = store.formatCurrency(escrow) + ' (Đã khấu trừ)';
    const elRem = document.getElementById('cert-remaining-amount');
    if (elRem) elRem.textContent = store.formatCurrency(rem);
    const elTime = document.getElementById('cert-settle-time');
    if (elTime) elTime.textContent = new Date().toLocaleString('vi-VN');
  }
  window.openModal('modal-print-certificate');
};

window.printCertificate = function() {
  window.print();
};
