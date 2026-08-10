import axios from 'axios';
import api from './axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const bulkImportApi = {
  downloadTemplate: async (type) => {
    // Use raw axios (not the api instance) to bypass the JSON response interceptor
    const response = await axios.get(`${API_BASE}/bulk-import/template/${type}`, {
      responseType: 'blob',
      withCredentials: true,
    });

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_template.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  importFile: async (type, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/bulk-import/${type}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response;
  },
};
