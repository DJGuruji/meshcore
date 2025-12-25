'use client';

import React from 'react';

interface UsageIndicatorProps {
  used: number;
  total: number;
  label: string;
  color: string;
  unit?: string;
}

const UsageIndicator: React.FC<UsageIndicatorProps> = ({ 
  used, 
  total, 
  label, 
  color,
  unit = ''
}) => {
  const percentage = total > 0 ? Math.min(100, Math.max(0, (used / total) * 100)) : 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Format numbers for display
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    // For values less than 1, show 2 decimal places to avoid showing 0.0
    if (num < 1 && num > 0) {
      return num.toFixed(2);
    }
    // For small numbers, check if it's a decimal
    if (num % 1 !== 0) {
      return num.toFixed(1);
    }
    return num.toString();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-16">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#1f2937" // dark gray background
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
          {/* Center text */}
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dy="0.3em"
            fontSize="24"
            fill="white"
            fontWeight="semi-bold"
          >
            {Math.round(percentage)}%
          </text>
        </svg>
      </div>
      <div className="mt-2 text-center">
        <div className="text-white font-medium text-sm">{label}</div>
        <div className="text-gray-400 text-xs mt-1">
          {formatNumber(used)}{unit} / {formatNumber(total)}{unit}
        </div>
      </div>
    </div>
  );
};

// Loading skeleton component
const UsageIndicatorSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col items-center animate-pulse">
      <div className="relative w-32 h-16">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={40}
            fill="none"
            stroke="#1f2937"
            strokeWidth="8"
          />
          {/* Animated circle */}
          <circle
            cx="50"
            cy="50"
            r={40}
            fill="none"
            stroke="#374151"
            strokeWidth="8"
            strokeDasharray="251.2"
            strokeDashoffset="125.6"
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            className="animate-spin"
            style={{ transformOrigin: '50% 50%' }}
          />
        </svg>
      </div>
      <div className="mt-2 text-center space-y-2">
        <div className="h-4 w-20 bg-white/10 rounded"></div>
        <div className="h-3 w-16 bg-white/5 rounded mx-auto"></div>
      </div>
    </div>
  );
};

interface UsageIndicatorsProps {
  storageUsed: number;
  storageLimit: number;
  requestsUsed: number;
  requestsLimit: number;
  accountType: string;
  isLoading?: boolean;
}

const UsageIndicators: React.FC<UsageIndicatorsProps> = ({ 
  storageUsed,
  storageLimit,
  requestsUsed,
  requestsLimit,
  accountType,
  isLoading = false
}) => {
  // For storage, we need to calculate the percentage using raw byte values
  // but display in MB for readability
  const storageUsedMB = storageUsed / (1024 * 1024);
  const storageLimitMB = storageLimit / (1024 * 1024);
  
  // For requests, we want to show used requests, not remaining
  const requestsPercentage = requestsLimit > 0 ? Math.min(100, Math.max(0, (requestsUsed / requestsLimit) * 100)) : 0;
  
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Usage</h3>
        {isLoading ? (
          <div className="h-5 w-16 bg-white/10 rounded-full animate-pulse"></div>
        ) : (
          <span className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-full capitalize">
            {accountType}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        {isLoading ? (
          <>
            <UsageIndicatorSkeleton />
            <UsageIndicatorSkeleton />
          </>
        ) : (
          <>
            <UsageIndicator
              used={storageUsedMB} // Convert to MB for display
              total={storageLimitMB} // Convert to MB for display
              label="Storage Used"
              color="#8b5cf6" // violet
              unit="MB"
            />
            <UsageIndicator
              used={requestsUsed} // Show actual requests used instead of remaining
              total={requestsLimit} // Total request limit
              label="Requests Used"
              color="#10b981" // emerald
            />
          </>
        )}
      </div>
      
      {!isLoading && storageUsed > storageLimit && (
        <div className="mt-4 p-2 bg-amber-900/30 border border-amber-700/50 rounded-lg">
          <p className="text-amber-200 text-xs text-center">
            Storage limit exceeded. You're in read-only mode.
          </p>
        </div>
      )}
    </div>
  );
};

export default UsageIndicators;