/**
 * Dashboard Page
 */

import { useState, useEffect } from 'react';
import { FiUsers, FiUserCheck, FiClock, FiMapPin } from 'react-icons/fi';
import { getEmployees, getAttendanceByDate, getGeofenceSettings } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        registeredFaces: 0,
        todayPresent: 0,
        geofenceConfigured: false,
    });
    const [todayAttendance, setTodayAttendance] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Get employees
            const empResponse = await getEmployees();
            const employees = empResponse.employees || [];

            // Get today's attendance
            const today = new Date().toISOString().split('T')[0];
            let todayRecords = [];
            try {
                const attResponse = await getAttendanceByDate(today);
                todayRecords = attResponse.records || [];
            } catch (e) {
                console.log('No attendance records yet');
            }

            // Get geofence settings
            let geofenceConfigured = false;
            try {
                const geoResponse = await getGeofenceSettings();
                geofenceConfigured = geoResponse.settings?.isConfigured || false;
            } catch (e) {
                console.log('Geofence not configured');
            }

            setStats({
                totalEmployees: employees.length,
                registeredFaces: employees.filter(e => e.faceId).length,
                todayPresent: todayRecords.length,
                geofenceConfigured,
            });
            setTodayAttendance(todayRecords);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (isoString) => {
        if (!isoString) return '--:--';
        return new Date(isoString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
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
                    <div className={`stat-icon geofence ${stats.geofenceConfigured ? 'active' : ''}`}>
                        <FiMapPin />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.geofenceConfigured ? 'Active' : 'Not Set'}</span>
                        <span className="stat-label">Geo-fence Status</span>
                    </div>
                </div>
            </div>

            {/* Today's Attendance */}
            <div className="card">
                <h2 className="section-title">Today's Attendance</h2>
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
