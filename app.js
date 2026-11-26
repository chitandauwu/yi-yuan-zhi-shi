(() => {
  "use strict";

  const terms = {
    rain: {
      longitude: 330, name: "雨水", month: "正月中",
      verse: "随风潜入夜，润物细无声。", poet: "唐·杜甫",
      hou: ["獭祭鱼", "鸿雁来", "草木萌动"],
      palette: [["柳绿","#7BC454"],["天青","#6EB8C4"],["杏红","#EE8478"]],
      paletteNote: "春属木 · 尚青绿",
      summary: "黄经 330° · 冻土化雨、杏花先叶，疏渠蓄墒备春耕。",
      note: "《月令七十二候集解》载：「东风解冻，冰雪皆散而为水，化而为雨。」太阳运行至黄经 330°，江汉气温回升、降水由雪转雨，农人趁土壤解冻清沟理墒，筹备春播。"
    },
    grain: {
      longitude: 75, name: "芒种", month: "五月节",
      verse: "家家麦饭美，处处菱歌长。", poet: "宋·陆游",
      hou: ["螳螂生", "鵙始鸣", "反舌无声"],
      palette: [["竹青","#489A56"],["缥色","#52B8B5"],["麦黄","#EFC562"]],
      paletteNote: "夏属火 · 尚明翠",
      summary: "黄经 75° · 夏麦归晒、浅水插秧，承前启后忙双抢。",
      note: "「有芒之谷可稼种也。」太阳运行至黄经 75°，大麦、小麦等有芒夏熟作物急待收晒，中晚稻等有芒秋熟谷物抢墒移栽，是全年农事承前启后的关键节点。"
    },
    dew: {
      longitude: 195, name: "寒露", month: "九月节",
      verse: "寒露惊秋晚，朝看菊渐黄。", poet: "唐·元稹",
      hou: ["鸿雁来宾", "雀入大水为蛤", "菊有黄华"],
      palette: [["秋香","#C8A642"],["酡颜","#D65A44"],["黛蓝","#385A7C"]],
      paletteNote: "秋属金 · 尚丹金",
      summary: "黄经 195° · 露寒欲凝、断水晒田，晚稻完熟待开镰。",
      note: "「露气寒冷，将凝结也。」太阳运行至黄经 195°，夜间地面辐射降温加剧，露水寒重将凝为霜；江汉晚稻开闸断水晒田，赶在初霜前灌浆完熟。"
    },
    winter: {
      longitude: 240, name: "小雪", month: "十月中",
      verse: "晚来天欲雪，能饮一杯无。", poet: "唐·白居易",
      hou: ["虹藏不见", "天气上升地气下降", "闭塞而成冬"],
      palette: [["霜色","#EDF5F8"],["月白","#BCD8E8"],["玄青","#2C4866"]],
      paletteNote: "冬属水 · 尚玄素",
      summary: "黄经 240° · 初雪未盛、水田休耕，霜打冬菜转冬藏。",
      note: "「气寒而将雪矣，地寒未甚而雪未大也。」太阳运行至黄经 240°，冷空气频频南下初降小雪，水田留茬养地，耐寒冬菜经霜增甜，农事正式转入冬藏。"
    }
  };
  const canvas = document.querySelector("#yard");
  const sundial = document.querySelector("#sundial");
  const shadowReadout = document.querySelector("#shadow-ratio");
  const shadowLatitude = document.querySelector("#shadow-latitude");
  const buttons = Array.from(document.querySelectorAll(".term"));
  const yardLinks = Array.from(document.querySelectorAll(".yard-links button"));
  const ruler = document.querySelector("#terms");
  const rulerWindow = document.querySelector(".ruler-window");
  const rulerCursor = document.querySelector(".ruler-cursor");
  const number = document.querySelector("#term-number");
  const marks = Array.from(ruler.children);
  const stops = buttons.map(button => marks.indexOf(button));
  const note = document.querySelector("#term-note");
  const summary = document.querySelector("#term-summary");
  const guide = document.querySelector("#season-guide");
  const guideMeta = document.querySelector("#guide-meta");
  const guideTerm = document.querySelector("#guide-term");
  const guideVerse = document.querySelector("#guide-verse");
  const houNodes = ["#hou-1","#hou-2","#hou-3"].map(selector => document.querySelector(selector));
  const paletteCaption = document.querySelector("#palette-caption");
  const openGuide = document.querySelector("#open-guide");
  const exhibit = document.querySelector(".exhibit");
  const hudToggle = document.querySelector("#hud-toggle");
  const hotspotLayer = document.querySelector("#yard-hotspots");
  const poleOutline = document.querySelector("#gnomon-outline");
  const poleOutlineEdge = document.querySelector("#gnomon-outline-edge");
  const poleMeasure = document.querySelector("#gnomon-measure");
  const poleMeasureLabel = document.querySelector("#gnomon-measure-label");
  const poleTarget = document.querySelector("#gnomon-target");
  const poleInspection = document.querySelector("#gnomon-inspect");
  const poleLongitude = document.querySelector("#gnomon-longitude");
  const poleReading = document.querySelector("#gnomon-length");
  const poleAltitude = document.querySelector("#gnomon-altitude");
  const poleDeclination = document.querySelector("#gnomon-declination");
  const poleReturn = document.querySelector("#gnomon-return");
  const gnomonTermButtons = Array.from(document.querySelectorAll("[data-gnomon-term]"));
  const gnomonToggle = document.querySelector("#toggle-gnomon");
  const interlude = document.querySelector("#season-interlude");
  const interludeText = document.querySelector(".interlude-text");
  const interludeName = document.querySelector("#interlude-name");
  const interludeEnglish = document.querySelector("#interlude-english");
  const interludeLongitude = document.querySelector("#interlude-longitude");
  const interludeVerse = document.querySelector("#interlude-verse");
  const dialRotor = document.querySelector("#dial-rotor");
  const dialFans = document.querySelector("#dial-fans");
  const swatches = document.querySelectorAll(".swatches li");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const degrees = Math.PI / 180;
  const dialStep = 360 / marks.length;
  const dialRadius = 166;
  const halfYear = marks.length / 2;
  const dialNames = marks.map(mark => (mark.querySelector(".term-name") || mark).textContent);
  const fanStart = dialNames.indexOf("小满");

  function dialPoint(index, radius) {
    const angle = index * dialStep * degrees;
    return [Math.sin(angle) * radius, -Math.cos(angle) * radius].map(value => Math.round(value * 100) / 100);
  }

  function svgElement(tag, attributes) {
    const element = document.createElementNS("http://www.w3.org/2000/svg",tag);
    for (const [name,value] of Object.entries(attributes)) element.setAttribute(name,value);
    return element;
  }

  // Draw two opposite fans, anchored by 小满 (60°) and 小雪 (240°).
  // Each dot lies on a 15° spoke, at its intersection with the corresponding fan chord.
  // A 10° offset on the rim separates the two sets of lines and sets the shape of the arcs.
  const fanOffset = 10 / dialStep;
  function fanRadius(offset) {
    const chordAngle = (offset + fanOffset) * dialStep * degrees / 2;
    const spokeAngle = offset * dialStep * degrees;
    return dialRadius * Math.cos(chordAngle) / Math.cos(spokeAngle - chordAngle);
  }

  const diameters = [];
  for (let index = 0; index < halfYear; index++) {
    diameters.push(`M${dialPoint(index,dialRadius).join(" ")} L${dialPoint(index + halfYear,dialRadius).join(" ")}`);
  }
  document.querySelector("#dial-diameters").setAttribute("d",diameters.join(" "));

  for (const [half,anchor] of [fanStart,fanStart + halfYear].entries()) {
    const origin = dialPoint(anchor,dialRadius).join(" ");
    const chords = [];
    const curve = [];
    for (let offset = 0; offset < halfYear; offset++) {
      const rim = dialPoint(anchor + offset + fanOffset,dialRadius).join(" ");
      chords.push(`M${origin} L${rim}`);
    }
    for (let offset = 0; offset <= halfYear - 1; offset += .125) {
      curve.push(dialPoint(anchor + offset,fanRadius(offset)).join(","));
    }
    const fan = svgElement("g",{class:half ? "dial-fan dial-fan-cool" : "dial-fan"});
    fan.append(
      svgElement("path",{d:chords.join(" "),class:"dial-chords"}),
      svgElement("polyline",{points:curve.join(" "),class:"dial-arc"})
    );
    dialFans.append(fan);
  }

  const dialLabels = [];
  const dialMarks = dialNames.map((termName,index) => {
    const featured = stops.includes(index);
    const principal = index % 2 === 1;
    const fanOffsetIndex = (index - fanStart + marks.length) % halfYear;
    const offsetRadius = fanRadius(fanOffsetIndex);
    const [innerX,innerY] = dialPoint(index,featured ? 158 : 162);
    const [outerX,outerY] = dialPoint(index,172);
    const [x,y] = dialPoint(index,offsetRadius);
    const label = svgElement("g",{transform:`translate(${dialPoint(index,192).join(" ")})`});
    const name = svgElement("text",{class:"dial-label"});
    name.textContent = termName;
    label.append(name);
    dialLabels.push(name);

    const group = svgElement("g",{class:"dial-mark"});
    group.classList.toggle("dial-featured",featured);
    group.classList.toggle("dial-principal",principal);
    group.classList.toggle("dial-anchor",fanOffsetIndex === 0);
    group.append(
      svgElement("path",{d:`M${innerX} ${innerY} L${outerX} ${outerY}`,class:"dial-tick"}),
      svgElement("path",{d:`M${x} ${y} L${innerX} ${innerY}`,class:"dial-track"}),
      svgElement("circle",{cx:x,cy:y,r:fanOffsetIndex === 0 ? 5.1 : 3.6,class:"dial-node"}),
      label
    );
    dialRotor.append(group);
    return group;
  });

  // Reference latitude represents the central Jianghan Plain.
  const latitude = 30.4 * degrees;
  let scene;
  try {
    scene = new window.YardScene(canvas,document.querySelector("#yard-compatibility"),
      document.querySelector("#plinth-shadow"),document.querySelector("#farmer-atlas"));
  } catch (error) {
    console.error(error);
    document.querySelector("#renderer-message").hidden = false;
    document.querySelector(".view-controls").hidden = true;
  }

  // —— 矢量化平滑轮廓：从投影三角面提取有序闭合边界并做道格拉斯-普克简化，消除阶梯锯齿 ——
  function simplifyPolyline(pts, epsilon) {
    if (pts.length <= 2) return pts;
    const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
    const dx = bx - ax, dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    let maxDistSq = -1, split = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const [px, py] = pts[i];
      let distSq;
      if (lenSq < 1e-6) {
        distSq = (px - ax) * (px - ax) + (py - ay) * (py - ay);
      } else {
        const cross = (px - ax) * dy - (py - ay) * dx;
        distSq = (cross * cross) / lenSq;
      }
      if (distSq > maxDistSq) { maxDistSq = distSq; split = i; }
    }
    if (maxDistSq > epsilon * epsilon) {
      const left = simplifyPolyline(pts.slice(0, split + 1), epsilon);
      const right = simplifyPolyline(pts.slice(split), epsilon);
      return left.slice(0, -1).concat(right);
    }
    return [pts[0], pts[pts.length - 1]];
  }

  function simplifyClosedLoop(pts, epsilon) {
    if (pts.length <= 4) return pts;
    let cx = 0, cy = 0;
    for (const [x, y] of pts) { cx += x; cy += y; }
    cx /= pts.length; cy /= pts.length;
    let a = 0, bestA = -1;
    for (let i = 0; i < pts.length; i++) {
      const d = (pts[i][0] - cx) ** 2 + (pts[i][1] - cy) ** 2;
      if (d > bestA) { bestA = d; a = i; }
    }
    let b = a, bestB = -1;
    for (let i = 0; i < pts.length; i++) {
      const d = (pts[i][0] - pts[a][0]) ** 2 + (pts[i][1] - pts[a][1]) ** 2;
      if (d > bestB) { bestB = d; b = i; }
    }
    if (a === b) return pts;
    if (a > b) [a, b] = [b, a];
    const first = simplifyPolyline(pts.slice(a, b + 1), epsilon);
    const second = simplifyPolyline(pts.slice(b).concat(pts.slice(0, a + 1)), epsilon);
    return first.slice(0, -1).concat(second.slice(0, -1));
  }

  function polygonArea(pts) {
    let area = 0;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      area += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]);
    }
    return Math.abs(area) * .5;
  }

  function silhouettePath(flat, cell = 1.0, epsilon = 1.4) {
    if (!flat || flat.length < 6) return "";
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    for (let i = 0; i < flat.length; i += 2) {
      const x = flat[i], y = flat[i + 1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const spanW = Math.max(1, maxX - minX);
    const spanH = Math.max(1, maxY - minY);
    const step = Math.max(cell, Math.sqrt((spanW * spanH) / 220000));
    const w = Math.max(1, Math.ceil(spanW / step) + 3);
    const h = Math.max(1, Math.ceil(spanH / step) + 3);
    const grid = new Uint8Array(w * h);

    for (let t = 0; t < flat.length; t += 6) {
      const ax = (flat[t] - minX) / step + 1, ay = (flat[t + 1] - minY) / step + 1;
      const bx = (flat[t + 2] - minX) / step + 1, by = (flat[t + 3] - minY) / step + 1;
      const cx = (flat[t + 4] - minX) / step + 1, cy = (flat[t + 5] - minY) / step + 1;
      const top = Math.max(0, Math.floor(Math.min(ay, by, cy)));
      const bottom = Math.min(h - 1, Math.ceil(Math.max(ay, by, cy)));
      for (let row = top; row <= bottom; row++) {
        const sy = row + .5;
        let xMin = 1e9, xMax = -1e9, hits = 0;
        const testEdge = (x1, y1, x2, y2) => {
          if ((y1 <= sy && y2 > sy) || (y2 <= sy && y1 > sy)) {
            const x = x1 + (sy - y1) / (y2 - y1) * (x2 - x1);
            if (x < xMin) xMin = x;
            if (x > xMax) xMax = x;
            hits++;
          }
        };
        testEdge(ax, ay, bx, by);
        testEdge(bx, by, cx, cy);
        testEdge(cx, cy, ax, ay);
        if (hits < 2) continue;
        let lo = Math.max(0, Math.ceil(xMin - .5));
        let hi = Math.min(w - 1, Math.floor(xMax - .5));
        if (lo > hi) {
          const mid = Math.max(0, Math.min(w - 1, Math.round((xMin + xMax) * .5 - .5)));
          lo = hi = mid;
        }
        const offset = row * w;
        for (let col = lo; col <= hi; col++) grid[offset + col] = 1;
      }
    }

    const at = (col, row) => (col < 0 || row < 0 || col >= w || row >= h) ? 0 : grid[row * w + col];
    const stride = w + 1;
    const outEdges = new Map();
    const allEdges = [];
    const addEdge = (x1, y1, x2, y2, dir) => {
      const from = y1 * stride + x1;
      const edge = { from, to: y2 * stride + x2, x: x1, y: y1, dir, used: false };
      allEdges.push(edge);
      let list = outEdges.get(from);
      if (!list) { list = []; outEdges.set(from, list); }
      list.push(edge);
    };

    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        if (!at(col, row)) continue;
        if (!at(col, row - 1)) addEdge(col, row, col + 1, row, 0);
        if (!at(col + 1, row)) addEdge(col + 1, row, col + 1, row + 1, 1);
        if (!at(col, row + 1)) addEdge(col + 1, row + 1, col, row + 1, 2);
        if (!at(col - 1, row)) addEdge(col, row + 1, col, row, 3);
      }
    }
    if (!allEdges.length) return "";

    const loops = [];
    const maxSteps = allEdges.length + 2;
    for (const startEdge of allEdges) {
      if (startEdge.used) continue;
      const raw = [];
      let edge = startEdge;
      let prevDir = -1;
      let steps = 0;
      while (edge && !edge.used && steps++ < maxSteps) {
        edge.used = true;
        if (edge.dir !== prevDir) {
          raw.push([minX + (edge.x - 1) * step, minY + (edge.y - 1) * step]);
          prevDir = edge.dir;
        }
        const nextList = outEdges.get(edge.to);
        if (!nextList) break;
        const preferred = [(edge.dir + 1) & 3, edge.dir, (edge.dir + 3) & 3, (edge.dir + 2) & 3];
        let next = null;
        for (const want of preferred) {
          next = nextList.find(candidate => !candidate.used && candidate.dir === want);
          if (next) break;
        }
        edge = next;
      }
      if (raw.length >= 3) loops.push({ pts: raw, area: polygonArea(raw) });
    }
    if (!loops.length) return "";

    const minArea = 7 * step * step;
    let kept = loops.filter(loop => loop.area >= minArea);
    if (!kept.length) {
      loops.sort((a, b) => b.area - a.area);
      kept = [loops[0]];
    }

    const tol = Math.max(epsilon, step * 1.15);
    let path = "";
    for (const loop of kept) {
      const simplified = simplifyClosedLoop(loop.pts, tol);
      if (simplified.length < 3) continue;
      path += `M${simplified[0][0].toFixed(1)} ${simplified[0][1].toFixed(1)}`;
      for (let i = 1; i < simplified.length; i++) {
        path += `L${simplified[i][0].toFixed(1)} ${simplified[i][1].toFixed(1)}`;
      }
      path += "Z";
    }
    return path;
  }

  // —— 门口食桌：悬停描边，展示节令食材与物候成因 ——
  const FOOD = {
    rain:   { name: "艾草青团", note: "雨水后田埂嫩艾萌发，采鲜叶焯水捣汁拌糯米粉蒸熟。艾草富含挥发油可温散春寒湿气，是顺应春生节律的时令食俗。" },
    grain:  { name: "箬叶热粽", note: "芒种与端午相连，新麦初收、箬叶清香宽韧。以箬叶紧裹糯米慢煮，耐贮且热量充沛，恰为「双抢」重体力农忙补充能量。" },
    dew:    { name: "米缸焐柿", note: "寒露柿果红熟，生柿因含可溶性单宁而味涩；埋入米缸借谷物呼吸释放乙烯加速脱涩软化，霜降前启封即清甜无涩。" },
    winter: { name: "手工糍粑", note: "晚稻归仓后取新糯米蒸熟，入石臼趁热舂捣成韧团。质地致密耐贮，炭火慢煨后外焦内糯，为江汉冬日御寒主食。" }
  };
  const foodLayer = document.querySelector("#food-hotspots");
  const foodOutline = document.querySelector("#food-outline");
  const foodOutlineEdge = document.querySelector("#food-outline-edge");
  const foodTarget = document.querySelector("#food-target");
  const foodPanel = document.querySelector("#food-inspect");
  const foodKicker = document.querySelector("#food-kicker");
  const foodName = document.querySelector("#food-name");
  const foodNote = document.querySelector("#food-note");

  // —— 田里的庄稼：整片合一描边 → 拉近 → 物候与农理 ——
  const CROP = {
    rain:   { title: "杏花候时", name: "先花后叶", note: "杏树对初春积温回升极为敏感，花朵先于叶片开放。传统农事以杏花盛谢作为地温稳定回暖的物候信标，据此安排整地育秧。" },
    grain:  { title: "芒种秧畦", name: "浅水护秧", note: "中稻移栽采用宽行窄株以利采光通风，三五苗并作一蔸。田面留一寸浅水可昼吸热、夜保温，促使秧苗快速返青扎根。" },
    dew:    { title: "寒露晚稻", name: "断水促熟", note: "晚稻进入完熟期须提前开闸断水晒田，降低土壤湿度以防贪青倒伏，并借寒露拉大的昼夜温差加速谷粒淀粉灌浆。" },
    winter: { title: "霜打冬菜", name: "抗寒增甜", note: "水田留稻桩冬闲养地，田畔青菜与油菜苗在霜雪低温下将体内部分淀粉水解为葡萄糖以防冻害，故霜后冬菜格外清甜。" }
  };
  const cropLayer = document.querySelector("#crop-hotspots");
  const cropOutlines = document.querySelector("#crop-outlines");
  const cropTarget = document.querySelector("#crop-target");
  const cropPanel = document.querySelector("#crop-inspect");
  const cropHeading = document.querySelector("#crop-heading");
  const cropKicker = document.querySelector("#crop-kicker");
  const cropName = document.querySelector("#crop-name");
  const cropNote = document.querySelector("#crop-note");

  // —— 门口的镰刀：描边 → 拉近 → 成片开镰收割 ——
  const sickleLayer = document.querySelector("#sickle-hotspots");
  const sickleOutline = document.querySelector("#sickle-outline");
  const sickleOutlineEdge = document.querySelector("#sickle-outline-edge");
  const sickleTarget = document.querySelector("#sickle-target");
  const sicklePanel = document.querySelector("#sickle-inspect");
  const harvestButton = document.querySelector("#harvest-start");
  const harvestBar = document.querySelector("#harvest-bar");
  const harvestStatus = document.querySelector("#harvest-status");
  const harvestExit = document.querySelector("#harvest-exit");

  // —— 火塘：描边 → 拉近 → 烤糍粑 ——
  const fireLayer = document.querySelector("#fire-hotspots");
  const fireOutline = document.querySelector("#fire-outline");
  const fireOutlineEdge = document.querySelector("#fire-outline-edge");
  const fireTarget = document.querySelector("#fire-target");
  const firePanel = document.querySelector("#fire-inspect");
  const roastButton = document.querySelector("#roast-start");
  const soundToggle = document.querySelector("#sound-toggle");
  const audioPopover = document.querySelector("#audio-popover");
  const audioMute = document.querySelector("#audio-mute");
  const volMaster = document.querySelector("#vol-master");
  const volBgm = document.querySelector("#vol-bgm");
  const volAmbience = document.querySelector("#vol-ambience");
  const volMasterVal = document.querySelector("#vol-master-val");
  const volBgmVal = document.querySelector("#vol-bgm-val");
  const volAmbienceVal = document.querySelector("#vol-ambience-val");
  let soundscape = null;

  let cropHulls = [];

  function pointInHull(px, py, hull) {
    if (!hull || hull.length < 3) return false;
    let inside = false;
    for (let i = 0, j = hull.length - 1; i < hull.length; j = i++) {
      const [xi, yi] = hull[i], [xj, yj] = hull[j];
      if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  function hitsCrop(event) {
    if (document.body.classList.contains("harvest-mode")) return false;
    if (cropPanel && !cropPanel.hidden) return false;
    if (exhibit.classList.contains("hud-hidden")) return false;
    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left, py = event.clientY - rect.top;
    return cropHulls.some(hull => pointInHull(px, py, hull));
  }

  function updatePoleProjection(projection) {
    hotspotLayer.toggleAttribute("hidden",!projection);
    poleTarget.hidden = !projection;
    if (!projection) {
      canvas.classList.remove("gnomon-hover");
      return;
    }
    const {outline,shadow:[[ax,ay],[bx,by]]}=projection;
    const outlinePoints=outline.map(point=>point.join(",")).join(" ");
    poleOutlineEdge.setAttribute("points",outlinePoints);
    poleOutline.setAttribute("points",outlinePoints);
    const dx=bx-ax, dy=by-ay, length=Math.hypot(dx,dy)||1;
    const tx=-dy/length*4, ty=dx/length*4;
    poleMeasure.setAttribute("d",
      `M${ax},${ay}L${bx},${by}M${ax-tx},${ay-ty}L${ax+tx},${ay+ty}M${bx-tx},${by-ty}L${bx+tx},${by+ty}`);
    if (poleMeasureLabel) {
      const mx = (ax + bx) * .5 + tx * 2.8;
      const my = (ay + by) * .5 + ty * 2.8 - 4;
      poleMeasureLabel.setAttribute("x", mx.toFixed(1));
      poleMeasureLabel.setAttribute("y", my.toFixed(1));
    }
    const xs=outline.map(([x])=>x), ys=outline.map(([,y])=>y);
    const left=Math.min(...xs), top=Math.min(...ys);
    Object.assign(poleTarget.style,{
      left:(canvas.offsetLeft+left-10)+"px", top:(canvas.offsetTop+top-8)+"px",
      width:(Math.max(...xs)-left+20)+"px", height:(Math.max(...ys)-top+16)+"px"
    });
  }

  function updateFoodProjection(projection) {
    if (!projection) {
      foodLayer.toggleAttribute("hidden", true);
      if (foodTarget) foodTarget.hidden = true;
      return;
    }
    const silhouette = silhouettePath(scene?.foodSilhouette(), 1.0, 1.45);
    if (silhouette) {
      foodOutline.setAttribute("d", silhouette);
      foodOutlineEdge.setAttribute("d", silhouette);
    }
    foodLayer.toggleAttribute("hidden", false);
    const xs = projection.outline.map(([x]) => x);
    const ys = projection.outline.map(([, y]) => y);
    const left = Math.min(...xs), top = Math.min(...ys);
    if (foodTarget) {
      foodTarget.hidden = false;
      Object.assign(foodTarget.style, {
        left: (canvas.offsetLeft + left - 8) + "px",
        top: (canvas.offsetTop + top - 6) + "px",
        width: (Math.max(...xs) - left + 16) + "px",
        height: (Math.max(...ys) - top + 12) + "px"
      });
    }
  }

  function updateCropProjection(projection) {
    if (document.body.classList.contains("harvest-mode") || !projection) {
      cropOutlines.textContent = "";
      cropLayer.toggleAttribute("hidden", true);
      if (cropTarget) cropTarget.hidden = true;
      cropHulls = [];
      canvas.classList.remove("crop-hover");
      return;
    }
    cropHulls = [];
    cropOutlines.textContent = "";
    if (document.body.dataset.season === "rain") {
      const silhouette = silhouettePath(scene?.treeSilhouette(), 1.2, 1.55);
      if (silhouette) {
        for (const className of ["crop-edge", "crop-line"]) {
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", silhouette);
          path.setAttribute("class", className);
          cropOutlines.appendChild(path);
        }
      }
      cropHulls = projection.items;
    } else {
      for (const item of projection.items) {
        cropHulls.push(item);
        const points = item.map(point => point.join(",")).join(" ");
        for (const className of ["crop-edge", "crop-line"]) {
          const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
          polygon.setAttribute("points", points);
          polygon.setAttribute("class", className);
          cropOutlines.appendChild(polygon);
        }
      }
    }
    cropLayer.toggleAttribute("hidden", false);
    const bounds = projection.all;
    const xs = bounds.map(([x]) => x);
    const ys = bounds.map(([, y]) => y);
    const left = Math.min(...xs), top = Math.min(...ys);
    if (cropTarget) {
      cropTarget.hidden = false;
      Object.assign(cropTarget.style, {
        left: (canvas.offsetLeft + left - 6) + "px",
        top: (canvas.offsetTop + top - 6) + "px",
        width: (Math.max(...xs) - left + 12) + "px",
        height: (Math.max(...ys) - top + 12) + "px"
      });
    }
  }

  function updateSickleProjection(projection) {
    if (!sickleLayer) return;
    if (!projection || document.body.classList.contains("harvest-mode")) {
      sickleLayer.toggleAttribute("hidden", true);
      if (sickleTarget) sickleTarget.hidden = true;
      return;
    }
    const silhouette = silhouettePath(scene?.sickleSilhouette(), 1.0, 1.15);
    if (silhouette) {
      sickleOutline.setAttribute("d", silhouette);
      sickleOutlineEdge.setAttribute("d", silhouette);
    }
    sickleLayer.toggleAttribute("hidden", false);
    const xs = projection.outline.map(([x]) => x);
    const ys = projection.outline.map(([, y]) => y);
    const left = Math.min(...xs), top = Math.min(...ys);
    if (sickleTarget) {
      sickleTarget.hidden = false;
      Object.assign(sickleTarget.style, {
        left: (canvas.offsetLeft + left - 10) + "px",
        top: (canvas.offsetTop + top - 8) + "px",
        width: (Math.max(...xs) - left + 20) + "px",
        height: (Math.max(...ys) - top + 16) + "px"
      });
    }
  }

  function updateFireProjection(projection) {
    if (!fireLayer) return;
    if (!projection) {
      fireLayer.toggleAttribute("hidden", true);
      if (fireTarget) fireTarget.hidden = true;
      return;
    }
    const silhouette = silhouettePath(scene?.fireSilhouette(), 1.0, 1.25);
    if (silhouette) {
      fireOutline.setAttribute("d", silhouette);
      fireOutlineEdge.setAttribute("d", silhouette);
    }
    fireLayer.toggleAttribute("hidden", false);
    const xs = projection.outline.map(([x]) => x);
    const ys = projection.outline.map(([, y]) => y);
    const left = Math.min(...xs), top = Math.min(...ys);
    if (fireTarget) {
      fireTarget.hidden = false;
      Object.assign(fireTarget.style, {
        left: (canvas.offsetLeft + left - 12) + "px",
        top: (canvas.offsetTop + top - 10) + "px",
        width: (Math.max(...xs) - left + 24) + "px",
        height: (Math.max(...ys) - top + 20) + "px"
      });
    }
  }

  function fillFood() {
    const key = document.body.dataset.season;
    const food = FOOD[key];
    if (!food) return;
    const term = terms[key];
    foodKicker.textContent = (term ? term.name : "时令") + " · 案上食";
    foodName.textContent = food.name;
    foodNote.textContent = food.note;
  }

  function fillCrop() {
    const key = document.body.dataset.season;
    const crop = CROP[key];
    if (!crop) return;
    if (cropHeading) cropHeading.textContent = crop.title;
    const term = terms[key];
    cropKicker.textContent = (term ? term.name : "时令") + " · 田间候";
    cropName.textContent = crop.name;
    cropNote.textContent = crop.note;
  }

  function syncRoastButton(roasted = 0, total = 3) {
    if (!roastButton) return;
    if (roasted >= total) {
      roastButton.textContent = "三块糍粑已上灶";
      roastButton.disabled = true;
    } else if (roasted > 0) {
      roastButton.textContent = `再烤一块（${roasted}/${total}）`;
      roastButton.disabled = false;
    } else {
      roastButton.textContent = "搁一块糍粑";
      roastButton.disabled = false;
    }
  }

  function updateHarvestBar() {
    if (!harvestBar || !harvestStatus) return;
    const on = document.body.classList.contains("harvest-mode");
    harvestBar.hidden = !on;
    if (!on) return;
    const stats = scene?.harvestStats ? scene.harvestStats() : { harvested: 0, total: 0 };
    if (stats.total > 0 && stats.harvested >= stats.total) {
      harvestStatus.textContent = `秋稻已满仓（${stats.harvested}/${stats.total}）`;
    } else if (stats.harvested > 0) {
      harvestStatus.textContent = `开镰收割 · 已收 ${stats.harvested}/${stats.total} · 点击稻田成片收割`;
    } else {
      harvestStatus.textContent = "开镰收割 · 点击稻田成片收割";
    }
  }

  function setHarvestMode(on) {
    const active = Boolean(on) && document.body.dataset.season === "dew";
    document.body.classList.toggle("harvest-mode", active);
    scene?.setHarvestMode(active);
    updateHarvestBar();
    if (active) {
      cropOutlines.textContent = "";
      cropLayer.toggleAttribute("hidden", true);
      if (cropTarget) cropTarget.hidden = true;
      cropHulls = [];
      canvas.classList.remove("crop-hover");
      updateSickleProjection(null);
    } else if (scene) {
      updateSickleProjection(scene.sickleProjection());
      updateCropProjection(scene.cropProjection());
    }
  }

  function closeFood(releaseCamera = true) {
    if (!foodPanel || foodPanel.hidden) return;
    foodPanel.hidden = true;
    foodTarget?.setAttribute("aria-expanded", "false");
    exhibit.classList.remove("food-focused");
    if (releaseCamera) scene?.releaseFood();
  }

  function closeCrop(releaseCamera = true) {
    if (!cropPanel || cropPanel.hidden) return;
    cropPanel.hidden = true;
    cropTarget?.setAttribute("aria-expanded", "false");
    exhibit.classList.remove("crop-focused");
    if (releaseCamera) scene?.releaseCrop();
  }

  function closeSickle(releaseCamera = true) {
    if (!sicklePanel || sicklePanel.hidden) return;
    sicklePanel.hidden = true;
    sickleTarget?.setAttribute("aria-expanded", "false");
    exhibit.classList.remove("sickle-focused");
    if (releaseCamera) scene?.releaseSickle();
  }

  function closeFire(releaseCamera = true) {
    if (!firePanel || firePanel.hidden) return;
    firePanel.hidden = true;
    fireTarget?.setAttribute("aria-expanded", "false");
    exhibit.classList.remove("fire-focused");
    if (releaseCamera) scene?.releaseFire();
  }

  function closePoleInspection(releaseCamera = true) {
    if (!poleInspection || poleInspection.hidden) return;
    poleInspection.hidden = true;
    poleTarget.setAttribute("aria-expanded", "false");
    gnomonToggle?.setAttribute("aria-pressed", "false");
    exhibit.classList.remove("gnomon-focused");
    if (releaseCamera) {
      scene?.releaseGnomon();
      canvas.focus({preventScroll:true});
    }
  }

  function closeAudioPopover() {
    if (!audioPopover || audioPopover.hidden) return;
    audioPopover.hidden = true;
    soundToggle?.setAttribute("aria-expanded", "false");
  }

  function exitAllModes({ releaseCamera = true, keepGnomon = false } = {}) {
    if (document.body.classList.contains("harvest-mode")) setHarvestMode(false);
    if (guide && guide.open) guide.close();
    closeAudioPopover();
    closeFood(releaseCamera);
    closeCrop(releaseCamera);
    closeSickle(releaseCamera);
    closeFire(releaseCamera);
    if (!keepGnomon) closePoleInspection(releaseCamera);
  }

  function openFood() {
    if (!foodPanel) return;
    exitAllModes({ releaseCamera: false });
    fillFood();
    foodPanel.hidden = false;
    foodTarget.setAttribute("aria-expanded", "true");
    exhibit.classList.add("food-focused");
    scene?.focusFood();
    soundscape?.playSfx("panel");
  }

  function openCrop() {
    if (!cropPanel) return;
    exitAllModes({ releaseCamera: false });
    fillCrop();
    cropPanel.hidden = false;
    cropTarget.setAttribute("aria-expanded", "true");
    exhibit.classList.add("crop-focused");
    scene?.focusCrop();
    soundscape?.playSfx("panel");
  }

  function openSickle() {
    if (!sicklePanel) return;
    exitAllModes({ releaseCamera: false });
    sicklePanel.hidden = false;
    if (harvestButton) harvestButton.textContent = "下田开镰";
    sickleTarget.setAttribute("aria-expanded", "true");
    exhibit.classList.add("sickle-focused");
    scene?.focusSickle();
    soundscape?.playSfx("panel");
  }

  function openFire() {
    if (!firePanel) return;
    exitAllModes({ releaseCamera: false });
    firePanel.hidden = false;
    fireTarget.setAttribute("aria-expanded", "true");
    exhibit.classList.add("fire-focused");
    scene?.focusFire();
    soundscape?.playSfx("panel");
  }

  function openPoleInspection() {
    if (!poleInspection || !poleInspection.hidden) return;
    exitAllModes({ releaseCamera: false });
    poleInspection.hidden = false;
    poleTarget.setAttribute("aria-expanded", "true");
    gnomonToggle?.setAttribute("aria-pressed", "true");
    exhibit.classList.add("gnomon-focused");
    canvas.classList.remove("gnomon-hover");
    scene?.focusGnomon();
    soundscape?.playSfx("panel");
    poleReturn.focus({preventScroll:true});
  }

  function showTerm(key, { keepGnomon = false } = {}) {
    const term = terms[key];
    if (!term) return;
    exitAllModes({ releaseCamera: !keepGnomon, keepGnomon });
    const declination = Math.asin(Math.sin(23.44 * degrees) * Math.sin(term.longitude * degrees));
    const altitude = Math.PI / 2 - Math.abs(latitude - declination);
    const shadowRatio = 1 / Math.tan(altitude);
    const diagramHeight = 23;
    const sunDistance = 44;
    const sunX = 32 - Math.cos(altitude) * sunDistance;
    const sunY = 62 - Math.sin(altitude) * sunDistance;
    const rayX = sunX - 32;
    const rayY = sunY - 38;
    sundial.style.setProperty("--shadow-length", diagramHeight * shadowRatio + "px");
    sundial.style.setProperty("--sun-position", sunX - 4 + "px");
    sundial.style.setProperty("--sun-height", sunY - 4 + "px");
    sundial.style.setProperty("--ray-length", Math.hypot(rayX,rayY) + "px");
    sundial.style.setProperty("--ray-angle", Math.atan2(rayY,rayX) + "rad");
    const ratio = shadowRatio.toFixed(2);
    const altDeg = (altitude / degrees).toFixed(1);
    const declDeg = declination / degrees;
    const declText = (declDeg >= 0 ? "北纬 " : "南纬 ") + Math.abs(declDeg).toFixed(1) + "°";
    shadowReadout.textContent = ratio + "× 竿高";
    shadowLatitude.textContent = "仰角 " + altDeg + "° · 点击实测";
    if (poleLongitude) poleLongitude.textContent = term.longitude + "°";
    poleReading.textContent = ratio + "× 竿高";
    poleAltitude.textContent = altDeg + "°";
    if (poleDeclination) poleDeclination.textContent = declText;
    if (poleMeasureLabel) poleMeasureLabel.textContent = term.name + "表影 " + ratio + "×竿高";
    for (const button of gnomonTermButtons) {
      if (button.dataset.gnomonTerm === key) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    }
    sundial.setAttribute("aria-label", term.name + "正午日影，约为竿高的 " + ratio + " 倍，太阳仰角 " + altDeg + " 度");
    document.body.dataset.season = key;
    note.textContent = term.note;
    summary.textContent = term.summary;
    guideMeta.textContent = "· 太阳黄经 " + term.longitude + "° · " + term.month;
    guideTerm.textContent = term.name;
    guideVerse.textContent = "「" + term.verse + "」—— " + term.poet;
    for (const [i,el] of houNodes.entries()) el.textContent = term.hou[i];
    paletteCaption.textContent = term.paletteNote;
    for (const [i,swatch] of swatches.entries()) {
      const [name,color] = term.palette[i];
      swatch.style.setProperty("--swatch",color);
      swatch.querySelector("span").textContent = name;
      swatch.title = name + " " + color;
    }
    const stop = stops[buttons.findIndex(button => button.dataset.season === key)];
    number.textContent = String(stop + 1).padStart(2,"0");
    for (const [index,mark] of dialMarks.entries()) mark.classList.toggle("dial-current",index === stop);
    for (const button of [...buttons,...yardLinks]) {
      if ((button.dataset.season || button.dataset.yard) === key) button.setAttribute("aria-current","true");
      else button.removeAttribute("aria-current");
    }
    syncRoastButton(0, 3);
    scene?.useTerm(key, shadowRatio);
    soundscape?.setSeason(key);
  }

  function toggleHud() {
    const hidden = exhibit.classList.toggle("hud-hidden");
    if (hidden) exitAllModes({ releaseCamera: true });
    hudToggle.setAttribute("aria-pressed",String(hidden));
    hudToggle.title = hidden ? "显示界面" : "隐藏界面";
  }

  function clickedInside(element,event) {
    const {left,right,top,bottom} = element.getBoundingClientRect();
    return event.clientX >= left && event.clientX <= right && event.clientY >= top && event.clientY <= bottom;
  }

  hudToggle.addEventListener("click",toggleHud);
  openGuide.addEventListener("click",() => {
    exitAllModes({ releaseCamera: true });
    soundscape?.playSfx("panel");
    guide.showModal();
  });
  sundial?.addEventListener("click", () => {
    if (guide.open) guide.close();
    openPoleInspection();
  });
  sundial?.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (guide.open) guide.close();
      openPoleInspection();
    }
  });
  guide.addEventListener("click",event => {
    if (event.target !== guide || clickedInside(guide,event)) return;
    if (clickedInside(hudToggle,event)) {
      toggleHud();
      hudToggle.focus({preventScroll:true});
    } else {
      guide.close();
    }
  });

  let targetIndex = buttons.findIndex(button => button.getAttribute("aria-current") === "true");
  if (targetIndex < 0) targetIndex = 1;
  let dialAngle = -stops[targetIndex] * dialStep;
  let dialRaf = 0;

  function applyDialAngle(deg) {
    dialAngle = deg;
    const rounded = Math.round(deg * 1000) / 1000;
    const counter = -rounded;
    interlude.style.setProperty("--dial-angle", rounded + "deg");
    dialRotor.setAttribute("transform", `rotate(${rounded})`);
    for (const label of dialLabels) {
      label.setAttribute("transform", `rotate(${counter})`);
    }
  }

  function shortestDialTarget(currentDeg, stopIndex) {
    const raw = -stopIndex * dialStep;
    let delta = ((raw - currentDeg) % 360 + 540) % 360 - 180;
    if (delta === -180) delta = 180;
    return currentDeg + delta;
  }

  function stopDialAnimation() {
    if (dialRaf) {
      cancelAnimationFrame(dialRaf);
      dialRaf = 0;
    }
  }

  function animateDialTo(stopIndex, duration) {
    stopDialAnimation();
    const startDeg = dialAngle;
    const endDeg = shortestDialTarget(startDeg, stopIndex);
    if (reduceMotion.matches || Math.abs(endDeg - startDeg) < .05 || typeof requestAnimationFrame !== "function") {
      applyDialAngle(endDeg);
      return;
    }
    const startAt = performance.now();
    const step = now => {
      const elapsed = Math.max(0, now - startAt);
      const t = Math.min(1, elapsed / duration);
      // 五次 S 曲线：首尾速度和加速度均为零，中段集中完成旋转。
      // 保留整段 2310ms 时间轴，直到字幕退场结束才完全落位。
      const ease = t * t * t * (10 + t * (-15 + 6 * t));
      applyDialAngle(startDeg + (endDeg - startDeg) * ease);
      if (t < 1) {
        dialRaf = requestAnimationFrame(step);
      } else {
        dialRaf = 0;
        applyDialAngle(endDeg);
      }
    };
    dialRaf = requestAnimationFrame(step);
  }

  applyDialAngle(dialAngle);

  // 字幕与节气盘共用切换时间轴：入场、场景重建后的观赏停留、同步退场。
  const interludeTiming = { cover: 370, hold: 1380, enter: 600, exit: 560, reveal: 680, easing: "cubic-bezier(.65,0,.35,1)" };
  interlude.style.setProperty("--interlude-exit", `${interludeTiming.exit}ms`);
  interlude.style.setProperty("--interlude-ease", interludeTiming.easing);
  let pendingIndex = null;
  let settleTimer;
  let interludeTimer;
  let textEntry;

  function revealYard() {
    clearTimeout(interludeTimer);
    stopDialAnimation();
    applyDialAngle(shortestDialTarget(dialAngle, stops[targetIndex]));
    textEntry?.cancel();
    interlude.dataset.phase = "";
  }

  function releaseInterlude() {
    clearTimeout(interludeTimer);
    interlude.dataset.phase = "exit";
    interludeTimer = setTimeout(revealYard, interludeTiming.reveal);
  }

  function settleRuler() {
    if (pendingIndex === null) return;
    const index = pendingIndex;
    const button = buttons[index];
    const key = button.dataset.season;
    pendingIndex = null;
    clearTimeout(settleTimer);
    if (document.body.dataset.season !== key) showTerm(key);
    if (reduceMotion.matches || !scene) {
      revealYard();
      return;
    }
    // 幕布淡入完成后才重建场景，但不打断已经开始的节气盘旋转。
    interlude.dataset.phase = "verse";
  }

  function selectTerm(index) {
    // 切换节气（或点击当前节气）时立即收起所有已打开的文字框、节气小志与收割模式
    exitAllModes({ releaseCamera: true });
    if (index === targetIndex) return;
    soundscape?.playSfx("season", buttons[index].dataset.season);
    const button = buttons[index];
    const key = button.dataset.season;
    clearTimeout(settleTimer);
    clearTimeout(interludeTimer);
    stopDialAnimation();
    if (!reduceMotion.matches && scene) {
      const tick = button.getBoundingClientRect();
      const cursor = rulerCursor.getBoundingClientRect();
      // Sample the moving ruler before changing its destination.
      const offset = tick.top + tick.height / 2 - cursor.top - cursor.height / 2;
      const forward = Math.abs(offset) < .5 ? index > targetIndex : offset > 0;
      const term = terms[key];
      const termType = stops[index] % 2 ? "中气" : "节";
      interludeName.textContent = term.name;
      interludeEnglish.textContent = button.querySelector("small").textContent;
      interludeLongitude.textContent = "太阳黄经 " + term.longitude + "° · " + termType;
      interludeVerse.textContent = term.verse;
      interlude.dataset.term = key;
      interlude.dataset.direction = forward ? "forward" : "backward";
      interlude.dataset.phase = "cover";
      textEntry?.cancel();
      textEntry = interludeText.animate(
        [{opacity:0,transform:"translateY(var(--travel))"},{opacity:1,transform:"translateY(0)"}],
        {duration:interludeTiming.enter,easing:interludeTiming.easing}
      );
      const exitAt = interludeTiming.cover + interludeTiming.hold;
      animateDialTo(stops[index], exitAt + interludeTiming.exit);
      interludeTimer = setTimeout(releaseInterlude, exitAt);
    }
    targetIndex = index;
    pendingIndex = index;
    ruler.style.setProperty("--ruler-index",stops[index]);
    if (reduceMotion.matches) settleRuler();
    // 等转场幕布完整淡入遮盖画面（360ms）后再触发场景重建，彻底消除入场卡顿
    else settleTimer = setTimeout(settleRuler, interludeTiming.cover);
  }

  // 在立杆测影科普面板内点击四季对比项：原地实时切换日影长度，不退出观察视角
  for (const button of gnomonTermButtons) {
    button.addEventListener("click", () => {
      const key = button.dataset.gnomonTerm;
      const index = buttons.findIndex(entry => entry.dataset.season === key);
      if (index < 0) return;
      clearTimeout(settleTimer);
      clearTimeout(interludeTimer);
      pendingIndex = null;
      targetIndex = index;
      revealYard();
      applyDialAngle(shortestDialTarget(dialAngle, stops[index]));
      ruler.style.setProperty("--ruler-index", stops[index]);
      showTerm(key, { keepGnomon: true });
      soundscape?.playSfx("click");
    });
  }

  ruler.addEventListener("transitionend", event => {
    if (event.target === ruler && event.propertyName === "transform" && (reduceMotion.matches || !scene)) settleRuler();
  });
  reduceMotion.addEventListener("change", () => {
    if (reduceMotion.matches) {
      settleRuler();
      revealYard();
    }
  });

  for (const button of [...buttons,...yardLinks]) {
    const key = button.dataset.season || button.dataset.yard;
    const index = buttons.findIndex(entry => entry.dataset.season === key);
    button.addEventListener("click",() => selectTerm(index));
    button.addEventListener("keydown",event => {
      let next;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = buttons.length-1;
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = Math.max(0,index-1);
      if (event.key === "ArrowDown" || event.key === "ArrowRight") next = Math.min(buttons.length-1,index+1);
      if (next === undefined) return;
      event.preventDefault();
      yardLinks[next].focus({preventScroll:true});
      selectTerm(next);
    });
  }

  // A wheel gesture can advance one courtyard even if the next major mark is offscreen.
  let wheelTime = -Infinity, wheelDistance = 0, wheelUsed = false;
  function stepYard(direction) {
    selectTerm(Math.max(0,Math.min(buttons.length - 1,targetIndex + direction)));
  }
  rulerWindow.addEventListener("wheel",event => {
    if (event.ctrlKey || !event.deltaY || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
    event.preventDefault();
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rulerWindow.clientHeight : 1);
    if (event.timeStamp - wheelTime > 160 || Math.sign(delta) !== Math.sign(wheelDistance)) {
      wheelUsed = false;
      wheelDistance = 0;
    }
    wheelTime = event.timeStamp;
    wheelDistance += delta;
    if (!wheelUsed && Math.abs(wheelDistance) >= 24) {
      stepYard(Math.sign(delta));
      wheelUsed = true;
    }
  },{passive:false});

  let swipe;
  rulerWindow.addEventListener("pointerdown",event => {
    if (!event.isPrimary || event.button !== 0) { swipe = null; return; }
    swipe = {id:event.pointerId,x:event.clientX,y:event.clientY};
  });
  rulerWindow.addEventListener("pointermove",event => {
    if (!swipe || swipe.id !== event.pointerId) return;
    const dy = event.clientY - swipe.y;
    if (Math.abs(dy) < 32 || Math.abs(dy) <= Math.abs(event.clientX - swipe.x)) return;
    // Capture on the window so a swipe starting on a button cannot also click it.
    rulerWindow.setPointerCapture(event.pointerId);
    stepYard(-Math.sign(dy));
    swipe = null;
  });
  for (const eventName of ["pointerup","pointercancel","pointerleave"]) {
    rulerWindow.addEventListener(eventName,() => { swipe = null; });
  }

  // 挂接所有投影回调后再初始化场景并启动开场运镜
  if (scene) {
    scene.onGnomonView = updatePoleProjection;
    scene.onFoodView = updateFoodProjection;
    scene.onCropView = updateCropProjection;
    scene.onSickleView = updateSickleProjection;
    scene.onFireView = updateFireProjection;
    scene.onHarvestCut = () => soundscape?.playSfx("harvest");
  }

  foodTarget?.addEventListener("click", () => {
    foodPanel.hidden ? openFood() : closeFood();
  });
  document.querySelector("#food-return")?.addEventListener("click", () => closeFood());

  cropTarget?.addEventListener("click", () => {
    cropPanel.hidden ? openCrop() : closeCrop();
  });
  document.querySelector("#crop-return")?.addEventListener("click", () => closeCrop());

  sickleTarget?.addEventListener("click", () => {
    sicklePanel.hidden ? openSickle() : closeSickle();
  });
  document.querySelector("#sickle-return")?.addEventListener("click", () => closeSickle());

  harvestButton?.addEventListener("click", () => {
    closeSickle(true);
    setHarvestMode(true);
    soundscape?.playSfx("click");
  });
  harvestExit?.addEventListener("click", () => {
    setHarvestMode(false);
    soundscape?.playSfx("click");
  });

  fireTarget?.addEventListener("click", () => {
    firePanel.hidden ? openFire() : closeFire();
  });
  document.querySelector("#fire-return")?.addEventListener("click", () => closeFire());
  roastButton?.addEventListener("click", () => {
    const result = scene?.roastCake();
    if (result) {
      syncRoastButton(result.roasted, result.total);
      soundscape?.playSfx("roast");
    }
  });

  // 统一 Escape 快捷键：先让节气小志对话框自行关闭，否则优先收起音量面板/退出收割模式/关闭观察面板
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape" || guide.open) return;
    if (audioPopover && !audioPopover.hidden) {
      event.preventDefault();
      closeAudioPopover();
    } else if (document.body.classList.contains("harvest-mode")) {
      event.preventDefault();
      setHarvestMode(false);
    } else if (!poleInspection.hidden || !foodPanel.hidden || !cropPanel.hidden ||
               !sicklePanel.hidden || !firePanel.hidden) {
      event.preventDefault();
      exitAllModes({ releaseCamera: true });
    }
  });

  showTerm("grain");

  // —— 开场电影感摄像机运镜：低角度檐前水田起幅 → 旋升拉远至全景 → 界面柔缓浮现 ——
  let introRevealTimer = 0;

  function revealIntroHud() {
    clearTimeout(introRevealTimer);
    introRevealTimer = 0;
    exhibit.classList.remove("intro-active");
  }

  function startCameraIntro() {
    if (!scene || reduceMotion.matches) {
      revealIntroHud();
      return;
    }
    exhibit.classList.add("intro-active");
    scene.onIntroInterrupt = revealIntroHud;
    scene.onIntroDone = revealIntroHud;
    scene.playIntro();
    // 在运镜后半段柔缓浮现界面，与全景落位自然衔接
    introRevealTimer = setTimeout(revealIntroHud, 1380);
  }

  if (!scene) return;

  function hitsPole(event) {
    return poleInspection.hidden && !poleTarget.hidden && !exhibit.classList.contains("hud-hidden") &&
      !document.body.classList.contains("harvest-mode") &&
      clickedInside(poleTarget,event);
  }
  poleTarget.addEventListener("click",openPoleInspection);
  poleReturn.addEventListener("click",() => closePoleInspection());

  const points = new Map();
  let hadPinch = false;
  const distance = () => {
    const [a,b] = points.values();
    return Math.hypot(a.x - b.x,a.y - b.y);
  };

  canvas.addEventListener("pointerdown", event => {
    if ((event.button !== 0 && event.button !== 1 && event.button !== 2) || points.size === 2) return;
    if (event.button === 1) event.preventDefault();
    const poleClick = points.size === 0 && event.button === 0 && hitsPole(event);
    const cropClick = !poleClick && points.size === 0 && event.button === 0 &&
      (hitsCrop(event) || document.body.classList.contains("harvest-mode"));
    for (const point of points.values()) { point.poleClick = false; point.cropClick = false; }
    points.set(event.pointerId,{x:event.clientX,y:event.clientY,pan:event.button!==0,poleClick,cropClick});
    canvas.setPointerCapture(event.pointerId);
    if (points.size === 2) {
      hadPinch = true;
      scene.beginInteraction("pinch");
    } else if (!poleClick && !cropClick) {
      hadPinch = false;
      scene.beginInteraction("drag");
    }
    if (!poleClick && !cropClick) canvas.classList.add("dragging");
  });
  canvas.addEventListener("pointermove", event => {
    const old = points.get(event.pointerId);
    if (!old) {
      canvas.classList.toggle("gnomon-hover",hitsPole(event));
      canvas.classList.toggle("crop-hover",hitsCrop(event));
      return;
    }
    const pinching = points.size === 2;
    const before = pinching ? distance() : 0;
    const dx=event.clientX-old.x, dy=event.clientY-old.y;
    if (old.poleClick || old.cropClick) {
      if (Math.hypot(dx,dy)<5) return;
      old.poleClick=false;
      old.cropClick=false;
      hadPinch=false;
      scene.beginInteraction("drag");
    }
    old.x=event.clientX;
    old.y=event.clientY;
    canvas.classList.remove("gnomon-hover");
    canvas.classList.add("dragging");
    if (pinching && before > 1) {
      scene.magnify(distance()/before);
      scene.pan(dx/2,dy/2);
    } else if (old.pan) {
      scene.pan(dx,dy);
    } else {
      scene.rotate(-dx*.009,dy*.007);
    }
  });
  for (const type of ["pointerup","pointercancel","lostpointercapture"]) {
    canvas.addEventListener(type, event => {
      const point=points.get(event.pointerId);
      if (!point) return;
      points.delete(event.pointerId);
      if (points.size === 1) {
        scene.beginInteraction("drag");
      } else if (!points.size) {
        canvas.classList.remove("dragging");
        if (!point.poleClick && !point.cropClick) scene.endInteraction(!hadPinch);
        hadPinch = false;
      }
      const still = Math.hypot(event.clientX-point.x,event.clientY-point.y)<5;
      if (type==="pointerup" && still) {
        if (point.poleClick && hitsPole(event)) openPoleInspection();
        else if (point.cropClick) {
          if (document.body.classList.contains("harvest-mode")) {
            const rect = canvas.getBoundingClientRect();
            const index = scene.plantAtScreen(event.clientX - rect.left, event.clientY - rect.top, 64);
            if (index >= 0) {
              scene.harvestPlant(index);
              updateHarvestBar();
            }
            return;
          }
          if (hitsCrop(event)) openCrop();
        }
      }
    });
  }
  canvas.addEventListener("pointerleave",() => { canvas.classList.remove("gnomon-hover"); canvas.classList.remove("crop-hover"); });
  canvas.addEventListener("contextmenu", event => event.preventDefault());
  canvas.addEventListener("wheel", event => {
    event.preventDefault();
    const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1;
    const delta = event.deltaY * scale * (event.ctrlKey ? 3 : 1);
    scene.magnify(Math.exp(-Math.max(-420, Math.min(420,delta)) * .0015));
  },{passive:false});
  canvas.addEventListener("keydown", event => {
    const rotations = {ArrowLeft:[-.15,0],ArrowRight:[.15,0],ArrowUp:[0,.10],ArrowDown:[0,-.10]};
    if (event.key in rotations) {
      event.preventDefault();
      scene.rotate(...rotations[event.key]);
    } else if (event.key === "+" || event.key === "=" || event.key === "-") {
      event.preventDefault();
      scene.magnify(event.key === "-" ? 1/1.12 : 1.12);
    } else if (event.key === "Home") {
      event.preventDefault();
      exitAllModes({ releaseCamera: false });
      scene.reset();
    }
  });

  // —— 声景与音量系统：默认开启背景音乐 + 四季环境音（轻柔雨声/夏风/秋虫/围炉炭火）+ 交互音效 ——
  soundscape = (() => {
    const bgm = new Audio();
    bgm.src = "assets/bgm.mp3";
    bgm.preload = "auto";
    bgm.loop = false;
    const BGM_MAX = .62, FADE_IN = 1.1, FADE_OUT = 4.5;

    const state = { on: true, master: .85, bgm: .55, ambience: .85 };
    try {
      const saved = JSON.parse(localStorage.getItem("yyzs-audio") || "null");
      if (saved && typeof saved === "object") {
        if (typeof saved.on === "boolean") state.on = saved.on;
        if (typeof saved.master === "number") state.master = Math.max(0, Math.min(1, saved.master));
        if (typeof saved.bgm === "number") state.bgm = Math.max(0, Math.min(1, saved.bgm));
        if (typeof saved.ambience === "number") state.ambience = Math.max(0, Math.min(1, saved.ambience));
      } else if (localStorage.getItem("yyzs-bgm") === "off") {
        state.on = false;
      }
    } catch (error) { /* 忽略本地存储异常 */ }

    let currentSeason = document.body.dataset.season || "grain";
    let fadeTimer = null, bgmFading = false;
    let ctx = null, masterGain = null, ambBus = null, sfxBus = null, compressor = null;
    let layers = null, detailTimer = null, noiseBuffer = null;

    function persist() {
      try { localStorage.setItem("yyzs-audio", JSON.stringify(state)); } catch (error) { /* 忽略 */ }
    }

    function targetBgmLevel() {
      return state.on ? Math.max(0, Math.min(1, BGM_MAX * state.master * state.bgm)) : 0;
    }

    function fadeBgmTo(target, seconds, done) {
      clearInterval(fadeTimer);
      const from = bgm.volume;
      const steps = Math.max(1, Math.round(seconds * 20));
      let step = 0;
      fadeTimer = setInterval(() => {
        step++;
        const k = Math.min(1, step / steps);
        bgm.volume = Math.max(0, Math.min(1, from + (target - from) * k));
        if (k >= 1) {
          clearInterval(fadeTimer);
          fadeTimer = null;
          if (done) done();
        }
      }, 50);
    }

    function playBgm() {
      const level = targetBgmLevel();
      bgmFading = false;
      if (level <= .001) {
        if (!bgm.paused) bgm.pause();
        return;
      }
      if (bgm.ended || bgm.currentTime > .2) bgm.currentTime = 0;
      bgm.volume = 0;
      const started = bgm.play();
      if (started && started.catch) started.catch(() => { /* 若被浏览器拦截，等首次交互解锁 */ });
      fadeBgmTo(level, FADE_IN);
    }

    function pauseBgm() {
      fadeBgmTo(0, .9, () => { if (!state.on) bgm.pause(); });
    }

    bgm.addEventListener("timeupdate", () => {
      if (!state.on || !bgm.duration || bgmFading) return;
      if (bgm.duration - bgm.currentTime <= FADE_OUT) {
        bgmFading = true;
        fadeBgmTo(0, FADE_OUT);
      }
    });
    bgm.addEventListener("ended", () => {
      bgmFading = false;
      if (state.on) playBgm();
    });

    function createNoiseBuffer(audioCtx) {
      const length = audioCtx.sampleRate * 4;
      const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = .99886 * b0 + white * .0555179;
        b1 = .99332 * b1 + white * .0750759;
        b2 = .96900 * b2 + white * .1538520;
        b3 = .86650 * b3 + white * .3104856;
        b4 = .55000 * b4 + white * .5329522;
        b5 = -.7616 * b5 - white * .0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * .5362) * .055;
        b6 = white * .115926;
      }
      return buffer;
    }

    function makeLoop(filterType, freq, q, secondaryFreq) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;
      const f1 = ctx.createBiquadFilter();
      f1.type = filterType;
      f1.frequency.value = freq;
      f1.Q.value = q;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      src.connect(f1);
      if (secondaryFreq) {
        const f2 = ctx.createBiquadFilter();
        f2.type = "lowpass";
        f2.frequency.value = secondaryFreq;
        f1.connect(f2);
        f2.connect(gain);
      } else {
        f1.connect(gain);
      }
      gain.connect(ambBus);
      src.start();
      return gain;
    }

    function ensureContext() {
      if (ctx) {
        if (ctx.state === "suspended") ctx.resume().catch(() => {});
        return true;
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      try {
        ctx = new AudioCtx();
        masterGain = ctx.createGain();
        ambBus = ctx.createGain();
        sfxBus = ctx.createGain();
        compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -14;
        compressor.knee.value = 18;
        compressor.ratio.value = 4;
        compressor.attack.value = .005;
        compressor.release.value = .12;
        masterGain.gain.value = state.on ? state.master : 0;
        ambBus.gain.value = state.ambience;
        sfxBus.gain.value = state.ambience;
        ambBus.connect(masterGain);
        sfxBus.connect(masterGain);
        masterGain.connect(compressor);
        compressor.connect(ctx.destination);
        noiseBuffer = createNoiseBuffer(ctx);

        // 四季底噪层：远景下清晰可闻，同时保持雨天细雨柔和不刺耳
        layers = {
          rain:   [makeLoop("bandpass", 960, .65, 2200), .095],
          grain:  [makeLoop("lowpass", 410, .8), .062],
          grain2: [makeLoop("bandpass", 4150, 6.2), .022],
          dew:    [makeLoop("bandpass", 680, 1.25, 1900), .074],
          winter: [makeLoop("lowpass", 175, .72), .11],
          winterWind: [makeLoop("bandpass", 340, 1.1), .038]
        };
        applySeasonMix(true);
        scheduleDetail();
        return true;
      } catch (error) {
        ctx = null;
        return false;
      }
    }

    function applySeasonMix(immediate = false) {
      if (!ctx || !layers) return;
      const t = ctx.currentTime;
      const tau = immediate ? .05 : .55;
      const active = {
        rain: currentSeason === "rain" ? layers.rain[1] : 0,
        grain: currentSeason === "grain" ? layers.grain[1] : 0,
        grain2: currentSeason === "grain" ? layers.grain2[1] : 0,
        dew: currentSeason === "dew" ? layers.dew[1] : 0,
        winter: currentSeason === "winter" ? layers.winter[1] : 0,
        winterWind: currentSeason === "winter" ? layers.winterWind[1] : 0
      };
      for (const [key, [gainNode]] of Object.entries(layers)) {
        gainNode.gain.setTargetAtTime(active[key], t, tau);
      }
    }

    // 季节环境细节：轻柔雨滴、夏院远禽、秋夜微虫、冬夜炭火噼啪
    function triggerDetail() {
      if (!ctx || !state.on || state.master * state.ambience <= .01 || ctx.state !== "running") return;
      const now = ctx.currentTime;
      if (currentSeason === "rain") {
        // 柔和轻盈的水洼雨滴声
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const base = 920 + Math.random() * 640;
        osc.type = "sine";
        osc.frequency.setValueAtTime(base, now);
        osc.frequency.exponentialRampToValueAtTime(base * 1.24, now + .038);
        g.gain.setValueAtTime(.0001, now);
        g.gain.linearRampToValueAtTime(.032, now + .005);
        g.gain.exponentialRampToValueAtTime(.0001, now + .06);
        osc.connect(g); g.connect(ambBus);
        osc.start(now); osc.stop(now + .065);
      } else if (currentSeason === "grain") {
        // 夏日远水微禽双鸣
        for (let k = 0; k < 2; k++) {
          const t0 = now + k * .14;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          const f = 1480 + Math.random() * 280 - k * 140;
          osc.type = "sine";
          osc.frequency.setValueAtTime(f, t0);
          osc.frequency.exponentialRampToValueAtTime(f * 1.18, t0 + .095);
          g.gain.setValueAtTime(.0001, t0);
          g.gain.linearRampToValueAtTime(.042, t0 + .018);
          g.gain.exponentialRampToValueAtTime(.0001, t0 + .13);
          osc.connect(g); g.connect(ambBus);
          osc.start(t0); osc.stop(t0 + .14);
        }
      } else if (currentSeason === "dew") {
        // 寒露清脆秋虫短鸣
        const osc = ctx.createOscillator();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 3450 + Math.random() * 260;
        lfo.frequency.value = 26;
        lfoGain.gain.value = .012;
        g.gain.setValueAtTime(.0001, now);
        g.gain.linearRampToValueAtTime(.026, now + .05);
        g.gain.exponentialRampToValueAtTime(.0001, now + .36);
        lfo.connect(lfoGain); lfoGain.connect(g.gain);
        osc.connect(g); g.connect(ambBus);
        osc.start(now); lfo.start(now);
        osc.stop(now + .38); lfo.stop(now + .38);
      } else if (currentSeason === "winter") {
        // 围炉木炭清脆噼啪声
        const src = ctx.createBufferSource();
        src.buffer = noiseBuffer;
        const hp = ctx.createBiquadFilter();
        hp.type = "bandpass";
        hp.frequency.value = 2200 + Math.random() * 1600;
        hp.Q.value = 2.0;
        const g = ctx.createGain();
        g.gain.setValueAtTime(.0001, now);
        g.gain.linearRampToValueAtTime(.078, now + .004);
        g.gain.exponentialRampToValueAtTime(.0001, now + .038);
        src.connect(hp); hp.connect(g); g.connect(ambBus);
        src.start(now, Math.random() * 3.2, .045);
      }
    }

    function scheduleDetail() {
      clearTimeout(detailTimer);
      const delay = currentSeason === "rain" ? 480 + Math.random() * 1000
        : currentSeason === "winter" ? 320 + Math.random() * 950
        : currentSeason === "grain" ? 2400 + Math.random() * 2800
        : 2800 + Math.random() * 3000;
      detailTimer = setTimeout(() => {
        triggerDetail();
        scheduleDetail();
      }, delay);
    }

    function playSfx(kind, seasonKey) {
      if (!state.on || state.master * state.ambience <= .01) return;
      if (!ensureContext() || ctx.state !== "running") return;
      const now = ctx.currentTime;
      if (kind === "door") {
        // 开场推开木门的轻柔吱呀声 + 门栓轻响
        const osc = ctx.createOscillator();
        const f = ctx.createBiquadFilter();
        const g = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(165, now);
        osc.frequency.exponentialRampToValueAtTime(255, now + .34);
        osc.frequency.exponentialRampToValueAtTime(195, now + .62);
        f.type = "bandpass"; f.frequency.value = 460; f.Q.value = 4.5;
        g.gain.setValueAtTime(.0001, now);
        g.gain.linearRampToValueAtTime(.095, now + .14);
        g.gain.exponentialRampToValueAtTime(.0001, now + .68);
        osc.connect(f); f.connect(g); g.connect(sfxBus);
        osc.start(now); osc.stop(now + .72);
      } else if (kind === "season") {
        const notes = { rain: 523.25, grain: 587.33, dew: 659.25, winter: 440 };
        const freq = notes[seasonKey] || 523.25;
        const osc = ctx.createOscillator();
        const over = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine"; osc.frequency.value = freq;
        over.type = "triangle"; over.frequency.value = freq * 2;
        const overG = ctx.createGain(); overG.gain.value = .22;
        g.gain.setValueAtTime(.0001, now);
        g.gain.linearRampToValueAtTime(.18, now + .012);
        g.gain.exponentialRampToValueAtTime(.0001, now + .56);
        osc.connect(g); over.connect(overG); overG.connect(g); g.connect(sfxBus);
        osc.start(now); over.start(now);
        osc.stop(now + .58); over.stop(now + .58);
      } else if (kind === "panel") {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(490, now);
        osc.frequency.exponentialRampToValueAtTime(325, now + .058);
        g.gain.setValueAtTime(.0001, now);
        g.gain.linearRampToValueAtTime(.16, now + .006);
        g.gain.exponentialRampToValueAtTime(.0001, now + .072);
        osc.connect(g); g.connect(sfxBus);
        osc.start(now); osc.stop(now + .08);
      } else if (kind === "click") {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(640, now);
        osc.frequency.exponentialRampToValueAtTime(465, now + .03);
        g.gain.setValueAtTime(.0001, now);
        g.gain.linearRampToValueAtTime(.12, now + .004);
        g.gain.exponentialRampToValueAtTime(.0001, now + .04);
        osc.connect(g); g.connect(sfxBus);
        osc.start(now); osc.stop(now + .045);
      } else if (kind === "harvest") {
        // 镰刀挥割 + 稻秆沙沙声（远景视角下依然清晰爽脆）
        const src = ctx.createBufferSource();
        src.buffer = noiseBuffer;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.setValueAtTime(2200, now);
        bp.frequency.exponentialRampToValueAtTime(840, now + .21);
        bp.Q.value = 1.25;
        const g = ctx.createGain();
        g.gain.setValueAtTime(.0001, now);
        g.gain.linearRampToValueAtTime(.34, now + .022);
        g.gain.exponentialRampToValueAtTime(.0001, now + .25);
        src.connect(bp); bp.connect(g); g.connect(sfxBus);
        src.start(now, Math.random() * 2.5, .26);
        // 轻脆镰刃微鸣
        const blade = ctx.createOscillator();
        const bg = ctx.createGain();
        blade.type = "sine";
        blade.frequency.setValueAtTime(2650, now);
        blade.frequency.exponentialRampToValueAtTime(1900, now + .075);
        bg.gain.setValueAtTime(.0001, now);
        bg.gain.linearRampToValueAtTime(.065, now + .008);
        bg.gain.exponentialRampToValueAtTime(.0001, now + .09);
        blade.connect(bg); bg.connect(sfxBus);
        blade.start(now); blade.stop(now + .10);
      } else if (kind === "roast") {
        // 糍粑轻落灶石 + 炭火滋滋声
        const thud = ctx.createOscillator();
        const tg = ctx.createGain();
        thud.type = "sine";
        thud.frequency.setValueAtTime(155, now);
        thud.frequency.exponentialRampToValueAtTime(76, now + .07);
        tg.gain.setValueAtTime(.0001, now);
        tg.gain.linearRampToValueAtTime(.22, now + .008);
        tg.gain.exponentialRampToValueAtTime(.0001, now + .088);
        thud.connect(tg); tg.connect(sfxBus);
        thud.start(now); thud.stop(now + .095);

        const sizzle = ctx.createBufferSource();
        sizzle.buffer = noiseBuffer;
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 2400;
        const sg = ctx.createGain();
        sg.gain.setValueAtTime(.0001, now + .04);
        sg.gain.linearRampToValueAtTime(.24, now + .14);
        sg.gain.exponentialRampToValueAtTime(.0001, now + .74);
        sizzle.connect(hp); hp.connect(sg); sg.connect(sfxBus);
        sizzle.start(now + .03, Math.random() * 2.5, .74);
      }
    }

    function syncAudioUI() {
      const mPct = Math.round(state.master * 100);
      const bPct = Math.round(state.bgm * 100);
      const aPct = Math.round(state.ambience * 100);
      if (volMaster) volMaster.value = String(mPct);
      if (volBgm) volBgm.value = String(bPct);
      if (volAmbience) volAmbience.value = String(aPct);
      if (volMasterVal) volMasterVal.textContent = mPct + "%";
      if (volBgmVal) volBgmVal.textContent = bPct + "%";
      if (volAmbienceVal) volAmbienceVal.textContent = aPct + "%";
      const active = state.on && state.master > 0;
      soundToggle?.setAttribute("aria-pressed", String(active));
      if (audioMute) {
        audioMute.setAttribute("aria-pressed", String(!state.on));
        audioMute.textContent = state.on ? "静音" : "开启";
      }
    }

    function applyVolumes() {
      syncAudioUI();
      persist();
      if (ctx && masterGain) {
        const t = ctx.currentTime;
        masterGain.gain.setTargetAtTime(state.on ? state.master : 0, t, .04);
        ambBus.gain.setTargetAtTime(state.ambience, t, .04);
        sfxBus.gain.setTargetAtTime(state.ambience, t, .04);
      }
      if (!state.on) {
        if (!bgm.paused) pauseBgm();
        return;
      }
      const level = targetBgmLevel();
      if (level <= .001) {
        clearInterval(fadeTimer);
        bgm.volume = 0;
        if (!bgm.paused) bgm.pause();
      } else if (bgm.paused) {
        playBgm();
      } else if (!bgmFading) {
        clearInterval(fadeTimer);
        bgm.volume = level;
      }
    }

    function setSoundOn(on) {
      state.on = Boolean(on);
      if (state.on) {
        ensureContext();
        applySeasonMix(false);
        playBgm();
      } else {
        pauseBgm();
      }
      applyVolumes();
    }

    function setSeason(key) {
      currentSeason = key;
      applySeasonMix(false);
      if (ctx) scheduleDetail();
    }

    // 默认开启：页面载入立即尝试播放，若被浏览器自动播放策略拦截则在首次交互瞬间无缝启动
    if (state.on) {
      ensureContext();
      playBgm();
      const unlock = () => {
        window.removeEventListener("pointerdown", unlock, true);
        window.removeEventListener("keydown", unlock, true);
        window.removeEventListener("wheel", unlock, true);
        if (!state.on) return;
        ensureContext();
        if (bgm.paused && targetBgmLevel() > .001) playBgm();
        applyVolumes();
      };
      window.addEventListener("pointerdown", unlock, true);
      window.addEventListener("keydown", unlock, true);
      window.addEventListener("wheel", unlock, true);
    }

    soundToggle?.addEventListener("click", () => {
      if (!audioPopover) { setSoundOn(!state.on); return; }
      const opening = audioPopover.hidden;
      if (opening) {
        audioPopover.hidden = false;
        soundToggle.setAttribute("aria-expanded", "true");
        if (!state.on) setSoundOn(true);
      } else {
        closeAudioPopover();
      }
    });

    audioMute?.addEventListener("click", () => {
      setSoundOn(!state.on);
    });

    const bindSlider = (input, key) => {
      input?.addEventListener("input", () => {
        state[key] = Math.max(0, Math.min(1, Number(input.value) / 100));
        if (!state.on && state[key] > 0) {
          state.on = true;
          ensureContext();
          applySeasonMix(false);
        }
        applyVolumes();
      });
    };
    bindSlider(volMaster, "master");
    bindSlider(volBgm, "bgm");
    bindSlider(volAmbience, "ambience");

    document.addEventListener("pointerdown", event => {
      if (!audioPopover || audioPopover.hidden) return;
      if (audioPopover.contains(event.target) || soundToggle?.contains(event.target)) return;
      closeAudioPopover();
    });

    syncAudioUI();
    return { setSeason, playSfx, setSoundOn, getState: () => ({ ...state }) };
  })();

  startCameraIntro();

  gnomonToggle?.addEventListener("click", () => {
    if (poleInspection.hidden) openPoleInspection();
    else closePoleInspection();
  });
  document.querySelector("#zoom-in").addEventListener("click", () => scene.magnify(1.15));
  document.querySelector("#zoom-out").addEventListener("click", () => scene.magnify(1/1.15));
  document.querySelector("#reset-view").addEventListener("click", () => {
    exitAllModes({ releaseCamera: false });
    scene.reset();
  });
})();
