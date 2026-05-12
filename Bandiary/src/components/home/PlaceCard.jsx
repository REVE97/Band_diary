function PlaceCard({ title, name, date }) {
  return (
    <article className="place-card">
      <p className="small-title">{title}</p>
      <strong>{name}</strong>
      <span>{date}</span>

      <div className="place-image" />
    </article>
  )
}

export default PlaceCard