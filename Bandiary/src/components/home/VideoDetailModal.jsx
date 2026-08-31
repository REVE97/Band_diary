import { useEffect, useMemo, useRef, useState } from 'react'

import ModalPortal from '../common/ModalPortal'
import useToast from '../common/useToast'
import PlaceResultModal from '../place/PlaceResultModal'

import { formatDate } from '../../features/common'
import supabase from '../../api/supabase'

import chapterAddIcon from '../../assets/images/chapter-add.svg'
import playbackSpeedIcon from '../../assets/images/playback-speed.svg'
import practiceLoopIcon from '../../assets/images/practice-loop.svg'
import seekBackward10Icon from '../../assets/images/seek-backward-10.svg'
import seekForward10Icon from '../../assets/images/seek-forward-10.svg'
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
  const videoPlayerSectionRef = useRef(null)
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
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [duration, setDuration] = useState(
    Number(activeVideo?.duration) || 0
  )
  const [activeChapterIndex, setActiveChapterIndex] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isChapterTesting, setIsChapterTesting] = useState(false)
  const [isChapterLooping, setIsChapterLooping] = useState(false)
  const [thumbnails, setThumbnails] = useState([])
  const [chapterTitle, setChapterTitle] = useState('')
  const [chapterStartTime, setChapterStartTime] = useState('')
  const [chapterEndTime, setChapterEndTime] = useState('')
  const [chapterFormErrorMessage, setChapterFormErrorMessage] = useState('')
  const [isChapterSubmitting, setIsChapterSubmitting] = useState(false)
  const [deletingChapterId, setDeletingChapterId] = useState(null)
  const [deleteChapterTarget, setDeleteChapterTarget] = useState(null)

  const storageInfo = JSON.parse(
    sessionStorage.getItem('bandiaryLoginUser')
  )
  const isAdmin = storageInfo?.userId === 'admin'

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
  const currentProgress = duration
    ? Math.min(Math.max((currentTime / duration) * 100, 0), 100)
    : 0
  const activeChapterStartPercent = duration
    ? Math.min(Math.max((activeChapterStart / duration) * 100, 0), 100)
    : 0
  const activeChapterEndPercent = duration
    ? Math.min(Math.max((activeChapterEnd / duration) * 100, 0), 100)
    : 0

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

    let nextActiveChapterIndex = 0

    navigationChapters.forEach((chapter, index) => {
      if (safeTime >= Number(chapter.start_time_seconds || 0)) {
        nextActiveChapterIndex = index
      }
    })

    setActiveChapterIndex(nextActiveChapterIndex)

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

    if (
      isChapterTesting &&
      activeChapterEnd > activeChapterStart &&
      nextTime >= activeChapterEnd
    ) {
      player.pause()
      player.currentTime = activeChapterEnd
      setCurrentTime(activeChapterEnd)
      setIsChapterTesting(false)
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

  const handlePlaybackToggle = () => {
    const player = videoPlayerRef.current

    if (!player) return

    if (player.paused) {
      void player.play().catch((error) => {
        console.error('비디오 재생 실패:', error)
      })
      return
    }

    player.pause()
  }

  const handleSeekBy = (seconds) => {
    const player = videoPlayerRef.current

    if (!player) return

    seekVideo(player.currentTime + seconds, !player.paused)
  }

  const handleTimelineSelect = (event) => {
    const timelineBounds = event.currentTarget.getBoundingClientRect()

    if (!timelineBounds.width || !duration) return

    const selectedRatio = Math.min(
      Math.max((event.clientX - timelineBounds.left) / timelineBounds.width, 0),
      1
    )
    const player = videoPlayerRef.current

    seekVideo(duration * selectedRatio, player ? !player.paused : false)
  }

  const handleVolumeChange = (event) => {
    const nextVolume = Number(event.target.value)
    const player = videoPlayerRef.current

    if (!player) return

    player.volume = nextVolume
    player.muted = nextVolume === 0
    setVolume(nextVolume)
    setIsMuted(nextVolume === 0)
  }

  const handleMuteToggle = () => {
    const player = videoPlayerRef.current

    if (!player) return

    const nextMuted = !player.muted

    player.muted = nextMuted
    setIsMuted(nextMuted)
  }

  const handleFullscreenToggle = () => {
    const playerSection = videoPlayerSectionRef.current

    if (!playerSection) return

    if (document.fullscreenElement) {
      void document.exitFullscreen?.()
      return
    }

    if (playerSection.requestFullscreen) {
      void playerSection.requestFullscreen()
      return
    }

    videoPlayerRef.current?.webkitEnterFullscreen?.()
  }

  const handleChapterSelect = (chapterIndex) => {
    const chapter = navigationChapters[chapterIndex]

    if (!chapter) return

    videoPlayerRef.current?.pause()
    setIsChapterTesting(false)
    setIsChapterLooping(false)
    setActiveChapterIndex(chapterIndex)
    seekVideo(Number(chapter.start_time_seconds) || 0)
  }

  const handlePlaybackRateChange = (nextRate) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.playbackRate = nextRate
    }

    setPlaybackRate(nextRate)
  }

  const handlePlaybackRateSelect = (event) => {
    handlePlaybackRateChange(Number(event.target.value))
  }

  const handleChapterTest = () => {
    const player = videoPlayerRef.current

    if (!player || activeChapterEnd <= activeChapterStart) return

    if (isChapterTesting) {
      player.pause()
      setIsChapterTesting(false)
      return
    }

    setIsChapterLooping(false)
    setIsChapterTesting(true)
    seekVideo(activeChapterStart, true)
  }

  const handleChapterLoopToggle = () => {
    if (isChapterLooping) {
      videoPlayerRef.current?.pause()
      setIsChapterLooping(false)
      return
    }

    if (activeChapterEnd <= activeChapterStart) return

    setIsChapterTesting(false)
    setIsChapterLooping(true)
    seekVideo(activeChapterStart, true)
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

  const handleOpenChapterDeleteModal = (chapter) => {
    if (!isAdmin) return

    setDeleteChapterTarget(chapter)
    setChapterErrorMessage('')
  }

  const handleCloseChapterDeleteModal = () => {
    if (deletingChapterId !== null) return

    setDeleteChapterTarget(null)
  }

  const handleDeleteChapter = async () => {
    if (!isAdmin || !deleteChapterTarget || !activeVideo?.id) return

    setDeletingChapterId(deleteChapterTarget.id)
    setChapterErrorMessage('')

    const { error } = await supabase
      .from('content_video_chapter')
      .delete()
      .eq('id', deleteChapterTarget.id)
      .eq('content_video_id', activeVideo.id)

    if (error) {
      console.error('곡 구간 삭제 실패:', error)
      setChapterErrorMessage('곡 구간 삭제에 실패했습니다.')
      setDeletingChapterId(null)
      setDeleteChapterTarget(null)
      return
    }

    const deletedChapterId = deleteChapterTarget.id

    setChapters((currentChapters) =>
      currentChapters.filter((chapter) => chapter.id !== deletedChapterId)
    )
    videoPlayerRef.current?.pause()
    setActiveChapterIndex(0)
    setIsChapterTesting(false)
    setIsChapterLooping(false)
    setDeletingChapterId(null)
    setDeleteChapterTarget(null)
    showToast('곡 구간이 삭제되었습니다.')
  }

  return (
    <>
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
            <section
              ref={videoPlayerSectionRef}
              className={styles.videoPlayerSection}
            >
              <video
                ref={videoPlayerRef}
                src={activeVideo.file_url}
                playsInline
                preload="metadata"
                onLoadedMetadata={handleMetadataLoaded}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onClick={handlePlaybackToggle}
              >
                브라우저가 비디오 재생을 지원하지 않습니다.
              </video>

              <div className={styles.videoControlOverlay}>
                <div className={styles.videoTransportControls}>
                  <button
                    type="button"
                    onClick={() => handleSeekBy(-10)}
                    aria-label="10초 뒤로 이동"
                  >
                    <img src={seekBackward10Icon} alt="" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    className={styles.videoInlinePlayButton}
                    onClick={handlePlaybackToggle}
                    aria-label={isPlaying ? '비디오 일시정지' : '비디오 재생'}
                  >
                    <span aria-hidden="true">{isPlaying ? '❚❚' : '▶'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSeekBy(10)}
                    aria-label="10초 앞으로 이동"
                  >
                    <img src={seekForward10Icon} alt="" aria-hidden="true" />
                  </button>
                </div>

                <div className={styles.videoControlFooter}>
                  <time>
                    {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
                  </time>

                  <div className={styles.videoVolumeControl}>
                    <button
                      type="button"
                      onClick={handleMuteToggle}
                      aria-label={isMuted ? '음소거 해제' : '음소거'}
                    >
                      <span aria-hidden="true">
                        {isMuted || volume === 0 ? '⌁' : '◖))'}
                      </span>
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      aria-label="비디오 음량"
                      style={{
                        '--video-volume': `${(isMuted ? 0 : volume) * 100}%`,
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    className={styles.videoFullscreenButton}
                    onClick={handleFullscreenToggle}
                    aria-label="전체 화면으로 보기"
                  >
                    <span aria-hidden="true">⛶</span>
                  </button>
                </div>
              </div>
            </section>

            <div className={styles.videoTimelineSection}>
              <button
                type="button"
                className={styles.videoThumbnailRail}
                onClick={handleTimelineSelect}
                aria-label="비디오 타임라인에서 재생 위치 선택"
              >
                <span className={styles.videoThumbnailFilmstrip}>
                  {thumbnailTimes.map((time, index) => (
                    <span
                      key={String(time) + '-' + index}
                      className={styles.videoThumbnailImage}
                    >
                      {thumbnails[index] ? (
                        <img src={thumbnails[index]} alt="" aria-hidden="true" />
                      ) : (
                        <span aria-hidden="true">▶</span>
                      )}
                    </span>
                  ))}
                </span>

                {chapters.length > 0 && (
                  <span
                    className={styles.videoActiveChapterRange}
                    style={{
                      left: `${activeChapterStartPercent}%`,
                      width: `${Math.max(
                        activeChapterEndPercent - activeChapterStartPercent,
                        0
                      )}%`,
                    }}
                    aria-hidden="true"
                  />
                )}

                {navigationChapters.slice(1).map((chapter) => (
                  <span
                    key={`marker-${chapter.id}`}
                    className={styles.videoChapterMarker}
                    style={{
                      left: `${duration
                        ? Math.min(
                            (Number(chapter.start_time_seconds) / duration) * 100,
                            100
                          )
                        : 0}%`,
                    }}
                    aria-hidden="true"
                  />
                ))}

                <span
                  className={styles.videoTimelineProgress}
                  style={{ width: `${currentProgress}%` }}
                  aria-hidden="true"
                />
                <span
                  className={styles.videoThumbnailPlayhead}
                  style={{ left: `${currentProgress}%` }}
                  aria-hidden="true"
                />
              </button>

              <div className={styles.videoTimelineTimes} aria-hidden="true">
                <time>00:00</time>
                <time>{formatVideoTime(duration)}</time>
              </div>
            </div>

            <section
              className={styles.videoChapterSection}
              aria-labelledby="video-chapter-title"
            >
              <div className={styles.videoPracticePanel}>
                <button
                  type="button"
                  className={
                    isChapterLooping
                      ? styles.videoLoopButtonActive
                      : styles.videoLoopButton
                  }
                  onClick={handleChapterLoopToggle}
                  aria-pressed={isChapterLooping}
                  disabled={activeChapterEnd <= activeChapterStart}
                >
                  <img src={practiceLoopIcon} alt="" aria-hidden="true" />
                  <span>
                    {isChapterLooping ? '구간 반복 ON' : '구간 반복'}
                  </span>
                </button>

                <label className={styles.videoSpeedControl}>
                  <img src={playbackSpeedIcon} alt="" aria-hidden="true" />
                  <span className={styles.visuallyHidden}>재생 속도</span>
                  <select
                    value={playbackRate}
                    onChange={handlePlaybackRateSelect}
                    aria-label="재생 속도"
                  >
                    {PLAYBACK_RATES.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}×
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  className={styles.videoChapterTestButton}
                  onClick={handleChapterTest}
                  aria-pressed={isChapterTesting}
                  disabled={activeChapterEnd <= activeChapterStart}
                >
                  {isChapterTesting ? '■ 재생 중지' : '▶ 구간 재생'}
                </button>
              </div>

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
                  <div
                    key={chapter.id}
                    className={styles.videoChapterItem}
                  >
                    <button
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

                    {isAdmin && chapter.id !== 'whole-video' && (
                      <button
                        type="button"
                        className={styles.videoChapterDeleteButton}
                        onClick={() => handleOpenChapterDeleteModal(chapter)}
                        disabled={deletingChapterId === chapter.id}
                        aria-label={`${chapter.title} 곡 구간 삭제`}
                      >
                        {deletingChapterId === chapter.id ? '...' : '−'}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {chapterErrorMessage && (
                <p className={styles.videoChapterError}>
                  {chapterErrorMessage}
                </p>
              )}

              <form
                className={styles.videoChapterForm}
                onSubmit={handleAddChapter}
              >
                <div className={styles.videoChapterInputPanel}>
                  <div className={styles.videoChapterField}>
                    <label htmlFor="video-chapter-title">구간 제목</label>
                    <input
                      id="video-chapter-title"
                      type="text"
                      value={chapterTitle}
                      placeholder="예: 후렴 반복 연습"
                      maxLength={100}
                      onChange={handleChapterTitleChange}
                    />
                  </div>

                  <div className={styles.videoChapterTimeFields}>
                    <div className={styles.videoChapterField}>
                      <label htmlFor="video-chapter-start-time">
                        시작 시간
                      </label>
                      <input
                        id="video-chapter-start-time"
                        type="text"
                        inputMode="numeric"
                        value={chapterStartTime}
                        placeholder="예: 01:30"
                        maxLength={5}
                        onChange={handleChapterStartTimeChange}
                      />
                    </div>

                    <div className={styles.videoChapterField}>
                      <label htmlFor="video-chapter-end-time">
                        종료 시간
                      </label>
                      <input
                        id="video-chapter-end-time"
                        type="text"
                        inputMode="numeric"
                        value={chapterEndTime}
                        placeholder="예: 02:05"
                        maxLength={5}
                        onChange={handleChapterEndTimeChange}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={styles.videoChapterSubmitButton}
                    disabled={isChapterSubmitting}
                  >
                    {isChapterSubmitting ? (
                      '등록 중...'
                    ) : (
                      <>
                        <img
                          src={chapterAddIcon}
                          alt=""
                          aria-hidden="true"
                        />
                        <span>구간 추가</span>
                      </>
                    )}
                  </button>

                  <p className={styles.videoChapterInputGuide}>
                    제목과 시작·종료 시간을 입력해주세요. 예: 0130 → 01:30
                  </p>
                </div>

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

      {deleteChapterTarget && (
        <PlaceResultModal
          type="confirm"
          title="삭제 확인"
          message="선택한 곡 구간을 삭제하시겠습니까?"
          confirmText="삭제"
          cancelText="취소"
          onClose={handleCloseChapterDeleteModal}
          onConfirm={handleDeleteChapter}
        />
      )}
    </>
  )
}

export default VideoDetailModal
