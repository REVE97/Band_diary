// import { NavLink } from 'react-router-dom'

// import StudioIcon from '../../assets/images/bandroom.svg'
// import DiaryIcon from '../../assets/images/diary.svg'
// import SongIcon from '../../assets/images/song.svg'

// const navItems = [
//   {
//     path: '/place',
//     label: 'Place',
//     icon: StudioIcon
//   },
//    {
//     path: '/home',
//     label: 'Home',
//     icon: DiaryIcon
//   },
//   {
//     path: '/practice',
//     label: 'Practice',
//     icon: SongIcon
//   }
// ]

// function BottomNav() {
//   return (
//     <nav className="bottom-nav">
//       {navItems.map((item) => (
//         <NavLink
//           key={item.path}
//           to={item.path}
//           className={({ isActive }) =>
//             isActive ? 'bottom-nav-item active' : 'bottom-nav-item'
//           }
//         >
//           <span className="bottom-nav-icon">
//             <img src={item.icon} />
//           </span>
          
//           <span className="bottom-nav-label">{item.label}</span>
//         </NavLink>
//       ))}
//     </nav>
//   )
// }

// export default BottomNav


// 임시 Practice 이동 막기용 코드 -> 추후 수정 예정
import { NavLink, useNavigate } from 'react-router-dom'

import StudioIcon from '../../assets/images/bandroom.svg'
import DiaryIcon from '../../assets/images/diary.svg'
import SongIcon from '../../assets/images/song.svg'

const navItems = [
  {
    path: '/place',
    label: 'Place',
    icon: StudioIcon,
  },
  {
    path: '/home',
    label: 'Home',
    icon: DiaryIcon,
  },
  {
    path: '/practice',
    label: 'Practice',
    icon: SongIcon,
  },
]

function BottomNav() {
  const navigate = useNavigate()

  const storageInfo = JSON.parse(sessionStorage.getItem('bandiaryLoginUser'))

  const handleNavClick = (event, item) => {
    if (item.path !== '/practice') return

    if (storageInfo?.userId === 'admin') {
      return
    }

    event.preventDefault()
    alert('테스트 중인 페이지로 관리자만 접근할 수 있습니다.')
    navigate('/home')
  }

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            isActive ? 'bottom-nav-item active' : 'bottom-nav-item'
          }
          onClick={(event) => handleNavClick(event, item)}
        >
          <span className="bottom-nav-icon">
            <img src={item.icon} alt={`${item.label} 아이콘`} />
          </span>

          <span className="bottom-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default BottomNav