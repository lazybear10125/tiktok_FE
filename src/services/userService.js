import * as httpRequest from '~/utils/httpRequest';

export const getSuggested = async ({ page = 1, perPage = 20 } = {}) => {
   try {
      const res = await httpRequest.get('users/suggested', {
         params: {
            page,
            per_page: perPage,
         },
      });
      return res.data || [];
   } catch (error) {
      console.error('getSuggested error:', error);
      return [];
   }
};

export const getFollowing = async ({ page = 1, perPage = 20 } = {}) => {
   try {
      const res = await httpRequest.get('users/following', {
         params: {
            page,
            per_page: perPage,
         },
      });
      return res.data || [];
   } catch (error) {
      console.error('getFollowing error:', error);
      return [];
   }
};

export const BEAR_AVATAR =
   'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=100&h=100&crop=faces&q=80';

export const PERSONAL_USER = {
   id: 999,
   nickname: 'bear',
   first_name: 'Nguyễn',
   last_name: 'Cường',
   full_name: 'Nguyễn Cường',
   avatar: BEAR_AVATAR,
   bio: 'Lập trình viên Frontend & Yêu thích sáng tạo nội dung 🚀✨',
   tick: true,
   followings_count: 86,
   followers_count: 125000,
   likes_count: 890000,
   website_url: 'https://github.com/lazybear10125',
   is_personal: true,
};

export const getUser = async (nickname) => {
   const cleanNickname = nickname ? nickname.replace(/^@/, '') : '';
   if (!cleanNickname) return null;

   const isBear =
      cleanNickname.toLowerCase() === 'bear' ||
      cleanNickname.toLowerCase() === 'profile' ||
      cleanNickname.toLowerCase() === 'me';

   try {
      const res = await httpRequest.get(`users/@${cleanNickname}`);
      const data = res.data || null;
      if (data) {
         if (isBear || data.is_personal || data.nickname?.toLowerCase() === 'bear') {
            return {
               ...data,
               avatar: BEAR_AVATAR,
            };
         }
         return data;
      }
      if (isBear) return PERSONAL_USER;
      return null;
   } catch (error) {
      console.error('getUser error:', error);
      if (isBear) {
         return PERSONAL_USER;
      }
      return null;
   }
};

export const followUser = async (nickname) => {
   try {
      const cleanNickname = nickname ? nickname.replace(/^@/, '') : '';
      const res = await httpRequest.post(`users/@${cleanNickname}/follow`);
      if (typeof window !== 'undefined') {
         window.dispatchEvent(
            new CustomEvent('following-changed', {
               detail: { nickname: cleanNickname, isFollowed: true, user: res.data },
            }),
         );
      }
      return res.data;
   } catch (error) {
      console.error('followUser error:', error);
      throw error;
   }
};

export const unfollowUser = async (nickname) => {
   try {
      const cleanNickname = nickname ? nickname.replace(/^@/, '') : '';
      const res = await httpRequest.post(`users/@${cleanNickname}/unfollow`);
      if (typeof window !== 'undefined') {
         window.dispatchEvent(
            new CustomEvent('following-changed', {
               detail: { nickname: cleanNickname, isFollowed: false, user: res.data },
            }),
         );
      }
      return res.data;
   } catch (error) {
      console.error('unfollowUser error:', error);
      throw error;
   }
};

export const updateUser = async (nickname, data) => {
   try {
      const cleanNickname = nickname ? nickname.replace(/^@/, '') : '';
      const res = await httpRequest.patch(`users/@${cleanNickname}`, data);
      return res.data;
   } catch (error) {
      console.error('updateUser error:', error);
      throw error;
   }
};
