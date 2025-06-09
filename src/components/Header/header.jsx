import React from 'react'
import styles from './header.module.css'

export default function header() {
  return (
    <div className={styles.header}>
        <div className={styles.leftSide}>
            <nav style={{fontFamily:"Coiny",color:'var(--secondary-color)',lineHeight: '1.12' ,fontWeight: 'bold', fontSize:'19px', textDecoration:'underline'}}>Home</nav>
            <nav>All transactions</nav>
            <nav>Monthly Budget</nav>
            <nav>Future Projection</nav>
        </div>
        <nav>Account</nav>
    </div>

  )
}
