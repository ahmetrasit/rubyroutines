'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { ConditionType, ConditionOperator } from '@/lib/types/prisma-enums';

export interface ConditionData {
  type: ConditionType;
  operator: ConditionOperator;
  value?: string;
  targetTaskId?: string;
  targetRoutineId?: string;
}

interface ConditionRowProps {
  condition: ConditionData;
  onChange: (condition: ConditionData) => void;
  onRemove: () => void;
  availableTasks?: Array<{ id: string; name: string }>;
  availableRoutines?: Array<{ id: string; name: string }>;
}

export function ConditionRow({
  condition,
  onChange,
  onRemove,
  availableTasks = [],
  availableRoutines = [],
}: ConditionRowProps) {
  const handleTypeChange = (type: ConditionType) => {
    onChange({
      type,
      operator: ConditionOperator.TASK_COMPLETED,
      value: undefined,
      targetTaskId: undefined,
      targetRoutineId: undefined,
    });
  };

  const handleOperatorChange = (operator: ConditionOperator) => {
    onChange({ ...condition, operator });
  };

  const handleValueChange = (value: string) => {
    onChange({ ...condition, value });
  };

  const handleTargetChange = (targetId: string) => {
    if (condition.type === ConditionType.TASK_COMPLETED || condition.type === ConditionType.TASK_COUNT) {
      onChange({ ...condition, targetTaskId: targetId });
    } else if (condition.type === ConditionType.ROUTINE_COMPLETED) {
      onChange({ ...condition, targetRoutineId: targetId });
    }
  };

  const renderValueInput = () => {
    switch (condition.type) {
      case ConditionType.TASK_COMPLETED:
        return (
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex-1"
            value={condition.targetTaskId || ''}
            onChange={(e) => handleTargetChange(e.target.value)}
          >
            <option value="">Select task...</option>
            {availableTasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.name}
              </option>
            ))}
          </select>
        );

      case ConditionType.ROUTINE_COMPLETED:
        return (
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex-1"
            value={condition.targetRoutineId || ''}
            onChange={(e) => handleTargetChange(e.target.value)}
          >
            <option value="">Select routine...</option>
            {availableRoutines.map((routine) => (
              <option key={routine.id} value={routine.id}>
                {routine.name}
              </option>
            ))}
          </select>
        );

      case ConditionType.TASK_COUNT:
        return (
          <div className="flex gap-2 flex-1">
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex-1"
              value={condition.targetTaskId || ''}
              onChange={(e) => handleTargetChange(e.target.value)}
            >
              <option value="">Select task...</option>
              {availableTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.name}
                </option>
              ))}
            </select>
            <Input
              type="number"
              min="0"
              placeholder="Count"
              value={condition.value || ''}
              onChange={(e) => handleValueChange(e.target.value)}
              className="w-24"
            />
          </div>
        );

      case ConditionType.DAY_OF_WEEK:
        return (
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex-1"
            value={condition.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
          >
            <option value="">Select day...</option>
            <option value="0">Sunday</option>
            <option value="1">Monday</option>
            <option value="2">Tuesday</option>
            <option value="3">Wednesday</option>
            <option value="4">Thursday</option>
            <option value="5">Friday</option>
            <option value="6">Saturday</option>
          </select>
        );

      case ConditionType.DATE_RANGE:
        return (
          <Input
            type="date"
            value={condition.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            className="flex-1"
          />
        );

      default:
        return (
          <Input
            type="text"
            placeholder="Value"
            value={condition.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            className="flex-1"
          />
        );
    }
  };

  const getOperatorOptions = () => {
    switch (condition.type) {
      case ConditionType.TASK_COMPLETED:
      case ConditionType.ROUTINE_COMPLETED:
      case ConditionType.DAY_OF_WEEK:
        return [{ value: ConditionOperator.EQUALS, label: 'is' }];
      case ConditionType.TASK_COUNT:
        return [
          { value: ConditionOperator.EQUALS, label: '=' },
          { value: ConditionOperator.GREATER_THAN, label: '>' },
          { value: ConditionOperator.LESS_THAN, label: '<' },
          { value: ConditionOperator.GREATER_THAN_OR_EQUAL, label: '>=' },
          { value: ConditionOperator.LESS_THAN_OR_EQUAL, label: '<=' },
        ];
      default:
        return [
          { value: ConditionOperator.EQUALS, label: '=' },
          { value: ConditionOperator.GREATER_THAN, label: '>' },
          { value: ConditionOperator.LESS_THAN, label: '<' },
        ];
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <select
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm w-48"
        value={condition.type}
        onChange={(e) => handleTypeChange(e.target.value as ConditionType)}
      >
        <option value={ConditionType.TASK_COMPLETED}>Task Completed</option>
        <option value={ConditionType.ROUTINE_COMPLETED}>Routine Completed</option>
        <option value={ConditionType.TASK_COUNT}>Task Count</option>
        <option value={ConditionType.DAY_OF_WEEK}>Day of Week</option>
        <option value={ConditionType.DATE_RANGE}>Date</option>
      </select>

      <select
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm w-20"
        value={condition.operator}
        onChange={(e) => handleOperatorChange(e.target.value as ConditionOperator)}
      >
        {getOperatorOptions().map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {renderValueInput()}

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onRemove}
        className="h-10 w-10 p-0 flex-shrink-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
