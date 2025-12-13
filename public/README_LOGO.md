# Adding Your Company Logo

To add your company logo to GearShift:

## Steps:

1. **Place your logo file** in this `public` folder:
   - Recommended formats: PNG, SVG, or JPG
   - Recommended size: 200-300px wide, transparent background preferred
   - Name it `logo.png` (or update the path in `src/components/Navigation.tsx`)

2. **Update the logo path** in `src/components/Navigation.tsx`:
   - Find the line: `const logoPath = '/logo.png';`
   - Change it to match your logo filename (e.g., `/logo.svg`, `/mycompany-logo.png`)

3. **Optional: Disable logo** (use text only):
   - In `src/components/Navigation.tsx`, change: `const hasLogo = true;` to `const hasLogo = false;`

## Logo File Examples:
- `logo.png` - PNG with transparency
- `logo.svg` - Scalable vector graphic
- `company-logo.jpg` - JPEG image

The logo will automatically:
- Scale appropriately on mobile and desktop
- Fall back to "GearShift" text if the image fails to load
- Maintain aspect ratio

## Current Logo Path:
The component is looking for: `/logo.png`

Make sure your logo file is in the `public` folder and matches this path!


