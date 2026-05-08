function ProfilePage() {
  return (
    <div className="page profile-page">
      <section className="profile-summary">
        <div className="large-avatar">🙂</div>

        <div>
          <h2>효재</h2>
          <p>세션 뮤지션</p>
          <span className="status-text">활동 가능</span>
        </div>
      </section>

      <section className="profile-instrument-grid">
        <div className="instrument-card">
          <p>메인 세션</p>
          <strong>일렉기타</strong>
        </div>

        <div className="instrument-card">
          <p>서브 세션</p>
          <strong>베이스</strong>
        </div>
      </section>

      <section className="section">
        <h3>소개</h3>
        <p className="profile-description">
          다양한 장르를 사랑하는 세션 기타리스트입니다.
          섬세한 톤과 그루브를 중요하게 생각해요.
        </p>
      </section>

      <section className="section">
        <h3>스킬 태그</h3>
        <div className="tag-row">
          <span>핑크</span>
          <span>록</span>
          <span>블루스</span>
          <span>재즈</span>
          <span>Funk</span>
        </div>
      </section>

      <section className="section">
        <h3>연습 영상</h3>
        <div className="video-grid">
          <div />
          <div />
          <div />
        </div>
      </section>
    </div>
  )
}

export default ProfilePage