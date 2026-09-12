function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
  let d1 = (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
  let d2 = (px - x3) * (y2 - y3) - (x2 - x3) * (py - y3);
  let d3 = (px - x1) * (y3 - y1) - (x3 - x1) * (py - y1);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

class Shape {
  constructor(type, x, y) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.type = type;
    this.x = x;
    this.y = y;
    this.w = DEFAULT_SHAPE_SIZE;
    this.h = DEFAULT_SHAPE_SIZE;
    this.col = APP_THEME.shapes.defaultFill;
    this.rotation = 0;
    this.selectEase = 0; // 💡 アニメーション用のイージング値を保持
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.rotation);

    if (this.col === 'none') noFill();
    else fill(this.col);

    stroke(getCanvasForegroundColor());
    strokeWeight(SHAPE_STROKE_WEIGHT);

    switch (this.type) {
      case 'circle': ellipse(0, 0, this.w); break;
      case 'rect': rectMode(CENTER); rect(0, 0, this.w, this.h); break;
      case 'triangle': triangle(0, -this.h / 2, -this.w / 2, this.h / 2, this.w / 2, this.h / 2); break;
    }

    // 選択枠は編集画面だけに描画し、PNGには含めない。
    if (!isExportingArtwork) {
      const isSelected = selectedShapes.includes(this);
      const targetEase = isSelected ? 1.0 : 0.0;
      this.selectEase += (targetEase - this.selectEase) * SELECTION_EASING_SPEED;

      if (this.selectEase > 0.01) {
      push();
      noFill();
      stroke(getCanvasForegroundColor());
      strokeWeight(SELECTION_STROKE_WEIGHT);

      // 💡 1. 透明度をイージングと連動（フェードイン）
      drawingContext.globalAlpha = this.selectEase;

      // 💡 2. スケールをイージングと連動（0.85倍から1.0倍へ少し広がるように出現）
      scale(0.85 + 0.15 * this.selectEase);

      drawingContext.setLineDash([SELECTION_DASH_LENGTH, SELECTION_DASH_GAP]);
      drawingContext.lineDashOffset = -millis() / SELECTION_DASH_SPEED;
      const padding = SELECTION_PADDING;

      switch (this.type) {
        case 'circle': ellipse(0, 0, this.w + padding * 2); break;
        case 'rect': rectMode(CENTER); rect(0, 0, this.w + padding * 2, this.h + padding * 2); break;
        case 'triangle': scale(1 + (padding * 2) / Math.max(this.w, this.h)); triangle(0, -this.h / 2, -this.w / 2, this.h / 2, this.w / 2, this.h / 2); break;
      }

      drawingContext.setLineDash([]);
      drawingContext.globalAlpha = 1.0;
      pop();
    }
    }
    pop();
  }

  contains(px, py) {
    let dx = px - this.x; let dy = py - this.y;
    let cosA = Math.cos(-this.rotation); let sinA = Math.sin(-this.rotation);
    let lx = dx * cosA - dy * sinA; let ly = dx * sinA + dy * cosA;
    const hw = this.w / 2; const hh = this.h / 2;

    switch (this.type) {
      case 'circle': return (lx * lx + ly * ly) < (this.w / 2) * (this.w / 2);
      case 'rect': return lx > -hw && lx < hw && ly > -hh && ly < hh;
      case 'triangle': return pointInTriangle(lx, ly, 0, -hh, -hw, hh, hw, hh);
      default: return false;
    }
  }

  getVerticesAt(x, y) {
    let localPts = [];
    const hw = this.w / 2;
    const hh = this.h / 2;

    if (this.type === 'circle') {
      const radius = this.w / 2;
      localPts.push({ x: 0, y: -radius }, { x: radius, y: 0 }, { x: 0, y: radius }, { x: -radius, y: 0 });
    } else if (this.type === 'rect') {
      localPts.push({ x: -hw, y: -hh }, { x: hw, y: -hh }, { x: hw, y: hh }, { x: -hw, y: hh });
    } else if (this.type === 'triangle') {
      localPts.push({ x: 0, y: -hh }, { x: -hw, y: hh }, { x: hw, y: hh });
    }

    const cosA = Math.cos(this.rotation);
    const sinA = Math.sin(this.rotation);
    return localPts.map(pt => ({
      x: x + pt.x * cosA - pt.y * sinA,
      y: y + pt.x * sinA + pt.y * cosA
    }));
  }

  getVertices() { return this.getVerticesAt(this.x, this.y); }
  getBoundsAt(x, y) {
    const v = this.getVerticesAt(x, y);
    const xs = v.map(p => p.x); const ys = v.map(p => p.y);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  }
}
