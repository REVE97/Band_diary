import { useLocation } from 'react-router-dom'

import Header from './AppHeader'
import BottomNav from './BottomNav'

function MobileLayout({ children }) {
  const location = useLocation()

  const isLoginPage = location.pathname === '/login' || location.pathname === '/signup'

  return (
    <div className="app-root">
      <div className="mobile-shell">
        {!isLoginPage && <Header />}

        <main className={isLoginPage ? 'page-content login-only' : 'page-content'}>
          {children}
        </main>

        {!isLoginPage && <BottomNav />}
      </div>
    </div>
  )
}

export default MobileLayout