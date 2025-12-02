'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { EmojiClickData } from 'emoji-picker-react';
import * as LucideIcons from 'lucide-react';
import { Button } from './button';
import { Label } from './label';
import { Input } from './input';
import { Search } from 'lucide-react';

// OPTIMIZATION: Lazy load emoji picker (180KB) - only loaded when component mounts
const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[350px] w-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  ),
});

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
    { name: 'SprayCan', icon: LucideIcons.SprayCan, label: 'Cleaning' },
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
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onSelect(emojiData.emoji);
    onClose();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border w-[360px]">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-medium text-gray-900">Select an Emoji</h3>
      </div>

      {/* Content */}
      <div className="p-2">
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          searchPlaceHolder="Search emoji..."
          width="100%"
          height={350}
        />
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

  // Check if it's an old icon format (backward compatibility - convert to emoji)
  if (value.startsWith('icon:')) {
    // Return a default emoji for old icon entries
    return <span className={className}>📋</span>;
  }

  // Render emoji
  return <span className={className}>{value}</span>;
}
