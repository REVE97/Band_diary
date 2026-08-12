import { useEffect, useRef, useState } from 'react'

import PlaceResultModal from '../place/PlaceResultModal'

import cameraIcon from '../../assets/images/notice-camera-black.svg'

import supabase from '../../api/supabase'

function NoticeAddModal({
  userName,
  onClose,
  onAdded
}) {
  const fileInputRef = useRef(null)

  // 공지 / 메모
  const [type, setType] = useState('공지')

  // 제목
  const [title, setTitle] = useState('')

  // 내용
  const [content, setContent] = useState('')

  // 중요 공지 여부
  const [important, setImportant] = useState(false)

  // 이미지 파일
  const [imageFile, setImageFile] = useState(null)

  // 이미지 미리보기 URL
  const [imagePreview, setImagePreview] = useState('')

  // 등록 진행 여부
  const [submitting, setSubmitting] = useState(false)

  // 결과 Modal
  const [resultModal, setResultModal] = useState(null)

  // 이미지 미리보기 URL 메모리 해제
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  // 사진 추가 버튼
  const handleImageButtonClick = () => {
    fileInputRef.current?.click()
  }

  // 이미지 파일 선택
  const handleImageChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    // 이미지 파일 형식인지 확인 
    if (!file.type.startsWith('image/')) {
      event.target.value = ''

      setResultModal({
        type: 'fail',
        title: '이미지 선택 실패',
        message: '이미지 파일만 첨부할 수 있습니다.'
      })

      return
    }

    // 기존 preview URL 제거
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }

    // 실제 파일 설정
    setImageFile(file)

    // 미리보기 URL 생성
    setImagePreview(
      URL.createObjectURL(file)
    )
  }

  // 선택한 이미지 제거
  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }

    setImageFile(null)
    setImagePreview('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 이미지 업로드
  const uploadImage = async () => {
    // 이미지 업로드 하지 않은 경우
    if (!imageFile) {
      return null
    }

    // 확장자 추출
    const fileExtension =
      imageFile.name
        .split('.')
        .pop()
        ?.toLowerCase() || 'jpg'

    // 파일명 중복 방지를 위한 UUID
    const uniqueFileName =
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`

    // 이미지 저장 경로
    const filePath =
      `notice/${Date.now()}-${uniqueFileName}.${fileExtension}`

    // 이미지 업로드
    const {
      error: uploadError
    } = await supabase.storage
      .from('notice-files')
      .upload(
        filePath,
        imageFile,
        {
          contentType: imageFile.type,
          cacheControl: '3600',
          upsert: false
        }
      )

    if (uploadError) {
      throw uploadError
    }

    // 업로드된 파일의 Public URL 생성
    const { data } = supabase.storage
      .from('notice-files')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  // 공지 및 메모 등록
  const handleSubmit = async (event) => {
    event.preventDefault()

    // 제목 및 내용 앞뒤 공백 제거
    const trimmedTitle =
      title.trim()

    const trimmedContent =
      content.trim()

    // 제목 검증
    if (!trimmedTitle) {
      setResultModal({
        type: 'fail',
        title: '등록할 수 없습니다',
        message: '제목을 입력해주세요.'
      })

      return
    }

    // 내용 검증
    if (!trimmedContent) {
      setResultModal({
        type: 'fail',
        title: '등록할 수 없습니다',
        message: '내용을 입력해주세요.'
      })

      return
    }

    // 사용자 이름
    const sessionName =
      userName?.trim()

    // 사용자 이름 확인
    if (!sessionName) {
      setResultModal({
        type: 'fail',
        title: '사용자 정보 확인 실패',
        message:
          '작성자 정보를 찾을 수 없습니다. 다시 로그인해주세요.'
      })

      return
    }

    try {
      setSubmitting(true)

      // 이미지 없는 경우
      let imageUrl = null

      // 이미지 존재 시 Storage 먼저 업로드
      if (imageFile) {
        imageUrl =
          await uploadImage()
      }

      // notice 테이블에 데이터 추가
      const {
        error
      } = await supabase
        .from('notice')
        .insert([
          {
            type,
            name: sessionName,
            title: trimmedTitle,
            content: trimmedContent,
            imageUrl,
            important
          }
        ])

      if (error) {
        throw error
      }

      // 등록 성공
      setResultModal({
        type: 'success',
        title: '등록 완료',
        message:
          important
            ? '중요 공지로 등록되었습니다.'
            : `${type}가 등록되었습니다.`
      })
    } catch (error) { // 등록 실패
      console.error(
        '공지 등록 실패:',
        error
      )

      setResultModal({
        type: 'fail',
        title: '등록 실패',
        message:
          '등록 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 결과 모달 닫기
  const handleResultClose = async () => {
    const isSuccess =
      resultModal?.type === 'success'

    setResultModal(null)

    // 등록 성공일 경우 1. NoticePage 목록 재조회 2. NoticeAddModal 닫기
    if (isSuccess) {
      await onAdded?.()

      onClose()
    }
  }

  return (
    <>
      <div
        className="place-modal-overlay"
        onMouseDown={(event) => {
          // Modal 바깥 영역 클릭 시 닫기 - 등록 중에는 닫지 않음
          if (
            event.target === event.currentTarget &&
            !submitting
          ) {
            onClose()
          }
        }}
      >
        <div className="place-modal-card notice-add-modal-card">

          {/* 등록 Modal 헤더 */}
          <header className="place-modal-header">
            <div>
              <p>
                밴드원과 공유할 공지 또는 메모를 작성해주세요.
              </p>
            </div>

            <button
              type="button"
              className="place-modal-close"
              aria-label="닫기"
              disabled={submitting}
              onClick={onClose}
            >
              ×
            </button>

          </header>

          {/* 상세 항목 */}
          <form
            className="notice-add-form"
            onSubmit={handleSubmit}
          >

            {/* 유형 */}
            <section className="notice-form-section">

              <label className="notice-form-label">
                유형
              </label>

              <div className="notice-type-selector">

                <button
                  type="button"
                  className={
                    type === '공지'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setType('공지')
                  }
                >
                  공지
                </button>

                <button
                  type="button"
                  className={
                    type === '메모'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setType('메모')
                  }
                >
                  메모
                </button>

              </div>

            </section>

            {/* 제목 */}
            <section className="notice-form-section">

              <label
                className="notice-form-label"
                htmlFor="notice-title"
              >
                제목
              </label>

              <input
                id="notice-title"
                className="notice-form-input"
                type="text"
                value={title}
                maxLength={100}
                placeholder="제목을 입력해주세요"
                onChange={(event) =>
                  setTitle(
                    event.target.value
                  )
                }
              />

              <span className="notice-input-count">
                {title.length} / 100
              </span>

            </section>

            {/* 내용 */}
            <section className="notice-form-section">

              <label
                className="notice-form-label"
                htmlFor="notice-content"
              >
                내용
              </label>

              <textarea
                id="notice-content"
                className="notice-form-textarea"
                value={content}
                placeholder="밴드원에게 전달할 내용을 입력해주세요"
                onChange={(event) =>
                  setContent(
                    event.target.value
                  )
                }
              />

            </section>

            {/* 이미지 */}
            <section className="notice-form-section">

              <span className="notice-form-label">
                이미지
              </span>

              <div className="notice-image-action-row">

                <button
                  type="button"
                  className="notice-camera-button"
                  onClick={
                    handleImageButtonClick
                  }
                >
                  <img
                    src={cameraIcon}
                    alt=""
                    aria-hidden="true"
                  />
                </button>

                {imageFile && (
                  <button
                    type="button"
                    className="notice-image-remove-button"
                    onClick={removeImage}
                  >
                    제거
                  </button>
                )}

              </div>

              {/* 실제 file input */}
              <input
                ref={fileInputRef}
                className="notice-hidden-file-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />

              {/* 이미지 미리보기 */}
              {imagePreview && (
                <div className="notice-image-preview">

                  <img
                    src={imagePreview}
                    alt="공지 첨부 이미지 미리보기"
                  />

                </div>
              )}

              <p className="notice-image-help">
                이미지 파일만 첨부할 수 있습니다.
              </p>

            </section>

            {/* 중요 공지 */}
            <section className="notice-important-setting">

              <div>
                <strong>
                  중요 공지
                </strong>

                <p>
                  중요 표시를 하면 목록 최상단에 별도로 표시됩니다.
                </p>
              </div>

              <button
                type="button"
                className={
                  important
                    ? 'notice-star-button active'
                    : 'notice-star-button'
                }
                aria-label={
                  important
                    ? '중요 표시 해제'
                    : '중요 표시'
                }
                aria-pressed={important}
                onClick={() =>
                  setImportant(
                    (prev) => !prev
                  )
                }
              >
                {important
                  ? '★'
                  : '☆'}
              </button>

            </section>

            {/* 등록 */}
            <button
              type="submit"
              className="primary-button notice-submit-button"
              disabled={submitting}
            >
              {submitting
                ? '등록 중...'
                : '등록'}
            </button>

          </form>

        </div>
      </div>

      {/* 결과 모달 */}
      {resultModal && (
        <PlaceResultModal
          type={resultModal.type}
          title={resultModal.title}
          message={resultModal.message}
          onClose={handleResultClose}
        />
      )}
    </>
  )
}

export default NoticeAddModal