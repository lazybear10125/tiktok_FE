import { useState, useMemo } from 'react';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
   faClock,
   faXmark,
   faArrowTrendUp,
   faArrowTrendDown,
   faFire,
   faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';

import AccountItem from '~/components/AccountItem';
import { CATEGORIES, TRENDING_SEARCHES, SEARCH_SUGGESTIONS_DICTIONARY } from '~/data/trendingSearches';
import styles from './SearchPopper.module.scss';

const cx = classNames.bind(styles);

const normalizeStr = (str) =>
   (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

const highlightMatch = (text, query) => {
   if (!query || !query.trim()) return text;
   const q = query.trim();
   try {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
      return parts.map((part, index) =>
         part.toLowerCase() === q.toLowerCase() ? (
            <strong key={index}>{part}</strong>
         ) : (
            part
         )
      );
   } catch {
      return text;
   }
};

function SearchPopper({
   searchValue = '',
   recentSearches = [],
   accountResults = [],
   onSelectKeyword,
   onRemoveRecent,
   onClearRecent,
   onSelectAccount,
}) {
   const [selectedCategory, setSelectedCategory] = useState('All');

   const trimmedQuery = searchValue.trim();
   const isTyping = trimmedQuery.length > 0;

   // 1. Filtered Trending Searches based on category tab
   const filteredTrending = useMemo(() => {
      if (selectedCategory === 'All') {
         return TRENDING_SEARCHES.slice(0, 10);
      }
      return TRENDING_SEARCHES.filter((item) => item.category === selectedCategory).slice(0, 10);
   }, [selectedCategory]);

   // 2. Autocomplete Suggestions when user is typing
   const suggestions = useMemo(() => {
      if (!isTyping) return [];
      const qNorm = normalizeStr(trimmedQuery);

      // Collect all potential keywords
      const allPool = Array.from(
         new Set([
            ...SEARCH_SUGGESTIONS_DICTIONARY,
            ...TRENDING_SEARCHES.map((t) => t.keyword),
         ])
      );

      const matched = allPool.filter((kw) => {
         const kwNorm = normalizeStr(kw);
         return kwNorm.includes(qNorm);
      });

      // Prioritize startsWith, then shorter strings
      matched.sort((a, b) => {
         const aNorm = normalizeStr(a);
         const bNorm = normalizeStr(b);
         const aStarts = aNorm.startsWith(qNorm);
         const bStarts = bNorm.startsWith(qNorm);
         if (aStarts && !bStarts) return -1;
         if (!aStarts && bStarts) return 1;
         return a.length - b.length;
      });

      return matched.slice(0, 6);
   }, [trimmedQuery, isTyping]);

   return (
      <div className={cx('popper-container')} tabIndex="-1">
         {/* STATE 1: NOT TYPING -> SHOW RECENT SEARCHES + TRENDING SEARCHES */}
         {!isTyping && (
            <>
               {/* 1. RECENT SEARCHES */}
               {recentSearches.length > 0 && (
                  <div className={cx('recent-section')}>
                     <div className={cx('section-header')}>
                        <span className={cx('section-title')}>
                           <FontAwesomeIcon icon={faClock} />
                           Recent
                        </span>
                        <button
                           className={cx('clear-all-btn')}
                           onMouseDown={(e) => e.preventDefault()}
                           onClick={onClearRecent}
                        >
                           Clear all
                        </button>
                     </div>
                     <ul className={cx('recent-list')}>
                        {recentSearches.map((keyword, index) => (
                           <li
                              key={`${keyword}-${index}`}
                              className={cx('recent-item')}
                              onClick={() => onSelectKeyword(keyword)}
                           >
                              <div className={cx('recent-main')}>
                                 <FontAwesomeIcon icon={faClock} className={cx('clock-icon')} />
                                 <span className={cx('recent-text')}>{keyword}</span>
                              </div>
                              <button
                                 className={cx('delete-btn')}
                                 title="Remove"
                                 onMouseDown={(e) => e.preventDefault()}
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveRecent(keyword);
                                 }}
                              >
                                 <FontAwesomeIcon icon={faXmark} />
                              </button>
                           </li>
                        ))}
                     </ul>
                  </div>
               )}

               {/* 2. TRENDING SEARCHES */}
               <div className={cx('trending-section')}>
                  <div className={cx('section-header')}>
                     <span className={cx('section-title')}>
                        <FontAwesomeIcon icon={faFire} className={cx('section-icon')} />
                        Trending searches
                     </span>
                  </div>

                  {/* Category Filter Chips */}
                  <div className={cx('category-tabs')}>
                     {CATEGORIES.map((category) => (
                        <button
                           key={category}
                           className={cx('category-pill', {
                              active: selectedCategory === category,
                           })}
                           onMouseDown={(e) => e.preventDefault()}
                           onClick={() => setSelectedCategory(category)}
                        >
                           {category}
                        </button>
                     ))}
                  </div>

                  {/* Trending List */}
                  <ul className={cx('trending-list')}>
                     {filteredTrending.map((item) => (
                        <li
                           key={item.id}
                           className={cx('trending-item')}
                           onClick={() => onSelectKeyword(item.keyword)}
                        >
                           <div className={cx('trending-left')}>
                              <span
                                 className={cx('rank-badge', {
                                    'rank-1': item.rank === 1,
                                    'rank-2': item.rank === 2,
                                    'rank-3': item.rank === 3,
                                 })}
                              >
                                 {item.rank}
                              </span>
                              <span className={cx('trending-keyword')}>{item.keyword}</span>
                           </div>

                           <div className={cx('trending-right')}>
                              <span className={cx('search-volume')}>{item.searchVolume}</span>
                              <span
                                 className={cx('trend-badge', {
                                    up: item.trendDirection === 'up',
                                    down: item.trendDirection === 'down',
                                 })}
                              >
                                 <FontAwesomeIcon
                                    icon={
                                       item.trendDirection === 'up'
                                          ? faArrowTrendUp
                                          : faArrowTrendDown
                                    }
                                    className={cx('trend-icon')}
                                 />
                                 <span>{item.trendPercentage}</span>
                              </span>
                           </div>
                        </li>
                     ))}
                  </ul>
               </div>
            </>
         )}

         {/* STATE 2: TYPING -> SHOW SEARCH SUGGESTIONS + ACCOUNTS + SEE ALL */}
         {isTyping && (
            <>
               {/* Search Suggestions */}
               {suggestions.length > 0 && (
                  <div className={cx('suggestion-section')}>
                     {suggestions.map((suggestion, index) => (
                        <div
                           key={`${suggestion}-${index}`}
                           className={cx('suggestion-item')}
                           onClick={() => onSelectKeyword(suggestion)}
                        >
                           <FontAwesomeIcon icon={faMagnifyingGlass} className={cx('search-icon')} />
                           <span className={cx('suggestion-text')}>
                              {highlightMatch(suggestion, trimmedQuery)}
                           </span>
                        </div>
                     ))}
                  </div>
               )}

               {/* Accounts section if matching */}
               {accountResults.length > 0 && (
                  <div className={cx('accounts-section')}>
                     <h4 className={cx('accounts-title')}>Accounts</h4>
                     {accountResults.slice(0, 4).map((account) => (
                        <AccountItem
                           key={account.id}
                           data={account}
                           onClick={() => onSelectAccount && onSelectAccount(account)}
                        />
                     ))}
                  </div>
               )}

               {/* See all results for {query} */}
               <div
                  className={cx('see-all-results')}
                  onClick={() => onSelectKeyword(trimmedQuery)}
               >
                  <FontAwesomeIcon icon={faMagnifyingGlass} className={cx('search-icon')} />
                  <span>See all results for "{trimmedQuery}"</span>
               </div>
            </>
         )}
      </div>
   );
}

export default SearchPopper;
