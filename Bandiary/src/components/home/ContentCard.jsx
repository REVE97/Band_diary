import { formatDate } from '../../features/common'
import audioIcon from '../../assets/images/audio_white.svg'
import videoIcon from '../../assets/images/video_white.svg'
import pictureIcon from '../../assets/images/picture_white.svg'
import styles from './ContentCard.module.css'

function ContentCard({ item, isActive, isAdmin, onClick, onDeleteClick }) {
  const isPicture = item.type === '사진'
  const isVideo = item.type === '비디오'
  const isAudio = item.type === '오디오'

  const handleDeleteClick = (event) => {
    event.stopPropagation()

    if (!isAdmin) return
    if (!onDeleteClick) return

    onDeleteClick(event, item)
  }

  // 콘텐츠 타입 아이콘
  const getContentIcon = () => {
    if (isPicture) return pictureIcon
    if (isVideo) return videoIcon
    return audioIcon
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={[
        styles.card,
        isActive ? styles.active : '',
        isPicture ? styles.picture : '',
        isVideo ? styles.video : '',
        isAudio ? styles.audio : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onClick(item)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onClick(item)
        }
      }}
    >
      {/* 콘텐츠 타입 미리보기 */}
      <div className={styles.preview}>
        <div className={styles.placeholder}>
          <img
            src={getContentIcon()}
            alt={`${item.type} 콘텐츠`}
            className={styles.previewIcon}
          />
        </div>
      </div>

      {/* 콘텐츠 정보 */}
      <div className={styles.info}>
        <div className={styles.top}>
          <p className={styles.title}>
            {item.type}
            {isAudio && item.audioFiles?.length > 0
              ? ` · ${item.audioFiles.length}개`
              : ''}
          </p>

          {isAdmin && (
            <button
              type="button"
              className={styles.deleteButton}
              onClick={handleDeleteClick}
              aria-label={`${item.title} 삭제`}
            >
              -
            </button>
          )}
        </div>

        <strong>{item.title}</strong>
        <span>{formatDate(item.created_at)}</span>
      </div>

      <span
        className={styles.arrow}
        aria-hidden="true"
      >
        ›
      </span>
    </div>
  )
}

export default ContentCard
