import AppHeader from './AppHeader'
import BottomNav from './BottomNav'

function MobileLayout({ children }) {
  return (
    <div className="app-root">
      <div className="mobile-shell">
        <AppHeader />

        <main className="page-content">
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  )
}

export default MobileLayout