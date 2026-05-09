import { Provider } from "jotai";
import { Game } from "@/components/game";
import { Navbar } from "@/components/navbar";
import { GameOverlay } from "@/components/game-overlay";
import { LeftSidebar, LeftSidebarContent, LeftSidebarToggle } from "@/components/left-sidebar";
import { RightSidebar, RightSidebarContent } from "@/components/right-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export async function Home() {
  return (
    <Provider>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-white text-slate-900 font-sans selection:bg-[#8B5CF6]/30 selection:text-white dark:bg-[#04050A] dark:text-gray-100">
        <Navbar />
        <div className="hidden min-h-0 flex-1 lg:flex relative w-full h-full">

          <LeftSidebar />
          <main className="relative min-w-0 flex-1 bg-transparent flex flex-col w-full h-full z-0">
            <LeftSidebarToggle />
            <Game />
            <GameOverlay />
          </main>

          <RightSidebar />
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:hidden w-full h-full bg-[#04050A]">
          <div className="relative aspect-video w-full border-b border-[#3B82F6]/30">
            <Game />
            <GameOverlay />
          </div>

          <div className="flex border-b border-white/10 bg-[#04050A]/90 backdrop-blur-xl px-2 pt-2">
            <Tabs defaultValue="games" className="w-full">
              <TabsList className="w-full bg-transparent p-0 gap-2 h-12 border-b-0 rounded-none flex">
                <TabsTrigger
                  value="games"
                  className="flex-1 rounded-none font-mono text-xs font-bold tracking-widest uppercase data-[state=active]:bg-transparent data-[state=active]:text-[#8B5CF6] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#8B5CF6] text-gray-500"
                >
                  GAMES
                </TabsTrigger>
                <TabsTrigger
                  value="bets"
                  className="flex-1 rounded-none font-mono text-xs font-bold tracking-widest uppercase data-[state=active]:bg-transparent data-[state=active]:text-[#8B5CF6] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#8B5CF6] text-gray-500"
                >
                  MY BETS
                </TabsTrigger>
                <TabsTrigger
                  value="info"
                  className="flex-1 rounded-none font-mono text-xs font-bold tracking-widest uppercase data-[state=active]:bg-transparent data-[state=active]:text-[#3B82F6] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#3B82F6] text-gray-500"
                >
                  INFO
                </TabsTrigger>
              </TabsList>

              <TabsContent value="games">
                <LeftSidebarContent tab="games" />
              </TabsContent>
              <TabsContent value="bets">
                <LeftSidebarContent tab="bets" />
              </TabsContent>
              <TabsContent value="info">
                <RightSidebarContent />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Provider>
  );
}
