import LeftSidebar from "@/components/layouts/LeftSidebar"
import RightSidebar from "@/components/layouts/RightSidebar"
import MainArena from "@/components/layouts/MainArena"

export default function Home() {
  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: "var(--ab-bg-deep)" }}>
      <LeftSidebar />
      <MainArena />
      <RightSidebar />
    </div>
  )
}
