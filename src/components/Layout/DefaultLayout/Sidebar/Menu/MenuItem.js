import classNames from 'classnames/bind';
import { NavLink } from 'react-router-dom';
import styles from './Menu.module.scss';

const cx = classNames.bind(styles);

function MenuItem({ title, to, icon, activeIcon }) {
   const handleClick = () => {
      if (window.location.pathname === to) {
         window.scrollTo({ top: 0, behavior: 'smooth' });
      }
   };

   return (
      <NavLink
         className={(nav) => cx('menu-item', { active: nav.isActive })}
         to={to}
         end
         onClick={handleClick}
      >
         <span className={cx('icon')}>{icon}</span>
         <span className={cx('active-icon')}>{activeIcon}</span>
         <span className={cx('title')}>{title}</span>
      </NavLink>
   );
}

export default MenuItem;
