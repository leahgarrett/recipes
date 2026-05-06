# Recipe Browser

An accessible recipe browsing application built with React, TypeScript, and Mantine UI. This app allows users to browse recipes, view detailed instructions, and scale ingredient quantities based on desired servings.

## Features

- 📖 Browse 10 diverse recipes from different cuisines
- 🔍 Search recipes by name or description
- 🏷️ Filter recipes by category
- 📊 Scale ingredient quantities with an interactive slider
- 📸 Optional recipe photos and step-by-step images
- 🏷️ Structured steps with types (prep, mix, cook, bake, rest, serve) for detailed searching
- ♿ WCAG AA compliant for accessibility
- 📱 Responsive design for mobile and desktop

## Technology Stack & Design Decisions

### Core Technologies

- **React 18.3** - Latest stable version with improved performance and features
- **TypeScript 5.7** - For type safety and better developer experience
- **Vite 6.0** - Modern build tool chosen for:
  - Faster development server with Hot Module Replacement (HMR)
  - Optimized production builds
  - Better TypeScript support out of the box
  - Smaller bundle sizes compared to Create React App

### UI Framework

- **Mantine 7.14** - Modern React component library chosen for:
  - Built-in accessibility features (ARIA labels, keyboard navigation)
  - Comprehensive component library with consistent design
  - Excellent TypeScript support
  - Built-in dark mode support (future enhancement)
  - Active maintenance and great documentation

### Testing

- **Vitest 2.1** - Testing framework chosen for:
  - Native Vite integration
  - Jest-compatible API
  - Fast execution with ESM support
  - Built-in TypeScript support
- **React Testing Library 16.1** - For component testing with accessibility-first approach
- **@testing-library/jest-dom 6.6** - Custom matchers for better assertions

### Icons

- **@tabler/icons-react** - Comprehensive icon set with React components

## Accessibility Features (WCAG AA Compliance)

This application has been designed with accessibility as a core requirement:

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Tab navigation works throughout the app
- Enter/Space keys activate recipe cards
- Visible focus indicators on all interactive elements

### Screen Reader Support
- Semantic HTML structure (main, nav, article, lists)
- Proper ARIA labels on all interactive elements
- ARIA live regions for dynamic content updates
- Descriptive alt text and labels

### Visual Accessibility
- High contrast color scheme (4.5:1 ratio minimum)
- Clear focus indicators
- Responsive text sizing
- No reliance on color alone for information

### Component-Specific Accessibility
- **Recipe List**: Each recipe card is keyboard accessible with proper ARIA labels
- **Search**: Labeled input with placeholder text
- **Category Filter**: Accessible select dropdown
- **Servings Slider**: Full ARIA attributes including aria-valuemin, aria-valuemax, aria-valuenow, and descriptive labels

## Project Structure

```
src/
├── components/
│   ├── RecipeList.tsx          # Recipe browsing component with search/filter
│   ├── RecipeList.test.tsx     # Unit tests for RecipeList
│   ├── RecipeDetail.tsx        # Recipe detail view with scaling
│   └── RecipeDetail.test.tsx   # Unit tests for RecipeDetail
├── types/
│   └── Recipe.ts               # TypeScript interfaces for recipe data
├── utils/
│   ├── recipeScaling.ts        # Utility functions for scaling ingredients
│   └── recipeScaling.test.ts   # Unit tests for scaling utilities
├── test/
│   └── setup.ts                # Test configuration
├── App.tsx                     # Main application component
├── main.tsx                    # Application entry point
└── index.css                   # Global styles with accessibility enhancements
public/
└── recipes.json                # Recipe data (10 diverse recipes)
```

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Testing

Run tests:

```bash
npm test
```

Run tests with UI:

```bash
npm run test:ui
```

Run tests with coverage:

```bash
npm run test:coverage
```

### Build

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Recipe Data Format

Recipes are stored in `public/recipes.json` with the following structure:

```json
{
  "recipes": [
    {
      "id": "1",
      "name": "Recipe Name",
      "servings": 4,
      "prepTime": "10 minutes",
      "cookTime": "20 minutes",
      "category": "Breakfast",
      "description": "Recipe description",
      "photos": [
        {
          "url": "https://example.com/photo.jpg",
          "alt": "Description of the photo for screen readers",
          "caption": "Optional caption text"
        }
      ],
      "ingredients": [
        {
          "item": "flour",
          "amount": 2,
          "unit": "cups"
        }
      ],
      "instructions": [
        {
          "instruction": "Mix the dry ingredients together",
          "type": "prep",
          "photos": [
            {
              "url": "https://example.com/step-photo.jpg",
              "alt": "Mixed dry ingredients in a bowl",
              "caption": "Ensure even distribution"
            }
          ]
        },
        {
          "instruction": "Cook on medium heat for 10 minutes",
          "type": "cook"
        }
      ]
    }
  ]
}
```

### Photo Structure

Both recipes and individual steps can include optional photos:
- **url**: The image URL (can be local or remote)
- **alt**: Required alt text for accessibility
- **caption**: Optional caption displayed below the image

### Step Types

Instructions are structured with types for better organization and searchability:
- **prep**: Preparation steps (chopping, measuring, preheating)
- **mix**: Mixing and combining ingredients
- **cook**: Cooking on stovetop or in pan
- **bake**: Baking in oven
- **rest**: Resting, rising, or cooling periods
- **serve**: Final plating and serving
- **other**: Any other step type

## Ingredient Scaling

The app includes intelligent ingredient scaling that:
- Maintains proper ratios when adjusting servings
- Formats decimal amounts as common fractions (½, ¼, ⅓, etc.)
- Allows scaling from 1 to 3x the original servings

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

- Dark mode support
- Recipe categories for easier organization
- User favorites/bookmarks
- Print-friendly recipe view
- Recipe sharing functionality
- Metric/Imperial unit conversion
- Dietary restriction filters (vegetarian, gluten-free, etc.)

## Contributing

When contributing to this project, please:
1. Maintain WCAG AA accessibility standards
2. Write tests for new features
3. Update documentation as needed
4. Follow the existing code style

## License

MIT License - feel free to use this project for learning or personal use.

---

## App Creation Prompts

This application was built using Claude Code with the following prompts:

### Initial Prompt
> i want to make front end for a recipe progam. It will read recipes from a json file and display and browse them. It will allow adjusting the recipes servings quantities up and down by scaling the ingredients. it should use the latest react and use the mantine component library. There is one recipe in the folder now. Can you make ten more as examples. Make a claude.md file with preferences. write unit tests. run autonomously. Let me know if you need clarification before you start.

### Follow-up Requirements
> yes, make a new react project with vite etc. current best practices. describe choices in the readme.md file. one json file to make search easier (maybe we could make recipes in categories if we have too many later on). Slider. Can you make the site be WCAG AA so my blind friend can use it too

### Photo Feature Enhancement
> I want to add optional photos. Can we allow for multiple photos at the recipe level? Also lets extend the intructions to include a steps structure that includes one or more photos and a type for the steps to allow for more detailed searching
