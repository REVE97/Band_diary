import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { loginInfo } from '../mocks/userMock'

function LoginPage() {
  const navigate = useNavigate()

  const [loginForm, setLoginForm] = useState({
    userId: '',
    password: '',
  })

  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const savedUser = localStorage.getItem('bandiaryUser')

    if (!savedUser) {
      localStorage.setItem('bandiaryUser', JSON.stringify(loginInfo))
    }
  }, [])

  const handleInputChange = (event) => {
    const { name, value } = event.target

    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    setErrorMessage('')
  }

  const handleLogin = () => {
    const { userId, password } = loginForm

    if (!userId.trim() || !password.trim()) {
      setErrorMessage('아이디와 비밀번호를 모두 입력해주세요.')
      return
    }

    const savedUser = localStorage.getItem('bandiaryUser')

    if (!savedUser) {
      setErrorMessage('저장된 사용자 정보가 없습니다.')
      return
    }

    const parsedUser = JSON.parse(savedUser)

    const isMatched =
      parsedUser.userId === userId && parsedUser.password === password

    if (!isMatched) {
      setErrorMessage('아이디 또는 비밀번호가 일치하지 않습니다.')
      return
    }

    localStorage.setItem(
      'bandiaryLoginUser',
      JSON.stringify({
        userId: parsedUser.userId,
        nickname: parsedUser.nickname,
        isLoggedIn: true,
      })
    )

    localStorage.removeItem('bandiaryUser')

    navigate('/home')
  }

  return (
    <div className="page login-page">
      <div className="login-card">
        <h1>Bandiary</h1>
        <p>밴드를 위한 다이어리 서비스</p>

        <div className="login-form">
          <input
            type="text"
            name="userId"
            value={loginForm.userId}
            placeholder="아이디"
            onChange={handleInputChange}
          />

          <input
            type="password"
            name="password"
            value={loginForm.password}
            placeholder="비밀번호"
            onChange={handleInputChange}
          />
        </div>

        {errorMessage && <p className="login-error">{errorMessage}</p>}

        <button
          type="button"
          className="primary-button"
          onClick={handleLogin}
        >
          시작하기
        </button>
      </div>
    </div>
  )
}

export default LoginPage