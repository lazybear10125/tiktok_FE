import * as httpRequest from '~/utils/httpRequest';

export const getVideos = async ({ type = 'for-you', page = 1 } = {}) => {
   try {
      const res = await httpRequest.get('videos', {
         params: {
            type,
            page,
         },
      });
      return res.data;
   } catch (error) {
      console.error('getVideos error:', error);
      return [];
   }
};
