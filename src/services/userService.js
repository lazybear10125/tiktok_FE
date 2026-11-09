import * as httpRequest from '~/utils/httpRequest';

export const DEFAULT_SUGGESTED_USERS = [
   {
      id: 1,
      first_name: 'Sơn',
      last_name: 'Đặng',
      full_name: 'Đặng Ngọc Sơn (Sơn Đặng)',
      nickname: 'sondn',
      avatar: 'https://tiktok-api-pq2d.onrender.com/avatars/sondn.jpg',
      tick: true,
   },
   {
      id: 2,
      first_name: 'Đào Lê',
      last_name: 'Phương Hoa',
      full_name: 'Đào Lê Phương Hoa',
      nickname: 'hoahanassii',
      avatar:
         'https://imgs.search.brave.com/blZB4VBWoKOlYRplFFaj5iDXMe2XMqgFFCI8SToli8U/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jZG4u/a2llbnRodWMubmV0/LnZuL2ltYWdlcy9j/NDczZDNlMDVlYjA3/MWFkYzIwOWViNGNm/ZmVmNzMzYzUzNTQ4/NGU4ODIwYzU5NmIy/MWFiMjA3OWQzZTgw/MGI0ZjA3NDEzN2E2/NmU2OTU4MGJkMjlm/MzRkZTc1M2JjNDdj/ZTZmNjljY2I2YWYz/ZmVmMWEzMjA3MGFh/NzRmZjYzNTBiMmJl/NTZlMzY3YzM0OGJk/NjZlNDYwOTIzMmJl/MTI3MmRjOTU2ZTdj/MGIxYTUwYjM3MzVl/ZDQxNmY5N2U5YjVj/YThkMGI4YzMzYzJj/NDRlMmYwY2UwZWJm/ZjNhMDc2ZS92by1x/dW9jLWRhbi1kYW8t/bGUtcGh1b25nLWhv/YS1iYXQtbmdvLWxh/bS1kYW0tY3VvaS1I/aW5oLTguSlBH',
      tick: true,
   },
   {
      id: 3,
      first_name: 'Bùi Thảo',
      last_name: 'Ly',
      full_name: 'CiiN (Bùi Thảo Ly)',
      nickname: 'ciin99',
      avatar: 'https://tiktok-api-pq2d.onrender.com/avatars/ciin99.jpg',
      tick: true,
   },
   {
      id: 4,
      first_name: 'Lê Xuân',
      last_name: 'Anh',
      full_name: 'Lê Bống (Lê Xuân Anh)',
      nickname: 'lebong95',
      avatar:
         'https://imgs.search.brave.com/ASwACbM1V02IRDTo3gRpUShfV9jeLpFGqukIrFIRimQ/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9kYW52/aWV0LmV4LWNkbi5j/b20vZmlsZXMvZjEv/Mjk2MjMxNTY5ODQ5/MTkyNDQ4LzIwMjUv/Mi84LzQ3NjE2MTEz/Mjk0MDU2MDc0MDYx/NjIyODcyNjY5Njkx/MDcxOTY3MTcyMDU0/bi0xNzM5MDM2MzEx/MDQ1ODcwNTU5NjUu/anBn',
      tick: true,
   },
   {
      id: 5,
      first_name: 'Huỳnh Trấn',
      last_name: 'Thành',
      full_name: 'Trấn Thành',
      nickname: 'tranthanh.official',
      avatar: 'https://tiktok-api-pq2d.onrender.com/avatars/tranthanh.jpg',
      tick: true,
   },
   {
      id: 8,
      first_name: 'Khaby',
      last_name: 'Lame',
      full_name: 'Khaby Lame',
      nickname: 'khaby.lame',
      avatar: 'https://tiktok-api-pq2d.onrender.com/avatars/khaby.jpg',
      tick: true,
   },
   {
      id: 11,
      first_name: 'Độ',
      last_name: 'Mixi',
      full_name: 'Độ Phùng (Độ Mixi)',
      nickname: 'mixigaming',
      avatar: 'https://tiktok-api-pq2d.onrender.com/avatars/domixi.jpg',
      tick: true,
   },
   {
      id: 16,
      first_name: 'Ngô',
      last_name: 'Đức Duy',
      full_name: 'Duy Thẩm (Schanel)',
      nickname: 'duythamchannel',
      avatar: 'https://tiktok-api-pq2d.onrender.com/avatars/duytham.jpg',
      tick: true,
   },
   {
      id: 21,
      first_name: 'Sơn Tùng',
      last_name: 'M-TP',
      full_name: 'Sơn Tùng M-TP',
      nickname: 'sontungmtp',
      avatar: 'https://tiktok-api-pq2d.onrender.com/avatars/sontungmtp.jpg',
      tick: true,
   },
   {
      id: 30,
      first_name: 'Đen',
      last_name: 'Vâu',
      full_name: 'Đen Vâu (Nguyễn Đức Cường)',
      nickname: 'denvau.official',
      avatar: 'https://tiktok-api-pq2d.onrender.com/avatars/denvau.jpg',
      tick: true,
   },
];

export const getSuggested = async ({ page = 1, perPage = 20 } = {}) => {
   try {
      const res = await httpRequest.get('users/suggested', {
         params: {
            page,
            per_page: perPage,
         },
      });
      if (res && Array.isArray(res.data) && res.data.length > 0) {
         return res.data;
      }
      return DEFAULT_SUGGESTED_USERS;
   } catch (error) {
      console.error('getSuggested error:', error);
      return DEFAULT_SUGGESTED_USERS;
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

export const getUser = async (nickname) => {
   const cleanNickname = nickname ? nickname.replace(/^@/, '').trim() : '';
   if (!cleanNickname) return null;

   try {
      const res = await httpRequest.get(`users/@${cleanNickname}`);
      return res.data || null;
   } catch (error) {
      console.error('getUser error:', error);
      return null;
   }
};

export const getUserVideos = async (nickname) => {
   const cleanNickname = nickname ? nickname.replace(/^@/, '').trim() : '';
   if (!cleanNickname) return [];

   try {
      const res = await httpRequest.get(`users/@${cleanNickname}/videos`);
      return res.data || [];
   } catch (error) {
      console.error('getUserVideos error:', error);
      return [];
   }
};

export const followUser = async (nickname) => {
   try {
      const cleanNickname = nickname ? nickname.replace(/^@/, '').trim() : '';
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
      const cleanNickname = nickname ? nickname.replace(/^@/, '').trim() : '';
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
      const cleanNickname = nickname ? nickname.replace(/^@/, '').trim() : '';
      const res = await httpRequest.patch(`users/@${cleanNickname}`, data);
      return res.data;
   } catch (error) {
      console.error('updateUser error:', error);
      throw error;
   }
};
