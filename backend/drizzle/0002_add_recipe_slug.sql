-- Hand-edited: Drizzle generated a bare NOT NULL add, which fails on a database that already
-- has recipes. Add the column nullable, backfill from the name, then enforce NOT NULL + UNIQUE.
-- The backfill approximates src/utils/slug.ts (no accent stripping); `npm run seed` replaces
-- these with the slugs in public/recipes.json anyway.
ALTER TABLE "recipes" ADD COLUMN "slug" text;--> statement-breakpoint
UPDATE "recipes" SET "slug" = COALESCE(
  NULLIF(trim(BOTH '-' FROM regexp_replace(
    replace(replace(lower("name"), '''', ''), '&', ' and '),
    '[^a-z0-9]+', '-', 'g'
  )), ''),
  'recipe'
);--> statement-breakpoint
-- Two recipes with the same name: keep the earliest as-is, suffix the rest with their id.
UPDATE "recipes" r SET "slug" = r."slug" || '-' || r."id"
FROM (
  SELECT "id", row_number() OVER (PARTITION BY "slug" ORDER BY "created_at", "id") AS rn
  FROM "recipes"
) d
WHERE r."id" = d."id" AND d.rn > 1;--> statement-breakpoint
ALTER TABLE "recipes" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_slug_unique" UNIQUE("slug");
