import { NavLink } from 'react-router-dom'

const navItems = [
  {
    path: '/',
    label: '홈',
    icon: '⌂'
  },
  {
    path: '/recruit',
    label: '모집',
    icon: '🎸'
  },
  {
    path: '/studio',
    label: '합주실',
    icon: '🔗'
  },
  {
    path: '/chart',
    label: '차트',
    icon: '♬'
  },
  {
    path: '/profile',
    label: '마이',
    icon: '👤'
  }
]

function BottomNav() {
  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            isActive ? 'bottom-nav-item active' : 'bottom-nav-item'
          }
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          <span className="bottom-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default BottomNav