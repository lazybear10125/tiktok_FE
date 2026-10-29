import Header from '~/components/Layout/components/Header';
import styles from './HeaderOnly.module.scss';

function HeaderOnly({ children }) {
   return (
      <div className={styles.wrapper}>
         <Header />
         <div className="container">
            <h1 className={styles.title}>TikTok</h1>
            <div className={styles.content}>{children}</div>
            <div className="footer">
               <p>&copy; 2023 TikTok. All rights reserved.</p>
            </div>
         </div>
      </div>
   );
}

export default HeaderOnly;
