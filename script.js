/**
 * Hotel Nice & Restaurant - 3D Interactive Web Application Logic
 * Powered by Three.js & Modern Web Technologies
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. MENU & CART DATABASE & STATE MANAGEMENT
  // ==========================================
  const menuItemsDatabase = [
    { id: 1, name: 'Special Punjabi Thali', category: 'thali', price: 280, desc: 'Dal Makhani, Shahi Paneer, Mix Veg, Rice, 3 Roti, Sweet, Salad', veg: true, icon: 'fa-utensils', tag: 'Bestseller' },
    { id: 2, name: 'Paneer Butter Masala', category: 'lunch', price: 240, desc: 'Rich cottage cheese in creamy tomato butter gravy', veg: true, icon: 'fa-bowl-food', tag: 'Chef Special' },
    { id: 3, name: 'Dal Makhani Special', category: 'lunch', price: 190, desc: 'Overnight simmered black lentils with cream & butter', veg: true, icon: 'fa-fire-burner', tag: 'Popular' },
    { id: 4, name: 'Butter Naan / Tandoori Roti', category: 'lunch', price: 40, desc: 'Freshly baked in traditional clay oven', veg: true, icon: 'fa-bread-slice', tag: 'Fresh Baked' },
    { id: 5, name: 'Aloo Stuffed Paratha Combo', category: 'breakfast', price: 120, desc: '2 Crispy Parathas with fresh butter, curd & pickle', veg: true, icon: 'fa-sun', tag: 'Breakfast' },
    { id: 6, name: 'Chole Bhature', category: 'breakfast', price: 140, desc: 'Spicy chickpeas served with fluffy golden bhaturas', veg: true, icon: 'fa-hotdog', tag: 'Bestseller' },
    { id: 7, name: 'Masala Dosa with Sambhar', category: 'breakfast', price: 150, desc: 'Crispy rice crepe with potato filling & chutneys', veg: true, icon: 'fa-plate-wheat', tag: 'South Special' },
    { id: 8, name: 'Fresh Mango Lassi / Sweet Lassi', category: 'beverages', price: 80, desc: 'Traditional rich & creamy Punjabi lassi', veg: true, icon: 'fa-glass-water-droplet', tag: 'Cold Drink' },
    { id: 9, name: 'Cold Coffee with Ice Cream', category: 'beverages', price: 110, desc: 'Rich blended coffee topped with chocolate scoop', veg: true, icon: 'fa-mug-hot', tag: 'Special' },
    { id: 10, name: 'Gulab Jamun (2 Pcs)', category: 'lunch', price: 70, desc: 'Warm golden milk dumplings in cardamom syrup', veg: true, icon: 'fa-cookie', tag: 'Dessert' }
  ];

  let cart = [];
  let orderHistory = JSON.parse(localStorage.getItem('hnr_order_history') || '[]');
  let currentServiceType = 'Food & Dining Service';
  let activeInvoiceOrder = null;

  // ==========================================
  // 2. THREE.JS 3D HOTEL LAYOUT INITIALIZATION
  // ==========================================
  const container = document.getElementById('canvas-container');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080b12);
  scene.fog = new THREE.FogExp2(0x080b12, 0.015);

  const getAspect = () => (container.clientWidth || window.innerWidth) / (container.clientHeight || 500);
  const camera = new THREE.PerspectiveCamera(45, getAspect(), 0.1, 1000);
  
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || 500);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.minDistance = 5;
  controls.maxDistance = 50;

  // Camera Presets
  const cameraPresets = {
    overview: { pos: new THREE.Vector3(22, 20, 24), target: new THREE.Vector3(0, 0, 0) },
    reception: { pos: new THREE.Vector3(-10, 8, 12), target: new THREE.Vector3(-10, 1, 0) },
    rooms: { pos: new THREE.Vector3(-10, 10, -12), target: new THREE.Vector3(-10, 1, -10) },
    restaurant: { pos: new THREE.Vector3(12, 8, 12), target: new THREE.Vector3(10, 1, 4) },
    events: { pos: new THREE.Vector3(12, 10, -12), target: new THREE.Vector3(10, 1, -10) }
  };

  camera.position.copy(cameraPresets.overview.pos);
  controls.target.copy(cameraPresets.overview.target);
  controls.update();

  // Lighting setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
  dirLight.position.set(20, 40, 20);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 100;
  dirLight.shadow.camera.left = -25;
  dirLight.shadow.camera.right = 25;
  dirLight.shadow.camera.top = 25;
  dirLight.shadow.camera.bottom = -25;
  scene.add(dirLight);

  function createSpotlight(x, y, z, color = 0xffaa44, intensity = 1.5) {
    const spot = new THREE.SpotLight(color, intensity, 25, Math.PI / 4, 0.5, 1);
    spot.position.set(x, y, z);
    spot.target.position.set(x, 0, z);
    scene.add(spot);
    scene.add(spot.target);
  }

  createSpotlight(-10, 8, 0); // Reception
  createSpotlight(-10, 8, -10); // AC Rooms
  createSpotlight(10, 8, 4); // Dining Area
  createSpotlight(10, 8, -10, 0xff2a75, 2.5); // Event Stage

  const interactiveObjects = [];

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.4 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x2b1810, roughness: 0.3 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a2332, roughness: 0.8 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x111622, roughness: 0.2, metalness: 0.1 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 });
  const pinkMat = new THREE.MeshStandardMaterial({ color: 0xff2a75, roughness: 0.5, emissive: 0x330011 });

  // ==========================================
  // 3. BUILD 3D HOTEL LAYOUT & SCENE OBJECTS
  // ==========================================

  // Ground Slab Floor
  const groundGeo = new THREE.BoxGeometry(44, 0.4, 40);
  const ground = new THREE.Mesh(groundGeo, floorMat);
  ground.position.y = -0.2;
  ground.receiveShadow = true;
  scene.add(ground);

  const inlayGeo = new THREE.BoxGeometry(44, 0.05, 0.2);
  const inlay1 = new THREE.Mesh(inlayGeo, goldMat);
  inlay1.position.set(0, 0.02, 0);
  scene.add(inlay1);

  const inlay2Geo = new THREE.BoxGeometry(0.2, 0.05, 40);
  const inlay2 = new THREE.Mesh(inlay2Geo, goldMat);
  inlay2.position.set(0, 0.02, 0);
  scene.add(inlay2);

  function createWall(x, z, w, d, h = 3) {
    const wallGeo = new THREE.BoxGeometry(w, h, d);
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(x, h / 2, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    return wall;
  }

  createWall(0, -20, 44, 0.6, 2.5);
  createWall(-22, 0, 0.6, 40, 2.5);
  createWall(22, 0, 0.6, 40, 2.5);
  createWall(-11, 20, 22, 0.6, 1.2);
  createWall(11, 20, 22, 0.6, 1.2);

  // ZONE 1: RECEPTION LOBBY
  function buildReceptionLobby() {
    const group = new THREE.Group();

    const deskGeo = new THREE.BoxGeometry(6, 1.2, 1.5);
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x1f293d, roughness: 0.3 });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(-10, 0.6, 5);
    desk.castShadow = true;
    group.add(desk);

    const logoTexture = new THREE.TextureLoader().load('logo.jpg');
    const logoMeshMat = new THREE.MeshStandardMaterial({ map: logoTexture, roughness: 0.3 });

    const logoFront = new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, 0.1), logoMeshMat);
    logoFront.position.set(-10, 0.8, 5.8);
    group.add(logoFront);

    const wallPlaque = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 2.8), logoMeshMat);
    wallPlaque.position.set(-10, 2.5, 0.3);
    group.add(wallPlaque);

    const laptop = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.6), goldMat);
    laptop.position.set(-9.5, 1.25, 5);
    group.add(laptop);

    const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.6, 1.6), pinkMat);
    sofaBase.position.set(-14, 0.3, 12);
    sofaBase.castShadow = true;
    group.add(sofaBase);

    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.2, 0.5), pinkMat);
    sofaBack.position.set(-14, 0.8, 11.2);
    group.add(sofaBack);

    const table = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.5, 16), darkWoodMat);
    table.position.set(-14, 0.25, 14.2);
    table.castShadow = true;
    group.add(table);

    desk.userData = { title: 'Reception Lobby Desk', type: 'reception', action: 'info' };
    interactiveObjects.push(desk);

    scene.add(group);
  }

  // ZONE 2: AC FAMILY ROOMS
  function buildACRooms() {
    const group = new THREE.Group();

    function buildBed(x, z, label, price) {
      const bedGroup = new THREE.Group();

      const frame = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.6, 4.2), darkWoodMat);
      frame.position.set(x, 0.3, z);
      frame.castShadow = true;
      bedGroup.add(frame);

      const mattressMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
      const mattress = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4, 3.9), mattressMat);
      mattress.position.set(x, 0.7, z);
      bedGroup.add(mattress);

      const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 0.8), mattressMat);
      pillow.position.set(x - 0.8, 0.95, z - 1.4);
      const pillow2 = pillow.clone();
      pillow2.position.x = x + 0.8;
      bedGroup.add(pillow);
      bedGroup.add(pillow2);

      const headboard = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.8, 0.3), woodMat);
      headboard.position.set(x, 0.9, z - 2);
      bedGroup.add(headboard);

      const sideTable = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), darkWoodMat);
      sideTable.position.set(x - 2.2, 0.4, z - 1.8);
      bedGroup.add(sideTable);

      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.6, 8), goldMat);
      lamp.position.set(x - 2.2, 1.1, z - 1.8);
      bedGroup.add(lamp);

      mattress.userData = { title: label, type: 'room', price: price, action: 'book' };
      interactiveObjects.push(mattress);

      return bedGroup;
    }

    group.add(buildBed(-14, -8, 'Deluxe AC Room (101)', 1499));
    group.add(buildBed(-6, -8, 'Super Deluxe AC Suite (102)', 2499));

    createWall(-10, -14, 18, 0.4, 2.5);
    createWall(-10, -5, 18, 0.4, 2.5);

    scene.add(group);
  }

  // ZONE 3: RESTAURANT & DINING AREA
  function buildRestaurantArea() {
    const group = new THREE.Group();

    function buildDiningTable(x, z, tableId) {
      const tableGroup = new THREE.Group();

      const topGeo = new THREE.CylinderGeometry(1.8, 1.8, 0.15, 16);
      const tableTop = new THREE.Mesh(topGeo, darkWoodMat);
      tableTop.position.set(x, 1.1, z);
      tableTop.castShadow = true;
      tableGroup.add(tableTop);

      const legGeo = new THREE.CylinderGeometry(0.15, 0.3, 1.1, 8);
      const leg = new THREE.Mesh(legGeo, goldMat);
      leg.position.set(x, 0.55, z);
      tableGroup.add(leg);

      const chairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
      const chairPositions = [
        { offset: [0, 2] }, { offset: [0, -2] },
        { offset: [2, 0] }, { offset: [-2, 0] }
      ];

      chairPositions.forEach(pos => {
        const chair = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), chairMat);
        chair.position.set(x + pos.offset[0], 0.4, z + pos.offset[1]);
        chair.castShadow = true;
        tableGroup.add(chair);
      });

      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.4, 8), goldMat);
      candle.position.set(x, 1.3, z);
      tableGroup.add(candle);

      tableTop.userData = { title: `Dining Table #${tableId}`, type: 'restaurant', action: 'menu' };
      interactiveObjects.push(tableTop);

      return tableGroup;
    }

    group.add(buildDiningTable(6, 6, 1));
    group.add(buildDiningTable(15, 6, 2));
    group.add(buildDiningTable(6, 14, 3));
    group.add(buildDiningTable(15, 14, 4));

    scene.add(group);
  }

  // ZONE 4: PARTY & EVENT HALL STAGE
  function buildEventStage() {
    const group = new THREE.Group();

    const stageGeo = new THREE.BoxGeometry(16, 0.6, 10);
    const stageMat = new THREE.MeshStandardMaterial({ color: 0x1f152b, roughness: 0.4 });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.set(11, 0.3, -11);
    stage.receiveShadow = true;
    group.add(stage);

    const backdropGeo = new THREE.BoxGeometry(15.8, 4.5, 0.3);
    const backdropMat = new THREE.MeshStandardMaterial({ color: 0x8a2be2, roughness: 0.6 });
    const backdrop = new THREE.Mesh(backdropGeo, backdropMat);
    backdrop.position.set(11, 2.5, -15.8);
    group.add(backdrop);

    const stageLogoTexture = new THREE.TextureLoader().load('logo.jpg');
    const stageLogoMat = new THREE.MeshStandardMaterial({ map: stageLogoTexture, roughness: 0.3 });
    const bannerFrame = new THREE.Mesh(new THREE.BoxGeometry(6, 3.2, 0.1), stageLogoMat);
    bannerFrame.position.set(11, 2.8, -15.6);
    group.add(bannerFrame);

    const lightBar = new THREE.Mesh(new THREE.BoxGeometry(12, 0.2, 0.4), goldMat);
    lightBar.position.set(11, 4.8, -15.6);
    group.add(lightBar);

    stage.userData = { title: 'Special Event & Party Stage', type: 'events', action: 'event' };
    interactiveObjects.push(stage);

    scene.add(group);
  }

  buildReceptionLobby();
  buildACRooms();
  buildRestaurantArea();
  buildEventStage();

  // ==========================================
  // 4. RAYCASTING INTERACTION & TOOLTIPS
  // ==========================================
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const tooltipBanner = document.getElementById('tooltip-banner');
  const tooltipText = document.getElementById('tooltip-text');

  let hoveredObject = null;

  container.addEventListener('mousemove', (event) => {
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveObjects);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (hoveredObject !== hit) {
        hoveredObject = hit;
        document.body.style.cursor = 'pointer';
        tooltipText.innerHTML = `<strong>${hit.userData.title}</strong> — Click to interact`;
        tooltipBanner.classList.add('show');
      }
    } else {
      if (hoveredObject) {
        hoveredObject = null;
        document.body.style.cursor = 'default';
        tooltipBanner.classList.remove('show');
      }
    }
  });

  container.addEventListener('click', () => {
    if (hoveredObject && hoveredObject.userData) {
      const data = hoveredObject.userData;
      showToast(`Selected: ${data.title}`);

      if (data.type === 'room') {
        openModal('room-modal-overlay');
      } else if (data.type === 'restaurant') {
        openDrawer('menu-drawer');
      } else if (data.type === 'events') {
        openModal('event-modal-overlay');
      }
    }
  });

  let targetCamPos = null;
  let targetCamTarget = null;

  function animateCameraTo(presetName) {
    const preset = cameraPresets[presetName];
    if (preset) {
      targetCamPos = preset.pos.clone();
      targetCamTarget = preset.target.clone();
    }
  }

  // ==========================================
  // 5. RENDER LOOP & RESIZE HANDLING
  // ==========================================
  function animate() {
    requestAnimationFrame(animate);

    if (targetCamPos && targetCamTarget) {
      camera.position.lerp(targetCamPos, 0.05);
      controls.target.lerp(targetCamTarget, 0.05);

      if (camera.position.distanceTo(targetCamPos) < 0.1) {
        targetCamPos = null;
        targetCamTarget = null;
      }
    }

    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  function updateCanvasSize() {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 500;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  window.addEventListener('resize', updateCanvasSize);
  setTimeout(updateCanvasSize, 200);

  // ==========================================
  // 6. UI INTERACTION, MODAL & DRAWER LOGIC
  // ==========================================

  function showToast(msg) {
    const toast = document.getElementById('toast-notification');
    document.getElementById('toast-message').innerText = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  function openModal(id) {
    document.getElementById(id).classList.add('active');
  }

  function closeModal(id) {
    document.getElementById(id).classList.remove('active');
  }

  function openDrawer(id) {
    document.getElementById(id).classList.add('active');
    document.getElementById(id + '-overlay').classList.add('active');
  }

  function closeDrawer(id) {
    document.getElementById(id).classList.remove('active');
    document.getElementById(id + '-overlay').classList.remove('active');
  }

  // HUD View Switcher Buttons (for camera views)
  const hudButtons = document.querySelectorAll('.hud-btn[data-view]');
  hudButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      hudButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.getAttribute('data-view');
      animateCameraTo(view);
    });
  });

  // Smooth Scroll Navigation Helpers
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  // 3D Canvas Navigation & Return Controls (Up & Down)
  const btn3dComeUp = document.getElementById('btn-3d-come-up');
  if (btn3dComeUp) {
    btn3dComeUp.addEventListener('click', () => {
      scrollToTop();
      showToast('Returned to Top');
    });
  }

  const btn3dGoBottom = document.getElementById('btn-3d-go-bottom');
  if (btn3dGoBottom) {
    btn3dGoBottom.addEventListener('click', () => {
      scrollToBottom();
      showToast('Scrolled to Bottom');
    });
  }

  const btnToolScrollUp = document.getElementById('btn-tool-scroll-up');
  if (btnToolScrollUp) {
    btnToolScrollUp.addEventListener('click', () => {
      scrollToTop();
      showToast('Returned to Top');
    });
  }

  const btnToolScrollDown = document.getElementById('btn-tool-scroll-down');
  if (btnToolScrollDown) {
    btnToolScrollDown.addEventListener('click', () => {
      scrollToBottom();
      showToast('Scrolled to Bottom');
    });
  }

  const hudBtnComeUp = document.getElementById('hud-btn-come-up');
  if (hudBtnComeUp) {
    hudBtnComeUp.addEventListener('click', () => {
      scrollToTop();
      showToast('Returned to Top');
    });
  }

  const hudBtnGoBottom = document.getElementById('hud-btn-go-bottom');
  if (hudBtnGoBottom) {
    hudBtnGoBottom.addEventListener('click', () => {
      scrollToBottom();
      showToast('Scrolled to Bottom');
    });
  }

  // Floating Action Navigation (Top & Bottom Buttons)
  const floatingTopBtn = document.getElementById('btn-floating-top');
  const floatingBottomBtn = document.getElementById('btn-floating-bottom');

  if (floatingTopBtn) floatingTopBtn.addEventListener('click', scrollToTop);
  if (floatingBottomBtn) floatingBottomBtn.addEventListener('click', scrollToBottom);

  window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY;
    if (scrollPos > 260) {
      if (floatingTopBtn) floatingTopBtn.classList.add('visible');
      if (floatingBottomBtn) floatingBottomBtn.classList.add('visible');
    } else {
      if (floatingTopBtn) floatingTopBtn.classList.remove('visible');
      if (floatingBottomBtn) floatingBottomBtn.classList.remove('visible');
    }
  });

  // Footer Back-to-Top Button
  const btnFooterTop = document.getElementById('btn-footer-back-to-top');
  if (btnFooterTop) {
    btnFooterTop.addEventListener('click', scrollToTop);
  }

  // Footer Quick Action Links (Modals & Drawers)
  const footerLinkRooms = document.getElementById('footer-link-rooms');
  if (footerLinkRooms) footerLinkRooms.addEventListener('click', () => openModal('room-modal-overlay'));

  const footerLinkEvents = document.getElementById('footer-link-events');
  if (footerLinkEvents) footerLinkEvents.addEventListener('click', () => openModal('event-modal-overlay'));

  const footerLinkMenu = document.getElementById('footer-link-menu');
  if (footerLinkMenu) footerLinkMenu.addEventListener('click', () => openDrawer('menu-drawer'));

  const footerLinkCart = document.getElementById('footer-link-cart');
  if (footerLinkCart) footerLinkCart.addEventListener('click', () => openDrawer('cart-drawer'));

  const footerLinkHistory = document.getElementById('footer-link-history');
  if (footerLinkHistory) footerLinkHistory.addEventListener('click', () => openDrawer('history-drawer'));

  // Header Button Handlers
  document.getElementById('btn-open-rooms').addEventListener('click', () => openModal('room-modal-overlay'));
  document.getElementById('btn-open-events').addEventListener('click', () => openModal('event-modal-overlay'));
  document.getElementById('btn-open-menu').addEventListener('click', () => openDrawer('menu-drawer'));
  document.getElementById('btn-open-cart').addEventListener('click', () => openDrawer('cart-drawer'));
  document.getElementById('btn-open-history').addEventListener('click', () => openDrawer('history-drawer'));

  // Home Page Section Button Handlers
  document.getElementById('btn-home-book-room').addEventListener('click', () => openModal('room-modal-overlay'));
  document.getElementById('btn-home-book-event').addEventListener('click', () => openModal('event-modal-overlay'));
  document.getElementById('btn-home-checkout').addEventListener('click', () => openDrawer('cart-drawer'));

  // Close Drawers
  document.getElementById('btn-close-drawer').addEventListener('click', () => closeDrawer('menu-drawer'));
  document.getElementById('menu-drawer-overlay').addEventListener('click', () => closeDrawer('menu-drawer'));
  document.getElementById('btn-close-cart-drawer').addEventListener('click', () => closeDrawer('cart-drawer'));
  document.getElementById('cart-drawer-overlay').addEventListener('click', () => closeDrawer('cart-drawer'));
  document.getElementById('btn-close-history-drawer').addEventListener('click', () => closeDrawer('history-drawer'));
  document.getElementById('history-drawer-overlay').addEventListener('click', () => closeDrawer('history-drawer'));

  // Close Modals
  document.getElementById('btn-close-room-modal').addEventListener('click', () => closeModal('room-modal-overlay'));
  document.getElementById('btn-cancel-room').addEventListener('click', () => closeModal('room-modal-overlay'));
  
  document.getElementById('btn-close-event-modal').addEventListener('click', () => closeModal('event-modal-overlay'));
  document.getElementById('btn-cancel-event').addEventListener('click', () => closeModal('event-modal-overlay'));
  
  document.getElementById('btn-close-payment-modal').addEventListener('click', () => closeModal('payment-modal-overlay'));
  document.getElementById('btn-cancel-pay').addEventListener('click', () => closeModal('payment-modal-overlay'));
  
  document.getElementById('btn-close-invoice-modal').addEventListener('click', () => closeModal('invoice-modal-overlay'));

  // Lighting Toggle
  let isNight = true;
  document.getElementById('btn-toggle-light').addEventListener('click', () => {
    isNight = !isNight;
    const btn = document.getElementById('btn-toggle-light');
    if (isNight) {
      scene.background.setHex(0x080b12);
      scene.fog.color.setHex(0x080b12);
      dirLight.intensity = 1.2;
      btn.innerHTML = '<i class="fa-solid fa-moon"></i>';
      showToast('Switched to Night Ambience');
    } else {
      scene.background.setHex(0x87ceeb);
      scene.fog.color.setHex(0x87ceeb);
      dirLight.intensity = 2.2;
      btn.innerHTML = '<i class="fa-solid fa-sun"></i>';
      showToast('Switched to Day Ambience');
    }
  });

  document.getElementById('btn-toggle-reset').addEventListener('click', () => {
    animateCameraTo('overview');
  });

  // ==========================================
  // 7. BEST FOOD ORDER HOME SECTION RENDERING
  // ==========================================

  function renderHomeFoodGrid(category = 'all') {
    const grid = document.getElementById('home-food-grid');
    grid.innerHTML = '';

    const filtered = category === 'all' 
      ? menuItemsDatabase 
      : menuItemsDatabase.filter(item => item.category === category);

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'home-food-card';
      card.innerHTML = `
        <div class="food-card-tag"><i class="fa-solid fa-fire"></i> ${item.tag}</div>
        <div class="food-card-header">
          <div class="food-icon-box">
            <i class="fa-solid ${item.icon}"></i>
          </div>
          <div>
            <div class="food-card-title">
              <span class="veg-icon"></span> ${item.name}
            </div>
            <div class="food-card-desc">${item.desc}</div>
          </div>
        </div>
        <div class="food-card-footer">
          <div class="food-card-price">₹${item.price}</div>
          <button class="btn-quick-add" data-id="${item.id}">
            <i class="fa-solid fa-plus"></i> Add to Cart
          </button>
        </div>
      `;
      grid.appendChild(card);
    });

    // Attach click events for quick add buttons
    grid.querySelectorAll('.btn-quick-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.getAttribute('data-id'));
        addToCart(id);
      });
    });
  }

  // Home Category Tabs Switcher
  document.querySelectorAll('#home-category-tabs .tab-btn').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('#home-category-tabs .tab-btn').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      renderHomeFoodGrid(e.target.getAttribute('data-cat'));
    });
  });

  // Render initial home food grid
  renderHomeFoodGrid('all');

  // ==========================================
  // 8. FOOD MENU & CART RENDERING LOGIC
  // ==========================================

  function renderMenu(category = 'all') {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = '';

    const filtered = category === 'all' 
      ? menuItemsDatabase 
      : menuItemsDatabase.filter(item => item.category === category);

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'menu-card';
      card.innerHTML = `
        <div class="menu-info">
          <h4>${item.veg ? '<span class="veg-icon"></span>' : ''} ${item.name}</h4>
          <p>${item.desc}</p>
          <div class="menu-price">₹${item.price}</div>
        </div>
        <button class="btn-add-item" data-id="${item.id}">+ Add</button>
      `;
      grid.appendChild(card);
    });

    document.querySelectorAll('#menu-grid .btn-add-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        addToCart(id);
      });
    });
  }

  function addToCart(itemId) {
    const item = menuItemsDatabase.find(i => i.id === itemId);
    if (!item) return;

    const existing = cart.find(c => c.id === itemId);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...item, qty: 1 });
    }

    updateCartUI();
    showToast(`Added ${item.name} to Cart`);
  }

  function updateCartUI() {
    const countBadge = document.getElementById('cart-count');
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    countBadge.innerText = totalQty;

    const container = document.getElementById('cart-items-container');
    container.innerHTML = '';

    let subtotal = 0;

    if (cart.length === 0) {
      container.innerHTML = '<p style="color: var(--color-text-muted); text-align: center; padding: 20px;">Your cart is currently empty.</p>';
    } else {
      cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;

        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
          <div>
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-price">₹${item.price} × ${item.qty} = ₹${itemTotal}</div>
          </div>
          <div class="quantity-controls">
            <button class="qty-btn btn-dec" data-id="${item.id}">-</button>
            <span>${item.qty}</span>
            <button class="qty-btn btn-inc" data-id="${item.id}">+</button>
          </div>
        `;
        container.appendChild(row);
      });
    }

    const tax = Math.round(subtotal * 0.05);
    const grandTotal = subtotal + tax;

    document.getElementById('cart-subtotal').innerText = `₹${subtotal}`;
    document.getElementById('cart-tax').innerText = `₹${tax}`;
    document.getElementById('cart-grand-total').innerText = `₹${grandTotal}`;
    document.getElementById('drawer-total-price').innerText = `₹${grandTotal}`;

    // Update Home Section Quick Summary Callout Bar
    document.getElementById('callout-item-count').innerText = `${totalQty} item(s)`;
    document.getElementById('callout-total-price').innerText = `₹${grandTotal}`;

    // Attach quantity click listeners
    document.querySelectorAll('.btn-dec').forEach(b => {
      b.addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        const item = cart.find(c => c.id === id);
        if (item) {
          item.qty -= 1;
          if (item.qty <= 0) {
            cart = cart.filter(c => c.id !== id);
          }
          updateCartUI();
        }
      });
    });

    document.querySelectorAll('.btn-inc').forEach(b => {
      b.addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        const item = cart.find(c => c.id === id);
        if (item) {
          item.qty += 1;
          updateCartUI();
        }
      });
    });
  }

  // Category Tab Click inside Side Drawer
  document.querySelectorAll('#category-tabs .tab-btn').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('#category-tabs .tab-btn').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      renderMenu(e.target.getAttribute('data-cat'));
    });
  });

  renderMenu('all');

  document.getElementById('btn-go-to-checkout').addEventListener('click', () => {
    closeDrawer('menu-drawer');
    openDrawer('cart-drawer');
  });

  document.getElementById('btn-proceed-payment').addEventListener('click', () => {
    if (cart.length === 0) {
      showToast('Your cart is empty! Please add food items first.');
      return;
    }
    currentServiceType = document.getElementById('dining-location-select').value;
    closeDrawer('cart-drawer');
    openModal('payment-modal-overlay');
  });

  // ==========================================
  // 9. YOUR ORDERS (ORDER HISTORY MANAGEMENT)
  // ==========================================

  function saveOrderToHistory(orderData) {
    orderHistory.unshift(orderData);
    localStorage.setItem('hnr_order_history', JSON.stringify(orderHistory));
    renderOrderHistoryUI();
  }

  function renderOrderHistoryUI() {
    const container = document.getElementById('history-items-container');
    const badge = document.getElementById('history-count');
    container.innerHTML = '';

    badge.innerText = orderHistory.length;
    badge.style.display = orderHistory.length > 0 ? 'flex' : 'none';

    if (orderHistory.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px 10px; color: var(--color-text-muted);">
          <i class="fa-solid fa-receipt" style="font-size: 2.5rem; margin-bottom: 12px; opacity: 0.5;"></i>
          <p>No previous orders found.</p>
          <small>Orders you place will automatically be saved here!</small>
        </div>
      `;
      return;
    }

    orderHistory.forEach(order => {
      const itemsSummary = order.items.map(i => `${i.qty}× ${i.name}`).join(', ');

      const card = document.createElement('div');
      card.className = 'history-card';
      card.innerHTML = `
        <div class="history-card-header">
          <span class="history-order-id">${order.id}</span>
          <span class="history-status-badge"><i class="fa-solid fa-circle-check"></i> ${order.status || 'CONFIRMED'}</span>
        </div>
        <div class="history-date"><i class="fa-regular fa-clock"></i> ${order.date}</div>
        <div class="history-location"><i class="fa-solid fa-location-arrow"></i> ${order.serviceType}</div>
        <div class="history-items">${itemsSummary}</div>
        <div class="history-footer">
          <span class="history-total">Total: ₹${order.total}</span>
          <button class="btn-view-invoice" data-order-id="${order.id}">
            <i class="fa-solid fa-file-invoice"></i> View Invoice
          </button>
        </div>
      `;
      container.appendChild(card);
    });

    // Attach Invoice View Event Listeners
    container.querySelectorAll('.btn-view-invoice').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const orderId = e.currentTarget.getAttribute('data-order-id');
        const found = orderHistory.find(o => o.id === orderId);
        if (found) {
          activeInvoiceOrder = found;
          showInvoiceForOrder(found);
          closeDrawer('history-drawer');
          openModal('invoice-modal-overlay');
        }
      });
    });
  }

  document.getElementById('btn-clear-history').addEventListener('click', () => {
    if (orderHistory.length === 0) return;
    if (confirm('Are you sure you want to clear your order history?')) {
      orderHistory = [];
      localStorage.removeItem('hnr_order_history');
      renderOrderHistoryUI();
      showToast('Order history cleared.');
    }
  });

  renderOrderHistoryUI();

  // ==========================================
  // 10. ROOM BOOKING & EVENT FORM LOGIC
  // ==========================================
  let selectedRoom = { type: 'Deluxe AC Room', price: 1499 };

  document.querySelectorAll('.room-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.room-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedRoom.type = card.getAttribute('data-room-type');
      selectedRoom.price = parseInt(card.getAttribute('data-price'));
    });
  });

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('room-checkin').value = today;
  document.getElementById('event-date').value = today;

  document.getElementById('btn-confirm-room-pay').addEventListener('click', (e) => {
    e.preventDefault();
    const guestName = document.getElementById('guest-name').value;
    const guestPhone = document.getElementById('guest-phone').value;
    const nights = parseInt(document.getElementById('room-nights').value) || 1;

    if (!guestName || !guestPhone) {
      showToast('Please fill in your Name and Mobile Number.');
      return;
    }

    currentServiceType = `AC Room Booking (${selectedRoom.type} - ${nights} Night(s))`;

    cart = [
      { id: 999, name: `${selectedRoom.type} (${nights} Night)`, price: selectedRoom.price, qty: nights }
    ];
    updateCartUI();

    closeModal('room-modal-overlay');
    openModal('payment-modal-overlay');
  });

  document.getElementById('btn-submit-event').addEventListener('click', (e) => {
    e.preventDefault();
    const eventType = document.getElementById('event-type').value;
    const guests = document.getElementById('event-guests').value;
    const contact = document.getElementById('event-contact').value;

    if (!guests || !contact) {
      showToast('Please enter guest count and contact info.');
      return;
    }

    closeModal('event-modal-overlay');
    showToast(`Inquiry Received for ${eventType}! Our manager will call you at ${contact}.`);
  });

  // ==========================================
  // 11. PAYMENT GATEWAY & INVOICE GENERATOR
  // ==========================================

  const payTabs = document.querySelectorAll('.pay-tab');
  payTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      payTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetTab = tab.getAttribute('data-tab');
      document.querySelectorAll('.pay-content').forEach(c => c.style.display = 'none');
      document.getElementById('pay-content-' + targetTab).style.display = 'block';
    });
  });

  const cardNumInput = document.getElementById('card-num-input');
  cardNumInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    val = val.replace(/(.{4})/g, '$1 ').trim();
    e.target.value = val;
    document.getElementById('disp-card-num').innerText = val || '•••• •••• •••• ••••';
  });

  const cardExpInput = document.getElementById('card-exp-input');
  cardExpInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2);
    }
    e.target.value = val;
    document.getElementById('disp-card-exp').innerText = val || 'MM/YY';
  });

  // Complete Payment Action
  document.getElementById('btn-complete-payment').addEventListener('click', () => {
    showToast('Processing Payment...');

    setTimeout(() => {
      closeModal('payment-modal-overlay');

      const newOrder = generateInvoice();
      saveOrderToHistory(newOrder);

      // Reset Cart after checkout
      cart = [];
      updateCartUI();

      openModal('invoice-modal-overlay');
      showToast('Payment Successful! Order Placed.');
    }, 1200);
  });

  function generateInvoice() {
    const orderId = '#HNR-' + Math.floor(10000 + Math.random() * 90000);
    const dateStr = new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const guestName = document.getElementById('guest-name').value || 'Valued Guest';

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = Math.round(subtotal * 0.05);
    const grandTotal = subtotal + tax;

    const orderRecord = {
      id: orderId,
      date: dateStr,
      guestName: guestName,
      serviceType: currentServiceType,
      items: [...cart],
      subtotal: subtotal,
      tax: tax,
      total: grandTotal,
      status: 'CONFIRMED'
    };

    showInvoiceForOrder(orderRecord);
    return orderRecord;
  }

  function showInvoiceForOrder(orderRecord) {
    document.getElementById('inv-order-id').innerText = orderRecord.id;
    document.getElementById('inv-date').innerText = `Date: ${orderRecord.date}`;
    document.getElementById('inv-cust-name').innerText = orderRecord.guestName || 'Valued Guest';
    document.getElementById('inv-service-type').innerText = orderRecord.serviceType;

    const tbody = document.getElementById('inv-items-body');
    tbody.innerHTML = '';

    orderRecord.items.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.name}</td>
        <td>${item.qty}</td>
        <td>₹${item.price}</td>
        <td>₹${item.price * item.qty}</td>
      `;
      tbody.appendChild(row);
    });

    document.getElementById('inv-total-paid').innerText = `₹${orderRecord.total}`;
  }

  // Invoice Actions
  document.getElementById('btn-print-invoice').addEventListener('click', () => {
    window.print();
  });

  document.getElementById('btn-finish-all').addEventListener('click', () => {
    closeModal('invoice-modal-overlay');
  });

});
