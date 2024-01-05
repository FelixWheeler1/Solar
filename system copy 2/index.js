import * as THREE from "./js/three.module.js";
import * as Tone from "./js/Tone.js";

import { OrbitControls } from "./js/OrbitControls.js";

let start;

let lastMouseX = 0;
let lastMouseY = 0;
let mouseMoveX = 0;
let mouseMoveY = 0;
let mousePressed = false;

let zoomedIn = false
let scene, camera, renderer, zoomScale;

let sun, moon, ring, materialCurve, saturnPosition, earthPosition, infoBox;

let originalCameraPosition, originalCameraZoom;


let orbit, geometry, stars, starsTexture, starsGeometry, starsMaterial, targetMesh, orbitGuide;

let listener, sound;

const planets = [
  { name: "mercury", scale: 4.9, speed: 0.000045, texture: "./textures/mercury.jpg", orbitDistance: 139 + 57 * 2, gravity: 3.7 },
  { name: "venus", scale: 12.1, speed: 0.00005, texture: "./textures/venus.jpg", orbitDistance: 139 + 108 * 2,  gravity: 8.87},
  { name: "earth", scale: 12.7, speed: 0.00001, texture: "./textures/earth.jpg", orbitDistance: 139 + 149 * 2 ,  gravity: 9.807},
  { name: "mars", scale: 6.8, speed: 0.000015, texture: "./textures/mars.jpg", orbitDistance: 139 + 227 * 2 ,  gravity: 3.71},
  { name: "jupiter", scale: 142.9, speed: 0.00003, texture: "./textures/jupiter.jpg", orbitDistance: 139 + 778 * 2 ,  gravity: 24.79},
  { name: "saturn", scale: 120.5, speed: 0.00004, texture: "./textures/saturn.jpg", orbitDistance: 139 + 1433 * 2  ,  gravity: 10.44},
  { name: "uranus", scale: 51.1, speed: 0.00002, texture: "./textures/uranus.jpg", orbitDistance: 139 + 2872 * 2 ,  gravity: 8.87},
  { name: "neptune", scale: 49.5, speed: 0.000025, texture: "./textures/neptune.jpg", orbitDistance: 139 + 4495 * 2  ,  gravity: 11.15}
];

const loader = new THREE.TextureLoader();
const audioLoader = new THREE.AudioLoader();

const hoverSound = document.getElementById('hoverSound');
const planetMenu = document.querySelectorAll('#planet-menu li');
const returnMenu = document.querySelectorAll('#return-menu li');


init();
function init() {
    // window.addEventListener("resize", onWindowResize, false);
  // document.addEventListener("keydown", onDocumentKeyDown, false);

  addListeners();
  //create scene
  scene = new THREE.Scene();
  scene.background = loader.load(" ./textures/galaxy.jpg");  //create camera
  camera = new THREE.PerspectiveCamera(
    1000, (window.innerWidth / window.innerHeight), 1, 900000);

  camera.position.set(3000, -200, 0);
  originalCameraPosition = camera.position.clone();
  originalCameraZoom = camera.zoom;

  renderer = new THREE.WebGLRenderer({ antialias: true }); // create renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  orbit = new OrbitControls(camera, renderer.domElement); // add orbit controls
  orbit.enableZoom = true;

  starBackground(10, 5);
  createSound();

  geometry = new THREE.SphereGeometry(1, 32, 32); // create planet geometry



      // create saturns rings geometrty
  //https://discourse.threejs.org/t/applying-a-texture-to-a-ringgeometry/9990/2
  const ringGeometry = new THREE.RingBufferGeometry(3, 5, 64);
  var pos = ringGeometry.attributes.position;
  var v3 = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v3.fromBufferAttribute(pos, i);
    ringGeometry.attributes.uv.setXY(i, v3.length() < 4 ? 0 : 1, 1);
  }


  // add planets

  planets.forEach(planet => {
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshPhongMaterial({ map: loader.load(planet.texture) });
    planet.mesh = new THREE.Mesh(geometry, material);
    planet.mesh.scale.set(-planet.scale, -planet.scale, -planet.scale);
    scene.add(planet.mesh);




    // create orbit for each planet
    createOrbit(planet.orbitDistance);
  });

// create sun, moon and saturns rings
  geometry = new THREE.SphereGeometry(1, 32, 32);
  sun = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide, emissive: 0xffa500, 
    emissiveMap: loader.load("./textures/sun.jpg"),
    emissiveIntensity: 1.5, map: loader.load("./textures/sun.jpg")
  }));
  ring = new THREE.Mesh(ringGeometry, new THREE.MeshPhongMaterial({ side: THREE.DoubleSide, map: loader.load("./textures/ring.png") }));
  moon = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ side: THREE.DoubleSide, map: loader.load("./textures/moon.jpg") }));



  sun.scale.set(139, 139, 139);
  moon.scale.set(3.5, 3.5, 3.5);
  ring.scale.set(50, 50, 50);
  ring.rotation.x = 80;

  scene.add(sun);
  scene.add(moon);
  scene.add(ring);

  addSunGlow();
  createLighting();

  start = false;
  play();
}

// stop 


function render() {
  renderer.render(scene, camera);
}


function play() { // starts the animation
  60
  renderer.setAnimationLoop(() => {
    update();
    render();

  }
  );
}


function update() {

  orbit.update();

  if (start == true) {
    sun.rotation.x += 0.01;
    sun.rotation.y += 0.02; //rotate sun
    sun.rotation.z -= 0.01


    planets.forEach(planet => {  //place planets on the orbit

      planet.mesh.rotation.y += 0.01;
      if (planet.name === "saturn") {

       ring.rotation.z = planet.mesh.rotation.z; // so rings rotate with saturn
      }
      const position = orbiter(planet.orbitDistance, planet.speed, true);
      planet.mesh.position.x = position.x;
      planet.mesh.position.z = position.y;

      earthPosition = planets.find(p => p.name === "earth");// to find position for the moon
      saturnPosition = planets.find(p => p.name === "saturn");// to find position for the rings

      moon.position.x = orbiter(-earthPosition.mesh.scale.x + 5 * 2, 0.00008, false).x;
      moon.position.z = orbiter(-earthPosition.mesh.scale.x + 5 * 2, 0.00008, false).y;

      ring.position.x = saturnPosition.mesh.position.x;
      ring.position.z = saturnPosition.mesh.position.z;

    })
  };


  if (start == true) {
    // Existing code to rotate sun and position planets
    // ...

    sound.play(); // Play sound if planets are moving
  } else {
    sound.pause(); // Pause sound if planets are not moving
  }



  focusPlanet();
  
}

//displaying the selected planet
function focusPlanet() {
  if (zoomedIn) {
    scene.remove(orbit);
  
    if (mousePressed) {// rotate the planet with a mouse
      const rotationSpeed = 0.005; //how fast you can rotate a planet
      targetMesh.rotation.y += -mouseMoveX * rotationSpeed;
      targetMesh.rotation.x += mouseMoveY * rotationSpeed;

      if (targetMesh === saturnPosition.mesh) {
        ring.rotation.z += mouseMoveX * rotationSpeed; // allow rings to rotate with saturn
        ring.rotation.x += mouseMoveY * rotationSpeed;
      }

      mouseMoveX = 0;
      mouseMoveY = 0;

    }
    scene.remove(sun);// stop sun blocking the camera
    camera.position.lerp(targetMesh.position, 0.05); // ease into position
    camera.lookAt(((targetMesh.position))); 
    // orbit.enableZoom = false; 
    camera.zoom = (zoomScale); // zooms into selected planet
    orbit.maxDistance = 50;
    orbit.enabled = false; // fixed camera so planet can be viewed
    camera.updateProjectionMatrix();

  } else {
    orbit.enableZoom = true;
    orbit.enabled = true; // reset orbit

    camera.updateProjectionMatrix();
  }
}

// check to see which planet is clicked on
function selectPlanet(planetName, planetZoom) {
  const selectedPlanet = planets.find(p => p.name === planetName); // finds planet based on input
  if (selectedPlanet) {
    targetMesh = selectedPlanet.mesh;
    zoomedIn = true;
    zoomScale = planetZoom;   // zoom factor for planets
    hideInfoBox(); // hides existing infobox
    infoBox = document.getElementById(planetName + 'Info');  // show planet information
    infoBox.style.display = "block ";
    focusPlanet();

    adjustAudioPlaybackRate(selectedPlanet.gravity);
  }
}


function resetSun() {

  zoomedIn = !zoomedIn;
  if (!zoomedIn) { 
    scene.add(sun);
    orbit.maxDistance = 90000;  // increasing the view distance

    camera.position.copy(originalCameraPosition); // reset camera to original position
    camera.zoom = originalCameraZoom;
    camera.updateProjectionMatrix();
    orbit.reset();
    infoBox.style.display = "none"; 

    adjustAudioPlaybackRate(10);
  }

}

// planets orbit around the sun
function orbiter(radius, speed, sunOrbit) {
  let x = 0, y = 0;
  if (sunOrbit == false) {
    earthPosition = planets.find(p => p.name === "earth"); // moon orbit around earth
    x = earthPosition.mesh.position.x;
    y = earthPosition.mesh.position.z;
  }

  const curve = new THREE.EllipseCurve(  //create orbit based on indivdual values
    x, y, 
    radius, radius,
    0, 2 * Math.PI 
  );
  //creat a geometry 
  const points = curve.getSpacedPoints(100);
  const geometryCurve = new THREE.BufferGeometry().setFromPoints(points); 

  const time = speed * performance.now() 
  const t = (time % 1) / 1; 

  return curve.getPoint(t); // return next position of a planet 
}


function createOrbit(radius) {           //shows guide lines for planets orbit
  const curve = new THREE.EllipseCurve(
    0, 0, 
    radius, radius,
    0, 2 * Math.PI 
  );
  const points = curve.getSpacedPoints(100);
  const geometryCurve = new THREE.BufferGeometry().setFromPoints(points);

  materialCurve = new THREE.LineBasicMaterial({
    color: 0x999999,
    transparent: true,
    opacity: 0.5
  });

  orbitGuide = new THREE.Line(geometryCurve, materialCurve);
  orbitGuide.rotateX(-Math.PI / 2);
  scene.add(orbitGuide);
}

function onDocumentMouseMove(event) {
  if (mousePressed) {
    mouseMoveX = event.clientX - lastMouseX;  // change in mouse position when pressed
    mouseMoveY = event.clientY - lastMouseY;
  }

  lastMouseX = event.clientX;// store last position
  lastMouseY = event.clientY;
}

// create environment
function starBackground(wrapS, wrapT)  // starry background
{
  starsTexture = new THREE.TextureLoader().load(" ./textures/galaxy.jpg");

  // starsTexture.wrapS = THREE.RepeatWrapping;
  // starsTexture.wrapT = THREE.RepeatWrapping;

  starsGeometry = new THREE.SphereGeometry(90000, 64, 32);
  starsMaterial = new THREE.MeshBasicMaterial({
    map: starsTexture,
    side: THREE.BackSide,
  });
  stars = new THREE.Mesh(starsGeometry, starsMaterial);
  scene.add(stars);
}

//lighting
function createLighting() {
  colour = 0x333333;
  intensity = 2;
  ambientLight = new THREE.AmbientLight(colour, intensity);
  scene.add(ambientLight);

  const sunGlow = new THREE.PointLight(0xf8f5ca, 1, 90000); //the suns light
  sunGlow.position.copy(sun.position);
  scene.add(sunGlow);

}

// add emitting light from the sun
function addSunGlow() {
  const spriteMaterial = new THREE.SpriteMaterial({
    map: new THREE.TextureLoader().load("./textures/glow.png"),
    color: 0xffff00, 
    transparent: true,
    blending: THREE.AdditiveBlending
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(3, 3, 1);
  sun.add(sprite);
}

function createSound() {
  listener = new THREE.AudioListener();
  camera.add(listener);

  sound = new THREE.Audio(listener);
  audioLoader.load("./sounds/sound.mp3", function (buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(1);
    hoverSound.volume = 0.5;
    // sound.play();
  });}


function adjustAudioPlaybackRate(gravity) {
  const baseGravity = 9.807;
  const playbackRate = (10 / gravity)  ;
  sound.setPlaybackRate(playbackRate);
}


function hideInfoBox() {
  const infoBoxes = document.querySelectorAll('div[id$="Info"]'); // finds all divs with the word info
  infoBoxes.forEach(box => {
    box.style.display = 'none'; // removes infoBox
  });
}


function addListeners(){
    //check mouse movements
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mousedown', () => { mousePressed = true; }, false);
    document.addEventListener('mouseup', () => { mousePressed = false; }, false);
    window.addEventListener("resize", onWindowResize, false);
    document.addEventListener("keydown", onDocumentKeyDown, false);
  
    returnMenu.forEach(item => {
      item.addEventListener('mouseover', () => {
          hoverSound.play();
      });
  });
  
  
    planetMenu.forEach(item => {
        item.addEventListener('mouseover', () => {
            hoverSound.play();
        });
    });
  
}

function onDocumentKeyDown(event) {
  const keyCode = event.which;


  let selectedPlanet = null;
  switch (keyCode) {
//code for keyboaard input to switch planets

    // case 69: // 'E' for Earth
    //   selectedPlanet = planets.find(p => p.name === "Earth");
    //    infoBox = document.getElementById('earthInfo');
    //   zoomScale= 12;
    //   break;
    // case 89: // 'Y' for Mercury
    // selectedPlanet = planets.find(p => p.name === "Mercury");
    // infoBox = document.getElementById('mercuryInfo');
    // zoomScale = 17;
    //   break;
    // case 86: // 'V' for Venus
    // selectedPlanet = planets.find(p => p.name === "Venus");
    // infoBox = document.getElementById('venusInfo');
    // zoomScale = 12;
    //   break;
    //   case 77: // 'V' for Venus
    // selectedPlanet = planets.find(p => p.name === "Mars");
    // infoBox = document.getElementById('marsInfo');
    // zoomScale = 20;
    //   break;
    // case 74: // 'J' for Jupiter
    // selectedPlanet = planets.find(p => p.name === "Jupiter");
    // infoBox = document.getElementById('jupiterInfo');
    // zoomScale = 5;
    //   break;
    // case 83: // 'S' for Saturn
    // selectedPlanet = planets.find(p => p.name === "Saturn");
    // infoBox = document.getElementById('saturnInfo');
    // zoomScale = 6;
    //   break;
    // case 85: // 'U' for Uranus
    // selectedPlanet = planets.find(p => p.name === "Uranus");
    // infoBox = document.getElementById('uranusInfo');
    // zoomScale = 28 ;
    //   break;
    // case 78: // 'N' for Neptune
    // selectedPlanet = planets.find(p => p.name === "Neptune");
    // infoBox = document.getElementById('neptuneInfo');
    // zoomScale = 30;

    //   break;




    case 32:
      start = !start;
      return; 
  }
  // if (selectedPlanet) {
  //   targetMesh = selectedPlanet.mesh;
  //  }
  // resetSun();
}

// makes the system adjust size based on window size
function onWindowResize() {

  sceneHeight = window.innerHeight;
  sceneWidth = window.innerWidth;
  renderer.setSize(sceneWidth, sceneHeight);
  camera.aspect = sceneWidth / sceneHeight;
  camera.updateProjectionMatrix();
}

window.selectPlanet = selectPlanet;
window.resetSun = resetSun;


// Planet, Diameter (km), Distance from Sun (km)
// Sun 1,391,400 -
// Mercury 4,879 57,900,000
// Venus 12,104 108,200,000
// Earth 12,756 149,600,000
// Mars 6,792 227,900,000
// Jupiter 142,984 778,600,000
// Saturn 120,536 1,433,500,000
// Uranus 51,118 2,872,500,000
// Neptune 49,528 4,495,100,000