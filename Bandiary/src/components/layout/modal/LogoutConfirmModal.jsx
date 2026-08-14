import styles from './LogoutConfirmModal.module.css'

function LogoutConfirmModal({ onClose, onConfirm }) {
  return (
    <div
      className={styles.overlay}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={styles.card}
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

        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
          >
            취소
          </button>

          <button
            type="button"
            className={styles.confirmButton}
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
