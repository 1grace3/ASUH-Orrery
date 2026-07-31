# ASUH-Orrery

Interactive 3D solar system visualizer built for ASUH to demonstrate planetary scale and distance. 
Planets are positioned from real JPL orbital elements, so locations are live approximations of what they are right now.


Built with [three.js](https://threejs.org/) and [Vite](https://vitejs.dev/).


### Orbital mechanics

`src/systems/kepler_approx_location.js` implements Kepler's method:

1. Evaluate each planet's six orbital elements at the current date
2. Compute the mean anomaly `M` (where the planet would be at constant speed)
3. Solve `M = E - e*sin(E)` for the eccentric anomaly `E` by Newton-Raphson
   (no algebraic solution exists, so it iterates)
4. Convert `E` to a position in the orbital plane
5. Rotate that plane into ecliptic coordinates

### Scale

Proportions were compressed for artistic clarity.

- **Radius:** `sqrt(realRadius / earthRadius)` turns 28:1 down to 5:1
- **Distance:** `82 * AU^0.35` 78:1 down to 4.6:1

Periods, tilts and inclinations are unmodified.

### Time

The slider has thirteen named rates going backwards and forwards from
1 sec = 1 sec out to 1 sec = 1 year.


## Sources

Body dimensions, periods, tilts: [NASA Planetary Fact Sheets](https://nssdc.gsfc.nasa.gov/planetary/factsheet/)

Orbital elements: [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/)

Textures: [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC-BY 4.0) (Not yet implemented)

Calculations for approximate live planet coordinates: [Formulae for using the Keplerian elements](https://ssd.jpl.nasa.gov/planets/approx_pos.html#tables)
