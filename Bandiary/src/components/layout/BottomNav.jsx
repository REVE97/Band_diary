import { NavLink } from 'react-router-dom'

import StudioIcon from '../../assets/images/bandroom.svg'
import DiaryIcon from '../../assets/images/diary.svg'
import SongIcon from '../../assets/images/song.svg'
import ScheduleIcon from '../../assets/images/calendar.svg'
import NoticeIcon from '../../assets/images/notice-renewal.svg'
import styles from './BottomNav.module.css'

const navItems = [
  {
    path: '/place',
    label: 'Place',
    icon: StudioIcon
  },
  {
    path: '/musicsheet',
    label: 'Musicsheet',
    icon: SongIcon
  },
  {
    path: '/home',
    label: 'Home',
    icon: DiaryIcon
  },
  {
    path: '/schedule',
    label: 'Schedule',
    icon: ScheduleIcon
  },
  {
    path: '/notice',
    label: 'Notice',
    icon: NoticeIcon
  }
]

function BottomNav() {
  return (
    <nav className={styles.nav}>
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `${styles.item} ${isActive ? styles.active : ''}`
          }
        >
          <span className={styles.icon}>
            <img src={item.icon} alt="" />
          </span>
          
          <span className={styles.label}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default BottomNav
