import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MobileLayout from './components/layout/MobileLayout'

import HomePage from './pages/HomePage'
import RecruitPage from './pages/RecruitPage'
import StudioPage from './pages/StudioPage'
import ChartPage from './pages/ChartPage'
import SchedulePage from './pages/SchedulePage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'

import './App.css'

function App() {
  return (
    <BrowserRouter>
      <MobileLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recruit" element={<RecruitPage />} />
          <Route path="/studio" element={<StudioPage />} />
          <Route path="/chart" element={<ChartPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MobileLayout>
    </BrowserRouter>
  )
}

export default App