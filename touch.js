let pointerDownX = 0;
let pointerDownY = 0;
let pointerMoved = false;
let lastTouchCenterX = 0;
let lastTouchCenterY = 0;
let initialTouchCenterX = 0;
let initialTouchCenterY = 0;
let lastTouchAngle = 0;
let initialTouchAngle = 0;
let lastTrackpadGestureScale = 1;
let lastTrackpadGestureRotation = 0;

function beginPointerAction(x, y) {
  pointerDownX = x;
  pointerDownY = y;
  pointerMoved = false;
}

function updatePointerMovement(x, y) {
  if (dist(pointerDownX, pointerDownY, x, y) > POINTER_MOVEMENT_THRESHOLD) pointerMoved = true;
}

function selectShape(shape) {
  selectedShapes = [shape];
  draggingShape = shape;
}

function getClosestVertex(x, y) {
  let closest = null;
  let minDist = VERTEX_DETECTION_RADIUS;
  shapes.forEach(shape => {
    shape.getVertices().forEach((pt, index) => {
      const vertexDist = dist(x, y, pt.x, pt.y);
      if (vertexDist < minDist) {
        minDist = vertexDist;
        closest = { shape, index };
      }
    });
  });
  return closest;
}

function clearShapeSelection() {
  selectedShapes = [];
  selectedVertices = [];
  selectedConnection = null;
  draggingShape = null;
  deleteControlVisible = false;
}

function checkToolbarClick(x, y) {
  if (x < toolbarRect.x || x > toolbarRect.x + toolbarRect.w ||
      y < toolbarRect.y || y > toolbarRect.y + toolbarRect.h) return null;

  let cy = height / 2; let gap = 110; let size = 80;
  if (abs(y - (cy - gap)) < size / 2) return new Shape('rect', x, y);
  if (abs(y - cy) < size / 2) return new Shape('circle', x, y);
  if (abs(y - (cy + gap)) < size / 2) return new Shape('triangle', x, y);
  return null;
}

function getClickedShape(x, y) {
  if (!isPointInCanvas(x, y)) return null;
  return shapes.slice().reverse().find(s => s.contains(x, y)) || null;
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return dist(px, py, x1, y1);
  const t = constrain(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy), 0, 1);
  return dist(px, py, x1 + t * dx, y1 + t * dy);
}

function getClosestConnection(x, y) {
  let closest = null;
  let minDist = CONNECTION_DETECTION_RADIUS;
  connections.forEach(connection => {
    const pt1 = connection.v1.shape.getVertices()[connection.v1.index];
    const pt2 = connection.v2.shape.getVertices()[connection.v2.index];
    if (!pt1 || !pt2) return;
    const connectionDist = distanceToSegment(x, y, pt1.x, pt1.y, pt2.x, pt2.y);
    if (connectionDist < minDist) {
      minDist = connectionDist;
      closest = connection;
    }
  });
  return closest;
}

function getShapeIntersectingSegment(x1, y1, x2, y2) {
  let closest = null;
  let minDist = Infinity;
  shapes.forEach(shape => {
    const d = distanceToSegment(shape.x, shape.y, x1, y1, x2, y2);
    if (d < minDist) {
      minDist = d;
      closest = shape;
    }
  });
  return minDist < SEGMENT_INTERSECTION_DISTANCE ? closest : null;
}

function handleInputStart(x, y) {
  pointerX = x;
  pointerY = y;
  beginPointerAction(x, y);

  if (isDeleteControlHit(x, y)) {
    deleteSelected();
    deleteControlVisible = false;
    return;
  }

  let newShape = checkToolbarClick(x, y);
  if (newShape) {
    selectedShapes = [];
    selectedVertices = [];
    selectedConnection = null;
    deleteControlVisible = false;
    draggingShape = newShape;
    return;
  }

  const closest = getClosestVertex(x, y);
  if (closest) {
    selectedShapes = [];
    selectedConnection = null;
    deleteControlVisible = false;
    draggingShape = null;
    const current = selectedVertices[selectedVertices.length - 1];
    const isSameVertex = current && current.shape.id === closest.shape.id && current.index === closest.index;
    if (isSameVertex) selectedVertices = [];
    else {
      if (current) connections.push({ v1: current, v2: closest });
      selectedVertices = [closest];
    }
    return;
  }

  selectedVertices = [];
  const clickedConnection = getClosestConnection(x, y);
  if (clickedConnection) {
    selectedShapes = [];
    selectedConnection = clickedConnection;
    deleteControlVisible = true;
    draggingShape = null;
    return;
  }

  selectedConnection = null;
  deleteControlVisible = false;
  let clickedShape = getClickedShape(x, y);
  if (clickedShape) selectShape(clickedShape);
  else if (isPointInCanvas(x, y)) clearShapeSelection();
}

function updatePointer(x, y) {
  pointerX = x;
  pointerY = y;
}

function isPointInCanvas(x, y) {
  if (x >= toolbarRect.x && x <= toolbarRect.x + toolbarRect.w && y >= toolbarRect.y && y <= toolbarRect.y + toolbarRect.h) return false;
  return x >= 0 && x <= width && y >= 0 && y <= height;
}

function constrainShapeToCanvas(shape, targetX, targetY) {
  let x = targetX; let y = targetY;
  let bounds = shape.getBoundsAt(x, y);
  if (bounds.minX < 0) x += 0 - bounds.minX;
  if (bounds.maxX > width) x -= bounds.maxX - width;
  bounds = shape.getBoundsAt(x, y);
  if (bounds.minY < 0) y += 0 - bounds.minY;
  if (bounds.maxY > height) y -= bounds.maxY - height;

  bounds = shape.getBoundsAt(x, y);
  if (bounds.minX < toolbarRect.x + toolbarRect.w && bounds.maxX > toolbarRect.x &&
      bounds.minY < toolbarRect.y + toolbarRect.h && bounds.maxY > toolbarRect.y) {
    x += (toolbarRect.x + toolbarRect.w) - bounds.minX + 2;
  }
  return { x, y };
}

function scaleSelectedShape(shape, scaleFactor) {
  const previousWidth = shape.w;
  shape.w = constrain(shape.w * scaleFactor, MIN_SCALE, MAX_SCALE);

  if (shape.type !== 'circle') {
    const appliedScale = shape.w / previousWidth;
    shape.h = constrain(shape.h * appliedScale, MIN_SCALE, MAX_SCALE);
  }

  const constrained = constrainShapeToCanvas(shape, shape.x, shape.y);
  shape.x = constrained.x;
  shape.y = constrained.y;
}

function getSelectedShapeForDevGesture() {
  if (!IS_DEV_MODE || selectedShapes.length !== 1) return null;
  return selectedShapes[0];
}

function handleTrackpadGestureStart(event) {
  const shape = getSelectedShapeForDevGesture();
  if (!shape) return;
  event.preventDefault();
  lastTrackpadGestureScale = event.scale || 1;
  lastTrackpadGestureRotation = event.rotation || 0;
}

function handleTrackpadGestureChange(event) {
  const shape = getSelectedShapeForDevGesture();
  if (!shape) return;
  event.preventDefault();

  const scale = event.scale || 1;
  const rotation = event.rotation || 0;
  scaleSelectedShape(shape, scale / lastTrackpadGestureScale);
  shape.rotation += (rotation - lastTrackpadGestureRotation) * Math.PI / 180;
  lastTrackpadGestureScale = scale;
  lastTrackpadGestureRotation = rotation;
}

function handleTrackpadGestureEnd(event) {
  if (!getSelectedShapeForDevGesture()) return;
  event.preventDefault();
  lastTrackpadGestureScale = 1;
  lastTrackpadGestureRotation = 0;
}

function getCanvasPointFromClient(clientX, clientY) {
  const canvasEl = document.querySelector('canvas');
  if (!canvasEl) return null;
  const rect = canvasEl.getBoundingClientRect();
  return { x: (clientX - rect.left) * (width / rect.width), y: (clientY - rect.top) * (height / rect.height) };
}

function getCanvasPointFromTouch(event, index = 0) {
  if (!event.touches || !event.touches[index]) return null;
  const touch = event.touches[index];
  return getCanvasPointFromClient(touch.clientX, touch.clientY);
}

function getTouchPoints(event) {
  // ブラウザの TouchEvent が渡される場合は、画面上の座標をキャンバス座標へ変換する。
  if (event && event.touches && event.touches.length > 0) {
    return Array.from(event.touches)
      .map((_, index) => getCanvasPointFromTouch(event, index))
      .filter(Boolean);
  }

  // p5.js 2.x はタッチを PointerEvent として通知する。pointermove の
  // コールバック中は p5.js の touches が1イベント前の座標なので、
  // 動いた指だけ PointerEvent の最新座標へ差し替える。
  if (event && event.pointerType === 'touch') {
    const currentPoint = getCanvasPointFromClient(event.clientX, event.clientY);
    const points = typeof touches !== 'undefined'
      ? touches.map(touch => ({ x: touch.x, y: touch.y, id: touch.id }))
      : [];
    const currentIndex = points.findIndex(point => point.id === event.pointerId);
    if (currentIndex >= 0) points[currentIndex] = { ...currentPoint, id: event.pointerId };
    else if (currentPoint) points.push({ ...currentPoint, id: event.pointerId });
    return points;
  }

  // p5.js のコールバックでは event が省略される環境があるため、
  // p5.js が維持している touches 配列も入力元として使う。
  if (typeof touches !== 'undefined' && touches.length > 0) {
    return touches.map(touch => ({ x: touch.x, y: touch.y }));
  }

  return [];
}

function handleTouchStart(event) {
  const points = getTouchPoints(event);
  if (points.length === 0) return false;
  if (event && event.cancelable) event.preventDefault();
  if (points.length === 1) updatePointer(points[0].x, points[0].y);
  if (points.length === 1) {
    updatePointerMovement(points[0].x, points[0].y);
  } else if (points.length >= 2) {
    const centerX = (points[0].x + points[1].x) / 2;
    const centerY = (points[0].y + points[1].y) / 2;
    updatePointerMovement(centerX, centerY);
  }

  if (points.length === 1) handleInputStart(points[0].x, points[0].y);
  else if (points.length >= 2) {
    draggingShape = null;
    lastTouchDist = dist(points[0].x, points[0].y, points[1].x, points[1].y);
    const centerX = (points[0].x + points[1].x) / 2;
    const centerY = (points[0].y + points[1].y) / 2;
    initialTouchCenterX = centerX;
    initialTouchCenterY = centerY;
    lastTouchCenterX = centerX;
    lastTouchCenterY = centerY;    const angle = atan2(points[1].y - points[0].y, points[1].x - points[0].x);
    initialTouchAngle = angle;
    lastTouchAngle = angle;    beginPointerAction(centerX, centerY);
    const shapeInSegment = getShapeIntersectingSegment(points[0].x, points[0].y, points[1].x, points[1].y);
    if (shapeInSegment) {
      selectedShapes = [shapeInSegment];
      initialW = shapeInSegment.w;
      initialH = shapeInSegment.h;
      selectedConnection = null;
      selectedVertices = [];
      deleteControlVisible = false;
    } else {
      selectedShapes = [];
      initialW = null;
      initialH = null;
    }
  }
  return false;
}

function handleTouchMove(event) {
  const points = getTouchPoints(event);
  if (points.length === 0) return false;
  if (event && event.cancelable) event.preventDefault();
  if (points.length === 1) {
    updatePointer(points[0].x, points[0].y);
    updatePointerMovement(points[0].x, points[0].y);
  }

  if (points.length >= 2) {
    if (selectedShapes.length === 1 && lastTouchDist && initialW !== null && initialH !== null) {
      pointerMoved = true;
      deleteControlVisible = false;
      const shape = selectedShapes[0];
      const centerX = (points[0].x + points[1].x) / 2;
      const centerY = (points[0].y + points[1].y) / 2;
      const centerDeltaX = centerX - lastTouchCenterX;
      const centerDeltaY = centerY - lastTouchCenterY;
      lastTouchCenterX = centerX;
      lastTouchCenterY = centerY;
      const currentAngle = atan2(points[1].y - points[0].y, points[1].x - points[0].x);
      const angleDelta = currentAngle - lastTouchAngle;
      lastTouchAngle = currentAngle;
      const scale = dist(points[0].x, points[0].y, points[1].x, points[1].y) / lastTouchDist;
      shape.w = constrain(initialW * scale, MIN_SCALE, MAX_SCALE);
      if (shape.type !== 'circle') shape.h = constrain(initialH * scale, MIN_SCALE, MAX_SCALE);
      shape.rotation += angleDelta;
      const constrained = constrainShapeToCanvas(shape, shape.x + centerDeltaX, shape.y + centerDeltaY);
      shape.x = constrained.x;
      shape.y = constrained.y;
    }
    return false;
  }

  if (points.length === 1 && draggingShape) {
    updatePointer(points[0].x, points[0].y);
    const constrained = constrainShapeToCanvas(draggingShape, points[0].x, points[0].y);
    draggingShape.x = constrained.x; draggingShape.y = constrained.y;
  }
  return false;
}

function handleTouchEnd(event) {
  if (event && event.cancelable) event.preventDefault();
  if (draggingShape && !shapes.includes(draggingShape) && isPointInCanvas(draggingShape.x, draggingShape.y)) {
    shapes.push(draggingShape);
    selectShape(draggingShape);
    deleteControlVisible = true;
  } else if (draggingShape && !pointerMoved) {
    deleteControlVisible = true;
  } else if (pointerMoved) {
    deleteControlVisible = false;
  }
  const remainingTouchCount = event && event.touches
    ? event.touches.length
    : (typeof touches !== 'undefined' ? touches.length : 0);
  if (remainingTouchCount < 2) {
    lastTouchDist = null; 
    initialW = null; 
    initialH = null; 
    lastTouchCenterX = 0;
    lastTouchCenterY = 0;
    initialTouchCenterX = 0;
    initialTouchCenterY = 0;
    lastTouchAngle = 0;
    initialTouchAngle = 0;
  }
  draggingShape = null;
  return false;
}

function touchStarted(event) { return handleTouchStart(event || window.event); }
function touchMoved(event) { return handleTouchMove(event || window.event); }
function touchEnded(event) { return handleTouchEnd(event || window.event); }

function isTouchPointerEvent(event) {
  return event && event.pointerType === 'touch';
}

function mouseMoved() {
  if (!(touches && touches.length > 0)) updatePointer(mouseX, mouseY);
  return false;
}
function mousePressed(event) {
  // p5.js 2.x はタッチ入力も PointerEvent として mousePressed に送る。
  if (isTouchPointerEvent(event)) return handleTouchStart(event);
  handleInputStart(mouseX, mouseY);
  return false;
}
function mouseDragged(event) {
  // p5.js 2.x のタッチ移動は touchMoved ではなく mouseDragged に届く。
  if (isTouchPointerEvent(event)) return handleTouchMove(event);

  updatePointer(mouseX, mouseY);
  updatePointerMovement(mouseX, mouseY);
  if (draggingShape) {
    deleteControlVisible = false;
    const constrained = constrainShapeToCanvas(draggingShape, mouseX, mouseY);
    draggingShape.x = constrained.x; draggingShape.y = constrained.y;
  }
  return false;
}
function mouseReleased(event) {
  // pointerup の時点で p5.js の touches は更新済みなので、その状態で終了処理する。
  if (isTouchPointerEvent(event)) return handleTouchEnd(event);

  if (draggingShape && !shapes.includes(draggingShape) && isPointInCanvas(mouseX, mouseY)) {
    shapes.push(draggingShape); selectShape(draggingShape);
    deleteControlVisible = true;
  } else if (draggingShape && !pointerMoved) {
    deleteControlVisible = true;
  } else if (pointerMoved) {
    deleteControlVisible = false;
  }
  draggingShape = null; return false;
}

function mouseWheel(event) {
  const shape = getSelectedShapeForDevGesture();
  if (!shape || !event) return;

  if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
    shape.rotation += event.deltaX * DEBUG_TRACKPAD_ROTATION_SENSITIVITY;
    return false;
  }

  if (event.deltaY === 0) return;
  const scaleFactor = event.deltaY < 0
    ? 1 + DEBUG_WHEEL_SCALE_STEP
    : 1 - DEBUG_WHEEL_SCALE_STEP;
  scaleSelectedShape(shape, scaleFactor);
  return false;
}
