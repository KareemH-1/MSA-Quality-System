import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, MoveRight, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import api from '../api/axios'
import LoginNavbar from '../components/login_components/LoginNavbar'
import InfoPanel from '../components/login_components/InfoPanel'
import '../styles/Login.css'

const MotionDiv = motion.div
const MotionButton = motion.button
const MotionForm = motion.form

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState([])
  const [tokenVerified, setTokenVerified] = useState(false)
  const [tokenVerifying, setTokenVerifying] = useState(true)
  const [tokenError, setTokenError] = useState('')

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      setTokenError('Invalid reset link - no token provided')
      setTokenVerifying(false)
    } else {
      setToken(tokenParam)
      verifyToken(tokenParam)
    }
  }, [searchParams, navigate])

  const verifyToken = async (tokenParam) => {
    try {
      const response = await api.post('/View/AuthView.php?action=verify-token', {
        token: tokenParam,
      })

      if (response.data.status === 'success') {
        setTokenVerified(true)
      } else {
        setTokenError(response.data.message || 'This password reset link is invalid or has expired.')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'This password reset link is invalid or has expired. Please request a new one.'
      setTokenError(errorMessage)
    } finally {
      setTokenVerifying(false)
    }
  }

  const hasUppercase = (str) => {
    for (let i = 0; i < str.length; i++) {
      if (str[i] === str[i].toUpperCase() && str[i] !== str[i].toLowerCase()) {
        return true
      }
    }
    return false
  }

  const hasLowercase = (str) => {
    for (let i = 0; i < str.length; i++) {
      if (str[i] === str[i].toLowerCase() && str[i] !== str[i].toUpperCase()) {
        return true
      }
    }
    return false
  }

  const hasDigit = (str) => {
    for (let i = 0; i < str.length; i++) {
      if (str[i] >= '0' && str[i] <= '9') {
        return true
      }
    }
    return false
  }

  const hasSpecialChar = (str) => {
    const specialChars = '!@#$%^&*()_+-=[]{};\':\",./<>?\\|`~'
    for (let i = 0; i < str.length; i++) {
      if (specialChars.includes(str[i])) {
        return true
      }
    }
    return false
  }

  const validatePassword = (pwd) => {
    const errors = []
    
    if (!pwd) {
      return ['Password is required']
    }

    if (pwd.length < 8) {
      errors.push('At least 8 characters')
    }
    if (!hasUppercase(pwd)) {
      errors.push('One uppercase letter (A-Z)')
    }
    if (!hasLowercase(pwd)) {
      errors.push('One lowercase letter (a-z)')
    }
    if (!hasDigit(pwd)) {
      errors.push('One number (0-9)')
    }
    if (!hasSpecialChar(pwd)) {
      errors.push('One special character (!@#$%^&* etc.)')
    }

    return errors
  }

  const handlePasswordChange = (e) => {
    const pwd = e.target.value
    setPassword(pwd)
    if (pwd) {
      setPasswordErrors(validatePassword(pwd))
    } else {
      setPasswordErrors([])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    const errors = validatePassword(password)
    if (errors.length > 0) {
      toast.error('Password does not meet requirements')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const response = await api.post('/View/AuthView.php?action=reset-password', {
        token,
        password,
        confirmPassword,
      })

      if (response.data.status === 'success') {
        setIsSuccess(true)
        toast.success('Password reset successfully')
        setTimeout(() => {
          navigate('/', { replace: true })
        }, 3000)
      } else {
        toast.error(response.data.message || 'Failed to reset password')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'An error occurred'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    navigate('/', { replace: true })
  }

  if (tokenVerifying) {
    return (
      <div className="login-page">
        <LoginNavbar />
        <div className="login-container">
          <InfoPanel />
          <MotionDiv
            className="login-panel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <MotionDiv
              className="Header"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid #e5e7eb',
                  borderTop: '3px solid #1e3a5f',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
              </div>
              <h1>Verifying your link...</h1>
            </MotionDiv>
          </MotionDiv>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (tokenError) {
    return (
      <div className="login-page">
        <LoginNavbar />
        <div className="login-container">
          <InfoPanel />
          <MotionDiv
            className="login-panel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <MotionDiv
              className="Header"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
              <h1>Reset Link Expired or Invalid</h1>
              <p>The password reset link is no longer valid</p>
            </MotionDiv>

            <MotionDiv
              className="error-message"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              style={{
                textAlign: 'center',
                padding: '1.5rem',
                backgroundColor: '#fee2e2',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                color: '#991b1b',
                fontSize: '0.95rem',
                lineHeight: '1.6',
              }}
            >
              <p>{tokenError}</p>
            </MotionDiv>

            <MotionButton
              onClick={() => navigate('/forget-password', { replace: true })}
              whileTap={{ scale: 0.99 }}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                marginBottom: '0.75rem',
                cursor: 'pointer',
              }}
            >
              Request New Reset Link
            </MotionButton>

            <button
              type="button"
              className="back-to-login"
              onClick={handleBackToLogin}
            >
              <ArrowLeft />
              Back to login
            </button>
          </MotionDiv>
        </div>
      </div>
    )
  }

  if (!tokenVerified) {
    return null
  }

  if (isSuccess) {
    return (
      <div className="login-page">
        <LoginNavbar />
        <div className="login-container">
          <InfoPanel />
          <MotionDiv
            className="login-panel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <MotionDiv
              className="Header"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '1rem' }} />
              <h1>Password Reset Successful</h1>
              <p>Your password has been updated</p>
            </MotionDiv>

            <MotionDiv
              className="success-message"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              style={{ textAlign: 'center', padding: '1.5rem 0' }}
            >
              <p>You will be redirected to the login page shortly.</p>
            </MotionDiv>

            <MotionButton
              onClick={handleBackToLogin}
              whileTap={{ scale: 0.99 }}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                marginTop: '1rem',
                cursor: 'pointer',
              }}
            >
              Back to Login
            </MotionButton>
          </MotionDiv>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <LoginNavbar />
      <div className="login-container">
        <InfoPanel />
        <MotionDiv
          className="login-panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <MotionDiv
            className="Header"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1>Create New Password</h1>
            <p>Enter your new password</p>
          </MotionDiv>

          <MotionForm
            className="forgot-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <p className="forgot-description">
              Your password must be at least 8 characters and contain uppercase, lowercase, numbers, and special characters.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="password">New Password</label>
              <div className="input-group">
                <div className="input-icon">
                  <Lock />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 0.75rem',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordErrors.length > 0 && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444' }}>
                  <p style={{ margin: '0.25rem 0' }}>Password must have:</p>
                  <ul style={{ margin: '0.25rem 0 0 1.25rem', paddingLeft: 0 }}>
                    {passwordErrors.map((error, idx) => (
                      <li key={idx} style={{ margin: '0.125rem 0' }}>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="confirm-password">Confirm Password</label>
              <div className="input-group">
                <div className="input-icon">
                  <Lock />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirm-password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 0.75rem',
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444' }}>
                  Passwords do not match
                </div>
              )}
            </div>

            <MotionDiv className="submit-div" whileHover={{ y: -1 }} whileTap={{ y: 0 }}>
              <MotionButton type="submit" whileTap={{ scale: 0.99 }} disabled={isLoading || passwordErrors.length > 0}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </MotionButton>
              <MoveRight />
            </MotionDiv>

            <button
              type="button"
              className="back-to-login"
              onClick={handleBackToLogin}
              disabled={isLoading}
            >
              <ArrowLeft />
              Back to login
            </button>
          </MotionForm>
        </MotionDiv>
      </div>
    </div>
  )
}

export default ResetPassword

