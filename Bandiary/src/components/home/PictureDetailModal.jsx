import { useEffect, useRef, useState } from 'react'

import ModalPortal from '../common/ModalPortal'
import PlaceResultModal from '../place/PlaceResultModal'
import useToast from '../common/useToast'

import { formatDate } from '../../features/common'
import supabase from '../../api/supabase'

import commentSendIcon from '../../assets/images/comment-send.svg'
import styles from './PictureDetailModal.module.css'

const fetchPictureFeedbacks = (pictureId) =>
  supabase
    .from('content_picture_comment')
    .select(
      'id, content_picture_id, name, description, x, y, created_at'
    )
    .eq('content_picture_id', pictureId)
    .order('created_at', { ascending: true })

const getCoordinate = (value) => {
  const coordinate = Number(value)

  if (!Number.isFinite(coordinate)) return 0

  return Math.min(Math.max(coordinate, 0), 100)
}

const getPinColorClass = (index) => {
  const colorClasses = [
    styles.pinPurple,
    styles.pinGreen,
    styles.pinOrange,
  ]

  return colorClasses[index % colorClasses.length]
}

function PictureDetailModal({ content, onClose }) {
  const { showToast } = useToast()
  const feedbackItemRefs = useRef(new Map())
  const pictureFiles = Array.isArray(content.pictureFiles)
    ? [...content.pictureFiles].sort(
        (firstPicture, secondPicture) =>
          firstPicture.sort_order - secondPicture.sort_order
      )
    : []
  const activePicture = pictureFiles[0] || null

  const [pictureFeedbacks, setPictureFeedbacks] = useState([])
  const [draftPoint, setDraftPoint] = useState(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackErrorMessage, setFeedbackErrorMessage] = useState('')
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(
    Boolean(activePicture?.id)
  )
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false)
  const [selectedFeedbackId, setSelectedFeedbackId] = useState(null)
  const [deletingFeedbackId, setDeletingFeedbackId] = useState(null)
  const [deleteFeedbackTarget, setDeleteFeedbackTarget] = useState(null)

  const storageInfo = JSON.parse(
    sessionStorage.getItem('bandiaryLoginUser')
  )
  const isAdmin = storageInfo?.userId === 'admin'

  const getPictureFeedbacks = async (pictureId = activePicture?.id) => {
    if (!pictureId) return

    setIsFeedbackLoading(true)

    const { data, error } = await fetchPictureFeedbacks(pictureId)

    if (error) {
      console.error(error)
      setFeedbackErrorMessage('사진 피드백을 불러오지 못했습니다.')
      setIsFeedbackLoading(false)
      return
    }

    setPictureFeedbacks(data || [])
    setIsFeedbackLoading(false)
  }

  useEffect(() => {
    const pictureId = activePicture?.id

    if (!pictureId) return undefined

    let isCancelled = false

    void fetchPictureFeedbacks(pictureId).then(({ data, error }) => {
      if (isCancelled) return

      if (error) {
        console.error(error)
        setFeedbackErrorMessage('사진 피드백을 불러오지 못했습니다.')
        setIsFeedbackLoading(false)
        return
      }

      setPictureFeedbacks(data || [])
      setIsFeedbackLoading(false)
    })

    return () => {
      isCancelled = true
    }
  }, [activePicture?.id])

  const handlePicturePointSelect = (event) => {
    if (!activePicture?.id || isFeedbackSubmitting) return
    if (event.target.closest('button')) return

    const imageBounds = event.currentTarget.getBoundingClientRect()

    if (!imageBounds.width || !imageBounds.height) return

    const nextX = getCoordinate(
      ((event.clientX - imageBounds.left) / imageBounds.width) * 100
    )
    const nextY = getCoordinate(
      ((event.clientY - imageBounds.top) / imageBounds.height) * 100
    )

    setDraftPoint({
      x: Number(nextX.toFixed(4)),
      y: Number(nextY.toFixed(4)),
    })
    setSelectedFeedbackId(null)
    setFeedbackErrorMessage('')
  }

  const handleFeedbackInputChange = (event) => {
    setFeedbackText(event.target.value)
    setFeedbackErrorMessage('')
  }

  const handleSelectFeedback = (event, feedbackId) => {
    event.stopPropagation()
    setSelectedFeedbackId(feedbackId)

    feedbackItemRefs.current.get(feedbackId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
  }

  const handleAddFeedback = async (event) => {
    event.preventDefault()

    if (!storageInfo?.userId) {
      setFeedbackErrorMessage('로그인 사용자 정보를 찾을 수 없습니다.')
      return
    }

    if (!activePicture?.id) {
      setFeedbackErrorMessage(
        '사진 데이터를 찾을 수 없습니다. Supabase 사진 테이블을 확인해주세요.'
      )
      return
    }

    if (!draftPoint) {
      setFeedbackErrorMessage('사진에서 피드백을 남길 위치를 선택해주세요.')
      return
    }

    if (!feedbackText.trim()) {
      setFeedbackErrorMessage('피드백 내용을 입력해주세요.')
      return
    }

    setIsFeedbackSubmitting(true)

    const { error } = await supabase
      .from('content_picture_comment')
      .insert([
        {
          content_picture_id: activePicture.id,
          name: storageInfo.userId,
          description: feedbackText.trim(),
          x: draftPoint.x,
          y: draftPoint.y,
        },
      ])

    if (error) {
      console.error(error)
      setFeedbackErrorMessage('사진 피드백 등록에 실패했습니다.')
      setIsFeedbackSubmitting(false)
      return
    }

    setDraftPoint(null)
    setFeedbackText('')
    setFeedbackErrorMessage('')
    setIsFeedbackSubmitting(false)

    await getPictureFeedbacks(activePicture.id)
    showToast('사진 피드백이 등록되었습니다.')
  }

  const handleOpenFeedbackDeleteModal = (feedback) => {
    if (!isAdmin) return

    setDeleteFeedbackTarget(feedback)
    setFeedbackErrorMessage('')
  }

  const handleCloseFeedbackDeleteModal = () => {
    if (deletingFeedbackId !== null) return

    setDeleteFeedbackTarget(null)
  }

  const handleDeleteFeedback = async () => {
    if (!isAdmin || !deleteFeedbackTarget || !activePicture?.id) return

    setDeletingFeedbackId(deleteFeedbackTarget.id)
    setFeedbackErrorMessage('')

    const { error } = await supabase
      .from('content_picture_comment')
      .delete()
      .eq('id', deleteFeedbackTarget.id)
      .eq('content_picture_id', activePicture.id)

    if (error) {
      console.error(error)
      setFeedbackErrorMessage('사진 피드백 삭제에 실패했습니다.')
      setDeletingFeedbackId(null)
      setDeleteFeedbackTarget(null)
      return
    }

    setDeletingFeedbackId(null)
    setDeleteFeedbackTarget(null)
    setSelectedFeedbackId(null)

    await getPictureFeedbacks(activePicture.id)
    showToast('사진 피드백이 삭제되었습니다.')
  }

  return (
    <>
      <ModalPortal onEscapeKey={onClose}>
        <div
          className={`${styles.placeModalCard} ${styles.pictureDetailCard}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="picture-detail-title"
        >
          <div className={styles.pictureDetailHeader}>
            <div className={styles.pictureDetailHeading}>
              <h2 id="picture-detail-title">{content.title}</h2>
              <time>{formatDate(content.created_at)}</time>
            </div>

            <button
              type="button"
              className={styles.placeModalClose}
              onClick={onClose}
              aria-label="사진 상세 모달 닫기"
            >
              ×
            </button>
          </div>

          <div className={styles.pictureDetailMedia}>
            {activePicture?.file_url ? (
              <>
                <div
                  className={styles.pictureImageLayer}
                  onClick={handlePicturePointSelect}
                  aria-label="사진 피드백 위치 선택 영역"
                >
                  <img
                    src={activePicture.file_url}
                    alt={content.title}
                    draggable="false"
                  />

                  {pictureFeedbacks.map((feedback, index) => {
                    const pinNumber = index + 1
                    const pinColorClass = getPinColorClass(index)

                    return (
                      <button
                        key={feedback.id}
                        type="button"
                        className={`${styles.picturePin} ${pinColorClass} ${
                          selectedFeedbackId === feedback.id
                            ? styles.picturePinActive
                            : ''
                        }`}
                        style={{
                          left: `${getCoordinate(feedback.x)}%`,
                          top: `${getCoordinate(feedback.y)}%`,
                        }}
                        onClick={(event) =>
                          handleSelectFeedback(event, feedback.id)
                        }
                        aria-label={`${pinNumber}번 사진 피드백 보기`}
                      >
                        <span>{pinNumber}</span>
                      </button>
                    )
                  })}

                  {draftPoint && (
                    <span
                      className={`${styles.picturePin} ${styles.pictureDraftPin} ${styles.pinPurple}`}
                      style={{
                        left: `${draftPoint.x}%`,
                        top: `${draftPoint.y}%`,
                      }}
                      aria-hidden="true"
                    >
                      <span>+</span>
                    </span>
                  )}
                </div>

                <p className={styles.picturePointGuide}>
                  {draftPoint
                    ? '선택한 위치에 남길 피드백을 입력해주세요.'
                    : '사진을 눌러 피드백 위치를 선택해주세요.'}
                </p>
              </>
            ) : (
              <div className={styles.pictureDetailEmpty}>
                등록된 이미지가 없습니다.
              </div>
            )}
          </div>

          <section
            className={styles.pictureFeedbackSection}
            aria-labelledby="picture-feedback-title"
          >
            <div className={styles.pictureFeedbackHeader}>
              <h3 id="picture-feedback-title">사진 피드백</h3>
              <span>{pictureFeedbacks.length}개</span>
            </div>

            <div className={styles.pictureFeedbackList}>
              {isFeedbackLoading ? (
                <div className={styles.pictureFeedbackEmpty}>
                  사진 피드백을 불러오는 중입니다.
                </div>
              ) : pictureFeedbacks.length > 0 ? (
                pictureFeedbacks.map((feedback, index) => {
                  const pinNumber = index + 1
                  const pinColorClass = getPinColorClass(index)

                  return (
                    <div
                      key={feedback.id}
                      ref={(feedbackItem) => {
                        if (feedbackItem) {
                          feedbackItemRefs.current.set(
                            feedback.id,
                            feedbackItem
                          )
                        } else {
                          feedbackItemRefs.current.delete(feedback.id)
                        }
                      }}
                      className={`${styles.pictureFeedbackItem} ${
                        selectedFeedbackId === feedback.id
                          ? styles.pictureFeedbackItemActive
                          : ''
                      }`}
                    >
                      <button
                        type="button"
                        className={`${styles.pictureFeedbackNumber} ${pinColorClass}`}
                        onClick={(event) =>
                          handleSelectFeedback(event, feedback.id)
                        }
                        aria-label={`${pinNumber}번 위치 강조`}
                      >
                        {pinNumber}
                      </button>

                      <div className={styles.pictureFeedbackBody}>
                        <div className={styles.pictureFeedbackMeta}>
                          <strong>{feedback.name}</strong>
                          <time>{formatDate(feedback.created_at)}</time>
                        </div>
                        <p>{feedback.description}</p>
                      </div>

                      {isAdmin && (
                        <button
                          type="button"
                          className={styles.pictureFeedbackDeleteButton}
                          onClick={() =>
                            handleOpenFeedbackDeleteModal(feedback)
                          }
                          disabled={deletingFeedbackId === feedback.id}
                          aria-label="사진 피드백 삭제"
                        >
                          {deletingFeedbackId === feedback.id ? '...' : '−'}
                        </button>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className={styles.pictureFeedbackEmpty}>
                  아직 등록된 사진 피드백이 없습니다.
                </div>
              )}
            </div>

            <form
              className={styles.pictureFeedbackForm}
              onSubmit={handleAddFeedback}
            >
              <div className={styles.pictureFeedbackInputRow}>
                <textarea
                  value={feedbackText}
                  placeholder="선택한 위치에 피드백 남기기"
                  maxLength={1000}
                  onChange={handleFeedbackInputChange}
                  aria-label="사진 피드백 내용"
                />

                <button
                  type="submit"
                  className={styles.pictureFeedbackSendButton}
                  disabled={isFeedbackSubmitting || !activePicture?.id}
                  aria-label="사진 피드백 등록"
                >
                  {isFeedbackSubmitting ? (
                    <span className={styles.pictureFeedbackSendLoading}>
                      ...
                    </span>
                  ) : (
                    <img
                      src={commentSendIcon}
                      alt=""
                      aria-hidden="true"
                    />
                  )}
                </button>
              </div>

              {feedbackErrorMessage && (
                <p className={styles.pictureFeedbackError}>
                  {feedbackErrorMessage}
                </p>
              )}
            </form>
          </section>
        </div>
      </ModalPortal>

      {deleteFeedbackTarget && (
        <PlaceResultModal
          type="confirm"
          title="삭제 확인"
          message="선택한 사진 피드백을 삭제하시겠습니까?"
          confirmText="삭제"
          cancelText="취소"
          onClose={handleCloseFeedbackDeleteModal}
          onConfirm={handleDeleteFeedback}
        />
      )}
    </>
  )
}

export default PictureDetailModal
