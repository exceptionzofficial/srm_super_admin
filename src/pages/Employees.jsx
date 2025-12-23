/**
 * Employees Management Page
 */

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUser, FiMapPin } from 'react-icons/fi';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getBranches } from '../services/api';
import './Employees.css';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [formData, setFormData] = useState({
        employeeId: '',
        name: '',
        email: '',
        phone: '',
        department: '',
        designation: '',
        branchId: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [empResponse, branchResponse] = await Promise.all([
                getEmployees(),
                getBranches().catch(() => ({ branches: [] })),
            ]);
            setEmployees(empResponse.employees || []);
            setBranches(branchResponse.branches || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (employee = null) => {
        if (employee) {
            setEditingEmployee(employee);
            setFormData({
                employeeId: employee.employeeId,
                name: employee.name || '',
                email: employee.email || '',
                phone: employee.phone || '',
                department: employee.department || '',
                designation: employee.designation || '',
                branchId: employee.branchId || '',
            });
        } else {
            setEditingEmployee(null);
            setFormData({
                employeeId: '',
                name: '',
                email: '',
                phone: '',
                department: '',
                designation: '',
                branchId: branches.length > 0 ? branches[0].branchId : '',
            });
        }
        setShowModal(true);
        setError('');
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingEmployee(null);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.employeeId || !formData.name) {
            setError('Employee ID and Name are required');
            return;
        }

        if (!formData.branchId && branches.length > 0) {
            setError('Please select a branch');
            return;
        }

        try {
            if (editingEmployee) {
                await updateEmployee(editingEmployee.employeeId, formData);
                setSuccess('Employee updated successfully');
            } else {
                await createEmployee(formData);
                setSuccess('Employee created successfully');
            }
            closeModal();
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Error saving employee');
        }
    };

    const handleDelete = async (employeeId) => {
        if (!confirm('Are you sure you want to delete this employee?')) return;

        try {
            await deleteEmployee(employeeId);
            setSuccess('Employee deleted successfully');
            loadData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Error deleting employee');
        }
    };

    const getBranchName = (branchId) => {
        const branch = branches.find(b => b.branchId === branchId);
        return branch?.name || '-';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="employees-page">
            <div className="page-header">
                <h1 className="page-title">Employees</h1>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <FiPlus /> Add Employee
                </button>
            </div>

            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Employees Table */}
            <div className="card">
                {employees.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Employee ID</th>
                                    <th>Name</th>
                                    <th>Branch</th>
                                    <th>Department</th>
                                    <th>Face Status</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((emp) => (
                                    <tr key={emp.employeeId}>
                                        <td>
                                            <strong>{emp.employeeId}</strong>
                                        </td>
                                        <td>
                                            <div className="employee-info">
                                                <div className="employee-avatar">
                                                    <FiUser />
                                                </div>
                                                <div>
                                                    <span className="employee-name">{emp.name}</span>
                                                    <span className="employee-email">{emp.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="branch-cell">
                                                <FiMapPin className="branch-icon-small" />
                                                <span>{getBranchName(emp.branchId)}</span>
                                            </div>
                                        </td>
                                        <td>{emp.department || '-'}</td>
                                        <td>
                                            <span className={`badge ${emp.faceId ? 'badge-success' : 'badge-warning'}`}>
                                                {emp.faceId ? 'Registered' : 'Not Registered'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${emp.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="action-btn edit" onClick={() => openModal(emp)}>
                                                    <FiEdit2 />
                                                </button>
                                                <button className="action-btn delete" onClick={() => handleDelete(emp.employeeId)}>
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="empty-message">No employees found. Add your first employee!</p>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingEmployee ? 'Edit Employee' : 'Add Employee'}
                            </h2>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            {error && <div className="alert alert-danger">{error}</div>}

                            <div className="form-group">
                                <label className="form-label">Employee ID *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.employeeId}
                                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value.toUpperCase() })}
                                    placeholder="e.g., SRM001"
                                    disabled={editingEmployee}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="Email address"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="Phone number"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Branch *</label>
                                <select
                                    className="form-input form-select"
                                    value={formData.branchId}
                                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                                >
                                    <option value="">Select a branch</option>
                                    {branches.map((branch) => (
                                        <option key={branch.branchId} value={branch.branchId}>
                                            {branch.name} {branch.address ? `(${branch.address})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {branches.length === 0 && (
                                    <p className="form-hint">No branches available. Please add branches first.</p>
                                )}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Department</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        placeholder="Department"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Designation</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.designation}
                                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                        placeholder="Job title"
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingEmployee ? 'Update' : 'Create'} Employee
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;
