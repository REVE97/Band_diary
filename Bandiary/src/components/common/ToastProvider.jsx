import { useCallback, useMemo, useRef, useState } from 'react'

import ToastContext from './ToastContext'
import Toast from './Toast'

function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const toastIdRef = useRef(0)

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

  const contextValue = useMemo(
    () => ({ showToast }),
    [showToast],
  )

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          onClose={hideToast}
        />
      )}
    </ToastContext.Provider>
  )
}

export default ToastProvider
