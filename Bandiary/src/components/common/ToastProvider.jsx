import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

import ToastContext from './ToastContext'
import Toast from './Toast'

const SERVICE_WORKER_UPDATE_INTERVAL = 60 * 60 * 1000

function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const toastIdRef = useRef(0)
  const serviceWorkerRegistrationRef = useRef(null)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_serviceWorkerUrl, registration) {
      serviceWorkerRegistrationRef.current = registration || null
    },
    onRegisterError(error) {
      console.error('서비스 워커 등록 실패:', error)
    },
  })

  useEffect(() => {
    const checkForUpdate = () => {
      const registration = serviceWorkerRegistrationRef.current

      if (
        !registration ||
        !navigator.onLine ||
        document.visibilityState !== 'visible'
      ) {
        return
      }

      registration.update().catch((error) => {
        console.error('서비스 워커 업데이트 확인 실패:', error)
      })
    }

    const updateInterval = window.setInterval(
      checkForUpdate,
      SERVICE_WORKER_UPDATE_INTERVAL,
    )

    document.addEventListener('visibilitychange', checkForUpdate)
    window.addEventListener('focus', checkForUpdate)

    return () => {
      window.clearInterval(updateInterval)
      document.removeEventListener('visibilitychange', checkForUpdate)
      window.removeEventListener('focus', checkForUpdate)
    }
  }, [])

  const showToast = useCallback((message) => {
    toastIdRef.current += 1
    setToast({
      id: toastIdRef.current,
      message,
    })
  }, [])

  const hideToast = useCallback(() => {
    setToast(null)
  }, [])

  const handleUpdateLater = useCallback(() => {
    setToast(null)
    setNeedRefresh(false)
  }, [setNeedRefresh])

  const handleApplyUpdate = useCallback(async () => {
    setIsUpdating(true)

    try {
      await updateServiceWorker(true)
    } catch (error) {
      console.error('새 버전 적용 실패:', error)
      setIsUpdating(false)
    }
  }, [updateServiceWorker])

  const contextValue = useMemo(
    () => ({ showToast }),
    [showToast],
  )

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {needRefresh ? (
        <Toast
          message="새 버전이 준비되었습니다. 지금 업데이트할까요?"
          duration={null}
          actionLabel={isUpdating ? '업데이트 중...' : '업데이트'}
          dismissLabel="나중에"
          isActionDisabled={isUpdating}
          onAction={handleApplyUpdate}
          onClose={handleUpdateLater}
        />
      ) : toast ? (
        <Toast
          key={toast.id}
          message={toast.message}
          onClose={hideToast}
        />
      ) : null}
    </ToastContext.Provider>
  )
}

export default ToastProvider
