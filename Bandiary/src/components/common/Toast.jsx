import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import toastCheckIcon from '../../assets/images/toast-check.svg'
import styles from './Toast.module.css'

const EXIT_ANIMATION_DURATION = 180

function Toast({
  message,
  duration = 3200,
  iconText = '',
  actionLabel = '',
  dismissLabel = '',
  isActionDisabled = false,
  onAction,
  onClose,
}) {
  const [isLeaving, setIsLeaving] = useState(false)
  const hasActions = Boolean(actionLabel || dismissLabel)

  useEffect(() => {
    document.body.classList.add('toastOpen')

    let exitTimer
    let closeTimer

    if (Number.isFinite(duration) && duration > 0) {
      exitTimer = window.setTimeout(() => {
        setIsLeaving(true)
      }, Math.max(duration - EXIT_ANIMATION_DURATION, 0))

      closeTimer = window.setTimeout(() => {
        onClose()
      }, duration)
    }

    return () => {
      document.body.classList.remove('toastOpen')
      if (exitTimer !== undefined) window.clearTimeout(exitTimer)
      if (closeTimer !== undefined) window.clearTimeout(closeTimer)
    }
  }, [duration, onClose])

  return createPortal(
    <div
      className={`${styles.toast} ${isLeaving ? styles.leaving : ''}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className={styles.icon} aria-hidden="true">
        {iconText ? (
          <span className={styles.iconText}>{iconText}</span>
        ) : (
          <img src={toastCheckIcon} alt="" />
        )}
      </span>

      <div className={styles.content}>
        <p>{message}</p>

        {hasActions && (
          <div className={styles.actions}>
            {actionLabel && (
              <button
                type="button"
                className={styles.actionButton}
                onClick={onAction}
                disabled={isActionDisabled}
              >
                {actionLabel}
              </button>
            )}

            {dismissLabel && (
              <button
                type="button"
                className={styles.dismissButton}
                onClick={onClose}
                disabled={isActionDisabled}
              >
                {dismissLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

export default Toast
