import React from 'react';
import { Star, Award } from 'lucide-react';
import '../css/components/MarqueeBanner.css';

const MarqueeBanner = ({ items }) => {
  return (
    <div className="marquee-container">
      <div className="marquee-content">
        {items.map((item, index) => (
          <div key={index} className="marquee-item">
            <span className="marquee-icon">
              {index % 2 === 0 ? <Star size={16} fill="currentColor" /> : <Award size={16} />}
            </span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarqueeBanner;
