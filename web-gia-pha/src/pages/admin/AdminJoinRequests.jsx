import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Check, X, Loader2, MessageSquare, Clock } from "lucide-react";
import apiClient from "../../utils/apiClient";
import toast from "react-hot-toast";
import "../../css/pages/AdminMembers.css";

const AdminJoinRequests = () => {
    const { familyId } = useParams();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // id of request being processed
    const [roles, setRoles] = useState({}); // state lưu quyền cho từng request

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/families/${familyId}/join-requests?status=PENDING`);
            setRequests(res.data || []);
        } catch (error) {
            console.error("Lỗi khi tải yêu cầu tham gia:", error);
            toast.error("Không thể tải danh sách yêu cầu");
        } finally {
            setLoading(false);
        }
    }, [familyId]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleAction = async (id, status) => {
        setActionLoading(id);
        try {
            const endpoint = status === "APPROVED" ? "approve" : "reject";
            const payload = { adminNote: "" };
            if (status === "APPROVED") {
                payload.role = roles[id] || "viewer";
            }
            
            await apiClient.patch(`/join-requests/${id}/${endpoint}`, payload);
            toast.success(status === "APPROVED" ? "Đã duyệt yêu cầu" : "Đã từ chối yêu cầu");
            
            // Remove from list
            setRequests(prev => prev.filter(req => req.id !== id));
        } catch (error) {
            console.error(`Lỗi khi ${status}:`, error);
            toast.error(error.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 size={40} className="animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="admin-page animate-fade-in">
            <div className="admin-header" style={{ marginBottom: "1.5rem" }}>
                <h1 className="admin-title">Yêu cầu tham gia</h1>
                <p className="admin-subtitle">Duyệt những người dùng muốn tham gia vào gia phả của bạn</p>
            </div>

            <div className="admin-content">
                <div className="table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Người gửi yêu cầu</th>
                                <th>Nhận diện là</th>
                                <th>Thời gian gửi</th>
                                <th>Lời nhắn</th>
                                <th className="text-center" style={{ minWidth: "300px" }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="table-empty-state">
                                        <div style={{ padding: "2rem 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                                            <Clock size={48} className="text-gray-300" />
                                            <p>Hiện không có yêu cầu nào chờ duyệt.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                requests.map(request => (
                                    <tr key={request.id}>
                                        <td>
                                            <div className="person-name-cell">
                                                <div style={{
                                                    width: "36px", height: "36px", borderRadius: "50%",
                                                    backgroundColor: "#e5e7eb", display: "flex",
                                                    alignItems: "center", justifyContent: "center",
                                                    fontWeight: "bold", color: "#6b7280"
                                                }}>
                                                    {request.user?.fullName?.charAt(0) || request.user?.username?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-semibold">{request.user?.fullName || request.user?.username || 'User vô danh'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="font-semibold text-primary">
                                                {request.targetMember?.fullName}
                                            </div>
                                            {request.targetMember?.generation && (
                                                <span className="text-sm text-gray-500">Đời thứ {request.targetMember.generation}</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className="text-sm text-gray-600">
                                                {new Date(request.createdAt).toLocaleString('vi-VN')}
                                            </span>
                                        </td>
                                        <td>
                                            {request.note ? (
                                                <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", maxWidth: "200px", fontSize: "0.875rem" }}>
                                                    <MessageSquare size={14} style={{ marginTop: "3px", flexShrink: 0, color: "#6b7280" }} />
                                                    <p style={{ margin: 0, color: "#4b5563" }}>{request.note}</p>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">Không có</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginRight: "0.5rem" }}>
                                                    <select 
                                                        className="admin-input" 
                                                        style={{ padding: "4px 8px", fontSize: "0.875rem" }}
                                                        value={roles[request.id] || "viewer"}
                                                        onChange={(e) => setRoles(prev => ({ ...prev, [request.id]: e.target.value }))}
                                                    >
                                                        <option value="viewer">Chỉ xem</option>
                                                        <option value="editor">Biên tập</option>
                                                    </select>
                                                </div>
                                                <button
                                                    className="btn btn-danger"
                                                    style={{ padding: "6px 12px", fontSize: "0.875rem" }}
                                                    disabled={actionLoading === request.id}
                                                    onClick={() => handleAction(request.id, "REJECTED")}
                                                >
                                                    <X size={14} /> Từ chối
                                                </button>
                                                <button
                                                    className="btn btn-success"
                                                    style={{ padding: "6px 12px", fontSize: "0.875rem" }}
                                                    disabled={actionLoading === request.id}
                                                    onClick={() => handleAction(request.id, "APPROVED")}
                                                >
                                                    {actionLoading === request.id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Check size={14} />
                                                    )}
                                                    Đồng ý
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminJoinRequests;
