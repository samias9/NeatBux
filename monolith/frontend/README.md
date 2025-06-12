# React + Vite

## À installer
npm install chart.js

React Router DOM v6 : npm install react-router-dom

npm install express mongoose cors dotenv bcryptjs jsonwebtoken joi helmet express-rate-limit morgan

npm install --save-dev nodemon jest supertest

## RUN
npm run dev (both frontend and backend)

## Service Analytics
# Démarrer Redis
brew install redis
redis-server (Pour démarrer Redis)
brew services start redis (démarrer en arrière-plan)
# Puis lancer server.js
npm start
# Tester sur le port 3003
curl http://localhost:3003/health

## Service Report
# Lancer le serveur
node server.js
# Tester (port 3002)
open http://localhost:3002/downloads/rapport_user123_2024-06_1749688074919.html
