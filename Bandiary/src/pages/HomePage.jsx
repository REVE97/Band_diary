import StatCard from '../components/home/StatCard'
import ScheduleCard from '../components/home/ScheduleCard'
import VoteCard from '../components/home/VoteCard'
import PlaceCard from '../components/home/PlaceCard'
import SectionHeader from '../components/common/SectionHeader'

function HomePage() {
  return (
    <div className="page home-page">
      <section className="user-greeting">
        <div>
          <h2>안녕하세요, 효재님 👋</h2>
          <p>오늘도 멋진 사운드를 만들어봐요!</p>
        </div>

        <div className="profile-avatar">
          <span>🙂</span>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard title="가입 밴드" value="3" icon="🎸" />
        <StatCard title="참여 투표" value="2" icon="✓" />
        <StatCard title="스크랩" value="12" icon="☆" />
      </section>

      <section className="section">
        <SectionHeader title="오늘의 밴드 일정" linkText="전체 보기" />
        <ScheduleCard
          time="20:00"
          title="플라톤 합주"
          place="홍대 NVM 스튜디오"
        />
      </section>

      <section className="section">
        <SectionHeader title="최신 투표" linkText="전체 보기" />
        <VoteCard
          title="다음 합주 날짜를 정해주세요!"
          bandName="플라톤 밴드"
          dDay="D-1"
        />
      </section>

      <section className="home-card-grid">
        <PlaceCard
          title="즐겨찾는 합주실"
          name="NVM 스튜디오 홍대점"
          rating="4.8"
        />

        <div className="recommend-card">
          <p className="small-title">오늘의 추천 차트</p>
          <strong>그니까 웃잖아</strong>
          <span>JYP</span>
          <button type="button">▶</button>
        </div>
      </section>
    </div>
  )
}

export default HomePage