import { Card, Text, Badge, Group, Stack, TextInput, Select } from '@mantine/core';
import { Recipe } from '../types/Recipe';
import { IconSearch } from '@tabler/icons-react';
import { useState } from 'react';

interface RecipeListProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  selectedRecipeId?: string;
}

export function RecipeList({ recipes, onSelectRecipe, selectedRecipeId }: RecipeListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Get unique categories
  const categories = Array.from(new Set(recipes.map(r => r.category))).sort();

  // Filter recipes
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || recipe.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <Stack gap="md">
      <TextInput
        placeholder="Search recipes..."
        leftSection={<IconSearch size={16} />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.currentTarget.value)}
        aria-label="Search recipes by name or description"
      />

      <Select
        placeholder="Filter by category"
        data={[
          { value: '', label: 'All Categories' },
          ...categories.map(cat => ({ value: cat, label: cat }))
        ]}
        value={categoryFilter}
        onChange={setCategoryFilter}
        clearable
        aria-label="Filter recipes by category"
      />

      <Text size="sm" c="dimmed" aria-live="polite">
        Showing {filteredRecipes.length} of {recipes.length} recipes
      </Text>

      <Stack gap="sm" component="ul" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {filteredRecipes.map((recipe) => (
          <li key={recipe.id}>
            <Card
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectRecipe(recipe)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectRecipe(recipe);
                }
              }}
              tabIndex={0}
              role="button"
              aria-pressed={selectedRecipeId === recipe.id}
              aria-label={`View recipe: ${recipe.name}`}
              bg={selectedRecipeId === recipe.id ? 'var(--mantine-color-blue-light)' : undefined}
            >
              <Group justify="space-between" mb="xs">
                <Text fw={500} size="lg" component="h2">
                  {recipe.name}
                </Text>
                <Badge color="blue" variant="light">
                  {recipe.category}
                </Badge>
              </Group>

              <Text size="sm" c="dimmed" mb="sm">
                {recipe.description}
              </Text>

              <Group gap="xs">
                <Text size="xs" c="dimmed">
                  <span aria-label="Preparation time">⏱️ Prep: {recipe.prepTime}</span>
                </Text>
                <Text size="xs" c="dimmed">
                  <span aria-label="Cooking time">👨‍🍳 Cook: {recipe.cookTime}</span>
                </Text>
                <Text size="xs" c="dimmed">
                  <span aria-label="Number of servings">🍽️ Serves: {recipe.servings}</span>
                </Text>
              </Group>
            </Card>
          </li>
        ))}

        {filteredRecipes.length === 0 && (
          <Text c="dimmed" ta="center" py="xl">
            No recipes found. Try adjusting your search or filters.
          </Text>
        )}
      </Stack>
    </Stack>
  );
}
