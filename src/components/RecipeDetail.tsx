import { Card, Text, Group, Stack, Slider, Badge, Divider, List, Image, SimpleGrid } from '@mantine/core';
import { useState } from 'react';
import { Recipe } from '../types/Recipe';
import { scaleIngredients, formatAmount } from '../utils/recipeScaling';

interface RecipeDetailProps {
  recipe: Recipe;
}

export function RecipeDetail({ recipe }: RecipeDetailProps) {
  const [servings, setServings] = useState(recipe.servings);

  const scaledIngredients = scaleIngredients(
    recipe.ingredients,
    recipe.servings,
    servings
  );

  return (
    <Card shadow="sm" padding="xl" radius="md" withBorder>
      <Stack gap="lg">
        {/* Header */}
        <div>
          <Group justify="space-between" mb="xs">
            <Text size="xl" fw={700} component="h1">
              {recipe.name}
            </Text>
            <Badge color="blue" size="lg" variant="light">
              {recipe.category}
            </Badge>
          </Group>

          <Text size="md" c="dimmed" mb="md">
            {recipe.description}
          </Text>

          <Group gap="md">
            <Text size="sm" c="dimmed">
              <span aria-label="Preparation time">⏱️ Prep: {recipe.prepTime}</span>
            </Text>
            <Text size="sm" c="dimmed">
              <span aria-label="Cooking time">👨‍🍳 Cook: {recipe.cookTime}</span>
            </Text>
          </Group>
        </div>

        {/* Recipe Photos */}
        {recipe.photos && recipe.photos.length > 0 && (
          <>
            <Divider />
            <div>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                {recipe.photos.map((photo, index) => (
                  <div key={index}>
                    <Image
                      src={photo.url}
                      alt={photo.alt}
                      radius="md"
                      h={200}
                      fit="cover"
                    />
                    {photo.caption && (
                      <Text size="xs" c="dimmed" mt="xs" ta="center">
                        {photo.caption}
                      </Text>
                    )}
                  </div>
                ))}
              </SimpleGrid>
            </div>
          </>
        )}

        <Divider />

        {/* Servings Slider */}
        <div>
          <Group justify="space-between" mb="md">
            <Text fw={500} size="lg" component="h2">
              Servings
            </Text>
            <Badge size="xl" variant="filled" color="blue" aria-live="polite">
              {servings}
            </Badge>
          </Group>

          <Slider
            value={servings}
            onChange={setServings}
            min={1}
            max={recipe.servings * 3}
            step={1}
            marks={[
              { value: recipe.servings, label: `${recipe.servings} (original)` }
            ]}
            label={(value) => `${value} servings`}
            aria-label={`Adjust servings, currently ${servings} servings. Original recipe serves ${recipe.servings}.`}
            aria-valuemin={1}
            aria-valuemax={recipe.servings * 3}
            aria-valuenow={servings}
            aria-valuetext={`${servings} servings`}
          />

          <Text size="xs" c="dimmed" mt="xs" ta="center">
            Slide to adjust ingredient quantities
          </Text>
        </div>

        <Divider />

        {/* Ingredients */}
        <div>
          <Text fw={500} size="lg" mb="md" component="h2">
            Ingredients
          </Text>

          <List spacing="sm" size="sm" component="ul">
            {scaledIngredients.map((ingredient, index) => (
              <List.Item key={index}>
                <Text component="span">
                  <strong>{formatAmount(ingredient.amount)}</strong>
                  {ingredient.unit && ` ${ingredient.unit}`} {ingredient.item}
                </Text>
              </List.Item>
            ))}
          </List>
        </div>

        <Divider />

        {/* Instructions */}
        <div>
          <Text fw={500} size="lg" mb="md" component="h2">
            Instructions
          </Text>

          <List spacing="xl" size="sm" type="ordered">
            {recipe.instructions.map((step, index) => (
              <List.Item key={index}>
                <Stack gap="sm">
                  <div>
                    <Badge size="sm" variant="dot" color="gray" mb="xs">
                      {step.type}
                    </Badge>
                    <Text>{step.instruction}</Text>
                  </div>

                  {step.photos && step.photos.length > 0 && (
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                      {step.photos.map((photo, photoIndex) => (
                        <div key={photoIndex}>
                          <Image
                            src={photo.url}
                            alt={photo.alt}
                            radius="sm"
                            h={150}
                            fit="cover"
                          />
                          {photo.caption && (
                            <Text size="xs" c="dimmed" mt="xs">
                              {photo.caption}
                            </Text>
                          )}
                        </div>
                      ))}
                    </SimpleGrid>
                  )}
                </Stack>
              </List.Item>
            ))}
          </List>
        </div>
      </Stack>
    </Card>
  );
}
