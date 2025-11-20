'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, ReferenceLine, Area, ComposedChart 
} from 'recharts';
import { 
    AlertTriangle, Train, Search, ChevronRight, Activity, 
    ArrowLeft, Info, X 
} from 'lucide-react';

// --- CONSTANTS & LOGIC ---

// THRESHOLDS (Inverted: Higher is worse wear)
const LIMIT_WARNING = 34.0;
const LIMIT_CRITICAL = 35.0;

// Helper to generate a trend for a specific wheel (INCREASING WEAR)
const generateTrendData = (baseHealth: 'healthy' | 'warning' | 'critical') => {
    const data = [];
    const today = new Date();
    
    // Determine "Current" value based on status
    let currentWear;
    if (baseHealth === 'critical') currentWear = 35.05 + Math.random() * 0.8; // Above 35.0
    else if (baseHealth === 'warning') currentWear = 34.05 + Math.random() * 0.9; // Between 34.0 and 35.0
    else currentWear = 31.0 + Math.random() * 2.9; // Healthy (31.0 - 33.9)

    // 1. GENERATE HISTORY (Go backwards from today)
    const historyPoints = [];
    let tempWear = currentWear;

    // We generate 180 days of history
    for (let i = 0; i <= 180; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // For history points: valHistory has value, valPrediction is null
        historyPoints.push({
            date: date.toISOString().split('T')[0],
            valHistory: parseFloat(tempWear.toFixed(2)),
            valPrediction: null,
            isPrediction: false
        });

        // Go back in time -> Wear was LOWER
        const dailyChange = Math.random() * 0.03 + 0.005;
        tempWear -= dailyChange;
        
        if (tempWear < 30.5) tempWear = 30.5;
    }
    // Reverse history so it's chronological (Oldest -> Today)
    data.push(...historyPoints.reverse());

    // Fix the "Today" point (last element of data) to be the anchor for prediction
    if (data.length > 0) {
        data[data.length - 1].valPrediction = data[data.length - 1].valHistory;
    }

    // 2. GENERATE PREDICTION (Go forward from today)
    let predictedWear = currentWear;
    for (let i = 1; i <= 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        
        // Future -> Wear gets HIGHER
        const dailyChange = Math.random() * 0.03 + 0.005;
        predictedWear += dailyChange;

        if (baseHealth === 'critical') predictedWear += 0.05;

        data.push({
            date: date.toISOString().split('T')[0],
            valHistory: null, // History line stops
            valPrediction: parseFloat(predictedWear.toFixed(2)),
            isPrediction: true
        });
    }
    
    return { trend: data, currentVal: currentWear.toFixed(2) };
};

// Generate the Fleet Structure
const generateFleet = () => {
    const fleet = [];
    
    for (let t = 1; t <= 37; t++) {
        const trainId = `TS${t.toString().padStart(2, '0')}`;
        const coaches = [];
        let trainStatus: 'healthy' | 'warning' | 'critical' = 'healthy';

        // Logic: TS01 starts at 1, TS02 starts at 4...
        const baseIndex = 1 + (t - 1) * 3;

        const coachIds = [
            `D${baseIndex}`,   `P${baseIndex}`,   `M${baseIndex}`,
            `M${baseIndex+1}`, `P${baseIndex+1}`, `F${baseIndex+1}`,
            `M${baseIndex+2}`, `P${baseIndex+2}`, `D${baseIndex+2}`
        ];

        coachIds.forEach((coachId, index) => {
            const wheels = [];
            let coachStatus: 'healthy' | 'warning' | 'critical' = 'healthy';

            const positions = ['1U', '2U', '3U', '4U', '1D', '2D', '3D', '4D'];
            
            positions.forEach(pos => {
                const rand = Math.random();
                let status: 'healthy' | 'warning' | 'critical' = 'healthy';
                // Adjust frequency of issues to make the dashboard interesting
                if (rand > 0.98) status = 'critical'; 
                else if (rand > 0.90) status = 'warning';

                const { trend, currentVal } = generateTrendData(status);

                wheels.push({
                    id: `${trainId}-${coachId}-${pos}`,
                    position: pos,
                    status: status,
                    currentVal: currentVal, 
                    trend: trend
                });

                if (status === 'critical') coachStatus = 'critical';
                else if (status === 'warning' && coachStatus !== 'critical') coachStatus = 'warning';
            });

            coaches.push({
                id: coachId, 
                index: index,
                status: coachStatus,
                wheels: wheels
            });

            if (coachStatus === 'critical') trainStatus = 'critical';
            else if (coachStatus === 'warning' && trainStatus !== 'critical') trainStatus = 'warning';
        });

        fleet.push({
            id: trainId,
            status: trainStatus,
            coaches: coaches
        });
    }
    return fleet;
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
        healthy: 'bg-white border-slate-300 text-slate-600 hover:border-indigo-400',
        warning: 'bg-amber-50 border-amber-400 text-amber-700 hover:bg-amber-100',
        critical: 'bg-rose-50 border-rose-500 text-rose-700 hover:bg-rose-100'
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="text-xs font-bold text-slate-400 tracking-widest">{wheel.position}</div>
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
                <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${wheel.status === 'critical' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'}`}>
                    {wheel.status}
                </div>
            )}
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
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setFleetData(generateFleet());
        setIsClient(true);
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
        return issues.sort((a, b) => parseFloat(b.wheel.currentVal) - parseFloat(a.wheel.currentVal)); 
    }, [fleetData, isClient]);

    const handleTrainSelect = (id: string) => {
        setSelectedTrainId(id);
        const train = fleetData.find(t => t.id === id);
        if (train && train.coaches.length > 0) {
            // Default to the first coach when a train is selected
            setSelectedCoachId(train.coaches[0].id);
        }
        setView('TRAIN');
    };

    const handleWheelClick = (wheel: any) => {
        setSelectedWheel(wheel);
    };

    const closeWheelModal = () => {
        setSelectedWheel(null);
    };

    if (!isClient) {
        return null; // or a loading spinner
    }
    
    const renderFleetDashboard = () => {
        const filteredFleet = fleetData.filter(t => 
            t.id.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
            <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <header className="bg-white border-b border-slate-200 p-6 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <Train className="text-indigo-600" /> Fleet Monitoring System
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">Real-time Wheel Wear Analysis • 37 Active Trains</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                                <input 
                                    type="text" 
                                    placeholder="Search TS01..." 
                                    className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 text-xs font-medium">
                                <span className="flex items-center gap-1 px-2 py-1 bg-rose-100 text-rose-700 rounded">
                                    <div className="w-2 h-2 bg-rose-600 rounded-full"></div> Critical
                                </span>
                                <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div> Warning
                                </span>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto p-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            {filteredFleet.map(train => (
                                <button 
                                    key={train.id}
                                    onClick={() => handleTrainSelect(train.id)}
                                    className={`
                                        relative group p-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-3 h-32
                                        ${train.status === 'critical' ? 'bg-rose-50 border-rose-200 hover:bg-rose-100 hover:border-rose-300' : 
                                        train.status === 'warning' ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-300' : 
                                        'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'}
                                    `}
                                >
                                    <div className="flex items-center justify-between w-full absolute top-3 px-3">
                                        <StatusIndicator status={train.status} />
                                        <ChevronRight className={`w-4 h-4 ${train.status === 'critical' ? 'text-rose-400' : 'text-slate-300'}`} />
                                    </div>
                                    <Train className={`w-8 h-8 ${train.status === 'critical' ? 'text-rose-600' : train.status === 'warning' ? 'text-amber-600' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                                    <span className="font-bold text-lg text-slate-700">{train.id}</span>
                                </button>
                            ))}
                        </div>
                    </main>
                </div>

                <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shadow-xl z-10">
                    <div className="p-5 border-b border-slate-100 bg-slate-50">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <AlertTriangle className="text-rose-500 w-5 h-5" /> Action Required
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Wheels exceeding wear limits ({LIMIT_CRITICAL}mm)</p>
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
                                className="p-3 mb-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-sm text-slate-700">{issue.train} <span className="font-normal text-slate-400">/</span> {issue.coach}</span>
                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${issue.wheel.status === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {issue.wheel.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                            {issue.wheel.position}
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-400">Wear Level</div>
                                            <div className="text-sm font-mono font-semibold">{issue.wheel.currentVal}mm</div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
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
        const formationString = `Formation: ${c[0].id}-${c[1].id}-${c[2].id} + ${c[3].id}-${c[4].id}-${c[5].id} + ${c[6].id}-${c[7].id}-${c[8].id}`;

        const wheelsUp = selectedCoachData?.wheels.filter(w => w.position.includes('U')) || [];
        const wheelsDown = selectedCoachData?.wheels.filter(w => w.position.includes('D')) || [];

        return (
            <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
                <div className="flex-1 flex flex-col h-full relative">
                    
                    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 shadow-sm z-10">
                        <button 
                            onClick={() => setView('FLEET')}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="hover:text-indigo-600 cursor-pointer" onClick={() => setView('FLEET')}>Fleet</span>
                            <ChevronRight className="w-4 h-4" />
                            <span className="font-bold text-slate-800 text-lg">{selectedTrainId}</span>
                        </div>
                        <div className="ml-auto flex gap-3">
                            <div className="text-right hidden md:block">
                                <div className="text-xs text-slate-400">Last Inspection</div>
                                <div className="text-sm font-medium text-slate-700">Today, 08:00 AM</div>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto p-6">
                        <section className="mb-8">
                            <div className="flex justify-between items-end mb-3">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
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
                                                        ? 'border-indigo-600 bg-indigo-50 shadow-lg scale-105 z-10' 
                                                        : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow'}
                                                `}
                                            >
                                                <span className={`text-lg font-bold ${selectedCoachId === coach.id ? 'text-indigo-700' : 'text-slate-600'}`}>{coach.id}</span>
                                                <StatusIndicator status={coach.status} />
                                            </button>
                                            
                                            {!isLast && (
                                                <div className="flex items-center justify-center w-8 relative">
                                                    {isUnitCoupler ? (
                                                        <div className="flex flex-col items-center gap-0.5">
                                                            <div className="w-6 h-1.5 bg-slate-800 rounded-full"></div>
                                                            <div className="text-[10px] font-bold text-slate-400">+</div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-4 h-1 bg-slate-300"></div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 min-h-[400px]">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Coach {selectedCoachId} - Wheel Arrangement</h2>
                                    <p className="text-slate-400 text-sm">Select a wheel to view detailed wear analysis</p>
                                </div>
                                <div className="flex gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-slate-200 rounded border border-slate-300"></div>
                                        <span className="text-slate-500">Healthy (&lt;{LIMIT_WARNING}mm)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-amber-100 rounded border border-amber-500"></div>
                                        <span className="text-slate-500">Warning (&gt;{LIMIT_WARNING}mm)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-rose-100 rounded border border-rose-600"></div>
                                        <span className="text-slate-500">Critical (&gt;{LIMIT_CRITICAL}mm)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative max-w-4xl mx-auto">
                                <div className="absolute top-1/2 left-0 w-full h-32 -translate-y-1/2 flex flex-col justify-between pointer-events-none">
                                    <div className="w-full h-2 bg-slate-100 rounded-full"></div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full"></div>
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

                                <div className="absolute -left-12 top-4 text-xs font-bold text-slate-400">UP SIDE</div>
                                <div className="absolute -left-16 bottom-4 text-xs font-bold text-slate-400">DOWN SIDE</div>
                            </div>
                        </section>
                    </main>
                </div>

                {selectedWheel && (
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                            
                            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded">
                                            {selectedTrainId} / {selectedCoachId}
                                        </span>
                                        <h2 className="text-2xl font-bold text-slate-800">Wheel Position {selectedWheel.position}</h2>
                                    </div>
                                    <p className="text-slate-500 text-sm">Current Wear Value: <strong className="text-slate-800">{selectedWheel.currentVal} mm</strong></p>
                                </div>
                                <button onClick={closeWheelModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                    <X className="text-slate-500" />
                                </button>
                            </div>

                            <div className="flex-1 p-6 flex flex-col min-h-0">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-indigo-500" /> Wear Level Trend Analysis
                                    </h3>
                                    <div className="flex gap-4 text-xs">
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-1 bg-rose-500"></div> Condemning Limit ({LIMIT_CRITICAL}mm)
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-1 bg-amber-500"></div> Warning Limit ({LIMIT_WARNING}mm)
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 w-full min-h-0 border border-slate-100 rounded-xl bg-slate-50/50 p-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={selectedWheel.trend}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis 
                                                dataKey="date" 
                                                tick={{fontSize: 12, fill: '#64748b'}} 
                                                tickFormatter={(val) => {
                                                    const d = new Date(val);
                                                    return `${d.getDate()}/${d.getMonth()+1}`;
                                                }}
                                            />
                                            <YAxis 
                                                domain={[30, 36]} 
                                                tick={{fontSize: 12, fill: '#64748b'}} 
                                                label={{ value: 'Wear Depth (mm)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }} 
                                            />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                labelStyle={{ color: '#64748b', marginBottom: '0.5rem' }}
                                            />
                                            
                                            <ReferenceLine y={LIMIT_CRITICAL} stroke="#e11d48" strokeDasharray="4 4" label={{ position: 'right', value: 'Limit', fill: '#e11d48', fontSize: 10 }} />
                                            <ReferenceLine y={LIMIT_WARNING} stroke="#f59e0b" strokeDasharray="4 4" />

                                            {/* Historical Data: now uses specific key */}
                                            <Area 
                                                type="monotone" 
                                                dataKey="valHistory" 
                                                stroke="#4f46e5" 
                                                strokeWidth={3}
                                                fill="url(#colorValue)" 
                                                fillOpacity={0.1}
                                                name="History"
                                            />
                                            
                                            {/* Prediction Data: now uses specific key */}
                                            <Line 
                                                type="monotone" 
                                                dataKey="valPrediction"
                                                stroke="#94a3b8" 
                                                strokeWidth={2} 
                                                strokeDasharray="5 5" 
                                                dot={false}
                                                name="Prediction"
                                            />
                                            
                                            <defs>
                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                                
                                <div className="mt-4 bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex gap-4 items-start">
                                    <Info className="text-indigo-600 w-5 h-5 mt-0.5" />
                                    <div className="text-sm text-slate-700">
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

    