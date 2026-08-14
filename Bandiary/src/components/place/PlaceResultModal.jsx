import styles from './PlaceResultModal.module.css'

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
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div
          className={`${styles.icon} ${isSuccess ? styles.success : ''}`}
        >
          {isSuccess ? '✓' : '!'}
        </div>

        <h2>{title}</h2>
        <p>{message}</p>

        {isConfirm ? (
          <div className={styles.buttonRow}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
            >
              {cancelText}
            </button>

            <button
              type="button"
              className={styles.confirmButton}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        ) : (
          <button type="button" className={styles.primaryButton} onClick={onClose}>
            확인
          </button>
        )}
      </div>
    </div>
  )
}

export default PlaceResultModal
