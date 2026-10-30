import * as httpRequest from '~/utils/httpRequest';

export const getSuggested = async ({ page = 1, perPage = 5 } = {}) => {
   try {
      const res = await httpRequest.get('users/suggested', {
         params: {
            page,
            per_page: perPage,
         },
      });
      return res.data;
   } catch (error) {
      console.error('getSuggested error:', error);
      return [];
   }
};

export const getFollowing = async ({ page = 1 } = {}) => {
   try {
      const res = await httpRequest.get('users/following', {
         params: {
            page,
         },
      });
      return res.data;
   } catch (error) {
      console.error('getFollowing error:', error);
      return [];
   }
};

export const getUser = async (nickname) => {
   try {
      const res = await httpRequest.get(`users/@${nickname}`);
      return res.data;
   } catch (error) {
      console.error('getUser error:', error);
      return null;
   }
};
