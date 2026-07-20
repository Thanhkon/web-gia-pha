import { useState, useEffect } from 'react';

/**
 * Trả về giá trị đã được "debounce" — chỉ cập nhật sau khi người dùng
 * dừng gõ được `delay` ms. Dùng để tránh filter/search chạy mỗi keystroke.
 * 
 * @param {*} value - Giá trị cần debounce
 * @param {number} delay - Thời gian chờ (ms), mặc định 300ms
 */
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    // Cleanup: huỷ timer nếu value thay đổi trước khi delay kết thúc
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
