'use client';

import { Achievement, getRarityColor, getRarityBackground } from '@/lib/services/achievements';

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked?: boolean;
  progress?: number;
  showProgress?: boolean;
}

/**
 * Achievement Badge Component
 * Displays a single achievement badge with rarity styling
 */
export function AchievementBadge({
  achievement,
  unlocked = false,
  progress = 0,
  showProgress = true,
}: AchievementBadgeProps) {
  const rarityColor = getRarityColor(achievement.rarity);
  const rarityBg = getRarityBackground(achievement.rarity);

  const progressPercentage = Math.min(
    100,
    Math.round((progress / achievement.requirement) * 100)
  );

  return (
    <div
      className={`
        relative rounded-lg border-2 p-4 transition-all
        ${unlocked ? rarityBg : 'bg-gray-50 dark:bg-gray-900'}
        ${unlocked ? `border-current ${rarityColor}` : 'border-gray-200 dark:border-gray-700'}
        ${unlocked ? 'shadow-md' : 'opacity-60'}
      `}
    >
      {/* Icon */}
      <div className="text-4xl mb-2 text-center" aria-hidden="true">
        {unlocked ? achievement.icon : '🔒'}
      </div>

      {/* Name & Rarity */}
      <div className="text-center mb-2">
        <h3 className={`font-bold text-sm ${unlocked ? rarityColor : 'text-gray-600 dark:text-gray-400'}`}>
          {achievement.name}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          {achievement.rarity}
        </p>
      </div>

      {/* Description */}
      <p className="text-xs text-center text-gray-600 dark:text-gray-400 mb-2">
        {achievement.description}
      </p>

      {/* Progress Bar */}
      {showProgress && !unlocked && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>
              {progress} / {achievement.requirement}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                unlocked
                  ? 'bg-gradient-to-r from-green-500 to-green-600'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600'
              }`}
              style={{ width: `${progressPercentage}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={achievement.requirement}
              aria-label={`${progressPercentage}% complete`}
            />
          </div>
        </div>
      )}

      {/* Unlocked Badge */}
      {unlocked && (
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            ✓ Unlocked
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Achievement Grid Component
 * Displays a grid of achievement badges
 */
export function AchievementGrid({
  achievements,
  unlockedIds = [],
  progress = {},
}: {
  achievements: Achievement[];
  unlockedIds?: string[];
  progress?: { [key: string]: number };
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {achievements.map((achievement) => (
        <AchievementBadge
          key={achievement.id}
          achievement={achievement}
          unlocked={unlockedIds.includes(achievement.id)}
          progress={progress[achievement.id] || 0}
          showProgress={true}
        />
      ))}
    </div>
  );
}
