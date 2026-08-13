import { UserRole } from '../../types/auth';

export const formatDate = (value) => new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}).format(new Date(value));

export const isImageSource = (value) => (
  typeof value === 'string'
    && (value.startsWith('data:image') || /^https?:\/\//i.test(value))
);

export const getActorText = (actor) => {
  if (!actor) return 'Bạn đang xem với quyền khách.';
  if (actor.role === UserRole.FAMILY_HEAD) return 'Bạn đang quản lý với quyền Trưởng họ.';
  if (actor.role === UserRole.ADMIN || actor.role === 'ADMIN') return 'Bạn đang quản lý với quyền Biên tập viên.';
  return 'Bạn đang xem với quyền Thành viên.';
};
