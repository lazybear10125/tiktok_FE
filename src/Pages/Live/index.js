import { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
   faChevronUp,
   faChevronDown,
   faHeart,
   faCommentDots,
   faShare,
   faCircleCheck,
   faEye,
} from '@fortawesome/free-solid-svg-icons';

import styles from './Live.module.scss';
import Image from '~/components/Image';
import images from '~/assets/images';

const cx = classNames.bind(styles);

const LIVE_STREAMS = [
   {
      id: 1,
      streamer: {
         nickname: 'mixigaming',
         full_name: 'Độ Phùng (Độ Mixi)',
         avatar: 'https://tiktok-api-pq2d.onrender.com/avatars/domixi.jpg',
         tick: true,
      },
      image: 'https://imgs.search.brave.com/pmsWWlSCPBTXODM6achCY7XTsNBsPW0u17MLoTMhj2U/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jaGlt/dmlldDM2MC5jb20v/d3AtY29udGVudC91/cGxvYWRzLzIwMjYv/MDIvYW5oLWRvLW1p/eGktMTIuanBn',
      title: 'Giao lưu tâm sự cùng anh em Bộ Tộc MixiGaming đêm muộn!',
      viewers: '119.4K',
   },
   {
      id: 2,
      streamer: {
         nickname: 'hoahanassii',
         full_name: 'Đào Lê Phương Hoa',
         avatar:
            'https://imgs.search.brave.com/blZB4VBWoKOlYRplFFaj5iDXMe2XMqgFFCI8SToli8U/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jZG4u/a2llbnRodWMubmV0/LnZuL2ltYWdlcy9j/NDczZDNlMDVlYjA3/MWFkYzIwOWViNGNm/ZmVmNzMzYzUzNTQ4/NGU4ODIwYzU5NmIy/MWFiMjA3OWQzZTgw/MGI0ZjA3NDEzN2E2/NmU2OTU4MGJkMjlm/MzRkZTc1M2JjNDdj/ZTZmNjljY2I2YWYz/ZmVmMWEzMjA3MGFh/NzRmZjYzNTBiMmJl/NTZlMzY3YzM0OGJk/NjZlNDYwOTIzMmJl/MTI3MmRjOTU2ZTdj/MGIxYTUwYjM3MzVl/ZDQxNmY5N2U5YjVj/YThkMGI4YzMzYzJj/NDRlMmYwY2UwZWJm/ZjNhMDc2ZS92by1x/dW9jLWRhbi1kYW8t/bGUtcGh1b25nLWhv/YS1iYXQtbmdvLWxh/bS1kYW0tY3VvaS1I/aW5oLTguSlBH',
         tick: true,
      },
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
      title: 'Live trò chuyện & luyện dance cùng mọi người ',
      viewers: '18.9K',
   },
   {
      id: 3,
      streamer: {
         nickname: 'hieuthuhai',
         full_name: 'HIEUTHUHAI',
         avatar: 'https://tiktok-api-pq2d.onrender.com/avatars/hieuthuhai.jpg',
         tick: true,
      },
      image: 'https://imgs.search.brave.com/KPAnh_MoSS0C3TkMoN4oSn_N_xKzRdgWx97-wHiJq7c/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly92Y2Ru/MS1naWFpdHJpLnZu/ZWNkbi5uZXQvMjAy/NC8xMi8xNC9ob3pv/LTEtaGlldS10aHUt/Mi0xNzM0MTQyNTQ3/LmpwZz93PTUwMCZo/PTMwMCZxPTEwMCZk/cHI9MSZmaXQ9Y3Jv/cCZzPWhSZnZNbXFn/V2RsRW4xckxHWXV1/a2c',
      title: 'Hậu trường chuẩn bị concert mới & hát tặng fan ',
      viewers: '42.1K',
   },
   {
      id: 4,
      streamer: {
         nickname: 'sondn',
         full_name: 'Đặng Ngọc Sơn (Sơn Đặng)',
         avatar: 'https://files.fullstack.edu.vn/f8-prod/organization-logos/694743c405102.png',
         tick: true,
      },
      image: 'https://imgs.search.brave.com/r0PUZRQpGQjl_2sO3qMWu194ppEf1IQaCrTsdEx1Etk/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pLnl0/aW1nLmNvbS92aS9J/RjFkZDNLVjg0dy9o/cWRlZmF1bHQuanBn',
      title: 'Q&A: Lộ trình trở thành Frontend Dev 2026 cùng F8!',
      viewers: '12.8K',
   },
];

function Live() {
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
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : LIVE_STREAMS.length - 1));
   };

   const handleNext = () => {
      setCurrentIndex((prev) => (prev < LIVE_STREAMS.length - 1 ? prev + 1 : 0));
   };

   // Hỗ trợ phím mũi tên Lên / Xuống để chuyển stream LIVE (ngăn chặn cuộn sidebar mặc định)
   useEffect(() => {
      const handleKeyDown = (e) => {
         if (e.key === 'ArrowDown') {
            e.preventDefault();
            setCurrentIndex((prev) => (prev < LIVE_STREAMS.length - 1 ? prev + 1 : 0));
         } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setCurrentIndex((prev) => (prev > 0 ? prev - 1 : LIVE_STREAMS.length - 1));
         }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
         window.removeEventListener('keydown', handleKeyDown);
      };
   }, []);

   const currentLive = LIVE_STREAMS[currentIndex];
   const streamer = currentLive.streamer;

   return (
      <div className={cx('wrapper')}>
         <div className={cx('container')}>
            <div className={cx('live-frame')}>
               <Image
                  src={currentLive.image}
                  alt={streamer.full_name}
                  className={cx('live-stream')}
                  fallback={images.noImage}
               />

               <div className={cx('live-badge')}>
                  <span className={cx('live-dot')}></span>
                  <span>LIVE</span>
               </div>

               <div className={cx('viewer-count')}>
                  <FontAwesomeIcon icon={faEye} style={{ fontSize: '1.1rem' }} />
                  <span>{currentLive.viewers}</span>
               </div>

               <div className={cx('overlay-info')}>
                  <div className={cx('streamer-info')}>
                     <Image
                        src={streamer.avatar}
                        alt={streamer.nickname}
                        className={cx('streamer-avatar')}
                        fallback={images.noImage}
                     />
                     <div className={cx('streamer-meta')}>
                        <div className={cx('streamer-name-row')}>
                           <span className={cx('streamer-nickname')}>@{streamer.nickname}</span>
                           {streamer.tick && <FontAwesomeIcon icon={faCircleCheck} className={cx('check-icon')} />}
                        </div>
                        <span className={cx('streamer-fullname')}>{streamer.full_name}</span>
                     </div>
                  </div>

                  <p className={cx('live-title')}>{currentLive.title}</p>
               </div>

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
               <button
                  type="button"
                  className={cx('nav-btn')}
                  onClick={handlePrev}
                  onMouseDown={(e) => e.preventDefault()}
                  title="Lên"
               >
                  <FontAwesomeIcon icon={faChevronUp} />
               </button>
               <button
                  type="button"
                  className={cx('nav-btn')}
                  onClick={handleNext}
                  onMouseDown={(e) => e.preventDefault()}
                  title="Xuống"
               >
                  <FontAwesomeIcon icon={faChevronDown} />
               </button>
            </div>
         </div>
      </div>
   );
}

export default Live;
