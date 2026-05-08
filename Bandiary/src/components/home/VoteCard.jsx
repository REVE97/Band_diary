function VoteCard({ title, bandName, dDay }) {
  return (
    <article className="vote-card">
      <div className="vote-icon">⏰</div>

      <div className="vote-info">
        <strong>{title}</strong>
        <p>{bandName}</p>
      </div>

      <span className="d-day">{dDay}</span>
    </article>
  )
}

export default VoteCard