import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchFamilies, deleteFamily } from '../store/slices/familiesSlice';
import { Plus, Users, GitMerge, Edit3, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import ConfirmModal from '../components/common/ConfirmModal';
import CreateFamilyModal from '../components/Admin/CreateFamilyModal';
import '../css/pages/FamilyList.css';

const FamilyList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: families, loading } = useSelector((state) => state.families);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  useEffect(() => {
    // Fetch families on component mount
    dispatch(fetchFamilies());
  }, [dispatch]);

  const handleDelete = (e, id) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      await dispatch(deleteFamily(deleteConfirmId));
    }
    setDeleteConfirmId(null);
  };

  const handleEdit = (e, id) => {
    e.stopPropagation();
    alert(`Chức năng chỉnh sửa thông tin gia phả ${id} (Mock)`);
  };

  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  const renderContent = () => {
    if (loading && families.length === 0) {
      return (
        <div className="family-list-loading">
          <Loader2 size={40} />
          <p>Đang tải danh sách gia phả...</p>
        </div>
      );
    }

    if (families.length === 0) {
      return (
        <div className="family-list-empty">
          <h3>Chưa có gia phả nào</h3>
          <p>Bạn chưa tham gia hay quản lý gia phả nào. Hãy tạo một cây gia phả mới để bắt đầu.</p>
          <button className="btn-create-tree" onClick={handleCreate} style={{ margin: '0 auto' }}>
            <Plus size={20} /> Tạo gia phả mới
          </button>
        </div>
      );
    }

    return (
      <div className="family-grid">
        {families.map((family) => (
          <div key={family.id} className="family-card">
            <div className="family-card-cover" onClick={() => navigate(`/${family.id}/home`)} style={{ cursor: 'pointer' }}>
              <img src={family.coverImg} alt={family.name} />
              <div className="family-card-overlay"></div>
              <div className={`family-role-badge ${family.role}`}>
                {family.role === 'admin' ? 'Quản trị' : 'Thành viên'}
              </div>
            </div>
            
            <div className="family-card-body">
              <h3 className="family-card-title" onClick={() => navigate(`/${family.id}/home`)} style={{ cursor: 'pointer' }}>
                {family.name}
              </h3>
              <p className="family-card-desc">{family.description}</p>
              
              <div className="family-stats">
                <div className="stat-item" title="Số thành viên">
                  <Users size={16} />
                  <span>{family.membersCount}</span>
                </div>
                <div className="stat-item" title="Số thế hệ">
                  <GitMerge size={16} />
                  <span>{family.generations}</span>
                </div>
              </div>

              <div className="family-card-actions">
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button className="action-link manage" onClick={() => navigate(`/admin/families/${family.id}/members`)}>
                    <Edit3 size={16} />
                    Chỉnh sửa Phả đồ
                  </button>
                  <button className="action-link" onClick={() => navigate(`/${family.id}/home`)}>
                    Dashboard <ArrowRight size={16} />
                  </button>
                </div>

                {family.role === 'admin' && (
                  <div className="action-buttons">
                    <button className="icon-action-btn edit" onClick={(e) => handleEdit(e, family.id)} title="Sửa thông tin">
                      <Edit3 size={16} />
                    </button>
                    <button className="icon-action-btn delete" onClick={(e) => handleDelete(e, family.id)} title="Xóa gia phả">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="family-list-page animate-fade-in">
      <div className="family-list-container">
        <div className="family-list-header">
          <h1 className="family-list-title">Danh sách gia phả</h1>
          <button className="btn-create-tree" onClick={handleCreate}>
            <Plus size={20} />
            <span>Thêm cây gia phả mới</span>
          </button>
        </div>
        
        {renderContent()}
      </div>

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="Xóa gia phả"
        message="Bạn có chắc chắn muốn xóa vĩnh viễn gia phả này không? Mọi dữ liệu (thành viên, bài viết, sự kiện) sẽ bị xóa và không thể khôi phục."
        onConfirm={confirmDelete}
        confirmText="Xóa vĩnh viễn"
        onCancel={() => setDeleteConfirmId(null)}
        isDanger={true}
      />

      <CreateFamilyModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          // Bất kỳ hành động nào muốn thực hiện sau khi tạo thành công (vd hiển thị toast)
        }}
      />
    </div>
  );
};

export default FamilyList;
