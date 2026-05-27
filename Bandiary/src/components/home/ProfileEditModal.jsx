function ProfileEditModal({
  profileForm,
  errorMessage,
  onClose,
  onSubmit,
  onInputChange,
}) {
  const isFormValid =
    profileForm.name.trim() &&
    profileForm.bandName.trim() &&
    profileForm.mainSession.trim() &&
    profileForm.subSession.trim()

  return (
    <div className="place-modal-overlay">
      <div className="place-modal-card">
        <div className="place-modal-header">
          <div>
            <h2>프로필 수정</h2>
            <p>이름, 밴드명, 메인 세션, 서브 세션을 수정해주세요.</p>
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
          <input
            type="text"
            name="name"
            value={profileForm.name}
            placeholder="이름"
            onChange={onInputChange}
          />

          <input
            type="text"
            name="bandName"
            value={profileForm.bandName}
            placeholder="밴드명 예: 11f Band"
            onChange={onInputChange}
          />

          <input
            type="text"
            name="mainSession"
            value={profileForm.mainSession}
            placeholder="메인 세션 예: Vocal, Guitar, Drum"
            onChange={onInputChange}
          />

          <input
            type="text"
            name="subSession"
            value={profileForm.subSession}
            placeholder="서브 세션 예: Keyboard, Bass"
            onChange={onInputChange}
          />
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
            disabled={!isFormValid}
          >
            수정하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileEditModal