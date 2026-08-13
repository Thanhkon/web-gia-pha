import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    fetchFamilies,
    findFamilyByCode,
    clearSearch,
} from "../store/slices/familiesSlice";
import { Plus, Users, GitMerge, Loader2 } from "lucide-react";
import CreateFamilyModal from "../components/Admin/CreateFamilyModal";
import JoinRequestModal from "../components/FamilyList/JoinRequestModal";
import { getAvatarUrl } from "../utils/imageHelper";
import "../css/pages/FamilyList.css";

const FamilyList = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const {
        list: families,
        loading,
        searchResult,
        searchLoading,
        searchError,
    } = useSelector((state) => state.families);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [joinRequestModalData, setJoinRequestModalData] = useState({ isOpen: false, familyId: null, familyName: "" });
    const [searchCode, setSearchCode] = useState("");
    const [searchAttempted, setSearchAttempted] = useState(false);
    const searchInputRef = useRef(null);

    const hasFamily = families && families.length > 0;

    // Tự động gọi API lấy danh sách gia phả của User/Member khi truy cập trang
    useEffect(() => {
        dispatch(fetchFamilies());
    }, [dispatch]);

    const handleCreate = () => {
        setIsCreateModalOpen(true);
    };

    const handleSearch = () => {
        const code = (searchCode || "").trim();
        if (!code) return;
        setSearchAttempted(true);
        dispatch(findFamilyByCode(code));
    };

    const handleJoinRequest = (family) => {
        setJoinRequestModalData({
            isOpen: true,
            familyId: family.id,
            familyName: family.name
        });
    };

    const renderFamilyCard = (family, isSearchResult = false) => {
        const rawCover = family.coverImageUrl || family.coverImg;
        const coverImage = getAvatarUrl(rawCover);

        return (
            <div key={family.id} className="family-card">
                <div
                    className="family-card-cover"
                    onClick={() => {
                        if (!isSearchResult) navigate(`/${family.id}/home`);
                    }}
                    style={{ cursor: isSearchResult ? "default" : "pointer" }}
                >
                    <img
                        src={coverImage}
                        alt={family.name}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/default-cover.jpg";
                        }}
                    />
                    <div className="family-card-overlay"></div>
                    {!isSearchResult && family.role && (
                        <div className={`family-role-badge ${family.role}`}>
                            {family.role === "admin" || family.role === "editor"
                                ? "Quản trị"
                                : "Thành viên"}
                        </div>
                    )}
                </div>

                <div className="family-card-body">
                    <h3
                        className="family-card-title"
                        onClick={() => {
                            if (!isSearchResult) navigate(`/${family.id}/home`);
                        }}
                        style={{
                            cursor: isSearchResult ? "default" : "pointer",
                        }}
                    >
                        {family.name}
                    </h3>

                    <p className="family-card-code">
                        Mã gia phả: {family.familyCode}
                    </p>
                    <p className="family-card-desc">
                        Desc: {family.description}
                    </p>

                    <div className="family-stats">
                        <div className="stat-item" title="Số thành viên">
                            <Users size={16} />
                            <span>{family.membersCount || 0}</span>
                        </div>
                        <div className="stat-item" title="Số thế hệ">
                            <GitMerge size={16} />
                            <span>{family.generations || 0}</span>
                        </div>
                    </div>

                    <div className="family-card-actions">
                        {!isSearchResult ? (
                            <button
                                className="action-link manage"
                                onClick={() =>
                                    navigate(
                                        `/admin/families/${family.id}/members`,
                                    )
                                }
                            >
                                Vào gia phả
                            </button>
                        ) : (
                            <button
                                className="btn btn-primary"
                                onClick={() => handleJoinRequest(family)}
                            >
                                Yêu cầu tham gia
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderMainContent = () => {
        if (loading || searchLoading) {
            return (
                <div className="family-list-loading">
                    <Loader2 size={40} className="animate-spin" />
                    <p>
                        {searchLoading
                            ? "Đang tìm gia phả theo mã..."
                            : "Đang tải danh sách gia phả..."}
                    </p>
                </div>
            );
        }

        if (searchAttempted) {
            if (searchResult) {
                return (
                    <div className="family-search-result">
                        <h3 style={{ marginBottom: "16px" }}>
                            Kết quả tìm kiếm
                        </h3>
                        <div className="family-grid">
                            {renderFamilyCard(searchResult, true)}
                        </div>
                    </div>
                );
            }

            return (
                <div className="family-list-empty">
                    <p>
                        {typeof searchError === "object"
                            ? searchError?.message ||
                            "Không tìm thấy gia phả với mã này"
                            : searchError ||
                            "Không tìm thấy gia phả với mã này"}
                    </p>
                </div>
            );
        }

        if (hasFamily) {
            return (
                <div className="family-grid">
                    {families.map((family) => renderFamilyCard(family))}
                </div>
            );
        }

        return (
            <div className="family-list-empty">
                <h3>Chưa có gia phả nào</h3>
                <p>
                    Bạn chưa gia nhập gia phả nào. Hãy tìm mã gia phả hoặc tạo
                    gia phả mới để bắt đầu.
                </p>
                <button className="btn-create-tree" onClick={handleCreate}>
                    <Plus size={20} /> Tạo gia phả mới
                </button>
            </div>
        );
    };

    return (
        <div className="family-list-page animate-fade-in">
            <div className="family-list-container">
                <div className="family-list-header">
                    <h1 className="family-list-title">Danh sách gia phả</h1>
                </div>

                <div className="family-search-row">
                    <div className="family-search-box">
                        <input
                            ref={searchInputRef}
                            value={searchCode}
                            onChange={(e) => {
                                const value = e.target.value;
                                setSearchCode(value);
                                if (!value.trim() && searchAttempted) {
                                    setSearchAttempted(false);
                                    dispatch(clearSearch());
                                }
                            }}
                            placeholder="Nhập mã gia phả (6 chữ số)"
                            className="admin-input"
                            style={{ flex: 1 }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSearch();
                            }}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleSearch}
                        >
                            Tìm kiếm
                        </button>
                    </div>

                    {hasFamily && !searchAttempted && (
                        <button
                            className="btn-add-new-family"
                            onClick={handleCreate}
                        >
                            <Plus size={18} /> Thêm gia phả mới
                        </button>
                    )}
                </div>

                {renderMainContent()}
            </div>

            <CreateFamilyModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => dispatch(fetchFamilies())}
            />

            <JoinRequestModal
                isOpen={joinRequestModalData.isOpen}
                onClose={() => setJoinRequestModalData({ isOpen: false, familyId: null, familyName: "" })}
                familyId={joinRequestModalData.familyId}
                familyName={joinRequestModalData.familyName}
            />
        </div>
    );
};

export default FamilyList;
