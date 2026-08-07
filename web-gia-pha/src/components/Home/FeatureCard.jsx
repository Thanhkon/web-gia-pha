import React from 'react';
import { Link } from 'react-router-dom';
import '../../css/components/FeatureCard.css';

const FeatureCard = ({ title, description, icon: Icon, path, color = 'var(--primary)' }) => {
  return (
    <Link to={path} className="feature-card">
      <div className="feature-icon" style={{ backgroundColor: `${color}15`, color: color }}>
        <Icon size={24} />
      </div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{description}</p>
    </Link>
  );
};

export default FeatureCard;
