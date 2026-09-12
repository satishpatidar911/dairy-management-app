import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'खोजें (Search by tag, name)...',
  disabled = false,
  className = '',
  accentColor = 'purple'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  // Filter options based on search query
  const filteredOptions = options.filter(opt => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    const labelMatch = (opt.label || '').toLowerCase().includes(q);
    const subMatch = (opt.sublabel || '').toLowerCase().includes(q);
    const valMatch = String(opt.value || '').toLowerCase().includes(q);
    const tagMatch = (opt.tag || '').toLowerCase().includes(q);
    const nameMatch = (opt.name || '').toLowerCase().includes(q);
    return labelMatch || subMatch || valMatch || tagMatch || nameMatch;
  });

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0].value);
      }
    }
  };

  const ringFocusColor = accentColor === 'emerald' 
    ? 'focus:ring-emerald-500 border-emerald-500 dark:border-emerald-500' 
    : accentColor === 'rose'
    ? 'focus:ring-rose-500 border-rose-500 dark:border-rose-500'
    : accentColor === 'amber'
    ? 'focus:ring-amber-500 border-amber-500 dark:border-amber-500'
    : 'focus:ring-purple-500 border-purple-500 dark:border-purple-500';

  const checkColor = accentColor === 'emerald' 
    ? 'text-emerald-600 dark:text-emerald-400' 
    : accentColor === 'rose'
    ? 'text-rose-600 dark:text-rose-400'
    : accentColor === 'amber'
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-purple-600 dark:text-purple-400';

  const getOptionClasses = (isSelected) => {
    if (isSelected) {
      switch (accentColor) {
        case 'emerald':
          return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-700';
        case 'rose':
          return 'bg-rose-100 dark:bg-rose-950/80 text-rose-950 dark:text-rose-200 font-bold border border-rose-300 dark:border-rose-700';
        case 'amber':
          return 'bg-amber-100 dark:bg-amber-950/80 text-amber-950 dark:text-amber-200 font-bold border border-amber-300 dark:border-amber-700';
        default:
          return 'bg-purple-100 dark:bg-purple-950/80 text-purple-950 dark:text-purple-200 font-bold border border-purple-300 dark:border-purple-700';
      }
    }
    // Hover style for unselected items with clear dark/light mode contrast
    return 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent';
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full px-3 py-2.5 text-xs rounded-xl border transition-all text-left flex items-center justify-between gap-2 shadow-xs bg-white dark:bg-slate-900 ${
          isOpen 
            ? `ring-2 ${ringFocusColor}` 
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-950' : 'cursor-pointer'}`}
      >
        <div className="flex-1 truncate">
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              {selectedOption.icon && <span className="text-sm shrink-0">{selectedOption.icon}</span>}
              <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate hidden sm:inline">
                  ({selectedOption.sublabel})
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 font-medium">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-purple-600 dark:text-purple-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Input Header */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-400 dark:focus:ring-purple-500 font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-0.5 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between px-1 pt-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <span>{filteredOptions.length} of {options.length} cattle (पशु)</span>
              {search && <span className="font-semibold text-purple-600 dark:text-purple-400">Filtering active</span>}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1 divide-y divide-slate-50 dark:divide-slate-800/50">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                🔍 कोई पशु नहीं मिला (No cattle found matching "{search}")
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${getOptionClasses(isSelected)}`}
                  >
                    <div className="flex items-center gap-2 truncate flex-1">
                      {opt.icon && <span className="text-sm shrink-0">{opt.icon}</span>}
                      <div className="truncate">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-bold ${
                            isSelected 
                              ? 'text-inherit' 
                              : 'text-slate-900 dark:text-slate-100'
                          }`}>
                            {opt.label}
                          </span>
                          {opt.tag && opt.tag !== opt.label && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-mono">
                              {opt.tag}
                            </span>
                          )}
                        </div>
                        {opt.sublabel && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {opt.sublabel}
                          </div>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className={`w-4 h-4 shrink-0 ${checkColor}`} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
