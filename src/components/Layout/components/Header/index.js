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
} from '@fortawesome/free-solid-svg-icons';
import HeadlessTippy from '@tippyjs/react/headless';

import Button from '~/components/Button';
import { useDebounce } from '~/hooks';
import styles from './Header.module.scss';
import images from '~/assets/images';
import { Wrapper as PopperWrapper, Menu } from '~/components/Popper';
import AccountItem from '~/components/AccountItem';

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

      setLoading(true);
      const timer = setTimeout(() => {
         setSearchResult([
            {
               id: 1,
               full_name: 'Đào Lê Phương Hoa',
               nickname: 'hoaa.hanassii',
               avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
               tick: true,
            },
            {
               id: 2,
               full_name: 'Nguyễn Văn Bear',
               nickname: 'nguyenvanbear',
               avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
               tick: false,
            },
            {
               id: 3,
               full_name: 'Lê Thị C',
               nickname: 'lethic',
               avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
               tick: true,
            },
         ]);
         setLoading(false);
      }, 500);

      return () => clearTimeout(timer);
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
               <Button text>Upload</Button>
               <Button primary>Log in</Button>

               <Menu items={MENU_ITEMS} onChange={handleMenuChange}>
                  <button className={cx('more-btn')}>
                     <FontAwesomeIcon icon={faEllipsisVertical} />
                  </button>
               </Menu>
            </div>
         </div>
      </header>
   );
}

export default Header;
