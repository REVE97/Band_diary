function StatCard({ title, value, icon }) {
  return (
    <article className="stat-card">
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
      </div>
      <span>
        <img src={icon} />
      </span>
    </article>
  )
}

export default StatCard