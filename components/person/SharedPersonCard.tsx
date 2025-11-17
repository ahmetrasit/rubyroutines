'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCircle } from 'lucide-react';

interface SharedPersonCardProps {
  person: {
    id: string;
    name: string;
    avatar?: string;
    isShared: boolean;
    sharedBy?: string;
    sharedByImage?: string;
    permissions?: string;
  };
  onClick: () => void;
}

export function SharedPersonCard({ person, onClick }: SharedPersonCardProps) {
  const getPermissionLabel = (permission?: string) => {
    switch (permission) {
      case 'VIEW':
        return 'View Only';
      case 'EDIT':
        return 'Can Edit';
      case 'MANAGE':
        return 'Full Access';
      default:
        return 'View Only';
    }
  };

  const getPermissionVariant = (permission?: string) => {
    switch (permission) {
      case 'VIEW':
        return 'secondary' as const;
      case 'EDIT':
        return 'default' as const;
      case 'MANAGE':
        return 'success' as const;
      default:
        return 'secondary' as const;
    }
  };

  return (
    <Card
      className={`p-4 cursor-pointer hover:shadow-lg transition-all duration-200 ${
        person.isShared
          ? 'border-2 border-blue-300 bg-blue-50 hover:bg-blue-100'
          : 'hover:shadow-md'
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col space-y-3">
        {/* Avatar and Name */}
        <div className="flex items-center gap-3">
          {person.avatar ? (
            <img
              src={person.avatar}
              alt={person.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <UserCircle className="w-8 h-8 text-gray-400" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{person.name}</h3>

            {/* Shared By Info */}
            {person.isShared && person.sharedBy && (
              <div className="flex items-center gap-1.5 mt-1">
                {person.sharedByImage && (
                  <img
                    src={person.sharedByImage}
                    alt={person.sharedBy}
                    className="w-4 h-4 rounded-full"
                  />
                )}
                <p className="text-xs text-blue-600 truncate">
                  Shared by {person.sharedBy}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Permission Badge */}
        {person.isShared && (
          <div className="flex justify-between items-center">
            <Badge
              variant={getPermissionVariant(person.permissions)}
              className="text-xs"
            >
              {getPermissionLabel(person.permissions)}
            </Badge>
            <span className="text-xs text-blue-600 font-medium">
              Shared
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}