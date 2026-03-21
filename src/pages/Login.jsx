import React from 'react'
import LoginNavbar from '../components/login_components/LoginNavbar'
import '../../src/styles/Login.css'
import LoginForm from '../components/login_components/LoginForm'
import InfoPanel from '../components/login_components/InfoPanel'
const Login = () => {
  return (
    <div className="login-page">
      <LoginNavbar />
      <div className="login-container">
        <InfoPanel />
        
        <LoginForm />
      </div>
    </div>
  )
}

export default Login
