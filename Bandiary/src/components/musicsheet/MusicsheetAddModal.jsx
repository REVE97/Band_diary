import { useState } from 'react'

import ModalPortal from '../common/ModalPortal'

import styles from './MusicsheetAddModal.module.css'

const sessionOptions = ['Vocal', 'Guitar', 'Bass', 'Keyboard', 'Drum']

function MusicsheetAddModal({
  musicsheetForm,
  musicsheetFileName,
  errorMessage,
  currentStep,
  onStepChange,
  onOpenConverter,
  onClose,
  onSubmit,
  onSessionChange,
  onInputChange,
  onFileChange,
}) {
  const hasFile = musicsheetFileName !== '선택된 파일 없음'
  const [stepErrorMessage, setStepErrorMessage] = useState('')

  const getStepTitle = () => {
    if (currentStep === 1) return '악보 정보를 입력해주세요.'
    if (currentStep === 2) return '업로드할 PDF 파일을 선택해주세요.'
    return '입력한 정보를 확인해주세요.'
  }

  const getStepErrorMessage = () => {
    if (currentStep === 1) {
      if (!musicsheetForm.session.trim()) return '세션을 선택해주세요.'
      if (!musicsheetForm.title.trim()) return '제목을 입력해주세요.'
      if (!musicsheetForm.description.trim()) return '설명을 입력해주세요.'
    }

    if (
      currentStep === 2 &&
      musicsheetFileName === '선택된 파일 없음'
    ) {
      return 'PDF 파일을 첨부해주세요.'
    }

    return ''
  }

  const isCurrentStepValid = () => {
    if (currentStep === 1) {
      return Boolean(
        musicsheetForm.session.trim() &&
          musicsheetForm.title.trim() &&
          musicsheetForm.description.trim()
      )
    }

    if (currentStep === 2) {
      return musicsheetFileName !== '선택된 파일 없음'
    }

    return true
  }

  const handleNextStep = () => {
    const validationMessage = getStepErrorMessage()

    if (validationMessage) {
      setStepErrorMessage(validationMessage)
      return
    }

    setStepErrorMessage('')
    onStepChange(Math.min(currentStep + 1, 3))
  }

  const handlePrevStep = () => {
    setStepErrorMessage('')
    onStepChange(Math.max(currentStep - 1, 1))
  }

  const handleChangeSession = (event) => {
    onSessionChange(event)
    setStepErrorMessage('')
  }

  const handleChangeInput = (event) => {
    onInputChange(event)
    setStepErrorMessage('')
  }

  const handleChangeFile = (event) => {
    onFileChange(event)
    setStepErrorMessage('')
  }

  const getStepClassName = (step) => {
    if (currentStep === step) {
      return `${styles.stepItem} ${styles.active}`
    }

    if (currentStep > step) {
      return `${styles.stepItem} ${styles.complete}`
    }

    return styles.stepItem
  }

  return (
    <ModalPortal onEscapeKey={onClose}>
      <section
        className={styles.modalCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="musicsheet-add-title"
      >
        <header className={styles.modalHeader}>
          <div>
            <h2 id="musicsheet-add-title">악보 추가</h2>
            <p>{getStepTitle()}</p>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="악보 추가 모달 닫기"
          >
            <span className={styles.closeIcon} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.stepRow} aria-label="악보 등록 단계">
          <span
            className={getStepClassName(1)}
            aria-current={currentStep === 1 ? 'step' : undefined}
          >
            1
          </span>
          <span
            className={getStepClassName(2)}
            aria-current={currentStep === 2 ? 'step' : undefined}
          >
            2
          </span>
          <span
            className={getStepClassName(3)}
            aria-current={currentStep === 3 ? 'step' : undefined}
          >
            완료
          </span>
        </div>

        <div className={styles.formContent}>
          {currentStep === 1 && (
            <div className={styles.fieldGroup}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>세션</span>
                <select
                  name="session"
                  value={musicsheetForm.session}
                  onChange={handleChangeSession}
                >
                  {sessionOptions.map((session) => (
                    <option key={session} value={session}>
                      {session}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>제목</span>
                <input
                  type="text"
                  name="title"
                  value={musicsheetForm.title}
                  placeholder="제목을 입력해주세요"
                  onChange={handleChangeInput}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>설명</span>
                <input
                  type="text"
                  name="description"
                  value={musicsheetForm.description}
                  placeholder="설명을 입력해주세요"
                  onChange={handleChangeInput}
                />
              </label>
            </div>
          )}

          {currentStep === 2 && (
            <div className={styles.uploadStep}>
              <div className={`${styles.filePanel} ${hasFile ? styles.fileSelected : styles.fileEmpty}`}>
                <div className={styles.fileDetails} aria-live="polite">
                  <strong title={musicsheetFileName}>{musicsheetFileName}</strong>
                  <p>{hasFile ? 'PDF 파일이 선택되었어요.' : '등록할 PDF 악보를 선택해주세요.'}</p>
                </div>

                {hasFile && <span className={styles.selectedCheck} aria-hidden="true" />}

                <div className={styles.filePicker}>
                  <input
                    id="musicsheetFile"
                    className={styles.fileInput}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleChangeFile}
                  />
                  <label htmlFor="musicsheetFile" className={styles.fileButton}>
                    {hasFile ? '파일 다시 선택' : 'PDF 파일 선택'}
                  </label>
                </div>
              </div>

              <aside className={styles.converterCard} aria-labelledby="musicsheet-converter-title">
                <div className={styles.converterHeading}>
                  <span className={styles.imageIconTile} aria-hidden="true">
                    <span className={styles.imageIcon} />
                  </span>
                  <div>
                    <h3 id="musicsheet-converter-title">이미지 악보만 있나요?</h3>
                    <p>사진을 PDF로 변환해 등록해보세요.</p>
                  </div>
                </div>
                <a
                  className={styles.converterLink}
                  href="https://reve-log.vercel.app/labs/imagestopdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onOpenConverter}
                  aria-describedby="musicsheet-converter-external musicsheet-converter-help"
                >
                  이미지 → PDF 변환
                  <span className={styles.externalLinkIcon} aria-hidden="true" />
                </a>
                <p id="musicsheet-converter-external" className={styles.externalHint}>
                  외부 페이지에서 열려요
                </p>
                <p id="musicsheet-converter-help" className={styles.converterHelp}>
                  변환한 PDF를 저장한 뒤 돌아와<br />
                  위에서 파일을 선택해주세요.
                </p>
              </aside>
            </div>
          )}

          {currentStep === 3 && (
            <div className={styles.submitSummary}>
              <strong>{musicsheetForm.title}</strong>

              <dl>
                <div>
                  <dt>세션</dt>
                  <dd>{musicsheetForm.session}</dd>
                </div>
                <div>
                  <dt>설명</dt>
                  <dd>{musicsheetForm.description}</dd>
                </div>
                <div>
                  <dt>파일명</dt>
                  <dd>{musicsheetFileName}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        {(stepErrorMessage || errorMessage) && (
          <p className={styles.errorMessage} role="alert">
            {stepErrorMessage || errorMessage}
          </p>
        )}

        <div className={styles.buttonRow}>
          {currentStep > 1 && (
            <button
              type="button"
              className={styles.previousButton}
              onClick={handlePrevStep}
            >
              이전
            </button>
          )}

          {currentStep < 3 && (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleNextStep}
              disabled={!isCurrentStepValid()}
            >
              다음
            </button>
          )}

          {currentStep === 3 && (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={onSubmit}
            >
              등록하기
            </button>
          )}
        </div>
      </section>
    </ModalPortal>
  )
}

export default MusicsheetAddModal
