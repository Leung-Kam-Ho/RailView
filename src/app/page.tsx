'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, ReferenceLine, Area, ComposedChart, BarChart, Bar, Cell
} from 'recharts';
import {
    AlertTriangle, Train as TrainIcon, Search, ChevronRight, Activity,
    ArrowLeft, Info, X, RefreshCw, ChevronDown, Download, Menu
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
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
import { Calendar as CalendarIcon } from 'lucide-react';
import { Wheel, Coach, Train, WheelTrendPoint, FilteredCoach } from '@/types/fleet';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { WheelButton } from '@/components/ui/WheelButton';
import { FleetDashboard } from '@/components/views/FleetDashboard';
import { TrainDetail } from '@/components/views/TrainDetail';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- CONSTANTS & LOGIC ---

// THRESHOLDS (Inverted: Higher is worse wear)
const LIMIT_WARNING = 34.0;
const LIMIT_CRITICAL = 35.0;





// Fetch and build the Fleet Structure from MongoDB aggregated data
const fetchFleet = async (date?: Date) => {
    try {
        const fleetDateParam = date ? `?date=${date.toISOString().split('T')[0]}` : '';
        const response = await fetch(`/api/predictions${fleetDateParam}`);
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
                const wheels: Wheel[] = [];
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
                     } else if (meanVal >= LIMIT_WARNING) {
                         status = 'warning';
                     }

                      wheels.push({
                          id: `${trainId}-${coachId}-${wheelId}`,
                          position: wheelId,
                          status: status,
                          currentVal: currentVal,
                          meanVal: record.mean.toFixed(2),
                          trend: [] // Will load on demand
                      });

                    if (status === 'critical') coachStatus = 'critical';
                    else if (status === 'warning' && coachStatus !== 'critical') coachStatus = 'warning';
                }

                const maxWear = Math.max(...wheels.map(w => parseFloat(w.meanVal)));
                const index = coachIds.indexOf(coachId);
                 coaches.push({
                     id: coachId,
                     index: index >= 0 ? index : 0,
                     status: coachStatus,
                     wheels: wheels,
                     maxWear: maxWear
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
const fetchWheelTrend = async (trainId: string, coachId: string, wheelId: string, sampleRate: number = 3, date?: Date) => {
    try {
        const predictionDateParam = date ? `&date=${date.toISOString().split('T')[0]}` : '';
        const response = await fetch(`/api/predictions?train_id=${trainId}&coach_id=${coachId}&wheel_id=${wheelId}${predictionDateParam}`);
        const aggregated: any[] = await response.json();

        // Sort by date
        aggregated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Sample every sampleRate days
        const sampled: WheelTrendPoint[] = [];
        for (let i = 0; i < aggregated.length; i += sampleRate) {
            const r = aggregated[i];
            sampled.push({
                date: new Date(r.date).toISOString().split('T')[0],
                valMean: parseFloat(r.mean),
                valMin: parseFloat(r.min),
                valMax: parseFloat(r.max),
                valStd: parseFloat(r.std),
                actual: null
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
                valStd: parseFloat(latest.std),
                actual: null
            });
        }

        // Fetch actual measurements
        const measurementDateParam = date ? `&date=${date.toISOString().split('T')[0]}` : '';
        const actualResponse = await fetch(`/api/measurements?train_id=${trainId}&coach_id=${coachId}&wheel_id=${wheelId}${measurementDateParam}`);
        const actualSegments: any[][] = await actualResponse.json();

        // Flatten segments into a map date -> sh
        const actualMap: { [key: string]: number } = {};
        actualSegments.forEach(segment => {
            segment.forEach(point => {
                actualMap[point.date] = point.sh;
            });
        });

        // Add actual to sampled data
        sampled.forEach(point => {
            if (actualMap[point.date]) {
                point.actual = actualMap[point.date];
            }
        });

        // Also add actual points that are not in sampled (but only up to selected date)
        const cutoffDate = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        Object.keys(actualMap).forEach(date => {
            if (!sampled.find(p => p.date === date) && date <= cutoffDate) {
                sampled.push({
                    date,
                    valMean: null,
                    valMin: null,
                    valMax: null,
                    valStd: null,
                    actual: actualMap[date]
                });
            }
        });

        // Sort by date again
        sampled.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return sampled;
    } catch (error) {
        console.error('Error fetching wheel trend:', error);
        return [];
    }
};



// --- PDF & SCREENSHOT FUNCTIONS ---

// Helper function to wait for charts to load
const waitForChartsLoad = () => new Promise(resolve => setTimeout(resolve, 3000));

// Capture screenshot of full train view (formation + coach details)
const captureCoachScreenshot = async (trainId: string, coachId: string): Promise<string> => {
    try {
        // Wait for charts to render
        await waitForChartsLoad();
        
        // Capture the main app container (not full body to avoid extra white space)
        const appElement = document.querySelector('div[class*="flex h-screen"]') as HTMLElement;
        if (!appElement) {
            throw new Error('App container not found');
        }
        
        // Get actual dimensions of the app content
        const rect = appElement.getBoundingClientRect();
        
        // Capture the main app area with proper resolution
        const canvas = await html2canvas(appElement, {
            backgroundColor: '#ffffff',
            scale: 2.0, // Optimized scale for quality vs size
            useCORS: true,
            allowTaint: true,
            logging: false,
            width: rect.width,
            height: rect.height,
            scrollX: 0,
            scrollY: 0,
            ignoreElements: (element) => {
                // Ignore overlay elements during screenshot
                const el = element as HTMLElement;
                return el.classList?.contains('fixed') && el.style?.zIndex === '50';
            },
            onclone: (clonedDoc) => {
                // Remove any overlays from cloned document
                const overlays = clonedDoc.querySelectorAll('[style*="z-index: 50"], .fixed');
                overlays.forEach(el => el.remove());
                
                // Ensure proper styling in cloned document
                const clonedApp = clonedDoc.querySelector('div[class*="flex h-screen"]') as HTMLElement;
                if (clonedApp) {
                    clonedApp.style.width = `${rect.width}px`;
                    clonedApp.style.height = `${rect.height}px`;
                }
            }
        });
        
        console.log(`Screenshot dimensions: ${canvas.width}x${canvas.height} for ${trainId}-${coachId}`);
        return canvas.toDataURL('image/png', 0.95); // Slight compression for size
    } catch (error) {
        console.error(`Failed to capture screenshot for ${trainId}-${coachId}:`, error);
        throw error;
    }
};

// Generate PDF from array of screenshots
const generatePDF = async (screenshots: Array<{trainId: string, coachId: string, image: string}>) => {
    const appElement = document.querySelector('div[class*="flex h-screen"]') as HTMLElement;
    if (!appElement) {
        throw new Error('App container not found');
    }
    
    // Get actual dimensions of the app content
    const rect = appElement.getBoundingClientRect();
    // Create a new jsPDF instance in landscape mode with rect dimensions
    const pdf = new jsPDF('landscape', 'pt', [rect.width, rect.height]);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    screenshots.forEach(({image}, index) => {
        if (index > 0) pdf.addPage();
        
        // Scale to fit
        const imgProps = pdf.getImageProperties(image);
        const imgWidth = pageWidth;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        
        // Center horizontally
        const xOffset = (pageWidth - imgWidth) / 2;
        const yOffset = 0;
        
        pdf.addImage(image, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
    });
    
    return pdf.output('blob');
};

// Download file helper
const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// --- COMPONENTS ---





const HomePage = () => {
    const [fleetData, setFleetData] = useState<Train[]>([]);
    const [view, setView] = useState('FLEET');
    const [selectedTrainId, setSelectedTrainId] = useState<string | null>(null);
    const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
    const [selectedWheel, setSelectedWheel] = useState<Wheel | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'trainset' | 'coach'>('coach');
    const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'warning'>('all');
    const [coachTypeFilter, setCoachTypeFilter] = useState<'all' | 'D' | 'P' | 'M' | 'F'>('all');
    const [sortBy, setSortBy] = useState<'status' | 'trainset' | 'wear'>('status');
    const [wheelViewMode, setWheelViewMode] = useState<'compact' | 'detail'>('detail');
    const [wheelTrends, setWheelTrends] = useState<Record<string, any[]>>({});
    const [sampleRate, setSampleRate] = useState<number>(3);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [downloadProgress, setDownloadProgress] = useState<{current: number, total: number, currentTrain?: string, currentCoach?: string, cancelled?: boolean} | null>(null);
    const cancelledRef = useRef(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const isMobile = useIsMobile();

    const getStdColor = (val: number | null) => {
        if (!val || val <= 0.5) return '#6b7280';
        if (val > 0.8) return '#ef4444';
        return '#f59e0b';
    };

    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load trends for all wheels in a coach one by one
    const loadAllWheelTrends = async (coach: Coach) => {
        const newTrends: Record<string, any[]> = {};
        for (const wheel of coach.wheels) {
            const [trainId, coachId, wheelId] = wheel.id.split('-');
            const trend = await fetchWheelTrend(trainId, coachId, wheelId, sampleRate, selectedDate);
            newTrends[wheel.id] = trend;
            setWheelTrends(prev => ({...prev, [wheel.id]: trend}));
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        const data = await fetchFleet(selectedDate);
        setFleetData(data);
        setIsClient(true);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (isClient) {
            loadData();
        }
    }, [selectedDate]);

    const selectedTrainData = useMemo(() =>
        fleetData.find(t => t.id === selectedTrainId),
    [fleetData, selectedTrainId]);

    const selectedCoachData = useMemo(() =>
        selectedTrainData?.coaches.find(c => c.id === selectedCoachId),
    [selectedTrainData, selectedCoachId]);

    useEffect(() => {
        setWheelTrends({}); // Clear trends when sample rate changes
    }, [sampleRate]);

    useEffect(() => {
        if (wheelViewMode === 'detail' && selectedCoachData) {
            loadAllWheelTrends(selectedCoachData);
        }
    }, [wheelViewMode, selectedCoachData, sampleRate]);

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
        return issues.sort((a, b) => parseFloat(b.wheel.meanVal) - parseFloat(a.wheel.meanVal));
    }, [fleetData, isClient]);

    const filteredItems = useMemo(() => {
        if (viewMode === 'trainset') {
            let trains = fleetData.filter(t => t.id.toLowerCase().includes(searchTerm.toLowerCase()) && (statusFilter === 'all' || t.status === statusFilter));
            if (true) {
                trains.sort((a, b) => {
                    const statusOrder = { critical: 3, warning: 2, healthy: 1 };
                    const aOrder = statusOrder[a.status];
                    const bOrder = statusOrder[b.status];
                    if (aOrder !== bOrder) return bOrder - aOrder;
                    return a.id.localeCompare(b.id);
                });
            } else {
                trains.sort((a, b) => a.id.localeCompare(b.id));
            }
            return trains;
        } else {
            let coaches = fleetData.flatMap(t => t.coaches.filter(c => (c.id.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.toLowerCase().includes(searchTerm.toLowerCase())) && (statusFilter === 'all' || c.status === statusFilter) && (coachTypeFilter === 'all' || c.id.startsWith(coachTypeFilter))).map(c => ({ ...c, trainId: t.id, trainStatus: t.status })));
            if (sortBy === 'status') {
                coaches.sort((a, b) => {
                    const statusOrder = { critical: 3, warning: 2, healthy: 1 };
                    const aOrder = statusOrder[a.status];
                    const bOrder = statusOrder[b.status];
                    if (aOrder !== bOrder) return bOrder - aOrder;
                    return b.maxWear - a.maxWear;
                });
            } else if (sortBy === 'trainset') {
                coaches.sort((a, b) => {
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
                    return getSortKey(a.id) - getSortKey(b.id);
                });
            } else if (sortBy === 'wear') {
                coaches.sort((a, b) => b.maxWear - a.maxWear);
            }
            return coaches;
        }
    }, [fleetData, viewMode, searchTerm, statusFilter, coachTypeFilter, sortBy]);

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
        if (!wheelTrends[wheel.id]) {
            const [trainId, coachId, wheelId] = wheel.id.split('-');
            const trend = await fetchWheelTrend(trainId, coachId, wheelId, 3, selectedDate);
            setWheelTrends(prev => ({...prev, [wheel.id]: trend}));
        }
        setSelectedWheel(wheel);
    };

    const downloadAllCoachViews = async () => {
        if (isDownloading) return;
        
        setIsDownloading(true);
        setDownloadProgress({ current: 0, total: fleetData.length, cancelled: false });
        cancelledRef.current = false;
        
        try {
            let totalCoachesProcessed = 0;
            
            // Process each train separately
            for (let trainIndex = 0; trainIndex < fleetData.length; trainIndex++) {
                // Check if cancelled
                if (cancelledRef.current) {
                    break;
                }
                const train = fleetData[trainIndex];
                
                    // Check if cancelled
                    if (cancelledRef.current) {
                        break;
                    }
                    
                    // Update progress for current train
                    setDownloadProgress({ 
                        current: trainIndex + 1, 
                        total: fleetData.length,
                        currentTrain: train.id,
                        currentCoach: 'Starting...',
                        cancelled: false
                    });
                
                try {
                    // Capture screenshots for all coaches in this train
                    const trainScreenshots = [];
                    
                    for (let coachIndex = 0; coachIndex < train.coaches.length; coachIndex++) {
                        const coach = train.coaches[coachIndex];
                        
                        // Check if cancelled
                        if (cancelledRef.current) {
                            break;
                        }
                        
                        setDownloadProgress({ 
                            current: trainIndex + 1, 
                            total: fleetData.length,
                            currentTrain: train.id,
                            currentCoach: `Coach ${coach.id} (${coachIndex + 1}/${train.coaches.length})`,
                            cancelled: false
                        });
                        
                        try {
                            // Navigate to coach detail view
                            setSelectedTrainId(train.id);
                            setSelectedCoachId(coach.id);
                            setView('TRAIN');
                            
                            // Wait for charts to render and capture screenshot
                            const image = await captureCoachScreenshot(train.id, coach.id);
                            trainScreenshots.push({ trainId: train.id, coachId: coach.id, image });
                            
                            // Delay between captures for better quality
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            
                        } catch (error) {
                            console.error(`Failed to capture ${train.id}-${coach.id}:`, error);
                            // Continue with next coach even if one fails
                        }
                    }
                    
                    // Generate and download PDF for this specific train
                    if (trainScreenshots.length > 0) {
                        const pdfBlob = await generatePDF(trainScreenshots);
                        const filename = `train-${train.id}-all-coaches-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.pdf`;
                        downloadFile(pdfBlob, filename);
                        
                        totalCoachesProcessed += trainScreenshots.length;
                        console.log(`Downloaded PDF for ${train.id} with ${trainScreenshots.length} coaches`);
                    }
                    
                    // Delay between trains to prevent browser overload
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                } catch (error) {
                    console.error(`Failed to process train ${train.id}:`, error);
                    // Continue with next train
                }
            }
            
            if (cancelledRef.current) {
                alert('Screenshot capture was cancelled.');
            } else if (totalCoachesProcessed === 0) {
                alert('No screenshots were captured. Please try again.');
            } else {
                alert(`Successfully downloaded ${fleetData.length} PDF files with ${totalCoachesProcessed} total coach views!`);
            }
            
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download coach views. Please try again.');
        } finally {
            setIsDownloading(false);
            setDownloadProgress(null);
        }
    };

    const closeWheelModal = () => {
        setSelectedWheel(null);
    };

    const cancelDownload = () => {
        cancelledRef.current = true;
        setDownloadProgress(prev => prev ? {...prev, cancelled: true} : null);
    };

    if (!isClient || isLoading) {
        return (
            <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-900 items-center justify-center overflow-x-hidden">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">Loading fleet data...</p>
                </div>
            </div>
        );
    }
    
    

    // Progress Overlay
    const renderProgressOverlay = () => {
        if (!downloadProgress) return null;
        
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 md:p-6 max-w-md w-full mx-4 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                        <h3 className="text-base md:text-lg font-semibold text-slate-800 dark:text-slate-200">
                            Downloading Coach Views
                        </h3>
                    </div>
                    
                    <div className="mb-2">
                         <div className="flex justify-between text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-1">
                            <span>Trains</span>
                            <span>{downloadProgress.current} / {downloadProgress.total}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    
                    {downloadProgress.currentTrain && (
                         <div className="mb-4 p-2 md:p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <div className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">
                                Current Train: {downloadProgress.currentTrain}
                            </div>
                            <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                                Processing: {downloadProgress.currentCoach || 'Starting...'}
                            </div>
                        </div>
                    )}
                    
                    <div className="flex gap-3 mt-4">
                         <button
                             onClick={cancelDownload}
                             className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 md:px-4 py-2 rounded-lg transition-colors text-sm"
                         >
                             Cancel
                         </button>
                    </div>
                    
                     <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-3">
                        Capturing full viewport screenshots (formation + coach details)... This may take several minutes.
                    </p>
                </div>
            </div>
        );
    };

    // Main Render Switch
    
    const allProps = {
        fleetData, setFleetData, view, setView, selectedTrainId, setSelectedTrainId, selectedCoachId, setSelectedCoachId, selectedWheel, setSelectedWheel, searchTerm, setSearchTerm, viewMode, setViewMode, statusFilter, setStatusFilter, coachTypeFilter, setCoachTypeFilter, sortBy, setSortBy, wheelViewMode, setWheelViewMode, wheelTrends, setWheelTrends, sampleRate, setSampleRate, selectedDate, setSelectedDate, downloadProgress, setDownloadProgress, cancelledRef, isDownloading, setIsDownloading, isSidebarOpen, setIsSidebarOpen, isMobile, getStdColor, isClient, setIsClient, isLoading, setIsLoading, loadAllWheelTrends, loadData, selectedTrainData, selectedCoachData, criticalIssues, filteredItems, filteredCriticalCount, filteredWarningCount, handleTrainSelect, handleWheelClick, downloadAllCoachViews, closeWheelModal, cancelDownload
    };

    return (
        <>
            {renderProgressOverlay()}
            <div className="relative">
                {view === 'FLEET' ? <FleetDashboard {...allProps} /> : <TrainDetail {...allProps} />}
                {isMobile && isSidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </div>
        </>
    );
};

export default HomePage;
