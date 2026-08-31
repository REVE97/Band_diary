import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MobileLayout from './components/layout/MobileLayout'
import ToastProvider from './components/common/ToastProvider'

import HomePage from './pages/HomePage'
import PlacePage from './pages/PlacePage'
import MusicsheetPage from './pages/MusicsheetPage'
import LoginPage from './pages/LoginPage'
import SchedulePage from './pages/SchedulePage'
import NoticePage from './pages/NoticePage'

import ProtectedRoute from './components/common/ProtectedRoute'

import './App.css'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <MobileLayout>
          <Routes>
          <Route path='/' element={<Navigate to="/login" replace />}></Route>
          <Route path="/login" element={<LoginPage />} />
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
          <Route path="/musicsheet" element={
            <ProtectedRoute>
              <MusicsheetPage />
            </ProtectedRoute>
            } />
          <Route path="/schedule" element={
            <ProtectedRoute>
              <SchedulePage />
            </ProtectedRoute>
            } />
            <Route path="/notice" element={
            <ProtectedRoute>
              <NoticePage />
            </ProtectedRoute>
            } />
          </Routes>
        </MobileLayout>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
