import React, { useState, useEffect } from 'react';
import styles from './TransactionForm.module.css';

const EXPENSE_CATEGORIES = [
  'Alimentation',
  'Logement',
  'Transport',
  'Divertissement',
  'Santé',
  'Sorties',
  'Shopping',
  'Éducation',
  'Utilities',
  'Autre'
];

const INCOME_CATEGORIES = [
  'Salaire',
  'Revenus supplémentaires',
  'Investissements',
  'Cadeaux',
  'Remboursements',
  'Autre'
];

const TransactionForm = ({ transaction, onSubmit, onCancel, isEditing = false }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      setFormData({
        description: transaction.description || '',
        amount: transaction.amount?.toString() || '',
        type: transaction.type || 'expense',
        category: transaction.category || '',
        date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        notes: transaction.notes || ''
      });
    }
  }, [transaction]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset category when type changes
      ...(name === 'type' && { category: '' })
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.description.trim()) {
      setError('La description est requise');
      setLoading(false);
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Le montant doit être positif');
      setLoading(false);
      return;
    }

    if (!formData.category) {
      setError('La catégorie est requise');
      setLoading(false);
      return;
    }

    try {
      const result = await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount)
      });

      if (result.success) {
        // Form will be closed by parent component
      } else {
        setError(result.message || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const categories = formData.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className={styles.transactionForm}>
      <div className={styles.formHeader}>
        <h2>{isEditing ? 'Modifier la transaction' : 'Ajouter une transaction'}</h2>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onCancel}
        >
          ✕
        </button>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>⚠️</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Type *</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={styles.select}
              required
            >
              <option value="expense">💸 Dépense</option>
              <option value="income">💰 Revenu</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Montant *</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className={styles.input}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              required
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Description *</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={styles.input}
            placeholder="Description de la transaction"
            maxLength="200"
            required
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Catégorie *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={styles.select}
              required
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Notes (facultatif)</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className={styles.textarea}
            placeholder="Ajouter des notes..."
            maxLength="500"
            rows="3"
          />
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            Annuler
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.loadingContent}>
                <span className={styles.spinner}></span>
                {isEditing ? 'Modification...' : 'Ajout...'}
              </span>
            ) : (
              isEditing ? 'Modifier' : 'Ajouter'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
