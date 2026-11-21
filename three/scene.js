/* Candidate 3 — three.js scene. Everything is built procedurally (no model files):
   a PCB with routed traces, ~30 components, signal pulses, and three "order crates".
   Scroll on the home page drives: assembled board → exploded view → parts sorted into orders.
   Other pages get their own camera pose. Runs after shared/site.js. */
(async function () {
  'use strict';
  const canvas = document.getElementById('scene'), tip = document.getElementById('tip');
  const fail = e => { console.warn('3D scene unavailable', e); document.body.classList.add('no-webgl'); };
  let THREE, RoomEnvironment, renderer;
  try {
    THREE = await import('three');
    ({ RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js'));
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) { return fail(e); }

  const V3 = THREE.Vector3;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const sm = x => { x = cl(x); return x * x * (3 - 2 * x); };
  const mix = (a, b, t) => a + (b - a) * t;
  let seed = 5;
  const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x040b08, 22, 50);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .5;
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 120);

  scene.add(new THREE.HemisphereLight(0xcffff0, 0x04100b, .45));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(5, 12, 6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0005;
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 30 });
  scene.add(sun);
  const gold = new THREE.PointLight(0xffc45a, 30, 30); gold.position.set(-6, 6, -4); scene.add(gold);
  const teal = new THREE.PointLight(0x35ffc0, 55, 30); teal.position.set(7, 3, 6); scene.add(teal);

  // ---------- materials & primitives ----------
  const M = o => new THREE.MeshStandardMaterial(o);
  const mBlack = M({ color: 0x16181b, roughness: .5, metalness: .15 }), mSilver = M({ color: 0xd5dae2, roughness: .22, metalness: 1 }),
    mGold = M({ color: 0xf2c14e, roughness: .3, metalness: 1 }), mNavy = M({ color: 0x1c2a55, roughness: .35, metalness: .3 }),
    mTan = M({ color: 0xb98f5c, roughness: .6 }), mGrey = M({ color: 0x2c3036, roughness: .7 }), mWhite = M({ color: 0xe9ecef, roughness: .6 });
  const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o; };
  const cyl = (r, h, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 28), m); o.position.set(x, y, z); return o; };
  const group = (...kids) => { const g = new THREE.Group(); kids.forEach(k => g.add(k)); return g; };

  function chip(w, d, h, n, quad, marked) {
    const g = group(box(w, h, d, mBlack, 0, .06 + h / 2, 0));
    for (let i = 0; i < n; i++) {
      const f = (i - (n - 1) / 2) / (n - 1) * .84;
      for (const s of [-1, 1]) {
        g.add(box(.2, .05, Math.min(.09, d / n * .5), mSilver, s * (w / 2 + .07), .03, f * d));
        if (quad) g.add(box(Math.min(.09, w / n * .5), .05, .2, mSilver, f * w, .03, s * (d / 2 + .07)));
      }
    }
    if (marked) {
      const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
      x.fillStyle = '#16181b'; x.fillRect(0, 0, 256, 256); x.fillStyle = '#8d949c'; x.textAlign = 'center';
      x.font = 'bold 34px Arial'; x.fillText('INFINITY', 128, 112); x.font = '22px Arial'; x.fillText('IC-∞ · 2026', 128, 150);
      x.beginPath(); x.arc(34, 222, 10, 0, 7); x.fill();
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w * .98, d * .98), M({ map: tex, roughness: .5, metalness: .15 }));
      p.rotation.x = -Math.PI / 2; p.position.y = .06 + h + .003; g.add(p);
    } else g.add(cyl(.05, .01, mGrey, -w / 2 + .15, .06 + h + .005, d / 2 - .15));
    return g;
  }
  const ecap = (r, h) => group(cyl(r * 1.05, .06, mBlack, 0, .03, 0), cyl(r, h, mNavy, 0, h / 2, 0), cyl(r * .9, .02, mSilver, 0, h + .01, 0));
  const smd = body => group(box(.4, .12, .2, body, 0, .06, 0), box(.09, .13, .21, mSilver, -.17, .065, 0), box(.09, .13, .21, mSilver, .17, .065, 0));
  const led = color => {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(.09, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M({ color, emissive: color, emissiveIntensity: 2.5 }));
    dome.position.y = .1; return group(box(.34, .1, .22, mWhite, 0, .05, 0), dome);
  };
  const usb = () => group(box(1, .38, .9, mSilver, 0, .19, 0), box(.2, .2, .7, mBlack, -.41, .19, 0));
  const inductor = () => group(box(.9, .45, .9, mGrey, 0, .225, 0), cyl(.3, .02, mBlack, 0, .46, 0));
  const crystal = () => group(box(.9, .3, .36, mSilver, 0, .15, 0));
  const header = n => { const g = group(box(.3, .22, n * .3, mBlack, 0, .11, 0)); for (let i = 0; i < n; i++) g.add(box(.07, .75, .07, mGold, 0, .42, (i - (n - 1) / 2) * .3)); return g; };

  // ---------- board layout ----------
  const BW = 10, BD = 7, TOP = .1, world = new THREE.Group(); scene.add(world);
  const items = [];
  // grp: 0 = ICs, 1 = passives, 2 = connectors & indicators. kind: i18n key shown in the hover tooltip.
  function add(obj, x, z, grp, kind, rot = 0) {
    obj.position.set(x, TOP, z); obj.rotation.y = rot;
    obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    world.add(obj);
    const it = { obj, home: new V3(x, TOP, z), grp, kind, rot, lift: 1.1 + rnd() * 1.9, delay: .3 + rnd() * 1.3, r: rnd(), ph: rnd() * 6.28, hov: 0, sorted: new V3() };
    obj.userData.item = it; items.push(it);
  }
  add(chip(.9, 1.3, .24, 4), -3, -1.7, 0, 'c1');
  add(chip(2.3, 2.3, .28, 10, true, true), 0, 0, 0, 'c1');
  add(chip(.9, 1.3, .24, 4), 2.9, 1.7, 0, 'c1');
  add(chip(.9, 1.1, .24, 4), -2.9, 1.5, 0, 'c1');
  add(chip(.7, .9, .2, 3), 2.3, -1, 0, 'c1');
  add(ecap(.38, .85), 3.6, -2.3, 1, 'c2'); add(ecap(.38, .85), 2.6, -2.5, 1, 'c2'); add(ecap(.3, .7), -4.1, .3, 1, 'c2');
  for (let i = 0; i < 6; i++) add(smd(mBlack), -1.5 + i * .6, -2.5, 1, 'c2');
  for (let i = 0; i < 5; i++) add(smd(mBlack), -1.2 + i * .6, 2.6, 1, 'c2');
  for (const [x, z] of [[1.85, 1.85], [-1.85, 1.85], [1.85, -1.85], [-1.85, -1.85]]) add(smd(mTan), x, z, 1, 'c2', Math.PI / 4 * Math.sign(x * z));
  add(inductor(), 3.7, .1, 1, 'c2'); add(crystal(), .2, -1.85, 1, 'c2');
  add(led(0xff4a3d), -3.9, -2.9, 2, null); add(led(0xffc233), -3.3, -2.9, 2, null); add(led(0x3dffc0), -2.7, -2.9, 2, null);
  add(usb(), -4.5, 2.3, 2, 'c3'); add(header(5), 4.55, 1.9, 2, 'c3'); add(header(8), 0, 3.15, 2, 'c3', Math.PI / 2);

  // where each part goes once the plan is split into orders
  const CX = [-3.8, 0, 3.8], CELL = [1.15, .5, 1];
  [0, 1, 2].forEach(g => {
    const list = items.filter(i => i.grp === g), cols = Math.ceil(Math.sqrt(list.length)), rows = Math.ceil(list.length / cols);
    list.forEach((it, i) => it.sorted.set(CX[g] + (i % cols - (cols - 1) / 2) * CELL[g], 3.1, (Math.floor(i / cols) - (rows - 1) / 2) * CELL[g]));
  });
  const crateMat = new THREE.LineBasicMaterial({ color: 0xf0bd4f, transparent: true, opacity: 0 });
  CX.forEach(cx => { const l = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(3.3, 1.5, 3.3)), crateMat); l.position.set(cx, 3.75, 0); scene.add(l); });

  // traces: from the MCU edge to every other part, horizontal/vertical run then a 45° leg
  const traces = items.filter(it => it.home.x || it.home.z).map(({ home: { x: ex, z: ez } }) => {
    const s = 1.42 / Math.max(Math.abs(ex), Math.abs(ez)), sx = ex * s, sz = ez * s, dx = ex - sx, dz = ez - sz;
    const mid = Math.abs(dx) > Math.abs(dz) ? [ex - Math.sign(dx) * Math.abs(dz), sz] : [sx, ez - Math.sign(dz) * Math.abs(dx)];
    return [[sx, sz], mid, [ex, ez]];
  });

  const CW = 2048, CH = Math.round(CW * BD / BW), U = CW / BW;
  const X = x => (x + BW / 2) * U, Z = z => (z + BD / 2) * U;
  const mk = () => { const c = document.createElement('canvas'); c.width = CW; c.height = CH; return c; };
  const cMap = mk(), cGlow = mk(), g = cMap.getContext('2d'), ge = cGlow.getContext('2d');
  g.fillStyle = '#0c3a2a'; g.fillRect(0, 0, CW, CH);
  g.strokeStyle = 'rgba(255,255,255,.03)'; g.lineWidth = 1;
  for (let i = -CH; i < CW; i += 14) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + CH, CH); g.stroke(); }
  ge.fillStyle = '#000'; ge.fillRect(0, 0, CW, CH);
  for (const [G, col, lw] of [[g, '#1f8059', .075 * U], [ge, '#fff', .03 * U]]) {
    G.strokeStyle = col; G.lineWidth = lw; G.lineJoin = G.lineCap = 'round';
    for (const tr of traces) { G.beginPath(); tr.forEach(([x, z], i) => i ? G.lineTo(X(x), Z(z)) : G.moveTo(X(x), Z(z))); G.stroke(); }
  }
  const ring = (x, z, R, r) => { g.fillStyle = '#e2b955'; g.beginPath(); g.arc(X(x), Z(z), R * U, 0, 7); g.fill(); g.fillStyle = '#072219'; g.beginPath(); g.arc(X(x), Z(z), r * U, 0, 7); g.fill(); };
  for (const tr of traces) ring(...tr[2], .1, .04);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) ring(sx * 4.62, sz * 3.12, .2, .11);
  for (let i = 0; i < 40; i++) ring((rnd() - .5) * 9, (rnd() - .5) * 6.2, .045, .02);
  g.fillStyle = 'rgba(236,246,241,.9)'; g.font = `bold ${.24 * U | 0}px Arial`; g.fillText('INFINITY CONSULT', X(-3.85), Z(3.28));
  g.font = `${.13 * U | 0}px Arial`; g.fillText('REV 1.0 · SOFIA ⇄ SHENZHEN', X(1.3), Z(-3.12));
  const tMap = new THREE.CanvasTexture(cMap), tGlow = new THREE.CanvasTexture(cGlow);
  tMap.colorSpace = tGlow.colorSpace = THREE.SRGBColorSpace;
  tMap.anisotropy = tGlow.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const boardMat = M({ map: tMap, emissiveMap: tGlow, emissive: 0x3dffc0, emissiveIntensity: .6, roughness: .42, metalness: .25 });
  const side = M({ color: 0x0a2c20, roughness: .6 });
  const board = new THREE.Mesh(new THREE.BoxGeometry(BW, .2, BD), [side, side, boardMat, side, side, side]);
  board.receiveShadow = true; world.add(board);

  // signal pulses running along the traces
  const paths = traces.map(tr => { const segs = [1, 2].map(i => Math.hypot(tr[i][0] - tr[i - 1][0], tr[i][1] - tr[i - 1][1])); return { tr, segs, L: segs[0] + segs[1] }; }).filter(p => p.L > .8);
  const pGeo = new THREE.SphereGeometry(.06, 10, 8), pMat = new THREE.MeshBasicMaterial({ color: 0xc8ffec });
  const pulses = Array.from({ length: 16 }, (_, i) => { const m = new THREE.Mesh(pGeo, pMat); world.add(m); return { m, p: paths[i % paths.length], u: rnd() }; });

  // soft glow under the board + drifting dust
  const gc = document.createElement('canvas'); gc.width = gc.height = 256; const gx = gc.getContext('2d');
  const gr = gx.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(61,255,192,.55)'); gr.addColorStop(1, 'rgba(61,255,192,0)');
  gx.fillStyle = gr; gx.fillRect(0, 0, 256, 256);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(26, 22), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .5 }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = -.9; scene.add(glow);
  const dustPos = new Float32Array(900); for (let i = 0; i < 900; i += 3) { dustPos[i] = (rnd() - .5) * 34; dustPos[i + 1] = rnd() * 12 - 2; dustPos[i + 2] = (rnd() - .5) * 34; }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x9fffd8, size: .05, transparent: true, opacity: .5 })); scene.add(dust);

  // ---------- state ----------
  let W = 1, H = 1, narrow = false;
  function resize() { W = innerWidth; H = innerHeight; narrow = W < 900; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();

  // S eases toward T every frame. r/h/a: orbit radius, height, angle. sx/sy: screen-space shift. ex: explode. so: sort.
  const S = { r: 16.5, h: 7.4, a: .55, sx: narrow ? 0 : .21, sy: narrow ? .2 : 0, ex: 0, so: 0 }, T = { ...S };
  const POSE = { services: [8.5, 3, 0, 0, 1.2], process: [17, 8, 1, 1, -.3], about: [16, 6, .75, 0, .9], contact: [11, 11, 0, 0, .3] };
  function target() {
    const route = document.body.dataset.route || 'home';
    if (route === 'home') {
      const top = id => document.getElementById(id).getBoundingClientRect().top;
      const ex = sm((H * .95 - top('st-explode')) / (H * .75)), so = sm((H * .8 - top('st-sort')) / (H * .7));
      T.ex = ex; T.so = so; T.r = 16.5 + ex * 1.5 + so * 5; T.h = 7.4 + ex * 1 + so * 3;
      T.a = mix(.55 + ex * .9, -.3, so);
      T.sx = narrow ? 0 : mix(mix(.21, -.2, ex), .24, so);
      T.sy = narrow ? mix(.2, -.18, ex) : 0;
    } else {
      [T.r, T.h, T.ex, T.so, T.a] = POSE[route]; T.sx = T.sy = 0;
    }
  }

  let mx = 0, my = 0, moved = false, overUI = false, hover = null;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), objs = items.map(i => i.obj);
  addEventListener('pointermove', e => {
    mx = e.clientX / W * 2 - 1; my = e.clientY / H * 2 - 1; moved = true;
    overUI = !!(e.target.closest && e.target.closest('a,button,input,textarea,label,.panel,.card,.hdr,.stats'));
    tip.style.left = e.clientX + 'px'; tip.style.top = e.clientY + 'px';
  });
  function pick() {
    moved = false; hover = null;
    if (!overUI) {
      ndc.set(mx, -my); ray.setFromCamera(ndc, camera);
      let o = ray.intersectObjects(objs, true)[0]?.object;
      while (o && !o.userData.item) o = o.parent;
      hover = o ? o.userData.item : null;
    }
    const label = hover && hover.kind ? IC.t(hover.kind) : '';
    tip.classList.toggle('on', !!label); if (label) tip.textContent = label;
  }

  const clock = new THREE.Clock(), P = new V3(); let time = 0;
  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), .05); time += dt;
    target();
    const k = 1 - Math.exp(-dt * 3.2);
    for (const key in S) S[key] += (T[key] - S[key]) * k;

    for (const it of items) {
      const intro = reduce ? 1 : cl((time - it.delay) / 1.2), drop = Math.pow(1 - intro, 3);
      const so = sm(S.so * 1.5 - it.r * .5), free = S.ex * (1 - so);
      it.hov += ((hover === it ? 1 : 0) - it.hov) * Math.min(1, dt * 10);
      P.copy(it.home);
      P.y += it.lift * S.ex + drop * (8 + it.r * 4) + Math.sin(time * 1.3 + it.ph) * .07 * free + it.hov * .35 * (1 - so);
      P.lerp(it.sorted, so);
      it.obj.position.copy(P);
      it.obj.scale.setScalar(mix(1, .6, so) * (1 + it.hov * .08));
      it.obj.rotation.y = it.rot + free * (it.r - .5) * .9;
    }
    crateMat.opacity = sm(S.so * 1.4 - .4) * .85;
    for (const p of pulses) {
      p.u += dt * 2 / p.p.L;
      if (p.u > 1) { p.u = 0; p.p = paths[rnd() * paths.length | 0]; }
      const d = p.u * p.p.L, i = d > p.p.segs[0] ? 1 : 0, f = (i ? d - p.p.segs[0] : d) / (p.p.segs[i] || 1), a = p.p.tr[i], b = p.p.tr[i + 1];
      p.m.position.set(mix(a[0], b[0], f), TOP + .03, mix(a[1], b[1], f));
    }
    boardMat.emissiveIntensity = .55 + Math.sin(time * 2) * .18;
    dust.rotation.y = time * .01;

    const a = S.a + (reduce ? 0 : Math.sin(time * .25) * .12) + mx * .1, r = S.r * (narrow ? 1.5 : 1);
    camera.position.set(Math.sin(a) * r, S.h - my * .7, Math.cos(a) * r);
    camera.lookAt(0, .3 + S.ex * .8 + S.so * 1.3, 0);
    camera.setViewOffset(W, H, -S.sx * W, -S.sy * H, W, H);
    if (moved) pick();
    renderer.render(scene, camera);
  }
  frame();
})();
