import { NavLink } from 'react-router-dom'

import StudioIcon from '../../assets/images/bandroom.svg'
import DiaryIcon from '../../assets/images/diary.svg'
import SongIcon from '../../assets/images/song.svg'

const navItems = [
  {
    path: '/studio',
    label: 'Studio',
    icon: StudioIcon
  },
   {
    path: '/home',
    label: 'Home',
    icon: DiaryIcon
  },
  {
    path: '/profile',
    label: 'Practice',
    icon: SongIcon
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
          <span className="bottom-nav-icon">
            <img src={item.icon} />
          </span>
          
          <span className="bottom-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default BottomNav