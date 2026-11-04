/**
 * AURELIA FINE AUCTIONS - FOOTER COMPONENT
 * Clean Swiss Editorial Design (Sotheby's × Bring a Trailer)
 * Zero Emojis - Inline SVG Icons (stroke-width="1.75")
 * Full Responsive Architecture for Desktop, Tablet & Mobile Viewports
 */

function renderFooter() {
  const footerContainer = document.getElementById('site-footer-root');
  if (!footerContainer) return;

  footerContainer.innerHTML = `
    <footer class="site-footer">
      <div class="container container--wide">
        <!-- 4-Column Editorial Grid (1 col on mobile, 2 cols on tablet, 4 cols on desktop) -->
        <div class="site-footer__grid">
          <!-- Col 1: Brand Info -->
          <div class="site-footer__brand-col">
            <div style="margin-bottom: 16px;">
              <span style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text-primary); display: block;">
                AUCTION<span style="color: #F59E0B;">ENGINE</span>
              </span>
              <span style="font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">
                SÀN ĐẤU GIÁ TRỰC TUYẾN
              </span>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px; max-width: 380px;">
              Nhà đấu giá giám định trực tuyến chuyên biệt về đồng hồ Thụy Sĩ độc bản, siêu xe cổ điển, thiết bị công nghệ nguyên mẫu và các tác phẩm nghệ thuật có bảo chứng pháp lý.
            </p>
            <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 8px;">
              <svg style="width: 15px; height: 15px; color: var(--text-muted); flex-shrink: 0;" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span>Quai du Mont-Blanc 14, 1201 Genève, Switzerland</span>
            </div>
          </div>

          <!-- Col 2: Categories -->
          <div class="site-footer__col">
            <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 16px;">Danh Mục Giám Định</h4>
            <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; font-size: 0.85rem;">
              <li><a href="auctions.html?category=watches" style="color: var(--text-secondary); text-decoration: none;">Đồng hồ Cơ Thụy Sĩ</a></li>
              <li><a href="auctions.html?category=hypercars" style="color: var(--text-secondary); text-decoration: none;">Siêu xe & Xe Cổ Điển</a></li>
              <li><a href="auctions.html?category=tech" style="color: var(--text-secondary); text-decoration: none;">Máy ảnh & Công nghệ Hiếm</a></li>
              <li><a href="auctions.html?category=art" style="color: var(--text-secondary); text-decoration: none;">Nghệ thuật & Kỷ vật</a></li>
              <li><a href="auctions.html" style="color: var(--text-secondary); text-decoration: none;">Tất cả Phiên Đấu Giá</a></li>
            </ul>
          </div>

          <!-- Col 3: Rules & Escrow -->
          <div class="site-footer__col">
            <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 16px;">Quy Chuẩn & Bảo Chứng</h4>
            <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; font-size: 0.85rem;">
              <li><a href="guide-about.html#anti-sniping" style="color: var(--text-secondary); text-decoration: none;">Cơ chế Anti-Sniping (+30s)</a></li>
              <li><a href="guide-about.html#proxy-bidding" style="color: var(--text-secondary); text-decoration: none;">Ủy thác Đặt giá Tự động</a></li>
              <li><a href="guide-about.html#escrow" style="color: var(--text-secondary); text-decoration: none;">Bảo chứng Ký quỹ Escrow 15%</a></li>
              <li><a href="guide-about.html#appraisal" style="color: var(--text-secondary); text-decoration: none;">Quy trình Thẩm định 4 Bước</a></li>
              <li><a href="guide-about.html#team" style="color: var(--text-secondary); text-decoration: none;">Điều khoản Sàn & Trách nhiệm</a></li>
            </ul>
          </div>

          <!-- Col 4: VIP Newsletter -->
          <div class="site-footer__col">
            <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 16px;">Bản Tin Danh Mục Mới</h4>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.5;">
              Nhận thông báo đặc quyền trước 48 giờ về các lô đấu giá độc bản giới hạn.
            </p>
            <form id="newsletter-form" style="display: flex; flex-direction: column; gap: 8px;" novalidate>
              <div>
                <input 
                  type="email" 
                  name="subscriberEmail" 
                  class="form-control" 
                  placeholder="Nhập email của bạn..." 
                  style="font-size: 0.8rem; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); width: 100%;"
                  required
                />
              </div>
              <button type="submit" class="btn btn-primary" style="width: 100%; font-size: 0.8rem; padding: 8px;">
                Đăng Ký Bản Tin
              </button>
            </form>
          </div>
        </div>

        <!-- Security Credentials Strip -->
        <div class="site-footer__security">
          <span class="site-footer__sec-item">
            <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <span><strong>Lloyd's of London</strong> Bảo hiểm lưu ký $50M</span>
          </span>
          <span class="site-footer__sec-item">
            <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <span><strong>256-bit SSL</strong> Mã hóa thanh toán ngân hàng</span>
          </span>
          <span class="site-footer__sec-item">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span><strong>Geneva Bureau</strong> Chứng thư thẩm định gốc</span>
          </span>
          <span class="site-footer__sec-item">
            <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            <span><strong>Real-time Matching</strong> Khớp lệnh tức thời</span>
          </span>
        </div>

        <!-- Bottom Copyright & Reset Demo Button -->
        <div class="site-footer__bottom">
          <div class="site-footer__copy">
            &copy; 2026 Aurelia Fine Auctions. Nền tảng đấu giá trực tuyến có bảo chứng ký quỹ.
          </div>
          <div class="site-footer__bottom-links">
            <span style="font-size: 0.75rem; color: var(--text-muted);">Genève &bull; London &bull; New York</span>
            <!-- Nút Reset Demo thu nhỏ thành icon mảnh tinh tế ở góc -->
            <button 
              type="button" 
              class="btn btn-outline" 
              style="padding: 4px 10px; font-size: 0.72rem; color: var(--text-muted); border-color: var(--border-color); display: inline-flex; align-items: center; gap: 6px;"
              onclick="if(confirm('Khôi phục toàn bộ dữ liệu gốc của sàn (Reset Demo Data)?')) { if(window.AureliaApp) window.AureliaApp.resetDemoData(); else if(window.AuctionStore) window.AuctionStore.resetDemoData(); else { localStorage.clear(); window.location.reload(); } }"
              title="Khôi phục dữ liệu gốc ban đầu"
            >
              <svg style="width: 13px; height: 13px;" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
              <span>Khôi phục dữ liệu gốc (Reset Demo)</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  `;

  setupNewsletterValidation();
}

function setupNewsletterValidation() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input[name="subscriberEmail"]');
    const email = input ? input.value.trim() : '';
    if (!email || !email.includes('@') || !email.includes('.')) {
      if (window.showToast) {
        window.showToast('Email không hợp lệ', 'Vui lòng nhập địa chỉ email hợp lệ để nhận bản tin!', 'warning');
      } else {
        alert('Vui lòng nhập địa chỉ email hợp lệ!');
      }
      return;
    }
    if (window.showToast) {
      window.showToast('Đăng ký bản tin', `Địa chỉ ${email} đã được thêm vào danh sách nhận bản tin ưu tiên của Aurelia Fine Auctions.`, 'success');
    } else {
      alert(`Đăng ký thành công!\nĐịa chỉ ${email} đã được thêm vào danh sách nhận bản tin ưu tiên của Aurelia Fine Auctions.`);
    }
    form.reset();
  });
}

window.renderFooter = renderFooter;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderFooter);
} else {
  renderFooter();
}
