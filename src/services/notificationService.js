import * as httpRequest from '~/utils/httpRequest';

export const getNotifications = async ({ type = 'all', page = 1, perPage = 20 } = {}) => {
   try {
      const res = await httpRequest.get('notifications', {
         params: {
            type,
            page,
            per_page: perPage,
         },
      });
      return {
         data: res.data || [],
         meta: res.meta || { unread_count: 0 },
      };
   } catch (error) {
      console.error('getNotifications error:', error);
      return { data: [], meta: { unread_count: 0 } };
   }
};

export const getUnreadCount = async () => {
   try {
      const res = await httpRequest.get('notifications/unread-count');
      return res.data?.unread_count ?? res.unread_count ?? 0;
   } catch (error) {
      console.error('getUnreadCount error:', error);
      return 0;
   }
};

export const markAsRead = async (id) => {
   try {
      const res = await httpRequest.put(`notifications/${id}/read`);
      return res.data;
   } catch (error) {
      console.error('markAsRead error:', error);
      throw error;
   }
};

export const markAllAsRead = async () => {
   try {
      const res = await httpRequest.put('notifications/read-all');
      return res;
   } catch (error) {
      console.error('markAllAsRead error:', error);
      throw error;
   }
};

export const deleteNotification = async (id) => {
   try {
      const res = await httpRequest.del(`notifications/${id}`);
      return res;
   } catch (error) {
      console.error('deleteNotification error:', error);
      throw error;
   }
};

export const clearAllNotifications = async () => {
   try {
      const res = await httpRequest.del('notifications');
      return res;
   } catch (error) {
      console.error('clearAllNotifications error:', error);
      throw error;
   }
};
