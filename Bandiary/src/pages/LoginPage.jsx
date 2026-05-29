import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import logo from '../assets/images/logo.svg'

import supabase from '../api/supabase'

function LoginPage() {
  const navigate = useNavigate()

  // 사용자 입력 데이터 상태값
  const [loginForm, setLoginForm] = useState({
    userId: '',
    password: '',
  })

  const [errorMessage, setErrorMessage] = useState('')
  const [users, setUsers] = useState([])

  // users 테이블 데이터 조회
  const getUsers = async () => {
    const { data, error } = await supabase.from('users').select('*')

    if (error) {
      console.error(error)
      setErrorMessage('사용자 정보를 불러오지 못했습니다.')
      return
    }

    setUsers(data)
  }

  useEffect(() => {
    getUsers()
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

    if (Number.isNaN(Number(password))) {
      setErrorMessage('비밀번호는 숫자로 입력해주세요.')
      return
    }

    const matchedUser = users.find(
      (user) =>
        user.userId === userId.trim() &&
        user.password === Number(password)
    )

    if (!matchedUser) {
      setErrorMessage('아이디 또는 비밀번호가 일치하지 않습니다.')
      return
    }

    sessionStorage.setItem(
      'bandiaryLoginUser',
      JSON.stringify({
        id: matchedUser.id,
        userId: matchedUser.userId,
        name: matchedUser.name,
        isLoggedIn: true,
      })
    )

    navigate('/home')
  }

  const goSignup = () => {
    navigate('/signup')
  }

  return (
    <div className="page login-page">
      <div className="login-card">
        <img src={logo} alt="Bandiary" className="login-logo" />
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
          로그인
        </button>

        <button
          type="button"
          className="secondary-button signup-link-button"
          onClick={goSignup}
          disabled // 임시막기
        >
          회원가입
        </button>
      </div>
    </div>
  )
}

export default LoginPage