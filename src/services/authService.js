import * as httpRequest from '~/utils/httpRequest';

export const login = async ({ email, password } = {}) => {
   try {
      const res = await httpRequest.post('auth/login', {
         email,
         password,
      });
      if (res.token) {
         localStorage.setItem('token', res.token);
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
         localStorage.setItem('token', res.token);
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
      return res.data;
   } catch (error) {
      console.error('getCurrentUser error:', error);
      return null;
   }
};
