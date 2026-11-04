import { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './Sidebar.module.scss';
import Menu, { MenuItem } from './Menu';
import {
   HomeIcon,
   HomeActiveIcon,
   UserGroupIcon,
   UserGroupActiveIcon,
   LiveIcon,
   LiveActiveIcon,
} from '~/components/Icons';
import SuggestedAccounts from '~/components/SuggestedAccounts';
import Button from '~/components/Button';
import Image from '~/components/Image';
import images from '~/assets/images';
import config from '~/config';
import { useAuth } from '~/context/AuthContext';
import * as userServices from '~/services/userService';

const cx = classNames.bind(styles);

function Sidebar() {
   const { currentUser, login } = useAuth();
   const [suggestedUsers, setSuggestedUsers] = useState([]);
   const [followingUsers, setFollowingUsers] = useState([]);

   useEffect(() => {
      userServices
         .getSuggested({ page: 1, perPage: 20 })
         .then((data) => {
            if (data && data.length > 0) {
               setSuggestedUsers(data);
            }
         })
         .catch((err) => console.error(err));
   }, []);

   useEffect(() => {
      if (currentUser) {
         userServices
            .getFollowing({ page: 1, perPage: 20 })
            .then((data) => {
               if (data && data.length > 0) {
                  setFollowingUsers(data);
               }
            })
            .catch((err) => console.error(err));
      } else {
         setFollowingUsers([]);
      }
   }, [currentUser]);

   // Cập nhật danh sách Following accounts ở sidebar ngay lập tức khi follow/unfollow
   useEffect(() => {
      const handleFollowingChange = (e) => {
         const { nickname, isFollowed, user } = e.detail || {};
         setFollowingUsers((prev) => {
            if (!isFollowed) {
               return prev.filter((u) => u.nickname !== nickname);
            }
            if (user && !prev.some((u) => u.nickname === nickname)) {
               return [user, ...prev];
            }
            return prev;
         });
      };

      window.addEventListener('following-changed', handleFollowingChange);
      return () => {
         window.removeEventListener('following-changed', handleFollowingChange);
      };
   }, []);

   const userAvatar = (
      <Image
         style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
         src={
            currentUser?.nickname === 'bear' || !currentUser?.avatar
               ? 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=100&h=100&crop=faces&q=80'
               : currentUser.avatar
         }
         alt={currentUser?.full_name || 'Profile'}
         fallback={images.noImage}
      />
   );

   return (
      <aside className={cx('wrapper')}>
         <Menu>
            <MenuItem
               title="For You"
               to={config.routes.home}
               icon={<HomeIcon />}
               activeIcon={<HomeActiveIcon />}
            />
            <MenuItem
               title="Following"
               to={config.routes.following}
               icon={<UserGroupIcon />}
               activeIcon={<UserGroupActiveIcon />}
            />
            <MenuItem title="LIVE" to={config.routes.live} icon={<LiveIcon />} activeIcon={<LiveActiveIcon />} />
            {currentUser && (
               <MenuItem
                  title="Profile"
                  to={currentUser?.nickname ? `/@${currentUser.nickname}` : '/@bear'}
                  icon={userAvatar}
                  activeIcon={userAvatar}
               />
            )}
         </Menu>

         {!currentUser && (
            <div className={cx('login')}>
               <p className={cx('login-tip')}>Log in to follow creators, like videos, and view comments.</p>
               <Button outline className={cx('login-btn')} onClick={login}>
                  Log in
               </Button>
            </div>
         )}

         <SuggestedAccounts label="Suggested accounts" data={suggestedUsers} defaultVisible={5} />
         {currentUser && <SuggestedAccounts label="Following accounts" data={followingUsers} defaultVisible={5} />}
      </aside>
   );
}

export default Sidebar;
