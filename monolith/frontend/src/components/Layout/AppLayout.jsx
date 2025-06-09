import React from 'react'
import {Outlet} from 'react-router-dom'
import Header from '../Header/header'

export default function AppLayout() {
  return (
    <div>
        <Header />
        <main>
            <Outlet />
        </main>

    </div>
  )
}
