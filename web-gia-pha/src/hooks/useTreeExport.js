import { useState } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

export const useTreeExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const captureTreeAsImage = async (containerId, filterNodes) => {
    const el = document.getElementById(containerId);
    if (!el) throw new Error('Không tìm thấy container');

    return {
      dataUrl: await toPng(el, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        width: el.scrollWidth,
        height: el.scrollHeight,
        filter: filterNodes,
      }),
      width: el.scrollWidth,
      height: el.scrollHeight,
    };
  };

  const handleExportPNG = async (containerId = 'exportable-tree-container', filterNodes = null) => {
    try {
      setIsExporting(true);
      toast.loading('Đang xử lý hình ảnh...', { id: 'exporting' });

      const { dataUrl } = await captureTreeAsImage(containerId, filterNodes);

      const link = document.createElement('a');
      link.download = `So_Do_Gia_Pha.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Xuất ảnh thành công!', { id: 'exporting' });
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi xuất ảnh', { id: 'exporting' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async (containerId = 'exportable-tree-container', filterNodes = null) => {
    try {
      setIsExporting(true);
      toast.loading('Đang tạo PDF...', { id: 'exporting' });

      const { dataUrl, width, height } = await captureTreeAsImage(containerId, filterNodes);

      const pdf = new jsPDF({
        orientation: width > height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [Math.max(width, 100), Math.max(height, 100)],
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
      pdf.save('So_Do_Gia_Pha.pdf');

      toast.success('Xuất tài liệu PDF thành công!', { id: 'exporting' });
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi xuất PDF', { id: 'exporting' });
    } finally {
      setIsExporting(false);
    }
  };

  return { isExporting, handleExportPNG, handleExportPDF };
};
