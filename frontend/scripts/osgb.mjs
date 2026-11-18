// Turns an Ordnance Survey National Grid reference (eastings and northings, in metres) into latitude and longitude on the GPS datum (WGS84), which is what postcodes.io
// gives for a postcode. Used by the data builds that place schools on a map; accurate to a few metres, far finer than "which schools are within three miles".
//
// The method is the one Ordnance Survey publishes in "A guide to coordinate systems in Great Britain": undo the National Grid's Transverse Mercator projection on the
// Airy 1830 ellipsoid, then shift from the old OSGB36 datum to WGS84 with a seven-parameter Helmert transformation.

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

const AIRY = { a: 6377563.396, b: 6356256.909 };
const WGS84 = { a: 6378137, b: 6356752.314245 };
const GRID = { F0: 0.9996012717, lat0: rad(49), lon0: rad(-2), N0: -100000, E0: 400000 };
// OSGB36 to WGS84: translation in metres, scale in parts per million, rotation in arc seconds.
const HELMERT = { tx: 446.448, ty: -125.157, tz: 542.06, s: -20.4894, rx: 0.1502, ry: 0.247, rz: 0.8421 };

function gridToLatLonOsgb36(E, N) {
  const { a, b } = AIRY;
  const { F0, lat0, lon0, N0, E0 } = GRID;
  const e2 = 1 - (b * b) / (a * a);
  const n = (a - b) / (a + b);
  const n2 = n * n, n3 = n * n * n;
  let lat = lat0, M = 0;
  do {
    lat = (N - N0 - M) / (a * F0) + lat;
    const Ma = (1 + n + (5 / 4) * n2 + (5 / 4) * n3) * (lat - lat0);
    const Mb = (3 * n + 3 * n2 + (21 / 8) * n3) * Math.sin(lat - lat0) * Math.cos(lat + lat0);
    const Mc = ((15 / 8) * n2 + (15 / 8) * n3) * Math.sin(2 * (lat - lat0)) * Math.cos(2 * (lat + lat0));
    const Md = (35 / 24) * n3 * Math.sin(3 * (lat - lat0)) * Math.cos(3 * (lat + lat0));
    M = b * F0 * (Ma - Mb + Mc - Md);
  } while (Math.abs(N - N0 - M) >= 0.00001);
  const sin = Math.sin(lat), cos = Math.cos(lat), tan = Math.tan(lat);
  const nu = (a * F0) / Math.sqrt(1 - e2 * sin * sin);
  const rho = (a * F0 * (1 - e2)) / Math.pow(1 - e2 * sin * sin, 1.5);
  const eta2 = nu / rho - 1;
  const sec = 1 / cos;
  const VII = tan / (2 * rho * nu);
  const VIII = (tan / (24 * rho * Math.pow(nu, 3))) * (5 + 3 * tan * tan + eta2 - 9 * tan * tan * eta2);
  const IX = (tan / (720 * rho * Math.pow(nu, 5))) * (61 + 90 * tan * tan + 45 * Math.pow(tan, 4));
  const X = sec / nu;
  const XI = (sec / (6 * Math.pow(nu, 3))) * (nu / rho + 2 * tan * tan);
  const XII = (sec / (120 * Math.pow(nu, 5))) * (5 + 28 * tan * tan + 24 * Math.pow(tan, 4));
  const XIIA = (sec / (5040 * Math.pow(nu, 7))) * (61 + 662 * tan * tan + 1320 * Math.pow(tan, 4) + 720 * Math.pow(tan, 6));
  const dE = E - E0;
  return {
    lat: lat - VII * dE ** 2 + VIII * dE ** 4 - IX * dE ** 6,
    lon: lon0 + X * dE - XI * dE ** 3 + XII * dE ** 5 - XIIA * dE ** 7,
  };
}

function toCartesian({ lat, lon }, { a, b }) {
  const e2 = 1 - (b * b) / (a * a);
  const nu = a / Math.sqrt(1 - e2 * Math.sin(lat) ** 2);
  return [nu * Math.cos(lat) * Math.cos(lon), nu * Math.cos(lat) * Math.sin(lon), nu * (1 - e2) * Math.sin(lat)];
}

function fromCartesian([x, y, z], { a, b }) {
  const e2 = 1 - (b * b) / (a * a);
  const p = Math.sqrt(x * x + y * y);
  let lat = Math.atan2(z, p * (1 - e2));
  for (let i = 0; i < 10; i += 1) {
    const nu = a / Math.sqrt(1 - e2 * Math.sin(lat) ** 2);
    lat = Math.atan2(z + e2 * nu * Math.sin(lat), p);
  }
  return { lat, lon: Math.atan2(y, x) };
}

export function gridToLatLon(easting, northing) {
  const osgb = gridToLatLonOsgb36(easting, northing);
  const [x, y, z] = toCartesian(osgb, AIRY);
  const s = HELMERT.s / 1e6 + 1;
  const rx = rad(HELMERT.rx / 3600), ry = rad(HELMERT.ry / 3600), rz = rad(HELMERT.rz / 3600);
  const moved = [
    HELMERT.tx + x * s - y * rz + z * ry,
    HELMERT.ty + x * rz + y * s - z * rx,
    HELMERT.tz - x * ry + y * rx + z * s,
  ];
  const { lat, lon } = fromCartesian(moved, WGS84);
  return { lat: deg(lat), lon: deg(lon) };
}
