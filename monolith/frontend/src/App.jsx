import './App.css'
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Dashboard from './Pages/DashBoard/dashboard.jsx';
import AppLayout from './components/Layout/AppLayout';
import Transactions from './components/RecentTransactions/recentTransactions';
import MonthlyChart from './components/MonthlyChart/monthlyChart.jsx';
import Statistics from './Pages/Statistics/statistics.jsx';

function App() {

  return (
    <BrowserRouter>
      <Routes>
        {/* Routes Auth */}

        {/* Redirections */}
       <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path='transactions' element={<Transactions/>} />
          <Route path='monthly-budget' element={<div>Not yet</div>} />
          <Route path='statistics' element={<Statistics />} />
        </Route>
        <Route path="*"  element={<div>404 Not Found</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
