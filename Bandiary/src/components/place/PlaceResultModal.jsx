function PlaceResultModal({ type, title, message, onClose }) {
  const isSuccess = type === 'success'

  return (
    <div className="place-result-overlay">
      <div className="place-result-card">
        <div className={isSuccess ? 'place-result-icon success' : 'place-result-icon fail'}>
          {isSuccess ? '✓' : '!'}
        </div>

        <h2>{title}</h2>
        <p>{message}</p>

        <button type="button" className="primary-button" onClick={onClose}>
          확인
        </button>
      </div>
    </div>
  )
}

export default PlaceResultModal