export interface SceneAsset {
  src: string;
  width: number;
  height: number;
}

// Generated from public/assets/*.svg by `npm run assets:scenes`.
// Sizes are the trimmed intrinsic pixel sizes; keep rendered widths near these
// values, as the sources are low resolution.
export const sceneAssets = {
  mars: { src: "/assets/scenes/mars.webp", width: 349, height: 352 },
  satellite: { src: "/assets/scenes/satellite.webp", width: 497, height: 288 },
  asteroidField: { src: "/assets/scenes/asteroid-field.webp", width: 367, height: 262 },
  // Exported as "Orbital station", but it stands on landing struts: a surface habitat.
  habitatModule: { src: "/assets/scenes/habitat-module.webp", width: 764, height: 399 },
  marsRover: { src: "/assets/scenes/mars-rover.webp", width: 652, height: 380 },
  explorationDrone: { src: "/assets/scenes/exploration-drone.webp", width: 499, height: 173 },
  marsTerrain: { src: "/assets/scenes/mars-terrain.webp", width: 378, height: 171 },
  astronaut: { src: "/assets/scenes/astronaut.webp", width: 322, height: 718 },
  astronautHelmet: { src: "/assets/scenes/astronaut-helmet.webp", width: 244, height: 249 },
} as const satisfies Record<string, SceneAsset>;
