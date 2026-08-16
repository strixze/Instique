import api from './axios';

export const dashboardApi = {
  getSchoolAdmin: () => api.get('/dashboards/school-admin'),
  getSuperAdmin: () => api.get('/dashboards/super-admin'),
  getTeacher: () => api.get('/dashboards/teacher'),
  getStudent: () => api.get('/dashboards/student'),
  getParent: () => api.get('/dashboards/parent'),
};
