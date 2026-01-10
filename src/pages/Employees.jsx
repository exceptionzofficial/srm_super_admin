/**
 * Employees Management Page
 */

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUser, FiMapPin, FiSearch, FiUpload, FiCreditCard, FiImage } from 'react-icons/fi';
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
        workMode: 'OFFICE',
        employeeType: 'mobile', // 'mobile' or 'kiosk'
        // Documents
        panNumber: '',
        aadharNumber: '',
        // Statutory & Bank
        uan: '',
        esicIP: '',
        bankAccount: '',
        ifscCode: '',
        paymentMode: 'CASH',
        joinedDate: '',
    });
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [searchTerm, setSearchTerm] = useState('');

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

    // Filter and Sort Employees
    const filteredEmployees = employees
        .filter(emp => {
            const searchLower = searchTerm.toLowerCase();
            return (
                emp.name?.toLowerCase().includes(searchLower) ||
                emp.employeeId?.toLowerCase().includes(searchLower)
            );
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    // Separate by type
    const mobileEmployees = filteredEmployees.filter(emp => emp.employeeType !== 'kiosk');
    const kioskEmployees = filteredEmployees.filter(emp => emp.employeeType === 'kiosk');

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
                workMode: employee.workMode || 'OFFICE',
                employeeType: employee.employeeType || 'mobile',
                panNumber: employee.panNumber || '',
                aadharNumber: employee.aadharNumber || '',
                uan: employee.uan || '',
                esicIP: employee.esicIP || '',
                bankAccount: employee.bankAccount || '',
                ifscCode: employee.ifscCode || '',
                paymentMode: employee.paymentMode || 'CASH',
                joinedDate: employee.joinedDate ? employee.joinedDate.split('T')[0] : '',
            });
            setPhotoPreview(employee.photoUrl || null);
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
                workMode: 'OFFICE',
                employeeType: 'mobile',
                panNumber: '',
                aadharNumber: '',
                uan: '',
                esicIP: '',
                bankAccount: '',
                ifscCode: '',
                paymentMode: 'CASH',
                joinedDate: '',
            });
            setPhotoPreview(null);
        }
        setPhotoFile(null);
        setShowModal(true);
        setError('');
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingEmployee(null);
        setPhotoFile(null);
        setPhotoPreview(null);
        setError('');
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
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
            // Build FormData if there's a photo file
            let dataToSend;
            if (photoFile) {
                dataToSend = new FormData();
                Object.entries(formData).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        dataToSend.append(key, value);
                    }
                });
                dataToSend.append('photo', photoFile);
            } else {
                dataToSend = formData;
            }

            if (editingEmployee) {
                await updateEmployee(editingEmployee.employeeId, dataToSend);
                setSuccess('Employee updated successfully');
            } else {
                await createEmployee(dataToSend);
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
                <div className="header-actions">
                    <div className="search-wrapper">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <FiPlus /> Add Employee
                    </button>
                </div>
            </div>

            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Mobile Employees Section */}
            <h2 className="section-title" style={{ marginTop: '20px', marginBottom: '10px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📱 Mobile App Employees ({mobileEmployees.length})
            </h2>
            <div className="card">
                {mobileEmployees.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Employee ID</th>
                                    <th>Name</th>
                                    <th>Branch</th>
                                    <th>Department</th>
                                    <th>Work Mode</th>
                                    <th>Face Status</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mobileEmployees.map((emp) => (
                                    <tr key={emp.employeeId}>
                                        <td><strong>{emp.employeeId}</strong></td>
                                        <td>
                                            <div className="employee-info">
                                                <div className={`employee-avatar ${emp.photoUrl ? 'has-photo' : ''}`}>
                                                    {emp.photoUrl ? <img src={emp.photoUrl} alt={emp.name} /> : <FiUser />}
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
                                            {emp.workMode === 'FIELD_SALES' || emp.workMode === 'REMOTE' ? (
                                                <span className="badge badge-warning">On Duty / Travel</span>
                                            ) : (
                                                <span className="badge badge-secondary">Office</span>
                                            )}
                                        </td>
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
                                                <button className="action-btn edit" onClick={() => openModal(emp)}><FiEdit2 /></button>
                                                <button className="action-btn delete" onClick={() => handleDelete(emp.employeeId)}><FiTrash2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="empty-message">No mobile app employees found.</p>
                )}
            </div>

            {/* Kiosk Employees Section */}
            <h2 className="section-title" style={{ marginTop: '30px', marginBottom: '10px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🖥️ Kiosk / Common Employees ({kioskEmployees.length})
            </h2>
            <div className="card">
                {kioskEmployees.length > 0 ? (
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
                                {kioskEmployees.map((emp) => (
                                    <tr key={emp.employeeId}>
                                        <td><strong>{emp.employeeId}</strong></td>
                                        <td>
                                            <div className="employee-info">
                                                <div className={`employee-avatar ${emp.photoUrl ? 'has-photo' : ''}`}>
                                                    {emp.photoUrl ? <img src={emp.photoUrl} alt={emp.name} /> : <FiUser />}
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
                                                <button className="action-btn edit" onClick={() => openModal(emp)}><FiEdit2 /></button>
                                                <button className="action-btn delete" onClick={() => handleDelete(emp.employeeId)}><FiTrash2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="empty-message">No kiosk employees found.</p>
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

                            <div className="form-group">
                                <label className="form-label">Employee Type</label>
                                <select
                                    className="form-input form-select"
                                    value={formData.employeeType}
                                    onChange={(e) => setFormData({ ...formData, employeeType: e.target.value })}
                                >
                                    <option value="mobile">📱 Mobile App Employee (SRM...)</option>
                                    <option value="kiosk">🖥️ Kiosk / Common Employee (SRMC...)</option>
                                </select>
                                <p className="form-hint" style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                    Mobile: Uses personal phone & app. Kiosk: Uses common tablet at entrance.
                                </p>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Work Mode (Attendance)</label>
                                <select
                                    className="form-input form-select"
                                    value={formData.workMode}
                                    onChange={(e) => setFormData({ ...formData, workMode: e.target.value })}
                                >
                                    <option value="OFFICE">Office Based (Strict Geofence)</option>
                                    <option value="FIELD_SALES">Field Sales / Travel (Remote Check-in)</option>
                                    <option value="REMOTE">Remote / WFH</option>
                                </select>
                                <p className="form-hint" style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                    "Field Sales" allows checking in from anywhere using "On Duty" mode.
                                </p>
                            </div>


                            {/* Document Fields Section */}
                            <div className="form-section-divider">
                                <span>Employee Documents</span>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label"><FiCreditCard style={{ marginRight: '6px' }} />PAN Number</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.panNumber}
                                        onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                                        placeholder="e.g., ABCDE1234F"
                                        maxLength={10}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label"><FiCreditCard style={{ marginRight: '6px' }} />Aadhar Number</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.aadharNumber}
                                        onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value.replace(/\D/g, '') })}
                                        placeholder="e.g., 123456789012"
                                        maxLength={12}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label"><FiImage style={{ marginRight: '6px' }} />Employee Photo</label>
                                <div className="photo-upload-container">
                                    {photoPreview ? (
                                        <div className="photo-preview">
                                            <img src={photoPreview} alt="Preview" />
                                            <button
                                                type="button"
                                                className="photo-remove-btn"
                                                onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="photo-upload-label">
                                            <FiUpload size={24} />
                                            <span>Click to upload photo</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePhotoChange}
                                                style={{ display: 'none' }}
                                            />
                                        </label>
                                    )}
                                </div>
                                <p className="form-hint" style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                    Max file size: 5MB. Supported formats: JPG, PNG, GIF
                                </p>
                            </div>

                            {/* Statutory & Bank Details Section */}
                            <div className="form-section-divider">
                                <span>Statutory & Bank Details</span>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">UAN (PF)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.uan}
                                        onChange={(e) => setFormData({ ...formData, uan: e.target.value })}
                                        placeholder="Universal Account Number"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">ESIC IP No</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.esicIP}
                                        onChange={(e) => setFormData({ ...formData, esicIP: e.target.value })}
                                        placeholder="Insurance Number"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Bank Account No</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.bankAccount}
                                        onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                                        placeholder="Enter Account Number"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">IFSC Code</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.ifscCode}
                                        onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                                        placeholder="Enter IFSC Code"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Payment Mode</label>
                                    <select
                                        className="form-input form-select"
                                        value={formData.paymentMode}
                                        onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                                    >
                                        <option value="CASH">CASH</option>
                                        <option value="BANK">BANK TRANSFER</option>
                                        <option value="CHEQUE">CHEQUE</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date of Joining</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.joinedDate}
                                        onChange={(e) => setFormData({ ...formData, joinedDate: e.target.value })}
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
