import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import config from '~/config';
import AuthModal from '~/components/AuthModal';
import * as authServices from '~/services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
   const location = useLocation();
   const navigate = useNavigate();

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

   // Tự động tải thông tin tài khoản hiện tại từ Backend API
   useEffect(() => {
      const stored = localStorage.getItem('isLoggedIn');
      if (stored !== 'false') {
         authServices
            .getCurrentUser()
            .then((userData) => {
               if (userData) {
                  setCurrentUser(userData);
                  localStorage.setItem('isLoggedIn', 'true');
               }
            })
            .catch(() => {});
      }
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

   useEffect(() => {
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

   const logout = () => {
      setCurrentUser(false);
      localStorage.setItem('isLoggedIn', 'false');
      localStorage.removeItem('token');
      closeLoginModal();
      if (
         location.pathname === config.routes.feed ||
         location.pathname === '/foryou' ||
         location.pathname === config.routes.upload
      ) {
         navigate(config.routes.home);
      }
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
