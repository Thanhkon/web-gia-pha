import React from 'react';
import { Solar, Lunar } from 'lunar-javascript';

const DateInputGroup = ({ value, onChange, placeholderYear = "Năm", maxToday = false }) => {
  // Parse ISO string thành giờ địa phương để tránh lỗi lùi 1 ngày do lệch múi giờ (UTC -> GMT+7)
  let dateStr = '';
  if (value) {
    if (value.includes('T')) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        dateStr = `${yyyy}-${mm}-${dd}`;
      }
    } else {
      dateStr = String(value).split(' ')[0];
    }
  }
  const parts = dateStr.split('-');
  const y = parts[0] || '';
  const m = parts[1] || '';
  const d = parts[2] || '';

  const handleChange = (type, val) => {
    const newY = type === 'y' ? val : y;
    const newM = type === 'm' ? val : m;
    const newD = type === 'd' ? val : d;

    if (!newY && !newM && !newD) {
      onChange('');
    } else {
      onChange(`${newY}-${newM}-${newD}`);
    }
  };

  return (
    <div className="date-input-group">
      <input type="number" min="1" max="31" placeholder="Ngày" className="form-control" value={d} onChange={e => handleChange('d', e.target.value)} />
      <input type="number" min="1" max="12" placeholder="Tháng" className="form-control" value={m} onChange={e => handleChange('m', e.target.value)} />
      <input type="number" min="1" placeholder={placeholderYear} className="form-control" value={y} onChange={e => handleChange('y', e.target.value)} />
    </div>
  );
};

const DateInfo = ({ formData, onChange }) => {

  const handleSolarChange = (val) => {
    onChange('dateOfDeath', val);
    if (!val) {
      onChange('deathLunarDate', '');
      return;
    }
    
    try {
      const parts = val.split('-');
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        const [y, m, d] = parts.map(Number);
        if (y > 0 && m > 0 && d > 0) {
          const solar = Solar.fromYmd(y, m, d);
          const lunar = solar.getLunar();
          const lunarStr = `${lunar.getYear()}-${lunar.getMonth()}-${lunar.getDay()}`;
          onChange('deathLunarDate', lunarStr);
        }
      }
    } catch (err) {
      // Bỏ qua nếu ngày không hợp lệ
    }
  };

  const handleLunarChange = (val) => {
    onChange('deathLunarDate', val);
    if (!val) {
      onChange('dateOfDeath', '');
      return;
    }
    
    try {
      const parts = val.split('-');
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        const [y, m, d] = parts.map(Number);
        if (y > 0 && m > 0 && d > 0) {
          const lunar = Lunar.fromYmd(y, m, d);
          if (lunar.isValid()) {
            const solar = lunar.getSolar();
            const solarStr = `${solar.getYear()}-${solar.getMonth()}-${solar.getDay()}`;
            onChange('dateOfDeath', solarStr);
          }
        }
      }
    } catch (err) {
      // Bỏ qua nếu ngày không hợp lệ
    }
  };

  return (
    <div className="form-section">
      <h3 className="form-section-title">2. Thông tin Sinh - Tử</h3>
      <div className="form-row form-row-2">
        <div className="form-group">
          <label>Ngày sinh (Dương lịch)</label>
          <DateInputGroup value={formData.dateOfBirth} onChange={val => onChange('dateOfBirth', val)} maxToday={true} />
        </div>
        <div className="form-group form-group-checkbox">
          <label className="checkbox-label checkbox-label-padded">
            <input 
              type="checkbox" 
              checked={formData.isDeceased} 
              onChange={e => {
                onChange('isDeceased', e.target.checked);
                if (!e.target.checked) {
                  onChange('dateOfDeath', '');
                  onChange('deathLunarDate', '');
                }
              }} 
            />
            Đã khuất
          </label>
        </div>
      </div>

      {formData.isDeceased && (
        <div className="deceased-section">
          <p className="deceased-alert-text">
            * Nhập Ngày Dương lịch hoặc Âm lịch. Hệ thống sẽ tự động tính toán và điền phần còn lại.
          </p>
          <div className="deceased-alert">
            <div className="form-row form-row-2">
              <div className="form-group">
                <label>Ngày mất (Dương lịch)</label>
                <DateInputGroup value={formData.dateOfDeath} onChange={handleSolarChange} />
              </div>
              <div className="form-group">
                <label>Ngày mất (Âm lịch)</label>
                <DateInputGroup value={formData.deathLunarDate} onChange={handleLunarChange} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateInfo;
