import type { Food, GameSnapshot, Point, Snake, World } from "@repo/types";

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

const FOOD_RADIUS = 8;
const FOOD_SIDES = 6;
const FOOD_ANGLE = (Math.PI * 2) / FOOD_SIDES;
const TILE_SIZE = 50;
const GRID_LINE_WIDTH = 2;
const EYE_WHITE_RATIO = 0.23;
const EYE_BLACK_RATIO = 0.12;
const EYE_LATERAL_RATIO = 0.25;
const EYE_FORWARD_RATIO = 0.125;
const PUPIL_FORWARD_RATIO = 0.12;

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function inBbox(p: Point, margin: number, b: Bbox): boolean {
  return (
    p.x + margin >= b.x &&
    p.x - margin <= b.x + b.w &&
    p.y + margin >= b.y &&
    p.y - margin <= b.y + b.h
  );
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  world: World,
  view: Bbox
) {
  const startX = Math.max(Math.floor(view.x / TILE_SIZE) * TILE_SIZE, 0);
  const startY = Math.max(Math.floor(view.y / TILE_SIZE) * TILE_SIZE, 0);
  const endX = Math.min(view.x + view.w, world.WIDTH);
  const endY = Math.min(view.y + view.h, world.HEIGHT);

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
    for (let i = 0; i < FOOD_SIDES; i++) {
      const x = item.x + FOOD_RADIUS * Math.cos(FOOD_ANGLE * i);
      const y = item.y + FOOD_RADIUS * Math.sin(FOOD_ANGLE * i);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
  ctx.fill();
}

function drawSnakeBody(
  ctx: CanvasRenderingContext2D,
  snake: Snake,
  view: Bbox
) {
  const half = snake.size / 2;

  ctx.fillStyle = snake.color;
  ctx.strokeStyle = snake.accent;
  ctx.lineWidth = Math.max(1.3, snake.size * 0.036);

  for (let i = snake.body.length - 1; i >= 0; i--) {
    const section = snake.body[i]!;
    if (!inBbox(section, half, view)) continue;

    ctx.beginPath();
    ctx.arc(section.x, section.y, half, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function rotateLocal(angle: number, x: number, y: number): Point {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

function drawEyes(ctx: CanvasRenderingContext2D, snake: Snake) {
  const size = snake.size;
  const whiteRadius = size * EYE_WHITE_RATIO;
  const blackRadius = size * EYE_BLACK_RATIO;
  const lateral = size * EYE_LATERAL_RATIO;
  const forward = size * EYE_FORWARD_RATIO;
  const pupilForward = size * PUPIL_FORWARD_RATIO;

  const left = rotateLocal(snake.angle, -lateral, -forward);
  const right = rotateLocal(snake.angle, lateral, -forward);
  const pupil = rotateLocal(snake.angle, 0, -pupilForward);

  const lx = snake.head.x + left.x;
  const ly = snake.head.y + left.y;
  const rx = snake.head.x + right.x;
  const ry = snake.head.y + right.y;

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(lx, ly, whiteRadius, 0, Math.PI * 2);
  ctx.arc(rx, ry, whiteRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(lx + pupil.x, ly + pupil.y, blackRadius, 0, Math.PI * 2);
  ctx.arc(rx + pupil.x, ry + pupil.y, blackRadius, 0, Math.PI * 2);
  ctx.fill();
}

export function pickCameraTarget(
  snapshot: GameSnapshot,
  followingId: string | null
): Point & { followingId: string | null } {
  if (followingId) {
    const selected = snapshot.snakes.find((snake) => snake.id === followingId);
    if (selected?.alive) return { ...selected.head, followingId: selected.id };
  }

  const firstLiving = snapshot.snakes.find((snake) => snake.alive);
  if (firstLiving) return { ...firstLiving.head, followingId: firstLiving.id };

  const world = snapshot.world;
  return {
    x: world.WIDTH / 2,
    y: world.HEIGHT / 2,
    followingId: null,
  };
}

export function advanceCamera(
  camera: Camera,
  viewport: Viewport,
  world: World
): void {
  const halfW = Math.min(viewport.width / 2, world.WIDTH / 2);
  const halfH = Math.min(viewport.height / 2, world.HEIGHT / 2);
  camera.x = clamp(camera.x, halfW, world.WIDTH - halfW);
  camera.y = clamp(camera.y, halfH, world.HEIGHT - halfH);
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  snapshot: GameSnapshot,
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

  drawBackground(ctx, snapshot.world, view);
  drawFood(ctx, snapshot.food, view);

  for (const snake of snapshot.snakes) {
    if(!snake.alive) continue;
    drawSnakeBody(ctx, snake, view);

    if (inBbox(snake.head, snake.size + 40, view)) {
      drawEyes(ctx, snake);
    }
  }

  ctx.restore();
}
