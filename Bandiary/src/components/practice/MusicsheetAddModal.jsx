import { useEffect, useState } from 'react'

const sessionOptions = ['Vocal', 'Guitar', 'Bass', 'Keyboard', 'Drum']

function MusicsheetAddModal({
  musicsheetForm,
  musicsheetFileName,
  errorMessage,
  onClose,
  onSubmit,
  onSessionChange,
  onInputChange,
  onFileChange,
}) {
  const [currentStep, setCurrentStep] = useState(1)
  const [stepErrorMessage, setStepErrorMessage] = useState('')

  useEffect(() => {
    setCurrentStep(1)
    setStepErrorMessage('')
  }, [])

  const getStepTitle = () => {
    if (currentStep === 1) return '악보 정보를 입력해주세요.'
    if (currentStep === 2) return '업로드할 PDF 파일을 선택해주세요.'
    return '입력한 정보를 확인해주세요.'
  }

  const getStepErrorMessage = () => {
    if (currentStep === 1) {
      if (!musicsheetForm.session.trim()) {
        return '세션을 선택해주세요.'
      }

      if (!musicsheetForm.title.trim()) {
        return '제목을 입력해주세요.'
      }

      if (!musicsheetForm.description.trim()) {
        return '설명을 입력해주세요.'
      }
    }

    if (currentStep === 2) {
      if (musicsheetFileName === '선택된 파일 없음') {
        return 'PDF 파일을 첨부해주세요.'
      }
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

    setCurrentStep((prev) => {
      if (prev >= 3) return prev
      return prev + 1
    })
  }

  const handlePrevStep = () => {
    setStepErrorMessage('')

    setCurrentStep((prev) => {
      if (prev <= 1) return prev
      return prev - 1
    })
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

  return (
    <div className="place-modal-overlay">
      <div className="place-modal-card">
        <div className="place-modal-header">
          <div>
            <h2>악보 추가</h2>
            <p>{getStepTitle()}</p>
          </div>

          <button
            type="button"
            className="place-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="content-step-row">
          <span className={currentStep === 1 ? 'active' : ''}>1</span>
          <span className={currentStep === 2 ? 'active' : ''}>2</span>
          <span className={currentStep === 3 ? 'active' : ''}>완료</span>
        </div>

        <div className="login-form place-form">
          {currentStep === 1 && (
            <>
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

              <input
                type="text"
                name="title"
                value={musicsheetForm.title}
                placeholder="제목을 입력해주세요"
                onChange={handleChangeInput}
              />

              <input
                type="text"
                name="description"
                value={musicsheetForm.description}
                placeholder="설명을 입력해주세요"
                onChange={handleChangeInput}
              />
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="custom-file-row">
                <label
                  htmlFor="musicsheetFile"
                  className="custom-file-button"
                >
                  파일 선택
                </label>

                <span className="custom-file-name">
                  {musicsheetFileName}
                </span>

                <input
                  id="musicsheetFile"
                  className="custom-file-input"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleChangeFile}
                />
              </div>

              <p className="musicsheet-file-help">
                PDF 파일을 선택하면 파일명이 자동으로 저장됩니다.
              </p>
            </>
          )}

          {currentStep === 3 && (
            <div className="place-submit-summary">
              <strong>{musicsheetForm.title}</strong>
              <span>세션: {musicsheetForm.session}</span>
              <span>설명: {musicsheetForm.description}</span>
              <span>파일명: {musicsheetFileName}</span>
            </div>
          )}
        </div>

        {(stepErrorMessage || errorMessage) && (
          <p className="login-error">{stepErrorMessage || errorMessage}</p>
        )}

        <div className="place-modal-button-row">
          {currentStep > 1 && (
            <button
              type="button"
              className="place-prev-button"
              onClick={handlePrevStep}
            >
              이전
            </button>
          )}

          {currentStep < 3 && (
            <button
              type="button"
              className="primary-button"
              onClick={handleNextStep}
              disabled={!isCurrentStepValid()}
            >
              다음
            </button>
          )}

          {currentStep === 3 && (
            <button
              type="button"
              className="primary-button"
              onClick={onSubmit}
            >
              등록하기
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default MusicsheetAddModal