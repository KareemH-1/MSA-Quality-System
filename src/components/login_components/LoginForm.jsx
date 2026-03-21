import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock , MoveRight} from 'lucide-react'
import { Link } from 'react-router-dom'

const containerVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: 'easeOut',
      when: 'beforeChildren',
      staggerChildren: 0.08
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
}

const MotionDiv = motion.div
const MotionButton = motion.button
const MotionForm = motion.form

const LoginForm = () => {
  const [currentRole, setCurrentRole] = useState('staff')

  return (
    <MotionDiv
      className="login-panel"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
          <MotionDiv className="Header" variants={itemVariants}>
            <h1>Portal Access</h1>
            <p>Login to your account</p>
          </MotionDiv>
          <MotionDiv className="Portal-Options" variants={itemVariants}>
            <MotionButton
              type="button"
              className={`staff-btn btn ${currentRole === 'staff' ? 'is-active' : ''}`}
              onClick={() => setCurrentRole('staff')}
              whileTap={{ scale: 0.98 }}
            >
              Staff Login
            </MotionButton>
            <MotionButton
              type="button"
              className={`student-btn btn ${currentRole === 'student' ? 'is-active' : ''}`}
              onClick={() => setCurrentRole('student')}
              whileTap={{ scale: 0.98 }}
            >
              Student Login
            </MotionButton>
          </MotionDiv>
          <MotionForm variants={itemVariants}>
            <label htmlFor="username">University Email</label>
            
            <MotionDiv className="input-group" whileFocus={{ scale: 1.01 }}>
                <div className="input-icon">
                    @
                </div>
                <input type="email" id="username" placeholder="University Email" required />
            </MotionDiv>
            <label htmlFor="password">Password</label>
            
            <MotionDiv className="input-group" whileFocus={{ scale: 1.01 }}>
                <div className="input-icon">
                    <Lock />
                </div>
                <input type="password" id="password" placeholder="Password" required />
            </MotionDiv>

            <div className="form-links">
              <Link to="/forgot-password" className="forgot-password">Forgot password?</Link>
            </div>
            <MotionDiv className="submit-div" whileHover={{ y: -1 }} whileTap={{ y: 0 }}>
              <MotionButton type="submit" whileTap={{ scale: 0.99 }}>Sign In</MotionButton>
                <MoveRight />
            </MotionDiv>
            </MotionForm>

          </MotionDiv>
  )
}

export default LoginForm
