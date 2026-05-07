import React from 'react';
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

export const FleetDashboard = (props: any) => {
    const { fleetData, setFleetData, view, setView, selectedTrainId, setSelectedTrainId, selectedCoachId, setSelectedCoachId, selectedWheel, setSelectedWheel, searchTerm, setSearchTerm, viewMode, setViewMode, statusFilter, setStatusFilter, coachTypeFilter, setCoachTypeFilter, sortBy, setSortBy, wheelViewMode, setWheelViewMode, wheelTrends, setWheelTrends, sampleRate, setSampleRate, selectedDate, setSelectedDate, downloadProgress, setDownloadProgress, cancelledRef, isDownloading, setIsDownloading, isSidebarOpen, setIsSidebarOpen, isMobile, getStdColor, isClient, setIsClient, isLoading, setIsLoading, loadAllWheelTrends, loadData, selectedTrainData, selectedCoachData, criticalIssues, filteredItems, filteredCriticalCount, filteredWarningCount, handleTrainSelect, handleWheelClick, downloadAllCoachViews, closeWheelModal, cancelDownload } = props;

        const filteredFleet = fleetData.filter((t: any) => 
            t.id.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
            <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 overflow-x-hidden">
                <div className="flex-1 flex flex-col min-h-screen w-full overflow-x-hidden">
                    <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-2 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4 w-full">
                             <div className="flex items-center justify-between w-full flex-wrap gap-2">
                                 <div className="flex items-center gap-1 md:gap-3">
                                     <button
                                         onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                         className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors md:hidden"
                                     >
                                         <Menu className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                     </button>
                                     <div className="min-w-0 flex-1">
                                         <h1 className="text-base md:text-xl lg:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1 md:gap-2 truncate">
                                             <TrainIcon className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 flex-shrink-0" /> <span className="truncate">{'RailView'}</span>
                                         </h1>
                                         {selectedDate && (
                                             <p className="text-[9px] md:text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                                                 {format(selectedDate, 'PPP')}
                                             </p>
                                         )}
                                     </div>
                                 </div>
                             </div>
                         <div className="flex items-center gap-1 md:gap-3 flex-wrap w-full md:w-auto">
                                <div className="relative flex-1 min-w-0">
                                    <Search className="absolute left-2 top-2 text-slate-400 dark:text-slate-500 w-3 h-3" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="pl-7 pr-2 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full text-xs md:text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                               
                                <Popover>
                                    <PopoverTrigger asChild>
                             <button
                                        className="flex items-center gap-1 px-1.5 md:px-3 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[10px] md:text-xs"
                                    >
                                        <CalendarIcon className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                        <span className="hidden sm:inline">{selectedDate ? format(selectedDate, 'PPP') : 'Date'}</span>
                                    </button>
                                    </PopoverTrigger>
                                   <PopoverContent className="w-auto p-0" align="start">
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
                                    className="px-2 md:px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-[10px] md:text-xs font-medium"
                                >
                                    Today
                                </button>
                                 <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'trainset' | 'coach')}>
                                     <TabsList className="grid w-full grid-cols-2 text-[10px] md:text-xs">
                                         <TabsTrigger value="trainset">Train</TabsTrigger>
                                         <TabsTrigger value="coach">Coach</TabsTrigger>
                                     </TabsList>
                                 </Tabs>

                                <button
                                    onClick={loadData}
                                    disabled={isLoading}
                                    className="px-1.5 md:px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-[10px] md:text-xs font-medium flex items-center gap-1"
                                >
                                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                                    <span className="hidden md:inline">{isLoading ? 'Fetching...' : 'Fetch'}</span>
                                </button>
                                 
                                <button
                                    onClick={downloadAllCoachViews}
                                    disabled={isDownloading || fleetData.length === 0}
                                    className="px-1.5 md:px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-[10px] md:text-xs font-medium flex items-center gap-1"
                                >
                                    <Download className={`w-3 h-3 ${isDownloading ? 'animate-pulse' : ''}`} />
                                    <span className="hidden md:inline">{downloadProgress ? `Train ${downloadProgress.current}/${downloadProgress.total}` : 'Download All'}</span>
                                </button>
                         </div>
                     </header>

                       <div className="px-2 md:px-6 py-1.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] md:text-xs text-slate-500 dark:text-slate-400 flex justify-between items-center flex-wrap gap-2">
                           <div className="truncate">
                             Critical: {filteredCriticalCount} | Warning: {filteredWarningCount}
                           </div>
                           <div className="flex gap-1 md:gap-2 items-center flex-wrap">
                               <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden text-[10px] font-medium">
                                   <button onClick={() => setStatusFilter('all')} className={`flex items-center gap-0.5 px-2 py-1 border-r border-slate-300 dark:border-slate-600 transition-colors ${statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>All</button>
                                   <button onClick={() => setStatusFilter('critical')} className={`flex items-center gap-0.5 px-2 py-1 border-r border-slate-300 dark:border-slate-600 transition-colors ${statusFilter === 'critical' ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950'}`}>
                                       <div className="w-1.5 h-1.5 bg-rose-600 rounded-full"></div> Crit
                                   </button>
                                   <button onClick={() => setStatusFilter('warning')} className={`flex items-center gap-0.5 px-2 py-1 transition-colors ${statusFilter === 'warning' ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950'}`}>
                                       <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div> Warn
                                   </button>
                              </div>
                               {viewMode === 'coach' && (
                                   <>
                                        <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden text-[10px] font-medium">
                                            <button onClick={() => setCoachTypeFilter('all')} className={`flex items-center gap-0.5 px-2 py-1 border-r border-slate-300 dark:border-slate-600 transition-colors ${coachTypeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>All</button>
                                            <button onClick={() => setCoachTypeFilter('D')} className={`flex items-center gap-0.5 px-2 py-1 border-r border-slate-300 dark:border-slate-600 transition-colors ${coachTypeFilter === 'D' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>D</button>
                                            <button onClick={() => setCoachTypeFilter('P')} className={`flex items-center gap-0.5 px-2 py-1 border-r border-slate-300 dark:border-slate-600 transition-colors ${coachTypeFilter === 'P' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>P</button>
                                            <button onClick={() => setCoachTypeFilter('M')} className={`flex items-center gap-0.5 px-2 py-1 border-r border-slate-300 dark:border-slate-600 transition-colors ${coachTypeFilter === 'M' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>M</button>
                                            <button onClick={() => setCoachTypeFilter('F')} className={`flex items-center gap-0.5 px-2 py-1 transition-colors ${coachTypeFilter === 'F' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>F</button>
                                        </div>
                                       <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-medium flex items-center gap-1 ml-2">
                                                    Sort By: {sortBy === 'status' ? 'Status' : sortBy === 'trainset' ? 'Trainset' : 'Wear (Highest First)'}
                                                    <ChevronDown className="w-3 h-3" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuRadioGroup value={sortBy} onValueChange={(value) => setSortBy(value as 'status' | 'trainset' | 'wear')}>
                                                    <DropdownMenuRadioItem value="status">Status</DropdownMenuRadioItem>
                                                    <DropdownMenuRadioItem value="trainset">Trainset</DropdownMenuRadioItem>
                                                    <DropdownMenuRadioItem value="wear">Wear (Highest First)</DropdownMenuRadioItem>
                                                </DropdownMenuRadioGroup>
                                            </DropdownMenuContent>
                                       </DropdownMenu>
                                   </>
                               )}
                          </div>
                      </div>

                    <main className="flex-1 overflow-x-hidden overflow-y-auto p-2 md:p-6">
                          {viewMode === 'trainset' ? (
                              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-1 md:gap-2 lg:gap-3 xl:gap-4 p-1 md:p-0 w-full">
                                  {(filteredItems as Train[]).map(train => (
                                     <button
                                         key={train.id}
                                         onClick={() => handleTrainSelect(train.id)}
                                         className={`
                                              relative group p-2 md:p-3 lg:p-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-1 md:gap-2 lg:gap-3 h-24 md:h-28 lg:h-32
                                             ${train.status === 'critical' ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/50 hover:bg-rose-100 dark:hover:bg-rose-950 hover:border-rose-300 dark:hover:border-rose-800' :
                                             train.status === 'warning' ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-950 hover:border-amber-300 dark:hover:border-amber-800' :
                                             'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-950 hover:border-green-300 dark:hover:border-green-800'}
                                         `}
                                     >
                                         <div className="flex items-center justify-between w-full absolute top-3 px-3">
                                             <StatusIndicator status={train.status} />
                                             <ChevronRight className={`w-4 h-4 ${train.status === 'critical' ? 'text-rose-400' : 'text-slate-300 dark:text-slate-600'}`} />
                                         </div>
                                         <TrainIcon className={`w-8 h-8 ${train.status === 'critical' ? 'text-rose-600' : train.status === 'warning' ? 'text-amber-600' : 'text-green-600 group-hover:text-green-700'}`} />
                                         <span className="font-bold text-lg text-slate-700 dark:text-slate-300">{train.id}</span>
                                     </button>
                                 ))}
                             </div>
                          ) : (
                               <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-1 md:gap-2 lg:gap-3 xl:gap-4 p-1 md:p-0 w-full">
                                   {(filteredItems as FilteredCoach[]).map(coach => (
                                         <button
                                             key={`${coach.trainId}-${coach.id}`}
                                             onClick={() => { setSelectedTrainId(coach.trainId); setSelectedCoachId(coach.id); setView('TRAIN'); }}
                                             className={`
                                                 relative group p-3 md:p-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-2 md:gap-3 h-28 md:h-32
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
                                                  {coach.status !== 'healthy' && <div className="text-xs font-mono text-slate-600 dark:text-slate-400 mt-1">{coach.maxWear.toFixed(2)}mm</div>}
                                              </div>
                                         </button>
                                     ))}
                             </div>
                         )}
                     </main>
                </div>

                <div className={`${isMobile ? 'fixed inset-y-0 right-0 w-72 sm:w-80' : 'w-80'} bg-white dark:bg-slate-950 border-l ${isMobile ? 'border-l-0' : 'border-l border-slate-200 dark:border-slate-800'} flex flex-col min-h-screen shadow-xl z-20 transform transition-transform duration-300 ${isMobile && !isSidebarOpen ? 'translate-x-full' : 'translate-x-0'}`}>
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                        <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <AlertTriangle className="text-rose-500 w-5 h-5" /> Action Required
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Wheels requiring attention ({LIMIT_WARNING}mm+)</p>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2">
                        {criticalIssues.map((issue: any, idx: number) => (
                            <div 
                                key={idx} 
                                onClick={() => {
                                    handleTrainSelect(issue.train);
                                    setSelectedCoachId(issue.coach);
                                    handleWheelClick(issue.wheel);
                                }}
                                className={`border-l-4 ${issue.wheel.status === 'critical' ? 'border-l-rose-500' : 'border-l-amber-500'} bg-white dark:bg-slate-800 p-3 mb-2 rounded-r-lg cursor-pointer transition-colors group`}
                            >
                                <div className="flex justify-between items-center">
                                     <div>
                                         <div className="font-semibold text-slate-700 dark:text-slate-300">{issue.train} / {issue.coach} - {issue.wheel.position}</div>
                                          <div className="text-lg font-mono font-bold text-slate-800 dark:text-slate-200">{issue.wheel.meanVal}mm <span className="text-xs text-slate-500">Mean Wear</span></div>
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
