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
   faCheck,
} from '@fortawesome/free-solid-svg-icons';

import styles from './Following.module.scss';
import Image from '~/components/Image';
import Button from '~/components/Button';
import images from '~/assets/images';
import config from '~/config';
import * as userServices from '~/services/userService';

const cx = classNames.bind(styles);

// Danh sách ảnh động vật cute/hài hước chất lượng cao tỉ lệ dọc 9:16
const FOLLOWING_ANIMAL_IMAGES = [
   // 1. Chú chó Pug đen mặc áo len vàng y hệt ảnh người dùng yêu cầu
   'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=600&h=1000&q=80',
   // 2. Chó Pug mặt xệ hài hước
   'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=600&h=1000&q=80',
   // 3. Chó Corgi mông to cười tít mắt
   'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&h=1000&q=80',
   // 4. Mèo vàng mắt to tròn xoe siêu cute
   'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&h=1000&q=80',
   // 5. Chó cưng đeo kính râm phong cách ngầu
   'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&h=1000&q=80',
   // 6. Mèo đeo kính râm cool ngầu
   'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=600&h=1000&q=80',
   // 7. Chú chó Golden Retriever nụ cười tỏa nắng
   'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&h=1000&q=80',
   // 8. Mèo quý tộc lông xám sang chảnh
   'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=600&h=1000&q=80',
   // 9. Chú cún quấn khăn ấm áp mùa đông
   'https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&w=600&h=1000&q=80',
   // 10. Mèo con cuộn tròn ngái ngủ
   'https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?auto=format&fit=crop&w=600&h=1000&q=80',
];

// Caption hài hước, dễ thương theo phong cách thú cưng cho từng creator (không chứa icon/emoji)
const CREATOR_CAPTIONS = {
   leduongbaolam_official: '2 Ngày 1 Đêm! Lee Min Ho Đồng Nai chào quý dị bà con',
   mixigaming: 'Chào anh em Bộ Tộc! Hôm nay giới thiệu thành viên 4 chân mới',
   sondn: "Học lập trình F8 cùng 'boss' cưng của tôi",
   'khaby.lame': 'Khi bạn cho thú cưng ăn: đơn giản vậy thôi mà',
   hieuthuhai: "Visual hôm nay của tui và 'hoàng thượng' ai đỉnh hơn?",
   hoahanassii: 'Điệu nhảy mới cùng em mèo siêu quậy',
   lebong95: 'Tập gym cùng em cún năng lượng tràn trề',
   hoaminzy_rose: 'Hôm nay em bé này đi thu âm cùng mẹ nha',
   duythamchannel: "Mở hộp 'thiết bị' 4 chân chạy bằng pate mới nhất 2026",
};

function Following() {
   const [followingPosts, setFollowingPosts] = useState([]);
   const [currentIndex, setCurrentIndex] = useState(0);
   const [likedList, setLikedList] = useState({});
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      userServices
         .getFollowing({ page: 1, perPage: 20 })
         .then((users) => {
            if (users && users.length > 0) {
               const posts = users.map((user, idx) => ({
                  id: user.id,
                  user,
                  image: FOLLOWING_ANIMAL_IMAGES[idx % FOLLOWING_ANIMAL_IMAGES.length],
                  caption:
                     CREATOR_CAPTIONS[user.nickname] ||
                     user.bio ||
                     `${user.full_name} đã chia sẻ một khoảnh khắc thú cưng mới #pet #following`,
               }));
               setFollowingPosts(posts);
            }
            setLoading(false);
         })
         .catch((err) => {
            console.error('Lỗi tải danh sách following:', err);
            setLoading(false);
         });
   }, []);

   const isLiked = !!likedList[currentIndex];

   const handleToggleLike = () => {
      setLikedList((prev) => ({
         ...prev,
         [currentIndex]: !prev[currentIndex],
      }));
   };

   const handlePrev = () => {
      if (followingPosts.length === 0) return;
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : followingPosts.length - 1));
   };

   const handleNext = () => {
      if (followingPosts.length === 0) return;
      setCurrentIndex((prev) => (prev < followingPosts.length - 1 ? prev + 1 : 0));
   };

   useEffect(() => {
      const handleKeyDown = (e) => {
         if (e.key === 'ArrowDown') {
            setCurrentIndex((prev) => (prev < followingPosts.length - 1 ? prev + 1 : 0));
         } else if (e.key === 'ArrowUp') {
            setCurrentIndex((prev) => (prev > 0 ? prev - 1 : followingPosts.length - 1));
         }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
         window.removeEventListener('keydown', handleKeyDown);
      };
   }, [followingPosts.length]);

   if (loading) {
      return (
         <div className={cx('wrapper')}>
            <div className={cx('loading')}>
               <p>Đang tải...</p>
            </div>
         </div>
      );
   }

   if (followingPosts.length === 0) {
      return (
         <div className={cx('wrapper')}>
            <div className={cx('empty')}>
               <h3 className={cx('empty-title')}>Chưa có bài viết mới</h3>
               <p className={cx('empty-desc')}>
                  Hãy theo dõi thêm các nhà sáng tạo nội dung để xem những bài viết mới nhất của họ tại đây!
               </p>
               <Button primary to={config.routes.home} className={cx('empty-btn')}>
                  Khám phá For You
               </Button>
            </div>
         </div>
      );
   }

   const currentPost = followingPosts[currentIndex];
   const currentAuthor = currentPost.user;

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

                  <div className={cx('following-badge')}>
                     <FontAwesomeIcon icon={faCheck} style={{ fontSize: '1rem' }} />
                     <span>Đang theo dõi</span>
                  </div>

                  {currentPost.caption && <p className={cx('caption')}>{currentPost.caption}</p>}
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

export default Following;
