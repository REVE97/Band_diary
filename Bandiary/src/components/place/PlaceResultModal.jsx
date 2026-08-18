import ModalPortal from '../common/ModalPortal'

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
    <ModalPortal onEscapeKey={onClose}>
      <div
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="place-result-modal-title"
        aria-describedby="place-result-modal-message"
      >
        <div
          className={`${styles.icon} ${isSuccess ? styles.success : ''}`}
        >
          {isSuccess ? '✓' : '!'}
        </div>

        <h2 id="place-result-modal-title">{title}</h2>
        <p id="place-result-modal-message">{message}</p>

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
    </ModalPortal>
  )
}

export default PlaceResultModal
