import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './Goals.css';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    targetAmount: '',
    category: 'savings'
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const response = await apiService.getGoals();
      setGoals(response.goals || []);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.title.trim()) return;

    try {
      const response = await apiService.createGoal({
        title: newGoal.title,
        targetAmount: parseFloat(newGoal.targetAmount) || 0,
        category: newGoal.category
      });

      setGoals([response.goal, ...goals]);
      setNewGoal({ title: '', targetAmount: '', category: 'savings' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const toggleGoalComplete = async (goalId, isCompleted) => {
    try {
      const response = await apiService.updateGoal(goalId, {
        isCompleted: !isCompleted
      });

      setGoals(goals.map(goal =>
        goal._id === goalId ? response.goal : goal
      ));
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const deleteGoal = async (goalId) => {
    try {
      await apiService.deleteGoal(goalId);
      setGoals(goals.filter(goal => goal._id !== goalId));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const updateGoalProgress = async (goalId, currentAmount) => {
    try {
      const response = await apiService.updateGoal(goalId, {
        currentAmount: parseFloat(currentAmount) || 0
      });

      setGoals(goals.map(goal =>
        goal._id === goalId ? response.goal : goal
      ));
    } catch (error) {
      console.error('Error updating goal progress:', error);
    }
  };

  if (loading) return <div className="goals-loading">Chargement des objectifs...</div>;

  return (
    <div className="goals-container">
      <div className="goals-header">
        <h3>🎯 Ce mois-ci :</h3>
        <button
          className="add-goal-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '❌' : '➕ Add'}
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <form onSubmit={handleAddGoal} className="add-goal-form">
          <div className="form-row">
            <input
              type="text"
              placeholder="Nouvel objectif..."
              value={newGoal.title}
              onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
              autoFocus
              required
            />
            <input
              type="number"
              placeholder="Montant (€)"
              value={newGoal.targetAmount}
              onChange={(e) => setNewGoal({...newGoal, targetAmount: e.target.value})}
            />
          </div>
          <div className="form-row">
            <select
              value={newGoal.category}
              onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
            >
              <option value="savings">💰 Épargne</option>
              <option value="expense_reduction">📉 Réduire dépenses</option>
              <option value="income_increase">📈 Augmenter revenus</option>
              <option value="other">🎯 Autre</option>
            </select>
            <button type="submit" className="save-goal-btn">
              ✅ Sauvegarder
            </button>
          </div>
        </form>
      )}

      {/* Liste des goals */}
      <div className="goals-list">
        {goals.length === 0 ? (
          <div className="no-goals">
            <p>Aucun objectif défini</p>
            <p>Cliquez sur "Add" pour commencer !</p>
          </div>
        ) : (
          goals.map(goal => (
            <GoalItem
              key={goal._id}
              goal={goal}
              onToggleComplete={toggleGoalComplete}
              onDelete={deleteGoal}
              onUpdateProgress={updateGoalProgress}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Composant pour chaque goal
const GoalItem = ({ goal, onToggleComplete, onDelete, onUpdateProgress }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [progress, setProgress] = useState(goal.currentAmount || 0);

  const progressPercentage = goal.targetAmount > 0
    ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
    : 0;

  const handleProgressSubmit = (e) => {
    e.preventDefault();
    onUpdateProgress(goal._id, progress);
    setIsEditing(false);
  };

  return (
    <div className={`goal-item ${goal.isCompleted ? 'completed' : ''}`}>
      <div className="goal-main">
        <div className="goal-checkbox">
          <input
            type="checkbox"
            checked={goal.isCompleted}
            onChange={() => onToggleComplete(goal._id, goal.isCompleted)}
          />
          <span className="goal-icon">
            {goal.category === 'savings' && '💰'}
            {goal.category === 'expense_reduction' && '📉'}
            {goal.category === 'income_increase' && '📈'}
            {goal.category === 'other' && '🎯'}
          </span>
        </div>

        <div className="goal-content">
          <div className="goal-title">{goal.title}</div>

          {goal.targetAmount > 0 && (
            <div className="goal-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="progress-text">
                {isEditing ? (
                  <form onSubmit={handleProgressSubmit} className="progress-edit">
                    <input
                      type="number"
                      value={progress}
                      onChange={(e) => setProgress(e.target.value)}
                      onBlur={handleProgressSubmit}
                      autoFocus
                    />
                    <span>€ / {goal.targetAmount}€</span>
                  </form>
                ) : (
                  <span
                    onClick={() => setIsEditing(true)}
                    className="progress-clickable"
                  >
                    {goal.currentAmount}€ / {goal.targetAmount}€ ({Math.round(progressPercentage)}%)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => onDelete(goal._id)}
          className="delete-goal-btn"
          title="Supprimer"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default Goals;
