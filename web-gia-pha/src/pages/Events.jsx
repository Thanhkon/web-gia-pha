import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Search,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useFamilyActor } from '../hooks/useFamilyActor';
import EventActionDialog from '../components/Events/EventActionDialog';
import EventDetailModal from '../components/Events/EventDetailModal';
import EventFormModal from '../components/Events/EventFormModal';
import {
  eventStatusLabels,
  eventTypeLabels,
  eventTypeOptions,
  isRecurringEvent,
  roleLabels,
} from '../constants/eventConstants';
import useDebounce from '../hooks/useDebounce';
import { canCreateEvent, canManageEvent, eventService } from '../services/eventService';
import { buildCalendarDays, isDateBetween } from '../services/calendarService';
import '../css/pages/AdminMembers.css';
import '../css/pages/Events.css';

const weekdayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const EventMiniList = ({ title, events, emptyText, onView }) => (
  <section className="events-side-panel">
    <div className="events-side-header">
      <Calendar size={20} />
      <h2>{title}</h2>
    </div>

    {events.length === 0 ? (
      <p className="events-empty-small">{emptyText}</p>
    ) : (
      <div className="events-mini-list">
        {events.map((event) => (
          <button
            className={`events-mini-item ${event.status === 'CANCELLED' ? 'is-cancelled' : ''}`}
            key={event.id}
            type="button"
            onClick={() => onView(event.id)}
          >
            <span className="events-mini-date">
              {new Date(event.startAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
            </span>
            <span className="events-mini-content">
              <strong>{event.title}</strong>
              <span>{eventTypeLabels[event.type]} • {new Date(event.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
            </span>
          </button>
        ))}
      </div>
    )}
  </section>
);

const EventSearchResults = ({ groups, emptyText, onView }) => (
  <section className="events-side-panel">
    <div className="events-side-header">
      <Search size={20} />
      <h2>Kết quả tìm kiếm</h2>
    </div>

    {groups.length === 0 ? (
      <p className="events-empty-small">{emptyText}</p>
    ) : (
      <div className="events-search-results">
        {groups.map((group) => (
          <section className="events-search-group" key={group.key}>
            <h3>{group.label}</h3>
            <div className="events-mini-list">
              {group.events.map((event) => (
                <button
                  className={`events-mini-item ${event.status === 'CANCELLED' ? 'is-cancelled' : ''}`}
                  key={event.id}
                  type="button"
                  onClick={() => onView(event)}
                >
                  <span className="events-mini-date">
                    {new Date(event.startAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                  </span>
                  <span className="events-mini-content">
                    <strong>{event.title}</strong>
                    <span>{eventTypeLabels[event.type]} • {new Date(event.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    )}
  </section>
);

const Events = () => {
  const location = useLocation();
  const { familyId } = useParams();
  const authUser = useFamilyActor();
  const isAuthenticated = Boolean(authUser);
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [currentUser, setCurrentUser] = useState(null);
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [todayEvents, setTodayEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const debouncedSearch = useDebounce(searchTerm, 300);
  const normalizedSearchTerm = debouncedSearch.trim();
  const isSearching = normalizedSearchTerm.length > 0;
  const hasCalendarFilters = isSearching || Boolean(typeFilter);
  const canCreate = canCreateEvent(currentUser);
  const canManageSelectedEvent = selectedEvent ? canManageEvent(currentUser, selectedEvent) : false;
  const hasOpenModal = Boolean(selectedEvent || isFormOpen || cancelTarget || deleteTarget);

  const getViewUser = useCallback((actor) => {
    return actor;
  }, []);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = {
        year: monthDate.getFullYear(),
        month: monthDate.getMonth(),
        search: normalizedSearchTerm,
        type: typeFilter,
      };

      const userResponse = await eventService.getCurrentUser(authUser, isAuthenticated, familyId);
      const actor = userResponse.data;
      const viewUser = getViewUser(actor);
      const calendarRequest = eventService.getCalendarEvents(params, viewUser);

      if (isSearching) {
        const [calendarResponse, searchResponse] = await Promise.all([
          calendarRequest,
          eventService.getEvents({ search: normalizedSearchTerm, type: typeFilter }, viewUser),
        ]);

        setCurrentUser(viewUser);
        setCalendarEvents(calendarResponse.data);
        setTodayEvents([]);
        setUpcomingEvents([]);
        setSearchResults(searchResponse.data);
        return;
      }

      const [calendarResponse, todayResponse, upcomingResponse] = await Promise.all([
        calendarRequest,
        eventService.getTodayEvents({ type: typeFilter }, viewUser),
        eventService.getUpcomingEvents(30, { type: typeFilter }, viewUser),
      ]);

      setCurrentUser(viewUser);
      setCalendarEvents(calendarResponse.data);
      setTodayEvents(todayResponse.data);
      setUpcomingEvents(upcomingResponse.data);
      setSearchResults([]);
    } catch (loadError) {
      setError(loadError.message || 'Có lỗi xảy ra khi tải sự kiện.');
      setCalendarEvents([]);
      setTodayEvents([]);
      setUpcomingEvents([]);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [authUser, getViewUser, isAuthenticated, isSearching, monthDate, normalizedSearchTerm, typeFilter]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!hasOpenModal) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [hasOpenModal]);

  const calendarDays = useMemo(() => buildCalendarDays(monthDate), [monthDate]);

  const monthLabel = useMemo(() => (
    new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(monthDate)
  ), [monthDate]);

  const groupedSearchResults = useMemo(() => {
    const groupsMap = new Map();
    const monthFormatter = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' });

    searchResults.forEach((event) => {
      const startDate = new Date(event.startAt);
      const key = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          key,
          label: monthFormatter.format(startDate),
          events: [],
        });
      }

      groupsMap.get(key).events.push(event);
    });

    return Array.from(groupsMap.values());
  }, [searchResults]);

  const goToPreviousMonth = () => {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setMonthDate(new Date());
  };

  const openDetail = async (eventId) => {
    setError('');
    try {
      const response = await eventService.getEventById(eventId, currentUser);
      setSelectedEvent(response.data);
    } catch (detailError) {
      setError(detailError.message || 'Không thể mở chi tiết sự kiện.');
    }
  };

  const openSearchResult = async (event) => {
    const eventDate = new Date(event.startAt);
    setMonthDate(new Date(eventDate.getFullYear(), eventDate.getMonth(), 1));
    await openDetail(event.id);
  };

  const openCreateForm = () => {
    if (!canCreateEvent(currentUser)) {
      setError('Bạn không có quyền tạo sự kiện.');
      return;
    }

    setEditingEvent(null);
    setIsFormOpen(true);
  };

  const openEditForm = () => {
    if (!canManageEvent(currentUser, selectedEvent)) {
      setError('Bạn không có quyền chỉnh sửa sự kiện này.');
      return;
    }

    setEditingEvent(selectedEvent);
    setSelectedEvent(null);
    setIsFormOpen(true);
  };

  const handleSubmitForm = async (payload) => {
    setIsSaving(true);
    setError('');

    try {
      if (editingEvent) {
        await eventService.updateEvent(editingEvent.id, payload, currentUser);
      } else {
        await eventService.createEvent(payload, currentUser);
      }

      setIsFormOpen(false);
      setEditingEvent(null);
      await loadEvents();
    } catch (saveError) {
      setError(saveError.message || 'Không thể lưu sự kiện.');
    } finally {
      setIsSaving(false);
    }
  };

  const requestCancel = () => {
    if (!canManageEvent(currentUser, selectedEvent)) {
      setError('Bạn không có quyền hủy sự kiện này.');
      return;
    }

    setCancelTarget(selectedEvent);
    setSelectedEvent(null);
  };

  const requestDelete = () => {
    if (!canManageEvent(currentUser, selectedEvent)) {
      setError('Bạn không có quyền xóa sự kiện này.');
      return;
    }

    setDeleteTarget(selectedEvent);
    setSelectedEvent(null);
  };

  const confirmCancel = async (payload) => {
    setIsSaving(true);
    setError('');

    try {
      await eventService.cancelEvent(cancelTarget.id, payload, currentUser);
      setCancelTarget(null);
      await loadEvents();
    } catch (cancelError) {
      setError(cancelError.message || 'Không thể hủy sự kiện.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async (payload) => {
    setIsSaving(true);
    setError('');

    try {
      await eventService.deleteEvent(deleteTarget.id, payload, currentUser);
      setDeleteTarget(null);
      await loadEvents();
    } catch (deleteError) {
      setError(deleteError.message || 'Không thể xóa sự kiện.');
    } finally {
      setIsSaving(false);
    }
  };

  const getEventsForDay = (date) => {
    return calendarEvents.filter((event) => isDateBetween(date, event.startAt, event.endAt));
  };

  const emptyCalendarTitle = hasCalendarFilters
    ? 'Không tìm thấy sự kiện phù hợp'
    : 'Tháng này chưa có sự kiện';
  const emptyCalendarText = hasCalendarFilters
    ? 'Thử đổi từ khóa, bộ lọc hoặc chuyển sang tháng khác.'
    : canCreate
      ? 'Chuyển sang tháng khác hoặc tạo sự kiện mới cho dòng họ.'
      : 'Chuyển sang tháng khác để xem thêm.';

  return (
    <>
      <div className="events-page animate-fade-in">
      <section className="events-hero">
        <div className="container events-hero-inner">
          <div>
            <span className="events-kicker">Lịch gia tộc</span>
            <h1>Sự kiện</h1>
            <p>Theo dõi ngày giỗ, họp họ, lễ kỷ niệm và các hoạt động quan trọng của dòng họ.</p>
          </div>
          <div className="events-hero-actions">
            {currentUser && (
              <span className="role-chip">Vai trò: {roleLabels[currentUser.role]}</span>
            )}
            {canCreate && (
              <button className="btn btn-primary" type="button" onClick={openCreateForm}>
                <Plus size={18} /> Tạo sự kiện
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="events-content container">
        <div className="events-toolbar">
          <div className="search-box events-search-box">
            <Search size={18} className="search-icon" />
            <input
              value={searchTerm}
              onChange={(inputEvent) => setSearchTerm(inputEvent.target.value)}
              placeholder="Tìm theo tên, địa điểm, mô tả"
            />
          </div>

          <div className="filter-group events-filter-group">
            <select
              className="admin-select"
              value={typeFilter}
              onChange={(inputEvent) => setTypeFilter(inputEvent.target.value)}
              aria-label="Lọc loại sự kiện"
            >
              <option value="">Tất cả loại sự kiện</option>
              {eventTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="events-error-state">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button className="btn btn-outline" type="button" onClick={loadEvents}>Thử lại</button>
          </div>
        )}

        <div className="events-layout">
          <main className="events-calendar-panel">
            <header className="events-calendar-header">
              <div className="events-month-navigation">
                <button className="icon-btn events-month-nav-btn" type="button" onClick={goToPreviousMonth} aria-label="Tháng trước">
                  <ChevronLeft size={20} />
                </button>
                <div className="events-month-heading">
                  <h2>{monthLabel}</h2>
                  <p>{calendarEvents.length} sự kiện trong tháng đang xem</p>
                </div>
                <button className="icon-btn events-month-nav-btn" type="button" onClick={goToNextMonth} aria-label="Tháng sau">
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="events-calendar-controls">
                <span className="events-lunar-note">Số nhỏ: ngày âm lịch</span>
                <button className="btn btn-outline" type="button" onClick={goToToday}>Hôm nay</button>
              </div>
            </header>

            {isLoading ? (
              <div className="events-loading-state">
                <Loader2 size={26} className="spin-icon" />
                <span>Đang tải lịch sự kiện...</span>
              </div>
            ) : (
              <>
                <div className="events-weekdays">
                  {weekdayLabels.map((weekday) => (
                    <span key={weekday}>{weekday}</span>
                  ))}
                </div>

                <div className="events-calendar-grid">
                  {calendarDays.map((day) => {
                    const dayEvents = getEventsForDay(day.date);

                    return (
                      <div
                        className={[
                          'events-day-cell',
                          day.isCurrentMonth ? '' : 'is-outside-month',
                          day.isToday ? 'is-today' : '',
                        ].join(' ')}
                        key={day.dateKey}
                      >
                        <div className="events-day-number">
                          <strong>{day.solarDay}</strong>
                          <span className={day.isLunarSpecialDay ? 'is-lunar-special' : ''}>{day.lunarDisplay}</span>
                        </div>

                        <div className="events-day-items">
                          {dayEvents.map((event) => (
                            <button
                              className={`events-day-event status-${event.status.toLowerCase()}`}
                              key={event.id}
                              type="button"
                              onClick={() => openDetail(event.id)}
                              title={`${event.title} - ${eventStatusLabels[event.status]}`}
                            >
                              <span>{event.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {calendarEvents.length === 0 && (
                  <div className="events-empty-state">
                    <Calendar size={28} />
                    <h3>{emptyCalendarTitle}</h3>
                    <p>{emptyCalendarText}</p>
                  </div>
                )}
              </>
            )}
          </main>

          <aside className="events-sidebar">
            {isSearching ? (
              <EventSearchResults
                groups={groupedSearchResults}
                emptyText="Không tìm thấy sự kiện nào."
                onView={openSearchResult}
              />
            ) : (
              <>
                <EventMiniList
                  title="Sự kiện hôm nay"
                  events={todayEvents}
                  emptyText="Hôm nay chưa có sự kiện nào."
                  onView={openDetail}
                />

                <EventMiniList
                  title="Sự kiện trong 30 ngày tới"
                  events={upcomingEvents}
                  emptyText="Chưa có sự kiện sắp tới trong 30 ngày."
                  onView={openDetail}
                />
              </>
            )}
          </aside>
        </div>
      </section>
      </div>

      <EventDetailModal
        event={selectedEvent}
        canManage={canManageSelectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={openEditForm}
        onCancelEvent={requestCancel}
        onDelete={requestDelete}
      />

      {isFormOpen && (
        <EventFormModal
          event={editingEvent}
          onClose={() => {
            setIsFormOpen(false);
            setEditingEvent(null);
          }}
          onSubmit={handleSubmitForm}
          isSaving={isSaving}
        />
      )}

      <EventActionDialog
        isOpen={Boolean(cancelTarget)}
        mode="cancel"
        event={cancelTarget}
        isRecurring={isRecurringEvent(cancelTarget)}
        isLoading={isSaving}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
      />

      <EventActionDialog
        isOpen={Boolean(deleteTarget)}
        mode="delete"
        event={deleteTarget}
        isRecurring={isRecurringEvent(deleteTarget)}
        isLoading={isSaving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
};

export default Events;
