import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCheck, faCircleQuestion } from '@fortawesome/free-solid-svg-icons';

import Image from '~/components/Image';
import Button from '~/components/Button';
import { useAuth } from '~/context/AuthContext';
import * as searchServices from '~/services/searchService';
import * as userServices from '~/services/userService';
import { saveSearchHistory } from '~/utils/searchHistory';
import styles from './Search.module.scss';

const cx = classNames.bind(styles);

const normalizeStr = (str) =>
   (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

const rankSearchResults = (results, query) => {
   if (!query || !results?.length) return results || [];
   const q = normalizeStr(query.trim());

   return [...results].sort((a, b) => {
      const nickA = normalizeStr(a.nickname);
      const nickB = normalizeStr(b.nickname);
      const nameA = normalizeStr(a.full_name);
      const nameB = normalizeStr(b.full_name);

      const getScore = (nick, name) => {
         if (nick.startsWith(q)) return 5;
         if (name.startsWith(q)) return 4;
         const words = name.split(/\s+/);
         if (words.some((w) => w.startsWith(q))) return 3;
         if (nick.includes(q)) return 2;
         if (name.includes(q)) return 1;
         return 0;
      };

      const scoreA = getScore(nickA, nameA);
      const scoreB = getScore(nickB, nameB);

      if (scoreA !== scoreB) {
         return scoreB - scoreA;
      }
      return 0;
   });
};

const formatFollowers = (count) => {
   if (typeof count === 'number') {
      if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
      if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
      return count;
   }
   return count || '0';
};

function Search() {
   const [searchParams] = useSearchParams();
   const query = searchParams.get('q') || '';
   const { currentUser, openLoginModal } = useAuth();

   const [activeTab, setActiveTab] = useState('accounts');
   const [results, setResults] = useState([]);
   const [loading, setLoading] = useState(true);
   const [followingMap, setFollowingMap] = useState({});

   // Reset follow states on auth-logout
   useEffect(() => {
      const handleLogout = () => {
         setFollowingMap({});
      };
      window.addEventListener('auth-logout', handleLogout);
      return () => window.removeEventListener('auth-logout', handleLogout);
   }, []);

   useEffect(() => {
      let isMounted = true;
      if (!query.trim()) {
         setResults([]);
         setLoading(false);
         return;
      }

      if (currentUser) {
         saveSearchHistory(query);
      }

      setLoading(true);
      searchServices
         .search(query, 'more')
         .then((data) => {
            if (!isMounted) return;
            const sorted = rankSearchResults(data || [], query);
            setResults(sorted);

            const initialMap = {};
            sorted.forEach((u) => {
               initialMap[u.id] = !!u.is_followed;
            });
            setFollowingMap(initialMap);
         })
         .catch((err) => {
            console.error('Search page fetch error:', err);
            if (isMounted) setResults([]);
         })
         .finally(() => {
            if (isMounted) setLoading(false);
         });

      return () => {
         isMounted = false;
      };
   }, [query, currentUser]);

   const handleToggleFollow = async (user) => {
      if (!currentUser) {
         openLoginModal();
         return;
      }

      const isFollowed = !!followingMap[user.id];
      setFollowingMap((prev) => ({
         ...prev,
         [user.id]: !isFollowed,
      }));

      try {
         if (isFollowed) {
            await userServices.unfollowUser(user.nickname);
         } else {
            await userServices.followUser(user.nickname);
         }
      } catch (err) {
         console.error('Toggle follow failed:', err);
         setFollowingMap((prev) => ({
            ...prev,
            [user.id]: isFollowed,
         }));
      }
   };

   return (
      <div className={cx('wrapper')}>
         {/* Tabs */}
         <div className={cx('tabs-container')}>
            <button
               className={cx('tab-btn', { active: activeTab === 'top' })}
               onClick={() => setActiveTab('top')}
            >
               Top
            </button>
            <button
               className={cx('tab-btn', { active: activeTab === 'accounts' })}
               onClick={() => setActiveTab('accounts')}
            >
               Accounts
            </button>
            <button
               className={cx('tab-btn', { active: activeTab === 'videos' })}
               onClick={() => setActiveTab('videos')}
            >
               Videos
            </button>
         </div>

         {/* Loading Skeleton */}
         {loading && (
            <div className={cx('account-list')}>
               {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className={cx('skeleton-card')}>
                     <div className={cx('skeleton-avatar')} />
                     <div className={cx('skeleton-info')}>
                        <div className={cx('skeleton-text', 'large')} />
                        <div className={cx('skeleton-text', 'medium')} />
                        <div className={cx('skeleton-text', 'small')} />
                     </div>
                     <div className={cx('skeleton-btn')} />
                  </div>
               ))}
            </div>
         )}

         {/* Empty State */}
         {!loading && results.length === 0 && (
            <div className={cx('not-found')}>
               <div className={cx('not-found-icon')}>
                  <FontAwesomeIcon icon={faCircleQuestion} />
               </div>
               <h3 className={cx('not-found-title')}>
                  {query ? `No results found for "${query}"` : 'Type something to search'}
               </h3>
               <p className={cx('not-found-desc')}>
                  Check your spelling or try searching for another creator, keyword, or hashtag.
               </p>
            </div>
         )}

         {/* Results List */}
         {!loading && results.length > 0 && (
            <>
               <div className={cx('result-count')}>
                  Found {results.length} accounts for "{query}"
               </div>
               <div className={cx('account-list')}>
                  {results.map((user) => {
                     const isFollowed = !!currentUser && !!followingMap[user.id];
                     return (
                        <div key={user.id} className={cx('account-card')}>
                           <Link to={`/@${user.nickname}`} className={cx('account-main')}>
                              <div className={cx('avatar-wrapper')}>
                                 <Image
                                    className={cx('avatar')}
                                    src={user.avatar}
                                    alt={user.nickname}
                                 />
                              </div>

                              <div className={cx('account-info')}>
                                 <div className={cx('nickname-row')}>
                                    <h4 className={cx('nickname')}>{user.nickname}</h4>
                                    {user.tick && (
                                       <FontAwesomeIcon className={cx('check')} icon={faCircleCheck} />
                                    )}
                                 </div>
                                 <div className={cx('name-row')}>
                                    <span className={cx('name')}>
                                       {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}
                                    </span>
                                    {user.followers_count !== undefined && (
                                       <span className={cx('followers')}>
                                          {formatFollowers(user.followers_count)} Followers
                                       </span>
                                    )}
                                 </div>
                                 {user.bio && <p className={cx('bio')}>{user.bio}</p>}
                              </div>
                           </Link>

                           <div>
                              {isFollowed ? (
                                 <button
                                    className={cx('following-btn')}
                                    onClick={() => handleToggleFollow(user)}
                                 >
                                    <FontAwesomeIcon icon={faCheck} />
                                    <span>Following</span>
                                 </button>
                              ) : (
                                 <Button
                                    primary
                                    className={cx('follow-btn')}
                                    onClick={() => handleToggleFollow(user)}
                                 >
                                    Follow
                                 </Button>
                              )}
                           </div>
                        </div>
                     );
                  })}
               </div>
            </>
         )}
      </div>
   );
}

export default Search;