/**
 * AUCTION ENGINE - LIVE RIVAL BOT SIMULATOR
 * Tương thích cả khi mở trực tiếp file:// lẫn qua Web Server.
 */

const RIVAL_COLLECTORS = [
  { name: '@Minh_Luxury (Hà Nội)', location: 'VN' },
  { name: '@Sotheby_Collector (London)', location: 'UK' },
  { name: '@Elena_Zurich (Thụy Sĩ)', location: 'CH' },
  { name: '@Tokyo_Vault (Tokyo)', location: 'JP' },
  { name: '@Geneva_Lord (Geneva)', location: 'CH' },
  { name: '@CryptoWhale_99 (Dubai)', location: 'UAE' },
  { name: '@Monaco_Trader (Monaco)', location: 'MC' },
  { name: '@Manhattan_Apex (New York)', location: 'US' },
  { name: '@Singapore_Prestige (Singapore)', location: 'SG' }
];

class LiveSimulator {
  constructor() {
    this.timer = null;
    this.isRunning = false;
    this.minInterval = 8000;
    this.maxInterval = 14000;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    window.stateManager.setSimulatorActive(true);
    console.log('[Simulator]  Chế độ Demo Thuyết trình (Live Rival Bot) đã KÍCH HOẠT!');
    this.scheduleNextTick();
  }

  stop() {
    this.isRunning = false;
    window.stateManager.setSimulatorActive(false);
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    console.log('[Simulator] ️ Đã dừng Chế độ Demo.');
  }

  toggle() {
    if (this.isRunning) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  scheduleNextTick() {
    if (!this.isRunning) return;

    const delay = Math.floor(Math.random() * (this.maxInterval - this.minInterval)) + this.minInterval;
    this.timer = setTimeout(() => {
      this.executeRandomBid();
      this.scheduleNextTick();
    }, delay);
  }

  executeRandomBid() {
    const items = window.stateManager.getItems().filter(item => item.status === 'LIVE');
    if (!items || items.length === 0) return;

    const randomItem = items[Math.floor(Math.random() * items.length)];
    const rival = RIVAL_COLLECTORS[Math.floor(Math.random() * RIVAL_COLLECTORS.length)];
    const multiplier = Math.random() > 0.75 ? 2 : 1;
    const bidAmount = randomItem.currentBid + (randomItem.minIncrement * multiplier);

    const previousTopBidder = (randomItem.bidHistory && randomItem.bidHistory[0]) 
      ? randomItem.bidHistory[0].bidderName 
      : '';
    const wasUserLeading = previousTopBidder.startsWith('@alex');

    const result = window.AuctionEngine.placeBid(randomItem.id, bidAmount, rival.name, 'MANUAL');

    if (result.success) {
      window.eventBus.publish('SIMULATOR_TICKER_UPDATE', {
        bidder: rival.name,
        amount: bidAmount,
        itemTitle: randomItem.title,
        itemId: randomItem.id
      });

      if (wasUserLeading) {
        window.eventBus.publish('USER_OUTBID', {
          item: randomItem,
          newAmount: bidAmount,
          rivalName: rival.name,
          nextValidBid: bidAmount + randomItem.minIncrement
        });

        window.stateManager.addNotification(
          '️ BẠN ĐÃ BỊ VƯỢT GIÁ (OUTBID)!',
          `Đối thủ ${rival.name} vừa trả ${window.AuctionEngine.formatCurrency(bidAmount)} cho "${randomItem.title}"!`,
          'danger'
        );
      }
    }
  }
}

const simulator = new LiveSimulator();
window.simulator = simulator;
