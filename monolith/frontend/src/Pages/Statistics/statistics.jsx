import React from 'react'
import styles from './statistics.module.css'
import MonthlyChart from '../../components/MonthlyChart/monthlyChart'
import StatsCard from '../../components/StatsCard/statsCard'

export default function Statistics() {
  return (
    <div>
        <StatsCard />
        <MonthlyChart />
    </div>
  )
}
