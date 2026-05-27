import { useState, useEffect } from 'react'
import supabase from '../api/supabase'

import StatCard from '../components/home/StatCard'
import ContentCard from '../components/home/ContentCard'

import profile from '../assets/images/profile.jpeg'
import picture from '../assets/images/picture_white.svg'
import video from '../assets/images/video_white.svg'

import { contentMockList } from '../mocks/contentMock'

function HomePage() {
  const [selectedContent, setSelectedContent] = useState(contentMockList[0])

  const videoCount = contentMockList.filter(
    (content) => content.title === '비디오'
  ).length

  const pictureCount = contentMockList.filter(
    (content) => content.title === '사진'
  ).length

  // profileInfo
  const [profileInfo, setProfileInfo] = useState([]);

  const storageInfo = JSON.parse(sessionStorage.getItem('bandiaryLoginUser'))

  const getUsers = async () => {
    const { data, error } = await supabase.from("users").select().eq("userId",storageInfo.userId)

    if (error) {
      console.error(error);
    } else {
      setProfileInfo(data)
    }
  }

  useEffect(() => {
    getUsers()
  },[])

  return (
    <div className="page home-page">
      <section className="user-greeting">
        <div>
          <h2>안녕하세요, {profileInfo[0]?.name}님</h2>
          <p>11f Band</p>
        </div>

        <div className="profile-avatar">
          <img src={profile} alt={`${profileInfo[0]?.name} 프로필`} />
        </div>
      </section>

      <section className="instrument-grid">
        <div className="instrument-card">
          <p>메인 세션</p>
          <strong>{profileInfo[0]?.mainSession}</strong>
        </div>

        <div className="instrument-card">
          <p>서브 세션</p>
          <strong>{profileInfo[0]?.subSession}</strong>
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