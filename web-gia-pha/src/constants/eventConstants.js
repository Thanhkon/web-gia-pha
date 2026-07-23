import {
  EventStatus,
  EventType,
  EventVisibility,
  RecurrenceEditScope,
  RecurrenceFrequency,
  UserRole,
} from '../types/events';

export const eventTypeOptions = [
  { value: EventType.DEATH_ANNIVERSARY, label: 'Ngày giỗ' },
  { value: EventType.FAMILY_MEETING, label: 'Họp họ' },
  { value: EventType.WEDDING, label: 'Cưới hỏi' },
  { value: EventType.LONGEVITY_CELEBRATION, label: 'Mừng thọ' },
  { value: EventType.ANNIVERSARY, label: 'Lễ kỷ niệm' },
  { value: EventType.SCHOLARSHIP, label: 'Khuyến học' },
  { value: EventType.OTHER, label: 'Khác' },
];

export const eventTypeLabels = Object.fromEntries(eventTypeOptions.map((item) => [item.value, item.label]));

export const eventStatusLabels = {
  [EventStatus.UPCOMING]: 'Sắp diễn ra',
  [EventStatus.ONGOING]: 'Đang diễn ra',
  [EventStatus.COMPLETED]: 'Đã hoàn thành',
  [EventStatus.CANCELLED]: 'Đã hủy',
};

export const eventVisibilityLabels = {
  [EventVisibility.PUBLIC]: 'PUBLIC',
  [EventVisibility.INTERNAL]: 'INTERNAL',
};

export const recurrenceLabels = {
  [RecurrenceFrequency.NONE]: 'Không lặp',
  [RecurrenceFrequency.WEEKLY]: 'Hằng tuần',
  [RecurrenceFrequency.MONTHLY]: 'Hằng tháng',
  [RecurrenceFrequency.YEARLY]: 'Hằng năm',
};

export const recurrenceScopeLabels = {
  [RecurrenceEditScope.THIS_EVENT]: 'Chỉ sự kiện này',
  [RecurrenceEditScope.THIS_AND_FUTURE]: 'Sự kiện này và các lần sau',
  [RecurrenceEditScope.ALL_EVENTS]: 'Toàn bộ chuỗi sự kiện',
};

export const roleLabels = {
  [UserRole.FAMILY_HEAD]: 'Trưởng họ',
  [UserRole.MEMBER]: 'Thành viên',
  [UserRole.GUEST]: 'Khách',
};

export const isRecurringEvent = (event) => event?.recurrence?.frequency && event.recurrence.frequency !== RecurrenceFrequency.NONE;

