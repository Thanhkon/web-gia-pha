import apiClient from '../utils/apiClient';

export const getFamilyTreeAPI = async (familyId) => {
  const response = await apiClient.get(`/families/${familyId}/members`);
  return response.data;
};

export const addMemberAPI = async (familyId, memberData) => {
  const response = await apiClient.post(`/families/${familyId}/members`, memberData);
  return response.data;
};

export const updateMemberAPI = async (memberId, memberData) => {
  const response = await apiClient.patch(`/members/${memberId}`, memberData);
  return response.data;
};

export const deleteMemberAPI = async (memberId) => {
  await apiClient.delete(`/members/${memberId}`);
  return memberId;
};

export const uploadMemberAvatarAPI = async (memberId, file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await apiClient.post(`/members/${memberId}/avatar`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const addParentChildRelationAPI = async (relationData) => {
  const response = await apiClient.post(`/parent-child-relations`, relationData);
  return response.data;
};

export const addMarriageRelationAPI = async (marriageData) => {
  const response = await apiClient.post(`/marriages`, marriageData);
  return response.data;
};
