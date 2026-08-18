import ModalPortal from '../common/ModalPortal'

import styles from './ScheduleDetailModal.module.css'

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
    <ModalPortal onEscapeKey={onClose}>
      <div
        className={`${styles.placeModalCard} ${styles.scheduleDetailCard}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-detail-modal-title"
      >
        <div className={styles.placeModalHeader}>
          <div>
            <h2 id="schedule-detail-modal-title">일정 상세</h2>
            <p>{schedule.type}</p>
          </div>

          <button
            type="button"
            className={styles.placeModalClose}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className={styles.scheduleDetailBody}>
          <div className={styles.scheduleDetailType}>
            <span style={{ backgroundColor: schedule.color || '#6b4eff' }} />
            <strong>{schedule.type}</strong>
          </div>

          <div className={styles.scheduleDetailTitleBox}>
            <strong>{schedule.title}</strong>
          </div>

          <div className={styles.scheduleDetailInfoCard}>
            <span>날짜</span>
            <strong>{formatDate(schedule.schedule_date)}</strong>
          </div>

          <div className={styles.scheduleDetailInfoCard}>
            <span>시간</span>
            <strong>
              {getTimeValue(schedule.start_time)} ~{' '}
              {getTimeValue(schedule.end_time)}
            </strong>
          </div>

          <div className={styles.scheduleDetailInfoCard}>
            <span>장소</span>
            <strong>{schedule.location || '등록된 장소가 없습니다.'}</strong>
          </div>

          <div className={styles.scheduleDetailInfoCard}>
            <span>메모</span>
            <p>{schedule.description || '등록된 메모가 없습니다.'}</p>
          </div>
        </div>

        <button
          type="button"
          className={styles.scheduleDeleteButton}
          onClick={() => onDelete(schedule)}
        >
          삭제
        </button>
      </div>
    </ModalPortal>
  )
}

export default ScheduleDetailModal
