# Navimeet

A multimodal transportation navigation platform that calculates optimal **merge** and **diverge** points for group travel, combining private and public transport modes into unified route planning.

**Live Demo:** https://navi-meet.vercel.app/

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Use Cases](#use-cases)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Algorithm Overview](#algorithm-overview)

---

## Overview

Navimeet addresses a gap in existing navigation solutions by enabling coordinated group travel planning. Traditional navigation apps optimize routes for individuals traveling point-to-point using either private or public transport.

Navimeet introduces the concept of **strategic meeting points** where travelers can converge or disperse efficiently, factoring in diverse transport modes, travel times, and transit accessibility.

The platform serves both:
- Group coordination scenarios
- Individual commuters seeking hybrid routes combining personal vehicles with public transit

---

## Features

### Merge Point Calculation

Computes an optimal convergence location for multiple travelers heading to a common destination. The algorithm considers:

- Individual starting locations and available transport modes
- Travel time equity across all participants
- Transit hub accessibility at the merge point
- Onward journey options to the final destination

### Diverge Point Calculation

Determines the best dispersion location for a group traveling from a common origin to multiple destinations. Factors include:

- Direct transit connectivity to each participant's destination
- Minimized aggregate travel time post-dispersal
- Walking distance from diverge point to transit stops
- Vehicle owner's route efficiency when applicable

### Hybrid Multimodal Routing

Generates individual routes combining private transport (car, motorcycle, bicycle) with public transit (metro, bus, train) based on:

- Real-time traffic conditions
- Public transport schedules
- Time-of-day variations
- User transport preferences

---

## Use Cases

| Scenario | Description |
|--------|-------------|
| Carpooling Coordination | A car owner picks up multiple friends from a calculated merge point, reducing individual travel while maximizing shared journey distance |
| Post-Event Dispersal | A group leaving a venue identifies a diverge point with transit access to all members' home locations |
| Daily Commute Optimization | An individual commuter receives route suggestions combining a personal bike with metro travel |
| Campus to City Travel | Students from a university find optimal points to split based on their residential areas |

---

## Technology Stack

| Layer | Technology |
|-----|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Maps & Routing | Google Maps JavaScript API |
| Distance Calculations | Google Distance Matrix API |
| Location Search | Google Places API |
| Geocoding | Google Geocoding API |
| Hosting | Vercel |

---

## Getting Started

### Prerequisites

- Google Cloud Platform account
- Google Maps API key with the following enabled:
  - Maps JavaScript API
  - Directions API
  - Distance Matrix API
  - Places API
  - Geocoding API

---

### Installation

Clone the repository:

```bash
git clone https://github.com/srujanhiremath/navimeet.git
cd navimeet
````

Configure API key:

```bash
cp js/config.example.js js/config.js
```

Edit `js/config.js`:

```js
const CONFIG = {
    GOOGLE_API_KEY: 'your-api-key-here',
    // ...
};
```

Update API key in `index.html`:

```html
<script async defer
  src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places&callback=initApp">
</script>
```

---

### Run Locally

Using Python:

```bash
python -m http.server 8080
```

Using Node.js:

```bash
npx serve .
```

Open in browser:

```
http://localhost:8080
```

---

## Configuration

The `js/config.js` file contains adjustable parameters:

| Parameter              | Default          | Description                                      |
| ---------------------- | ---------------- | ------------------------------------------------ |
| DEFAULT_CENTER         | Bengaluru, India | Initial map center coordinates                   |
| DEFAULT_ZOOM           | 12               | Initial map zoom level                           |
| MERGE_SEARCH_RADIUS    | 5000             | Radius (meters) for transit hub search           |
| MAX_WALKING_DISTANCE   | 1000             | Maximum acceptable walking distance (meters)     |
| WEIGHTS.TIME           | 0.5              | Weight for average travel time                   |
| WEIGHTS.TRANSIT_ACCESS | 0.3              | Weight for transit accessibility                 |
| WEIGHTS.EQUITY         | 0.2              | Weight for minimizing max individual travel time |

---

## Project Structure

```text
navimeet/
├── index.html                 # Main application entry point
├── css/
│   └── styles.css             # Application styles
├── js/
│   ├── app.js                 # Application initialization and UI handlers
│   ├── config.js              # Configuration and API keys
│   ├── map.js                 # Map initialization and controls
│   ├── algorithms/
│   │   ├── mergePoint.js      # Merge point calculation logic
│   │   ├── divergePoint.js    # Diverge point calculation logic
│   │   └── multimodal.js      # Hybrid routing logic
│   ├── services/
│   │   ├── directions.js      # Google Directions API wrapper
│   │   ├── distanceMatrix.js  # Google Distance Matrix API wrapper
│   │   └── places.js          # Google Places API wrapper
│   └── utils/
│       └── helpers.js         # Utility functions
└── README.md
```

---

## API Reference

### MergePointCalculator

```js
/**
 * Calculate optimal merge point for a group
 * @param {Array} participants - Array of participant objects
 * @param {Object} destination - Destination coordinates
 * @returns {Promise<Array>} Ranked merge point options
 */
MergePointCalculator.calculate(participants, destination)
```

Participant object structure:

```js
{
    id: string,
    name: string,
    location: { lat: number, lng: number },
    mode: 'driving' | 'transit' | 'walking' | 'bicycling'
}
```

---

### DivergePointCalculator

```js
/**
 * Calculate optimal diverge point for a group
 * @param {Object} origin - Common starting point coordinates
 * @param {Array} destinations - Array of destination objects
 * @returns {Promise<Array>} Ranked diverge point options
 */
DivergePointCalculator.calculate(origin, destinations)
```

---

### DistanceMatrixService

```js
/**
 * Get travel distances and durations between points
 * @param {Array} origins - Array of origin coordinates
 * @param {Array} destinations - Array of destination coordinates
 * @param {string} mode - Travel mode
 * @returns {Promise<Array>} Matrix of distances and durations
 */
DistanceMatrixService.getMatrix(origins, destinations, mode)
```

---

## Algorithm Overview

### Merge Point Selection

1. Calculate geographic centroid of participant locations
2. Determine search radius based on spatial spread
3. Query transit hubs within the search area
4. For each candidate:

   * Compute travel time from each participant
   * Compute travel time to final destination
   * Evaluate transit connectivity
5. Rank candidates using weighted scoring
6. Return top three options

---

### Diverge Point Selection

1. Identify transit hubs accessible from the common origin
2. Query transit connectivity to all destinations
3. Score hubs based on:

   * Number of direct routes
   * Aggregate post-dispersal travel time
   * Walking distance requirements
4. Factor in vehicle owner detour cost if applicable
5. Return optimal diverge point with individual routes

---

### Scoring Function

```text
Score = (W_time * avg_travel_time)
      + (W_equity * max_travel_time)
      + (W_transit * transit_score)
```
