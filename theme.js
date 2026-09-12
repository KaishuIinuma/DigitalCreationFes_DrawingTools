// 1. 色パレットを先に定義（どこからでも使えるようになります）
const colors = {
  white: '#FFFFFF',
  black: '#000000',
  gray: '#111111',
  gray_2: '#2A2A2A',
  blue: '#FFFFFF', // 必要に応じて青色(#4facfeなど)に変更してください
  green: '#FFFFFF',
  yellow: '#FFFFFF'
};

// 2. テーマ全体の設定
const APP_THEME = {
  // 定義したパレットを格納
  colors: colors,

  canvas: {
    background: colors.black,
    panelBackground: colors.black,
    border: colors.white,
    borderStrokeWeight: 1,
    text: colors.white,
    outline: colors.white,
    outlineStrokeWeight: 7,
    hullFill: [255, 255, 255, 22],
    hullStroke: [255, 255, 255, 60],
    hullStrokeWeight: 10,
    selectedStroke: colors.white
  },
  ui: {
    textFont: 'Futura',
    textColor: colors.white,
    textColorInverse: colors.black,
    panelTitleColor: colors.white,
    buttonBg: colors.black,
    buttonBgActive: colors.white,
    buttonBgConnect: colors.white,
    hullItemBg: '#222222',
    hullItemHoverBg: '#444444'
  },
  shapes: {
    defaultFill: "none",          // 💡 これで初期状態が「塗りつぶしなし」に統一されます
    defaultStroke: colors.white,  // 💡 枠線の色を白に指定
    // defaultStroke : true,      // ❌ 削除（これが色の設定を破壊して透明にしていました！）
    defaultStrokeWeight: 2,
    selectedStrokeWeight: 4,
    circle: colors.white,
    rect: colors.white,
    triangle: colors.white
  },
 labels: {
    textSize: 15,
    textColor: colors.white,
    propertiesTitle: 'Properties',
    widthRadius: 'Width/Radius: ',
    heightRect: 'Height (Rect): ',
    color: 'Color: ', 
    showSize: 'Show size',
    scale: 'Scale: ',
    toolbarHint: '',
    hullTitle: '結合グループ一覧',
    guideImageOpacity: 0.4,
  }
};

// CSSのカスタムプロパティ（変数）としてフォントを設定
document.documentElement.style.setProperty('--app-font', APP_THEME.ui.textFont);
document.documentElement.style.setProperty('--label-size', APP_THEME.labels.textSize + 'px');
document.documentElement.style.setProperty('--label-color', APP_THEME.labels.textColor);

/**
 * 3. 強化版テーマ取得関数
 */
function getThemeValue(keyPath) {
  return keyPath.split('.').reduce((obj, key) => obj && obj[key], APP_THEME);
}