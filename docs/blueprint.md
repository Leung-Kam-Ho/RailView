# **App Name**: RailView

## Core Features:

- Train Selection: Allows the operator to select a train from TS01 to TS37.
- Coach Selection: Allows the operator to select a coach (1-9) for the selected train.  The train formation is D1-P1-M1+M2-P2-F2+M3-P3-D3, but then for TS02, it will be D4-P4-M4+M5-P5-F5+M6-P6-D6, and so on.
- Wheel Selection: Allows the operator to select a specific wheel (1U to 4U, 1D to 4D) for the selected coach.
- Wear Level Trend Plot: Displays a wear level trend plot for the selected wheel.
- Anomaly Detection: Uses AI to detect unusual wear patterns in the wheel data. When anomalies are detected, this tool flags them for review.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) to represent reliability and precision in data visualization.
- Background color: Light gray (#ECEFF1), offering a clean, non-distracting backdrop for detailed data analysis.
- Accent color: Soft purple (#9575CD) for interactive elements and highlights to draw attention to important controls.
- Body and headline font: 'Inter', a sans-serif font, providing a modern, neutral, and highly readable interface.
- Use minimalist, vector-based icons to represent different components (train, coach, wheel) for intuitive navigation.
- Implement a grid-based layout with clear hierarchy to efficiently display train/coach/wheel selection and trend plots.
- Use subtle transitions and animations (e.g., loading indicators, plot drawing) to enhance user experience and provide feedback during interactions.