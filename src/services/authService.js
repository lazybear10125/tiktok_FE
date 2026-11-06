import * as httpRequest from '~/utils/httpRequest';

export const getToken = () => {
   return localStorage.getItem('token');
};

export const setToken = (token) => {
   localStorage.setItem('token', token);
};

export const removeToken = () => {
   localStorage.removeItem('token');
};

export const login = async ({ email, password } = {}) => {
   try {
      const res = await httpRequest.post('auth/login', {
         email,
         password,
      });
      if (res.token) {
         setToken(res.token);
      }
      return res;
   } catch (error) {
      console.error('login error:', error);
      throw error;
   }
};

export const register = async (data = {}) => {
   try {
      const res = await httpRequest.post('auth/register', data);
      if (res.token) {
         setToken(res.token);
      }
      return res;
   } catch (error) {
      console.error('register error:', error);
      throw error;
   }
};

export const getCurrentUser = async () => {
   try {
      const res = await httpRequest.get('auth/me');
      const data = res.data;
      if (data && (data.nickname === 'bear' || data.is_personal)) {
         data.avatar =
            'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=100&h=100&crop=faces&q=80';
      }
      return data;
   } catch (error) {
      console.error('getCurrentUser error:', error);
      return null;
   }
};
