import { formatDate } from '../../features/common'

function ContentDetailModal({ content, onClose }) {
  const isPicture = content.type === '사진'
  const isVideo = content.type === '비디오'

  return (
    <div className="place-modal-overlay">
      <div className="place-modal-card content-detail-card">
        <div className="place-modal-header">
          <div>
            <h2>{content.title}</h2>
            <p>
              {content.type} / {content.category}
              <br />
              {formatDate(content.created_at)}
            </p>
          </div>

          <button
            type="button"
            className="place-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="content-detail-media">
          {isPicture && content.contentImageUrl && (
            <img src={content.contentImageUrl} alt={content.title} />
          )}

          {isVideo && content.contentVideoUrl && (
            <video src={content.contentVideoUrl} controls />
          )}

          {isPicture && !content.contentImageUrl && (
            <div className="content-detail-empty">
              등록된 이미지가 없습니다.
            </div>
          )}

          {isVideo && !content.contentVideoUrl && (
            <div className="content-detail-empty">
              등록된 영상이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ContentDetailModal