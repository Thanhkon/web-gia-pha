import apiClient from '../utils/apiClient';

export const getFamilies = async () => {
  const response = await apiClient.get('/families');
  return response.data;
};

export const getFamilyByCode = async (code) => {
  const response = await apiClient.get(`/families/code/${code}`);
  return response.data;
};

export const createFamilyAPI = async (familyData) => {
  const isFormData = familyData instanceof FormData;
  const response = await apiClient.post('/families', familyData, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return response.data;
};

export const updateFamilyAPI = async (id, data) => {
  const response = await apiClient.patch(`/families/${id}`, data);
  return response.data;
};

export const uploadCoverImageAPI = async (familyId, file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await apiClient.post(`/families/${familyId}/cover-image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteFamilyAPI = async (id) => {
  await apiClient.delete(`/families/${id}`);
  return id;
};
