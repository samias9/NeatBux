import React, { useState } from 'react';
import styles from './LoginForm.module.css'


export default function LoginForm() {

    const [formData, setFormData] = useState({
    username: '',
    password: ''
    });

    const handleChange = (e) => {
    setFormData({
        ...formData,
        [e.target.name]: e.target.value
    });
    };

    const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempt:', formData);
    // Ici vous ajouterez la logique de connexion
    };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginFormWrapper}>
        <div className={styles.loginCard}>
          <h1 className={styles.brandTitle}>NeatBux</h1>
          <h2 className={styles.welcomeText}>Welcome Back</h2>

          <div onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="enter your username"
                className={styles.formInput}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="enter your password"
                className={styles.formInput}
                required
              />
            </div>

            <button
              type="submit"
              className={styles.loginButton}
              onClick={handleSubmit}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#9d7ec7'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#b19cd9'}
            >
              Log in
            </button>
          </div>

          <div className={styles.formFooter}>
            <a href="#forgot" className={styles.forgotLink}>Forgot password?</a>
            <p className={styles.signupText}>
              Don't have an account? <a href="#signup" className={styles.signupLink}>Sign up</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

}
