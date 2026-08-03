export const storageService = {
  getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === "undefined") return defaultValue;
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : defaultValue;
    } catch (e) {
      console.warn("Storage error for key:", key, e);
      return defaultValue;
    }
  },

  setItem<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("Storage save error for key:", key, e);
    }
  },

  removeItem(key: string): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn("Storage remove error for key:", key, e);
    }
  }
};
