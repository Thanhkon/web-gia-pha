import React from 'react';
import { List, LayoutGrid, Eye, Edit2, Trash2 } from 'lucide-react';
import avatarMale from '../../assets/avatar-male.svg';
import avatarFemale from '../../assets/avatar-female.svg';

const MembersTable = ({
  filteredPersons,
  viewMode,
  setViewMode,
  setViewingMember,
  handleEdit,
  handleDelete
}) => {
  return (
    <>
      <div className="view-toggle" style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.5rem 1.5rem' }}>
        <button
          className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
          onClick={() => setViewMode('table')}
          title="Dạng bảng"
        >
          <List size={18} />
        </button>
        <button
          className={`toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
          onClick={() => setViewMode('card')}
          title="Dạng thẻ"
        >
          <LayoutGrid size={18} />
        </button>
      </div>

      <div className="admin-content">
        {viewMode === 'table' ? (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Họ và tên</th>
                  <th>Giới tính</th>
                  <th>Năm sinh</th>
                  <th>Đời</th>
                  <th>Vai trò / Trạng thái</th>
                  {(handleEdit || handleDelete) && <th style={{ textAlign: 'right' }}>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {filteredPersons.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="person-name-cell">
                        <img
                          src={p.imageUrl || (p.gender === 'male' ? avatarMale : avatarFemale)}
                          alt="avatar"
                          className="table-avatar"
                        />
                        <span style={{ fontWeight: 600 }}>{p.fullName}</span>
                      </div>
                    </td>
                    <td>{p.gender === 'male' ? 'Nam' : 'Nữ'}</td>
                    <td>{p.birthYear}</td>
                    <td>Đời thứ {p.generation}</td>
                    <td>
                      <div className="table-badges">
                        {p.isDeleted && <span className="badge-sm bg-gray" style={{ backgroundColor: '#4b5563', color: 'white' }}>Đã xóa</span>}
                        {p.isInLaw && <span className="badge-sm bg-purple">Dâu/Rể</span>}
                        {p.role && <span className="badge-sm bg-blue">{p.role}</span>}
                        {p.isDeceased && <span className="badge-sm bg-gray">Đã khuất</span>}
                      </div>
                    </td>
                    {(handleEdit || handleDelete) && (
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons">
                          <button className="btn-icon text-primary" onClick={() => setViewingMember(p)} title="Xem hồ sơ"><Eye size={16} /></button>
                          {handleEdit && <button className="btn-icon text-blue" onClick={() => handleEdit(p)} title="Chỉnh sửa"><Edit2 size={16} /></button>}
                          {handleDelete && <button className="btn-icon text-danger" onClick={() => handleDelete(p.id)} title="Xóa"><Trash2 size={16} /></button>}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredPersons.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Không tìm thấy thành viên.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="cards-grid">
            {filteredPersons.map(p => (
              <div key={p.id} className="member-admin-card">
                <div className="card-header">
                  <img
                    src={p.imageUrl || (p.gender === 'male' ? avatarMale : avatarFemale)}
                    alt="avatar"
                    className="card-avatar"
                  />
                  <div className="card-actions">
                    <button className="btn-icon text-primary" onClick={() => setViewingMember(p)} title="Xem"><Eye size={16} /></button>
                    {handleEdit && <button className="btn-icon text-blue" onClick={() => handleEdit(p)} title="Sửa"><Edit2 size={16} /></button>}
                    {handleDelete && <button className="btn-icon text-danger" onClick={() => handleDelete(p.id)} title="Xóa"><Trash2 size={16} /></button>}
                  </div>
                </div>
                <div className="card-body">
                  <h4 className="card-name">{p.fullName}</h4>
                  <p className="card-meta">Sinh năm: {p.birthYear} | Đời {p.generation}</p>
                  <div className="card-badges">
                    {p.isDeleted && <span className="badge-sm bg-gray" style={{ backgroundColor: '#4b5563', color: 'white' }}>Đã xóa</span>}
                    {p.isInLaw && <span className="badge-sm bg-purple">Dâu/Rể</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MembersTable;
