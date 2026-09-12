# Cleaning room backgrounds

Premium Cleaning room-card backgrounds use paired light/dark assets. Room photography is presentation-only; canonical Cleaning state remains unchanged.

Canonical keys: `living-room`, `kitchen`, `bathroom`, `bedroom`, `kids-room`, `toilet`, `hall`, `laundry`, `outdoor`.

Every canonical key has a dedicated 960×540 WebP for light and dark mode, named `<key>-light.webp` and `<key>-dark.webp`. Current cards use `background-size: cover` so the photograph fills the complete surface on mobile without exposing an atlas boundary.

Keep both variants visually recognizable as the same kind of room, but distinct from all other room keys in composition, palette, lighting and furnishings. The CSS mapping is shared by Kamers, Gepland per kamer and Planning.

The two 2304×1296 atlases are derived compatibility assets for older Cleaning detail companions during the gradual V2 rollout. New card and sheet presentation must use the individual files above.
