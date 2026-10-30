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
         .getSuggested({ page: 1, perPage: 5 })
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
            .getFollowing({ page: 1 })
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

   const userAvatar = (
      <img
         style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
         src="https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=100&h=100&crop=faces&q=80"
         alt="Profile"
      />
   );

   return (
      <aside className={cx('wrapper')}>
         <Menu>
            <MenuItem
               title="For You"
               to={currentUser ? config.routes.feed : config.routes.home}
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
            {currentUser && <MenuItem title="Profile" to="/@hoahanassii" icon={userAvatar} activeIcon={userAvatar} />}
         </Menu>

         {!currentUser && (
            <div className={cx('login')}>
               <p className={cx('login-tip')}>Log in to follow creators, like videos, and view comments.</p>
               <Button outline className={cx('login-btn')} onClick={login}>
                  Log in
               </Button>
            </div>
         )}

         <SuggestedAccounts label="Suggested accounts" data={suggestedUsers} />
         {currentUser && <SuggestedAccounts label="Following accounts" data={followingUsers} />}
      </aside>
   );
}

export default Sidebar;
