import React, { useMemo, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { eventTypeOptions, eventVisibilityLabels, recurrenceLabels } from '../../constants/eventConstants';
import { CalendarType, EventVisibility, RecurrenceFrequency } from '../../types/events';
import { toDateTimeLocalValue, toVietnamDateTimeOffset } from '../../services/calendarService';

const defaultStart = () => {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 2);
  return toDateTimeLocalValue(date.toISOString());
};

const defaultEnd = (startValue) => {
  const date = new Date(startValue);
  date.setHours(date.getHours() + 2);
  return toDateTimeLocalValue(date.toISOString());
};

const reminderLabel = (minutesBefore) => {
  const value = Number(minutesBefore);
  if (value >= 10080) return `Trước ${value / 10080} tuần`;
  if (value >= 1440) return `Trước ${value / 1440} ngày`;
  if (value >= 60) return `Trước ${value / 60} giờ`;
  return `Trước ${value} phút`;
};

const buildInitialForm = (event) => {
  const startAt = event ? toDateTimeLocalValue(event.startAt) : defaultStart();
  return {
    title: event?.title ?? '',
    type: event?.type ?? eventTypeOptions[0].value,
    description: event?.description ?? '',
    location: event?.location ?? '',
    inputCalendar: event?.inputCalendar ?? CalendarType.SOLAR,
    startAt,
    endAt: event ? toDateTimeLocalValue(event.endAt) : defaultEnd(startAt),
    recurrenceFrequency: event?.recurrence?.frequency ?? RecurrenceFrequency.NONE,
    visibility: event?.visibility ?? EventVisibility.INTERNAL,
    reminders: event?.reminders?.length
      ? event.reminders.map((reminder) => ({ ...reminder }))
      : [{ id: 'form-reminder-1', minutesBefore: 1440, label: 'Trước 1 ngày' }],
    sendNotification: event?.sendNotification ?? true,
  };
};

const EventFormModal = ({ event, onClose, onSubmit, isSaving }) => {
  const [form, setForm] = useState(() => buildInitialForm(event));
  const [errors, setErrors] = useState({});

  const title = event ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện';

  const recurrenceOptions = useMemo(() => Object.values(RecurrenceFrequency), []);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const updateReminder = (index, minutesBefore) => {
    setForm((current) => ({
      ...current,
      reminders: current.reminders.map((reminder, itemIndex) => (
        itemIndex === index
          ? { ...reminder, minutesBefore: Number(minutesBefore), label: reminderLabel(minutesBefore) }
          : reminder
      )),
    }));
  };

  const addReminder = () => {
    setForm((current) => ({
      ...current,
      reminders: [
        ...current.reminders,
        { id: `form-reminder-${Date.now()}`, minutesBefore: 60, label: 'Trước 1 giờ' },
      ],
    }));
  };

  const removeReminder = (index) => {
    setForm((current) => ({
      ...current,
      reminders: current.reminders.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.title.trim()) nextErrors.title = 'Vui lòng nhập tên sự kiện.';
    if (!form.type) nextErrors.type = 'Vui lòng chọn loại sự kiện.';
    if (!form.startAt) nextErrors.startAt = 'Vui lòng chọn thời gian bắt đầu.';
    if (!form.endAt) nextErrors.endAt = 'Vui lòng chọn thời gian kết thúc.';
    if (form.startAt && form.endAt && new Date(form.endAt) < new Date(form.startAt)) {
      nextErrors.endAt = 'Thời gian kết thúc không được trước thời gian bắt đầu.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (submitEvent) => {
    submitEvent.preventDefault();
    if (!validate()) return;

    onSubmit({
      title: form.title.trim(),
      type: form.type,
      description: form.description.trim(),
      location: form.location.trim(),
      inputCalendar: form.inputCalendar,
      startAt: toVietnamDateTimeOffset(form.startAt),
      endAt: toVietnamDateTimeOffset(form.endAt),
      recurrence: {
        frequency: form.recurrenceFrequency,
        interval: 1,
      },
      visibility: form.visibility,
      reminders: form.reminders,
      sendNotification: form.sendNotification,
    });
  };

  return (
    <div className="modal-overlay events-modal-overlay">
      <form className="modal-container event-form-modal" onSubmit={handleSubmit}>
        <header className="modal-header">
          <h2>{title}</h2>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </header>

        <div className="modal-body">
          <h3 className="form-section-title">Thông tin chung</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="event-title">Tên sự kiện</label>
              <input
                id="event-title"
                className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                value={form.title}
                onChange={(inputEvent) => updateField('title', inputEvent.target.value)}
                placeholder="Nhập tên sự kiện"
              />
              {errors.title && <span className="form-error">{errors.title}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="event-type">Loại sự kiện</label>
              <select
                id="event-type"
                className="form-control"
                value={form.type}
                onChange={(inputEvent) => updateField('type', inputEvent.target.value)}
              >
                {eventTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="event-description">Mô tả</label>
            <textarea
              id="event-description"
              className="form-control event-textarea"
              value={form.description}
              onChange={(inputEvent) => updateField('description', inputEvent.target.value)}
              rows={4}
              placeholder="Nội dung, ghi chú hoặc phân công chuẩn bị"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="event-location">Địa điểm</label>
              <input
                id="event-location"
                className="form-control"
                value={form.location}
                onChange={(inputEvent) => updateField('location', inputEvent.target.value)}
                placeholder="Nhập địa điểm"
              />
            </div>
            <div className="form-group">
              <label htmlFor="event-visibility">Phạm vi</label>
              <select
                id="event-visibility"
                className="form-control"
                value={form.visibility}
                onChange={(inputEvent) => updateField('visibility', inputEvent.target.value)}
              >
                <option value={EventVisibility.PUBLIC}>{eventVisibilityLabels[EventVisibility.PUBLIC]}</option>
                <option value={EventVisibility.INTERNAL}>{eventVisibilityLabels[EventVisibility.INTERNAL]}</option>
              </select>
            </div>
          </div>

          <h3 className="form-section-title">Thời gian</h3>
          <div className="segmented-control">
            <button
              type="button"
              className={form.inputCalendar === CalendarType.SOLAR ? 'active' : ''}
              onClick={() => updateField('inputCalendar', CalendarType.SOLAR)}
            >
              Dương lịch
            </button>
            <button
              type="button"
              className={form.inputCalendar === CalendarType.LUNAR ? 'active' : ''}
              onClick={() => updateField('inputCalendar', CalendarType.LUNAR)}
            >
              Âm lịch
            </button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="event-start">Bắt đầu</label>
              <input
                id="event-start"
                className="form-control"
                type="datetime-local"
                value={form.startAt}
                onChange={(inputEvent) => updateField('startAt', inputEvent.target.value)}
              />
              {errors.startAt && <span className="form-error">{errors.startAt}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="event-end">Kết thúc</label>
              <input
                id="event-end"
                className="form-control"
                type="datetime-local"
                value={form.endAt}
                onChange={(inputEvent) => updateField('endAt', inputEvent.target.value)}
              />
              {errors.endAt && <span className="form-error">{errors.endAt}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="event-recurrence">Chế độ lặp</label>
              <select
                id="event-recurrence"
                className="form-control"
                value={form.recurrenceFrequency}
                onChange={(inputEvent) => updateField('recurrenceFrequency', inputEvent.target.value)}
              >
                {recurrenceOptions.map((frequency) => (
                  <option key={frequency} value={frequency}>{recurrenceLabels[frequency]}</option>
                ))}
              </select>
            </div>
            <label className="checkbox-label event-notify-checkbox">
              <input
                type="checkbox"
                checked={form.sendNotification}
                onChange={(inputEvent) => updateField('sendNotification', inputEvent.target.checked)}
              />
              Gửi thông báo khi tạo
            </label>
          </div>

          <h3 className="form-section-title">Nhắc lịch</h3>
          <div className="reminder-list">
            {form.reminders.map((reminder, index) => (
              <div className="reminder-row" key={reminder.id}>
                <select
                  className="form-control"
                  value={reminder.minutesBefore}
                  onChange={(inputEvent) => updateReminder(index, inputEvent.target.value)}
                >
                  <option value={30}>Trước 30 phút</option>
                  <option value={60}>Trước 1 giờ</option>
                  <option value={120}>Trước 2 giờ</option>
                  <option value={1440}>Trước 1 ngày</option>
                  <option value={2880}>Trước 2 ngày</option>
                  <option value={10080}>Trước 1 tuần</option>
                </select>
                <button
                  className="btn-icon text-danger"
                  type="button"
                  onClick={() => removeReminder(index)}
                  aria-label="Xóa nhắc lịch"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
            <button className="btn btn-outline reminder-add-btn" type="button" onClick={addReminder}>
              <Plus size={16} /> Thêm nhắc lịch
            </button>
          </div>
        </div>

        <footer className="modal-footer">
          <button className="btn btn-outline" type="button" onClick={onClose} disabled={isSaving}>
            Hủy
          </button>
          <button className="btn btn-primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Đang lưu...' : 'Lưu sự kiện'}
          </button>
        </footer>
      </form>
    </div>
  );
};

export default EventFormModal;
