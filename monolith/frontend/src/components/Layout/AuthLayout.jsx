import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-header">
          <h1>NeatBux</h1>
          <p>Your Smart Budget Tracker</p>
        </div>

        <main className="auth-main">
          <Outlet />
        </main>

        <footer className="auth-footer">
          <p>&copy; 2025 NeatBux</p>
        </footer>
      </div>
    </div>
  );
}
