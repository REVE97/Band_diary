import { Link } from 'react-router-dom'
import logo from '../../assets/images/logo.svg'
import bell from '../../assets/images/bell.svg'

function AppHeader() {
  return (
    <header className="app-header">
      <Link to="/" className="logo">
        <img src={logo} alt="Bandiary 로고" aria-label="로고" />
      </Link>

      <button className="icon-button" type="button" aria-label="알림">
        <img src={bell} />
      </button>
    </header>
  )
}

export default AppHeader