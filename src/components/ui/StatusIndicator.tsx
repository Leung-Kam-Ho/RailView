import React from 'react';

export const StatusIndicator = ({ status, size = 'md' }: { status: 'healthy' | 'warning' | 'critical', size?: 'sm' | 'md' | 'lg' }) => {
    const color = status === 'healthy' ? 'bg-emerald-500' : status === 'warning' ? 'bg-amber-500' : 'bg-rose-600';
    const dim = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';
    return <div className={`rounded-full ${color} ${dim} shadow-sm`} />;
};
