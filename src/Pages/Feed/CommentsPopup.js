import { useState, useEffect, useRef } from 'react';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faHeart, faCircleCheck, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

import Image from '~/components/Image';
import images from '~/assets/images';
import * as videoServices from '~/services/videoService';
import styles from './CommentsPopup.module.scss';

const cx = classNames.bind(styles);

const BEAR_AVATAR =
   'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=100&h=100&crop=faces&q=80';

const CREATOR_MOCK_COMMENTS = {
   hoahanassii: [
      {
         id: 101,
         user: {
            nickname: 'sondn',
            full_name: 'Đặng Ngọc Sơn (Sơn Đặng)',
            avatar: 'https://tiktok-api-pq2d.onrender.com/avatars/sondn.jpg',
            tick: true,
         },
         comment: 'Nhảy đẹp và cuốn quá Hoa ơi! Tiếp tục phát huy nhé 🔥',
         likes_count: 142,
         created_at: '2h ago',
      },
      {
         id: 102,
         user: {
            nickname: 'ciin99',
            full_name: 'CiiN (Bùi Thảo Ly)',
            avatar: 'https://tiktok-api-pq2d.onrender.com/avatars/ciin99.jpg',
            tick: true,
         },
         comment: 'Bữa nào collab chung một bài dance nữa đi chị ơi ❤️',
         likes_count: 89,
         created_at: '3h ago',
      },
      {
         id: 103,
         user: {
            nickname: 'trang_dance',
            full_name: 'Thu Trang',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
            tick: false,
         },
         comment: 'Nhạc cuốn người nhảy còn cuốn hơn nữa á trời, mê visual này ghê!',
         likes_count: 24,
         created_at: '5h ago',
      },
   ],
   sondn: [
      {
         id: 201,
         user: {
            nickname: 'hoang_developer',
            full_name: 'Huy Hoàng',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
            tick: false,
         },
         comment: 'Học F8 từ con số 0 giờ đã đi làm 2 năm rồi anh Sơn ơi, cảm ơn anh nhiều! 🚀',
         likes_count: 215,
         created_at: '1h ago',
      },
      {
         id: 202,
         user: {
            nickname: 'bear',
            full_name: 'Nguyễn Cường',
            avatar: BEAR_AVATAR,
            tick: true,
         },
         comment: 'Giao diện TikTok clone bằng React xịn mịn luôn thầy ơi ✨',
         likes_count: 98,
         created_at: '3h ago',
      },
      {
         id: 203,
         user: {
            nickname: 'linh_frontend',
            full_name: 'Phương Linh',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
            tick: false,
         },
         comment: 'Xem video vừa học vừa có thêm động lực cày code mỗi ngày 💪',
         likes_count: 36,
         created_at: '4h ago',
      },
   ],
   ciin99: [
      {
         id: 301,
         user: {
            nickname: 'vudieuchay',
            full_name: 'Vũ Điệp Official',
            avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80',
            tick: false,
         },
         comment: 'Thần thái đỉnh của chóp, xem đi xem lại vẫn nghiện điệu nhảy này!',
         likes_count: 167,
         created_at: '2h ago',
      },
      {
         id: 302,
         user: {
            nickname: 'lebong95',
            full_name: 'Lê Bống (Lê Xuân Anh)',
            avatar:
               'https://imgs.search.brave.com/ASwACbM1V02IRDTo3gRpUShfV9jeLpFGqukIrFIRimQ/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9kYW52/aWV0LmV4LWNkbi5j/b20vZmlsZXMvZjEv/Mjk2MjMxNTY5ODQ5/MTkyNDQ4LzIwMjUv/Mi84LzQ3NjE2MTEz/Mjk0MDU2MDc0MDYx/NjIyODcyNjY5Njkx/MDcxOTY3MTcyMDU0/bi0xNzM5MDM2MzEx/MDQ1ODcwNTU5NjUu/anBn',
            tick: true,
         },
         comment: 'Năng lượng quá cô gái ơi, cháy lên nào 🔥🔥',
         likes_count: 73,
         created_at: '4h ago',
      },
   ],
};

const DEFAULT_COMMENTS = [
   {
      id: 901,
      user: {
         nickname: 'tiktok_fan',
         full_name: 'Minh Tuấn',
         avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
         tick: false,
      },
      comment: 'Nội dung chất lượng quá bạn ơi! Thả tim liền tay ❤️',
      likes_count: 42,
      created_at: '1h ago',
   },
   {
      id: 902,
      user: {
         nickname: 'creative_vibes',
         full_name: 'Hải Đăng',
         avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=100&q=80',
         tick: false,
      },
      comment: 'Góc quay và màu ảnh đỉnh thật sự, xem cuốn hút ghê!',
      likes_count: 19,
      created_at: '3h ago',
   },
];

function CommentsPopup({ isOpen, onClose, post, currentUser, openLoginModal }) {
   const [comments, setComments] = useState([]);
   const [inputText, setInputText] = useState('');
   const [replyingTo, setReplyingTo] = useState(null);
   const [likedMap, setLikedMap] = useState({});
   const inputRef = useRef(null);
   const bodyRef = useRef(null);

   const currentPostId = post?.id;
   const creatorNickname = post?.user?.nickname;

   // Tải bình luận khi post thay đổi
   useEffect(() => {
      let isMounted = true;

      const fetchComments = async () => {
         // Nếu post có ID là số (video từ backend API)
         if (
            typeof currentPostId === 'number' ||
            (typeof currentPostId === 'string' && currentPostId.startsWith('video-'))
         ) {
            const numericId = typeof currentPostId === 'number' ? currentPostId : currentPostId.replace('video-', '');
            try {
               const apiComments = await videoServices.getComments(numericId);
               if (!isMounted) return;

               if (apiComments && apiComments.length > 0) {
                  setComments(apiComments);
                  return;
               }
            } catch (err) {
               console.error('Fetch comments error:', err);
            }
         }

         if (!isMounted) return;
         const mock = CREATOR_MOCK_COMMENTS[creatorNickname] || DEFAULT_COMMENTS;
         setComments(mock);
      };

      fetchComments();
      setReplyingTo(null);
      setInputText('');

      return () => {
         isMounted = false;
      };
   }, [currentPostId, creatorNickname]);

   const handleToggleLike = (commentId) => {
      const isLiked = !!likedMap[commentId];
      setLikedMap((prev) => ({
         ...prev,
         [commentId]: !isLiked,
      }));

      setComments((prevList) =>
         prevList.map((c) => {
            if (c.id === commentId) {
               return {
                  ...c,
                  is_liked: !isLiked,
                  likes_count: isLiked ? Math.max(0, (c.likes_count || 1) - 1) : (c.likes_count || 0) + 1,
               };
            }
            return c;
         }),
      );
   };

   const handleReply = (comment) => {
      setReplyingTo(comment);
      if (inputRef.current) {
         inputRef.current.focus();
      }
   };

   const handleSubmitComment = async (e) => {
      e?.preventDefault();
      const trimmed = inputText.trim();
      if (!trimmed) return;

      if (!currentUser) {
         openLoginModal();
         return;
      }

      const userAvatar = currentUser?.nickname === 'bear' || !currentUser?.avatar ? BEAR_AVATAR : currentUser.avatar;

      const newComment = {
         id: Date.now(),
         comment: replyingTo ? `@${replyingTo.user?.nickname} ${trimmed}` : trimmed,
         likes_count: 0,
         is_liked: false,
         created_at: 'Just now',
         user: {
            id: currentUser?.id || 999,
            nickname: currentUser?.nickname || 'bear',
            full_name: currentUser?.full_name || 'Nguyễn Cường',
            avatar: userAvatar,
            tick: true,
         },
      };

      setComments((prev) => [newComment, ...prev]);
      setInputText('');
      setReplyingTo(null);

      if (
         typeof currentPostId === 'number' ||
         (typeof currentPostId === 'string' && currentPostId.startsWith('video-'))
      ) {
         const numericId = typeof currentPostId === 'number' ? currentPostId : currentPostId.replace('video-', '');
         try {
            await videoServices.addComment(numericId, trimmed);
         } catch (err) {
            console.error('Add comment API error:', err);
         }
      }

      if (bodyRef.current) {
         bodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
   };

   if (!isOpen) return null;

   const currentUserAvatar =
      currentUser?.nickname === 'bear' || !currentUser?.avatar ? BEAR_AVATAR : currentUser.avatar;

   return (
      <div className={cx('wrapper')}>
         <div className={cx('header')}>
            <h3 className={cx('title')}>Comments ({comments.length})</h3>
            <button className={cx('close-btn')} onClick={onClose} title="Close">
               <FontAwesomeIcon icon={faXmark} />
            </button>
         </div>

         <div ref={bodyRef} className={cx('body')}>
            {comments.length === 0 ? (
               <div className={cx('empty')}>
                  <p>Be the first to comment!</p>
               </div>
            ) : (
               comments.map((item) => {
                  const isLiked = !!likedMap[item.id] || !!item.is_liked;
                  const itemAvatar = item.user?.nickname === 'bear' ? BEAR_AVATAR : item.user?.avatar || images.noImage;

                  return (
                     <div key={item.id} className={cx('comment-item')}>
                        <Image
                           className={cx('comment-avatar')}
                           src={itemAvatar}
                           alt={item.user?.nickname}
                           fallback={images.noImage}
                        />

                        <div className={cx('comment-content')}>
                           <div className={cx('comment-author-row')}>
                              <span className={cx('comment-author')}>{item.user?.nickname || 'tiktok_user'}</span>
                              {item.user?.tick && <FontAwesomeIcon icon={faCircleCheck} className={cx('check-icon')} />}
                           </div>

                           <p className={cx('comment-text')}>{item.comment}</p>

                           <div className={cx('comment-meta')}>
                              <span>{item.created_at || 'Just now'}</span>
                              <button type="button" className={cx('reply-btn')} onClick={() => handleReply(item)}>
                                 Reply
                              </button>
                           </div>
                        </div>

                        {/* Cột thả tim bình luận */}
                        <div className={cx('comment-like-col')}>
                           <button
                              type="button"
                              className={cx('comment-like-btn', { active: isLiked })}
                              onClick={() => handleToggleLike(item.id)}
                              title={isLiked ? 'Unlike' : 'Like'}
                           >
                              <FontAwesomeIcon icon={faHeart} />
                           </button>
                           {item.likes_count > 0 && (
                              <span className={cx('comment-like-count')}>{item.likes_count}</span>
                           )}
                        </div>
                     </div>
                  );
               })
            )}
         </div>

         {/* Replying banner */}
         {replyingTo && (
            <div className={cx('replying-banner')}>
               <span>
                  Replying to <strong>@{replyingTo.user?.nickname}</strong>
               </span>
               <button type="button" className={cx('replying-cancel')} onClick={() => setReplyingTo(null)}>
                  <FontAwesomeIcon icon={faXmark} />
               </button>
            </div>
         )}

         {/* Footer input */}
         <form onSubmit={handleSubmitComment} className={cx('footer')}>
            <div className={cx('input-container')}>
               {currentUser && (
                  <Image className={cx('user-avatar')} src={currentUserAvatar} alt="You" fallback={images.noImage} />
               )}
               <input
                  ref={inputRef}
                  type="text"
                  className={cx('input')}
                  value={inputText}
                  placeholder={replyingTo ? `Reply to @${replyingTo.user?.nickname}...` : 'Add comment...'}
                  onChange={(e) => setInputText(e.target.value)}
               />
               <button type="submit" className={cx('send-btn')} disabled={!inputText.trim()} title="Post comment">
                  <FontAwesomeIcon icon={faPaperPlane} />
               </button>
            </div>
         </form>
      </div>
   );
}

export default CommentsPopup;
