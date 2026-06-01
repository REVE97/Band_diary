const getTimeValue = (value) => {
  if (!value) return ''
  return String(value).slice(0, 5)
}

const formatDate = (value) => {
  if (!value) return ''

  const [year, month, day] = String(value).split('-')

  return `${year}. ${month}. ${day}`
}

function ScheduleDetailModal({ schedule, onClose, onDelete }) {
  return (
    <div className="place-modal-overlay">
      <div className="place-modal-card schedule-detail-card">
        <div className="place-modal-header">
          <div>
            <h2>일정 상세</h2>
            <p>{schedule.type}</p>
          </div>

          <button
            type="button"
            className="place-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="schedule-detail-body">
          <div className="schedule-detail-type">
            <span style={{ backgroundColor: schedule.color || '#6b4eff' }} />
            <strong>{schedule.type}</strong>
          </div>

          <div className="schedule-detail-title-box">
            <strong>{schedule.title}</strong>
          </div>

          <div className="schedule-detail-info-card">
            <span>날짜</span>
            <strong>{formatDate(schedule.schedule_date)}</strong>
          </div>

          <div className="schedule-detail-info-card">
            <span>시간</span>
            <strong>
              {getTimeValue(schedule.start_time)} ~{' '}
              {getTimeValue(schedule.end_time)}
            </strong>
          </div>

          <div className="schedule-detail-info-card">
            <span>장소</span>
            <strong>{schedule.location || '등록된 장소가 없습니다.'}</strong>
          </div>

          <div className="schedule-detail-info-card">
            <span>메모</span>
            <p>{schedule.description || '등록된 메모가 없습니다.'}</p>
          </div>
        </div>

        <button
          type="button"
          className="schedule-delete-button"
          onClick={() => onDelete(schedule)}
        >
          삭제
        </button>
      </div>
    </div>
  )
}

export default ScheduleDetailModal