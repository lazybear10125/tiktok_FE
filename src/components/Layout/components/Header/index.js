import { useState, useRef, useEffect } from 'react';
import classNames from 'classnames/bind';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
   faCircleXmark,
   faSpinner,
   faMagnifyingGlass,
   faEllipsisVertical,
   faLanguage,
   faCircleQuestion,
   faKeyboard,
   faUser,
   faCoins,
   faGear,
   faSignOut,
} from '@fortawesome/free-solid-svg-icons';
import Tippy from '@tippyjs/react';
import HeadlessTippy from '@tippyjs/react/headless';
import 'tippy.js/dist/tippy.css';

import { UploadIcon, MessageIcon } from '~/components/Icons';
import Button from '~/components/Button';
import Image from '~/components/Image';
import { useDebounce } from '~/hooks';
import styles from './Header.module.scss';
import images from '~/assets/images';
import config from '~/config';
import { Wrapper as PopperWrapper, Menu } from '~/components/Popper';
import AccountItem from '~/components/AccountItem';
import { useAuth } from '~/context/AuthContext';
import * as searchServices from '~/services/searchService';
import Inbox from './Inbox';
import SearchPopper from './SearchPopper';
import {
   getSearchHistory,
   saveSearchHistory,
   removeSearchHistoryItem,
   clearSearchHistory,
} from '~/utils/searchHistory';

const cx = classNames.bind(styles);

const MENU_ITEMS = [
   {
      icon: <FontAwesomeIcon icon={faLanguage} />,
      title: 'English',
      children: {
         title: 'Language',
         data: [
            { type: 'language', code: 'en', title: 'English' },
            { type: 'language', code: 'vi', title: 'Tiếng Việt' },
            { type: 'language', code: 'es', title: 'Español' },
            { type: 'language', code: 'fr', title: 'Français' },
            { type: 'language', code: 'de', title: 'Deutsch' },
            { type: 'language', code: 'ja', title: '日本語' },
            { type: 'language', code: 'ko', title: '한국어' },
            { type: 'language', code: 'zh', title: '简体中文' },
            { type: 'language', code: 'th', title: 'ไทย' },
            { type: 'language', code: 'id', title: 'Bahasa Indonesia' },
            { type: 'language', code: 'en', title: 'English' },
            { type: 'language', code: 'vi', title: 'Tiếng Việt' },
            { type: 'language', code: 'es', title: 'Español' },
            { type: 'language', code: 'fr', title: 'Français' },
            { type: 'language', code: 'de', title: 'Deutsch' },
            { type: 'language', code: 'ja', title: '日本語' },
            { type: 'language', code: 'ko', title: '한국어' },
            { type: 'language', code: 'zh', title: '简体中文' },
            { type: 'language', code: 'th', title: 'ไทย' },
            { type: 'language', code: 'id', title: 'Bahasa Indonesia' },
         ],
      },
   },
   {
      icon: <FontAwesomeIcon icon={faCircleQuestion} />,
      title: 'Feedback and help',
      to: '/feedback',
   },
   {
      icon: <FontAwesomeIcon icon={faKeyboard} />,
      title: 'Keyboard shortcuts',
      to: '/shortcuts',
   },
];

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

function Header() {
   const { currentUser, login, logout } = useAuth();
   const navigate = useNavigate();

   const userMenu = [
      {
         icon: <FontAwesomeIcon icon={faUser} />,
         title: 'View profile',
         to: currentUser?.nickname ? `/@${currentUser.nickname}` : '/@bear',
      },
      {
         icon: <FontAwesomeIcon icon={faCoins} />,
         title: 'Get coins',
         to: '/coins',
      },
      {
         icon: <FontAwesomeIcon icon={faGear} />,
         title: 'Settings',
         to: '/settings',
      },
      ...MENU_ITEMS,
      {
         icon: <FontAwesomeIcon icon={faSignOut} />,
         title: 'Log out',
         separate: true,
      },
   ];
   const [searchValue, setSearchValue] = useState('');
   const [searchResult, setSearchResult] = useState([]);
   const [showResult, setShowResult] = useState(false);
   const [recentSearches, setRecentSearches] = useState([]);
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      setRecentSearches(getSearchHistory());
   }, []);

   const handleSelectKeyword = (keyword) => {
      if (!keyword || !keyword.trim()) return;
      const trimmed = keyword.trim();
      const updated = saveSearchHistory(trimmed);
      setRecentSearches(updated);
      setSearchValue(trimmed);
      setShowResult(false);
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
   };

   const handleRemoveRecent = (keyword) => {
      const updated = removeSearchHistoryItem(keyword);
      setRecentSearches(updated);
   };

   const handleClearRecent = () => {
      const updated = clearSearchHistory();
      setRecentSearches(updated);
   };

   const debouncedValue = useDebounce(searchValue, 600);

   const inputRef = useRef();

   useEffect(() => {
      if (!debouncedValue.trim()) {
         setSearchResult([]);
         return;
      }

      const fetchApi = async () => {
         setLoading(true);
         const result = await searchServices.search(debouncedValue, 'more');
         setSearchResult(result || []);
         setLoading(false);
      };

      fetchApi();
   }, [debouncedValue]);

   const handleChange = (e) => {
      const value = e.target.value;
      if (!value.startsWith(' ')) {
         setSearchValue(value);
      }
   };

   const handleClear = () => {
      setSearchValue('');
      setSearchResult([]);
      inputRef.current.focus();
   };

   const handleHideResult = () => {
      setShowResult(false);
   };

   const handleSearchSubmit = (e) => {
      e?.preventDefault();
      const trimmed = searchValue.trim();
      if (trimmed) {
         setShowResult(false);
         navigate(`/search?q=${encodeURIComponent(trimmed)}`);
      }
   };

   const handleMenuChange = (menuItem) => {
      switch (menuItem.type) {
         case 'language':
            break;
         default:
            if (menuItem.title === 'Log out') {
               logout();
            }
            break;
      }
   };

   const sortedResults = rankSearchResults(searchResult, debouncedValue);
   const visibleResults = sortedResults.slice(0, 5);

   return (
      <header className={cx('wrapper')}>
         <div className={cx('inner')}>
            <Link to={currentUser ? config.routes.feed : config.routes.home} className={cx('logo-link')}>
               <img src={images.logo} alt="TikTok" />
            </Link>

            <HeadlessTippy
               interactive
               visible={showResult}
               placement="bottom-start"
               render={(attrs) => (
                  <div className={cx('search-result')} tabIndex="-1" {...attrs}>
                     <SearchPopper
                        searchValue={searchValue}
                        recentSearches={recentSearches}
                        accountResults={visibleResults}
                        onSelectKeyword={handleSelectKeyword}
                        onRemoveRecent={handleRemoveRecent}
                        onClearRecent={handleClearRecent}
                        onSelectAccount={() => setShowResult(false)}
                     />
                  </div>
               )}
               onClickOutside={handleHideResult}
            >
               <div className={cx('search')}>
                  <input
                     ref={inputRef}
                     value={searchValue}
                     placeholder="Search accounts and videos"
                     spellCheck={false}
                     onChange={handleChange}
                     onFocus={() => {
                        setShowResult(true);
                        setRecentSearches(getSearchHistory());
                     }}
                     onClick={() => setShowResult(true)}
                     onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                           handleSearchSubmit(e);
                        }
                     }}
                  />
                  {!!searchValue && !loading && (
                     <button className={cx('clear')} onMouseDown={(e) => e.preventDefault()} onClick={handleClear}>
                        <FontAwesomeIcon icon={faCircleXmark} />
                     </button>
                  )}
                  {loading && <FontAwesomeIcon className={cx('loading')} icon={faSpinner} />}

                  <button className={cx('search-btn')} onClick={handleSearchSubmit}>
                     <FontAwesomeIcon icon={faMagnifyingGlass} />
                  </button>
               </div>
            </HeadlessTippy>

            <div className={cx('actions')}>
               {currentUser ? (
                  <>
                     <Tippy delay={[0, 50]} content="Upload video" placement="bottom">
                        <button className={cx('action-btn')}>
                           <UploadIcon />
                        </button>
                     </Tippy>
                     <Tippy delay={[0, 50]} content="Message" placement="bottom">
                        <button className={cx('action-btn')}>
                           <MessageIcon />
                        </button>
                     </Tippy>
                     <Inbox />
                  </>
               ) : (
                  <>
                     <Button text>Upload</Button>
                     <Button primary onClick={login}>
                        Log in
                     </Button>
                  </>
               )}

               <Menu items={currentUser ? userMenu : MENU_ITEMS} onChange={handleMenuChange}>
                  {currentUser ? (
                     <button className={cx('action-btn')}>
                        <Image
                           className={cx('user-avatar')}
                           src={
                              currentUser?.nickname === 'bear' || !currentUser?.avatar
                                 ? 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=100&h=100&crop=faces&q=80'
                                 : currentUser.avatar
                           }
                           alt={currentUser?.full_name || 'Bear'}
                           fallback={images.noImage}
                        />
                     </button>
                  ) : (
                     <button className={cx('more-btn')}>
                        <FontAwesomeIcon icon={faEllipsisVertical} />
                     </button>
                  )}
               </Menu>
            </div>
         </div>
      </header>
   );
}

export default Header;
