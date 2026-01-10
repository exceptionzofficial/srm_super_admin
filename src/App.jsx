/**
 * SRM Sweets Super Admin Panel
 * Main App with React Router
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Branches from './pages/Branches';
import Attendance from './pages/Attendance';
import Salary from './pages/Salary';
import Analytics from './pages/Analytics';
import BranchDetails from './pages/BranchDetails';
import Requests from './pages/Requests';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/branches" element={<Branches />} />
            <Route path="/branches/:branchId" element={<BranchDetails />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/salary" element={<Salary />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
