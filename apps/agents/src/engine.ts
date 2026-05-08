import { heuristicStrategy, resetStrategyMemory } from "./strategy";
import type { Food, GameSnapshot, Point, Snake, World } from "@repo/types";

const SNAKE_SEEDS = [
  { id: "deepseek", name: "DeepSeek", color: "#60a5fa", accent: "#006ff6" },
  { id: "claude", name: "Claude", color: "#f97316", accent: "#d37100" },
  { id: "openai", name: "OpenAI", color: "#34d399", accent: "#007d2c" },
  { id: "gemini", name: "Gemini", color: "#a78bfa", accent: "#5934ff" },
  { id: "grok", name: "Grok", color: "#f43f5e", accent: "#bf0016" },
] as const;

const MATCH_DURATION = 3 * 60 * 1000;

const SPRITE_SIZE = 60;
const INITIAL_SCALE = 0.6;
const BASE_SIZE = SPRITE_SIZE * INITIAL_SCALE;
const INITIAL_TAIL_SECTIONS = 30;
const SPEED = 130;
const SIZE_GROWTH_FACTOR = 1.01;
const EDGE_OFFSET = 4;

const FOOD_COUNT = 100;
const FOOD_SIZE = 8;
const FOOD_PULL_PER_FRAME = 14;

const WORLD: World = {
  WIDTH: 1600,
  HEIGHT: 1000,
};

type SnakeInternal = Snake & {
  headPath: Point[];
};

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function randomInt(min: number, max: number): number {
  return (
    Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) +
    Math.ceil(min)
  );
}

function distanceSquared(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function preferredDistance(size: number): number {
  return 17 * (size / SPRITE_SIZE);
}

function createFood(id: string, x: number, y: number): Food {
  return { id, x, y };
}

function createRandomFood(id: string): Food {
  return createFood(id, randomInt(0, WORLD.WIDTH), randomInt(0, WORLD.HEIGHT));
}

function spawnOffset(index: number): Point {
  return {
    x: (index - (SNAKE_SEEDS.length - 1) / 2) * 200,
    y: 0,
  };
}

function createSnake(
  seed: (typeof SNAKE_SEEDS)[number],
  index: number,
): SnakeInternal {
  const offset = spawnOffset(index);
  const head = {
    x: WORLD.WIDTH / 2 + offset.x,
    y: WORLD.HEIGHT / 2 + offset.y,
  };
  const headPath: Point[] = [{ x: head.x, y: head.y }];

  for (let i = 1; i <= INITIAL_TAIL_SECTIONS; i++) {
    headPath.push({
      x: head.x,
      y: head.y + i * preferredDistance(BASE_SIZE),
    });
  }

  return {
    id: seed.id,
    name: seed.name,
    color: seed.color,
    accent: seed.accent,
    alive: true,
    score: 0,
    size: BASE_SIZE,
    angle: 0,
    head,
    body: [],
    length: INITIAL_TAIL_SECTIONS + 1,
    survivedMs: 0,
    rank: null,
    headPath: headPath,
  };
}

function nextSectionIndex(
  headPath: Point[],
  currentIndex: number,
  sectionDistance: number,
): number {
  let len = 0;
  let dif = len - sectionDistance;
  let i = currentIndex;
  let prevDif: number | null = null;

  while (i + 1 < headPath.length && dif < 0) {
    const current = headPath[i]!;
    const next = headPath[i + 1]!;
    len += Math.hypot(current.x - next.x, current.y - next.y);
    prevDif = dif;
    dif = len - sectionDistance;
    i++;
  }

  if (prevDif === null || Math.abs(prevDif) > Math.abs(dif)) return i;
  return i - 1;
}

export class GameEngine {
  public readonly roundId: string;
  public readonly roundNumber: number;
  private remainingMs: number = MATCH_DURATION;
  private elapsedMs: number;
  private startedAt: number;
  private food: Food[];
  private snakes: Snake[];
  private winnerId: string | null = null;
  private readonly internals = new Map<string, SnakeInternal>();
  private nextFoodSeq = 0;

  constructor(roundNumber: number) {
    this.roundId = `round-${roundNumber}}`;
    this.roundNumber = roundNumber;
    this.elapsedMs = 0;

    this.food = [];
    for (let i = 0; i < FOOD_COUNT; i++) {
      this.food.push(createRandomFood(this.nextFoodId()));
    }

    resetStrategyMemory();
    this.snakes = [];

    SNAKE_SEEDS.forEach((seed, index) => {
      const snake = createSnake(seed, index);
      this.snakes.push(snake);
      this.internals.set(snake.id, snake);
    });

    for (const snake of this.internals.values()) {
      this.recomputeSections(snake);
    }
    this.updateRanks();
    this.startedAt = Date.now();
  }

  public isMatchComplete(): boolean {
    if (this.remainingMs <= 0) return true;

    let alive = 0;
    for (const snake of this.snakes) {
      if (snake.alive) alive++;
    }
    return alive <= 1;
  }

  public finishMatch(): void {
    this.updateRanks();
    this.winnerId = this.snakes[0]?.id ?? null;
    this.remainingMs = 0;
  }

  public tick(deltaSeconds: number, now: number): void {
    const elapsedMs = clamp(now - this.startedAt, 0, MATCH_DURATION);
    this.elapsedMs = elapsedMs;
    this.remainingMs = Math.max(0, MATCH_DURATION - elapsedMs);

    for (const snake of this.internals.values()) {
      if (!snake.alive) continue;
      snake.survivedMs = elapsedMs;
      snake.angle = heuristicStrategy({ self: snake, deltaSeconds });
      this.moveSnake(snake, deltaSeconds);
      const lastIndex = this.recomputeSections(snake);
      this.adjustHeadPath(snake, lastIndex);
    }

    this.handleFoodTouches(deltaSeconds);
    this.resolveCollisions();
    this.updateRanks();
  }

  public getSnapshot(): GameSnapshot {
    return {
      startedAt: this.startedAt,
      roundNumber: this.roundNumber,
      elapsedMs: this.elapsedMs,
      durationMs: MATCH_DURATION,
      roundId: this.roundId,
      world: WORLD,
      snakes: this.snakes,
      food: this.food,
      remainingMs: this.remainingMs,
      winnerId: this.winnerId,
    };
  }

  private nextFoodId(): string {
    return `f${this.roundNumber}-${this.nextFoodSeq++}`;
  }

  private moveSnake(snake: SnakeInternal, deltaSeconds: number): void {
    const padding = snake.size * 0.5;
    const minX = padding;
    const minY = padding;
    const maxX = WORLD.WIDTH - padding;
    const maxY = WORLD.HEIGHT - padding;

    let nextX = snake.head.x + Math.sin(snake.angle) * SPEED * deltaSeconds;
    let nextY = snake.head.y - Math.cos(snake.angle) * SPEED * deltaSeconds;

    const hitWall =
      nextX < minX || nextX > maxX || nextY < minY || nextY > maxY;

    if (hitWall) {
      nextX = clamp(nextX, minX, maxX);
      nextY = clamp(nextY, minY, maxY);
      snake.angle = Math.atan2(
        WORLD.WIDTH / 2 - nextX,
        nextY - WORLD.HEIGHT / 2,
      );
    }

    snake.head.x = nextX;
    snake.head.y = nextY;

    snake.headPath.pop();
    snake.headPath.unshift({ x: nextX, y: nextY });
  }

  private recomputeSections(snake: SnakeInternal): number {
    const { body, headPath, length, size } = snake;
    let index = 0;
    let written = 0;
    const sectionDistance = preferredDistance(size);

    for (let i = 0; i < length; i++) {
      const point = headPath[index];
      if (!point) break;

      let section = body[written];
      if (!section) {
        section = { x: 0, y: 0 };
        body[written] = section;
      }
      section.x = point.x;
      section.y = point.y;
      written++;

      index = nextSectionIndex(headPath, index, sectionDistance);
    }

    body.length = written;
    return index;
  }

  private adjustHeadPath(snake: SnakeInternal, lastIndex: number): void {
    if (snake.headPath.length === 0) {
      snake.headPath.push({ x: snake.head.x, y: snake.head.y });
      return;
    }

    if (lastIndex >= snake.headPath.length - 1) {
      const last = snake.headPath[snake.headPath.length - 1]!;
      snake.headPath.push({ x: last.x, y: last.y });
    } else {
      snake.headPath.pop();
    }
  }

  private handleFoodTouches(deltaSeconds: number): void {
    const pull = FOOD_PULL_PER_FRAME * (deltaSeconds * 60);

    for (const snake of this.internals.values()) {
      if (!snake.alive) continue;
      const reach = snake.size * 0.5 + FOOD_SIZE;
      const reachSq = reach * reach;

      for (let i = 0; i < this.food.length; i++) {
        const food = this.food[i]!;

        if (distanceSquared(snake.head, food) <= reachSq) {
          const dx = snake.head.x - food.x;
          const dy = snake.head.y - food.y;
          const dist = Math.hypot(dx, dy);

          if (dist <= pull) {
            snake.score += 1;
            snake.length += 1;
            snake.size *= SIZE_GROWTH_FACTOR;
            this.recomputeSections(snake);
            this.food.splice(i, 1);
          } else if (dist > 0) {
            const step = Math.min(pull, dist);
            food.x += (dx / dist) * step;
            food.y += (dy / dist) * step;
          }
        }
      }
    }
  }

  private resolveCollisions(): void {
    const living = this.snakes.filter((snake) => snake.alive);
    if (living.length < 2) return;

    const losers = new Set<string>();

    for (const snake of living) {
      const edge = {
        x:
          snake.head.x +
          Math.sin(snake.angle) * (snake.size * 0.5 + EDGE_OFFSET),
        y:
          snake.head.y -
          Math.cos(snake.angle) * (snake.size * 0.5 + EDGE_OFFSET),
      };

      for (const other of living) {
        if (other.id === snake.id) continue;
        const hitDistance = EDGE_OFFSET + other.size * 0.5;
        const hitDistanceSq = hitDistance * hitDistance;

        for (const section of other.body) {
          if (distanceSquared(edge, section) <= hitDistanceSq) {
            losers.add(snake.id);
            break;
          }
        }
      }
    }

    for (const id of losers) {
      const loser = this.internals.get(id);
      if (loser) this.eliminate(loser);
    }
  }

  private eliminate(snake: SnakeInternal): void {
    if (!snake.alive) return;

    snake.alive = false;
    snake.survivedMs = this.elapsedMs;

    const step = Math.max(
      1,
      Math.round(snake.headPath.length / snake.length) * 2,
    );
    for (let i = 0; i < snake.headPath.length; i += step) {
      const point = snake.headPath[i]!;
      this.food.push(
        createFood(
          this.nextFoodId(),
          clamp(point.x + randomInt(-10, 10), 0, WORLD.WIDTH),
          clamp(point.y + randomInt(-10, 10), 0, WORLD.HEIGHT),
        ),
      );
    }
  }

  private updateRanks(): void {
    this.snakes.sort((a, b) => {
      if (a.alive !== b.alive) return a.alive ? -1 : 1;
      if (b.score !== a.score) return b.score - a.score;
      return b.survivedMs - a.survivedMs;
    });

    this.snakes.forEach((snake, index) => {
      snake.rank = index + 1;
    });
  }
}
