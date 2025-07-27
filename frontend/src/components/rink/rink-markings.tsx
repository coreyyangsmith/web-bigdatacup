import { RINK_L, RINK_W, CORNER_R, CENTER_X, BLUE_FROM_BOARD, GOAL_FROM_BOARD, CENTER_CIRCLE_R } from "./geometry";

export function RinkMarkings({ toScreenX, toScreenY, left, top, rinkWpx, rinkHpx, sx }: any) {
  const centerYft = RINK_W / 2;

  return (
    <g>
      <rect x={left} y={top} width={rinkWpx} height={rinkHpx}
            rx={CORNER_R * sx} ry={CORNER_R * sx} fill="#fff" stroke="#1e293b" strokeWidth={2} />
      <line x1={toScreenX(CENTER_X)} y1={top} x2={toScreenX(CENTER_X)} y2={top+rinkHpx} stroke="#dc2626" strokeWidth={2}/>
      <line x1={toScreenX(BLUE_FROM_BOARD)} y1={top} x2={toScreenX(BLUE_FROM_BOARD)} y2={top+rinkHpx} stroke="#3b82f6" strokeWidth={2}/>
      <line x1={toScreenX(RINK_L - BLUE_FROM_BOARD)} y1={top} x2={toScreenX(RINK_L - BLUE_FROM_BOARD)} y2={top+rinkHpx} stroke="#3b82f6" strokeWidth={2}/>
      <line x1={toScreenX(GOAL_FROM_BOARD)} y1={top} x2={toScreenX(GOAL_FROM_BOARD)} y2={top+rinkHpx} stroke="#dc2626" strokeWidth={2}/>
      <line x1={toScreenX(RINK_L - GOAL_FROM_BOARD)} y1={top} x2={toScreenX(RINK_L - GOAL_FROM_BOARD)} y2={top+rinkHpx} stroke="#dc2626" strokeWidth={2}/>
      <circle cx={toScreenX(CENTER_X)} cy={toScreenY(centerYft)} r={CENTER_CIRCLE_R * sx} fill="none" stroke="#3b82f6" strokeWidth={2}/>
      <circle cx={toScreenX(CENTER_X)} cy={toScreenY(centerYft)} r={6 * sx / 2} fill="#3b82f6"/>
      {/* add faceoff circles/dots using END_DOT_X, END_DOT_Y_OFF, NZ_DOT_FROM_BLUE */}
    </g>
  );
}
