/**
 * AUCTION ENGINE - GLOBAL STATE MANAGER & REACTIVE EVENT BUS
 * Tương thích cả khi mở trực tiếp file:// lẫn qua Web Server.
 */

class EventBus {
  constructor() {
    this.events = {};
  }

  subscribe(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }

  publish(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[EventBus] Lỗi trong callback của sự kiện ${event}:`, error);
        }
      });
    }
  }
}

const eventBus = new EventBus();
window.eventBus = eventBus;

const STORAGE_KEYS = {
  ITEMS: 'AUCTION_ENGINE_ITEMS_V1',
  WALLET: 'AUCTION_ENGINE_WALLET_V1',
  PROFILE: 'AUCTION_ENGINE_PROFILE_V1',
  WATCHLIST: 'AUCTION_ENGINE_WATCHLIST_V1',
  USER_BIDS: 'AUCTION_ENGINE_USER_BIDS_V1',
  PROXY_BIDS: 'AUCTION_ENGINE_PROXY_BIDS_V1',
  NOTIFICATIONS: 'AUCTION_ENGINE_NOTIFICATIONS_V1',
  SIMULATOR: 'AUCTION_ENGINE_SIMULATOR_ACTIVE_V1',
  THEME: 'AUCTION_ENGINE_THEME_V1',
  AUDIO_MUTED: 'AUCTION_ENGINE_AUDIO_MUTED_V1'
};

class StateManager {
  constructor() {
    this.initializeState();
  }

  initializeState() {
    try {
      const defaultItems = window.INITIAL_AUCTION_ITEMS || [];
      const defaultWallet = window.INITIAL_USER_WALLET || { balance: 250000, lockedEscrow: 50000 };
      const defaultProfile = window.INITIAL_USER_PROFILE || {};

      if (!localStorage.getItem(STORAGE_KEYS.ITEMS)) {
        localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(defaultItems));
      }
      if (!localStorage.getItem(STORAGE_KEYS.WALLET)) {
        localStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(defaultWallet));
      }
      if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(defaultProfile));
      }
      if (!localStorage.getItem(STORAGE_KEYS.WATCHLIST)) {
        localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.USER_BIDS)) {
        localStorage.setItem(STORAGE_KEYS.USER_BIDS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.PROXY_BIDS)) {
        localStorage.setItem(STORAGE_KEYS.PROXY_BIDS, JSON.stringify({}));
      }
      if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
        const defaultNotifs = [
          {
            id: 'notif-welcome',
            title: 'Chào mừng đến với Auction Engine VIP',
            message: 'Hạn mức đấu giá sơ cấp $250,000 USD đã được bảo chứng vào ví của bạn.',
            time: 'Hôm nay',
            read: false,
            type: 'info'
          }
        ];
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(defaultNotifs));
      }
    } catch (e) {
      console.warn('[StateManager] LocalStorage bị hạn chế. Sử dụng Fallback Memory Storage.', e);
    }
  }

  getItems() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ITEMS);
      let items = data ? JSON.parse(data) : (window.INITIAL_AUCTION_ITEMS || []);
      const now = Date.now();
      let hasUpdate = false;
      items = items.map(item => {
        if (item.status === 'LIVE' && new Date(item.endTime).getTime() <= now) {
          const addMinutes = item.id === 'lot-watch-01' ? 18 : item.id === 'lot-car-01' ? 42 : 26;
          item.endTime = new Date(now + addMinutes * 60000).toISOString();
          hasUpdate = true;
        }
        return item;
      });
      if (hasUpdate) {
        localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
      }
      return items;
    } catch (e) {
      return window.INITIAL_AUCTION_ITEMS || [];
    }
  }

  getItem(idOrSlug) {
    const items = this.getItems();
    return items.find(item => item.id === idOrSlug || item.slug === idOrSlug) || null;
  }

  saveItem(updatedItem) {
    try {
      const items = this.getItems();
      const index = items.findIndex(item => item.id === updatedItem.id);
      
      if (index !== -1) {
        items[index] = { ...items[index], ...updatedItem };
      } else {
        items.unshift(updatedItem);
      }

      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
      eventBus.publish('ITEM_UPDATED', updatedItem);
      return true;
    } catch (e) {
      return false;
    }
  }

  getWallet() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WALLET);
      return data ? JSON.parse(data) : (window.INITIAL_USER_WALLET || { balance: 250000, lockedEscrow: 50000 });
    } catch (e) {
      return window.INITIAL_USER_WALLET || { balance: 250000, lockedEscrow: 50000 };
    }
  }

  depositWallet(amount, method = 'Bank Wire') {
    try {
      const wallet = this.getWallet();
      wallet.balance += amount;
      wallet.totalDeposited = (wallet.totalDeposited || 0) + amount;
      if (!wallet.transactions) wallet.transactions = [];
      wallet.transactions.unshift({
        id: `tx-${Date.now()}`,
        type: 'DEPOSIT',
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        note: `Nạp tiền thành công qua ${method}`
      });

      localStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(wallet));
      eventBus.publish('WALLET_UPDATED', wallet);
      return { success: true, wallet };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  lockEscrow(escrowAmount, itemTitle) {
    try {
      const wallet = this.getWallet();
      if (wallet.balance < escrowAmount) {
        return { success: false, message: 'Số dư ví không đủ 10% đặt cọc bảo chứng!' };
      }

      wallet.balance -= escrowAmount;
      wallet.lockedEscrow += escrowAmount;
      if (!wallet.transactions) wallet.transactions = [];
      wallet.transactions.unshift({
        id: `tx-${Date.now()}`,
        type: 'LOCK_ESCROW',
        amount: escrowAmount,
        date: new Date().toISOString().split('T')[0],
        note: `Tạm khóa 10% đặt cọc cho phiên: ${itemTitle}`
      });

      localStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(wallet));
      eventBus.publish('WALLET_UPDATED', wallet);
      return { success: true, wallet };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  getWatchlist() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  toggleWatchlist(itemId) {
    try {
      let list = this.getWatchlist();
      const isExist = list.includes(itemId);
      if (isExist) {
        list = list.filter(id => id !== itemId);
      } else {
        list.push(itemId);
      }
      localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(list));
      eventBus.publish('WATCHLIST_UPDATED', { itemId, isWatched: !isExist, list });
      return !isExist;
    } catch (e) {
      return false;
    }
  }

  getUserBids() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_BIDS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  addUserBid(bidRecord) {
    try {
      const bids = this.getUserBids();
      bids.unshift(bidRecord);
      localStorage.setItem(STORAGE_KEYS.USER_BIDS, JSON.stringify(bids));
      eventBus.publish('USER_BIDS_UPDATED', bids);
      return true;
    } catch (e) {
      return false;
    }
  }

  getProxyBids() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROXY_BIDS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  setProxyBid(itemId, maxCeiling) {
    try {
      const proxies = this.getProxyBids();
      proxies[itemId] = {
        maxCeiling: Number(maxCeiling),
        createdAt: new Date().toISOString(),
        active: true
      };
      localStorage.setItem(STORAGE_KEYS.PROXY_BIDS, JSON.stringify(proxies));
      eventBus.publish('PROXY_BID_UPDATED', { itemId, maxCeiling });
      return true;
    } catch (e) {
      return false;
    }
  }

  getNotifications() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  addNotification(title, message, type = 'info') {
    try {
      const notifs = this.getNotifications();
      const newNotif = {
        id: `notif-${Date.now()}`,
        title,
        message,
        type,
        time: 'Vừa xong',
        read: false
      };
      notifs.unshift(newNotif);
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs.slice(0, 30)));
      eventBus.publish('NOTIFICATION_ADDED', newNotif);
      return newNotif;
    } catch (e) {
      return null;
    }
  }

  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  }

  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    document.documentElement.setAttribute('data-theme', theme);
    eventBus.publish('THEME_CHANGED', theme);
  }

  isSimulatorActive() {
    return localStorage.getItem(STORAGE_KEYS.SIMULATOR) === 'true';
  }

  setSimulatorActive(active) {
    localStorage.setItem(STORAGE_KEYS.SIMULATOR, active ? 'true' : 'false');
    eventBus.publish('SIMULATOR_STATE_CHANGED', active);
  }

  isAudioMuted() {
    return localStorage.getItem(STORAGE_KEYS.AUDIO_MUTED) === 'true';
  }

  setAudioMuted(muted) {
    localStorage.setItem(STORAGE_KEYS.AUDIO_MUTED, muted ? 'true' : 'false');
    eventBus.publish('AUDIO_MUTED_CHANGED', muted);
  }

  resetToDefault() {
    localStorage.clear();
    this.initializeState();
    window.location.reload();
  }
}

const stateManager = new StateManager();
window.stateManager = stateManager;
