import type { Agent } from "@repo/types";

export type StrategyParams = {
  rotationSpeed: number;
  trendFlipProbability: number;
};

export const DEFAULT_PARAMS: StrategyParams = {
  rotationSpeed: 2,
  trendFlipProbability: 1 / 20,
};

export type StrategyContext = {
  self: Agent;
  deltaSeconds: number;
};

export type Strategy = (ctx: StrategyContext) => number;

type Memory = {
  trend: 1 | -1;
  angle: number;
};

const memories = new Map<string, Memory>();

function getMemory(agentId: string, defaultAngle: number): Memory {
  let mem = memories.get(agentId);
  if (!mem) {
    mem = {
      trend: 1,
      angle: defaultAngle,
    };
    memories.set(agentId, mem);
  }
  return mem;
}

export function resetStrategyMemory(): void {
  memories.clear();
}

// ---------------------------------------------------------------------------
// Strategy implementation - direct port of the original bot movement.
// ---------------------------------------------------------------------------

/**
 * Mirror of the bot movement from the slither.io clone.
 *
 * ```js
 * if (Util.randomInt(1,20) == 1) this.trend *= -1;
 * this.head.body.rotateRight(this.trend * this.rotationSpeed);
 * ```
 *
 * The clone uses Phaser p2's `rotateRight`, which sets angular velocity in
 * rad/s. We integrate that velocity ourselves so the result is independent of
 * the server tick rate.
 */
export const heuristicStrategy: Strategy = ({ self, deltaSeconds }) => {
  const params = DEFAULT_PARAMS;
  const mem = getMemory(self.id, self.angle);

  if (Math.random() < params.trendFlipProbability) {
    mem.trend = mem.trend === 1 ? -1 : 1;
  }

  // Snap the cached angle to the engine's authoritative one whenever the gap
  // grows (e.g. wall redirect) so we keep wandering in continuous space.
  if (
    Math.abs(((self.angle - mem.angle + Math.PI) % (Math.PI * 2)) - Math.PI) >
    0.4
  ) {
    mem.angle = self.angle;
  }

  mem.angle += mem.trend * params.rotationSpeed * deltaSeconds;

  return mem.angle;
};
