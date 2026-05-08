function PlaceCard({ title, name, rating }) {
  return (
    <article className="place-card">
      <p className="small-title">{title}</p>
      <strong>{name}</strong>
      <span>⭐ {rating} (128)</span>

      <div className="place-image" />
    </article>
  )
}

export default PlaceCard