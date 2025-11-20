'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { generateWearData, getProjectedWearData } from '@/lib/data';
import type { WearDataPoint } from '@/lib/types';
import { getAnomalyDetection, getWearTrendSummary } from '@/app/actions';
import { AlertCircle, Bot, LineChart as LineChartIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

interface WheelDetailsProps {
  trainId: string;
  coachId: string;
  wheelId: string;
}

export function WheelDetails({ trainId, coachId, wheelId }: WheelDetailsProps) {
  const [wearData, setWearData] = useState<WearDataPoint[]>([]);
  const [projectedData, setProjectedData] = useState<any[]>([]);
  const [anomaly, setAnomaly] = useState<{ isAnomaly: boolean; description: string } | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'year'>('month');
  
  const [isDataLoading, startDataTransition] = useTransition();
  const [isAnomalyLoading, startAnomalyTransition] = useTransition();
  const [isSummaryLoading, startSummaryTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    startDataTransition(() => {
      const data = generateWearData(trainId, coachId, wheelId);
      const projected = getProjectedWearData(data);
      setWearData(data);
      setProjectedData(projected);
    });

    startAnomalyTransition(async () => {
      setAnomaly(null);
      const data = generateWearData(trainId, coachId, wheelId);
      const result = await getAnomalyDetection({
        trainId,
        coachNumber: parseInt(coachId),
        wheelPosition: wheelId,
        wearLevelData: data.map(d => d.level),
      });
      if (result.anomalyDescription.includes("error")) {
        toast({
          variant: "destructive",
          title: "Anomaly Detection Failed",
          description: result.anomalyDescription,
        });
      }
      setAnomaly({ isAnomaly: result.isAnomaly, description: result.anomalyDescription });
    });
    
    setSummary(null);
  }, [trainId, coachId, wheelId, toast]);

  const handleSummaryGeneration = () => {
    startSummaryTransition(async () => {
      setSummary(null);
      const result = await getWearTrendSummary({
        trainId,
        coachId: parseInt(coachId),
        wheelPosition: wheelId,
        timePeriod,
      });
       if (result.summary.includes("error")) {
        toast({
          variant: "destructive",
          title: "Summary Generation Failed",
          description: result.summary,
        });
      }
      setSummary(result.summary);
    });
  };

  const fullData = wearData.map((d, i) => ({
    ...d,
    projected: projectedData[i]?.projected,
  }));

  const lastWearDataPoint = wearData[wearData.length - 1];

  return (
    <div className="p-0 space-y-4 h-full flex flex-col">
       <DialogHeader>
        <DialogTitle>Train {trainId} / Wheel Position {wheelId}</DialogTitle>
        <DialogDescription>
          Current Wear Value: <span className='font-bold text-foreground'>{lastWearDataPoint?.level.toFixed(2)}mm</span>
        </DialogDescription>
      </DialogHeader>

      <Card className='flex-grow'>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><LineChartIcon className="h-5 w-5" /> Wear Level Trend Analysis</CardTitle>
        </CardHeader>
        <CardContent className='h-[300px]'>
          {isDataLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fullData} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Time (Inspections)', position: 'insideBottom', offset: -10 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Wear Level (mm)', angle: -90, position: 'insideLeft', offset: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)'
                  }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Legend verticalAlign="top" align="right" />
                <Line type="monotone" name="Current Wear" dataKey="level" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 6, className: 'stroke-primary fill-background' }} />
                <Line type="monotone" name="Projected Wear" dataKey="projected" stroke="hsl(var(--accent-foreground))" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Bot className="h-4 w-4" /> Analysis & Insights</h3>
            {isAnomalyLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : anomaly && !anomaly.anomalyDescription.includes("error") ? (
              <Alert variant={anomaly.isAnomaly ? "destructive" : "default"} className="bg-card">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{anomaly.isAnomaly ? "Anomaly Detected!" : "No Anomaly Detected"}</AlertTitle>
                <AlertDescription>{anomaly.description}</AlertDescription>
              </Alert>
            ) : null}
            {isSummaryLoading && (
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            )}
            {summary && !summary.includes("error") && (
               <p className="text-sm text-muted-foreground pt-2">{summary}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Select value={timePeriod} onValueChange={(v: 'week'|'month'|'year') => setTimePeriod(v)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSummaryGeneration} disabled={isSummaryLoading} className="w-full sm:w-auto" variant="outline">
                {isSummaryLoading ? "Generating..." : "Generate Summary"}
              </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
