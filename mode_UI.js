function drawToolbarIcons() {
  push();
  noFill();
  stroke(getCanvasForegroundColor());
  strokeWeight(1.5);
  rectMode(CORNER);
  rect(toolbarRect.x, toolbarRect.y, toolbarRect.w, toolbarRect.h, toolbarRect.radius);

  strokeWeight(4);
  let cx = toolbarRect.x + toolbarRect.w / 2; 
  let cy = height / 2; 
  let gap = TOOLBAR_ICON_GAP; 
  let size = TOOLBAR_ICON_SIZE; 

  rectMode(CENTER); rect(cx, cy - gap, size, size); 
  ellipse(cx, cy, size + TOOLBAR_ICON_CIRCLE_OFFSET, size + TOOLBAR_ICON_CIRCLE_OFFSET); 
  triangle(cx, cy + gap - size / 2 - TOOLBAR_ICON_TRIANGLE_OFFSET, cx - size / 2 - TOOLBAR_ICON_TRIANGLE_OFFSET, cy + gap + size / 2 + TOOLBAR_ICON_TRIANGLE_OFFSET, cx + size / 2 + TOOLBAR_ICON_TRIANGLE_OFFSET, cy + gap + size / 2 + TOOLBAR_ICON_TRIANGLE_OFFSET); 
  pop();
}