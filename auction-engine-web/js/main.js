/**
 * AUCTION ENGINE - MAIN APPLICATION ENTRY POINT & UI CONTROLLER
 * Tương thích cả khi mở trực tiếp file:// lẫn qua Web Server.
 */

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = window.stateManager ? window.stateManager.isAudioMuted() : false;
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playGavel() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {}
  }

  playSuccessTing() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1318.51, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.65);
    } catch (e) {}
  }

  playAlert() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [0, 0.18].forEach(offset => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(587.33, now + offset);
        osc.frequency.setValueAtTime(880.00, now + offset + 0.08);

        gain.gain.setValueAtTime(0.35, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.16);
      });
    } catch (e) {}
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (window.stateManager) window.stateManager.setAudioMuted(this.isMuted);
    return this.isMuted;
  }
}

const soundSystem = new SoundSystem();
window.soundSystem = soundSystem;

class ToastManager {
  static container = null;

  static getContainer() {
    if (!this.container) {
      this.container = document.querySelector('.toast-container');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
      }
    }
    return this.container;
  }

  static show(title, desc, type = 'info', action = null, duration = 6000) {
    const container = this.getContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg class="toast__icon text-emerald" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`;
    } else if (type === 'danger') {
      iconSvg = `<svg class="toast__icon text-crimson" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`;
    } else if (type === 'warning') {
      iconSvg = `<svg class="toast__icon text-gold" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`;
    } else {
      iconSvg = `<svg class="toast__icon text-indigo" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>`;
    }

    let actionBtnHtml = '';
    if (action && action.text) {
      actionBtnHtml = `<button class="btn btn--primary btn--sm toast__action-btn" style="margin-top: 8px;">${action.text}</button>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <div class="toast__content">
        <h6 class="toast__title">${title}</h6>
        <p class="toast__desc">${desc}</p>
        ${actionBtnHtml}
      </div>
      <button class="toast__close" aria-label="Đóng thông báo">&times;</button>
    `;

    toast.querySelector('.toast__close').addEventListener('click', () => {
      this.dismiss(toast);
    });

    if (action && action.callback) {
      const btn = toast.querySelector('.toast__action-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          action.callback();
          this.dismiss(toast);
        });
      }
    }

    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }
  }

  static dismiss(toast) {
    if (!toast || toast.classList.contains('toast--out')) return;
    toast.classList.add('toast--out');
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 300);
  }
}

window.ToastManager = ToastManager;

function initializeApp() {
  if (!window.stateManager) return;
  console.log('[App] Khởi tạo AUCTION ENGINE Platform...');

  const savedTheme = window.stateManager.getTheme();
  document.documentElement.setAttribute('data-theme', savedTheme);

  setupGlobalEventSubscriptions();
  startGlobalCountdownLoop();

  if (window.stateManager.isSimulatorActive() && window.simulator) {
    window.simulator.start();
  }
}

function setupGlobalEventSubscriptions() {
  if (!window.eventBus) return;

  window.eventBus.subscribe('BID_PLACED', ({ item, bidRecord, antiSnipingTriggered }) => {
    if (bidRecord.bidderName.startsWith('@alex')) {
      window.soundSystem.playSuccessTing();
      ToastManager.show(
        'Đặt giá thành công!',
        `Bạn đã đặt ${window.AuctionEngine.formatCurrency(bidRecord.amount)} cho "${item.title}".`,
        'success'
      );
    }

    if (antiSnipingTriggered) {
      window.soundSystem.playAlert();
      ToastManager.show(
        ' Kích hoạt Anti-Sniping!',
        `Thời gian kết thúc của "${item.title}" được cộng thêm +30 giây để đảm bảo công bằng.`,
        'warning'
      );
    }
  });

  window.eventBus.subscribe('USER_OUTBID', ({ item, rivalName, newAmount, nextValidBid }) => {
    window.soundSystem.playAlert();
    ToastManager.show(
      '️ BẠN ĐÃ BỊ VƯỢT GIÁ!',
      `Nhà sưu tầm ${rivalName} vừa trả ${window.AuctionEngine.formatCurrency(newAmount)} cho "${item.title}".`,
      'danger',
      {
        text: `Trả giá lại ngay (${window.AuctionEngine.formatCurrency(nextValidBid)})`,
        callback: () => {
          window.AuctionEngine.placeBid(item.id, nextValidBid, '@alex_collector', 'MANUAL');
        }
      },
      8000
    );
  });
}

function startGlobalCountdownLoop() {
  setInterval(() => {
    if (!window.AuctionEngine) return;
    const countdownElements = document.querySelectorAll('[data-countdown-end]');
    countdownElements.forEach(el => {
      const endTime = el.getAttribute('data-countdown-end');
      if (!endTime) return;

      const remaining = window.AuctionEngine.calculateTimeRemaining(endTime);
      el.textContent = window.AuctionEngine.formatCountdownString(remaining);

      if (remaining.isUrgent) {
        el.classList.add('lot-card__countdown--urgent');
      } else {
        el.classList.remove('lot-card__countdown--urgent');
      }

      if (remaining.isEnded) {
        const card = el.closest('.lot-card');
        if (card) {
          const badge = card.querySelector('.badge--live');
          if (badge) {
            badge.className = 'badge badge--ended';
            badge.textContent = 'ĐÃ KẾT THÚC';
          }
        }
      }
    });
  }, 1000);
}

window.initializeApp = initializeApp;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
