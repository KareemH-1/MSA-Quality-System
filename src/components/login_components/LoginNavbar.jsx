import React from 'react'
import { Link } from 'react-router-dom'
import Logo from '../../assets/MSA_Logo.png'
const LoginNavbar = () => {
  return (
    <nav className="login-navbar">
      <div className="logo">
        <img src={Logo} alt="MSA University Logo" className="logo-image" />
        <h1>MSA Quality System</h1>
      </div>
      
      <Link to="/contact" className="support-link">Support</Link>
    </nav>
  )
}

export default LoginNavbar
