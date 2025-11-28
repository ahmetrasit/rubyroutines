'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Loader2, Sparkles, Target, Check, ChevronRight } from 'lucide-react';
import { ResetPeriod, GoalType, GoalScope, GoalCategory } from '@/lib/types/prisma-enums';
import { goalTemplates, getTemplatesByAudience, type GoalTemplate } from '@/lib/constants/goal-templates';

interface GoalFormWithTemplatesProps {
  roleId: string;
  roleType: 'PARENT' | 'TEACHER';
  goal?: any;
  personId?: string;
  onClose: () => void;
}

export function GoalFormWithTemplates({ roleId, roleType, goal, personId, onClose }: GoalFormWithTemplatesProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'custom'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<GoalCategory | 'ALL'>('ALL');

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('');
  const [period, setPeriod] = useState<ResetPeriod>(ResetPeriod.WEEKLY);
  const [type, setType] = useState<GoalType>(GoalType.COMPLETION_COUNT);
  const [category, setCategory] = useState<GoalCategory>(GoalCategory.CUSTOM);
  const [scope, setScope] = useState<GoalScope>(GoalScope.INDIVIDUAL);
  const [unit, setUnit] = useState('');
  const [streakEnabled, setStreakEnabled] = useState(false);
  const [resetDay, setResetDay] = useState<number | undefined>();
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('');
  const [rewardMessage, setRewardMessage] = useState('');

  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Get templates for this role type
  const availableTemplates = getTemplatesByAudience(roleType);
  const filteredTemplates = categoryFilter === 'ALL'
    ? availableTemplates
    : availableTemplates.filter(t => t.category === categoryFilter);

  useEffect(() => {
    if (goal) {
      setActiveTab('custom');
      setName(goal.name || '');
      setDescription(goal.description || '');
      setTarget(goal.target?.toString() || '');
      setPeriod(goal.period || ResetPeriod.WEEKLY);
      setType(goal.type || 'COMPLETION_COUNT');
      setCategory(goal.category || 'CUSTOM');
      setScope(goal.scope || 'INDIVIDUAL');
      setUnit(goal.unit || '');
      setStreakEnabled(goal.streakEnabled || false);
      setResetDay(goal.resetDay);
      setIcon(goal.icon || '');
      setColor(goal.color || '');
      setRewardMessage(goal.rewardMessage || '');
    }
  }, [goal]);

  const applyTemplate = (template: GoalTemplate) => {
    setSelectedTemplate(template);
    setName(template.name);
    setDescription(template.description);
    setTarget(template.defaultTarget.toString());
    setPeriod(template.defaultPeriod as any);
    setType(template.type as any);
    setCategory(template.category as any);
    setScope(template.scope as any);
    setUnit(template.defaultUnit || '');
    setStreakEnabled(template.streakEnabled || false);
    setIcon(template.icon || '');
    setColor(template.color || '');
    setRewardMessage(template.rewardMessage || '');
    setActiveTab('custom');
  };

  const createMutation = trpc.goal.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Goal created successfully',
        variant: 'success',
      });
      utils.goal.list.invalidate();
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = trpc.goal.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Goal updated successfully',
        variant: 'success',
      });
      utils.goal.list.invalidate();
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a goal name',
        variant: 'destructive',
      });
      return;
    }

    if (!target || parseFloat(target) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid target value',
        variant: 'destructive',
      });
      return;
    }

    const data = {
      name: name.trim(),
      roleId,
      description: description.trim() || undefined,
      target: parseFloat(target),
      period,
      type,
      category,
      scope,
      unit: unit || undefined,
      streakEnabled,
      resetDay,
      icon: icon || undefined,
      color: color || undefined,
      rewardMessage: rewardMessage || undefined,
      personIds: personId ? [personId] : [],
    };

    if (goal) {
      updateMutation.mutate({ id: goal.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      EDUCATION: 'bg-blue-100 text-blue-800',
      HEALTH: 'bg-green-100 text-green-800',
      CHORES: 'bg-orange-100 text-orange-800',
      BEHAVIOR: 'bg-purple-100 text-purple-800',
      SOCIAL: 'bg-pink-100 text-pink-800',
      CREATIVE: 'bg-yellow-100 text-yellow-800',
      CUSTOM: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{goal ? 'Edit Goal' : 'Create Goal'}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'templates' | 'custom')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates" disabled={!!goal}>
              <Sparkles className="h-4 w-4 mr-2" />
              Start with Template
            </TabsTrigger>
            <TabsTrigger value="custom">
              <Target className="h-4 w-4 mr-2" />
              Custom Goal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label>Filter by category:</Label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as GoalCategory | 'ALL')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="ALL">All Categories</option>
                  <option value="EDUCATION">Education</option>
                  <option value="HEALTH">Health</option>
                  <option value="CHORES">Chores</option>
                  <option value="BEHAVIOR">Behavior</option>
                  <option value="SOCIAL">Social</option>
                  <option value="CREATIVE">Creative</option>
                </select>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-1 gap-3 pr-4">
                  {filteredTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => applyTemplate(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{template.icon}</span>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                          </div>
                          {selectedTemplate?.id === template.id && (
                            <Check className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="mb-3">{template.description}</CardDescription>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={getCategoryBadgeColor(template.category)}>
                            {template.category}
                          </Badge>
                          <Badge variant="outline">{template.type}</Badge>
                          <Badge variant="outline">
                            {template.defaultTarget} {template.defaultUnit} / {template.defaultPeriod}
                          </Badge>
                          {template.ageGroup && (
                            <Badge variant="outline">Ages {template.ageGroup}</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              {selectedTemplate && (
                <Button
                  className="w-full"
                  onClick={() => setActiveTab('custom')}
                >
                  Customize Template
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="mt-4">
            <form onSubmit={handleSubmit}>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {selectedTemplate && (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-800">
                          Based on template: <strong>{selectedTemplate.name}</strong>
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Goal Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Complete 50 tasks this week"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Optional description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={isPending}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Goal Type *</Label>
                      <select
                        id="type"
                        value={type}
                        onChange={(e) => setType(e.target.value as GoalType)}
                        disabled={isPending}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="COMPLETION_COUNT">Completion Count</option>
                        <option value="STREAK">Streak</option>
                        <option value="TIME_BASED">Time Based</option>
                        <option value="PERCENTAGE">Percentage</option>
                        <option value="VALUE_BASED">Value Based</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as GoalCategory)}
                        disabled={isPending}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="CUSTOM">Custom</option>
                        <option value="EDUCATION">Education</option>
                        <option value="HEALTH">Health</option>
                        <option value="CHORES">Chores</option>
                        <option value="BEHAVIOR">Behavior</option>
                        <option value="SOCIAL">Social</option>
                        <option value="CREATIVE">Creative</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="target">Target *</Label>
                      <Input
                        id="target"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="e.g., 50"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        disabled={isPending}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Input
                        id="unit"
                        placeholder="e.g., tasks"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        disabled={isPending}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="period">Period *</Label>
                      <select
                        id="period"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value as ResetPeriod)}
                        disabled={isPending}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value={ResetPeriod.DAILY}>Daily</option>
                        <option value={ResetPeriod.WEEKLY}>Weekly</option>
                        <option value={ResetPeriod.MONTHLY}>Monthly</option>
                      </select>
                    </div>
                  </div>

                  {period === ResetPeriod.WEEKLY && (
                    <div className="space-y-2">
                      <Label htmlFor="resetDay">Reset Day</Label>
                      <select
                        id="resetDay"
                        value={resetDay?.toString() || '0'}
                        onChange={(e) => setResetDay(parseInt(e.target.value))}
                        disabled={isPending}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="0">Sunday</option>
                        <option value="1">Monday</option>
                        <option value="2">Tuesday</option>
                        <option value="3">Wednesday</option>
                        <option value="4">Thursday</option>
                        <option value="5">Friday</option>
                        <option value="6">Saturday</option>
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scope">Scope</Label>
                      <select
                        id="scope"
                        value={scope}
                        onChange={(e) => setScope(e.target.value as GoalScope)}
                        disabled={isPending}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="INDIVIDUAL">Individual</option>
                        <option value="GROUP">Group</option>
                        <option value="ROLE">Entire Role</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="streakEnabled">
                        <input
                          type="checkbox"
                          id="streakEnabled"
                          checked={streakEnabled}
                          onChange={(e) => setStreakEnabled(e.target.checked)}
                          disabled={isPending}
                          className="mr-2"
                        />
                        Enable Streak Tracking
                      </Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="icon">Icon (emoji)</Label>
                      <Input
                        id="icon"
                        placeholder="e.g., 🎯"
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        disabled={isPending}
                        maxLength={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color">Color (hex)</Label>
                      <Input
                        id="color"
                        type="color"
                        value={color || '#4ECDC4'}
                        onChange={(e) => setColor(e.target.value)}
                        disabled={isPending}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rewardMessage">Reward Message</Label>
                    <Input
                      id="rewardMessage"
                      placeholder="Celebration message when goal is achieved"
                      value={rewardMessage}
                      onChange={(e) => setRewardMessage(e.target.value)}
                      disabled={isPending}
                    />
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {goal ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    goal ? 'Update Goal' : 'Create Goal'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}