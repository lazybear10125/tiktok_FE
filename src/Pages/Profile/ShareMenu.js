import classNames from 'classnames/bind';
import Tippy from '@tippyjs/react/headless';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShare, faLink } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faTwitter, faWhatsapp } from '@fortawesome/free-brands-svg-icons';

import { Wrapper as PopperWrapper } from '~/components/Popper';
import styles from './Profile.module.scss';

const cx = classNames.bind(styles);

const SHARE_LIST = [
   {
      title: 'Copy link',
      icon: faLink,
   },
   {
      title: 'Share to Facebook',
      icon: faFacebook,
   },
   {
      title: 'Share to Twitter',
      icon: faTwitter,
   },
   {
      title: 'Share to WhatsApp',
      icon: faWhatsapp,
   },
];

function ShareMenu() {
   return (
      <Tippy
         interactive
         delay={[0, 300]}
         offset={[0, 10]}
         placement="bottom-end"
         render={(attrs) => (
            <div className={cx('share-menu')} tabIndex="-1" {...attrs}>
               <PopperWrapper>
                  <div className={cx('share-list')}>
                     {SHARE_LIST.map((item, index) => (
                        <button key={index} className={cx('share-item')}>
                           <FontAwesomeIcon icon={item.icon} className={cx('share-icon')} />
                           <span className={cx('share-title')}>{item.title}</span>
                        </button>
                     ))}
                  </div>
               </PopperWrapper>
            </div>
         )}
      >
         <button className={cx('action-icon-btn')} title="Share">
            <FontAwesomeIcon icon={faShare} />
         </button>
      </Tippy>
   );
}

export default ShareMenu;
