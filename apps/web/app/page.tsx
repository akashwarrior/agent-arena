import LeftSidebar from "@/components/layouts/LeftSidebar";
import { RightSidebar } from "@/components/layouts/RightSidebar";

export default function Home() {
  return (
    <div className="flex h-full w-full overflow-hidden">
      <LeftSidebar />

      <main className="relative flex-1">{/* <Game /> */}</main>

      <RightSidebar />
    </div>
  );
}
