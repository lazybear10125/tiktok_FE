import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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
import { useAuth } from '~/context/AuthContext';
import CommentsPopup from './CommentsPopup';

const cx = classNames.bind(styles);

// Danh sách video mẫu cho vài bài đăng dạng video
const FOR_YOU_VIDEO_CLIPS = [
   'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
   'https://www.w3schools.com/html/mov_bbb.mp4',
   'https://vjs.zencdn.net/v/oceans.mp4',
   'https://media.w3.org/2010/05/sintel/trailer.mp4',
   'https://www.w3schools.com/tags/movie.mp4',
];

// Danh sách tác giả phát dạng Video
const VIDEO_AUTHORS = new Set(['sondn', 'mixigaming', 'mrbeast', 'khaby.lame', 'zachking']);

function Feed() {
   const { currentUser, openLoginModal } = useAuth();
   const location = useLocation();

   const [feedPosts, setFeedPosts] = useState([]);
   const [currentIndex, setCurrentIndex] = useState(0);
   const [likedList, setLikedList] = useState({});
   const [isPlaying, setIsPlaying] = useState(true);
   const [isMuted, setIsMuted] = useState(true);
   const [volume, setVolume] = useState(0.5);
   const [isCommentsOpen, setIsCommentsOpen] = useState(false);
   const [videoErrorMap, setVideoErrorMap] = useState({});

   const videoRef = useRef(null);
   const containerRef = useRef(null);
   const commentsPanelRef = useRef(null);
   const lastWheelTimeRef = useRef(0);
   const touchStartYRef = useRef(0);
   const touchStartXRef = useRef(0);

   useEffect(() => {
      if (videoRef.current) {
         videoRef.current.muted = isMuted;
         videoRef.current.volume = isMuted ? 0 : volume;
      }
   }, [currentIndex, isMuted, volume]);

   const handleToggleMute = (e) => {
      e?.stopPropagation();
      setIsMuted((prev) => {
         const nextMuted = !prev;
         if (videoRef.current) {
            videoRef.current.muted = nextMuted;
            if (!nextMuted) {
               const unmutedVol = volume > 0 ? volume : 0.5;
               videoRef.current.volume = unmutedVol;
               setVolume(unmutedVol);
            } else {
               videoRef.current.volume = 0;
            }
         }
         return nextMuted;
      });
   };

   const handleVolumeChange = (e) => {
      e.stopPropagation();
      const newVol = parseFloat(e.target.value) / 100;
      setVolume(newVol);
      if (newVol === 0) {
         setIsMuted(true);
         if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.volume = 0;
         }
      } else {
         setIsMuted(false);
         if (videoRef.current) {
            videoRef.current.muted = false;
            videoRef.current.volume = newVol;
         }
      }
   };

   const handleVideoError = (id) => {
      setVideoErrorMap((prev) => ({ ...prev, [id]: true }));
   };

   // Lấy dữ liệu bài đăng từ Backend API: Tải trang 1 tức thì, tải ngầm các trang tiếp theo
   useEffect(() => {
      let isMounted = true;

      const formatPost = (video, idx) => {
         const authorNick = video.user?.nickname || '';
         const isVideoType =
            video.type === 'video' || !!video.video_file || !!video.video_url || VIDEO_AUTHORS.has(authorNick);

         const videoUrl = isVideoType
            ? video.video_url || FOR_YOU_VIDEO_CLIPS[idx % FOR_YOU_VIDEO_CLIPS.length]
            : null;

         const imageUrl =
            video.image_url ||
            (video.image_file ? `http://localhost:8080/avatars/${video.image_file}` : null) ||
            video.user?.avatar;

         return {
            id: video.id,
            type: isVideoType ? 'video' : 'image',
            user: video.user,
            video_url: videoUrl,
            image: imageUrl,
            caption: video.description || `${video.user?.full_name} trên For You #fyp`,
            music: video.music || 'nhạc nền - TikTok Official',
            likes_count: video.likes_count || 100,
            comments_count: video.comments_count || 50,
            is_liked: !!video.is_liked,
            created_at: video.created_at,
         };
      };

      // 1. Tải trang 1 siêu tốc để người dùng xem ngay lập tức
      videoServices.getVideos({ type: 'for-you', page: 1 }).then((p1) => {
         if (!isMounted || !p1 || p1.length === 0) return;
         setFeedPosts(p1.map((v, i) => formatPost(v, i)));

         // 2. Tải ngầm các trang tiếp theo không làm nghẽn trang chủ
         Promise.all([
            videoServices.getVideos({ type: 'for-you', page: 2 }).catch(() => []),
            videoServices.getVideos({ type: 'for-you', page: 3 }).catch(() => []),
            videoServices.getVideos({ type: 'for-you', page: 4 }).catch(() => []),
         ]).then(([p2, p3, p4]) => {
            if (!isMounted) return;
            const remaining = [...(p2 || []), ...(p3 || []), ...(p4 || [])];
            if (remaining.length > 0) {
               setFeedPosts((prev) => [
                  ...prev,
                  ...remaining.map((v, i) => formatPost(v, prev.length + i)),
               ]);
            }
         });
      }).catch(() => {});

      return () => {
         isMounted = false;
      };
   }, []);

   const totalItems = feedPosts.length > 0 ? feedPosts.length : 1;

   // Điều hướng mượt mà đến video được liên kết từ thông báo
   useEffect(() => {
      if (location.state?.targetVideoId && feedPosts.length > 0) {
         const targetId = location.state.targetVideoId;
         const targetIdx = feedPosts.findIndex((p) => p.id === targetId);
         if (targetIdx !== -1) {
            setCurrentIndex(targetIdx);
            if (location.state.openComments) {
               setIsCommentsOpen(true);
            }
            if (containerRef.current) {
               containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
         }
      }
   }, [location.state, feedPosts]);

   // Bật/tắt Comments Popup
   const handleToggleComments = () => {
      setIsCommentsOpen((prev) => !prev);
   };

   // Fallback nếu API chưa về hoặc trống
   const currentPost =
      feedPosts.length > 0
         ? feedPosts[currentIndex]
         : {
              id: currentIndex,
              video_url: null,
              image: 'https://tiktok-api-pq2d.onrender.com/avatars/sondn.jpg',
              user: {
                 id: currentIndex,
                 nickname: 'sondn',
                 full_name: 'Đặng Ngọc Sơn (Sơn Đặng)',
                 avatar: 'https://tiktok-api-pq2d.onrender.com/avatars/sondn.jpg',
                 tick: true,
              },
              caption: 'Khám phá hình ảnh và video thịnh hành trên For You hôm nay! #trending',
           };

   const currentAuthor = currentPost.user || {};
   const isLiked = !!likedList[currentIndex];

   // Reset likedList on auth-logout or when user logs out
   useEffect(() => {
      const handleLogout = () => {
         setLikedList({});
         setIsCommentsOpen(false);
      };
      window.addEventListener('auth-logout', handleLogout);
      return () => window.removeEventListener('auth-logout', handleLogout);
   }, []);

   useEffect(() => {
      if (!currentUser) {
         setLikedList({});
      }
   }, [currentUser]);

   const handleToggleLike = () => {
      if (!currentUser) {
         openLoginModal();
         return;
      }
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

   const handlePrev = useCallback(() => {
      setIsPlaying(true);
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
   }, [totalItems]);

   const handleNext = useCallback(() => {
      setIsPlaying(true);
      setCurrentIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
   }, [totalItems]);

   // Cuộn danh sách video bằng chuột (Mouse wheel):
   // Tách biệt hoàn toàn cuộn ngang và cuộn dọc; chặn cuộn trang dọc khi đang đổi video
   useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleWheel = (e) => {
         // Nếu con trỏ nằm trong bảng bình luận thì để bảng bình luận cuộn tự nhiên
         if (e.target.closest(`.${cx('comments-panel')}`)) return;

         // Nếu đang tương tác với volume slider
         if (e.target.closest('input[type="range"]') || e.target.closest(`.${cx('volume-control')}`)) return;

         // Nếu thao tác cuộn ngang lớn hơn hoặc bằng cuộn dọc (ví dụ swipe 2 ngón trackpad ngang), bỏ qua không chuyển video
         if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;

         const now = Date.now();
         if (now - lastWheelTimeRef.current < 400) return;

         if (e.deltaY > 25) {
            if (e.cancelable) e.preventDefault();
            lastWheelTimeRef.current = now;
            handleNext();
         } else if (e.deltaY < -25) {
            if (e.cancelable) e.preventDefault();
            lastWheelTimeRef.current = now;
            handlePrev();
         }
      };

      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
         container.removeEventListener('wheel', handleWheel);
      };
   }, [handleNext, handlePrev]);

   // Cuộn danh sách video bằng cảm ứng (Touch swipe) trên mobile / tablet
   const handleTouchStart = (e) => {
      if (e.touches && e.touches[0]) {
         touchStartYRef.current = e.touches[0].clientY;
         touchStartXRef.current = e.touches[0].clientX;
      }
   };

   const handleTouchEnd = (e) => {
      // Bỏ qua nếu touch bên trong comments panel
      if (e.target.closest(`.${cx('comments-panel')}`)) return;
      if (!e.changedTouches || !e.changedTouches[0]) return;

      const diffX = touchStartXRef.current - e.changedTouches[0].clientX;
      const diffY = touchStartYRef.current - e.changedTouches[0].clientY;

      // Nếu vuốt ngang dominant hơn vuốt dọc: bỏ qua để tránh trùng thao tác cuộn
      if (Math.abs(diffX) >= Math.abs(diffY)) return;

      if (Math.abs(diffY) > 40) {
         if (diffY > 0) {
            handleNext();
         } else {
            handlePrev();
         }
      }
   };



   // Hỗ trợ phím mũi tên Lên / Xuống để chuyển video
   useEffect(() => {
      const handleKeyDown = (e) => {
         if (e.key === 'ArrowDown') {
            e.preventDefault();
            handleNext();
         } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            handlePrev();
         }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
         window.removeEventListener('keydown', handleKeyDown);
      };
   }, [handleNext, handlePrev]);

   const hasVideo = !!currentPost.video_url && !videoErrorMap[currentPost.id];
   const currentSliderValue = isMuted ? 0 : Math.round(volume * 100);

   return (
      <div
         ref={containerRef}
         className={cx('wrapper')}
         onTouchStart={handleTouchStart}
         onTouchEnd={handleTouchEnd}
      >
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
                     key={currentPost.image}
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
                  <div className={cx('volume-control')} onClick={(e) => e.stopPropagation()}>
                     <button
                        type="button"
                        className={cx('mute-btn')}
                        onClick={handleToggleMute}
                        title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                     >
                        <FontAwesomeIcon icon={isMuted ? faVolumeXmark : faVolumeHigh} />
                     </button>

                     <div className={cx('volume-slider-wrapper')}>
                        <input
                           type="range"
                           min="0"
                           max="100"
                           value={currentSliderValue}
                           onChange={handleVolumeChange}
                           onMouseDown={(e) => e.stopPropagation()}
                           onTouchStart={(e) => e.stopPropagation()}
                           className={cx('volume-slider')}
                           style={{
                              background: `linear-gradient(to right, #0075ff 0%, #0075ff ${currentSliderValue}%, #e5e5e5 ${currentSliderValue}%, #e5e5e5 100%)`,
                           }}
                           title={`Âm lượng: ${currentSliderValue}%`}
                        />
                     </div>
                  </div>
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

                  {/* Huy hiệu Follow hiển thị tĩnh */}
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

            {/* Comments Panel */}
            <div ref={commentsPanelRef} className={cx('comments-panel', { open: isCommentsOpen })}>
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
