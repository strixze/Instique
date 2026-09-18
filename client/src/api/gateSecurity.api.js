import api from './axios';

export const gateSecurityApi = {
  // Mock RFID
  scanRfid: (data) => api.post('/gate-security/scan-rfid', data),
  getMockTags: () => api.get('/gate-security/mock-rfid/tags'),

  // Students
  searchStudents: (query) => api.get('/gate-security/students/search', { params: { search: query } }),
  recordManualStudentEvent: (data) => api.post('/gate-security/students/gate-event', data),

  // Unknown Students
  recordUnknownStudent: (data) => api.post('/gate-security/unknown-student', data),

  // Visitors
  recordVisitorEntry: (data) => api.post('/gate-security/visitors/entry', data),
  getActiveVisitors: () => api.get('/gate-security/visitors/active'),
  recordVisitorExit: (id, data) => api.post(`/gate-security/visitors/${id}/exit`, data),

  // Vehicles
  getVehicles: () => api.get('/gate-security/vehicles'),
  createVehicle: (data) => api.post('/gate-security/vehicles', data),
  recordVehicleGateEvent: (data) => api.post('/gate-security/vehicles/gate-event', data),

  // Dashboard & Activity
  getSummary: () => api.get('/gate-security/summary'),
  getActivity: (params) => api.get('/gate-security/activity', { params }),
};

export default gateSecurityApi;
