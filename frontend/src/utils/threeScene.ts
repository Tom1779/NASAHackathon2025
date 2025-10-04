/**
 * Three.js Scene Manager
 * Manages the Three.js scene for asteroid trajectory visualization
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { OrbitalElements } from './orbitalMechanics';
import { orbitalElementsToPosition, generateOrbitPath } from './orbitalMechanics';

export interface SceneConfig {
  container: HTMLElement;
  showGrid?: boolean;
  showAxes?: boolean;
}

export class AsteroidScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private controls: OrbitControls;

  // Scene objects
  private sun: THREE.Mesh | null = null;
  private earth: THREE.Mesh | null = null;
  private earthOrbit: THREE.Line | null = null;
  private asteroid: THREE.Mesh | null = null;
  private asteroidOrbit: THREE.Line | null = null;
  private asteroidTrajectory: THREE.Line | null = null;

  // Animation
  private animationId: number | null = null;
  private earthAngle = 0;
  private asteroidAngle = 0;

  // Scale factor (for visualization, 1 unit = 1 AU)
  private readonly SCALE = 50;
  private readonly EARTH_ORBIT_RADIUS = 1.0; // AU

  constructor(config: SceneConfig) {
    this.container = config.container;

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000005);

    // Create camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 10000);
    this.camera.position.set(150, 100, 150);
    this.camera.lookAt(0, 0, 0);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // Add lights
    this.addLights();

    // Add Sun
    this.addSun();

    // Add Earth and orbit
    this.addEarth();

    // Add starfield
    this.addStarfield();

    // Add grid and axes if requested
    if (config.showGrid) {
      const gridHelper = new THREE.GridHelper(400, 40, 0x444444, 0x222222);
      this.scene.add(gridHelper);
    }

    if (config.showAxes) {
      const axesHelper = new THREE.AxesHelper(100);
      this.scene.add(axesHelper);
    }

    // Add orbit controls for interactive camera control
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // Smooth camera movement
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 50; // Minimum zoom distance
    this.controls.maxDistance = 1000; // Maximum zoom distance
    this.controls.maxPolarAngle = Math.PI; // Allow full rotation
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.enableRotate = true;
    this.controls.zoomSpeed = 1.0;
    this.controls.rotateSpeed = 0.5;
    this.controls.panSpeed = 0.5;

    // Handle window resize
    window.addEventListener('resize', this.handleResize);

    // Start animation loop
    this.animate();
  }

  private addLights(): void {
    // Sunlight (point light at Sun's position)
    const sunLight = new THREE.PointLight(0xffffff, 2, 1000);
    sunLight.position.set(0, 0, 0);
    this.scene.add(sunLight);

    // Ambient light for visibility
    const ambientLight = new THREE.AmbientLight(0x333333, 0.5);
    this.scene.add(ambientLight);
  }

  private addSun(): void {
    const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00
    });
    this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
    this.scene.add(this.sun);

    // Add sun glow
    const glowGeometry = new THREE.SphereGeometry(12, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.scene.add(glow);
  }

  private addEarth(): void {
    // Earth sphere
    const earthGeometry = new THREE.SphereGeometry(3, 32, 32);
    const earthMaterial = new THREE.MeshStandardMaterial({
      color: 0x2233ff,
      emissive: 0x112244,
      roughness: 0.8,
      metalness: 0.2
    });
    this.earth = new THREE.Mesh(earthGeometry, earthMaterial);

    // Position Earth at 1 AU
    const earthX = this.EARTH_ORBIT_RADIUS * this.SCALE;
    this.earth.position.set(earthX, 0, 0);
    this.scene.add(this.earth);

    // Earth's orbit
    const orbitPoints: THREE.Vector3[] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * this.EARTH_ORBIT_RADIUS * this.SCALE;
      const z = Math.sin(angle) * this.EARTH_ORBIT_RADIUS * this.SCALE;
      orbitPoints.push(new THREE.Vector3(x, 0, z));
    }

    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.4
    });
    this.earthOrbit = new THREE.Line(orbitGeometry, orbitMaterial);
    this.scene.add(this.earthOrbit);
  }

  private addStarfield(): void {
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions: number[] = [];

    for (let i = 0; i < 5000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starPositions.push(x, y, z);
    }

    starsGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(starPositions, 3)
    );

    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1,
      transparent: true,
      opacity: 0.8
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);
  }

  /**
   * Add or update asteroid with orbital elements
   */
  public setAsteroid(elements: OrbitalElements, name: string, diameter: number): void {
    // Remove existing asteroid and orbit
    if (this.asteroid) {
      this.scene.remove(this.asteroid);
      this.asteroid = null;
    }
    if (this.asteroidOrbit) {
      this.scene.remove(this.asteroidOrbit);
      this.asteroidOrbit = null;
    }
    if (this.asteroidTrajectory) {
      this.scene.remove(this.asteroidTrajectory);
      this.asteroidTrajectory = null;
    }

    // Create asteroid mesh
    // Increased size multiplier for better visibility
    const size = Math.max(5, Math.min(diameter / 20, 15)); // Scale based on diameter (5-15 units)
    const asteroidGeometry = new THREE.SphereGeometry(size, 16, 16);
    const asteroidMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff // White for high visibility, unaffected by lighting
    });
    this.asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);

    // Position asteroid at current mean anomaly
    const position = orbitalElementsToPosition(elements);
    this.asteroid.position.set(
      position.x * this.SCALE,
      position.z * this.SCALE, // Using z as y for better visualization
      position.y * this.SCALE
    );
    this.scene.add(this.asteroid);

    // Generate orbit path
    const orbitPath = generateOrbitPath(elements, 200);
    const orbitPoints = orbitPath.map(pos =>
      new THREE.Vector3(
        pos.x * this.SCALE,
        pos.z * this.SCALE,
        pos.y * this.SCALE
      )
    );

    // Close the orbit
    if (orbitPoints.length > 0 && orbitPoints[0]) {
      orbitPoints.push(orbitPoints[0]);
    }

    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.6
    });
    this.asteroidOrbit = new THREE.Line(orbitGeometry, orbitMaterial);
    this.scene.add(this.asteroidOrbit);

    // Add asteroid label
    this.addLabel(name, this.asteroid.position);

    // Adjust camera to view the asteroid orbit
    this.fitCameraToOrbit(elements);
  }

  private addLabel(text: string, position: THREE.Vector3): void {
    // Create a sprite for the label
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = 256;
    canvas.height = 64;

    context.fillStyle = 'rgba(0, 0, 0, 0.6)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = 'Bold 20px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);

    sprite.position.set(position.x, position.y + 10, position.z);
    sprite.scale.set(20, 5, 1);

    this.scene.add(sprite);
  }

  private fitCameraToOrbit(elements: OrbitalElements): void {
    // Calculate the maximum extent of the orbit
    const maxRadius = elements.a * (1 + elements.e) * this.SCALE;
    const distance = Math.max(maxRadius * 2.5, 200);

    this.camera.position.set(distance * 0.7, distance * 0.5, distance * 0.7);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Animate Earth around Sun and asteroid along its orbit
   */
  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    // Rotate Earth around Sun
    this.earthAngle += 0.001;
    if (this.earth) {
      const earthX = Math.cos(this.earthAngle) * this.EARTH_ORBIT_RADIUS * this.SCALE;
      const earthZ = Math.sin(this.earthAngle) * this.EARTH_ORBIT_RADIUS * this.SCALE;
      this.earth.position.set(earthX, 0, earthZ);
    }

    // Update controls (required for damping)
    this.controls.update();

    this.renderer.render(this.scene, this.camera);
  };

  private handleResize = (): void => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  };

  /**
   * Clean up resources
   */
  public dispose(): void {
    window.removeEventListener('resize', this.handleResize);

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    // Dispose of controls
    this.controls.dispose();

    this.renderer.dispose();

    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  /**
   * Get the Three.js scene
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get the camera
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Get the orbit controls
   */
  public getControls(): OrbitControls {
    return this.controls;
  }

  /**
   * Reset camera to default view
   */
  public resetCamera(): void {
    this.camera.position.set(150, 100, 150);
    this.camera.lookAt(0, 0, 0);
    this.controls.reset();
  }
}
