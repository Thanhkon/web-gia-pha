import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import '../../css/components/SearchableSelect.css';

interface SearchableSelectProps {
  options: Array<{ value: string; label: string; group?: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options, // Array of { value, label, group (optional) }
  value,
  onChange,
  placeholder = '-- Chọn --',
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hàm loại bỏ dấu tiếng Việt để tìm kiếm mượt hơn
  const removeAccents = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  };

  // Lọc options dựa trên từ khóa tìm kiếm
  const filteredOptions = options.filter(opt => {
    const labelRaw = opt.label.toLowerCase();
    const searchRaw = searchTerm.toLowerCase();
    if (labelRaw.includes(searchRaw)) return true;

    // Tìm kiếm không dấu
    const labelNoAccents = removeAccents(labelRaw);
    const searchNoAccents = removeAccents(searchRaw);
    return labelNoAccents.includes(searchNoAccents);
  });

  // Phân nhóm (nếu có group)
  type SelectOption = { value: string; label: string; group?: string };
  const groupedOptions = filteredOptions.reduce((acc, opt) => {
    type GroupedOptions = {
      [key: string]: SelectOption[];
    };
    const group = opt.group || 'Khác';
    if (!acc[group]) acc[group] = [];
    acc[group].push(opt);
    return acc;
  }, {} as Record<string, SelectOption[]>);

  // Xác định xem có sử dụng group không
  const hasGroups = options.some(opt => opt.group);

  // Tìm label của option đang được chọn
  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : '';

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setSearchTerm(''); // Xóa từ khóa khi đóng
    }
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`searchable-select ${disabled ? 'disabled' : ''} ${className}`} ref={wrapperRef}>
      <div
        className={`searchable-select-header ${isOpen ? 'open' : ''}`}
        onClick={toggleDropdown}
      >
        <div className={`selected-value ${!selectedOption ? 'placeholder' : ''}`}>
          {displayValue || placeholder}
        </div>
        <ChevronDown size={16} className={`chevron-icon ${isOpen ? 'rotated' : ''}`} />
      </div>

      {isOpen && (
        <div className="searchable-select-dropdown">
          <div className="searchable-select-search-box">
            <Search size={16} className="search-icon" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Gõ để tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="searchable-select-list">
            <div
              className={`searchable-select-option ${value === '' ? 'selected' : ''}`}
              onClick={() => handleSelect('')}
            >
              -- Không chọn / Trống --
            </div>

            {filteredOptions.length === 0 ? (
              <div className="searchable-select-no-results">Không tìm thấy kết quả</div>
            ) : (
              hasGroups ? (
                Object.entries(groupedOptions).map(([group, opts]) => (
                  opts.length > 0 && (
                    <div key={group} className="searchable-select-group">
                      <div className="searchable-select-group-title">{group}</div>
                      {opts.map(opt => (
                        <div
                          key={opt.value}
                          className={`searchable-select-option ${value === opt.value ? 'selected' : ''}`}
                          onClick={() => handleSelect(opt.value)}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  )
                ))
              ) : (
                filteredOptions.map(opt => (
                  <div
                    key={opt.value}
                    className={`searchable-select-option ${value === opt.value ? 'selected' : ''}`}
                    onClick={() => handleSelect(opt.value)}
                  >
                    {opt.label}
                  </div>
                ))
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
