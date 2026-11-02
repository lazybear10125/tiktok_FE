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

export const PERSONAL_USER = {
   id: 999,
   nickname: 'bear',
   first_name: 'Nguyễn',
   last_name: 'Cường',
   full_name: 'Nguyễn Cường (Bear)',
   avatar: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=100&h=100&crop=faces&q=80',
   bio: '🐻 Chào mừng đến với trang cá nhân của mình!\nLập trình viên Frontend & Yêu thích sáng tạo nội dung 🚀✨',
   tick: true,
   followings_count: 86,
   followers_count: 125000,
   likes_count: 890000,
   website_url: 'https://github.com/lazybear10125',
   is_personal: true,
};

export const getUser = async (nickname) => {
   try {
      const cleanNickname = nickname ? nickname.replace(/^@/, '') : '';
      if (!cleanNickname) return null;

      // Nếu là profile cá nhân
      if (
         cleanNickname.toLowerCase() === 'bear' ||
         cleanNickname.toLowerCase() === 'profile' ||
         cleanNickname.toLowerCase() === 'me'
      ) {
         return PERSONAL_USER;
      }

      const res = await httpRequest.get(`users/@${cleanNickname}`);
      return res.data;
   } catch (error) {
      console.error('getUser error:', error);
      return null;
   }
};
