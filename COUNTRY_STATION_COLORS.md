# Country Station Colors — Recognition Reference

**Purpose:** Color-code stations by a country's flag so they're recognizable at close range. Stations render the flag's bands along their length (horizontal flags → horizontal bands, vertical flags → vertical bands).

**Core problem:** many countries share the *same colors* in a *different order or orientation*. Close range, you can't always read orientation at a glance — so these are the "confusable" sets. This reference groups flags by color signature so we know which ones collide.

---

## ⚠️ Confusable Groups (the important part)

### Blue / White / Red — the biggest collision family
| Country | Order (top→bottom / hoist→fly) | Orientation |
|---------|-------------------------------|-------------|
| **France** | blue · white · red | vertical |
| **Netherlands** | red · white · blue | horizontal |
| **Luxembourg** | red · white · *light* blue | horizontal |
| **Russia** | white · blue · red | horizontal |
| **USA** | red/white stripes + blue canton | stripes |
| **UK** | Union Jack (red/white/blue crosses) | cross |
| Norway · Iceland | blue + red/white nordic cross | cross |
| Czechia | blue triangle + white/red | — |
| Slovakia · Slovenia · Croatia · Serbia | white/blue/red (+ emblem) | horizontal |
| Paraguay · Cuba · Puerto Rico | red/white/blue | stripes/triangle |

### Green / White / Orange (the one you flagged)
| Country | Order | Orientation |
|---------|-------|-------------|
| **Ireland** | green · white · orange | vertical |
| **Côte d'Ivoire** | orange · white · green | vertical |
| **Niger** | orange · white · green | horizontal |
| **India** | saffron · white · green (+ chakra) | horizontal |

→ Ireland and Côte d'Ivoire are the *exact same three colors, reversed*. Identical at a glance.

### Green / White / Red
| Country | Order | Orientation |
|---------|-------|-------------|
| **Italy** | green · white · red | vertical |
| **Mexico** | green · white · red (+ eagle) | vertical |
| **Hungary** | red · white · green | horizontal |
| **Bulgaria** | white · green · red | horizontal |
| **Iran** | green · white · red (+ emblem) | horizontal |

### Red / White / Black (Pan-Arab)
| Country | Order | Orientation |
|---------|-------|-------------|
| **Egypt** | red · white · black | horizontal |
| **Yemen** | red · white · black | horizontal |
| **Syria** | red · white · black | horizontal |
| **Iraq** | red · white · black | horizontal |

→ All four are *identical bands* — differ only by the center emblem.

### Yellow / Blue / Red (Gran Colombia)
| Country | Order | Orientation |
|---------|-------|-------------|
| **Colombia** | yellow · blue · red (yellow double-height) | horizontal |
| **Venezuela** | yellow · blue · red (+ stars) | horizontal |
| **Ecuador** | yellow · blue · red (+ emblem) | horizontal |

### Red / Yellow / Green (Pan-African)
| Country | Order | Orientation |
|---------|-------|-------------|
| **Guinea** | red · yellow · green | vertical |
| **Mali** | green · yellow · red | vertical |
| **Senegal** | green · yellow · red (+ star) | vertical |
| **Ghana** | red · yellow · green | horizontal |
| **Ethiopia** | green · yellow · red | horizontal |
| **Bolivia** | red · yellow · green | horizontal |

### Black / Red / Gold
| Country | Order | Orientation |
|---------|-------|-------------|
| **Germany** | black · red · gold | horizontal |
| **Belgium** | black · yellow · red | vertical |

### Blue / Yellow / Red (Romania vs Chad — near-twin)
| Country | Order | Orientation |
|---------|-------|-------------|
| **Romania** | blue · yellow · red | vertical |
| **Chad** | blue · yellow · red | vertical |

→ Romania and Chad are *nearly identical*; only the blue shade differs (Chad's is slightly darker).

### Red / White bicolors
| Country | Order | Orientation |
|---------|-------|-------------|
| **Indonesia** | red · white (red top) | horizontal |
| **Monaco** | red · white (red top) | horizontal |
| **Poland** | white · red (white top) | horizontal |

→ Indonesia and Monaco are the same flag (differ only in exact ratio). Poland is the reverse.

---

## Master Color Table (hex values)

### Horizontal tricolors
| Country | Top | Middle | Bottom |
|---------|-----|--------|--------|
| Estonia | `#0072CE` | `#000000` | `#FFFFFF` |
| Russia | `#FFFFFF` | `#0039A6` | `#D52B1E` |
| Netherlands | `#AE1C28` | `#FFFFFF` | `#21468B` |
| Luxembourg | `#ED2939` | `#FFFFFF` | `#00A1DE` |
| Germany | `#000000` | `#DD0000` | `#FFCE00` |
| Hungary | `#CD2A3E` | `#FFFFFF` | `#436F4D` |
| Bulgaria | `#FFFFFF` | `#00966E` | `#D62612` |
| Lithuania | `#FDB913` | `#006A44` | `#C1272D` |
| Armenia | `#D90012` | `#0033A0` | `#F2A800` |
| Azerbaijan | `#00B9E4` | `#ED2939` | `#3F9C35` |
| Colombia | `#FCD116` | `#003893` | `#CE1126` |
| Venezuela | `#FFCC00` | `#00247D` | `#CF142B` |
| Ecuador | `#FFDD00` | `#005B9F` | `#EF3340` |
| Serbia | `#C6363C` | `#FFFFFF` | `#0C4076` |
| Croatia | `#FF0000` | `#FFFFFF` | `#171796` |
| Slovakia | `#FFFFFF` | `#0B4EA2` | `#EE1C25` |
| Slovenia | `#FFFFFF` | `#005DA4` | `#ED1C24` |
| Egypt / Yemen / Syria / Iraq | `#CE1126` | `#FFFFFF` | `#000000` |
| Bolivia | `#D52B1E` | `#F9E300` | `#007934` |
| Ghana | `#CE1126` | `#FCD116` | `#006B3F` |
| Gabon | `#009E60` | `#FCD116` | `#3672B5` |
| India | `#FF9933` | `#FFFFFF` | `#138808` |
| Niger | `#E05206` | `#FFFFFF` | `#0DB02B` |
| Ethiopia | `#078930` | `#FCDD09` | `#DA121A` |

### Vertical tricolors
| Country | Hoist (left) | Middle | Fly (right) |
|---------|--------------|--------|-------------|
| France | `#0055A4` | `#FFFFFF` | `#EF4135` |
| Ireland | `#169B62` | `#FFFFFF` | `#FF883E` |
| Côte d'Ivoire | `#FF8200` | `#FFFFFF` | `#009A44` |
| Italy | `#009246` | `#FFFFFF` | `#CE2B37` |
| Belgium | `#000000` | `#FDDA24` | `#EF3340` |
| Romania | `#002B7F` | `#FCD116` | `#CE1126` |
| Chad | `#002664` | `#FECB00` | `#C60C30` |
| Mali | `#14B53A` | `#FCD116` | `#CE1126` |
| Guinea | `#CE1126` | `#FCD116` | `#009460` |
| Mexico | `#006847` | `#FFFFFF` | `#CE1126` |
| Nigeria | `#008751` | `#FFFFFF` | `#008751` |
| Peru | `#D91023` | `#FFFFFF` | `#D91023` |

### Bicolors (2 bands)
| Country | Top | Bottom |
|---------|-----|--------|
| Poland | `#FFFFFF` | `#DC143C` |
| Indonesia | `#CE1126` | `#FFFFFF` |
| Monaco | `#CE1126` | `#FFFFFF` |
| Ukraine | `#005BBB` | `#FFD500` |
| Malta | `#FFFFFF` | `#CF142B` |

---

## Design guidance for the game

1. **Orientation is the only reliable discriminator** for same-color flags (Ireland vs Côte d'Ivoire; Poland vs Indonesia). Make band orientation legible even edge-on.
2. **Add a secondary cue for true twins** (Romania/Chad, Indonesia/Monaco) — a silhouette, hull shape, or serial — since color alone can't disambiguate.
3. **Emblem-bearing flags** (Mexico, Egypt, Iraq, India, Ecuador…) are safe to color-band because the color signature still reads even without the emblem.
4. Use the **Estonian tricolor as the worked example** — already on SEG-1's palette sheet (blue/black/white), the cleanest, least-confusable tricolor.

*Ready to be converted to a `country_colors.json` (country → [colors], orientation) for programmatic station skinning.*
