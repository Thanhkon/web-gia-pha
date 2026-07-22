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

const Events = () => {
  const { user: authUser, isAuthenticated } = useSelector((state) => state.auth);
  const [currentUser, setCurrentUser] = useState(null);
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [todayEvents, setTodayEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const debouncedSearch = useDebounce(searchTerm, 300);
  const canCreate = canCreateEvent(currentUser);
  const canManageSelectedEvent = selectedEvent ? canManageEvent(currentUser, selectedEvent) : false;
  const hasOpenModal = Boolean(selectedEvent || isFormOpen || cancelTarget || deleteTarget);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = {
        year: monthDate.getFullYear(),
        month: monthDate.getMonth(),
        search: debouncedSearch,
        type: typeFilter,
      };

      const userResponse = await eventService.getCurrentUser(authUser, isAuthenticated);
      const actor = userResponse.data;
      const [calendarResponse, todayResponse, upcomingResponse] = await Promise.all([
        eventService.getCalendarEvents(params, actor),
        eventService.getTodayEvents({ search: debouncedSearch, type: typeFilter }, actor),
        eventService.getUpcomingEvents(30, { search: debouncedSearch, type: typeFilter }, actor),
      ]);

      setCurrentUser(actor);
      setCalendarEvents(calendarResponse.data);
      setTodayEvents(todayResponse.data);
      setUpcomingEvents(upcomingResponse.data);
    } catch (loadError) {
      setError(loadError.message || 'Có lỗi xảy ra khi tải sự kiện.');
      setCalendarEvents([]);
      setTodayEvents([]);
      setUpcomingEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [authUser, debouncedSearch, isAuthenticated, monthDate, typeFilter]);

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
              <div>
                <h2>{monthLabel}</h2>
                <p>{calendarEvents.length} sự kiện trong tháng đang xem</p>
              </div>
              <div className="events-calendar-controls">
                <button className="icon-btn" type="button" onClick={goToPreviousMonth} aria-label="Tháng trước">
                  <ChevronLeft size={20} />
                </button>
                <button className="btn btn-outline" type="button" onClick={goToToday}>Hôm nay</button>
                <button className="icon-btn" type="button" onClick={goToNextMonth} aria-label="Tháng sau">
                  <ChevronRight size={20} />
                </button>
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
                          <span>{day.lunarDisplay}</span>
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
                    <h3>Không có sự kiện phù hợp</h3>
                    <p>Thay đổi từ khóa, bộ lọc hoặc chuyển sang tháng khác để xem thêm.</p>
                  </div>
                )}
              </>
            )}
          </main>

          <aside className="events-sidebar">
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
