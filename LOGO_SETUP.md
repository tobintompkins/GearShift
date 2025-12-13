# How to Add Your Company Logo

## Quick Steps:

1. **Add your logo file** to the `public` folder:
   ```
   public/logo.png
   ```
   (or `logo.svg`, `logo.jpg`, etc.)

2. **Open** `src/components/Navigation.tsx`

3. **Find these lines** (around line 20-21):
   ```typescript
   const useLogo = false; // Set to true when you add your logo
   const logoPath = '/logo.png'; // Update this to your logo filename
   ```

4. **Update them**:
   ```typescript
   const useLogo = true; // Enable logo
   const logoPath = '/logo.png'; // Your logo filename
   ```

5. **Save and refresh** - Your logo will appear!

## Logo Requirements:

- **Format**: PNG, SVG, or JPG
- **Size**: 200-300px wide recommended
- **Background**: Transparent PNG works best for light backgrounds
- **Location**: Must be in the `public` folder

## Examples:

If your logo is named `mycompany-logo.svg`:
```typescript
const useLogo = true;
const logoPath = '/mycompany-logo.svg';
```

If your logo is named `company-logo.png`:
```typescript
const useLogo = true;
const logoPath = '/company-logo.png';
```

## Notes:

- The logo will automatically scale on mobile and desktop
- If the image fails to load, it will show "GearShift" text as fallback
- The logo appears in the navigation header on all pages


