import { useRef } from 'react'

import ModalPortal from '../common/ModalPortal'

import styles from './ScheduleAddModal.module.css'

const scheduleTypeOptions = ['합주', '공연', '개인연습', '회의', '기타']

const scheduleColorOptions = [
  '#6b4eff',
  '#4dabf7',
  '#38b000',
  '#ff9f1c',
  '#ff4d4f',
  '#868e96',
]

function ScheduleAddModal({
  scheduleForm,
  errorMessage,
  onClose,
  onSubmit,
  onInputChange,
}) {
  const dialogRef = useRef(null)

  return (
    <ModalPortal initialFocusRef={dialogRef} onEscapeKey={onClose}>
      <div
        ref={dialogRef}
        className={`${styles.placeModalCard} ${styles.scheduleModalCard}`}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-add-modal-title"
      >
        <div className={styles.placeModalHeader}>
          <div>
            <h2 id="schedule-add-modal-title">일정 추가</h2>
            <p>합주, 공연, 개인 연습 일정을 등록해주세요.</p>
          </div>
        </div>

        <div className={styles.loginForm + " " + styles.placeForm + " " + styles.scheduleForm}>
          <select
            name="type"
            value={scheduleForm.type}
            onChange={onInputChange}
          >
            {scheduleTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="title"
            value={scheduleForm.title}
            placeholder="일정 제목 예: 11월 첫째 주 합주"
            onChange={onInputChange}
          />

          <label className={styles.nativeDateTimeField}>
            <input
              type="date"
              name="scheduleDate"
              value={scheduleForm.scheduleDate}
              aria-label="일정 날짜"
              onChange={onInputChange}
            />
          </label>

          <div className={styles.scheduleTimeRow}>
            <label className={styles.nativeDateTimeField}>
              <input
                type="time"
                name="startTime"
                value={scheduleForm.startTime}
                aria-label="시작 시간"
                onChange={onInputChange}
              />
            </label>

            <span>~</span>

            <label className={styles.nativeDateTimeField}>
              <input
                type="time"
                name="endTime"
                value={scheduleForm.endTime}
                aria-label="종료 시간"
                onChange={onInputChange}
              />
            </label>
          </div>

          <input
            type="text"
            name="location"
            value={scheduleForm.location}
            placeholder="장소 예: 사운드시티 합정본점 A ROOM"
            onChange={onInputChange}
          />

          <textarea
            name="description"
            value={scheduleForm.description}
            placeholder="메모를 입력해주세요."
            onChange={onInputChange}
          />

          <div className={styles.scheduleColorSection}>
            <span>색상</span>

            <div className={styles.scheduleColorRow}>
              {scheduleColorOptions.map((color) => (
                <label
                  key={color}
                  className={scheduleForm.color === color ? styles.scheduleColorChip + " " + styles.active : styles.scheduleColorChip}
                  style={{ backgroundColor: color }}
                >
                  <input
                    type="radio"
                    name="color"
                    value={color}
                    checked={scheduleForm.color === color}
                    onChange={onInputChange}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        {errorMessage && <p className={styles.loginError}>{errorMessage}</p>}

        <div className={styles.placeModalButtonRow}>
          <button
            type="button"
            className={styles.placePrevButton}
            onClick={onClose}
          >
            취소
          </button>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={onSubmit}
          >
            등록하기
          </button>
        </div>
      </div>
    </ModalPortal>
  )
}

export default ScheduleAddModal
