import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useFamily } from './useFamily';

export const useFamilyActor = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { list: userFamilies } = useSelector((state) => state.families);
  const currentFamilyId = useFamily();
  
  const activeFamily = userFamilies?.find(f => f.id === Number(currentFamilyId));
  const familyRole = activeFamily?.role;

  return useMemo(() => {
    if (!user || !isAuthenticated) return null;

    let mappedRole = user.role;
    let isManager = false;

    if (familyRole === 'editor' || familyRole === 'admin') {
      mappedRole = 'ADMIN';
      isManager = true;
    } else if (familyRole === 'viewer') {
      mappedRole = 'MEMBER';
    }

    return {
      ...user,
      role: mappedRole,
      familyId: currentFamilyId,
      ...(isManager ? { canCreatePost: true, canManagePosts: true } : {})
    };
  }, [user, isAuthenticated, familyRole, currentFamilyId]);
};
