import React, { useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, ReferenceLine, Area, ComposedChart, BarChart, Bar, Cell
} from 'recharts';
import {
    AlertTriangle, Train as TrainIcon, Search, ChevronRight, Activity,
    ArrowLeft, Info, X, RefreshCw, ChevronDown, Download, Menu, Calendar as CalendarIcon
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Wheel, Coach, Train, WheelTrendPoint, FilteredCoach } from '@/types/fleet';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { WheelButton } from '@/components/ui/WheelButton';

const LIMIT_WARNING = 34.0;
const LIMIT_CRITICAL = 35.0;

export const TrainDetail = (props: any) => {
    const { fleetData, setFleetData, view, setView, selectedTrainId, setSelectedTrainId, selectedCoachId, setSelectedCoachId, selectedWheel, setSelectedWheel, searchTerm, setSearchTerm, viewMode, setViewMode, statusFilter, setStatusFilter, coachTypeFilter, setCoachTypeFilter, sortBy, setSortBy, wheelViewMode, setWheelViewMode, wheelTrends, setWheelTrends, sampleRate, setSampleRate, selectedDate, setSelectedDate, downloadProgress, setDownloadProgress, cancelledRef, isDownloading, setIsDownloading, isSidebarOpen, setIsSidebarOpen, isMobile, getStdColor, isClient, setIsClient, isLoading, setIsLoading, loadAllWheelTrends, loadData, selectedTrainData, selectedCoachData, criticalIssues, filteredItems, filteredCriticalCount, filteredWarningCount, handleTrainSelect, handleWheelClick, downloadAllCoachViews, closeWheelModal, cancelDownload } = props;

    const [showMinMax, setShowMinMax] = useState(true);
    const [showStd, setShowStd] = useState(true);

        if (!selectedTrainData) return null;

        const c = selectedTrainData.coaches;
        const formationString = `Formation: ${c.map((co: any) => co.id).join(' - ')}`;

        const wheelsUp = selectedCoachData?.wheels.filter((w: any) => w.position.includes('U')) || [];
        const wheelsDown = selectedCoachData?.wheels.filter((w: any) => w.position.includes('D')) || [];

        return (
            <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-900 font-sans overflow-x-hidden">
                <div className="flex-1 flex flex-col min-h-screen w-full relative overflow-x-hidden">
                    
                    <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-3 md:px-6 py-2 md:py-4 flex items-center gap-1 md:gap-4 shadow-sm z-10 flex-wrap w-full">
                        <button 
                            onClick={() => setView('FLEET')}
                            className="p-1.5 md:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <div className="flex items-center gap-0.5 md:gap-1 text-[10px] md:text-xs text-slate-500 dark:text-slate-400 min-w-0 flex-1">
                            <span className="hover:text-indigo-600 cursor-pointer truncate" onClick={() => setView('FLEET')}>Fleet</span>
                            <ChevronRight className="w-2 h-2 md:w-3 md:h-3 flex-shrink-0" />
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs md:text-sm md:text-base truncate">{selectedTrainId}</span>
                        </div>
                        <div className="ml-auto flex gap-1 md:gap-2 items-center flex-wrap">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        className="flex items-center gap-2 px-2 md:px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs md:text-sm"
                                    >
                                        <CalendarIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                        {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(date) => {
                                            setSelectedDate(date);
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            
                            <button
                                onClick={() => setSelectedDate(new Date())}
                                className="px-1.5 md:px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-[10px] md:text-xs font-medium"
                            >
                                Today
                            </button>
                            
                            <div className="text-right hidden md:block">
                                <div className="text-xs text-slate-400 dark:text-slate-500">Last Inspection</div>
                                <div className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">Today, 08:00 AM</div>
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
                             <div className="flex gap-1 md:gap-2 overflow-x-auto pb-4 md:pb-6 pt-2 px-2">
                                {selectedTrainData.coaches.map((coach: any, index: number) => {
                                    const isUnitCoupler = index === 2 || index === 5;
                                    const isLast = index === 8;

                                    return (
                                        <div className="flex items-center" key={coach.id}>
                                             <button
                                                 onClick={() => setSelectedCoachId(coach.id)}
                                                 className={`
                                                     flex-1 min-w-[48px] xs:min-w-[56px] sm:min-w-[64px] md:min-w-[80px] h-16 xs:h-18 sm:h-20 md:h-24 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-0.5 md:gap-2 relative
                                                     ${selectedCoachId === coach.id 
                                                         ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 shadow-lg scale-105 z-10' 
                                                         : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow'}
                                                 `}
                                             >
                                                 <span className={`text-xs sm:text-sm md:text-lg font-bold ${selectedCoachId === coach.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300'} truncate`}>{coach.id}</span>
                                                <StatusIndicator status={coach.status} />
                                            </button>
                                            
                                              {!isLast && (
                                                 <div className="flex items-center justify-center w-4 md:w-8 relative">
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

                          <section id="coach-detail-section" className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 md:p-8 flex-1 overflow-y-auto">
                              <div className="flex justify-between items-start mb-8">
                                  <div className="flex items-center gap-4">
                                      <div>
                                           <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-200">Coach {selectedCoachId} - Wheel Arrangement</h2>
                                          <p className="text-slate-400 dark:text-slate-500 text-sm">{wheelViewMode === 'compact' ? 'Select a wheel to view detailed wear analysis' : 'All wheel wear trends'}</p>
                                      </div>
                                       <Tabs value={wheelViewMode} onValueChange={(value) => setWheelViewMode(value as 'compact' | 'detail')}>
                                           <TabsList>
                                               <TabsTrigger value="compact">Compact</TabsTrigger>
                                               <TabsTrigger value="detail">Detail</TabsTrigger>
                                           </TabsList>
                                       </Tabs>
                                       <div className="flex items-center gap-4">
                                           <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                               <input 
                                                   type="checkbox" 
                                                   id="showMinMax" 
                                                   checked={showMinMax} 
                                                   onChange={(e) => setShowMinMax(e.target.checked)} 
                                                   className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                               />
                                               <label htmlFor="showMinMax" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                                                   Show Min/Max
                                               </label>
                                           </div>
                                           <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                               <input 
                                                   type="checkbox" 
                                                   id="showStd" 
                                                   checked={showStd} 
                                                   onChange={(e) => setShowStd(e.target.checked)} 
                                                   className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                               />
                                               <label htmlFor="showStd" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                                                   Show Std Dev
                                               </label>
                                           </div>
                                           <DropdownMenu>
                                               <DropdownMenuTrigger asChild>
                                                   <button className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-medium flex items-center gap-1">
                                                       Sample Rate: {sampleRate}
                                                       <ChevronDown className="w-3 h-3" />
                                                   </button>
                                               </DropdownMenuTrigger>
                                               <DropdownMenuContent>
                                                   <DropdownMenuRadioGroup value={sampleRate.toString()} onValueChange={(value) => setSampleRate(parseInt(value))}>
                                                       <DropdownMenuRadioItem value="1">1 day</DropdownMenuRadioItem>
                                                       <DropdownMenuRadioItem value="3">3 days</DropdownMenuRadioItem>
                                                       <DropdownMenuRadioItem value="7">7 days</DropdownMenuRadioItem>
                                                       <DropdownMenuRadioItem value="15">15 days</DropdownMenuRadioItem>
                                                       <DropdownMenuRadioItem value="30">30 days</DropdownMenuRadioItem>
                                                   </DropdownMenuRadioGroup>
                                               </DropdownMenuContent>
                                           </DropdownMenu>
                                       </div>
                                   </div>

                                      <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-4 text-[10px] md:text-xs">
                                          <div className="flex items-center gap-1 md:gap-2 min-w-0">
                                              <div className="w-2 h-2 md:w-3 md:h-3 bg-slate-200 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 flex-shrink-0"></div>
                                              <span className="text-slate-500 dark:text-slate-400 truncate">
                                                <span className="hidden sm:inline">Healthy (&lt;{LIMIT_WARNING}mm)</span>
                                                <span className="sm:hidden">Hlt;{LIMIT_WARNING}</span>
                                              </span>
                                          </div>
                                          <div className="flex items-center gap-1 md:gap-2 min-w-0">
                                              <div className="w-2 h-2 md:w-3 md:h-3 bg-amber-100 dark:bg-amber-950 rounded border border-amber-500 dark:border-amber-700 flex-shrink-0"></div>
                                              <span className="text-slate-500 dark:text-slate-400 truncate">
                                                <span className="hidden sm:inline">Warning (&gt;{LIMIT_WARNING}mm)</span>
                                                <span className="sm:hidden">Wgt;{LIMIT_WARNING}</span>
                                              </span>
                                          </div>
                                          <div className="flex items-center gap-1 md:gap-2 min-w-0">
                                              <div className="w-2 h-2 md:w-3 md:h-3 bg-rose-100 dark:bg-rose-950 rounded border border-rose-600 dark:border-rose-700 flex-shrink-0"></div>
                                              <span className="text-slate-500 dark:text-slate-400 truncate">
                                                <span className="hidden sm:inline">Critical (&gt;{LIMIT_CRITICAL}mm)</span>
                                                <span className="sm:hidden">Cgt;{LIMIT_CRITICAL}</span>
                                              </span>
                                          </div>
                                      </div>

                              </div>

                              {wheelViewMode === 'compact' ? (
                                  <div className="relative w-full max-w-4xl mx-auto">
                                      <div className="absolute top-1/2 left-0 w-full h-20 md:h-32 -translate-y-1/2 flex flex-col justify-between pointer-events-none">
                                          <div className="w-full h-1 md:h-2 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                          <div className="w-full h-1 md:h-2 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                      </div>

                                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 md:gap-8 relative z-0">
                                          {[0, 1, 2, 3].map(idx => {
                                              const upWheel = wheelsUp.find((w: any) => w.position === `${idx+1}U`);
                                              const downWheel = wheelsDown.find((w: any) => w.position === `${idx+1}D`);

                                              return (
                                                  <div key={idx} className="flex flex-col gap-8 xs:gap-10 sm:gap-12 md:gap-24 items-center">
                                                      {upWheel && <WheelButton wheel={upWheel} onClick={() => handleWheelClick(upWheel)} />}
                                                      {downWheel && <WheelButton wheel={downWheel} onClick={() => handleWheelClick(downWheel)} />}
                                                  </div>
                                              )
                                          })}
                                      </div>

                                      <div className="absolute -left-4 xs:-left-6 md:-left-12 top-1 md:top-4 text-[8px] xs:text-[9px] md:text-xs font-bold text-slate-400 dark:text-slate-500">UP SIDE</div>
                                      <div className="absolute -left-5 xs:-left-7 md:-left-16 bottom-1 md:bottom-4 text-[8px] xs:text-[9px] md:text-xs font-bold text-slate-400 dark:text-slate-500">DOWN SIDE</div>
                                  </div>
                             ) : (
                                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-1">
                                     {selectedCoachData?.wheels.sort((a: any, b: any) => {
                                         const aIsU = a.position.includes('U');
                                         const bIsU = b.position.includes('U');
                                         if (aIsU && !bIsU) return -1;
                                         if (!aIsU && bIsU) return 1;
                                         const aNum = parseInt(a.position);
                                         const bNum = parseInt(b.position);
                                         return aNum - bNum;
                                     }).map((wheel: any) => (
                                             <div key={wheel.id} className="bg-slate-50 dark:bg-slate-800 pl-1 pt-3 md:pt-4 pr-1 pb-3 md:pb-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                              <div className="flex items-center justify-center gap-1 md:gap-2 mb-2">
                                                  <div className="text-xs md:text-sm font-bold">{wheel.position}</div>
                                                  <StatusIndicator status={wheel.status} size="sm" />
                                                  {wheel.status !== 'healthy' && (
                                                      <div className={`text-[8px] md:text-[10px] font-bold uppercase px-1 py-0.5 rounded ${wheel.status === 'critical' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'}`}>
                                                          {wheel.status}
                                                      </div>
                                                  )}
                                              </div>
                                                <div className="h-32 xs:h-36 sm:h-40 md:h-48 flex items-center justify-center">
                                                   {(wheelTrends[wheel.id] && wheelTrends[wheel.id].length > 0) ? (
                                                        <ResponsiveContainer width="95%" height="95%">
                                                              <ComposedChart data={wheelTrends[wheel.id]} margin={{ top: 1, right: 1, left: 1, bottom: 1 }}>
                                                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                                                <XAxis
                                                                    dataKey="date"
                                                                    tick={{fontSize: 8, fill: 'hsl(var(--muted-foreground))'}}
                                                                    tickFormatter={(val) => {
                                                                        const d = new Date(val);
                                                                        return d.getDate().toString();
                                                                    }}
                                                                    tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                                                                    axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                                                                />
                                                                 <YAxis
                                                                     domain={[30, 36]}
                                                                     tick={{fontSize: 8, fill: 'hsl(var(--muted-foreground))'}}
                                                                     tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                                                                     axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                                                                     width={20}
                                                                 />
                                                                 {showStd && <YAxis
                                                                     yAxisId="std"
                                                                     orientation="right"
                                                                     domain={[0, 2]}
                                                                     tick={{fontSize: 7, fill: 'hsl(var(--muted-foreground))'}}
                                                                     tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                                                                     axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                                                                     width={25}
                                                                 />}
                                                              <Tooltip
                                                                  formatter={(value, name) => [typeof value === 'number' ? value.toFixed(3) : value, name]}
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
                                                              <ReferenceLine y={LIMIT_CRITICAL} stroke="#e11d48" strokeDasharray="2 2" />
                                                              <ReferenceLine y={LIMIT_WARNING} stroke="#f59e0b" strokeDasharray="2 2" />
                                                               <Line
                                                                   type="monotone"
                                                                   dataKey="valMean"
                                                                   stroke="#f97316"
                                                                   strokeWidth={1}
                                                                   dot={false}
                                                                   name="Mean"
                                                                   animationDuration={0}
                                                                   connectNulls={true}
                                                               />
                                                               {showMinMax && <Line
                                                                   type="monotone"
                                                                   dataKey="valMin"
                                                                   stroke="#3b82f6"
                                                                   strokeWidth={1}
                                                                   dot={false}
                                                                   name="Min"
                                                                   animationDuration={0}
                                                                   connectNulls={true}
                                                               />}
                                                               {showMinMax && <Line
                                                                   type="monotone"
                                                                   dataKey="valMax"
                                                                   stroke="#ef4444"
                                                                   strokeWidth={1}
                                                                   dot={false}
                                                                   name="Max"
                                                                   animationDuration={0}
                                                                   connectNulls={true}
                                                               />}
                                                                  <Line
                                                                      type="monotone"
                                                                      dataKey="actual"
                                                                      stroke="#22c55e"
                                                                      strokeWidth={1}
                                                                      dot={{ fill: '#22c55e', r: 1 }}
                                                                      name="Actual SH"
                                                                      animationDuration={0}
                                                                      connectNulls={false}
                                                                  />
                                                                 {showStd && <Bar
                                                                     dataKey="valStd"
                                                                     yAxisId="std"
                                                                     name="Std Dev"
                                                                 >
                                                                     {wheelTrends[wheel.id].map((entry: any, index: number) => (
                                                                         <Cell key={`cell-${index}`} fill={getStdColor(entry.valStd)} />
                                                                     ))}
                                                                 </Bar>}
                                                           </ComposedChart>
                                                      </ResponsiveContainer>
                                                 ) : (
                                                      <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 text-[10px]">Loading...</div>
                                                 )}
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             )}
                        </section>
                    </main>
                </div>

                 {selectedWheel && (
                      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-2">
                          <div className="bg-white dark:bg-slate-900 rounded-xl md:rounded-2xl shadow-2xl w-[95vw] md:w-[90vw] h-[95vh] md:h-[85vh] flex flex-col overflow-hidden animate-in fade-in-95 duration-300">
                            
                            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-900/50">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-1 rounded">
                                            {selectedTrainId} / {selectedCoachId}
                                        </span>
                                        <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-200">Wheel Position {selectedWheel.position}</h2>
                                    </div>
                                     <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm">Current Wear Value: <strong className="text-slate-800 dark:text-slate-200">{selectedWheel.currentVal} mm</strong></p>
                                </div>
                                <button onClick={closeWheelModal} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                                    <X className="text-slate-500 dark:text-slate-400" />
                                </button>
                            </div>

                             <div className="flex-1 p-4 md:p-6 flex flex-col min-h-0">
                                <div className="flex justify-between items-center mb-4">
                                     <h3 className="text-sm md:text-base font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                         <Activity className="w-3 h-3 md:w-4 md:h-4 text-indigo-500" /> Wear Level Trend Analysis
                                     </h3>
                                      <div className="flex flex-wrap gap-2 md:gap-4 text-xs text-slate-500 dark:text-slate-400">
                                         <div className="flex items-center gap-1">
                                             <div className="w-3 h-1 bg-rose-500"></div> Condemning Limit ({LIMIT_CRITICAL}mm)
                                         </div>
                                         <div className="flex items-center gap-1">
                                             <div className="w-3 h-1 bg-amber-500"></div> Warning Limit ({LIMIT_WARNING}mm)
                                         </div>
                                         <div className="flex items-center gap-1">
                                             <div className="w-3 h-1 bg-green-500"></div> Actual SH
                                         </div>
                                     </div>
                                </div>

                                 <div className="flex-1 w-full min-h-0 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-black/20 p-4">
                                     {(wheelTrends[selectedWheel.id] && wheelTrends[selectedWheel.id].length > 0) ? (
                                          <ResponsiveContainer width="100%" height="100%">
                                              <ComposedChart data={wheelTrends[selectedWheel.id]} margin={{ top: 10, right: 40, left: 10, bottom: 10 }}>
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
                                                  {showStd && <YAxis
                                                      yAxisId="std"
                                                      orientation="right"
                                                      domain={[0, 2]}
                                                      tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))'}}
                                                      label={{ value: 'Daily Std (mm)', angle: 90, position: 'insideRight', style: { fill: 'hsl(var(--muted-foreground))' } }}
                                                      tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                                                      axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                                                      width={45}
                                                  />}
                                                   <Tooltip
                                                       formatter={(value, name) => [typeof value === 'number' ? value.toFixed(3) : value, name]}
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
                                                         animationDuration={0}
                                                         connectNulls={true}
                                                     />

                                                    {/* Min line */}
                                                    {showMinMax && <Line
                                                        type="monotone"
                                                        dataKey="valMin"
                                                        stroke="#3b82f6" // blue
                                                        strokeWidth={2}
                                                        dot={false}
                                                        name="Min"
                                                         animationDuration={0}
                                                         connectNulls={true}
                                                    />}

                                                    {/* Max line */}
                                                    {showMinMax && <Line
                                                        type="monotone"
                                                        dataKey="valMax"
                                                        stroke="#ef4444" // red
                                                        strokeWidth={2}
                                                        dot={false}
                                                        name="Max"
                                                         animationDuration={0}
                                                         connectNulls={true}
                                                    />}

                                                    {/* Actual line */}
                                                    <Line
                                                        type="monotone"
                                                        dataKey="actual"
                                                        stroke="#22c55e" // green
                                                        strokeWidth={2}
                                                        dot={{ fill: '#22c55e', r: 2 }}
                                                        name="Actual SH"
                                                        animationDuration={0}
                                                        connectNulls={false}
                                                    />

                                                    {showStd && <Bar
                                                        dataKey="valStd"
                                                        yAxisId="std"
                                                        name="Std Dev"
                                                    >
                                                        {wheelTrends[selectedWheel.id].map((entry: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={getStdColor(entry.valStd)} />
                                                        ))}
                                                    </Bar>}

                                             </ComposedChart>
                                         </ResponsiveContainer>
                                     ) : (
                                         <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">Loading trend data...</div>
                                     )}
                                 </div>
                                
                                 <div className="mt-2 md:mt-4 bg-indigo-50 dark:bg-indigo-950/40 p-3 md:p-4 rounded-lg border border-indigo-100 dark:border-indigo-900 flex gap-2 md:gap-4 items-start">
                                    <Info className="text-indigo-600 dark:text-indigo-400 w-5 h-5 mt-0.5" />
                                     <div className="text-xs md:text-sm text-slate-700 dark:text-slate-300">
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
