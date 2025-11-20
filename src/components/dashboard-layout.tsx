import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { SidebarNav } from './sidebar-nav';
import { Bot } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

export function DashboardLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen">
        <Sidebar variant="inset" collapsible="icon">
          <SidebarHeader className="border-b">
            <div className="flex items-center gap-2 p-2">
              <Bot className="h-8 w-8 text-primary" />
              <div className="group-data-[collapsible=icon]:hidden">
                <h1 className="text-xl font-semibold">RailView</h1>
              </div>
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
              <h2 className="text-lg font-semibold text-muted-foreground truncate">
                {searchParams?.train && `Train ${searchParams.train} / Coach ${searchParams.coach} / Wheel ${searchParams.wheel}`}
              </h2>
            </div>
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
