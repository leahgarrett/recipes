import { useState, useEffect, useRef } from 'react';
import { MantineProvider, AppShell, Container, Title, Text, Loader, Center, Grid, Anchor, Stack } from '@mantine/core';
import { RecipeList } from './components/RecipeList';
import { RecipeDetail } from './components/RecipeDetail';
import { Recipe, RecipesData } from './types/Recipe';
import { theme } from './theme';
import { useHashSlug } from './hooks/useHashSlug';
import { recipeHref } from './utils/recipeRoute';
import '@mantine/core/styles.css';

function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [slug, navigateToRecipe] = useHashSlug();
  const detailRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}recipes.json`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load recipes');
        }
        return response.json();
      })
      .then((data: RecipesData) => {
        setRecipes(data.recipes);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // No recipe in the address: show the first one, without changing the address.
  const selectedRecipe = slug
    ? recipes.find((r) => r.slug === slug) ?? null
    : recipes[0] ?? null;
  const notFound = !loading && !error && slug !== null && selectedRecipe === null;

  useEffect(() => {
    if (loading || error) return;
    const page = notFound ? 'Recipe not found' : selectedRecipe?.name;
    document.title = page ? `${page} · Recipes` : 'Recipes';
  }, [loading, error, notFound, selectedRecipe]);

  // A shared link opened on a phone: the list stacks above the recipe, so bring the recipe into view.
  const openedFromLink = useRef(slug !== null);
  useEffect(() => {
    if (loading || !openedFromLink.current) return;
    openedFromLink.current = false;
    detailRef.current?.scrollIntoView?.({ block: 'start' });
  }, [loading]);

  if (loading) {
    return (
      <MantineProvider theme={theme}>
        <Center style={{ height: '100vh' }}>
          {/* role="status" + aria-label on the wrapper; Loader's <span> cannot carry aria-label */}
          <div role="status" aria-label="Loading recipes">
            <Loader size="xl" />
          </div>
        </Center>
      </MantineProvider>
    );
  }

  if (error) {
    return (
      <MantineProvider theme={theme}>
        <Center style={{ height: '100vh' }}>
          <Text c="red" role="alert">
            Error: {error}
          </Text>
        </Center>
      </MantineProvider>
    );
  }

  return (
    <MantineProvider theme={theme}>
      <AppShell
        header={{ height: 60 }}
        padding="md"
      >
        <AppShell.Header style={{ backgroundColor: '#FAF6F0', borderBottom: '1px solid #E8DDD0' }}>
          <Container size="xl" h="100%" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Title order={1} size="h2" c="#2C2416" style={{ letterSpacing: '-0.01em' }}>
              Recipe Browser
            </Title>
            <Text
              size="xs"
              c="#7A6240"
              style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}
            >
              {recipes.length} {recipes.length === 1 ? 'Recipe' : 'Recipes'}
            </Text>
          </Container>
        </AppShell.Header>

        <AppShell.Main>
          <Container size="xl" py="md">
            <Grid gutter="lg">
              <Grid.Col span={{ base: 12, md: 4 }}>
                <RecipeList
                  recipes={recipes}
                  onSelectRecipe={(recipe) => navigateToRecipe(recipe.slug)}
                  selectedRecipeId={selectedRecipe?.id}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 8 }} ref={detailRef}>
                {notFound ? (
                  <Stack align="center" py="xl" gap="sm">
                    <Title order={1} size="h2" c="#2C2416">Recipe not found</Title>
                    <Text c="#7A6240">This link doesn&apos;t match any recipe. It may have been mistyped.</Text>
                    <Anchor href={recipeHref('')} c="#7A6240" fw={600}>
                      Go to the first recipe
                    </Anchor>
                  </Stack>
                ) : selectedRecipe ? (
                  // key: remount per recipe so servings start at that recipe's own value
                  <RecipeDetail key={selectedRecipe.id} recipe={selectedRecipe} />
                ) : (
                  <Center py="xl">
                    <Text c="dimmed">Select a recipe to view details</Text>
                  </Center>
                )}
              </Grid.Col>
            </Grid>
          </Container>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}

export default App;
