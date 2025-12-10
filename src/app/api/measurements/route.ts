import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const train_id = searchParams.get('train_id');
  const coach_id = searchParams.get('coach_id');
  const wheel_id = searchParams.get('wheel_id');
  const date = searchParams.get('date');

  try {
    await client.connect();
    const db = client.db('FBG');
    const measurements_collection = db.collection('MeasurementRecords');

    let query: any = {};
    if (train_id) query.TrainID = train_id;
    if (coach_id) query.CoachID = coach_id;
    if (wheel_id) query.WheelID = wheel_id;

    const measurements = await measurements_collection.find(query).sort({ Datetime: 1 }).toArray();

    // Filter to only include data from 2024-AUG onwards and up to selected date
    let filteredMeasurements = measurements.filter(m => new Date(m.Datetime) >= new Date('2024-08-01'));
    
    // If date is specified, filter for that date or earlier
    if (date) {
      filteredMeasurements = filteredMeasurements.filter(m => 
        new Date(m.Datetime).toISOString().split('T')[0] <= date
      );
    }

    // Process into segments split by >60 days gap
    const processed = [];
    if (filteredMeasurements.length > 0) {
      let currentSegment = [];
      let lastDate = new Date(filteredMeasurements[0].Datetime);

      for (const record of filteredMeasurements) {
        const currentDate = new Date(record.Datetime);
        if ((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24) > 60) {
          // Gap >60 days, start new segment
          if (currentSegment.length > 0) {
            processed.push(currentSegment);
            currentSegment = [];
          }
        }
        currentSegment.push({
          date: currentDate.toISOString().split('T')[0],
          sh: parseFloat(record.SH),
          sd: parseFloat(record.SD)
        });
        lastDate = currentDate;
      }
      if (currentSegment.length > 0) {
        processed.push(currentSegment);
      }
    }

    return NextResponse.json(processed);
  } catch (error) {
    console.error('Error fetching measurements:', error);
    return NextResponse.json({ error: 'Failed to fetch measurements' }, { status: 500 });
  } finally {
    await client.close();
  }
}