function LogoutConfirmModal({ onClose, onConfirm }) {
  return (
    <div
      className="place-result-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="place-result-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-modal-title"
        aria-describedby="logout-modal-description"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="logout-modal-title">로그아웃</h2>

        <p id="logout-modal-description">
          정말 로그아웃하시겠습니까?
        </p>

        <div className="delete-confirm-button-row">
          <button
            type="button"
            className="delete-cancel-button"
            onClick={onClose}
          >
            취소
          </button>

          <button
            type="button"
            className="delete-confirm-button"
            onClick={onConfirm}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}

export default LogoutConfirmModal