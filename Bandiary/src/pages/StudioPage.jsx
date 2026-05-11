function StudioPage() {
  return (
    <div className="page studio-page">
      <div className="tab-row">
        <button className="active">합주실</button>
        <button>주변 맛집</button>
        <button>공연장</button>
      </div>

      <div className="studio-list">
        {[1, 2, 3].map((item) => (
          <article className="studio-card" key={item}>
            <div className="studio-thumb" />

            <div>
              <strong>NVM 스튜디오 홍대점</strong>
              <p>⭐ 4.8 (128)</p>
              <span>₩ 25,000 / 2시간</span>
            </div>

            <button type="button">♡</button>
          </article>
        ))}
      </div>

      <div className="map-box">
        <button type="button">지도 보기</button>
      </div>
    </div>
  )
}

export default StudioPage