/**
 * Attendance Reports Page - With Edit Functionality
 */

import { useState, useEffect } from 'react';
import { FiCalendar, FiDownload, FiEdit2, FiSave, FiX, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { getAttendanceByDate, getEmployees, getBranches, updateAttendance } from '../services/api';
import './Attendance.css';

const Attendance = () => {
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [attendance, setAttendance] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingRecord, setEditingRecord] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        loadData();
    }, [selectedDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [attResponse, empResponse, branchResponse] = await Promise.all([
                getAttendanceByDate(selectedDate).catch(() => ({ records: [] })),
                getEmployees().catch(() => ({ employees: [] })),
                getBranches().catch(() => ({ branches: [] })),
            ]);

            setAttendance(attResponse.records || []);
            setEmployees(empResponse.employees || []);
            setBranches(branchResponse.branches || []);
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

    const formatTimeForInput = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toTimeString().slice(0, 5);
    };

    const getEmployeeName = (employeeId) => {
        const emp = employees.find(e => e.employeeId === employeeId);
        return emp?.name || employeeId;
    };

    const getEmployeeBranch = (employeeId) => {
        const emp = employees.find(e => e.employeeId === employeeId);
        const branch = branches.find(b => b.branchId === emp?.branchId);
        return branch?.name || '-';
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

    // Edit functionality
    const startEdit = (record) => {
        setEditingRecord(record.attendanceId);
        setEditForm({
            checkInTime: formatTimeForInput(record.checkInTime),
            checkOutTime: formatTimeForInput(record.checkOutTime),
            status: record.status,
        });
    };

    const cancelEdit = () => {
        setEditingRecord(null);
        setEditForm({});
    };

    const saveEdit = async (record) => {
        setSaving(true);
        try {
            // Convert time strings to full ISO strings
            const dateStr = selectedDate;
            const checkInTime = editForm.checkInTime ? `${dateStr}T${editForm.checkInTime}:00` : record.checkInTime;
            const checkOutTime = editForm.checkOutTime ? `${dateStr}T${editForm.checkOutTime}:00` : record.checkOutTime;

            await updateAttendance(record.attendanceId, {
                checkInTime,
                checkOutTime,
                status: editForm.status,
            });

            setMessage({ type: 'success', text: 'Attendance updated successfully!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);

            cancelEdit();
            loadData();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update attendance' });
        } finally {
            setSaving(false);
        }
    };

    // Export to Excel
    const exportToExcel = () => {
        const data = attendance.map(record => ({
            'Employee ID': record.employeeId,
            'Employee Name': getEmployeeName(record.employeeId),
            'Branch': getEmployeeBranch(record.employeeId),
            'Check In': formatTime(record.checkInTime),
            'Check Out': formatTime(record.checkOutTime),
            'Duration': calculateDuration(record.checkInTime, record.checkOutTime),
            'Status': record.status,
            'Date': selectedDate,
        }));

        if (data.length === 0) {
            alert('No data to export');
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
        XLSX.writeFile(workbook, `Attendance_${selectedDate}.xlsx`);
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
                    <button className="btn btn-primary" onClick={exportToExcel}>
                        <FiDownload /> Export Excel
                    </button>
                </div>
            </div>

            {/* Messages */}
            {message.text && (
                <div className={`alert alert-${message.type}`}>
                    {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                    {message.text}
                </div>
            )}

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
                        <FiClock style={{ marginRight: '8px' }} />
                        {new Date(selectedDate).toLocaleDateString('en-US', {
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
                                    <th>Branch</th>
                                    <th>Check In</th>
                                    <th>Check Out</th>
                                    <th>Duration</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendance.map((record) => (
                                    <tr key={record.attendanceId} className={editingRecord === record.attendanceId ? 'editing' : ''}>
                                        <td>
                                            <div className="employee-cell">
                                                <strong>{record.employeeId}</strong>
                                                <span>{getEmployeeName(record.employeeId)}</span>
                                            </div>
                                        </td>
                                        <td>{getEmployeeBranch(record.employeeId)}</td>
                                        <td>
                                            {editingRecord === record.attendanceId ? (
                                                <input
                                                    type="time"
                                                    className="time-input"
                                                    value={editForm.checkInTime}
                                                    onChange={(e) => setEditForm({ ...editForm, checkInTime: e.target.value })}
                                                />
                                            ) : (
                                                formatTime(record.checkInTime)
                                            )}
                                        </td>
                                        <td>
                                            {editingRecord === record.attendanceId ? (
                                                <input
                                                    type="time"
                                                    className="time-input"
                                                    value={editForm.checkOutTime}
                                                    onChange={(e) => setEditForm({ ...editForm, checkOutTime: e.target.value })}
                                                />
                                            ) : (
                                                formatTime(record.checkOutTime)
                                            )}
                                        </td>
                                        <td>{calculateDuration(record.checkInTime, record.checkOutTime)}</td>
                                        <td>
                                            {editingRecord === record.attendanceId ? (
                                                <select
                                                    className="status-select"
                                                    value={editForm.status}
                                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                                >
                                                    <option value="present">Present</option>
                                                    <option value="late">Late</option>
                                                    <option value="half-day">Half Day</option>
                                                </select>
                                            ) : (
                                                <span className={`badge ${getStatusBadgeClass(record.status)}`}>
                                                    {record.status}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {editingRecord === record.attendanceId ? (
                                                <div className="action-buttons">
                                                    <button
                                                        className="action-btn save"
                                                        onClick={() => saveEdit(record)}
                                                        disabled={saving}
                                                    >
                                                        <FiSave />
                                                    </button>
                                                    <button
                                                        className="action-btn cancel"
                                                        onClick={cancelEdit}
                                                        disabled={saving}
                                                    >
                                                        <FiX />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="action-btn edit"
                                                    onClick={() => startEdit(record)}
                                                >
                                                    <FiEdit2 />
                                                </button>
                                            )}
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
