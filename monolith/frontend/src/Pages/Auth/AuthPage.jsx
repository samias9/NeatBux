import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AuthPage.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    currency: 'EUR'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();

  // Déterminer où rediriger après connexion
  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Connexion
        const result = await login({
          email: formData.email,
          password: formData.password
        });

        if (result.success) {
          navigate(from, { replace: true });
        } else {
          setError(result.message || 'Erreur de connexion');
        }
      } else {
        // Inscription
        if (formData.password !== formData.confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          setLoading(false);
          return;
        }

        const result = await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          currency: formData.currency
        });

        if (result.success) {
          navigate('/dashboard', { replace: true });
        } else {
          setError(result.message || 'Erreur lors de l\'inscription');
        }
      }
    } catch (err) {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      name: '',
      email: formData.email, // Garder l'email
      password: '',
      confirmPassword: '',
      currency: 'EUR'
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">
              {isLogin ? 'Connexion' : 'Créer un compte'}
            </h1>
            <p className="auth-subtitle">
              {isLogin
                ? 'Accédez à votre tableau de bord NeatBux'
                : 'Rejoignez NeatBux pour gérer vos finances'
              }
            </p>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Nom complet</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Votre nom"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="votre@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {!isLogin && (
              <>
                <div className="form-group">
                  <label className="form-label">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Devise préférée</label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="CNY">CNY (¥)</option>
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`submit-button ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <span className="loading-content">
                  <span className="spinner-small"></span>
                  {isLogin ? 'Connexion...' : 'Création...'}
                </span>
              ) : (
                isLogin ? 'Se connecter' : 'Créer le compte'
              )}
            </button>
          </form>

          <div className="auth-switch">
            <p>
              {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
              <button
                type="button"
                onClick={toggleMode}
                className="switch-button"
              >
                {isLogin ? "S'inscrire" : "Se connecter"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
