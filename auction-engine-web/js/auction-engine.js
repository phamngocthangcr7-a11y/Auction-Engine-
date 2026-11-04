/**
 * AUCTION ENGINE - CORE REALTIME ENGINE & SOUND SYNTHESIZER
 * Kiến trúc chuẩn mực, không phụ thuộc file âm thanh ngoài (Web Audio API Synthesizer)
 * Tương thích cả khi mở trực tiếp file:// lẫn Web Server.
 */

class WebAudioSoundSystem {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * Hiệu ứng tiếng búa đấu giá (Gavel Strike) x3 lần vang dội
   */
  playGavelStrike(count = 3, intervalMs = 600) {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    let strikes = 0;
    const hit = () => {
      strikes++;
      const now = ctx.currentTime;

      // Tiếng gõ búa trầm (Low thump)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(140, now);
      osc1.frequency.exponentialRampToValueAtTime(35, now + 0.15);

      gain1.gain.setValueAtTime(1.0, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.26);

      // Tiếng đanh vang của gỗ cứng (Wood click)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(800, now);
      osc2.frequency.exponentialRampToValueAtTime(100, now + 0.05);

      gain2.gain.setValueAtTime(0.4, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.07);

      if (strikes < count) {
        setTimeout(hit, intervalMs);
      }
    };

    hit();
  }

  /**
   * Tiếng tick đếm ngược những giây cuối
   */
  playCountdownBeep(freq = 880) {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Tiếng còi cảnh báo khi bị đối thủ vượt giá (Outbid Warning)
   */
  playOutbidWarning() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(330, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  /**
   * Tiếng chuông reo khi đặt giá thành công
   */
  playBidSuccess() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + (idx * 0.06);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.22);
    });
  }

  /**
   * Khúc nhạc khải hoàn chiến thắng trúng thầu (Win Fanfare)
   */
  playWinFanfare() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    chords.forEach((freq, idx) => {
      setTimeout(() => {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.65);
      }, idx * 120);
    });
  }
}

// Khởi tạo hệ thống âm thanh Singleton
window.soundSystem = new WebAudioSoundSystem();

class AuctionEngine {
  /**
   * Tính toán thời gian đếm ngược chính xác theo mili-giây
   */
  static calculateTimeRemaining(endTimeStr) {
    const endMs = new Date(endTimeStr).getTime();
    const nowMs = Date.now();
    const totalMs = Math.max(0, endMs - nowMs);

    const totalSeconds = Math.floor(totalMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      totalMs,
      totalSeconds,
      days,
      hours,
      minutes,
      seconds,
      isEnded: totalMs <= 0,
      isUrgent: totalSeconds > 0 && totalSeconds <= 60,
      isAntiSnipingZone: totalSeconds > 0 && totalSeconds < 30
    };
  }

  /**
   * Định dạng chuỗi đếm ngược trực quan
   */
  static formatCountdownString(timeObj) {
    if (timeObj.isEnded) {
      return "00:00:00 (ĐÃ GÕ BÚA)";
    }

    const pad = (num) => String(num).padStart(2, '0');

    if (timeObj.days > 0) {
      return `${timeObj.days}d : ${pad(timeObj.hours)}h : ${pad(timeObj.minutes)}m : ${pad(timeObj.seconds)}s`;
    }
    return `${pad(timeObj.hours)}:${pad(timeObj.minutes)}:${pad(timeObj.seconds)}`;
  }

  /**
   * Định dạng tiền tệ VNĐ hoặc USD
   */
  static formatCurrency(amount) {
    if (window.dbService && typeof window.dbService.formatCurrency === 'function') {
      return window.dbService.formatCurrency(amount);
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Tính toán bước giá hợp lệ tiếp theo (+1x, +2x, +5x)
   */
  static getNextValidBid(currentPrice, stepPrice, multiplier = 1) {
    return Number(currentPrice) + (Number(stepPrice) * multiplier);
  }

  /**
   * Đặt giá trực tiếp cho phòng đấu giá
   */
  static placeBid(roomId, bidAmount, bidType = 'MANUAL') {
    if (window.dbService) {
      const res = window.dbService.placeBid(roomId, bidAmount, bidType);
      if (res.success) {
        window.soundSystem.playBidSuccess();
      }
      return res;
    }
    return { success: false, message: 'Database service chưa được nạp!' };
  }

  /**
   * Đăng ký ký quỹ phòng
   */
  static submitDeposit(roomId) {
    if (window.dbService) {
      const res = window.dbService.submitDeposit(roomId);
      if (res.success) {
        window.soundSystem.playBidSuccess();
      }
      return res;
    }
    return { success: false, message: 'Database service chưa được nạp!' };
  }

  /**
   * Kích hoạt Proxy Auto-Bid
   */
  static setProxyBid(roomId, maxCeiling) {
    const user = window.dbService ? window.dbService.getCurrentUser() : null;
    if (!user) return { success: false, message: 'Vui lòng đăng nhập!' };

    const room = window.dbService.getRoom(roomId);
    if (!room) return { success: false, message: 'Phòng không tồn tại!' };

    const minValidBid = room.currentPrice + room.stepPrice;
    if (maxCeiling < minValidBid) {
      return { 
        success: false, 
        message: `Mức giá trần tự động phải từ ${this.formatCurrency(minValidBid)} trở lên!` 
      };
    }

    // Lưu proxy vào LocalStorage
    const proxies = JSON.parse(localStorage.getItem('AE_PROXY_BIDS') || '{}');
    proxies[roomId] = {
      uid: user.uid,
      userName: user.fullName,
      paddleId: user.paddleId,
      maxCeiling,
      active: true,
      timestamp: Date.now()
    };
    localStorage.setItem('AE_PROXY_BIDS', JSON.stringify(proxies));

    // Nếu chưa dẫn đầu, trả giá ngay mức tối thiểu
    if (room.leaderUid !== user.uid) {
      this.placeBid(roomId, minValidBid, 'PROXY_AUTO');
    }

    return {
      success: true,
      message: `Đã kích hoạt Proxy Auto-Bid với mức trần ${this.formatCurrency(maxCeiling)}!`
    };
  }

  /**
   * Kiểm tra và tự động kích hoạt Proxy Auto-Bid nếu có đối thủ vượt giá
   */
  static evaluateProxyBids(roomId, currentPrice, currentLeaderUid) {
    const proxies = JSON.parse(localStorage.getItem('AE_PROXY_BIDS') || '{}');
    const proxyConfig = proxies[roomId];
    if (!proxyConfig || !proxyConfig.active) return;

    // Nếu người dẫn đầu chính là người đặt proxy thì không cần trả thêm
    if (proxyConfig.uid === currentLeaderUid) return;

    const room = window.dbService ? window.dbService.getRoom(roomId) : null;
    if (!room || room.status === 'ENDED') return;

    const nextBid = currentPrice + room.stepPrice;
    if (nextBid <= proxyConfig.maxCeiling) {
      setTimeout(() => {
        window.dbService.placeBid(roomId, nextBid, 'PROXY_AUTO');
        if (window.ToastManager) {
          window.ToastManager.show(
            ' Proxy Auto-Bid',
            `Hệ thống vừa tự động nâng giá lên ${this.formatCurrency(nextBid)} để giữ vững vị trí của bạn!`,
            'info'
          );
        }
      }, 1200);
    } else {
      // Vượt mức trần
      proxyConfig.active = false;
      localStorage.setItem('AE_PROXY_BIDS', JSON.stringify(proxies));
      window.soundSystem.playOutbidWarning();
      if (window.ToastManager) {
        window.ToastManager.show(
          '️ BẠN ĐÃ BỊ VƯỢT MỨC TRẦN',
          `Đối thủ vừa trả ${this.formatCurrency(currentPrice)}, đã vượt trần ${this.formatCurrency(proxyConfig.maxCeiling)} của bạn!`,
          'danger'
        );
      }
    }
  }
}

window.AuctionEngine = AuctionEngine;
