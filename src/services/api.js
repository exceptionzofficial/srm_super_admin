/**
 * API Service for Super Admin Panel
 */

import axios from 'axios';

// API Base URL - Production Vercel deployment
const API_BASE_URL = 'https://srm-backend-lake.vercel.app';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// ==================== EMPLOYEE ENDPOINTS ====================

export const getEmployees = async () => {
    const response = await api.get('/api/employees');
    return response.data;
};

export const getEmployee = async (employeeId) => {
    const response = await api.get(`/api/employees/${employeeId}`);
    return response.data;
};

export const createEmployee = async (employeeData) => {
    const response = await api.post('/api/employees', employeeData);
    return response.data;
};

export const updateEmployee = async (employeeId, updates) => {
    const response = await api.put(`/api/employees/${employeeId}`, updates);
    return response.data;
};

export const deleteEmployee = async (employeeId) => {
    const response = await api.delete(`/api/employees/${employeeId}`);
    return response.data;
};

// ==================== SETTINGS ENDPOINTS ====================

export const getGeofenceSettings = async () => {
    const response = await api.get('/api/settings/geofence');
    return response.data;
};

export const updateGeofenceSettings = async (settings) => {
    const response = await api.put('/api/settings/geofence', settings);
    return response.data;
};

// ==================== ATTENDANCE ENDPOINTS ====================

export const getAttendanceByDate = async (date) => {
    const response = await api.get(`/api/attendance/date/${date}`);
    return response.data;
};

export const getEmployeeAttendance = async (employeeId, limit = 30) => {
    const response = await api.get(`/api/attendance/${employeeId}?limit=${limit}`);
    return response.data;
};

export const updateAttendance = async (attendanceId, updates) => {
    const response = await api.put(`/api/attendance/${attendanceId}`, updates);
    return response.data;
};

// ==================== BRANCH ENDPOINTS ====================

export const getBranches = async () => {
    const response = await api.get('/api/branches');
    return response.data;
};

export const getBranch = async (branchId) => {
    const response = await api.get(`/api/branches/${branchId}`);
    return response.data;
};

export const createBranch = async (branchData) => {
    const response = await api.post('/api/branches', branchData);
    return response.data;
};

export const updateBranch = async (branchId, updates) => {
    const response = await api.put(`/api/branches/${branchId}`, updates);
    return response.data;
};

export const deleteBranch = async (branchId) => {
    const response = await api.delete(`/api/branches/${branchId}`);
    return response.data;
};

export default api;
