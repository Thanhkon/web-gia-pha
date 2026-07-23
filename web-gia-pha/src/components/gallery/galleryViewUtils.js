import { UserRole } from '../../types/auth';

export const formatDate = (value) => new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}).format(new Date(value));

export const getActorText = (actor) => {
  if (!actor) return 'Bạn đang xem với quyền khách.';
  return actor.role === UserRole.FAMILY_HEAD
    ? 'Bạn đang quản lý với quyền Trưởng họ.'
    : 'Bạn đang xem với quyền Thành viên.';
};
