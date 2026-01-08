# Atomic Design System

This project follows the **Atomic Design** methodology to create a scalable and maintainable UI library.

## Structure

```
design-system/
├── atoms/       # Basic building blocks (Buttons, Inputs, Icons)
├── molecules/   # Simple groups of UI elements (SearchBox = Input + Button)
├── organisms/   # Complex UI components (Header, Footer, ProductCard)
├── templates/   # Page-level layouts (DashboardLayout, AuthLayout)
└── theme/       # Global styles, variables, typography, colors
```

## Methodology

### ⚛️ Atoms
Atoms are the basic building blocks of matter. Applied to web interfaces, atoms are our HTML tags, such as a form label, an input or a button.

**Examples:**
- `Button`
- `Input`
- `Typography` (Heading, Text)
- `Icon`

### 🧬 Molecules
Molecules are groups of atoms bonded together and are the smallest fundamental units of a compound. These molecules take on their own properties and serve as the backbone of our design systems.

**Examples:**
- `SearchBar` (Input + Button)
- `FormField` (Label + Input + ErrorMessage)
- `UserAvatar` (Image + StatusIndicator)

### 🦠 Organisms
Organisms are groups of molecules joined together to form a relatively complex, distinct section of an interface.

**Examples:**
- `Navbar` (Logo + Navigation + SearchBar + UserAvatar)
- `PricingTable`
- `CommentSection`

## Usage

Import components using the shared alias:

```typescript
import { Button } from '@shared/design-system/atoms';
import { SearchBar } from '@shared/design-system/molecules';
```

## Theme

The theme configuration is located in `theme/`. Ensure you use the design tokens for colors, spacing, and typography to maintain consistency.
