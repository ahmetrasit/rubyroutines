import { prisma } from '@/lib/prisma';

export interface CircularDependencyResult {
  hasCycle: boolean;
  cyclePath?: string[];
}

/**
 * Build dependency graph for all smart routines and tasks
 * Returns a map of routine/task IDs to their dependencies
 */
async function buildDependencyGraph(): Promise<Map<string, Set<string>>> {
  const graph = new Map<string, Set<string>>();

  // Get all conditions
  const conditions = await prisma.condition.findMany({
    where: {
      routine: { type: 'SMART', status: 'ACTIVE' }
    },
    include: {
      routine: true,
      targetTask: { include: { routine: true } },
      targetRoutine: true
    }
  });

  // Build graph
  for (const condition of conditions) {
    const sourceRoutineId = condition.routineId;

    if (!graph.has(sourceRoutineId)) {
      graph.set(sourceRoutineId, new Set());
    }

    const deps = graph.get(sourceRoutineId)!;

    // Add dependency to target task's routine
    if (condition.targetTask) {
      deps.add(condition.targetTask.routine.id);
    }

    // Add dependency to target routine
    if (condition.targetRoutine) {
      deps.add(condition.targetRoutine.id);
    }
  }

  return graph;
}

/**
 * Detect circular dependency when adding new conditions to a routine
 */
export async function detectCircularDependency(
  routineId: string,
  newTargetIds: string[] // IDs of routines that will be referenced
): Promise<CircularDependencyResult> {
  const graph = await buildDependencyGraph();

  // Add new dependencies to the graph
  if (!graph.has(routineId)) {
    graph.set(routineId, new Set());
  }

  const currentDeps = graph.get(routineId)!;
  for (const targetId of newTargetIds) {
    currentDeps.add(targetId);
  }

  // Use DFS to detect cycles
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recStack.add(nodeId);
    path.push(nodeId);

    const dependencies = graph.get(nodeId) || new Set();

    for (const depId of dependencies) {
      if (!visited.has(depId)) {
        if (dfs(depId)) {
          return true; // Cycle found
        }
      } else if (recStack.has(depId)) {
        // Found a back edge - cycle detected
        path.push(depId);
        return true;
      }
    }

    recStack.delete(nodeId);
    path.pop();
    return false;
  }

  const hasCycle = dfs(routineId);

  return {
    hasCycle,
    cyclePath: hasCycle ? path : undefined
  };
}

/**
 * Get all routines/tasks that depend on a given routine
 * (Used for showing warnings when deleting routines)
 */
export async function getDependents(routineId: string): Promise<{
  routines: string[];
  tasks: string[];
}> {
  const conditions = await prisma.condition.findMany({
    where: {
      OR: [
        { targetRoutineId: routineId },
        {
          targetTask: {
            routineId: routineId
          }
        }
      ]
    },
    include: {
      routine: true,
      targetTask: true
    }
  });

  const dependentRoutines = new Set<string>();
  const dependentTasks = new Set<string>();

  for (const condition of conditions) {
    dependentRoutines.add(condition.routineId);

    if (condition.targetTask) {
      dependentTasks.add(condition.targetTask.id);
    }
  }

  return {
    routines: Array.from(dependentRoutines),
    tasks: Array.from(dependentTasks)
  };
}

/**
 * Get readable path string for cycle
 */
export async function getCyclePathString(cyclePath: string[]): Promise<string> {
  if (!cyclePath || cyclePath.length === 0) {
    return '';
  }

  // Fetch routine names for the path
  const routines = await prisma.routine.findMany({
    where: { id: { in: cyclePath } },
    select: { id: true, name: true }
  });

  const routineMap = new Map(routines.map((r: { id: string; name: string }) => [r.id, r.name]));

  // Build readable path
  const pathNames = cyclePath.map((id: string) => routineMap.get(id) || id);

  return pathNames.join(' → ');
}
