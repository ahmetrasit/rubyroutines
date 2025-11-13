'use client';

import { useEffect, useState } from 'react';

interface ConfettiCelebrationProps {
  show: boolean;
  onComplete?: () => void;
}

export function ConfettiCelebration({ show, onComplete }: ConfettiCelebrationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [show, onComplete]);

  if (!visible) {
    return null;
  }

  // Generate confetti pieces
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 1,
    color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'][Math.floor(Math.random() * 6)],
  }));

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {/* Celebration message */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center animate-bounce">
          <div className="text-8xl mb-4">🎉</div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Great job!</h2>
          <p className="text-xl text-gray-600">Task completed!</p>
        </div>
      </div>

      {/* Confetti pieces */}
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 animate-confetti"
          style={{
            left: `${piece.left}%`,
            top: '-10%',
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
}
