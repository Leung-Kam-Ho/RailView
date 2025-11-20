import { DashboardLayout } from '@/components/dashboard-layout';
import { WheelDetails } from '@/components/wheel-details';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateTrains, getTrainStatus, TrainStatus } from '@/lib/data';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { TrainTrack } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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

function StatusIndicator({ status }: { status: TrainStatus }) {
  return (
    <div
      className={cn(
        'h-2.5 w-2.5 rounded-full',
        status === 'action-required' && 'bg-destructive',
        status === 'warning' && 'bg-orange-400',
        status === 'ok' && 'bg-green-500'
      )}
    />
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
  const trains = generateTrains();

  return (
    <DashboardLayout searchParams={searchParams}>
      {showDetails ? (
        <Dialog open={true}>
          <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
            <Suspense fallback={<LoadingWheelDetails />} key={`${trainId}-${coachId}-${wheelId}`}>
              <WheelDetails
                trainId={trainId}
                coachId={coachId}
                wheelId={wheelId}
              />
            </Suspense>
          </DialogContent>
        </Dialog>
      ) : (
        <div className="p-4 md:p-6">
          <h1 className="text-2xl font-semibold mb-4">Fleet Monitoring System</h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {trains.map((train) => {
              const status = getTrainStatus(train.id);
              return (
                <Link href={`/?train=${train.id}`} key={train.id}>
                  <Card className={cn("hover:shadow-md transition-shadow", trainId === train.id && "ring-2 ring-primary")}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">{train.id}</CardTitle>
                      <StatusIndicator status={status} />
                    </CardHeader>
                    <CardContent className="flex justify-center items-center p-4 pt-0">
                       <TrainTrack className={cn(
                        'h-10 w-10',
                        status === 'action-required' && 'text-destructive',
                        status === 'warning' && 'text-orange-400',
                        status === 'ok' && 'text-green-500'
                       )} />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
