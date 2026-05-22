import { Card, Text, Group, Stack, Slider, Badge, Divider, List, Image, SimpleGrid } from '@mantine/core';
import { useState, useEffect, useRef } from 'react';
import { Recipe } from '../types/Recipe';
import { scaleIngredients, formatAmount } from '../utils/recipeScaling';

interface RecipeDetailProps {
  recipe: Recipe;
}

export function RecipeDetail({ recipe }: RecipeDetailProps) {
  const [servings, setServings] = useState(recipe.servings);
  const cardRef = useRef<HTMLDivElement>(null);

  const scaledIngredients = scaleIngredients(
    recipe.ingredients,
    recipe.servings,
    servings
  );

  // Fix Mantine Slider's empty aria-label on the thumb element
  useEffect(() => {
    if (cardRef.current) {
      const thumb = cardRef.current.querySelector('[role="slider"]');
      if (thumb && !thumb.getAttribute('aria-label')) {
        thumb.setAttribute('aria-label', `Adjust servings, currently ${servings} servings. Original recipe serves ${recipe.servings}.`);
      }
    }
  }, [servings, recipe.servings]);

  return (
    <Card
      ref={cardRef}
      shadow="none"
      padding="xl"
      radius="md"
      withBorder
      style={{ backgroundColor: '#FFFFFF', borderColor: '#E8DDD0' }}
    >
      <Stack gap="lg">
        {/* Header */}
        <div>
          <Group justify="space-between" mb="xs" wrap="nowrap" align="flex-start">
            <Text
              size="xl"
              fw={600}
              component="h1"
              c="#2C2416"
              style={{ fontSize: '28px', letterSpacing: '-0.02em', lineHeight: 1.15 }}
            >
              {recipe.name}
            </Text>
            <Badge
              size="lg"
              style={{ backgroundColor: '#E8DDD0', color: '#2C2416' }}
              styles={{ root: { fontWeight: 500, letterSpacing: '0.06em' } }}
            >
              {recipe.category}
            </Badge>
          </Group>

          <Text size="md" c="#7A6240" mb="md" style={{ lineHeight: 1.5 }}>
            {recipe.description}
          </Text>

          <Group gap="md">
            <Text size="xs" c="#7A6240" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <span aria-label="Preparation time">⏱ Prep {recipe.prepTime}</span>
            </Text>
            <Text size="xs" c="#7A6240" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <span aria-label="Cooking time">· Cook {recipe.cookTime}</span>
            </Text>
          </Group>
        </div>

        {/* Recipe Photos */}
        {recipe.photos && recipe.photos.length > 0 && (
          <>
            <Divider color="#E8DDD0" />
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

        <Divider color="#E8DDD0" />

        {/* Servings Slider */}
        <div>
          <Group justify="space-between" mb="md">
            <Text
              fw={500}
              size="xs"
              component="h2"
              c="#2C2416"
              style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              Servings
            </Text>
            <Badge
              size="lg"
              aria-live="polite"
              style={{ backgroundColor: '#7A6240', color: '#FAF6F0' }}
              styles={{ root: { fontWeight: 600 } }}
            >
              {servings}
            </Badge>
          </Group>

          <Slider
            value={servings}
            onChange={setServings}
            min={1}
            max={recipe.servings * 3}
            step={1}
            color="brown"
            styles={{
              track: { backgroundColor: '#E8DDD0' },
              bar: { backgroundColor: '#7A6240' },
              thumb: { backgroundColor: '#7A6240', borderColor: '#FAF6F0' },
              mark: { backgroundColor: '#7A6240', borderColor: '#7A6240' },
              markLabel: { color: '#7A6240', fontSize: 11, letterSpacing: '0.04em' },
            }}
            marks={[
              { value: recipe.servings, label: `${recipe.servings} (original)` }
            ]}
            label={(value) => `${value} servings`}
            aria-label={`Adjust servings, currently ${servings} servings. Original recipe serves ${recipe.servings}.`}
          />

          <Text size="xs" c="#7A6240" mt="xs" ta="center" style={{ letterSpacing: '0.04em' }}>
            Slide to adjust ingredient quantities
          </Text>
        </div>

        <Divider color="#E8DDD0" />

        {/* Ingredients */}
        <div>
          <Text
            fw={500}
            size="xs"
            component="h2"
            c="#2C2416"
            mb="md"
            style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            Ingredients
          </Text>

          <List spacing="xs" size="sm" component="ul" styles={{ itemWrapper: { lineHeight: 1.9 } }}>
            {scaledIngredients.map((ingredient, index) => (
              <List.Item key={index}>
                <Text component="span" c="#2C2416">
                  <strong>{formatAmount(ingredient.amount)}</strong>
                  {ingredient.unit && ` ${ingredient.unit}`} {ingredient.item}
                </Text>
              </List.Item>
            ))}
          </List>
        </div>

        <Divider color="#E8DDD0" />

        {/* Instructions */}
        <div>
          <Text
            fw={500}
            size="xs"
            component="h2"
            c="#2C2416"
            mb="md"
            style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            Instructions
          </Text>

          <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {recipe.instructions.map((step, index) => (
              <li key={index} style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: '12px', marginBottom: 24 }}>
                <Text fw={600} c="#7A6240" style={{ fontSize: 18, lineHeight: 1 }}>
                  {index + 1}
                </Text>
                <Stack gap="sm">
                  <div>
                    <Badge
                      variant="outline"
                      size="xs"
                      style={{
                        borderColor: '#E8DDD0',
                        color: '#7A6240',
                        backgroundColor: 'transparent',
                        marginBottom: 6,
                      }}
                      styles={{ root: { fontWeight: 500, letterSpacing: '0.07em' } }}
                    >
                      {step.type}
                    </Badge>
                    <Text c="#2C2416" style={{ lineHeight: 1.6 }}>
                      {step.instruction}
                    </Text>
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
                            <Text size="xs" c="#7A6240" mt="xs">
                              {photo.caption}
                            </Text>
                          )}
                        </div>
                      ))}
                    </SimpleGrid>
                  )}
                </Stack>
              </li>
            ))}
          </ol>
        </div>
      </Stack>
    </Card>
  );
}
