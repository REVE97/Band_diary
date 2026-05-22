function PlaceResultModal({
  type,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = '확인',
  cancelText = '취소',
}) {
  const isSuccess = type === 'success'
  const isConfirm = type === 'confirm'

  return (
    <div className="place-result-overlay">
      <div className="place-result-card">
        <div
          className={
            isSuccess ? 'place-result-icon success' : 'place-result-icon fail'
          }
        >
          {isSuccess ? '✓' : '!'}
        </div>

        <h2>{title}</h2>
        <p>{message}</p>

        {isConfirm ? (
          <div className="delete-confirm-button-row">
            <button
              type="button"
              className="delete-cancel-button"
              onClick={onClose}
            >
              {cancelText}
            </button>

            <button
              type="button"
              className="delete-confirm-button"
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        ) : (
          <button type="button" className="primary-button" onClick={onClose}>
            확인
          </button>
        )}
      </div>
    </div>
  )
}

export default PlaceResultModal