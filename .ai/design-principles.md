# Design Principles & Visual Specifications

METER's interface is built to look fast, minimal, and premium, drawing inspiration from Vercel, Linear, and Raycast.

---

## 1. Aesthetic Guidelines

- **Dark Mode First**: The default and optimized theme uses pitch-black and deep slate surfaces.
- **Borders**: Extremely thin (`1px` width using high-contrast borders: `#1c1c1c`).
- **Typography**: Clean, sans-serif fonts (`Geist Sans` or `Inter`) with monospaced numbers (`Geist Mono`) to prevent layout shifts on dashboard updates.
- **Interaction**: Subtle micro-animations (card border glows on hover, 200ms ease-out transitions).

---

## 2. Design Tokens

```css
:root {
  --background: 0 0% 4%;          /* #0a0a0a Pitch Black */
  --foreground: 0 0% 98%;         /* #fafafa Off-White */
  --surface: 0 0% 7%;             /* #111111 Elevated Card */
  --border: 0 0% 12%;             /* #1f1f1f Divider */
  --accent: 263 85% 60%;          /* #7c3aed Violet Accent */
  --success: 142 71% 45%;         /* #10b981 Accepted Edits */
  --destructive: 0 84% 60%;       /* #ef4444 Rejections/Errors */
}
```

---

## 3. Screen States

### Loading States
- Use **Skeleton Screen Shimmers** instead of loading spinners.
- If data loads in under `80ms` from local IndexedDB, skip rendering skeletons to avoid a flash of loading states.

### Empty States
- When no logs are present, METER shows a simple 3-step setup card explaining:
  1. How to run their assistant locally.
  2. How to link the folder.
  3. A demo button to load anonymized log fixtures for trial.

---

## 4. Accessibility (a11y)
- **Contrast**: Maintain a minimum 4.5:1 text-to-background contrast ratio (WCAG 2.1 AA compliant).
- **Keyboard Navigation**: Active focus outlines on tabs, inputs, and list rows. Support `tabIndex` sequencing.
- **ARIA Elements**: Screen reader accessible labels on all icons and provider graphics.
