import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import classNames from 'classnames/bind';
import { useNavigate } from 'react-router-dom';
import HeadlessTippy from '@tippyjs/react/headless';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
   faCheckDouble,
   faHeart,
   faCommentDots,
   faUserPlus,
   faAt,
   faCircleCheck,
   faBell,
   faChevronLeft,
   faChevronRight,
} from '@fortawesome/free-solid-svg-icons';

import { Wrapper as PopperWrapper } from '~/components/Popper';
import { InboxIcon } from '~/components/Icons';
import Image from '~/components/Image';
import images from '~/assets/images';
import * as notificationServices from '~/services/notificationService';
import * as userServices from '~/services/userService';
import styles from './Inbox.module.scss';

const cx = classNames.bind(styles);

const TABS = [
   { key: 'all', title: 'All activity' },
   { key: 'likes', title: 'Likes' },
   { key: 'comments', title: 'Comments' },
   { key: 'mentions', title: 'Mentions & tags' },
   { key: 'followers', title: 'Followers' },
   { key: 'system', title: 'From TikTok' },
   { key: 'qa', title: 'Q&A' },
];

const INITIAL_NOTIFICATIONS = [
   {
      id: 1,
      type: 'like',
      user: {
         nickname: 'hoahanassii',
         full_name: 'Đào Lê Phương Hoa',
         avatar:
            'https://imgs.search.brave.com/blZB4VBWoKOlYRplFFaj5iDXMe2XMqgFFCI8SToli8U/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jZG4u/a2llbnRodWMubmV0/LnZuL2ltYWdlcy9j/NDczZDNlMDVlYjA3/MWFkYzIwOWViNGNm/ZmVmNzMzYzUzNTQ4/NGU4ODIwYzU5NmIy/MWFiMjA3OWQzZTgw/MGI0ZjA3NDEzN2E2/NmU2OTU4MGJkMjlm/MzRkZTc1M2JjNDdj/ZTZmNjljY2I2YWYz/ZmVmMWEzMjA3MGFh/NzRmZjYzNTBiMmJl/NTZlMzY3YzM0OGJk/NjZlNDYwOTIzMmJl/MTI3MmRjOTU2ZTdj/MGIxYTUwYjM3MzVl/ZDQxNmY5N2U5YjVj/YThkMGI4YzMzYzJj/NDRlMmYwY2UwZWJm/ZjNhMDc2ZS92by1x/dW9jLWRhbi1kYW8t/bGUtcGh1b25nLWhv/YS1iYXQtbmdvLWxh/bS1kYW0tY3VvaS1I/aW5oLTguSlBH',
         tick: true,
      },
      content: 'liked your video',
      time: '15m ago',
      is_read: false,
      video_thumb: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=120&q=80',
   },
   {
      id: 2,
      type: 'comment',
      user: {
         nickname: 'sondn',
         full_name: 'Đặng Ngọc Sơn (Sơn Đặng)',
         avatar: 'https://tiktok-api-pq2d.onrender.com/avatars/sondn.jpg',
         tick: true,
      },
      content: 'commented: "Video đỉnh quá bạn ơi, tiếp tục phát huy nhé! 🔥"',
      time: '1h ago',
      is_read: false,
      video_thumb: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=120&q=80',
   },
   {
      id: 3,
      type: 'follow',
      user: {
         nickname: 'ciin99',
         full_name: 'CiiN (Bùi Thảo Ly)',
         avatar: 'https://tiktok-api-pq2d.onrender.com/avatars/ciin99.jpg',
         tick: true,
      },
      content: 'started following you',
      time: '3h ago',
      is_read: false,
      is_following: false,
   },
   {
      id: 4,
      type: 'mention',
      user: {
         nickname: 'hoahanassii',
         full_name: 'Đào Lê Phương Hoa',
         avatar:
            'https://imgs.search.brave.com/blZB4VBWoKOlYRplFFaj5iDXMe2XMqgFFCI8SToli8U/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jZG4u/a2llbnRodWMubmV0/LnZuL2ltYWdlcy9j/NDczZDNlMDVlYjA3/MWFkYzIwOWViNGNm/ZmVmNzMzYzUzNTQ4/NGU4ODIwYzU5NmIy/MWFiMjA3OWQzZTgw/MGI0ZjA3NDEzN2E2/NmU2OTU4MGJkMjlm/MzRkZTc1M2JjNDdj/ZTZmNjljY2I2YWYz/ZmVmMWEzMjA3MGFh/NzRmZjYzNTBiMmJl/NTZlMzY3YzM0OGJk/NjZlNDYwOTIzMmJl/MTI3MmRjOTU2ZTdj/MGIxYTUwYjM3MzVl/ZDQxNmY5N2U5YjVj/YThkMGI4YzMzYzJj/NDRlMmYwY2UwZWJm/ZjNhMDc2ZS92by1x/dW9jLWRhbi1kYW8t/bGUtcGh1b25nLWhv/YS1iYXQtbmdvLWxh/bS1kYW0tY3VvaS1I/aW5oLTguSlBH',
         tick: true,
      },
      content: 'mentioned you in a comment: "OhNo!"',
      time: '1d ago',
      is_read: true,
      video_thumb: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=120&q=80',
   },
   {
      id: 5,
      type: 'like',
      user: {
         nickname: 'sondn',
         full_name: 'Đặng Ngọc Sơn (Sơn Đặng)',
         avatar: 'https://tiktok-api-pq2d.onrender.com/avatars/sondn.jpg',
         tick: true,
      },
      content: 'liked your comment: "Cảm ơn thầy Sơn đã hướng dẫn"',
      time: '2d ago',
      is_read: true,
   },
   {
      id: 6,
      type: 'follow',
      user: {
         nickname: 'lebong95',
         full_name: 'Lê Bống (Lê Xuân Anh)',
         avatar:
            'https://imgs.search.brave.com/ASwACbM1V02IRDTo3gRpUShfV9jeLpFGqukIrFIRimQ/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9kYW52/aWV0LmV4LWNkbi5j/b20vZmlsZXMvZjEv/Mjk2MjMxNTY5ODQ5/MTkyNDQ4LzIwMjUv/Mi84LzQ3NjE2MTEz/Mjk0MDU2MDc0MDYx/NjIyODcyNjY5Njkx/MDcxOTY3MTcyMDU0/bi0xNzM5MDM2MzEx/MDQ1ODcwNTU5NjUu/anBn',
         tick: true,
      },
      content: 'started following you',
      time: '3d ago',
      is_read: true,
      is_following: true,
   },
   {
      id: 7,
      type: 'system',
      user: {
         nickname: 'tiktok_vn',
         full_name: 'TikTok Official',
         avatar: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=100&q=80',
         tick: true,
      },
      content: 'Chào mừng bạn đến với TikTok! Khám phá ngay các video thịnh hành hôm nay.',
      time: '5d ago',
      is_read: true,
   },
   {
      id: 8,
      type: 'qa',
      user: {
         nickname: 'sondn',
         full_name: 'Đặng Ngọc Sơn (Sơn Đặng)',
         avatar: 'https://tiktok-api-pq2d.onrender.com/avatars/sondn.jpg',
         tick: true,
      },
      content: 'answered your question: "Học ReactJS bắt đầu từ đâu?"',
      time: '1w ago',
      is_read: true,
   },
];

function Inbox() {
   const navigate = useNavigate();
   const [visible, setVisible] = useState(false);
   const [activeTab, setActiveTab] = useState('all');
   const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

   // Horizontal scroll state
   const tabsRef = useRef(null);
   const [canScrollLeft, setCanScrollLeft] = useState(false);
   const [canScrollRight, setCanScrollRight] = useState(false);

   const isDraggingRef = useRef(false);
   const startXRef = useRef(0);
   const scrollLeftRef = useRef(0);
   const hasDraggedRef = useRef(false);

   // Chuẩn hóa nội dung thông báo
   const sanitizeNotifications = useCallback((list = []) => {
      return list.map((item) => {
         if (
            item.content &&
            (item.content.includes('@bear') ||
               item.content.includes('nhảy này hay nè') ||
               item.content.includes('Oh No!') ||
               item.id === 4)
         ) {
            return {
               ...item,
               content: 'mentioned you in a comment: "OhNo!"',
            };
         }
         return item;
      });
   }, []);

   // Lấy dữ liệu thông báo từ API Backend thực tế
   const fetchNotifications = useCallback(async (tab = 'all') => {
      try {
         const res = await notificationServices.getNotifications({ type: tab });
         if (res && Array.isArray(res.data) && res.data.length > 0) {
            setNotifications(sanitizeNotifications(res.data));
         }
      } catch (err) {
         console.error('fetchNotifications error:', err);
      }
   }, [sanitizeNotifications]);

   // Fetch khi mount
   useEffect(() => {
      fetchNotifications('all');
   }, [fetchNotifications]);

   // Fetch khi mở dropdown hoặc đổi tab
   useEffect(() => {
      if (visible) {
         fetchNotifications(activeTab);
      }
   }, [visible, activeTab, fetchNotifications]);

   // Tự động kiểm tra cập nhật số lượng thông báo mỗi 30s
   useEffect(() => {
      const interval = setInterval(() => {
         fetchNotifications(activeTab);
      }, 30000);
      return () => clearInterval(interval);
   }, [activeTab, fetchNotifications]);

   const unreadCount = useMemo(() => notifications.filter((item) => !item.is_read).length, [notifications]);

   const filteredNotifications = useMemo(() => {
      if (activeTab === 'all') return notifications;
      if (activeTab === 'likes') return notifications.filter((n) => n.type === 'like');
      if (activeTab === 'comments') return notifications.filter((n) => n.type === 'comment' || n.type === 'reply');
      if (activeTab === 'mentions') return notifications.filter((n) => n.type === 'mention');
      if (activeTab === 'followers') return notifications.filter((n) => n.type === 'follow');
      if (activeTab === 'system') return notifications.filter((n) => n.type === 'system');
      if (activeTab === 'qa') return notifications.filter((n) => n.type === 'qa');
      return notifications;
   }, [notifications, activeTab]);

   const checkScroll = useCallback(() => {
      const el = tabsRef.current;
      if (el) {
         const { scrollLeft, scrollWidth, clientWidth } = el;
         setCanScrollLeft(scrollLeft > 2);
         setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
      }
   }, []);

   useEffect(() => {
      if (visible) {
         const timer = setTimeout(() => {
            checkScroll();
         }, 50);
         return () => clearTimeout(timer);
      }
   }, [visible, checkScroll]);

   const handleScroll = (direction) => {
      const el = tabsRef.current;
      if (el) {
         const scrollAmount = direction === 'left' ? -150 : 150;
         el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
   };

   const handleWheel = (e) => {
      const el = tabsRef.current;
      if (el && e.deltaY !== 0) {
         e.preventDefault();
         el.scrollLeft += e.deltaY;
         checkScroll();
      }
   };

   const handleMouseDown = (e) => {
      isDraggingRef.current = true;
      hasDraggedRef.current = false;
      startXRef.current = e.pageX - tabsRef.current.offsetLeft;
      scrollLeftRef.current = tabsRef.current.scrollLeft;
   };

   const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const x = e.pageX - tabsRef.current.offsetLeft;
      const walk = x - startXRef.current;
      if (Math.abs(walk) > 4) {
         hasDraggedRef.current = true;
      }
      tabsRef.current.scrollLeft = scrollLeftRef.current - walk;
      checkScroll();
   };

   const handleMouseUpOrLeave = () => {
      isDraggingRef.current = false;
   };

   const handleTabClick = (key, e) => {
      if (hasDraggedRef.current) return;
      setActiveTab(key);
      fetchNotifications(key);
      e.currentTarget.scrollIntoView({
         behavior: 'smooth',
         inline: 'center',
         block: 'nearest',
      });
   };

   // Đánh dấu tất cả là đã đọc (PUT /api/notifications/read-all)
   const handleMarkAllAsRead = async () => {
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      try {
         await notificationServices.markAllAsRead();
      } catch (err) {
         console.error('handleMarkAllAsRead error:', err);
      }
   };

   // Nhấn vào một thông báo: Đánh dấu đã đọc & điều hướng
   const handleItemClick = async (item) => {
      if (!item.is_read) {
         setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
         try {
            await notificationServices.markAsRead(item.id);
         } catch (err) {
            console.error('markAsRead error:', err);
         }
      }

      setVisible(false);

      // Điều hướng thông minh:
      // LIKE/COMMENT: điều hướng đến video hoặc trang feed kèm cuộn mượt
      // FOLLOW: điều hướng đến trang cá nhân
      if (item.type === 'follow' && item.user?.nickname) {
         navigate(`/@${item.user.nickname}`);
      } else if (item.video_id) {
         const shouldOpenComments = ['comment', 'reply', 'mention'].includes(item.type);
         navigate('/feed', {
            state: {
               targetVideoId: item.video_id,
               openComments: shouldOpenComments,
            },
         });
      } else if (item.user?.nickname) {
         navigate(`/@${item.user.nickname}`);
      }
   };

   // Nút Follow back / Following
   const handleToggleFollow = async (item, e) => {
      e.stopPropagation();
      const willFollow = !item.is_following;
      const nick = item.user?.nickname;

      setNotifications((prev) =>
         prev.map((n) => {
            if (n.id === item.id) {
               return {
                  ...n,
                  is_following: willFollow,
                  is_read: true,
               };
            }
            return n;
         }),
      );

      try {
         if (nick) {
            if (willFollow) {
               await userServices.followUser(nick);
            } else {
               await userServices.unfollowUser(nick);
            }
         }
         if (!item.is_read) {
            await notificationServices.markAsRead(item.id);
         }
      } catch (err) {
         console.error('handleToggleFollow error:', err);
      }
   };

   const renderTypeIcon = (type) => {
      switch (type) {
         case 'like':
            return (
               <div className={cx('type-icon', 'like')}>
                  <FontAwesomeIcon icon={faHeart} />
               </div>
            );
         case 'comment':
         case 'reply':
            return (
               <div className={cx('type-icon', 'comment')}>
                  <FontAwesomeIcon icon={faCommentDots} />
               </div>
            );
         case 'follow':
            return (
               <div className={cx('type-icon', 'follow')}>
                  <FontAwesomeIcon icon={faUserPlus} />
               </div>
            );
         case 'mention':
            return (
               <div className={cx('type-icon', 'mention')}>
                  <FontAwesomeIcon icon={faAt} />
               </div>
            );
         case 'system':
            return (
               <div className={cx('type-icon', 'system')}>
                  <FontAwesomeIcon icon={faBell} />
               </div>
            );
         case 'qa':
            return (
               <div className={cx('type-icon', 'qa')}>
                  <FontAwesomeIcon icon={faCommentDots} />
               </div>
            );
         default:
            return null;
      }
   };

   return (
      <HeadlessTippy
         interactive
         visible={visible}
         offset={[12, 10]}
         placement="bottom-end"
         onClickOutside={() => setVisible(false)}
         render={(attrs) => (
            <div className={cx('inbox-menu')} tabIndex="-1" {...attrs}>
               <PopperWrapper className={cx('inbox-popper')}>
                  {/* Header */}
                  <div className={cx('header')}>
                     <h3 className={cx('title')}>Notifications</h3>
                     {unreadCount > 0 && (
                        <button
                           type="button"
                           className={cx('mark-all-btn')}
                           onClick={handleMarkAllAsRead}
                           title="Mark all as read"
                        >
                           <FontAwesomeIcon icon={faCheckDouble} className={cx('mark-icon')} />
                           <span>Read all</span>
                        </button>
                     )}
                  </div>

                  {/* Horizontal Scroll Tabs */}
                  <div className={cx('tabs-wrapper')}>
                     {canScrollLeft && (
                        <>
                           <div className={cx('gradient-mask', 'left')} />
                           <button
                              type="button"
                              className={cx('scroll-btn', 'left')}
                              onClick={() => handleScroll('left')}
                              title="Scroll left"
                           >
                              <FontAwesomeIcon icon={faChevronLeft} />
                           </button>
                        </>
                     )}

                     <div
                        ref={tabsRef}
                        className={cx('tabs')}
                        onScroll={checkScroll}
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUpOrLeave}
                        onMouseLeave={handleMouseUpOrLeave}
                     >
                        {TABS.map((tab) => (
                           <button
                              key={tab.key}
                              type="button"
                              className={cx('tab-item', { active: activeTab === tab.key })}
                              onClick={(e) => handleTabClick(tab.key, e)}
                           >
                              {tab.title}
                           </button>
                        ))}
                     </div>

                     {canScrollRight && (
                        <>
                           <div className={cx('gradient-mask', 'right')} />
                           <button
                              type="button"
                              className={cx('scroll-btn', 'right')}
                              onClick={() => handleScroll('right')}
                              title="Scroll right"
                           >
                              <FontAwesomeIcon icon={faChevronRight} />
                           </button>
                        </>
                     )}
                  </div>

                  {/* Notifications list */}
                  <div className={cx('list')}>
                     {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((item) => (
                           <div
                              key={item.id}
                              className={cx('item', { unread: !item.is_read })}
                              onClick={() => handleItemClick(item)}
                           >
                              {/* Avatar & Type Badge */}
                              <div className={cx('avatar-box')}>
                                 <Image
                                    className={cx('avatar')}
                                    src={item.user.avatar}
                                    alt={item.user.full_name}
                                    fallback={images.noImage}
                                 />
                                 {renderTypeIcon(item.type)}
                              </div>

                              {/* Notification info */}
                              <div className={cx('content')}>
                                 <div className={cx('username-row')}>
                                    <span className={cx('username')}>{item.user.full_name || item.user.nickname}</span>
                                    {item.user.tick && <FontAwesomeIcon icon={faCircleCheck} className={cx('tick')} />}
                                 </div>
                                 <p className={cx('desc')}>
                                    {item.content &&
                                    (item.content.includes('@bear') ||
                                       item.content.includes('nhảy này hay nè') ||
                                       item.content.includes('Oh No!') ||
                                       item.id === 4)
                                       ? 'mentioned you in a comment: "OhNo!"'
                                       : item.content}
                                 </p>
                                 <span className={cx('time')}>{item.time}</span>
                              </div>

                              {/* Action or thumbnail on right */}
                              {item.type === 'follow' ? (
                                 <button
                                    type="button"
                                    className={cx('follow-btn', {
                                       following: item.is_following,
                                    })}
                                    onClick={(e) => handleToggleFollow(item, e)}
                                 >
                                    {item.is_following ? 'Following' : 'Follow back'}
                                 </button>
                              ) : item.video_thumb ? (
                                 <div className={cx('thumb-box')}>
                                    <img src={item.video_thumb} alt="Video thumbnail" className={cx('thumb')} />
                                 </div>
                              ) : null}

                              {/* Unread indicator dot */}
                              {!item.is_read && <span className={cx('unread-dot')} />}
                           </div>
                        ))
                     ) : (
                        <div className={cx('empty')}>
                           <div className={cx('empty-icon')}>
                              <FontAwesomeIcon icon={faBell} />
                           </div>
                           <h4 className={cx('empty-title')}>No notifications yet</h4>
                           <p className={cx('empty-desc')}>
                              All your updates will appear here once you receive new interactions.
                           </p>
                        </div>
                     )}
                  </div>
               </PopperWrapper>
            </div>
         )}
      >
         <button
            type="button"
            className={cx('action-btn', { active: visible })}
            onClick={() => setVisible((prev) => !prev)}
            title="Inbox"
         >
            <InboxIcon />
            {unreadCount > 0 && <span className={cx('badge')}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
         </button>
      </HeadlessTippy>
   );
}

export default Inbox;
