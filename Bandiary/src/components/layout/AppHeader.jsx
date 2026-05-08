import { Link, useLocation } from 'react-router-dom'
import logo from '../../assets/images/logo.png'

const pageTitleMap = {
  '/': '',
  '/recruit': '밴드 모집',
  '/studio': '합주실 찾기',
  '/chart': '연습 많이 하는 곡 차트',
  '/schedule': '일정 · 투표 · 다이어리',
  '/profile': '마이 프로필',
  '/login': '로그인'
}

function AppHeader() {
  const location = useLocation()
  const title = pageTitleMap[location.pathname]

  return (
    <header className="app-header">
      <Link to="/" className="logo">
        <img src={logo} alt="Bandiary 로고" />
      </Link>

      {title && <h1 className="page-title">{title}</h1>}

      <button className="icon-button" type="button" aria-label="알림">
        🔔
      </button>
    </header>
  )
}

export default AppHeader