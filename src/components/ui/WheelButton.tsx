import React from 'react';
import { Wheel } from '@/types/fleet';

export const WheelButton = ({ wheel, onClick }: { wheel: Wheel, onClick: () => void }) => {
    if (!wheel) return <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 md:w-24 md:h-24"></div>;
    
    const statusColors: Record<'healthy' | 'warning' | 'critical', string> = {
        healthy: 'bg-green-50 border-green-400 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900',
        warning: 'bg-amber-50 border-amber-400 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900',
        critical: 'bg-rose-50 border-rose-500 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-900'
    };

    return (
        <div className="flex flex-col items-center gap-0.5 md:gap-2">
            <div className="text-[8px] xs:text-[9px] md:text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest">{wheel.position}</div>
            <div className="relative">
                <button
                    onClick={onClick}
                        className={`
                            w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 md:w-24 md:h-24 rounded-full border-2 md:border-4 shadow-sm transition-all hover:scale-105 flex flex-col items-center justify-center
                            ${statusColors[wheel.status as 'healthy' | 'warning' | 'critical']}
                        `}
                >
                    <div className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-sm font-medium opacity-60">Wear</div>
                    <div className="text-xs sm:text-sm md:text-xl font-bold font-mono">{wheel.currentVal}</div>
                </button>
                {wheel.status !== 'healthy' && (
                    <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 text-[6px] xs:text-[7px] sm:text-[8px] md:text-[10px] font-bold uppercase px-0.5 xs:px-1 md:px-2 py-0.5 rounded-full ${wheel.status === 'critical' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'}`}>
                        {wheel.status}
                    </div>
                )}
            </div>
        </div>
    );
};
