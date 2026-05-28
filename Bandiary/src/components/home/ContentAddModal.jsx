import { useEffect, useState } from 'react'

function ContentAddModal({
  contentType,
  contentForm,
  contentFileName,
  contentPreview,
  errorMessage,
  onClose,
  onSubmit,
  onContentTypeChange,
  onInputChange,
  onFileChange,
}) {
  const [currentStep, setCurrentStep] = useState(1)
  const [stepErrorMessage, setStepErrorMessage] = useState('')

  const isPicture = contentType === '사진'
  const isVideo = contentType === '비디오'

  useEffect(() => {
    setCurrentStep(1)
    setStepErrorMessage('')
  }, [contentType])

  const getStepTitle = () => {
    if (currentStep === 1) return '콘텐츠 정보를 입력해주세요.'
    if (currentStep === 2) {
      return isPicture
        ? '업로드할 사진 파일을 선택해주세요.'
        : '업로드할 영상 파일을 선택해주세요.'
    }
    return '입력한 정보를 확인해주세요.'
  }

  const getStepErrorMessage = () => {
    if (currentStep === 1) {
      if (!contentForm.category.trim()) {
        return '카테고리를 입력해주세요.'
      }

      if (!contentForm.title.trim()) {
        return '제목을 입력해주세요.'
      }
    }

    if (currentStep === 2) {
      if (contentFileName === '선택된 파일 없음') {
        return isPicture
          ? '이미지 파일을 첨부해주세요.'
          : '영상 파일을 첨부해주세요.'
      }
    }

    return ''
  }

  const isCurrentStepValid = () => {
    if (currentStep === 1) {
      return Boolean(contentForm.category.trim() && contentForm.title.trim())
    }

    if (currentStep === 2) {
      return contentFileName !== '선택된 파일 없음'
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
            <h2>콘텐츠 추가</h2>
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

        <div className="place-type-row">
          <label>
            <input
              type="radio"
              name="contentType"
              value="사진"
              checked={isPicture}
              onChange={onContentTypeChange}
            />
            사진
          </label>

          <label>
            <input
              type="radio"
              name="contentType"
              value="비디오"
              checked={isVideo}
              onChange={onContentTypeChange}
            />
            비디오
          </label>
        </div>

        <div className="content-step-row">
          <span className={currentStep === 1 ? 'active' : ''}>1</span>
          <span className={currentStep === 2 ? 'active' : ''}>2</span>
          <span className={currentStep === 3 ? 'active' : ''}>완료</span>
        </div>

        <div className="login-form place-form">
          {currentStep === 1 && (
            <>
              <input
                type="text"
                name="category"
                value={contentForm.category}
                placeholder={
                  isPicture
                    ? '카테고리 예: 공연 사진, 합주 사진'
                    : '카테고리 예: 공연 영상, 연습 영상'
                }
                onChange={handleChangeInput}
              />

              <input
                type="text"
                name="title"
                value={contentForm.title}
                placeholder="제목을 입력해주세요"
                onChange={handleChangeInput}
              />
            </>
          )}

          {currentStep === 2 && (
            <>
              {contentPreview && isPicture && (
                <div className="content-upload-preview">
                  <img src={contentPreview} alt="콘텐츠 이미지 미리보기" />
                </div>
              )}

              {contentPreview && isVideo && (
                <div className="content-upload-preview">
                  <video src={contentPreview} controls />
                </div>
              )}

              <div className="custom-file-row">
                <label htmlFor="contentFile" className="custom-file-button">
                  파일 선택
                </label>

                <span className="custom-file-name">{contentFileName}</span>

                <input
                  id="contentFile"
                  className="custom-file-input"
                  type="file"
                  accept={isPicture ? 'image/*' : 'video/mp4,video/quicktime,video/webm,video/x-m4v'}
                  onChange={handleChangeFile}
                />
              </div>
            </>
          )}

          {currentStep === 3 && (
            <div className="place-submit-summary">
              <strong>{contentForm.title}</strong>
              <span>타입: {contentType}</span>
              <span>카테고리: {contentForm.category}</span>
              <span>파일명: {contentFileName}</span>
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

export default ContentAddModal