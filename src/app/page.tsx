import { DashboardLayout } from '@/components/dashboard-layout';
import { WheelDetails } from '@/components/wheel-details';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';

function LoadingWheelDetails() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[350px]" />
        </CardContent>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const trainId = searchParams?.train as string;
  const coachId = searchParams?.coach as string;
  const wheelId = searchParams?.wheel as string;

  const showDetails = trainId && coachId && wheelId;

  return (
    <DashboardLayout searchParams={searchParams}>
      {showDetails ? (
        <Suspense fallback={<LoadingWheelDetails />} key={`${trainId}-${coachId}-${wheelId}`}>
          <WheelDetails
            trainId={trainId}
            coachId={coachId}
            wheelId={wheelId}
          />
        </Suspense>
      ) : (
        <div className="flex h-full flex-col items-center justify-center p-6">
          <div className="text-center bg-card p-10 rounded-lg shadow-sm border">
            <Bot className="h-16 w-16 mx-auto text-primary" />
            <h2 className="mt-6 text-2xl font-semibold text-foreground">Welcome to RailView</h2>
            <p className="mt-2 text-muted-foreground max-w-sm">
              Select a train, coach, and wheel from the sidebar to view its wear level trend and AI-powered analysis.
            </p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
