import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import config from '~/config';
import AuthModal from '~/components/AuthModal';
import * as authServices from '~/services/authService';
import { clearSearchHistory } from '~/utils/searchHistory';

const AuthContext = createContext();

export function AuthProvider({ children }) {
   const location = useLocation();
   const navigate = useNavigate();

   // Mặc định đăng nhập tài khoản có sẵn khi mở website lần đầu (khi isLoggedIn !== 'false')
   const [currentUser, setCurrentUser] = useState(() => {
      const stored = localStorage.getItem('isLoggedIn');
      if (stored === 'false') {
         return false;
      }
      return true;
   });

   const [modalConfig, setModalConfig] = useState({
      isOpen: false,
      title: 'Bạn cần đăng nhập!',
      description: 'Vui lòng đăng nhập để theo dõi, tương tác và trải nghiệm đầy đủ các tính năng của TikTok.',
   });

   useEffect(() => {
      const stored = localStorage.getItem('isLoggedIn');
      if (stored === 'false') {
         setCurrentUser(false);
         return;
      }

      authServices
         .getCurrentUser()
         .then((userData) => {
            if (userData) {
               setCurrentUser(userData);
               localStorage.setItem('isLoggedIn', 'true');
            }
         })
         .catch(() => {});
   }, []);

   const openLoginModal = (options = {}) => {
      setModalConfig({
         isOpen: true,
         title: options.title || 'Bạn cần đăng nhập!',
         description:
            options.description ||
            'Vui lòng đăng nhập để theo dõi, tương tác và trải nghiệm đầy đủ các tính năng của TikTok.',
      });
   };

   const closeLoginModal = () => {
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
   };

   // Route handling: không tự động đăng nhập lại nếu phiên đã bị Logout
   useEffect(() => {
      const stored = localStorage.getItem('isLoggedIn');
      if (stored === 'false') {
         if (currentUser) setCurrentUser(false);
         return;
      }

      if (location.pathname === config.routes.feed || location.pathname === '/foryou') {
         if (!currentUser) setCurrentUser(true);
         localStorage.setItem('isLoggedIn', 'true');
      } else if (location.pathname === config.routes.login) {
         setCurrentUser(false);
         localStorage.setItem('isLoggedIn', 'false');
      }
   }, [location.pathname, currentUser]);

   const login = async (credentials) => {
      try {
         const res = await authServices.login(credentials);
         if (res && res.data) {
            setCurrentUser(res.data);
         } else {
            setCurrentUser(true);
         }
      } catch {
         setCurrentUser(true);
      }
      localStorage.setItem('isLoggedIn', 'true');
      closeLoginModal();
      if (location.pathname === config.routes.home || location.pathname === config.routes.login) {
         navigate(config.routes.feed);
      }
   };

   // Chức năng LOGOUT RESET TO ZERO: xóa sạch 100% dữ liệu cá nhân, đưa về trạng thái trắng tinh
   const logout = () => {
      // 1. Reset state user
      setCurrentUser(false);

      // 2. Đánh dấu trạng thái đã logout để khi refresh không tự đăng nhập lại
      localStorage.setItem('isLoggedIn', 'false');

      // 3. Xóa JWT Token xác thực
      authServices.removeToken();
      localStorage.removeItem('token');

      // 4. Xóa toàn bộ lịch sử tìm kiếm
      clearSearchHistory();

      // 5. Xóa toàn bộ dữ liệu cá nhân (Following, Followers, Likes, Saved, Cache, Watch history)
      const userStorageKeys = [
         'token',
         'user',
         'user_profile',
         'currentUser',
         'tiktok_user',
         'tiktok_search_history',
         'tiktok_watch_history',
         'watch_history',
         'liked_videos',
         'saved_videos',
         'following',
         'followers',
         'notifications',
         'inbox_messages',
         'comments_cache',
      ];
      userStorageKeys.forEach((key) => {
         try {
            localStorage.removeItem(key);
         } catch {
            // ignore
         }
      });

      // 6. Xóa toàn bộ sessionStorage
      try {
         sessionStorage.clear();
      } catch {
         // ignore
      }

      // 7. Đóng modal nếu đang mở
      closeLoginModal();

      // 8. Phát sự kiện toàn cục để toàn bộ components reset state nội bộ về 0 ngay lập tức
      window.dispatchEvent(new CustomEvent('auth-logout'));
      window.dispatchEvent(
         new CustomEvent('following-changed', {
            detail: { isFollowed: false, resetAll: true },
         }),
      );

      // 9. Điều hướng về trang chủ công khai
      navigate(config.routes.home);
   };

   return (
      <AuthContext.Provider
         value={{
            currentUser,
            setCurrentUser,
            login,
            logout,
            openLoginModal,
            closeLoginModal,
         }}
      >
         {children}
         <AuthModal
            isOpen={modalConfig.isOpen}
            onClose={closeLoginModal}
            onLogin={login}
            title={modalConfig.title}
            description={modalConfig.description}
         />
      </AuthContext.Provider>
   );
}

export const useAuth = () => useContext(AuthContext);
