import { useState, useEffect } from 'react'
import axiosInstance from '../api/api'

import StatCard from '../components/home/StatCard'
import PlaceCard from '../components/home/PlaceCard'
import profile from '../assets/images/profile.jpeg'

function HomePage() {
  const [users, setUsers] = useState([]);

  const getFetch = async() => {
    try {
      const res = await axiosInstance.get("/users");
      setUsers(res.data);
    } catch (error) {
      alert('유저 데이터 불러오기 실패');
      console.error(error);
    }
  }

  useEffect(() => {
    getFetch();
  },[]);

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

      {/* <section className="stats-grid">
        <StatCard title="가입 밴드" value="3" icon="🎸" />
        <StatCard title="스크랩" value="12" icon="☆" />
      </section> */}

      <section className="profile-instrument-grid">
        <div className="instrument-card">
          <p>메인 세션</p>
          <strong>{users.session}</strong>
        </div>

        <div className="instrument-card">
          <p>서브 세션</p>
          <strong>{users.subsession}</strong>
        </div>
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