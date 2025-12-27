/**
 * Dashboard Page - Analytics, Charts, and Reports
 */

import { useState, useEffect } from 'react';
import { FiUsers, FiUserCheck, FiClock, FiMapPin, FiDownload, FiRefreshCw } from 'react-icons/fi';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { getEmployees, getAttendanceByDate, getBranches } from '../services/api';
import './Dashboard.css';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        registeredFaces: 0,
        todayPresent: 0,
        totalBranches: 0,
    });
    const [branches, setBranches] = useState([]);
    const [branchStats, setBranchStats] = useState([]);
    const [todayAttendance, setTodayAttendance] = useState([]);
    const [weeklyData, setWeeklyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('daily'); // daily, weekly, monthly
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        loadDashboardData();

        // Auto-refresh every 60 seconds for real-time updates
        const refreshInterval = setInterval(() => {
            console.log('[Dashboard] Auto-refreshing data...');
            loadDashboardData();
        }, 60000); // 60 seconds

        return () => clearInterval(refreshInterval);
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Get employees
            const empResponse = await getEmployees();
            const allEmployees = empResponse.employees || [];
            setEmployees(allEmployees);

            // Get branches
            let allBranches = [];
            try {
                const branchResponse = await getBranches();
                allBranches = branchResponse.branches || [];
                setBranches(allBranches);
            } catch (e) {
                console.log('No branches found');
            }

            // Get today's attendance
            const today = new Date().toISOString().split('T')[0];
            let todayRecords = [];
            try {
                const attResponse = await getAttendanceByDate(today);
                todayRecords = attResponse.records || [];
            } catch (e) {
                console.log('No attendance records yet');
            }

            // Calculate branch-wise stats
            const branchStatsData = allBranches.map(branch => {
                const branchEmployees = allEmployees.filter(e => e.branchId === branch.branchId);
                const branchPresent = todayRecords.filter(r =>
                    branchEmployees.some(e => e.employeeId === r.employeeId)
                );
                return {
                    ...branch,
                    totalEmployees: branchEmployees.length,
                    registeredFaces: branchEmployees.filter(e => e.faceId).length,
                    presentToday: branchPresent.length,
                    attendanceRate: branchEmployees.length > 0
                        ? Math.round((branchPresent.length / branchEmployees.length) * 100)
                        : 0,
                };
            });
            setBranchStats(branchStatsData);

            // Get weekly data for charts
            const weekData = await getWeeklyAttendance();
            setWeeklyData(weekData);

            setStats({
                totalEmployees: allEmployees.length,
                registeredFaces: allEmployees.filter(e => e.faceId).length,
                todayPresent: todayRecords.length,
                totalBranches: allBranches.length,
            });
            setTodayAttendance(todayRecords);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getWeeklyAttendance = async () => {
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

            try {
                const response = await getAttendanceByDate(dateStr);
                data.push({
                    date: dateStr,
                    day: dayName,
                    present: response.records?.length || 0,
                    late: response.records?.filter(r => r.status === 'late')?.length || 0,
                });
            } catch (e) {
                data.push({ date: dateStr, day: dayName, present: 0, late: 0 });
            }
        }
        return data;
    };

    const formatTime = (isoString) => {
        if (!isoString) return '--:--';
        return new Date(isoString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Chart configurations
    const weeklyChartData = {
        labels: weeklyData.map(d => d.day),
        datasets: [
            {
                label: 'Present',
                data: weeklyData.map(d => d.present),
                backgroundColor: 'rgba(76, 175, 80, 0.8)',
                borderColor: '#4CAF50',
                borderWidth: 2,
            },
            {
                label: 'Late',
                data: weeklyData.map(d => d.late),
                backgroundColor: 'rgba(255, 152, 0, 0.8)',
                borderColor: '#FF9800',
                borderWidth: 2,
            },
        ],
    };

    const branchChartData = {
        labels: branchStats.map(b => b.name),
        datasets: [
            {
                label: 'Employees',
                data: branchStats.map(b => b.totalEmployees),
                backgroundColor: 'rgba(33, 150, 243, 0.8)',
            },
            {
                label: 'Present Today',
                data: branchStats.map(b => b.presentToday),
                backgroundColor: 'rgba(76, 175, 80, 0.8)',
            },
        ],
    };

    const attendanceDistribution = {
        labels: ['Present', 'Late', 'Absent'],
        datasets: [{
            data: [
                todayAttendance.filter(r => r.status === 'present').length,
                todayAttendance.filter(r => r.status === 'late').length,
                stats.totalEmployees - todayAttendance.length,
            ],
            backgroundColor: ['#4CAF50', '#FF9800', '#f44336'],
            borderWidth: 0,
        }],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { stepSize: 1 },
            },
        },
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
            },
        },
    };

    // Export to Excel
    const exportToExcel = (type = 'daily') => {
        let data = [];
        let filename = '';

        if (type === 'daily') {
            filename = `Attendance_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
            data = todayAttendance.map(record => ({
                'Employee ID': record.employeeId,
                'Check In': formatTime(record.checkInTime),
                'Check Out': formatTime(record.checkOutTime),
                'Status': record.status,
                'Date': new Date().toLocaleDateString(),
            }));
        } else if (type === 'weekly') {
            filename = `Weekly_Attendance_Report.xlsx`;
            data = weeklyData.map(d => ({
                'Date': d.date,
                'Day': d.day,
                'Present': d.present,
                'Late': d.late,
                'Total': d.present + d.late,
            }));
        } else if (type === 'branch') {
            filename = `Branch_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
            data = branchStats.map(b => ({
                'Branch Name': b.name,
                'Address': b.address || '-',
                'Total Employees': b.totalEmployees,
                'Faces Registered': b.registeredFaces,
                'Present Today': b.presentToday,
                'Attendance Rate': `${b.attendanceRate}%`,
            }));
        } else if (type === 'employees') {
            filename = `Employee_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
            data = employees.map(emp => {
                const branch = branches.find(b => b.branchId === emp.branchId);
                return {
                    'Employee ID': emp.employeeId,
                    'Name': emp.name,
                    'Email': emp.email || '-',
                    'Phone': emp.phone || '-',
                    'Department': emp.department || '-',
                    'Designation': emp.designation || '-',
                    'Branch': branch?.name || '-',
                    'Face Registered': emp.faceId ? 'Yes' : 'No',
                    'Status': emp.status,
                };
            });
        }

        if (data.length === 0) {
            alert('No data to export');
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
        XLSX.writeFile(workbook, filename);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <span className="date-display">
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </span>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={loadDashboardData}>
                        <FiRefreshCw /> Refresh
                    </button>
                    <div className="export-dropdown">
                        <button className="btn btn-primary">
                            <FiDownload /> Export Report
                        </button>
                        <div className="dropdown-content">
                            <button onClick={() => exportToExcel('daily')}>📅 Daily Attendance</button>
                            <button onClick={() => exportToExcel('weekly')}>📊 Weekly Summary</button>
                            <button onClick={() => exportToExcel('branch')}>🏢 Branch Report</button>
                            <button onClick={() => exportToExcel('employees')}>👥 Employee List</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon employees">
                        <FiUsers />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.totalEmployees}</span>
                        <span className="stat-label">Total Employees</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon registered">
                        <FiUserCheck />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.registeredFaces}</span>
                        <span className="stat-label">Faces Registered</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon present">
                        <FiClock />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.todayPresent}</span>
                        <span className="stat-label">Present Today</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon branches">
                        <FiMapPin />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.totalBranches}</span>
                        <span className="stat-label">Active Branches</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
                {/* Weekly Attendance Chart */}
                <div className="card chart-card">
                    <h2 className="section-title">Weekly Attendance Trend</h2>
                    <div className="chart-container">
                        <Bar data={weeklyChartData} options={chartOptions} />
                    </div>
                </div>

                {/* Attendance Distribution */}
                <div className="card chart-card-small">
                    <h2 className="section-title">Today's Distribution</h2>
                    <div className="chart-container-small">
                        <Doughnut data={attendanceDistribution} options={doughnutOptions} />
                    </div>
                </div>
            </div>

            {/* Branch-wise Stats - Professional Table Layout */}
            {branchStats.length > 0 && (
                <div className="card branch-overview-card">
                    <div className="section-header">
                        <h2 className="section-title">
                            <FiMapPin style={{ marginRight: '8px' }} />
                            Branch-wise Statistics
                        </h2>
                        <span className="branch-count-badge">{branchStats.length} Branches</span>
                    </div>

                    <div className="branch-table-container">
                        <table className="branch-table">
                            <thead>
                                <tr>
                                    <th>Branch Name</th>
                                    <th>Address</th>
                                    <th className="text-center">Total Employees</th>
                                    <th className="text-center">Faces Registered</th>
                                    <th className="text-center">Present Today</th>
                                    <th className="text-center">Attendance Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {branchStats.map((branch) => (
                                    <tr key={branch.branchId}>
                                        <td>
                                            <div className="branch-name-cell">
                                                <strong>{branch.name}</strong>
                                            </div>
                                        </td>
                                        <td className="branch-address">{branch.address || '-'}</td>
                                        <td className="text-center">
                                            <span className="stat-badge employees-badge">{branch.totalEmployees}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className="stat-badge registered-badge">{branch.registeredFaces}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className="stat-badge present-badge">{branch.presentToday}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className={`rate-badge ${branch.attendanceRate >= 80 ? 'rate-good' : branch.attendanceRate >= 50 ? 'rate-medium' : 'rate-low'}`}>
                                                {branch.attendanceRate}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="totals-row">
                                    <td colSpan="2"><strong>Total (All Branches)</strong></td>
                                    <td className="text-center">
                                        <strong>{branchStats.reduce((sum, b) => sum + b.totalEmployees, 0)}</strong>
                                    </td>
                                    <td className="text-center">
                                        <strong>{branchStats.reduce((sum, b) => sum + b.registeredFaces, 0)}</strong>
                                    </td>
                                    <td className="text-center">
                                        <strong>{branchStats.reduce((sum, b) => sum + b.presentToday, 0)}</strong>
                                    </td>
                                    <td className="text-center">
                                        <strong>
                                            {branchStats.reduce((sum, b) => sum + b.totalEmployees, 0) > 0
                                                ? Math.round((branchStats.reduce((sum, b) => sum + b.presentToday, 0) / branchStats.reduce((sum, b) => sum + b.totalEmployees, 0)) * 100)
                                                : 0}%
                                        </strong>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* Today's Attendance Table */}
            <div className="card">
                <div className="section-header">
                    <h2 className="section-title">Today's Attendance</h2>
                    <button className="btn btn-sm btn-secondary" onClick={() => exportToExcel('daily')}>
                        <FiDownload /> Export
                    </button>
                </div>
                {todayAttendance.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Employee ID</th>
                                    <th>Check In</th>
                                    <th>Check Out</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todayAttendance.map((record) => (
                                    <tr key={record.attendanceId}>
                                        <td>{record.employeeId}</td>
                                        <td>{formatTime(record.checkInTime)}</td>
                                        <td>{formatTime(record.checkOutTime)}</td>
                                        <td>
                                            <span className={`badge badge-${record.status === 'present' ? 'success' : record.status === 'late' ? 'warning' : 'danger'}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="empty-message">No attendance records for today yet.</p>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
