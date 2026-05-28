import soundcity from '../../assets/images/soundcity.jpeg'

import { formatDate } from '../../features/common'

function ContentCard({ item, isActive, onClick }) {
  return (
    <button
      type="button"
      className={isActive ? 'content-card active' : 'content-card'}
      onClick={() => onClick(item)}
    >
      <div className="content-card-top">
        <p className="small-title">{item.type}</p>
      </div>

      <strong>{item.title}</strong>
      <span>{formatDate(item.created_at)}</span>

      <div className="content-image">
        <img src={soundcity} />
      </div>
    </button>
  )
}

export default ContentCard