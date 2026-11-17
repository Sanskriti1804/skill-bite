-- Add unique username for login + public identity.
-- Backfill existing rows before enforcing NOT NULL / unique.

ALTER TABLE "app_user" ADD COLUMN "username_normalized" TEXT;

UPDATE "app_user" AS u
SET "username_normalized" = sub.candidate
FROM (
  SELECT
    "user_id",
    CASE
      WHEN length(base) >= 3 THEN base || '_' || substr(replace("user_id"::text, '-', ''), 1, 6)
      ELSE 'user_' || substr(replace("user_id"::text, '-', ''), 1, 10)
    END AS candidate
  FROM (
    SELECT
      "user_id",
      left(
        regexp_replace(
          lower(
            coalesce(
              nullif(regexp_replace(lower("display_name"), '[^a-z0-9_]+', '_', 'g'), ''),
              nullif(regexp_replace(split_part("email_normalized", '@', 1), '[^a-z0-9_]+', '_', 'g'), ''),
              'user'
            )
          ),
          '_+',
          '_',
          'g'
        ),
        17
      ) AS base
    FROM "app_user"
  ) seeded
) AS sub
WHERE u."user_id" = sub."user_id";

ALTER TABLE "app_user" ALTER COLUMN "username_normalized" SET NOT NULL;
CREATE UNIQUE INDEX "app_user_username_normalized_key" ON "app_user"("username_normalized");
