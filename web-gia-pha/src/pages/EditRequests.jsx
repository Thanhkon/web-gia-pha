import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { addRequest, fetchRequests, selectAllRequests } from '../store/slices/editRequestsSlice';
import RequestForm from '../components/EditRequests/RequestForm';
import RequestCard from '../components/EditRequests/RequestCard';
import toast from 'react-hot-toast';
import '../css/pages/EditRequests.css';

const EditRequests = () => {
  const { familyId } = useParams();
  const dispatch = useDispatch();
  
  // Dùng localStorage để giữ lại danh sách tên người gửi trên máy này
  const [currentUserNames, setCurrentUserNames] = useState(() => {
    const saved = localStorage.getItem('family_tree_requester_names');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  useEffect(() => {
    if (familyId) {
      dispatch(fetchRequests(familyId));
    }
  }, [dispatch, familyId]);
  
  const persons = useSelector(state => state.members.persons.filter(p => !p.isDeleted));
  const allRequests = useSelector(selectAllRequests);
  
  // Lọc ra các request do người dùng hiện tại (trên trình duyệt này) vừa gửi
  // Để đơn giản, ta sẽ lưu lại tên những người gửi trong tab hiện tại.
  const myRequests = allRequests.filter(r => currentUserNames.has(r.submittedByName)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const myPendingCount = myRequests.filter(r => r.status?.toLowerCase() === 'pending').length;

  const handleSubmit = async (requestData) => {
    try {
      await dispatch(addRequest({
        familyId: familyId,
        requestData: {
          targetMemberId: requestData.targetMemberId,
          requestType: requestData.type,
          changes: requestData.changes,
          reason: requestData.reason,
          submittedByName: requestData.submittedBy.name,
          submittedByPhone: requestData.submittedBy.phone
        }
      })).unwrap();

      const newNames = new Set(currentUserNames).add(requestData.submittedBy.name);
      setCurrentUserNames(newNames);
      localStorage.setItem('family_tree_requester_names', JSON.stringify([...newNames]));
      
      toast.success('Yêu cầu đã được gửi thành công! Vui lòng chờ Admin phê duyệt.');
    } catch (error) {
      console.error(error);
      toast.error('Có lỗi xảy ra khi gửi yêu cầu.');
    }
  };

  return (
    <div className="edit-requests-page container animate-fade-in">
      <div className="page-header">
        <h1>Gửi Yêu Cầu Chỉnh Sửa</h1>
        <p>Phát hiện sai sót trong gia phả? Hãy gửi yêu cầu chỉnh sửa để Admin cập nhật lại thông tin chính xác nhất.</p>
      </div>

      <div className="edit-requests-layout">
        <div className="left-column">
          <RequestForm 
            persons={persons} 
            onSubmit={handleSubmit} 
            pendingCount={myPendingCount} 
          />
        </div>

        <div className="right-column">
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Yêu cầu bạn vừa gửi (Phiên này)</h2>
            </div>
            <div className="panel-body requests-list">
              {myRequests.length === 0 ? (
                <div className="empty-state">
                  <p>Bạn chưa gửi yêu cầu nào trong phiên làm việc này.</p>
                </div>
              ) : (
                myRequests.map(req => (
                  <RequestCard key={req.id} request={req} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRequests;
