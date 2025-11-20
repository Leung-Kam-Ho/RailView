'use server';

/**
 * @fileOverview This file defines a Genkit flow for anomaly detection in wheel wear level trends.
 *
 * It includes:
 * - `detectWheelAnomaly`: A function to detect anomalies in wheel wear data.
 * - `AnomalyDetectionInput`: The input type for the `detectWheelAnomaly` function.
 * - `AnomalyDetectionOutput`: The output type for the `detectWheelAnomaly` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnomalyDetectionInputSchema = z.object({
  trainId: z.string().describe('The ID of the train (e.g., TS01).'),
  coachNumber: z.number().describe('The coach number (1-9).'),
  wheelPosition: z.string().describe('The position of the wheel (e.g., 1U, 2D).'),
  wearLevelData: z.array(z.number()).describe('An array of wear level data points over time.'),
});
export type AnomalyDetectionInput = z.infer<typeof AnomalyDetectionInputSchema>;

const AnomalyDetectionOutputSchema = z.object({
  isAnomaly: z.boolean().describe('Whether an anomaly is detected in the wear level trend.'),
  anomalyDescription: z
    .string()
    .describe('A description of the anomaly, if any is detected.'),
});
export type AnomalyDetectionOutput = z.infer<typeof AnomalyDetectionOutputSchema>;

export async function detectWheelAnomaly(input: AnomalyDetectionInput): Promise<AnomalyDetectionOutput> {
  return anomalyDetectionFlow(input);
}

const anomalyDetectionPrompt = ai.definePrompt({
  name: 'anomalyDetectionPrompt',
  input: {schema: AnomalyDetectionInputSchema},
  output: {schema: AnomalyDetectionOutputSchema},
  prompt: `You are an expert in analyzing wheel wear data for trains.
  Given the following data, determine if there is an anomaly in the wear level trend.
  If there is an anomaly, describe the anomaly in detail.

  Train ID: {{{trainId}}}
  Coach Number: {{{coachNumber}}}
  Wheel Position: {{{wheelPosition}}}
  Wear Level Data: {{{wearLevelData}}}

  Consider factors such as sudden changes in wear level, unusual patterns, and deviations from expected wear rates.
  Return a JSON object with 'isAnomaly' set to true if an anomaly is detected, and provide a detailed 'anomalyDescription'.
  If no anomaly is detected, set 'isAnomaly' to false and provide a brief explanation in 'anomalyDescription'.
`,
});

const anomalyDetectionFlow = ai.defineFlow(
  {
    name: 'anomalyDetectionFlow',
    inputSchema: AnomalyDetectionInputSchema,
    outputSchema: AnomalyDetectionOutputSchema,
  },
  async input => {
    const {output} = await anomalyDetectionPrompt(input);
    return output!;
  }
);
