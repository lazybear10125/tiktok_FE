import axios from 'axios';

const httpRequest = axios.create({
   baseURL: import.meta.env.VITE_BASE_URL || 'https://tiktok-api-pq2d.onrender.com/api/',
});

httpRequest.interceptors.request.use((config) => {
   const token = localStorage.getItem('token');
   if (token) {
      config.headers.Authorization = `Bearer ${token}`;
   }
   return config;
});

export const get = async (path, options = {}) => {
   const response = await httpRequest.get(path, options);
   return response.data;
};

export const post = async (path, data = {}, options = {}) => {
   const response = await httpRequest.post(path, data, options);
   return response.data;
};

export const patch = async (path, data = {}, options = {}) => {
   const response = await httpRequest.patch(path, data, options);
   return response.data;
};

export const del = async (path, options = {}) => {
   const response = await httpRequest.delete(path, options);
   return response.data;
};

export default httpRequest;
