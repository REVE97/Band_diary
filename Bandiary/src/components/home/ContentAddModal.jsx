import { useEffect, useState } from 'react'

import ModalPortal from '../common/ModalPortal'

import pictureTypeIcon from '../../assets/images/content-type-picture.svg'
import videoTypeIcon from '../../assets/images/content-type-video.svg'
import audioTypeIcon from '../../assets/images/content-type-audio.svg'
import styles from './ContentAddModal.module.css'

function ContentAddModal({
  contentType,
  contentForm,
  contentFileName,
  contentAudioFiles,
  contentPreview,
  errorMessage,
  convertMessage,
  isContentUploading,
  onClose,
  onSubmit,
  onContentTypeChange,
  onInputChange,
  onFileChange,
  onAudioTitleChange,
  onAudioFileRemove,
}) {
  const [currentStep, setCurrentStep] = useState(1)
  const [stepErrorMessage, setStepErrorMessage] = useState('')

  const isPicture = contentType === '사진'
  const isVideo = contentType === '비디오'
  const isAudio = contentType === '오디오'

  useEffect(() => {
    // 콘텐츠 유형을 변경하면 단계별 입력 상태를 처음부터 다시 시작합니다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

      return '오디오 파일을 선택하고 파일별 제목을 입력해주세요.'
    }

    return '입력한 정보를 확인해주세요.'
  }

  const getStepErrorMessage = () => {
    if (currentStep === 1) {
      if (!contentForm.title.trim()) {
        return '제목을 입력해주세요.'
      }
    }

    if (currentStep === 2) {
      if (isAudio) {
        if (contentAudioFiles.length === 0) {
          return '오디오 파일을 한 개 이상 첨부해주세요.'
        }

        if (contentAudioFiles.some((audioFile) => !audioFile.title.trim())) {
          return '모든 오디오 제목을 입력해주세요.'
        }

        return ''
      }

      if (contentFileName === '선택된 파일 없음') {
        if (isPicture) return '이미지 파일을 첨부해주세요.'
        if (isVideo) return '영상 파일을 첨부해주세요.'
      }
    }

    return ''
  }

  const isCurrentStepValid = () => {
    if (currentStep === 1) {
      return Boolean(contentForm.title.trim())
    }

    if (currentStep === 2) {
      if (isAudio) {
        return (
          contentAudioFiles.length > 0 &&
          contentAudioFiles.every((audioFile) => audioFile.title.trim())
        )
      }

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

  const handleAudioTitleChange = (audioFileId, title) => {
    onAudioTitleChange(audioFileId, title)
    setStepErrorMessage('')
  }

  const handleAudioFileRemove = (audioFileId) => {
    onAudioFileRemove(audioFileId)
    setStepErrorMessage('')
  }

  const getStepClassName = (step) => {
    if (currentStep === step) {
      return `${styles.contentStepItem} ${styles.active}`
    }

    if (currentStep > step) {
      return `${styles.contentStepItem} ${styles.complete}`
    }

    return styles.contentStepItem
  }

  const getFileAcceptValue = () => {
    if (isPicture) return 'image/*'
    if (isVideo) return 'video/mp4,video/quicktime,video/webm,video/x-m4v'
    return 'audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/webm,audio/ogg,video/mp4,video/quicktime,video/webm,video/x-m4v,.mp3,.m4a,.aac,.wav,.webm,.ogg,.mp4,.mov,.m4v'
  }

  return (
    <ModalPortal
      onEscapeKey={isContentUploading ? undefined : onClose}
    >
      <div
        className={`${styles.placeModalCard} ${styles.contentAddModalCard}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="content-add-modal-title"
      >
        <div className={styles.placeModalHeader + " " + styles.contentAddModalHeader}>
          <div>
            <h2 id="content-add-modal-title">콘텐츠 추가</h2>
            <p>{getStepTitle()}</p>
          </div>

          <button
            type="button"
            className={styles.placeModalClose}
            onClick={onClose}
            disabled={isContentUploading}
          >
            ×
          </button>
        </div>

        {/* 콘텐츠 등록 단계 */}
        <div className={styles.contentStepRow} aria-label="콘텐츠 등록 단계">
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

        {/* 콘텐츠 타입 */}
        <div className={styles.placeTypeRow + " " + styles.contentTypeRow}>
          <label className={isPicture ? styles.active : ""}>
            <input
              type="radio"
              name="contentType"
              value="사진"
              checked={isPicture}
              onChange={onContentTypeChange}
              disabled={isContentUploading}
            />
            <span className={styles.contentTypeSymbol}>
              <img
                src={pictureTypeIcon}
                alt=""
                aria-hidden="true"
              />
            </span>
            <strong>사진</strong>
          </label>

          <label className={isVideo ? styles.active : ""}>
            <input
              type="radio"
              name="contentType"
              value="비디오"
              checked={isVideo}
              onChange={onContentTypeChange}
              disabled={isContentUploading}
            />
            <span className={styles.contentTypeSymbol}>
              <img
                src={videoTypeIcon}
                alt=""
                aria-hidden="true"
              />
            </span>
            <strong>비디오</strong>
          </label>

          <label className={isAudio ? styles.active : ""}>
            <input
              type="radio"
              name="contentType"
              value="오디오"
              checked={isAudio}
              onChange={onContentTypeChange}
              disabled={isContentUploading}
            />
            <span className={styles.contentTypeSymbol}>
              <img
                src={audioTypeIcon}
                alt=""
                aria-hidden="true"
              />
            </span>
            <strong>오디오</strong>
          </label>
        </div>

        <div className={styles.loginForm + " " + styles.placeForm + " " + styles.contentAddForm}>
          {currentStep === 1 && (
            <>
              {/* 제목 */}
              <div className={styles.contentAddField}>
                <label htmlFor="contentTitle">제목</label>

                <input
                  id="contentTitle"
                  type="text"
                  name="title"
                  value={contentForm.title}
                  placeholder="제목을 입력해주세요"
                  onChange={handleChangeInput}
                  disabled={isContentUploading}
                />
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              {/* 파일 미리보기 */}
              {contentPreview && isPicture && (
                <div className={styles.contentUploadPreview}>
                  <img src={contentPreview} alt="콘텐츠 이미지 미리보기" />
                </div>
              )}

              {contentPreview && isVideo && (
                <div className={styles.contentUploadPreview}>
                  <video src={contentPreview} controls />
                </div>
              )}

              {isVideo && (
                <div className={styles.contentUploadGuide}>
                  <strong>비디오 업로드 안내</strong>
                  <p>
                    비디오 탭에서는 30MB 이하의 영상 파일을 원본 비디오로
                    저장합니다.
                  </p>
                </div>
              )}

              {isAudio && (
                <div className={styles.contentUploadGuide}>
                  <strong>오디오 업로드 안내</strong>
                  <p>
                    여러 파일을 한 번에 선택할 수 있습니다. 오디오 파일은
                    파일별 20MB 이하이며, 영상 파일은 m4a 오디오로 변환되어
                    저장됩니다.
                  </p>
                </div>
              )}

              {/* 파일 선택 */}
              <div className={styles.contentFileSelectBox}>
                <label htmlFor="contentFile" className={styles.customFileButton}>
                  {isAudio ? '오디오 파일 추가' : '파일 선택'}
                </label>

                <span className={styles.customFileName}>{contentFileName}</span>

                <input
                  id="contentFile"
                  className={styles.customFileInput}
                  type="file"
                  accept={getFileAcceptValue()}
                  multiple={isAudio}
                  onChange={handleChangeFile}
                  disabled={isContentUploading}
                />
              </div>

              {/* 선택한 오디오 파일 및 제목 */}
              {isAudio && contentAudioFiles.length > 0 && (
                <div className={styles.contentAudioEditor}>
                  <div className={styles.contentAudioEditorHeader}>
                    <strong>
                      선택한 오디오 {contentAudioFiles.length}개
                    </strong>
                    <span>
                      총{' '}
                      {(
                        contentAudioFiles.reduce(
                          (totalSize, audioFile) =>
                            totalSize + audioFile.file.size,
                          0
                        ) /
                        (1024 * 1024)
                      ).toFixed(1)}
                      MB
                    </span>
                  </div>

                  <div className={styles.contentAudioEditorList}>
                    {contentAudioFiles.map((audioFile, index) => (
                      <div
                        key={audioFile.id}
                        className={styles.contentAudioEditorItem}
                      >
                        <span className={styles.contentAudioEditorNumber}>
                          {index + 1}
                        </span>

                        <div className={styles.contentAudioEditorFields}>
                          <label htmlFor={`contentAudioTitle-${audioFile.id}`}>
                            오디오 제목
                          </label>
                          <input
                            id={`contentAudioTitle-${audioFile.id}`}
                            type="text"
                            value={audioFile.title}
                            maxLength={100}
                            placeholder="오디오 제목을 입력해주세요"
                            onChange={(event) =>
                              handleAudioTitleChange(
                                audioFile.id,
                                event.target.value
                              )
                            }
                            disabled={isContentUploading}
                          />
                          <small>
                            {audioFile.originalFileName} ·{' '}
                            {(audioFile.file.size / (1024 * 1024)).toFixed(1)}
                            MB
                          </small>
                        </div>

                        <button
                          type="button"
                          className={styles.contentAudioRemoveButton}
                          onClick={() =>
                            handleAudioFileRemove(audioFile.id)
                          }
                          disabled={isContentUploading}
                          aria-label={`${audioFile.title || audioFile.originalFileName} 제거`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {currentStep === 3 && (
            <div className={styles.placeSubmitSummary + " " + styles.contentSubmitSummary}>
              <div className={styles.contentSubmitSummaryTitle}>
                <span>{contentType}</span>
                <strong>{contentForm.title}</strong>
              </div>

              {!isAudio && <span>파일명: {contentFileName}</span>}

              {isVideo && <span>저장 방식: 비디오 파일 그대로 저장</span>}

              {isAudio && (
                <>
                  <span>오디오 {contentAudioFiles.length}개</span>

                  <div className={styles.contentAudioSummaryList}>
                    {contentAudioFiles.map((audioFile, index) => (
                      <div key={audioFile.id}>
                        <strong>
                          {index + 1}. {audioFile.title}
                        </strong>
                        <span>{audioFile.originalFileName}</span>
                      </div>
                    ))}
                  </div>

                  <span>
                    저장 방식: 오디오 파일은 그대로 저장 / 영상 파일은 m4a
                    오디오로 변환 저장
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {(stepErrorMessage || errorMessage || convertMessage) && (
          <p className={styles.loginError + " " + styles.contentAddError}>
            {convertMessage || stepErrorMessage || errorMessage}
          </p>
        )}

        <div className={styles.placeModalButtonRow + " " + styles.contentAddButtonRow}>
          {currentStep > 1 && (
            <button
              type="button"
              className={styles.placePrevButton}
              onClick={handlePrevStep}
              disabled={isContentUploading}
            >
              이전
            </button>
          )}

          {currentStep < 3 && (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleNextStep}
              disabled={!isCurrentStepValid() || isContentUploading}
            >
              다음
            </button>
          )}

          {currentStep === 3 && (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={onSubmit}
              disabled={isContentUploading}
            >
              {isContentUploading ? '처리 중...' : '등록하기'}
            </button>
          )}
        </div>
      </div>
    </ModalPortal>
  )
}

export default ContentAddModal
