import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import logo from '../assets/images/logo.svg'

import supabase from '../api/supabase'
import styles from './SignupPage.module.css'

function SignupPage() {
  const navigate = useNavigate()

  const [signupForm, setSignupForm] = useState({
    userId: '',
    password: '',
    name: '',
  })

  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (event) => {
    const { name, value } = event.target

    setSignupForm((prev) => ({
      ...prev,
      [name]: value,
    }))

    setErrorMessage('')
    setSuccessMessage('')
  }

  const handleSignup = async () => {
    const trimmedUserId = signupForm.userId.trim()
    const trimmedPassword = signupForm.password.trim()
    const trimmedName = signupForm.name.trim()

    if (!trimmedUserId || !trimmedPassword || !trimmedName) {
      setErrorMessage('아이디, 비밀번호, 이름을 모두 입력해주세요.')
      return
    }

    if (Number.isNaN(Number(trimmedPassword))) {
      setErrorMessage('비밀번호는 숫자로 입력해주세요.')
      return
    }

    setIsLoading(true)

    const { error } = await supabase.from('users').insert([
      {
        userId: trimmedUserId,
        password: Number(trimmedPassword),
        name: trimmedName,
      },
    ])

    if (error) {
      console.error(error)

      if (error.code === '23505') {
        setErrorMessage('이미 사용 중인 아이디입니다.')
      } else {
        setErrorMessage('회원가입에 실패했습니다. 다시 시도해주세요.')
      }

      setIsLoading(false)
      return
    }

    setSuccessMessage('회원가입이 완료되었습니다.')

    setTimeout(() => {
      navigate('/')
    }, 700)
  }

  const goLogin = () => {
    navigate('/')
  }

  return (
    <div className={`${styles.page} ${styles.loginPage}`}>
      <div className={styles.loginCard}>
        <img src={logo} alt="Bandiary" className={styles.loginLogo} />
        <p>회원 정보를 입력해주세요</p>

        <div className={styles.loginForm}>
          <input
            type="text"
            name="userId"
            value={signupForm.userId}
            placeholder="아이디"
            onChange={handleInputChange}
          />

          <input
            type="password"
            name="password"
            value={signupForm.password}
            placeholder="비밀번호"
            onChange={handleInputChange}
          />

          <input
            type="text"
            name="name"
            value={signupForm.name}
            placeholder="이름"
            onChange={handleInputChange}
          />
        </div>

        {errorMessage && <p className={styles.loginError}>{errorMessage}</p>}
        {successMessage && <p className={styles.signupSuccess}>{successMessage}</p>}

        <button
          type="button"
          className={styles.primaryButton}
          onClick={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? '가입 중...' : '회원가입'}
        </button>

        <button
          type="button"
          className={styles.secondaryButton + " " + styles.signupLinkButton}
          onClick={goLogin}
        >
          로그인으로 돌아가기
        </button>
      </div>
    </div>
  )
}

export default SignupPage
