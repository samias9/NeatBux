const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth'); // Assurez-vous d'avoir ce middleware

// GET /api/profile - Obtenir le profil utilisateur
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// PUT /api/profile - Mettre à jour le profil utilisateur
router.put('/', auth, async (req, res) => {
    try {
        const { name, email, currency, monthlyIncome } = req.body;

        // Validation
        if (!name || !email) {
            return res.status(400).json({ message: 'Le nom et l\'email sont requis' });
        }

        // Validation email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Format d\'email invalide' });
        }

        // Vérifier si l'email existe déjà (sauf pour l'utilisateur actuel)
        const existingUser = await User.findOne({
            email: email.toLowerCase().trim(),
            _id: { $ne: req.user.id }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }

        // Valider la devise
        const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CAD'];
        if (currency && !validCurrencies.includes(currency)) {
            return res.status(400).json({ message: 'Devise non valide' });
        }

        // Valider monthlyIncome
        const income = parseFloat(monthlyIncome) || 0;
        if (income < 0) {
            return res.status(400).json({ message: 'Le revenu mensuel ne peut pas être négatif' });
        }

        // Mettre à jour l'utilisateur
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                currency: currency || 'EUR',
                monthlyIncome: income
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.json({
            message: 'Profil mis à jour avec succès',
            user: updatedUser
        });

    } catch (error) {
        console.error('Update profile error:', error);

        // Gestion des erreurs de validation Mongoose
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: errors[0] });
        }

        // Erreur de duplication (email déjà existant)
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }

        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// DELETE /api/profile - Supprimer le compte utilisateur
router.delete('/', auth, async (req, res) => {
    try {
        // Vérifier que l'utilisateur existe
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Supprimer l'utilisateur
        await User.findByIdAndDelete(req.user.id);

        res.json({
            message: 'Compte supprimé avec succès',
            deletedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression du compte' });
    }
});

module.exports = router;
