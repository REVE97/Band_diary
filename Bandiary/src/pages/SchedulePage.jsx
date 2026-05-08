function SchedulePage() {
  return (
    <div className="page schedule-page">
      <section className="calendar-box">
        <h3>2025년 5월</h3>

        <div className="date-row">
          {[19, 20, 21, 22, 23, 24, 25].map((date) => (
            <button
              key={date}
              className={date === 21 ? 'active' : ''}
              type="button"
            >
              {date}
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <h3>다가오는 일정</h3>

        <article className="schedule-card">
          <div className="schedule-time">20:00</div>
          <div className="schedule-info">
            <strong>플라톤 합주</strong>
            <p>홍대 NVM 스튜디오</p>
          </div>
        </article>
      </section>

      <section className="section">
        <h3>투표 진행 중</h3>

        <article className="vote-progress-card">
          <strong>다음 합주 날짜를 정해주세요!</strong>
          <p>5/24 토 19:00</p>
          <div className="progress-bar">
            <span style={{ width: '60%' }} />
          </div>
          <p>5/25 일 16:00</p>
          <div className="progress-bar">
            <span style={{ width: '40%' }} />
          </div>
        </article>
      </section>
    </div>
  )
}

export default SchedulePage