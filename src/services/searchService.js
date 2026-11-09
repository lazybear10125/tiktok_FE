import * as httpRequest from '~/utils/httpRequest';

export const search = async (q, type = 'less') => {
   try {
      const cleanQ = q ? q.replace(/^@/, '').trim() : '';
      if (!cleanQ) return [];
      const res = await httpRequest.get('users/search', {
         params: {
            q: cleanQ,
            type,
         },
      });
      return res.data || [];
   } catch (error) {
      console.error('search error:', error);
      return [];
   }
};
