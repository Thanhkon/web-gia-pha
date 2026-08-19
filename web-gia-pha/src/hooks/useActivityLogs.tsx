import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '../utils/apiClient';

export interface ActivityLog {
  id: number;
  action: string;
  familyId: number;
  actorId?: number;
  actorName?: string;
  targetId?: number;
  targetName?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityLogFilters {
  action: string;
  fromDate: string;
  toDate: string;
}

export interface PaginationState {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const useActivityLogs = (familyId: string | number | undefined) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const [filters, setFilters] = useState<ActivityLogFilters>({
    action: '',
    fromDate: '',
    toDate: '',
  });

  const fetchLogs = useCallback(
    async (page: number = 1) => {
      if (!familyId) return;

      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
        });

        if (filters.action) params.append('action', filters.action);
        if (filters.fromDate) params.append('fromDate', filters.fromDate);
        if (filters.toDate) params.append('toDate', filters.toDate);

        const res = await apiClient.get(
          `/families/${familyId}/activity-logs?${params.toString()}`
        );
        setLogs(res.data.data);
        setPagination((prev) => ({
          ...prev,
          page: res.data.page,
          total: res.data.total,
          totalPages: res.data.totalPages,
        }));
      } catch (error) {
        console.error('Error fetching activity logs:', error);
        toast.error('Không thể tải nhật ký hoạt động');
      } finally {
        setLoading(false);
      }
    },
    [familyId, filters, pagination.limit]
  );

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    fetchLogs(1);
  };

  const handlePageChange = (newPage: number) => {
    fetchLogs(newPage);
  };

  const resetFilters = () => {
    setFilters({ action: '', fromDate: '', toDate: '' });
    // Dùng setTimeout để đảm bảo state đã được update trước khi fetch
    setTimeout(() => {
      // Need to use the clean filter state to fetch
      fetchLogsReset();
    }, 0);
  };
  
  const fetchLogsReset = async () => {
     if (!familyId) return;
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: '1',
          limit: pagination.limit.toString(),
        });
        const res = await apiClient.get(
          `/families/${familyId}/activity-logs?${params.toString()}`
        );
        setLogs(res.data.data);
        setPagination((prev) => ({
          ...prev,
          page: res.data.page,
          total: res.data.total,
          totalPages: res.data.totalPages,
        }));
      } catch (error) {
        console.error('Error fetching activity logs:', error);
        toast.error('Không thể tải nhật ký hoạt động');
      } finally {
        setLoading(false);
      }
  }

  return {
    logs,
    loading,
    pagination,
    filters,
    fetchLogs,
    handleFilterChange,
    applyFilters,
    handlePageChange,
    resetFilters,
  };
};
