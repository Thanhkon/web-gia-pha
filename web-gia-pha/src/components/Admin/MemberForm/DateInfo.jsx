import React from 'react';
import { Solar, Lunar } from 'lunar-javascript';

const DateInputGroup = ({ value, onChange, placeholderYear = "Năm", maxToday = false }) => {
  const parts = (value || '').split('-');
  const y = parts[0] || '';
  const m = parts[1] || '';
  const d = parts[2] || '';

  const handleChange = (type, val) => {
    let newY = type === 'y' ? val : y;
    let newM = type === 'm' ? val : m;
    let newD = type === 'd' ? val : d;

    if (!newY && !newM && !newD) {
      onChange('');
      return;
    }

    const pad = (num) => num ? String(num).padStart(2, '0') : '01';
    const finalY = newY ? newY.padStart(4, '0') : '0000';
    onChange(`${finalY}-${pad(newM)}-${pad(newD)}`);
  };

  return (
    <div className="date-input-group">
      <input type="number" min="1" max="31" placeholder="Ngày" className="form-control" value={d !== '01' && d !== '00' ? parseInt(d) || '' : (value ? d : '')} onChange={e => handleChange('d', e.target.value)} />
      <input type="number" min="1" max="12" placeholder="Tháng" className="form-control" value={m !== '01' && m !== '00' ? parseInt(m) || '' : (value ? m : '')} onChange={e => handleChange('m', e.target.value)} />
      <input type="number" min="1" placeholder={placeholderYear} className="form-control" value={y !== '0000' ? parseInt(y) || '' : (value ? y : '')} onChange={e => handleChange('y', e.target.value)} />
    </div>
  );
};

const DateInfo = ({ formData, onChange }) => {

  const handleSolarChange = (val) => {
    onChange('deathDate', val);
    
    if (val && val !== '0000-01-01') {
      try {
        const [y, m, d] = val.split('-').map(Number);
        const solar = Solar.fromYmd(y, m, d);
        const lunar = solar.getLunar();
        const lunarStr = `${lunar.getYear()}-${String(lunar.getMonth()).padStart(2, '0')}-${String(lunar.getDay()).padStart(2, '0')}`;
        onChange('deathLunarDate', lunarStr);
      } catch (err) {
        // Bỏ qua nếu ngày không hợp lệ
      }
    } else {
      onChange('deathLunarDate', '');
    }
  };

  const handleLunarChange = (val) => {
    onChange('deathLunarDate', val);
    
    if (val && val !== '0000-01-01') {
      try {
        const [y, m, d] = val.split('-').map(Number);
        // Lunar.fromYmd(year, month, day) - month có thể âm nếu là tháng nhuận, nhưng ở form HTML thì date picker chỉ hỗ trợ tháng dương (1-12)
        // lunar-javascript có thể lấy tháng 1-12
        const lunar = Lunar.fromYmd(y, m, d);
        const solar = lunar.getSolar();
        const solarStr = `${solar.getYear()}-${String(solar.getMonth()).padStart(2, '0')}-${String(solar.getDay()).padStart(2, '0')}`;
        onChange('deathDate', solarStr);
      } catch (err) {
        // Bỏ qua nếu ngày không hợp lệ
      }
    } else {
      onChange('deathDate', '');
    }
  };

  return (
    <div className="form-section">
      <h3 className="form-section-title">2. Thời gian Sinh / Mất</h3>
      <div className="form-row">
        <div className="form-group">
          <label>Ngày tháng năm sinh (Dương lịch)</label>
          <DateInputGroup value={formData.birthDate} onChange={val => onChange('birthDate', val)} />
        </div>
        <div className="form-group form-group-checkbox">
          <label className="checkbox-label checkbox-label-padded">
            <input 
              type="checkbox" 
              checked={formData.isDeceased} 
              onChange={e => {
                onChange('isDeceased', e.target.checked);
                if (!e.target.checked) {
                  onChange('deathDate', '');
                  onChange('deathLunarDate', '');
                }
              }} 
            />
            Đã khuất
          </label>
        </div>
      </div>

      {formData.isDeceased && (
        <div className="deceased-alert">
          <p className="deceased-alert-text">
            * Nhập Ngày Dương lịch hoặc Âm lịch. Hệ thống sẽ tự động tính toán và điền phần còn lại.
          </p>
          <div className="form-row">
            <div className="form-group">
              <label>Ngày mất (Dương lịch)</label>
              <DateInputGroup value={formData.deathDate} onChange={handleSolarChange} />
            </div>
            <div className="form-group">
              <label>Ngày mất (Âm lịch)</label>
              <DateInputGroup value={formData.deathLunarDate} onChange={handleLunarChange} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateInfo;
