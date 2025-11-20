import type { Train, Coach, Wheel, WearDataPoint } from './types';

const COACH_TYPES = ['D', 'P', 'M', 'M', 'P', 'F', 'M', 'P', 'D'];

export function generateTrains(): Train[] {
  return Array.from({ length: 37 }, (_, i) => ({
    id: `TS${(i + 1).toString().padStart(2, '0')}`,
  }));
}

export function getCoachType(coachId: number): string {
  return COACH_TYPES[coachId - 1] || 'Unknown';
}

export function generateCoaches(trainId: string): Coach[] {
  return Array.from({ length: 9 }, (_, i) => ({
    id: i + 1,
    type: getCoachType(i + 1),
  }));
}

export function generateWheels(): Wheel[] {
  const positions = ['U', 'D'];
  const numbers = [1, 2, 3, 4];
  const wheels: Wheel[] = [];
  numbers.forEach(num => {
    positions.forEach(pos => {
      wheels.push({ id: `${num}${pos}` });
    });
  });
  return wheels.sort((a,b) => a.id.localeCompare(b.id));
}

function seededRandom(seed: number) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateWearData(trainId: string, coachId: string, wheelId: string): WearDataPoint[] {
  const data: WearDataPoint[] = [];
  const seed = trainId.slice(2) + coachId + wheelId.replace(/\D/g, '') + (wheelId.includes('U') ? '1' : '2');
  const numericSeed = parseInt(seed, 10);
  
  let currentLevel = seededRandom(numericSeed) * 10; 

  const hasAnomaly = (trainId === 'TS03' && coachId === '5' && wheelId === '2D') || (trainId === 'TS15' && coachId === '8' && wheelId === '4U');
  const anomalyIndex = 25;
  const anomalySpike = 30;

  for (let i = 0; i < 50; i++) {
    const randomFactor = seededRandom(numericSeed + i);
    let increment = randomFactor * 0.5 + 0.1;
    
    if (hasAnomaly && i === anomalyIndex) {
      increment += anomalySpike;
    }
    if (hasAnomaly && i === anomalyIndex + 1) {
      increment -= anomalySpike * 0.8; 
    }
    
    currentLevel += increment;
    if (currentLevel < 0) currentLevel = 0;

    data.push({ time: i + 1, level: parseFloat(currentLevel.toFixed(2)) });
  }

  return data;
}
