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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toast';
import { Loader2, Zap, Settings, Check, ChevronRight, Info, Clock, Calendar, Trophy, Layers, Target } from 'lucide-react';
import { ConditionLogic, ConditionOperator } from '@/lib/types/prisma-enums';
import { conditionRecipes, getRecipesByAudience, applyRecipeValues, type ConditionRecipe } from '@/lib/constants/condition-recipes';

interface ConditionFormWithRecipesProps {
  routineId: string;
  roleType: 'PARENT' | 'TEACHER';
  condition?: any;
  onClose: () => void;
}

export function ConditionFormWithRecipes({ routineId, roleType, condition, onClose }: ConditionFormWithRecipesProps) {
  const [activeTab, setActiveTab] = useState<'recipes' | 'custom'>('recipes');
  const [selectedRecipe, setSelectedRecipe] = useState<ConditionRecipe | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logic, setLogic] = useState<ConditionLogic>(ConditionLogic.AND);
  const [controlsRoutine, setControlsRoutine] = useState(true);
  const [checks, setChecks] = useState<any[]>([]);

  // Custom values for recipe placeholders
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Get recipes for this role type
  const availableRecipes = getRecipesByAudience(roleType);
  const filteredRecipes = categoryFilter === 'ALL'
    ? availableRecipes
    : availableRecipes.filter(r => r.category === categoryFilter);

  // Get tasks and routines for selection when needed
  const { data: tasks } = trpc.task.list.useQuery({ routineId }, {
    enabled: selectedRecipe?.checks.some(c => c.operator === ConditionOperator.TASK_COMPLETED)
  });

  const { data: routines } = trpc.routine.list.useQuery({}, {
    enabled: selectedRecipe?.checks.some(c =>
      (c.operator as string) === 'ROUTINE_COMPLETED' || c.operator === ConditionOperator.ROUTINE_PERCENT_GT
    )
  });

  // Note: goals query disabled - requires roleId which this component doesn't have access to
  // const { data: goals } = trpc.goal.list.useQuery({ roleId: '' }, {...});
  const goals: any[] = [];

  useEffect(() => {
    if (condition) {
      setActiveTab('custom');
      setName(condition.name || '');
      setDescription(condition.description || '');
      setLogic(condition.logic || 'AND');
      setControlsRoutine(condition.controlsRoutine ?? true);
      setChecks(condition.checks || []);
    }
  }, [condition]);

  const applyRecipe = (recipe: ConditionRecipe) => {
    setSelectedRecipe(recipe);
    setName(recipe.name);
    setDescription(recipe.description);
    setLogic(recipe.logic as ConditionLogic);

    // Check if recipe has placeholders that need custom values
    const hasPlaceholders = recipe.checks.some(check =>
      check.value?.startsWith('PLACEHOLDER_')
    );

    if (!hasPlaceholders) {
      // Apply recipe directly
      setChecks(recipe.checks);
      setActiveTab('custom');
    }
  };

  const handlePlaceholderSubmit = () => {
    if (!selectedRecipe) return;

    const appliedRecipe = applyRecipeValues(selectedRecipe, customValues);
    setChecks(appliedRecipe.checks);
    setActiveTab('custom');
  };

  const createMutation = trpc.condition.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Condition created successfully',
        variant: 'success',
      });
      utils.condition.list.invalidate();
      utils.routine.getById.invalidate();
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

  const updateMutation = trpc.condition.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Condition updated successfully',
        variant: 'success',
      });
      utils.condition.list.invalidate();
      utils.routine.getById.invalidate();
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

    if (checks.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one condition check',
        variant: 'destructive',
      });
      return;
    }

    const data = {
      routineId,
      name: name.trim() || undefined,
      description: description.trim() || undefined,
      logic,
      controlsRoutine,
      checks,
    };

    if (condition) {
      updateMutation.mutate({ id: condition.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      TIME_BASED: Clock,
      SEQUENCE: Layers,
      ACHIEVEMENT: Trophy,
      CONTEXT: Settings,
      TASK_BASED: Target,
    };
    const Icon = icons[category] || Settings;
    return <Icon className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      TIME_BASED: 'bg-blue-100 text-blue-800',
      SEQUENCE: 'bg-purple-100 text-purple-800',
      ACHIEVEMENT: 'bg-green-100 text-green-800',
      CONTEXT: 'bg-orange-100 text-orange-800',
      TASK_BASED: 'bg-pink-100 text-pink-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const renderPlaceholderFields = () => {
    if (!selectedRecipe) return null;

    const placeholderChecks = selectedRecipe.checks.filter(check =>
      check.value?.startsWith('PLACEHOLDER_')
    );

    if (placeholderChecks.length === 0) return null;

    return (
      <div className="space-y-4 mt-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This recipe needs some additional information to work with your routine.
          </AlertDescription>
        </Alert>

        {placeholderChecks.map((check, index) => {
          const placeholderType = check.value?.replace('PLACEHOLDER_', '').toLowerCase();

          if (placeholderType === 'task_id' && tasks) {
            return (
              <div key={index} className="space-y-2">
                <Label>Select Task</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={customValues.task_id || ''}
                  onChange={(e) => setCustomValues({ ...customValues, task_id: e.target.value })}
                >
                  <option value="">Choose a task...</option>
                  {tasks.map((task: any) => (
                    <option key={task.id} value={task.id}>
                      {task.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          if (placeholderType === 'routine_id' && routines) {
            return (
              <div key={index} className="space-y-2">
                <Label>Select Routine</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={customValues.routine_id || ''}
                  onChange={(e) => setCustomValues({ ...customValues, routine_id: e.target.value })}
                >
                  <option value="">Choose a routine...</option>
                  {routines.map((routine: any) => (
                    <option key={routine.id} value={routine.id}>
                      {routine.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          if (placeholderType === 'goal_id' && goals) {
            return (
              <div key={index} className="space-y-2">
                <Label>Select Goal</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={customValues.goal_id || ''}
                  onChange={(e) => setCustomValues({ ...customValues, goal_id: e.target.value })}
                >
                  <option value="">Choose a goal...</option>
                  {goals.map((goal: any) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          return null;
        })}

        <Button
          className="w-full"
          onClick={handlePlaceholderSubmit}
          disabled={Object.keys(customValues).length === 0}
        >
          Apply Recipe
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{condition ? 'Edit Condition' : 'Create Condition'}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'recipes' | 'custom')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recipes" disabled={!!condition}>
              <Zap className="h-4 w-4 mr-2" />
              Use Recipe
            </TabsTrigger>
            <TabsTrigger value="custom">
              <Settings className="h-4 w-4 mr-2" />
              Custom Condition
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recipes" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label>Filter by type:</Label>
                <select
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="ALL">All Types</option>
                  <option value="TIME_BASED">Time-Based</option>
                  <option value="TASK_BASED">Task-Based</option>
                  <option value="SEQUENCE">Sequence</option>
                  <option value="ACHIEVEMENT">Achievement</option>
                  <option value="CONTEXT">Context</option>
                </select>
              </div>

              <ScrollArea className="h-[350px]">
                <div className="grid grid-cols-1 gap-3 pr-4">
                  {filteredRecipes.map((recipe) => (
                    <Card
                      key={recipe.id}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedRecipe?.id === recipe.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => applyRecipe(recipe)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{recipe.icon}</span>
                            <CardTitle className="text-base">{recipe.name}</CardTitle>
                          </div>
                          {selectedRecipe?.id === recipe.id && (
                            <Check className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="mb-3">{recipe.description}</CardDescription>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={getCategoryColor(recipe.category)}>
                            <span className="mr-1">{getCategoryIcon(recipe.category)}</span>
                            {recipe.category.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline">
                            {recipe.logic} logic
                          </Badge>
                          <Badge variant="outline">
                            {recipe.checks.length} check{recipe.checks.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        {recipe.usageHint && (
                          <p className="text-xs text-gray-600 mt-2 italic">
                            💡 {recipe.usageHint}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              {renderPlaceholderFields()}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="mt-4">
            <form onSubmit={handleSubmit}>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {selectedRecipe && (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-800">
                          Based on recipe: <strong>{selectedRecipe.name}</strong>
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Condition Name</Label>
                    <Input
                      id="name"
                      placeholder="Optional name for this condition"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Help text explaining this condition"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={isPending}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="logic">Logic Type</Label>
                      <select
                        id="logic"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={logic}
                        onChange={(e) => setLogic(e.target.value as ConditionLogic)}
                        disabled={isPending}
                      >
                        <option value="AND">AND (all checks must pass)</option>
                        <option value="OR">OR (any check must pass)</option>
                      </select>
                    </div>

                    <div className="space-y-2 flex items-end">
                      <Label htmlFor="controlsRoutine" className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          id="controlsRoutine"
                          checked={controlsRoutine}
                          onChange={(e) => setControlsRoutine(e.target.checked)}
                          disabled={isPending}
                          className="mr-2"
                        />
                        Controls Routine Visibility
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Condition Checks</Label>
                    <div className="bg-gray-50 rounded-md p-4">
                      {checks.length > 0 ? (
                        <div className="space-y-2">
                          {checks.map((check, index) => (
                            <div key={index} className="bg-white p-3 rounded border">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-sm">{check.operator}</p>
                                  {check.description && (
                                    <p className="text-sm text-gray-600">{check.description}</p>
                                  )}
                                  {check.value && (
                                    <p className="text-xs text-gray-500">Value: {check.value}</p>
                                  )}
                                  {check.timeValue && (
                                    <p className="text-xs text-gray-500">Time: {check.timeValue}</p>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setChecks(checks.filter((_, i) => i !== index));
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          {selectedRecipe
                            ? 'Recipe checks will appear here after configuration'
                            : 'No condition checks added yet. Use the Condition Builder to add checks.'}
                        </p>
                      )}
                    </div>

                    {!selectedRecipe && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          // Open condition builder modal
                          // This would integrate with your existing condition-builder.tsx
                          toast({
                            title: 'Info',
                            description: 'Use the Condition Builder to add custom checks',
                          });
                        }}
                      >
                        Open Condition Builder
                      </Button>
                    )}
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || checks.length === 0}>
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {condition ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    condition ? 'Update Condition' : 'Create Condition'
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