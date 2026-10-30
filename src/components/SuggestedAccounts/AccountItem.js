import classNames from 'classnames/bind';
import Tippy from '@tippyjs/react/headless';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

import { Wrapper as PopperWrapper } from '~/components/Popper';
import AccountPreview from './AccountPreview/AccountPreview';
import Image from '~/components/Image';
import styles from './SuggestedAccounts.module.scss';

const cx = classNames.bind(styles);

function AccountItem({ data }) {
   const renderPreview = (attrs) => {
      return (
         <div tabIndex="-1" {...attrs}>
            <PopperWrapper>
               <AccountPreview data={data} />
            </PopperWrapper>
         </div>
      );
   };

   return (
      <div>
         <Tippy
            interactive
            delay={[800, 0]}
            offset={[-20, 0]}
            placement="bottom"
            render={renderPreview}
         >
            <Link to={`/@${data.nickname}`} className={cx('account-item')}>
               <Image className={cx('avatar')} src={data.avatar} alt={data.nickname} />
               <div className={cx('item-info')}>
                  <p className={cx('nickname')}>
                     <strong>{data.nickname}</strong>
                     {data.tick && <FontAwesomeIcon className={cx('check')} icon={faCircleCheck} />}
                  </p>
                  <p className={cx('name')}>{data.full_name || data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim()}</p>
               </div>
            </Link>
         </Tippy>
      </div>
   );
}

export default AccountItem;
