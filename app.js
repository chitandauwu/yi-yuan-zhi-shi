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
  if (scene) scene.onGnomonView=updatePoleProjection;
  showTerm("grain");
  if (!scene) return;

  function openPoleInspection() {
    if (!poleInspection.hidden) return;
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
    for (const point of points.values()) point.poleClick=false;
    points.set(event.pointerId,{x:event.clientX,y:event.clientY,pan:event.button!==0,poleClick});
    canvas.setPointerCapture(event.pointerId);
    if (points.size === 2) {
      hadPinch = true;
      scene.beginInteraction("pinch");
    } else if (!poleClick) {
      hadPinch = false;
      scene.beginInteraction("drag");
    }
    if (!poleClick) canvas.classList.add("dragging");
  });
  canvas.addEventListener("pointermove", event => {
    const old = points.get(event.pointerId);
    if (!old) {
      canvas.classList.toggle("gnomon-hover",hitsPole(event));
      return;
    }
    const pinching = points.size === 2;
    const before = pinching ? distance() : 0;
    const dx=event.clientX-old.x, dy=event.clientY-old.y;
    if (old.poleClick) {
      if (Math.hypot(dx,dy)<5) return;
      old.poleClick=false;
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
        if (!point.poleClick) scene.endInteraction(!hadPinch);
        hadPinch = false;
      }
      if (type==="pointerup" && point.poleClick &&
          Math.hypot(event.clientX-point.x,event.clientY-point.y)<5 && hitsPole(event)) openPoleInspection();
    });
  }
  canvas.addEventListener("pointerleave",() => canvas.classList.remove("gnomon-hover"));
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
