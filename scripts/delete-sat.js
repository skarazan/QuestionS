import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const existing = await prisma.course.findUnique({ where: { slug: "sat" } });
if (!existing) {
  console.log('No "sat" course found.');
} else {
  const r = await prisma.course.delete({ where: { slug: "sat" } });
  console.log("Deleted course:", r.id);
}
await prisma.$disconnect();
