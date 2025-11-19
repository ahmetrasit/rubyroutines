'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Loader2, Users, Target, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { goalTemplates, getTemplatesByAudience } from '@/lib/constants/goal-templates';
import { GoalScope } from '@/lib/types/prisma-enums';

interface AssignGoalToClassProps {
  roleId: string;
  persons: Array<{ id: string; name: string; status: string }>;
  onClose: () => void;
}

export function AssignGoalToClass({ roleId, persons, onClose }: AssignGoalToClassProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [scope, setScope] = useState<GoalScope>('GROUP');
  const [customTargets, setCustomTargets] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Get teacher templates
  const teacherTemplates = getTemplatesByAudience('TEACHER');
  const activePersons = persons.filter(p => p.status === 'ACTIVE');

  // Create goal mutation
  const createGoalMutation = trpc.goal.batchCreate.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: scope === 'GROUP'
          ? 'Classroom goal created successfully'
          : `Goals assigned to ${selectedPersonIds.length} students`,
        variant: 'success'
      });
      utils.goal.list.invalidate();
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedPersonIds(activePersons.map(p => p.id));
    } else {
      setSelectedPersonIds([]);
    }
  };

  const handlePersonToggle = (personId: string, checked: boolean) => {
    if (checked) {
      setSelectedPersonIds([...selectedPersonIds, personId]);
    } else {
      setSelectedPersonIds(selectedPersonIds.filter(id => id !== personId));
    }
  };

  const handleCustomTargetChange = (personId: string, value: string) => {
    setCustomTargets({
      ...customTargets,
      [personId]: value
    });
  };

  const handleSubmit = () => {
    if (!selectedTemplate) {
      toast({
        title: 'Error',
        description: 'Please select a goal template',
        variant: 'destructive'
      });
      return;
    }

    if (scope === 'INDIVIDUAL' && selectedPersonIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one student',
        variant: 'destructive'
      });
      return;
    }

    const template = goalTemplates.find(t => t.id === selectedTemplate);
    if (!template) return;

    if (scope === 'GROUP' || scope === 'ROLE') {
      // Create single goal for entire class
      createGoalMutation.mutate({
        roleId,
        goals: [{
          name: template.name,
          description: template.description,
          type: template.type,
          category: template.category,
          target: template.defaultTarget,
          period: template.defaultPeriod,
          unit: template.defaultUnit,
          scope,
          streakEnabled: template.streakEnabled,
          icon: template.icon,
          color: template.color,
          rewardMessage: template.rewardMessage,
          personIds: scope === 'GROUP' ? selectedPersonIds : [],
          groupIds: []
        }]
      });
    } else {
      // Create individual goals for each selected student
      const goals = selectedPersonIds.map(personId => ({
        name: template.name,
        description: template.description,
        type: template.type,
        category: template.category,
        target: customTargets[personId] ? parseFloat(customTargets[personId]) : template.defaultTarget,
        period: template.defaultPeriod,
        unit: template.defaultUnit,
        scope: 'INDIVIDUAL' as GoalScope,
        streakEnabled: template.streakEnabled,
        icon: template.icon,
        color: template.color,
        rewardMessage: template.rewardMessage,
        personIds: [personId],
        groupIds: []
      }));

      createGoalMutation.mutate({ roleId, goals });
    }
  };

  const selectedTemplateData = goalTemplates.find(t => t.id === selectedTemplate);
  const isPending = createGoalMutation.isPending;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Assign Goal to Classroom</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {/* Step 1: Select Template */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                1. Select Goal Template
              </Label>
              <div className="grid grid-cols-1 gap-2">
                {teacherTemplates.map(template => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-colors ${
                      selectedTemplate === template.id
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{template.icon}</span>
                          <CardTitle className="text-sm">{template.name}</CardTitle>
                        </div>
                        {selectedTemplate === template.id && (
                          <CheckCircle2 className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-xs">
                        {template.description}
                      </CardDescription>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {template.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {template.defaultTarget} {template.defaultUnit}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Step 2: Select Scope */}
            {selectedTemplate && (
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  2. Assignment Type
                </Label>
                <Select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as GoalScope)}
                >
                  <option value="GROUP">Group Goal (students work together)</option>
                  <option value="INDIVIDUAL">Individual Goals (each student separately)</option>
                  <option value="ROLE">Entire Class (all students contribute)</option>
                </Select>

                <Alert className="mt-3">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {scope === 'GROUP' && 'Students will work together toward a shared goal'}
                    {scope === 'INDIVIDUAL' && 'Each student will have their own copy of this goal'}
                    {scope === 'ROLE' && 'All students in the class will contribute to this goal'}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Step 3: Select Students (for GROUP and INDIVIDUAL) */}
            {selectedTemplate && scope !== 'ROLE' && (
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  3. Select Students
                </Label>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <Checkbox
                      id="select-all"
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                    <label
                      htmlFor="select-all"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Select All Students ({activePersons.length})
                    </label>
                  </div>

                  {activePersons.map(person => (
                    <div key={person.id} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={person.id}
                          checked={selectedPersonIds.includes(person.id)}
                          onCheckedChange={(checked) => handlePersonToggle(person.id, checked as boolean)}
                        />
                        <label
                          htmlFor={person.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {person.name}
                        </label>
                      </div>

                      {scope === 'INDIVIDUAL' && selectedPersonIds.includes(person.id) && (
                        <div className="ml-6 flex items-center gap-2">
                          <Label className="text-xs">Custom target:</Label>
                          <Input
                            type="number"
                            className="w-20 h-7 text-xs"
                            placeholder={selectedTemplateData?.defaultTarget.toString()}
                            value={customTargets[person.id] || ''}
                            onChange={(e) => handleCustomTargetChange(person.id, e.target.value)}
                          />
                          <span className="text-xs text-gray-500">
                            {selectedTemplateData?.defaultUnit}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {selectedTemplate && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Summary</h4>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-gray-600">Goal:</span>{' '}
                    <span className="font-medium">{selectedTemplateData?.name}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Type:</span>{' '}
                    <Badge variant="outline" className="text-xs">
                      {scope === 'GROUP' ? 'Group Goal' : scope === 'INDIVIDUAL' ? 'Individual Goals' : 'Class Goal'}
                    </Badge>
                  </p>
                  {scope !== 'ROLE' && (
                    <p>
                      <span className="text-gray-600">Students:</span>{' '}
                      <span className="font-medium">
                        {selectedPersonIds.length} selected
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !selectedTemplate || (scope !== 'ROLE' && selectedPersonIds.length === 0)}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Assign Goal
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}