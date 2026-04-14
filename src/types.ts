export type PowerUpType = 'SHIELD' | 'SLOW_MO' | 'MULTIPLIER';

export interface PowerUp {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: PowerUpType;
  side: 'left' | 'right';
}

export interface GameState {
  score: number;
  isGameOver: boolean;
  isPaused: boolean;
  highScore: number;
  activePowerUps: {
    [key in PowerUpType]?: number; // expiry timestamp
  };
}

export interface Player {
  side: 'left' | 'right';
  y: number;
  width: number;
  height: number;
  targetX: number;
  currentX: number;
}

export interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  side: 'left' | 'right';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}
