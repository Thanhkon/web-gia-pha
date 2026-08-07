import apiClient from '../utils/apiClient';
import { AuthUser, UserRole } from '../types/auth';
import {
  ApiResponse,
  CalendarType,
  CancelEventPayload,
  DeleteEventPayload,
  Event,
  EventPayload,
  EventQueryParams,
  EventStatus,
  EventVisibility,
  MockCurrentUser,
  RecurrenceFrequency,
} from '../types/events';
import {
  formatVietnamDateKey,
  formatVietnamDateTimeOffset,
  getMonthRange,
  parseLocalDate,
  toVietnamDateTimeOffset,
} from './calendarService';

const DEFAULT_FAMILY_ID = String(import.meta.env.VITE_DEFAULT_FAMILY_ID || '1');

const guestUser: MockCurrentUser = {
  id: 'guest',
  name: 'Khach',
  role: UserRole.GUEST,
  familyId: '',
  memberId: null,
  isAuthenticated: false,
  permissions: {},
};

const createResponse = <T>(data: T): ApiResponse<T> => ({
  data,
  meta: {
    requestId: `api-${Date.now()}`,
    timestamp: formatVietnamDateTimeOffset(),
    source: 'api',
  },
});

const normalizeRole = (role?: string | UserRole) => {
  const normalizedRole = String(role || '').toUpperCase();
  if (normalizedRole === UserRole.ADMIN) return UserRole.ADMIN;
  if (normalizedRole === UserRole.FAMILY_HEAD) return UserRole.FAMILY_HEAD;
  if (normalizedRole === UserRole.MEMBER) return UserRole.MEMBER;
  return UserRole.GUEST;
};

const toApiVisibility = (visibility?: EventVisibility | string) => (
  visibility === EventVisibility.PUBLIC ? 'PUBLIC' : 'FAMILY'
);

const fromApiVisibility = (visibility?: string) => (
  visibility === 'PUBLIC' ? EventVisibility.PUBLIC : EventVisibility.INTERNAL
);

const parseRecurrenceMeta = (value?: string | null) => {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const hasOwn = (payload: object, key: string) => Object.prototype.hasOwnProperty.call(payload, key);

const compactPayload = (payload: Record<string, unknown>) => Object.fromEntries(
  Object.entries(payload).filter(([, value]) => value !== undefined)
);

const buildRecurrenceRule = (
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

const computeEventStatus = (event: Event, now = new Date()): EventStatus => {
  if (event.status === EventStatus.CANCELLED) return EventStatus.CANCELLED;

  const startAt = parseLocalDate(event.startAt);
  const endAt = parseLocalDate(event.endAt);

  if (now < startAt) return EventStatus.UPCOMING;
  if (now <= endAt) return EventStatus.ONGOING;
  return EventStatus.COMPLETED;
};

const toEvent = (record): Event => {
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

const hasRecurrenceMeta = (
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

const toEventPayload = (
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

const normalizeText = (value = '') => value.trim().toLowerCase();

const filterEvents = (events: Event[], params?: EventQueryParams) => {
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

const isInRange = (event: Event, from: Date, to: Date) => {
  const start = parseLocalDate(event.startAt);
  const end = parseLocalDate(event.endAt);
  return start <= to && end >= from;
};

const sortByStartDate = (events: Event[]) => {
  return [...events].sort((left, right) => parseLocalDate(left.startAt).getTime() - parseLocalDate(right.startAt).getTime());
};

async function fetchFamilyEvents(actor: MockCurrentUser | null, params?: EventQueryParams) {
  if (!actor?.familyId) return [];

  const response = await apiClient.get(`/families/${Number(actor.familyId)}/events`, {
    params: {
      eventType: params?.type || undefined,
      visibility: params?.visibility ? toApiVisibility(params.visibility) : undefined,
    },
  });

  return response.data.map(toEvent);
}

export function getEventActor(user?: AuthUser | null, isAuthenticated = Boolean(user), currentFamilyId?: string | null): MockCurrentUser | null {
  const role = normalizeRole(user?.role);

  if (!isAuthenticated || !user || !user.id || role === UserRole.GUEST) {
    return null;
  }

  return {
    ...user,
    id: String(user.id),
    name: user.name || 'Nguoi dung',
    role,
    familyId: currentFamilyId || String(user.familyId || DEFAULT_FAMILY_ID),
    isAuthenticated: true,
  };
}

export function canManageEvent(user: MockCurrentUser | null | undefined, event?: Event | null) {
  if (!user || (user.role !== UserRole.FAMILY_HEAD && user.role !== UserRole.ADMIN) || !user.familyId) {
    return false;
  }

  return event ? event.familyId === user.familyId : true;
}

export const canCreateEvent = (user: MockCurrentUser | null | undefined) => canManageEvent(user);
export const canUpdateEvent = canManageEvent;
export const canCancelEvent = canManageEvent;
export const canDeleteEvent = canManageEvent;

function isPubliclyVisibleStatus(event: Event) {
  return event.status !== EventStatus.CANCELLED;
}

export function canViewEvent(event: Event, user: MockCurrentUser | null | undefined) {
  const actor = user || guestUser;

  if (actor.role === UserRole.GUEST) {
    return event.visibility === EventVisibility.PUBLIC && isPubliclyVisibleStatus(event);
  }

  if (!actor.familyId || actor.familyId !== event.familyId) {
    return false;
  }

  return actor.role === UserRole.FAMILY_HEAD
    || actor.role === UserRole.MEMBER;
}

export const eventService = {
  async getCurrentUser(user?: AuthUser | null, isAuthenticated = Boolean(user), currentFamilyId?: string | null) {
    return createResponse(getEventActor(user, isAuthenticated, currentFamilyId));
  },

  async getEvents(params?: EventQueryParams, actor: MockCurrentUser | null = null) {
    const data = sortByStartDate(filterEvents(await fetchFamilyEvents(actor, params), params));
    return createResponse(data);
  },

  async getCalendarEvents(params: EventQueryParams, actor: MockCurrentUser | null = null) {
    const monthDate = new Date(params.year ?? new Date().getFullYear(), params.month ?? new Date().getMonth(), 1);
    const { start, end } = getMonthRange(monthDate);
    const data = (await fetchFamilyEvents(actor, params)).filter((event) => isInRange(event, start, end));
    return createResponse(sortByStartDate(filterEvents(data, params)));
  },

  async getTodayEvents(params?: EventQueryParams, actor: MockCurrentUser | null = null) {
    const todayKey = formatVietnamDateKey(new Date());
    const data = (await fetchFamilyEvents(actor, params)).filter((event) => {
      return todayKey >= formatVietnamDateKey(event.startAt)
        && todayKey <= formatVietnamDateKey(event.endAt);
    });

    return createResponse(sortByStartDate(filterEvents(data, params)));
  },

  async getUpcomingEvents(days = 30, params?: EventQueryParams, actor: MockCurrentUser | null = null) {
    const start = parseLocalDate(`${formatVietnamDateKey(new Date())}T00:00:00+07:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    end.setHours(23, 59, 59, 999);

    const data = (await fetchFamilyEvents(actor, params)).filter((event) => (
      event.status !== EventStatus.CANCELLED && isInRange(event, start, end)
    ));

    return createResponse(sortByStartDate(filterEvents(data, params)));
  },

  async getEventById(eventId: string, actor: MockCurrentUser | null = null) {
    const response = await apiClient.get(`/events/${eventId}`);
    const event = toEvent(response.data);
    if (!canViewEvent(event, actor)) {
      throw new Error('Khong tim thay su kien hoac ban khong co quyen xem.');
    }

    return createResponse(event);
  },

  async createEvent(data: EventPayload, actor: MockCurrentUser | null = null) {
    if (!actor || !canCreateEvent(actor)) {
      throw new Error('Ban khong co quyen tao su kien.');
    }

    const response = await apiClient.post(
      `/families/${Number(actor.familyId)}/events`,
      toEventPayload(data, { status: EventStatus.UPCOMING, includeDefaults: true })
    );
    return createResponse(toEvent(response.data));
  },

  async updateEvent(eventId: string, data: Partial<EventPayload>, actor: MockCurrentUser | null = null) {
    const currentResponse = await apiClient.get(`/events/${eventId}`);
    const currentEvent = toEvent(currentResponse.data);

    if (!canUpdateEvent(actor, currentEvent)) {
      throw new Error('Ban khong co quyen chinh sua su kien nay.');
    }

    const response = await apiClient.patch(`/events/${eventId}`, toEventPayload(data));
    return createResponse(toEvent(response.data));
  },

  async cancelEvent(eventId: string, data: CancelEventPayload, actor: MockCurrentUser | null = null) {
    const currentResponse = await apiClient.get(`/events/${eventId}`);
    const currentEvent = toEvent(currentResponse.data);

    if (!canCancelEvent(actor, currentEvent)) {
      throw new Error('Ban khong co quyen huy su kien nay.');
    }

    const response = await apiClient.patch(
      `/events/${eventId}`,
      toEventPayload({}, {
        status: EventStatus.CANCELLED,
        cancelReason: data.reason,
        cancelScope: data.scope,
        baseMeta: parseRecurrenceMeta(currentResponse.data.recurrenceRule),
      })
    );
    return createResponse(toEvent(response.data));
  },

  async deleteEvent(eventId: string, _data?: DeleteEventPayload, actor: MockCurrentUser | null = null) {
    const currentResponse = await apiClient.get(`/events/${eventId}`);
    const currentEvent = toEvent(currentResponse.data);

    if (!canDeleteEvent(actor, currentEvent)) {
      throw new Error('Ban khong co quyen xoa su kien nay.');
    }

    await apiClient.delete(`/events/${eventId}`);
    return createResponse({ deleted: true, eventId });
  },
};
