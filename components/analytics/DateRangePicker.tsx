'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';

interface DateRange {
  startDate: Date;
  endDate: Date;
  days: number;
}

interface DateRangePickerProps {
  onChange: (range: DateRange) => void;
  initialDays?: number;
}

const PRESET_RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

export function DateRangePicker({ onChange, initialDays = 30 }: DateRangePickerProps) {
  const [selectedDays, setSelectedDays] = useState(initialDays);
  const [customMode, setCustomMode] = useState(false);
  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), initialDays), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handlePresetClick = (days: number) => {
    setSelectedDays(days);
    setCustomMode(false);
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(end, days));
    onChange({ startDate: start, endDate: end, days });
  };

  const handleCustomApply = () => {
    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    onChange({ startDate: start, endDate: end, days: diffDays });
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {PRESET_RANGES.map((preset) => (
            <Button
              key={preset.days}
              size="sm"
              variant={selectedDays === preset.days && !customMode ? 'default' : 'outline'}
              onClick={() => handlePresetClick(preset.days)}
            >
              {preset.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant={customMode ? 'default' : 'outline'}
            onClick={() => setCustomMode(true)}
          >
            Custom Range
          </Button>
        </div>

        {customMode && (
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate}
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <Button onClick={handleCustomApply}>Apply</Button>
          </div>
        )}
      </div>
    </Card>
  );
}
