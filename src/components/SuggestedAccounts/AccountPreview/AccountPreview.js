import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';

import Button from '~/components/Button';
import styles from './AccountPreview.module.scss';

const cx = classNames.bind(styles);

function AccountPreview({ data }) {
   return (
      <div className={cx('wrapper')}>
         <div className={cx('header')}>
            <img className={cx('avatar')} src={data.avatar} alt={data.nickname} />
            <Button className={cx('follow-btn')} primary>
               Follow
            </Button>
         </div>
         <div className={cx('body')}>
            <p className={cx('nickname')}>
               <strong>{data.nickname}</strong>
               {data.tick && <FontAwesomeIcon className={cx('check')} icon={faCircleCheck} />}
            </p>
            <p className={cx('name')}>{data.name}</p>
            <p className={cx('analytics')}>
               <strong className={cx('value')}>{data.followers || '8.2M'} </strong>
               <span className={cx('label')}>Followers</span>
               <strong className={cx('value')}>{data.likes || '245.5M'} </strong>
               <span className={cx('label')}>Likes</span>
            </p>
         </div>
      </div>
   );
}

export default AccountPreview;
