import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { SidebarNav } from './sidebar-nav';
import { TrainTrack } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import Link from 'next/link';

export function DashboardLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const trainId = searchParams?.train as string;
  const coachId = searchParams?.coach as string;

  return (
    <SidebarProvider>
      <div className="min-h-screen">
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarHeader className="border-b">
            <div className="flex items-center gap-2 p-2">
              <Link href="/" className='flex items-center gap-2'>
                <TrainTrack className="h-8 w-8 text-primary" />
                <div className="group-data-[collapsible=icon]:hidden">
                  <h1 className="text-xl font-semibold">Fleet Monitor</h1>
                </div>
              </Link>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <ScrollArea className="h-full">
              <SidebarNav searchParams={searchParams} />
            </ScrollArea>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-4 md:px-6 sticky top-0 z-30">
            <SidebarTrigger className="flex md:hidden" />
            <div className="flex-1">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search trains..."
                  className="w-full md:w-[200px] lg:w-[300px] pl-8"
                />
              </div>
            </div>
            {trainId && (
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/" className="hover:text-primary">Fleet</Link>
                <span>/</span>
                <Link href={`/?train=${trainId}`} className="hover:text-primary">{trainId}</Link>
                {coachId && (
                  <>
                    <span>/</span>
                    <span>{`Coach ${coachId}`}</span>
                  </>
                )}
               </div>
            )}
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
