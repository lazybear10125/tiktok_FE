const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const users = require('./data/users');
const videos = require('./data/videos');
const comments = require('./data/comments');
const lives = require('./data/lives');
const notifications = require('./data/notifications');

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

const formatFeedPost = (post, baseUrl) => {
  if (!post) return null;
  const user = users.find((u) => u.id === post.user_id);
  const image_url = post.image_url
    ? post.image_url
    : post.image_file
    ? resolveMediaUrl(post.image_file, baseUrl)
    : (user ? (user.avatar_url || resolveMediaUrl(user.avatar_file, baseUrl)) : null);

  return {
    ...post,
    image_url,
    user: user ? formatUser(user, baseUrl) : null
  };
};

const formatLive = (live, baseUrl) => {
  if (!live) return null;
  const user = users.find((u) => u.id === live.user_id);
  const cover_url = live.cover_url
    ? live.cover_url
    : live.image_file
    ? resolveMediaUrl(live.image_file, baseUrl)
    : (user ? (user.avatar_url || resolveMediaUrl(user.avatar_file, baseUrl)) : null);

  return {
    ...live,
    cover_url,
    user: user ? formatUser(user, baseUrl) : null
  };
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
    avatar
  };
};

const getAuthUser = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        if (payload.id) {
          const user = users.find((u) => u.id === payload.id);
          if (user) return user;
        }
        if (payload.nickname) {
          const user = users.find((u) => u.nickname.toLowerCase() === payload.nickname.toLowerCase());
          if (user) return user;
        }
      }
    } catch (e) {
      // Ignore token parsing error
    }
  }
  // Fallback to Bear or first user
  return users.find((u) => u.nickname === 'bear') || users[0];
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

const formatNotification = (notif, baseUrl) => {
  if (!notif) return null;
  const actor = notif.actor_id ? users.find((u) => u.id === notif.actor_id) : null;
  const video = notif.video_id ? videos.find((v) => v.id === notif.video_id) : null;

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

  const actorUser = actor
    ? {
        id: actor.id,
        nickname: actor.nickname,
        full_name: actor.full_name,
        avatar: formatUser(actor, baseUrl).avatar,
        tick: !!actor.tick,
        is_followed: !!actor.is_followed,
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
    actorUsername: actorUser.nickname,
    actorAvatar: actorUser.avatar,
    actorFullName: actorUser.full_name,
    type: normalizedType,
    content: notif.content,
    video_id: notif.video_id,
    videoId: notif.video_id,
    video_thumb: videoThumb,
    videoThumbnail: videoThumb,
    comment_id: notif.comment_id,
    commentId: notif.comment_id,
    is_read: !!notif.is_read,
    isRead: !!notif.is_read,
    is_following: !!actorUser.is_followed,
    created_at: notif.created_at,
    createdAt: notif.created_at,
    time: formatRelativeTime(notif.created_at),
    user: actorUser,
  };
};

const createNotification = ({
  recipient_id,
  actor_id,
  type,
  content,
  video_id = null,
  comment_id = null,
}) => {
  if (!recipient_id || !actor_id) return null;
  if (recipient_id === actor_id) return null; // Không gửi thông báo cho chính mình

  const normalizedType = type.toLowerCase();

  // Kiểm tra trùng lặp chưa đọc cho cùng sự kiện
  const existing = notifications.find(
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

  const newId = notifications.length > 0 ? Math.max(...notifications.map((n) => n.id)) + 1 : 1;
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

  notifications.unshift(newNotif);
  return newNotif;
};

const removeNotification = ({ recipient_id, actor_id, type, video_id = null }) => {
  const normalizedType = type.toLowerCase();
  const index = notifications.findIndex(
    (n) =>
      n.recipient_id === recipient_id &&
      n.actor_id === actor_id &&
      n.type.toLowerCase() === normalizedType &&
      (!video_id || n.video_id === video_id) &&
      !n.is_read
  );
  if (index !== -1) {
    notifications.splice(index, 1);
  }
};

// Chuẩn hóa tiếng Việt không dấu để tìm kiếm thông minh
const normalizeText = (str = '') => {
 return str
 .toString()
 .toLowerCase()
 .normalize('NFD')
 .replace(/[\u0300-\u036f]/g, '')
 .replace(/đ/g, 'd')
 .trim();
};

const findUserByParam = (param) => {
 if (!param) return null;
 const clean = param.replace(/^@/, '').toLowerCase();
 const idNum = parseInt(clean);
 if (!isNaN(idNum)) {
 const byId = users.find((u) => u.id === idNum);
 if (byId) return byId;
 }
 return users.find((u) => u.nickname.toLowerCase() === clean);
};

// ==========================================
// 1. AUTH & TÀI KHOẢN (AUTHENTICATION)
// ==========================================
app.post('/api/auth/login', (req, res) => {
 const baseUrl = getBaseUrl(req);
 const { email, nickname, password } = req.body;

 let user = null;
 if (nickname) {
 user = users.find((u) => u.nickname.toLowerCase() === nickname.toLowerCase());
 } else if (email) {
 user = users.find((u) => (u.email && u.email.toLowerCase() === email.toLowerCase()) || u.nickname.toLowerCase() === 'bear');
 }

 // Mặc định tài khoản Bear nếu không truyền hoặc test demo
 if (!user) {
 user = users.find((u) => u.nickname === 'bear') || users[0];
 }

 res.json({
 data: formatUser(user, baseUrl),
 token: 'mock-jwt-token-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + Buffer.from(JSON.stringify({ id: user.id, nickname: user.nickname })).toString('base64'),
 message: 'Đăng nhập thành công'
 });
});

app.post('/api/auth/register', (req, res) => {
 const baseUrl = getBaseUrl(req);
 const { nickname, full_name, email } = req.body;

 if (!nickname) {
 return res.status(400).json({ message: 'Nickname là bắt buộc' });
 }

 const existing = users.find((u) => u.nickname.toLowerCase() === nickname.toLowerCase());
 if (existing) {
 return res.status(400).json({ message: 'Nickname đã tồn tại' });
 }

 const newUser = {
 id: users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1,
 first_name: full_name ? full_name.split(' ').slice(0, -1).join(' ') : '',
 last_name: full_name ? full_name.split(' ').slice(-1).join(' ') : nickname,
 full_name: full_name || nickname,
 nickname: nickname.replace(/^@/, ''),
 avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
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
 created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
 updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
 };

 users.push(newUser);

 res.status(201).json({
 data: formatUser(newUser, baseUrl),
 token: 'mock-jwt-token-registered.' + Buffer.from(JSON.stringify({ id: newUser.id, nickname: newUser.nickname })).toString('base64'),
 message: 'Đăng ký tài khoản thành công'
 });
});

app.get('/api/auth/me', (req, res) => {
 const baseUrl = getBaseUrl(req);
 const user = users.find((u) => u.nickname === 'bear') || users[0];
 res.json({
 data: formatUser(user, baseUrl)
 });
});

app.post('/api/auth/logout', (req, res) => {
 res.json({ message: 'Đăng xuất thành công' });
});

// ==========================================
// 2. TÌM KIẾM (SEARCH USERS & VIDEOS)
// URL: /api/users/search?q={keyword}&type={less|more}
// ==========================================
app.get('/api/users/search', (req, res) => {
 const baseUrl = getBaseUrl(req);
 const rawQuery = (req.query.q || '').trim();
 const query = normalizeText(rawQuery);
 const type = req.query.type || 'less';

 if (!query) {
 return res.json({ data: [] });
 }

 let results = users.filter((u) => {
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

 res.json({
 data: results.map((u) => formatUser(u, baseUrl))
 });
});

app.get('/api/videos/search', (req, res) => {
 const baseUrl = getBaseUrl(req);
 const rawQuery = (req.query.q || '').trim();
 const query = normalizeText(rawQuery);

 if (!query) {
 return res.json({ data: [] });
 }

 const results = videos.filter((v) => {
 return (
 normalizeText(v.description || '').includes(query) ||
 normalizeText(v.music || '').includes(query)
 );
 });

 res.json({
 data: results.map((v) => {
 const user = users.find((u) => u.id === v.user_id);
 return {
 ...v,
 user: user ? formatUser(user, baseUrl) : null
 };
 })
 });
});

// ==========================================
// 3. TÀI KHOẢN GỢI Ý & ĐANG THEO DÕI (SIDEBAR)
// ==========================================
app.get('/api/users/suggested', (req, res) => {
 const baseUrl = getBaseUrl(req);
 const page = parseInt(req.query.page) || 1;
 const perPage = parseInt(req.query.per_page) || 5;

 const start = (page - 1) * perPage;
 const end = start + perPage;
 const paginatedUsers = users.slice(start, end);

 res.json({
 data: paginatedUsers.map((u) => formatUser(u, baseUrl)),
 meta: {
 pagination: {
 total: users.length,
 count: paginatedUsers.length,
 per_page: perPage,
 current_page: page,
 total_pages: Math.ceil(users.length / perPage)
 }
 }
 });
});

app.get('/api/users/following', (req, res) => {
 const baseUrl = getBaseUrl(req);
 const page = parseInt(req.query.page) || 1;
 const perPage = parseInt(req.query.per_page) || 5;

 const followingUsers = users.filter((u) => u.is_followed);
 const start = (page - 1) * perPage;
 const end = start + perPage;
 const paginatedUsers = followingUsers.slice(start, end);

 res.json({
 data: paginatedUsers.map((u) => formatUser(u, baseUrl)),
 meta: {
 pagination: {
 total: followingUsers.length,
 count: paginatedUsers.length,
 per_page: perPage,
 current_page: page,
 total_pages: Math.ceil(followingUsers.length / perPage) || 1
 }
 }
 });
});

// ==========================================
// 4. HỒ SƠ NGƯỜI DÙNG & CHỈNH SỬA PROFILE
// ==========================================
// Lấy chi tiết user (hỗ trợ cả /api/users/@nickname và /api/users/nickname)
const handleGetUserProfile = (req, res) => {
 const baseUrl = getBaseUrl(req);
 const param = req.params.nickname || req.params.username;
 const user = findUserByParam(param);

 if (!user) {
 return res.status(404).json({ message: 'User not found' });
 }

 res.json({
 data: formatUser(user, baseUrl)
 });
};

app.get('/api/users/@:nickname', handleGetUserProfile);
app.get('/api/users/:nickname', (req, res, next) => {
 // Bỏ qua nếu trùng với các route khác như 'search', 'suggested', 'following'
 if (['search', 'suggested', 'following'].includes(req.params.nickname)) {
 return next();
 }
 return handleGetUserProfile(req, res);
});

// Chỉnh sửa thông tin hồ sơ (Edit profile: full_name, bio, website_url, avatar, etc.)
const handleUpdateUserProfile = (req, res) => {
 const baseUrl = getBaseUrl(req);
 const param = req.params.nickname || req.params.username;
 const user = findUserByParam(param);

 if (!user) {
 return res.status(404).json({ message: 'User not found' });
 }

 const { full_name, bio, website_url, avatar, avatar_url, first_name, last_name } = req.body;

 if (full_name !== undefined) user.full_name = full_name;
 if (first_name !== undefined) user.first_name = first_name;
 if (last_name !== undefined) user.last_name = last_name;
 if (bio !== undefined) user.bio = bio;
 if (website_url !== undefined) user.website_url = website_url;
 if (avatar_url !== undefined) user.avatar_url = avatar_url;
 if (avatar !== undefined && !avatar_url) user.avatar_url = avatar;

 user.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

 res.json({
 data: formatUser(user, baseUrl),
 message: 'Profile updated successfully'
 });
};

app.patch('/api/users/@:nickname', handleUpdateUserProfile);
app.put('/api/users/@:nickname', handleUpdateUserProfile);
app.patch('/api/users/:nickname', handleUpdateUserProfile);
app.put('/api/users/:nickname', handleUpdateUserProfile);

// Lấy danh sách video của người dùng cụ thể
const handleGetUserVideos = (req, res) => {
 const baseUrl = getBaseUrl(req);
 const param = req.params.nickname;
 const user = findUserByParam(param);

 if (!user) {
 return res.status(404).json({ message: 'User not found' });
 }

 const userVideos = videos.filter((v) => v.user_id === user.id);
 res.json({
 data: userVideos.map((video) => ({
 ...video,
 user: formatUser(user, baseUrl)
 }))
 });
};

app.get('/api/users/@:nickname/videos', handleGetUserVideos);
app.get('/api/users/:nickname/videos', handleGetUserVideos);

// ==========================================
// 5. FOLLOW & UNFOLLOW USER
// ==========================================
const handleFollow = (req, res) => {
  const baseUrl = getBaseUrl(req);
  const param = req.params.id || req.params.nickname;
  const user = findUserByParam(param);

  if (!user) return res.status(404).json({ message: 'User not found' });

  const currentUser = getAuthUser(req);

  if (!user.is_followed) {
    user.is_followed = true;
    user.followers_count += 1;
  }

  // Tạo thông báo FOLLOW cho người được theo dõi
  if (user.id !== currentUser.id) {
    createNotification({
      recipient_id: user.id,
      actor_id: currentUser.id,
      type: 'follow',
      content: 'started following you',
    });
  }

  res.json({ data: formatUser(user, baseUrl), message: 'Followed successfully' });
};

const handleUnfollow = (req, res) => {
  const baseUrl = getBaseUrl(req);
  const param = req.params.id || req.params.nickname;
  const user = findUserByParam(param);

  if (!user) return res.status(404).json({ message: 'User not found' });

  const currentUser = getAuthUser(req);

  if (user.is_followed) {
    user.is_followed = false;
    user.followers_count = Math.max(0, user.followers_count - 1);
  }

  // Xóa thông báo FOLLOW chưa đọc tương ứng
  removeNotification({
    recipient_id: user.id,
    actor_id: currentUser.id,
    type: 'follow',
  });

  res.json({ data: formatUser(user, baseUrl), message: 'Unfollowed successfully' });
};

app.post('/api/users/:id/follow', handleFollow);
app.post('/api/users/:id/unfollow', handleUnfollow);
app.post('/api/users/@:nickname/follow', handleFollow);
app.post('/api/users/@:nickname/unfollow', handleUnfollow);

// ==========================================
// 6. VIDEO MANAGEMENT & FEEDS
// ==========================================
// Danh sách video Feed (For You & Following)
app.get('/api/videos', (req, res) => {
 const baseUrl = getBaseUrl(req);
 const type = req.query.type || 'for-you';
 const page = parseInt(req.query.page) || 1;
 const perPage = parseInt(req.query.per_page) || 10;

 let videoList = [...videos];

 if (type === 'following') {
 const followingIds = users.filter((u) => u.is_followed).map((u) => u.id);
 videoList = videoList.filter((v) => followingIds.includes(v.user_id));
 }

 const start = (page - 1) * perPage;
 const end = start + perPage;
 const paginatedVideos = videoList.slice(start, end);

 res.json({
 data: paginatedVideos.map((video) => formatFeedPost(video, baseUrl)),
 meta: {
 pagination: {
 total: videoList.length,
 count: paginatedVideos.length,
 per_page: perPage,
 current_page: page,
 total_pages: Math.ceil(videoList.length / perPage) || 1
 }
 }
 });
});

// Chi tiết 1 video
app.get('/api/videos/:id', (req, res) => {
 const baseUrl = getBaseUrl(req);
 const videoId = parseInt(req.params.id);
 const video = videos.find((v) => v.id === videoId);

 if (!video) {
 return res.status(404).json({ message: 'Video not found' });
 }

 res.json({
 data: formatFeedPost(video, baseUrl)
 });
});

// Thêm / Upload Video mới
app.post('/api/videos', (req, res) => {
 const baseUrl = getBaseUrl(req);
 const { description, file_url, thumb_url, music, user_id } = req.body;

 const authorId = user_id || 999; // Mặc định tác giả là Bear
 const author = users.find((u) => u.id === authorId) || users[0];

 const newVideo = {
 id: videos.length > 0 ? Math.max(...videos.map((v) => v.id)) + 1 : 1,
 uuid: 'vid-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
 user_id: author.id,
 thumb_url:
 thumb_url ||
 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
 file_url:
 file_url ||
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
 description: description || 'Video mới đăng tải #tiktok #creator',
 music: music || `nhạc nền - ${author.full_name || author.nickname}`,
 likes_count: 0,
 comments_count: 0,
 shares_count: 0,
 views_count: 1,
 is_liked: false,
 created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
 updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
 };

 videos.unshift(newVideo);

 res.status(201).json({
 data: {
 ...newVideo,
 user: formatUser(author, baseUrl)
 },
 message: 'Video uploaded successfully'
 });
});

// Xóa video
app.delete('/api/videos/:id', (req, res) => {
 const videoId = parseInt(req.params.id);
 const index = videos.findIndex((v) => v.id === videoId);

 if (index === -1) {
 return res.status(404).json({ message: 'Video not found' });
 }

 const [deletedVideo] = videos.splice(index, 1);
 res.json({
 data: deletedVideo,
 message: 'Video deleted successfully'
 });
});

// Tăng lượt xem video
app.post('/api/videos/:id/view', (req, res) => {
 const videoId = parseInt(req.params.id);
 const video = videos.find((v) => v.id === videoId);

 if (!video) return res.status(404).json({ message: 'Video not found' });

 video.views_count = (video.views_count || 0) + 1;
 res.json({ data: { views_count: video.views_count } });
});

// Like / Unlike Video
app.post('/api/videos/:id/like', (req, res) => {
  const videoId = parseInt(req.params.id);
  const video = videos.find((v) => v.id === videoId);

  if (!video) return res.status(404).json({ message: 'Video not found' });

  const currentUser = getAuthUser(req);
  const actorId = req.body?.user_id ? parseInt(req.body.user_id) : currentUser.id;

  if (!video.is_liked) {
    video.is_liked = true;
    video.likes_count += 1;
  }

  // Tự động tạo thông báo LIKE cho chủ video (nếu không phải tự like video của mình)
  if (video.user_id && video.user_id !== actorId) {
    createNotification({
      recipient_id: video.user_id,
      actor_id: actorId,
      type: 'like',
      video_id: video.id,
      content: 'liked your video',
    });
  }

  res.json({ data: video });
});

app.post('/api/videos/:id/unlike', (req, res) => {
  const videoId = parseInt(req.params.id);
  const video = videos.find((v) => v.id === videoId);

  if (!video) return res.status(404).json({ message: 'Video not found' });

  const currentUser = getAuthUser(req);
  const actorId = req.body?.user_id ? parseInt(req.body.user_id) : currentUser.id;

  if (video.is_liked) {
    video.is_liked = false;
    video.likes_count = Math.max(0, video.likes_count - 1);
  }

  // Xóa thông báo LIKE chưa đọc khi bỏ like
  if (video.user_id) {
    removeNotification({
      recipient_id: video.user_id,
      actor_id: actorId,
      type: 'like',
      video_id: video.id,
    });
  }

  res.json({ data: video });
});

// ==========================================
// 7. BÌNH LUẬN VIDEO (COMMENTS)
// ==========================================
// Lấy danh sách bình luận của video
app.get('/api/videos/:id/comments', (req, res) => {
  const baseUrl = getBaseUrl(req);
  const videoId = parseInt(req.params.id);

  const videoComments = comments.filter((c) => c.video_id === videoId);

  res.json({
    data: videoComments.map((comment) => {
      const user = users.find((u) => u.id === comment.user_id);
      return {
        ...comment,
        user: user ? formatUser(user, baseUrl) : null,
      };
    }),
  });
});

// Thêm bình luận vào video
app.post('/api/videos/:id/comments', (req, res) => {
  const baseUrl = getBaseUrl(req);
  const videoId = parseInt(req.params.id);
  const video = videos.find((v) => v.id === videoId);

  if (!video) {
    return res.status(404).json({ message: 'Video not found' });
  }

  const { comment, user_id, reply_to_comment_id, parent_id } = req.body;
  if (!comment || !comment.trim()) {
    return res.status(400).json({ message: 'Nội dung bình luận không được rỗng' });
  }

  const currentUser = getAuthUser(req);
  const authorId = user_id ? parseInt(user_id) : currentUser.id;
  const author = users.find((u) => u.id === authorId) || users[0];

  const parentCommentId = reply_to_comment_id || parent_id || null;

  const newComment = {
    id: comments.length > 0 ? Math.max(...comments.map((c) => c.id)) + 1 : 1,
    video_id: videoId,
    user_id: author.id,
    parent_id: parentCommentId,
    comment: comment.trim(),
    likes_count: 0,
    is_liked: false,
    created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };

  comments.unshift(newComment);
  video.comments_count = (video.comments_count || 0) + 1;

  // 1. Thông báo REPLY nếu là trả lời bình luận của người khác
  if (parentCommentId) {
    const parentComment = comments.find((c) => c.id === parseInt(parentCommentId));
    if (parentComment && parentComment.user_id !== author.id) {
      createNotification({
        recipient_id: parentComment.user_id,
        actor_id: author.id,
        type: 'reply',
        video_id: video.id,
        comment_id: newComment.id,
        content: `replied to your comment: "${newComment.comment.slice(0, 60)}"`,
      });
    }
  }

  // 2. Thông báo COMMENT cho chủ video
  if (video.user_id && video.user_id !== author.id) {
    createNotification({
      recipient_id: video.user_id,
      actor_id: author.id,
      type: 'comment',
      video_id: video.id,
      comment_id: newComment.id,
      content: `commented: "${newComment.comment.slice(0, 60)}"`,
    });
  }

  // 3. Thông báo MENTION nếu có tag @username trong bình luận
  const mentionMatches = newComment.comment.match(/@([a-zA-Z0-9_.]+)/g);
  if (mentionMatches) {
    const mentionedNicks = [...new Set(mentionMatches.map((m) => m.slice(1).toLowerCase()))];
    mentionedNicks.forEach((nick) => {
      const mentionedUser = findUserByParam(nick);
      if (mentionedUser && mentionedUser.id !== author.id && mentionedUser.id !== video.user_id) {
        createNotification({
          recipient_id: mentionedUser.id,
          actor_id: author.id,
          type: 'mention',
          video_id: video.id,
          comment_id: newComment.id,
          content: `mentioned you in a comment: "${newComment.comment.slice(0, 60)}"`,
        });
      }
    });
  }

 res.status(201).json({
 data: {
 ...newComment,
 user: formatUser(author, baseUrl)
 },
 message: 'Comment added successfully'
 });
});

// Xóa bình luận
app.delete('/api/comments/:id', (req, res) => {
 const commentId = parseInt(req.params.id);
 const index = comments.findIndex((c) => c.id === commentId);

 if (index === -1) {
 return res.status(404).json({ message: 'Comment not found' });
 }

 const [deletedComment] = comments.splice(index, 1);

 // Giảm comments_count của video
 const video = videos.find((v) => v.id === deletedComment.video_id);
 if (video && video.comments_count > 0) {
 video.comments_count -= 1;
 }

 res.json({
 data: deletedComment,
 message: 'Comment deleted successfully'
 });
});

// Like / Unlike bình luận
app.post('/api/comments/:id/like', (req, res) => {
 const commentId = parseInt(req.params.id);
 const comment = comments.find((c) => c.id === commentId);

 if (!comment) return res.status(404).json({ message: 'Comment not found' });

 if (!comment.is_liked) {
 comment.is_liked = true;
 comment.likes_count += 1;
 }
 res.json({ data: comment });
});

app.post('/api/comments/:id/unlike', (req, res) => {
 const commentId = parseInt(req.params.id);
 const comment = comments.find((c) => c.id === commentId);

 if (!comment) return res.status(404).json({ message: 'Comment not found' });

 if (comment.is_liked) {
 comment.is_liked = false;
 comment.likes_count = Math.max(0, comment.likes_count - 1);
 }
 res.json({ data: comment });
});

// ==========================================
// 8. TIKTOK LIVE STREAMS (/api/lives)
// ==========================================
// Danh sách các phòng livestream
app.get('/api/lives', (req, res) => {
  const baseUrl = getBaseUrl(req);
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.per_page) || 10;

  const start = (page - 1) * perPage;
  const end = start + perPage;
  const paginatedLives = lives.slice(start, end);

  res.json({
    data: paginatedLives.map((live) => formatLive(live, baseUrl)),
    meta: {
      pagination: {
        total: lives.length,
        count: paginatedLives.length,
        per_page: perPage,
        current_page: page,
        total_pages: Math.ceil(lives.length / perPage) || 1
      }
    }
  });
});

// Chi tiết 1 phòng livestream (theo id hoặc room_id)
app.get('/api/lives/:id', (req, res) => {
  const baseUrl = getBaseUrl(req);
  const idOrRoom = req.params.id;
  const live = lives.find(
    (l) => l.id === parseInt(idOrRoom) || l.room_id === idOrRoom
  );

  if (!live) {
    return res.status(404).json({ message: 'Live stream not found' });
  }

  res.json({
    data: formatLive(live, baseUrl)
  });
});

// Thả tim phòng livestream
app.post('/api/lives/:id/like', (req, res) => {
  const idOrRoom = req.params.id;
  const live = lives.find(
    (l) => l.id === parseInt(idOrRoom) || l.room_id === idOrRoom
  );

  if (!live) {
    return res.status(404).json({ message: 'Live stream not found' });
  }

  live.likes_count = (live.likes_count || 0) + 1;
  res.json({
    data: {
      id: live.id,
      room_id: live.room_id,
      likes_count: live.likes_count
    }
  });
});

// ==========================================
// 8.5. THÔNG BÁO (NOTIFICATIONS)
// ==========================================
// Lấy danh sách thông báo của tài khoản đang đăng nhập
app.get('/api/notifications', (req, res) => {
  const baseUrl = getBaseUrl(req);
  const currentUser = getAuthUser(req);
  const typeParam = (req.query.type || '').trim().toLowerCase();
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.per_page) || 20;

  // Chỉ lấy thông báo của chính tài khoản đang đăng nhập
  let userNotifs = notifications.filter((n) => n.recipient_id === currentUser.id);

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

  // Sắp xếp mới nhất trước (created_at DESC hoặc id DESC)
  userNotifs.sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0) || b.id - a.id
  );

  const start = (page - 1) * perPage;
  const paginated = userNotifs.slice(start, start + perPage);
  const unreadCount = notifications.filter(
    (n) => n.recipient_id === currentUser.id && !n.is_read
  ).length;

  res.json({
    data: paginated.map((n) => formatNotification(n, baseUrl)),
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
});

// Lấy tổng số thông báo chưa đọc
app.get('/api/notifications/unread-count', (req, res) => {
  const currentUser = getAuthUser(req);
  const unreadCount = notifications.filter(
    (n) => n.recipient_id === currentUser.id && !n.is_read
  ).length;

  res.json({
    data: {
      unread_count: unreadCount,
      unreadCount,
    },
    unread_count: unreadCount,
    unreadCount,
  });
});

// Đánh dấu 1 thông báo đã đọc
const handleMarkNotificationRead = (req, res) => {
  const baseUrl = getBaseUrl(req);
  const notifId = parseInt(req.params.id);
  const currentUser = getAuthUser(req);

  const notif = notifications.find((n) => n.id === notifId);
  if (!notif) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  // Người dùng chỉ được đọc thông báo của chính mình
  if (notif.recipient_id !== currentUser.id) {
    return res
      .status(403)
      .json({ message: 'Forbidden: You cannot access other users notifications' });
  }

  notif.is_read = true;
  res.json({
    data: formatNotification(notif, baseUrl),
    message: 'Notification marked as read',
  });
};

app.put('/api/notifications/:id/read', handleMarkNotificationRead);
app.patch('/api/notifications/:id/read', handleMarkNotificationRead);

// Đánh dấu tất cả thông báo đã đọc
const handleMarkAllNotificationsRead = (req, res) => {
  const currentUser = getAuthUser(req);
  notifications.forEach((n) => {
    if (n.recipient_id === currentUser.id) {
      n.is_read = true;
    }
  });

  res.json({
    message: 'All notifications marked as read',
    unread_count: 0,
    unreadCount: 0,
  });
};

app.put('/api/notifications/read-all', handleMarkAllNotificationsRead);
app.patch('/api/notifications/read-all', handleMarkAllNotificationsRead);

// Xóa 1 thông báo
app.delete('/api/notifications/:id', (req, res) => {
  const notifId = parseInt(req.params.id);
  const currentUser = getAuthUser(req);

  const index = notifications.findIndex((n) => n.id === notifId);
  if (index === -1) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  if (notifications[index].recipient_id !== currentUser.id) {
    return res
      .status(403)
      .json({ message: 'Forbidden: You cannot delete other users notifications' });
  }

  const [deleted] = notifications.splice(index, 1);
  res.json({
    data: deleted,
    message: 'Notification deleted successfully',
  });
});

// Xóa toàn bộ thông báo của tài khoản đang đăng nhập
app.delete('/api/notifications', (req, res) => {
  const currentUser = getAuthUser(req);
  const initialCount = notifications.length;
  for (let i = notifications.length - 1; i >= 0; i--) {
    if (notifications[i].recipient_id === currentUser.id) {
      notifications.splice(i, 1);
    }
  }

  res.json({
    message: 'All notifications deleted successfully',
    deleted_count: initialCount - notifications.length,
  });
});

// Tạo thông báo mới (hỗ trợ thông báo hệ thống / admin / testing)
app.post('/api/notifications', (req, res) => {
  const baseUrl = getBaseUrl(req);
  const currentUser = getAuthUser(req);
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

  const newNotif = createNotification({
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

  res.status(201).json({
    data: formatNotification(newNotif, baseUrl),
    message: 'Notification created successfully',
  });
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
 <title>TikTok Mock API Server</title>
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <style>
 body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #161823; line-height: 1.6; background-color: #fafafa; }
 .card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
 h1 { color: #fe2c55; margin-top: 0; display: flex; align-items: center; gap: 10px; }
 .endpoint { background: #f8f8f8; border-left: 4px solid #fe2c55; padding: 12px 16px; margin: 12px 0; border-radius: 0 6px 6px 0; }
 code { background: #eee; padding: 2px 6px; border-radius: 4px; font-size: 14px; font-family: monospace; }
 a { color: #fe2c55; text-decoration: none; font-weight: 600; }
 a:hover { text-decoration: underline; }
 .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; color: white; margin-right: 8px; }
 .tag-get { background: #00b4d8; }
 .tag-post { background: #2ec4b6; }
 .tag-patch { background: #ff9f1c; }
 .tag-delete { background: #e71d36; }
 .section-title { margin-top: 24px; border-bottom: 2px solid #eee; padding-bottom: 6px; font-size: 18px; color: #333; }
 </style>
 </head>
 <body>
 <div class="card">
 <h1> TikTok Mock API Server</h1>
 <p>Hệ thống Backend API RESTful phục vụ đầy đủ mọi chức năng của TikTok Frontend (Auth, Profile, Follow, Feed, Search, Video, Comments, Upload).</p>

 <h3 class="section-title">1. Tài khoản & Xác thực (Auth & Profile)</h3>
 <div class="endpoint">
 <span class="tag tag-get">GET</span> <strong>Lấy thông tin người dùng:</strong><br/>
 <a href="/api/users/@bear" target="_blank">/api/users/@bear</a> (hoặc <a href="/api/users/@hoahanassii" target="_blank">/api/users/@hoahanassii</a>)
 </div>
 <div class="endpoint">
 <span class="tag tag-patch">PATCH</span> <strong>Cập nhật hồ sơ (Name, Bio, Avatar, Link):</strong><br/>
 <code>PATCH /api/users/@bear</code> (Body: <code>{ full_name, bio, website_url, avatar }</code>)
 </div>
 <div class="endpoint">
 <span class="tag tag-post">POST</span> <strong>Đăng nhập / Đăng ký:</strong><br/>
 <code>POST /api/auth/login</code> | <code>POST /api/auth/register</code> | <code>GET /api/auth/me</code>
 </div>

 <h3 class="section-title">2. Khám phá & Tìm kiếm (Search & Sidebar)</h3>
 <div class="endpoint">
 <span class="tag tag-get">GET</span> <strong>Tìm kiếm người dùng (Search):</strong><br/>
 <a href="/api/users/search?q=hoa&type=less" target="_blank">/api/users/search?q=hoa&type=less</a>
 </div>
 <div class="endpoint">
 <span class="tag tag-get">GET</span> <strong>Gợi ý tài khoản (Sidebar Suggested):</strong><br/>
 <a href="/api/users/suggested?page=1&per_page=5" target="_blank">/api/users/suggested?page=1&per_page=5</a>
 </div>
 <div class="endpoint">
 <span class="tag tag-get">GET</span> <strong>Tài khoản đang theo dõi (Sidebar Following):</strong><br/>
 <a href="/api/users/following?page=1" target="_blank">/api/users/following?page=1</a>
 </div>

 <h3 class="section-title">3. Tương tác Follow & Like</h3>
 <div class="endpoint">
 <span class="tag tag-post">POST</span> <strong>Follow / Unfollow:</strong><br/>
 <code>POST /api/users/@hoahanassii/follow</code> & <code>POST /api/users/@hoahanassii/unfollow</code>
 </div>
 <div class="endpoint">
 <span class="tag tag-post">POST</span> <strong>Like / Unlike Video:</strong><br/>
 <code>POST /api/videos/1/like</code> & <code>POST /api/videos/1/unlike</code>
 </div>

 <h3 class="section-title">4. Video & Bình luận (Videos & Comments)</h3>
 <div class="endpoint">
 <span class="tag tag-get">GET</span> <strong>Danh sách Video Feeds (For You / Following):</strong><br/>
 <a href="/api/videos?type=for-you&page=1" target="_blank">/api/videos?type=for-you&page=1</a>
 </div>
 <div class="endpoint">
 <span class="tag tag-post">POST</span> <strong>Đăng Video mới (Upload):</strong><br/>
 <code>POST /api/videos</code> (Body: <code>{ description, file_url, thumb_url, music }</code>)
 </div>
 <div class="endpoint">
 <span class="tag tag-get">GET</span> <strong>Danh sách bình luận video:</strong><br/>
 <a href="/api/videos/1/comments" target="_blank">/api/videos/1/comments</a>
 </div>
 <div class="endpoint">
 <span class="tag tag-post">POST</span> <strong>Gửi bình luận mới:</strong><br/>
 <code>POST /api/videos/1/comments</code> (Body: <code>{ comment }</code>)
 </div>

 <h3 class="section-title">5. Thông báo (Notifications / Activity)</h3>
 <div class="endpoint">
 <span class="tag tag-get">GET</span> <strong>Danh sách thông báo người dùng:</strong><br/>
 <a href="/api/notifications" target="_blank">/api/notifications</a> (Lọc: <code>?type=like|comment|follow|mention|system|qa</code>)
 </div>
 <div class="endpoint">
 <span class="tag tag-get">GET</span> <strong>Số lượng thông báo chưa đọc:</strong><br/>
 <a href="/api/notifications/unread-count" target="_blank">/api/notifications/unread-count</a>
 </div>
 <div class="endpoint">
 <span class="tag tag-patch">PUT</span> <strong>Đánh dấu đã đọc / Đọc tất cả:</strong><br/>
 <code>PUT /api/notifications/:id/read</code> | <code>PUT /api/notifications/read-all</code>
 </div>
 <div class="endpoint">
 <span class="tag tag-delete">DELETE</span> <strong>Xóa thông báo:</strong><br/>
 <code>DELETE /api/notifications/:id</code> | <code>DELETE /api/notifications</code>
 </div>
 </div>
 </body>
 </html>
 `);
});

// Khởi động server
const PORT = process.env.PORT || 8080;
if (process.env.NODE_ENV !== 'test') {
 app.listen(PORT, () => {
 console.log(`\n=================================================`);
 console.log(` TikTok API Server đang chạy tại: http://localhost:${PORT}`);
 console.log(` Test tìm kiếm: http://localhost:${PORT}/api/users/search?q=hoa&type=less`);
 console.log(` Test Profile: http://localhost:${PORT}/api/users/@bear`);
 console.log(` Test Videos: http://localhost:${PORT}/api/videos?type=for-you`);
 console.log(`=================================================\n`);
 });
}

module.exports = app;
