import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginNavbar from '../components/login_components/LoginNavbar'
import '../../src/styles/Login.css'
import LoginForm from '../components/login_components/LoginForm'
import InfoPanel from '../components/login_components/InfoPanel'
import ForgetPasswordForm from '../components/login_components/ForgetPasswordForm'
import { useAuth } from '../services/AuthContext'
import { getDefaultPageForRole } from '../services/pagesConfig'
import Loader from '../components/Loader'

const Login = () => {
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const navigate = useNavigate()
  const { user, authReady } = useAuth()

  useEffect(() => {
    if (authReady && user?.role) {
      const defaultPage = getDefaultPageForRole(user.role)
      navigate(defaultPage, { replace: true })
    }
  }, [authReady, user, navigate])

  if (!authReady) {
    return <Loader />
  }

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
