// --- Convex Hull関連 ---

function createHull() {
  if (!Array.isArray(hulls) || selectedShapes.length < 2) return false;

  hulls.push(new HullGroup([...selectedShapes]));
    selectedShapes = [];
    renderHullList();
  return true;
}

function renderHullList() {
  if (!hullListDiv) return;
  hullListDiv.html(`<div class="panel-title">${APP_THEME.labels.hullTitle}</div>`);
  hullListDiv.style('display', hulls.length > 0 ? 'block' : 'none');

  hulls.forEach((hull, i) => {
    let div = createDiv(`Hull #${i + 1} (${hull.shapes.length} shapes)`);
    div.class('hull-list-item');
    div.parent(hullListDiv);
    
    // クリックで削除
    div.mousePressed(() => {
      hulls.splice(i, 1);
      renderHullList();
    });
  });
}
