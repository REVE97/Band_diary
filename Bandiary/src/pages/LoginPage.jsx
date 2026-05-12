import { useNavigate } from "react-router-dom"

function LoginPage() {
  const navigate = useNavigate();
  
  const goHome = () => {
    navigate("/home")
  }

  return (
    <div className="page login-page">
      <div className="login-card">
        <h1>Bandiary</h1>
        <p>밴드를 위한 다이어리 서비스</p>

        <button 
          type="button" 
          className="primary-button"
          onClick={goHome}>
          시작하기
        </button>
      </div>
    </div>
  )
}

export default LoginPage