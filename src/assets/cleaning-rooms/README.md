# Cleaning room backgrounds

Premium Cleaning room-card backgrounds use paired light/dark assets. The visual layer switches photography with the app theme instead of merely darkening a daytime image.

Canonical keys: `living-room`, `kitchen`, `bathroom`, `bedroom`, `kids-room`, `toilet`, `hall`, `laundry`, `outdoor`.

Each key has a `light` and `dark` variant. Text and controls stay on the deliberately quiet left side; the room subject stays biased right. Status colour is a restrained UI overlay and never replaces the photography. Cards must gracefully fall back to module surface tokens if an image is unavailable. These assets are presentation-only and never own Cleaning state.
