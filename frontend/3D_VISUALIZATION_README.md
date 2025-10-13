# 3D Asteroid Trajectory Visualization

This implementation provides a complete Three.js-based 3D visualization system for asteroid trajectories using data from NASA's NEO (Near-Earth Object) API and SBDB (Small-Body Database).

## Architecture Overview

### 1. **Orbital Mechanics (`utils/orbitalMechanics.ts`)**
Handles the mathematical calculations for converting orbital elements to 3D positions.

**Key Functions:**
- `solveKeplersEquation()` - Solves Kepler's equation using Newton-Raphson iteration
- `orbitalElementsToPosition()` - Converts Keplerian orbital elements to heliocentric Cartesian coordinates
- `generateOrbitPath()` - Creates an array of position points along the orbit
- `parseSbdbOrbitalElements()` - Parses SBDB API response into standardized orbital elements
- `calculateOrbitalPeriod()` - Computes orbital period using Kepler's third law

**Orbital Elements Used:**
- `a` - Semi-major axis (AU)
- `e` - Eccentricity
- `i` - Inclination (degrees)
- `om` - Longitude of ascending node (degrees)
- `w` - Argument of perihelion (degrees)
- `ma` - Mean anomaly (degrees)

### 2. **Three.js Scene Manager (`utils/threeScene.ts`)**
Manages the 3D visualization scene with Three.js.

**Features:**
- **Sun**: Yellow sphere at origin with point light
- **Earth**: Blue sphere orbiting at 1 AU with accurate date-based positioning
- **Asteroid**: Dynamically sized white sphere based on diameter
- **Asteroid Orbit**: Orange elliptical path showing full orbital trajectory
- **Starfield**: 5000 random stars for space background
- **Camera**: Automatically positioned to frame the asteroid's orbit
- **Time-Based Simulation**: Date timeline slider controls accurate positions
- **Interactive Controls**: OrbitControls for zoom, pan, and rotation
  - **Left Mouse Button**: Rotate camera around the scene
  - **Mouse Wheel**: Zoom in/out (50-1000 unit range)
  - **Right Mouse Button**: Pan camera
  - **Damping**: Smooth inertial camera movement

**Key Methods:**
- `setAsteroid()` - Adds asteroid with orbital elements to the scene
- `setTimelineDate()` - Updates Earth and asteroid positions based on selected date
- `fitCameraToOrbit()` - Adjusts camera to view the entire asteroid orbit
- `resetCamera()` - Returns camera to default position
- `getControls()` - Access OrbitControls for advanced customization
- `dispose()` - Clean up resources when component unmounts

**Time-Based Positioning:**
- Uses accurate Keplerian orbital mechanics
- Calculates Julian Date from JavaScript Date
- Earth position based on 365.25-day orbital period from J2000 epoch
- Asteroid position calculated using `calculateMeanAnomalyAtTime()` with orbital elements
- Updates positions in real-time as timeline slider changes

### 3. **Orbital Data Composable (`composables/useOrbitalData.ts`)**
Vue composable for fetching and managing orbital data.

**Provides:**
- `orbitalData` - Parsed orbital elements with period
- `sbdbData` - Raw SBDB response data
- `loading` - Loading state
- `error` - Error messages
- `fetchOrbitalData()` - Async function to fetch data for an asteroid

### 4. **Asteroid Simulation Component (`components/AsteroidSimulation.vue`)**
Vue component that integrates everything together.

**States:**
- No asteroid selected - Shows placeholder message
- Loading orbital data - Shows spinner
- Error state - Displays error message
- Visualization active - Renders 3D scene with timeline controls

**Timeline Controls:**
- Date slider (0-365 days from current date)
- Formatted date display showing selected date
- Real-time position updates as slider moves

**Lifecycle:**
- Watches for asteroid selection changes
- Fetches orbital data when asteroid is selected
- Creates/updates Three.js scene when data is ready
- Watches timeline value and updates scene positions
- Cleans up scene on unmount or asteroid deselection

## Data Flow

```
User selects asteroid
    ↓
AsteroidSimulation.vue watches change
    ↓
useOrbitalData fetches from SBDB API
    ↓
parseSbdbOrbitalElements converts API response
    ↓
orbitalElementsToPosition calculates 3D coordinates
    ↓
AsteroidScene renders Sun, Earth, asteroid, and orbits
    ↓
User adjusts timeline slider
    ↓
setTimelineDate() updates positions based on date
    ↓
calculateMeanAnomalyAtTime() computes orbital positions
    ↓
Scene updates Earth and asteroid to accurate positions
```

## Usage Example

The component is used in your main app like this:

```vue
<AsteroidSimulation :selectedAsteroid="currentAsteroid" />
```

When an asteroid from NEO API is selected:
1. Component fetches orbital elements from SBDB using asteroid ID
2. Parses elements (a, e, i, om, w, ma, epoch)
3. Calculates 3D positions along the orbit
4. Creates Three.js scene with Sun at origin
5. Renders Earth orbiting at 1 AU with accurate date-based position
6. Shows asteroid at current position with full orbital path
7. Timeline slider allows scrubbing through 365 days
8. Earth and asteroid positions update accurately as timeline changes
9. Uses Julian Date conversion for precise astronomical calculations

## Coordinate System

- **Origin**: Sun at (0, 0, 0)
- **Scale**: 1 unit = 1 AU (scaled by SCALE factor for visibility)
- **Axes**: 
  - X: Right
  - Y: Up (mapped from ecliptic Z)
  - Z: Toward viewer (mapped from ecliptic Y)

## Visual Elements

### Sun
- 10 unit radius yellow sphere
- Point light source
- Glow effect overlay

### Earth
- 3 unit radius blue sphere
- Circular orbit at 1 AU
- Position calculated based on timeline date using J2000 epoch
- Completes one orbit every 365.25 days

### Asteroid
- Size scaled based on diameter (5-15 units)
- Bright white color for high visibility
- Text label showing name
- Position accurately calculated using Keplerian mechanics
- Updates in real-time as timeline changes

### Asteroid Orbit
- Orange elliptical line
- 200 segments for smooth curve
- Closes back to starting point

## Interactive Controls

The 3D visualization supports full interactive controls via OrbitControls and a date timeline:

### Timeline Controls
- **Date Slider**: Scrub through 365 days from current date
- **Date Display**: Shows selected date in readable format (e.g., "October 4, 2025")
- **Real-Time Updates**: Earth and asteroid positions update instantly as slider moves
- **Accurate Positioning**: Uses Julian Date and Keplerian orbital mechanics

### Mouse Controls
- **Left Click + Drag**: Rotate camera around the scene
- **Scroll Wheel**: Zoom in/out (constrained between 50-1000 units)
- **Right Click + Drag**: Pan the camera horizontally and vertically
- **Smooth Damping**: Inertial camera movement with dampingFactor 0.05

### Control Settings
- Zoom Speed: 1.0x
- Rotate Speed: 0.5x  
- Pan Speed: 0.5x
- Full 360° rotation on all axes
- Screen-space panning disabled (camera pans in world space)

### Visual Feedback
- Cursor changes to "grab" when hovering over scene
- Cursor changes to "grabbing" when actively rotating/panning
- Control hints displayed in card header when scene is active

## Performance Considerations

- **Efficient rendering**: Uses requestAnimationFrame
- **Resource cleanup**: Properly disposes of Three.js objects and controls
- **Responsive**: Handles window resize events
- **Lazy loading**: Only creates scene when asteroid is selected
- **Smooth controls**: Damped camera movement prevents jarring interactions
- **On-demand updates**: Position calculations only run when timeline changes

## Future Enhancements

Potential improvements:
1. ~~Add orbit controls (OrbitControls from three/examples)~~ ✅ **Completed**
2. ~~Add date timeline for accurate orbital positions~~ ✅ **Completed**
3. Show close approach points along trajectory
4. Display velocity vectors at current position
5. Add time animation (play/pause to watch orbits over time)
6. Compare multiple asteroids simultaneously
7. Show asteroid rotation
8. Add realistic textures for Earth and asteroid
9. Display orbital parameters as text overlay
10. Add screenshot/export functionality
11. Show scale reference (AU distances)
12. Add touch controls for mobile devices
13. Add camera presets (top view, side view, etc.)
14. Add mini-map or compass for orientation
15. Extend timeline beyond 365 days for long-period asteroids

## Dependencies

- `three` - 3D graphics library
- `three/examples/jsm/controls/OrbitControls` - Interactive camera controls
- `@types/three` - TypeScript definitions
- Vue 3 composition API
- PrimeVue Card component

## API Requirements

- NEO API: Provides asteroid list and basic data
- SBDB API: Provides orbital elements (proxied via Vite)

## Testing

To test the visualization:
1. Select an asteroid from the NEO list
2. Wait for orbital data to load
3. Scene should render with Sun, Earth, and asteroid
4. Asteroid orbit should be visible as orange ellipse
5. Earth and asteroid should be positioned accurately for current date
6. **Test Timeline Controls:**
   - Move the date slider left and right
   - Observe Earth and asteroid move to accurate positions
   - Verify date display updates correctly
   - Check that positions change smoothly
7. **Test Interactive Controls:**
   - Click and drag with left mouse button to rotate
   - Use scroll wheel to zoom in/out
   - Right-click and drag to pan the view
   - Observe smooth damped camera movement
8. Verify control hints are displayed in card header
