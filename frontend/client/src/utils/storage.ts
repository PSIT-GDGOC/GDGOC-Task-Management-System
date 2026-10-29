/** Optional preferences must never break a server-confirmed sign-in. */
function safeStorage(kind: 'localStorage' | 'sessionStorage') {
  return {
    getItem(key: string) {
      try {
        return window[kind].getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key: string, value: string) {
      try {
        window[kind].setItem(key, value);
      } catch {
        /* Storage is optional. */
      }
    },
    removeItem(key: string) {
      try {
        window[kind].removeItem(key);
      } catch {
        /* Storage is optional. */
      }
    },
  };
}
export const localPreferences = safeStorage('localStorage');
export const sessionPreferences = safeStorage('sessionStorage');
