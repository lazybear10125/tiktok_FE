import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import config from '~/config';

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

   useEffect(() => {
      if (location.pathname === config.routes.feed || location.pathname === '/foryou') {
         setCurrentUser(true);
         localStorage.setItem('isLoggedIn', 'true');
      } else if (location.pathname === config.routes.home || location.pathname === config.routes.login) {
         setCurrentUser(false);
         localStorage.setItem('isLoggedIn', 'false');
      }
   }, [location.pathname]);

   const login = () => {
      setCurrentUser(true);
      localStorage.setItem('isLoggedIn', 'true');
      navigate(config.routes.feed);
   };

   const logout = () => {
      setCurrentUser(false);
      localStorage.setItem('isLoggedIn', 'false');
      navigate(config.routes.home);
   };

   return (
      <AuthContext.Provider value={{ currentUser, setCurrentUser, login, logout }}>
         {children}
      </AuthContext.Provider>
   );
}

export const useAuth = () => useContext(AuthContext);
