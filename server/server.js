require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const pool = require('./db');
const initDatabase = require('./scripts/init-db');

const app = express();

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
    avatar
  };
};

const formatFeedPost = (post, user, baseUrl) => {
  if (!post) return null;
  const formattedUser = user ? formatUser(user, baseUrl) : null;
  const image_url = post.image_url
    ? post.image_url
    : post.image_file
    ? resolveMediaUrl(post.image_file, baseUrl)
    : (formattedUser ? formattedUser.avatar : null);

  return {
    ...post,
    is_liked: Boolean(post.is_liked),
    likes_count: Number(post.likes_count || 0),
    comments_count: Number(post.comments_count || 0),
    shares_count: Number(post.shares_count || 0),
    views_count: Number(post.views_count || 0),
    image_url,
    user: formattedUser
  };
};

const formatLive = (live, user, baseUrl) => {
  if (!live) return null;
  const formattedUser = user ? formatUser(user, baseUrl) : null;
  const cover_url = live.cover_url
    ? live.cover_url
    : live.image_file
    ? resolveMediaUrl(live.image_file, baseUrl)
    : (formattedUser ? formattedUser.avatar : null);

  return {
    ...live,
    is_live: Boolean(live.is_live),
    viewer_count: Number(live.viewer_count || 0),
    likes_count: Number(live.likes_count || 0),
    cover_url,
    user: formattedUser
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
  if (video) {
    videoThumb =
      video.thumb_url ||
      (video.image_url
        ? video.image_url
        : video.image_file
        ? resolveMediaUrl(video.image_file, baseUrl)
        : null);
  }
  if (!videoThumb && ['like', 'comment', 'mention', 'reply'].includes(notif.type.toLowerCase())) {
    videoThumb =
      'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=120&q=80';
  }

  const actor = actorUser
    ? {
        id: actorUser.id,
        nickname: actorUser.nickname,
        full_name: actorUser.full_name,
        avatar: formatUser(actorUser, baseUrl).avatar,
        tick: Boolean(actorUser.tick),
        is_followed: Boolean(actorUser.is_followed),
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

const getAuthUser = async (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
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
      }
    } catch (e) {
      // Ignore token parsing error
    }
  }
  // Fallback to Bear or first user
  const [rows] = await pool.query("SELECT * FROM users WHERE nickname = 'bear' LIMIT 1");
  if (rows.length > 0) return rows[0];
  const [first] = await pool.query('SELECT * FROM users ORDER BY id ASC LIMIT 1');
  return first[0] || null;
};

const findUserByParam = async (param) => {
  if (!param) return null;
  const clean = param.replace(/^@/, '').trim().toLowerCase();
  const idNum = parseInt(clean, 10);
  if (!isNaN(idNum) && String(idNum) === clean) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [idNum]);
    if (rows.length > 0) return rows[0];
  }
  const [rows] = await pool.query('SELECT * FROM users WHERE LOWER(nickname) = ?', [clean]);
  return rows[0] || null;
};

const getUsersByIds = async (userIds) => {
  if (!userIds || userIds.length === 0) return new Map();
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0) return new Map();

  const [rows] = await pool.query('SELECT * FROM users WHERE id IN (?)', [uniqueIds]);
  const map = new Map();
  rows.forEach((u) => map.set(u.id, u));
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
};

const removeNotification = async ({ recipient_id, actor_id, type, video_id = null }) => {
  const normalizedType = type.toLowerCase();
  let sql = 'DELETE FROM notifications WHERE recipient_id = ? AND actor_id = ? AND type = ? AND is_read = 0';
  const params = [recipient_id, actor_id, normalizedType];
  if (video_id) {
    sql += ' AND video_id = ?';
    params.push(video_id);
  }
  sql += ' LIMIT 1';
  await pool.query(sql, params);
};

// ==========================================
// 1. AUTH & TÀI KHOẢN (AUTHENTICATION)
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const { email, nickname } = req.body;

    let user = null;
    if (nickname) {
      const [rows] = await pool.query('SELECT * FROM users WHERE LOWER(nickname) = ?', [nickname.trim().toLowerCase()]);
      user = rows[0] || null;
    } else if (email) {
      const [rows] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(nickname) = ?', [
        email.trim().toLowerCase(),
        'bear',
      ]);
      user = rows[0] || null;
    }

    if (!user) {
      const [rows] = await pool.query("SELECT * FROM users WHERE nickname = 'bear' LIMIT 1");
      user = rows[0] || null;
    }
    if (!user) {
      const [rows] = await pool.query('SELECT * FROM users ORDER BY id ASC LIMIT 1');
      user = rows[0] || null;
    }

    res.json({
      data: formatUser(user, baseUrl),
      token:
        'mock-jwt-token-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        Buffer.from(JSON.stringify({ id: user.id, nickname: user.nickname })).toString('base64'),
      message: 'Đăng nhập thành công',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const { nickname, full_name, email } = req.body;

    if (!nickname) {
      return res.status(400).json({ message: 'Nickname là bắt buộc' });
    }

    const cleanNick = nickname.replace(/^@/, '').trim();
    const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(nickname) = ?', [cleanNick.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Nickname đã tồn tại' });
    }

    const [maxRow] = await pool.query('SELECT MAX(id) as maxId FROM users');
    const newId = (maxRow[0].maxId || 0) + 1;
    const firstName = full_name ? full_name.split(' ').slice(0, -1).join(' ') : '';
    const lastName = full_name ? full_name.split(' ').slice(-1).join(' ') : cleanNick;
    const avatarUrl =
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80';

    await pool.query(
      `INSERT INTO users (
        id, first_name, last_name, full_name, nickname, email,
        avatar_url, tick, is_followed, is_personal, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, NOW(), NOW())`,
      [newId, firstName, lastName, full_name || cleanNick, cleanNick, email || null, avatarUrl]
    );

    const [newUserRows] = await pool.query('SELECT * FROM users WHERE id = ?', [newId]);
    const newUser = newUserRows[0];

    res.status(201).json({
      data: formatUser(newUser, baseUrl),
      token:
        'mock-jwt-token-registered.' +
        Buffer.from(JSON.stringify({ id: newUser.id, nickname: newUser.nickname })).toString('base64'),
      message: 'Đăng ký tài khoản thành công',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const user = await getAuthUser(req);
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

    const limit = type === 'less' ? 5 : 50;
    const [userRows] = await pool.query(
      `SELECT * FROM users 
       WHERE nickname LIKE ? OR full_name LIKE ? OR first_name LIKE ? OR last_name LIKE ?
       LIMIT ?`,
      [`%${rawQuery}%`, `%${rawQuery}%`, `%${rawQuery}%`, `%${rawQuery}%`, limit]
    );

    res.json({
      data: userRows.map((u) => formatUser(u, baseUrl)),
    });
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

    const [videoRows] = await pool.query(
      `SELECT * FROM videos WHERE description LIKE ? OR music LIKE ? ORDER BY id DESC LIMIT 50`,
      [`%${rawQuery}%`, `%${rawQuery}%`]
    );

    const userIds = videoRows.map((v) => v.user_id);
    const userMap = await getUsersByIds(userIds);

    res.json({
      data: videoRows.map((v) => formatFeedPost(v, userMap.get(v.user_id), baseUrl)),
    });
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

    const [totalRow] = await pool.query('SELECT COUNT(*) as total FROM users');
    const total = totalRow[0].total;

    const [userRows] = await pool.query('SELECT * FROM users ORDER BY id ASC LIMIT ? OFFSET ?', [perPage, offset]);

    res.json({
      data: userRows.map((u) => formatUser(u, baseUrl)),
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/users/following', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.max(1, parseInt(req.query.per_page) || 5);
    const offset = (page - 1) * perPage;

    const [totalRow] = await pool.query('SELECT COUNT(*) as total FROM users WHERE is_followed = 1');
    const total = totalRow[0].total;

    const [userRows] = await pool.query('SELECT * FROM users WHERE is_followed = 1 ORDER BY id ASC LIMIT ? OFFSET ?', [
      perPage,
      offset,
    ]);

    res.json({
      data: userRows.map((u) => formatUser(u, baseUrl)),
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 4. HỒ SƠ NGƯỜI DÙNG & CHỈNH SỬA PROFILE
// ==========================================
const handleGetUserProfile = async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const param = req.params.nickname || req.params.username;
    const user = await findUserByParam(param);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const formatted = formatUser(user, baseUrl);
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.includes('null')) {
      formatted.is_followed = false;
    }

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

    res.json({
      data: formatUser(updatedRows[0], baseUrl),
      message: 'Profile updated successfully',
    });
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

    const [userVideos] = await pool.query('SELECT * FROM videos WHERE user_id = ? ORDER BY id DESC', [user.id]);
    res.json({
      data: userVideos.map((video) => formatFeedPost(video, user, baseUrl)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

app.get('/api/users/@:nickname/videos', handleGetUserVideos);
app.get('/api/users/:nickname/videos', handleGetUserVideos);

// ==========================================
// 5. FOLLOW & UNFOLLOW USER
// ==========================================
const handleFollow = async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const param = req.params.id || req.params.nickname;
    const user = await findUserByParam(param);

    if (!user) return res.status(404).json({ message: 'User not found' });

    const currentUser = await getAuthUser(req);

    if (!user.is_followed) {
      await pool.query('UPDATE users SET is_followed = 1, followers_count = followers_count + 1 WHERE id = ?', [
        user.id,
      ]);
    }

    if (user.id !== currentUser.id) {
      await createNotification({
        recipient_id: user.id,
        actor_id: currentUser.id,
        type: 'follow',
        content: 'started following you',
      });
    }

    const [updated] = await pool.query('SELECT * FROM users WHERE id = ?', [user.id]);
    res.json({ data: formatUser(updated[0], baseUrl), message: 'Followed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const handleUnfollow = async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const param = req.params.id || req.params.nickname;
    const user = await findUserByParam(param);

    if (!user) return res.status(404).json({ message: 'User not found' });

    const currentUser = await getAuthUser(req);

    if (user.is_followed) {
      await pool.query(
        'UPDATE users SET is_followed = 0, followers_count = GREATEST(0, followers_count - 1) WHERE id = ?',
        [user.id]
      );
    }

    await removeNotification({
      recipient_id: user.id,
      actor_id: currentUser.id,
      type: 'follow',
    });

    const [updated] = await pool.query('SELECT * FROM users WHERE id = ?', [user.id]);
    res.json({ data: formatUser(updated[0], baseUrl), message: 'Unfollowed successfully' });
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

    let whereClause = '';
    if (type === 'following') {
      whereClause = 'WHERE user_id IN (SELECT id FROM users WHERE is_followed = 1)';
    }

    const [totalRow] = await pool.query(`SELECT COUNT(*) as total FROM videos ${whereClause}`);
    const total = totalRow[0].total;

    const [videoRows] = await pool.query(
      `SELECT * FROM videos ${whereClause} ORDER BY id ASC LIMIT ? OFFSET ?`,
      [perPage, offset]
    );

    const userIds = videoRows.map((v) => v.user_id);
    const userMap = await getUsersByIds(userIds);

    res.json({
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/videos/:id', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const videoId = parseInt(req.params.id);
    const [rows] = await pool.query('SELECT * FROM videos WHERE id = ?', [videoId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const video = rows[0];
    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [video.user_id]);

    res.json({
      data: formatFeedPost(video, userRows[0] || null, baseUrl),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/videos', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const { description, file_url, thumb_url, music, user_id } = req.body;

    const authorId = user_id || 999;
    const [authorRows] = await pool.query('SELECT * FROM users WHERE id = ?', [authorId]);
    const author = authorRows[0] || (await getAuthUser(req));

    const [maxRow] = await pool.query('SELECT MAX(id) as maxId FROM videos');
    const newId = (maxRow[0].maxId || 0) + 1;
    const uuid = 'vid-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    const thumb = thumb_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80';
    const file = file_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    const desc = description || 'Video mới đăng tải #tiktok #creator';
    const bgm = music || `nhạc nền - ${author ? author.full_name || author.nickname : 'Creator'}`;

    await pool.query(
      `INSERT INTO videos (
        id, uuid, user_id, thumb_url, file_url, description, music,
        likes_count, comments_count, shares_count, views_count, is_liked,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 1, 0, NOW(), NOW())`,
      [newId, uuid, author ? author.id : 999, thumb, file, desc, bgm]
    );

    const [createdRows] = await pool.query('SELECT * FROM videos WHERE id = ?', [newId]);

    res.status(201).json({
      data: formatFeedPost(createdRows[0], author, baseUrl),
      message: 'Video uploaded successfully',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/videos/:id', async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const [rows] = await pool.query('SELECT * FROM videos WHERE id = ?', [videoId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }

    await pool.query('DELETE FROM videos WHERE id = ?', [videoId]);
    res.json({
      data: rows[0],
      message: 'Video deleted successfully',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/videos/:id/view', async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    await pool.query('UPDATE videos SET views_count = views_count + 1 WHERE id = ?', [videoId]);
    const [rows] = await pool.query('SELECT views_count FROM videos WHERE id = ?', [videoId]);

    if (rows.length === 0) return res.status(404).json({ message: 'Video not found' });
    res.json({ data: { views_count: Number(rows[0].views_count) } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/videos/:id/like', async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const [rows] = await pool.query('SELECT * FROM videos WHERE id = ?', [videoId]);

    if (rows.length === 0) return res.status(404).json({ message: 'Video not found' });
    const video = rows[0];

    const currentUser = await getAuthUser(req);
    const actorId = req.body?.user_id ? parseInt(req.body.user_id) : currentUser.id;

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
    res.json({ data: formatFeedPost(updated[0], author[0] || null, getBaseUrl(req)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/videos/:id/unlike', async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const [rows] = await pool.query('SELECT * FROM videos WHERE id = ?', [videoId]);

    if (rows.length === 0) return res.status(404).json({ message: 'Video not found' });
    const video = rows[0];

    const currentUser = await getAuthUser(req);
    const actorId = req.body?.user_id ? parseInt(req.body.user_id) : currentUser.id;

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
    res.json({ data: formatFeedPost(updated[0], author[0] || null, getBaseUrl(req)) });
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

    const [videoComments] = await pool.query('SELECT * FROM comments WHERE video_id = ? ORDER BY id DESC', [videoId]);
    const userIds = videoComments.map((c) => c.user_id);
    const userMap = await getUsersByIds(userIds);

    res.json({
      data: videoComments.map((comment) => ({
        ...comment,
        likes_count: Number(comment.likes_count || 0),
        is_liked: Boolean(comment.is_liked),
        user: formatUser(userMap.get(comment.user_id), baseUrl),
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/videos/:id/comments', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const videoId = parseInt(req.params.id);
    const [vRows] = await pool.query('SELECT * FROM videos WHERE id = ?', [videoId]);

    if (vRows.length === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }
    const video = vRows[0];

    const { comment, user_id, reply_to_comment_id, parent_id } = req.body;
    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Nội dung bình luận không được rỗng' });
    }

    const currentUser = await getAuthUser(req);
    const authorId = user_id ? parseInt(user_id) : currentUser.id;
    const [authorRows] = await pool.query('SELECT * FROM users WHERE id = ?', [authorId]);
    const author = authorRows[0] || currentUser;

    const parentCommentId = reply_to_comment_id || parent_id || null;

    const [maxRow] = await pool.query('SELECT MAX(id) as maxId FROM comments');
    const newId = (maxRow[0].maxId || 0) + 1;

    await pool.query(
      `INSERT INTO comments (id, video_id, user_id, parent_id, comment, likes_count, is_liked, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, 0, NOW(), NOW())`,
      [newId, videoId, author.id, parentCommentId, comment.trim()]
    );

    await pool.query('UPDATE videos SET comments_count = comments_count + 1 WHERE id = ?', [videoId]);

    // 1. Thông báo REPLY
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

    // 2. Thông báo COMMENT
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

    // 3. Thông báo MENTION
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

    res.status(201).json({
      data: {
        ...newCommentRows[0],
        likes_count: 0,
        is_liked: false,
        user: formatUser(author, baseUrl),
      },
      message: 'Comment added successfully',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/comments/:id', async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [commentId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const deletedComment = rows[0];
    await pool.query('DELETE FROM comments WHERE id = ?', [commentId]);
    await pool.query('UPDATE videos SET comments_count = GREATEST(0, comments_count - 1) WHERE id = ?', [
      deletedComment.video_id,
    ]);

    res.json({
      data: deletedComment,
      message: 'Comment deleted successfully',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/comments/:id/like', async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [commentId]);

    if (rows.length === 0) return res.status(404).json({ message: 'Comment not found' });

    if (!rows[0].is_liked) {
      await pool.query('UPDATE comments SET is_liked = 1, likes_count = likes_count + 1 WHERE id = ?', [commentId]);
    }

    const [updated] = await pool.query('SELECT * FROM comments WHERE id = ?', [commentId]);
    res.json({
      data: {
        ...updated[0],
        likes_count: Number(updated[0].likes_count),
        is_liked: Boolean(updated[0].is_liked),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/comments/:id/unlike', async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [commentId]);

    if (rows.length === 0) return res.status(404).json({ message: 'Comment not found' });

    if (rows[0].is_liked) {
      await pool.query(
        'UPDATE comments SET is_liked = 0, likes_count = GREATEST(0, likes_count - 1) WHERE id = ?',
        [commentId]
      );
    }

    const [updated] = await pool.query('SELECT * FROM comments WHERE id = ?', [commentId]);
    res.json({
      data: {
        ...updated[0],
        likes_count: Number(updated[0].likes_count),
        is_liked: Boolean(updated[0].is_liked),
      },
    });
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

    const [totalRow] = await pool.query('SELECT COUNT(*) as total FROM lives');
    const total = totalRow[0].total;

    const [liveRows] = await pool.query('SELECT * FROM lives ORDER BY id ASC LIMIT ? OFFSET ?', [perPage, offset]);
    const userIds = liveRows.map((l) => l.user_id);
    const userMap = await getUsersByIds(userIds);

    res.json({
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/lives/:id', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const idOrRoom = req.params.id;
    const [rows] = await pool.query('SELECT * FROM lives WHERE id = ? OR room_id = ? LIMIT 1', [
      parseInt(idOrRoom) || 0,
      idOrRoom,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Live stream not found' });
    }

    const live = rows[0];
    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [live.user_id]);

    res.json({
      data: formatLive(live, userRows[0] || null, baseUrl),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/lives/:id/like', async (req, res) => {
  try {
    const idOrRoom = req.params.id;
    const [rows] = await pool.query('SELECT * FROM lives WHERE id = ? OR room_id = ? LIMIT 1', [
      parseInt(idOrRoom) || 0,
      idOrRoom,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Live stream not found' });
    }

    const live = rows[0];
    await pool.query('UPDATE lives SET likes_count = likes_count + 1 WHERE id = ?', [live.id]);

    res.json({
      data: {
        id: live.id,
        room_id: live.room_id,
        likes_count: Number(live.likes_count) + 1,
      },
    });
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

    res.json({
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/notifications/unread-count', async (req, res) => {
  try {
    const currentUser = await getAuthUser(req);
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND is_read = 0',
      [currentUser.id]
    );
    const unreadCount = Number(rows[0].count || 0);

    res.json({
      data: {
        unread_count: unreadCount,
        unreadCount,
      },
      unread_count: unreadCount,
      unreadCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const handleMarkNotificationRead = async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    const notifId = parseInt(req.params.id);
    const currentUser = await getAuthUser(req);

    const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [notifId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const notif = rows[0];
    if (notif.recipient_id !== currentUser.id) {
      return res.status(403).json({ message: 'Forbidden: You cannot access other users notifications' });
    }

    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [notifId]);
    const [updated] = await pool.query('SELECT * FROM notifications WHERE id = ?', [notifId]);
    const [actor] = notif.actor_id ? await pool.query('SELECT * FROM users WHERE id = ?', [notif.actor_id]) : [[]];
    const [video] = notif.video_id ? await pool.query('SELECT * FROM videos WHERE id = ?', [notif.video_id]) : [[]];

    res.json({
      data: formatNotification(updated[0], actor[0] || null, video[0] || null, baseUrl),
      message: 'Notification marked as read',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

app.put('/api/notifications/:id/read', handleMarkNotificationRead);
app.patch('/api/notifications/:id/read', handleMarkNotificationRead);

const handleMarkAllNotificationsRead = async (req, res) => {
  try {
    const currentUser = await getAuthUser(req);
    await pool.query('UPDATE notifications SET is_read = 1 WHERE recipient_id = ?', [currentUser.id]);

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

    const [rows] = await pool.query('SELECT * FROM notifications WHERE id = ?', [notifId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (rows[0].recipient_id !== currentUser.id) {
      return res.status(403).json({ message: 'Forbidden: You cannot delete other users notifications' });
    }

    await pool.query('DELETE FROM notifications WHERE id = ?', [notifId]);
    res.json({
      data: rows[0],
      message: 'Notification deleted successfully',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/notifications', async (req, res) => {
  try {
    const currentUser = await getAuthUser(req);
    const [result] = await pool.query('DELETE FROM notifications WHERE recipient_id = ?', [currentUser.id]);

    res.json({
      message: 'All notifications deleted successfully',
      deleted_count: result.affectedRows,
    });
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

    const [actor] = await pool.query('SELECT * FROM users WHERE id = ?', [targetActorId]);
    const [video] = newNotif.video_id ? await pool.query('SELECT * FROM videos WHERE id = ?', [newNotif.video_id]) : [[]];

    res.status(201).json({
      data: formatNotification(newNotif, actor[0] || null, video[0] || null, baseUrl),
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
  res.send(`
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="UTF-8">
    <title>TikTok MySQL Backend API</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #161823; line-height: 1.6; background-color: #fafafa; }
      .card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
      h1 { color: #fe2c55; margin-top: 0; display: flex; align-items: center; gap: 10px; }
      .badge { background: #00b4d8; color: white; padding: 2px 8px; border-radius: 4px; font-size: 13px; font-weight: bold; }
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
      <h1>TikTok API Server <span class="badge">MySQL 8.4</span></h1>
      <p>Hệ thống backend đã kết nối trực tiếp với cơ sở dữ liệu <strong>MySQL (tiktok_db)</strong>.</p>
      
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
// KHỞI ĐỘNG SERVER & AUTO INIT DB
// ==========================================
const PORT = process.env.PORT || 8080;

if (process.env.NODE_ENV !== 'test') {
  initDatabase(false)
    .then(() => {
      app.listen(PORT, () => {
        console.log(`\n=================================================`);
        console.log(` TikTok API Server (MySQL) đang chạy tại: http://localhost:${PORT}`);
        console.log(` Database: MySQL 8.4 [tiktok_db] trên cổng ${process.env.DB_PORT || 3306}`);
        console.log(` Test Profile: http://localhost:${PORT}/api/users/@bear`);
        console.log(` Test Videos: http://localhost:${PORT}/api/videos?type=for-you`);
        console.log(` Test Search: http://localhost:${PORT}/api/users/search?q=bear`);
        console.log(` Test Notifications: http://localhost:${PORT}/api/notifications`);
        console.log(`=================================================\n`);
      });
    })
    .catch((err) => {
      console.error('❌ Lỗi kết nối MySQL khi khởi động server:', err.message);
      app.listen(PORT, () => {
        console.log(` Server đang lắng nghe tại http://localhost:${PORT} (Chế độ kiểm tra)`);
      });
    });
}

module.exports = app;
