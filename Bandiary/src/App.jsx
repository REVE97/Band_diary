import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MobileLayout from './components/layout/MobileLayout'

import HomePage from './pages/HomePage'
import PlacePage from './pages/PlacePage'
import PracticePage from './pages/PracticePage'
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
          <Route path="/place" element={<PlacePage />} />
          <Route path="/practice" element={<PracticePage />} />
        </Routes>
      </MobileLayout>
    </BrowserRouter>
  )
}

export default App