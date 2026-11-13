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
  const tags = [
    { name: "Tutorial", slug: "tutorial" },
    { name: "Fundamentals", slug: "fundamentals" },
    { name: "Practice", slug: "practice" },
  ];
  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name },
      create: tag,
    });
  }
}
