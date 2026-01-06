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
    const db = client.db(process.env.MONGODB_DB_NAME || 'FBG');
    const predictions_collection = db.collection(process.env.MONGODB_PREDICTIONS_COLLECTION || 'Prediction');

    let query: any = {};
    if (train_id) query.TrainID = train_id;
    if (coach_id) query.CoachID = coach_id;
    if (wheel_id) query.WheelID = wheel_id;

    if (wheel_id) {
      // For specific wheel, aggregate by date
      let pipeline: any[] = [
        { $match: query },
        {
          $addFields: {
            dateOnly: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: { $dateFromString: { dateString: '$Datetime' } }
              }
            }
          }
        }
      ];

      // If date is specified, filter for that date or earlier
      if (date) {
        pipeline.push({
          $match: {
            dateOnly: { $lte: date }
          }
        });
      }

      pipeline = pipeline.concat([
        {
          $group: {
            _id: '$dateOnly',
            mean: { $avg: '$Prediction' },
            min: { $min: '$Prediction' },
            max: { $max: '$Prediction' },
            std: { $stdDevPop: '$Prediction' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } },
        {
          $project: {
            date: '$_id',
            mean: 1,
            min: 1,
            max: 1,
            std: { $ifNull: ['$std', 0] },
            count: 1,
            _id: 0
          }
        }
      ]);
      const aggregated = await predictions_collection.aggregate(pipeline).toArray();
      return NextResponse.json(aggregated);
    } else {
      // For fleet, get latest aggregated per wheel (or specific date if provided)
      let pipeline: any[] = [
        { $match: query },
        {
          $addFields: {
            dateOnly: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: { $dateFromString: { dateString: '$Datetime' } }
              }
            }
          }
        }
      ];

      // If date is specified, filter for that date or earlier
      if (date) {
        pipeline.push({
          $match: {
            dateOnly: { $lte: date }
          }
        });
      }

      pipeline = pipeline.concat([
        {
          $group: {
            _id: { TrainID: '$TrainID', CoachID: '$CoachID', WheelID: '$WheelID', dateOnly: '$dateOnly' },
            mean: { $avg: '$Prediction' },
            min: { $min: '$Prediction' },
            max: { $max: '$Prediction' },
            std: { $stdDevPop: '$Prediction' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.dateOnly': -1 }
        },
        {
          $group: {
            _id: { TrainID: '$_id.TrainID', CoachID: '$_id.CoachID', WheelID: '$_id.WheelID' },
            latest: { $first: '$$ROOT' }
          }
        },
        {
          $project: {
            TrainID: '$_id.TrainID',
            CoachID: '$_id.CoachID',
            WheelID: '$_id.WheelID',
            date: '$latest._id.dateOnly',
            mean: '$latest.mean',
            min: '$latest.min',
            max: '$latest.max',
            std: { $ifNull: ['$latest.std', 0] },
            count: '$latest.count',
            _id: 0
          }
        }
      ]);
      const aggregated = await predictions_collection.aggregate(pipeline).toArray();
      return NextResponse.json(aggregated);
    }
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return NextResponse.json({ error: 'Failed to fetch predictions' }, { status: 500 });
  } finally {
    await client.close();
  }
}