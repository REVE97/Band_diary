import { useRef, useState } from 'react'

import ModalPortal from '../common/ModalPortal'

import profile from '../../assets/images/default_profile.svg'
import editIcon from '../../assets/images/edit.svg'
import addIcon from '../../assets/images/add.svg'
import memberRemoveIcon from '../../assets/images/member-remove.svg'
import styles from './ProfileEditModal.module.css'

function ProfileEditModal({
  profileForm,
  profileImagePreview,
  errorMessage,
  onClose,
  onSubmit,
  onInputChange,
  onMembersChange,
  onImageChange,
}) {
  const [selectedFileName, setSelectedFileName] = useState('선택된 파일 없음')
  const [memberName, setMemberName] = useState('')
  const [memberErrorMessage, setMemberErrorMessage] = useState('')

  const members = Array.isArray(profileForm.members)
    ? profileForm.members
    : []

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

  const handleMemberAdd = () => {
    const newMemberName = memberName.trim()

    if (!newMemberName) {
      setMemberErrorMessage('밴드원 이름을 입력해주세요.')
      return
    }

    if (members.includes(newMemberName)) {
      setMemberErrorMessage('이미 등록된 밴드원입니다.')
      return
    }

    onMembersChange([...members, newMemberName])
    setMemberName('')
    setMemberErrorMessage('')
  }

  const handleMemberDelete = (memberIndex) => {
    onMembersChange(
      members.filter((_, index) => index !== memberIndex)
    )
    setMemberErrorMessage('')
  }

  const handleMemberKeyDown = (event) => {
    if (event.key !== 'Enter') return

    event.preventDefault()
    handleMemberAdd()
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

          {/* 설명 */}
          <div className={styles.profileEditField}>
            <label htmlFor="profileDescription">
              설명
            </label>

            <div className={styles.profileDescriptionInputWrap}>
              <textarea
                id="profileDescription"
                name="description"
                value={profileForm.description}
                maxLength={20}
                placeholder="밴드 설명을 입력해주세요"
                onChange={onInputChange}
              />

              <span className={styles.profileDescriptionCount}>
                {profileForm.description.length} / 20
              </span>
            </div>
          </div>

          {/* 밴드원 */}
          <div className={styles.profileEditField}>
            <div className={styles.profileEditFieldHeader}>
              <span className={styles.profileMemberLabel}>밴드원</span>
              <span className={styles.profileMemberCount}>{members.length}명</span>
            </div>

            {members.length > 0 ? (
              <div className={styles.profileMemberList}>
                {members.map((member, index) => (
                  <div
                    key={`${member}-${index}`}
                    className={styles.profileMemberChip}
                  >
                    <span>{member}</span>

                    <button
                      type="button"
                      aria-label={`${member} 삭제`}
                      onClick={() => handleMemberDelete(index)}
                    >
                      <img src={memberRemoveIcon} alt="" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.profileMemberEmpty}>
                등록된 밴드원이 없습니다.
              </p>
            )}

            <div className={styles.profileMemberAddRow}>
              <input
                type="text"
                value={memberName}
                placeholder="밴드원 이름 입력"
                aria-label="추가할 밴드원 이름"
                onChange={(event) => {
                  setMemberName(event.target.value)
                  setMemberErrorMessage('')
                }}
                onKeyDown={handleMemberKeyDown}
              />

              <button
                type="button"
                className={styles.profileMemberAddButton}
                aria-label="밴드원 추가"
                onClick={handleMemberAdd}
              >
                <img src={addIcon} alt="" aria-hidden="true" />
              </button>
            </div>

            <p
              className={
                memberErrorMessage
                  ? styles.profileMemberError
                  : styles.profileMemberHelp
              }
            >
              {memberErrorMessage ||
                '이름을 입력한 후 + 버튼을 눌러주세요.'}
            </p>
          </div>

        </div>

        {errorMessage && (
          <p className={styles.loginError + " " + styles.profileEditError}>
            {errorMessage}
          </p>
        )}

        <div className={styles.profileEditSubmitArea}>
          {/* 프로필 수정 저장 */}
          <button
            type="button"
            className={styles.primaryButton + " " + styles.profileEditSubmitButton}
            onClick={onSubmit}
          >
            저장하기
          </button>
        </div>
      </div>
    </ModalPortal>
  )
}

export default ProfileEditModal
