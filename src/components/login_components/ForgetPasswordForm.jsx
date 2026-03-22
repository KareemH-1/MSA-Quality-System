import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, MoveRight } from 'lucide-react'

const MotionDiv = motion.div
const MotionButton = motion.button
const MotionForm = motion.form

const ForgetPasswordForm = ({ onBackToLogin }) => {
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

      <MotionForm className="forgot-form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
        <p className="forgot-description">
          Enter your university email and we will send password reset instructions.
        </p>

        <label htmlFor="reset-email">University Email</label>
        <div className="input-group">
          <div className="input-icon">
            <Mail />
          </div>
          <input type="email" id="reset-email" placeholder="University Email" required />
        </div>

        <MotionDiv className="submit-div" whileHover={{ y: -1 }} whileTap={{ y: 0 }}>
          <MotionButton type="submit" whileTap={{ scale: 0.99 }}>Send Reset Link</MotionButton>
          <MoveRight />
        </MotionDiv>

        <button type="button" className="back-to-login" onClick={onBackToLogin}>
          <ArrowLeft />
          Back to login
        </button>
      </MotionForm>
    </MotionDiv>
  )
}

export default ForgetPasswordForm
