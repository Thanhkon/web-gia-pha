import { AuthUser, UserRole } from './auth';

export { UserRole };

export enum EventType {
  DEATH_ANNIVERSARY = 'DEATH_ANNIVERSARY',
  FAMILY_MEETING = 'FAMILY_MEETING',
  WEDDING = 'WEDDING',
  LONGEVITY_CELEBRATION = 'LONGEVITY_CELEBRATION',
  ANNIVERSARY = 'ANNIVERSARY',
  SCHOLARSHIP = 'SCHOLARSHIP',
  OTHER = 'OTHER',
}

export enum EventStatus {
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum EventVisibility {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
}

export enum CalendarType {
  SOLAR = 'SOLAR',
  LUNAR = 'LUNAR',
}

export enum RecurrenceFrequency {
  NONE = 'NONE',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum RecurrenceEditScope {
  THIS_EVENT = 'THIS_EVENT',
  THIS_AND_FUTURE = 'THIS_AND_FUTURE',
  ALL_EVENTS = 'ALL_EVENTS',
}

export interface Reminder {
  id: string;
  minutesBefore: number;
  label: string;
}

export interface Recurrence {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate?: string;
  count?: number;
}

export interface EventCreator {
  id: string;
  name: string;
}

export interface Event {
  id: string;
  familyId: string;
  title: string;
  type: EventType;
  status: EventStatus;
  visibility: EventVisibility;
  description: string;
  location: string;
  inputCalendar: CalendarType;
  startAt: string;
  endAt: string;
  recurrence: Recurrence;
  seriesId?: string;
  occurrenceId?: string;
  recurrenceDate?: string;
  reminders: Reminder[];
  sendNotification: boolean;
  cancelReason?: string;
  createdBy?: EventCreator;
  createdAt: string;
  updatedAt: string;
}

export interface EventPayload {
  familyId?: string;
  title: string;
  type: EventType;
  visibility: EventVisibility;
  description: string;
  location: string;
  inputCalendar: CalendarType;
  startAt: string;
  endAt: string;
  recurrence: Recurrence;
  seriesId?: string;
  occurrenceId?: string;
  recurrenceDate?: string;
  reminders: Reminder[];
  sendNotification: boolean;
}

export interface EventQueryParams {
  search?: string;
  type?: EventType | '';
  status?: EventStatus | '';
  visibility?: EventVisibility | '';
  year?: number;
  month?: number;
  from?: string;
  to?: string;
  simulateError?: boolean;
}

export interface CancelEventPayload {
  reason: string;
  scope?: RecurrenceEditScope;
}

export interface DeleteEventPayload {
  scope?: RecurrenceEditScope;
}

export interface ApiResponse<T> {
  data: T;
  meta: {
    requestId: string;
    timestamp: string;
    source: 'mock';
  };
}

export type MockCurrentUser = AuthUser;
