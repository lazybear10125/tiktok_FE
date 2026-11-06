import { useState, useEffect, useRef, useCallback } from 'react';
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
   faPlay,
   faVolumeXmark,
   faVolumeHigh,
   faMusic,
   faVideo,
   faImage,
   faUserGroup,
} from '@fortawesome/free-solid-svg-icons';

import styles from './Following.module.scss';
import Image from '~/components/Image';
import Button from '~/components/Button';
import images from '~/assets/images';
import config from '~/config';
import * as userServices from '~/services/userService';
import * as videoServices from '~/services/videoService';
import { useAuth } from '~/context/AuthContext';
import CommentsPopup from '~/Pages/Feed/CommentsPopup';

const cx = classNames.bind(styles);

// Danh sách URL video MP4 dọc/chuẩn để phát cho các bài đăng dạng VIDEO
const FOLLOWING_VIDEO_URLS = [
   'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
   'https://www.w3schools.com/html/mov_bbb.mp4',
   'https://vjs.zencdn.net/v/oceans.mp4',
   'https://media.w3.org/2010/05/sintel/trailer.mp4',
   'https://www.w3schools.com/tags/movie.mp4',
];

// Danh sách ảnh dọc 9:16 chất lượng cao cho các bài đăng dạng IMAGE của người được Follow
const FOLLOWING_IMAGE_FALLBACKS = [
   'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&h=1000&q=80',
   'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=600&h=1000&q=80',
];

// Danh sách các nickname sáng tạo nội dung thiên về video (để phân định video và image rõ ràng)
const VIDEO_CREATOR_NICKNAMES = new Set([
   'sondn', // User B đăng VIDEO
   'mixigaming',
   'mrbeast',
   'khaby.lame',
   'zachking',
   'cristiano',
   'duythamchannel',
]);

function Following() {
   const { currentUser, openLoginModal } = useAuth();
   const [followingUsers, setFollowingUsers] = useState([]);
   const [followingPosts, setFollowingPosts] = useState([]);
   const [currentIndex, setCurrentIndex] = useState(0);
   const [likedMap, setLikedMap] = useState({});
   const [likesCountMap, setLikesCountMap] = useState({});
   const [isPlaying, setIsPlaying] = useState(true);
   const [isMuted, setIsMuted] = useState(true);
   const [isCommentsOpen, setIsCommentsOpen] = useState(false);
   const [loading, setLoading] = useState(true);
   const [page, setPage] = useState(1);
   const [hasMore, setHasMore] = useState(true);
   const [videoErrorMap, setVideoErrorMap] = useState({});

   const videoRef = useRef(null);
   const commentsPanelRef = useRef(null);
   const lastWheelTimeRef = useRef(0);
   const touchStartYRef = useRef(0);

   // Tải danh sách Following accounts & bài đăng từ Backend API
   const loadFollowingData = useCallback(async () => {
      setLoading(true);
      try {
         // 1. Lấy danh sách tài khoản mà User hiện tại đang Follow từ Backend API
         const users = await userServices.getFollowing({ page: 1, perPage: 100 });
         const validFollowingUsers = users || [];
         setFollowingUsers(validFollowingUsers);

         if (validFollowingUsers.length === 0) {
            setFollowingPosts([]);
            setLoading(false);
            return;
         }

         const followedUserIds = new Set(validFollowingUsers.map((u) => u.id));
         const followedNicknames = new Set(validFollowingUsers.map((u) => u.nickname));

         // 2. Lấy các bài đăng thuộc luồng Following từ Backend API
         const videosData = await videoServices.getVideos({ type: 'following', page: 1 });
         const rawPosts = videosData || [];

         // 3. LỌC NGHIÊM NGẶT: Chỉ giữ lại bài đăng có authorId / nickname thuộc danh sách ĐANG FOLLOW
         // Tuyệt đối không hiển thị bài đăng từ tài khoản chưa follow hoặc suggested accounts
         const filtered = rawPosts.filter((post) => {
            const authorId = post.user_id || post.user?.id;
            const authorNick = post.user?.nickname;
            return (authorId && followedUserIds.has(authorId)) || (authorNick && followedNicknames.has(authorNick));
         });

         // 4. Sắp xếp theo thời gian mới nhất trước (created_at descending)
         filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

         // 5. Chuẩn hóa bài đăng hỗ trợ cả dạng VIDEO và IMAGE
         const normalizedPosts = filtered.map((post, idx) => {
            const authorNick = post.user?.nickname || '';
            const isVideoType =
               post.type === 'video' ||
               !!post.video_file ||
               !!post.video_url ||
               VIDEO_CREATOR_NICKNAMES.has(authorNick);

            const videoSrc = isVideoType
               ? post.video_url || FOLLOWING_VIDEO_URLS[idx % FOLLOWING_VIDEO_URLS.length]
               : null;

            const imageSrc =
               post.image_url ||
               (post.image_file ? `https://tiktok-api-pq2d.onrender.com/avatars/${post.image_file}` : null) ||
               FOLLOWING_IMAGE_FALLBACKS[idx % FOLLOWING_IMAGE_FALLBACKS.length];

            return {
               id: post.id,
               type: isVideoType ? 'video' : 'image',
               user: post.user,
               video_url: videoSrc,
               image: imageSrc,
               caption:
                  post.description ||
                  `${post.user?.full_name} đã chia sẻ một bài viết mới cho người theo dõi #following`,
               music: post.music || 'nhạc nền - TikTok Official',
               likes_count: post.likes_count || 120,
               is_liked: !!post.is_liked,
               created_at: post.created_at,
            };
         });

         setFollowingPosts(normalizedPosts);

         // Khởi tạo trạng thái Like ban đầu từ dữ liệu bài viết
         const initialLikes = {};
         const initialCounts = {};
         normalizedPosts.forEach((p, idx) => {
            initialLikes[idx] = !!p.is_liked;
            initialCounts[idx] = p.likes_count || 0;
         });
         setLikedMap(initialLikes);
         setLikesCountMap(initialCounts);
      } catch (err) {
         console.error('Lỗi khi tải dữ liệu Following:', err);
      } finally {
         setLoading(false);
      }
   }, []);

   useEffect(() => {
      loadFollowingData();
   }, [loadFollowingData]);

   // Lắng nghe sự kiện Follow / Unfollow từ Sidebar, Profile, Search để cập nhật ngay lập tức
   useEffect(() => {
      const handleFollowingChange = (e) => {
         const { nickname, isFollowed } = e.detail || {};
         if (!nickname) return;

         if (!isFollowed) {
            // Khi Unfollow: loại bỏ ngay lập tức tài khoản và tất cả bài đăng của họ khỏi feed
            setFollowingUsers((prev) => prev.filter((u) => u.nickname !== nickname));
            setFollowingPosts((prevPosts) => {
               const updated = prevPosts.filter((p) => p.user?.nickname !== nickname);
               setCurrentIndex((prevIdx) => (prevIdx >= updated.length ? Math.max(0, updated.length - 1) : prevIdx));
               return updated;
            });
         } else {
            // Khi Follow lại: tải lại luồng Following để nạp bài đăng mới
            loadFollowingData();
         }
      };

      window.addEventListener('following-changed', handleFollowingChange);
      return () => {
         window.removeEventListener('following-changed', handleFollowingChange);
      };
   }, [loadFollowingData]);

   // Tải thêm bài đăng khi cuộn (Infinite scroll)
   const handleLoadMore = useCallback(async () => {
      if (!hasMore || loading) return;
      const nextPage = page + 1;
      try {
         const moreVideos = await videoServices.getVideos({ type: 'following', page: nextPage });
         if (!moreVideos || moreVideos.length === 0) {
            setHasMore(false);
            return;
         }

         const followedUserIds = new Set(followingUsers.map((u) => u.id));
         const followedNicknames = new Set(followingUsers.map((u) => u.nickname));

         const filteredMore = moreVideos.filter((post) => {
            const authorId = post.user_id || post.user?.id;
            const authorNick = post.user?.nickname;
            return (authorId && followedUserIds.has(authorId)) || (authorNick && followedNicknames.has(authorNick));
         });

         if (filteredMore.length === 0) {
            setHasMore(false);
            return;
         }

         const normalizedMore = filteredMore.map((post, idx) => {
            const authorNick = post.user?.nickname || '';
            const isVideoType =
               post.type === 'video' ||
               !!post.video_file ||
               !!post.video_url ||
               VIDEO_CREATOR_NICKNAMES.has(authorNick);

            return {
               id: post.id,
               type: isVideoType ? 'video' : 'image',
               user: post.user,
               video_url: isVideoType
                  ? post.video_url || FOLLOWING_VIDEO_URLS[(followingPosts.length + idx) % FOLLOWING_VIDEO_URLS.length]
                  : null,
               image:
                  post.image_url ||
                  (post.image_file ? `https://tiktok-api-pq2d.onrender.com/avatars/${post.image_file}` : null) ||
                  FOLLOWING_IMAGE_FALLBACKS[(followingPosts.length + idx) % FOLLOWING_IMAGE_FALLBACKS.length],
               caption: post.description || `${post.user?.full_name} #following`,
               music: post.music || 'nhạc nền - TikTok Official',
               likes_count: post.likes_count || 100,
               is_liked: !!post.is_liked,
               created_at: post.created_at,
            };
         });

         setFollowingPosts((prev) => [...prev, ...normalizedMore]);
         setPage(nextPage);
      } catch (err) {
         console.error('Lỗi khi tải thêm bài đăng:', err);
         setHasMore(false);
      }
   }, [hasMore, loading, page, followingUsers, followingPosts.length]);

   // Tương tác Thả tim (Like / Unlike)
   const handleToggleLike = async () => {
      if (!currentUser) {
         openLoginModal();
         return;
      }

      const currentPost = followingPosts[currentIndex];
      if (!currentPost) return;

      const isLiked = !!likedMap[currentIndex];
      const newLikedState = !isLiked;

      setLikedMap((prev) => ({
         ...prev,
         [currentIndex]: newLikedState,
      }));

      setLikesCountMap((prev) => ({
         ...prev,
         [currentIndex]: newLikedState
            ? (prev[currentIndex] || currentPost.likes_count || 0) + 1
            : Math.max(0, (prev[currentIndex] || currentPost.likes_count || 1) - 1),
      }));

      try {
         if (newLikedState) {
            await videoServices.likeVideo(currentPost.id);
         } else {
            await videoServices.unlikeVideo(currentPost.id);
         }
      } catch {
         // Revert nếu lỗi
      }
   };

   // Bật/tắt Comments Popup
   const handleToggleComments = () => {
      setIsCommentsOpen((prev) => !prev);
   };

   // Play / Pause video
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

   // Báo lỗi video để fallback sang ảnh
   const handleVideoError = (id) => {
      setVideoErrorMap((prev) => ({ ...prev, [id]: true }));
   };

   // Chia sẻ bài viết
   const handleShare = () => {
      if (navigator.clipboard) {
         navigator.clipboard.writeText(window.location.href);
         alert('Đã sao chép liên kết bài viết vào bộ nhớ tạm!');
      }
   };

   // Điều hướng Lên / Xuống
   const handlePrev = () => {
      if (followingPosts.length === 0) return;
      setIsPlaying(true);
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : followingPosts.length - 1));
   };

   const handleNext = () => {
      if (followingPosts.length === 0) return;
      setIsPlaying(true);
      setCurrentIndex((prev) => {
         const nextIdx = prev < followingPosts.length - 1 ? prev + 1 : 0;
         if (nextIdx >= followingPosts.length - 2) {
            handleLoadMore();
         }
         return nextIdx;
      });
   };

   // Hỗ trợ phím mũi tên Lên / Xuống
   useEffect(() => {
      const handleKeyDown = (e) => {
         if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIsPlaying(true);
            setCurrentIndex((prev) => {
               const nextIdx = prev < followingPosts.length - 1 ? prev + 1 : 0;
               if (nextIdx >= followingPosts.length - 2) {
                  handleLoadMore();
               }
               return nextIdx;
            });
         } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setIsPlaying(true);
            setCurrentIndex((prev) => (prev > 0 ? prev - 1 : followingPosts.length - 1));
         }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
         window.removeEventListener('keydown', handleKeyDown);
      };
   }, [followingPosts.length, handleLoadMore]);

   // 1. Trạng thái Đang tải
   if (loading) {
      return (
         <div className={cx('wrapper')}>
            <div className={cx('loading')}>
               <div className={cx('loading-spinner')} />
               <p>Đang tải bài viết Following...</p>
            </div>
         </div>
      );
   }

   // 2. Trạng thái Chưa đăng nhập
   if (!currentUser) {
      return (
         <div className={cx('wrapper')}>
            <div className={cx('empty')}>
               <FontAwesomeIcon icon={faUserGroup} className={cx('empty-icon')} />
               <h3 className={cx('empty-title')}>Bạn cần đăng nhập</h3>
               <p className={cx('empty-desc')}>
                  Đăng nhập để theo dõi các nhà sáng tạo nội dung và xem bài viết mới nhất của họ tại đây!
               </p>
               <Button primary className={cx('empty-btn')} onClick={openLoginModal}>
                  Đăng nhập ngay
               </Button>
            </div>
         </div>
      );
   }

   // 3. Trạng thái Chưa Follow ai (Yêu cầu thông báo: "Follow some creators to see their videos here")
   if (followingUsers.length === 0) {
      return (
         <div className={cx('wrapper')}>
            <div className={cx('empty')}>
               <FontAwesomeIcon icon={faUserGroup} className={cx('empty-icon')} />
               <h3 className={cx('empty-title')}>Chưa có người theo dõi</h3>
               <p className={cx('empty-desc')}>Follow some creators to see their videos here</p>
               <Button primary to={config.routes.home} className={cx('empty-btn')}>
                  Khám phá For You
               </Button>
            </div>
         </div>
      );
   }

   // 4. Trạng thái Đã Follow nhưng chưa có bài đăng nào
   if (followingPosts.length === 0) {
      return (
         <div className={cx('wrapper')}>
            <div className={cx('empty')}>
               <FontAwesomeIcon icon={faUserGroup} className={cx('empty-icon')} />
               <h3 className={cx('empty-title')}>Chưa có bài đăng nào</h3>
               <p className={cx('empty-desc')}>
                  Các tài khoản bạn đang theo dõi hiện chưa đăng bài viết nào. Hãy quay lại sau nhé!
               </p>
               <Button primary to={config.routes.home} className={cx('empty-btn')}>
                  Khám phá For You
               </Button>
            </div>
         </div>
      );
   }

   const currentPost = followingPosts[currentIndex];
   const currentAuthor = currentPost.user || {};
   const isLiked = !!likedMap[currentIndex];
   const currentLikesCount = likesCountMap[currentIndex] ?? currentPost.likes_count ?? 0;

   const hasVideo = currentPost.type === 'video' && !!currentPost.video_url && !videoErrorMap[currentPost.id];

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
                     alt={currentAuthor.full_name || currentAuthor.nickname}
                     className={cx('image')}
                     fallback={images.noImage}
                  />
               )}

               {/* Play overlay ở giữa khi Pause */}
               {hasVideo && !isPlaying && (
                  <div className={cx('play-overlay')}>
                     <FontAwesomeIcon icon={faPlay} />
                  </div>
               )}

               {/* Nút Âm thanh góc trên bên phải khi là Video */}
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

               {/* Thông tin tác giả và bài đăng */}
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

                  <div className={cx('badges-row')}>
                     <div className={cx('following-badge')}>
                        <FontAwesomeIcon icon={faCheck} style={{ fontSize: '1rem' }} />
                        <span>Đang theo dõi</span>
                     </div>
                     <div className={cx('media-badge')}>
                        <FontAwesomeIcon icon={hasVideo ? faVideo : faImage} style={{ fontSize: '1rem' }} />
                        <span>{hasVideo ? 'Video' : 'Ảnh'}</span>
                     </div>
                  </div>

                  {currentPost.caption && <p className={cx('caption')}>{currentPost.caption}</p>}

                  {currentPost.music && (
                     <div className={cx('music-row')}>
                        <FontAwesomeIcon icon={faMusic} style={{ fontSize: '1.1rem', marginRight: 4 }} />
                        <span>{currentPost.music}</span>
                     </div>
                  )}
               </div>

               {/* Action buttons: Thả tim, Bình luận, Chia sẻ */}
               <div className={cx('action-icons')}>
                  <button
                     className={cx('action-btn', { active: isLiked })}
                     onClick={handleToggleLike}
                     title={isLiked ? `Bỏ thích (${currentLikesCount})` : `Thích (${currentLikesCount})`}
                  >
                     <FontAwesomeIcon icon={faHeart} />
                  </button>

                  <button
                     className={cx('action-btn', { 'comment-active': isCommentsOpen })}
                     onClick={handleToggleComments}
                     title="Bình luận"
                  >
                     <FontAwesomeIcon icon={faCommentDots} />
                  </button>

                  <button className={cx('action-btn')} onClick={handleShare} title="Chia sẻ">
                     <FontAwesomeIcon icon={faShare} />
                  </button>
               </div>
            </div>

            {/* Comments Popup: Trượt mở sang bên phải video */}
            <div ref={commentsPanelRef} className={cx('comments-panel', { open: isCommentsOpen })}>
               <CommentsPopup
                  isOpen={isCommentsOpen}
                  onClose={() => setIsCommentsOpen(false)}
                  post={currentPost}
                  currentUser={currentUser}
                  openLoginModal={openLoginModal}
               />
            </div>

            {/* Nút điều hướng Lên / Xuống */}
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

export default Following;
