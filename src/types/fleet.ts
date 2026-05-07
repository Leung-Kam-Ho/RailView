export interface Wheel {
    id: string;
    position: string;
    status: 'healthy' | 'warning' | 'critical';
    currentVal: string;
    meanVal: string;
    trend: any[];
}

export interface Coach {
    id: string;
    index: number;
    status: 'healthy' | 'warning' | 'critical';
    wheels: Wheel[];
    maxWear: number;
    trainId?: string;
    trainStatus?: 'healthy' | 'warning' | 'critical';
}

export interface Train {
    id: string;
    status: 'healthy' | 'warning' | 'critical';
    coaches: Coach[];
}

export interface WheelTrendPoint {
    date: string;
    valMean: number | null;
    valMin: number | null;
    valMax: number | null;
    valStd: number | null;
    actual: number | null;
}

export type FilteredCoach = Coach & { trainId: string; trainStatus: 'healthy' | 'warning' | 'critical' };
