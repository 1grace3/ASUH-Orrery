/**
 * Notes for json file:
 source: "JPL, Keplerian Elements for Approximate Positions of the Major Planets, Table 1 (valid 1800-2050 AD). https://ssd.jpl.nasa.gov/planets/approx_pos.html",
  "_note": "Verified against JPL Table 1. Values are at the J2000 epoch; the *Dot fields are rates of change per Julian century. 'earth' is the Earth-Moon barycentre, which is what JPL tabulates. Do not swap in Table 2a for wider date ranges without also adding the b/c/s/f mean-anomaly terms from Table 2b for Jupiter through Neptune.",
  
  fields:
    "a": "semi-major axis, au (aDot in au/century)",
    "e": "eccentricity, dimensionless",
    "i": "inclination to the ecliptic, degrees",
    "L": "mean longitude, degrees (LDot is essentially the orbital rate)",
    "peri": "longitude of perihelion, degrees (JPL: long.peri.)",
    "node": "longitude of ascending node, degrees (JPL: long.node.)"
 */

/**
 * Equation: Solve Kepler's equation  M = E - e*sin(E)  for E, by Newton-Raphson.
 * There is no algebraic solution, we guess and improve. JPL reccomends opening guess E = M + e*sin(M)
 */

import * as THREE from 'three';

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const J2000 = 2451545.0; // 2000-01-01 12:00 TT
const UNIX_EPOCH_JD = 2440587.5; //Unix epoch: 1970-01-01 00:00 UTC
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const X_AXIS = new THREE.Vector3(1, 0, 0);

//convert javascript date to Julian day number
export function JulianDateFromUnixTime(t) {
    return (t.getTime() / 86400000) + UNIX_EPOCH_JD;
}

//centuries since J2000 (the T in the orbital formula. 36525 days = 1 Julian Century)
export function centuriesSinceJ2000(t) {
    return (JulianDateFromUnixTime(t) - J2000) / 36525;
}

//convert jpl data angles to [0, 2pi] range
function wrap(angle) {
  return ((angle % TAU) + TAU) % TAU;
}

//solve Kepler equation M = E - e*sin(E) for E, JPL reccomends first guess for E = M + e*sin(M)
export function solveKepler(M, e, tolerance = 1e-12, maxIterations = 12) {
    let E = M + e * Math.sin(M);
    for (let n = 0; n < maxIterations; n++) {
        //  f(E)  = E - e*sin(E) - M we want to be zero
        //  f'(E) = 1 - e*cos(E)    its slope
        const numerator = E - e * Math.sin(E) - M;
        const denominator = 1 - e * Math.cos(E);
        const step = numerator / denominator;
        E -= step;
        if (Math.abs(step) < tolerance) break;
    }
    return E;
}

//check planet's orbital variables at time T
//argument of perihelion = peri - node
//mean anomaly = L - peri
function elementsAt(el, T) {
  const peri = el.peri + el.periDot * T;
  const node = el.node + el.nodeDot * T;
  const L = el.L + el.LDot * T;
 
  return {
    a: el.a + el.aDot * T,               // AU
    e: el.e + el.eDot * T,               // unitless
    i: (el.i + el.iDot * T) * DEG,       // radians
    node: node * DEG,
    omega: (peri - node) * DEG,
    M: wrap((L - peri) * DEG),
  };
}
//Position in the orbital plane, then rotated into ecliptic coordinates.
//standard ellipse is centered on origin at  (a*cos E, b*sin E) with * b = a*sqrt(1-e^2). We want the Sun at origin instead. Subtracting e from cos E
function positionFromElements(a, e, i, omega, node, M, out) {
  const E = solveKepler(M, e);
 
  const xInPlane = a * (Math.cos(E) - e);
  const yInPlane = a * Math.sqrt(1 - e * e) * Math.sin(E);
 
  return out.set(xInPlane, yInPlane, 0)
    .applyAxisAngle(Z_AXIS, omega)
    .applyAxisAngle(X_AXIS, i)
    .applyAxisAngle(Z_AXIS, node);
}

//heliocentric position of a planet at a given time, result in AU ecliptic J2000 z perpendicular to ecliptic plane.
export function heliocentricPosition(el, T, out = new THREE.Vector3()) {
  const k = elementsAt(el, T);
  return positionFromElements(k.a, k.e, k.i, k.omega, k.node, k.M, out);
}

//sample full orbit as array of points for drawing orbital path
export function sampleOrbit(el, T, segments = 256) {
  const k = elementsAt(el, T);
  const points = [];
 
  for (let s = 0; s < segments; s++) {
    const M = (s / segments) * TAU;
    points.push(
      positionFromElements(k.a, k.e, k.i, k.omega, k.node, M, new THREE.Vector3())
    );
  }
 
  return points;
}

//map real pos in AU to scene units. 82 * AU^0.35 rule
export function toSceneUnits(auPosition, out = new THREE.Vector3()) {
  const au = auPosition.length();
  if (au === 0) return out.set(0, 0, 0);
 
  const scale = (82 * Math.pow(au, 0.35)) / au;
 
  return out.set(
    auPosition.x * scale,
    auPosition.z * scale,
    -auPosition.y * scale
  );
}
