import { heuristicStrategy, resetStrategyMemory } from "./strategy";
import { WORLD, type Agent, type Food, type Point } from "@repo/shared";

const SPRITE_SIZE = 60;
const INITIAL_SCALE = 0.6;
const BASE_SIZE = SPRITE_SIZE * INITIAL_SCALE;
const INITIAL_TAIL_SECTIONS = 20;
const SPEED = 130;
const SIZE_GROWTH_FACTOR = 1.005;
const EDGE_OFFSET = 4;
const SECTION_DISTANCE_SCALE = 17 / SPRITE_SIZE;

const FOOD_COUNT = 100;
const FOOD_SIZE = 8;
const FOOD_PULL_PER_FRAME = 14;

type AgentInternal = Agent & {
  headPath: Point[];
  bodyMinX: number;
  bodyMaxX: number;
  bodyMinY: number;
  bodyMaxY: number;
};

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function preferredDistance(size: number): number {
  return size * SECTION_DISTANCE_SCALE;
}

function changeFoodPosition(food: Food) {
  food.x = randomInt(0, WORLD.width);
  food.y = randomInt(0, WORLD.height);
}

function spawnOffset(index: number, total: number): Point {
  const angle = (index / total) * Math.PI * 2;
  const radius = Math.min(WORLD.width, WORLD.height) * 0.35;
  return {
    $typeName: "Point",
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
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
    const dx = current.x - next.x;
    const dy = current.y - next.y;
    len += Math.sqrt(dx * dx + dy * dy);
    prevDif = dif;
    dif = len - sectionDistance;
    i++;
  }

  if (prevDif === null || Math.abs(prevDif) > Math.abs(dif)) return i;
  return i - 1;
}

export type GameConfig = {
  id: number;
  name: string;
  startedAt: number;
  agents: GameAgentConfig[];
};

export type GameAgentConfig = Pick<Agent, "id" | "name" | "color" | "accent">;

const MATCH_DURATION = 3 * 60 * 1000;

export class GameEngine {
  private status: "RUNNING" | "ENDED" | "INTERVAL";
  private id: number;
  private name: string;
  private startedAt: number;
  private remainingMs: number;
  private expectedEnd: number;
  private agents: Array<AgentInternal>;
  private food: Array<Food>;

  constructor(agentCount: number) {
    this.status = "ENDED";
    this.id = -1;
    this.name = "Waiting For Upcoming Match";
    this.startedAt = Date.now();
    this.remainingMs = 0;
    this.expectedEnd = Date.now();
    this.agents = new Array<AgentInternal>(agentCount);
    this.food = Array.from({ length: FOOD_COUNT }, () => ({
      $typeName: "Food",
      x: 0,
      y: 0,
    }));
  }

  public scheduleGame(config: GameConfig) {
    this.id = config.id;
    this.name = config.name;
    this.expectedEnd = config.startedAt + MATCH_DURATION;
    this.remainingMs = MATCH_DURATION;
    this.startedAt = config.startedAt;
    this.status = "INTERVAL";

    this.agents.length = config.agents.length;
    config.agents.forEach((agent, idx) => this.createAgent(agent, idx));
    this.resetState();
  }

  private createAgent(agentData: GameAgentConfig, idx: number) {
    const offset = spawnOffset(idx, this.agents.length);
    const head = {
      $typeName: "Point",
      x: WORLD.width / 2 + offset.x,
      y: WORLD.height / 2 + offset.y,
    } as const;
    const headPath: Point[] = [{ $typeName: "Point", x: head.x, y: head.y }];

    for (let i = 1; i <= INITIAL_TAIL_SECTIONS; i++) {
      headPath.push({
        $typeName: "Point",
        x: head.x,
        y: head.y + i * preferredDistance(BASE_SIZE),
      });
    }

    this.agents[idx] = {
      $typeName: "Agent",
      id: agentData.id,
      name: agentData.name,
      color: agentData.color,
      accent: agentData.accent,
      alive: true,
      score: 0,
      size: BASE_SIZE,
      angle: 0,
      head,
      body: [],
      length: INITIAL_TAIL_SECTIONS + 1,
      rank: undefined,
      headPath: headPath,
      bodyMinX: head.x,
      bodyMaxX: head.x,
      bodyMinY: head.y,
      bodyMaxY: head.y,
    };
  }

  public startGame() {
    this.status = "RUNNING";
  }

  private resetState() {
    this.food.length = FOOD_COUNT;
    this.food.forEach(changeFoodPosition);

    for (const agent of this.agents) {
      this.recomputeSections(agent);
    }
    resetStrategyMemory();
  }

  public getStartedAt() {
    return this.startedAt;
  }

  public getStatus() {
    return this.status;
  }

  public getId() {
    return this.id;
  }

  public getName() {
    return this.name;
  }

  public getRemainingMs() {
    return this.remainingMs;
  }

  public getFood() {
    return this.food;
  }

  public getWinner(): Agent | null {
    return this.agents[0] ?? null;
  }

  private finishMatch() {
    this.status = "ENDED";
    this.updateRanks();
  }

  public tick(deltaSeconds: number, now: number): void {
    if (this.status !== "RUNNING") return;

    const remainingMs = this.expectedEnd - now;
    this.remainingMs = remainingMs > 0 ? remainingMs : 0;
    if (remainingMs <= 0) {
      this.finishMatch();
      return;
    }

    for (const agent of this.agents) {
      if (!agent.alive) continue;
      agent.angle = heuristicStrategy({ self: agent, deltaSeconds });
      this.moveAgent(agent, deltaSeconds);
      const lastIndex = this.recomputeSections(agent);
      this.adjustHeadPath(agent, lastIndex);
    }

    this.handleFoodTouches(deltaSeconds);
    this.resolveCollisions();
    this.updateRanks();
    let aliveAgents = 0;
    for (const agent of this.agents) {
      if (agent.alive) {
        aliveAgents++;
      }
    }
    if (aliveAgents <= 1) {
      this.finishMatch();
    }
  }

  public getAgents(): Agent[] {
    return this.agents.filter(Boolean);
  }

  private moveAgent(agent: AgentInternal, deltaSeconds: number): void {
    const padding = agent.size * 0.5;
    const minX = padding;
    const minY = padding;
    const maxX = WORLD.width - padding;
    const maxY = WORLD.height - padding;

    let nextX = agent.head!.x + Math.sin(agent.angle) * SPEED * deltaSeconds;
    let nextY = agent.head!.y - Math.cos(agent.angle) * SPEED * deltaSeconds;

    const hitWall =
      nextX < minX || nextX > maxX || nextY < minY || nextY > maxY;

    if (hitWall) {
      nextX = clamp(nextX, minX, maxX);
      nextY = clamp(nextY, minY, maxY);
      agent.angle = Math.atan2(
        WORLD.width / 2 - nextX,
        nextY - WORLD.height / 2,
      );
    }

    agent.head!.x = nextX;
    agent.head!.y = nextY;

    const pathPoint = agent.headPath.pop() ?? {
      $typeName: "Point",
      x: nextX,
      y: nextY,
    };
    pathPoint.x = nextX;
    pathPoint.y = nextY;
    agent.headPath.unshift(pathPoint);
  }

  private recomputeSections(agent: AgentInternal): number {
    const { body, headPath, length, size } = agent;
    let index = 0;
    let written = 0;
    const sectionDistance = preferredDistance(size);
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (let i = 0; i < length; i++) {
      const point = headPath[index];
      if (!point) break;

      let section = body[written];
      if (!section) {
        section = { $typeName: "Point", x: 0, y: 0 };
        body[written] = section;
      }
      section.x = point.x;
      section.y = point.y;
      written++;
      if (point.x < minX) minX = point.x;
      if (point.x > maxX) maxX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.y > maxY) maxY = point.y;

      index = nextSectionIndex(headPath, index, sectionDistance);
    }

    body.length = written;
    if (written > 0) {
      agent.bodyMinX = minX;
      agent.bodyMaxX = maxX;
      agent.bodyMinY = minY;
      agent.bodyMaxY = maxY;
    } else {
      agent.bodyMinX = agent.head!.x;
      agent.bodyMaxX = agent.head!.x;
      agent.bodyMinY = agent.head!.y;
      agent.bodyMaxY = agent.head!.y;
    }
    return index;
  }

  private adjustHeadPath(agent: AgentInternal, lastIndex: number): void {
    if (agent.headPath.length === 0) {
      agent.headPath.push({
        $typeName: "Point",
        x: agent.head!.x,
        y: agent.head!.y,
      });
      return;
    }

    if (lastIndex >= agent.headPath.length - 1) {
      const last = agent.headPath[agent.headPath.length - 1]!;
      agent.headPath.push({ $typeName: "Point", x: last.x, y: last.y });
    } else {
      agent.headPath.pop();
    }
  }

  private handleFoodTouches(deltaSeconds: number): void {
    const pull = FOOD_PULL_PER_FRAME * (deltaSeconds * 60);
    const pullSq = pull * pull;

    for (const agent of this.agents) {
      if (!agent.alive) continue;
      const reach = agent.size * 0.5 + FOOD_SIZE;
      const reachSq = reach * reach;
      const head = agent.head;
      let grew = false;

      for (const food of this.food) {
        const dx = head!.x - food.x;
        const dy = head!.y - food.y;
        const distSq = dx * dx + dy * dy;

        if (distSq <= reachSq) {
          if (distSq <= pullSq) {
            agent.score += 1;
            agent.length += 1;
            agent.size *= SIZE_GROWTH_FACTOR;
            grew = true;
            changeFoodPosition(food);
          } else if (distSq > 0) {
            const dist = Math.sqrt(distSq);
            const step = Math.min(pull, dist);
            food.x += (dx / dist) * step;
            food.y += (dy / dist) * step;
          }
        }
      }

      if (grew) this.recomputeSections(agent);
    }
  }

  private resolveCollisions(): void {
    const losers = new Set<AgentInternal>();

    agentLoop: for (const agent of this.agents) {
      if (!agent.alive) continue;
      const edgeX =
        agent.head!.x +
        Math.sin(agent.angle) * (agent.size * 0.5 + EDGE_OFFSET);
      const edgeY =
        agent.head!.y -
        Math.cos(agent.angle) * (agent.size * 0.5 + EDGE_OFFSET);

      for (const other of this.agents) {
        if (!other.alive) continue;
        if (other.id === agent.id) continue;
        const hitDistance = EDGE_OFFSET + other.size * 0.5;
        const hitDistanceSq = hitDistance * hitDistance;

        if (
          edgeX < other.bodyMinX - hitDistance ||
          edgeX > other.bodyMaxX + hitDistance ||
          edgeY < other.bodyMinY - hitDistance ||
          edgeY > other.bodyMaxY + hitDistance
        ) {
          continue;
        }

        for (const section of other.body) {
          const dx = edgeX - section.x;
          const dy = edgeY - section.y;
          if (dx * dx + dy * dy <= hitDistanceSq) {
            losers.add(agent);
            continue agentLoop;
          }
        }
      }
    }

    for (const loser of losers) {
      this.eliminate(loser);
    }
  }

  private eliminate(agent: AgentInternal): void {
    if (!agent.alive) return;
    agent.alive = false;

    const step = Math.max(
      1,
      Math.round(agent.headPath.length / agent.length) * 2,
    );
    for (let i = 0; i < agent.headPath.length; i += step) {
      const point = agent.headPath[i]!;
      this.food.push({
        $typeName: "Food",
        x: clamp(point.x + randomInt(-10, 10), 0, WORLD.width),
        y: clamp(point.y + randomInt(-10, 10), 0, WORLD.height),
      });
    }
  }

  private updateRanks(): void {
    this.agents.sort((a, b) => {
      if (a.alive !== b.alive) return a.alive ? -1 : 1;
      return b.score - a.score;
    });

    this.agents.forEach((agent, index) => {
      agent.rank = index + 1;
    });
  }
}
