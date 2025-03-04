/* powder-calc-part3.js - Consolidated Three.js Visualization Functions */

/* ====================== THREE.JS FUNCTIONS ====================== */
/* Performance Optimizations */

// Enhanced version of initThreeJSViewer
function initThreeJSViewer(container) {
    perfMonitor.start('initViewer');
    
    // Create renderer with enhanced settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: window.devicePixelRatio < 1.5, // Use antialiasing only for lower-res displays
      powerPreference: 'high-performance',
      precision: 'mediump',
      alpha: true
    });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Limit pixel ratio
    
    // Check for dark mode and set background accordingly
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    renderer.setClearColor(isDarkMode ? 0x1e293b : 0xf0f2f5);
    container.appendChild(renderer.domElement);
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDarkMode ? 0x1e293b : 0xf0f2f5);
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(50, 50, 50);
    
    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(50, 50, 50);
    dirLight.castShadow = true;
    scene.add(dirLight);
    
    // Add a gentle hemisphere light for more pleasing visuals
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.3);
    scene.add(hemiLight);
    
    // Enhanced orbit controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.15;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI;
    controls.enableZoom = true;
    controls.zoomSpeed = 0.8;
    controls.rotateSpeed = 0.6;
    controls.autoRotate = false; // Start without auto-rotation
    controls.autoRotateSpeed = 1.0;
    
    // Add viewer controls
    setupViewerControls(container, scene, camera, controls, renderer);
    
    // Throttled resize handler
    let resizeTimeout;
    const onWindowResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        needsRender = true;
      }, 200);
    };
    
    const resizeObserver = new ResizeObserver(onWindowResize);
    resizeObserver.observe(container);
    
    // Enhanced animation loop with throttling and visibility detection
    let active = false;
    let needsRender = false;
    let animationFrameId;
    let lastRenderTime = 0;
    const FRAME_INTERVAL = 33; // Limit to 30fps
    
    function animate(time) {
      animationFrameId = requestAnimationFrame(animate);
      
      // Only render when visible in viewport
      if (!active) return;
      
      // Check if enough time has passed or if a render is needed
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
    
    // Listen for theme changes
    document.addEventListener('themeChanged', (e) => {
      const isDarkMode = e.detail.theme === 'dark';
      scene.background = new THREE.Color(isDarkMode ? 0x1e293b : 0xf0f2f5);
      needsRender = true;
    });
    
    // Enhanced cleanup
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
      
      // Remove all control buttons
      const controlButtons = container.querySelectorAll('.viewer-control-btn');
      controlButtons.forEach(btn => btn.remove());
      
      renderer.dispose();
    };
    
    perfMonitor.end('initViewer');
    return { renderer, scene, camera, controls, cleanup };
  }
  
  // Setup viewer controls
  function setupViewerControls(container, scene, camera, controls, renderer) {
    // Get control buttons
    const resetCameraBtn = container.querySelector('.reset-camera-btn');
    const toggleWireframeBtn = container.querySelector('.toggle-wireframe-btn');
    const takeScreenshotBtn = container.querySelector('.take-screenshot-btn');
    
    // Reset camera button
    if (resetCameraBtn) {
      resetCameraBtn.addEventListener('click', () => {
        gsap.to(camera.position, {
          x: 50,
          y: 50,
          z: 50,
          duration: 1,
          ease: "power2.inOut",
          onUpdate: function() {
            controls.update();
          }
        });
        
        // Reset controls
        controls.target.set(0, 0, 0);
        
        // Show notification
        if (typeof showNotification === 'function') {
          showNotification('Camera Reset', 'View has been reset to default.', 'info', 2000);
        }
      });
    }
    
    // Toggle wireframe button
    if (toggleWireframeBtn) {
      let wireframeEnabled = false;
      
      toggleWireframeBtn.addEventListener('click', () => {
        wireframeEnabled = !wireframeEnabled;
        
        // Update all materials in the scene
        scene.traverse(obj => {
          if (obj.isMesh && obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(material => {
                material.wireframe = wireframeEnabled;
              });
            } else {
              obj.material.wireframe = wireframeEnabled;
            }
          }
        });
        
        // Toggle button appearance
        if (wireframeEnabled) {
          toggleWireframeBtn.classList.add('active');
          toggleWireframeBtn.style.backgroundColor = 'var(--primary)';
          toggleWireframeBtn.style.color = 'white';
        } else {
          toggleWireframeBtn.classList.remove('active');
          toggleWireframeBtn.style.backgroundColor = '';
          toggleWireframeBtn.style.color = '';
        }
        
        // Show notification
        if (typeof showNotification === 'function') {
          showNotification(
            wireframeEnabled ? 'Wireframe Enabled' : 'Wireframe Disabled', 
            wireframeEnabled ? 'Model is now displayed in wireframe mode.' : 'Model is now displayed in solid mode.',
            'info',
            2000
          );
        }
      });
    }
    
    // Take screenshot button
    if (takeScreenshotBtn) {
      takeScreenshotBtn.addEventListener('click', () => {
        // Temporarily render at high resolution
        const originalPixelRatio = renderer.getPixelRatio();
        renderer.setPixelRatio(Math.max(window.devicePixelRatio, 2));
        renderer.render(scene, camera);
        
        try {
          // Get image data
          const dataURL = renderer.domElement.toDataURL('image/png');
          
          // Create download link
          const link = document.createElement('a');
          link.href = dataURL;
          link.download = `3d-model-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Show notification
          if (typeof showNotification === 'function') {
            showNotification(
              'Screenshot Taken', 
              'Your screenshot has been downloaded.',
              'success',
              3000
            );
          }
        } catch (error) {
          console.error('Error taking screenshot:', error);
          
          // Show error notification
          if (typeof showNotification === 'function') {
            showNotification(
              'Screenshot Failed', 
              'Could not capture screenshot. Check browser permissions.',
              'error',
              5000
            );
          }
        }
        
        // Reset pixel ratio
        renderer.setPixelRatio(originalPixelRatio);
        renderer.render(scene, camera);
      });
    }
    
    // Add auto-rotate toggle
    const autoRotateBtn = document.createElement('button');
    autoRotateBtn.classList.add('viewer-control-btn');
    autoRotateBtn.setAttribute('title', 'Toggle Auto-Rotate');
    autoRotateBtn.innerHTML = '<span class="material-icon">rotate_right</span>';
    
    // Insert before other controls
    const viewerControls = container.querySelector('.viewer-controls');
    if (viewerControls) {
      viewerControls.insertBefore(autoRotateBtn, viewerControls.firstChild);
      
      // Add event listener
      autoRotateBtn.addEventListener('click', () => {
        controls.autoRotate = !controls.autoRotate;
        
        // Toggle button appearance
        if (controls.autoRotate) {
          autoRotateBtn.classList.add('active');
          autoRotateBtn.style.backgroundColor = 'var(--primary)';
          autoRotateBtn.style.color = 'white';
        } else {
          autoRotateBtn.classList.remove('active');
          autoRotateBtn.style.backgroundColor = '';
          autoRotateBtn.style.color = '';
        }
      });
    }
  }
  
  // Enhanced version of displayGeometry that makes the STL object sit on the grid
  function displayGeometry(geometry, scene, camera, controls) {
    perfMonitor.start('displayModel');
  
    // Clone original geometry and clear existing meshes from the scene
    const originalGeometry = geometry.clone();
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
  
    // Create an enhanced material
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const material = new THREE.MeshPhysicalMaterial({
      color: isDarkMode ? 0x3b82f6 : 0x3a86ff,
      metalness: 0.1,
      roughness: 0.5,
      reflectivity: 0.2,
      clearcoat: 0.2,
      clearcoatRoughness: 0.3,
      flatShading: true
    });
  
    // Create the mesh
    const mesh = new THREE.Mesh(geometry, material);
  
    // Compute the original bounding box and size for orientation data
    originalGeometry.computeBoundingBox();
    const originalSize = new THREE.Vector3();
    originalGeometry.boundingBox.getSize(originalSize);
  
    // Store original data for future resets
    mesh.userData.originalGeometry = originalGeometry;
    mesh.userData.originalSize = originalSize.clone();
  
    // Determine optimal orientation (for example, flat or vertical)
    const orientationData = determineOptimalOrientation(
      originalSize.x, originalSize.y, originalSize.z
    );
  
    // Apply default "flat" orientation
    applyOrientation(mesh, originalSize, "flat");
  
    // Adjust the mesh so its lowest point is at y = 0
    mesh.geometry.computeBoundingBox();
    const bbox = mesh.geometry.boundingBox;
    const yOffset = bbox.min.y; // distance below y=0
    mesh.position.y -= yOffset;
  
    // Add the mesh to the scene
    scene.add(mesh);
  
    // Adjust camera position and target based on the new bounding box
    mesh.geometry.computeBoundingBox();
    const newBbox = mesh.geometry.boundingBox;
    const size = new THREE.Vector3();
    newBbox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = Math.max(maxDim * 1.5, 50);
  
    if (typeof gsap !== 'undefined') {
      gsap.to(camera.position, {
        x: distance,
        y: distance,
        z: distance,
        duration: 1.2,
        ease: "power2.inOut"
      });
      gsap.to(controls.target, {
        x: 0,
        y: size.y / 2,
        z: 0,
        duration: 1.2,
        ease: "power2.inOut",
        onUpdate: function() {
          controls.update();
        }
      });
    } else {
      camera.position.set(distance, distance, distance);
      controls.target.set(0, size.y / 2, 0);
      camera.lookAt(0, size.y / 2, 0);
      controls.update();
    }
  
    // Add grid for better spatial reference
    const gridSize = Math.max(maxDim * 2, 50);
    const gridDivisions = 20;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x3a86ff, 0xd1d5db);
    gridHelper.position.y = 0;  // Place grid at y = 0 (the floor)
    scene.add(gridHelper);
  
    // Save data in scene.userData for later use if needed
    scene.userData = {
      originalGeometry,
      originalSize,
      mesh,
      orientationData
    };
  
    perfMonitor.end('displayModel');
    return orientationData;
  }
  
  // Enhanced axis helpers
  function addEnhancedAxisHelpers(scene, size) {
    // Remove existing axis helpers
    scene.traverse(child => {
      if (child.isAxesHelper) {
        scene.remove(child);
      }
    });
    
    // Create enhanced axis helper
    const axesHelper = new THREE.AxesHelper(size);
    
    // Customize axis colors for better visibility
    const materials = axesHelper.material;
    if (Array.isArray(materials)) {
      materials[0].color.set(0xff4a4a); // X-axis (red)
      materials[1].color.set(0xff4a4a);
      materials[2].color.set(0x4aff4a); // Y-axis (green)
      materials[3].color.set(0x4aff4a);
      materials[4].color.set(0x4a4aff); // Z-axis (blue)
      materials[5].color.set(0x4a4aff);
    }
    
    scene.add(axesHelper);
    
    // Add axis labels for better understanding
    addAxisLabels(scene, size);
  }
  
  // Add axis labels
  function addAxisLabels(scene, size) {
    // Remove existing labels
    scene.traverse(child => {
      if (child.userData && child.userData.isAxisLabel) {
        scene.remove(child);
      }
    });
    
    // Function to create a text sprite
    function createTextSprite(text, position, color) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 128;
      canvas.height = 64;
      
      // Set background to transparent
      context.fillStyle = 'rgba(0, 0, 0, 0)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw text
      context.font = 'Bold 48px Arial';
      context.fillStyle = color;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, canvas.width / 2, canvas.height / 2);
      
      // Create texture
      const texture = new THREE.CanvasTexture(canvas);
      
      // Create sprite material
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true
      });
      
      // Create sprite
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(position);
      sprite.scale.set(5, 2.5, 1);
      sprite.userData.isAxisLabel = true;
      
      return sprite;
    }
    
    // Create labels
    const xLabel = createTextSprite('X', new THREE.Vector3(size + 2, 0, 0), '#ff4a4a');
    const yLabel = createTextSprite('Y', new THREE.Vector3(0, size + 2, 0), '#4aff4a');
    const zLabel = createTextSprite('Z', new THREE.Vector3(0, 0, size + 2), '#4a4aff');
    
    scene.add(xLabel);
    scene.add(yLabel);
    scene.add(zLabel);
  }
  
  // Add grid for better spatial reference
  function addGrid(scene, size) {
    // Remove existing grids
    scene.traverse(child => {
      if (child.isGridHelper) {
        scene.remove(child);
      }
    });
    
    // Create grid helper
    const gridSize = Math.ceil(size / 10) * 10; // Round to nearest 10
    const gridDivisions = 20;
    
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    
    const gridHelper = new THREE.GridHelper(
      gridSize, 
      gridDivisions,
      isDarkMode ? 0x4a4aff : 0x3a86ff, // Main lines
      isDarkMode ? 0x334155 : 0xd1d5db  // Secondary lines
    );
    
    // Rotate grid to XY plane (for better visualization of printer bed)
    gridHelper.rotation.x = 0;
    
    // Position grid at the bottom of the object
    gridHelper.position.set(0, 0, 0);
    
    scene.add(gridHelper);
    
    // Listen for theme changes
    document.addEventListener('themeChanged', (e) => {
      const isDark = e.detail.theme === 'dark';
      if (gridHelper) {
        // Update grid colors based on theme
        const mainColor = isDark ? 0x4a4aff : 0x3a86ff;
        const secondaryColor = isDark ? 0x334155 : 0xd1d5db;
        
        if (gridHelper.material && gridHelper.material.color) {
          gridHelper.material.color.set(mainColor);
        }
        
        if (gridHelper.material && gridHelper.material.colors) {
          gridHelper.material.colors = [
            new THREE.Color(mainColor),
            new THREE.Color(secondaryColor)
          ];
        }
      }
    });
  }
  
  // Enhanced version of changeOrientation
  function changeOrientation(scene, camera, controls, orientationType) {
    if (!scene.userData || !scene.userData.mesh) return null;
    
    const mesh = scene.userData.mesh;
    const originalSize = scene.userData.originalSize;
    const orientationData = scene.userData.orientationData;
    
    // Apply orientation with a visual transition
    const startRotation = new THREE.Euler().copy(mesh.rotation);
    const startPosition = new THREE.Vector3().copy(mesh.position);
    
    // Reset to original geometry and apply new orientation
    const newGeometry = applyOrientation(mesh, originalSize, orientationType);
    
    // Animate the transition if GSAP is available
    if (typeof gsap !== 'undefined') {
      gsap.from(mesh.rotation, {
        x: startRotation.x,
        y: startRotation.y,
        z: startRotation.z,
        duration: 0.8,
        ease: "power1.inOut"
      });
      
      gsap.from(mesh.position, {
        x: startPosition.x,
        y: startPosition.y,
        z: startPosition.z,
        duration: 0.8,
        ease: "power1.inOut"
      });
      
      // Adjust camera to focus on the reoriented object
      newGeometry.computeBoundingBox();
      const bbox = newGeometry.boundingBox;
      const size = new THREE.Vector3();
      bbox.getSize(size);
      
      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = Math.max(maxDim * 1.5, 50);
      
      // Position camera based on orientation
      if (orientationType === "vertical") {
        gsap.to(camera.position, {
          x: distance,
          y: distance,
          z: distance,
          duration: 0.8,
          ease: "power2.inOut"
        });
      } else {
        gsap.to(camera.position, {
          x: distance,
          y: distance,
          z: distance,
          duration: 0.8,
          ease: "power2.inOut"
        });
      }
      
      // Update controls target
      gsap.to(controls.target, {
        x: 0,
        y: 0,
        z: size.z / 2,
        duration: 0.8,
        ease: "power2.inOut",
        onUpdate: function() {
          controls.update();
        }
      });
    } else {
      // Fallback if GSAP isn't available
      camera.position.set(distance, distance, distance);
      controls.target.set(0, 0, size.z / 2);
      controls.update();
    }
    
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
  
  // Improved applyOrientation function that properly rotates without stretching
  function applyOrientation(mesh, originalSize, orientationType) {
    // Reset mesh transforms
    mesh.rotation.set(0, 0, 0);
    mesh.position.set(0, 0, 0);
    mesh.scale.set(1, 1, 1);
    mesh.updateMatrix();
  
    // Get a fresh copy of the original geometry
    const baseGeometry = mesh.userData.originalGeometry 
        ? mesh.userData.originalGeometry.clone() 
        : mesh.geometry.clone();
  
    // Determine original dimensions along each axis
    const dimensions = [
      { axis: 'x', value: originalSize.x },
      { axis: 'y', value: originalSize.y },
      { axis: 'z', value: originalSize.z }
    ];
    dimensions.sort((a, b) => b.value - a.value); // Sort descending
    const longestAxis = dimensions[0].axis;
  
    // Prepare a rotation matrix to change the orientation
    let rotMatrix = new THREE.Matrix4();
    if (orientationType === "vertical") {
      // Align longest dimension with Z-axis
      if (longestAxis === 'x') {
        rotMatrix.makeRotationY(-Math.PI / 2); // X to Z
      } else if (longestAxis === 'y') {
        rotMatrix.makeRotationX(Math.PI / 2); // Y to Z
      } else {
        rotMatrix.identity(); // Already along Z
      }
    } else { // "flat" orientation
      // Align shortest dimension with Z-axis
      if (longestAxis === 'z') {
        rotMatrix.makeRotationX(-Math.PI / 2); // Z to Y
      } else {
        rotMatrix.identity();
      }
    }
  
    // Apply the rotation to the geometry
    baseGeometry.applyMatrix4(rotMatrix);
    mesh.geometry.dispose();
    mesh.geometry = baseGeometry;
  
    // Center the mesh so its lowest point is at z = 0
    baseGeometry.computeBoundingBox();
    const bbox = baseGeometry.boundingBox;
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    mesh.position.set(-center.x, -center.y, -bbox.min.z);
  
    return baseGeometry;
  }
  
  // Determine the optimal orientation for an object
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
    
    // Vertical: longest dimension on Z
    if (maxDim.value <= printer600.height) {
      orientation.vertical.width = minDim.value;
      orientation.vertical.depth = midDim.value;
      orientation.vertical.height = maxDim.value;
      orientation.vertical.printTime = Math.ceil(maxDim.value / 0.1) * printer600.layerTime;
    } else {
      const scale = printer600.height / maxDim.value;
      orientation.vertical.width = minDim.value * scale;
      orientation.vertical.depth = midDim.value * scale;
      orientation.vertical.height = printer600.height;
      orientation.vertical.printTime = Math.ceil(printer600.height / 0.1) * printer600.layerTime;
    }
    
    // Flat: shortest dimension on Z
    orientation.flat.width = maxDim.value;
    orientation.flat.depth = midDim.value;
    orientation.flat.height = minDim.value;
    orientation.flat.printTime = Math.ceil(minDim.value / 0.1) * printer600.layerTime;
    
    // Default to flat
    orientation.width = orientation.flat.width;
    orientation.depth = orientation.flat.depth;
    orientation.height = orientation.flat.height;
    orientation.printTime = orientation.flat.printTime;
    orientation.type = "flat";
    
    return orientation;
  }
  
  // Load STL for packing
  async function loadSTLModelForPacking(stlData) {
    return new Promise((resolve, reject) => {
      try {
        if (!THREE.STLLoader) {
          console.error('THREE.STLLoader is not defined');
          throw new Error('STLLoader not loaded');
        }
        const loader = new THREE.STLLoader();
        const geometry = loader.parse(stlData);
        resolve(geometry);
      } catch (error) {
        console.error("Error loading STL for packing:", error);
        reject(error);
      }
    });
  }
  
  // Helper function to format time
  function formatPrintTime(seconds) {
    if (isNaN(seconds) || seconds === "N/A") return "N/A";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
  
  // Implementing a cache for visualizations
  const packingVisCache = new Map();
  
  // Export functions for use in other modules
  window.displayGeometry = displayGeometry;
  window.changeOrientation = changeOrientation;
  window.visualizePacking = visualizePacking;
  window.applyOrientation = applyOrientation;
  window.determineOptimalOrientation = determineOptimalOrientation;
  window.initThreeJSViewer = initThreeJSViewer;
  window.formatPrintTime = formatPrintTime;