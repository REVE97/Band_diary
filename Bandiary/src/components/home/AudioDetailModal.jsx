import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import ModalPortal from '../common/ModalPortal'

import { formatDate } from '../../features/common'
import supabase from '../../api/supabase'

import commentSendIcon from '../../assets/images/comment-send.svg'
import styles from './AudioDetailModal.module.css'

const fetchComments = (contentId) =>
  supabase
    .from('comment')
    .select('*')
    .eq('content_id', contentId)
    .order('created_at', { ascending: true })

const formatAudioTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00'

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds
  ).padStart(2, '0')}`
}

function AudioDetailModal({ content, onClose }) {
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
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [commentErrorMessage, setCommentErrorMessage] = useState('')
  const [isCommentLoading, setIsCommentLoading] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState(null)

  const activeAudio = audioFiles[activeAudioIndex] || audioFiles[0]
  const audioProgress = audioDuration
    ? Math.min((audioCurrentTime / audioDuration) * 100, 100)
    : 0

  const storageInfo = JSON.parse(sessionStorage.getItem('bandiaryLoginUser'))

  const isAdmin = storageInfo?.userId === 'admin'

  // 유저 데이터 불러오기
  const getComments = async () => {
    if (!content?.id) return

    const { data, error } = await fetchComments(content.id)

    if (error) {
      console.error(error)
      setCommentErrorMessage('댓글을 불러오지 못했습니다.')
      return
    }

    setComments(data || [])
  }

  useEffect(() => {
    if (!content?.id) return undefined

    let isCancelled = false

    void fetchComments(content.id).then(({ data, error }) => {
      if (isCancelled) return

      if (error) {
        console.error(error)
        setCommentErrorMessage('댓글을 불러오지 못했습니다.')
        return
      }

      setComments(data || [])
    })

    return () => {
      isCancelled = true
    }
  }, [content?.id])

  useLayoutEffect(() => {
    if (!shouldAutoPlayAudioRef.current) return

    shouldAutoPlayAudioRef.current = false

    void audioPlayerRef.current?.play().catch((error) => {
      console.error('오디오 재생 실패:', error)
      setIsAudioPlaying(false)
    })
  }, [activeAudioIndex])

  const handleCommentInputChange = (event) => {
    setCommentText(event.target.value)
    setCommentErrorMessage('')
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

  // 댓글 추가 기능
  const handleAddComment = async () => {
    if (!storageInfo?.userId) {
      setCommentErrorMessage('로그인 사용자 정보를 찾을 수 없습니다.')
      return
    }

    if (!commentText.trim()) {
      setCommentErrorMessage('댓글 내용을 입력해주세요.')
      return
    }

    setIsCommentLoading(true)

    const { error } = await supabase.from('comment').insert([
      {
        content_id: content.id,
        name: storageInfo.userId,
        description: commentText.trim(),
      },
    ])

    if (error) {
      console.error(error)
      setCommentErrorMessage('댓글 등록에 실패했습니다.')
      setIsCommentLoading(false)
      return
    }

    setCommentText('')
    setCommentErrorMessage('')
    setIsCommentLoading(false)

    await getComments()
  }

  // 댓글 삭제 기능 (관리자용)
  const handleDeleteComment = async (commentId) => {
    if (!isAdmin) {
      setCommentErrorMessage('관리자만 댓글을 삭제할 수 있습니다.')
      return
    }

    const isConfirmed = window.confirm('댓글을 삭제하시겠습니까?')

    if (!isConfirmed) return

    setDeletingCommentId(commentId)
    setCommentErrorMessage('')

    const { error } = await supabase
      .from('comment')
      .delete()
      .eq('id', commentId)

    if (error) {
      console.error(error)
      setCommentErrorMessage('댓글 삭제에 실패했습니다.')
      setDeletingCommentId(null)
      return
    }

    setDeletingCommentId(null)

    await getComments()
  }

  return (
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
            <span className={styles.audioDetailType}>{content.type}</span>

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

        <div className={styles.commentSection}>
          <div className={styles.commentHeader}>
            <h3>댓글</h3>
            <span>{comments.length}개</span>
          </div>

          <div className={styles.commentList}>
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className={styles.commentItem}>
                  <div className={styles.commentItemTop}>
                    <div className={styles.commentMeta}>
                      <strong>{comment.name}</strong>
                      <span>{formatDate(comment.created_at)}</span>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        className={styles.commentDeleteButton}
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deletingCommentId === comment.id}
                        aria-label="댓글 삭제"
                      >
                        {deletingCommentId === comment.id ? '...' : '-'}
                      </button>
                    )}
                  </div>

                  <p>{comment.description}</p>
                </div>
              ))
            ) : (
              <div className={styles.commentEmpty}>
                아직 등록된 댓글이 없습니다.
              </div>
            )}
          </div>

          <div className={styles.commentForm}>
            <div className={styles.commentInputRow}>
              <textarea
                value={commentText}
                placeholder="댓글을 입력해주세요."
                onChange={handleCommentInputChange}
              />

              <button
                type="button"
                className={styles.commentSendButton}
                onClick={handleAddComment}
                disabled={isCommentLoading}
                aria-label="댓글 등록"
              >
                {isCommentLoading ? (
                  <span className={styles.commentSendLoading}>...</span>
                ) : (
                  <img src={commentSendIcon} alt="" aria-hidden="true" />
                )}
              </button>
            </div>

            {commentErrorMessage && (
              <p className={styles.loginError}>{commentErrorMessage}</p>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}

export default AudioDetailModal
