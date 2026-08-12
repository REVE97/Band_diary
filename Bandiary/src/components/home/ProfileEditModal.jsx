import { useState } from 'react'

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
      <div className="place-modal-card">
        <div className="place-modal-header">
          <div>
            <h2>프로필 수정</h2>
            <p>
              이름, 밴드명, 메인 세션, 프로필 이미지를
              <br />
              수정해주세요.
            </p>
          </div>

          <button
            type="button"
            className="place-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="login-form place-form">
          {profileImagePreview && (
            <div className="profile-image-preview">
              <img src={profileImagePreview} alt="프로필 이미지 미리보기" />
            </div>
          )}

          <div className="custom-file-row">
            <label htmlFor="profileImageFile" className="custom-file-button">
              파일 선택
            </label>

            <span className="custom-file-name">{selectedFileName}</span>

            <input
              id="profileImageFile"
              className="custom-file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <input
            type="text"
            name="name"
            value={profileForm.name}
            placeholder="이름"
            onChange={onInputChange}
          />

          <select
            name="bandName"
            value={profileForm.bandName}
            onChange={onInputChange}
          >
            <option value="">밴드를 선택해주세요</option>
            <option value="11F">11F</option>
          </select>

          <select
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

        {errorMessage && <p className="login-error">{errorMessage}</p>}

        <div className="place-modal-button-row">
          <button
            type="button"
            className="place-prev-button"
            onClick={onClose}
          >
            취소
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={onSubmit}
          >
            수정하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileEditModal