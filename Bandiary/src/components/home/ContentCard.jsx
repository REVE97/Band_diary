import { formatDate } from '../../features/common'
import audioIcon from '../../assets/images/audio_white.svg'
import videoIcon from '../../assets/images/video_white.svg'
import pictureIcon from '../../assets/images/picture_white.svg'

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
        'content-card',
        isActive ? 'active' : '',
        isPicture ? 'picture' : '',
        isVideo ? 'video' : '',
        isAudio ? 'audio' : '',
        isAdmin ? 'admin' : '',
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
      <div className="content-list-preview">
        <div className="content-preview-placeholder">
          <img
            src={getContentIcon()}
            alt={`${item.type} 콘텐츠`}
            className="content-preview-icon"
          />
        </div>
      </div>

      {/* 콘텐츠 정보 */}
      <div className="content-list-info">
        <div className="content-card-top">
          <p className="small-title">
            {item.type}
          </p>

          {isAdmin && (
            <button
              type="button"
              className="content-delete-button"
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
        className="content-list-arrow"
        aria-hidden="true"
      >
        ›
      </span>

      {/* 캐싱 효율성 테스트 중 */}
      {/* {isPicture && item.contentImageUrl && (
        <img src={item.contentImageUrl} alt={item.title} />
      )}

      {isVideo && item.contentVideoUrl && (
        <video src={item.contentVideoUrl} muted />
      )} */}
    </div>
  )
}

export default ContentCard