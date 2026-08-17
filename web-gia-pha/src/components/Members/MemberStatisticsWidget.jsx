import React from 'react';
import { BarChart2, X } from 'lucide-react';
import '../../css/components/MemberStatisticsWidget.css';

const MemberStatisticsWidget = ({ persons = [], onClose }) => {
  // Tính toán dữ liệu
  const totalMembers = persons.length;

  let maxGen = 1;
  const genCounts = {};
  let living = 0;
  let deceased = 0;
  // removed direct, inLaw

  persons.forEach(p => {
    const gen = parseInt(p.generation, 10) || 1;
    if (gen > maxGen) maxGen = gen;

    genCounts[gen] = (genCounts[gen] || 0) + 1;

    if (p.isDeceased) deceased++;
    else living++;

    // removed direct, inLaw counting
  });

  const generations = maxGen;

  // Chuẩn bị dữ liệu vẽ biểu đồ thanh
  // Tìm số lượng lớn nhất trong 1 đời để tính % width
  const maxInGen = Math.max(...Object.values(genCounts), 1);

  return (
    <div className="stats-widget-container">
      <div className="stats-widget-header">
        <div className="stats-widget-title">
          <span>Tổng quan</span>
        </div>
      </div>

      <div className="stats-widget-body">
        <div className="stats-main-numbers">
          <div className="stat-box">
            <span className="stat-number">{totalMembers}</span>
            <span className="stat-label">Thành viên</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">{generations}</span>
            <span className="stat-label">Thế hệ</span>
          </div>
        </div>

        <div className="stats-distribution">
          <div className="stats-section-title">Phân bố theo đời</div>
          <div className="stats-bars">
            {Array.from({ length: generations }, (_, i) => i + 1).map(gen => {
              const count = genCounts[gen] || 0;
              const percent = maxInGen > 0 ? (count / maxInGen) * 100 : 0;
              return (
                <div key={gen} className="stat-bar-row">
                  <span className="stat-bar-label">Đ{gen}</span>
                  <div className="stat-bar-track">
                    <div
                      className="stat-bar-fill"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <span className="stat-bar-value">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="stats-details-grid">
          <div className="stat-detail-item">
            <div className="stat-dot dot-green"></div>
            <span className="stat-detail-label">Còn sống</span>
            <span className="stat-detail-value">{living}</span>
          </div>
          <div className="stat-detail-item">
            <div className="stat-dot dot-grey"></div>
            <span className="stat-detail-label">Đã mất</span>
            <span className="stat-detail-value">{deceased}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberStatisticsWidget;
