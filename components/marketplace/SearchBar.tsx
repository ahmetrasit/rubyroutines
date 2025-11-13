'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';

interface SearchFilters {
  keyword?: string;
  category?: string;
  ageGroup?: string;
  tags: string[];
  type?: 'ROUTINE' | 'GOAL';
  sortBy: 'rating' | 'forkCount' | 'recent';
}

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
}

const CATEGORIES = [
  'Morning Routine',
  'Bedtime Routine',
  'Homework',
  'Chores',
  'Self-Care',
  'Exercise',
  'Reading',
  'Other',
];

const AGE_GROUPS = [
  'Toddler (1-3)',
  'Preschool (3-5)',
  'Elementary (6-11)',
  'Teen (12-17)',
  'Adult (18+)',
];

const COMMON_TAGS = [
  'educational',
  'fun',
  'healthy',
  'creative',
  'social',
  'independent',
  'family',
  'screen-free',
];

export function SearchBar({ onSearch }: SearchBarProps) {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [type, setType] = useState<'ROUTINE' | 'GOAL' | ''>('');
  const [sortBy, setSortBy] = useState<'rating' | 'forkCount' | 'recent'>('rating');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  // Debounce keyword search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword]);

  // Trigger search when filters change
  useEffect(() => {
    onSearch({
      keyword: debouncedKeyword || undefined,
      category: category || undefined,
      ageGroup: ageGroup || undefined,
      tags: selectedTags,
      type: type || undefined,
      sortBy,
    });
  }, [debouncedKeyword, category, ageGroup, selectedTags, type, sortBy, onSearch]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setKeyword('');
    setCategory('');
    setAgeGroup('');
    setType('');
    setSelectedTags([]);
  };

  const hasActiveFilters = keyword || category || ageGroup || type || selectedTags.length > 0;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search routines and goals..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="pl-10 pr-10"
        />
        {keyword && (
          <button
            onClick={() => setKeyword('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </Select>

        <Select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
          <option value="">All Ages</option>
          {AGE_GROUPS.map((age) => (
            <option key={age} value={age}>
              {age}
            </option>
          ))}
        </Select>

        <Select value={type} onChange={(e) => setType(e.target.value as any)}>
          <option value="">All Types</option>
          <option value="ROUTINE">Routines</option>
          <option value="GOAL">Goals</option>
        </Select>

        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
          <option value="rating">Highest Rated</option>
          <option value="forkCount">Most Popular</option>
          <option value="recent">Most Recent</option>
        </Select>
      </div>

      {/* Tag Chips */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-gray-700">Tags:</span>
          <div className="flex flex-wrap gap-2">
            {COMMON_TAGS.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm text-gray-600">
            {[keyword, category, ageGroup, type, ...selectedTags]
              .filter(Boolean)
              .length}{' '}
            active filter(s)
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}
