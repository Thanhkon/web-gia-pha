import apiClient from '../utils/apiClient';
import {
  ApiResponse,
  EventQueryParams,
  EventPayload,
  MockCurrentUser,
} from '../types/events';
import { formatVietnamDateTimeOffset } from './calendarService';
import {
  toApiVisibility,
  toEvent,
  toEventPayload,
  filterEvents,
  sortByStartDate,
} from '../utils/eventUtils';
import {
  getEventActor,
  canCreateEvent,
  canManageEvent,
  canViewEvent,
} from '../utils/permissionUtils';

export {
  getEventActor,
  canCreateEvent,
  canManageEvent,
  canViewEvent,
};

const createResponse = <T>(data: T): ApiResponse<T> => ({
  data,
  meta: {
    requestId: `api-${Date.now()}`,
    timestamp: formatVietnamDateTimeOffset(),
    source: 'api',
  },
});

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

export const eventService = {
  async getEvents(params?: EventQueryParams, actor?: MockCurrentUser | null) {
    const events = await fetchFamilyEvents(actor || null, params);
    const visibleEvents = events.filter((event: any) => canViewEvent(actor, event));
    const filteredEvents = filterEvents(visibleEvents, params);
    return createResponse(sortByStartDate(filteredEvents));
  },


  async getEventById(id: string, actor?: MockCurrentUser | null) {
    const response = await apiClient.get(`/events/${id}`);
    const event = toEvent(response.data);
    if (!canViewEvent(actor, event)) {
      throw new Error('Khong tim thay su kien hoac ban khong co quyen xem.');
    }
    return createResponse(event);
  },

  async createEvent(payload: EventPayload, actor?: MockCurrentUser | null) {
    if (!canCreateEvent(actor)) {
      throw new Error('Ban khong co quyen tao su kien.');
    }
    const apiPayload = toEventPayload(payload, { includeDefaults: true });
    const response = await apiClient.post(`/families/${Number(actor?.familyId)}/events`, apiPayload);
    return createResponse(toEvent(response.data));
  },

  async updateEvent(id: string, payload: Partial<EventPayload>, actor?: MockCurrentUser | null) {
    const currentEventRes = await this.getEventById(id, actor);
    const currentEvent = currentEventRes.data;
    if (!canManageEvent(actor, currentEvent)) {
      throw new Error('Ban khong co quyen cap nhat su kien nay.');
    }
    const apiPayload = toEventPayload(payload as any, { status: (payload as any).status });
    const response = await apiClient.patch(`/events/${id}`, apiPayload);
    return createResponse(toEvent(response.data));
  },

  async deleteEvent(id: string, _payload: any, actor?: MockCurrentUser | null) {
    const currentEventRes = await this.getEventById(id, actor);
    const currentEvent = currentEventRes.data;
    if (!canManageEvent(actor, currentEvent)) {
      throw new Error('Ban khong co quyen xoa su kien nay.');
    }
    await apiClient.delete(`/events/${id}`);
    return createResponse({ success: true });
  },

  async cancelEvent(id: string, payload: any, actor?: MockCurrentUser | null) {
    const currentEventRes = await this.getEventById(id, actor);
    const currentEvent = currentEventRes.data;
    if (!canManageEvent(actor, currentEvent)) {
      throw new Error('Ban khong co quyen huy su kien nay.');
    }
    const apiPayload = toEventPayload(
      { ...payload, status: 'CANCELLED' as any },
      {
        status: 'CANCELLED' as any,
        cancelReason: payload.reason,
        cancelScope: payload.scope || 'ALL',
      }
    );
    const response = await apiClient.patch(`/events/${id}`, apiPayload);
    return createResponse(toEvent(response.data));
  },
};
