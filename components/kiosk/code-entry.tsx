'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowRight } from 'lucide-react';

interface CodeEntryProps {
  onSubmit: (code: string) => void;
  isLoading?: boolean;
  error?: string;
}

export function CodeEntry({ onSubmit, isLoading = false, error }: CodeEntryProps) {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length >= 4) {
      onSubmit(code.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4">
            <span className="text-4xl text-white">🎯</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ruby Routines</h1>
          <p className="text-gray-600">Enter your kiosk code to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            <Input
              type="text"
              placeholder="Enter code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="text-center text-lg font-bold h-16"
              maxLength={99}
              autoFocus
              disabled={isLoading}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-14 text-lg"
              disabled={isLoading || code.trim().length < 4}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Don&apos;t have a code? Ask your parent or teacher for one.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
