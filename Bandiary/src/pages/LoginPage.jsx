import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import logo from '../assets/images/logo.svg'
import clearIcon from '../assets/images/clear_input.svg'

import supabase from '../api/supabase'

function LoginPage() {
  const navigate = useNavigate()

  const userIdInputRef = useRef(null)
  const passwordInputRef = useRef(null)

  // 사용자 입력 데이터 상태값
  const [loginForm, setLoginForm] = useState({
    loginUserId: '',
    loginPassword: '',
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

  // 입력값 초기화
  const handleClearInput = (name, inputRef) => {
    setLoginForm((prev) => ({
      ...prev,
      [name]: '',
    }))

    setErrorMessage('')

    // X 버튼 클릭 후에도 input 포커스를 유지
    // 미러링 환경에서 placeholder/입력 이벤트가 섞이는 현상을 줄이기 위함
    requestAnimationFrame(() => {
      if (!inputRef.current) return

      inputRef.current.focus()

      try {
        inputRef.current.setSelectionRange(0, 0)
      } catch {
      }
    })
  }

  const handleLogin = () => {
    const { loginUserId, loginPassword } = loginForm

    if (!loginUserId.trim() || !loginPassword.trim()) {
      setErrorMessage('아이디와 비밀번호를 모두 입력해주세요.')
      return
    }

    if (Number.isNaN(Number(loginPassword))) {
      setErrorMessage('비밀번호는 숫자로 입력해주세요.')
      return
    }

    const matchedUser = users.find(
      (user) =>
        user.userId === loginUserId.trim() &&
        user.password === Number(loginPassword)
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

  const naviBlock = () => {
    alert('관리자에게 문의해주세요.')
  }

  return (
    <div className="page login-page">
      <div className="login-card">
        <img src={logo} alt="Bandiary" className="login-logo" />
        <p>밴드를 위한 다이어리 서비스</p>

        <div className="login-form">
          <div className="login-input-wrap">
            <input
              ref={userIdInputRef}
              type="text"
              name="loginUserId"
              value={loginForm.loginUserId}
              onChange={handleInputChange}
              aria-label="아이디"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
            />

            {!loginForm.loginUserId && (
              <span className="login-input-placeholder">아이디</span>
            )}

            {loginForm.loginUserId && (
              <button
                type="button"
                className="login-clear-button"
                tabIndex={-1}
                onPointerDown={(event) => {
                  event.preventDefault()
                  handleClearInput('loginUserId', userIdInputRef)
                }}
                aria-label="아이디 입력값 지우기"
              >
                <img src={clearIcon} alt="" />
              </button>
            )}
          </div>

          <div className="login-input-wrap">
            <input
              ref={passwordInputRef}
              type="password"
              name="loginPassword"
              value={loginForm.loginPassword}
              onChange={handleInputChange}
              aria-label="비밀번호"
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
            />

            {!loginForm.loginPassword && (
              <span className="login-input-placeholder">비밀번호</span>
            )}

            {loginForm.loginPassword && (
              <button
                type="button"
                className="login-clear-button"
                tabIndex={-1}
                onPointerDown={(event) => {
                  event.preventDefault()
                  handleClearInput('loginPassword', passwordInputRef)
                }}
                aria-label="비밀번호 입력값 지우기"
              >
                <img src={clearIcon} alt="" />
              </button>
            )}
          </div>
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
          onClick={naviBlock}
        >
          회원가입
        </button>
      </div>
    </div>
  )
}

export default LoginPage