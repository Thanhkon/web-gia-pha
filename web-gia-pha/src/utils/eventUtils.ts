import {
  CalendarType,
  Event,
  EventPayload,
  EventQueryParams,
  EventStatus,
  EventVisibility,
  RecurrenceFrequency,
} from '../types/events';
import { parseLocalDate, toVietnamDateTimeOffset } from '../services/calendarService';

const DEFAULT_FAMILY_ID = String(import.meta.env.VITE_DEFAULT_FAMILY_ID || '1');

export const toApiVisibility = (visibility?: EventVisibility | string) => (
  visibility === EventVisibility.PUBLIC ? 'PUBLIC' : 'FAMILY'
);

export const fromApiVisibility = (visibility?: string) => (
  visibility === 'PUBLIC' ? EventVisibility.PUBLIC : EventVisibility.INTERNAL
);

export const parseRecurrenceMeta = (value?: string | null) => {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

export const hasOwn = (payload: object, key: string) => Object.prototype.hasOwnProperty.call(payload, key);

export const compactPayload = (payload: Record<string, unknown>) => Object.fromEntries(
  Object.entries(payload).filter(([, value]) => value !== undefined)
);

export const buildRecurrenceRule = (
  payload: Partial<EventPayload>,
  options: {
    baseMeta?: Record<string, unknown>;
    cancelReason?: string;
    cancelScope?: string;
    includeDefaults?: boolean;
  } = {}
) => {
  const meta = { ...(options.baseMeta || {}) };
  const shouldDefault = Boolean(options.includeDefaults);

  if (shouldDefault || hasOwn(payload, 'inputCalendar')) {
    meta.inputCalendar = payload.inputCalendar || meta.inputCalendar || CalendarType.SOLAR;
  }

  if (shouldDefault || hasOwn(payload, 'recurrence')) {
    meta.recurrence = payload.recurrence || meta.recurrence || {
      frequency: RecurrenceFrequency.NONE,
      interval: 1,
    };
  }

  if (shouldDefault || hasOwn(payload, 'reminders')) {
    meta.reminders = payload.reminders || meta.reminders || [];
  }

  if (shouldDefault || hasOwn(payload, 'sendNotification')) {
    meta.sendNotification = payload.sendNotification ?? meta.sendNotification ?? true;
  }

  if (options.cancelReason !== undefined) {
    meta.cancelReason = options.cancelReason;
  }

  if (options.cancelScope !== undefined) {
    meta.cancelScope = options.cancelScope;
  }

  return JSON.stringify(meta);
};

export const computeEventStatus = (event: Event, now = new Date()): EventStatus => {
  if (event.status === EventStatus.CANCELLED) return EventStatus.CANCELLED;

  const startAt = parseLocalDate(event.startAt);
  const endAt = parseLocalDate(event.endAt);

  if (now < startAt) return EventStatus.UPCOMING;
  if (now <= endAt) return EventStatus.ONGOING;
  return EventStatus.COMPLETED;
};

export const toEvent = (record: any): Event => {
  const meta = parseRecurrenceMeta(record.recurrenceRule);
  const event: Event = {
    id: String(record.id),
    familyId: String(record.familyId || DEFAULT_FAMILY_ID),
    title: record.title || '',
    type: record.type || record.eventType || 'OTHER',
    status: record.status || EventStatus.UPCOMING,
    visibility: fromApiVisibility(record.visibility),
    description: record.description || '',
    location: record.location || '',
    inputCalendar: meta.inputCalendar || CalendarType.SOLAR,
    startAt: record.startAt,
    endAt: record.endAt || record.startAt,
    recurrence: meta.recurrence || {
      frequency: record.isRecurring ? RecurrenceFrequency.YEARLY : RecurrenceFrequency.NONE,
      interval: 1,
    },
    reminders: Array.isArray(meta.reminders) ? meta.reminders : [],
    sendNotification: meta.sendNotification ?? true,
    cancelReason: meta.cancelReason,
    createdBy: record.createdBy ? {
      id: String(record.createdBy.id),
      name: record.createdBy.name || record.createdBy.email || 'Nguoi dung',
    } : undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };

  return {
    ...event,
    status: computeEventStatus(event),
    reminders: event.status === EventStatus.CANCELLED ? [] : event.reminders,
  };
};

export const hasRecurrenceMeta = (
  payload: Partial<EventPayload>,
  options: { cancelReason?: string; cancelScope?: string; includeDefaults?: boolean } = {}
) => (
  options.includeDefaults
    || options.cancelReason !== undefined
    || options.cancelScope !== undefined
    || hasOwn(payload, 'inputCalendar')
    || hasOwn(payload, 'recurrence')
    || hasOwn(payload, 'reminders')
    || hasOwn(payload, 'sendNotification')
);

export const toEventPayload = (
  payload: Partial<EventPayload>,
  options: {
    status?: EventStatus;
    cancelReason?: string;
    cancelScope?: string;
    baseMeta?: Record<string, unknown>;
    includeDefaults?: boolean;
  } = {}
) => compactPayload({
  title: hasOwn(payload, 'title') ? payload.title : undefined,
  description: hasOwn(payload, 'description') ? payload.description || null : undefined,
  eventType: hasOwn(payload, 'type') ? payload.type : undefined,
  status: options.status,
  visibility: hasOwn(payload, 'visibility') ? toApiVisibility(payload.visibility) : undefined,
  startAt: hasOwn(payload, 'startAt') && payload.startAt
    ? toVietnamDateTimeOffset(payload.startAt)
    : undefined,
  endAt: hasOwn(payload, 'endAt') && payload.endAt
    ? toVietnamDateTimeOffset(payload.endAt)
    : undefined,
  location: hasOwn(payload, 'location') ? payload.location || null : undefined,
  isRecurring: hasOwn(payload, 'recurrence')
    ? payload.recurrence?.frequency !== RecurrenceFrequency.NONE
    : undefined,
  recurrenceRule: hasRecurrenceMeta(payload, options)
    ? buildRecurrenceRule(payload, options)
    : undefined,
});

export const normalizeText = (value = '') => value.trim().toLowerCase();

export const filterEvents = (events: Event[], params?: EventQueryParams) => {
  const search = normalizeText(params?.search);
  return events.filter((event) => {
    const matchesSearch = search
      ? normalizeText(`${event.title} ${event.location} ${event.description}`).includes(search)
      : true;
    const matchesType = params?.type ? event.type === params.type : true;
    const matchesStatus = params?.status ? event.status === params.status : true;
    const matchesVisibility = params?.visibility ? event.visibility === params.visibility : true;

    return matchesSearch && matchesType && matchesStatus && matchesVisibility;
  });
};

export const isInRange = (event: Event, from: Date, to: Date) => {
  const start = parseLocalDate(event.startAt);
  const end = parseLocalDate(event.endAt);
  return start <= to && end >= from;
};

export const sortByStartDate = (events: Event[]) => {
  return [...events].sort((left, right) => parseLocalDate(left.startAt).getTime() - parseLocalDate(right.startAt).getTime());
};
