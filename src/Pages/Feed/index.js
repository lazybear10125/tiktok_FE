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

   // Lấy 100% dữ liệu bài đăng từ Backend API (/api/videos)
   useEffect(() => {
      let isMounted = true;

      Promise.all([
         videoServices.getVideos({ type: 'for-you', page: 1 }).catch(() => []),
         videoServices.getVideos({ type: 'for-you', page: 2 }).catch(() => []),
         videoServices.getVideos({ type: 'for-you', page: 3 }).catch(() => []),
         videoServices.getVideos({ type: 'for-you', page: 4 }).catch(() => []),
      ]).then(([p1, p2, p3, p4]) => {
         if (!isMounted) return;

         const allApiVideos = [...(p1 || []), ...(p2 || []), ...(p3 || []), ...(p4 || [])];

         if (allApiVideos.length > 0) {
            let videoClipIdx = 0;
            const normalized = allApiVideos.map((video) => {
               const authorNick = video.user?.nickname || '';
               const isVideoType =
                  video.type === 'video' || !!video.video_file || !!video.video_url || VIDEO_AUTHORS.has(authorNick);

               const videoUrl = isVideoType
                  ? video.video_url || FOR_YOU_VIDEO_CLIPS[videoClipIdx++ % FOR_YOU_VIDEO_CLIPS.length]
                  : null;

               const imageUrl =
                  video.image_url ||
                  (video.image_file ? `https://tiktok-api-pq2d.onrender.com/avatars/${video.image_file}` : null) ||
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
            });

            setFeedPosts(normalized);
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
   const totalItems = feedPosts.length > 0 ? feedPosts.length : 1;

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
                     title={isMuted ? 'Mute' : 'Unmute'}
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

            {/* Comments Panel */}
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
