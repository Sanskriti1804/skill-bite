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

  const categories = [
    { name: "Trending", slug: "trending" },
    { name: "Beginner", slug: "beginner" },
    { name: "Career", slug: "career" },
    { name: "Coding", slug: "coding" },
    { name: "Soft Skills", slug: "soft-skills" },
    { name: "Exam Prep", slug: "exam-prep" },
    { name: "Quick Tips", slug: "quick-tips" },
  ];
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, isActive: true },
      create: { name: category.name, slug: category.slug, isActive: true },
    });
  }

  const tags = [
    { name: "Tutorial", slug: "tutorial" },
    { name: "Fundamentals", slug: "fundamentals" },
    { name: "Practice", slug: "practice" },
    { name: "Quick Tip", slug: "quick-tip" },
    { name: "Walkthrough", slug: "walkthrough" },
    { name: "Challenge", slug: "challenge" },
    { name: "Deep Dive", slug: "deep-dive" },
    { name: "Must Watch", slug: "must-watch" },
  ];
  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name },
      create: tag,
    });
  }
}
