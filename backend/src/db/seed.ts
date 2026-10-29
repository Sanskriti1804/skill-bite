import type { PrismaClient } from "@prisma/client";

export async function seedReferenceData(prisma: PrismaClient): Promise<void> {
  const roles = [
    { code: "USER", name: "User" },
    { code: "CREATOR", name: "Creator" },
    { code: "ADMIN", name: "Admin" },
  ];
  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name },
      create: role,
    });
  }
  await prisma.category.upsert({
    where: { slug: "trending" },
    update: { name: "Trending", isActive: true },
    create: { name: "Trending", slug: "trending", isActive: true },
  });
}
