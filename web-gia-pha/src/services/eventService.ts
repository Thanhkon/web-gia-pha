import { mockCurrentUser } from '../data/mockAuth';
import { mockEvents } from '../data/mockEvents';
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
  UserRole,
} from '../types/events';
import {
  formatVietnamDateKey,
  formatVietnamDateTimeOffset,
  getMonthRange,
  parseLocalDate,
  toVietnamDateTimeOffset,
} from './calendarService';

let eventStore: Event[] = mockEvents.map((event) => ({ ...event, reminders: [...event.reminders] }));

const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

const createResponse = <T>(data: T): ApiResponse<T> => ({
  data,
  meta: {
    requestId: `mock-${Date.now()}`,
    timestamp: formatVietnamDateTimeOffset(),
    source: 'mock',
  },
});

const ensureNoMockError = (params?: EventQueryParams) => {
  if (params?.simulateError || params?.search === '__error') {
    throw new Error('Không thể tải dữ liệu sự kiện. Vui lòng thử lại.');
  }
};

const canViewEvent = (event: Event, user: MockCurrentUser) => {
  if (user.role === UserRole.GUEST) {
    return event.visibility === EventVisibility.PUBLIC;
  }

  return true;
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
    ...event,
    status,
    reminders: status === EventStatus.CANCELLED ? [] : event.reminders,
  };
};

const getVisibleEvents = () => {
  return eventStore
    .map(toServiceEvent)
    .filter((event) => event.familyId === mockCurrentUser.familyId && canViewEvent(event, mockCurrentUser));
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

const buildEventPayload = (data: EventPayload): EventPayload => ({
  ...data,
  familyId: data.familyId ?? mockCurrentUser.familyId,
  startAt: toVietnamDateTimeOffset(data.startAt),
  endAt: toVietnamDateTimeOffset(data.endAt),
  recurrence: data.recurrence ?? { frequency: RecurrenceFrequency.NONE, interval: 1 },
  reminders: data.reminders ?? [],
});

export const eventService = {
  async getCurrentUser() {
    await wait(120);
    return createResponse(mockCurrentUser);
  },

  async getEvents(params?: EventQueryParams) {
    await wait();
    ensureNoMockError(params);
    const data = sortByStartDate(filterEvents(getVisibleEvents(), params));
    return createResponse(data);
  },

  async getCalendarEvents(params: EventQueryParams) {
    await wait();
    ensureNoMockError(params);

    const monthDate = new Date(params.year ?? new Date().getFullYear(), params.month ?? new Date().getMonth(), 1);
    const { start, end } = getMonthRange(monthDate);
    const visibleEvents = getVisibleEvents().filter((event) => isInRange(event, start, end));

    return createResponse(sortByStartDate(filterEvents(visibleEvents, params)));
  },

  async getTodayEvents(params?: EventQueryParams) {
    await wait(240);
    ensureNoMockError(params);
    const todayKey = formatVietnamDateKey(new Date());
    const data = getVisibleEvents().filter((event) => {
      return todayKey >= formatVietnamDateKey(event.startAt)
        && todayKey <= formatVietnamDateKey(event.endAt);
    });

    return createResponse(sortByStartDate(filterEvents(data, params)));
  },

  async getUpcomingEvents(days = 30, params?: EventQueryParams) {
    await wait(260);
    ensureNoMockError(params);
    const start = parseLocalDate(`${formatVietnamDateKey(new Date())}T00:00:00+07:00`);
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    end.setHours(23, 59, 59, 999);

    const data = getVisibleEvents().filter((event) => (
      event.status !== EventStatus.CANCELLED && isInRange(event, start, end)
    ));

    return createResponse(sortByStartDate(filterEvents(data, params)));
  },

  async getEventById(eventId: string) {
    await wait(180);
    const event = getVisibleEvents().find((item) => item.id === eventId);
    if (!event) {
      throw new Error('Không tìm thấy sự kiện hoặc bạn không có quyền xem.');
    }

    return createResponse(event);
  },

  async createEvent(data: EventPayload) {
    await wait();
    const now = formatVietnamDateTimeOffset();
    const payload = buildEventPayload(data);
    const event: Event = {
      ...payload,
      id: `evt-${Date.now()}`,
      status: EventStatus.UPCOMING,
      createdBy: mockCurrentUser,
      createdAt: now,
      updatedAt: now,
    };

    eventStore = [...eventStore, event];
    return createResponse(toServiceEvent(event));
  },

  async updateEvent(eventId: string, data: Partial<EventPayload>) {
    await wait();
    const existing = eventStore.find((event) => event.id === eventId);
    if (!existing) {
      throw new Error('Không tìm thấy sự kiện cần cập nhật.');
    }

    const updatedEvent: Event = {
      ...existing,
      ...data,
      startAt: data.startAt ? toVietnamDateTimeOffset(data.startAt) : existing.startAt,
      endAt: data.endAt ? toVietnamDateTimeOffset(data.endAt) : existing.endAt,
      familyId: data.familyId ?? existing.familyId,
      updatedAt: formatVietnamDateTimeOffset(),
    };

    eventStore = eventStore.map((event) => (event.id === eventId ? updatedEvent : event));
    return createResponse(toServiceEvent(updatedEvent));
  },

  async cancelEvent(eventId: string, data: CancelEventPayload) {
    await wait();
    const event = eventStore.find((item) => item.id === eventId);
    if (!event) {
      throw new Error('Không tìm thấy sự kiện cần hủy.');
    }

    // Mock only updates the selected occurrence; backend will interpret recurrence scope.
    const cancelledEvent: Event = {
      ...event,
      status: EventStatus.CANCELLED,
      reminders: [],
      cancelReason: data.reason,
      updatedAt: formatVietnamDateTimeOffset(),
    };

    eventStore = eventStore.map((item) => (item.id === eventId ? cancelledEvent : item));
    return createResponse(toServiceEvent(cancelledEvent));
  },

  async deleteEvent(eventId: string, _data?: DeleteEventPayload) {
    await wait();
    const event = eventStore.find((item) => item.id === eventId);
    if (!event) {
      throw new Error('Không tìm thấy sự kiện cần xóa.');
    }

    eventStore = eventStore.filter((item) => item.id !== eventId);
    return createResponse({ deleted: true, eventId });
  },
};

