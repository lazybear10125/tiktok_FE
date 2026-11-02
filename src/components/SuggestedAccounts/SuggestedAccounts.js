import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './SuggestedAccounts.module.scss';
import AccountItem from './AccountItem';

const cx = classNames.bind(styles);

function SuggestedAccounts({ label, data = [], defaultVisible }) {
   const [isSeeAll, setIsSeeAll] = useState(false);

   const visibleData = defaultVisible && !isSeeAll ? data.slice(0, defaultVisible) : data;

   return (
      <div className={cx('wrapper')}>
         <p className={cx('label')}>{label}</p>
         {visibleData.map((account) => (
            <AccountItem key={account.id} data={account} />
         ))}
         {defaultVisible && data.length > defaultVisible && (
            <p className={cx('more-btn')} onClick={() => setIsSeeAll((prev) => !prev)}>
               {isSeeAll ? 'See less' : 'See all'}
            </p>
         )}
      </div>
   );
}

export default SuggestedAccounts;
