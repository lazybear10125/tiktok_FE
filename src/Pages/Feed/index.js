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
   faPlus,
} from '@fortawesome/free-solid-svg-icons';

import styles from './Feed.module.scss';
import Image from '~/components/Image';
import images from '~/assets/images';
import * as userServices from '~/services/userService';

const cx = classNames.bind(styles);

const IMAGES = [
   'https://imgs.search.brave.com/mRl5uSOXOUmjNX-qJAO_wEu6Oi8tVuy2JvsI5N2jV3U/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMucGV4ZWxzLmNv/bS9waG90b3MvMzcw/NDYwOTYvcGV4ZWxz/LXBob3RvLTM3MDQ2/MDk2L2ZyZWUtcGhv/dG8tb2YtY29uLWQt/bmctci1wLWJvbmct/Y2F5LXRyb25nLWFu/aC1zYW5nLWJhbi1t/YWktdGhhbmgtYmlu/aC5qcGVnP2NzPXRp/bnlzcmdiJmRwcj0x/Jnc9NTAw',
   'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
   'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=600&q=80',
   'https://imgs.search.brave.com/SdCdBxiFL2anQMUUTPR5-P4LAAZYcfgY2ZTG6MHZeI0/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5tYWduaWZpYy5j/b20vaW1hZ2VzL2hv/bWUvdG9vbHMvZ2Vu/ZXJhdGUtYW4taW1h/Z2Uud2VicA',
   'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=600&q=80',
   'https://imgs.search.brave.com/sbkshREKL5ppke8E2vtsqWicDAzMwgPnROCjPz3lVz8/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jaGlt/dmlldDM2MC5jb20v/d3AtY29udGVudC91/cGxvYWRzLzIwMjUv/MTIvdGlldS12aWVt/LTUuanBn',
   'https://imgs.search.brave.com/BRv5EbWjzUTOHBDNEPiWGB0_eUohu6kCMP6eQuKtPyA/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jaGlt/dmlldDM2MC5jb20v/d3AtY29udGVudC91/cGxvYWRzLzIwMjUv/MTIvdGlldS12aWVt/LWRhdS1waGEtdGh1/b25nLWtodW5nLTE1/LmpwZw',
   'https://imgs.search.brave.com/JpvVnCt0EDLxEEvM8iivRxHUArDY2ho9NXrIj2MIbp8/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMucGV4ZWxzLmNv/bS9waG90b3MvMjc0/MDQyODMvcGV4ZWxz/LXBob3RvLTI3NDA0/MjgzL2ZyZWUtcGhv/dG8tb2YtcGhvbmct/Yy1uaC10aGllbi1u/aGllbi1uLWMtY2Fu/aC1kLW5nLmpwZWc_/Y3M9dGlueXNyZ2Im/ZHByPTEmdz01MDA',
   'https://imgs.search.brave.com/5pgeN2pRhnzo1nQmTXNbHK9UfvlI0SEBnyszfy8u5AY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzkxLzVm/LzUyLzkxNWY1MjJk/ZDc0MmRlYjM0ZDky/YzVkYmNhOTllZDVk/LmpwZw',
   'https://imgs.search.brave.com/-i12FBmfxfjaQntEMOP-kJzLudxwMatcMKgXVzGF4zE/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9waHVr/aWVubmlsbGtpbi5j/b20vd3AtY29udGVu/dC91cGxvYWRzLzIw/MjYvMDMvYW5oLW5h/cnV0by0yLTIuanBn',
];

function Feed() {
   const [feedPosts, setFeedPosts] = useState([]);
   const [currentIndex, setCurrentIndex] = useState(0);
   const [likedList, setLikedList] = useState({});

   // Lấy danh sách tài khoản đề xuất CHƯA follow (is_followed: false)
   useEffect(() => {
      userServices
         .getSuggested({ page: 1, perPage: 20 })
         .then((users) => {
            if (users && users.length > 0) {
               // Chỉ lấy các tài khoản người dùng chưa follow
               const notFollowedUsers = users.filter((u) => !u.is_followed);
               const list = notFollowedUsers.length > 0 ? notFollowedUsers : users;

               const posts = list.map((user, idx) => ({
                  id: user.id,
                  user,
                  image: IMAGES[idx % IMAGES.length],
                  caption: user.bio || `${user.full_name} chia sẻ khoảnh khắc thú vị trên For You #fyp #foryou`,
               }));
               setFeedPosts(posts);
            }
         })
         .catch((err) => console.error('Lỗi lấy feed For You:', err));
   }, []);

   // Fallback nếu API chưa về hoặc trống thì dùng danh sách ảnh IMAGES
   const currentPost =
      feedPosts.length > 0
         ? feedPosts[currentIndex]
         : {
              id: currentIndex,
              image: IMAGES[currentIndex % IMAGES.length],
              user: {
                 id: currentIndex,
                 nickname: 'tiktok_creator',
                 full_name: 'TikTok Creator',
                 avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
                 tick: true,
              },
              caption: 'Khám phá video thịnh hành trên For You hôm nay! #trending',
           };

   const currentAuthor = currentPost.user;
   const totalItems = feedPosts.length > 0 ? feedPosts.length : IMAGES.length;

   const isLiked = !!likedList[currentIndex];

   const handleToggleLike = () => {
      setLikedList((prev) => ({
         ...prev,
         [currentIndex]: !prev[currentIndex],
      }));
   };

   const handlePrev = () => {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
   };

   const handleNext = () => {
      setCurrentIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
   };

   // Hỗ trợ phím mũi tên Lên / Xuống để chuyển ảnh
   useEffect(() => {
      const handleKeyDown = (e) => {
         if (e.key === 'ArrowDown') {
            setCurrentIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
         } else if (e.key === 'ArrowUp') {
            setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
         }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
         window.removeEventListener('keydown', handleKeyDown);
      };
   }, [totalItems]);

   return (
      <div className={cx('wrapper')}>
         <div className={cx('container')}>
            <div className={cx('image-frame')}>
               <Image
                  src={currentPost.image}
                  alt={currentAuthor.full_name}
                  className={cx('image')}
                  fallback={images.noImage}
               />

               {/* Thông tin tài khoản hiển thị tĩnh, không click chuyển trang profile */}
               <div className={cx('overlay-info')}>
                  <div className={cx('author-info')}>
                     <Image
                        src={currentAuthor.avatar}
                        alt={currentAuthor.nickname}
                        className={cx('author-avatar')}
                        fallback={images.noImage}
                     />
                     <div className={cx('author-meta')}>
                        <div className={cx('author-name-row')}>
                           <span className={cx('author-nickname')}>@{currentAuthor.nickname}</span>
                           {currentAuthor.tick && <FontAwesomeIcon icon={faCircleCheck} className={cx('check-icon')} />}
                        </div>
                        <span className={cx('author-fullname')}>{currentAuthor.full_name}</span>
                     </div>
                  </div>

                  {/* Huy hiệu Follow hiển thị tĩnh, không có sự kiện click */}
                  <div className={cx('follow-badge')}>
                     <FontAwesomeIcon icon={faPlus} style={{ fontSize: '1rem' }} />
                     <span>Follow</span>
                  </div>

                  {currentPost.caption && <p className={cx('caption')}>{currentPost.caption}</p>}
               </div>

               {/* Cụm 3 action icon góc phải: Thả tim, Bình luận, Chia sẻ */}
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
