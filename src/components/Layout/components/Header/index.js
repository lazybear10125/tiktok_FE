import { useState, useRef, useEffect } from 'react';
import classNames from 'classnames/bind';
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

import { UploadIcon, MessageIcon, InboxIcon } from '~/components/Icons';

import Button from '~/components/Button';
import { useDebounce } from '~/hooks';
import styles from './Header.module.scss';
import images from '~/assets/images';
import { Wrapper as PopperWrapper, Menu } from '~/components/Popper';
import AccountItem from '~/components/AccountItem';
import { useAuth } from '~/context/AuthContext';
import * as searchServices from '~/services/searchService';

const cx = classNames.bind(styles);

const MENU_ITEMS = [
   {
      icon: <FontAwesomeIcon icon={faLanguage} />,
      title: 'English',
      children: {
         title: 'Language',
         data: [
            {
               type: 'language',
               code: 'en',
               title: 'English',
            },
            {
               type: 'language',
               code: 'vi',
               title: 'Tiếng Việt',
            },
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
   },
];

function Header() {
   const { currentUser, login, logout } = useAuth();

   const userMenu = [
      {
         icon: <FontAwesomeIcon icon={faUser} />,
         title: 'View profile',
         to: '/@hoaa',
      },
      {
         icon: <FontAwesomeIcon icon={faCoins} />,
         title: 'Get coins',
         to: '/coin',
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
         to: '/logout',
         separate: true,
      },
   ];

   const [searchValue, setSearchValue] = useState('');
   const [searchResult, setSearchResult] = useState([]);
   const [showResult, setShowResult] = useState(true);
   const [loading, setLoading] = useState(false);

   const debouncedValue = useDebounce(searchValue, 500);

   const inputRef = useRef();

   useEffect(() => {
      if (!debouncedValue.trim()) {
         setSearchResult([]);
         return;
      }

      const fetchApi = async () => {
         setLoading(true);
         const result = await searchServices.search(debouncedValue);
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

   return (
      <header className={cx('wrapper')}>
         <div className={cx('inner')}>
            <div className={cx('logo')}>
               <img src={images.logo} alt="TikTok" />
            </div>

            <HeadlessTippy
               interactive
               visible={showResult && searchResult.length > 0}
               render={(attrs) => (
                  <div className={cx('search-result')} tabIndex="-1" {...attrs}>
                     <PopperWrapper>
                        <h4 className={cx('search-title')}>Accounts</h4>
                        {searchResult.map((result) => (
                           <AccountItem key={result.id} data={result} />
                        ))}
                     </PopperWrapper>
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
                     onFocus={() => setShowResult(true)}
                  />
                  {!!searchValue && !loading && (
                     <button className={cx('clear')} onMouseDown={(e) => e.preventDefault()} onClick={handleClear}>
                        <FontAwesomeIcon icon={faCircleXmark} />
                     </button>
                  )}
                  {loading && <FontAwesomeIcon className={cx('loading')} icon={faSpinner} />}

                  <button className={cx('search-btn')}>
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
                     <Tippy delay={[0, 50]} content="Inbox" placement="bottom">
                        <button className={cx('action-btn')}>
                           <InboxIcon />
                           <span className={cx('badge')}>99+</span>
                        </button>
                     </Tippy>
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
                        <img
                           className={cx('user-avatar')}
                           src="https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=100&h=100&crop=faces&q=80"
                           alt="Bear"
                           // Set key để thay đổi menu khi currentUser thay đổi,
                           // Ví dụ khi đăng xuất và đăng nhập lại
                           key={currentUser ? 'user' : 'guest'}
                           items={currentUser ? userMenu : MENU_ITEMS}
                           onChange={handleMenuChange}
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
