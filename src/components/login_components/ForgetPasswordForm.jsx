import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, MoveRight } from 'lucide-react'
import { toast } from 'react-toastify'
import api from '../../api/axios'

const MotionDiv = motion.div
const MotionButton = motion.button
const MotionForm = motion.form

const ForgetPasswordForm = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email.trim()) {
      toast.error('Please enter your email')
      return
    }

    setIsLoading(true)
    try {
      const response = await api.post('/View/AuthView.php?action=forget-password', { email })
      
      console.log('Response:', response.data)
      
      if (response.data.status === 'success') {
        toast.success('Reset link sent to your email. Please check your inbox.')
        setEmail('')
        setTimeout(() => onBackToLogin(), 2000)
      } else {
        const errorMsg = response.data.message || 'Failed to send reset link'
        console.error('Error response:', errorMsg)
        toast.error(errorMsg)
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'An error occurred'
      console.error('Error:', error.response?.data || error)
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <MotionDiv
      className="login-panel"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <MotionDiv className="Header" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1>Reset Password</h1>
        <p>Get back to your account</p>
      </MotionDiv>

      <MotionForm className="forgot-form" onSubmit={handleSubmit} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
        <p className="forgot-description">
          Enter your university email and we will send password reset instructions.
        </p>

        <label htmlFor="reset-email">University Email</label>
        <div className="input-group">
          <div className="input-icon">
            <Mail />
          </div>
          <input 
            type="email" 
            id="reset-email" 
            placeholder="University Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
            disabled={isLoading}
          />
        </div>

        <MotionDiv className="submit-div" whileHover={{ y: -1 }} whileTap={{ y: 0 }}>
          <MotionButton type="submit" whileTap={{ scale: 0.99 }} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </MotionButton>
          <MoveRight />
        </MotionDiv>

        <button type="button" className="back-to-login" onClick={onBackToLogin} disabled={isLoading}>
          <ArrowLeft />
          Back to login
        </button>
      </MotionForm>
    </MotionDiv>
  )
}

export default ForgetPasswordForm
