/**
 * Attendance Reports Page
 */

import { useState, useEffect } from 'react';
import { FiCalendar, FiDownload, FiSearch } from 'react-icons/fi';
import { getAttendanceByDate, getEmployees } from '../services/api';
import './Attendance.css';

const Attendance = () => {
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [attendance, setAttendance] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [selectedDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [attResponse, empResponse] = await Promise.all([
                getAttendanceByDate(selectedDate).catch(() => ({ records: [] })),
                getEmployees().catch(() => ({ employees: [] })),
            ]);

            setAttendance(attResponse.records || []);
            setEmployees(empResponse.employees || []);
        } catch (error) {
            console.error('Error loading data:', error);
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

    const getEmployeeName = (employeeId) => {
        const emp = employees.find(e => e.employeeId === employeeId);
        return emp?.name || employeeId;
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'present': return 'badge-success';
            case 'late': return 'badge-warning';
            case 'half-day': return 'badge-danger';
            default: return 'badge-secondary';
        }
    };

    const calculateDuration = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return '--';
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diff = Math.abs(end - start);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    // Stats
    const stats = {
        total: employees.length,
        present: attendance.length,
        absent: employees.length - attendance.length,
        onTime: attendance.filter(a => a.status === 'present').length,
        late: attendance.filter(a => a.status === 'late').length,
    };

    return (
        <div className="attendance-page">
            <div className="page-header">
                <h1 className="page-title">Attendance Report</h1>
                <div className="header-actions">
                    <div className="date-picker">
                        <FiCalendar />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="attendance-stats">
                <div className="stat-item">
                    <span className="stat-number">{stats.total}</span>
                    <span className="stat-text">Total Employees</span>
                </div>
                <div className="stat-item present">
                    <span className="stat-number">{stats.present}</span>
                    <span className="stat-text">Present</span>
                </div>
                <div className="stat-item absent">
                    <span className="stat-number">{stats.absent}</span>
                    <span className="stat-text">Absent</span>
                </div>
                <div className="stat-item ontime">
                    <span className="stat-number">{stats.onTime}</span>
                    <span className="stat-text">On Time</span>
                </div>
                <div className="stat-item late">
                    <span className="stat-number">{stats.late}</span>
                    <span className="stat-text">Late</span>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">
                        Attendance for {new Date(selectedDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </h2>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                ) : attendance.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Check In</th>
                                    <th>Check Out</th>
                                    <th>Duration</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendance.map((record) => (
                                    <tr key={record.attendanceId}>
                                        <td>
                                            <div className="employee-cell">
                                                <strong>{record.employeeId}</strong>
                                                <span>{getEmployeeName(record.employeeId)}</span>
                                            </div>
                                        </td>
                                        <td>{formatTime(record.checkInTime)}</td>
                                        <td>{formatTime(record.checkOutTime)}</td>
                                        <td>{calculateDuration(record.checkInTime, record.checkOutTime)}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadgeClass(record.status)}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <FiCalendar className="empty-icon" />
                        <p>No attendance records for this date</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Attendance;
