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

export default api;
