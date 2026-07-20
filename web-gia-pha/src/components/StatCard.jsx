import React from 'react';
import '../css/components/StatCard.css';

const StatCard = ({ icon: Icon, value, label, color = 'var(--primary)' }) => {
  return (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="stat-icon" style={{ backgroundColor: `${color}15`, color: color }}>
        <Icon size={28} />
      </div>
      <div className="stat-info">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
};

export default StatCard;
