'use client';

import { useState } from 'react';
import { ConditionLogic, ConditionOperator } from '@/lib/types/prisma-enums';
import { Plus, X, AlertCircle } from 'lucide-react';

interface ConditionCheck {
  id?: string;
  negate: boolean;
  operator: ConditionOperator;
  value?: string;
  targetTaskId?: string;
  targetRoutineId?: string;
  targetGoalId?: string;
}

interface ConditionBuilderProps {
  routineId: string;
  controlsRoutine?: boolean;
  initialLogic?: ConditionLogic;
  initialChecks?: ConditionCheck[];
  availableTasks?: Array<{ id: string; name: string }>;
  availableRoutines?: Array<{ id: string; name: string }>;
  availableGoals?: Array<{ id: string; name: string }>;
  onChange: (logic: ConditionLogic, checks: ConditionCheck[]) => void;
}

export function ConditionBuilder({
  routineId,
  controlsRoutine = false,
  initialLogic = ConditionLogic.AND,
  initialChecks = [],
  availableTasks = [],
  availableRoutines = [],
  availableGoals = [],
  onChange,
}: ConditionBuilderProps) {
  const [logic, setLogic] = useState<ConditionLogic>(initialLogic);
  const [checks, setChecks] = useState<ConditionCheck[]>(
    initialChecks.length > 0 ? initialChecks : [createEmptyCheck()]
  );

  function createEmptyCheck(): ConditionCheck {
    return {
      negate: false,
      operator: ConditionOperator.TASK_COMPLETED,
      value: '',
      targetTaskId: undefined,
      targetRoutineId: undefined,
      targetGoalId: undefined,
    };
  }

  function handleLogicChange(newLogic: ConditionLogic) {
    setLogic(newLogic);
    onChange(newLogic, checks);
  }

  function handleCheckChange(index: number, updates: Partial<ConditionCheck>) {
    const newChecks = [...checks];
    newChecks[index] = { ...newChecks[index], ...updates } as ConditionCheck;
    setChecks(newChecks);
    onChange(logic, newChecks);
  }

  function handleAddCheck() {
    const newChecks = [...checks, createEmptyCheck()];
    setChecks(newChecks);
    onChange(logic, newChecks);
  }

  function handleRemoveCheck(index: number) {
    const newChecks = checks.filter((_, i) => i !== index);
    setChecks(newChecks);
    onChange(logic, newChecks);
  }

  const operatorOptions = getOperatorOptions();
  const targetTypeOptions = [
    { value: 'task', label: 'Task' },
    { value: 'routine', label: 'Routine' },
    { value: 'goal', label: 'Goal' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          {controlsRoutine ? 'When to show this routine' : 'When to show task'}
        </h3>
      </div>

      {/* Logic selector - only show if multiple checks */}
      {checks.length > 1 && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <label className="text-sm font-medium text-gray-700 block mb-2">
            All conditions must match:
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => handleLogicChange(ConditionLogic.AND)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                logic === ConditionLogic.AND
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              ALL (AND)
            </button>
            <button
              onClick={() => handleLogicChange(ConditionLogic.OR)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                logic === ConditionLogic.OR
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              ANY (OR)
            </button>
          </div>
        </div>
      )}

      {/* Condition checks */}
      <div className="space-y-3">
        {checks.map((check, index) => (
          <ConditionCheckItem
            key={index}
            check={check}
            index={index}
            showRemove={checks.length > 1}
            availableTasks={availableTasks}
            availableRoutines={availableRoutines}
            availableGoals={availableGoals}
            operatorOptions={operatorOptions}
            targetTypeOptions={targetTypeOptions}
            onChange={(updates) => handleCheckChange(index, updates)}
            onRemove={() => handleRemoveCheck(index)}
          />
        ))}
      </div>

      {/* Add check button */}
      <button
        onClick={handleAddCheck}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 font-medium flex items-center justify-center gap-2 hover:border-blue-500 hover:text-blue-500 transition-colors"
      >
        <Plus size={20} />
        Add Condition
      </button>

      {/* Helper text */}
      <div className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
        <p>
          {controlsRoutine
            ? 'This routine will only appear when these conditions are met.'
            : 'Smart tasks will only appear when their conditions are met.'}
        </p>
      </div>
    </div>
  );
}

interface ConditionCheckItemProps {
  check: ConditionCheck;
  index: number;
  showRemove: boolean;
  availableTasks: Array<{ id: string; name: string }>;
  availableRoutines: Array<{ id: string; name: string }>;
  availableGoals: Array<{ id: string; name: string }>;
  operatorOptions: Array<{ value: ConditionOperator; label: string; needsValue: boolean }>;
  targetTypeOptions: Array<{ value: string; label: string }>;
  onChange: (updates: Partial<ConditionCheck>) => void;
  onRemove: () => void;
}

function ConditionCheckItem({
  check,
  index,
  showRemove,
  availableTasks,
  availableRoutines,
  availableGoals,
  operatorOptions,
  targetTypeOptions,
  onChange,
  onRemove,
}: ConditionCheckItemProps) {
  // Determine current target type
  const currentTargetType = check.targetTaskId
    ? 'task'
    : check.targetRoutineId
    ? 'routine'
    : check.targetGoalId
    ? 'goal'
    : '';

  function handleTargetTypeChange(type: string) {
    onChange({
      targetTaskId: undefined,
      targetRoutineId: undefined,
      targetGoalId: undefined,
    });
  }

  function handleTargetChange(targetId: string) {
    if (currentTargetType === 'task') {
      onChange({ targetTaskId: targetId });
    } else if (currentTargetType === 'routine') {
      onChange({ targetRoutineId: targetId });
    } else if (currentTargetType === 'goal') {
      onChange({ targetGoalId: targetId });
    }
  }

  const currentOperator = operatorOptions.find((op) => op.value === check.operator);
  const needsValue = currentOperator?.needsValue || false;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      {/* Header with remove button */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">Condition {index + 1}</span>
        {showRemove && (
          <button
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 transition-colors"
            aria-label="Remove condition"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Negate toggle */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={check.negate}
          onChange={(e) => onChange({ negate: e.target.checked })}
          className="w-4 h-4 text-blue-500 rounded"
        />
        <span className="text-sm text-gray-700">Invert (NOT)</span>
      </label>

      {/* Target type selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Check</label>
        <select
          value={currentTargetType}
          onChange={(e) => handleTargetTypeChange(e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select type...</option>
          {targetTypeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Target selector */}
      {currentTargetType && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {currentTargetType === 'task' && 'Task'}
            {currentTargetType === 'routine' && 'Routine'}
            {currentTargetType === 'goal' && 'Goal'}
          </label>
          <select
            value={check.targetTaskId || check.targetRoutineId || check.targetGoalId || ''}
            onChange={(e) => handleTargetChange(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select...</option>
            {currentTargetType === 'task' &&
              availableTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.name}
                </option>
              ))}
            {currentTargetType === 'routine' &&
              availableRoutines.map((routine) => (
                <option key={routine.id} value={routine.id}>
                  {routine.name}
                </option>
              ))}
            {currentTargetType === 'goal' &&
              availableGoals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name}
                </option>
              ))}
          </select>
        </div>
      )}

      {/* Operator selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
        <select
          value={check.operator}
          onChange={(e) => onChange({ operator: e.target.value as ConditionOperator })}
          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {operatorOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Value input (if needed) */}
      {needsValue && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
          <input
            type="number"
            value={check.value || ''}
            onChange={(e) => onChange({ value: e.target.value })}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter value..."
          />
        </div>
      )}
    </div>
  );
}

/**
 * Get operator options with labels
 */
function getOperatorOptions() {
  return [
    { value: ConditionOperator.TASK_COMPLETED, label: 'is completed', needsValue: false },
    { value: ConditionOperator.TASK_NOT_COMPLETED, label: 'is not completed', needsValue: false },
    { value: ConditionOperator.TASK_COUNT_EQUALS, label: 'completed exactly', needsValue: true },
    { value: ConditionOperator.TASK_COUNT_GT, label: 'completed more than', needsValue: true },
    { value: ConditionOperator.TASK_COUNT_LT, label: 'completed less than', needsValue: true },
    { value: ConditionOperator.TASK_VALUE_EQUALS, label: 'value equals', needsValue: true },
    { value: ConditionOperator.TASK_VALUE_GT, label: 'value greater than', needsValue: true },
    { value: ConditionOperator.TASK_VALUE_LT, label: 'value less than', needsValue: true },
    { value: ConditionOperator.ROUTINE_PERCENT_EQUALS, label: 'routine % equals', needsValue: true },
    { value: ConditionOperator.ROUTINE_PERCENT_GT, label: 'routine % greater than', needsValue: true },
    { value: ConditionOperator.ROUTINE_PERCENT_LT, label: 'routine % less than', needsValue: true },
    { value: ConditionOperator.GOAL_ACHIEVED, label: 'goal is achieved', needsValue: false },
    { value: ConditionOperator.GOAL_NOT_ACHIEVED, label: 'goal not achieved', needsValue: false },
  ];
}
