// =====================================
// PARAMETERS.JS - 調整可能なパラメータ集
// =====================================
// 機能別にグループ分けされた定数・設定値
// これらを編集することで、アプリの動作を簡単にカスタマイズ可能

// ======================================
// 1. スケール・サイズ制御
// ======================================

// 図形のスケール制限
const MAX_SCALE = 400;      // 図形の最大サイズ
const MIN_SCALE = 10;       // 図形の最小サイズ

// デフォルト図形サイズ
const DEFAULT_SHAPE_SIZE = 60;  // 新規作成時の図形サイズ


// ======================================
// 2. タッチ・ポインタ検出
// ======================================

// ポインタ移動検出の閾値
const POINTER_MOVEMENT_THRESHOLD = 4;  // ドラッグと判定する最小移動距離（px）

// UI要素との距離検出の範囲
const VERTEX_DETECTION_RADIUS = 25;        // 頂点を検出する範囲（px）
const CONNECTION_DETECTION_RADIUS = 15;    // 接続線を検出する範囲（px）
const SEGMENT_INTERSECTION_DISTANCE = 30;  // 2本指の線分とオブジェクトの距離判定（px）

// 削除コントロール
const DELETE_CONTROL_RADIUS = 18;  // 削除ボタンのクリック範囲（px）


// ======================================
// 3. UI外観・アニメーション
// ======================================

// 削除コントロール
const DELETE_CONTROL_SIZE = 30;          // 削除ボタンの円サイズ
const DELETE_CONTROL_LINE_WIDTH = 6;     // 削除ボタンの×記号の線長
const DELETE_CONTROL_STROKE = 3;         // 削除ボタンのストローク幅
const DELETE_CONTROL_EASING = 0.1;       // 削除コントロールのアニメーション速度

// 選択状態の表示
const SELECTION_STROKE_WEIGHT = 1.5;     // 選択時の破線のストローク幅
const SELECTION_PADDING = 8;             // 図形の周りの破線までの距離（px）
const SELECTION_DASH_LENGTH = 6;         // 破線の実線部の長さ
const SELECTION_DASH_GAP = 6;            // 破線の空白部の長さ
const SELECTION_DASH_SPEED = 40;         // 破線のアニメーション速度（ミリ秒）
const SELECTION_EASING_SPEED = 0.25;     // 選択状態のアニメーション速度

// 図形描画
const SHAPE_STROKE_WEIGHT = 4;    // 通常の図形のストローク幅
const CONNECTION_STROKE_WEIGHT = 4;  // 接続線のストローク幅
const HULL_STROKE_WEIGHT = 2;     // 凸包のストローク幅


// ======================================
// 4. ツールバー・UI配置
// ======================================

// ツールバー矩形設定（基本値）
const TOOLBAR_BASE_WIDTH = 90;      // ツールバーの幅
const TOOLBAR_BASE_HEIGHT = 360;    // ツールバーの高さ
const TOOLBAR_BORDER_RADIUS = 40;   // ツールバーの角丸み
const TOOLBAR_MARGIN_LEFT = 20;     // 左マージン

// ツールバー内アイコン配置
const TOOLBAR_ICON_GAP = 110;           // アイコン間の間隔（縦方向）
const TOOLBAR_ICON_SIZE = 52;           // アイコンのサイズ
const TOOLBAR_ICON_CIRCLE_OFFSET = 10;  // 円アイコンの追加サイズ
const TOOLBAR_ICON_TRIANGLE_OFFSET = 5; // 三角形アイコンのオフセット

// ボタン矩形設定（基本値）
const BUTTON_BASE_WIDTH = 340;   // ボタン領域の幅
const BUTTON_BASE_HEIGHT = 80;   // ボタン領域の高さ
const BUTTON_MARGIN_BOTTOM = 0;  // 下マージン


// ======================================
// 5. 線画・ダッシュ設定
// ======================================

// 接続線の描画
const CONNECTION_DASH_LENGTH = 8;  // 接続線の実線部の長さ
const CONNECTION_DASH_GAP = 6;     // 接続線の空白部の長さ
const CONNECTION_DASH_SPEED = 40;  // 接続線のアニメーション速度（ミリ秒）


// ======================================
// 6. デバッグ・開発設定
// ======================================

// 開発モード（true で詳細ログなどを表示）
const IS_DEV_MODE = true;

// 開発モード中に、選択図形をマウスホイールで拡大・縮小する倍率
const DEBUG_WHEEL_SCALE_STEP = 0.02;

// デバッグ画像の倍率（1.0 = キャンバスに収める、0.5 = 半分、2.0 = 2倍）
const DEBUG_IMAGE_SCALE = 0.7;


// ======================================
