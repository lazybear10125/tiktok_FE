import { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown, faHeart, faCommentDots, faShare } from '@fortawesome/free-solid-svg-icons';

import styles from './Feed.module.scss';

const cx = classNames.bind(styles);

const IMAGES = [
   'https://imgs.search.brave.com/Q3ViJP8Ql1W4YK1E7TYzI9TgwP2qlqiAQXdF1LkWetE/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMucGV4ZWxzLmNv/bS9waG90b3MvNzQ5/MjI5NS9wZXhlbHMt/cGhvdG8tNzQ5MjI5/NS5qcGVnP2NzPXRp/bnlzcmdiJmRwcj0x/Jnc9NTAw',
   'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
   'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=600&q=80',
   'https://imgs.search.brave.com/SdCdBxiFL2anQMUUTPR5-P4LAAZYcfgY2ZTG6MHZeI0/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5tYWduaWZpYy5j/b20vaW1hZ2VzL2hv/bWUvdG9vbHMvZ2Vu/ZXJhdGUtYW4taW1h/Z2Uud2VicA',
   'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=600&q=80',
   'https://imgs.search.brave.com/sbkshREKL5ppke8E2vtsqWicDAzMwgPnROCjPz3lVz8/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jaGlt/dmlldDM2MC5jb20v/d3AtY29udGVudC91/cGxvYWRzLzIwMjUv/MTIvdGlldS12aWVt/LTUuanBn',
   'https://imgs.search.brave.com/BRv5EbWjzUTOHBDNEPiWGB0_eUohu6kCMP6eQuKtPyA/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jaGlt/dmlldDM2MC5jb20v/d3AtY29udGVudC91/cGxvYWRzLzIwMjUv/MTIvdGlldS12aWVt/LWRhdS1waGEtdGh1/b25nLWtodW5nLTE1/LmpwZw',
   'https://imgs.search.brave.com/Rg_IgGKC2yn0ljMyo0d_q7HrPQJvefYPCoKz4Urzs64/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jaGlt/dmlldDM2MC5jb20v/d3AtY29udGVudC91/cGxvYWRzLzIwMjUv/MTIvdGlldS12aWVt/LWRhdS1waGEtdGh1/b25nLWtodW5nLTE3/LmpwZw',
   'https://imgs.search.brave.com/ugAezcgLFDdaZaUbC6bnX-GXYwe8fdFVySURhM3FI2s/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jaGlt/dmlldDM2MC5jb20v/d3AtY29udGVudC91/cGxvYWRzLzIwMjYv/MDEvYW5oLXZ1b25n/LWxhbS00ay0yOS0x/LmpwZw',
   'https://imgs.search.brave.com/pNAfgxEiXA0R3sfBtCERzLqH9-4lpm8CebiAEP3T1b8/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9ob2lj/aGltdHJvaS5jb20v/d3AtY29udGVudC91/cGxvYWRzLzIwMjUv/MDcvYW5oLXZ1b25n/LWxhbS0xNy5qcGc',
];

function Feed() {
   const [currentIndex, setCurrentIndex] = useState(0);
   const [likedList, setLikedList] = useState({});

   const isLiked = !!likedList[currentIndex];

   const handleToggleLike = () => {
      setLikedList((prev) => ({
         ...prev,
         [currentIndex]: !prev[currentIndex],
      }));
   };

   const handlePrev = () => {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : IMAGES.length - 1));
   };

   const handleNext = () => {
      setCurrentIndex((prev) => (prev < IMAGES.length - 1 ? prev + 1 : 0));
   };

   // Hỗ trợ phím mũi tên Lên / Xuống để chuyển ảnh
   useEffect(() => {
      const handleKeyDown = (e) => {
         if (e.key === 'ArrowDown') {
            setCurrentIndex((prev) => (prev < IMAGES.length - 1 ? prev + 1 : 0));
         } else if (e.key === 'ArrowUp') {
            setCurrentIndex((prev) => (prev > 0 ? prev - 1 : IMAGES.length - 1));
         }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
         window.removeEventListener('keydown', handleKeyDown);
      };
   }, []);

   return (
      <div className={cx('wrapper')}>
         <div className={cx('container')}>
            <div className={cx('image-frame')}>
               <img src={IMAGES[currentIndex]} alt="TikTok" className={cx('image')} />

               <div className={cx('action-icons')}>
                  <button className={cx('action-btn', { active: isLiked })} onClick={handleToggleLike} title="Thả tim">
                     <FontAwesomeIcon icon={faHeart} />
                  </button>

                  <button className={cx('action-btn')} title="Bình luận">
                     <FontAwesomeIcon icon={faCommentDots} />
                  </button>

                  <button className={cx('action-btn')} title="Chia sẻ">
                     <FontAwesomeIcon icon={faShare} />
                  </button>
               </div>
            </div>

            <div className={cx('navigation')}>
               <button className={cx('nav-btn')} onClick={handlePrev} title="Lên">
                  <FontAwesomeIcon icon={faChevronUp} />
               </button>
               <button className={cx('nav-btn')} onClick={handleNext} title="Xuống">
                  <FontAwesomeIcon icon={faChevronDown} />
               </button>
            </div>
         </div>
      </div>
   );
}

export default Feed;
