function ScheduleCard({ time, title, place }) {
  return (
    <article className="schedule-card">
      <div className="schedule-time">{time}</div>

      <div className="schedule-info">
        <strong>{title}</strong>
        <p>{place}</p>
      </div>

      <div className="member-stack">
        <span />
        <span />
        <span />
      </div>
    </article>
  )
}

export default ScheduleCard