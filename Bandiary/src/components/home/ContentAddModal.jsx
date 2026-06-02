import { useEffect, useState } from 'react'

function ContentAddModal({
  contentType,
  contentForm,
  contentFileName,
  contentPreview,
  errorMessage,
  convertMessage,
  isContentUploading,
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
  const isAudio = contentType === '오디오'

  useEffect(() => {
    setCurrentStep(1)
    setStepErrorMessage('')
  }, [contentType])

  const getStepTitle = () => {
    if (currentStep === 1) return '콘텐츠 정보를 입력해주세요.'

    if (currentStep === 2) {
      if (isPicture) return '업로드할 사진 파일을 선택해주세요. (10MB 이하)'
      if (isVideo) {
        return '업로드할 비디오 파일을 선택해주세요. (30MB 이하)'
      }

      return '업로드할 오디오 파일을 선택해주세요. 비디오 파일을 선택하면 m4a 오디오로 변환됩니다.'
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
        if (isPicture) return '이미지 파일을 첨부해주세요.'
        if (isVideo) return '영상 파일을 첨부해주세요.'

        return '오디오 파일을 첨부해주세요.'
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

  const getFileAcceptValue = () => {
    if (isPicture) return 'image/*'
    if (isVideo) return 'video/mp4,video/quicktime,video/webm,video/x-m4v'
    return 'audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/webm,audio/ogg,video/mp4,video/quicktime,video/webm,video/x-m4v,.mp3,.m4a,.aac,.wav,.webm,.ogg,.mp4,.mov,.m4v'
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
            disabled={isContentUploading}
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
              disabled={isContentUploading}
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
              disabled={isContentUploading}
            />
            비디오
          </label>

          <label>
            <input
              type="radio"
              name="contentType"
              value="오디오"
              checked={isAudio}
              onChange={onContentTypeChange}
              disabled={isContentUploading}
            />
            오디오
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
                    : isVideo
                      ? '카테고리 예: 공연 영상, 연습 영상'
                      : '카테고리 예: 합주 녹음, 공연 음원'
                }
                onChange={handleChangeInput}
                disabled={isContentUploading}
              />

              <input
                type="text"
                name="title"
                value={contentForm.title}
                placeholder="제목을 입력해주세요"
                onChange={handleChangeInput}
                disabled={isContentUploading}
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

              {isVideo && (
                <div className="content-upload-guide">
                  <strong>비디오 업로드 안내</strong>
                  <p>
                    비디오 탭에서는 30MB 이하의 영상 파일을 원본 비디오로
                    저장합니다.
                  </p>
                </div>
              )}

              {isAudio && (
                <div className="content-upload-guide">
                  <strong>오디오 업로드 안내</strong>
                  <p>
                    mp3, m4a, wav, webm 등의 오디오 파일은 그대로 저장되고,
                    mp4, mov 등의 영상 파일은 m4a 오디오로 변환되어
                    저장됩니다.
                  </p>
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
                  accept={getFileAcceptValue()}
                  onChange={handleChangeFile}
                  disabled={isContentUploading}
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

              {isVideo && <span>저장 방식: 비디오 파일 그대로 저장</span>}

              {isAudio && (
                <span>
                  저장 방식: 오디오 파일은 그대로 저장 / 영상 파일은 m4a
                  오디오로 변환 저장
                </span>
              )}
            </div>
          )}
        </div>

        {(stepErrorMessage || errorMessage || convertMessage) && (
          <p className="login-error">
            {convertMessage || stepErrorMessage || errorMessage}
          </p>
        )}

        <div className="place-modal-button-row">
          {currentStep > 1 && (
            <button
              type="button"
              className="place-prev-button"
              onClick={handlePrevStep}
              disabled={isContentUploading}
            >
              이전
            </button>
          )}

          {currentStep < 3 && (
            <button
              type="button"
              className="primary-button"
              onClick={handleNextStep}
              disabled={!isCurrentStepValid() || isContentUploading}
            >
              다음
            </button>
          )}

          {currentStep === 3 && (
            <button
              type="button"
              className="primary-button"
              onClick={onSubmit}
              disabled={isContentUploading}
            >
              {isContentUploading ? '처리 중...' : '등록하기'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ContentAddModal