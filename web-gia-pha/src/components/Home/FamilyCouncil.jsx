import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Users } from 'lucide-react';
import { fetchFamilyTree } from '../../store/slices/membersSlice';
import { getAvatarUrl } from '../../utils/imageHelper';
import Skeleton from '../common/Skeleton';
import '../../css/components/FamilyCouncil.css';

const FamilyCouncil = ({ familyId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { persons, loading } = useSelector((state) => state.members);

  useEffect(() => {
    if (familyId) {
      dispatch(fetchFamilyTree(familyId));
    }
  }, [dispatch, familyId]);

  // Lọc các thành viên có role khác null/rỗng
  const councilMembers = persons?.filter(person => person.role && person.role.trim() !== '') || [];

  if (loading && (!persons || persons.length === 0)) {
    return (
      <section className="family-council-section">
        <div className="council-header">
          <h2>Hội Đồng Gia Tộc</h2>
          <p className="council-subtitle">Đang tải danh sách thành viên cốt cán...</p>
        </div>
        <div className="council-carousel">
          {[1, 2, 3].map(i => (
            <div key={i} className="council-card">
              <Skeleton width="80px" height="80px" borderRadius="50%" style={{ margin: '0 auto 1rem' }} />
              <Skeleton width="70%" height="20px" style={{ margin: '0 auto 0.5rem' }} />
              <Skeleton width="40%" height="18px" borderRadius="12px" style={{ margin: '0 auto' }} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="family-council-section">
      <div className="council-header">
        <h2>Hội Đồng Gia Tộc</h2>
        <p className="council-subtitle">Những thành viên đóng vai trò quan trọng trong việc xây dựng và gìn giữ truyền thống dòng họ</p>
      </div>

      <div className={`council-carousel ${councilMembers.length < 4 ? 'centered' : ''}`}>
        {councilMembers.length > 0 ? (
          councilMembers.map(member => (
            <div
              key={member.id}
              className="council-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/${familyId}/family-tree`)}
            >
              <div className="council-avatar-wrapper">
                <img
                  src={getAvatarUrl(member.avatarUrl)}
                  alt={member.fullName}
                  className="council-avatar"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/default-avatar.png';
                  }}
                />
              </div>
              <h3 className="council-name">{member.fullName}</h3>
              <div className="council-role">{member.role}</div>
              {member.generation && (
                <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Đời thứ {member.generation}</div>
              )}
            </div>
          ))
        ) : (
          <div className="council-empty">
            <Users size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
            <h3>Chưa có dữ liệu</h3>
            <p>Hiện chưa có thành viên nào được gán vai trò trong Hội đồng gia tộc.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FamilyCouncil;
