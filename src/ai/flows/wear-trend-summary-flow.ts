'use server';

/**
 * @fileOverview Summarizes wear trends for a given train, coach, and time period.
 *
 * - `summarizeWearTrend` - A function that generates a summarized insight of wear trends.
 * - `WearTrendSummaryInput` - The input type for the `summarizeWearTrend` function.
 * - `WearTrendSummaryOutput` - The return type for the `summarizeWearTrend` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WearTrendSummaryInputSchema = z.object({
  trainId: z.string().describe('The ID of the train (e.g., TS01).'),
  coachId: z.number().describe('The ID of the coach (1-9).'),
  wheelPosition: z.string().describe('The position of the wheel (e.g., 1U, 2D).'),
  timePeriod: z.enum(['week', 'month', 'year']).describe('The time period to summarize over.'),
});

export type WearTrendSummaryInput = z.infer<typeof WearTrendSummaryInputSchema>;

const WearTrendSummaryOutputSchema = z.object({
  summary: z.string().describe('A summarized insight of wear trends for the specified wheel over the given time period.'),
});

export type WearTrendSummaryOutput = z.infer<typeof WearTrendSummaryOutputSchema>;

export async function summarizeWearTrend(input: WearTrendSummaryInput): Promise<WearTrendSummaryOutput> {
  return summarizeWearTrendFlow(input);
}

const summarizeWearTrendPrompt = ai.definePrompt({
  name: 'summarizeWearTrendPrompt',
  input: {schema: WearTrendSummaryInputSchema},
  output: {schema: WearTrendSummaryOutputSchema},
  prompt: `You are an expert in analyzing wear trends of train wheels.
  Given the train ID: {{{trainId}}}, coach ID: {{{coachId}}}, wheel position: {{{wheelPosition}}}, and time period: {{{timePeriod}}}, provide a summarized insight of wear trends.
  Focus on identifying any concerning patterns or anomalies in the wear data.
  Return a concise summary of the wear trends for the specified wheel over the given time period.
`,
});

const summarizeWearTrendFlow = ai.defineFlow(
  {
    name: 'summarizeWearTrendFlow',
    inputSchema: WearTrendSummaryInputSchema,
    outputSchema: WearTrendSummaryOutputSchema,
  },
  async input => {
    const {output} = await summarizeWearTrendPrompt(input);
    return output!;
  }
);
