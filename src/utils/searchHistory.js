const SEARCH_HISTORY_KEY = 'tiktok_search_history';
const MAX_HISTORY_ITEMS = 10;

/**
 * Retrieve search history array from localStorage
 * @returns {string[]} array of keyword strings
 */
export const getSearchHistory = () => {
   try {
      const data = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY_ITEMS) : [];
   } catch (error) {
      console.error('Failed to get search history:', error);
      return [];
   }
};

/**
 * Save keyword into search history (dedup, move to top, max 10)
 * @param {string} keyword
 * @returns {string[]} updated history array
 */
export const saveSearchHistory = (keyword) => {
   if (!keyword || typeof keyword !== 'string') return getSearchHistory();
   const trimmed = keyword.trim();
   if (!trimmed) return getSearchHistory();

   try {
      const current = getSearchHistory();
      // Remove any existing case-insensitive duplicate
      const filtered = current.filter(
         (item) => item.toLowerCase() !== trimmed.toLowerCase()
      );
      // Prepend newest to top
      const updated = [trimmed, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      return updated;
   } catch (error) {
      console.error('Failed to save search history:', error);
      return [];
   }
};

/**
 * Remove a single keyword from search history
 * @param {string} keyword
 * @returns {string[]} updated history array
 */
export const removeSearchHistoryItem = (keyword) => {
   try {
      const current = getSearchHistory();
      const updated = current.filter(
         (item) => item.toLowerCase() !== keyword.toLowerCase()
      );
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      return updated;
   } catch (error) {
      console.error('Failed to remove search history item:', error);
      return [];
   }
};

/**
 * Clear all search history
 */
export const clearSearchHistory = () => {
   try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
      return [];
   } catch (error) {
      console.error('Failed to clear search history:', error);
      return [];
   }
};
