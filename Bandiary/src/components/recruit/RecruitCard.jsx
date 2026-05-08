function RecruitCard({ item }) {
  return (
    <article className="recruit-card">
      <div className="recruit-thumb" />

      <div className="recruit-content">
        <div className="recruit-top">
          <strong>{item.title}</strong>
          <span>{item.position}</span>
        </div>

        <p className="location">📍 {item.location}</p>

        <div className="tag-row">
          {item.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        <p className="description">{item.description}</p>

        <button type="button" className="primary-small-button">
          가입 신청
        </button>
      </div>

      <button className="bookmark-button" type="button">
        ♡
      </button>
    </article>
  )
}

export default RecruitCard