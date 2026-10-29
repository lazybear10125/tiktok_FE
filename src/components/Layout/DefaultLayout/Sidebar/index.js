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

const cx = classNames.bind(styles);

const SUGGESTED_ACCOUNTS = [
   {
      id: 1,
      nickname: 'hoaa.hanassii',
      name: 'Đào Lê Phương Hoa',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      tick: true,
      followers: '14.2M',
      likes: '480.5M',
   },
   {
      id: 2,
      nickname: 'mocachodien',
      name: 'MOCA 🐶 VN',
      avatar: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=100&q=80',
      tick: true,
      followers: '3.1M',
      likes: '98.2M',
   },
   {
      id: 3,
      nickname: 'hoshiphan',
      name: 'Hoshi Phan',
      avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=100&q=80',
      tick: true,
      followers: '4.8M',
      likes: '120.3M',
   },
   {
      id: 4,
      nickname: 'jsol.dreams',
      name: 'JSOL',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80',
      tick: true,
      followers: '2.5M',
      likes: '55.6M',
   },
   {
      id: 5,
      nickname: 'vietphuongthoa98',
      name: 'Việt Phương Thoa',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80',
      tick: true,
      followers: '11.6M',
      likes: '340.1M',
   },
];

function Sidebar() {
   const { currentUser, login } = useAuth();

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
            <MenuItem
               title="LIVE"
               to={config.routes.live}
               icon={<LiveIcon />}
               activeIcon={<LiveActiveIcon />}
            />
         </Menu>

         {/* Phần nhắc nhở đăng nhập (chỉ hiển thị khi chưa login) */}
         {!currentUser && (
            <div className={cx('login')}>
               <p className={cx('login-tip')}>
                  Log in to follow creators, like videos, and view comments.
               </p>
               <Button outline className={cx('login-btn')} onClick={login}>
                  Log in
               </Button>
            </div>
         )}

         {/* Danh sách tài khoản gợi ý */}
         <SuggestedAccounts label="Suggested accounts" data={SUGGESTED_ACCOUNTS} />
      </aside>
   );
}

export default Sidebar;
