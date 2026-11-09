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

export const login = async (credentials = {}) => {
   try {
      const payload = typeof credentials === 'string' ? { account: credentials } : { ...credentials };
      if (payload.account && !payload.nickname && !payload.username && !payload.email) {
         payload.nickname = payload.account;
         payload.username = payload.account;
      }
      const res = await httpRequest.post('auth/login', payload);
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
      return res.data || null;
   } catch (error) {
      console.error('getCurrentUser error:', error);
      return null;
   }
};
