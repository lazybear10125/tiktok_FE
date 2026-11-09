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

   // Trạng thái người dùng đăng nhập: Chỉ khởi tạo true nếu có token hợp lệ và isLoggedIn === 'true'
   const [currentUser, setCurrentUser] = useState(() => {
      const stored = localStorage.getItem('isLoggedIn');
      const token = localStorage.getItem('token');
      if (stored === 'true' && token) {
         try {
            const cached = localStorage.getItem('user_profile');
            if (cached) {
               return JSON.parse(cached);
            }
         } catch {
            // ignore
         }
         return true;
      }
      return false;
   });

   const [modalConfig, setModalConfig] = useState({
      isOpen: false,
      title: 'Log in to TikTok',
      description: 'Log in to follow creators, like videos, and view comments.',
      initialView: 'select_method',
   });

   // Đồng bộ dữ liệu tài khoản từ backend khi khởi chạy ứng dụng
   useEffect(() => {
      const stored = localStorage.getItem('isLoggedIn');
      const token = localStorage.getItem('token');
      if (stored !== 'true' || !token) {
         setCurrentUser(false);
         return;
      }

      authServices
         .getCurrentUser()
         .then((userData) => {
            if (userData) {
               setCurrentUser(userData);
               localStorage.setItem('user_profile', JSON.stringify(userData));
               localStorage.setItem('isLoggedIn', 'true');
            } else {
               setCurrentUser(false);
               localStorage.setItem('isLoggedIn', 'false');
               authServices.removeToken();
            }
         })
         .catch(() => {
            setCurrentUser(false);
            localStorage.setItem('isLoggedIn', 'false');
            authServices.removeToken();
         });
   }, []);

   const openLoginModal = (options = {}) => {
      setModalConfig({
         isOpen: true,
         title: options.title || 'Log in to TikTok',
         description:
            options.description || 'Log in to follow creators, like videos, and view comments.',
         initialView: options.view || 'select_method',
      });
   };

   const closeLoginModal = () => {
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
   };

   // Route handling: nếu truy cập trực tiếp route /login, mở Login Modal và chuyển về feed/home
   useEffect(() => {
      if (location.pathname === config.routes.login) {
         openLoginModal();
         navigate(config.routes.feed, { replace: true });
      }
   }, [location.pathname, navigate]);

   // Xử lý Đăng nhập qua API backend thực tế (POST /api/auth/login)
   const login = async (credentials) => {
      try {
         const res = await authServices.login(credentials);
         const user = res.data || (await authServices.getCurrentUser()) || true;
         setCurrentUser(user);
         if (typeof user === 'object') {
            localStorage.setItem('user_profile', JSON.stringify(user));
         }
         localStorage.setItem('isLoggedIn', 'true');
         closeLoginModal();
         window.dispatchEvent(new CustomEvent('auth-login', { detail: { user } }));
         return res;
      } catch (error) {
         // Ném lỗi ra ngoài để AuthModal hiển thị thông báo lỗi trên form
         throw error;
      }
   };

   // Xử lý Đăng ký qua API backend thực tế (POST /api/auth/register)
   const register = async (data) => {
      try {
         const res = await authServices.register(data);
         const user = res.data || (await authServices.getCurrentUser()) || true;
         setCurrentUser(user);
         if (typeof user === 'object') {
            localStorage.setItem('user_profile', JSON.stringify(user));
         }
         localStorage.setItem('isLoggedIn', 'true');
         closeLoginModal();
         window.dispatchEvent(new CustomEvent('auth-login', { detail: { user } }));
         return res;
      } catch (error) {
         throw error;
      }
   };

   // Chức năng LOGOUT RESET TO ZERO: xóa sạch 100% dữ liệu cá nhân, đưa về trạng thái khách (Guest)
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
            isLoggedIn: !!currentUser,
            login,
            register,
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
            onRegister={register}
            initialView={modalConfig.initialView}
         />
      </AuthContext.Provider>
   );
}

export const useAuth = () => useContext(AuthContext);
