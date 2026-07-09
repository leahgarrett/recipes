CREATE INDEX IF NOT EXISTS "ingredients_recipe_id_idx" ON "ingredients" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "photos_recipe_id_idx" ON "photos" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "photos_step_id_idx" ON "photos" USING btree ("step_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "steps_recipe_id_idx" ON "steps" USING btree ("recipe_id");