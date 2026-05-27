function ProfileEditModal({
  profileForm,
  errorMessage,
  onClose,
  onSubmit,
  onInputChange,
}) {
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
            <option value="Main Guitar">Guitar</option>
            <option value="Sub Guitar">Sub Guitar</option>
            <option value="Bass">Bass</option>
            <option value="Keyboard">Keyboard</option>
            <option value="Drum">Drum</option>
          </select>

          <select
            name="subSession"
            value={profileForm.subSession}
            onChange={onInputChange}
          >
            <option value="">서브 세션을 선택해주세요</option>
            <option value="Vocal">Vocal</option>
            <option value="Main Guitar">Guitar</option>
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