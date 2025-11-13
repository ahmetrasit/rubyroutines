'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Info } from 'lucide-react';
import { ConditionRow, ConditionData } from './condition-row';
import { ConditionType, ConditionOperator } from '@/lib/types/prisma-enums';

interface ConditionBuilderProps {
  conditions: ConditionData[];
  onChange: (conditions: ConditionData[]) => void;
  availableTasks?: Array<{ id: string; name: string }>;
  availableRoutines?: Array<{ id: string; name: string }>;
}

export function ConditionBuilder({
  conditions,
  onChange,
  availableTasks = [],
  availableRoutines = [],
}: ConditionBuilderProps) {
  const [localConditions, setLocalConditions] = useState<ConditionData[]>(conditions);

  useEffect(() => {
    setLocalConditions(conditions);
  }, [conditions]);

  const handleAddCondition = () => {
    const newCondition: ConditionData = {
      type: ConditionType.TASK_COMPLETED,
      operator: ConditionOperator.EQUALS,
    };
    const updated = [...localConditions, newCondition];
    setLocalConditions(updated);
    onChange(updated);
  };

  const handleUpdateCondition = (index: number, condition: ConditionData) => {
    const updated = [...localConditions];
    updated[index] = condition;
    setLocalConditions(updated);
    onChange(updated);
  };

  const handleRemoveCondition = (index: number) => {
    const updated = localConditions.filter((_, i) => i !== index);
    setLocalConditions(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Visibility Conditions</h3>
          <p className="text-xs text-gray-500 mt-1">
            This routine will only show when ALL conditions are met
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAddCondition}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Condition
        </Button>
      </div>

      {localConditions.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
          <Info className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 mb-2">No conditions set</p>
          <p className="text-xs text-gray-400 mb-4">
            Add conditions to control when this routine appears
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAddCondition}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Condition
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {localConditions.map((condition, index) => (
            <div key={index}>
              {index > 0 && (
                <div className="flex items-center justify-center py-1">
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    AND
                  </span>
                </div>
              )}
              <ConditionRow
                condition={condition}
                onChange={(updated) => handleUpdateCondition(index, updated)}
                onRemove={() => handleRemoveCondition(index)}
                availableTasks={availableTasks}
                availableRoutines={availableRoutines}
              />
            </div>
          ))}
        </div>
      )}

      {localConditions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> All conditions must be true for the routine to be visible.
            If any condition is false, the routine will be hidden.
          </p>
        </div>
      )}
    </div>
  );
}
