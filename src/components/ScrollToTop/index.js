import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp } from '@fortawesome/free-solid-svg-icons';
import styles from './ScrollToTop.module.scss';

const cx = classNames.bind(styles);

// Tự động cuộn mượt lên đầu trang khi chuyển Route
export function ScrollToTopOnRouteChange() {
   const { pathname } = useLocation();

   useEffect(() => {
      window.scrollTo({
         top: 0,
         left: 0,
         behavior: 'smooth',
      });
   }, [pathname]);

   return null;
}

// Nút cuộn lên đầu trang (Floating Scroll to top button)
export function ScrollToTopButton() {
   const [visible, setVisible] = useState(false);

   useEffect(() => {
      const handleScroll = () => {
         if (window.scrollY > 300) {
            setVisible(true);
         } else {
            setVisible(false);
         }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
         window.removeEventListener('scroll', handleScroll);
      };
   }, []);

   const scrollToTop = () => {
      window.scrollTo({
         top: 0,
         left: 0,
         behavior: 'smooth',
      });
   };

   return (
      <button
         type="button"
         className={cx('scroll-top-btn', { visible })}
         onClick={scrollToTop}
         title="Cuộn lên đầu trang"
         aria-label="Scroll to top"
      >
         <FontAwesomeIcon icon={faChevronUp} />
      </button>
   );
}

export default ScrollToTopButton;
