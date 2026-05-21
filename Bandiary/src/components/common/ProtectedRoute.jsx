import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children }) {
  const loginUser = sessionStorage.getItem('bandiaryLoginUser')

  if (!loginUser) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute