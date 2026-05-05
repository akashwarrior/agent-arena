import { prisma } from "@repo/db"

export default async function Home() {
  const users = await prisma.user.findMany();
  console.log({ users });

  return <div>Home page is in app/page.tsx</div>
}
