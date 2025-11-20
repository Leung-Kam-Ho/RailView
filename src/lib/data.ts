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

export function getProjectedWearData(data: WearDataPoint[]): any[] {
  if (data.length < 2) {
    return [];
  }
  const lastPoint = data[data.length - 1];
  const secondLastPoint = data[data.length - 2];

  const avgIncrement = (lastPoint.level - data[0].level) / data.length;
  
  const projected = [];
  for(let i=0; i<data.length; i++) {
    projected.push({ time: data[i].time, projected: null });
  }

  let currentLevel = lastPoint.level;
  for (let i = 0; i < 15; i++) {
    currentLevel += avgIncrement * (1 + (Math.random() - 0.5) * 0.1); // Add some noise
    projected.push({ time: lastPoint.time + i + 1, projected: parseFloat(currentLevel.toFixed(2))});
  }
  
  // Make sure the projected line connects
  projected[data.length-1].projected = lastPoint.level;

  return projected;
}

export type TrainStatus = 'ok' | 'warning' | 'action-required';

export function getTrainStatus(trainId: string): TrainStatus {
  const seed = parseInt(trainId.slice(2), 10);
  const random = seededRandom(seed);
  if (random < 0.2) return 'action-required';
  if (random < 0.5) return 'warning';
  return 'ok';
}

export type WheelStatus = { status: 'ok' | 'warning' | 'imminent-failure', wearLevel: number };

export function getWheelStatus(trainId: string, coachId: string, wheelId: string): WheelStatus {
  const wearData = generateWearData(trainId, coachId, wheelId);
  const latestWear = wearData[wearData.length-1].level;
  
  let status: 'ok' | 'warning' | 'imminent-failure' = 'ok';
  if(latestWear > 50) status = 'imminent-failure';
  else if(latestWear > 35) status = 'warning';

  return { status, wearLevel: latestWear };
}
