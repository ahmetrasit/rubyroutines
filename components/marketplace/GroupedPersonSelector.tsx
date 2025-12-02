'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Search, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PersonGroupSelection {
  personId: string;
  groupId: string;
}

interface GroupMember {
  person: {
    id: string;
    name: string;
    avatar?: string | null;
  };
}

interface Group {
  id: string;
  name: string;
  emoji?: string | null;
  members: GroupMember[];
  _count?: { members: number };
}

interface GroupedPersonSelectorProps {
  groups: Group[];
  selectedItems: PersonGroupSelection[];
  onSelectionChange: (selections: PersonGroupSelection[]) => void;
  className?: string;
}

export function GroupedPersonSelector({
  groups,
  selectedItems,
  onSelectionChange,
  className,
}: GroupedPersonSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() =>
    new Set(groups.map(g => g.id))
  );

  // Filter groups and members based on search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return groups;
    }

    const query = searchQuery.toLowerCase();
    return groups
      .map(group => ({
        ...group,
        members: group.members.filter(member =>
          member.person.name.toLowerCase().includes(query)
        ),
      }))
      .filter(group => group.members.length > 0);
  }, [groups, searchQuery]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const isSelected = (personId: string, groupId: string) => {
    return selectedItems.some(
      item => item.personId === personId && item.groupId === groupId
    );
  };

  const handleToggle = (personId: string, groupId: string) => {
    const existing = selectedItems.find(
      item => item.personId === personId && item.groupId === groupId
    );

    if (existing) {
      onSelectionChange(
        selectedItems.filter(
          item => !(item.personId === personId && item.groupId === groupId)
        )
      );
    } else {
      onSelectionChange([...selectedItems, { personId, groupId }]);
    }
  };

  const handleSelectAllInGroup = (group: Group) => {
    const groupMemberIds = group.members.map(m => m.person.id);
    const currentGroupSelections = selectedItems.filter(
      item => item.groupId === group.id
    );

    // If all members are selected, deselect all
    if (currentGroupSelections.length === group.members.length) {
      onSelectionChange(
        selectedItems.filter(item => item.groupId !== group.id)
      );
    } else {
      // Select all members in this group
      const newSelections = selectedItems.filter(item => item.groupId !== group.id);
      groupMemberIds.forEach(personId => {
        newSelections.push({ personId, groupId: group.id });
      });
      onSelectionChange(newSelections);
    }
  };

  const getGroupSelectionStatus = (group: Group): 'none' | 'partial' | 'all' => {
    const selectedCount = selectedItems.filter(
      item => item.groupId === group.id
    ).length;

    if (selectedCount === 0) return 'none';
    if (selectedCount === group.members.length) return 'all';
    return 'partial';
  };

  const parseAvatar = (avatar: string | null | undefined): { emoji?: string; color?: string } => {
    if (!avatar) return {};
    try {
      return JSON.parse(avatar);
    } catch {
      return {};
    }
  };

  if (groups.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>No classrooms found.</p>
        <p className="text-sm mt-2">Please create a classroom first.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Grouped Classrooms */}
      <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-2">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm">No matches found for "{searchQuery}"</p>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.id);
            const selectionStatus = getGroupSelectionStatus(group);

            return (
              <Collapsible
                key={group.id}
                open={isExpanded}
                onOpenChange={() => toggleGroup(group.id)}
              >
                <div className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <div
                      className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <button
                        type="button"
                        className="p-0.5 hover:bg-gray-200 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroup(group.id);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </button>

                      <div className="flex items-center gap-2 flex-1">
                        {group.emoji && (
                          <span className="text-lg">{group.emoji}</span>
                        )}
                        <span className="font-medium text-gray-900">
                          {group.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({group.members.length} {group.members.length === 1 ? 'member' : 'members'})
                        </span>
                      </div>

                      <div
                        className="flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectionStatus === 'all'}
                          onChange={() => handleSelectAllInGroup(group)}
                        />
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t">
                      {group.members.map((member) => {
                        const avatar = parseAvatar(member.person.avatar);
                        const selected = isSelected(member.person.id, group.id);

                        return (
                          <label
                            key={`${group.id}-${member.person.id}`}
                            className={cn(
                              'flex items-center gap-3 p-3 pl-10 hover:bg-gray-50 cursor-pointer transition-colors',
                              selected && 'bg-blue-50 hover:bg-blue-100'
                            )}
                          >
                            <Checkbox
                              checked={selected}
                              onChange={() => handleToggle(member.person.id, group.id)}
                            />
                            <div className="flex items-center gap-2">
                              {avatar.emoji ? (
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                                  style={{ backgroundColor: avatar.color || '#e5e7eb' }}
                                >
                                  {avatar.emoji}
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                                  {member.person.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="text-sm font-medium text-gray-900">
                                {member.person.name}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })
        )}
      </div>

      {/* Selection Summary */}
      {selectedItems.length > 0 && (
        <div className="text-sm text-gray-600 pt-2">
          {selectedItems.length} {selectedItems.length === 1 ? 'selection' : 'selections'} made
        </div>
      )}
    </div>
  );
}
