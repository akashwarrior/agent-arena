import { WORLD, type Agent, type Food, type Point } from "@repo/shared";

type RenderPoint = Pick<Point, "x" | "y">;

export type Viewport = {
  width: number;
  height: number;
  ratio: number;
};

export type Camera = {
  x: number;
  y: number;
  followingId: string | null;
};

type Bbox = { x: number; y: number; w: number; h: number };

const TAU = Math.PI * 2;
const FOOD_RADIUS = 8;
const FOOD_SIDES = 6;
const FOOD_ANGLE = TAU / FOOD_SIDES;
const TILE_SIZE = 50;
const GRID_LINE_WIDTH = 2;
const EYE_WHITE_RATIO = 0.23;
const EYE_BLACK_RATIO = 0.12;
const EYE_LATERAL_RATIO = 0.25;
const EYE_FORWARD_RATIO = 0.125;
const PUPIL_FORWARD_RATIO = 0.12;
const FOOD_POINTS: RenderPoint[] = Array.from(
  { length: FOOD_SIDES },
  (_, i) => ({
    x: FOOD_RADIUS * Math.cos(FOOD_ANGLE * i),
    y: FOOD_RADIUS * Math.sin(FOOD_ANGLE * i),
  })
);

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function inBbox(p: RenderPoint, margin: number, b: Bbox): boolean {
  return (
    p.x + margin >= b.x &&
    p.x - margin <= b.x + b.w &&
    p.y + margin >= b.y &&
    p.y - margin <= b.y + b.h
  );
}

function drawBackground(ctx: CanvasRenderingContext2D, view: Bbox) {
  const startX = Math.max(Math.floor(view.x / TILE_SIZE) * TILE_SIZE, 0);
  const startY = Math.max(Math.floor(view.y / TILE_SIZE) * TILE_SIZE, 0);
  const endX = Math.min(view.x + view.w, WORLD.width);
  const endY = Math.min(view.y + view.h, WORLD.height);

  ctx.fillStyle = "#d4d4d4";
  ctx.fillRect(startX, startY, endX - startX, endY - startY);
  ctx.strokeStyle = "#b0b0b0";
  ctx.lineWidth = GRID_LINE_WIDTH;
  ctx.beginPath();

  for (let x = startX; x <= endX; x += TILE_SIZE) {
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
  }
  for (let y = startY; y <= endY; y += TILE_SIZE) {
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
  }
  ctx.stroke();
}

function drawFood(ctx: CanvasRenderingContext2D, food: Food[], view: Bbox) {
  ctx.fillStyle = "#ff0000";
  ctx.beginPath();
  for (const item of food) {
    if (!inBbox(item, FOOD_RADIUS, view)) continue;

    const first = FOOD_POINTS[0]!;
    ctx.moveTo(item.x + first.x, item.y + first.y);
    for (let i = 1; i < FOOD_POINTS.length; i++) {
      const point = FOOD_POINTS[i]!;
      ctx.lineTo(item.x + point.x, item.y + point.y);
    }
    ctx.closePath();
  }
  ctx.fill();
}

function drawAgentBody(
  ctx: CanvasRenderingContext2D,
  agent: Agent,
  view: Bbox
) {
  const half = agent.size / 2;

  ctx.fillStyle = agent.color;
  ctx.strokeStyle = agent.accent;
  ctx.lineWidth = Math.max(1.3, agent.size * 0.036);

  for (let i = agent.body.length - 1; i >= 0; i--) {
    const section = agent.body[i]!;
    if (!inBbox(section, half, view)) continue;

    ctx.beginPath();
    ctx.arc(section.x, section.y, half, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
}

function drawEyes(ctx: CanvasRenderingContext2D, agent: Agent) {
  if (!agent.head) return;

  const size = agent.size;
  const headX = agent.head.x;
  const headY = agent.head.y;
  const whiteRadius = size * EYE_WHITE_RATIO;
  const blackRadius = size * EYE_BLACK_RATIO;
  const lateral = size * EYE_LATERAL_RATIO;
  const forward = size * EYE_FORWARD_RATIO;
  const pupilForward = size * PUPIL_FORWARD_RATIO;
  const sin = Math.sin(agent.angle);
  const cos = Math.cos(agent.angle);

  const lx = headX - lateral * cos + forward * sin;
  const ly = headY - lateral * sin - forward * cos;
  const rx = headX + lateral * cos + forward * sin;
  const ry = headY + lateral * sin - forward * cos;
  const pupilX = pupilForward * sin;
  const pupilY = -pupilForward * cos;

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(lx, ly, whiteRadius, 0, TAU);
  ctx.arc(rx, ry, whiteRadius, 0, TAU);
  ctx.fill();

  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(lx + pupilX, ly + pupilY, blackRadius, 0, TAU);
  ctx.arc(rx + pupilX, ry + pupilY, blackRadius, 0, TAU);
  ctx.fill();
}

export function pickCameraTarget(
  agents: Agent[],
  followingId: string | null
): RenderPoint & { followingId: string | null } {
  if (followingId) {
    const selected = agents.find((a) => a.id === followingId);
    if (selected?.alive && selected.head) {
      return { ...selected.head, followingId: selected.id };
    }
  }

  const firstLiving = agents.find((a) => a.alive);
  if (firstLiving?.head) {
    return { ...firstLiving.head, followingId: firstLiving.id };
  }

  return {
    x: WORLD.width / 2,
    y: WORLD.height / 2,
    followingId: null,
  };
}

export function advanceCamera(camera: Camera, viewport: Viewport): void {
  const halfW = Math.min(viewport.width / 2, WORLD.width / 2);
  const halfH = Math.min(viewport.height / 2, WORLD.height / 2);
  camera.x = clamp(camera.x, halfW, WORLD.width - halfW);
  camera.y = clamp(camera.y, halfH, WORLD.height - halfH);
}

type Snapshot = {
  agents: Agent[];
  food: Food[];
};

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  snapshot: Snapshot,
  camera: Camera
): void {
  ctx.setTransform(viewport.ratio, 0, 0, viewport.ratio, 0, 0);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  ctx.save();
  ctx.translate(viewport.width / 2 - camera.x, viewport.height / 2 - camera.y);

  const view: Bbox = {
    x: camera.x - viewport.width / 2,
    y: camera.y - viewport.height / 2,
    w: viewport.width,
    h: viewport.height,
  };

  drawBackground(ctx, view);
  drawFood(ctx, snapshot.food, view);

  for (const agent of snapshot.agents) {
    if (!agent.alive) continue;
    drawAgentBody(ctx, agent, view);

    if (agent.head && inBbox(agent.head, agent.size + 40, view)) {
      drawEyes(ctx, agent);
    }
  }

  ctx.restore();
}
