import React from 'react';
import { cn } from '@/lib/utils';

interface DurationSelectorProps {
  value: number; // Duration in seconds
  onChange: (value: number) => void;
  className?: string;
}

const DURATION_OPTIONS = [
  { label: '120s', value: 120 },
  { label: '180s', value: 180 },
  { label: '300s', value: 300 },
  { label: '600s', value: 600 },
  { label: '4h', value: 14400 },
  { label: '24h', value: 86400 },
];

export const DurationSelector: React.FC<DurationSelectorProps> = ({ value, onChange, className }) => {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label className="text-sm font-medium text-gray-400">Duration</label>
      <div className="flex flex-wrap gap-2">
        {DURATION_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full transition-colors border",
              value === option.value
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600"
            )}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
