import { useState } from 'react';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';

import styles from './Feed.module.scss';

const cx = classNames.bind(styles);

const IMAGES = [
   'https://imgs.search.brave.com/Q3ViJP8Ql1W4YK1E7TYzI9TgwP2qlqiAQXdF1LkWetE/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMucGV4ZWxzLmNv/bS9waG90b3MvNzQ5/MjI5NS9wZXhlbHMt/cGhvdG8tNzQ5MjI5/NS5qcGVnP2NzPXRp/bnlzcmdiJmRwcj0x/Jnc9NTAw',
   'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
   'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=600&q=80',
];

function Feed() {
   const [currentIndex, setCurrentIndex] = useState(0);

   const handlePrev = () => {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : IMAGES.length - 1));
   };

   const handleNext = () => {
      setCurrentIndex((prev) => (prev < IMAGES.length - 1 ? prev + 1 : 0));
   };

   return (
      <div className={cx('wrapper')}>
         <div className={cx('container')}>
            {/* IMG */}
            <div className={cx('image-frame')}>
               <img src={IMAGES[currentIndex]} alt="TikTok" className={cx('image')} />
            </div>

            {/*icon Up Down */}
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
