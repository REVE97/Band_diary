import {
  useId,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from 'react'
import { createPortal } from 'react-dom'

import styles from './ModalPortal.module.css'

const modalStack = []
const modalStackListeners = new Set()

let modalStackSnapshot = ''
let backgroundState = null

const updateModalStackSnapshot = () => {
  modalStackSnapshot = modalStack.join('|')
  modalStackListeners.forEach((listener) => listener())
}

const subscribeModalStack = (listener) => {
  modalStackListeners.add(listener)

  return () => {
    modalStackListeners.delete(listener)
  }
}

const getModalStackSnapshot = () => modalStackSnapshot

const lockBackground = () => {
  const pageScrollContainer = document.querySelector(
    '[data-page-scroll-container]',
  )
  const mobileShell = document.querySelector('[data-mobile-shell]')

  backgroundState = {
    pageScrollContainer,
    mobileShell,
    focusedElement: document.activeElement,
    bodyOverflow: document.body.style.overflow,
    pageOverflow: pageScrollContainer?.style.overflow,
    pageOverscrollBehavior: pageScrollContainer?.style.overscrollBehavior,
    mobileShellInert: mobileShell?.inert,
  }

  document.body.style.overflow = 'hidden'

  if (pageScrollContainer) {
    pageScrollContainer.style.overflow = 'hidden'
    pageScrollContainer.style.overscrollBehavior = 'none'
  }

  if (mobileShell) {
    mobileShell.inert = true
  }
}

const unlockBackground = () => {
  if (!backgroundState) return

  const {
    pageScrollContainer,
    mobileShell,
    focusedElement,
    bodyOverflow,
    pageOverflow,
    pageOverscrollBehavior,
    mobileShellInert,
  } = backgroundState

  document.body.style.overflow = bodyOverflow || ''

  if (pageScrollContainer) {
    pageScrollContainer.style.overflow = pageOverflow || ''
    pageScrollContainer.style.overscrollBehavior =
      pageOverscrollBehavior || ''
  }

  if (mobileShell) {
    mobileShell.inert = mobileShellInert || false
  }

  if (
    focusedElement instanceof HTMLElement &&
    focusedElement.isConnected
  ) {
    focusedElement.focus()
  }

  backgroundState = null
}

function ModalPortal({
  children,
  initialFocusRef,
  onBackdropClick,
  onBackdropMouseDown,
  onEscapeKey,
}) {
  const modalId = useId()
  const layerRef = useRef(null)

  useSyncExternalStore(
    subscribeModalStack,
    getModalStackSnapshot,
    getModalStackSnapshot,
  )

  const modalDepth = modalStack.indexOf(modalId)
  const normalizedDepth = Math.max(modalDepth, 0)
  const isNested = modalDepth > 0
  const isTopModal =
    modalDepth === -1 || modalDepth === modalStack.length - 1

  useLayoutEffect(() => {
    const previouslyFocusedElement = document.activeElement

    if (modalStack.length === 0) {
      lockBackground()
    }

    modalStack.push(modalId)
    updateModalStackSnapshot()

    const firstFocusableElement =
      initialFocusRef?.current ||
      layerRef.current?.querySelector(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )

    firstFocusableElement?.focus({ preventScroll: true })

    return () => {
      const modalIndex = modalStack.indexOf(modalId)

      if (modalIndex !== -1) {
        modalStack.splice(modalIndex, 1)
      }

      updateModalStackSnapshot()

      if (modalStack.length === 0) {
        unlockBackground()
      } else if (
        previouslyFocusedElement instanceof HTMLElement &&
        previouslyFocusedElement.isConnected
      ) {
        previouslyFocusedElement.focus()
      }
    }
  }, [initialFocusRef, modalId])

  useLayoutEffect(() => {
    if (!isTopModal || !onEscapeKey) return undefined

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onEscapeKey()
      }
    }

    document.addEventListener('keydown', handleEscapeKey)

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isTopModal, onEscapeKey])

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onBackdropClick?.(event)
    }
  }

  const handleBackdropMouseDown = (event) => {
    if (event.target === event.currentTarget) {
      onBackdropMouseDown?.(event)
    }
  }

  return createPortal(
    <div
      ref={layerRef}
      className={`${styles.overlay} ${isNested ? styles.nested : ''}`}
      style={{ zIndex: 1000 + normalizedDepth * 10 }}
      role="presentation"
      data-modal-layer
      aria-hidden={!isTopModal || undefined}
      inert={!isTopModal}
      onClick={handleBackdropClick}
      onMouseDown={handleBackdropMouseDown}
    >
      {children}
    </div>,
    document.body,
  )
}

export default ModalPortal
