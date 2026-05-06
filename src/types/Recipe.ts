export interface Ingredient {
  item: string;
  amount: number;
  unit: string;
}

export interface Photo {
  url: string;
  alt: string;
  caption?: string;
}

export type StepType = 'prep' | 'cook' | 'bake' | 'rest' | 'serve' | 'mix' | 'other';

export interface Step {
  instruction: string;
  type: StepType;
  photos?: Photo[];
}

export interface Recipe {
  id: string;
  name: string;
  servings: number;
  prepTime: string;
  cookTime: string;
  category: string;
  description: string;
  photos?: Photo[];
  ingredients: Ingredient[];
  instructions: Step[];
}

export interface RecipesData {
  recipes: Recipe[];
}
