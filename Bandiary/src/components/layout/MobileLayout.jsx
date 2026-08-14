import { useLocation } from 'react-router-dom'

import Header from './AppHeader'
import BottomNav from './BottomNav'
import styles from './MobileLayout.module.css'

function MobileLayout({ children }) {
  const location = useLocation()

  const isLoginPage = location.pathname === '/login' || location.pathname === '/signup'

  return (
    <div className={styles.appRoot}>
      <div className={styles.mobileShell}>
        {!isLoginPage && <Header />}

        <main
          className={`${styles.pageContent} ${isLoginPage ? styles.loginOnly : ''}`}
        >
          {children}
        </main>

        {!isLoginPage && <BottomNav />}
      </div>
    </div>
  )
}

export default MobileLayout
