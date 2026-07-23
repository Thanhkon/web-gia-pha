import { useState, useRef, useCallback } from 'react';

export const usePanZoom = (initialScale = 1) => {
  const [scale, setScale] = useState(initialScale);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const scaleRef = useRef(initialScale);
  const positionRef = useRef({ x: 0, y: 0 });
  const dragStartInfo = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });
  const isDraggingRef = useRef(false);

  // Sync positionRef với state để các callbacks luôn đọc được giá trị mới nhất
  const updatePosition = useCallback((newPos) => {
    positionRef.current = newPos;
    setPosition(newPos);
  }, []);

  const updateScale = useCallback((newScale) => {
    scaleRef.current = newScale;
    setScale(newScale);
  }, []);

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button') || e.target.closest('a')) return;

    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartInfo.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      // Đọc từ ref, không cần capture state vào dep array
      posX: positionRef.current.x,
      posY: positionRef.current.y,
    };
  }, []); // dep array rỗng — hàm không bao giờ bị tạo lại

  const onMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - dragStartInfo.current.mouseX;
    const dy = e.clientY - dragStartInfo.current.mouseY;

    updatePosition({
      x: dragStartInfo.current.posX + dx,
      y: dragStartInfo.current.posY + dy,
    });
  }, [updatePosition]);

  const onMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  const onWheel = useCallback((e) => {

    const zoomSensitivity = 0.005;
    const delta = -e.deltaY * zoomSensitivity;

    const prevScale = scaleRef.current;
    const newScale = Math.min(Math.max(0.2, prevScale + delta), 3);

    if (newScale === prevScale) return;

    // Lấy tọa độ đồng bộ ngay khi sự kiện xảy ra
    const currentTarget = e.currentTarget;
    if (!currentTarget) return;

    const rect = currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Tính toán bù trừ vị trí để zoom vào đúng điểm chuột chỉ
    const scaleRatio = newScale / prevScale;

    updatePosition({
      x: mouseX - (mouseX - positionRef.current.x) * scaleRatio,
      y: mouseY - (mouseY - positionRef.current.y) * scaleRatio,
    });

    updateScale(newScale);
  }, [updatePosition, updateScale]);

  const resetView = useCallback(() => {
    updateScale(initialScale);
    updatePosition({ x: 0, y: 0 });
  }, [initialScale, updatePosition, updateScale]);

  const zoomIn = useCallback(() => updateScale(Math.min(scaleRef.current + 0.1, 3)), [updateScale]);
  const zoomOut = useCallback(() => updateScale(Math.max(scaleRef.current - 0.1, 0.2)), [updateScale]);

  return {
    scale,
    position,
    isDragging,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave: onMouseUp,
    onWheel,
    resetView,
    zoomIn,
    zoomOut,
    updatePosition,
    updateScale,
  };
};
