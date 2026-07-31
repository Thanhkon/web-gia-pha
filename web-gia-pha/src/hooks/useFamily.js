import { useParams } from 'react-router-dom';

/**
 * Custom hook to get the active familyId.
 * Currently it extracts familyId from the URL params.
 * In the future, this can be extended to fall back to Redux state 
 * or localStorage if familyId is not in the URL.
 */
export const useFamily = () => {
  const { familyId } = useParams();
  
  // Future logic:
  // if (!familyId) {
  //   return useSelector(state => state.auth.defaultFamilyId);
  // }
  
  return familyId;
};
