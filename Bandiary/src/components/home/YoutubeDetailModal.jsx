import { useEffect, useMemo, useRef, useState } from 'react'

import ModalPortal from '../common/ModalPortal'
import useToast from '../common/useToast'
import PlaceResultModal from '../place/PlaceResultModal'

import { formatDate } from '../../features/common'
import supabase from '../../api/supabase'

import playbackSpeedIcon from '../../assets/images/playback-speed.svg'
import practiceLoopIcon from '../../assets/images/practice-loop.svg'
import styles from './YoutubeDetailModal.module.css'

const PLAYBACK_RATES = [0.75, 1, 1.25]
const YOUTUBE_IFRAME_API_URL = 'https://www.youtube.com/iframe_api'

let youtubeIframeApiPromise = null

const formatYoutubeTime = (seconds) => {
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

const fetchYoutubeChapters = (youtubeContentId) =>
  supabase
    .from('content_youtube_chapter')
    .select(
      'id, content_youtube_id, title, start_time_seconds, end_time_seconds, sort_order, created_at'
    )
    .eq('content_youtube_id', youtubeContentId)
    .order('start_time_seconds', { ascending: true })

const loadYoutubeIframeApi = () => {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (youtubeIframeApiPromise) return youtubeIframeApiPromise

  youtubeIframeApiPromise = new Promise((resolve, reject) => {
    const previousReadyHandler = window.onYouTubeIframeAPIReady

    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousReadyHandler === 'function') {
        previousReadyHandler()
      }

      resolve(window.YT)
    }

    const existingScript = document.querySelector(
      `script[src="${YOUTUBE_IFRAME_API_URL}"]`
    )

    if (existingScript) {
      existingScript.addEventListener(
        'error',
        () => {
          youtubeIframeApiPromise = null
          reject(new Error('유튜브 플레이어 API를 불러오지 못했습니다.'))
        },
        { once: true }
      )
      return
    }

    const script = document.createElement('script')

    script.src = YOUTUBE_IFRAME_API_URL
    script.async = true
    script.addEventListener(
      'error',
      () => {
        youtubeIframeApiPromise = null
        reject(new Error('유튜브 플레이어 API를 불러오지 못했습니다.'))
      },
      { once: true }
    )
    document.head.appendChild(script)
  })

  return youtubeIframeApiPromise
}

function YoutubeDetailModal({ content, onClose }) {
  const { showToast } = useToast()
  const youtubePlayerHostRef = useRef(null)
  const youtubePlayerRef = useRef(null)
  const youtubeContent = content.youtubeContent
  const videoId = youtubeContent?.video_id || ''

  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [playerErrorMessage, setPlayerErrorMessage] = useState('')
  const [chapters, setChapters] = useState([])
  const [chapterErrorMessage, setChapterErrorMessage] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(
    Number(youtubeContent?.duration_seconds) || 0
  )
  const [activeChapterIndex, setActiveChapterIndex] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isChapterTesting, setIsChapterTesting] = useState(false)
  const [isChapterLooping, setIsChapterLooping] = useState(false)
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
        id: 'whole-youtube',
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
    if (!youtubeContent?.id) return undefined

    let isCancelled = false

    void fetchYoutubeChapters(youtubeContent.id).then(({ data, error }) => {
      if (isCancelled) return

      if (error) {
        console.error('유튜브 구간 조회 실패:', error)
        setChapterErrorMessage('등록된 곡 구간을 불러오지 못했습니다.')
        return
      }

      setChapters(data || [])
    })

    return () => {
      isCancelled = true
    }
  }, [youtubeContent?.id])

  useEffect(() => {
    if (!videoId || !youtubePlayerHostRef.current) return undefined

    let isCancelled = false
    let createdPlayer = null

    setIsPlayerReady(false)
    setPlayerErrorMessage('')

    void loadYoutubeIframeApi()
      .then((youtubeApi) => {
        if (isCancelled || !youtubePlayerHostRef.current) return

        createdPlayer = new youtubeApi.Player(youtubePlayerHostRef.current, {
          width: '100%',
          height: '100%',
          videoId,
          host: 'https://www.youtube-nocookie.com',
          playerVars: {
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              if (isCancelled) {
                event.target.destroy()
                return
              }

              youtubePlayerRef.current = event.target
              const nextDuration = Number(event.target.getDuration())

              if (Number.isFinite(nextDuration) && nextDuration > 0) {
                setDuration(nextDuration)
              }

              setIsPlayerReady(true)
            },
            onPlaybackRateChange: (event) => {
              const nextPlaybackRate = Number(event.data)

              if (Number.isFinite(nextPlaybackRate)) {
                setPlaybackRate(nextPlaybackRate)
              }
            },
            onError: (event) => {
              console.error('유튜브 플레이어 오류:', event.data)
              setPlayerErrorMessage(
                '유튜브 영상을 재생하지 못했습니다. 영상 공개 설정을 확인해주세요.'
              )
            },
          },
        })
      })
      .catch((error) => {
        if (isCancelled) return

        console.error('유튜브 플레이어 초기화 실패:', error)
        setPlayerErrorMessage('유튜브 플레이어를 불러오지 못했습니다.')
      })

    return () => {
      isCancelled = true
      setIsPlayerReady(false)
      youtubePlayerRef.current = null

      if (createdPlayer?.destroy) {
        createdPlayer.destroy()
      }
    }
  }, [videoId])

  useEffect(() => {
    if (!isPlayerReady) return undefined

    const updatePlaybackState = () => {
      const player = youtubePlayerRef.current

      if (!player?.getCurrentTime) return

      try {
        const nextTime = Number(player.getCurrentTime()) || 0
        const nextDuration = Number(player.getDuration()) || 0

        if (nextDuration > 0 && Math.abs(nextDuration - duration) > 0.5) {
          setDuration(nextDuration)
        }

        if (
          isChapterLooping &&
          activeChapterEnd > activeChapterStart &&
          nextTime >= activeChapterEnd - 0.1
        ) {
          player.seekTo(activeChapterStart, true)
          player.playVideo()
          setCurrentTime(activeChapterStart)
          return
        }

        if (
          isChapterTesting &&
          activeChapterEnd > activeChapterStart &&
          nextTime >= activeChapterEnd - 0.1
        ) {
          player.pauseVideo()
          player.seekTo(activeChapterEnd, true)
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
      } catch (error) {
        console.warn('유튜브 재생 상태 조회 실패:', error)
      }
    }

    updatePlaybackState()
    const playbackTimer = window.setInterval(updatePlaybackState, 200)

    return () => {
      window.clearInterval(playbackTimer)
    }
  }, [
    activeChapterEnd,
    activeChapterStart,
    duration,
    isChapterLooping,
    isChapterTesting,
    isPlayerReady,
    navigationChapters,
  ])

  const seekYoutube = (time, shouldPlay = false) => {
    const player = youtubePlayerRef.current

    if (!isPlayerReady || !player?.seekTo || !Number.isFinite(time)) return

    const safeTime = duration ? Math.min(Math.max(time, 0), duration) : time

    player.seekTo(safeTime, true)
    setCurrentTime(safeTime)

    let nextActiveChapterIndex = 0

    navigationChapters.forEach((chapter, index) => {
      if (safeTime >= Number(chapter.start_time_seconds || 0)) {
        nextActiveChapterIndex = index
      }
    })

    setActiveChapterIndex(nextActiveChapterIndex)

    if (shouldPlay) player.playVideo()
  }

  const handleTimelineSelect = (event) => {
    const timelineBounds = event.currentTarget.getBoundingClientRect()

    if (!timelineBounds.width || !duration || !isPlayerReady) return

    const selectedRatio = Math.min(
      Math.max((event.clientX - timelineBounds.left) / timelineBounds.width, 0),
      1
    )
    const playerState = youtubePlayerRef.current?.getPlayerState?.()
    const shouldPlay = playerState === window.YT?.PlayerState?.PLAYING

    seekYoutube(duration * selectedRatio, shouldPlay)
  }

  const handleChapterSelect = (chapterIndex) => {
    const chapter = navigationChapters[chapterIndex]

    if (!chapter || !isPlayerReady) return

    youtubePlayerRef.current?.pauseVideo?.()
    setIsChapterTesting(false)
    setIsChapterLooping(false)
    setActiveChapterIndex(chapterIndex)
    seekYoutube(Number(chapter.start_time_seconds) || 0)
  }

  const handlePlaybackRateSelect = (event) => {
    const nextPlaybackRate = Number(event.target.value)

    youtubePlayerRef.current?.setPlaybackRate?.(nextPlaybackRate)
    setPlaybackRate(nextPlaybackRate)
  }

  const handleChapterTest = () => {
    const player = youtubePlayerRef.current

    if (
      !isPlayerReady ||
      !player ||
      activeChapterEnd <= activeChapterStart
    ) {
      return
    }

    if (isChapterTesting) {
      player.pauseVideo()
      setIsChapterTesting(false)
      return
    }

    setIsChapterLooping(false)
    setIsChapterTesting(true)
    seekYoutube(activeChapterStart, true)
  }

  const handleChapterLoopToggle = () => {
    if (!isPlayerReady) return

    if (isChapterLooping) {
      youtubePlayerRef.current?.pauseVideo?.()
      setIsChapterLooping(false)
      return
    }

    if (activeChapterEnd <= activeChapterStart) return

    setIsChapterTesting(false)
    setIsChapterLooping(true)
    seekYoutube(activeChapterStart, true)
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

    if (!youtubeContent?.id) {
      setChapterFormErrorMessage('유튜브 데이터를 찾을 수 없습니다.')
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
        '종료 시간은 유튜브 영상 전체 길이를 넘을 수 없습니다.'
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

    const nextSortOrder =
      Math.max(
        -1,
        ...chapters.map((chapter) => Number(chapter.sort_order) || 0)
      ) + 1
    const { error } = await supabase
      .from('content_youtube_chapter')
      .insert([
        {
          content_youtube_id: youtubeContent.id,
          title: normalizedTitle,
          start_time_seconds: startTimeInSeconds,
          end_time_seconds: endTimeInSeconds,
          sort_order: nextSortOrder,
        },
      ])

    if (error) {
      console.error('유튜브 곡 구간 등록 실패:', error)
      setChapterFormErrorMessage(
        '곡 구간 등록에 실패했습니다. 테이블 설정을 확인해주세요.'
      )
      setIsChapterSubmitting(false)
      return
    }

    const { data, error: chapterRefreshError } =
      await fetchYoutubeChapters(youtubeContent.id)

    if (chapterRefreshError) {
      console.error('유튜브 곡 구간 새로고침 실패:', chapterRefreshError)
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
    if (!isAdmin || !deleteChapterTarget || !youtubeContent?.id) return

    setDeletingChapterId(deleteChapterTarget.id)
    setChapterErrorMessage('')

    const { error } = await supabase
      .from('content_youtube_chapter')
      .delete()
      .eq('id', deleteChapterTarget.id)
      .eq('content_youtube_id', youtubeContent.id)

    if (error) {
      console.error('유튜브 곡 구간 삭제 실패:', error)
      setChapterErrorMessage('곡 구간 삭제에 실패했습니다.')
      setDeletingChapterId(null)
      setDeleteChapterTarget(null)
      return
    }

    const deletedChapterId = deleteChapterTarget.id

    setChapters((currentChapters) =>
      currentChapters.filter((chapter) => chapter.id !== deletedChapterId)
    )
    youtubePlayerRef.current?.pauseVideo?.()
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
          className={styles.youtubeDetailCard}
          role="dialog"
          aria-modal="true"
          aria-labelledby="youtube-detail-title"
        >
          {/* 유튜브 상세 헤더 */}
          <header className={styles.youtubeDetailHeader}>
            <div className={styles.youtubeDetailHeading}>
              <h2 id="youtube-detail-title">{content.title}</h2>
              <time>{formatDate(content.created_at)}</time>
            </div>

            <button
              type="button"
              className={styles.youtubeDetailClose}
              onClick={onClose}
              aria-label="유튜브 상세 모달 닫기"
            >
              ×
            </button>
          </header>

          {videoId ? (
            <>
              {/* 유튜브 IFrame Player API가 이 영역을 플레이어로 교체합니다. */}
              <section className={styles.youtubePlayerSection}>
                <div ref={youtubePlayerHostRef} />
              </section>

              {playerErrorMessage && (
                <p className={styles.youtubeChapterError}>
                  {playerErrorMessage}
                </p>
              )}

              <div className={styles.youtubeTimelineSection}>
                <button
                  type="button"
                  className={styles.youtubeTimelineRail}
                  onClick={handleTimelineSelect}
                  aria-label="유튜브 타임라인에서 재생 위치 선택"
                  disabled={!isPlayerReady || !duration}
                >
                  {youtubeContent?.thumbnail_url && (
                    <img
                      className={styles.youtubeTimelineThumbnail}
                      src={youtubeContent.thumbnail_url}
                      alt=""
                      aria-hidden="true"
                    />
                  )}

                  {chapters.length > 0 && (
                    <span
                      className={styles.youtubeActiveChapterRange}
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
                      className={styles.youtubeChapterMarker}
                      style={{
                        left: `${duration
                          ? Math.min(
                              (Number(chapter.start_time_seconds) / duration) *
                                100,
                              100
                            )
                          : 0}%`,
                      }}
                      aria-hidden="true"
                    />
                  ))}

                  <span
                    className={styles.youtubeTimelineProgress}
                    style={{ width: `${currentProgress}%` }}
                    aria-hidden="true"
                  />
                  <span
                    className={styles.youtubeTimelinePlayhead}
                    style={{ left: `${currentProgress}%` }}
                    aria-hidden="true"
                  />
                </button>

                <div className={styles.youtubeTimelineTimes} aria-hidden="true">
                  <time>{formatYoutubeTime(currentTime)}</time>
                  <time>{formatYoutubeTime(duration)}</time>
                </div>
              </div>

              <section
                className={styles.youtubeChapterSection}
                aria-label="곡 구간"
              >
                <div className={styles.youtubePracticePanel}>
                  <button
                    type="button"
                    className={
                      isChapterLooping
                        ? styles.youtubeLoopButtonActive
                        : styles.youtubeLoopButton
                    }
                    onClick={handleChapterLoopToggle}
                    aria-pressed={isChapterLooping}
                    disabled={
                      !isPlayerReady ||
                      activeChapterEnd <= activeChapterStart
                    }
                  >
                    <img src={practiceLoopIcon} alt="" aria-hidden="true" />
                    <span>
                      {isChapterLooping ? '구간 반복 ON' : '구간 반복'}
                    </span>
                  </button>

                  <label className={styles.youtubeSpeedControl}>
                    <img src={playbackSpeedIcon} alt="" aria-hidden="true" />
                    <select
                      value={playbackRate}
                      onChange={handlePlaybackRateSelect}
                      aria-label="재생 속도"
                      disabled={!isPlayerReady}
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
                    className={styles.youtubeChapterTestButton}
                    onClick={handleChapterTest}
                    aria-pressed={isChapterTesting}
                    disabled={
                      !isPlayerReady ||
                      activeChapterEnd <= activeChapterStart
                    }
                  >
                    {isChapterTesting ? '■ 재생 중지' : '▶ 구간 재생'}
                  </button>
                </div>

                <div className={styles.youtubeChapterList}>
                  {navigationChapters.map((chapter, index) => (
                    <div
                      key={chapter.id}
                      className={styles.youtubeChapterItem}
                    >
                      <button
                        type="button"
                        className={
                          index === activeChapterIndex
                            ? styles.youtubeChapterActive
                            : styles.youtubeChapterButton
                        }
                        onClick={() => handleChapterSelect(index)}
                        aria-current={
                          index === activeChapterIndex ? 'true' : undefined
                        }
                        disabled={!isPlayerReady}
                      >
                        <strong>{chapter.title}</strong>
                        <time>
                          {formatYoutubeTime(
                            Number(chapter.start_time_seconds)
                          ) +
                            '–' +
                            formatYoutubeTime(
                              Number(chapter.end_time_seconds)
                            )}
                        </time>
                      </button>

                      {isAdmin && chapter.id !== 'whole-youtube' && (
                        <button
                          type="button"
                          className={styles.youtubeChapterDeleteButton}
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
                  <p className={styles.youtubeChapterError}>
                    {chapterErrorMessage}
                  </p>
                )}

                <form
                  className={styles.youtubeChapterForm}
                  onSubmit={handleAddChapter}
                >
                  <div className={styles.youtubeChapterInputPanel}>
                    <div className={styles.youtubeChapterField}>
                      <label htmlFor="youtube-chapter-title">구간 제목</label>
                      <input
                        id="youtube-chapter-title"
                        type="text"
                        value={chapterTitle}
                        placeholder="예: 후렴 반복 연습"
                        maxLength={100}
                        onChange={handleChapterTitleChange}
                      />
                    </div>

                    <div className={styles.youtubeChapterTimeFields}>
                      <div className={styles.youtubeChapterField}>
                        <label htmlFor="youtube-chapter-start-time">
                          시작 시간
                        </label>
                        <input
                          id="youtube-chapter-start-time"
                          type="text"
                          inputMode="numeric"
                          value={chapterStartTime}
                          placeholder="예: 01:30"
                          maxLength={5}
                          onChange={handleChapterStartTimeChange}
                        />
                      </div>

                      <span
                        className={styles.youtubeChapterTimeDirection}
                        aria-hidden="true"
                      >
                        →
                      </span>

                      <div className={styles.youtubeChapterField}>
                        <label htmlFor="youtube-chapter-end-time">
                          종료 시간
                        </label>
                        <input
                          id="youtube-chapter-end-time"
                          type="text"
                          inputMode="numeric"
                          value={chapterEndTime}
                          placeholder="예: 02:05"
                          maxLength={5}
                          onChange={handleChapterEndTimeChange}
                        />
                      </div>
                    </div>

                    <p className={styles.youtubeChapterInputGuide}>
                      MM:SS 형식으로 직접 입력해주세요.
                    </p>

                    <button
                      type="submit"
                      className={styles.youtubeChapterSubmitButton}
                      disabled={isChapterSubmitting || !isPlayerReady}
                    >
                      {isChapterSubmitting ? '등록 중...' : '구간 추가'}
                    </button>
                  </div>

                  {chapterFormErrorMessage && (
                    <p className={styles.youtubeChapterFormError}>
                      {chapterFormErrorMessage}
                    </p>
                  )}
                </form>
              </section>
            </>
          ) : (
            <div className={styles.youtubeDetailEmpty}>
              재생할 유튜브 영상을 찾을 수 없습니다.
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

export default YoutubeDetailModal
