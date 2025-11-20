'use server';

import { detectWheelAnomaly, AnomalyDetectionInput } from "@/ai/flows/anomaly-detection-flow";
import { summarizeWearTrend, WearTrendSummaryInput } from "@/ai/flows/wear-trend-summary-flow";

export async function getAnomalyDetection(input: AnomalyDetectionInput) {
  try {
    const result = await detectWheelAnomaly(input);
    return result;
  } catch (error) {
    console.error("Error in getAnomalyDetection:", error);
    return { isAnomaly: false, anomalyDescription: "Could not analyze anomaly due to an error." };
  }
}

export async function getWearTrendSummary(input: WearTrendSummaryInput) {
  try {
    const result = await summarizeWearTrend(input);
    return result;
  } catch (error) {
    console.error("Error in getWearTrendSummary:", error);
    return { summary: "Could not generate summary due to an error." };
  }
}
