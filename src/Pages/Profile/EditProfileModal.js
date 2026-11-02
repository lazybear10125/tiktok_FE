import { useState } from 'react';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faCamera } from '@fortawesome/free-solid-svg-icons';

import Image from '~/components/Image';
import Button from '~/components/Button';
import styles from './Profile.module.scss';

const cx = classNames.bind(styles);

function EditProfileModal({ user, onClose, onSave }) {
   const [fullName, setFullName] = useState(user.full_name || '');
   const [bio, setBio] = useState(user.bio || '');

   const handleSubmit = (e) => {
      e.preventDefault();
      onSave({
         ...user,
         full_name: fullName,
         bio,
      });
      onClose();
   };

   return (
      <div className={cx('edit-modal-overlay')} onClick={onClose}>
         <div className={cx('edit-modal-container')} onClick={(e) => e.stopPropagation()}>
            <div className={cx('edit-modal-header')}>
               <h3 className={cx('edit-modal-title')}>Edit profile</h3>
               <button className={cx('edit-modal-close')} onClick={onClose}>
                  <FontAwesomeIcon icon={faXmark} />
               </button>
            </div>

            <form onSubmit={handleSubmit} className={cx('edit-modal-body')}>
               {/* Photo section */}
               <div className={cx('edit-field-row')}>
                  <label className={cx('edit-label')}>Profile photo</label>
                  <div className={cx('edit-avatar-container')}>
                     <Image className={cx('edit-avatar')} src={user.avatar} alt={user.nickname} />
                     <div className={cx('edit-avatar-badge')} title="Change photo">
                        <FontAwesomeIcon icon={faCamera} />
                     </div>
                  </div>
               </div>

               {/* Username (read-only) */}
               <div className={cx('edit-field-row')}>
                  <label className={cx('edit-label')}>Username</label>
                  <div className={cx('edit-input-group')}>
                     <input
                        type="text"
                        className={cx('edit-input', 'disabled')}
                        value={user.nickname}
                        disabled
                     />
                     <span className={cx('edit-tip')}>
                        www.tiktok.com/@{user.nickname}
                     </span>
                  </div>
               </div>

               {/* Name */}
               <div className={cx('edit-field-row')}>
                  <label className={cx('edit-label')}>Name</label>
                  <div className={cx('edit-input-group')}>
                     <input
                        type="text"
                        className={cx('edit-input')}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your display name"
                     />
                  </div>
               </div>

               {/* Bio */}
               <div className={cx('edit-field-row')}>
                  <label className={cx('edit-label')}>Bio</label>
                  <div className={cx('edit-input-group')}>
                     <textarea
                        className={cx('edit-textarea')}
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Add a bio to your profile"
                     />
                  </div>
               </div>

               {/* Footer buttons */}
               <div className={cx('edit-modal-footer')}>
                  <Button type="button" className={cx('cancel-btn')} onClick={onClose}>
                     Cancel
                  </Button>
                  <Button type="submit" primary className={cx('save-btn')}>
                     Save
                  </Button>
               </div>
            </form>
         </div>
      </div>
   );
}

export default EditProfileModal;
