/**
 * Seed script: creates the bootstrap admin and a handful of demo entries.
 * Safe to re-run — everything is upserted by a unique key.
 *
 *   npm run db:seed
 */
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient();

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "nyarahmed48@gmail.com")
  .trim()
  .toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";

const DEMO_ENTRIES = [
  {
    code: "XA8661",
    name: "Ahmed Mahmood",
    type: "Demo website",
    amount: "0",
    currency: "USD",
    status: "active",
    date: "2026-08-15",
    dueDate: null as string | null,
    notes: null as string | null,
    linkUrl: null as string | null,
  },
  {
    code: "YE8058",
    name: "Lana Ahmed",
    type: "AI tutor app",
    amount: "1000",
    currency: "IQD",
    status: "paid",
    date: "2026-07-19",
    dueDate: null,
    notes: null,
    linkUrl: null,
  },
  {
    code: "OL9400",
    name: "Nyar",
    type: "Website tracking system",
    amount: "250",
    currency: "USD",
    status: "active",
    date: "2026-07-04",
    dueDate: "2026-09-28",
    notes: "CO needed and added.",
    linkUrl: "https://example.com/tracking",
  },
  {
    code: "OB2094",
    name: "Nyar — change order",
    type: "Website",
    amount: "120",
    currency: "USD",
    status: "pending",
    date: "2026-06-29",
    dueDate: null,
    notes: "Scope-of-work correction.",
    linkUrl: null,
  },
  {
    code: "XN1775",
    name: "Hala",
    type: "Website",
    amount: "480",
    currency: "USD",
    status: "completed",
    date: "2026-06-21",
    dueDate: null,
    notes: "For multi operations.",
    linkUrl: null,
  },
];

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "admin", status: "approved" },
    create: {
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "admin",
      status: "approved",
    },
  });
  console.log(`✓ admin ready: ${admin.email}`);

  for (const entry of DEMO_ENTRIES) {
    await prisma.entry.upsert({
      where: { code: entry.code },
      update: {},
      create: {
        code: entry.code,
        name: entry.name,
        type: entry.type,
        amount: new Prisma.Decimal(entry.amount),
        currency: entry.currency,
        status: entry.status,
        date: new Date(`${entry.date}T00:00:00.000Z`),
        dueDate: entry.dueDate ? new Date(`${entry.dueDate}T00:00:00.000Z`) : null,
        notes: entry.notes,
        linkUrl: entry.linkUrl,
        createdById: admin.id,
      },
    });
  }
  console.log(`✓ ${DEMO_ENTRIES.length} demo entries ready`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
