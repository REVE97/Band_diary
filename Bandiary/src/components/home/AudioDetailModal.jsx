import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import ModalPortal from '../common/ModalPortal'
import useToast from '../common/useToast'
import PlaceResultModal from '../place/PlaceResultModal'

import { formatDate } from '../../features/common'
import supabase from '../../api/supabase'

import commentSendIcon from '../../assets/images/comment-send.svg'
import styles from './AudioDetailModal.module.css'

const fetchAudioFeedbacks = (audioId) =>
  supabase
    .from('content_audio_comment')
    .select(
      'id, content_audio_id, feedback_time, description, created_at'
    )
    .eq('content_audio_id', audioId)
    .order('feedback_time', { ascending: true })

const formatAudioTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00'

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds
  ).padStart(2, '0')}`
}

const parseAudioTime = (timeText) => {
  const normalizedTime = timeText.trim()

  if (!/^\d{1,4}:[0-5]\d$/.test(normalizedTime)) return null

  const [minutes, seconds] = normalizedTime.split(':').map(Number)

  return minutes * 60 + seconds
}

function AudioDetailModal({ content, onClose }) {
  const { showToast } = useToast()
  const audioPlayerRef = useRef(null)
  const shouldAutoPlayAudioRef = useRef(false)
  const audioFiles = Array.isArray(content.audioFiles)
    ? [...content.audioFiles].sort(
        (firstAudio, secondAudio) =>
          firstAudio.sort_order - secondAudio.sort_order
      )
    : []

  const [activeAudioIndex, setActiveAudioIndex] = useState(0)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [audioFeedbacks, setAudioFeedbacks] = useState([])
  const [feedbackTime, setFeedbackTime] = useState('')
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackErrorMessage, setFeedbackErrorMessage] = useState('')
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(true)
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false)
  const [deletingFeedbackId, setDeletingFeedbackId] = useState(null)
  const [deleteFeedbackTarget, setDeleteFeedbackTarget] = useState(null)

  const activeAudio = audioFiles[activeAudioIndex] || audioFiles[0]
  const audioProgress = audioDuration
    ? Math.min((audioCurrentTime / audioDuration) * 100, 100)
    : 0

  const storageInfo = JSON.parse(sessionStorage.getItem('bandiaryLoginUser'))

  const isAdmin = storageInfo?.userId === 'admin'

  // 선택한 오디오의 구간 피드백 불러오기
  const getAudioFeedbacks = async (audioId = activeAudio?.id) => {
    if (!audioId) return

    setIsFeedbackLoading(true)

    const { data, error } = await fetchAudioFeedbacks(audioId)

    if (error) {
      console.error(error)
      setFeedbackErrorMessage('구간 피드백을 불러오지 못했습니다.')
      setIsFeedbackLoading(false)
      return
    }

    setAudioFeedbacks(data || [])
    setIsFeedbackLoading(false)
  }

  useEffect(() => {
    const audioId = activeAudio?.id

    if (!audioId) return undefined

    let isCancelled = false

    void fetchAudioFeedbacks(audioId).then(({ data, error }) => {
      if (isCancelled) return

      if (error) {
        console.error(error)
        setFeedbackErrorMessage('구간 피드백을 불러오지 못했습니다.')
        setIsFeedbackLoading(false)
        return
      }

      setAudioFeedbacks(data || [])
      setIsFeedbackLoading(false)
    })

    return () => {
      isCancelled = true
    }
  }, [activeAudio?.id])

  useLayoutEffect(() => {
    if (!shouldAutoPlayAudioRef.current) return

    shouldAutoPlayAudioRef.current = false

    void audioPlayerRef.current?.play().catch((error) => {
      console.error('오디오 재생 실패:', error)
      setIsAudioPlaying(false)
    })
  }, [activeAudioIndex])

  const handleFeedbackTimeChange = (event) => {
    const timeDigits = event.target.value.replace(/\D/g, '').slice(0, 4)
    const formattedTime =
      timeDigits.length > 2
        ? `${timeDigits.slice(0, 2)}:${timeDigits.slice(2)}`
        : timeDigits

    setFeedbackTime(formattedTime)
    setFeedbackErrorMessage('')
  }

  const handleFeedbackTextChange = (event) => {
    setFeedbackText(event.target.value)
    setFeedbackErrorMessage('')
  }

  // 선택한 오디오를 단일 플레이어에 연결합니다.
  const changeActiveAudio = (nextAudioIndex, shouldPlay = true) => {
    const nextAudio = audioFiles[nextAudioIndex]

    if (!nextAudio) return

    shouldAutoPlayAudioRef.current = shouldPlay
    setActiveAudioIndex(nextAudioIndex)
    setAudioCurrentTime(0)
    setAudioDuration(0)
    setIsAudioPlaying(false)
    setAudioFeedbacks([])
    setFeedbackTime('')
    setFeedbackText('')
    setFeedbackErrorMessage('')
    setIsFeedbackLoading(true)
  }

  const handleAudioPlayPause = () => {
    const audioPlayer = audioPlayerRef.current

    if (!audioPlayer) return

    if (audioPlayer.paused) {
      void audioPlayer.play().catch((error) => {
        console.error('오디오 재생 실패:', error)
        setIsAudioPlaying(false)
      })
      return
    }

    audioPlayer.pause()
  }

  const handleSelectAudio = (audioIndex) => {
    if (audioIndex === activeAudioIndex) return

    changeActiveAudio(audioIndex, false)
  }

  const handlePreviousAudio = () => {
    const audioPlayer = audioPlayerRef.current

    if (!audioPlayer) return

    if (audioPlayer.currentTime > 3 || activeAudioIndex === 0) {
      audioPlayer.currentTime = 0
      setAudioCurrentTime(0)
      return
    }

    changeActiveAudio(activeAudioIndex - 1, !audioPlayer.paused)
  }

  const handleNextAudio = () => {
    const audioPlayer = audioPlayerRef.current

    if (!audioPlayer || activeAudioIndex >= audioFiles.length - 1) return

    changeActiveAudio(activeAudioIndex + 1, !audioPlayer.paused)
  }

  const handleAudioSeek = (event) => {
    const audioPlayer = audioPlayerRef.current
    const nextTime = Number(event.target.value)

    if (!audioPlayer || !Number.isFinite(nextTime)) return

    audioPlayer.currentTime = nextTime
    setAudioCurrentTime(nextTime)
  }

  const handleAudioMetadataLoaded = () => {
    const duration = audioPlayerRef.current?.duration

    setAudioDuration(Number.isFinite(duration) ? duration : 0)
  }

  const handleAudioTimeUpdate = () => {
    const currentTime = audioPlayerRef.current?.currentTime

    setAudioCurrentTime(Number.isFinite(currentTime) ? currentTime : 0)
  }

  const handleAudioEnded = () => {
    setIsAudioPlaying(false)
  }

  // 피드백 시간부터 오디오 재생
  const handlePlayFeedback = (feedbackTimeInSeconds) => {
    const audioPlayer = audioPlayerRef.current
    const nextTime = Number(feedbackTimeInSeconds)

    if (!audioPlayer || !Number.isFinite(nextTime)) return

    const safeTime = audioDuration ? Math.min(nextTime, audioDuration) : nextTime

    audioPlayer.currentTime = safeTime
    setAudioCurrentTime(safeTime)

    void audioPlayer.play().catch((error) => {
      console.error('피드백 구간 재생 실패:', error)
      setIsAudioPlaying(false)
    })
  }

  // 구간 피드백 추가 기능
  const handleAddFeedback = async (event) => {
    event.preventDefault()

    if (!storageInfo?.userId) {
      setFeedbackErrorMessage('로그인 사용자 정보를 찾을 수 없습니다.')
      return
    }

    if (!activeAudio?.id) {
      setFeedbackErrorMessage('피드백을 등록할 오디오를 찾을 수 없습니다.')
      return
    }

    const feedbackTimeInSeconds = parseAudioTime(feedbackTime)

    if (feedbackTimeInSeconds === null) {
      setFeedbackErrorMessage('피드백 시간을 MM:SS 형식으로 입력해주세요.')
      return
    }

    if (audioDuration && feedbackTimeInSeconds > audioDuration) {
      setFeedbackErrorMessage('오디오 재생 시간 안의 구간을 입력해주세요.')
      return
    }

    if (!feedbackText.trim()) {
      setFeedbackErrorMessage('피드백 내용을 입력해주세요.')
      return
    }

    setIsFeedbackSubmitting(true)

    const { error } = await supabase.from('content_audio_comment').insert([
      {
        content_audio_id: activeAudio.id,
        feedback_time: feedbackTimeInSeconds,
        description: feedbackText.trim(),
      },
    ])

    if (error) {
      console.error(error)
      setFeedbackErrorMessage('구간 피드백 등록에 실패했습니다.')
      setIsFeedbackSubmitting(false)
      return
    }

    setFeedbackTime('')
    setFeedbackText('')
    setFeedbackErrorMessage('')
    setIsFeedbackSubmitting(false)

    await getAudioFeedbacks(activeAudio.id)
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

  // 구간 피드백 삭제 기능 (관리자용)
  const handleDeleteFeedback = async () => {
    if (!isAdmin || !deleteFeedbackTarget) return

    setDeletingFeedbackId(deleteFeedbackTarget.id)
    setFeedbackErrorMessage('')

    const { error } = await supabase
      .from('content_audio_comment')
      .delete()
      .eq('id', deleteFeedbackTarget.id)
      .eq('content_audio_id', activeAudio.id)

    if (error) {
      console.error(error)
      setFeedbackErrorMessage('구간 피드백 삭제에 실패했습니다.')
      setDeletingFeedbackId(null)
      setDeleteFeedbackTarget(null)
      return
    }

    setDeletingFeedbackId(null)
    setDeleteFeedbackTarget(null)

    await getAudioFeedbacks(activeAudio.id)

    showToast('구간 피드백이 삭제되었습니다.')
  }

  return (
    <>
      <ModalPortal onEscapeKey={onClose}>
        <div
          className={`${styles.placeModalCard} ${styles.audioDetailCard}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="audio-detail-title"
        >
        {/* 오디오 상세 헤더 */}
        <div className={styles.audioDetailHeader}>
          <div className={styles.audioDetailHeading}>
            <h2 id="audio-detail-title">{content.title}</h2>
            <time>{formatDate(content.created_at)}</time>
          </div>

          <button
            type="button"
            className={styles.placeModalClose}
            onClick={onClose}
            aria-label="오디오 상세 모달 닫기"
          >
            ×
          </button>
        </div>

        {/* 오디오 플레이어 */}
        <div className={styles.audioDetailMedia}>
          {audioFiles.length > 0 ? (
            <div className={styles.audioDetailContent}>
              <audio
                ref={audioPlayerRef}
                className={styles.audioDetailElement}
                preload="metadata"
                src={activeAudio.file_url}
                onLoadedMetadata={handleAudioMetadataLoaded}
                onTimeUpdate={handleAudioTimeUpdate}
                onPlay={() => setIsAudioPlaying(true)}
                onPause={() => setIsAudioPlaying(false)}
                onEnded={handleAudioEnded}
              >
                브라우저가 오디오 재생을 지원하지 않습니다.
              </audio>

              <section
                className={styles.audioNowPlaying}
                aria-label="현재 재생 오디오"
              >
                <div className={styles.audioNowPlayingSummary}>
                  <span
                    className={styles.audioNowPlayingArtwork}
                    aria-hidden="true"
                  >
                    ♪
                  </span>

                  <div className={styles.audioNowPlayingTitle}>
                    <strong>{activeAudio.title}</strong>
                  </div>
                </div>

                <div className={styles.audioTransportControls}>
                  <button
                    type="button"
                    className={styles.audioTransportButton}
                    onClick={handlePreviousAudio}
                    aria-label="이전 오디오 또는 처음으로 이동"
                  >
                    ◀
                  </button>

                  <button
                    type="button"
                    className={styles.audioPlayButton}
                    onClick={handleAudioPlayPause}
                    aria-label={
                      isAudioPlaying ? '오디오 일시정지' : '오디오 재생'
                    }
                  >
                    {isAudioPlaying ? 'Ⅱ' : '▶'}
                  </button>

                  <button
                    type="button"
                    className={styles.audioTransportButton}
                    onClick={handleNextAudio}
                    disabled={activeAudioIndex >= audioFiles.length - 1}
                    aria-label="다음 오디오"
                  >
                    ▶
                  </button>
                </div>

                <div className={styles.audioProgress}>
                  <input
                    type="range"
                    min="0"
                    max={audioDuration || 1}
                    step="0.1"
                    value={audioCurrentTime}
                    onChange={handleAudioSeek}
                    aria-label={`${activeAudio.title} 재생 위치`}
                    aria-valuetext={`${formatAudioTime(
                      audioCurrentTime
                    )} / ${formatAudioTime(audioDuration)}`}
                    style={{ '--audio-progress': `${audioProgress}%` }}
                  />

                  <div className={styles.audioProgressTime}>
                    <time>{formatAudioTime(audioCurrentTime)}</time>
                    <time>{formatAudioTime(audioDuration)}</time>
                  </div>
                </div>
              </section>

              {/* 선택한 오디오의 구간 피드백 */}
              <section
                className={styles.audioFeedbackSection}
                aria-labelledby="audio-feedback-title"
              >
                <div className={styles.audioFeedbackHeader}>
                  <h3 id="audio-feedback-title">구간 피드백</h3>
                  <span>{audioFeedbacks.length}개</span>
                </div>

                <div className={styles.audioFeedbackList}>
                  {isFeedbackLoading ? (
                    <div className={styles.audioFeedbackEmpty}>
                      구간 피드백을 불러오는 중입니다.
                    </div>
                  ) : audioFeedbacks.length > 0 ? (
                    audioFeedbacks.map((feedback) => (
                      <div
                        key={feedback.id}
                        className={styles.audioFeedbackItem}
                      >
                        <button
                          type="button"
                          className={styles.audioFeedbackTime}
                          onClick={() =>
                            handlePlayFeedback(feedback.feedback_time)
                          }
                          aria-label={`${formatAudioTime(
                            Number(feedback.feedback_time)
                          )}부터 재생`}
                        >
                          {formatAudioTime(Number(feedback.feedback_time))}
                        </button>

                        <p>{feedback.description}</p>

                        {isAdmin && (
                          <button
                            type="button"
                            className={styles.audioFeedbackDeleteButton}
                            onClick={() =>
                              handleOpenFeedbackDeleteModal(feedback)
                            }
                            disabled={deletingFeedbackId === feedback.id}
                            aria-label="구간 피드백 삭제"
                          >
                            {deletingFeedbackId === feedback.id ? '...' : '−'}
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className={styles.audioFeedbackEmpty}>
                      아직 등록된 구간 피드백이 없습니다.
                    </div>
                  )}
                </div>

                <form
                  className={styles.audioFeedbackForm}
                  onSubmit={handleAddFeedback}
                >
                  <div className={styles.audioFeedbackInputRow}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={feedbackTime}
                      placeholder="MM:SS"
                      maxLength={5}
                      onChange={handleFeedbackTimeChange}
                      aria-label="피드백 시간"
                    />

                    <textarea
                      value={feedbackText}
                      placeholder="이 구간에 피드백 남기기"
                      onChange={handleFeedbackTextChange}
                      aria-label="피드백 내용"
                    />

                    <button
                      type="submit"
                      className={styles.audioFeedbackSendButton}
                      disabled={isFeedbackSubmitting}
                      aria-label="구간 피드백 등록"
                    >
                      {isFeedbackSubmitting ? (
                        <span className={styles.audioFeedbackSendLoading}>
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

                  <p className={styles.audioFeedbackInputGuide}>
                    숫자 4자리 입력 · 예: 0130 → 01:30
                  </p>

                  {feedbackErrorMessage && (
                    <p className={styles.audioFeedbackError}>
                      {feedbackErrorMessage}
                    </p>
                  )}
                </form>
              </section>

              <div className={styles.audioListHeader}>
                <strong>오디오 목록</strong>
                <span>{audioFiles.length}개</span>
              </div>

              <div className={styles.audioList}>
                {audioFiles.map((audioFile, index) => (
                  <button
                    key={audioFile.id}
                    type="button"
                    className={`${styles.audioListItem} ${
                      index === activeAudioIndex ? styles.active : ''
                    }`}
                    onClick={() => handleSelectAudio(index)}
                    aria-label={`${audioFile.title} 선택`}
                  >
                    <span className={styles.audioQueueControl}>
                      {index === activeAudioIndex && isAudioPlaying
                        ? 'Ⅱ'
                        : '▶'}
                    </span>

                    <span className={styles.audioListTitle}>
                      <strong>{audioFile.title}</strong>
                    </span>

                    <span className={styles.audioQueueStatus}>
                      {index === activeAudioIndex ? (
                        <span
                          className={`${styles.audioEqualizer} ${
                            isAudioPlaying ? styles.playing : ''
                          }`}
                          aria-hidden="true"
                        >
                          <i />
                          <i />
                          <i />
                        </span>
                      ) : (
                        index + 1
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.audioDetailEmpty}>
              등록된 오디오가 없습니다.
            </div>
          )}
        </div>
        </div>
      </ModalPortal>

      {deleteFeedbackTarget && (
        <PlaceResultModal
          type="confirm"
          title="삭제 확인"
          message="선택한 구간 피드백을 삭제하시겠습니까?"
          confirmText="삭제"
          cancelText="취소"
          onClose={handleCloseFeedbackDeleteModal}
          onConfirm={handleDeleteFeedback}
        />
      )}
    </>
  )
}

export default AudioDetailModal
