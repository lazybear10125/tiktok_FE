import { useState, useEffect, useRef } from 'react';
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
   faPlay,
   faVolumeXmark,
   faVolumeHigh,
} from '@fortawesome/free-solid-svg-icons';

import styles from './Feed.module.scss';
import Image from '~/components/Image';
import images from '~/assets/images';
import * as videoServices from '~/services/videoService';
import * as userServices from '~/services/userService';
import { useAuth } from '~/context/AuthContext';
import CommentsPopup from './CommentsPopup';

const cx = classNames.bind(styles);

const FOR_YOU_IMAGES = [
   'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=600&h=1000&q=80',
];

function Feed() {
   const { currentUser, openLoginModal } = useAuth();
   const [feedPosts, setFeedPosts] = useState([]);
   const [currentIndex, setCurrentIndex] = useState(0);
   const [likedList, setLikedList] = useState({});
   const [isPlaying, setIsPlaying] = useState(true);
   const [isMuted, setIsMuted] = useState(true);
   const [isCommentsOpen, setIsCommentsOpen] = useState(false);
   const [videoErrorMap, setVideoErrorMap] = useState({});
   const videoRef = useRef(null);

   const handleToggleComments = () => {
      setIsCommentsOpen((prev) => !prev);
   };

   const handleVideoError = (id) => {
      setVideoErrorMap((prev) => ({ ...prev, [id]: true }));
   };

   // Lấy kết hợp vài video từ API và rất nhiều bài post ảnh từ API users
   useEffect(() => {
      let isMounted = true;

      Promise.all([
         videoServices.getVideos({ type: 'for-you', page: 1 }).catch(() => []),
         userServices.getSuggested({ page: 1, perPage: 30 }).catch(() => []),
      ]).then(([videos, users]) => {
         if (!isMounted) return;

         // Lấy vài video từ API (3 video)
         const videoPosts = (videos || []).slice(0, 3).map((video) => ({
            id: `video-${video.id}`,
            type: 'video',
            user: video.user,
            video_url: video.video_file
               ? `https://tiktok-api-pq2d.onrender.com/videos/${video.video_file}`
               : null,
            image: null,
            caption: video.description || `${video.user?.full_name} trên For You #fyp`,
         }));

         // Lấy danh sách bài post ảnh từ API users/suggested
         const candidateUsers = (users || []).filter((u) => !u.is_followed);
         const userList = candidateUsers.length >= 10 ? candidateUsers : users || [];

         const imagePosts = userList.slice(0, 20).map((user, idx) => ({
            id: `img-${user.id}-${idx}`,
            type: 'image',
            user,
            video_url: null,
            image: FOR_YOU_IMAGES[idx % FOR_YOU_IMAGES.length],
            caption: user.bio || `${user.full_name} chia sẻ khoảnh khắc thú vị trên For You #fyp`,
         }));

         // Xen kẽ: 1 Video -> 3 Ảnh -> 1 Video -> 3 Ảnh -> 1 Video -> các ảnh còn lại
         const combined = [];
         let vIdx = 0;
         let iIdx = 0;

         while (vIdx < videoPosts.length || iIdx < imagePosts.length) {
            if (vIdx < videoPosts.length) {
               combined.push(videoPosts[vIdx++]);
            }
            for (let k = 0; k < 3 && iIdx < imagePosts.length; k++) {
               combined.push(imagePosts[iIdx++]);
            }
         }

         if (combined.length > 0) {
            setFeedPosts(combined);
         }
      });

      return () => {
         isMounted = false;
      };
   }, []);

   // Fallback nếu API chưa về hoặc trống
   const currentPost =
      feedPosts.length > 0
         ? feedPosts[currentIndex]
         : {
              id: currentIndex,
              video_url: null,
              image: FOR_YOU_IMAGES[0],
              user: {
                 id: currentIndex,
                 nickname: 'tiktok_creator',
                 full_name: 'TikTok Creator',
                 avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
                 tick: true,
              },
              caption: 'Khám phá hình ảnh và video thịnh hành trên For You hôm nay! #trending',
           };

   const currentAuthor = currentPost.user;
   const totalItems = feedPosts.length > 0 ? feedPosts.length : FOR_YOU_IMAGES.length;

   const isLiked = !!likedList[currentIndex];

   const handleToggleLike = () => {
      setLikedList((prev) => ({
         ...prev,
         [currentIndex]: !prev[currentIndex],
      }));
   };

   const handleTogglePlay = () => {
      if (!videoRef.current) return;
      if (videoRef.current.paused) {
         videoRef.current.play();
         setIsPlaying(true);
      } else {
         videoRef.current.pause();
         setIsPlaying(false);
      }
   };

   const handlePrev = () => {
      setIsPlaying(true);
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
   };

   const handleNext = () => {
      setIsPlaying(true);
      setCurrentIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
   };

   // Hỗ trợ phím mũi tên Lên / Xuống để chuyển video (ngăn chặn cuộn sidebar mặc định)
   useEffect(() => {
      const handleKeyDown = (e) => {
         if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIsPlaying(true);
            setCurrentIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
         } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setIsPlaying(true);
            setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
         }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
         window.removeEventListener('keydown', handleKeyDown);
      };
   }, [totalItems]);

   const hasVideo = !!currentPost.video_url && !videoErrorMap[currentPost.id];

   return (
      <div className={cx('wrapper')}>
         <div className={cx('container')}>
            <div className={cx('image-frame')}>
               {hasVideo ? (
                  <video
                     ref={videoRef}
                     key={currentPost.video_url}
                     src={currentPost.video_url}
                     className={cx('video')}
                     autoPlay
                     loop
                     muted={isMuted}
                     playsInline
                     onClick={handleTogglePlay}
                     onError={() => handleVideoError(currentPost.id)}
                  />
               ) : (
                  <Image
                     src={currentPost.image}
                     alt={currentAuthor.full_name}
                     className={cx('image')}
                     fallback={images.noImage}
                  />
               )}

               {/* Nút Play hiển thị ở giữa khi video bị Pause */}
               {hasVideo && !isPlaying && (
                  <div className={cx('play-overlay')}>
                     <FontAwesomeIcon icon={faPlay} />
                  </div>
               )}

               {/* Nút bật/tắt âm thanh góc trên bên phải */}
               {hasVideo && (
                  <button
                     type="button"
                     className={cx('mute-btn')}
                     onClick={() => setIsMuted((prev) => !prev)}
                     title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                  >
                     <FontAwesomeIcon icon={isMuted ? faVolumeXmark : faVolumeHigh} />
                  </button>
               )}

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

                  <button
                     className={cx('action-btn', { 'comment-active': isCommentsOpen })}
                     onClick={handleToggleComments}
                     title="Bình luận"
                  >
                     <FontAwesomeIcon icon={faCommentDots} />
                  </button>

                  <button className={cx('action-btn')} title="Chia sẻ">
                     <FontAwesomeIcon icon={faShare} />
                  </button>
               </div>
            </div>

            {/* Comments Panel: mở trượt sang bên phải video */}
            <div className={cx('comments-panel', { open: isCommentsOpen })}>
               <CommentsPopup
                  isOpen={isCommentsOpen}
                  onClose={() => setIsCommentsOpen(false)}
                  post={currentPost}
                  currentUser={currentUser}
                  openLoginModal={openLoginModal}
               />
            </div>

            <div className={cx('navigation')}>
               <button
                  type="button"
                  className={cx('nav-btn')}
                  onClick={handlePrev}
                  onMouseDown={(e) => e.preventDefault()}
                  title="Up"
               >
                  <FontAwesomeIcon icon={faChevronUp} />
               </button>
               <button
                  type="button"
                  className={cx('nav-btn')}
                  onClick={handleNext}
                  onMouseDown={(e) => e.preventDefault()}
                  title="Down"
               >
                  <FontAwesomeIcon icon={faChevronDown} />
               </button>
            </div>
         </div>
      </div>
   );
}

export default Feed;
