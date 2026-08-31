import { NavLink } from 'react-router-dom'

import homeIcon from '../../assets/images/bottom-nav-home.svg'
import musicsheetIcon from '../../assets/images/bottom-nav-musicsheet.svg'
import noticeIcon from '../../assets/images/bottom-nav-notice.svg'
import placeIcon from '../../assets/images/bottom-nav-place.svg'
import scheduleIcon from '../../assets/images/bottom-nav-schedule.svg'
import styles from './BottomNav.module.css'

const navItems = [
  {
    path: '/place',
    label: 'Place',
    icon: placeIcon,
  },
  {
    path: '/musicsheet',
    label: 'Musicsheet',
    icon: musicsheetIcon,
  },
  {
    path: '/home',
    label: 'Home',
    icon: homeIcon,
  },
  {
    path: '/schedule',
    label: 'Schedule',
    icon: scheduleIcon,
  },
  {
    path: '/notice',
    label: 'Notice',
    icon: noticeIcon,
  },
]

function BottomNav() {
  return (
    <nav className={styles.nav}>
      {navItems.map((item) => {
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.active : ''}`
            }
          >
            <span
              className={styles.icon}
              style={{ '--nav-icon': `url("${item.icon}")` }}
              aria-hidden="true"
            />

            <span className={styles.label}>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

export default BottomNav
