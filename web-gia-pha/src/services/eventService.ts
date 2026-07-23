import { mockEvents } from '../data/mockEvents';
import { AuthUser, UserRole } from '../types/auth';
import {
  ApiResponse,
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

const STORAGE_KEY = 'giapha_mock_events';
const STORAGE_VERSION_KEY = 'giapha_mock_events_version';
const STORAGE_VERSION = 'events-auth-v3';

let eventStore: Event[] = readStoredEvents();

const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

const guestUser: MockCurrentUser = {
  id: 'guest',
  name: 'Khách',
  role: UserRole.GUEST,
  familyId: '',
  memberId: null,
  isAuthenticated: false,
  permissions: {},
};

const createResponse = <T>(data: T): ApiResponse<T> => ({
  data,
  meta: {
    requestId: `mock-${Date.now()}`,
    timestamp: formatVietnamDateTimeOffset(),
    source: 'mock',
  },
});

function cloneEvent(event: Event): Event {
  return {
    ...event,
    recurrence: { ...event.recurrence },
    reminders: event.reminders.map((reminder) => ({ ...reminder })),
    createdBy: event.createdBy ? { ...event.createdBy } : undefined,
  };
}

function cloneEvents(events: Event[]): Event[] {
  return events.map(cloneEvent);
}

function readStoredEvents(): Event[] {
  try {
    const savedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved && savedVersion === STORAGE_VERSION) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return cloneEvents(parsed);
      }
    }
  } catch (error) {
    console.warn('Could not read events from localStorage:', error);
  }

  return cloneEvents(mockEvents);
}

function persistEvents() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(eventStore));
    localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
  } catch (error) {
    console.warn('Could not persist events to localStorage:', error);
  }
}

export function getEventActor(user?: AuthUser | null, isAuthenticated = Boolean(user)): MockCurrentUser | null {
  const validRoles = Object.values(UserRole);

  if (
    !isAuthenticated
    || !user
    || !user.id
    || !user.name
    || !user.role
    || !validRoles.includes(user.role)
    || (user.role !== UserRole.GUEST && !user.familyId)
  ) {
    return null;
  }

  if (user.role === UserRole.GUEST) {
    return null;
  }

  return {
    ...user,
    isAuthenticated: true,
  };
}

export function canManageEvent(user: MockCurrentUser | null | undefined, event?: Event | null) {
  if (!user || user.role !== UserRole.FAMILY_HEAD || !user.familyId) {
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
    || (actor.role === UserRole.MEMBER && Boolean(actor.memberId));
}

const ensureNoMockError = (params?: EventQueryParams) => {
  if (params?.simulateError || params?.search === '__error') {
    throw new Error('Không thể tải dữ liệu sự kiện. Vui lòng thử lại.');
  }
};

const computeEventStatus = (event: Event, now = new Date()): EventStatus => {
  if (event.status === EventStatus.CANCELLED) {
    return EventStatus.CANCELLED;
  }

  const startAt = parseLocalDate(event.startAt);
  const endAt = parseLocalDate(event.endAt);

  if (now < startAt) return EventStatus.UPCOMING;
  if (now <= endAt) return EventStatus.ONGOING;
  return EventStatus.COMPLETED;
};

const toServiceEvent = (event: Event): Event => {
  const status = computeEventStatus(event);

  return {
    ...cloneEvent(event),
    status,
    reminders: status === EventStatus.CANCELLED ? [] : event.reminders.map((reminder) => ({ ...reminder })),
  };
};

const getVisibleEvents = (actor: MockCurrentUser | null | undefined) => {
  return eventStore
    .map(toServiceEvent)
    .filter((event) => canViewEvent(event, actor));
};

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

const buildEventPayload = (data: EventPayload, actor: MockCurrentUser): EventPayload => ({
  title: data.title,
  type: data.type,
  visibility: data.visibility,
  description: data.description,
  location: data.location,
  inputCalendar: data.inputCalendar,
  familyId: actor.familyId,
  startAt: toVietnamDateTimeOffset(data.startAt),
  endAt: toVietnamDateTimeOffset(data.endAt),
  recurrence: data.recurrence ?? { frequency: RecurrenceFrequency.NONE, interval: 1 },
  reminders: data.reminders?.map((reminder) => ({ ...reminder })) ?? [],
  sendNotification: data.sendNotification,
});

export const eventService = {
  async getCurrentUser(user?: AuthUser | null, isAuthenticated = Boolean(user)) {
    await wait(120);
    return createResponse(getEventActor(user, isAuthenticated));
  },

  async getEvents(params?: EventQueryParams, actor: MockCurrentUser | null = null) {
    await wait();
    ensureNoMockError(params);
    const data = sortByStartDate(filterEvents(getVisibleEvents(actor), params));
    return createResponse(cloneEvents(data));
  },

  async getCalendarEvents(params: EventQueryParams, actor: MockCurrentUser | null = null) {
    await wait();
    ensureNoMockError(params);

    const monthDate = new Date(params.year ?? new Date().getFullYear(), params.month ?? new Date().getMonth(), 1);
    const { start, end } = getMonthRange(monthDate);
    const visibleEvents = getVisibleEvents(actor).filter((event) => isInRange(event, start, end));

    return createResponse(cloneEvents(sortByStartDate(filterEvents(visibleEvents, params))));
  },

  async getTodayEvents(params?: EventQueryParams, actor: MockCurrentUser | null = null) {
    await wait(240);
    ensureNoMockError(params);
    const todayKey = formatVietnamDateKey(new Date());
    const data = getVisibleEvents(actor).filter((event) => {
      return todayKey >= formatVietnamDateKey(event.startAt)
        && todayKey <= formatVietnamDateKey(event.endAt);
    });

    return createResponse(cloneEvents(sortByStartDate(filterEvents(data, params))));
  },

  async getUpcomingEvents(days = 30, params?: EventQueryParams, actor: MockCurrentUser | null = null) {
    await wait(260);
    ensureNoMockError(params);
    const start = parseLocalDate(`${formatVietnamDateKey(new Date())}T00:00:00+07:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    end.setHours(23, 59, 59, 999);

    const data = getVisibleEvents(actor).filter((event) => (
      event.status !== EventStatus.CANCELLED && isInRange(event, start, end)
    ));

    return createResponse(cloneEvents(sortByStartDate(filterEvents(data, params))));
  },

  async getEventById(eventId: string, actor: MockCurrentUser | null = null) {
    await wait(180);
    const event = eventStore.map(toServiceEvent).find((item) => item.id === eventId);
    if (!event || !canViewEvent(event, actor)) {
      throw new Error('Không tìm thấy sự kiện hoặc bạn không có quyền xem.');
    }

    return createResponse(cloneEvent(event));
  },

  async createEvent(data: EventPayload, actor: MockCurrentUser | null = null) {
    await wait();
    if (!actor || !canCreateEvent(actor)) {
      throw new Error('Bạn không có quyền tạo sự kiện.');
    }

    const now = formatVietnamDateTimeOffset();
    const payload = buildEventPayload(data, actor);
    const event: Event = {
      ...payload,
      id: `evt-${Date.now()}`,
      status: EventStatus.UPCOMING,
      createdBy: {
        id: actor.id,
        name: actor.name,
      },
      createdAt: now,
      updatedAt: now,
    };

    eventStore = [...eventStore, cloneEvent(event)];
    persistEvents();
    return createResponse(toServiceEvent(event));
  },

  async updateEvent(eventId: string, data: Partial<EventPayload>, actor: MockCurrentUser | null = null) {
    await wait();
    const existing = eventStore.find((event) => event.id === eventId);
    if (!existing || !canUpdateEvent(actor, existing)) {
      throw new Error('Bạn không có quyền chỉnh sửa sự kiện này.');
    }

    const updatedEvent: Event = {
      ...existing,
      title: data.title ?? existing.title,
      type: data.type ?? existing.type,
      visibility: data.visibility ?? existing.visibility,
      description: data.description ?? existing.description,
      location: data.location ?? existing.location,
      inputCalendar: data.inputCalendar ?? existing.inputCalendar,
      startAt: data.startAt ? toVietnamDateTimeOffset(data.startAt) : existing.startAt,
      endAt: data.endAt ? toVietnamDateTimeOffset(data.endAt) : existing.endAt,
      recurrence: data.recurrence ? { ...data.recurrence } : { ...existing.recurrence },
      reminders: data.reminders?.map((reminder) => ({ ...reminder })) ?? existing.reminders.map((reminder) => ({ ...reminder })),
      sendNotification: data.sendNotification ?? existing.sendNotification,
      familyId: existing.familyId,
      createdBy: existing.createdBy ? { ...existing.createdBy } : undefined,
      updatedAt: formatVietnamDateTimeOffset(),
    };

    eventStore = eventStore.map((event) => (event.id === eventId ? cloneEvent(updatedEvent) : event));
    persistEvents();
    return createResponse(toServiceEvent(updatedEvent));
  },

  async cancelEvent(eventId: string, data: CancelEventPayload, actor: MockCurrentUser | null = null) {
    await wait();
    const event = eventStore.find((item) => item.id === eventId);
    if (!event || !canCancelEvent(actor, event)) {
      throw new Error('Bạn không có quyền hủy sự kiện này.');
    }

    const cancelledEvent: Event = {
      ...event,
      status: EventStatus.CANCELLED,
      reminders: [],
      cancelReason: data.reason,
      updatedAt: formatVietnamDateTimeOffset(),
    };

    eventStore = eventStore.map((item) => (item.id === eventId ? cloneEvent(cancelledEvent) : item));
    persistEvents();
    return createResponse(toServiceEvent(cancelledEvent));
  },

  async deleteEvent(eventId: string, _data?: DeleteEventPayload, actor: MockCurrentUser | null = null) {
    await wait();
    const event = eventStore.find((item) => item.id === eventId);
    if (!event || !canDeleteEvent(actor, event)) {
      throw new Error('Bạn không có quyền xóa sự kiện này.');
    }

    eventStore = eventStore.filter((item) => item.id !== eventId);
    persistEvents();
    return createResponse({ deleted: true, eventId });
  },
};
