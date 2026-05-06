# Claude Preferences for Recipe App

## Project Overview
This is a React-based recipe browser application with a focus on accessibility (WCAG AA compliance) and modern best practices.

## Development Preferences

### Code Style
- Use TypeScript for all new files
- Prefer functional components with hooks over class components
- Use meaningful variable names and add comments only when logic isn't self-evident
- Keep components small and focused on a single responsibility

### Component Guidelines
- All interactive elements must have proper ARIA labels
- Ensure keyboard navigation works for all interactive elements
- Use semantic HTML elements (main, nav, article, section, etc.)
- Test components for accessibility using screen reader attributes

### Testing
- Write unit tests for utility functions
- Write component tests for user interactions
- Use React Testing Library for component testing
- Aim for meaningful test coverage, not just high percentages

### Accessibility Requirements (WCAG AA)
- All images must have alt text
- Color contrast ratios must be at least 4.5:1 for normal text
- All form elements must have labels
- Focus indicators must be visible
- Support keyboard navigation (Tab, Enter, Space, Arrow keys)
- Use aria-live regions for dynamic content updates
- Provide text alternatives for non-text content

### Build & Deploy
- Run `npm run dev` for development server
- Run `npm test` to run tests
- Run `npm run build` to create production build
- Test the production build with `npm run preview`

### Dependencies
- Keep dependencies up to date
- Prefer well-maintained libraries with good accessibility support
- Document any new dependencies in README.md

### Git Workflow
- Write clear commit messages
- Keep commits focused and atomic
- Test before committing
