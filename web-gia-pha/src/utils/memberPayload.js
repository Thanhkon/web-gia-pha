export const buildMemberPayload = (submittedData) => {
  return {
    fullName: submittedData.fullName,
    otherName: submittedData.otherName || null,
    gender: submittedData.gender,
    generation: submittedData.generation,
    role: submittedData.role || null,
    isInLaw: submittedData.isInLaw || false,
    dateOfBirth: submittedData.dateOfBirth || null,
    isDeceased: submittedData.isDeceased || false,
    dateOfDeath: submittedData.dateOfDeath || null,
    placeOfBirth: submittedData.placeOfBirth || null,
    currentAddress: submittedData.currentAddress || null,
    education: submittedData.education || null,
    occupation: submittedData.occupation || null,
    biography: submittedData.biography || null,
    note: submittedData.note || null,
    avatarUrl: submittedData.avatarUrl || null,
  };
};
