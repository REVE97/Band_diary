import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import toastCheckIcon from '../../assets/images/toast-check.svg'
import styles from './Toast.module.css'

const EXIT_ANIMATION_DURATION = 180

function Toast({ message, duration = 3200, onClose }) {
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    document.body.classList.add('toastOpen')

    const exitTimer = window.setTimeout(() => {
      setIsLeaving(true)
    }, Math.max(duration - EXIT_ANIMATION_DURATION, 0))

    const closeTimer = window.setTimeout(() => {
      onClose()
    }, duration)

    return () => {
      document.body.classList.remove('toastOpen')
      window.clearTimeout(exitTimer)
      window.clearTimeout(closeTimer)
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
        <img src={toastCheckIcon} alt="" />
      </span>

      <p>{message}</p>
    </div>,
    document.body,
  )
}

export default Toast
