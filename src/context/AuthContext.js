import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import config from '~/config';

const AuthContext = createContext();

export function AuthProvider({ children }) {
   const location = useLocation();
   const navigate = useNavigate();

   // Mặc định đăng nhập nếu ở route feed hoặc foryou, ngược lại chưa đăng nhập
   const isFeedRoute = location.pathname === config.routes.feed || location.pathname === '/foryou';
   const [currentUser, setCurrentUser] = useState(isFeedRoute);

   useEffect(() => {
      if (location.pathname === config.routes.feed || location.pathname === '/foryou') {
         setCurrentUser(true);
      } else if (location.pathname === config.routes.home || location.pathname === config.routes.login) {
         setCurrentUser(false);
      }
   }, [location.pathname]);

   const login = () => {
      setCurrentUser(true);
      navigate(config.routes.feed);
   };

   const logout = () => {
      setCurrentUser(false);
      navigate(config.routes.home);
   };

   return (
      <AuthContext.Provider value={{ currentUser, setCurrentUser, login, logout }}>
         {children}
      </AuthContext.Provider>
   );
}

export const useAuth = () => useContext(AuthContext);
