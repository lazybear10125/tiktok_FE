import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import Tippy from '@tippyjs/react/headless';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
   faCircleCheck,
   faLock,
   faShare,
   faEllipsis,
   faPenToSquare,
   faLink,
   faCheck,
   faCode,
   faPaperPlane,
   faFlag,
   faBan,
   faPlay,
   faCircleQuestion,
   faUser,
} from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faWhatsapp, faTwitter } from '@fortawesome/free-brands-svg-icons';

import Image from '~/components/Image';
import Button from '~/components/Button';
import { Wrapper as PopperWrapper } from '~/components/Popper';
import { useAuth } from '~/context/AuthContext';
import * as userServices from '~/services/userService';
import EditProfileModal from './EditProfileModal';
import images from '~/assets/images';
import styles from './Profile.module.scss';

const cx = classNames.bind(styles);

const profileMemoryCache = new Map();

const formatCount = (count) => {
   if (typeof count === 'number') {
      if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
      if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
      return count;
   }
   return count || '0';
};

function Profile() {
   const { currentUser, openLoginModal } = useAuth();
   let { nickname } = useParams();

   // Phân biệt My Profile vs Other User Profile:
   // Nếu route là /profile hoặc không có nickname trong URL, sử dụng nickname của tài khoản đang đăng nhập
   let targetNickname = nickname ? nickname.replace(/^@/, '').trim() : '';
   if (!targetNickname || targetNickname === 'profile' || targetNickname === 'me') {
      if (currentUser && typeof currentUser === 'object' && currentUser.nickname) {
         targetNickname = currentUser.nickname;
      }
   }
   const cleanNickname = targetNickname;

   const [user, setUser] = useState(null);
   const [userVideos, setUserVideos] = useState([]);
   const [loading, setLoading] = useState(true);
   const [activeTab, setActiveTab] = useState('videos');
   const [isFollowed, setIsFollowed] = useState(false);
   const [followersCount, setFollowersCount] = useState(0);
   const [showToast, setShowToast] = useState(false);
   const [toastMessage, setToastMessage] = useState('Link copied to clipboard!');
   const [isEditModalOpen, setIsEditModalOpen] = useState(false);

   const tabRefVideos = useRef(null);
   const tabRefFavorites = useRef(null);
   const tabRefLiked = useRef(null);
   const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

   // My Profile CHỈ TRUE khi ID hoặc nickname trùng khớp với authenticated currentUser
   const isMyProfile = Boolean(
      currentUser && cleanNickname && (
         (currentUser.nickname && currentUser.nickname.toLowerCase() === cleanNickname.toLowerCase()) ||
         (currentUser.id && user?.id && String(currentUser.id) === String(user.id))
      )
   );

   const avatarSrc = user?.avatar || user?.avatar_url || images.noImage;

   // Xóa cache và reset state khi đăng xuất hoặc đăng nhập tài khoản khác
   useEffect(() => {
      const handleAuthReset = () => {
         profileMemoryCache.clear();
         setIsFollowed(false);
         setIsEditModalOpen(false);
      };
      window.addEventListener('auth-logout', handleAuthReset);
      window.addEventListener('auth-login', handleAuthReset);
      return () => {
         window.removeEventListener('auth-logout', handleAuthReset);
         window.removeEventListener('auth-login', handleAuthReset);
      };
   }, []);

   useEffect(() => {
      if (!currentUser) {
         setIsFollowed(false);
         setIsEditModalOpen(false);
      }
   }, [currentUser]);

   // Lắng nghe sự kiện Follow/Unfollow từ các component khác
   useEffect(() => {
      const handleFollowingChange = (e) => {
         const { nickname: changedNick, isFollowed: changedFollowed, resetAll } = e.detail || {};
         if (resetAll) {
            setIsFollowed(false);
            return;
         }
         if (changedNick && cleanNickname && changedNick.toLowerCase() === cleanNickname.toLowerCase()) {
            setIsFollowed(!!changedFollowed);
            setFollowersCount((prev) => (changedFollowed ? prev + 1 : Math.max(0, prev - 1)));
         }
      };
      window.addEventListener('following-changed', handleFollowingChange);
      return () => window.removeEventListener('following-changed', handleFollowingChange);
   }, [cleanNickname]);

   // Fetch user profile and videos
   useEffect(() => {
      let isMounted = true;

      if (!cleanNickname) {
         setUser(null);
         setUserVideos([]);
         setLoading(false);
         return;
      }

      const cached = profileMemoryCache.get(cleanNickname.toLowerCase());
      if (cached) {
         setUser(cached);
         setIsFollowed(!!currentUser && !!cached.is_followed);
         setFollowersCount(cached.followers_count || 0);
         setLoading(false);
      } else {
         setLoading(true);
      }

      const fetchData = async () => {
         try {
            const [userData, videosData] = await Promise.all([
               userServices.getUser(cleanNickname),
               userServices.getUserVideos(cleanNickname),
            ]);

            if (!isMounted) return;

            if (userData) {
               profileMemoryCache.set(cleanNickname.toLowerCase(), userData);
               setUser(userData);
               setUserVideos(videosData || []);
               setIsFollowed(!!currentUser && !!userData.is_followed);
               setFollowersCount(userData.followers_count || 0);
            } else if (!cached) {
               setUser(null);
               setUserVideos([]);
            }
         } catch (err) {
            console.error('Fetch profile error:', err);
            if (isMounted && !cached) {
               setUser(null);
               setUserVideos([]);
            }
         } finally {
            if (isMounted) setLoading(false);
         }
      };

      fetchData();

      return () => {
         isMounted = false;
      };
   }, [cleanNickname, currentUser]);

   // Tab Indicator
   useEffect(() => {
      let currentTabRef = tabRefVideos.current;
      if (activeTab === 'videos') currentTabRef = tabRefVideos.current;
      else if (activeTab === 'favorites') currentTabRef = tabRefFavorites.current;
      else if (activeTab === 'liked') currentTabRef = tabRefLiked.current;

      if (currentTabRef) {
         setIndicatorStyle({
            left: currentTabRef.offsetLeft,
            width: currentTabRef.offsetWidth,
         });
      }
   }, [activeTab, loading]);

   const handleToggleFollow = async () => {
      if (!currentUser) {
         openLoginModal();
         return;
      }

      try {
         if (isFollowed) {
            setIsFollowed(false);
            setFollowersCount((prev) => Math.max(0, prev - 1));
            await userServices.unfollowUser(cleanNickname);
         } else {
            setIsFollowed(true);
            setFollowersCount((prev) => prev + 1);
            await userServices.followUser(cleanNickname);
         }
      } catch (err) {
         console.error('Toggle follow failed:', err);
      }
   };

   const handleActionRequiresAuth = () => {
      if (!currentUser) {
         openLoginModal();
         return;
      }
   };

   const handleOpenEditModal = () => {
      if (!currentUser) {
         openLoginModal();
         return;
      }
      setIsEditModalOpen(true);
   };

   const handleSaveProfile = async (updatedUser) => {
      try {
         await userServices.updateUser(cleanNickname, {
            full_name: updatedUser.full_name,
            bio: updatedUser.bio,
         });
         setUser((prev) => ({ ...prev, ...updatedUser }));
         profileMemoryCache.set(cleanNickname.toLowerCase(), { ...user, ...updatedUser });
      } catch (err) {
         console.error('Update profile API failed:', err);
      }
   };

   const handleCopyLink = () => {
      navigator.clipboard.writeText(window.location.href);
      setToastMessage('Link copied to clipboard!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
   };

   const ShareMenu = () => (
      <Tippy
         interactive
         delay={[0, 200]}
         offset={[0, 10]}
         placement="bottom-end"
         render={(attrs) => (
            <div className={cx('share-menu')} tabIndex="-1" {...attrs}>
               <PopperWrapper>
                  <div className={cx('share-list')}>
                     <button className={cx('share-item')} onClick={handleCopyLink}>
                        <FontAwesomeIcon icon={faLink} className={cx('share-icon')} />
                        <span className={cx('share-title')}>Copy link</span>
                     </button>
                     <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                        target="_blank"
                        rel="noreferrer"
                        className={cx('share-item')}
                     >
                        <FontAwesomeIcon icon={faFacebook} className={cx('share-icon')} />
                        <span className={cx('share-title')}>Share to Facebook</span>
                     </a>
                     <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(window.location.href)}`}
                        target="_blank"
                        rel="noreferrer"
                        className={cx('share-item')}
                     >
                        <FontAwesomeIcon icon={faWhatsapp} className={cx('share-icon')} />
                        <span className={cx('share-title')}>Share to WhatsApp</span>
                     </a>
                     <a
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`}
                        target="_blank"
                        rel="noreferrer"
                        className={cx('share-item')}
                     >
                        <FontAwesomeIcon icon={faTwitter} className={cx('share-icon')} />
                        <span className={cx('share-title')}>Share to Twitter</span>
                     </a>
                     <button className={cx('share-item')} onClick={handleCopyLink}>
                        <FontAwesomeIcon icon={faCode} className={cx('share-icon')} />
                        <span className={cx('share-title')}>Embed</span>
                     </button>
                  </div>
               </PopperWrapper>
            </div>
         )}
      >
         <button className={cx('action-icon-btn')} title="Share">
            <FontAwesomeIcon icon={faShare} />
         </button>
      </Tippy>
   );

   const renderMoreMenu = (attrs) => (
      <div className={cx('more-menu')} tabIndex="-1" {...attrs}>
         <PopperWrapper>
            <div className={cx('share-list')}>
               {isMyProfile ? (
                  <button className={cx('share-item')} onClick={handleOpenEditModal}>
                     <FontAwesomeIcon icon={faPenToSquare} className={cx('share-icon')} />
                     <span className={cx('share-title')}>Edit profile</span>
                  </button>
               ) : (
                  <>
                     <button className={cx('share-item')} onClick={handleActionRequiresAuth}>
                        <FontAwesomeIcon icon={faFlag} className={cx('share-icon')} />
                        <span className={cx('share-title')}>Report</span>
                     </button>
                     <button className={cx('share-item')} onClick={handleActionRequiresAuth}>
                        <FontAwesomeIcon icon={faBan} className={cx('share-icon')} />
                        <span className={cx('share-title')}>Block</span>
                     </button>
                  </>
               )}
            </div>
         </PopperWrapper>
      </div>
   );

   if (loading) {
      return (
         <div className={cx('wrapper')}>
            <div className={cx('header')}>
               <div className={cx('skeleton-avatar')} />
               <div className={cx('info')}>
                  <div className={cx('skeleton-text', 'large')} />
                  <div className={cx('skeleton-text', 'medium')} />
                  <div className={cx('skeleton-text', 'small')} style={{ marginTop: 20 }} />
               </div>
            </div>
            <div className={cx('tabs-container')}>
               <div className={cx('tab-btn')}>Videos</div>
               <div className={cx('tab-btn')}>Favorites</div>
               <div className={cx('tab-btn')}>Liked</div>
            </div>
         </div>
      );
   }

   if (!user) {
      return (
         <div className={cx('wrapper')}>
            <div className={cx('not-found')}>
               <div className={cx('not-found-icon')}>
                  <FontAwesomeIcon icon={faCircleQuestion} />
               </div>
               <h3 className={cx('not-found-title')}>
                  {!cleanNickname && !currentUser ? 'Log in to view your profile' : "Couldn't find this account"}
               </h3>
               <p className={cx('not-found-desc')}>
                  {!cleanNickname && !currentUser
                     ? 'Manage your account, check notifications, comment on videos, and more.'
                     : 'Looking for videos? Try browsing our trending creators, hashtags, and sounds.'}
               </p>
               {!cleanNickname && !currentUser ? (
                  <Button primary onClick={openLoginModal} className={cx('not-found-btn')}>
                     Log in
                  </Button>
               ) : (
                  <Button primary to="/" className={cx('not-found-btn')}>
                     Explore TikTok
                  </Button>
               )}
            </div>
         </div>
      );
   }

   return (
      <div className={cx('wrapper')}>
         {/* User Header */}
         <div className={cx('header')}>
            <div className={cx('avatar-wrapper')}>
               <Image className={cx('avatar')} src={avatarSrc} alt={user.nickname} />
            </div>

            <div className={cx('info')}>
               <div className={cx('title-container')}>
                  <div className={cx('nickname-row')}>
                     <h2 className={cx('nickname')}>{user.nickname}</h2>
                     {user.tick && <FontAwesomeIcon className={cx('check')} icon={faCircleCheck} />}
                  </div>
                  <h4 className={cx('name')}>
                     {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim()}
                  </h4>
               </div>

               {/* Action Buttons */}
               <div className={cx('actions-row')}>
                  {isMyProfile ? (
                     <button className={cx('edit-btn')} onClick={handleOpenEditModal}>
                        <FontAwesomeIcon icon={faPenToSquare} className={cx('edit-icon')} />
                        <span>Edit profile</span>
                     </button>
                  ) : (currentUser && isFollowed) ? (
                     <button className={cx('following-btn')} onClick={handleToggleFollow}>
                        <FontAwesomeIcon icon={faCheck} />
                        <span>Following</span>
                     </button>
                  ) : (
                     <Button primary className={cx('follow-btn')} onClick={handleToggleFollow}>
                        Follow
                     </Button>
                  )}

                  <ShareMenu />

                  <Tippy interactive delay={[0, 200]} offset={[0, 10]} placement="bottom-end" render={renderMoreMenu}>
                     <button className={cx('action-icon-btn')} title="More options">
                        <FontAwesomeIcon icon={faEllipsis} />
                     </button>
                  </Tippy>
               </div>

               {/* Analytics Counts */}
               <div className={cx('counts')}>
                  <div className={cx('count-item')}>
                     <strong className={cx('count-value')}>{formatCount(user.followings_count)}</strong>
                     <span className={cx('count-label')}>Following</span>
                  </div>
                  <div className={cx('count-item')}>
                     <strong className={cx('count-value')}>{formatCount(followersCount)}</strong>
                     <span className={cx('count-label')}>Followers</span>
                  </div>
                  <div className={cx('count-item')}>
                     <strong className={cx('count-value')}>{formatCount(user.likes_count)}</strong>
                     <span className={cx('count-label')}>Likes</span>
                  </div>
               </div>

               {/* Bio */}
               {user.bio && <p className={cx('bio')}>{user.bio}</p>}

               {/* Website Link */}
               {user.website_url && (
                  <a href={user.website_url} target="_blank" rel="noreferrer" className={cx('website-link')}>
                     <FontAwesomeIcon icon={faLink} className={cx('link-icon')} />
                     <span>{user.website_url.replace(/^https?:\/\//, '')}</span>
                  </a>
               )}
            </div>
         </div>

         {/* Navigation Tabs */}
         <div className={cx('tabs-container')}>
            <button
               ref={tabRefVideos}
               className={cx('tab-btn', { active: activeTab === 'videos' })}
               onClick={() => setActiveTab('videos')}
            >
               <span>Videos</span>
            </button>
            <button
               ref={tabRefFavorites}
               className={cx('tab-btn', { active: activeTab === 'favorites' })}
               onClick={() => setActiveTab('favorites')}
            >
               <FontAwesomeIcon icon={faLock} className={cx('tab-icon')} />
               <span>Favorites</span>
            </button>
            <button
               ref={tabRefLiked}
               className={cx('tab-btn', { active: activeTab === 'liked' })}
               onClick={() => setActiveTab('liked')}
            >
               <FontAwesomeIcon icon={faLock} className={cx('tab-icon')} />
               <span>Liked</span>
            </button>
            <div className={cx('tab-indicator')} style={{ left: indicatorStyle.left, width: indicatorStyle.width }} />
         </div>

         {/* Tab Content */}
         <div className={cx('tab-content')}>
            {activeTab === 'videos' && (
               userVideos.length > 0 ? (
                  <div className={cx('video-grid')}>
                     {userVideos.map((video, index) => (
                        <div key={video.id || index} className={cx('video-card')}>
                           {video.thumb_url || video.cover_image_url ? (
                              <img
                                 src={video.thumb_url || video.cover_image_url}
                                 alt={video.description || 'video'}
                                 className={cx('video-thumb')}
                              />
                           ) : (
                              <div className={cx('video-placeholder-center')}>
                                 <FontAwesomeIcon icon={faPlay} className={cx('play-center-icon')} />
                              </div>
                           )}
                           <div className={cx('video-card-footer')}>
                              <div className={cx('video-views')}>
                                 <FontAwesomeIcon icon={faPlay} className={cx('views-icon')} />
                                 <span>{formatCount(video.views_count || video.plays_count || 0)}</span>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className={cx('empty-tab')}>
                     <div className={cx('empty-icon-circle')}>
                        <FontAwesomeIcon icon={faUser} />
                     </div>
                     <h4 className={cx('empty-title')}>
                        {isMyProfile ? 'Upload your first video' : 'No content'}
                     </h4>
                     <p className={cx('empty-subtitle')}>
                        {isMyProfile
                           ? 'Your videos will appear here.'
                           : 'This user has not published any videos yet.'}
                     </p>
                  </div>
               )
            )}

            {activeTab === 'favorites' && (
               <div className={cx('empty-tab')}>
                  <div className={cx('empty-icon-circle')}>
                     <FontAwesomeIcon icon={faLock} />
                  </div>
                  <h4 className={cx('empty-title')}>
                     {isMyProfile ? 'Only you can see your favorites' : 'Favorite videos are private'}
                  </h4>
                  <p className={cx('empty-subtitle')}>
                     {isMyProfile
                        ? 'Your favorite videos will be displayed here privately.'
                        : 'Videos added to favorites by this user are currently hidden'}
                  </p>
               </div>
            )}

            {activeTab === 'liked' && (
               <div className={cx('empty-tab')}>
                  <div className={cx('empty-icon-circle')}>
                     <FontAwesomeIcon icon={faLock} />
                  </div>
                  <h4 className={cx('empty-title')}>
                     {isMyProfile ? 'Only you can see liked videos' : "This user's liked videos are private"}
                  </h4>
                  <p className={cx('empty-subtitle')}>
                     {isMyProfile
                        ? 'Videos you liked will be displayed here privately.'
                        : `Videos liked by ${user.nickname} are currently hidden`}
                  </p>
               </div>
            )}
         </div>

         {/* Edit Profile Modal */}
         {isEditModalOpen && isMyProfile && (
            <EditProfileModal
               user={{ ...user, avatar: avatarSrc }}
               onClose={() => setIsEditModalOpen(false)}
               onSave={handleSaveProfile}
            />
         )}

         {/* Toast Notification */}
         {showToast && (
            <div className={cx('toast')}>
               <FontAwesomeIcon icon={faCheck} />
               <span>{toastMessage}</span>
            </div>
         )}
      </div>
   );
}

export default Profile;
