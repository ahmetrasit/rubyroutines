'use client';

import { HexColorPicker } from 'react-colorful';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onClose?: () => void;
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#64748b', // slate
  '#6b7280', // gray
];

export function ColorPicker({ color, onChange, onClose }: ColorPickerProps) {
  const handlePresetClick = (presetColor: string) => {
    onChange(presetColor);
    onClose?.();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border p-3 w-[240px]">
      <HexColorPicker color={color} onChange={onChange} style={{ width: '100%' }} />

      <div className="mt-3 pt-3 border-t">
        <div className="text-xs font-medium text-gray-700 mb-2">Presets</div>
        <div className="grid grid-cols-9 gap-2">
          {PRESET_COLORS.map((presetColor) => (
            <button
              key={presetColor}
              type="button"
              onClick={() => handlePresetClick(presetColor)}
              className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                color.toLowerCase() === presetColor.toLowerCase()
                  ? 'border-gray-900 scale-110'
                  : 'border-gray-300'
              }`}
              style={{ backgroundColor: presetColor }}
              title={presetColor}
            />
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1 text-xs border rounded"
          placeholder="#000000"
        />
        <div
          className="w-8 h-8 rounded border-2 border-gray-300"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}
