'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, ReferenceLine, Area, ComposedChart 
} from 'recharts';
import {
    AlertTriangle, Train, Search, ChevronRight, Activity,
    ArrowLeft, Info, X, RefreshCw
} from 'lucide-react';

// --- CONSTANTS & LOGIC ---

// THRESHOLDS (Inverted: Higher is worse wear)
const LIMIT_WARNING = 34.0;
const LIMIT_CRITICAL = 35.0;



// Fetch and build the Fleet Structure from MongoDB aggregated data
const fetchFleet = async () => {
    try {
        const response = await fetch('/api/predictions');
        const records: any[] = await response.json();

        // Group records by train, coach, wheel
        const grouped: { [key: string]: { [key: string]: { [key: string]: any } } } = {};
        records.forEach(record => {
            const trainId = record.TrainID;
            const coachId = record.CoachID;
            const wheelId = record.WheelID;
            if (!grouped[trainId]) grouped[trainId] = {};
            if (!grouped[trainId][coachId]) grouped[trainId][coachId] = {};
            grouped[trainId][coachId][wheelId] = record;
        });

        const fleet = [];
        for (const trainId in grouped) {
            const coaches = [];
            let trainStatus: 'healthy' | 'warning' | 'critical' = 'healthy';

            // Calculate baseIndex for coach order
            const trainNum = parseInt(trainId.slice(2));
            const baseIndex = 1 + (trainNum - 1) * 3;
            const coachIds = [
                `D${baseIndex.toString().padStart(3, '0')}`,   `P${baseIndex.toString().padStart(3, '0')}`,   `M${baseIndex.toString().padStart(3, '0')}`,
                `M${(baseIndex+1).toString().padStart(3, '0')}`, `P${(baseIndex+1).toString().padStart(3, '0')}`, `F${(baseIndex+1).toString().padStart(3, '0')}`,
                `M${(baseIndex+2).toString().padStart(3, '0')}`, `P${(baseIndex+2).toString().padStart(3, '0')}`, `D${(baseIndex+2).toString().padStart(3, '0')}`
            ];

            const coachMap = grouped[trainId];
            for (const coachId in coachMap) {
                const wheels = [];
                let coachStatus: 'healthy' | 'warning' | 'critical' = 'healthy';

                const wheelMap = coachMap[coachId];
                for (const wheelId in wheelMap) {
                    const record = wheelMap[wheelId];

                     const currentVal = record.mean.toFixed(2);

                     // Determine status based on mean and max
                     const meanVal = parseFloat(record.mean);
                     const maxVal = parseFloat(record.max);
                     let status: 'healthy' | 'warning' | 'critical' = 'healthy';
                     if (meanVal >= LIMIT_CRITICAL) {
                         status = 'critical';
                     } else if (meanVal > LIMIT_WARNING && maxVal >= LIMIT_CRITICAL) {
                         status = 'critical';
                     } else if (meanVal >= LIMIT_WARNING) {
                         status = 'warning';
                     }

                     wheels.push({
                         id: `${trainId}-${coachId}-${wheelId}`,
                         position: wheelId,
                         status: status,
                         currentVal: currentVal,
                         maxVal: record.max.toFixed(2),
                         trend: [] // Will load on demand
                     });

                    if (status === 'critical') coachStatus = 'critical';
                    else if (status === 'warning' && coachStatus !== 'critical') coachStatus = 'warning';
                }

                const index = coachIds.indexOf(coachId);
                coaches.push({
                    id: coachId,
                    index: index >= 0 ? index : 0,
                    status: coachStatus,
                    wheels: wheels
                });

                if (coachStatus === 'critical') trainStatus = 'critical';
                else if (coachStatus === 'warning' && trainStatus !== 'critical') trainStatus = 'warning';
            }

            // Sort coaches by number then specific type order for each number
            const getSortKey = (id: string) => {
                const match = id.match(/([DPMF])(\d+)/);
                if (match) {
                    const type = match[1];
                    const num = parseInt(match[2]);
                    const mod = num % 3;
                    let typeIndex = 0;
                    if (mod === 1) {
                        if (type === 'D') typeIndex = 0;
                        else if (type === 'P') typeIndex = 1;
                        else if (type === 'M') typeIndex = 2;
                    } else if (mod === 2) {
                        if (type === 'M') typeIndex = 0;
                        else if (type === 'P') typeIndex = 1;
                        else if (type === 'F') typeIndex = 2;
                    } else if (mod === 0) {
                        if (type === 'M') typeIndex = 0;
                        else if (type === 'P') typeIndex = 1;
                        else if (type === 'D') typeIndex = 2;
                    }
                    return num * 100 + typeIndex;
                }
                return 0;
            };
            coaches.sort((a, b) => getSortKey(a.id) - getSortKey(b.id));

            fleet.push({
                id: trainId,
                status: trainStatus,
                coaches: coaches
            });
        }

        // Sort trains by ID
        fleet.sort((a, b) => a.id.localeCompare(b.id));

        return fleet;
    } catch (error) {
        console.error('Error fetching fleet:', error);
        return [];
    }
};

// Fetch trend data for a specific wheel
const fetchWheelTrend = async (trainId: string, coachId: string, wheelId: string) => {
    try {
        const response = await fetch(`/api/predictions?train_id=${trainId}&coach_id=${coachId}&wheel_id=${wheelId}`);
        const aggregated: any[] = await response.json();

        // Sort by date
        aggregated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Sample every 3 days
        const sampled = [];
        for (let i = 0; i < aggregated.length; i += 3) {
            const r = aggregated[i];
            sampled.push({
                date: new Date(r.date).toISOString().split('T')[0],
                valMean: parseFloat(r.mean),
                valMin: parseFloat(r.min),
                valMax: parseFloat(r.max),
                isPrediction: false
            });
        }

        // Always include the latest data point to match currentVal
        const latest = aggregated[aggregated.length - 1];
        if (latest && (sampled.length === 0 || sampled[sampled.length - 1].date !== new Date(latest.date).toISOString().split('T')[0])) {
            sampled.push({
                date: new Date(latest.date).toISOString().split('T')[0],
                valMean: parseFloat(latest.mean),
                valMin: parseFloat(latest.min),
                valMax: parseFloat(latest.max),
                isPrediction: false
            });
        }

        return sampled;
    } catch (error) {
        console.error('Error fetching wheel trend:', error);
        return [];
    }
};

// --- COMPONENTS ---

const StatusIndicator = ({ status, size = 'md' }: { status: 'healthy' | 'warning' | 'critical', size?: 'sm' | 'md' | 'lg' }) => {
    const colors = {
        healthy: 'bg-emerald-500',
        warning: 'bg-amber-500',
        critical: 'bg-rose-600'
    };
    const dim = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';
    return <div className={`rounded-full ${colors[status]} ${dim} shadow-sm`} />;
};

const WheelButton = ({ wheel, onClick }: { wheel: any, onClick: () => void }) => {
    if (!wheel) return <div className="w-24 h-24"></div>;
    
    const statusColors = {
        healthy: 'bg-green-50 border-green-400 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900',
        warning: 'bg-amber-50 border-amber-400 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900',
        critical: 'bg-rose-50 border-rose-500 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-900'
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest">{wheel.position}</div>
            <div className="relative">
                <button
                    onClick={onClick}
                    className={`
                        w-24 h-24 rounded-full border-4 shadow-sm transition-all hover:scale-105 flex flex-col items-center justify-center
                        ${statusColors[wheel.status]}
                    `}
                >
                    <div className="text-sm font-medium opacity-60">Wear</div>
                    <div className="text-xl font-bold font-mono">{wheel.currentVal}</div>
                </button>
                {wheel.status !== 'healthy' && (
                    <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${wheel.status === 'critical' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'}`}>
                        {wheel.status}
                    </div>
                )}
            </div>
        </div>
    );
};

const HomePage = () => {
    const [fleetData, setFleetData] = useState<any[]>([]);
    const [view, setView] = useState('FLEET');
    const [selectedTrainId, setSelectedTrainId] = useState<string | null>(null);
    const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
    const [selectedWheel, setSelectedWheel] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'trainset' | 'coach'>('coach');
    const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'warning'>('all');
    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        setIsLoading(true);
        const data = await fetchFleet();
        setFleetData(data);
        setIsClient(true);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const selectedTrainData = useMemo(() => 
        fleetData.find(t => t.id === selectedTrainId), 
    [fleetData, selectedTrainId]);

    const selectedCoachData = useMemo(() => 
        selectedTrainData?.coaches.find(c => c.id === selectedCoachId),
    [selectedTrainData, selectedCoachId]);

    const criticalIssues = useMemo(() => {
        if (!isClient) return [];
        const issues: any[] = [];
        fleetData.forEach(t => {
            t.coaches.forEach(c => {
                c.wheels.forEach(w => {
                    if (w.status !== 'healthy') {
                        issues.push({ train: t.id, coach: c.id, wheel: w });
                    }
                });
            });
        });
        return issues.sort((a, b) => parseFloat(b.wheel.maxVal) - parseFloat(a.wheel.maxVal));
    }, [fleetData, isClient]);

    const filteredItems = useMemo(() => {
        if (viewMode === 'trainset') {
            return fleetData.filter(t => t.id.toLowerCase().includes(searchTerm.toLowerCase()) && (statusFilter === 'all' || t.status === statusFilter));
        } else {
            return fleetData.flatMap(t => t.coaches.filter(c => (c.id.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.toLowerCase().includes(searchTerm.toLowerCase())) && (statusFilter === 'all' || c.status === statusFilter)).map(c => ({ ...c, trainId: t.id, trainStatus: t.status })));
        }
    }, [fleetData, viewMode, searchTerm, statusFilter]);

    const filteredCriticalCount = useMemo(() => {
        if (statusFilter === 'warning') return 0;
        return filteredItems.filter((item: any) => item.status === 'critical').length;
    }, [filteredItems, statusFilter]);

    const filteredWarningCount = useMemo(() => {
        if (statusFilter === 'critical') return 0;
        return filteredItems.filter((item: any) => item.status === 'warning').length;
    }, [filteredItems, statusFilter]);

    const handleTrainSelect = (id: string) => {
        setSelectedTrainId(id);
        const train = fleetData.find(t => t.id === id);
        if (train && train.coaches.length > 0) {
            // Default to the first coach when a train is selected
            setSelectedCoachId(train.coaches[0].id);
        }
        setView('TRAIN');
    };

    const handleWheelClick = async (wheel: any) => {
        if (wheel.trend.length === 0) {
            const [trainId, coachId, wheelId] = wheel.id.split('-');
            const trend = await fetchWheelTrend(trainId, coachId, wheelId);
            wheel.trend = trend;
        }
        setSelectedWheel(wheel);
    };

    const closeWheelModal = () => {
        setSelectedWheel(null);
    };

    if (!isClient || isLoading) {
        return (
            <div className="flex h-screen bg-slate-50 dark:bg-slate-900 items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Loading fleet data...</p>
                </div>
            </div>
        );
    }
    
    const renderFleetDashboard = () => {
        const filteredFleet = fleetData.filter(t => 
            t.id.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
            <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans text-slate-800 dark:text-slate-200">
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-6 flex justify-between items-center">
                        <div>
                             <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                 <Train className="text-indigo-600" /> {viewMode === 'trainset' ? 'Fleet Monitoring System' : 'Coach Monitoring System'}
                             </h1>
                             <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Real-time Wheel Wear Analysis • {viewMode === 'trainset' ? '37 Active Trains' : 'Coaches Overview'}</p>
                             <p className="text-xs text-slate-400 dark:text-slate-500">Critical: {filteredCriticalCount} | Warning: {filteredWarningCount}</p>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="relative">
                                 <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 w-4 h-4" />
                                 <input
                                     type="text"
                                     placeholder="Search TS01..."
                                     className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 text-sm"
                                     value={searchTerm}
                                     onChange={(e) => setSearchTerm(e.target.value)}
                                 />
                             </div>
                              <button
                                  onClick={loadData}
                                  disabled={isLoading}
                                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                              >
                                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                  {isLoading ? 'Fetching...' : 'Fetch'}
                              </button>
                              <div className="flex gap-2">
                                  <button
                                      onClick={() => setViewMode('trainset')}
                                      className={`px-3 py-2 rounded-lg text-sm font-medium ${viewMode === 'trainset' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                                  >
                                      Trainset
                                  </button>
                                  <button
                                      onClick={() => setViewMode('coach')}
                                      className={`px-3 py-2 rounded-lg text-sm font-medium ${viewMode === 'coach' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                                  >
                                      Coach
                                  </button>
                              </div>
                             <div className="flex gap-2 text-xs font-medium">
                                 <button onClick={() => setStatusFilter('all')} className={`flex items-center gap-1 px-2 py-1 rounded ${statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>All</button>
                                 <button onClick={() => setStatusFilter('critical')} className={`flex items-center gap-1 px-2 py-1 rounded ${statusFilter === 'critical' ? 'bg-rose-600 text-white' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'}`}>
                                     <div className="w-2 h-2 bg-rose-600 rounded-full"></div> Critical
                                 </button>
                                 <button onClick={() => setStatusFilter('warning')} className={`flex items-center gap-1 px-2 py-1 rounded ${statusFilter === 'warning' ? 'bg-amber-600 text-white' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'}`}>
                                     <div className="w-2 h-2 bg-amber-500 rounded-full"></div> Warning
                                 </button>
                             </div>
                        </div>
                    </header>

                     <main className="flex-1 overflow-y-auto p-6">
                         {viewMode === 'trainset' ? (
                             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                 {filteredItems.map(train => (
                                     <button
                                         key={train.id}
                                         onClick={() => handleTrainSelect(train.id)}
                                         className={`
                                             relative group p-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-3 h-32
                                             ${train.status === 'critical' ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/50 hover:bg-rose-100 dark:hover:bg-rose-950 hover:border-rose-300 dark:hover:border-rose-800' :
                                             train.status === 'warning' ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-950 hover:border-amber-300 dark:hover:border-amber-800' :
                                             'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-950 hover:border-green-300 dark:hover:border-green-800'}
                                         `}
                                     >
                                         <div className="flex items-center justify-between w-full absolute top-3 px-3">
                                             <StatusIndicator status={train.status} />
                                             <ChevronRight className={`w-4 h-4 ${train.status === 'critical' ? 'text-rose-400' : 'text-slate-300 dark:text-slate-600'}`} />
                                         </div>
                                         <Train className={`w-8 h-8 ${train.status === 'critical' ? 'text-rose-600' : train.status === 'warning' ? 'text-amber-600' : 'text-green-600 group-hover:text-green-700'}`} />
                                         <span className="font-bold text-lg text-slate-700 dark:text-slate-300">{train.id}</span>
                                     </button>
                                 ))}
                             </div>
                         ) : (
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                  {filteredItems.map(coach => (
                                         <button
                                             key={`${coach.trainId}-${coach.id}`}
                                             onClick={() => { setSelectedTrainId(coach.trainId); setSelectedCoachId(coach.id); setView('TRAIN'); }}
                                             className={`
                                                 relative group p-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-3 h-32
                                                 ${coach.status === 'critical' ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/50 hover:bg-rose-100 dark:hover:bg-rose-950 hover:border-rose-300 dark:hover:border-rose-800' :
                                                 coach.status === 'warning' ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-950 hover:border-amber-300 dark:hover:border-amber-800' :
                                                 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-950 hover:border-green-300 dark:hover:border-green-800'}
                                             `}
                                         >
                                             <div className="flex items-center justify-between w-full absolute top-3 px-3">
                                                 <StatusIndicator status={coach.status} />
                                                 <ChevronRight className={`w-4 h-4 ${coach.status === 'critical' ? 'text-rose-400' : 'text-slate-300 dark:text-slate-600'}`} />
                                             </div>
                                             <div className="text-center">
                                                 <div className="font-bold text-xl text-slate-700 dark:text-slate-300">{coach.id}</div>
                                                 <div className="text-sm text-slate-500 dark:text-slate-400">{coach.trainId}</div>
                                             </div>
                                         </button>
                                     ))}
                             </div>
                         )}
                     </main>
                </div>

                <div className="w-80 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-xl z-10">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                        <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <AlertTriangle className="text-rose-500 w-5 h-5" /> Action Required
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Wheels exceeding wear limits ({LIMIT_CRITICAL}mm)</p>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2">
                        {criticalIssues.map((issue, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => {
                                    handleTrainSelect(issue.train);
                                    setSelectedCoachId(issue.coach);
                                    handleWheelClick(issue.wheel);
                                }}
                                className="p-3 mb-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors group"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{issue.train} <span className="font-normal text-slate-400 dark:text-slate-500">/</span> {issue.coach}</span>
                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${issue.wheel.status === 'critical' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'}`}>
                                        {issue.wheel.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400">
                                            {issue.wheel.position}
                                        </div>
                                        <div>
                                             <div className="text-xs text-slate-400 dark:text-slate-500">Max Wear</div>
                                             <div className="text-sm font-mono font-semibold dark:text-slate-200">{issue.wheel.maxVal}mm</div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderTrainDetail = () => {
        if (!selectedTrainData) return null;

        const c = selectedTrainData.coaches;
        const formationString = `Formation: ${c.map(co => co.id).join(' - ')}`;

        const wheelsUp = selectedCoachData?.wheels.filter(w => w.position.includes('U')) || [];
        const wheelsDown = selectedCoachData?.wheels.filter(w => w.position.includes('D')) || [];

        return (
            <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans">
                <div className="flex-1 flex flex-col h-full relative">
                    
                    <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-4 shadow-sm z-10">
                        <button 
                            onClick={() => setView('FLEET')}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <span className="hover:text-indigo-600 cursor-pointer" onClick={() => setView('FLEET')}>Fleet</span>
                            <ChevronRight className="w-4 h-4" />
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-lg">{selectedTrainId}</span>
                        </div>
                        <div className="ml-auto flex gap-3">
                            <div className="text-right hidden md:block">
                                <div className="text-xs text-slate-400 dark:text-slate-500">Last Inspection</div>
                                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Today, 08:00 AM</div>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto p-6">
                        <section className="mb-8">
                            <div className="flex justify-between items-end mb-3">
                                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    {formationString}
                                </h3>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-6 pt-2 px-2">
                                {selectedTrainData.coaches.map((coach, index) => {
                                    const isUnitCoupler = index === 2 || index === 5;
                                    const isLast = index === 8;

                                    return (
                                        <div className="flex items-center" key={coach.id}>
                                            <button
                                                onClick={() => setSelectedCoachId(coach.id)}
                                                className={`
                                                    flex-1 min-w-[80px] h-24 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-2 relative
                                                    ${selectedCoachId === coach.id 
                                                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 shadow-lg scale-105 z-10' 
                                                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow'}
                                                `}
                                            >
                                                <span className={`text-lg font-bold ${selectedCoachId === coach.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300'}`}>{coach.id}</span>
                                                <StatusIndicator status={coach.status} />
                                            </button>
                                            
                                            {!isLast && (
                                                <div className="flex items-center justify-center w-8 relative">
                                                    {isUnitCoupler ? (
                                                        <div className="flex flex-col items-center gap-0.5">
                                                            <div className="w-6 h-1.5 bg-slate-800 dark:bg-slate-400 rounded-full"></div>
                                                            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500">+</div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-4 h-1 bg-slate-300 dark:bg-slate-700"></div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 min-h-[400px]">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Coach {selectedCoachId} - Wheel Arrangement</h2>
                                    <p className="text-slate-400 dark:text-slate-500 text-sm">Select a wheel to view detailed wear analysis</p>
                                </div>
                                <div className="flex gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-slate-200 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600"></div>
                                        <span className="text-slate-500 dark:text-slate-400">Healthy (&lt;{LIMIT_WARNING}mm)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-amber-100 dark:bg-amber-950 rounded border border-amber-500 dark:border-amber-700"></div>
                                        <span className="text-slate-500 dark:text-slate-400">Warning (&gt;{LIMIT_WARNING}mm)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-rose-100 dark:bg-rose-950 rounded border border-rose-600 dark:border-rose-700"></div>
                                        <span className="text-slate-500 dark:text-slate-400">Critical (&gt;{LIMIT_CRITICAL}mm)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative max-w-4xl mx-auto">
                                <div className="absolute top-1/2 left-0 w-full h-32 -translate-y-1/2 flex flex-col justify-between pointer-events-none">
                                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                </div>

                                <div className="grid grid-cols-4 gap-8 relative z-0">
                                    {[0, 1, 2, 3].map(idx => {
                                        const upWheel = wheelsUp.find(w => w.position === `${idx+1}U`);
                                        const downWheel = wheelsDown.find(w => w.position === `${idx+1}D`);

                                        return (
                                            <div key={idx} className="flex flex-col gap-24 items-center">
                                                {upWheel && <WheelButton wheel={upWheel} onClick={() => handleWheelClick(upWheel)} />}
                                                {downWheel && <WheelButton wheel={downWheel} onClick={() => handleWheelClick(downWheel)} />}
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="absolute -left-12 top-4 text-xs font-bold text-slate-400 dark:text-slate-500">UP SIDE</div>
                                <div className="absolute -left-16 bottom-4 text-xs font-bold text-slate-400 dark:text-slate-500">DOWN SIDE</div>
                            </div>
                        </section>
                    </main>
                </div>

                {selectedWheel && (
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in-95 duration-300">
                            
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-900/50">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-1 rounded">
                                            {selectedTrainId} / {selectedCoachId}
                                        </span>
                                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Wheel Position {selectedWheel.position}</h2>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">Current Wear Value: <strong className="text-slate-800 dark:text-slate-200">{selectedWheel.currentVal} mm</strong></p>
                                </div>
                                <button onClick={closeWheelModal} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                                    <X className="text-slate-500 dark:text-slate-400" />
                                </button>
                            </div>

                            <div className="flex-1 p-6 flex flex-col min-h-0">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-indigo-500" /> Wear Level Trend Analysis
                                    </h3>
                                    <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-1 bg-rose-500"></div> Condemning Limit ({LIMIT_CRITICAL}mm)
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-1 bg-amber-500"></div> Warning Limit ({LIMIT_WARNING}mm)
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 w-full min-h-0 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-black/20 p-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={selectedWheel.trend}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                            <XAxis 
                                                dataKey="date" 
                                                tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} 
                                                tickFormatter={(val) => {
                                                    const d = new Date(val);
                                                    return `${d.getDate()}/${d.getMonth()+1}`;
                                                }}
                                                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                                                axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                                            />
                                            <YAxis 
                                                domain={[30, 36]} 
                                                tick={{fontSize: 12, fill: 'hsl(var(--muted-foreground))'}} 
                                                label={{ value: 'Wear Depth (mm)', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }} 
                                                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                                                axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                                            />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    borderRadius: 'var(--radius)', 
                                                    border: '1px solid hsl(var(--border))',
                                                    background: 'hsl(var(--card))',
                                                    color: 'hsl(var(--card-foreground))',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                                labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '0.5rem' }}
                                                cursor={{stroke: 'hsl(var(--accent))'}}
                                            />
                                            
                                             <ReferenceLine y={LIMIT_CRITICAL} stroke="#e11d48" strokeDasharray="4 4" label={{ position: 'right', value: 'Limit', fill: '#e11d48', fontSize: 10 }} />
                                             <ReferenceLine y={LIMIT_WARNING} stroke="#f59e0b" strokeDasharray="4 4" />
                                             <ReferenceLine x={new Date().toISOString().split('T')[0]} stroke="#3b82f6" strokeDasharray="2 2" label={{ position: 'top', value: 'Today', fill: '#3b82f6', fontSize: 10 }} />

                                              {/* Mean line */}
                                              <Line
                                                  type="monotone"
                                                  dataKey="valMean"
                                                  stroke="#f97316" // orange
                                                  strokeWidth={2}
                                                  dot={false}
                                                  name="Mean"
                                              />

                                             {/* Min line */}
                                             <Line
                                                 type="monotone"
                                                 dataKey="valMin"
                                                 stroke="#3b82f6" // blue
                                                 strokeWidth={2}
                                                 dot={false}
                                                 name="Min"
                                             />

                                             {/* Max line */}
                                             <Line
                                                 type="monotone"
                                                 dataKey="valMax"
                                                 stroke="#ef4444" // red
                                                 strokeWidth={2}
                                                 dot={false}
                                                 name="Max"
                                             />
                                            

                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                                
                                <div className="mt-4 bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900 flex gap-4 items-start">
                                    <Info className="text-indigo-600 dark:text-indigo-400 w-5 h-5 mt-0.5" />
                                    <div className="text-sm text-slate-700 dark:text-slate-300">
                                        <strong>Analysis Insight:</strong> 
                                        {selectedWheel.status === 'healthy' 
                                            ? " Wear rate is nominal. Next scheduled maintenance in 4 months." 
                                            : selectedWheel.status === 'warning' 
                                            ? " Accelerated wear detected. Recommend visual inspection at next depot stop."
                                            : " Critical wear limit approaching within 7 days. Immediate replacement required."}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Main Render Switch
    return view === 'FLEET' ? renderFleetDashboard() : renderTrainDetail();
};

export default HomePage;
