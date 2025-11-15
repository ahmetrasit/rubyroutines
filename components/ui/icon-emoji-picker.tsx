'use client';

import { useState } from 'react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import * as LucideIcons from 'lucide-react';
import { Button } from './button';
import { Label } from './label';

// Categorized Lucide icons for selection
const ICON_CATEGORIES = {
  'Time of Day': [
    { name: 'Sun', icon: LucideIcons.Sun, label: 'Morning' },
    { name: 'Sunrise', icon: LucideIcons.Sunrise, label: 'Early Morning' },
    { name: 'Sunset', icon: LucideIcons.Sunset, label: 'Evening' },
    { name: 'Moon', icon: LucideIcons.Moon, label: 'Night' },
    { name: 'MoonStar', icon: LucideIcons.MoonStar, label: 'Bedtime' },
    { name: 'Clock', icon: LucideIcons.Clock, label: 'Time' },
  ],
  'Daily Activities': [
    { name: 'Coffee', icon: LucideIcons.Coffee, label: 'Coffee' },
    { name: 'UtensilsCrossed', icon: LucideIcons.UtensilsCrossed, label: 'Meals' },
    { name: 'Apple', icon: LucideIcons.Apple, label: 'Snack' },
    { name: 'Bath', icon: LucideIcons.Bath, label: 'Bath' },
    { name: 'Bed', icon: LucideIcons.Bed, label: 'Bedtime' },
    { name: 'Home', icon: LucideIcons.Home, label: 'Home' },
  ],
  'School & Learning': [
    { name: 'GraduationCap', icon: LucideIcons.GraduationCap, label: 'School' },
    { name: 'BookOpen', icon: LucideIcons.BookOpen, label: 'Reading' },
    { name: 'Book', icon: LucideIcons.Book, label: 'Study' },
    { name: 'Backpack', icon: LucideIcons.Backpack, label: 'Backpack' },
    { name: 'Pencil', icon: LucideIcons.Pencil, label: 'Writing' },
    { name: 'Calculator', icon: LucideIcons.Calculator, label: 'Math' },
  ],
  'Exercise & Sports': [
    { name: 'Dumbbell', icon: LucideIcons.Dumbbell, label: 'Exercise' },
    { name: 'Bike', icon: LucideIcons.Bike, label: 'Cycling' },
    { name: 'HeartPulse', icon: LucideIcons.HeartPulse, label: 'Cardio' },
    { name: 'Trophy', icon: LucideIcons.Trophy, label: 'Achievement' },
    { name: 'Target', icon: LucideIcons.Target, label: 'Goal' },
  ],
  'Hobbies': [
    { name: 'Music', icon: LucideIcons.Music, label: 'Music' },
    { name: 'Gamepad2', icon: LucideIcons.Gamepad2, label: 'Gaming' },
    { name: 'Palette', icon: LucideIcons.Palette, label: 'Art' },
    { name: 'Camera', icon: LucideIcons.Camera, label: 'Photo' },
    { name: 'Guitar', icon: LucideIcons.Guitar, label: 'Guitar' },
  ],
  'Health & Wellness': [
    { name: 'Heart', icon: LucideIcons.Heart, label: 'Self-care' },
    { name: 'Pill', icon: LucideIcons.Pill, label: 'Medicine' },
    { name: 'Smile', icon: LucideIcons.Smile, label: 'Happiness' },
    { name: 'Brain', icon: LucideIcons.Brain, label: 'Mental Health' },
    { name: 'Sparkles', icon: LucideIcons.Sparkles, label: 'Clean' },
  ],
  'People & Groups': [
    { name: 'Users', icon: LucideIcons.Users, label: 'Group' },
    { name: 'User', icon: LucideIcons.User, label: 'Person' },
    { name: 'UserCircle', icon: LucideIcons.UserCircle, label: 'Profile' },
    { name: 'Baby', icon: LucideIcons.Baby, label: 'Baby' },
  ],
  'Motivation': [
    { name: 'Star', icon: LucideIcons.Star, label: 'Star' },
    { name: 'Award', icon: LucideIcons.Award, label: 'Award' },
    { name: 'Medal', icon: LucideIcons.Medal, label: 'Medal' },
    { name: 'Zap', icon: LucideIcons.Zap, label: 'Energy' },
    { name: 'Flag', icon: LucideIcons.Flag, label: 'Goal' },
  ],
};

interface IconEmojiPickerProps {
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function IconEmojiPicker({ selectedValue, onSelect, onClose }: IconEmojiPickerProps) {
  const [activeTab, setActiveTab] = useState<'emoji' | 'icon'>('emoji');

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onSelect(emojiData.emoji);
    onClose();
  };

  const handleIconClick = (iconName: string) => {
    onSelect(`icon:${iconName}`);
    onClose();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border w-[360px]">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          type="button"
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'emoji'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('emoji')}
        >
          😊 Emojis
        </button>
        <button
          type="button"
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'icon'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('icon')}
        >
          ⭐ Icons
        </button>
      </div>

      {/* Content */}
      <div className="p-2">
        {activeTab === 'emoji' ? (
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            searchPlaceHolder="Search emoji..."
            width="100%"
            height={350}
          />
        ) : (
          <div className="h-[350px] overflow-y-auto">
            {Object.entries(ICON_CATEGORIES).map(([category, icons]) => (
              <div key={category} className="mb-4">
                <Label className="text-xs text-gray-500 mb-2 block">{category}</Label>
                <div className="grid grid-cols-6 gap-2">
                  {icons.map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleIconClick(name)}
                      className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${
                        selectedValue === `icon:${name}` ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                      }`}
                      title={name}
                    >
                      <Icon className="h-5 w-5 mx-auto" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component to render the selected emoji/icon
interface RenderIconEmojiProps {
  value: string;
  className?: string;
}

export function RenderIconEmoji({ value, className = 'text-2xl' }: RenderIconEmojiProps) {
  if (!value) return null;

  // Check if it's an icon
  if (value.startsWith('icon:')) {
    const iconName = value.replace('icon:', '');
    const Icon = (LucideIcons as any)[iconName];
    if (Icon) {
      return <Icon className={className} />;
    }
  }

  // Otherwise, it's an emoji
  return <span className={className}>{value}</span>;
}
