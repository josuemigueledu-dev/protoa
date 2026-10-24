# Protoa brand

The mark is **Strata**: a sphere holding a dense core, with the orbiter's ring crossing in front and its moon riding on it. It is the character (`shared/orb/glorb.js`) drawn flat.

## Files

| File | Use |
| --- | --- |
| `protoa-mark.svg` | The mark on light grounds, 48 px and up |
| `protoa-mark-dark.svg` | The mark on dark grounds, 48 px and up |
| `protoa-mark-small.svg`, `protoa-mark-small-dark.svg` | 24–40 px: the moon and the back of the ring drop out, the strata merge into one core |
| `favicon.svg` | 16 px; follows the browser's light or dark setting |
| `protoa-lockup.svg`, `protoa-lockup-dark.svg` | Mark and wordmark side by side |
| `protoa-wordmark.svg` | The word alone |
| `app-icon-ink.svg` | The main app icon (1024 px, full bleed; the platform rounds the corners) |
| `app-icon-azure.svg`, `app-icon-light.svg`, `app-icon-mono.svg` | Alternates; mono is for tinted icon modes |

The wordmark is lowercase "protoa" in Sora ExtraBold with −0.05 em tracking, converted to outlines so it renders the same without the font. Sora is licensed under the SIL Open Font License.

## Colours

| Role | Light ground | Dark ground |
| --- | --- | --- |
| Shell | `#0b1220` | `#111a2e` with a `#2c3c5e` edge |
| Strata, outside in | `#132a57` `#1a48a6` `#3a86f0` `#ffffff` | `#1a3466` `#2559c4` `#5fa9ff` `#ffffff` |
| Ring | `#eef2f7`, back half at 45 % | same |
| Moon | `#7cc6ff` | `#7cc6ff` |
| Wordmark | `#0b1220` | `#eef2f7` |

Keep clear space of half the mark's width around it. Do not recolour the strata, rotate the ring, or put the mark on a busy photo.

## The character

The orb in the apps is the same object, alive:

- **Shell**: polished, perfectly clear glass. Invisible head-on; studio reflections, a pin highlight and a thin rim toward the edge.
- **Density**: layered light thickening toward a white-hot nucleus, with grains that swirl faster nearer the centre. It brightens with every syllable Protoa speaks.
- **Mood** is the density's hue: light blue = neutral, green = correct, yellow = almost (half right), red = incorrect. In code: `Voice.nod()`, `Voice.almost()`, `Voice.tilt()`; `uiSound(kind, result)` picks yellow for near misses (`NEAR_MISS` in `core.js`).
- **Orbiter**: a solid sphere on the ring, lit by the core. Its pace shows what Protoa is doing: faster when speaking, racing while thinking, quicker after a right answer, slower after a wrong one, wobbling on a near miss.
- **Moon**: on Earth–Moon proportions to the orbiter: 27.3 % of its size, a path tilted 5.1°, and 13.37 laps for every lap of the orbiter (365.256 d ÷ 27.322 d). Only its distance is compressed; the real Moon sits 60 Earth radii out.
