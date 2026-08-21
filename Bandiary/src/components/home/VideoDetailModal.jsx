import { useEffect, useMemo, useRef, useState } from 'react'

import ModalPortal from '../common/ModalPortal'
import useToast from '../common/useToast'

import { formatDate } from '../../features/common'
import supabase from '../../api/supabase'

import commentSendIcon from '../../assets/images/comment-send.svg'
import styles from './VideoDetailModal.module.css'

const THUMBNAIL_COUNT = 5
const PLAYBACK_RATES = [0.75, 1, 1.25]

const formatVideoTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00'

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return (
    String(minutes).padStart(2, '0') +
    ':' +
    String(remainingSeconds).padStart(2, '0')
  )
}

const formatChapterTimeInput = (value) => {
  const timeDigits = value.replace(/\D/g, '').slice(0, 4)

  return timeDigits.length > 2
    ? timeDigits.slice(0, 2) + ':' + timeDigits.slice(2)
    : timeDigits
}

const parseChapterTime = (timeText) => {
  const normalizedTime = timeText.trim()

  if (!/^\d{1,4}:[0-5]\d$/.test(normalizedTime)) return null

  const [minutes, seconds] = normalizedTime.split(':').map(Number)

  return minutes * 60 + seconds
}

const fetchVideoChapters = (videoId) =>
  supabase
    .from('content_video_chapter')
    .select(
      'id, content_video_id, title, start_time_seconds, end_time_seconds, sort_order, created_at'
    )
    .eq('content_video_id', videoId)
    .order('start_time_seconds', { ascending: true })

const getThumbnailTimes = (duration) => {
  if (!Number.isFinite(duration) || duration <= 0) {
    return Array.from({ length: THUMBNAIL_COUNT }, () => 0)
  }

  return Array.from(
    { length: THUMBNAIL_COUNT },
    (_, index) => (duration * index) / (THUMBNAIL_COUNT - 1)
  )
}

const waitForVideoEvent = (video, eventName) =>
  new Promise((resolve, reject) => {
    const handleEvent = () => {
      cleanup()
      resolve()
    }
    const handleError = () => {
      cleanup()
      reject(new Error('비디오 장면을 불러오지 못했습니다.'))
    }
    const cleanup = () => {
      video.removeEventListener(eventName, handleEvent)
      video.removeEventListener('error', handleError)
    }

    video.addEventListener(eventName, handleEvent, { once: true })
    video.addEventListener('error', handleError, { once: true })
  })

const createVideoThumbnails = async (fileUrl, knownDuration) => {
  const video = document.createElement('video')

  video.crossOrigin = 'anonymous'
  video.muted = true
  video.preload = 'auto'
  video.src = fileUrl

  if (video.readyState < 1) {
    await waitForVideoEvent(video, 'loadedmetadata')
  }

  const duration =
    Number.isFinite(knownDuration) && knownDuration > 0
      ? knownDuration
      : video.duration
  const thumbnailTimes = getThumbnailTimes(duration)
  const thumbnails = []
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  canvas.width = 160
  canvas.height = 90

  if (!context) {
    throw new Error('비디오 썸네일을 만들 수 없습니다.')
  }

  for (const time of thumbnailTimes) {
    const safeTime = Math.min(
      Math.max(time, 0),
      Math.max((video.duration || duration) - 0.05, 0)
    )

    if (Math.abs(video.currentTime - safeTime) > 0.05) {
      video.currentTime = safeTime
      await waitForVideoEvent(video, 'seeked')
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    thumbnails.push(canvas.toDataURL('image/jpeg', 0.72))
  }

  video.removeAttribute('src')
  video.load()

  return thumbnails
}

function VideoDetailModal({ content, onClose }) {
  const { showToast } = useToast()
  const videoPlayerRef = useRef(null)
  const videoFiles = Array.isArray(content.videoFiles)
    ? [...content.videoFiles].sort(
        (firstVideo, secondVideo) =>
          firstVideo.sort_order - secondVideo.sort_order
      )
    : []
  const activeVideo = videoFiles[0] || null

  const [chapters, setChapters] = useState([])
  const [isChapterLoading, setIsChapterLoading] = useState(
    Boolean(activeVideo?.id)
  )
  const [chapterErrorMessage, setChapterErrorMessage] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(
    Number(activeVideo?.duration) || 0
  )
  const [activeChapterIndex, setActiveChapterIndex] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isChapterLooping, setIsChapterLooping] = useState(false)
  const [thumbnails, setThumbnails] = useState([])
  const [chapterTitle, setChapterTitle] = useState('')
  const [chapterStartTime, setChapterStartTime] = useState('')
  const [chapterEndTime, setChapterEndTime] = useState('')
  const [chapterFormErrorMessage, setChapterFormErrorMessage] = useState('')
  const [isChapterSubmitting, setIsChapterSubmitting] = useState(false)

  const navigationChapters = useMemo(() => {
    if (chapters.length > 0) return chapters

    return [
      {
        id: 'whole-video',
        title: '전체 영상',
        start_time_seconds: 0,
        end_time_seconds: duration,
      },
    ]
  }, [chapters, duration])

  const activeChapter =
    navigationChapters[activeChapterIndex] || navigationChapters[0]
  const activeChapterStart = Number(activeChapter?.start_time_seconds) || 0
  const activeChapterEnd = Number(activeChapter?.end_time_seconds) || duration
  const thumbnailTimes = getThumbnailTimes(duration)

  useEffect(() => {
    if (!activeVideo?.id) {
      return undefined
    }

    let isCancelled = false

    void fetchVideoChapters(activeVideo.id).then(({ data, error }) => {
        if (isCancelled) return

        if (error) {
          console.error('비디오 구간 조회 실패:', error)
          setChapterErrorMessage('등록된 곡 구간을 불러오지 못했습니다.')
          setIsChapterLoading(false)
          return
        }

        setChapters(data || [])
        setIsChapterLoading(false)
    })

    return () => {
      isCancelled = true
    }
  }, [activeVideo?.id])

  useEffect(() => {
    if (!activeVideo?.file_url) {
      return undefined
    }

    let isCancelled = false

    void createVideoThumbnails(
      activeVideo.file_url,
      Number(activeVideo.duration)
    )
      .then((nextThumbnails) => {
        if (!isCancelled) setThumbnails(nextThumbnails)
      })
      .catch((error) => {
        console.warn('비디오 탐색 썸네일 생성 실패:', error)
        if (!isCancelled) setThumbnails([])
      })

    return () => {
      isCancelled = true
    }
  }, [activeVideo?.duration, activeVideo?.file_url])

  const seekVideo = (time, shouldPlay = false) => {
    const player = videoPlayerRef.current

    if (!player || !Number.isFinite(time)) return

    const safeTime = duration ? Math.min(Math.max(time, 0), duration) : time

    player.currentTime = safeTime
    setCurrentTime(safeTime)

    if (shouldPlay) {
      void player.play().catch((error) => {
        console.error('비디오 재생 실패:', error)
      })
    }
  }

  const handleTimeUpdate = () => {
    const player = videoPlayerRef.current

    if (!player) return

    const nextTime = Number.isFinite(player.currentTime)
      ? player.currentTime
      : 0

    if (
      isChapterLooping &&
      activeChapterEnd > activeChapterStart &&
      nextTime >= activeChapterEnd
    ) {
      player.currentTime = activeChapterStart
      setCurrentTime(activeChapterStart)
      void player.play().catch((error) => {
        console.error('구간 반복 재생 실패:', error)
      })
      return
    }

    let nextActiveChapterIndex = 0

    navigationChapters.forEach((chapter, index) => {
      if (nextTime >= Number(chapter.start_time_seconds || 0)) {
        nextActiveChapterIndex = index
      }
    })

    setCurrentTime(nextTime)
    setActiveChapterIndex(nextActiveChapterIndex)
  }

  const handleMetadataLoaded = () => {
    const nextDuration = videoPlayerRef.current?.duration

    if (Number.isFinite(nextDuration)) {
      setDuration(nextDuration)
    }
  }

  const handleChapterSelect = (chapterIndex) => {
    const chapter = navigationChapters[chapterIndex]

    if (!chapter) return

    setActiveChapterIndex(chapterIndex)
    seekVideo(Number(chapter.start_time_seconds) || 0, true)
  }

  const handleNextChapter = () => {
    if (activeChapterIndex >= navigationChapters.length - 1) return

    handleChapterSelect(activeChapterIndex + 1)
  }

  const handlePlaybackRateChange = () => {
    const currentRateIndex = PLAYBACK_RATES.indexOf(playbackRate)
    const nextRate =
      PLAYBACK_RATES[(currentRateIndex + 1) % PLAYBACK_RATES.length]

    if (videoPlayerRef.current) {
      videoPlayerRef.current.playbackRate = nextRate
    }

    setPlaybackRate(nextRate)
  }

  const handleChapterLoopToggle = () => {
    setIsChapterLooping((isLooping) => !isLooping)
  }

  const handleChapterTitleChange = (event) => {
    setChapterTitle(event.target.value)
    setChapterFormErrorMessage('')
  }

  const handleChapterStartTimeChange = (event) => {
    setChapterStartTime(formatChapterTimeInput(event.target.value))
    setChapterFormErrorMessage('')
  }

  const handleChapterEndTimeChange = (event) => {
    setChapterEndTime(formatChapterTimeInput(event.target.value))
    setChapterFormErrorMessage('')
  }

  const handleAddChapter = async (event) => {
    event.preventDefault()

    if (!activeVideo?.id) {
      setChapterFormErrorMessage('비디오 데이터를 찾을 수 없습니다.')
      return
    }

    const normalizedTitle = chapterTitle.trim()
    const startTimeInSeconds = parseChapterTime(chapterStartTime)
    const endTimeInSeconds = parseChapterTime(chapterEndTime)

    if (!normalizedTitle) {
      setChapterFormErrorMessage('곡 구간 제목을 입력해주세요.')
      return
    }

    if (normalizedTitle.length > 100) {
      setChapterFormErrorMessage('곡 구간 제목은 100자 이하로 입력해주세요.')
      return
    }

    if (startTimeInSeconds === null || endTimeInSeconds === null) {
      setChapterFormErrorMessage(
        '시작과 종료 시간을 MM:SS 형식으로 입력해주세요.'
      )
      return
    }

    if (endTimeInSeconds <= startTimeInSeconds) {
      setChapterFormErrorMessage(
        '종료 시간은 시작 시간보다 뒤여야 합니다.'
      )
      return
    }

    if (duration && endTimeInSeconds > duration) {
      setChapterFormErrorMessage(
        '종료 시간은 비디오 전체 길이를 넘을 수 없습니다.'
      )
      return
    }

    const hasOverlappingChapter = chapters.some((chapter) => {
      const savedStartTime = Number(chapter.start_time_seconds)
      const savedEndTime = Number(chapter.end_time_seconds)

      return (
        startTimeInSeconds < savedEndTime &&
        endTimeInSeconds > savedStartTime
      )
    })

    if (hasOverlappingChapter) {
      setChapterFormErrorMessage(
        '이미 등록된 곡 구간과 시간이 겹칩니다.'
      )
      return
    }

    setIsChapterSubmitting(true)
    setChapterFormErrorMessage('')

    const { error } = await supabase
      .from('content_video_chapter')
      .insert([
        {
          content_video_id: activeVideo.id,
          title: normalizedTitle,
          start_time_seconds: startTimeInSeconds,
          end_time_seconds: endTimeInSeconds,
          sort_order: chapters.length,
        },
      ])

    if (error) {
      console.error('곡 구간 등록 실패:', error)
      setChapterFormErrorMessage(
        '곡 구간 등록에 실패했습니다. 테이블 설정을 확인해주세요.'
      )
      setIsChapterSubmitting(false)
      return
    }

    const { data, error: chapterRefreshError } =
      await fetchVideoChapters(activeVideo.id)

    if (chapterRefreshError) {
      console.error('곡 구간 새로고침 실패:', chapterRefreshError)
      setChapterFormErrorMessage(
        '곡 구간은 등록됐지만 목록을 새로고침하지 못했습니다.'
      )
      setIsChapterSubmitting(false)
      return
    }

    setChapters(data || [])
    setChapterTitle('')
    setChapterStartTime('')
    setChapterEndTime('')
    setIsChapterSubmitting(false)
    showToast('곡 구간이 등록되었습니다.')
  }

  return (
    <ModalPortal onEscapeKey={onClose}>
      <div
        className={styles.videoDetailCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-detail-title"
      >
        <header className={styles.videoDetailHeader}>
          <div className={styles.videoDetailHeading}>
            <h2 id="video-detail-title">{content.title}</h2>
            <time>{formatDate(content.created_at)}</time>
          </div>

          <button
            type="button"
            className={styles.videoDetailClose}
            onClick={onClose}
            aria-label="비디오 상세 모달 닫기"
          >
            ×
          </button>
        </header>

        {activeVideo?.file_url ? (
          <>
            <section className={styles.videoPlayerSection}>
              <video
                ref={videoPlayerRef}
                src={activeVideo.file_url}
                controls
                playsInline
                preload="metadata"
                onLoadedMetadata={handleMetadataLoaded}
                onTimeUpdate={handleTimeUpdate}
              >
                브라우저가 비디오 재생을 지원하지 않습니다.
              </video>
            </section>

            <div className={styles.videoThumbnailRail}>
              {thumbnailTimes.map((time, index) => (
                <button
                  key={String(time) + '-' + index}
                  type="button"
                  className={styles.videoThumbnailButton}
                  onClick={() => seekVideo(time, true)}
                  aria-label={formatVideoTime(time) + '부터 재생'}
                >
                  <span className={styles.videoThumbnailImage}>
                    {thumbnails[index] ? (
                      <img src={thumbnails[index]} alt="" aria-hidden="true" />
                    ) : (
                      <span aria-hidden="true">▶</span>
                    )}
                  </span>
                  <time>{formatVideoTime(time)}</time>
                </button>
              ))}

              <span
                className={styles.videoThumbnailPlayhead}
                style={{
                  left:
                    (duration
                      ? Math.min((currentTime / duration) * 100, 100)
                      : 0) + '%',
                }}
                aria-hidden="true"
              />
            </div>

            <section
              className={styles.videoChapterSection}
              aria-labelledby="video-chapter-title"
            >
              <div className={styles.videoChapterHeader}>
                <h3 id="video-chapter-title">곡 구간</h3>
                <span>
                  {isChapterLoading
                    ? '불러오는 중'
                    : chapters.length > 0
                      ? chapters.length + '개'
                      : '전체 재생'}
                </span>
              </div>

              <div className={styles.videoChapterList}>
                {navigationChapters.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    type="button"
                    className={
                      index === activeChapterIndex
                        ? styles.videoChapterActive
                        : styles.videoChapterButton
                    }
                    onClick={() => handleChapterSelect(index)}
                    aria-current={
                      index === activeChapterIndex ? 'true' : undefined
                    }
                  >
                    <strong>{chapter.title}</strong>
                    <time>
                      {formatVideoTime(Number(chapter.start_time_seconds)) +
                        '–' +
                        formatVideoTime(Number(chapter.end_time_seconds))}
                    </time>
                  </button>
                ))}
              </div>

              {chapterErrorMessage && (
                <p className={styles.videoChapterError}>
                  {chapterErrorMessage}
                </p>
              )}

              <div className={styles.videoPracticeControls}>
                <button
                  type="button"
                  className={
                    isChapterLooping
                      ? styles.videoLoopButtonActive
                      : styles.videoLoopButton
                  }
                  onClick={handleChapterLoopToggle}
                  aria-pressed={isChapterLooping}
                >
                  ↻ 이 구간 반복
                </button>

                <button
                  type="button"
                  className={styles.videoRateButton}
                  onClick={handlePlaybackRateChange}
                  aria-label="재생 속도 변경"
                >
                  {playbackRate}×
                </button>

                <button
                  type="button"
                  className={styles.videoNextButton}
                  onClick={handleNextChapter}
                  disabled={
                    activeChapterIndex >= navigationChapters.length - 1
                  }
                >
                  다음 구간 ›
                </button>
              </div>

              <form
                className={styles.videoChapterForm}
                onSubmit={handleAddChapter}
              >
                <div className={styles.videoChapterInputRow}>
                  <input
                    type="text"
                    value={chapterTitle}
                    placeholder="구간 제목"
                    maxLength={100}
                    onChange={handleChapterTitleChange}
                    aria-label="곡 구간 제목"
                  />

                  <div className={styles.videoChapterTimeInputs}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={chapterStartTime}
                      placeholder="시작 MM:SS"
                      maxLength={5}
                      onChange={handleChapterStartTimeChange}
                      aria-label="곡 구간 시작 시간"
                    />

                    <span aria-hidden="true">–</span>

                    <input
                      type="text"
                      inputMode="numeric"
                      value={chapterEndTime}
                      placeholder="종료 MM:SS"
                      maxLength={5}
                      onChange={handleChapterEndTimeChange}
                      aria-label="곡 구간 종료 시간"
                    />
                  </div>

                  <button
                    type="submit"
                    className={styles.videoChapterSendButton}
                    disabled={isChapterSubmitting}
                    aria-label="곡 구간 등록"
                  >
                    {isChapterSubmitting ? (
                      <span className={styles.videoChapterSendLoading}>
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

                <p className={styles.videoChapterInputGuide}>
                  제목과 시작·종료 시간을 입력해주세요. 예: 0130 → 01:30
                </p>

                {chapterFormErrorMessage && (
                  <p className={styles.videoChapterFormError}>
                    {chapterFormErrorMessage}
                  </p>
                )}
              </form>
            </section>
          </>
        ) : (
          <div className={styles.videoDetailEmpty}>
            등록된 비디오가 없습니다.
          </div>
        )}
      </div>
    </ModalPortal>
  )
}

export default VideoDetailModal
