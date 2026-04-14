import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  POLE_WIDTH,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  OBSTACLE_WIDTH,
  OBSTACLE_HEIGHT,
  POWERUP_WIDTH,
  POWERUP_HEIGHT,
  POWERUP_SPAWN_CHANCE,
  POWERUP_DURATION,
  INITIAL_OBSTACLE_SPEED,
  SPEED_INCREMENT,
  SPAWN_RATE,
  COLORS
} from '../constants';
import { Player, Obstacle, Particle, PowerUp, PowerUpType } from '../types';

interface GameProps {
  onGameOver: (score: number) => void;
  isPaused: boolean;
  isMuted: boolean;
}

const Game: React.FC<GameProps> = ({ onGameOver, isPaused, isMuted }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);

  // Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSound = (type: 'collect' | 'hit' | 'jump') => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'collect') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (e) {
      console.error("Audio error:", e);
    }
  };

  // Game State Refs
  const playerRef = useRef<Player>({
    side: 'left',
    y: CANVAS_HEIGHT - 150,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    targetX: CANVAS_WIDTH / 2 - POLE_WIDTH / 2 - PLAYER_WIDTH + 10,
    currentX: CANVAS_WIDTH / 2 - POLE_WIDTH / 2 - PLAYER_WIDTH + 10,
  });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const activePowerUpsRef = useRef<Map<PowerUpType, number>>(new Map());
  const particlesRef = useRef<Particle[]>([]);
  const frameIdRef = useRef<number>(0);
  const lastSpawnTimeRef = useRef<number>(0);
  const currentSpeedRef = useRef<number>(INITIAL_OBSTACLE_SPEED);
  const scoreRef = useRef<number>(0);
  const bgOffsetRef = useRef<number>(0);

  // Assets
  const assetsRef = useRef<{
    player: HTMLImageElement | null;
    shield: HTMLImageElement | null;
    slowmo: HTMLImageElement | null;
    multiplier: HTMLImageElement | null;
    grease: HTMLImageElement | null;
  }>({
    player: null,
    shield: null,
    slowmo: null,
    multiplier: null,
    grease: null,
  });

  useEffect(() => {
    const loadAsset = (name: keyof typeof assetsRef.current, src: string) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        assetsRef.current[name] = img;
      };
    };

    loadAsset('player', '/assets/player.png');
    loadAsset('shield', '/assets/shield.png');
    loadAsset('slowmo', '/assets/slowmo.png');
    loadAsset('multiplier', '/assets/multiplier.png');
    loadAsset('grease', '/assets/grease.png');
  }, []);

  const spawnItem = useCallback((time: number) => {
    const baseRate = SPAWN_RATE / (1 + scoreRef.current / 1000);
    const randomFactor = 1.0 + Math.random() * 0.6;

    if (time - lastSpawnTimeRef.current > baseRate * randomFactor) {
      const side = Math.random() > 0.5 ? 'left' : 'right';
      const xBase = side === 'left'
        ? CANVAS_WIDTH / 2 - POLE_WIDTH / 2
        : CANVAS_WIDTH / 2 + POLE_WIDTH / 2;

      if (Math.random() < POWERUP_SPAWN_CHANCE) {
        const types: PowerUpType[] = ['SHIELD', 'SLOW_MO', 'MULTIPLIER'];
        const type = types[Math.floor(Math.random() * types.length)];
        powerUpsRef.current.push({
          id: Date.now(),
          x: side === 'left' ? xBase - POWERUP_WIDTH - 5 : xBase + 5,
          y: -50,
          width: POWERUP_WIDTH,
          height: POWERUP_HEIGHT,
          type,
          side
        });
      } else {
        const x = side === 'left' ? xBase - OBSTACLE_WIDTH + 5 : xBase - 5;
        const speedVariation = 0.9 + Math.random() * 0.2;
        obstaclesRef.current.push({
          id: Date.now(),
          x,
          y: -50,
          width: OBSTACLE_WIDTH,
          height: OBSTACLE_HEIGHT,
          speed: currentSpeedRef.current * speedVariation,
          side
        });
      }
      lastSpawnTimeRef.current = time;
    }
  }, []);

  const createParticles = (x: number, y: number, color: string, count = 10) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1,
        color
      });
    }
  };

  const update = useCallback((time: number) => {
    if (isPaused) return;

    const now = Date.now();
    for (const [type, expiry] of activePowerUpsRef.current.entries()) {
      if (now > expiry) {
        activePowerUpsRef.current.delete(type);
      }
    }

    const isSlowMo = activePowerUpsRef.current.has('SLOW_MO');
    const isShielded = activePowerUpsRef.current.has('SHIELD');
    const isMultiplier = activePowerUpsRef.current.has('MULTIPLIER');

    currentSpeedRef.current += SPEED_INCREMENT;
    const scoreGain = (isSlowMo ? 0.05 : 0.1) * (isMultiplier ? 2 : 1);
    scoreRef.current += scoreGain;
    setScore(Math.floor(scoreRef.current));

    bgOffsetRef.current = (bgOffsetRef.current + (isSlowMo ? 1 : 2)) % 100;

    const player = playerRef.current;
    const targetX = player.side === 'left'
      ? CANVAS_WIDTH / 2 - POLE_WIDTH / 2 - PLAYER_WIDTH + 15
      : CANVAS_WIDTH / 2 + POLE_WIDTH / 2 - 15;

    player.currentX += (targetX - player.currentX) * 0.3;

    spawnItem(time);

    powerUpsRef.current = powerUpsRef.current.filter(pu => {
      pu.y += isSlowMo ? 1.5 : 3;
      if (
        player.currentX < pu.x + pu.width &&
        player.currentX + player.width > pu.x &&
        player.y < pu.y + pu.height &&
        player.y + player.height > pu.y
      ) {
        activePowerUpsRef.current.set(pu.type, Date.now() + POWERUP_DURATION);
        playSound('collect');
        createParticles(pu.x + pu.width / 2, pu.y + pu.height / 2, COLORS.FESTIVE_YELLOW, 20);
        return false;
      }
      return pu.y < CANVAS_HEIGHT;
    });

    obstaclesRef.current = obstaclesRef.current.filter(obs => {
      obs.y += isSlowMo ? obs.speed * 0.5 : obs.speed;
      const playerHitbox = {
        x: player.currentX + 20,
        y: player.y + 10,
        w: player.width - 40,
        h: player.height - 20
      };

      if (
        playerHitbox.x < obs.x + obs.width &&
        playerHitbox.x + playerHitbox.w > obs.x &&
        playerHitbox.y < obs.y + obs.height &&
        playerHitbox.y + playerHitbox.h > obs.y
      ) {
        if (isShielded) {
          createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, COLORS.GREASE);
          playSound('hit');
          return false;
        } else {
          playSound('hit');
          createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, COLORS.GREASE, 30);
          onGameOver(Math.floor(scoreRef.current));
          return false;
        }
      }
      return obs.y < CANVAS_HEIGHT;
    });

    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      return p.life > 0;
    });
  }, [isPaused, onGameOver, spawnItem]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = COLORS.SKY;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#FFF176';
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH - 60, 80, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 241, 118, 0.3)';
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH - 60, 80, 55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const drawCloud = (x: number, y: number, s: number) => {
      ctx.beginPath();
      ctx.arc(x, y, 20 * s, 0, Math.PI * 2);
      ctx.arc(x + 20 * s, y - 10 * s, 25 * s, 0, Math.PI * 2);
      ctx.arc(x + 45 * s, y, 20 * s, 0, Math.PI * 2);
      ctx.fill();
    };
    drawCloud(50, 120, 1);
    drawCloud(250, 200, 0.8);
    drawCloud(100, 350, 1.2);

    for (let i = 0; i < 10; i++) {
      const flagColors = [COLORS.FESTIVE_RED, COLORS.FESTIVE_YELLOW, COLORS.FESTIVE_GREEN];
      ctx.fillStyle = flagColors[i % 3];
      ctx.beginPath();
      ctx.moveTo(i * 40, 0);
      ctx.lineTo(i * 40 + 20, 30);
      ctx.lineTo(i * 40 + 40, 0);
      ctx.fill();
    }

    const poleX = CANVAS_WIDTH / 2 - POLE_WIDTH / 2;
    ctx.fillStyle = COLORS.POLE;
    ctx.fillRect(poleX, 0, POLE_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = COLORS.POLE_HIGHLIGHT;
    for (let i = 0; i < CANVAS_HEIGHT; i += 40) {
      const y = (i + bgOffsetRef.current) % CANVAS_HEIGHT;
      ctx.fillRect(poleX + 5, y, 5, 20);
      ctx.fillRect(poleX + POLE_WIDTH - 10, y + 20, 5, 20);
    }

    powerUpsRef.current.forEach(pu => {
      const img = pu.type === 'SHIELD' ? assetsRef.current.shield :
        pu.type === 'SLOW_MO' ? assetsRef.current.slowmo :
          assetsRef.current.multiplier;

      if (img) {
        ctx.drawImage(img, pu.x, pu.y, pu.width, pu.height);
      } else {
        ctx.save();
        ctx.shadowBlur = 10;
        if (pu.type === 'SHIELD') {
          ctx.fillStyle = '#4FC3F7';
          ctx.shadowColor = '#4FC3F7';
        } else if (pu.type === 'SLOW_MO') {
          ctx.fillStyle = '#BA68C8';
          ctx.shadowColor = '#BA68C8';
        } else {
          ctx.fillStyle = '#FFD54F';
          ctx.shadowColor = '#FFD54F';
        }
        ctx.beginPath();
        ctx.arc(pu.x + pu.width / 2, pu.y + pu.height / 2, pu.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        const label = pu.type === 'SHIELD' ? 'S' : pu.type === 'SLOW_MO' ? 'T' : '2x';
        ctx.fillText(label, pu.x + pu.width / 2, pu.y + pu.height / 2 + 4);
      }
    });

    const player = playerRef.current;
    if (assetsRef.current.player) {
      ctx.save();
      if (activePowerUpsRef.current.has('SHIELD')) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#4FC3F7';
      }
      if (activePowerUpsRef.current.has('MULTIPLIER')) {
        ctx.filter = 'brightness(1.5) contrast(1.2)';
      }

      if (player.side === 'right') {
        ctx.translate(player.currentX + player.width, player.y);
        ctx.scale(-1, 1);
        ctx.drawImage(assetsRef.current.player, 0, 0, player.width, player.height);
      } else {
        ctx.drawImage(assetsRef.current.player, player.currentX, player.y, player.width, player.height);
      }
      ctx.restore();
    }

    obstaclesRef.current.forEach(obs => {
      if (assetsRef.current.grease) {
        ctx.save();
        if (obs.side === 'left') {
          ctx.translate(obs.x + obs.width, obs.y);
          ctx.scale(-1, 1);
          ctx.drawImage(assetsRef.current.grease, 0, 0, obs.width, obs.height);
        } else {
          ctx.drawImage(assetsRef.current.grease, obs.x, obs.y, obs.width, obs.height);
        }
        ctx.restore();
      } else {
        ctx.fillStyle = COLORS.GREASE;
        ctx.beginPath();
        ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(obs.x + obs.width / 4, obs.y + obs.height / 2, obs.width / 2, obs.height / 1.5);
      }
    });

    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 4, 4);
    });
    ctx.globalAlpha = 1;

    let indicatorY = 60;
    activePowerUpsRef.current.forEach((expiry, type) => {
      const timeLeft = Math.max(0, (expiry - Date.now()) / POWERUP_DURATION);
      ctx.fillStyle = type === 'SHIELD' ? '#4FC3F7' : type === 'SLOW_MO' ? '#BA68C8' : '#FFD54F';
      ctx.fillRect(10, indicatorY, 100 * timeLeft, 5);
      ctx.font = '10px sans-serif';
      ctx.fillText(type, 10, indicatorY - 5);
      indicatorY += 20;
    });


  }, []);

  const loop = useCallback((time: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      update(time);
      draw(ctx);
    }
    frameIdRef.current = requestAnimationFrame(loop);
  }, [update, draw]);

  useEffect(() => {
    frameIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameIdRef.current);
  }, [loop]);

  const handleToggle = () => {
    if (isPaused) return;
    playerRef.current.side = playerRef.current.side === 'left' ? 'right' : 'left';
    playSound('jump');
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-amber-50 overflow-hidden">
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[999] text-4xl font-bold text-amber-900 drop-shadow-md font-serif border-4 border-amber-900 bg-white/80 px-6 py-2 rounded-2xl">
        {score}m
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleToggle}
        className="max-w-full max-h-[90vh] shadow-2xl rounded-lg cursor-pointer touch-none"
      />

      <div className="mt-4 text-amber-800 font-bold animate-pulse text-lg">
        පැත්ත මාරු කිරීමට තට්ටු කරන්න!
      </div>
    </div>
  );
};

export default Game;
