import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import styles from './AccountPage.module.css';

const AccountPage = () => {
  const { user, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currency: user?.currency || 'EUR',
    monthlyIncome: user?.monthlyIncome || 0
  });

  const currencies = [
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'USD', name: 'Dollar US ($)' },
    { code: 'GBP', name: 'Livre Sterling (£)' },
    { code: 'CAD', name: 'Dollar Canadien (C$)' },
    { code: 'JPY', name: 'Yen Japonais (¥)' },
    { code: 'CNY', name: 'Yuan Chinois (¥)' }
  ];

  // Mettre à jour formData quand user change
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        currency: user.currency || 'EUR',
        monthlyIncome: user.monthlyIncome || 0
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'monthlyIncome' ? parseFloat(value) || 0 : value
    }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name.trim()) {
      setError('Le nom est requis');
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError('L\'email est requis');
      setLoading(false);
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Format d\'email invalide');
      setLoading(false);
      return;
    }

    try {
      // Appel API réel
      const response = await apiService.updateProfile(formData);

      // Mettre à jour le contexte utilisateur avec les données retournées par l'API
      if (response.user) {
        updateUser(response.user);
      } else {
        updateUser(formData);
      }

      setSuccess('Profil mis à jour avec succès !');
      setIsEditing(false);
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      logout();
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      'Cette action est IRRÉVERSIBLE !\n\nTapez "SUPPRIMER" pour confirmer la suppression de votre compte :'
    );

    if (confirmation !== 'SUPPRIMER') {
      return;
    }

    setLoading(true);
    try {
      // Appel API réel pour supprimer le compte
      await apiService.deleteAccount();

      alert('Votre compte a été supprimé avec succès.');
      logout();
    } catch (err) {
      console.error('Delete account error:', err);
      setError(err.message || 'Erreur lors de la suppression du compte');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      currency: user?.currency || 'EUR',
      monthlyIncome: user?.monthlyIncome || 0
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: user?.currency || 'EUR'
    }).format(amount);
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
    }
    return 'U';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Récemment';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return 'Date invalide';
    }
  };

  return (
    <div className={styles.container}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {getUserInitials()}
          </div>
          <div>
            <h1>{user?.name || 'Mon Compte'}</h1>
            <p>{user?.email}</p>
            <small>Membre depuis {formatDate(user?.createdAt)}</small>
          </div>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          🚪 Déconnexion
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className={styles.error}>
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className={styles.success}>
          ✅ {success}
        </div>
      )}

      {/* Profil */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>👤 Informations Personnelles</h2>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className={styles.editBtn}>
              ✏️ Modifier
            </button>
          ) : (
            <div className={styles.actions}>
              <button onClick={cancelEdit} className={styles.cancelBtn} disabled={loading}>
                ❌ Annuler
              </button>
              <button onClick={handleSubmit} disabled={loading} className={styles.saveBtn}>
                {loading ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Nom complet</label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Votre nom complet"
                required
                disabled={loading}
              />
            ) : (
              <div className={styles.display}>{user?.name || 'Non renseigné'}</div>
            )}
          </div>

          <div className={styles.field}>
            <label>Email</label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="votre@email.com"
                required
                disabled={loading}
              />
            ) : (
              <div className={styles.display}>{user?.email || 'Non renseigné'}</div>
            )}
          </div>

          <div className={styles.field}>
            <label>Devise</label>
            {isEditing ? (
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                disabled={loading}
              >
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className={styles.display}>
                {currencies.find(c => c.code === user?.currency)?.name || 'Euro (€)'}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label>Revenu mensuel</label>
            {isEditing ? (
              <input
                type="number"
                name="monthlyIncome"
                value={formData.monthlyIncome}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="0.01"
                disabled={loading}
              />
            ) : (
              <div className={styles.display}>
                {user?.monthlyIncome ? formatCurrency(user.monthlyIncome) : 'Non renseigné'}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Statistiques utilisateur */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>📊 Statistiques du Compte</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Devise Active</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b' }}>
              {user?.currency || 'EUR'}
            </div>
          </div>
          <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Compte créé</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b' }}>
              {formatDate(user?.createdAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Zone de danger */}
      <div className={styles.dangerZone}>
        <h2>⚠️ Zone de Danger</h2>
        <p>Cette action supprimera définitivement votre compte et toutes vos données.</p>
        <button
          onClick={handleDeleteAccount}
          disabled={loading}
          className={styles.deleteBtn}
        >
          {loading ? '⏳ Suppression...' : '🗑️ Supprimer mon compte'}
        </button>
      </div>
    </div>
  );
};

export default AccountPage;
