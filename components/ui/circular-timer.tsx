import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CircularTimerProps {
  duration: number; // Total duration in seconds
  expiryTime: Date; // Absolute expiry time
  size?: number;
  strokeWidth?: number;
  onWarning?: () => void;
  onExpiry?: () => void;
  className?: string;
}

export const CircularTimer: React.FC<CircularTimerProps> = ({
  duration,
  expiryTime,
  size = 40,
  strokeWidth = 4,
  onWarning,
  onExpiry,
  className,
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [hasWarned, setHasWarned] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.max(0, Math.ceil((expiryTime.getTime() - now.getTime()) / 1000));
      setTimeLeft(diff);

      if (diff <= 10 && diff > 0 && !hasWarned) {
        setHasWarned(true);
        onWarning?.();
      }

      if (diff <= 0) {
        clearInterval(interval);
        onExpiry?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryTime, onWarning, onExpiry, hasWarned]);

  // Calculate percentage
  const percentage = (timeLeft / duration) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  // Determine color state
  let colorClass = 'text-emerald-500'; // Default Emerald
  if (timeLeft <= 10) {
    colorClass = 'text-red-500'; // Final state
  } else if (percentage < 50) {
    colorClass = 'text-yellow-500'; // Gold/Intermediate
  }

  // Pulse animation class
  const pulseClass = timeLeft <= 10 && timeLeft > 0 ? 'animate-pulse' : '';

  return (
    <div className={cn('relative flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-800"
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn('transition-all duration-1000 ease-linear', colorClass, pulseClass)}
        />
      </svg>
      {/* Timer Text */}
      <div className={cn("absolute text-xs font-bold", colorClass)}>
        {timeLeft}s
      </div>
    </div>
  );
};
