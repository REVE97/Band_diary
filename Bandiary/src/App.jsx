import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MobileLayout from './components/layout/MobileLayout'

import HomePage from './pages/HomePage'
import PlacePage from './pages/PlacePage'
import PracticePage from './pages/PracticePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

import ProtectedRoute from './components/common/ProtectedRoute'

import './App.css'

function App() {
  return (
    <BrowserRouter>
      <MobileLayout>
        <Routes>
          <Route path='/' element={<Navigate to="/login" replace />}></Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/home" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
            } />
          <Route path="/place" element={
            <ProtectedRoute>
              <PlacePage />
            </ProtectedRoute>
            } />
          <Route path="/practice" element={
            <ProtectedRoute>
              <PracticePage />
            </ProtectedRoute>
            } />
        </Routes>
      </MobileLayout>
    </BrowserRouter>
  )
}

export default App