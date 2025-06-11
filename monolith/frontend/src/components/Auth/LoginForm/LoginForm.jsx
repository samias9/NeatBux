import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './LoginForm.module.css';

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(formData);
      console.log('✅ Login successful!');
      navigate(from, { replace: true });
    } catch (err) {
      console.error('❌ Login failed:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginFormWrapper}>
        <div className={styles.loginCard}>
          <h1 className={styles.brandTitle}>💰 NeatBux</h1>
          <h2 className={styles.welcomeText}>Welcome Back</h2>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            <div className={styles.inputGroup}>
              <input
                type="email"          
                name="email"           
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={styles.formInput}
                required
                disabled={isLoading}
              />
            </div>

            <div className={styles.inputGroup}>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={styles.formInput}
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className={styles.loginButton}
              disabled={isLoading}
              onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = '#9d7ec7')}
              onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = '#b19cd9')}
            >
              {isLoading ? 'Signing in...' : 'Log in'}
            </button>
          </form>

          <div className={styles.formFooter}>
            <a href="#forgot" className={styles.forgotLink}>Forgot password?</a>
            <p className={styles.signupText}>
              Don't have an account?
              <Link to="/auth/register" className={styles.signupLink}> Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
