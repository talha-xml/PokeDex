import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiCheck } from 'react-icons/fi';
import '../styles/customselect.css';

function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  className = '',
  isGrid = false,
  alignRight = false,
  id
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Normalize options into { value, label } objects
  const normalizedOptions = options.map((opt) =>
    typeof opt === 'object' && opt !== null
      ? opt
      : { value: opt, label: opt }
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value) || {
    value,
    label: value || placeholder
  };

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      className={`custom-select-container ${isOpen ? 'open' : ''} ${className}`}
      ref={containerRef}
      id={id}
    >
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="custom-select-value">{selectedOption.label}</span>
        <FiChevronDown
          className={`custom-select-arrow ${isOpen ? 'rotated' : ''}`}
        />
      </button>

      {isOpen && (
        <ul
          className={`custom-select-dropdown ${isGrid ? 'grid-layout' : ''} ${
            alignRight ? 'align-right' : ''
          }`}
          role="listbox"
        >
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;

            return (
              <li
                key={opt.value}
                className={`custom-select-option ${
                  isSelected ? 'selected' : ''
                }`}
                onClick={() => handleSelect(opt.value)}
                role="option"
                aria-selected={isSelected}
              >
                <span>{opt.label}</span>
                {!isGrid && isSelected && (
                  <FiCheck className="option-check-icon" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default CustomSelect;

