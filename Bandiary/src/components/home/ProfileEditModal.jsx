import { useRef, useState } from 'react'

import ModalPortal from '../common/ModalPortal'

import profile from '../../assets/images/default_profile.svg'
import editIcon from '../../assets/images/edit.svg'
import styles from './ProfileEditModal.module.css'

function ProfileEditModal({
  profileForm,
  profileImagePreview,
  errorMessage,
  onClose,
  onSubmit,
  onInputChange,
  onImageChange,
}) {
  const [selectedFileName, setSelectedFileName] = useState('선택된 파일 없음')

  // 프로필 이미지 input 접근
  const fileInputRef = useRef(null)

  // 프로필 이미지 수정 버튼
  const handleImageButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]

    if (file) {
      setSelectedFileName(file.name)
    } else {
      setSelectedFileName('선택된 파일 없음')
    }

    onImageChange(event)
  }

  return (
    <ModalPortal onEscapeKey={onClose}>
      <div
        className={`${styles.placeModalCard} ${styles.profileEditModalCard}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-edit-modal-title"
      >

        {/* 프로필 수정 Modal 헤더 */}
        <div className={styles.placeModalHeader + " " + styles.profileEditModalHeader}>
          <h2 id="profile-edit-modal-title">프로필 수정</h2>

          <button
            type="button"
            className={styles.placeModalClose}
            aria-label="프로필 수정 모달 닫기"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* 프로필 이미지 */}
        <section className={styles.profileEditImageSection}>
          <div className={styles.profileEditImageWrap}>
            <img
              className={styles.profileEditImage}
              src={profileImagePreview || profile}
              alt="프로필 이미지 미리보기"
            />

            {/* 프로필 이미지 수정 */}
            <button
              type="button"
              className={styles.profileEditImageButton}
              aria-label="프로필 이미지 변경"
              onClick={handleImageButtonClick}
            >
              <img
                src={editIcon}
                alt=""
                aria-hidden="true"
              />
            </button>
          </div>

          <input
            ref={fileInputRef}
            id="profileImageFile"
            className={styles.customFileInput}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />

          <p className={styles.profileEditImageHelp}>
            {selectedFileName === '선택된 파일 없음'
              ? '프로필 이미지를 변경하려면 아이콘을 눌러주세요.'
              : selectedFileName}
          </p>
        </section>

        {/* 프로필 상세 항목 */}
        <div className={styles.profileEditForm}>

          {/* 이름 */}
          <div className={styles.profileEditField}>
            <label htmlFor="profileName">
              이름
            </label>

            <input
              id="profileName"
              type="text"
              name="name"
              value={profileForm.name}
              placeholder="이름을 입력해주세요"
              onChange={onInputChange}
            />
          </div>

          {/* 밴드 */}
          <div className={styles.profileEditField}>
            <label htmlFor="profileBandName">
              밴드
            </label>

            <select
              id="profileBandName"
              name="bandName"
              value={profileForm.bandName}
              onChange={onInputChange}
            >
              <option value="">밴드를 선택해주세요</option>
              <option value="11F">11F</option>
            </select>
          </div>

        </div>

        {errorMessage && (
          <p className={styles.loginError + " " + styles.profileEditError}>
            {errorMessage}
          </p>
        )}

        {/* 프로필 수정 저장 */}
        <button
          type="button"
          className={styles.primaryButton + " " + styles.profileEditSubmitButton}
          onClick={onSubmit}
        >
          저장하기
        </button>
      </div>
    </ModalPortal>
  )
}

export default ProfileEditModal
