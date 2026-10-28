import classNames from 'classnames/bind';
import Tippy from '@tippyjs/react/headless';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';

import { Wrapper as PopperWrapper } from '~/components/Popper';
import AccountPreview from './AccountPreview/AccountPreview';
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
            <div className={cx('account-item')}>
               <img className={cx('avatar')} src={data.avatar} alt={data.nickname} />
               <div className={cx('item-info')}>
                  <p className={cx('nickname')}>
                     <strong>{data.nickname}</strong>
                     {data.tick && <FontAwesomeIcon className={cx('check')} icon={faCircleCheck} />}
                  </p>
                  <p className={cx('name')}>{data.name}</p>
               </div>
            </div>
         </Tippy>
      </div>
   );
}

export default AccountItem;
