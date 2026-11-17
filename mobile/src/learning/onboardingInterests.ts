import type { ImageSourcePropType } from "react-native";

export type OnboardingInterest = {
  /** Stored interest key used for personalization. */
  slug: string;
  name: string;
  image: ImageSourcePropType;
  /** Closest existing content category slug when available. */
  apiSlug?: string;
};

/**
 * Local category art for the interest-selection onboarding cards.
 * Images live in assets/cat-img.
 */
export const ONBOARDING_INTERESTS: OnboardingInterest[] = [
  {
    slug: "fitness-wellness",
    name: "Fitness & Wellness",
    apiSlug: "fitness",
    image: require("../../assets/cat-img/Fitness_and_Wellness.jpg"),
  },
  {
    slug: "cooking-recipes",
    name: "Cooking & Recipes",
    apiSlug: "cooking",
    image: require("../../assets/cat-img/Cooking_and_recepies.jpg"),
  },
  {
    slug: "baking",
    name: "Baking",
    apiSlug: "cooking",
    image: require("../../assets/cat-img/Baking.jpg"),
  },
  {
    slug: "nutrition-food",
    name: "Nutrition & Food",
    apiSlug: "cooking",
    image: require("../../assets/cat-img/Nutrition_and_Food_Wellness.jpg"),
  },
  {
    slug: "career-growth",
    name: "Career & Growth",
    apiSlug: "career",
    image: require("../../assets/cat-img/Career_and_Profesional_growth.jpg"),
  },
  {
    slug: "interpersonal",
    name: "Interpersonal Skills",
    apiSlug: "soft-skills",
    image: require("../../assets/cat-img/Interpersonal_Skills.jpg"),
  },
  {
    slug: "emotional-intelligence",
    name: "Emotional Intelligence",
    apiSlug: "soft-skills",
    image: require("../../assets/cat-img/Relationships_and_Emotional_intelligence.jpg"),
  },
  {
    slug: "creative-writing",
    name: "Creative Writing",
    apiSlug: "language",
    image: require("../../assets/cat-img/Creative_Writing.jpg"),
  },
  {
    slug: "expense-budgeting",
    name: "Expense & Budgeting",
    apiSlug: "finance",
    image: require("../../assets/cat-img/Expense_and_Budgeting.jpg"),
  },
  {
    slug: "investing-wealth",
    name: "Investing & Wealth",
    apiSlug: "finance",
    image: require("../../assets/cat-img/Investing_and_Wealth_Management.jpg"),
  },
  {
    slug: "taxation",
    name: "Taxation & Tax Filing",
    apiSlug: "finance",
    image: require("../../assets/cat-img/Taxation_and_Tax_Filing.jpg"),
  },
  {
    slug: "research-analytics",
    name: "Research & Analytics",
    apiSlug: "exam-prep",
    image: require("../../assets/cat-img/Research_and_Analytical_Skills.jpg"),
  },
];

/** Expand stored interest keys to content category slugs for recommendations. */
export function interestKeysToApiSlugs(keys: string[]): string[] {
  const slugs = new Set<string>();
  for (const key of keys) {
    const match = ONBOARDING_INTERESTS.find((item) => item.slug === key || item.apiSlug === key);
    if (match?.apiSlug) slugs.add(match.apiSlug);
    else slugs.add(key);
  }
  return [...slugs];
}
