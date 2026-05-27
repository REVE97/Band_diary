import { Link, useNavigate } from 'react-router-dom'
import logo from '../../assets/images/logo.svg'

function AppHeader() {
  const navigate = useNavigate();

  const logout = () => {
    sessionStorage.removeItem('bandiaryLoginUser');
    navigate('/login');
  }

  return (
    <header className="app-header">
      <Link to="/home" className="logo">
        <img src={logo} alt="Bandiary 로고" aria-label="로고" />
      </Link>

      <button 
        className="primary-small-button logout-button"
        type="button" 
        aria-label="로그아웃"
        onClick={logout}>
        Logout
      </button>
    </header>
  )
}

export default AppHeader