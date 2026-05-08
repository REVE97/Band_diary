const songs = [
  '그니까 웃잖아',
  '한 페이지가 될 수 있게',
  '사랑으로',
  'Bohemian Rhapsody',
  '스물다섯, 스물하나'
]

function ChartPage() {
  return (
    <div className="page chart-page">
      <div className="chart-list">
        {songs.map((song, index) => (
          <article className="chart-item" key={song}>
            <strong className="rank">{index + 1}</strong>
            <div className="album-thumb" />
            <div className="song-info">
              <strong>{song}</strong>
              <p>아티스트명</p>
              <span>락 · 중급</span>
            </div>
            <button type="button">▶</button>
          </article>
        ))}
      </div>
    </div>
  )
}

export default ChartPage