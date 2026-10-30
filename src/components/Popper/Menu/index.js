import { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import Tippy from '@tippyjs/react/headless';

import { Wrapper as PopperWrapper } from '~/components/Popper';
import MenuItem from './MenuItem';
import Header from './Header';
import styles from './Menu.module.scss';

const cx = classNames.bind(styles);

const defaultFn = () => {};

function Menu({ children, items = [], onChange = defaultFn }) {
   const [history, setHistory] = useState([{ data: items }]);
   const current = history[history.length - 1];

   useEffect(() => {
      setHistory([{ data: items }]);
   }, [items]);

   const renderItems = () => {
      return current.data.map((item, index) => {
         const isParent = !!item.children;

         return (
            <MenuItem
               key={index}
               data={item}
               onClick={() => {
                  if (isParent) {
                     setHistory((prev) => [...prev, item.children]);
                  } else {
                     onChange(item);
                  }
               }}
            />
         );
      });
   };

   const handleBack = () => {
      setHistory((prev) => prev.slice(0, prev.length - 1));
   };

   const handleResetToFirstPage = () => {
      setHistory((prev) => prev.slice(0, 1));
   };

   return (
      <Tippy
         interactive
         delay={[0, 50]}
         offset={[12, 8]}
         placement="bottom-end"
         render={(attrs) => (
            <div className={cx('menu-list')} tabIndex="-1" {...attrs}>
               <PopperWrapper className={cx('menu-popper')}>
                  {history.length > 1 && <Header title={current.title} onBack={handleBack} />}
                  <div className={cx('menu-body')}>{renderItems()}</div>
               </PopperWrapper>
            </div>
         )}
         onHide={handleResetToFirstPage}
      >
         {children}
      </Tippy>
   );
}

export default Menu;
