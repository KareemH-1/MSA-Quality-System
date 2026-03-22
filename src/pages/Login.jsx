import React, { useState } from 'react'
import LoginNavbar from '../components/login_components/LoginNavbar'
import '../../src/styles/Login.css'
import LoginForm from '../components/login_components/LoginForm'
import InfoPanel from '../components/login_components/InfoPanel'
import ForgetPasswordForm from '../components/login_components/ForgetPasswordForm'
const Login = () => {
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  let visibleForm = <LoginForm onForgotPassword={() => setShowForgotPassword(true)} />

  if (showForgotPassword) {
    visibleForm = <ForgetPasswordForm onBackToLogin={() => setShowForgotPassword(false)} />
  }

  return (
    <div className="login-page">
      <LoginNavbar />
      <div className="login-container">
        <InfoPanel />
        {visibleForm}
      </div>
    </div>
  )
}

export default Login
