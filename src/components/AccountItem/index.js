import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import styles from './AccountItem.module.scss';

const cx = classNames.bind(styles);

function AccountItem({ data }) {
   return (
      <div className={cx('wrapper')}>
         <img
            className={cx('avatar')}
            src={
               data?.avatar ||
               'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
            }
            alt={data?.full_name || 'Avatar'}
         />
         <div className={cx('info')}>
            <h4 className={cx('name')}>
               <span>{data?.full_name || 'Nguyễn Văn A'}</span>
               {(data?.tick ?? true) && <FontAwesomeIcon className={cx('check')} icon={faCircleCheck} />}
            </h4>
            <span className={cx('username')}>{data?.nickname || 'nguyenvana'}</span>
         </div>
      </div>
   );
}

export default AccountItem;
