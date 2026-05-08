import { useState, useEffect } from 'react';
import { MantineProvider, AppShell, Container, Title, Text, Loader, Center, Grid } from '@mantine/core';
import { RecipeList } from './components/RecipeList';
import { RecipeDetail } from './components/RecipeDetail';
import { Recipe, RecipesData } from './types/Recipe';
import { theme } from './theme';
import '@mantine/core/styles.css';

function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
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
        // Select first recipe by default
        if (data.recipes.length > 0) {
          setSelectedRecipe(data.recipes[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <MantineProvider theme={theme}>
        <Center style={{ height: '100vh' }}>
          <Loader size="xl" aria-label="Loading recipes" />
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
        <AppShell.Header>
          <Container size="xl" h="100%" style={{ display: 'flex', alignItems: 'center' }}>
            <Title order={1} size="h2">
              Recipe Browser
            </Title>
          </Container>
        </AppShell.Header>

        <AppShell.Main>
          <Container size="xl" py="md">
            <Grid gutter="lg">
              <Grid.Col span={{ base: 12, md: 4 }}>
                <RecipeList
                  recipes={recipes}
                  onSelectRecipe={setSelectedRecipe}
                  selectedRecipeId={selectedRecipe?.id}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 8 }}>
                {selectedRecipe ? (
                  <RecipeDetail recipe={selectedRecipe} />
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
