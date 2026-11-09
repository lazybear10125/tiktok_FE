require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const pool = require('./db');
const initDatabase = require('./scripts/init-db');

// Dữ liệu mock dự phòng cho Cloud Render
let mockUsers = require('./data/users');
let mockVideos = require('./data/videos');
let mockComments = require('./data/comments');
let mockLives = require('./data/lives');
let mockFollows = [];
let mockNotifications = [];
try {
  mockNotifications = require('./data/notifications');
} catch (e) {
  mockNotifications = [];
}

// Khoi tao mockFollows cho Bear (id = 999)
mockUsers.forEach((u) => {
  if (u.is_followed && u.id !== 999) {
    mockFollows.push({ follower_id: 999, following_id: u.id });
  }
});

const app = express();
let isMySQLActive = false;

// ==========================================
// MIDDLEWARES
// ==========================================
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Cung cấp thư mục chứa toàn bộ ảnh avatar thật của idol
app.use('/avatars', express.static(path.join(__dirname, 'public/avatars')));

// ==========================================
// HELPER FUNCTIONS
// ==========================================
const getBaseUrl = (req) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}`;
};

const resolveMediaUrl = (fileOrUrl, baseUrl) => {
  if (!fileOrUrl) return null;
  if (fileOrUrl.startsWith('http://') || fileOrUrl.startsWith('https://')) {
    return fileOrUrl;
  }
  return `${baseUrl}/avatars/${fileOrUrl}`;
};

const formatUser = (user, baseUrl) => {
  if (!user) return null;
  const avatar = user.avatar_url
    ? user.avatar_url
    : user.avatar_file
    ? resolveMediaUrl(user.avatar_file, baseUrl)
    : `${baseUrl}/avatars/default.jpg`;

  return {
    ...user,
    tick: Boolean(user.tick),
    is_followed: Boolean(user.is_followed),
    is_personal: Boolean(user.is_personal),
    followings_count: Number(user.followings_count || 0),
    followers_count: Number(user.followers_count || 0),
    likes_count: Number(user.likes_count || 0),
    avatar,
  };
};

const formatFeedPost = (post, user, baseUrl) => {
  if (!post) return null;
  const formattedUser = user ? formatUser(user, baseUrl) : null;
  const image_url = post.image_url
    ? post.image_url
    : post.image_file
    ? resolveMediaUrl(post.image_file, baseUrl)
    : formattedUser
    ? formattedUser.avatar
    : null;

  return {
    ...post,
    is_liked: Boolean(post.is_liked),
    likes_count: Number(post.likes_count || 0),
    comments_count: Number(post.comments_count || 0),
    shares_count: Number(post.shares_count || 0),
    views_count: Number(post.views_count || 0),
    image_url,
    user: formattedUser,
  };
};

const formatLive = (live, user, baseUrl) => {
  if (!live) return null;
  const formattedUser = user ? formatUser(user, baseUrl) : null;
  const cover_url = live.cover_url
    ? live.cover_url
    : live.image_file
    ? resolveMediaUrl(live.image_file, baseUrl)
    : formattedUser
    ? formattedUser.avatar
    : null;

  return {
    ...live,
    is_live: Boolean(live.is_live),
    viewer_count: Number(live.viewer_count || 0),
    likes_count: Number(live.likes_count || 0),
    cover_url,
    user: formattedUser,
  };
};

const formatRelativeTime = (dateInput) => {
  if (!dateInput) return '';
  if (typeof dateInput === 'string' && dateInput.includes('ago')) return dateInput;

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return dateInput;

  const now = new Date();
  const diffMs = now - date;
  if (diffMs < 0) return 'Just now';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 4) return `${diffWeek}w ago`;
  return `${Math.floor(diffDay / 30)}mo ago`;
};

const formatNotification = (notif, actorUser, video, baseUrl) => {
  if (!notif) return null;

  let videoThumb = null;
  const vidObj = video || (notif.video_id ? mockVideos.find((v) => v.id === notif.video_id) : null);
  if (vidObj) {
    videoThumb =
      vidObj.thumb_url ||
      (vidObj.image_url
        ? vidObj.image_url
        : vidObj.image_file
        ? resolveMediaUrl(vidObj.image_file, baseUrl)
        : null);
  }
  if (!videoThumb && ['like', 'comment', 'mention', 'reply'].includes(notif.type.toLowerCase())) {
    videoThumb =
      'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=120&q=80';
  }

  const actObj = actorUser || (notif.actor_id ? mockUsers.find((u) => u.id === notif.actor_id) : null);
  const actor = actObj
    ? {
        id: actObj.id,
        nickname: actObj.nickname,
        full_name: actObj.full_name,
        avatar: formatUser(actObj, baseUrl).avatar,
        tick: Boolean(actObj.tick),
        is_followed: Boolean(actObj.is_followed),
      }
    : {
        id: 0,
        nickname: 'tiktok_vn',
        full_name: 'TikTok Official',
        avatar:
          'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=100&q=80',
        tick: true,
        is_followed: false,
      };

  const normalizedType = notif.type.toLowerCase();

  return {
    id: notif.id,
    notificationId: notif.id,
    recipient_id: notif.recipient_id,
    recipientId: notif.recipient_id,
    actor_id: notif.actor_id,
    actorId: notif.actor_id,
    actorUsername: actor.nickname,
    actorAvatar: actor.avatar,
    actorFullName: actor.full_name,
    type: normalizedType,
    content: notif.content,
    video_id: notif.video_id,
    videoId: notif.video_id,
    video_thumb: videoThumb,
    videoThumbnail: videoThumb,
    comment_id: notif.comment_id,
    commentId: notif.comment_id,
    is_read: Boolean(notif.is_read),
    isRead: Boolean(notif.is_read),
    is_following: Boolean(actor.is_followed),
    created_at: notif.created_at,
    createdAt: notif.created_at,
    time: formatRelativeTime(notif.created_at),
    user: actor,
  };
};

const normalizeText = (str = '') => {
  return str
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
};


const checkIsFollowed = async (followerId, targetUserId) => {
  if (!followerId || !targetUserId || Number(followerId) === Number(targetUserId)) return false;
  if (isMySQLActive) {
    const [rows] = await pool.query(
      'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ? LIMIT 1',
      [Number(followerId), Number(targetUserId)]
    );
    return rows.length > 0;
  } else {
    return mockFollows.some(
      (f) => Number(f.follower_id) === Number(followerId) && Number(f.following_id) === Number(targetUserId)
    );
  }
};

const getAuthUser = async (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const parts = token.split('.');
      if (parts.length >= 2) {
        let payload = null;
        for (let i = 0; i < parts.length; i++) {
          try {
            const decoded = JSON.parse(Buffer.from(parts[i], 'base64').toString('utf8'));
            if (decoded && (decoded.id || decoded.nickname)) {
              payload = decoded;
              break;
            }
          } catch (_) {}
        }
        if (payload) {
          if (isMySQLActive) {
            if (payload.id) {
              const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [payload.id]);
              if (rows.length > 0) return rows[0];
            }
            if (payload.nickname) {
              const [rows] = await pool.query('SELECT * FROM users WHERE LOWER(nickname) = ?', [
                payload.nickname.toLowerCase(),
              ]);
              if (rows.length > 0) return rows[0];
            }
          } else {
            if (payload.id) {
              const u = mockUsers.find((x) => x.id === payload.id);
              if (u) return u;
            }
            if (payload.nickname) {
              const u = mockUsers.find((x) => x.nickname.toLowerCase() === payload.nickname.toLowerCase());
              if (u) return u;
            }
          }
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  // Khong fallback sang Bear - tra ve null neu chua dang nhap
  return null;
};

const findUserByParam = async (param) => {
  if (!param) return null;
  const clean = param.replace(/^@/, '').trim().toLowerCase();
  const idNum = parseInt(clean, 10);

  if (isMySQLActive) {
    if (!isNaN(idNum) && String(idNum) === clean) {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [idNum]);
      if (rows.length > 0) return rows[0];
    }
    const [rows] = await pool.query('SELECT * FROM users WHERE LOWER(nickname) = ?', [clean]);
    return rows[0] || null;
  } else {
    if (!isNaN(idNum)) {
      const byId = mockUsers.find((u) => u.id === idNum);
      if (byId) return byId;
    }
    return mockUsers.find((u) => u.nickname.toLowerCase() === clean);
  }
};

const getUsersByIds = async (userIds) => {
  if (!userIds || userIds.length === 0) return new Map();
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0) return new Map();

  const map = new Map();
  if (isMySQLActive) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id IN (?)', [uniqueIds]);
    rows.forEach((u) => map.set(u.id, u));
  } else {
    uniqueIds.forEach((id) => {
      const u = mockUsers.find((x) => x.id === id);
      if (u) map.set(id, u);
    });
  }
  return map;
};

const createNotification = async ({
  recipient_id,
  actor_id,
  type,
  content,
  video_id = null,
  comment_id = null,
}) => {
  if (!recipient_id || !actor_id) return null;
  if (recipient_id === actor_id) return null;

  const normalizedType = type.toLowerCase();

  if (isMySQLActive) {
    const [existing] = await pool.query(
      `SELECT * FROM notifications 
       WHERE recipient_id = ? AND actor_id = ? AND type = ? 
         AND (video_id = ? OR (video_id IS NULL AND ? IS NULL))
         AND (comment_id = ? OR (comment_id IS NULL AND ? IS NULL))
         AND is_read = 0 LIMIT 1`,
      [recipient_id, actor_id, normalizedType, video_id, video_id, comment_id, comment_id]
    );

    if (existing.length > 0) {
      await pool.query('UPDATE notifications SET created_at = NOW() WHERE id = ?', [existing[0].id]);
      return { ...existing[0], created_at: new Date() };
    }

    const [maxRow] = await pool.query('SELECT MAX(id) as maxId FROM notifications');
    const newId = (maxRow[0].maxId || 0) + 1;

    await pool.query(
      `INSERT INTO notifications (id, recipient_id, actor_id, type, content, video_id, comment_id, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
      [newId, recipient_id, actor_id, normalizedType, content || '', video_id || null, comment_id || null]
    );

    const [created] = await pool.query('SELECT * FROM notifications WHERE id = ?', [newId]);
    return created[0];
  } else {
    const existing = mockNotifications.find(
      (n) =>
        n.recipient_id === recipient_id &&
        n.actor_id === actor_id &&
        n.type.toLowerCase() === normalizedType &&
        n.video_id === video_id &&
        n.comment_id === comment_id &&
        !n.is_read
    );
    if (existing) {
      existing.created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
      return existing;
    }

    const newId = mockNotifications.length > 0 ? Math.max(...mockNotifications.map((n) => n.id)) + 1 : 1;
    const newNotif = {
      id: newId,
      recipient_id,
      actor_id,
      type: normalizedType,
      video_id: video_id || null,
      comment_id: comment_id || null,
      content: content || '',
      is_read: false,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };

    mockNotifications.unshift(newNotif);
    return newNotif;
  }
};

const removeNotification = async ({ recipient_id, actor_id, type, video_id = null }) => {
  const normalizedType = type.toLowerCase();
  if (isMySQLActive) {
    let sql = 'DELETE FROM notifications WHERE recipient_id = ? AND actor_id = ? AND type = ? AND is_read = 0';
    const params = [recipient_id, actor_id, normalizedType];
    if (video_id) {
      sql += ' AND video_id = ?';
      params.push(video_id);
    }
    sql += ' LIMIT 1';
    await pool.query(sql, params);
  } else {
    const index = mockNotifications.findIndex(
      (n) =>
        n.recipient_id === recipient_id &&
        n.actor_id === actor_id &&
        n.type.toLowerCase() === normalizedType &&
        (!video_id || n.video_id === video_id) &&
        !n.is_read
    );
    if (index !== -1) {
      mockNotifications.splice(index, 1);
    }
  }
};

// ==========================================
// 1. AUTH & TÀI KHOẢN (AUTHENTICATION)
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const { email, nickname, username, account, password } = req.body;
    const loginIdentifier = (nickname || username || account || '').trim();

    let user = null;
    if (isMySQLActive) {
      if (loginIdentifier) {
        const [rows] = await pool.query(
          'SELECT * FROM users WHERE LOWER(nickname) = ? OR LOWER(email) = ?',
          [loginIdentifier.toLowerCase(), loginIdentifier.toLowerCase()]
        );
        user = rows[0] || null;
      } else if (email) {
        const [rows] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ?', [
          email.trim().toLowerCase(),
        ]);
        user = rows[0] || null;
      }
    } else {
      if (loginIdentifier) {
        user = mockUsers.find(
          (u) =>
            u.nickname.toLowerCase() === loginIdentifier.toLowerCase() ||
            (u.email && u.email.toLowerCase() === loginIdentifier.toLowerCase())
        );
      } else if (email) {
        user = mockUsers.find(
          (u) => u.email && u.email.toLowerCase() === email.trim().toLowerCase()
        );
      }
    }

    // Nếu người dùng có nhập tài khoản nhưng không tồn tại -> báo lỗi 401
    if ((loginIdentifier || email) && !user) {
      return res.status(401).json({
        message: 'Tài khoản hoặc mật khẩu không chính xác. Vui lòng thử lại!',
      });
    }

    // Nếu không truyền dữ liệu gì (demo call cũ) -> fallback Bear
    if (!user) {
      if (isMySQLActive) {
        const [rows] = await pool.query("SELECT * FROM users WHERE nickname = 'bear' LIMIT 1");
        user = rows[0] || null;
      } else {
        user = mockUsers.find((u) => u.nickname === 'bear') || mockUsers[0];
      }
    }

    res.json({
      data: formatUser(user, baseUrl),
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        Buffer.from(JSON.stringify({ id: user.id, nickname: user.nickname, iat: Date.now() })).toString('base64') +
        '.tiktok_sig',
      message: 'Đăng nhập thành công',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const { nickname, full_name, email, password } = req.body;

      if (!nickname) {
        return res.status(400).json({ message: 'Nickname là bắt buộc' });
      }

      const cleanNick = nickname.replace(/^@/, '').trim();

      if (isMySQLActive) {
        const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(nickname) = ?', [
          cleanNick.toLowerCase(),
        ]);
        if (existing.length > 0) {
          return res.status(400).json({ message: 'Nickname đã tồn tại' });
        }

        const [maxRow] = await pool.query('SELECT MAX(id) as maxId FROM users');
        const newId = Math.max(1001, (maxRow[0].maxId || 0) + 1);
        const firstName = full_name ? full_name.split(' ').slice(0, -1).join(' ') : '';
        const lastName = full_name ? full_name.split(' ').slice(-1).join(' ') : cleanNick;
        const avatarUrl =
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80';

        await pool.query(
          `INSERT INTO users (
            id, first_name, last_name, full_name, nickname, email,
            avatar_url, tick, is_followed, is_personal, followings_count, followers_count, likes_count, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, NOW(), NOW())`,
          [newId, firstName, lastName, full_name || cleanNick, cleanNick, email || null, avatarUrl]
        );

        const [newUserRows] = await pool.query('SELECT * FROM users WHERE id = ?', [newId]);
        const newUser = newUserRows[0];

        const token =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
          Buffer.from(JSON.stringify({ id: newUser.id, nickname: newUser.nickname, iat: Date.now() })).toString('base64') +
          '.tiktok_sig';

        return res.status(201).json({
          data: formatUser(newUser, baseUrl),
          token,
          message: 'Đăng ký tài khoản thành công',
        });
      } else {
        const existing = mockUsers.find((u) => u.nickname.toLowerCase() === cleanNick.toLowerCase());
        if (existing) {
          return res.status(400).json({ message: 'Nickname đã tồn tại' });
        }

        const newId = Math.max(1001, ...mockUsers.map((u) => u.id)) + 1;
        const newUser = {
          id: newId,
          first_name: full_name ? full_name.split(' ').slice(0, -1).join(' ') : '',
          last_name: full_name ? full_name.split(' ').slice(-1).join(' ') : cleanNick,
          full_name: full_name || cleanNick,
          nickname: cleanNick,
          avatar_url:
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
          avatar_file: '',
          bio: '',
          tick: false,
          followings_count: 0,
          followers_count: 0,
          likes_count: 0,
          website_url: '',
          facebook_url: '',
          youtube_url: '',
          twitter_url: '',
          instagram_url: '',
          is_followed: false,
          is_personal: false,
          created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        };
        mockUsers.push(newUser);

        const token =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
          Buffer.from(JSON.stringify({ id: newUser.id, nickname: newUser.nickname, iat: Date.now() })).toString('base64') +
          '.tiktok_sig';

        return res.status(201).json({
          data: formatUser(newUser, baseUrl),
          token,
          message: 'Đăng ký tài khoản thành công',
        });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/auth/me', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Chưa đăng nhập hoặc token không hợp lệ' });
    }
    res.json({
      data: formatUser(user, baseUrl),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Đăng xuất thành công' });
});

// ==========================================
// 2. TÌM KIẾM (SEARCH USERS & VIDEOS)
// URL: /api/users/search?q={keyword}&type={less|more}
// ==========================================
app.get('/api/users/search', async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const rawQuery = (req.query.q || '').trim();
      const type = req.query.type || 'less';

      if (!rawQuery) {
        return res.json({ data: [] });
      }

      const cleanQuery = rawQuery.replace(/^@/, '').trim();
      const authUser = await getAuthUser(req);

      if (isMySQLActive) {
        const limit = type === 'less' ? 5 : 50;
        const idNum = parseInt(cleanQuery, 10);
        const hasId = !isNaN(idNum) && String(idNum) === cleanQuery;

        let querySql = `SELECT * FROM users 
           WHERE nickname LIKE ? OR full_name LIKE ? OR first_name LIKE ? OR last_name LIKE ?`;
        let params = [`%${cleanQuery}%`, `%${cleanQuery}%`, `%${cleanQuery}%`, `%${cleanQuery}%`];

        if (hasId) {
          querySql = `SELECT * FROM users 
           WHERE id = ? OR nickname LIKE ? OR full_name LIKE ? OR first_name LIKE ? OR last_name LIKE ?`;
          params = [idNum, `%${cleanQuery}%`, `%${cleanQuery}%`, `%${cleanQuery}%`, `%${cleanQuery}%`];
        }

        querySql += ' LIMIT ?';
        params.push(limit);

        const [userRows] = await pool.query(querySql, params);

        const data = await Promise.all(
          userRows.map(async (u) => {
            const formatted = formatUser(u, baseUrl);
            formatted.is_followed = authUser ? await checkIsFollowed(authUser.id, u.id) : false;
            return formatted;
          })
        );

        return res.json({ data });
      } else {
        const query = normalizeText(cleanQuery);
        const idNum = parseInt(cleanQuery, 10);
        let results = mockUsers.filter((u) => {
          if (!isNaN(idNum) && u.id === idNum) return true;
          return (
            normalizeText(u.nickname).includes(query) ||
            normalizeText(u.full_name).includes(query) ||
            normalizeText(u.first_name).includes(query) ||
            normalizeText(u.last_name).includes(query)
          );
        });
        if (type === 'less') {
          results = results.slice(0, 5);
        }

        const data = await Promise.all(
          results.map(async (u) => {
            const formatted = formatUser(u, baseUrl);
            formatted.is_followed = authUser ? await checkIsFollowed(authUser.id, u.id) : false;
            return formatted;
          })
        );

        return res.json({ data });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/videos/search', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const rawQuery = (req.query.q || '').trim();

    if (!rawQuery) {
      return res.json({ data: [] });
    }

    if (isMySQLActive) {
      const [videoRows] = await pool.query(
        `SELECT * FROM videos WHERE description LIKE ? OR music LIKE ? ORDER BY id DESC LIMIT 50`,
        [`%${rawQuery}%`, `%${rawQuery}%`]
      );
      const userIds = videoRows.map((v) => v.user_id);
      const userMap = await getUsersByIds(userIds);
      return res.json({
        data: videoRows.map((v) => formatFeedPost(v, userMap.get(v.user_id), baseUrl)),
      });
    } else {
      const query = normalizeText(rawQuery);
      const results = mockVideos.filter((v) => {
        return (
          normalizeText(v.description || '').includes(query) ||
          normalizeText(v.music || '').includes(query)
        );
      });
      return res.json({
        data: results.map((v) => {
          const user = mockUsers.find((u) => u.id === v.user_id);
          return formatFeedPost(v, user, baseUrl);
        }),
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 3. TÀI KHOẢN GỢI Ý & ĐANG THEO DÕI (SIDEBAR)
// ==========================================
app.get('/api/users/suggested', async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const perPage = Math.max(1, parseInt(req.query.per_page) || 5);
      const offset = (page - 1) * perPage;
      const authUser = await getAuthUser(req);

      if (isMySQLActive) {
        const [totalRow] = await pool.query('SELECT COUNT(*) as total FROM users');
        const total = totalRow[0].total;
        const [userRows] = await pool.query('SELECT * FROM users ORDER BY id ASC LIMIT ? OFFSET ?', [
          perPage,
          offset,
        ]);

        const data = await Promise.all(
          userRows.map(async (u) => {
            const formatted = formatUser(u, baseUrl);
            formatted.is_followed = authUser ? await checkIsFollowed(authUser.id, u.id) : false;
            return formatted;
          })
        );

        return res.json({
          data,
          meta: {
            pagination: {
              total,
              count: userRows.length,
              per_page: perPage,
              current_page: page,
              total_pages: Math.ceil(total / perPage) || 1,
            },
          },
        });
      } else {
        const start = (page - 1) * perPage;
        const paginatedUsers = mockUsers.slice(start, start + perPage);

        const data = await Promise.all(
          paginatedUsers.map(async (u) => {
            const formatted = formatUser(u, baseUrl);
            formatted.is_followed = authUser ? await checkIsFollowed(authUser.id, u.id) : false;
            return formatted;
          })
        );

        return res.json({
          data,
          meta: {
            pagination: {
              total: mockUsers.length,
              count: paginatedUsers.length,
              per_page: perPage,
              current_page: page,
              total_pages: Math.ceil(mockUsers.length / perPage),
            },
          },
        });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/users/following', async (req, res) => {
    try {
      const baseUrl = getBaseUrl(req);
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const perPage = Math.max(1, parseInt(req.query.per_page) || 20);
      const offset = (page - 1) * perPage;

      const authUser = await getAuthUser(req);
      if (!authUser) {
        return res.json({
          data: [],
          meta: {
            pagination: {
              total: 0,
              count: 0,
              per_page: perPage,
              current_page: page,
              total_pages: 1,
            },
          },
        });
      }

      if (isMySQLActive) {
        const [totalRow] = await pool.query(
          'SELECT COUNT(*) as total FROM users u INNER JOIN follows f ON u.id = f.following_id WHERE f.follower_id = ?',
          [authUser.id]
        );
        const total = totalRow[0].total || 0;

        const [rows] = await pool.query(
          `SELECT u.* FROM users u 
           INNER JOIN follows f ON u.id = f.following_id 
           WHERE f.follower_id = ? 
           ORDER BY f.created_at DESC 
           LIMIT ? OFFSET ?`,
          [authUser.id, perPage, offset]
        );

        return res.json({
          data: rows.map((u) => {
            const formatted = formatUser(u, baseUrl);
            formatted.is_followed = true;
            return formatted;
          }),
          meta: {
            pagination: {
              total,
              count: rows.length,
              per_page: perPage,
              current_page: page,
              total_pages: Math.ceil(total / perPage) || 1,
            },
          },
        });
      } else {
        const followedIds = mockFollows.filter((f) => f.follower_id === authUser.id).map((f) => f.following_id);
        const followingUsers = mockUsers.filter((u) => followedIds.includes(u.id));
        const start = (page - 1) * perPage;
        const paginatedUsers = followingUsers.slice(start, start + perPage);

        return res.json({
          data: paginatedUsers.map((u) => {
            const formatted = formatUser(u, baseUrl);
            formatted.is_followed = true;
            return formatted;
          }),
          meta: {
            pagination: {
              total: followingUsers.length,
              count: paginatedUsers.length,
              per_page: perPage,
              current_page: page,
              total_pages: Math.ceil(followingUsers.length / perPage) || 1,
            },
          },
        });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  const handleGetUserProfile = async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const param = req.params.nickname || req.params.username;
    const user = await findUserByParam(param);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const authUser = await getAuthUser(req);
    const isFollowed = authUser ? await checkIsFollowed(authUser.id, user.id) : false;

    const formatted = formatUser(user, baseUrl);
    formatted.is_followed = isFollowed;

    res.json({
      data: formatted,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

app.get('/api/users/@:nickname', handleGetUserProfile);
app.get('/api/users/:nickname', (req, res, next) => {
  if (['search', 'suggested', 'following'].includes(req.params.nickname)) {
    return next();
  }
  return handleGetUserProfile(req, res);
});

// Chỉnh sửa profile
const handleUpdateUserProfile = async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const param = req.params.nickname || req.params.username;
    const user = await findUserByParam(param);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { full_name, bio, website_url, avatar, avatar_url, first_name, last_name } = req.body;

    if (isMySQLActive) {
      const updates = [];
      const params = [];

      if (full_name !== undefined) {
        updates.push('full_name = ?');
        params.push(full_name);
      }
      if (first_name !== undefined) {
        updates.push('first_name = ?');
        params.push(first_name);
      }
      if (last_name !== undefined) {
        updates.push('last_name = ?');
        params.push(last_name);
      }
      if (bio !== undefined) {
        updates.push('bio = ?');
        params.push(bio);
      }
      if (website_url !== undefined) {
        updates.push('website_url = ?');
        params.push(website_url);
      }
      const newAvatar = avatar_url !== undefined ? avatar_url : avatar !== undefined ? avatar : null;
      if (newAvatar !== null) {
        updates.push('avatar_url = ?');
        params.push(newAvatar);
      }

      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        params.push(user.id);
        await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
      }

      const [updatedRows] = await pool.query('SELECT * FROM users WHERE id = ?', [user.id]);
      return res.json({
        data: formatUser(updatedRows[0], baseUrl),
        message: 'Profile updated successfully',
      });
    } else {
      if (full_name !== undefined) user.full_name = full_name;
      if (first_name !== undefined) user.first_name = first_name;
      if (last_name !== undefined) user.last_name = last_name;
      if (bio !== undefined) user.bio = bio;
      if (website_url !== undefined) user.website_url = website_url;
      if (avatar_url !== undefined) user.avatar_url = avatar_url;
      if (avatar !== undefined && !avatar_url) user.avatar_url = avatar;
      user.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

      return res.json({
        data: formatUser(user, baseUrl),
        message: 'Profile updated successfully',
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

app.patch('/api/users/@:nickname', handleUpdateUserProfile);
app.put('/api/users/@:nickname', handleUpdateUserProfile);
app.patch('/api/users/:nickname', handleUpdateUserProfile);
app.put('/api/users/:nickname', handleUpdateUserProfile);

// Lấy danh sách video của user
const handleGetUserVideos = async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const param = req.params.nickname;
    const user = await findUserByParam(param);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (isMySQLActive) {
      const [userVideos] = await pool.query('SELECT * FROM videos WHERE user_id = ? ORDER BY id DESC', [user.id]);
      return res.json({
        data: userVideos.map((video) => formatFeedPost(video, user, baseUrl)),
      });
    } else {
      const userVideos = mockVideos.filter((v) => v.user_id === user.id);
      return res.json({
        data: userVideos.map((video) => formatFeedPost(video, user, baseUrl)),
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

app.get('/api/users/@:nickname/videos', handleGetUserVideos);
app.get('/api/users/:nickname/videos', handleGetUserVideos);

// ==========================================
// 5. FOLLOW & UNFOLLOW USER
const handleFollow = async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const param = req.params.nickname || req.params.id;
    const targetUser = await findUserByParam(param);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ message: 'Vui lòng đăng nhập để thực hiện hành động này.' });
    }

    if (authUser.id === targetUser.id) {
      return res.status(400).json({ message: 'Bạn không thể tự theo dõi chính mình.' });
    }

    if (isMySQLActive) {
      const [existing] = await pool.query(
        'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ? LIMIT 1',
        [authUser.id, targetUser.id]
      );
      if (existing.length === 0) {
        await pool.query('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [
          authUser.id,
          targetUser.id,
        ]);
        await pool.query('UPDATE users SET followers_count = followers_count + 1 WHERE id = ?', [targetUser.id]);
        await pool.query('UPDATE users SET followings_count = followings_count + 1 WHERE id = ?', [authUser.id]);

        await createNotification({
          recipient_id: targetUser.id,
          actor_id: authUser.id,
          type: 'follow',
          content: 'started following you',
        });
      }

      const [updated] = await pool.query('SELECT * FROM users WHERE id = ?', [targetUser.id]);
      const formatted = formatUser(updated[0], baseUrl);
      formatted.is_followed = true;
      return res.json({ data: formatted, message: 'Followed successfully' });
    } else {
      const already = mockFollows.some((f) => f.follower_id === authUser.id && f.following_id === targetUser.id);
      if (!already) {
        mockFollows.push({ follower_id: authUser.id, following_id: targetUser.id });
        targetUser.followers_count = (targetUser.followers_count || 0) + 1;
        authUser.followings_count = (authUser.followings_count || 0) + 1;

        await createNotification({
          recipient_id: targetUser.id,
          actor_id: authUser.id,
          type: 'follow',
          content: 'started following you',
        });
      }

      const formatted = formatUser(targetUser, baseUrl);
      formatted.is_followed = true;
      return res.json({ data: formatted, message: 'Followed successfully' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const handleUnfollow = async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const param = req.params.nickname || req.params.id;
    const targetUser = await findUserByParam(param);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const authUser = await getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ message: 'Vui lòng đăng nhập để thực hiện hành động này.' });
    }

    if (isMySQLActive) {
      const [existing] = await pool.query(
        'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ? LIMIT 1',
        [authUser.id, targetUser.id]
      );
      if (existing.length > 0) {
        await pool.query('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [
          authUser.id,
          targetUser.id,
        ]);
        await pool.query('UPDATE users SET followers_count = GREATEST(0, followers_count - 1) WHERE id = ?', [targetUser.id]);
        await pool.query('UPDATE users SET followings_count = GREATEST(0, followings_count - 1) WHERE id = ?', [authUser.id]);
      }

      const [updated] = await pool.query('SELECT * FROM users WHERE id = ?', [targetUser.id]);
      const formatted = formatUser(updated[0], baseUrl);
      formatted.is_followed = false;
      return res.json({ data: formatted, message: 'Unfollowed successfully' });
    } else {
      mockFollows = mockFollows.filter(
        (f) => !(f.follower_id === authUser.id && f.following_id === targetUser.id)
      );
      targetUser.followers_count = Math.max(0, (targetUser.followers_count || 1) - 1);
      authUser.followings_count = Math.max(0, (authUser.followings_count || 1) - 1);

      const formatted = formatUser(targetUser, baseUrl);
      formatted.is_followed = false;
      return res.json({ data: formatted, message: 'Unfollowed successfully' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

app.post('/api/users/:id/follow', handleFollow);
app.post('/api/users/:id/unfollow', handleUnfollow);
app.post('/api/users/@:nickname/follow', handleFollow);
app.post('/api/users/@:nickname/unfollow', handleUnfollow);

// ==========================================
// 6. VIDEO MANAGEMENT & FEEDS
// ==========================================
app.get('/api/videos', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const type = req.query.type || 'for-you';
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.max(1, parseInt(req.query.per_page) || 10);
    const offset = (page - 1) * perPage;

    if (isMySQLActive) {
      let whereClause = '';
      if (type === 'following') {
        const authUser = await getAuthUser(req);
        if (!authUser) {
          return res.json({ data: [], meta: { pagination: { total: 0 } } });
        }
        whereClause = `WHERE user_id IN (SELECT following_id FROM follows WHERE follower_id = ${Number(authUser.id)})`;
      }

      const [totalRow] = await pool.query(`SELECT COUNT(*) as total FROM videos ${whereClause}`);
      const total = totalRow[0].total;

      const [videoRows] = await pool.query(
        `SELECT * FROM videos ${whereClause} ORDER BY id ASC LIMIT ? OFFSET ?`,
        [perPage, offset]
      );

      const userIds = videoRows.map((v) => v.user_id);
      const userMap = await getUsersByIds(userIds);

      return res.json({
        data: videoRows.map((video) => formatFeedPost(video, userMap.get(video.user_id), baseUrl)),
        meta: {
          pagination: {
            total,
            count: videoRows.length,
            per_page: perPage,
            current_page: page,
            total_pages: Math.ceil(total / perPage) || 1,
          },
        },
      });
    } else {
      let videoList = [...mockVideos];
      if (type === 'following') {
        const authUser = await getAuthUser(req);
        if (!authUser) {
          return res.json({ data: [], meta: { pagination: { total: 0 } } });
        }
        const followingIds = mockFollows.filter((f) => f.follower_id === authUser.id).map((f) => f.following_id);
        videoList = videoList.filter((v) => followingIds.includes(v.user_id));
      }

      const start = (page - 1) * perPage;
      const paginatedVideos = videoList.slice(start, start + perPage);

      return res.json({
        data: paginatedVideos.map((v) => {
          const user = mockUsers.find((u) => u.id === v.user_id);
          return formatFeedPost(v, user, baseUrl);
        }),
        meta: {
          pagination: {
            total: videoList.length,
            count: paginatedVideos.length,
            per_page: perPage,
            current_page: page,
            total_pages: Math.ceil(videoList.length / perPage) || 1,
          },
        },
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/videos/:id', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const videoId = parseInt(req.params.id);

    if (isMySQLActive) {
      const [rows] = await pool.query('SELECT * FROM videos WHERE id = ?', [videoId]);
      if (rows.length === 0) return res.status(404).json({ message: 'Video not found' });
      const video = rows[0];
      const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [video.user_id]);
      return res.json({
        data: formatFeedPost(video, userRows[0] || null, baseUrl),
      });
    } else {
      const video = mockVideos.find((v) => v.id === videoId);
      if (!video) return res.status(404).json({ message: 'Video not found' });
      const user = mockUsers.find((u) => u.id === video.user_id);
      return res.json({
        data: formatFeedPost(video, user || null, baseUrl),
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/videos', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const { description, file_url, thumb_url, music, user_id } = req.body;

    const authorId = user_id || 999;
    const author = (await findUserByParam(String(authorId))) || (await getAuthUser(req));

    const thumb = thumb_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80';
    const file = file_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    const desc = description || 'Video mới đăng tải #tiktok #creator';
    const bgm = music || `nhạc nền - ${author ? author.full_name || author.nickname : 'Creator'}`;

    if (isMySQLActive) {
      const [maxRow] = await pool.query('SELECT MAX(id) as maxId FROM videos');
      const newId = (maxRow[0].maxId || 0) + 1;
      const uuid = 'vid-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);

      await pool.query(
        `INSERT INTO videos (
          id, uuid, user_id, thumb_url, file_url, description, music,
          likes_count, comments_count, shares_count, views_count, is_liked,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 1, 0, NOW(), NOW())`,
        [newId, uuid, author ? author.id : 999, thumb, file, desc, bgm]
      );

      const [createdRows] = await pool.query('SELECT * FROM videos WHERE id = ?', [newId]);
      return res.status(201).json({
        data: formatFeedPost(createdRows[0], author, baseUrl),
        message: 'Video uploaded successfully',
      });
    } else {
      const newVideo = {
        id: mockVideos.length > 0 ? Math.max(...mockVideos.map((v) => v.id)) + 1 : 1,
        uuid: 'vid-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
        user_id: author ? author.id : 999,
        thumb_url: thumb,
        file_url: file,
        description: desc,
        music: bgm,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        views_count: 1,
        is_liked: false,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      };

      mockVideos.unshift(newVideo);
      return res.status(201).json({
        data: formatFeedPost(newVideo, author, baseUrl),
        message: 'Video uploaded successfully',
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/videos/:id', async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);

    if (isMySQLActive) {
      const [rows] = await pool.query('SELECT * FROM videos WHERE id = ?', [videoId]);
      if (rows.length === 0) return res.status(404).json({ message: 'Video not found' });
      await pool.query('DELETE FROM videos WHERE id = ?', [videoId]);
      return res.json({
        data: rows[0],
        message: 'Video deleted successfully',
      });
    } else {
      const index = mockVideos.findIndex((v) => v.id === videoId);
      if (index === -1) return res.status(404).json({ message: 'Video not found' });
      const [deleted] = mockVideos.splice(index, 1);
      return res.json({
        data: deleted,
        message: 'Video deleted successfully',
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/videos/:id/view', async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);

    if (isMySQLActive) {
      await pool.query('UPDATE videos SET views_count = views_count + 1 WHERE id = ?', [videoId]);
      const [rows] = await pool.query('SELECT views_count FROM videos WHERE id = ?', [videoId]);
      if (rows.length === 0) return res.status(404).json({ message: 'Video not found' });
      return res.json({ data: { views_count: Number(rows[0].views_count) } });
    } else {
      const video = mockVideos.find((v) => v.id === videoId);
      if (!video) return res.status(404).json({ message: 'Video not found' });
      video.views_count = (video.views_count || 0) + 1;
      return res.json({ data: { views_count: video.views_count } });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/videos/:id/like', async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const currentUser = await getAuthUser(req);
    const actorId = req.body?.user_id ? parseInt(req.body.user_id) : currentUser.id;

    if (isMySQLActive) {
      const [rows] = await pool.query('SELECT * FROM videos WHERE id = ?', [videoId]);
      if (rows.length === 0) return res.status(404).json({ message: 'Video not found' });
      const video = rows[0];

      if (!video.is_liked) {
        await pool.query('UPDATE videos SET is_liked = 1, likes_count = likes_count + 1 WHERE id = ?', [videoId]);
      }

      if (video.user_id && video.user_id !== actorId) {
        await createNotification({
          recipient_id: video.user_id,
          actor_id: actorId,
          type: 'like',
          video_id: video.id,
          content: 'liked your video',
        });
      }

      const [updated] = await pool.query('SELECT * FROM videos WHERE id = ?', [videoId]);
      const [author] = await pool.query('SELECT * FROM users WHERE id = ?', [video.user_id]);
      return res.json({ data: formatFeedPost(updated[0], author[0] || null, getBaseUrl(req)) });
    } else {
      const video = mockVideos.find((v) => v.id === videoId);
      if (!video) return res.status(404).json({ message: 'Video not found' });

      if (!video.is_liked) {
        video.is_liked = true;
        video.likes_count += 1;
      }

      if (video.user_id && video.user_id !== actorId) {
        await createNotification({
          recipient_id: video.user_id,
          actor_id: actorId,
          type: 'like',
          video_id: video.id,
          content: 'liked your video',
        });
      }

      const author = mockUsers.find((u) => u.id === video.user_id);
      return res.json({ data: formatFeedPost(video, author || null, getBaseUrl(req)) });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/videos/:id/unlike', async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const currentUser = await getAuthUser(req);
    const actorId = req.body?.user_id ? parseInt(req.body.user_id) : currentUser.id;

    if (isMySQLActive) {
      const [rows] = await pool.query('SELECT * FROM videos WHERE id = ?', [videoId]);
      if (rows.length === 0) return res.status(404).json({ message: 'Video not found' });
      const video = rows[0];

      if (video.is_liked) {
        await pool.query('UPDATE videos SET is_liked = 0, likes_count = GREATEST(0, likes_count - 1) WHERE id = ?', [
          videoId,
        ]);
      }

      if (video.user_id) {
        await removeNotification({
          recipient_id: video.user_id,
          actor_id: actorId,
          type: 'like',
          video_id: video.id,
        });
      }

      const [updated] = await pool.query('SELECT * FROM videos WHERE id = ?', [videoId]);
      const [author] = await pool.query('SELECT * FROM users WHERE id = ?', [video.user_id]);
      return res.json({ data: formatFeedPost(updated[0], author[0] || null, getBaseUrl(req)) });
    } else {
      const video = mockVideos.find((v) => v.id === videoId);
      if (!video) return res.status(404).json({ message: 'Video not found' });

      if (video.is_liked) {
        video.is_liked = false;
        video.likes_count = Math.max(0, video.likes_count - 1);
      }

      if (video.user_id) {
        await removeNotification({
          recipient_id: video.user_id,
          actor_id: actorId,
          type: 'like',
          video_id: video.id,
        });
      }

      const author = mockUsers.find((u) => u.id === video.user_id);
      return res.json({ data: formatFeedPost(video, author || null, getBaseUrl(req)) });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 7. BÌNH LUẬN VIDEO (COMMENTS)
// ==========================================
app.get('/api/videos/:id/comments', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const videoId = parseInt(req.params.id);

    if (isMySQLActive) {
      const [videoComments] = await pool.query('SELECT * FROM comments WHERE video_id = ? ORDER BY id DESC', [
        videoId,
      ]);
      const userIds = videoComments.map((c) => c.user_id);
      const userMap = await getUsersByIds(userIds);

      return res.json({
        data: videoComments.map((comment) => ({
          ...comment,
          likes_count: Number(comment.likes_count || 0),
          is_liked: Boolean(comment.is_liked),
          user: formatUser(userMap.get(comment.user_id), baseUrl),
        })),
      });
    } else {
      const videoComments = mockComments.filter((c) => c.video_id === videoId);
      return res.json({
        data: videoComments.map((comment) => {
          const user = mockUsers.find((u) => u.id === comment.user_id);
          return {
            ...comment,
            user: user ? formatUser(user, baseUrl) : null,
          };
        }),
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/videos/:id/comments', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const videoId = parseInt(req.params.id);

    const { comment, user_id, reply_to_comment_id, parent_id } = req.body;
    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Nội dung bình luận không được rỗng' });
    }

    const currentUser = await getAuthUser(req);
    const authorId = user_id ? parseInt(user_id) : currentUser.id;
    const author = (await findUserByParam(String(authorId))) || currentUser;
    const parentCommentId = reply_to_comment_id || parent_id || null;

    if (isMySQLActive) {
      const [vRows] = await pool.query('SELECT * FROM videos WHERE id = ?', [videoId]);
      if (vRows.length === 0) return res.status(404).json({ message: 'Video not found' });
      const video = vRows[0];

      const [maxRow] = await pool.query('SELECT MAX(id) as maxId FROM comments');
      const newId = (maxRow[0].maxId || 0) + 1;

      await pool.query(
        `INSERT INTO comments (id, video_id, user_id, parent_id, comment, likes_count, is_liked, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, 0, NOW(), NOW())`,
        [newId, videoId, author.id, parentCommentId, comment.trim()]
      );

      await pool.query('UPDATE videos SET comments_count = comments_count + 1 WHERE id = ?', [videoId]);

      // Reply notif
      if (parentCommentId) {
        const [parentRows] = await pool.query('SELECT * FROM comments WHERE id = ?', [parseInt(parentCommentId)]);
        if (parentRows.length > 0 && parentRows[0].user_id !== author.id) {
          await createNotification({
            recipient_id: parentRows[0].user_id,
            actor_id: author.id,
            type: 'reply',
            video_id: video.id,
            comment_id: newId,
            content: `replied to your comment: "${comment.trim().slice(0, 60)}"`,
          });
        }
      }

      // Comment notif
      if (video.user_id && video.user_id !== author.id) {
        await createNotification({
          recipient_id: video.user_id,
          actor_id: author.id,
          type: 'comment',
          video_id: video.id,
          comment_id: newId,
          content: `commented: "${comment.trim().slice(0, 60)}"`,
        });
      }

      // Mention notifs
      const mentionMatches = comment.match(/@([a-zA-Z0-9_.]+)/g);
      if (mentionMatches) {
        const mentionedNicks = [...new Set(mentionMatches.map((m) => m.slice(1).toLowerCase()))];
        for (const nick of mentionedNicks) {
          const mentionedUser = await findUserByParam(nick);
          if (mentionedUser && mentionedUser.id !== author.id && mentionedUser.id !== video.user_id) {
            await createNotification({
              recipient_id: mentionedUser.id,
              actor_id: author.id,
              type: 'mention',
              video_id: video.id,
              comment_id: newId,
              content: `mentioned you in a comment: "${comment.trim().slice(0, 60)}"`,
            });
          }
        }
      }

      const [newCommentRows] = await pool.query('SELECT * FROM comments WHERE id = ?', [newId]);
      return res.status(201).json({
        data: {
          ...newCommentRows[0],
          likes_count: 0,
          is_liked: false,
          user: formatUser(author, baseUrl),
        },
        message: 'Comment added successfully',
      });
    } else {
      const video = mockVideos.find((v) => v.id === videoId);
      if (!video) return res.status(404).json({ message: 'Video not found' });

      const newComment = {
        id: mockComments.length > 0 ? Math.max(...mockComments.map((c) => c.id)) + 1 : 1,
        video_id: videoId,
        user_id: author.id,
        parent_id: parentCommentId,
        comment: comment.trim(),
        likes_count: 0,
        is_liked: false,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      };

      mockComments.unshift(newComment);
      video.comments_count = (video.comments_count || 0) + 1;

      // Reply notif
      if (parentCommentId) {
        const parentComment = mockComments.find((c) => c.id === parseInt(parentCommentId));
        if (parentComment && parentComment.user_id !== author.id) {
          await createNotification({
            recipient_id: parentComment.user_id,
            actor_id: author.id,
            type: 'reply',
            video_id: video.id,
            comment_id: newComment.id,
            content: `replied to your comment: "${newComment.comment.slice(0, 60)}"`,
          });
        }
      }

      // Comment notif
      if (video.user_id && video.user_id !== author.id) {
        await createNotification({
          recipient_id: video.user_id,
          actor_id: author.id,
          type: 'comment',
          video_id: video.id,
          comment_id: newComment.id,
          content: `commented: "${newComment.comment.slice(0, 60)}"`,
        });
      }

      // Mention notifs
      const mentionMatches = newComment.comment.match(/@([a-zA-Z0-9_.]+)/g);
      if (mentionMatches) {
        const mentionedNicks = [...new Set(mentionMatches.map((m) => m.slice(1).toLowerCase()))];
        for (const nick of mentionedNicks) {
          const mentionedUser = await findUserByParam(nick);
          if (mentionedUser && mentionedUser.id !== author.id && mentionedUser.id !== video.user_id) {
            await createNotification({
              recipient_id: mentionedUser.id,
              actor_id: author.id,
              type: 'mention',
              video_id: video.id,
              comment_id: newComment.id,
              content: `mentioned you in a comment: "${newComment.comment.slice(0, 60)}"`,
            });
          }
        }
      }

      return res.status(201).json({
        data: {
          ...newComment,
          user: formatUser(author, baseUrl),
        },
        message: 'Comment added successfully',
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/comments/:id', async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);

    if (isMySQLActive) {
      const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [commentId]);
      if (rows.length === 0) return res.status(404).json({ message: 'Comment not found' });
      const deletedComment = rows[0];
      await pool.query('DELETE FROM comments WHERE id = ?', [commentId]);
      await pool.query('UPDATE videos SET comments_count = GREATEST(0, comments_count - 1) WHERE id = ?', [
        deletedComment.video_id,
      ]);
      return res.json({
        data: deletedComment,
        message: 'Comment deleted successfully',
      });
    } else {
      const index = mockComments.findIndex((c) => c.id === commentId);
      if (index === -1) return res.status(404).json({ message: 'Comment not found' });
      const [deletedComment] = mockComments.splice(index, 1);
      const video = mockVideos.find((v) => v.id === deletedComment.video_id);
      if (video && video.comments_count > 0) {
        video.comments_count -= 1;
      }
      return res.json({
        data: deletedComment,
        message: 'Comment deleted successfully',
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/comments/:id/like', async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);

    if (isMySQLActive) {
      const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [commentId]);
      if (rows.length === 0) return res.status(404).json({ message: 'Comment not found' });

      if (!rows[0].is_liked) {
        await pool.query('UPDATE comments SET is_liked = 1, likes_count = likes_count + 1 WHERE id = ?', [
          commentId,
        ]);
      }

      const [updated] = await pool.query('SELECT * FROM comments WHERE id = ?', [commentId]);
      return res.json({
        data: {
          ...updated[0],
          likes_count: Number(updated[0].likes_count),
          is_liked: Boolean(updated[0].is_liked),
        },
      });
    } else {
      const comment = mockComments.find((c) => c.id === commentId);
      if (!comment) return res.status(404).json({ message: 'Comment not found' });
      if (!comment.is_liked) {
        comment.is_liked = true;
        comment.likes_count += 1;
      }
      return res.json({ data: comment });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/comments/:id/unlike', async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);

    if (isMySQLActive) {
      const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [commentId]);
      if (rows.length === 0) return res.status(404).json({ message: 'Comment not found' });

      if (rows[0].is_liked) {
        await pool.query(
          'UPDATE comments SET is_liked = 0, likes_count = GREATEST(0, likes_count - 1) WHERE id = ?',
          [commentId]
        );
      }

      const [updated] = await pool.query('SELECT * FROM comments WHERE id = ?', [commentId]);
      return res.json({
        data: {
          ...updated[0],
          likes_count: Number(updated[0].likes_count),
          is_liked: Boolean(updated[0].is_liked),
        },
      });
    } else {
      const comment = mockComments.find((c) => c.id === commentId);
      if (!comment) return res.status(404).json({ message: 'Comment not found' });
      if (comment.is_liked) {
        comment.is_liked = false;
        comment.likes_count = Math.max(0, comment.likes_count - 1);
      }
      return res.json({ data: comment });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 8. TIKTOK LIVE STREAMS (/api/lives)
// ==========================================
app.get('/api/lives', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.max(1, parseInt(req.query.per_page) || 10);
    const offset = (page - 1) * perPage;

    if (isMySQLActive) {
      const [totalRow] = await pool.query('SELECT COUNT(*) as total FROM lives');
      const total = totalRow[0].total;

      const [liveRows] = await pool.query('SELECT * FROM lives ORDER BY id ASC LIMIT ? OFFSET ?', [
        perPage,
        offset,
      ]);
      const userIds = liveRows.map((l) => l.user_id);
      const userMap = await getUsersByIds(userIds);

      return res.json({
        data: liveRows.map((live) => formatLive(live, userMap.get(live.user_id), baseUrl)),
        meta: {
          pagination: {
            total,
            count: liveRows.length,
            per_page: perPage,
            current_page: page,
            total_pages: Math.ceil(total / perPage) || 1,
          },
        },
      });
    } else {
      const start = (page - 1) * perPage;
      const paginatedLives = mockLives.slice(start, start + perPage);

      return res.json({
        data: paginatedLives.map((live) => {
          const user = mockUsers.find((u) => u.id === live.user_id);
          return formatLive(live, user, baseUrl);
        }),
        meta: {
          pagination: {
            total: mockLives.length,
            count: paginatedLives.length,
            per_page: perPage,
            current_page: page,
            total_pages: Math.ceil(mockLives.length / perPage) || 1,
          },
        },
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/lives/:id', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const idOrRoom = req.params.id;

    if (isMySQLActive) {
      const [rows] = await pool.query('SELECT * FROM lives WHERE id = ? OR room_id = ? LIMIT 1', [
        parseInt(idOrRoom) || 0,
        idOrRoom,
      ]);

      if (rows.length === 0) return res.status(404).json({ message: 'Live stream not found' });
      const live = rows[0];
      const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [live.user_id]);
      return res.json({
        data: formatLive(live, userRows[0] || null, baseUrl),
      });
    } else {
      const live = mockLives.find((l) => l.id === parseInt(idOrRoom) || l.room_id === idOrRoom);
      if (!live) return res.status(404).json({ message: 'Live stream not found' });
      const user = mockUsers.find((u) => u.id === live.user_id);
      return res.json({
        data: formatLive(live, user, baseUrl),
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/lives/:id/like', async (req, res) => {
  try {
    const idOrRoom = req.params.id;

    if (isMySQLActive) {
      const [rows] = await pool.query('SELECT * FROM lives WHERE id = ? OR room_id = ? LIMIT 1', [
        parseInt(idOrRoom) || 0,
        idOrRoom,
      ]);
      if (rows.length === 0) return res.status(404).json({ message: 'Live stream not found' });
      const live = rows[0];
      await pool.query('UPDATE lives SET likes_count = likes_count + 1 WHERE id = ?', [live.id]);

      return res.json({
        data: {
          id: live.id,
          room_id: live.room_id,
          likes_count: Number(live.likes_count) + 1,
        },
      });
    } else {
      const live = mockLives.find((l) => l.id === parseInt(idOrRoom) || l.room_id === idOrRoom);
      if (!live) return res.status(404).json({ message: 'Live stream not found' });
      live.likes_count = (live.likes_count || 0) + 1;
      return res.json({
        data: {
          id: live.id,
          room_id: live.room_id,
          likes_count: live.likes_count,
        },
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 8.5. THÔNG BÁO (NOTIFICATIONS)
// ==========================================
app.get('/api/notifications', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const currentUser = await getAuthUser(req);
    const typeParam = (req.query.type || '').trim().toLowerCase();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.max(1, parseInt(req.query.per_page) || 20);
    const offset = (page - 1) * perPage;

    if (isMySQLActive) {
      let typeFilter = '';
      const params = [currentUser.id];

      if (typeParam && typeParam !== 'all') {
        if (typeParam === 'likes' || typeParam === 'like') {
          typeFilter = "AND type = 'like'";
        } else if (typeParam === 'comments' || typeParam === 'comment') {
          typeFilter = "AND type IN ('comment', 'reply')";
        } else if (typeParam === 'replies' || typeParam === 'reply') {
          typeFilter = "AND type = 'reply'";
        } else if (typeParam === 'mentions' || typeParam === 'mention') {
          typeFilter = "AND type = 'mention'";
        } else if (typeParam === 'followers' || typeParam === 'follow') {
          typeFilter = "AND type = 'follow'";
        } else {
          typeFilter = 'AND type = ?';
          params.push(typeParam);
        }
      }

      const [totalRow] = await pool.query(
        `SELECT COUNT(*) as total FROM notifications WHERE recipient_id = ? ${typeFilter}`,
        params
      );
      const total = totalRow[0].total;

      const [unreadRow] = await pool.query(
        'SELECT COUNT(*) as unread FROM notifications WHERE recipient_id = ? AND is_read = 0',
        [currentUser.id]
      );
      const unreadCount = Number(unreadRow[0].unread || 0);

      const queryParams = [...params, perPage, offset];
      const [notifRows] = await pool.query(
        `SELECT * FROM notifications WHERE recipient_id = ? ${typeFilter} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
        queryParams
      );

      const actorIds = notifRows.map((n) => n.actor_id).filter(Boolean);
      const videoIds = notifRows.map((n) => n.video_id).filter(Boolean);

      const actorMap = await getUsersByIds(actorIds);

      const videoMap = new Map();
      if (videoIds.length > 0) {
        const [vRows] = await pool.query('SELECT * FROM videos WHERE id IN (?)', [Array.from(new Set(videoIds))]);
        vRows.forEach((v) => videoMap.set(v.id, v));
      }

      return res.json({
        data: notifRows.map((n) =>
          formatNotification(n, actorMap.get(n.actor_id) || null, videoMap.get(n.video_id) || null, baseUrl)
        ),
        meta: {
          pagination: {
            total,
            count: notifRows.length,
            per_page: perPage,
            current_page: page,
            total_pages: Math.ceil(total / perPage) || 1,
          },
          unread_count: unreadCount,
          unreadCount,
        },
      });
    } else {
      let userNotifs = mockNotifications.filter((n) => n.recipient_id === currentUser.id);

      if (typeParam && typeParam !== 'all') {
        userNotifs = userNotifs.filter((n) => {
          const t = n.type.toLowerCase();
          if (typeParam === 'likes' || typeParam === 'like') return t === 'like';
          if (typeParam === 'comments' || typeParam === 'comment') return t === 'comment' || t === 'reply';
          if (typeParam === 'replies' || typeParam === 'reply') return t === 'reply';
          if (typeParam === 'mentions' || typeParam === 'mention') return t === 'mention';
          if (typeParam === 'followers' || typeParam === 'follow') return t === 'follow';
          if (typeParam === 'system') return t === 'system';
          if (typeParam === 'qa') return t === 'qa';
          return t === typeParam;
        });
      }

      userNotifs.sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0) || b.id - a.id
      );

      const paginated = userNotifs.slice(offset, offset + perPage);
      const unreadCount = mockNotifications.filter(
        (n) => n.recipient_id === currentUser.id && !n.is_read
      ).length;

      return res.json({
        data: paginated.map((n) => formatNotification(n, null, null, baseUrl)),
        meta: {
          pagination: {
            total: userNotifs.length,
            count: paginated.length,
            per_page: perPage,
            current_page: page,
            total_pages: Math.ceil(userNotifs.length / perPage) || 1,
          },
          unread_count: unreadCount,
          unreadCount,
        },
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/notifications/unread-count', async (req, res) => {
  try {
    const currentUser = await getAuthUser(req);

    if (isMySQLActive) {
      const [rows] = await pool.query(
        'SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND is_read = 0',
        [currentUser.id]
      );
      const unreadCount = Number(rows[0].count || 0);

      return res.json({
        data: {
          unread_count: unreadCount,
          unreadCount,
        },
        unread_count: unreadCount,
        unreadCount,
      });
    } else {
      const unreadCount = mockNotifications.filter(
        (n) => n.recipient_id === currentUser.id && !n.is_read
      ).length;

      return res.json({
        data: {
          unread_count: unreadCount,
          unreadCount,
        },
        unread_count: unreadCount,
        unreadCount,
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const handleMarkNotificationRead = async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const notifId = parseInt(req.params.id);
    const currentUser = await getAuthUser(req);

    if (isMySQLActive) {
      const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [notifId]);
      if (rows.length === 0) return res.status(404).json({ message: 'Notification not found' });
      const notif = rows[0];

      if (notif.recipient_id !== currentUser.id) {
        return res.status(403).json({ message: 'Forbidden: You cannot access other users notifications' });
      }

      await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [notifId]);
      const [updated] = await pool.query('SELECT * FROM notifications WHERE id = ?', [notifId]);
      const [actor] = notif.actor_id ? await pool.query('SELECT * FROM users WHERE id = ?', [notif.actor_id]) : [[]];
      const [video] = notif.video_id ? await pool.query('SELECT * FROM videos WHERE id = ?', [notif.video_id]) : [[]];

      return res.json({
        data: formatNotification(updated[0], actor[0] || null, video[0] || null, baseUrl),
        message: 'Notification marked as read',
      });
    } else {
      const notif = mockNotifications.find((n) => n.id === notifId);
      if (!notif) return res.status(404).json({ message: 'Notification not found' });

      if (notif.recipient_id !== currentUser.id) {
        return res.status(403).json({ message: 'Forbidden: You cannot access other users notifications' });
      }

      notif.is_read = true;
      return res.json({
        data: formatNotification(notif, null, null, baseUrl),
        message: 'Notification marked as read',
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

app.put('/api/notifications/:id/read', handleMarkNotificationRead);
app.patch('/api/notifications/:id/read', handleMarkNotificationRead);

const handleMarkAllNotificationsRead = async (req, res) => {
  try {
    const currentUser = await getAuthUser(req);

    if (isMySQLActive) {
      await pool.query('UPDATE notifications SET is_read = 1 WHERE recipient_id = ?', [currentUser.id]);
    } else {
      mockNotifications.forEach((n) => {
        if (n.recipient_id === currentUser.id) {
          n.is_read = true;
        }
      });
    }

    res.json({
      message: 'All notifications marked as read',
      unread_count: 0,
      unreadCount: 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

app.put('/api/notifications/read-all', handleMarkAllNotificationsRead);
app.patch('/api/notifications/read-all', handleMarkAllNotificationsRead);

app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const notifId = parseInt(req.params.id);
    const currentUser = await getAuthUser(req);

    if (isMySQLActive) {
      const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [notifId]);
      if (rows.length === 0) return res.status(404).json({ message: 'Notification not found' });

      if (rows[0].recipient_id !== currentUser.id) {
        return res.status(403).json({ message: 'Forbidden: You cannot delete other users notifications' });
      }

      await pool.query('DELETE FROM notifications WHERE id = ?', [notifId]);
      return res.json({
        data: rows[0],
        message: 'Notification deleted successfully',
      });
    } else {
      const index = mockNotifications.findIndex((n) => n.id === notifId);
      if (index === -1) return res.status(404).json({ message: 'Notification not found' });

      if (mockNotifications[index].recipient_id !== currentUser.id) {
        return res.status(403).json({ message: 'Forbidden: You cannot delete other users notifications' });
      }

      const [deleted] = mockNotifications.splice(index, 1);
      return res.json({
        data: deleted,
        message: 'Notification deleted successfully',
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/notifications', async (req, res) => {
  try {
    const currentUser = await getAuthUser(req);

    if (isMySQLActive) {
      const [result] = await pool.query('DELETE FROM notifications WHERE recipient_id = ?', [currentUser.id]);
      return res.json({
        message: 'All notifications deleted successfully',
        deleted_count: result.affectedRows,
      });
    } else {
      const initialCount = mockNotifications.length;
      for (let i = mockNotifications.length - 1; i >= 0; i--) {
        if (mockNotifications[i].recipient_id === currentUser.id) {
          mockNotifications.splice(i, 1);
        }
      }
      return res.json({
        message: 'All notifications deleted successfully',
        deleted_count: initialCount - mockNotifications.length,
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const currentUser = await getAuthUser(req);
    const { recipient_id, actor_id, type, content, video_id, comment_id } = req.body;

    const targetRecipientId = recipient_id ? parseInt(recipient_id) : currentUser.id;
    const targetActorId = actor_id
      ? parseInt(actor_id)
      : currentUser.id === targetRecipientId
      ? 1
      : currentUser.id;

    if (!type || !content) {
      return res.status(400).json({ message: 'type and content are required' });
    }

    const newNotif = await createNotification({
      recipient_id: targetRecipientId,
      actor_id: targetActorId,
      type: type.toLowerCase(),
      content,
      video_id: video_id ? parseInt(video_id) : null,
      comment_id: comment_id ? parseInt(comment_id) : null,
    });

    if (!newNotif) {
      return res.status(400).json({
        message: 'Cannot create notification (actor and recipient cannot be the same)',
      });
    }

    let actor = null;
    let video = null;
    if (isMySQLActive) {
      const [aRows] = await pool.query('SELECT * FROM users WHERE id = ?', [targetActorId]);
      actor = aRows[0] || null;
      if (newNotif.video_id) {
        const [vRows] = await pool.query('SELECT * FROM videos WHERE id = ?', [newNotif.video_id]);
        video = vRows[0] || null;
      }
    }

    res.status(201).json({
      data: formatNotification(newNotif, actor, video, baseUrl),
      message: 'Notification created successfully',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 9. TRANG CHỦ & API DOCUMENTATION
// ==========================================
app.get('/', (req, res) => {
  const modeLabel = isMySQLActive ? 'MySQL 8.4 Database' : 'Mock File Data (Cloud Fallback)';
  const modeColor = isMySQLActive ? '#00b4d8' : '#2ec4b6';

  res.send(`
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="UTF-8">
    <title>TikTok API Server</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #161823; line-height: 1.6; background-color: #fafafa; }
      .card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
      h1 { color: #fe2c55; margin-top: 0; display: flex; align-items: center; gap: 10px; }
      .badge { background: ${modeColor}; color: white; padding: 3px 10px; border-radius: 6px; font-size: 13px; font-weight: bold; }
      .endpoint { background: #f8f8f8; border-left: 4px solid #fe2c55; padding: 12px 16px; margin: 12px 0; border-radius: 0 8px 8px 0; }
      code { background: #eee; padding: 2px 6px; border-radius: 4px; font-size: 13px; font-family: Consolas, monospace; }
      a { color: #fe2c55; text-decoration: none; font-weight: 600; }
      a:hover { text-decoration: underline; }
      .tag { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-right: 6px; }
      .tag-get { background: #e3f2fd; color: #1976d2; }
      .tag-post { background: #e8f5e9; color: #388e3c; }
      .tag-patch { background: #fff3e0; color: #f57c00; }
      .tag-delete { background: #ffebee; color: #d32f2f; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>TikTok API Server <span class="badge">${modeLabel}</span></h1>
      <p>Chế độ lưu trữ: <strong>${modeLabel}</strong>. Sẵn sàng kết nối 100% với Frontend TikTok UI.</p>
      
      <h3>1. Tài khoản & Xác thực (Auth & Profile)</h3>
      <div class="endpoint">
        <span class="tag tag-get">GET</span> <strong>Thông tin profile:</strong> 
        <a href="/api/users/@bear" target="_blank">/api/users/@bear</a>
      </div>
      <div class="endpoint">
        <span class="tag tag-get">GET</span> <strong>Gợi ý tài khoản (Sidebar):</strong> 
        <a href="/api/users/suggested?page=1&per_page=5" target="_blank">/api/users/suggested?page=1&per_page=5</a>
      </div>
      <div class="endpoint">
        <span class="tag tag-get">GET</span> <strong>Tài khoản đang theo dõi:</strong> 
        <a href="/api/users/following?page=1" target="_blank">/api/users/following?page=1</a>
      </div>

      <h3>2. Video Feeds</h3>
      <div class="endpoint">
        <span class="tag tag-get">GET</span> <strong>Danh sách Video For You:</strong> 
        <a href="/api/videos?type=for-you&page=1" target="_blank">/api/videos?type=for-you&page=1</a>
      </div>
      <div class="endpoint">
        <span class="tag tag-get">GET</span> <strong>Video của người dùng:</strong> 
        <a href="/api/users/@bear/videos" target="_blank">/api/users/@bear/videos</a>
      </div>

      <h3>3. Hoạt động & Thông báo</h3>
      <div class="endpoint">
        <span class="tag tag-get">GET</span> <strong>Danh sách thông báo:</strong> 
        <a href="/api/notifications" target="_blank">/api/notifications</a>
      </div>
      <div class="endpoint">
        <span class="tag tag-get">GET</span> <strong>Số lượng chưa đọc:</strong> 
        <a href="/api/notifications/unread-count" target="_blank">/api/notifications/unread-count</a>
      </div>
    </div>
  </body>
  </html>
  `);
});

// ==========================================
// KHỞI ĐỘNG SERVER (DUAL MODE: MYSQL & FALLBACK)
// ==========================================
const PORT = process.env.PORT || 8080;

const startServer = async () => {
  try {
    const conn = await pool.getConnection();
    conn.release();
    isMySQLActive = true;
    console.log('✅ Da ket noi thanh cong den MySQL Server!');
    await initDatabase(false);
  } catch (err) {
    isMySQLActive = false;
    console.log('ℹ️ Khong the ket noi MySQL (hoac dang chay tren Cloud Render).');
    console.log('👉 Tu dong chuyen sang che do FALLBACK (Mock File Data) san co.');
  }

  app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(` TikTok API Server dang chay tai: http://localhost:${PORT}`);
    console.log(
      ` Che do luu tru: ${
        isMySQLActive ? 'MySQL 8.4 Database [tiktok_db]' : 'Mock File Data (Cloud Fallback)'
      }`
    );
    console.log(` Test Profile: http://localhost:${PORT}/api/users/@bear`);
    console.log(` Test Videos: http://localhost:${PORT}/api/videos?type=for-you`);
    console.log(` Test Search: http://localhost:${PORT}/api/users/search?q=bear`);
    console.log(`=================================================\n`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
