// MicroService/Analytique/src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Récupérer le token depuis l'header Authorization
    const authHeader = req.headers.authorization;

    console.log('🔍 AuthHeader reçu:', authHeader ? `${authHeader.substring(0, 30)}...` : 'AUCUN');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Format token invalide ou manquant');
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification requis'
      });
    }

    const token = authHeader.substring(7); // Enlever "Bearer "

    console.log('🔑 Token extrait:', token ? `${token.substring(0, 20)}...` : 'VIDE');

    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET non configuré !');
      return res.status(500).json({
        success: false,
        error: 'Configuration serveur incorrecte'
      });
    }

    // Vérifier le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('✅ Token décodé:', {
      userId: decoded.userId || decoded.id,
      email: decoded.email,
      iat: decoded.iat,
      exp: decoded.exp
    });

    // Ajouter les infos utilisateur à la requête
    req.user = {
      userId: decoded.userId || decoded.id,
      email: decoded.email,
      name: decoded.name
    };

    next();

  } catch (error) {
    console.error('❌ Erreur authentification:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expiré'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token invalide'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Erreur de vérification du token'
    });
  }
};

module.exports = authMiddleware;
