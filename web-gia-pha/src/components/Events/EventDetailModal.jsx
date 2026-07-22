import React from 'react';
import { CalendarDays, Clock, Edit3, MapPin, RotateCcw, Trash2, X } from 'lucide-react';
import {
  eventStatusLabels,
  eventTypeLabels,
  eventVisibilityLabels,
  recurrenceLabels,
} from '../../constants/eventConstants';
import { formatDateTime, formatSolarDate, getVietnameseLunarDateDisplay } from '../../services/calendarService';
import { EventStatus } from '../../types/events';

const DetailItem = ({ label, children }) => (
  <div className="event-detail-item">
    <span>{label}</span>
    <strong>{children || 'Chưa cập nhật'}</strong>
  </div>
);

const EventDetailModal = ({
  event,
  canManage,
  onClose,
  onEdit,
  onCancelEvent,
  onDelete,
}) => {
  if (!event) return null;

  return (
    <div className="modal-overlay events-modal-overlay">
      <article className="modal-container event-detail-modal">
        <header className="modal-header event-modal-header">
          <div>
            <div className="event-detail-kicker">{eventTypeLabels[event.type]}</div>
            <h2>{event.title}</h2>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </header>

        <div className="modal-body event-detail-body">
          <div className="event-detail-status-row">
            <span className={`event-badge status-${event.status.toLowerCase()}`}>
              {eventStatusLabels[event.status]}
            </span>
            <span className="event-badge visibility-badge">
              {eventVisibilityLabels[event.visibility]}
            </span>
          </div>

          <section className="event-detail-summary">
            <DetailItem label="Ngày dương">
              {formatSolarDate(event.startAt)} - {formatSolarDate(event.endAt)}
            </DetailItem>
            <DetailItem label="Ngày âm">
              {getVietnameseLunarDateDisplay(event.startAt)} - {getVietnameseLunarDateDisplay(event.endAt)}
            </DetailItem>
            <DetailItem label="Bắt đầu">
              <Clock size={15} /> {formatDateTime(event.startAt)}
            </DetailItem>
            <DetailItem label="Kết thúc">
              <Clock size={15} /> {formatDateTime(event.endAt)}
            </DetailItem>
            <DetailItem label="Người tạo">
              {event.createdBy?.name}
            </DetailItem>
          </section>

          <section className="event-detail-section">
            <h3><MapPin size={18} /> Địa điểm</h3>
            <p>{event.location || 'Chưa cập nhật địa điểm.'}</p>
          </section>

          <section className="event-detail-section">
            <h3><CalendarDays size={18} /> Nội dung</h3>
            <p>{event.description || 'Chưa có mô tả cho sự kiện này.'}</p>
          </section>

          <section className="event-detail-summary">
            <DetailItem label="Chế độ lặp">
              <RotateCcw size={15} /> {recurrenceLabels[event.recurrence.frequency]}
            </DetailItem>
            <DetailItem label="Nhắc lịch">
              {event.reminders.length > 0
                ? event.reminders.map((reminder) => reminder.label).join(', ')
                : 'Không có nhắc lịch'}
            </DetailItem>
          </section>

          {event.status === EventStatus.CANCELLED && (
            <section className="event-detail-section event-cancel-reason">
              <h3>Lý do hủy</h3>
              <p>{event.cancelReason || 'Không có lý do hủy.'}</p>
            </section>
          )}
        </div>

        {canManage && (
          <footer className="modal-footer event-detail-actions">
            <button className="btn btn-outline" type="button" onClick={onEdit}>
              <Edit3 size={16} /> Sửa
            </button>
            {event.status !== EventStatus.CANCELLED && (
              <button className="btn btn-outline text-blue" type="button" onClick={onCancelEvent}>
                <X size={16} /> Hủy
              </button>
            )}
            <button className="btn btn-danger" type="button" onClick={onDelete}>
              <Trash2 size={16} /> Xóa
            </button>
          </footer>
        )}
      </article>
    </div>
  );
};

export default EventDetailModal;
