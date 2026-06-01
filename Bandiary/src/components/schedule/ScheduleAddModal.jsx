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
  return (
    <div className="place-modal-overlay">
      <div className="place-modal-card schedule-modal-card">
        <div className="place-modal-header">
          <div>
            <h2>일정 추가</h2>
            <p>합주, 공연, 개인 연습 일정을 등록해주세요.</p>
          </div>

          <button
            type="button"
            className="place-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="login-form place-form schedule-form">
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

          <input
            type="date"
            name="scheduleDate"
            value={scheduleForm.scheduleDate}
            onChange={onInputChange}
          />

          <div className="schedule-time-row">
            <input
              type="time"
              name="startTime"
              value={scheduleForm.startTime}
              onChange={onInputChange}
            />

            <span>~</span>

            <input
              type="time"
              name="endTime"
              value={scheduleForm.endTime}
              onChange={onInputChange}
            />
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

          <div className="schedule-color-section">
            <span>색상</span>

            <div className="schedule-color-row">
              {scheduleColorOptions.map((color) => (
                <label
                  key={color}
                  className={
                    scheduleForm.color === color
                      ? 'schedule-color-chip active'
                      : 'schedule-color-chip'
                  }
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

        {errorMessage && <p className="login-error">{errorMessage}</p>}

        <div className="place-modal-button-row">
          <button
            type="button"
            className="place-prev-button"
            onClick={onClose}
          >
            취소
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={onSubmit}
          >
            등록하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default ScheduleAddModal