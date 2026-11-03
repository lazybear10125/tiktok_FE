import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faUserLock } from '@fortawesome/free-solid-svg-icons';
import Button from '~/components/Button';
import styles from './AuthModal.module.scss';

const cx = classNames.bind(styles);

function AuthModal({
   isOpen = false,
   onClose = () => {},
   onLogin = () => {},
   title = 'Bạn cần đăng nhập!',
   description = 'Vui lòng đăng nhập để theo dõi, tương tác và trải nghiệm đầy đủ các tính năng của TikTok.',
}) {
   if (!isOpen) return null;

   const handleOverlayClick = (e) => {
      if (e.target === e.currentTarget) {
         onClose();
      }
   };

   const handleLoginClick = () => {
      onLogin();
      onClose();
   };

   return (
      <div className={cx('overlay')} onClick={handleOverlayClick}>
         <div className={cx('container')}>
            <button className={cx('close-btn')} onClick={onClose} title="Đóng">
               <FontAwesomeIcon icon={faXmark} />
            </button>

            <div className={cx('icon-wrapper')}>
               <FontAwesomeIcon icon={faUserLock} />
            </div>

            <h3 className={cx('title')}>{title}</h3>
            <p className={cx('description')}>{description}</p>

            <div className={cx('actions')}>
               <Button primary className={cx('login-btn')} onClick={handleLoginClick}>
                  Đăng nhập
               </Button>
               <button type="button" className={cx('cancel-btn')} onClick={onClose}>
                  Để sau
               </button>
            </div>
         </div>
      </div>
   );
}

export default AuthModal;
