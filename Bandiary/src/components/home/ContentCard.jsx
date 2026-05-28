import { formatDate } from '../../features/common'

function ContentCard({ item, isActive, onClick, onDeleteClick }) {
  const isPicture = item.type === '사진'
  const isVideo = item.type === '비디오'

  const thumbnailUrl = isPicture ? item.contentImageUrl : item.contentVideoUrl

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
      <button
        type="button"
        className="content-delete-button"
        onClick={(event) => onDeleteClick(event, item)}
        aria-label={`${item.title} 삭제`}
      >
        -
      </button>

      <div className="content-card-top">
        <p className="small-title">
          {item.type} / {item.category}
        </p>
      </div>

      <strong>{item.title}</strong>
      <span>{formatDate(item.created_at)}</span>

      <div className="content-image">
        {isPicture && thumbnailUrl && (
          <img src={thumbnailUrl} alt={item.title} />
        )}

        {isVideo && thumbnailUrl && (
          <video src={thumbnailUrl} muted />
        )}

      </div>
    </div>
  )
}

export default ContentCard