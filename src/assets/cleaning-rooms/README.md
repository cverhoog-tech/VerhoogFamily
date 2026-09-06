# Cleaning room backgrounds

Premium Cleaning room-card backgrounds use paired light/dark assets. Room photography is presentation-only; canonical Cleaning state remains unchanged.

Canonical keys: `living-room`, `kitchen`, `bathroom`, `bedroom`, `kids-room`, `toilet`, `hall`, `laundry`, `outdoor`.

The visual layer uses paired 2304×1296 WebP atlases. Every tile is 768×432 and is selected with `background-size: 300% 300%`.

Tile order:

| Position | Room type |
| --- | --- |
| `0% 0%` | `living-room` |
| `50% 0%` | `kitchen` |
| `100% 0%` | `bathroom` |
| `0% 50%` | `bedroom` |
| `50% 50%` | `kids-room` |
| `100% 50%` | `toilet` |
| `0% 100%` | `hall` |
| `50% 100%` | `laundry` |
| `100% 100%` | `outdoor` |
