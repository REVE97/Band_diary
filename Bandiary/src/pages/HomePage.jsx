import StatCard from '../components/home/StatCard'
import PlaceCard from '../components/home/PlaceCard'

import profile from '../assets/images/profile.jpeg'
import picture from '../assets/images/picture_white.svg'
import video from '../assets/images/video_white.svg'

import { users } from '../mocks/userMock'

function HomePage() {
  return (
    <div className="page home-page">
      <section className="user-greeting">
        <div>
          <h2>안녕하세요, {users.name}님</h2>
          <p>환영합니다.</p>
        </div>

        <div className="profile-avatar">
          <img src={profile} />
        </div>
      </section>

      <section className="profile-instrument-grid">
        <div className="instrument-card">
          <p>메인 세션</p>
          <strong>{users.mainsession}</strong>
        </div>

        <div className="instrument-card">
          <p>서브 세션</p>
          <strong>{users.subsession}</strong>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard title="비디오" value="3" icon={video} />
        <StatCard title="사진" value="12" icon={picture} />
      </section>

      <section className="home-card-grid">
        <PlaceCard
          title="즐겨찾는 합주실"
          name="사운드시티 합정"
          date="2026.05.12"
        />


      </section>
    </div>
  )
}

export default HomePage