import React, { useState } from 'react'; // ← Import useState manqué
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './RegisterForm.module.css';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    currency: 'USD'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      console.log('✅ Registration successful!');
      navigate('/dashboard');
    } catch (err) {
      console.error(' Registration failed:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.registerContainer || styles.loginContainer}>
      <div className={styles.registerFormWrapper || styles.loginFormWrapper}>
        <div className={styles.registerCard || styles.loginCard}>
          <h1 className={styles.brandTitle}>💰 NeatBux</h1>
          <h2 className={styles.welcomeText}>Create Your Account</h2>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.registerForm || styles.loginForm}>

            <div className={styles.inputGroup}>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className={styles.formInput}
                required
                disabled={isLoading}
              />
            </div>

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
                placeholder="Enter your password (min 6 chars)"
                className={styles.formInput}
                required
                disabled={isLoading}
              />
            </div>

            <div className={styles.inputGroup}>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className={styles.formInput}
                required
                disabled={isLoading}
              />
            </div>

            <div className={styles.inputGroup}>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className={styles.formInput}
                disabled={isLoading}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD (C$)</option>
              </select>
            </div>

            <button
              type="submit"
              className={styles.registerButton || styles.loginButton}
              disabled={isLoading}
              onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = '#9d7ec7')}
              onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = '#b19cd9')}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className={styles.formFooter}>
            <p className={styles.loginText}>
              Already have an account?
              <Link to="/auth/login" className={styles.loginLink}> Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
