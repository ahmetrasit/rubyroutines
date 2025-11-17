'use client';

import { useState, useMemo } from 'react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import * as LucideIcons from 'lucide-react';
import { Button } from './button';
import { Label } from './label';
import { Input } from './input';
import { Search } from 'lucide-react';

// Categorized Lucide icons for selection (~100 curated icons)
const ICON_CATEGORIES = {
  'Time of Day': [
    { name: 'Sun', icon: LucideIcons.Sun, label: 'Morning' },
    { name: 'Sunrise', icon: LucideIcons.Sunrise, label: 'Early Morning' },
    { name: 'Sunset', icon: LucideIcons.Sunset, label: 'Evening' },
    { name: 'Moon', icon: LucideIcons.Moon, label: 'Night' },
    { name: 'MoonStar', icon: LucideIcons.MoonStar, label: 'Bedtime' },
    { name: 'Clock', icon: LucideIcons.Clock, label: 'Time' },
    { name: 'CloudMoon', icon: LucideIcons.CloudMoon, label: 'Night' },
    { name: 'CloudSun', icon: LucideIcons.CloudSun, label: 'Day' },
  ],
  'Daily Activities': [
    { name: 'Coffee', icon: LucideIcons.Coffee, label: 'Coffee' },
    { name: 'UtensilsCrossed', icon: LucideIcons.UtensilsCrossed, label: 'Meals' },
    { name: 'Apple', icon: LucideIcons.Apple, label: 'Snack' },
    { name: 'Bath', icon: LucideIcons.Bath, label: 'Bath' },
    { name: 'Bed', icon: LucideIcons.Bed, label: 'Bedtime' },
    { name: 'Home', icon: LucideIcons.Home, label: 'Home' },
    { name: 'ShowerHead', icon: LucideIcons.ShowerHead, label: 'Shower' },
    { name: 'Sofa', icon: LucideIcons.Sofa, label: 'Relax' },
  ],
  'School & Learning': [
    { name: 'GraduationCap', icon: LucideIcons.GraduationCap, label: 'School' },
    { name: 'BookOpen', icon: LucideIcons.BookOpen, label: 'Reading' },
    { name: 'Book', icon: LucideIcons.Book, label: 'Study' },
    { name: 'Backpack', icon: LucideIcons.Backpack, label: 'Backpack' },
    { name: 'Pencil', icon: LucideIcons.Pencil, label: 'Writing' },
    { name: 'Calculator', icon: LucideIcons.Calculator, label: 'Math' },
    { name: 'Library', icon: LucideIcons.Library, label: 'Library' },
    { name: 'Glasses', icon: LucideIcons.Glasses, label: 'Reading' },
    { name: 'PenTool', icon: LucideIcons.PenTool, label: 'Drawing' },
    { name: 'Ruler', icon: LucideIcons.Ruler, label: 'Geometry' },
  ],
  'Exercise & Sports': [
    { name: 'Dumbbell', icon: LucideIcons.Dumbbell, label: 'Exercise' },
    { name: 'Bike', icon: LucideIcons.Bike, label: 'Cycling' },
    { name: 'HeartPulse', icon: LucideIcons.HeartPulse, label: 'Cardio' },
    { name: 'Trophy', icon: LucideIcons.Trophy, label: 'Achievement' },
    { name: 'Target', icon: LucideIcons.Target, label: 'Goal' },
    { name: 'Activity', icon: LucideIcons.Activity, label: 'Activity' },
    { name: 'Footprints', icon: LucideIcons.Footprints, label: 'Walking' },
    { name: 'Waves', icon: LucideIcons.Waves, label: 'Swimming' },
  ],
  'Hobbies': [
    { name: 'Music', icon: LucideIcons.Music, label: 'Music' },
    { name: 'Gamepad2', icon: LucideIcons.Gamepad2, label: 'Gaming' },
    { name: 'Palette', icon: LucideIcons.Palette, label: 'Art' },
    { name: 'Camera', icon: LucideIcons.Camera, label: 'Photo' },
    { name: 'Guitar', icon: LucideIcons.Guitar, label: 'Guitar' },
    { name: 'Piano', icon: LucideIcons.Piano, label: 'Piano' },
    { name: 'Brush', icon: LucideIcons.Brush, label: 'Painting' },
    { name: 'Film', icon: LucideIcons.Film, label: 'Movies' },
  ],
  'Health & Wellness': [
    { name: 'Heart', icon: LucideIcons.Heart, label: 'Self-care' },
    { name: 'Pill', icon: LucideIcons.Pill, label: 'Medicine' },
    { name: 'Smile', icon: LucideIcons.Smile, label: 'Happiness' },
    { name: 'Brain', icon: LucideIcons.Brain, label: 'Mental Health' },
    { name: 'Sparkles', icon: LucideIcons.Sparkles, label: 'Clean' },
    { name: 'Stethoscope', icon: LucideIcons.Stethoscope, label: 'Doctor' },
    { name: 'Syringe', icon: LucideIcons.Syringe, label: 'Vaccine' },
    { name: 'Bandage', icon: LucideIcons.Bandage, label: 'First Aid' },
  ],
  'People & Groups': [
    { name: 'Users', icon: LucideIcons.Users, label: 'Group' },
    { name: 'User', icon: LucideIcons.User, label: 'Person' },
    { name: 'UserCircle', icon: LucideIcons.UserCircle, label: 'Profile' },
    { name: 'Baby', icon: LucideIcons.Baby, label: 'Baby' },
    { name: 'UserPlus', icon: LucideIcons.UserPlus, label: 'Add Person' },
    { name: 'UsersRound', icon: LucideIcons.UsersRound, label: 'Team' },
  ],
  'Motivation': [
    { name: 'Star', icon: LucideIcons.Star, label: 'Star' },
    { name: 'Award', icon: LucideIcons.Award, label: 'Award' },
    { name: 'Medal', icon: LucideIcons.Medal, label: 'Medal' },
    { name: 'Zap', icon: LucideIcons.Zap, label: 'Energy' },
    { name: 'Flag', icon: LucideIcons.Flag, label: 'Goal' },
    { name: 'Rocket', icon: LucideIcons.Rocket, label: 'Launch' },
    { name: 'Flame', icon: LucideIcons.Flame, label: 'Fire' },
    { name: 'Sparkle', icon: LucideIcons.Sparkle, label: 'Shine' },
  ],
  'Chores & Cleaning': [
    { name: 'Trash2', icon: LucideIcons.Trash2, label: 'Trash' },
    { name: 'Shirt', icon: LucideIcons.Shirt, label: 'Laundry' },
    { name: 'ShoppingCart', icon: LucideIcons.ShoppingCart, label: 'Shopping' },
    { name: 'Recycle', icon: LucideIcons.Recycle, label: 'Recycle' },
    { name: 'Droplet', icon: LucideIcons.Droplet, label: 'Water' },
    { name: 'Spray', icon: LucideIcons.Spray, label: 'Cleaning' },
    { name: 'Wind', icon: LucideIcons.Wind, label: 'Vacuum' },
    { name: 'WashingMachine', icon: LucideIcons.WashingMachine, label: 'Washing' },
  ],
  'Food & Cooking': [
    { name: 'Pizza', icon: LucideIcons.Pizza, label: 'Pizza' },
    { name: 'Cookie', icon: LucideIcons.Cookie, label: 'Cookie' },
    { name: 'IceCream', icon: LucideIcons.IceCream, label: 'Ice Cream' },
    { name: 'Utensils', icon: LucideIcons.Utensils, label: 'Utensils' },
    { name: 'ChefHat', icon: LucideIcons.ChefHat, label: 'Cooking' },
    { name: 'CookingPot', icon: LucideIcons.CookingPot, label: 'Pot' },
    { name: 'Salad', icon: LucideIcons.Salad, label: 'Salad' },
    { name: 'Soup', icon: LucideIcons.Soup, label: 'Soup' },
    { name: 'Milk', icon: LucideIcons.Milk, label: 'Milk' },
    { name: 'Sandwich', icon: LucideIcons.Sandwich, label: 'Sandwich' },
  ],
  'Technology': [
    { name: 'Laptop', icon: LucideIcons.Laptop, label: 'Laptop' },
    { name: 'Smartphone', icon: LucideIcons.Smartphone, label: 'Phone' },
    { name: 'Tablet', icon: LucideIcons.Tablet, label: 'Tablet' },
    { name: 'Monitor', icon: LucideIcons.Monitor, label: 'Monitor' },
    { name: 'Keyboard', icon: LucideIcons.Keyboard, label: 'Keyboard' },
    { name: 'Mouse', icon: LucideIcons.Mouse, label: 'Mouse' },
    { name: 'Headphones', icon: LucideIcons.Headphones, label: 'Headphones' },
    { name: 'Tv', icon: LucideIcons.Tv, label: 'TV' },
    { name: 'Wifi', icon: LucideIcons.Wifi, label: 'Wifi' },
    { name: 'Battery', icon: LucideIcons.Battery, label: 'Battery' },
  ],
  'Nature & Animals': [
    { name: 'TreePine', icon: LucideIcons.TreePine, label: 'Tree' },
    { name: 'Flower', icon: LucideIcons.Flower, label: 'Flower' },
    { name: 'Bug', icon: LucideIcons.Bug, label: 'Bug' },
    { name: 'Bird', icon: LucideIcons.Bird, label: 'Bird' },
    { name: 'Dog', icon: LucideIcons.Dog, label: 'Dog' },
    { name: 'Cat', icon: LucideIcons.Cat, label: 'Cat' },
    { name: 'Fish', icon: LucideIcons.Fish, label: 'Fish' },
    { name: 'Rabbit', icon: LucideIcons.Rabbit, label: 'Rabbit' },
    { name: 'Squirrel', icon: LucideIcons.Squirrel, label: 'Squirrel' },
    { name: 'Leaf', icon: LucideIcons.Leaf, label: 'Leaf' },
  ],
  'Weather': [
    { name: 'Cloud', icon: LucideIcons.Cloud, label: 'Cloud' },
    { name: 'CloudRain', icon: LucideIcons.CloudRain, label: 'Rain' },
    { name: 'CloudSnow', icon: LucideIcons.CloudSnow, label: 'Snow' },
    { name: 'CloudLightning', icon: LucideIcons.CloudLightning, label: 'Storm' },
    { name: 'Snowflake', icon: LucideIcons.Snowflake, label: 'Snowflake' },
    { name: 'Rainbow', icon: LucideIcons.Rainbow, label: 'Rainbow' },
  ],
  'Transportation': [
    { name: 'Car', icon: LucideIcons.Car, label: 'Car' },
    { name: 'Bus', icon: LucideIcons.Bus, label: 'Bus' },
    { name: 'Train', icon: LucideIcons.Train, label: 'Train' },
    { name: 'Plane', icon: LucideIcons.Plane, label: 'Plane' },
    { name: 'Ship', icon: LucideIcons.Ship, label: 'Ship' },
    { name: 'MapPin', icon: LucideIcons.MapPin, label: 'Location' },
  ],
};

interface IconEmojiPickerProps {
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function IconEmojiPicker({ selectedValue, onSelect, onClose }: IconEmojiPickerProps) {
  const [activeTab, setActiveTab] = useState<'emoji' | 'icon'>('emoji');
  const [iconSearch, setIconSearch] = useState('');

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onSelect(emojiData.emoji);
    onClose();
  };

  const handleIconClick = (iconName: string) => {
    onSelect(`icon:${iconName}`);
    onClose();
  };

  // Filter all lucide icons based on search
  const searchResults = useMemo(() => {
    if (!iconSearch.trim()) return null;

    const searchTerm = iconSearch.toLowerCase();
    const allIcons = Object.keys(LucideIcons).filter(
      (key) =>
        key !== 'default' &&
        key !== 'createLucideIcon' &&
        typeof (LucideIcons as any)[key] === 'function'
    );

    const matches = allIcons
      .filter((iconName) => iconName.toLowerCase().includes(searchTerm))
      .slice(0, 60); // Limit to 60 results for performance

    return matches.map((name) => ({
      name,
      icon: (LucideIcons as any)[name],
    }));
  }, [iconSearch]);

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
          <div className="h-[350px] flex flex-col">
            {/* Search input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search icons..."
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Icon grid */}
            <div className="flex-1 overflow-y-auto">
              {searchResults ? (
                // Show search results
                <div className="mb-4">
                  <Label className="text-xs text-gray-500 mb-2 block">
                    Search Results ({searchResults.length})
                  </Label>
                  {searchResults.length > 0 ? (
                    <div className="grid grid-cols-6 gap-2">
                      {searchResults.map(({ name, icon: Icon }) => (
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
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No icons found</p>
                  )}
                </div>
              ) : (
                // Show curated icons when search is empty
                <>
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
                </>
              )}
            </div>
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
