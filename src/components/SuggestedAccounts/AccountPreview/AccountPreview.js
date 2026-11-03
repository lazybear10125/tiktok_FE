import { useState } from 'react';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCheck } from '@fortawesome/free-solid-svg-icons';

import Button from '~/components/Button';
import Image from '~/components/Image';
import { useAuth } from '~/context/AuthContext';
import styles from './AccountPreview.module.scss';

const cx = classNames.bind(styles);

const formatCount = (count) => {
   if (typeof count === 'number') {
      if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
      if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
      return count;
   }
   return count;
};

function AccountPreview({ data }) {
   const { currentUser, openLoginModal } = useAuth();
   const [isFollowed, setIsFollowed] = useState(!!data.is_followed);
   const [followersCount, setFollowersCount] = useState(data.followers_count ?? data.followers ?? 0);

   const handleToggleFollow = () => {
      if (!currentUser) {
         openLoginModal();
         return;
      }

      if (isFollowed) {
         setIsFollowed(false);
         setFollowersCount((prev) => Math.max(0, prev - 1));
      } else {
         setIsFollowed(true);
         setFollowersCount((prev) => prev + 1);
      }
   };

   return (
      <div className={cx('wrapper')}>
         <div className={cx('header')}>
            <Image className={cx('avatar')} src={data.avatar} alt={data.nickname} />
            {isFollowed ? (
               <Button className={cx('follow-btn')} onClick={handleToggleFollow} outline>
                  <FontAwesomeIcon icon={faCheck} style={{ marginRight: 4 }} />
                  Following
               </Button>
            ) : (
               <Button className={cx('follow-btn')} primary onClick={handleToggleFollow}>
                  Follow
               </Button>
            )}
         </div>
         <div className={cx('body')}>
            <p className={cx('nickname')}>
               <strong>{data.nickname}</strong>
               {data.tick && <FontAwesomeIcon className={cx('check')} icon={faCircleCheck} />}
            </p>
            <p className={cx('name')}>
               {data.full_name || data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim()}
            </p>
            <p className={cx('analytics')}>
               <strong className={cx('value')}>{formatCount(followersCount) || '0'} </strong>
               <span className={cx('label')}>Followers</span>
               <strong className={cx('value')}>{formatCount(data.likes_count ?? data.likes) || '0'} </strong>
               <span className={cx('label')}>Likes</span>
            </p>
         </div>
      </div>
   );
}

export default AccountPreview;
