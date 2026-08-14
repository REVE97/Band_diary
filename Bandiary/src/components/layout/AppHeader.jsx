import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import logo from '../../assets/images/logo.svg'
import logoutIcon from '../../assets/images/logout.svg'

import LogoutConfirmModal from './modal/LogoutConfirmModal'
import styles from './AppHeader.module.css'

function AppHeader() {
  const navigate = useNavigate()

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)

  // 로그아웃 아이콘을 눌렀을 때 확인 모달 열기
  const openLogoutModal = () => {
    setIsLogoutModalOpen(true)
  }

  // 취소 버튼 또는 모달 배경을 눌렀을 때 모달 닫기
  const closeLogoutModal = () => {
    setIsLogoutModalOpen(false)
  }

  // 확인 버튼을 눌렀을 때 실제 로그아웃 처리
  const logout = () => {
    sessionStorage.removeItem('bandiaryLoginUser')

    setIsLogoutModalOpen(false)

    navigate('/login', {
      replace: true,
    })
  }

  return (
    <>
      <header className={styles.header}>
        <Link to="/home" className={styles.logo}>
          <img
            src={logo}
            alt="Bandiary 로고"
            aria-label="로고"
          />
        </Link>

        <button
          className={styles.logoutButton}
          type="button"
          aria-label="로그아웃 기능"
          onClick={openLogoutModal}
        >
          <img src={logoutIcon} alt="" />
        </button>
      </header>

      {isLogoutModalOpen && (
        <LogoutConfirmModal
          onClose={closeLogoutModal}
          onConfirm={logout}
        />
      )}
    </>
  )
}

export default AppHeader
