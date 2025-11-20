'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generateWearData } from '@/lib/data';
import type { WearDataPoint } from '@/lib/types';
import { getAnomalyDetection, getWearTrendSummary } from '@/app/actions';
import { AlertCircle, Bot, LineChart as LineChartIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface WheelDetailsProps {
  trainId: string;
  coachId: string;
  wheelId: string;
}

export function WheelDetails({ trainId, coachId, wheelId }: WheelDetailsProps) {
  const [wearData, setWearData] = useState<WearDataPoint[]>([]);
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
      setWearData(data);
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

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LineChartIcon className="h-6 w-6" /> Wear Level Trend</CardTitle>
          <CardDescription>Train {trainId} / Coach {coachId} / Wheel {wheelId}</CardDescription>
        </CardHeader>
        <CardContent>
          {isDataLoading ? (
            <Skeleton className="w-full h-[350px]" />
          ) : (
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={wearData} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
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
                  <Line type="monotone" dataKey="level" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 6, className: 'stroke-primary fill-background' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Anomaly Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" /> AI Trend Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex flex-wrap items-center gap-2">
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
              <Button onClick={handleSummaryGeneration} disabled={isSummaryLoading} className="w-full sm:w-auto">
                {isSummaryLoading ? "Generating..." : "Generate Summary"}
              </Button>
            </div>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
