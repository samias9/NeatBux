import React from 'react'
import { Link } from 'react-router-dom'
import styles from './header.module.css'

export default function Header() {
  return (
    <div className={styles.header}>
        <div className={styles.leftSide}>
            <Link
              to="/dashboard"
              className={styles.navLink}
              style={{
                fontFamily:"Coiny",
                color:'var(--secondary-color)',
                lineHeight: '1.12',
                fontWeight: 'bold',
                fontSize:'19px',
                textDecoration:'underline'
              }}
            >
              Accueil
            </Link>
            <Link
              to="/transactions"
              className={styles.navLink}
            >Transactions</Link>
            <Link
              to="/analytics"
              className={styles.navLink}
            >Analytique</Link>
            <Link
              to="/statistics"
              className={styles.navLink}
              >Rapports</Link>
        </div>
        <Link
          className={styles.navLink}
          to="/account"
        >Compte</Link>
    </div>
  )
}
