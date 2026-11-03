import * as httpRequest from '~/utils/httpRequest';

export const getVideos = async ({ type = 'for-you', page = 1 } = {}) => {
   try {
      const res = await httpRequest.get('videos', {
         params: {
            type,
            page,
         },
      });
      return res.data || [];
   } catch (error) {
      console.error('getVideos error:', error);
      return [];
   }
};

export const likeVideo = async (videoId) => {
   try {
      const res = await httpRequest.post(`videos/${videoId}/like`);
      return res.data;
   } catch (error) {
      console.error('likeVideo error:', error);
      throw error;
   }
};

export const unlikeVideo = async (videoId) => {
   try {
      const res = await httpRequest.post(`videos/${videoId}/unlike`);
      return res.data;
   } catch (error) {
      console.error('unlikeVideo error:', error);
      throw error;
   }
};

export const getComments = async (videoId) => {
   try {
      const res = await httpRequest.get(`videos/${videoId}/comments`);
      return res.data || [];
   } catch (error) {
      console.error('getComments error:', error);
      return [];
   }
};

export const addComment = async (videoId, comment) => {
   try {
      const res = await httpRequest.post(`videos/${videoId}/comments`, {
         comment,
      });
      return res.data;
   } catch (error) {
      console.error('addComment error:', error);
      throw error;
   }
};
