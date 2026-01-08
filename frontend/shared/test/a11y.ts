import { configureAxe } from 'jest-axe';

const axe = configureAxe({
  rules: {
    // Disable rules that might be too strict for rapid development, enable as needed
    'image-alt': { enabled: true },
    'button-name': { enabled: true },
    'color-contrast': { enabled: true }, // Verified by design system, but good to check
  },
});

export const checkA11y = async (container: HTMLElement) => {
  const results = await axe(container);
  if (results.violations.length > 0) {
    console.error('Core A11y Violations:', JSON.stringify(results.violations, null, 2));
    throw new Error('Accessibility violations found.');
  }
};
