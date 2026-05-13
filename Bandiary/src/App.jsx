import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MobileLayout from './components/layout/MobileLayout'

import HomePage from './pages/HomePage'
import StudioPage from './pages/StudioPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'

import './App.css'

function App() {
  return (
    <BrowserRouter>
      <MobileLayout>
        <Routes>
          <Route path='/' element={<Navigate to="/login" replace />}></Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/studio" element={<StudioPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </MobileLayout>
    </BrowserRouter>
  )
}

export default App