import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import config from '~/config';
import AuthModal from '~/components/AuthModal';

const AuthContext = createContext();

export function AuthProvider({ children }) {
   const location = useLocation();
   const navigate = useNavigate();

   const [currentUser, setCurrentUser] = useState(() => {
      const stored = localStorage.getItem('isLoggedIn');
      if (stored !== null) {
         return stored === 'true';
      }
      return location.pathname === config.routes.feed || location.pathname === '/foryou';
   });

   const [modalConfig, setModalConfig] = useState({
      isOpen: false,
      title: 'Bạn cần đăng nhập!',
      description: 'Vui lòng đăng nhập để theo dõi, tương tác và trải nghiệm đầy đủ các tính năng của TikTok.',
   });

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
         setCurrentUser(true);
         localStorage.setItem('isLoggedIn', 'true');
      } else if (location.pathname === config.routes.login) {
         setCurrentUser(false);
         localStorage.setItem('isLoggedIn', 'false');
      }
   }, [location.pathname]);

   const login = () => {
      setCurrentUser(true);
      localStorage.setItem('isLoggedIn', 'true');
      closeLoginModal();
      if (location.pathname === config.routes.home || location.pathname === config.routes.login) {
         navigate(config.routes.feed);
      }
   };

   const logout = () => {
      setCurrentUser(false);
      localStorage.setItem('isLoggedIn', 'false');
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
