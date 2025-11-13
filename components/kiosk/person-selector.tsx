'use client';

import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface Person {
  id: string;
  name: string;
  avatar?: string | null;
}

interface PersonSelectorProps {
  persons: Person[];
  onSelect: (personId: string) => void;
  onExit: () => void;
}

export function PersonSelector({ persons, onSelect, onExit }: PersonSelectorProps) {
  const getAvatarData = (avatar?: string | null) => {
    let avatarColor = '#FFB3BA';
    let avatarEmoji = '👤';

    if (avatar) {
      try {
        const parsed = JSON.parse(avatar);
        avatarColor = parsed.color || avatarColor;
        avatarEmoji = parsed.emoji || avatarEmoji;
      } catch {
        // Ignore parse errors
      }
    }

    return { avatarColor, avatarEmoji };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Who&apos;s doing tasks today?</h1>
            <p className="text-gray-600">Select your name to get started</p>
          </div>
          <Button variant="outline" onClick={onExit} size="lg">
            <LogOut className="h-5 w-5 mr-2" />
            Exit
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {persons.map((person) => {
            const { avatarColor, avatarEmoji } = getAvatarData(person.avatar);

            return (
              <button
                key={person.id}
                onClick={() => onSelect(person.id)}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 border-4 border-transparent hover:border-blue-500"
                style={{ borderTopColor: avatarColor }}
              >
                <div className="flex flex-col items-center">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-4"
                    style={{ backgroundColor: avatarColor + '30' }}
                  >
                    {avatarEmoji}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 text-center">
                    {person.name}
                  </h3>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
