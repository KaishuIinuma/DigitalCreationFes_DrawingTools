p5.disableFriendlyErrors = true;

// --- グローバル変数 ---
let colorMode = true; // false: dark mode, true: light mode

// --- デバッグ画像 ---
// false にすると画像を非表示にし、白背景と図形だけを描画します。
const SHOW_DEBUG_IMAGE = false;
const DEBUG_IMAGE_PATHS = [
  'data/image/pigeon.jpg',
  'data/image/rabbit.jpg'
];
const DEBUG_IMAGE_OPACITY = 1;
const debugImagePath = DEBUG_IMAGE_PATHS[Math.floor(Math.random() * DEBUG_IMAGE_PATHS.length)];
let debugImg;
let debugImgLoaded = false;

function preload() {
  if (SHOW_DEBUG_IMAGE) {
    debugImg = loadImage(
      debugImagePath,
      () => {
        debugImgLoaded = true;
        console.info('デバッグ画像を表示:', debugImagePath);
      },
      () => { console.warn('デバッグ画像の読み込みに失敗しました:', debugImagePath); }
    );
  }
}

function drawDebugImage() {
  if (!SHOW_DEBUG_IMAGE || !debugImg || !debugImgLoaded) return;

  const imgAspect = debugImg.width / debugImg.height;
  const canvasAspect = width / height;
  let drawW, drawH;
  if (imgAspect > canvasAspect) {
    drawW = width;
    drawH = width / imgAspect;
  } else {
    drawH = height;
    drawW = height * imgAspect;
  }
  const drawX = (width - drawW) / 2;
  const drawY = (height - drawH) / 2;

  push();
  imageMode(CORNER);
  tint(255, 255 * DEBUG_IMAGE_OPACITY);
  image(debugImg, drawX, drawY, drawW, drawH);
  pop();
}



function getCanvasBackgroundColor() {
  return colorMode ? 255 : 0;
}

function getCanvasForegroundColor() {
  return colorMode ? 0 : 255;
}

function applyColorModeToOpeningScreen() {
  const background = colorMode ? '#FFFFFF' : '#000000';
  const foreground = colorMode ? '#000000' : '#FFFFFF';
  document.documentElement.style.setProperty('--opening-background', background);
  document.documentElement.style.setProperty('--opening-foreground', foreground);
}

let shapes = [];
let connections = [];
let draggingShape = null;
let selectedShapes = [];
let selectedVertices = [];
let selectedConnection = null;
let vertexAnimState = {};
let pointerX = 0;
let pointerY = 0;
let deleteControlEase = 0;
let deleteControlVisible = false;
let lastDeleteControlPosition = null;
let hulls = [];
let hullListDiv = null;

let toolbarRect = { x: 20, y: 0, w: TOOLBAR_BASE_WIDTH, h: TOOLBAR_BASE_HEIGHT, radius: TOOLBAR_BORDER_RADIUS };

let initialW = null, initialH = null;
let lastTouchX = null, lastTouchY = null;
let lastTouchDist = null;

// UI要素
// 画像は index.html の img タグで管理

function stopPropagationOn(el) {
  el.addEventListener('mousedown', (e) => e.stopPropagation());
  el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });
}

function setupTouchHandling() {
  const canvasEl = document.querySelector('canvas');
  if (!canvasEl) return;
  canvasEl.style.touchAction = 'none';
  canvasEl.style.webkitTouchCallout = 'none';
  canvasEl.style.webkitUserSelect = 'none';
  canvasEl.style.userSelect = 'none';

  // 入力処理は touch.js の p5.js コールバックだけに統一する。
  // ここで DOM リスナーも登録すると、同じタッチが二重に処理される。
}

function setup() {
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
  applyColorModeToOpeningScreen();
  createCanvas(windowWidth, windowHeight);
  setupTouchHandling();
  updateLayoutSizes();

  setupUI();
  positionUI();
}

function setupUI() {
  // Hull の一覧は、Hull を初めて作成したときだけ表示する。
  hullListDiv = createDiv();
  hullListDiv.style('position', 'absolute');
  hullListDiv.style('top', '20px');
  hullListDiv.style('right', '20px');
  hullListDiv.style('z-index', '20');
  hullListDiv.style('display', 'none');
}

function deleteSelected() {
  if (selectedConnection) {
    connections = connections.filter(connection => connection !== selectedConnection);
    selectedConnection = null;
  } else if (selectedShapes.length > 0) {
    let idsToRemove = selectedShapes.map(s => s.id);
    shapes = shapes.filter(s => !idsToRemove.includes(s.id));

    connections = connections.filter(c =>
      !idsToRemove.includes(c.v1.shape.id) && !idsToRemove.includes(c.v2.shape.id)
    );
    hulls = hulls.filter(hull => !hull.shapes.some(shape => idsToRemove.includes(shape.id)));
    renderHullList();
    clearShapeSelection();
  } else if (selectedVertices.length >= 2) {
    connections = connections.filter(c => {
      let v1Selected = selectedVertices.some(sv => sv.shape.id === c.v1.shape.id && sv.index === c.v1.index);
      let v2Selected = selectedVertices.some(sv => sv.shape.id === c.v2.shape.id && sv.index === c.v2.index);
      return !(v1Selected && v2Selected);
    });
    selectedVertices = [];
  }
}

function getDeleteTarget() {
  if (selectedConnection) return selectedConnection;
  if (selectedShapes.length > 0) return selectedShapes[0];
  return null;
}

function getDeleteControlPosition(target) {
  if (target instanceof Shape) {
    const bounds = target.getBoundsAt(target.x, target.y);
    return { x: bounds.maxX + 18, y: bounds.minY - 18 };
  }

  const pt1 = target.v1.shape.getVertices()[target.v1.index];
  const pt2 = target.v2.shape.getVertices()[target.v2.index];
  return {
    x: Math.max(pt1.x, pt2.x) + 18,
    y: Math.min(pt1.y, pt2.y) - 18
  };
}

function isDeleteControlHit(x, y) {
  const target = getDeleteTarget();
  if (!target || !deleteControlVisible) return false;
  const position = getDeleteControlPosition(target);
  return dist(x, y, position.x, position.y) < DELETE_CONTROL_RADIUS;
}

function drawDeleteControl() {
  const target = getDeleteTarget();
  const targetVisible = target && deleteControlVisible;
  const targetEase = targetVisible ? 1 : 0;
  deleteControlEase += (targetEase - deleteControlEase) * Math.min(1, deltaTime / 100);
  if (deleteControlEase < 0.01) return;

  if (target) lastDeleteControlPosition = getDeleteControlPosition(target);
  if (!lastDeleteControlPosition) return;

  push();
  translate(lastDeleteControlPosition.x, lastDeleteControlPosition.y);
  scale(0.1 + 0.9 * deleteControlEase);
  drawingContext.globalAlpha = deleteControlEase;
  noStroke();
  fill(colorMode ? 0 : 255);
  ellipse(0, 0, DELETE_CONTROL_SIZE, DELETE_CONTROL_SIZE);
  stroke(colorMode ? 255 : 0);
  strokeWeight(DELETE_CONTROL_STROKE);
  line(-DELETE_CONTROL_LINE_WIDTH, -DELETE_CONTROL_LINE_WIDTH, DELETE_CONTROL_LINE_WIDTH, DELETE_CONTROL_LINE_WIDTH);
  line(DELETE_CONTROL_LINE_WIDTH, -DELETE_CONTROL_LINE_WIDTH, -DELETE_CONTROL_LINE_WIDTH, DELETE_CONTROL_LINE_WIDTH);
  drawingContext.globalAlpha = 1;
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateLayoutSizes();
  positionUI();
}

function updateLayoutSizes() {
  toolbarRect.y = height / 2 - toolbarRect.h / 2;
}

function positionUI() { }

function drawConnections() {
  const hoveredConnection = getClosestConnection(pointerX, pointerY);
  push();
  stroke(getCanvasForegroundColor());
  strokeWeight(CONNECTION_STROKE_WEIGHT);
  noFill();
  connections.forEach(conn => {
    let pts1 = conn.v1.shape.getVertices();
    let pts2 = conn.v2.shape.getVertices();
    let pt1 = pts1[conn.v1.index];
    let pt2 = pts2[conn.v2.index];
    if (pt1 && pt2) {
      if (conn === selectedConnection || conn === hoveredConnection) {
        drawingContext.setLineDash([CONNECTION_DASH_LENGTH, CONNECTION_DASH_GAP]);
        drawingContext.lineDashOffset = -millis() / CONNECTION_DASH_SPEED;
      }
      line(pt1.x, pt1.y, pt2.x, pt2.y);
      drawingContext.setLineDash([]);
    }
  });
  if (selectedVertices.length === 1 && !draggingShape) {
    const pos1 = selectedVertices[0].shape.getVertices()[selectedVertices[0].index];
    if (pos1) line(pos1.x, pos1.y, pointerX, pointerY);
  }
  pop();
}

function drawVertices() {
  let hx = pointerX;
  let hy = pointerY;

  shapes.forEach(shape => {
    let verts = shape.getVertices();
    verts.forEach((pt, index) => {
      let key = shape.id + '_' + index;
      if (vertexAnimState[key] === undefined) vertexAnimState[key] = 0;

      let d = dist(hx, hy, pt.x, pt.y);
      let isHovered = (d < 25 && !draggingShape);
      let isSelected = selectedVertices.some(sv => sv.shape.id === shape.id && sv.index === index);

      let targetEase = (isHovered || isSelected) ? 1.0 : 0.0;
      vertexAnimState[key] += (targetEase - vertexAnimState[key]) * 0.25;
      let ease = vertexAnimState[key];

      if (ease > 0.01) {
        push();
        translate(pt.x, pt.y);

        noStroke();
        fill(getCanvasForegroundColor());
        let innerR = 4 + (ease * 2.5);
        ellipse(0, 0, innerR * 2);

        // 💡 青いバツ印を描画するコードを削除し、破線の円のみ残しました
        if (ease > 0.01) {
          noFill();
          stroke(getCanvasForegroundColor());
          strokeWeight(1.5);
          drawingContext.setLineDash([4, 4]);
          drawingContext.lineDashOffset = -millis() / 40;
          let outerR = innerR + 4 + (ease * 4);
          ellipse(0, 0, outerR * 2);
          drawingContext.setLineDash([]);
        }
        pop();
      }
    });
  });
}

function draw() {
  background(getCanvasBackgroundColor());
  drawDebugImage(); // 白背景と図形の間に描画

  drawConnections();
  hulls.forEach((hull) => hull.draw());
  shapes.forEach((s) => s.display());
  if (draggingShape && !shapes.includes(draggingShape)) draggingShape.display();
  drawVertices();
  drawToolbarIcons();
  drawDeleteControl();
}
