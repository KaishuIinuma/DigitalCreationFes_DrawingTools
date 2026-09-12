class HullGroup {
  constructor(shapesArray) {
    this.shapes = shapesArray;
  }
  
  getPoints() {
    let points = [];
    for (let s of this.shapes) {
      points = points.concat(s.getVertices());
    }
    return points;
  }

  draw() {
    let pts = this.getPoints();
    if (pts.length < 3) return;

    let hullPts = calculateConvexHull(pts);
    if (!hullPts || hullPts.length === 0) return;

    
    push();
    noFill();         // 💡 塗りつぶしなし
    stroke(getCanvasForegroundColor());      // 💡 シンプルな白線
    strokeWeight(HULL_STROKE_WEIGHT);  // 💡 細めの設定
    strokeJoin(ROUND); // 角だけ少し滑らかに

    // ※もし元の図形の線と区別したい場合は、以下のスラッシュを消すと「破線」になります。
    // drawingContext.setLineDash([6, 6]);

    beginShape();
    for (let p of hullPts) {
      vertex(p.x, p.y);
    }
    endShape(CLOSE);
    pop();
  }
}