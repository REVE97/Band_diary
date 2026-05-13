import soundcity from '../../assets/images/soundcity.jpeg'

function ContentCard({ item, isActive, onClick }) {
  return (
    <button
      type="button"
      className={isActive ? 'content-card active' : 'content-card'}
      onClick={() => onClick(item)}
    >
      <div className="content-card-top">
        <p className="small-title">{item.title}</p>
      </div>

      <strong>{item.name}</strong>
      <span>{item.date}</span>

      <div className="content-image">
        <img src={soundcity} />
      </div>
    </button>
  )
}

export default ContentCard