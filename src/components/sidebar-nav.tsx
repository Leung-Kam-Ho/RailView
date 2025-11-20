import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { generateTrains, generateCoaches, generateWheels, getCoachType } from '@/lib/data';
import { cn } from '@/lib/utils';
import { TrainFront, Circle } from 'lucide-react';
import Link from 'next/link';

function CoachIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.5 3.04999C11.7761 3.04999 12 3.27385 12 3.54999V11.55C12 11.8261 11.7761 12.05 11.5 12.05H3.5C3.22386 12.05 3 11.8261 3 11.55V3.54999C3 3.27385 3.22386 3.04999 3.5 3.04999H11.5ZM3.5 2.04999C2.67157 2.04999 2 2.72156 2 3.54999V11.55C2 12.3784 2.67157 13.05 3.5 13.05H11.5C12.3284 13.05 13 12.3784 13 11.55V3.54999C13 2.72156 12.3284 2.04999 11.5 2.04999H3.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
  )
}

export function SidebarNav({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const trainId = searchParams?.train as string;
  const coachId = searchParams?.coach as string;
  const wheelId = searchParams?.wheel as string;

  const trains = generateTrains();
  const allWheels = generateWheels();

  return (
    <Accordion type="single" collapsible defaultValue={trainId ? `train-${trainId}` : undefined} className="w-full">
      {trains.map(train => {
        const coaches = generateCoaches(train.id);
        return (
          <AccordionItem value={`train-${train.id}`} key={train.id} className="border-b-0">
            <AccordionTrigger className="hover:bg-accent/50 px-2 rounded-md [&[data-state=open]>svg]:text-accent-foreground">
              <span className="flex items-center gap-2 font-semibold">
                <TrainFront className="h-5 w-5 text-primary" /> {train.id}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-1 pl-4">
              <Accordion type="single" collapsible defaultValue={coachId && trainId === train.id ? `coach-${coachId}` : undefined}>
                {coaches.map(coach => (
                  <AccordionItem value={`coach-${coach.id}`} key={coach.id} className="border-b-0">
                    <AccordionTrigger className="hover:bg-accent/50 px-2 rounded-md text-sm [&[data-state=open]>svg]:text-accent-foreground">
                      <span className="flex items-center gap-2">
                        <CoachIcon />
                        Coach {coach.id} <span className="text-muted-foreground">({getCoachType(coach.id)})</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pl-6">
                      <div className="flex flex-col space-y-1">
                        {allWheels.map(wheel => (
                          <Link href={`/?train=${train.id}&coach=${coach.id}&wheel=${wheel.id}`}
                                key={wheel.id}
                                className={cn(
                                  "flex items-center gap-2 rounded-md p-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                  trainId === train.id && coachId === String(coach.id) && wheelId === wheel.id && "bg-accent text-accent-foreground font-medium"
                                )}>
                            <Circle className="h-3 w-3 fill-current" />
                            <span>Wheel {wheel.id}</span>
                          </Link>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
