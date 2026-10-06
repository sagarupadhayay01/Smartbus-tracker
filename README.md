# SmartBus Tracker (hackathon prototype)
Find the nearest station, get the best bus to your destination, estimate the fare and track the bus live.

## Run
```
cd server && cp ../.env.example .env && npm i && npm run dev     # :4000
cd client && cp ../.env.example .env && npm i && npm run dev     # :5173
```
The map uses OpenStreetMap + Leaflet and free OSRM routing, so no API key or billing is needed. (OSRM's public server and OSM tiles are for light demo use only.)

## Features
- Station-to-station and location-based search with date/time, sort (best, cheapest, fastest, earliest).
- **Connections:** with no direct bus, the planner finds journeys with up to 2 changes (10 min minimum to change). Example: Pehowa to Old Faridabad = Pehowa to Kurukshetra, Kurukshetra to Delhi, Delhi to Old Faridabad.
- **Booking:** seat map, passenger details, e-ticket with PNR, My Bookings lookup (PNR or mobile) and cancel. Payment is a demo stub; no money is charged. Each bus leg is booked separately.
- **MongoDB:** set `MONGODB_URI` in `server/.env`. Stations, routes, buses and bookings are seeded and saved there. If unset or unreachable the app runs from memory.

## Data separation
- REAL: browser geolocation, Google Maps/Directions.
- DEMO: stations, routes, buses, schedules, fare rules (`server/models/data.js`).
- SIMULATED GPS: `server/services/simulator.js`. Swap in real hardware by POSTing `{busId,lat,lng,speed}` to `/api/gps`.

## API
GET /api/buses, /api/buses/:id, /api/buses/nearby, /api/stations/nearby, /api/routes, /api/routes/:id, /api/track/:busId; POST /api/calculate-fare, /api/recommend, /api/sim/:start|pause|stop|reset.
Socket.IO events: busLocationUpdate, busStatusUpdate, busArrivalUpdate.

## Not yet done
Seat availability treats a seat as taken for the whole bus and date (no partial-route reuse), admin add routes/stations/fare rules (buses only), tests.

## Deploy (one link, free)
1. Push this folder to a GitHub repo.
2. Optional: create a free MongoDB Atlas cluster and copy its connection string.
3. On render.com create a **Web Service** from the repo: Build Command `npm run build`, Start Command `npm start`.
4. Add environment variable `MONGODB_URI` (optional). Share the `.onrender.com` link.
Free instances sleep when idle, so the first visit after a break can take about a minute.
