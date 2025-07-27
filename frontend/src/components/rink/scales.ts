import { RINK_L, RINK_W } from "./geometry";

export type Orientation = "eventing-left" | "home-left" | "absolute";

export function makeScales(width: number, height: number) {
  const rinkWpx = width * 0.9;
  const rinkHpx = rinkWpx * (RINK_W / RINK_L);              // preserve ratio
  const left = (width - rinkWpx) / 2;
  const top = (height - rinkHpx) / 2;
  const sx = rinkWpx / RINK_L;
  const sy = rinkHpx / RINK_W;

  const toScreenX = (xFt: number) => left + (RINK_L - xFt) * sx;     // data X: 200→0
  const toScreenY = (yFt: number) => top + (RINK_W - yFt) * sy;      // data Y: 85→0

  return { rinkWpx, rinkHpx, left, top, sx, sy, toScreenX, toScreenY };
}

// Big Data Cup coords are from the eventing team perspective.
// Flip logic to normalize to “home attacks left” or absolute arena frame.
export function orientFeet(
  xFt: number,
  yFt: number,
  team: "home" | "away",
  eventingTeam: "home" | "away",
  orientation: Orientation
) {
  let x = xFt, y = yFt;

  if (orientation === "home-left") {
    if (eventingTeam !== "home") { x = RINK_L - x; y = RINK_W - y; }
  } else if (orientation === "absolute") {
    // arena-fixed: left=0→right=200
    x = RINK_L - x;
    y = RINK_W - y;
  }
  return { x, y };
}
