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
        <header className={styles.placeModalHeader}>
          <span className={styles.scheduleDetailType}>
            <span style={{ backgroundColor: schedule.color || '#6b4eff' }} aria-hidden="true" />
            {schedule.type}
          </span>
          <button aria-label="닫기" type="button" className={styles.placeModalClose} onClick={onClose}>
            <span className={styles.closeIcon} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.scheduleDetailBody}>
          <h2 id="schedule-detail-modal-title" className={styles.scheduleDetailTitle}>
            {schedule.title}
          </h2>

          <div className={styles.scheduleDetailInfo}>
            <div className={styles.scheduleDetailInfoRow}>
              <span className={styles.infoIconBox} aria-hidden="true"><span className={styles.calendarIcon} /></span>
              <dl>
                <dt>날짜</dt>
                <dd>{formatDate(schedule.schedule_date)}</dd>
              </dl>
            </div>
            <div className={styles.scheduleDetailInfoRow}>
              <span className={styles.infoIconBox} aria-hidden="true"><span className={styles.clockIcon} /></span>
              <dl>
                <dt>시간</dt>
                <dd>{getTimeValue(schedule.start_time)} – {getTimeValue(schedule.end_time)}</dd>
              </dl>
            </div>
            <div className={styles.scheduleDetailInfoRow}>
              <span className={styles.infoIconBox} aria-hidden="true"><span className={styles.locationIcon} /></span>
              <dl>
                <dt>장소</dt>
                <dd>{schedule.location || '등록된 장소가 없습니다.'}</dd>
              </dl>
            </div>
          </div>

          <section className={styles.scheduleDetailMemo}>
            <span className={styles.memoIcon} aria-hidden="true" />
            <div>
              <h3>메모</h3>
              <p>{schedule.description || '등록된 메모가 없습니다.'}</p>
            </div>
          </section>
        </div>

        <footer className={styles.scheduleDetailFooter}>
          <button type="button" className={styles.scheduleDeleteButton} onClick={() => onDelete(schedule)}>
            <span className={styles.deleteIcon} aria-hidden="true" />
            삭제
          </button>
        </footer>
      </div>
    </ModalPortal>
  )
}

export default ScheduleDetailModal
