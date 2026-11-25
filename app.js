(() => {
  "use strict";

  const terms = {
    rain: {
      longitude: 330, name: "雨水", month: "正月中",
      verse: "随风潜入夜，润物细无声。", poet: "唐·杜甫",
      hou: ["獭祭鱼", "鸿雁来", "草木萌动"],
      palette: [["柳绿","#7BC454"],["天青","#6EB8C4"],["杏红","#EE8478"]],
      paletteNote: "春属木 · 尚青绿",
      summary: "春雨润泥，杏花初绽枝头；农夫沿田埂疏沟引水。",
      note: "东风解冻，细雨如丝。杏梢初绽浅红，新柳吐绿；农夫趁土润沿埂疏沟，为春耕蓄水备墒，顺应草木萌动之候。",
      gnomonNote: "春阳渐升，正午竿影日短，江汉回暖润春耕。"
    },
    grain: {
      longitude: 75, name: "芒种", month: "五月节",
      verse: "家家麦饭美，处处菱歌长。", poet: "宋·陆游",
      hou: ["螳螂生", "鵙始鸣", "反舌无声"],
      palette: [["竹青","#489A56"],["缥色","#52B8B5"],["麦黄","#EFC562"]],
      paletteNote: "夏属火 · 尚明翠",
      summary: "碧水映天，新栽稻秧成行；竹匾晒新麦，蜻蜓点波。",
      note: "「有芒之谷可稼种」。浅水稻田映出天光云影，农夫忙于抢墒插秧；檐下竹匾摊晒新麦，蜻蜓掠水，夏木葱茏。",
      gnomonNote: "临近夏至，正午日高影短，光热充沛宜栽秧。"
    },
    dew: {
      longitude: 195, name: "寒露", month: "九月节",
      verse: "寒露惊秋晚，朝看菊渐黄。", poet: "唐·元稹",
      hou: ["鸿雁来宾", "雀入大水为蛤", "菊有黄华"],
      palette: [["秋香","#C8A642"],["酡颜","#D65A44"],["黛蓝","#385A7C"]],
      paletteNote: "秋属金 · 尚丹金",
      summary: "丹枫落院，黄菊盛放篱边；金稻满田，开闸放水待收。",
      note: "露气渐寒，秋意已深。院前秋菊盛放、丹枫飘零；田间稻穗沉甸金黄，农夫开闸放水晒田，静候秋收归仓。",
      gnomonNote: "秋分已过，正午日影渐长，昼夜温差促稻熟。"
    },
    winter: {
      longitude: 240, name: "小雪", month: "十月中",
      verse: "晚来天欲雪，能饮一杯无。", poet: "唐·白居易",
      hou: ["虹藏不见", "天气上升地气下降", "闭塞而成冬"],
      palette: [["霜色","#EDF5F8"],["月白","#BCD8E8"],["玄青","#2C4866"]],
      paletteNote: "冬属水 · 尚玄素",
      summary: "初雪覆瓦，檐灯映暖青石；农夫围炉搓手，茶烟袅袅。",
      note: "初冬飞雪轻覆青瓦，屋檐灯火透出暖意。田埂积雪未厚，菜畦尚存青翠；农夫围炉搓手温茶，顺时藏冬。",
      gnomonNote: "渐近冬至，正午日低影长，寒气日盛宜藏冬。"
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
  const poleTarget = document.querySelector("#gnomon-target");
  const poleInspection = document.querySelector("#gnomon-inspect");
  const poleReading = document.querySelector("#gnomon-length");
  const poleAltitude = document.querySelector("#gnomon-altitude");
  const poleNote = document.querySelector("#gnomon-note");
  const poleReturn = document.querySelector("#gnomon-return");
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

  function showTerm(key) {
    const term = terms[key];
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
    const ratio=shadowRatio.toFixed(2);
    const altDeg=(altitude / degrees).toFixed(1);
    shadowReadout.textContent = ratio + "× 竿高";
    shadowLatitude.textContent = "北纬 30.4° · 仰角 " + altDeg + "°";
    poleReading.textContent = ratio + " × 竿高";
    poleAltitude.textContent = altDeg + "°";
    poleNote.textContent = term.gnomonNote;
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
    scene?.useTerm(key,shadowRatio);
    if (foodPanel && !foodPanel.hidden) fillFood();
    if (cropPanel && !cropPanel.hidden) fillCrop();
  }

  function toggleHud() {
    const hidden = exhibit.classList.toggle("hud-hidden");
    if (hidden && guide.open) guide.close();
    hudToggle.setAttribute("aria-pressed",String(hidden));
    hudToggle.title = hidden ? "显示界面" : "隐藏界面";
  }

  function clickedInside(element,event) {
    const {left,right,top,bottom} = element.getBoundingClientRect();
    return event.clientX >= left && event.clientX <= right && event.clientY >= top && event.clientY <= bottom;
  }

  hudToggle.addEventListener("click",toggleHud);
  openGuide.addEventListener("click",() => guide.showModal());
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
  interlude.style.setProperty("--dial-angle", -stops[targetIndex] * dialStep + "deg");
  let pendingIndex = null;
  let settleTimer;
  let interludeTimer;
  let textEntry;

  function revealYard() {
    clearTimeout(interludeTimer);
    textEntry?.cancel();
    interlude.dataset.phase = "";
  }

  function releaseInterlude() {
    interlude.dataset.phase = "exit";
    interludeTimer = setTimeout(revealYard,460);
  }

  function settleRuler() {
    if (pendingIndex === null) return;
    const index = pendingIndex;
    const button = buttons[index];
    const key = button.dataset.season;
    pendingIndex = null;
    clearTimeout(settleTimer);
    if (document.body.dataset.season === key) {
      revealYard();
      return;
    }
    showTerm(key);
    if (reduceMotion.matches || !scene) {
      revealYard();
      return;
    }
    interlude.dataset.phase = "verse";
    interludeTimer = setTimeout(releaseInterlude,850);
  }

  function selectTerm(index) {
    if (index === targetIndex) return;
    const button = buttons[index];
    const key = button.dataset.season;
    if (!reduceMotion.matches && scene && (key !== document.body.dataset.season || interlude.dataset.phase === "cover")) {
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
        [{transform:"translateY(var(--travel))"},{transform:"translateY(0)"}],
        {duration:520,easing:"cubic-bezier(.3,.61,.28,1)"}
      );
    }
    targetIndex = index;
    pendingIndex = index;
    clearTimeout(settleTimer);
    clearTimeout(interludeTimer);
    interlude.style.setProperty("--dial-angle", -stops[index] * dialStep + "deg");
    ruler.style.setProperty("--ruler-index",stops[index]);
    if (reduceMotion.matches) settleRuler();
    else settleTimer = setTimeout(settleRuler,290);
  }

  ruler.addEventListener("transitionend", event => {
    if (event.target === ruler && event.propertyName === "transform") settleRuler();
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
    const xs=outline.map(([x])=>x), ys=outline.map(([,y])=>y);
    const left=Math.min(...xs), top=Math.min(...ys);
    Object.assign(poleTarget.style,{
      left:(canvas.offsetLeft+left-10)+"px", top:(canvas.offsetTop+top-8)+"px",
      width:(Math.max(...xs)-left+20)+"px", height:(Math.max(...ys)-top+16)+"px"
    });
  }
  if (scene) { scene.onGnomonView=updatePoleProjection; scene.onFoodView=updateFoodProjection; scene.onCropView=updateCropProjection; }
  // —— 门口食桌：悬停描边，点开看这一节气吃什么 ——
  const FOOD = {
    rain:   { name: "青团", note: "艾草在雨水里返青。江汉人家采嫩艾捣汁，和糯米粉揉成青团，蒸一屉，先给春耕开个甜头。" },
    grain:  { name: "粽子", note: "芒种连着端午。新麦入仓、箬叶正肥，包一屉粽子，是抢收抢种里最扎实的一顿。" },
    dew:    { name: "柿子", note: "寒露柿子红了皮。院里摘下来漤在米缸里，等霜降后再吃，甜得发糯。" },
    winter: { name: "糍粑", note: "小雪封地。糯米蒸熟舂烂，切块下锅煎到两面焦黄，是过冬最实在的一口。" }
  };
  const foodLayer = document.querySelector("#food-hotspots");
  const foodOutline = document.querySelector("#food-outline");
  const foodOutlineEdge = document.querySelector("#food-outline-edge");
  const foodTarget = document.querySelector("#food-target");
  const foodPanel = document.querySelector("#food-inspect");
  const foodKicker = document.querySelector("#food-kicker");
  const foodName = document.querySelector("#food-name");
  const foodNote = document.querySelector("#food-note");

  // 和立杆一样：描边贴着桌子本体，点进去拉近
  function updateFoodProjection(projection) {
    if (!projection) {
      foodLayer.toggleAttribute("hidden", true);
      if (foodTarget) foodTarget.hidden = true;
      return;
    }
    const silhouette = silhouettePath(scene?.foodSilhouette(), 1.4);
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
        left: (left - 8) + "px",
        top: (top - 6) + "px",
        width: (Math.max(...xs) - left + 16) + "px",
        height: (Math.max(...ys) - top + 12) + "px"
      });
    }
  }

  function fillFood() {
    const key = document.body.dataset.season;
    const food = FOOD[key];
    if (!food) return;
    const button = buttons.find(entry => entry.getAttribute("aria-current") === "true");
    const termName = button ? button.querySelector(".term-name").textContent : "";
    foodKicker.textContent = termName || "时令";
    foodName.textContent = food.name;
    foodNote.textContent = food.note;
  }

  function openFood() {
    if (!foodPanel) return;
    closeCrop();
    if (typeof closePoleInspection === "function") closePoleInspection();
    fillFood();
    foodPanel.hidden = false;
    foodTarget.setAttribute("aria-expanded", "true");
    exhibit.classList.add("food-focused");
    scene?.focusFood();
  }

  function closeFood() {
    if (!foodPanel || foodPanel.hidden) return;
    foodPanel.hidden = true;
    foodTarget?.setAttribute("aria-expanded", "false");
    exhibit.classList.remove("food-focused");
    scene?.releaseFood();
  }

  foodTarget?.addEventListener("click", () => {
    foodPanel.hidden ? openFood() : closeFood();
  });
  document.querySelector("#food-return")?.addEventListener("click", closeFood);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeFood();
  });


  // —— 田里的庄稼：和食桌、立杆同一套（描边 → 拉近 → 文字）——
  const CROP = {
    rain:   { title: "杏花春雨", name: "杏花先叶", note: "杏花不等叶先开，一朵朵落在还空着的水田上。江汉人看它开花定日子：花一谢就该疏渠、夯埂、晒田备秧，到清明才落泥。" },
    grain:  { title: "芒种秧畦", name: "手插的秧", note: "这一畦是芒种前后手工插下的中稻，行距一尺二、株距六寸，三根苗一蔸。水只留一寸护根，插完晒一天，让新根抓紧泥。" },
    dew:    { title: "寒露稻穗", name: "低头的时候", note: "寒露的稻穗压得秆子发弯，谷粒从青转黄，捏一颗是硬的。田里断水晒十天，等霜降前开镰——晚稻要抢在初霜之前进仓。" },
    winter: { title: "雪里菜畦", name: "唯一还绿的", note: "整块水田只剩稻桩，唯一还绿的是这条菜畦：青菜和油菜苗，霜压一层就长得更紧实。开春翻耕时，连土沤进田里做底肥。" }
  };
  const cropLayer = document.querySelector("#crop-hotspots");
  const cropOutlines = document.querySelector("#crop-outlines");
  const cropTarget = document.querySelector("#crop-target");
  const cropPanel = document.querySelector("#crop-inspect");
  const cropHeading = document.querySelector("#crop-heading");
  const cropKicker = document.querySelector("#crop-kicker");
  const cropName = document.querySelector("#crop-name");
  const cropNote = document.querySelector("#crop-note");

  let cropHulls = [];
  let cropCentres = [];
let cropIndices = [];

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
    if (cropPanel && !cropPanel.hidden) return false;
    if (exhibit.classList.contains("hud-hidden")) return false;
    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left, py = event.clientY - rect.top;
    if (cropHulls.some(hull => pointInHull(px, py, hull))) return true;
    // 每株一个椭圆圈：点进圈里，或离圈边不远都算命中
    return cropCentres.some(([cx, cy, r]) => Math.hypot(px - cx, py - cy) < r + 16);
  }

  // 由三角面在屏幕上栅格化，再沿边界连成轮廓：这才是真正的描边
  function silhouettePath(flat, cell) {
    if (!flat || flat.length < 6) return "";
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    for (let i = 0; i < flat.length; i += 2) {
      const x = flat[i], y = flat[i + 1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const w = Math.max(1, Math.ceil((maxX - minX) / cell) + 2);
    const h = Math.max(1, Math.ceil((maxY - minY) / cell) + 2);
    if (w * h > 260000) return "";
    const grid = new Uint8Array(w * h);
    for (let t = 0; t < flat.length; t += 6) {
      const ax = (flat[t] - minX) / cell + 1, ay = (flat[t + 1] - minY) / cell + 1;
      const bx = (flat[t + 2] - minX) / cell + 1, by = (flat[t + 3] - minY) / cell + 1;
      const cx = (flat[t + 4] - minX) / cell + 1, cy = (flat[t + 5] - minY) / cell + 1;
      const top = Math.max(0, Math.floor(Math.min(ay, by, cy)));
      const bottom = Math.min(h - 1, Math.ceil(Math.max(ay, by, cy)));
      for (let row = top; row <= bottom; row++) {
        const sy = row + .5, hits = [];
        const edges = [[ax, ay, bx, by], [bx, by, cx, cy], [cx, cy, ax, ay]];
        for (const [x1, y1, x2, y2] of edges) {
          if ((y1 <= sy && y2 > sy) || (y2 <= sy && y1 > sy)) {
            hits.push(x1 + (sy - y1) / (y2 - y1) * (x2 - x1));
          }
        }
        if (hits.length < 2) continue;
        const lo = Math.max(0, Math.round(Math.min(...hits)));
        const hi = Math.min(w - 1, Math.round(Math.max(...hits)));
        for (let col = lo; col <= hi; col++) grid[row * w + col] = 1;
      }
    }
    const at = (col, row) => (col < 0 || row < 0 || col >= w || row >= h) ? 0 : grid[row * w + col];
    let path = "";
    const px = col => (minX + (col - 1) * cell).toFixed(1);
    const py = row => (minY + (row - 1) * cell).toFixed(1);
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        if (!at(col, row)) continue;
        if (!at(col, row - 1)) path += `M${px(col)} ${py(row)}L${px(col + 1)} ${py(row)}`;
        if (!at(col, row + 1)) path += `M${px(col)} ${py(row + 1)}L${px(col + 1)} ${py(row + 1)}`;
        if (!at(col - 1, row)) path += `M${px(col)} ${py(row)}L${px(col)} ${py(row + 1)}`;
        if (!at(col + 1, row)) path += `M${px(col + 1)} ${py(row)}L${px(col + 1)} ${py(row + 1)}`;
      }
    }
    return path;
  }

  // 把一堆圆合成一条外包络：逐列取最高、最低点，再首尾相接
  function envelopeOf(circles) {
    const minX = Math.min(...circles.map(circle => circle[0] - circle[2])) - 3;
    const maxX = Math.max(...circles.map(circle => circle[0] + circle[2])) + 3;
    const step = Math.max(2, (maxX - minX) / 120);
    const top = [], bottom = [];
    for (let x = minX; x <= maxX; x += step) {
      let high = null, low = null;
      for (const [cx, cy, r] of circles) {
        const dx = x - cx;
        if (Math.abs(dx) > r) continue;
        const dy = Math.sqrt(r * r - dx * dx);
        high = high === null ? cy - dy : Math.min(high, cy - dy);
        low = low === null ? cy + dy : Math.max(low, cy + dy);
      }
      if (high !== null) { top.push([x, high - 3]); bottom.push([x, low + 3]); }
    }
    return top.concat(bottom.reverse());
  }

  // 鼠标下面是哪一株（返回作物下标，没有则 -1）
  function plantAt(event) {
    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left, py = event.clientY - rect.top;
    for (let k = cropCentres.length - 1; k >= 0; k--) {
      const [cx, cy, r] = cropCentres[k];
      if (Math.hypot(px - cx, py - cy) <= r + 14) return cropIndices[k];
    }
    return -1;
  }

  function updateCropProjection(projection) {
    if (document.body.classList.contains("harvest-mode")) {
      cropOutlines.textContent = "";
      cropLayer.toggleAttribute("hidden", true);
      if (cropTarget) cropTarget.hidden = true;
      cropHulls = []; cropCentres = []; cropIndices = [];
      return;
    }
    if (!projection) {
      cropLayer.toggleAttribute("hidden", true);
      if (cropTarget) cropTarget.hidden = true;
      return;
    }
    cropHulls = [];
    cropCentres = [];
    cropIndices = projection.indices ? projection.indices.slice() : [];
    cropOutlines.textContent = "";
    if (document.body.dataset.season === "rain") {
      const silhouette = silhouettePath(scene?.treeSilhouette(), 1.5);
      if (silhouette) {
        for (const className of ["crop-edge", "crop-line"]) {
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", silhouette);
          path.setAttribute("class", className);
          cropOutlines.appendChild(path);
        }
      }
      cropHulls = projection.items.filter(item => !item.ellipse);
    }
    for (const item of (document.body.dataset.season === "rain" ? [] : projection.items)) {
      if (item.ellipse) {
        cropCentres.push([item.ellipse[0], item.ellipse[1], item.ellipse[2]]);
        for (const className of ["crop-edge", "crop-line"]) {
          const ellipse = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
          ellipse.setAttribute("cx", item.ellipse[0].toFixed(1));
          ellipse.setAttribute("cy", item.ellipse[1].toFixed(1));
          ellipse.setAttribute("rx", item.ellipse[2].toFixed(1));
          ellipse.setAttribute("ry", item.ellipse[3].toFixed(1));
          ellipse.setAttribute("class", className);
          cropOutlines.appendChild(ellipse);
        }
      } else {
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
        left: (left - 6) + "px",
        top: (top - 6) + "px",
        width: (Math.max(...xs) - left + 12) + "px",
        height: (Math.max(...ys) - top + 12) + "px"
      });
    }
  }

  function fillCrop() {
    const key = document.body.dataset.season;
    const crop = CROP[key];
    if (!crop) return;
    if (cropHeading) cropHeading.textContent = crop.title;
    const button = buttons.find(entry => entry.getAttribute("aria-current") === "true");
    const termName = button ? button.querySelector(".term-name").textContent : "";
    cropKicker.textContent = termName || "时令";
    cropName.textContent = crop.name;
    cropNote.textContent = crop.note;
  }

  function openCrop() {
    if (!cropPanel) return;
    closeFood();
    fillCrop();
    cropPanel.hidden = false;
    cropTarget.setAttribute("aria-expanded", "true");
    exhibit.classList.add("crop-focused");
    scene?.focusCrop();
  }

  function closeCrop() {
    if (!cropPanel || cropPanel.hidden) return;
    cropPanel.hidden = true;
    cropTarget?.setAttribute("aria-expanded", "false");
    exhibit.classList.remove("crop-focused");
    scene?.releaseCrop();
  }

  cropTarget?.addEventListener("click", () => {
    cropPanel.hidden ? openCrop() : closeCrop();
  });
  document.querySelector("#crop-return")?.addEventListener("click", closeCrop);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeCrop();
  });

  showTerm("grain");

  // —— 门口的镰刀：描边 → 拉近 → 抢收 ——
  const sickleLayer = document.querySelector("#sickle-hotspots");
  const sickleOutline = document.querySelector("#sickle-outline");
  const sickleOutlineEdge = document.querySelector("#sickle-outline-edge");
  const sickleTarget = document.querySelector("#sickle-target");
  const sicklePanel = document.querySelector("#sickle-inspect");
  const harvestButton = document.querySelector("#harvest-start");

  function updateSickleProjection(projection) {
    if (!sickleLayer) return;
    if (!projection) {
      sickleLayer.toggleAttribute("hidden", true);
      if (sickleTarget) sickleTarget.hidden = true;
      return;
    }
    const silhouette = silhouettePath(scene?.sickleSilhouette(), 1.4);
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
        left: (left - 10) + "px",
        top: (top - 8) + "px",
        width: (Math.max(...xs) - left + 20) + "px",
        height: (Math.max(...ys) - top + 16) + "px"
      });
    }
  }

  function openSickle() {
    if (!sicklePanel) return;
    closeFood(); closeCrop(); closeBroom(); closeFire();
    sicklePanel.hidden = false;
    if (harvestButton) {
      harvestButton.textContent = document.body.classList.contains("harvest-mode") ? "结束抢收" : "开始抢收";
    }
    sickleTarget.setAttribute("aria-expanded", "true");
    scene?.focusSickle();
  }

  function closeSickle() {
    if (!sicklePanel || sicklePanel.hidden) return;
    sicklePanel.hidden = true;
    sickleTarget?.setAttribute("aria-expanded", "false");
    scene?.releaseSickle();
  }

  sickleTarget?.addEventListener("click", () => {
    sicklePanel.hidden ? openSickle() : closeSickle();
  });
  document.querySelector("#sickle-return")?.addEventListener("click", closeSickle);
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (document.body.classList.contains("sweep-mode")) setSweepMode(false);
    else if (document.body.classList.contains("harvest-mode")) setHarvestMode(false);
    else { closeSickle(); closeBroom(); closeFire(); }
  });

  function setHarvestMode(on) {
    document.body.classList.toggle("harvest-mode", on);
    scene?.setHarvestMode(on);
    // 抢收时不再显示作物圈：整块田都能割，圈反而干扰
    if (on) {
      cropOutlines.textContent = "";
      cropLayer.toggleAttribute("hidden", true);
      if (cropTarget) cropTarget.hidden = true;
      cropHulls = [];
      cropCentres = [];
      cropIndices = [];
    } else if (scene) {
      updateCropProjection(scene.cropProjection());
    }
  }

  harvestButton?.addEventListener("click", () => {
    const on = !document.body.classList.contains("harvest-mode");
    closeSickle();
    setHarvestMode(on);
  });

  // —— 冬天的竹扫把：描边 → 拉近 → 扫雪 ——
  const broomLayer = document.querySelector("#broom-hotspots");
  const broomOutline = document.querySelector("#broom-outline");
  const broomOutlineEdge = document.querySelector("#broom-outline-edge");
  const broomTarget = document.querySelector("#broom-target");
  const broomPanel = document.querySelector("#broom-inspect");
  const sweepButton = document.querySelector("#sweep-start");

  function updateBroomProjection(projection) {
    if (!broomLayer) return;
    if (!projection) {
      broomLayer.toggleAttribute("hidden", true);
      if (broomTarget) broomTarget.hidden = true;
      return;
    }
    const silhouette = silhouettePath(scene?.broomSilhouette(), 1.4);
    if (silhouette) {
      broomOutline.setAttribute("d", silhouette);
      broomOutlineEdge.setAttribute("d", silhouette);
    }
    broomLayer.toggleAttribute("hidden", false);
    const xs = projection.outline.map(([x]) => x);
    const ys = projection.outline.map(([, y]) => y);
    const left = Math.min(...xs), top = Math.min(...ys);
    if (broomTarget) {
      broomTarget.hidden = false;
      Object.assign(broomTarget.style, {
        left: (left - 10) + "px",
        top: (top - 8) + "px",
        width: (Math.max(...xs) - left + 20) + "px",
        height: (Math.max(...ys) - top + 16) + "px"
      });
    }
  }

  function openBroom() {
    if (!broomPanel) return;
    closeFood(); closeCrop(); closeSickle(); closeFire();
    broomPanel.hidden = false;
    if (sweepButton) {
      sweepButton.textContent = document.body.classList.contains("sweep-mode") ? "结束扫雪" : "开始扫雪";
    }
    broomTarget.setAttribute("aria-expanded", "true");
    scene?.focusBroom();
  }

  function closeBroom() {
    if (!broomPanel || broomPanel.hidden) return;
    broomPanel.hidden = true;
    broomTarget?.setAttribute("aria-expanded", "false");
    scene?.releaseBroom();
  }

  broomTarget?.addEventListener("click", () => {
    broomPanel.hidden ? openBroom() : closeBroom();
  });
  document.querySelector("#broom-return")?.addEventListener("click", closeBroom);

  function setSweepMode(on) {
    document.body.classList.toggle("sweep-mode", on);
    scene?.setSweepMode(on);
    if (on) {
      cropOutlines.textContent = "";
      cropLayer.toggleAttribute("hidden", true);
      if (cropTarget) cropTarget.hidden = true;
      cropHulls = []; cropCentres = []; cropIndices = [];
    } else if (scene) {
      updateCropProjection(scene.cropProjection());
    }
  }

  sweepButton?.addEventListener("click", () => {
    const on = !document.body.classList.contains("sweep-mode");
    closeBroom();
    setSweepMode(on);
  });

  if (scene) scene.onSickleView = updateSickleProjection;
  // —— 火塘：描边 → 拉近 → 烤糍粑 ——
  const fireLayer = document.querySelector("#fire-hotspots");
  const fireOutline = document.querySelector("#fire-outline");
  const fireOutlineEdge = document.querySelector("#fire-outline-edge");
  const fireTarget = document.querySelector("#fire-target");
  const firePanel = document.querySelector("#fire-inspect");
  const roastButton = document.querySelector("#roast-start");

  function updateFireProjection(projection) {
    if (!fireLayer) return;
    if (!projection) {
      fireLayer.toggleAttribute("hidden", true);
      if (fireTarget) fireTarget.hidden = true;
      return;
    }
    const silhouette = silhouettePath(scene?.fireSilhouette(), 1.4);
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
        left: (left - 12) + "px",
        top: (top - 10) + "px",
        width: (Math.max(...xs) - left + 24) + "px",
        height: (Math.max(...ys) - top + 20) + "px"
      });
    }
  }

  function openFire() {
    if (!firePanel) return;
    // 正在扫雪时点火塘：退出扫雪，人走回火边
    if (document.body.classList.contains("sweep-mode")) {
      scene?.returnToFire();
      setSweepMode(false);
    }
    closeFood(); closeCrop(); closeSickle(); closeBroom();
    firePanel.hidden = false;
    fireTarget.setAttribute("aria-expanded", "true");
    scene?.focusFire();
  }
  function closeFire() {
    if (!firePanel || firePanel.hidden) return;
    firePanel.hidden = true;
    fireTarget?.setAttribute("aria-expanded", "false");
    scene?.releaseFire();
  }

  fireTarget?.addEventListener("click", () => {
    firePanel.hidden ? openFire() : closeFire();
  });
  document.querySelector("#fire-return")?.addEventListener("click", closeFire);
  roastButton?.addEventListener("click", () => {
    if (scene?.roastCake()) {
      roastButton.textContent = "再烤一块";
      roastButton.disabled = false;
    }
  });

  if (scene) scene.onBroomView = updateBroomProjection;
  if (scene) scene.onFireView = updateFireProjection;

  if (!scene) return;

  function openPoleInspection() {
    if (!poleInspection.hidden) return;
    closeFood();
    closeCrop();
    poleInspection.hidden=false;
    poleTarget.setAttribute("aria-expanded","true");
    gnomonToggle?.setAttribute("aria-pressed","true");
    exhibit.classList.add("gnomon-focused");
    canvas.classList.remove("gnomon-hover");
    scene.focusGnomon();
    poleReturn.focus({preventScroll:true});
  }
  function closePoleInspection() {
    if (poleInspection.hidden) return;
    poleInspection.hidden=true;
    poleTarget.setAttribute("aria-expanded","false");
    gnomonToggle?.setAttribute("aria-pressed","false");
    exhibit.classList.remove("gnomon-focused");
    scene.releaseGnomon();
    canvas.focus({preventScroll:true});
  }
  function hitsPole(event) {
    return poleInspection.hidden && !poleTarget.hidden && !exhibit.classList.contains("hud-hidden") &&
      clickedInside(poleTarget,event);
  }
  poleTarget.addEventListener("click",openPoleInspection);
  poleReturn.addEventListener("click",closePoleInspection);
  exhibit.addEventListener("keydown",event => {
    if (event.key==="Escape" && !guide.open && !poleInspection.hidden) {
      event.preventDefault();
      closePoleInspection();
    }
  });

  const points = new Map();
  let hadPinch = false;
  const distance = () => {
    const [a,b] = points.values();
    return Math.hypot(a.x - b.x,a.y - b.y);
  };

  canvas.addEventListener("pointerdown", event => {
    if ((event.button !== 0 && event.button !== 1 && event.button !== 2) || points.size === 2) return;
    if (event.button === 1) event.preventDefault();
    const poleClick=points.size===0 && event.button===0 && hitsPole(event);
    const cropClick=!poleClick && points.size===0 && event.button===0 &&
      (hitsCrop(event) || document.body.classList.contains("harvest-mode") ||
        document.body.classList.contains("sweep-mode"));
    for (const point of points.values()) point.poleClick=false;
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
          if (document.body.classList.contains("sweep-mode")) {
            const rect = canvas.getBoundingClientRect();
            const px = event.clientX - rect.left, py = event.clientY - rect.top;
            const fire = scene ? scene.campfireScreen() : null;
            const box = scene ? scene.fireHitBox() : null;
            const onFire = (box && px >= box[0] - 14 && px <= box[2] + 14 &&
              py >= box[1] - 14 && py <= box[3] + 14) ||
              (fire && Math.hypot(px - fire[0], py - fire[1]) < 30);
            if (onFire) {
              scene.returnToFire();
              setSweepMode(false);
              openFire();
              return;
            }
            const spot = scene ? scene.snowSpotAt(px, py, 56) : -1;
            if (spot >= 0) scene.sweepSpot(spot);
            return;
          }
          if (document.body.classList.contains("harvest-mode")) {
            const rect = canvas.getBoundingClientRect();
            const index = scene ? scene.plantAtScreen(event.clientX - rect.left, event.clientY - rect.top, 30) : -1;
            if (index >= 0) { scene.harvestPlant(index); return; }
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
      if (!poleInspection.hidden) closePoleInspection();
      else scene.reset();
    }
  });

  // —— 背景音乐：不裁剪，只做浅入浅出。直接调 audio 音量，不经过 AudioContext ——
  const soundToggle = document.querySelector("#sound-toggle");
  const bgm = new Audio();
  bgm.src = "assets/bgm.mp3";
  bgm.preload = "auto";
  bgm.loop = false;
  const BGM_LEVEL = .55, FADE_IN = 1, FADE_OUT = 4.5;
  let soundOn = false, fadeTimer = null, bgmFading = false;

  function fadeTo(target, seconds, done) {
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
    bgmFading = false;
    if (bgm.ended || bgm.currentTime > .2) bgm.currentTime = 0;
    bgm.volume = 0;
    const started = bgm.play();
    if (started && started.catch) started.catch(() => { /* 等用户操作再试 */ });
    fadeTo(BGM_LEVEL, FADE_IN);
  }

  function pauseBgm() {
    fadeTo(0, 1.2, () => { if (!soundOn) bgm.pause(); });
  }

  // 结尾前浅出，放完再从开头浅入
  bgm.addEventListener("timeupdate", () => {
    if (!soundOn || !bgm.duration || bgmFading) return;
    if (bgm.duration - bgm.currentTime <= FADE_OUT) {
      bgmFading = true;
      fadeTo(0, FADE_OUT);
    }
  });
  bgm.addEventListener("ended", () => {
    bgmFading = false;
    if (soundOn) playBgm();
  });

  function rememberBgm(on) {
    try { localStorage.setItem("yyzs-bgm", on ? "on" : "off"); } catch (error) { /* 忽略 */ }
  }

  function armFirstGesture() {
    const arm = () => {
      window.removeEventListener("pointerdown", arm, true);
      window.removeEventListener("keydown", arm, true);
      if (soundOn) playBgm();
    };
    window.addEventListener("pointerdown", arm, true);
    window.addEventListener("keydown", arm, true);
  }

  let storedBgm = null;
  try { storedBgm = localStorage.getItem("yyzs-bgm"); } catch (error) { storedBgm = null; }
  if (storedBgm === "on") {
    soundOn = true;
    soundToggle?.setAttribute("aria-pressed", "true");
    armFirstGesture();
  }

  soundToggle?.addEventListener("click", () => {
    soundOn = !soundOn;
    soundToggle.setAttribute("aria-pressed", String(soundOn));
    rememberBgm(soundOn);
    if (soundOn) playBgm();
    else pauseBgm();
  });

  // 临时诊断：把播放状态写到 <html> 上，方便排查
  setInterval(() => {
    document.documentElement.setAttribute("data-bgm",
      [soundOn ? "on" : "off", "rs" + bgm.readyState, bgm.paused ? "paused" : "playing",
       "v" + bgm.volume.toFixed(2), bgm.error ? "err" + bgm.error.code : "ok"].join(" "));
  }, 700);

  gnomonToggle?.addEventListener("click", () => {
    if (poleInspection.hidden) openPoleInspection();
    else closePoleInspection();
  });
  document.querySelector("#zoom-in").addEventListener("click", () => scene.magnify(1.15));
  document.querySelector("#zoom-out").addEventListener("click", () => scene.magnify(1/1.15));
  document.querySelector("#reset-view").addEventListener("click", () => {
    if (!poleInspection.hidden) closePoleInspection();
    else scene.reset();
  });
})();

