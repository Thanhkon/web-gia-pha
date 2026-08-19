import apiClient from '../utils/apiClient';

export const getEditRequestsAPI = async (familyId) => {
  const response = await apiClient.get(`/families/${familyId}/edit-requests`);
  return response.data;
};

export const addEditRequestAPI = async (familyId, requestData) => {
  const response = await apiClient.post(`/families/${familyId}/edit-requests`, requestData);
  return response.data;
};

export const approveEditRequestAPI = async (id, adminNote, reviewerName) => {
  const response = await apiClient.patch(`/edit-requests/${id}/approve`, {
    adminNote,
    reviewedBy: reviewerName
  });
  return response.data;
};

export const rejectEditRequestAPI = async (id, adminNote, reviewerName) => {
  const response = await apiClient.patch(`/edit-requests/${id}/reject`, {
    adminNote,
    reviewedBy: reviewerName
  });
  return response.data;
};

export const deleteEditRequestAPI = async (id) => {
  await apiClient.delete(`/edit-requests/${id}`);
  return id;
};
