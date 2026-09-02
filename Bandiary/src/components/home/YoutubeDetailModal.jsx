import ModalPortal from '../common/ModalPortal'

import { formatDate } from '../../features/common'

import styles from './YoutubeDetailModal.module.css'

function YoutubeDetailModal({ content, onClose }) {
  const youtubeContent = content.youtubeContent
  const videoId = youtubeContent?.video_id || ''
  const embedUrl = videoId
    ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?playsinline=1&rel=0`
    : ''

  return (
    <ModalPortal onEscapeKey={onClose}>
      <div
        className={styles.youtubeDetailCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="youtube-detail-title"
      >
        {/* 유튜브 상세 헤더 */}
        <div className={styles.youtubeDetailHeader}>
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
        </div>

        {/* 유튜브 임베드 플레이어 */}
        {embedUrl ? (
          <div className={styles.youtubePlayerSection}>
            <iframe
              src={embedUrl}
              title={`${content.title} 유튜브 영상`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        ) : (
          <div className={styles.youtubeDetailEmpty}>
            재생할 유튜브 영상을 찾을 수 없습니다.
          </div>
        )}
      </div>
    </ModalPortal>
  )
}

export default YoutubeDetailModal
