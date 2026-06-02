import { formatDate } from '../../features/common'

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

  return (
    <div
      role="button"
      tabIndex={0}
      className={isActive ? 'content-card active' : 'content-card'}
      onClick={() => onClick(item)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onClick(item)
        }
      }}
    >
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

      <div className="content-card-top">
        <p className="small-title">
          {item.type} / {item.category}
        </p>
      </div>

      <strong>{item.title}</strong>
      <span>{formatDate(item.created_at)}</span>

      <div className="content-image">
        {isPicture && item.contentImageUrl && (
          <img src={item.contentImageUrl} alt={item.title} />
        )}

        {isVideo && item.contentVideoUrl && (
          <video src={item.contentVideoUrl} muted />
        )}

        {isAudio && (
          <div className="content-audio-placeholder">
            <strong>AUDIO</strong>
            <span>오디오 콘텐츠</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ContentCard