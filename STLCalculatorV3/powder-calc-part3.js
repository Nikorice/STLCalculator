/* powder-calc-part3.js - Three.js Visualization Functions */

/* ====================== THREE.JS FUNCTIONS ====================== */
/* Performance Optimizations */

// 1. Optimize Three.js rendering with throttling and lazy initialization
// Add this to powder-calc-part3.js or replace the existing function

function initThreeJSViewer(container) {
    perfMonitor.start('initViewer');
    
    // Only create the Three.js context when actually needed (lazy initialization)
    let renderer, scene, camera, controls;
    let animationFrameId;
    let active = false;
    let needsRender = false;
    
    // Create renderer with optimized settings
    renderer = new THREE.WebGLRenderer({ 
      antialias: false, // Disable antialiasing for performance
      powerPreference: 'high-performance',
      precision: 'mediump'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Limit pixel ratio
    renderer.setClearColor(0xf0f2f5);
    container.appendChild(renderer.domElement);
    
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(50, 50, 50);
    
    // Simplified lighting - fewer lights = better performance
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(50, 50, 50);
    scene.add(dirLight);
    
    // Add orbit controls with reduced smoothness for better performance
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.15;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI;
    controls.enableZoom = true;
    controls.zoomSpeed = 0.8;
    controls.rotateSpeed = 0.6;
    
    // Throttled resize handler
    let resizeTimeout;
    const onWindowResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        needsRender = true;
      }, 200); // More throttling
    };
    
    const resizeObserver = new ResizeObserver(onWindowResize);
    resizeObserver.observe(container);
    
    // Animation loop with frame limiting
    let lastRenderTime = 0;
    const FRAME_INTERVAL = 33; // Limit to 30fps (33ms)
    
    function animate(time) {
      animationFrameId = requestAnimationFrame(animate);
      
      // Only render when visible in viewport
      if (!active) return;
      
      // Check if enough time has passed since last render or if a render is needed
      if (time - lastRenderTime >= FRAME_INTERVAL || needsRender) {
        controls.update();
        renderer.render(scene, camera);
        lastRenderTime = time;
        needsRender = false;
      }
    }
    
    // Use Intersection Observer to only animate when in viewport
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        active = entry.isIntersecting;
        if (active) {
          needsRender = true;
        }
      });
    }, { threshold: 0.1 });
    
    observer.observe(container);
    
    // Start animation
    animate(0);
    
    // Cleanup
    const cleanup = () => {
      observer.disconnect();
      if (resizeObserver) resizeObserver.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      
      scene.traverse(object => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
    };
    
    perfMonitor.end('initViewer');
    return { renderer, scene, camera, controls, cleanup };
}
  
// Determine the optimal orientation for an object (longest dimension = vertical or default to flat, etc.)
function determineOptimalOrientation(width, depth, height) {
  const dimensions = [
    { value: width, name: 'width' },
    { value: depth, name: 'depth' },
    { value: height, name: 'height' }
  ];
  dimensions.sort((a, b) => b.value - a.value); // descending
  
  const maxDim = dimensions[0];
  const midDim = dimensions[1];
  const minDim = dimensions[2];
  
  let orientation = {
    width: 0,
    depth: 0,
    height: 0,
    type: "",
    printTime: 0,
    vertical: {
      width: 0,
      depth: 0, 
      height: 0,
      printTime: 0
    },
    flat: {
      width: 0,
      depth: 0,
      height: 0,
      printTime: 0
    }
  };
  
  // vertical: put the longest dimension on Z
  if (maxDim.value <= printer600.height) {
    orientation.vertical.width = minDim.value;
    orientation.vertical.depth = midDim.value;
    orientation.vertical.height = maxDim.value;
    orientation.vertical.printTime = Math.ceil(maxDim.value / 0.1) * printer600.layerTime;
  } else {
    // too tall; scale it or just set to max
    const scale = printer600.height / maxDim.value;
    orientation.vertical.width = minDim.value * scale;
    orientation.vertical.depth = midDim.value * scale;
    orientation.vertical.height = printer600.height;
    orientation.vertical.printTime = Math.ceil(printer600.height / 0.1) * printer600.layerTime;
  }
  
  // flat: put the shortest dimension on Z
  orientation.flat.width = maxDim.value;
  orientation.flat.depth = midDim.value;
  orientation.flat.height = minDim.value;
  orientation.flat.printTime = Math.ceil(minDim.value / 0.1) * printer600.layerTime;
  
  // default to flat
  orientation.width = orientation.flat.width;
  orientation.depth = orientation.flat.depth;
  orientation.height = orientation.flat.height;
  orientation.printTime = orientation.flat.printTime;
  orientation.type = "flat";
  
  return orientation;
}

// Apply orientation to mesh (resets from original geometry)
function applyOrientation(mesh, originalSize, orientationType) {
  console.log(`Applying orientation: ${orientationType}`);
  // Reset
  mesh.rotation.set(0, 0, 0);
  mesh.updateMatrix();
  mesh.matrix.identity();
  
  // Use unmodified geometry
  const baseGeometry = mesh.userData.originalGeometry
    ? mesh.userData.originalGeometry
    : mesh.geometry;
  const newGeometry = baseGeometry.clone();
  
  // Determine which axis is longest, middle, shortest
  const origWidth = originalSize.x;
  const origDepth = originalSize.y;
  const origHeight = originalSize.z;
  const origDimensions = [
    { value: origWidth, axis: 'x' },
    { value: origDepth, axis: 'y' },
    { value: origHeight, axis: 'z' }
  ];
  origDimensions.sort((a, b) => b.value - a.value); // Sort descending (longest to shortest)
  
  const maxDimAxis = origDimensions[0].axis; // Longest dimension
  const midDimAxis = origDimensions[1].axis; // Middle dimension
  const minDimAxis = origDimensions[2].axis; // Shortest dimension
  
  let rotationMatrix = new THREE.Matrix4();
  
  if (orientationType === "vertical") {
    // Put the longest dimension on Z (upright, standing vertically)
    console.log(`Longest dimension on ${maxDimAxis}, rotating to Z`);
    if (maxDimAxis === 'x') {
      rotationMatrix.makeRotationY(-Math.PI / 2); // Rotate X to Z
    } else if (maxDimAxis === 'y') {
      rotationMatrix.makeRotationX(Math.PI / 2); // Rotate Y to Z
    } else if (maxDimAxis === 'z') {
      // Already aligned with Z, no rotation needed
    }
  } else if (orientationType === "flat") {
    // Put the shortest dimension on Z (lying flat, lowest height)
    console.log(`Shortest dimension on ${minDimAxis}, rotating to Z`);
    if (minDimAxis === 'x') {
      rotationMatrix.makeRotationY(-Math.PI / 2); // Rotate X to Z
    } else if (minDimAxis === 'y') {
      rotationMatrix.makeRotationX(Math.PI / 2); // Rotate Y to Z
    } else if (minDimAxis === 'z') {
      // Already aligned with Z, no rotation needed
    }
  }
  
  newGeometry.applyMatrix4(rotationMatrix);
  
  // Update mesh
  mesh.geometry.dispose();
  mesh.geometry = newGeometry;
  
  // Re-center and position so bottom is at Z=0
  newGeometry.computeBoundingBox();
  const bbox = newGeometry.boundingBox;
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  
  // Position so bottom is at Z=0
  mesh.position.set(-center.x, -center.y, -bbox.min.z);
  
  return newGeometry;
}
  
// Change orientation in main viewer
function changeOrientation(scene, camera, controls, orientationType) {
  if (!scene.userData || !scene.userData.mesh) return null;
  
  const mesh = scene.userData.mesh;
  const originalSize = scene.userData.originalSize;
  const orientationData = scene.userData.orientationData;
  
  const newGeometry = applyOrientation(mesh, originalSize, orientationType);
  
  // Adjust camera to focus on the reoriented object
  newGeometry.computeBoundingBox();
  const bbox = newGeometry.boundingBox;
  const size = new THREE.Vector3();
  bbox.getSize(size);
  
  const maxDim = Math.max(size.x, size.y, size.z);
  const distance = Math.max(maxDim * 1.5, 50);
  
  // Position camera to view the object clearly (adjust for vertical orientation)
  if (orientationType === "vertical") {
    // For vertical (standing upright), position camera above and slightly to the side
    gsap.to(camera.position, {
      x: distance,
      y: distance,
      z: distance,
      duration: 0.8,
      ease: "power2.inOut",
      onUpdate: () => {
        camera.lookAt(0, 0, size.z / 2); // Look at the base/center of the object
      }
    });
  } else {
    // For flat (lying down), position camera above and centered
    gsap.to(camera.position, {
      x: distance,
      y: distance,
      z: distance,
      duration: 0.8,
      ease: "power2.inOut",
      onUpdate: () => {
        camera.lookAt(0, 0, size.z / 2); // Look at the base/center of the object
      }
    });
  }
  
  controls.target.set(0, 0, size.z / 2);
  controls.update();
  
  // Update orientationData
  orientationData.type = orientationType;
  if (orientationType === "vertical") {
    orientationData.width = orientationData.vertical.width;
    orientationData.depth = orientationData.vertical.depth;
    orientationData.height = orientationData.vertical.height;
    orientationData.printTime = orientationData.vertical.printTime;
  } else {
    orientationData.width = orientationData.flat.width;
    orientationData.depth = orientationData.flat.depth;
    orientationData.height = orientationData.flat.height;
    orientationData.printTime = orientationData.flat.printTime;
  }
  
  return orientationData;
}
  
// Display 3D geometry in main viewer
function displayGeometry(geometry, scene, camera, controls) {
  perfMonitor.start('displayModel');
  
  // Clone original
  const originalGeometry = geometry.clone();
  
  // Clear existing
  scene.traverse(obj => {
    if (obj.isMesh) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
      scene.remove(obj);
    }
  });
  
  const material = new THREE.MeshPhongMaterial({
    color: 0x3a86ff,
    shininess: 30,
    flatShading: true
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  
  // Original size
  originalGeometry.computeBoundingBox();
  const originalSize = new THREE.Vector3();
  originalGeometry.boundingBox.getSize(originalSize);
  
  // Store so we can reset orientation
  mesh.userData.originalGeometry = originalGeometry;
  mesh.userData.originalSize = originalSize.clone();
  
  // Determine orientation data
  const orientationData = determineOptimalOrientation(
    originalSize.x, originalSize.y, originalSize.z
  );
  
  // Default to "flat"
  applyOrientation(mesh, originalSize, "flat");
  
  scene.add(mesh);
  
  // Adjust camera
  mesh.geometry.computeBoundingBox();
  const newBbox = mesh.geometry.boundingBox;
  const size = new THREE.Vector3();
  newBbox.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const distance = Math.max(maxDim * 1.5, 50);
  
  camera.position.set(distance, distance, distance);
  controls.target.set(0, 0, size.z / 2);
  camera.lookAt(0, 0, size.z / 2);
  controls.update();
  
  addAxisHelpers(scene, Math.max(maxDim, 20));
  
  scene.userData = {
    originalGeometry,
    originalSize,
    mesh,
    orientationData
  };
  
  perfMonitor.end('displayModel');
  return orientationData;
}
  
// Axis helpers
function addAxisHelpers(scene, size) {
  scene.traverse(child => {
    if (child.isAxesHelper) {
      scene.remove(child);
    }
  });
  const axesHelper = new THREE.AxesHelper(size);
  scene.add(axesHelper);
}
  
// Load STL for packing
async function loadSTLModelForPacking(stlData) {
  return new Promise((resolve, reject) => {
    try {
      const loader = new THREE.STLLoader();
      const geometry = loader.parse(stlData);
      resolve(geometry);
    } catch (error) {
      console.error("Error loading STL for packing:", error);
      reject(error);
    }
  });
}
  
// Visualize printer packing
function visualizePacking(
  printer,
  objWidth,
  objDepth,
  objHeight,
  positions,
  container,
  stlGeometry,
  orientationType // <--- newly added parameter
) {
  perfMonitor.start('visualizePacking');
  
  // Clean up old renderer
  if (container.cleanup) {
    container.cleanup();
  }
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  
  // Show “exceeds capacity” if no positions
  if (!positions || positions.length === 0) {
    const message = document.createElement("div");
    message.style.height = "100%";
    message.style.display = "flex";
    message.style.alignItems = "center";
    message.style.justifyContent = "center";
    message.style.fontSize = "14px";
    message.style.color = "#e63946";
    message.textContent = "Object exceeds printer capacity";
    container.appendChild(message);
    perfMonitor.end('visualizePacking');
    return;
  }
  
  // Create renderer, scene, camera
  const renderer = new THREE.WebGLRenderer({ 
    antialias: window.devicePixelRatio < 2,
    alpha: true,
    powerPreference: 'high-performance',
    precision: 'mediump'
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0xffffff, 1);
  container.appendChild(renderer.domElement);
  
  const scene = new THREE.Scene();
  
  const aspect = container.clientWidth / container.clientHeight;
  const frustumSize = Math.max(printer.width, printer.depth, printer.height) * 1.2;
  
  const camera = new THREE.OrthographicCamera(
    frustumSize * aspect / -2, 
    frustumSize * aspect / 2,
    frustumSize / 2, 
    frustumSize / -2,
    0.1, 
    1000
  );
  
  const isoDist = Math.max(printer.width, printer.depth, printer.height) * 0.7;
  camera.position.set(isoDist, -isoDist, isoDist);
  camera.lookAt(printer.width/2, printer.depth/2, printer.height/2);
  
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.2;
  controls.minZoom = 0.5;
  controls.maxZoom = 2;
  controls.target.set(printer.width/2, printer.depth/2, printer.height/2);
  controls.update();
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);
  
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
  dirLight.position.set(isoDist, -isoDist, isoDist);
  scene.add(dirLight);
  
  createPrinterOutline(scene, printer);
  
  // base plate
  const basePlateGeom = new THREE.BoxGeometry(printer.width, printer.depth, 1);
  const basePlateMat = new THREE.MeshBasicMaterial({
    color: 0xdddddd,
    opacity: 0.5,
    transparent: true
  });
  const basePlate = new THREE.Mesh(basePlateGeom, basePlateMat);
  basePlate.position.set(printer.width/2, printer.depth/2, 0.5);
  scene.add(basePlate);
  
  // axis lines
  const axisLength = Math.max(printer.width, printer.depth, printer.height) * 0.4;
  
  const xAxisGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(axisLength, 0, 0)
  ]);
  const xAxis = new THREE.Line(xAxisGeom, new THREE.LineBasicMaterial({ color: 0xff0000 }));
  scene.add(xAxis);
  
  const yAxisGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, axisLength, 0)
  ]);
  const yAxis = new THREE.Line(yAxisGeom, new THREE.LineBasicMaterial({ color: 0x00ff00 }));
  scene.add(yAxis);
  
  const zAxisGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, axisLength)
  ]);
  const zAxis = new THREE.Line(zAxisGeom, new THREE.LineBasicMaterial({ color: 0x0000ff }));
  scene.add(zAxis);
  
  // Axis labels
  const createLabel = (text, position, color) => {
    const div = document.createElement('div');
    div.textContent = text;
    div.style.position = 'absolute';
    div.style.color = color;
    div.style.fontWeight = 'bold';
    div.style.fontSize = '12px';
    div.style.textShadow = '1px 1px 1px rgba(255,255,255,0.7)';
    div.style.pointerEvents = 'none';
    container.appendChild(div);
    return { element: div, position };
  };
  
  const labels = [
    createLabel('X', new THREE.Vector3(axisLength + 5, 0, 0), '#ff0000'),
    createLabel('Y', new THREE.Vector3(0, axisLength + 5, 0), '#00ff00'),
    createLabel('Z', new THREE.Vector3(0, 0, axisLength + 5), '#0000ff')
  ];
  
  // If we have an STL geometry, apply orientation
  // We'll parse bounding box once
  const stlBbox = new THREE.Box3().setFromObject(new THREE.Mesh(stlGeometry));
  const stlSize = new THREE.Vector3();
  stlBbox.getSize(stlSize);
  
  positions.forEach(pos => {
    const objectMat = new THREE.MeshPhongMaterial({
      color: 0x38b000,
      opacity: 0.8,
      transparent: true,
      flatShading: true
    });
    
    // Create a mesh from the STL
    const stlMesh = new THREE.Mesh(stlGeometry.clone(), objectMat);
    
    // Store original so we can orient it
    stlMesh.userData.originalGeometry = stlGeometry.clone();
    stlMesh.userData.originalSize = stlSize.clone();
    
    // Apply the same orientation user selected
    applyOrientation(stlMesh, stlMesh.userData.originalSize, orientationType);
    
    // Now scale to (objWidth, objDepth, objHeight)
    stlMesh.geometry.computeBoundingBox();
    const orientedBbox = stlMesh.geometry.boundingBox;
    const orientedSize = new THREE.Vector3();
    orientedBbox.getSize(orientedSize);
    
    const scaleX = objWidth / orientedSize.x;
    const scaleY = objDepth / orientedSize.y;
    const scaleZ = objHeight / orientedSize.z;
    stlMesh.scale.set(scaleX, scaleY, scaleZ);
    
    // Recompute bounding box after scaling
    stlMesh.geometry.computeBoundingBox();
    const finalBbox = stlMesh.geometry.boundingBox;
    
    // Position so that bottom corner is at pos.x, pos.y, pos.z
    stlMesh.position.set(
      pos.x - finalBbox.min.x,
      pos.y - finalBbox.min.y,
      pos.z - finalBbox.min.z
    );
    
    scene.add(stlMesh);
  });
  
  // Animate
  let animationId;
  let lastRenderTime = 0;
  function animate(time) {
    animationId = requestAnimationFrame(animate);
    if (time - lastRenderTime < 33) return;
    lastRenderTime = time;
    
    controls.update();
    renderer.render(scene, camera);
    
    // Update label positions
    labels.forEach(label => {
      const screenPos = label.position.clone().project(camera);
      label.element.style.left = `${(screenPos.x * 0.5 + 0.5) * container.clientWidth}px`;
      label.element.style.top = `${(-screenPos.y * 0.5 + 0.5) * container.clientHeight}px`;
    });
  }
  animate(0);
  
  // Resize observer
  const resizeObserver = new ResizeObserver(() => {
    renderer.setSize(container.clientWidth, container.clientHeight);
    const aspect = container.clientWidth / container.clientHeight;
    camera.left = frustumSize * aspect / -2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = frustumSize / -2;
    camera.updateProjectionMatrix();
  });
  resizeObserver.observe(container);
  
  // Cleanup
  container.cleanup = () => {
    if (animationId) cancelAnimationFrame(animationId);
    if (resizeObserver) resizeObserver.disconnect();
    
    labels.forEach(label => {
      if (label.element && label.element.parentNode) {
        label.element.parentNode.removeChild(label.element);
      }
    });
    
    scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    renderer.dispose();
  };
  
  perfMonitor.end('visualizePacking');
}

// Printer outline
function createPrinterOutline(scene, printer) {
  const w = printer.width;
  const d = printer.depth;
  const h = printer.height;
  
  const lineMaterial = new THREE.LineBasicMaterial({ 
    color: 0x000000, 
    opacity: 0.5,
    transparent: true
  });
  
  const edges = [
    // bottom
    [[0, 0, 0], [w, 0, 0]],
    [[w, 0, 0], [w, d, 0]],
    [[w, d, 0], [0, d, 0]],
    [[0, d, 0], [0, 0, 0]],
    
    // top
    [[0, 0, h], [w, 0, h]],
    [[w, 0, h], [w, d, h]],
    [[w, d, h], [0, d, h]],
    [[0, d, h], [0, 0, h]],
    
    // verticals
    [[0, 0, 0], [0, 0, h]],
    [[w, 0, 0], [w, 0, h]],
    [[w, d, 0], [w, d, h]],
    [[0, d, 0], [0, d, h]]
  ];
  
  edges.forEach(edge => {
    const points = [
      new THREE.Vector3(...edge[0]),
      new THREE.Vector3(...edge[1])
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, lineMaterial);
    scene.add(line);
  });
}

// Implementing a cache for visualizations
const packingVisCache = new Map();

