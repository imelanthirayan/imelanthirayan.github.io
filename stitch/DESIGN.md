# Design System Document

## 1. Overview & Creative North Star: "The Digital Architect"

This design system is engineered to project an image of technical precision fused with creative ingenuity. Moving beyond the standard "developer portfolio" tropes, the system adopts a **Digital Architect** North Star. It treats the browser as a blueprint—a space of intentional structure, depth, and modularity.

The aesthetic breaks from rigid, template-like layouts by utilizing **intentional asymmetry** and **tonal layering**. We emphasize the "how" of development through high-contrast typography scales and a layout that feels built, not just painted. By leveraging a refined palette of deep nocturnes and electric blues, the system balances the authority of a seasoned engineer with the vibrancy of a creative problem-solver.

---

## 2. Colors: Tonal Architecture

Our palette is anchored in depth. We move away from flat white backgrounds toward a sophisticated hierarchy of blue-tinted neutrals that provide a "cool-mode" tech feel.

### Core Palette
*   **Primary (`#0022d7`) & Primary Container (`#233dff`):** Our "Electric Engine." These are reserved for high-impact actions and brand moments.
*   **Background (`#f7f9ff`) & Surface (`#f7f9ff`):** A crisp, cool-toned white that reduces eye strain and feels more premium than pure hex `#FFFFFF`.
*   **Secondary (`#565c84`):** Used for supporting elements to provide a professional, desaturated contrast to the vibrant primaries.

### The "No-Line" Rule
Traditional 1px solid borders are strictly prohibited for sectioning or containment. Boundaries must be defined through **Background Color Shifts**. For example, a card should be distinguished from the section background by moving from `surface-container-low` to `surface-container-lowest`. 

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of materials. Use the `surface-container` tiers to create logical groups:
1.  **Base Layer:** `surface`
2.  **Section Blocks:** `surface-container-low`
3.  **Interactive Cards:** `surface-container-lowest` (pure white) to create a subtle "lift."

### Glass & Gradient Rule
To inject "soul" into the tech-heavy layout:
*   **Hero Elements:** Use subtle linear gradients transitioning from `primary` to `primary_container` (135° angle).
*   **Floating Navigation:** Apply **Glassmorphism**. Use a semi-transparent `surface` color with a `backdrop-blur` (20px) to allow content to bleed through, softening the technical edge.

---

## 3. Typography: Editorial Precision

The typography strategy pairs **Space Grotesk** (Display/Headlines) with **Inter** (Body/UI).

*   **Display & Headlines (Space Grotesk):** Chosen for its "tech-brutalist" character. The slightly geometric apertures convey innovation. 
    *   *Usage:* Large-scale `display-lg` (3.5rem) should be used for hero statements with tight letter-spacing (-0.02em) to feel authoritative.
*   **Body & Titles (Inter):** A workhorse font that ensures maximum readability for technical documentation and project descriptions.
*   **Labels (Space Grotesk):** Using the display font for small labels (uppercase) creates a cohesive, "branded" feel even in the smallest UI details.

---

## 4. Elevation & Depth: Tonal Layering

We eschew traditional drop shadows in favor of **Ambient Elevation**.

*   **The Layering Principle:** Depth is a result of color proximity. A `surface-container-highest` element placed on a `surface` background creates a natural recession.
*   **Ambient Shadows:** If a floating state (like a modal or dropdown) is required, use an ultra-diffused shadow: `box-shadow: 0 20px 40px rgba(5, 10, 48, 0.06);`. Note the use of the deep navy brand color (`#050A30`) as the shadow tint rather than pure black.
*   **The Ghost Border:** For high-density data areas where separation is mandatory, use a "Ghost Border": `outline-variant` token at **15% opacity**. It should be felt, not seen.

---

## 5. Components: Modular Units

### Buttons
*   **Primary:** Solid `primary` background, `on_primary` text. Use `md` (0.375rem) roundedness. No border.
*   **Secondary:** `surface-container-high` background. This creates a "soft" button that feels integrated into the layout.
*   **Tertiary:** Text-only in `primary` color. Use for low-emphasis actions like "Read More."

### Input Fields
*   **Styling:** Instead of a four-sided box, use a `surface-container-low` background with a `2px` bottom-border in `outline-variant`. On focus, transition the bottom border to `primary`.

### Cards & Lists
*   **Rule:** Forbid divider lines.
*   **Execution:** Use `spacing-8` (2rem) of vertical white space to separate list items. For project cards, use a `surface-container-lowest` background with a `xl` (0.75rem) corner radius to imply a premium, tactile object.

### Developer-Specific Components
*   **Code Snippets:** Use `secondary_container` as the background with `on_secondary_container` text. This provides a high-contrast, "terminal" feel that respects the brand palette.
*   **Tech Stack Chips:** Small, `full` roundedness chips using `primary_fixed` background and `on_primary_fixed` text.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical grid alignments (e.g., a 7-column wide project image paired with a 4-column text block) to create visual interest.
*   **Do** use the `primary` accent sparingly to guide the user's eye toward the Call to Action.
*   **Do** ensure all interactive states (hover/active) use a subtle tonal shift rather than a stark color change.

### Don't
*   **Don't** use 100% black text. Always use `on_surface` (`#181c20`) for a softer, more sophisticated editorial look.
*   **Don't** use "standard" drop shadows. They break the architectural cleanliness of the system.
*   **Don't** use dividers or lines to separate content. Let white space and color shifts do the heavy lifting.
*   **Don't** use sharp 90-degree corners. The `DEFAULT` (0.25rem) or `md` (0.375rem) roundedness is essential to keep the "tech" vibe from feeling "cold."