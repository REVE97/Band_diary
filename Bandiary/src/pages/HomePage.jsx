import { useState } from 'react'

import StatCard from '../components/home/StatCard'
import ContentCard from '../components/home/ContentCard'

import profile from '../assets/images/profile.jpeg'
import picture from '../assets/images/picture_white.svg'
import video from '../assets/images/video_white.svg'

import { users } from '../mocks/userMock'
import { contentMockList } from '../mocks/contentMock'

function HomePage() {
  const [selectedContent, setSelectedContent] = useState(contentMockList[0])

  const videoCount = contentMockList.filter(
    (content) => content.title === '비디오'
  ).length

  const pictureCount = contentMockList.filter(
    (content) => content.title === '사진'
  ).length

  return (
    <div className="page home-page">
      <section className="user-greeting">
        <div>
          <h2>안녕하세요, {users.name}님</h2>
          <p>11f Band</p>
        </div>

        <div className="profile-avatar">
          <img src={profile} alt={`${users.name} 프로필`} />
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
        <StatCard title="비디오" value={videoCount} icon={video} />
        <StatCard title="사진" value={pictureCount} icon={picture} />
      </section>

      <section>
        <div className="home-card-grid">
          {contentMockList.map((content) => (
            <ContentCard
              key={content.id}
              item={content}
              isActive={selectedContent?.id === content.id}
              onClick={setSelectedContent}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

export default HomePage