import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import Tippy from '@tippyjs/react/headless';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
   faCircleCheck,
   faEllipsis,
   faLink,
   faLock,
   faFlag,
   faBan,
   faCheck,
   faCircleQuestion,
   faFilm,
   faPenToSquare,
   faGear,
} from '@fortawesome/free-solid-svg-icons';

import Image from '~/components/Image';
import Button from '~/components/Button';
import { Wrapper as PopperWrapper } from '~/components/Popper';
import { useAuth } from '~/context/AuthContext';
import * as userServices from '~/services/userService';
import ShareMenu from './ShareMenu';
import EditProfileModal from './EditProfileModal';
import styles from './Profile.module.scss';

const cx = classNames.bind(styles);

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

   // Khi truy cập /profile hoặc không có nickname, mặc định mở profile cá nhân ('bear')
   if (!nickname || nickname === 'profile') {
      nickname = 'bear';
   }

   const cleanNickname = nickname.replace(/^@/, '');
   const isBearNickname =
      cleanNickname.toLowerCase() === 'bear' ||
      cleanNickname.toLowerCase() === 'profile' ||
      cleanNickname.toLowerCase() === 'me';

   const BEAR_AVATAR =
      'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=100&h=100&crop=faces&q=80';

   const [user, setUser] = useState(null);
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

   const isMyProfile =
      !!currentUser &&
      (isBearNickname || !!user?.is_personal || user?.nickname?.toLowerCase() === 'bear');

   const avatarSrc =
      isMyProfile || isBearNickname || user?.is_personal || user?.nickname?.toLowerCase() === 'bear'
         ? BEAR_AVATAR
         : user?.avatar;

   useEffect(() => {
      let isMounted = true;
      setLoading(true);

      const fetchData = async () => {
         try {
            const userData = await userServices.getUser(cleanNickname);
            if (!isMounted) return;

            if (userData) {
               if (isBearNickname || userData.is_personal || userData.nickname?.toLowerCase() === 'bear') {
                  userData.avatar = BEAR_AVATAR;
               }
               setUser(userData);
               setIsFollowed(!!userData.is_followed);
               setFollowersCount(userData.followers_count || 0);
            } else {
               setUser(null);
            }
         } catch (err) {
            console.error('Fetch profile error:', err);
            if (isMounted) setUser(null);
         } finally {
            if (isMounted) setLoading(false);
         }
      };

      fetchData();

      return () => {
         isMounted = false;
      };
   }, [cleanNickname, isBearNickname]);

   useEffect(() => {
      let currentTabRef;
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
      } catch (err) {
         console.error('Update profile API failed:', err);
      }
      setUser(updatedUser);
      setToastMessage('Profile updated successfully!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
   };

   const renderMoreMenu = (attrs) => (
      <div className={cx('share-menu')} tabIndex="-1" {...attrs}>
         <PopperWrapper>
            <div className={cx('share-list')}>
               {isMyProfile ? (
                  <button className={cx('share-item')}>
                     <FontAwesomeIcon icon={faGear} className={cx('share-icon')} />
                     <span className={cx('share-title')}>Settings</span>
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
               <h3 className={cx('not-found-title')}>Couldn't find this account</h3>
               <p className={cx('not-found-desc')}>
                  Looking for videos? Try browsing our trending creators, hashtags, and sounds.
               </p>
               <Button primary to="/" className={cx('not-found-btn')}>
                  Explore TikTok
               </Button>
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
                  ) : isFollowed ? (
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

         {/* Tabs Navigation */}
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
               <FontAwesomeIcon icon={faLock} className={cx('tab-lock')} />
               <span>Favorites</span>
            </button>
            <button
               ref={tabRefLiked}
               className={cx('tab-btn', { active: activeTab === 'liked' })}
               onClick={() => setActiveTab('liked')}
            >
               <FontAwesomeIcon icon={faLock} className={cx('tab-lock')} />
               <span>Liked</span>
            </button>
            <div className={cx('tab-indicator')} style={{ left: indicatorStyle.left, width: indicatorStyle.width }} />
         </div>

         {/* Tab Content */}
         <div className={cx('tab-content')}>
            {activeTab === 'videos' && (
               <div className={cx('empty-tab')}>
                  <div className={cx('empty-icon-circle')}>
                     <FontAwesomeIcon icon={faFilm} />
                  </div>
                  <h4 className={cx('empty-title')}>No content</h4>
                  <p className={cx('empty-subtitle')}>
                     {isMyProfile
                        ? 'Your videos will appear here once you post them.'
                        : 'This user has not published any videos yet.'}
                  </p>
               </div>
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
