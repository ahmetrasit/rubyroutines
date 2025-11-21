'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TaskType } from '@/lib/types/prisma-enums';
import { Design1CardSwipe } from '@/components/checkin-designs/dashboard/design1-card-swipe';
import { Design2CompactList } from '@/components/checkin-designs/dashboard/design2-compact-list';
import { Design3Gamified } from '@/components/checkin-designs/dashboard/design3-gamified';
import { KioskDesign1GridTiles } from '@/components/checkin-designs/kiosk/design1-grid-tiles';
import { KioskDesign2SplitScreen } from '@/components/checkin-designs/kiosk/design2-split-screen';
import { KioskDesign3TimelineFlow } from '@/components/checkin-designs/kiosk/design3-timeline-flow';
import { Smartphone, Tablet } from 'lucide-react';

// Mock data for previews
const mockTasks = [
  {
    id: '1',
    name: 'Brush Teeth',
    description: 'Brush your teeth for 2 minutes',
    type: TaskType.SIMPLE,
    unit: null,
    isComplete: false,
    completionCount: 0,
    emoji: '🪥',
    color: '#3b82f6',
  },
  {
    id: '2',
    name: 'Drink Water',
    description: 'Stay hydrated throughout the day',
    type: TaskType.MULTIPLE_CHECKIN,
    unit: 'glasses',
    isComplete: false,
    completionCount: 3,
    emoji: '💧',
    color: '#06b6d4',
  },
  {
    id: '3',
    name: 'Reading Practice',
    description: 'Read pages from your book',
    type: TaskType.PROGRESS,
    unit: 'pages',
    isComplete: false,
    completionCount: 0,
    emoji: '📚',
    color: '#8b5cf6',
  },
  {
    id: '4',
    name: 'Make Bed',
    description: 'Keep your room tidy',
    type: TaskType.SIMPLE,
    unit: null,
    isComplete: false,
    completionCount: 0,
    emoji: '🛏️',
    color: '#10b981',
  },
  {
    id: '5',
    name: 'Homework',
    description: 'Complete your assignments',
    type: TaskType.SIMPLE,
    unit: null,
    isComplete: false,
    completionCount: 0,
    emoji: '✏️',
    color: '#f59e0b',
  },
];

const mockGoals = [
  {
    id: '1',
    name: 'Daily Reading Goal',
    icon: '📖',
    color: '#8b5cf6',
    progress: {
      percentage: 65,
      achieved: false,
      current: 13,
      target: 20,
    },
  },
  {
    id: '2',
    name: 'Healthy Habits',
    icon: '💪',
    color: '#10b981',
    progress: {
      percentage: 80,
      achieved: false,
      current: 4,
      target: 5,
    },
  },
  {
    id: '3',
    name: 'Stay Hydrated',
    icon: '💧',
    color: '#06b6d4',
    progress: {
      percentage: 100,
      achieved: true,
      current: 8,
      target: 8,
    },
  },
];

type DesignType =
  | 'dashboard-1'
  | 'dashboard-2'
  | 'dashboard-3'
  | 'kiosk-1'
  | 'kiosk-2'
  | 'kiosk-3'
  | null;

export default function CheckinPreviewPage() {
  const [activeDesign, setActiveDesign] = useState<DesignType>(null);
  const [tasks, setTasks] = useState(mockTasks);

  const handleComplete = (taskId: string, value?: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === taskId) {
          if (task.type === TaskType.SIMPLE) {
            return { ...task, isComplete: true };
          } else if (task.type === TaskType.MULTIPLE_CHECKIN) {
            return { ...task, completionCount: (task.completionCount || 0) + 1 };
          } else if (task.type === TaskType.PROGRESS) {
            return { ...task, completionCount: (task.completionCount || 0) + 1 };
          }
        }
        return task;
      })
    );
  };

  const resetTasks = () => {
    setTasks(mockTasks);
  };

  if (activeDesign) {
    const commonProps = {
      personName: 'Alex',
      tasks: tasks,
      goals: mockGoals,
      onComplete: handleComplete,
      onClose: () => {
        setActiveDesign(null);
        resetTasks();
      },
      isPending: false,
    };

    switch (activeDesign) {
      case 'dashboard-1':
        return <Design1CardSwipe {...commonProps} />;
      case 'dashboard-2':
        return <Design2CompactList {...commonProps} />;
      case 'dashboard-3':
        return <Design3Gamified {...commonProps} />;
      case 'kiosk-1':
        return <KioskDesign1GridTiles {...commonProps} />;
      case 'kiosk-2':
        return <KioskDesign2SplitScreen {...commonProps} />;
      case 'kiosk-3':
        return <KioskDesign3TimelineFlow {...commonProps} />;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black text-gray-900 mb-4">
            Check-in UI Designs
          </h1>
          <p className="text-2xl text-gray-600">
            Preview 6 different check-in interfaces optimized for kids and seniors
          </p>
        </div>

        {/* Dashboard Designs (Smartphone) */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Smartphone className="h-10 w-10 text-blue-600" />
            <h2 className="text-4xl font-black text-gray-900">
              Dashboard Check-ins (Smartphone)
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Design 1 */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-blue-200 hover:border-blue-400 transition-all">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                <h3 className="text-3xl font-black mb-2">Design 1</h3>
                <p className="text-lg opacity-90">Card-based Swipeable</p>
              </div>
              <div className="p-6">
                <ul className="space-y-2 mb-6 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>Large swipeable cards for one-handed use</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>High contrast colors for seniors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>Celebration animations for kids</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>Big emoji and visual feedback</span>
                  </li>
                </ul>
                <Button
                  onClick={() => setActiveDesign('dashboard-1')}
                  className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  Preview Design 1
                </Button>
              </div>
            </div>

            {/* Design 2 */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-green-200 hover:border-green-400 transition-all">
              <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6 text-white">
                <h3 className="text-3xl font-black mb-2">Design 2</h3>
                <p className="text-lg opacity-90">Compact List View</p>
              </div>
              <div className="p-6">
                <ul className="space-y-2 mb-6 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">•</span>
                    <span>Efficient use of screen space</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">•</span>
                    <span>Color-coded task status indicators</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">•</span>
                    <span>Quick-tap completion for speed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">•</span>
                    <span>Sticky header with progress</span>
                  </li>
                </ul>
                <Button
                  onClick={() => setActiveDesign('dashboard-2')}
                  className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
                >
                  Preview Design 2
                </Button>
              </div>
            </div>

            {/* Design 3 */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-purple-200 hover:border-purple-400 transition-all">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white">
                <h3 className="text-3xl font-black mb-2">Design 3</h3>
                <p className="text-lg opacity-90">Gamified Experience</p>
              </div>
              <div className="p-6">
                <ul className="space-y-2 mb-6 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold">•</span>
                    <span>Game-like interface with rewards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold">•</span>
                    <span>Level/XP system for motivation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold">•</span>
                    <span>Animated celebrations and confetti</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold">•</span>
                    <span>Bright colors optimized for kids</span>
                  </li>
                </ul>
                <Button
                  onClick={() => setActiveDesign('dashboard-3')}
                  className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                >
                  Preview Design 3
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Kiosk Designs (Tablet) */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <Tablet className="h-10 w-10 text-orange-600" />
            <h2 className="text-4xl font-black text-gray-900">
              Kiosk Check-ins (Tablet)
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Kiosk Design 1 */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-orange-200 hover:border-orange-400 transition-all">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white">
                <h3 className="text-3xl font-black mb-2">Kiosk Design 1</h3>
                <p className="text-lg opacity-90">Grid-based Tiles</p>
              </div>
              <div className="p-6">
                <ul className="space-y-2 mb-6 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>2-column grid for tablets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>Large touchable tiles (120px+)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>Color-coded task states</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>Visual celebrations on completion</span>
                  </li>
                </ul>
                <Button
                  onClick={() => setActiveDesign('kiosk-1')}
                  className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                >
                  Preview Kiosk 1
                </Button>
              </div>
            </div>

            {/* Kiosk Design 2 */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-cyan-200 hover:border-cyan-400 transition-all">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6 text-white">
                <h3 className="text-3xl font-black mb-2">Kiosk Design 2</h3>
                <p className="text-lg opacity-90">Split-screen Layout</p>
              </div>
              <div className="p-6">
                <ul className="space-y-2 mb-6 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-500 font-bold">•</span>
                    <span>Goals on left, tasks on right</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-500 font-bold">•</span>
                    <span>Real-time goal progress visualization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-500 font-bold">•</span>
                    <span>Shows immediate impact on goals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-500 font-bold">•</span>
                    <span>Progress-focused design</span>
                  </li>
                </ul>
                <Button
                  onClick={() => setActiveDesign('kiosk-2')}
                  className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  Preview Kiosk 2
                </Button>
              </div>
            </div>

            {/* Kiosk Design 3 */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-indigo-200 hover:border-indigo-400 transition-all">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                <h3 className="text-3xl font-black mb-2">Kiosk Design 3</h3>
                <p className="text-lg opacity-90">Timeline Flow</p>
              </div>
              <div className="p-6">
                <ul className="space-y-2 mb-6 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>Vertical timeline showing progression</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>One task at a time focus</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>Milestone celebrations at intervals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>Easy to understand journey</span>
                  </li>
                </ul>
                <Button
                  onClick={() => setActiveDesign('kiosk-3')}
                  className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  Preview Kiosk 3
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-16 bg-white rounded-2xl shadow-xl p-8 border-4 border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Design Features Summary</h3>
          <div className="grid md:grid-cols-2 gap-6 text-gray-700">
            <div>
              <h4 className="font-bold text-lg mb-2 text-blue-600">For Kids:</h4>
              <ul className="space-y-1">
                <li>• Large emojis and colorful visuals</li>
                <li>• Celebration animations and rewards</li>
                <li>• Gamification elements (levels, stars)</li>
                <li>• Simple, intuitive interactions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-2 text-purple-600">For Seniors:</h4>
              <ul className="space-y-1">
                <li>• High contrast colors for readability</li>
                <li>• Large touch targets (56px+ minimum)</li>
                <li>• Clear visual feedback</li>
                <li>• Simple navigation patterns</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
