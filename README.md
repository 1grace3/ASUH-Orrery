# ASUH-Orrery

Interactive 3D solar system visualizer built for ASUH to demonstrate planetary
scale and distance. Planets are positioned from real JPL orbital elements, so
what you see is roughly where they actually are right now.

Built with [three.js](https://threejs.org/) and [Vite](https://vitejs.dev/).
No framework.

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
```

## How it works

### Scene graph

Every body is a nest of empty `Object3D`s, so orbital and axial motion come from
parent transforms rather than trigonometry:

```
orbitPlane      tilted by orbital inclination     (static)
└─ orbitAnchor  rotates on Y                      <- the orbit
   └─ pivot     offset out to the orbital radius  (static)
      ├─ tilt   tilted by axial tilt              (static)
      │  └─ mesh  the sphere, rotates on Y        <- the spin
      └─ moons   same pattern, one level down
```

Moons attach to `pivot`, not to `mesh` — otherwise they would inherit the
planet's spin and orbit hundreds of times too fast.

Planets are the exception: their positions come from the ephemeris as absolute
coordinates, so `orbitPlane` and `orbitAnchor` are zeroed and `pivot.position`
is written directly each frame.

### Orbital mechanics

`src/systems/kepler_approx_location.js` implements Kepler's method:

1. Evaluate each planet's six orbital elements at the current date
2. Compute the mean anomaly `M` — where the planet would be at constant speed
3. Solve `M = E - e*sin(E)` for the eccentric anomaly `E` by Newton-Raphson
   (no algebraic solution exists, so it iterates)
4. Convert `E` to a position in the orbital plane
5. Rotate that plane into ecliptic coordinates

### Scale

Real proportions are unusable — Jupiter is 28x Mercury's radius, Neptune orbits
78x further out. Two numbers are compressed and everything else is left real:

- **Radius:** `sqrt(realRadius / earthRadius)` — squeezes 28:1 down to 5:1
- **Distance:** `82 * AU^0.35` — squeezes 78:1 down to 4.6:1

Both are monotonic, so every real ordering survives. Ganymede and Titan still
come out larger than Mercury, which is true. Periods, tilts and inclinations
are unmodified.

### Time

`src/systems/time.js` owns a simulated `Date`. Planet positions are computed
from that date rather than accumulated, so reversing and scrubbing work exactly
and there is no drift over long sessions.

The slider has thirteen named rates mirrored in both directions, from
1 sec = 1 sec out to 1 sec = 1 year.

## Layout

```
data/                  planet, moon, fact and orbital-element JSON
public/textures/       surface maps
src/
  main.js              entry point, animation loop
  scene/bodies.js      builds the scene graph from JSON
  systems/
    renderer.js        WebGL renderer and resize handling
    kepler_approx_location.js
    time.js            simulation clock and rate table
    selection.js       raycast picking and camera framing
  ui/                  top bar, time slider, search, fact sheet, body label
```

## Sources

Body dimensions, periods, tilts: [NASA Planetary Fact Sheets](https://nssdc.gsfc.nasa.gov/planetary/factsheet/)

Orbital elements: [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/)

Textures: [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC-BY 4.0)

Calculations for approximate live planet coordinates: [Formulae for using the Keplerian elements](https://ssd.jpl.nasa.gov/planets/approx_pos.html#tables)
