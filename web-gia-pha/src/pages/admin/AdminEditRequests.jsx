import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { selectAllRequests, fetchRequests, approveRequestThunk, rejectRequestThunk, deleteRequestThunk } from '../../store/slices/editRequestsSlice';
import { fetchFamilyTree } from '../../store/slices/membersSlice';
import RequestCard from '../../components/EditRequests/RequestCard';
import RequestDetailModal from '../../components/EditRequests/RequestDetailModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { Trash2 } from 'lucide-react';
import '../../css/pages/AdminEditRequests.css';

const AdminEditRequests = () => {
  const { familyId } = useParams();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'processed'
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  
  const allRequests = useSelector(selectAllRequests);
  const pendingRequests = allRequests.filter(r => r.status === 'PENDING');
  const processedRequests = allRequests.filter(r => r.status === 'APPROVED' || r.status === 'REJECTED');
  
  const currentUser = useSelector(state => state.auth.user);
  const persons = useSelector(state => state.members.persons);

  useEffect(() => {
    if (familyId) {
      dispatch(fetchRequests(familyId));
      dispatch(fetchFamilyTree(familyId));
    }
  }, [dispatch, familyId]);

  const handleApprove = async (requestId, adminNote) => {
    try {
      await dispatch(approveRequestThunk({ 
        id: requestId, 
        adminNote, 
        reviewerName: currentUser?.name || 'Admin' 
      })).unwrap();
      
      // Reload family tree to get updated member data
      dispatch(fetchFamilyTree(familyId));

      setSelectedRequest(null);
      alert('Đã duyệt và áp dụng thay đổi thành công!');
    } catch (err) {
      console.error(err);
      alert('Lỗi khi duyệt yêu cầu!');
    }
  };

  const handleReject = async (requestId, adminNote) => {
    try {
      await dispatch(rejectRequestThunk({ 
        id: requestId, 
        adminNote, 
        reviewerName: currentUser?.name || 'Admin' 
      })).unwrap();
      
      setSelectedRequest(null);
      alert('Đã từ chối yêu cầu thành công!');
    } catch (err) {
      console.error(err);
      alert('Lỗi khi từ chối yêu cầu!');
    }
  };

  const handleDelete = (requestId) => {
    setDeleteConfirmId(requestId);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      try {
        await dispatch(deleteRequestThunk(deleteConfirmId)).unwrap();
      } catch(err) {
        console.error(err);
        alert('Lỗi khi xóa yêu cầu!');
      }
    }
    setDeleteConfirmId(null);
  };

  const renderRequests = (requests, isHistory = false) => {
    if (requests.length === 0) {
      return (
        <div className="empty-state">
          <p>{isHistory ? 'Chưa có yêu cầu nào được xử lý.' : 'Không có yêu cầu nào đang chờ duyệt.'}</p>
        </div>
      );
    }

    return (
      <div className="admin-requests-grid">
        {requests.map(req => (
          <div key={req.id} className="admin-request-wrapper">
            <RequestCard request={req} />
            <div className="admin-request-actions">
              {req.status?.toLowerCase() === 'pending' ? (
                <button className="btn btn-primary btn-full" onClick={() => setSelectedRequest(req)}>
                  Xem chi tiết & Xử lý
                </button>
              ) : (
                <button className="btn btn-outline btn-full btn-danger-outline" onClick={() => handleDelete(req.id)}>
                  <Trash2 size={16} style={{marginRight: '8px'}} /> Xoá khỏi lịch sử
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="admin-page admin-requests-page">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Quản lý Yêu cầu Chỉnh sửa</h1>
          <p className="admin-page-subtitle">Duyệt hoặc từ chối các yêu cầu thay đổi thông tin từ thành viên họ tộc.</p>
        </div>
      </header>

      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Đang chờ xử lý
          {pendingRequests.length > 0 && <span className="tab-badge">{pendingRequests.length}</span>}
        </button>
        <button 
          className={`admin-tab ${activeTab === 'processed' ? 'active' : ''}`}
          onClick={() => setActiveTab('processed')}
        >
          Lịch sử đã xử lý
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'pending' ? renderRequests(pendingRequests) : renderRequests(processedRequests, true)}
      </div>

      {selectedRequest && (
        <RequestDetailModal 
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        title="Xóa lịch sử yêu cầu"
        message="Bạn có chắc chắn muốn xoá vĩnh viễn bản ghi yêu cầu này khỏi lịch sử?"
        onConfirm={confirmDelete}
        confirmText="Xóa vĩnh viễn"
        onCancel={() => setDeleteConfirmId(null)}
        isDanger={true}
      />
    </div>
  );
};

export default AdminEditRequests;
