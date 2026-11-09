const pool = require('../db');
const usersData = require('../data/users');
const videosData = require('../data/videos');
const commentsData = require('../data/comments');
const livesData = require('../data/lives');
let notificationsData = [];
try {
  notificationsData = require('../data/notifications');
} catch (e) {
  notificationsData = [];
}

const formatDate = (val) => {
  if (!val) return new Date().toISOString().slice(0, 19).replace('T', ' ');
  const d = new Date(val);
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 19).replace('T', ' ');
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

async function initDatabase(force = false) {
  const conn = await pool.getConnection();
  try {
    console.log('🚀 Dang khoi tao schema cho MySQL (tiktok_db)...');

    if (force) {
      await conn.query('DROP TABLE IF EXISTS notifications');
      await conn.query('DROP TABLE IF EXISTS comments');
      await conn.query('DROP TABLE IF EXISTS lives');
      await conn.query('DROP TABLE IF EXISTS videos');
      await conn.query('DROP TABLE IF EXISTS users');
      console.log(' Da xoa cac bang cu (force=true).');
    }

    // 1. Tao bang USERS
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY,
        first_name VARCHAR(100) DEFAULT '',
        last_name VARCHAR(100) DEFAULT '',
        full_name VARCHAR(255) DEFAULT '',
        nickname VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) DEFAULT NULL,
        avatar_file VARCHAR(255) DEFAULT '',
        avatar_url TEXT DEFAULT NULL,
        bio TEXT DEFAULT NULL,
        tick TINYINT(1) DEFAULT 0,
        followings_count BIGINT DEFAULT 0,
        followers_count BIGINT DEFAULT 0,
        likes_count BIGINT DEFAULT 0,
        website_url VARCHAR(255) DEFAULT '',
        facebook_url VARCHAR(255) DEFAULT '',
        youtube_url VARCHAR(255) DEFAULT '',
        twitter_url VARCHAR(255) DEFAULT '',
        instagram_url VARCHAR(255) DEFAULT '',
        is_followed TINYINT(1) DEFAULT 0,
        is_personal TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_users_nickname (nickname)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Tao bang VIDEOS
    await conn.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id INT PRIMARY KEY,
        uuid VARCHAR(100) UNIQUE NOT NULL,
        user_id INT NOT NULL,
        image_file VARCHAR(255) DEFAULT '',
        image_url TEXT DEFAULT NULL,
        thumb_url TEXT DEFAULT NULL,
        file_url TEXT DEFAULT NULL,
        description TEXT DEFAULT NULL,
        music VARCHAR(255) DEFAULT '',
        likes_count BIGINT DEFAULT 0,
        comments_count BIGINT DEFAULT 0,
        shares_count BIGINT DEFAULT 0,
        views_count BIGINT DEFAULT 0,
        is_liked TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_videos_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Tao bang COMMENTS
    await conn.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT PRIMARY KEY,
        video_id INT NOT NULL,
        user_id INT NOT NULL,
        parent_id INT DEFAULT NULL,
        comment TEXT NOT NULL,
        likes_count BIGINT DEFAULT 0,
        is_liked TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_comments_video_id (video_id),
        INDEX idx_comments_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Tao bang FOLLOWS
    await conn.query(`
      CREATE TABLE IF NOT EXISTS follows (
        id INT AUTO_INCREMENT PRIMARY KEY,
        follower_id INT NOT NULL,
        following_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_follow (follower_id, following_id),
        INDEX idx_follower (follower_id),
        INDEX idx_following (following_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Tao bang LIVES
    await conn.query(`
      CREATE TABLE IF NOT EXISTS lives (
        id INT PRIMARY KEY,
        room_id VARCHAR(100) UNIQUE NOT NULL,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        image_file VARCHAR(255) DEFAULT '',
        cover_url TEXT DEFAULT NULL,
        viewer_count BIGINT DEFAULT 0,
        likes_count BIGINT DEFAULT 0,
        is_live TINYINT(1) DEFAULT 1,
        category VARCHAR(100) DEFAULT 'Gaming',
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_lives_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Tao bang NOTIFICATIONS
    await conn.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY,
        recipient_id INT NOT NULL,
        actor_id INT DEFAULT NULL,
        type VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        video_id INT DEFAULT NULL,
        comment_id INT DEFAULT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notifs_recipient (recipient_id),
        INDEX idx_notifs_actor (actor_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Da tao day du cac bang: users, videos, comments, lives, notifications.');

    // Seed Users neu bang rong
    const [userRows] = await conn.query('SELECT COUNT(*) AS count FROM users');
    if (userRows[0].count === 0) {
      console.log(` Dang day ${usersData.length} users vao MySQL...`);
      for (const u of usersData) {
        await conn.query(
          `INSERT INTO users (
            id, first_name, last_name, full_name, nickname, email,
            avatar_file, avatar_url, bio, tick, followings_count,
            followers_count, likes_count, website_url, facebook_url,
            youtube_url, twitter_url, instagram_url, is_followed,
            is_personal, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            u.id,
            u.first_name || '',
            u.last_name || '',
            u.full_name || '',
            u.nickname || '',
            u.email || null,
            u.avatar_file || '',
            u.avatar_url || null,
            u.bio || '',
            u.tick ? 1 : 0,
            u.followings_count || 0,
            u.followers_count || 0,
            u.likes_count || 0,
            u.website_url || '',
            u.facebook_url || '',
            u.youtube_url || '',
            u.twitter_url || '',
            u.instagram_url || '',
            u.is_followed ? 1 : 0,
            u.is_personal ? 1 : 0,
            formatDate(u.created_at),
            formatDate(u.updated_at)
          ]
        );
      }
      console.log(`✅ Da import thanh cong ${usersData.length} users.`);
    }

    // Seed Videos neu bang rong
    const [videoRows] = await conn.query('SELECT COUNT(*) AS count FROM videos');
    if (videoRows[0].count === 0) {
      console.log(` Dang day ${videosData.length} videos vao MySQL...`);
      for (const v of videosData) {
        await conn.query(
          `INSERT INTO videos (
            id, uuid, user_id, image_file, image_url, thumb_url,
            file_url, description, music, likes_count, comments_count,
            shares_count, views_count, is_liked, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            v.id,
            v.uuid || `vid-${v.id}`,
            v.user_id,
            v.image_file || '',
            v.image_url || null,
            v.thumb_url || null,
            v.file_url || null,
            v.description || '',
            v.music || '',
            v.likes_count || 0,
            v.comments_count || 0,
            v.shares_count || 0,
            v.views_count || 0,
            v.is_liked ? 1 : 0,
            formatDate(v.created_at),
            formatDate(v.updated_at)
          ]
        );
      }
      console.log(`✅ Da import thanh cong ${videosData.length} videos.`);
    }

    // Seed Comments neu bang rong
    const [commentRows] = await conn.query('SELECT COUNT(*) AS count FROM comments');
    if (commentRows[0].count === 0) {
      console.log(` Dang day ${commentsData.length} comments vao MySQL...`);
      for (const c of commentsData) {
        await conn.query(
          `INSERT INTO comments (
            id, video_id, user_id, parent_id, comment,
            likes_count, is_liked, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            c.id,
            c.video_id,
            c.user_id,
            c.parent_id || null,
            c.comment || '',
            c.likes_count || 0,
            c.is_liked ? 1 : 0,
            formatDate(c.created_at),
            formatDate(c.updated_at)
          ]
        );
      }
      console.log(`✅ Da import thanh cong ${commentsData.length} comments.`);
    }

    // Seed Lives neu bang rong
    const [liveRows] = await conn.query('SELECT COUNT(*) AS count FROM lives');
    if (liveRows[0].count === 0) {
      console.log(` Dang day ${livesData.length} live streams vao MySQL...`);
      for (const l of livesData) {
        await conn.query(
          `INSERT INTO lives (
            id, room_id, user_id, title, image_file, cover_url,
            viewer_count, likes_count, is_live, category, started_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            l.id,
            l.room_id || `room-${l.id}`,
            l.user_id,
            l.title || '',
            l.image_file || '',
            l.cover_url || null,
            l.viewer_count || 0,
            l.likes_count || 0,
            l.is_live !== undefined ? (l.is_live ? 1 : 0) : 1,
            l.category || 'Gaming',
            formatDate(l.started_at)
          ]
        );
      }
      console.log(`✅ Da import thanh cong ${livesData.length} live streams.`);
    }

    // Seed Notifications neu bang rong
    const [notifRows] = await conn.query('SELECT COUNT(*) AS count FROM notifications');
    if (notifRows[0].count === 0 && notificationsData.length > 0) {
      console.log(` Dang day ${notificationsData.length} notifications vao MySQL...`);
      for (const n of notificationsData) {
        await conn.query(
          `INSERT INTO notifications (
            id, recipient_id, actor_id, type, content,
            video_id, comment_id, is_read, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            n.id,
            n.recipient_id,
            n.actor_id || null,
            n.type || 'system',
            n.content || '',
            n.video_id || null,
            n.comment_id || null,
            n.is_read ? 1 : 0,
            formatDate(n.created_at)
          ]
        );
      }
      console.log(`✅ Da import thanh cong ${notificationsData.length} notifications.`);
    }

    console.log('🎉 Toan bo du lieu da san sang trong MySQL (tiktok_db)!');
  } finally {
    conn.release();
  }
}

if (require.main === module) {
  const force = process.argv.includes('--force');
  initDatabase(force)
    .then(() => {
      console.log('✅ Hoan tat khoi tao Database!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Loi khoi tao Database:', err);
      process.exit(1);
    });
}

module.exports = initDatabase;
