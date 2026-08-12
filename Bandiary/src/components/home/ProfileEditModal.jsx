import { useRef, useState } from 'react'

import profile from '../../assets/images/default_profile.svg'
import editIcon from '../../assets/images/edit.svg'

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
    <div className="place-modal-overlay">
      <div className="place-modal-card profile-edit-modal-card">

        {/* 프로필 수정 Modal 헤더 */}
        <div className="place-modal-header profile-edit-modal-header">
          <h2>프로필 수정</h2>

          <button
            type="button"
            className="place-modal-close"
            aria-label="프로필 수정 모달 닫기"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* 프로필 이미지 */}
        <section className="profile-edit-image-section">
          <div className="profile-edit-image-wrap">
            <img
              className="profile-edit-image"
              src={profileImagePreview || profile}
              alt="프로필 이미지 미리보기"
            />

            {/* 프로필 이미지 수정 */}
            <button
              type="button"
              className="profile-edit-image-button"
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
            className="custom-file-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />

          <p className="profile-edit-image-help">
            {selectedFileName === '선택된 파일 없음'
              ? '프로필 이미지를 변경하려면 아이콘을 눌러주세요.'
              : selectedFileName}
          </p>
        </section>

        {/* 프로필 상세 항목 */}
        <div className="profile-edit-form">

          {/* 이름 */}
          <div className="profile-edit-field">
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
          <div className="profile-edit-field">
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

          {/* 메인 세션 */}
          <div className="profile-edit-field">
            <label htmlFor="profileMainSession">
              메인 세션
            </label>

            <select
              id="profileMainSession"
              name="mainSession"
              value={profileForm.mainSession}
              onChange={onInputChange}
            >
              <option value="">메인 세션을 선택해주세요</option>
              <option value="Vocal">Vocal</option>
              <option value="Main Guitar">Main Guitar</option>
              <option value="Sub Guitar">Sub Guitar</option>
              <option value="Bass">Bass</option>
              <option value="Keyboard">Keyboard</option>
              <option value="Drum">Drum</option>
            </select>
          </div>
        </div>

        {errorMessage && (
          <p className="login-error profile-edit-error">
            {errorMessage}
          </p>
        )}

        {/* 프로필 수정 저장 */}
        <button
          type="button"
          className="primary-button profile-edit-submit-button"
          onClick={onSubmit}
        >
          저장하기
        </button>
      </div>
    </div>
  )
}

export default ProfileEditModal