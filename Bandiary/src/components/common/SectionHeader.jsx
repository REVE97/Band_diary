function SectionHeader({ title, linkText }) {
  return (
    <div className="section-header">
      <h3>{title}</h3>
      {linkText && <button type="button">{linkText} &gt;</button>}
    </div>
  )
}

export default SectionHeader