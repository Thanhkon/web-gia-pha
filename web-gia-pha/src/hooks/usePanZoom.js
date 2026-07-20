import { useState, useRef, useCallback } from 'react';

export const usePanZoom = (initialScale = 1) => {
  const [scale, setScale] = useState(initialScale);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Dùng ref thay vì đọc state trong callback để tránh re-create hàm mỗi khi position đổi.
  // Trước đây onMouseDown có dep [position] → tạo hàm mới mỗi pixel drag → lag.
  const positionRef = useRef({ x: 0, y: 0 });
  const dragStartInfo = useRef({ mouseX: 0, mouseY: 0, posX: 0, posY: 0 });
  const isDraggingRef = useRef(false);

  // Sync positionRef với state để các callbacks luôn đọc được giá trị mới nhất
  const updatePosition = useCallback((newPos) => {
    positionRef.current = newPos;
    setPosition(newPos);
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
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomSensitivity = 0.005;
      const delta = -e.deltaY * zoomSensitivity;
      setScale((prev) => Math.min(Math.max(0.2, prev + delta), 3));
    } else {
      updatePosition({
        x: positionRef.current.x,
        y: positionRef.current.y - e.deltaY,
      });
    }
  }, [updatePosition]);

  const resetView = useCallback(() => {
    setScale(initialScale);
    updatePosition({ x: 0, y: 0 });
  }, [initialScale, updatePosition]);

  const zoomIn = useCallback(() => setScale(s => Math.min(s + 0.1, 3)), []);
  const zoomOut = useCallback(() => setScale(s => Math.max(s - 0.1, 0.2)), []);

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
  };
};
