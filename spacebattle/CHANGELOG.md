# SpaceBattle v2.2 Development Notes

## Version History

### v2.1_starfield (Backup: 2026-04-08 03:24 UTC)
- Accidentally put starfield on landing page instead of in-game
- Starfield not rendering due to ShaderMaterial issues
- No thrust sounds
- Basic lighting only

### v2.2 (Current: 2026-04-08 03:26 UTC)
**Changes Made:**

1. **Landing Page Fixed**
   - Removed misplaced starfield canvas from menu
   - Restored original dark gradient background
   - Starfield was supposed to be IN-GAME, not on landing

2. **Starfield Fixed**
   - Changed from ShaderMaterial to PointsMaterial
   - ShaderMaterial had shader compilation issues
   - PointsMaterial is reliable and renders correctly
   - 8000 stars with white/orange/blue colors
   - renderOrder = -1000 ensures stars render first

3. **Dual Systems Lighting Added**
   - Sun 1: Warm orange point light (0xffaa44, intensity 2)
   - Sun 2: Cool blue point light (0x44aaff, intensity 1.5)
   - Both cast shadows
   - Ambient light reduced to 0.3 for dramatic contrast
   - Solar positions: (-400, 200, -400) and (400, -100, 400)

4. **N'og nog Gravity Added**
   - Two gravity sources matching sun positions
   - Gravity formula: force = strength / distance²
   - Gravity range: 800 units
   - Sun 1: strength 50000 (closer, stronger)
   - Sun 2: strength 35000 (farther, weaker)
   - Ships get pulled toward suns when nearby
   - Applied every frame in player update

5. **Thrust Sound Added**
   - Sawtooth oscillator for engine rumble
   - Frequency sweep: 80Hz → 60Hz
   - Lowpass filter at 800Hz for muffled sound
   - 100ms duration with exponential decay
   - Throttled to prevent sound spam (150ms cooldown)
   - Plays when W or S pressed

6. **Backup Created**
   - `js_backup_v2.1_starfield/`
   - `index_backup_v2.1_starfield.html`

## File Locations
- Main: `/var/www/myl0nr0s.cloud/spacebattle/`
- v2: `/var/www/myl0nr0s.cloud/spacebattle/v2/`
- Live URL: https://myl0nr0s.cloud/spacebattle/

## Testing Checklist
- [ ] Landing page shows gradient background (no starfield)
- [ ] In-game stars visible
- [ ] Two suns visible with lighting effects
- [ ] Thrust sound plays on W/S
- [ ] Laser sound plays on Space
- [ ] Gravity pulls ship toward suns
- [ ] Shadows render on ships
- [ ] No console errors

## Next Ideas
- Add engine hum loop (continuous sound)
- Add warp effect sounds
- Shield hit sounds already exist
- Explosion sounds already exist
- Consider background music
