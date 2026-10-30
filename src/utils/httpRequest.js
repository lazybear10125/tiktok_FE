import axios from 'axios';

const httpRequest = axios.create({
   baseURL: import.meta.env.VITE_BASE_URL || 'https://tiktok-api-pq2d.onrender.com/api/',
});

export const get = async (path, options = {}) => {
   const response = await httpRequest.get(path, options);
   return response.data;
};

export default httpRequest;
