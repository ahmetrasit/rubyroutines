/**
 * Reusable hook for managing picker state (emoji, color, etc.)
 * Handles show/hide logic and click-outside behavior
 */

import { useState, useEffect, useRef } from 'react';

export type PickerType = 'emoji' | 'color' | 'icon';

export function usePickerState() {
  const [activePicker, setActivePicker] = useState<PickerType | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activePicker) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setActivePicker(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activePicker]);

  const togglePicker = (type: PickerType) => {
    setActivePicker(current => current === type ? null : type);
  };

  const closePicker = () => {
    setActivePicker(null);
  };

  const isPickerOpen = (type: PickerType) => {
    return activePicker === type;
  };

  return {
    activePicker,
    pickerRef,
    togglePicker,
    closePicker,
    isPickerOpen,
  };
}
