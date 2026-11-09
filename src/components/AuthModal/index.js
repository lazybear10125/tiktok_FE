import { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
   faXmark,
   faChevronLeft,
   faUser,
   faEye,
   faEyeSlash,
   faSpinner,
   faCircleExclamation,
   faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import images from '~/assets/images';
import styles from './AuthModal.module.scss';

const cx = classNames.bind(styles);

function AuthModal({
   isOpen = false,
   onClose = () => {},
   onLogin = () => {},
   onRegister = () => {},
   initialView = 'select_method',
}) {
   const [view, setView] = useState('select'); // 'select' | 'login' | 'signup'
   const [account, setAccount] = useState('');
   const [password, setPassword] = useState('');
   const [showPassword, setShowPassword] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
   const [errorMessage, setErrorMessage] = useState('');
   const [infoMessage, setInfoMessage] = useState('');

   // Form data cho Sign up
   const [signupData, setSignupData] = useState({
      nickname: '',
      full_name: '',
      email: '',
      password: '',
   });

   // Đồng bộ view và reset form khi mở modal
   useEffect(() => {
      if (isOpen) {
         setView(initialView === 'login_form' ? 'login' : 'select');
         setAccount('');
         setPassword('');
         setShowPassword(false);
         setIsLoading(false);
         setErrorMessage('');
         setInfoMessage('');
         setSignupData({ nickname: '', full_name: '', email: '', password: '' });
      }
   }, [isOpen, initialView]);

   // Đóng modal khi nhấn phím Escape
   useEffect(() => {
      const handleKeyDown = (e) => {
         if (e.key === 'Escape' && isOpen) {
            onClose();
         }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isOpen, onClose]);

   if (!isOpen) return null;

   const handleOverlayClick = (e) => {
      if (e.target === e.currentTarget && !isLoading) {
         onClose();
      }
   };

   // Xử lý submit Login
   const handleLoginSubmit = async (e) => {
      e?.preventDefault();
      setErrorMessage('');
      setInfoMessage('');

      const cleanAccount = account.trim();
      const cleanPassword = password.trim();

      if (!cleanAccount) {
         setErrorMessage('Vui lòng nhập số điện thoại, email hoặc tên người dùng.');
         return;
      }
      if (!cleanPassword) {
         setErrorMessage('Vui lòng nhập mật khẩu.');
         return;
      }

      setIsLoading(true);
      try {
         await onLogin({
            account: cleanAccount,
            nickname: cleanAccount,
            username: cleanAccount,
            email: cleanAccount.includes('@') ? cleanAccount : undefined,
            password: cleanPassword,
         });
         // Thành công: Modal tự đóng thông qua context
      } catch (error) {
         const serverMsg =
            error?.response?.data?.message ||
            error?.message ||
            'Tài khoản hoặc mật khẩu không chính xác. Vui lòng thử lại!';
         setErrorMessage(serverMsg);
      } finally {
         setIsLoading(false);
      }
   };

   // Xử lý submit Register
   const handleSignupSubmit = async (e) => {
      e?.preventDefault();
      setErrorMessage('');
      setInfoMessage('');

      const cleanNick = signupData.nickname.trim().replace(/^@/, '');
      const cleanName = signupData.full_name.trim();
      const cleanEmail = signupData.email.trim();

      if (!cleanNick) {
         setErrorMessage('Vui lòng nhập TikTok ID (nickname).');
         return;
      }

      setIsLoading(true);
      try {
         await onRegister({
            nickname: cleanNick,
            full_name: cleanName || cleanNick,
            email: cleanEmail || undefined,
            password: signupData.password || '123456',
         });
      } catch (error) {
         const serverMsg =
            error?.response?.data?.message ||
            error?.message ||
            'Đăng ký tài khoản không thành công. Vui lòng thử lại!';
         setErrorMessage(serverMsg);
      } finally {
         setIsLoading(false);
      }
   };

   const handleForgotPassword = (e) => {
      e.preventDefault();
      setInfoMessage('Tính năng khôi phục mật khẩu hiện chưa được hỗ trợ bởi máy chủ. Vui lòng liên hệ quản trị viên!');
      setErrorMessage('');
   };

   return (
      <div className={cx('overlay')} onClick={handleOverlayClick}>
         <div className={cx('modal')} role="dialog" aria-modal="true">
            {/* Header: Back button & Close button */}
            <div className={cx('header-bar')}>
               {view !== 'select' ? (
                  <button
                     type="button"
                     className={cx('back-btn')}
                     onClick={() => {
                        setView('select');
                        setErrorMessage('');
                        setInfoMessage('');
                     }}
                     aria-label="Back"
                     disabled={isLoading}
                  >
                     <FontAwesomeIcon icon={faChevronLeft} />
                  </button>
               ) : (
                  <div className={cx('header-spacer')} />
               )}

               <button
                  type="button"
                  className={cx('close-btn')}
                  onClick={onClose}
                  aria-label="Close"
                  disabled={isLoading}
               >
                  <FontAwesomeIcon icon={faXmark} />
               </button>
            </div>

            {/* Nội dung Modal */}
            <div className={cx('body')}>
               {/* TikTok Logo */}
               <div className={cx('logo-wrapper')}>
                  <img src={images.logo} alt="TikTok" className={cx('tiktok-logo')} />
               </div>

               {/* ================= VIEW 1: SELECT METHOD ================= */}
               {view === 'select' && (
                  <div className={cx('view-select')}>
                     <h2 className={cx('title')}>Log in to TikTok</h2>
                     <p className={cx('subtitle')}>
                        Manage your account, check notifications, comment on videos, and more.
                     </p>

                     {/* Duy nhất 1 phương thức: Use phone / email / username */}
                     <div className={cx('methods-list')}>
                        <button
                           type="button"
                           className={cx('method-btn')}
                           onClick={() => {
                              setView('login');
                              setErrorMessage('');
                              setInfoMessage('');
                           }}
                        >
                           <span className={cx('method-icon')}>
                              <FontAwesomeIcon icon={faUser} />
                           </span>
                           <span className={cx('method-text')}>Use phone / email / username</span>
                        </button>
                     </div>
                  </div>
               )}

               {/* ================= VIEW 2: LOGIN FORM ================= */}
               {view === 'login' && (
                  <div className={cx('view-form')}>
                     <h2 className={cx('title')}>Log in</h2>

                     {/* Banner thông báo lỗi nếu có */}
                     {errorMessage && (
                        <div className={cx('error-banner')}>
                           <FontAwesomeIcon icon={faCircleExclamation} className={cx('banner-icon')} />
                           <span>{errorMessage}</span>
                        </div>
                     )}

                     {/* Banner thông báo lưu ý nếu có */}
                     {infoMessage && (
                        <div className={cx('info-banner')}>
                           <FontAwesomeIcon icon={faInfoCircle} className={cx('banner-icon')} />
                           <span>{infoMessage}</span>
                        </div>
                     )}

                     <form onSubmit={handleLoginSubmit} className={cx('form')}>
                        <div className={cx('input-group')}>
                           <input
                              type="text"
                              className={cx('input')}
                              placeholder="Phone / Email / Username"
                              value={account}
                              autoFocus
                              disabled={isLoading}
                              onChange={(e) => {
                                 setAccount(e.target.value);
                                 if (errorMessage) setErrorMessage('');
                              }}
                           />
                        </div>

                        <div className={cx('input-group')}>
                           <input
                              type={showPassword ? 'text' : 'password'}
                              className={cx('input')}
                              placeholder="Password"
                              value={password}
                              disabled={isLoading}
                              onChange={(e) => {
                                 setPassword(e.target.value);
                                 if (errorMessage) setErrorMessage('');
                              }}
                           />
                           <button
                              type="button"
                              className={cx('toggle-pwd-btn')}
                              onClick={() => setShowPassword((prev) => !prev)}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              tabIndex={-1}
                           >
                              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                           </button>
                        </div>

                        <div className={cx('form-extras')}>
                           <a href="#forgot" className={cx('forgot-link')} onClick={handleForgotPassword}>
                              Forgot password?
                           </a>
                        </div>

                        <button
                           type="submit"
                           className={cx('submit-btn', { loading: isLoading })}
                           disabled={isLoading || !account.trim() || !password.trim()}
                        >
                           {isLoading ? (
                              <>
                                 <FontAwesomeIcon icon={faSpinner} spin className={cx('btn-spinner')} />
                                 <span>Logging in...</span>
                              </>
                           ) : (
                              'Log in'
                           )}
                        </button>
                     </form>
                  </div>
               )}

               {/* ================= VIEW 3: SIGNUP FORM ================= */}
               {view === 'signup' && (
                  <div className={cx('view-form')}>
                     <h2 className={cx('title')}>Sign up for TikTok</h2>

                     {errorMessage && (
                        <div className={cx('error-banner')}>
                           <FontAwesomeIcon icon={faCircleExclamation} className={cx('banner-icon')} />
                           <span>{errorMessage}</span>
                        </div>
                     )}

                     <form onSubmit={handleSignupSubmit} className={cx('form')}>
                        <div className={cx('input-group')}>
                           <input
                              type="text"
                              className={cx('input')}
                              placeholder="Username (e.g. yourname)"
                              value={signupData.nickname}
                              autoFocus
                              disabled={isLoading}
                              onChange={(e) =>
                                 setSignupData((prev) => ({ ...prev, nickname: e.target.value }))
                              }
                           />
                        </div>

                        <div className={cx('input-group')}>
                           <input
                              type="text"
                              className={cx('input')}
                              placeholder="Full Name"
                              value={signupData.full_name}
                              disabled={isLoading}
                              onChange={(e) =>
                                 setSignupData((prev) => ({ ...prev, full_name: e.target.value }))
                              }
                           />
                        </div>

                        <div className={cx('input-group')}>
                           <input
                              type="email"
                              className={cx('input')}
                              placeholder="Email (optional)"
                              value={signupData.email}
                              disabled={isLoading}
                              onChange={(e) =>
                                 setSignupData((prev) => ({ ...prev, email: e.target.value }))
                              }
                           />
                        </div>

                        <div className={cx('input-group')}>
                           <input
                              type={showPassword ? 'text' : 'password'}
                              className={cx('input')}
                              placeholder="Password"
                              value={signupData.password}
                              disabled={isLoading}
                              onChange={(e) =>
                                 setSignupData((prev) => ({ ...prev, password: e.target.value }))
                              }
                           />
                           <button
                              type="button"
                              className={cx('toggle-pwd-btn')}
                              onClick={() => setShowPassword((prev) => !prev)}
                              tabIndex={-1}
                           >
                              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                           </button>
                        </div>

                        <button
                           type="submit"
                           className={cx('submit-btn', { loading: isLoading })}
                           disabled={isLoading || !signupData.nickname.trim()}
                        >
                           {isLoading ? (
                              <>
                                 <FontAwesomeIcon icon={faSpinner} spin className={cx('btn-spinner')} />
                                 <span>Signing up...</span>
                              </>
                           ) : (
                              'Sign up'
                           )}
                        </button>
                     </form>
                  </div>
               )}
            </div>

            {/* Footer */}
            <div className={cx('footer')}>
               {view === 'signup' ? (
                  <p className={cx('footer-text')}>
                     Already have an account?{' '}
                     <button
                        type="button"
                        className={cx('footer-link')}
                        onClick={() => {
                           setView('login');
                           setErrorMessage('');
                           setInfoMessage('');
                        }}
                        disabled={isLoading}
                     >
                        Log in
                     </button>
                  </p>
               ) : (
                  <p className={cx('footer-text')}>
                     Don&apos;t have an account?{' '}
                     <button
                        type="button"
                        className={cx('footer-link')}
                        onClick={() => {
                           setView('signup');
                           setErrorMessage('');
                           setInfoMessage('');
                        }}
                        disabled={isLoading}
                     >
                        Sign up
                     </button>
                  </p>
               )}
            </div>
         </div>
      </div>
   );
}

export default AuthModal;
