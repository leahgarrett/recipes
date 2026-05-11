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
        leftSection={<IconSearch size={16} color="#7A6240" />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.currentTarget.value)}
        aria-label="Search recipes by name or description"
        styles={{
          input: { backgroundColor: '#FFFFFF', borderColor: '#E8DDD0', color: '#2C2416' },
        }}
      />

      <Select
        placeholder="Filter by category"
        data={[
          { value: '', label: 'All Categories' },
          ...categories.map(cat => ({ value: cat, label: cat })),
        ]}
        value={categoryFilter}
        onChange={setCategoryFilter}
        clearable
        aria-label="Filter recipes by category"
        styles={{
          input: { backgroundColor: '#FFFFFF', borderColor: '#E8DDD0', color: '#2C2416' },
        }}
      />

      <Text
        size="xs"
        c="#7A6240"
        aria-live="polite"
        style={{ textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500 }}
      >
        Showing {filteredRecipes.length} of {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
      </Text>

      {filteredRecipes.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No recipes found. Try adjusting your search or filters.
        </Text>
      ) : (
        <Stack gap="sm" component="ul" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {filteredRecipes.map((recipe) => (
            <li key={recipe.id}>
              <Card
                shadow="none"
                padding="md"
                radius="md"
                withBorder
                style={{
                  cursor: 'pointer',
                  backgroundColor: selectedRecipeId === recipe.id ? '#FFFFFF' : '#FAF6F0',
                  borderColor: selectedRecipeId === recipe.id ? '#7A6240' : '#E8DDD0',
                  borderWidth: selectedRecipeId === recipe.id ? 1.5 : 1,
                  transition: 'border-color 120ms ease',
                }}
                onMouseEnter={(e) => {
                  if (selectedRecipeId !== recipe.id) {
                    e.currentTarget.style.borderColor = '#7A6240';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedRecipeId !== recipe.id) {
                    e.currentTarget.style.borderColor = '#E8DDD0';
                  }
                }}
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
              >
                <Group justify="space-between" mb="xs" wrap="nowrap">
                  <Text fw={600} size="md" c="#2C2416" component="h2" style={{ letterSpacing: '-0.01em' }}>
                    {recipe.name}
                  </Text>
                  <Badge
                    variant="filled"
                    color={selectedRecipeId === recipe.id ? 'brown' : 'gray'}
                    style={
                      selectedRecipeId === recipe.id
                        ? { backgroundColor: '#7A6240', color: '#FAF6F0' }
                        : { backgroundColor: '#E8DDD0', color: '#2C2416' }
                    }
                    styles={{ root: { fontWeight: 500, letterSpacing: '0.06em' } }}
                  >
                    {recipe.category}
                  </Badge>
                </Group>

                <Text size="sm" c="#7A6240" mb="sm" style={{ lineHeight: 1.5 }}>
                  {recipe.description}
                </Text>

                <Group gap="xs">
                  <Text size="xs" c="#7A6240" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span aria-label="Preparation time">⏱ Prep {recipe.prepTime}</span>
                  </Text>
                  <Text size="xs" c="#7A6240" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span aria-label="Cooking time">· Cook {recipe.cookTime}</span>
                  </Text>
                  <Text size="xs" c="#7A6240" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span aria-label="Number of servings">· Serves {recipe.servings}</span>
                  </Text>
                </Group>
              </Card>
            </li>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
