import { generateTrains, generateCoaches, generateWheels, getCoachType, getWheelStatus, WheelStatus } from '@/lib/data';
import { cn } from '@/lib/utils';
import { TrainFront, Circle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

function CoachIcon({ className }: { className?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M11.5 3.04999C11.7761 3.04999 12 3.27385 12 3.54999V11.55C12 11.8261 11.7761 12.05 11.5 12.05H3.5C3.22386 12.05 3 11.8261 3 11.55V3.54999C3 3.27385 3.22386 3.04999 3.5 3.04999H11.5ZM3.5 2.04999C2.67157 2.04999 2 2.72156 2 3.54999V11.55C2 12.3784 2.67157 13.05 3.5 13.05H11.5C12.3284 13.05 13 12.3784 13 11.55V3.54999C13 2.72156 12.3284 2.04999 11.5 2.04999H3.5Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      ></path>
    </svg>
  );
}

function WheelStatusIndicator({ status }: { status: WheelStatus }) {
  return (
    <div
      className={cn(
        'h-2.5 w-2.5 rounded-full',
        status === 'imminent-failure' && 'bg-destructive animate-pulse',
        status === 'warning' && 'bg-orange-400',
        status === 'ok' && 'bg-green-500'
      )}
    />
  );
}

export function SidebarNav({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const trainId = searchParams?.train as string;
  const coachId = searchParams?.coach as string;

  if (!trainId) {
    const trains = generateTrains();
    return (
      <div className="p-2 space-y-2">
        <h3 className="px-2 text-xs font-semibold text-muted-foreground">TRAINS</h3>
        {trains.map((train) => (
          <Link href={`/?train=${train.id}`} key={train.id} className={cn(
            "flex items-center gap-2 rounded-md p-2 text-sm hover:bg-accent hover:text-accent-foreground",
            trainId === train.id && "bg-accent text-accent-foreground font-medium"
          )}>
            <TrainFront className="h-5 w-5 text-primary" />
            <span>{train.id}</span>
          </Link>
        ))}
      </div>
    );
  }

  const coaches = generateCoaches(trainId);
  const allWheels = generateWheels();

  return (
    <div className='p-2 space-y-4'>
      <div>
        <h3 className="px-2 text-xs font-semibold text-muted-foreground">COACHES</h3>
        <div className="flex flex-col space-y-1 mt-2">
          {coaches.map(coach => (
            <Link href={`/?train=${trainId}&coach=${coach.id}`}
                  key={coach.id}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-md p-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    coachId === String(coach.id) && "bg-accent text-accent-foreground font-medium"
                  )}>
              <div className='flex items-center gap-2'>
                <CoachIcon className="h-4 w-4" />
                <span>Coach {coach.id}</span>
              </div>
              <span className="text-xs text-muted-foreground">{getCoachType(coach.id)}</span>
            </Link>
          ))}
        </div>
      </div>
      {coachId && (
         <div>
          <h3 className="px-2 text-xs font-semibold text-muted-foreground">WHEEL ARRANGEMENT</h3>
           <div className="grid grid-cols-2 gap-2 mt-2">
              {allWheels.map(wheel => {
                const wheelStatus = getWheelStatus(trainId, coachId, wheel.id);
                return (
                  <Link href={`/?train=${trainId}&coach=${coachId}&wheel=${wheel.id}`} key={wheel.id}>
                    <Card className="hover:bg-accent/50">
                       <CardHeader className="p-2 flex flex-row items-center justify-between">
                         <p className="text-xs font-semibold">{wheel.id}</p>
                         <WheelStatusIndicator status={wheelStatus.status} />
                       </CardHeader>
                       <CardContent className="p-2 pt-0 text-center">
                          <p className="text-lg font-bold">{wheelStatus.wearLevel.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">mm</p>
                       </CardContent>
                    </Card>
                  </Link>
                )
              })}
           </div>
         </div>
      )}
    </div>
  );
}
