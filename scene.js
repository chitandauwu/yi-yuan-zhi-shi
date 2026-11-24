(() => {
  "use strict";

  const subtract = (a, b) => a.map((value, i) => value - b[i]);
  const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = vector => {
    const length = Math.hypot(...vector);
    return length ? vector.map(value => value / length) : [0, 1, 0];
  };
  const pigments = new Map();
  function color(hex) {
    let rgb = pigments.get(hex);
    if (!rgb) {
      rgb = [0,2,4].map(i => parseInt(hex.slice(i,i+2),16)/255);
      pigments.set(hex,rgb);
    }
    return rgb;
  }
  const around = (min, max, value) => Math.max(min, Math.min(max, value));
  const campfire = {x:1.64,z:1.51,ground:.26};
  const porchLanterns = [1.10,3.42];
  const practicalLights = [
    ...porchLanterns.map(x => [x,1.93,.51,2.20]),
    [campfire.x,.78,campfire.z,3.85]
  ];
  const practicalTint = [1,.52,.18];
  const lanternStrength = {rain:.92,grain:.48,dew:.90,winter:1.22};
  
  const seasonColors = {
    rain: {
      ground: "a8a777", grass: "76be54", second: "a6da66", tree: "68b350",
      tile: "3c707c", path: "d0c5a2", water: "68b5c2",
      light: [1.02, 1.07, 1.01], sunTint: [1.08, 1.06, .95], shadowTint: [.75, .90, .96]
    },
    grain: {
      ground: "beb184", grass: "4c9649", second: "76bb54", tree: "429046",
      tile: "396675", path: "d8cca8", water: "52b8b5",
      light: [1.05, 1.04, .96], sunTint: [1.10, 1.06, .92], shadowTint: [.72, .89, .96]
    },
    dew: {
      ground: "c4ac7e", grass: "a99c4a", second: "cfa84a", tree: "d65a3c",
      tile: "335474", path: "dcc69f", water: "6da0b0",
      light: [1.08, 1.01, .92], sunTint: [1.18, 1.02, .84], shadowTint: [.72, .80, .98]
    },
    winter: {
      ground: "b4bcc4", grass: "7e9478", second: "bacbd6", tree: "6e6865",
      tile: "2f4a66", path: "ccd8e0", water: "769cb6",
      light: [.92, .97, 1.08], sunTint: [1.04, 1.02, .98], shadowTint: [.68, .80, 1.04]
    }
  };

  class Mesh {
    constructor() {
      this.data = [];
      this.emissive = false;
    }
    face(vertices, pigment) {
      const normal = unit(cross(subtract(vertices[1], vertices[0]), subtract(vertices[2], vertices[0])));
      // A negative pigment marks light-emitting faces in both renderers.
      const rgb = this.emissive ? color(pigment).map(channel => -channel) : color(pigment);
      for (let i = 1; i < vertices.length - 1; i++) {
        for (const vertex of [vertices[0], vertices[i], vertices[i + 1]]) this.data.push(...vertex, ...normal, ...rgb);
      }
    }
    box(x, y, z, w, h, d, top, side = top) {
      const a = x - w / 2, b = x + w / 2, c = y - h / 2, e = y + h / 2, f = z - d / 2, g = z + d / 2;
      this.face([[a,e,g],[b,e,g],[b,e,f],[a,e,f]], top);
      this.face([[a,c,g],[b,c,g],[b,e,g],[a,e,g]], side);
      this.face([[b,c,g],[b,c,f],[b,e,f],[b,e,g]], side);
      this.face([[a,c,f],[a,c,g],[a,e,g],[a,e,f]], side);
      this.face([[b,c,f],[a,c,f],[a,e,f],[b,e,f]], side);
      this.face([[a,c,f],[b,c,f],[b,c,g],[a,c,g]], side);
    }
    beam(start, end, width, depth, pigment) {
      const direction = unit(subtract(end, start));
      const crossAxis = Math.abs(direction[0]) > 0.8 ? [0, 0, 1] : [1, 0, 0];
      const side = unit(cross(crossAxis, direction));
      const across = cross(side, direction);
      const ring = center => [[-1,-1], [1,-1], [1,1], [-1,1]].map(([a,b]) => center.map((v,i) => v + across[i] * a * width / 2 + side[i] * b * depth / 2));
      const lower = ring(start), upper = ring(end);
      this.face([...lower].reverse(), pigment);
      this.face(upper, pigment);
      for (let i = 0; i < 4; i++) {
        const next = (i + 1) % 4;
        this.face([lower[i], lower[next], upper[next], upper[i]], pigment);
      }
    }
    revolved(x, z, rings, pigments, sides = 12) {
      const ring = ([y, radius]) => Array.from({length: sides}, (_, i) => {
        const angle = 2 * Math.PI * i / sides;
        return [x + radius * Math.cos(angle), y, z + radius * Math.sin(angle)];
      });
      const levels = rings.map(ring);
      for (let j = 0; j < levels.length - 1; j++) {
        for (let i = 0; i < sides; i++) {
          const after = (i + 1) % sides;
          this.face([levels[j][i], levels[j + 1][i], levels[j + 1][after], levels[j][after]], pigments[j % pigments.length]);
        }
      }
      if (rings[0][1] > 0) this.face(levels[0], pigments[0]);
      if (rings.at(-1)[1] > 0) this.face([...levels.at(-1)].reverse(), pigments.at(-1));
    }
    canopy(x, y, z, radius, pigment, flatten = 1) {
      const sides = 7;
      const rings = [[-.63,.48],[0,1],[.68,.54]].map(([height, width], j) => Array.from({length: sides}, (_, i) => {
        const angle = (i + j * .31) * 2 * Math.PI / sides;
        return [x + radius * width * Math.cos(angle), y + radius * height * flatten, z + radius * width * .84 * Math.sin(angle)];
      }));
      this.face(rings[0], pigment);
      this.face([...rings[2]].reverse(), pigment);
      for (let j = 0; j < 2; j++) {
        for (let i = 0; i < sides; i++) {
          const n = (i + 1) % sides;
          this.face([rings[j][i], rings[j + 1][i], rings[j][n]], pigment);
          this.face([rings[j][n], rings[j + 1][i], rings[j + 1][n]], pigment);
        }
      }
    }
  }

  const plot = {left:-1.74, right:6.53, near:2.59, far:14.58};
  const shallowWater = {height:.280,opacity:.57};
  const outletZ = 4.72;
  const rainPools = [[-.65,4.3,.43],[1.6,5.9,.55],[4.0,7.6,.56],
    [.54,9.1,.46],[5.3,11.2,.5],[2.8,12.9,.56],[-.55,13.3,.41]];
  const footprint = {left:-3.05, right:7.84, back:-5.36, front:15.46};
  const variation = seed => {
    const value = Math.sin(seed * 127.1 + 83.2) * 43758.5453;
    return value - Math.floor(value);
  };

  const yardTrees = [
    { x:-2.82, z:4.35, scale:.95, lean:-1, kind:"willow" },
    { x:7.32, z:4.10, scale:1.05, lean:1, kind:"broadleaf" },
    { x:7.27, z:8.02, scale:.61, lean:1, kind:"willow" }
  ];
  const treeLeaves = {
    rain: ["4da142","74c24f","a1dc64","c8eb7e"],
    grain: ["2e7c42","44984e","67b858","99d468"],
    dew: ["b83c2e","d95838","ee863a","f5ba4a"]
  };
  const springBlossoms = ["ea716b","f59a8e","fbd0c6","89c960","f2857b"];
  const autumnWillow = ["8da842","ccb23c","e8c646","f4df6e"];
  const autumnLeaves = ["c94432","e36d3a","f2ab3c","d98434"];
  const springPetals = ["f49288","fcc5bc","e66d68","f8b0a6"];
  // Coordinates are relative to the base of each tree.
  const branches = {
    willow: [
      [[.15,1.30,.12],[.85,2.47,-.42],[1.22,2.87,-.72],.67],
      [[.28,1.94,.11],[-.37,2.81,.66],[-.61,3.10,1.02],.76],
      [[.45,2.53,.08],[.33,3.21,-.28],[.63,3.70,-.24],.87],
      [[.33,2.20,.11],[1.12,2.75,.53],[1.63,3.08,.85],.71],
      [[.46,2.63,.08],[.87,3.36,.47],[1.01,3.54,.71],.68]
    ],
    broadleaf: [
      [[.11,1.70,.03],[.67,2.63,.66],[.91,3.24,1.03],.94],
      [[.30,2.02,.10],[-.40,2.72,.47],[-.48,3.21,.62],.76],
      [[.41,2.48,.09],[.99,3.26,-.35],[1.61,3.74,-.58],.95],
      [[.47,2.68,.10],[.17,3.58,-.50],[.34,4.03,-.87],.98],
      [[.44,2.55,.10],[.45,3.49,.42],[.68,4.12,.68],1.02]
    ]
  };

  function bough(mesh, start, end, base, tip, bark) {
    const axes = [[1,0],[.5,.866],[-.5,.866],[-1,0],[-.5,-.866],[.5,-.866]];
    const ring = (point,radius) => axes.map(([x,z]) => [point[0]+x*radius,point[1],point[2]+z*radius]);
    const low = ring(start,base), high = ring(end,tip);
    for (let i=0;i<axes.length;i++) {
      const next=(i+1)%axes.length;
      mesh.face([low[i],high[i],high[next],low[next]],bark[i%bark.length]);
    }
  }

  function growTree(mesh, tree, term) {
    const {x,z,scale,lean,kind} = tree;
    const at = ([a,b,c]) => [x+a*scale*lean,.245+b*scale,z+c*scale];
    const bark = kind === "willow" ? ["74614b","887357","605245"] : ["745342","8b6850","624c41"];
    const stem = [[0,0,0],[.09,1.04,.03],[.29,1.96,.11],[.47,2.75,.10],[.50,3.14,.15]];
    const widths = [.27,.20,.15,.096,.037];
    for (let i=1;i<stem.length;i++) {
      bough(mesh,at(stem[i-1]),at(stem[i]),widths[i-1]*scale,widths[i]*scale,bark);
    }
    for (const [i,[start,bend,tip,size]] of branches[kind].entries()) {
      bough(mesh,at(start),at(bend),.115*scale,.056*scale,bark);
      bough(mesh,at(bend),at(tip),.062*scale,.020*scale,bark);
      for (const side of [-1,1]) {
        const twig = [tip[0]+side*.39,tip[1]+.29,tip[2]+side*.26];
        bough(mesh,at(bend),at(twig),.039*scale,.008*scale,bark);
      }
      if (term === "winter") {
        if (kind === "willow") {
          const sweep = [tip[0]+.17,tip[1]-.55,tip[2]+.13];
          mesh.beam(at(tip),at(sweep),.017*scale,.017*scale,bark[1]);
        }
        // Light snow dusting resting on upper bough forks.
        mesh.canopy(...at([bend[0],bend[1]+.09,bend[2]]),.16*scale,"f0f7fb",.36);
        mesh.canopy(...at([tip[0],tip[1]+.06,tip[2]]),.12*scale,"e4f0f7",.38);
        continue;
      }

      const willow = kind === "willow";
      const spread = term === "rain" ? (willow ? .78 : .76) : term === "dew" && willow ? .92 : 1.02;
      const palette = term === "rain" && !willow ? springBlossoms
        : term === "dew" && willow ? autumnWillow
        : treeLeaves[term];
      for (let j=0;j<8;j++) {
        const angle = j*2.4 + i*.72;
        const radius = j===0 ? 0 : size*(.43+.27*variation(i*17+j));
        const tuft = [tip[0]+Math.cos(angle)*radius,tip[1]+.16+variation(j+i*11)*.28,
          tip[2]+Math.sin(angle)*radius];
        const bulk = size*scale*spread*(j===0 ? 1 : .45+.25*variation(j*13+i));
        mesh.canopy(...at(tuft),bulk,palette[(i+j)%palette.length],willow ? .81 : 1.02);
        treeSpots.push([at(tuft)[0], at(tuft)[1], at(tuft)[2], bulk]);
        if (willow && j%2===0) {
          const droop = [tuft[0]+.14,tuft[1]-.68,tuft[2]+.1];
          mesh.beam(at(tuft),at(droop),.018*scale,.018*scale,palette[1]);
          mesh.canopy(...at(droop),bulk*.30,palette[2],2.6);
        }
      }
    }

    for (let i=0;i<5;i++) {
      const angle=i*2.4;
      bough(mesh,at([0,.19,0]),at([Math.cos(angle)*.40,.029,Math.sin(angle)*.46]),.11*scale,.025*scale,bark);
      const rock=at([Math.cos(angle)*.48,.017,Math.sin(angle)*.60]);
      mesh.canopy(...rock,(.12+variation(i)*.13)*scale,i%2 ? "9b957e" : "ada38b",.42);
    }
  }

  function leaf(mesh, x, y, z, size, heading, tilt, tone) {
    const dx=Math.cos(heading)*size, dz=Math.sin(heading)*size;
    const width=.42*Math.cos(tilt), bend=.42*Math.sin(tilt)*size;
    const tip=[x+dx,y,z+dz], stem=[x-dx*.7,y,z-dz*.7], rib=[x,y+.023,z];
    mesh.face([stem,rib,tip,[x-dz*width,y+bend,z+dx*width]],tone);
    mesh.face([stem,[x+dz*width,y-bend,z-dx*width],tip,rib],tone);
  }

  function stone(mesh, x, y, z, width, height, depth, face, edge) {
    const outline=[[-.50,-.31],[-.34,-.50],[.36,-.50],[.50,-.31],
      [.50,.34],[.36,.50],[-.35,.50],[-.50,.34]];
    const ring=(level,inset)=>outline.map(([dx,dz])=>[x+dx*width*inset,level,z+dz*depth*inset]);
    const bottom=ring(y-height/2,1), shoulder=ring(y+height*.22,1), top=ring(y+height/2,.88);
    mesh.face([...top].reverse(),face);
    for (let i=0;i<outline.length;i++) {
      const next=(i+1)%outline.length;
      mesh.face([bottom[i],shoulder[i],shoulder[next],bottom[next]],edge);
      mesh.face([shoulder[i],top[i],top[next],shoulder[next]],face);
    }
  }

  function platform(mesh, state) {
    const {left,right,back,front} = footprint;
    const cut=.32;
    const shape=[[left,back+cut],[left+cut,back],[right-cut,back],[right,back+cut],
      [right,front-cut],[right-cut,front],[left+cut,front],[left,front-cut]];
    const centerX=(left+right)/2, centerZ=(back+front)/2;
    const rings=[[-.87,.963],[-.73,.993],[-.42,.993],[-.34,1],[.12,1],[.24,.981]]
      .map(([y,scale]) => shape.map(([x,z]) => [centerX+(x-centerX)*scale,y,centerZ+(z-centerZ)*scale]));
    const strata = ["42372e","69503b","b49a6c","988569",state.grass];
    mesh.face([...rings.at(-1)].reverse(), state.ground);
    for (let j = 0; j < rings.length - 1; j++) {
      for (let i = 0; i < shape.length; i++) {
        const n = (i + 1) % shape.length;
        mesh.face([rings[j][i],rings[j + 1][i],rings[j + 1][n],rings[j][n]],strata[j]);
      }
    }
    const marks=(length) => Math.floor((length-.84)/.68);
    for (let i=0; i<marks(right-left); i++) {
      const x=left+.52+i*.68;
      const tone=["c6b598","ad9c82","bbac90","d3c0a0"][i%4];
      stone(mesh,x,-.11,front+.008,.61+variation(i)*.043,.27,.039,tone,"8c775e");
    }
    for (let i=0; i<marks(front-back); i++) {
      const z=back+.52+i*.68;
      const tone=["bdac91","aa9b84","c9b79a","b4a389"][i%4];
      stone(mesh,right+.008,-.11,z,.039,.27,.61+variation(i+40)*.041,tone,"897761");
      stone(mesh,left-.008,-.11,z,.039,.27,.61+variation(i+13)*.041,tone,"897761");
    }
  }

  function farmhouse(mesh, state, term) {
    // Three bays share a single ridge. Both roof planes extend beyond the bearing walls.
    const xmin = -1.95, xmax = 6.55, rear = -4.13, front = -.57;
    const cx = (xmin + xmax) / 2, cz = (rear + front) / 2;
    const walls = "f6eee0", beam = "5e3724", timber = "a15f38", footing = "988872";
    mesh.box(cx, .39, cz, 8.78, .30, 3.78, "bfb49c", footing);
    mesh.box(cx, 1.67, cz, 8.5, 2.28, 3.56, walls);
    mesh.box(cx,.645,front+.024,8.49,.22,.069,"aa9d81","968669");
    mesh.box(cx,2.61,front+.043,8.55,.18,.095,"865f43","6d4b36");
    for (let i=0; i<21; i++) {
      const x=xmin+.20+i*.407;
      mesh.box(x,.498,front+.113,.373,.112,.104,i%3===0 ? "b6a48a" : "9a8f7b");
    }
    for (let i=0; i<9; i++) {
      const z=rear+.23+i*.397;
      mesh.box(xmin-.04,.619,z,.12,.16,.38,i%2===0 ? "ad9b80" : "b8ab92");
      mesh.box(xmax+.04,.619,z,.12,.16,.38,i%2===0 ? "ad9b80" : "b8ab92");
    }
    mesh.box(cx,2.73,rear-.025,8.57,.15,.13,timber,beam);
    for (const x of [xmin+.32,2.3,xmax-.32]) mesh.box(x,1.67,rear-.028,.13,2.21,.11,timber,beam);
    for (const x of [-.71,5.22]) {
      mesh.box(x,1.68,rear-.075,.79,.68,.11,beam);
      for (let i=0;i<5;i++) mesh.box(x-.31+i*.155,1.68,rear-.139,.138,.56,.041,i%2 ? "ab8258" : "a27b54");
    }
    for (const x of [xmin, -.05, 2.94, 4.93, xmax]) mesh.box(x, 1.66, front + .048, .15, 2.25, .19, timber, beam);
    for (const x of [xmin, xmax]) {
      for (const z of [rear + .13, cz]) mesh.box(x, 1.70, z, .14, 2.32, .15, timber, beam);
      mesh.face([[x,2.81,rear],[x,2.81,front],[x,4.18,cz]], walls);
      mesh.face([[x,2.81,front],[x,2.81,rear],[x,4.18,cz]], walls);
      mesh.box(x, 2.78, cz, .15, .13, 3.60, timber, beam);
      mesh.box(x, 3.43, cz, .13, 1.36, .12, timber, beam);
    }

    const doorX = 2.27;
    mesh.box(doorX, 1.39, front + .085, 1.68, 1.83, .13, "613b26");
    for (let i = 0; i < 8; i++) {
      const x = doorX - .73 + i * .207;
      mesh.box(x, 1.39, front + .165, .196, 1.69, .066, i < 4 ? "b37243" : "c2814f");
    }
    for (const y of [.56, 2.26]) mesh.box(doorX, y, front + .219, 1.81, .12, .16, timber, beam);
    for (const x of [doorX - .84,doorX + .84]) mesh.box(x, 1.40, front + .205,.11,1.83,.12,timber,beam);
    for (const x of [doorX-.17,doorX+.17]) {
      mesh.box(x,1.35,front+.23,.087,.155,.045,"574538");
      mesh.beam([x-.027,1.36,front+.27],[x+.028,1.31,front+.274],.024,.022,"e6ba5e");
    }
    if (term === "rain" || term === "winter") {
      // Traditional red paper couplet strips and 45-degree rotated door diamond bring warm seasonal accent.
      for (const side of [-1,1]) {
        mesh.box(doorX + side*.94, 1.44, front + .17, .12, 1.24, .016, "c93e32");
      }
      mesh.box(doorX, 2.38, front + .21, .92, .13, .016, "c93e32");
      const dz = front + .216, dy = 1.70, r1 = .16, r2 = .072;
      mesh.face([[doorX,dy+r1,dz],[doorX-r1,dy,dz],[doorX,dy-r1,dz],[doorX+r1,dy,dz]],"cf4032");
      mesh.face([[doorX,dy+r2,dz+.006],[doorX-r2,dy,dz+.006],[doorX,dy-r2,dz+.006],[doorX+r2,dy,dz+.006]],"f4cd66");
    }
    mesh.box(doorX,2.40,front+.11,1.85,.16,.16,"7e5237");
    for (let i=0;i<6;i++) mesh.box(doorX-.72+i*.288,2.40,front+.21,.039,.096,.026,"c49560");
    const glowingWindow = term === "winter" || term === "rain";
    const paneColors = term === "winter" ? ["ffc65e","ffe292"]
      : term === "rain" ? ["f2be6b","fbd488"]
      : term === "dew" ? ["f0c778","fae09e"]
      : ["efe0bc","f8edd2"];
    for (const x of [-1.02, 4.24, 5.66]) {
      const width = x > 5 ? .68 : .97;
      mesh.box(x, 1.65, front + .067, width + .17, .86, .17, timber, beam);
      mesh.box(x,1.66,front+.163,width,.68,.037,"3e3129");
      mesh.emissive = glowingWindow;
      for (const side of [-1,1]) {
        const pane = x + side*width*.13;
        mesh.box(pane,1.67,front+.186,width*.21,.53,.015,side<0 ? paneColors[0] : paneColors[1]);
      }
      mesh.emissive = false;
      for (let i = -1; i <= 1; i++) mesh.box(x + i * width / 4,1.66,front + .196,.065,.68,.051,"c49864");
      mesh.box(x, 1.66, front + .192, width, .055, .053, "c49864");
      mesh.box(x, 1.26, front + .18, width + .24,.10,.29,"a57d55",beam);
    }
    mesh.box(xmax + .035, 1.6, -2.59, .12, .73, .88, beam);
    for (let i = 0; i < 5; i++) mesh.box(xmax + .105,1.6,-2.94 + i * .176,.045,.63,.155,"af8c65");

    mesh.box(cx, .356, -.24, 8.76,.225,.95, state.path, footing);
    stone(mesh,doorX,.315,.29,1.98,.15,.43,"bfb296","887862");
    stone(mesh,doorX,.273,.56,2.12,.068,.25,"ab9b7f","887862");
    mesh.box(cx, 2.53, .12, 8.73,.16,.21,timber,beam);
    for (const x of [xmin + .13, .37, 4.56, xmax - .13]) {
      mesh.box(x,.50,.12,.29,.17,.30,"a79a7e",footing);
      mesh.box(x,1.54,.12,.15,2.07,.15,timber,beam);
    }

    const roofX = [-2.37,6.99];
    const profile = [[-4.62,2.62],[-4.07,2.93],[-3.41,3.34],[-2.35,4.23],[-1.26,3.31],[-.47,2.79],[.56,2.60]];
    const tileSets = {
      rain: ["316470","3c727c","457f86","386a78","4f8a8e"],
      grain: ["325f70","3d6d7c","477985","396678","52858f"],
      dew: ["2c4a6b","36577a","406386","325273","4a6e90"],
      winter: ["273f5c","304b6a","395776","2c4664","436280"]
    };
    const tileTones = tileSets[term] || tileSets.grain;
    const roofHeight = z => {
      const i=profile.findIndex(([point]) => point>=z);
      if (i<1) return profile[i===0 ? 0 : profile.length-1][1];
      const [za,ya]=profile[i-1], [zb,yb]=profile[i];
      return ya+(yb-ya)*(z-za)/(zb-za);
    };
    const [a,b] = roofX;
    for (let i=0; i<profile.length-1; i++) {
      const [z0,y0]=profile[i], [z1,y1]=profile[i+1];
      mesh.face([[a,y0,z0],[a,y1,z1],[b,y1,z1],[b,y0,z0]],state.tile);
      mesh.face([[b,y0-.14,z0],[b,y1-.14,z1],[a,y1-.14,z1],[a,y0-.14,z0]],"734d34");
      for (const x of [a,b]) mesh.beam([x,y0-.052,z0],[x,y1-.052,z1],.119,.144,state.tile);
    }
    for (let column=0; column<44; column++) {
      const x=a+.108+column*(b-a-.216)/43;
      const width=.105;
      for (const [ridge,eave] of [[-2.35,.56],[-2.35,-4.62]]) {
        const direction=Math.sign(eave-ridge);
        const rows=Math.round(Math.abs(eave-ridge)/.21);
        for (let row=0; row<rows; row++) {
          const step=(eave-ridge)/rows;
          const z0=ridge+step*row, z1=ridge+step*(row+1);
          const y0=roofHeight(z0), y1=roofHeight(z1);
          const snowLine = .48 + .20*Math.sin(column*.25+direction) + .10*Math.cos(column*.67);
          const covered = term === "winter" && (row+.45)/rows < snowLine;
          const tone = covered ? "e8f2f8" : tileTones[Math.floor(variation(column*7+direction)*tileTones.length)];
          const glaze = covered ? "f4f9fc" : row%5===3 && variation(column+row*3)>.63 ? tileTones[4] : state.tile;
          const lip = covered ? ["bed4e3","cce0ec"] : ["364d59","2d424e"];
          const edges=[
            [[x-width,y0+.013,z0],[x-width,y1+.020,z1],[x,y1+.070,z1],[x,y0+.057,z0]],
            [[x,y0+.057,z0],[x,y1+.070,z1],[x+width,y1+.020,z1],[x+width,y0+.013,z0]]
          ];
          for (const [i,face] of edges.entries()) mesh.face(direction>0 ? face : face.reverse(),i===0 ? tone : glaze);
          const edge=.017*(row===rows-1 ? 2.4 : 1);
          mesh.face([[x-width,y1+.013-edge,z1+direction*.005],[x,y1+.063-edge,z1+direction*.005],[x,y1+.063,z1],[x-width,y1+.013,z1]],lip[0]);
          mesh.face([[x,y1+.063-edge,z1+direction*.005],[x+width,y1+.013-edge,z1+direction*.005],[x+width,y1+.013,z1],[x,y1+.063,z1]],lip[1]);
        }
      }
    }
    for (const [z,y] of [profile[0],profile.at(-1)]) mesh.beam([a,y-.084,z],[b,y-.084,z],.145,.12,"3a525e");
    mesh.beam([a-.025,4.285,cz],[b+.025,4.285,cz],.155,.174,"324c5c");
    for (let section=0;section<12;section++) {
      const x0=a+section*(b-a)/12, x1=a+(section+1)*(b-a)/12;
      const tone = term==="winter" ? "eff6fa" : section%3 ? tileTones[1] : tileTones[4];
      mesh.beam([x0+.023,4.37,cz],[x1-.023,4.37,cz],.14,.099,tone);
    }
    for (const x of [a+.11,b-.11]) {
      mesh.beam([x-.075,4.28,cz],[x+.075,4.28,cz],.20,.218,"6c8486");
    }
    for (let i=0; i<23; i++) {
      const x=a+.23+i*.40;
      mesh.beam([x,roofHeight(.24)-.17,.24],[x,roofHeight(.54)-.16,.54],.080,.078,"a36840");
    }

    mesh.revolved(5.40,.54,[[.24,.29],[.33,.37],[.72,.42],[.92,.36],[1.01,.34],[1.025,.28]],["9e5438","c4704a","b5603e","7d422c"]);
    mesh.revolved(5.40,.54,[[1.026,.27],[1.029,.265]],[state.water],16);
    mesh.box(6.04,.40,.76,.59,.30,.25,"ad7e50","8c613e");
    mesh.beam([6.2,.39,.25],[6.07,1.26,-.41],.07,.07,"b08452");
    mesh.box(-1.13,.46,.45,.82,.11,.35,"bd8e58","8f6642");
    for (const x of [-1.42,-.84]) mesh.box(x,.34,.45,.12,.21,.23,"8c6240");
    mesh.revolved(4.53,.31,[[.24,.16],[.29,.21],[.64,.26],[.69,.25]],["a07448","c4975c","a6804e"],10);
    for (const y of [.31,.54]) mesh.revolved(4.53,.31,[[y,.225],[y+.044,.228]],[ "70543a"],10);
    mesh.revolved(6.26,.88,[[.24,.23],[.31,.27],[.37,.26],[.39,.21]],["b58c52","d1ae6c","a28254"],12);

    // A small bamboo drying rack and a woven tray make the porch feel occupied.
    const trayX=.58, trayY=.85, trayZ=.28, trayR=.39;
    const at=(x,y)=>[trayX+x,trayY+y,trayZ-y*.30];
    const rim=Array.from({length:16},(_,i)=>{
      const angle=i*Math.PI/8;
      return at(trayR*Math.cos(angle),trayR*Math.sin(angle));
    });
    mesh.face(rim,term==="grain" ? "efc556" : "c49254");
    for (let i=0;i<rim.length;i++) mesh.beam(rim[i],rim[(i+1)%rim.length],.031,.025,"946038");
    for (let i=-4;i<=4;i++) {
      const y=i*.075, x=Math.sqrt(trayR*trayR-y*y)-.022;
      const left=at(-x,y), right=at(x,y);
      const weave = term==="grain" ? (i%2 ? "f7d772" : "dfb040") : (i%2 ? "d4a96a" : "9e7448");
      mesh.beam([left[0],left[1],left[2]+.019],[right[0],right[1],right[2]+.019],.013,.012,weave);
    }
    if (term==="dew") {
      // Bright orange-red persimmons drying on the porch tray.
      for (let i=0;i<7;i++) {
        const angle=i*2.4, r=i===0 ? 0 : .17;
        const p=at(Math.cos(angle)*r,Math.sin(angle)*r);
        mesh.canopy(p[0],p[1],p[2]+.045,.058,i%2 ? "eb632e" : "f58638",.8);
      }
    }
    for (const x of [3.61,4.21]) {
      mesh.beam([x,.24,.46],[x,.72,.33],.045,.045,"946b3e");
      mesh.beam([x,.24,.21],[x,.72,.33],.039,.039,"b3854c");
    }
    for (let i=0;i<5;i++) mesh.beam([3.55,.72,.25+i*.032],[4.27,.72,.25+i*.032],.027,.022,"ba8d50");
    for (const x of porchLanterns) {
      mesh.beam([x,2.53,.19],[x,2.05,.26],.017,.020,"75482e");
      mesh.revolved(x,.26,[[2.036,.088],[2.069,.087],[2.08,.038]],["8c452d","bd6e3e"],10);
      mesh.revolved(x,.26,[[1.775,.039],[1.80,.083],[1.818,.105]],["94422a","c45a36"],10);
      mesh.emissive = true;
      mesh.revolved(x,.26,[[1.816,.100],[1.854,.143],[1.906,.153],[1.969,.148],[2.036,.087]],
        ["eb5e2e","ff973b","ffdb73","ffa845"],10);
      mesh.emissive = false;
      mesh.beam([x,1.78,.26],[x,1.70,.268],.026,.024,"cc3c30");
    }
  }

  function blade(mesh, x, z, height, bend, tone) {
    const y = .282;
    const stem = [x,y,z], tip = [x+bend,y+height,z+.10];
    const center = [x+bend*.31,y+height*.45,z+.034];
    const width = height * .077;
    mesh.face([stem,[center[0]+width,center[1],center[2]],tip,[center[0]-width,center[1],center[2]]],tone);
    mesh.face([stem,[center[0],center[1],center[2]+width],tip,[center[0],center[1],center[2]-width]],tone);
  }

  // 记录本季画出来的每一株作物，描边时只用这些点求凸包
  let cropSpots = [];
  let cropRanges = [];
  let treeSpots = [];

  // 每季只框一小块：夏秋是田角的一畦秧稻，冬天是那块还绿着的菜畦
  const CROP_FOCUS = {
    rain:   {x: 7.32, z: 4.10, y: 4.05, zoom: 3.0},
    grain:  {x: -.04, z: 4.36, y: .82, zoom: 2.7},
    dew:    {x: -.04, z: 4.36, y: .95, zoom: 2.7},
    winter: {x: -2.24, z: 10.30, y: .60, zoom: 2.7}
  };

  const CROP_BOX = {
    rain:   {left:-1.54, right:1.46, near:2.86, far:5.86, y:.31},
    grain:  {left:-1.54, right:1.46, near:2.86, far:5.86, y:.31},
    dew:    {left:-1.54, right:1.46, near:2.86, far:5.86, y:.31},
    winter: {left:-2.62, right:-1.86, near:8.10, far:12.48, y:.31}
  };

  function field(mesh, term, state) {
    const {left,right,near,far} = plot;
    const x = (left+right)/2, z = (near+far)/2, width = right-left, depth = far-near;
    const wet = term === "grain", tall = term === "dew";
    const soil = {rain:"785c45",grain:"8f7d60",dew:"967f5a",winter:"806e66"}[term];
    const soilHeight=wet ? .259 : .2745;
    mesh.box(x,(.24+soilHeight)/2,z,width,soilHeight-.24,depth,soil);
    if (term === "rain") {
      for (const [px,pz,radius] of rainPools) {
        const edge = Array.from({length:16}, (_, i) => {
          const angle = -i * Math.PI / 8;
          const reach = radius * (.88 + variation(i+10) * .23);
          return [px + Math.cos(angle) * reach,.281,pz + Math.sin(angle) * reach * .70];
        });
        mesh.face(edge,"65a4b0");
      }
    }
    for (const edge of [near,far]) {
      mesh.box(x,.293,edge,width+.32,.137,.29,state.grass,"8b7454");
      for (let i=0; i<18; i++) {
        const px=left+i*width/17;
        mesh.canopy(px,.363,edge+Math.sin(i*2.9)*.105,.105+variation(i)*.18,i%3 ? state.second : "968462",.39);
      }
    }
    for (const edge of [left,right]) {
      const hasOutlet=tall && edge===left;
      const sections=hasOutlet ? [[near,outletZ-.24],[outletZ+.24,far]] : [[near,far]];
      for (const [start,end] of sections) {
        mesh.box(edge,.293,(start+end)/2,.33,.137,end-start,state.grass,"8b7454");
      }
      for (let i=0; i<14; i++) {
        const pz=near+i*depth/13;
        if (hasOutlet && Math.abs(pz-outletZ)<.48) continue;
        mesh.canopy(edge+Math.sin(i*2.1)*.08,.356,pz,.11+variation(i+20)*.16,i%4 ? state.grass : state.path,.49);
      }
    }

    const plantRows = 18;
    for (let row=0; row<8; row++) {
      const px=left+.52+row*(width-1.04)/7;
      if (!wet && !tall) {
        mesh.box(px,.279,z,.075,.018,depth-.67,term==="rain" ? "a68a67" : "b19a74");
      }
      if (wet) {
        for (let section=0;section<5;section++) {
          const start=near+.27+section*(depth-.54)/5;
          const ridgeZ=start+.70+variation(row+section*8)*.39;
          mesh.box(px-.12,.263,ridgeZ,.23,.014,.97+variation(section+row*3)*.86,
            section%2 ? "a59878" : "7b705f");
        }
      }
      for (let i=0; i<plantRows; i++) {
        const pz=near+.43+i*(depth-.84)/(plantRows-1)+variation(i+row*19)*.12;
        const dx=px-gnomon.x, dz=pz-gnomon.z;
        if (dx*.8+dz*.6>=-.35 && dx*.8+dz*.6<=1.95 && Math.abs(-dx*.6+dz*.8)<.40) continue;
        if ((wet && (i>12 && row<4)) || (tall && row===0 && Math.abs(pz-outletZ)<.43) || term==="rain") continue;
        const seed=row*41+i, height=tall ? .70 : wet ? .37 : .12;
        const stemX=px+variation(seed)*.13-.065;
        const tones=tall ? ["c4932e","e0b640","f4d15a"] : wet ? ["348a36","50ad44","82d150"] : ["b39262","c9aa76","9c7f58"];
        const plantStart = Math.round(mesh.data.length / 9);
        for (let b=-2; b<=2; b++) {
          const length=height*(.72+variation(seed+b)*.32);
          blade(mesh,stemX+b*.026,pz+(b%2)*.077,length,b*height*.20,tones[(b+seed+8)%3]);
        }
        if (tall && i%3!==1) mesh.beam([stemX,.71,pz],[stemX+.18,.94,pz+.05],.044,.036,"fae074");
        cropSpots.push([stemX, pz, height]);
        cropRanges.push([plantStart, Math.round(mesh.data.length / 9)]);
        if (wet && (row+i)%3===0) {
          mesh.box(stemX+.24,.263,pz+.22,.28+variation(seed)*.26,.004,.028,"a99a7c");
        }
      }
    }

    const paving=term==="winter" ? ["899595","99a19d","828e8e","929b99"] :
      ["c1b495","cbbd9e","b1a389","bbb099"];
    // A small courtyard separates the doorway from the head of the field.
    mesh.box(x,.249,1.49,width+.37,.021,1.96,state.path,"a99b7e");
    for (let i=0; i<15; i++) {
      const px=left+.10+i*(width+.07)/14, pz=.8+Math.sin(i*.62)*.067;
      stone(mesh,px,.276,pz,.55,.064,.35+variation(i)*.16,paving[i%4],"9a8b71");
    }
    for (let i=0; i<22; i++) {
      const pz=near+.29+i*(depth-.26)/22;
      stone(mesh,right+.52+Math.sin(i*.51)*.049,.272,pz,.43+variation(i)*.13,.057,.44,paving[(i+1)%4],"9a8b71");
    }
    mesh.box(left-.37,.262,2.59,.29,.036,1.12,wet ? "829f91" : "8c8d74");
    stone(mesh,left-.37,.307,2.07,.43,.12,.23,"b6a586","8b7d64");
  }

  function plantsAndTools(mesh, term, state) {
    const stones=["aa9e86","908770","bbb098","988e79"];
    for (let i=0; i<24; i++) {
      const seed=i*13+74;
      const z=plot.near-.18+variation(seed+5)*(plot.far-plot.near+.37);
      const x=i%2 ? footprint.left+.24+variation(seed)*.37 : footprint.right-.25-variation(seed)*.28;
      const size=.07+variation(seed+9)*.16;
      mesh.canopy(x,.255+size*.08,z,size,i%5===0 ? stones[i%4] : state.grass,.48);
      if (i%4===0) mesh.canopy(x+.09,.26,z+.17,size*.68,state.second,.48);
    }

    for (let i=0;i<20;i++) {
      const x=i<12 ? plot.left-.55+variation(i+537)*.26 : plot.right+.93+variation(i+619)*.15;
      const z=plot.near+.27+variation(i+29)*(plot.far-plot.near-.6);
      if (term==="winter") {
        for (let k=0;k<3;k++) blade(mesh,x+k*.027,z,.10+variation(i+k+85)*.11,(k-1)*.062,"b8a379");
      } else {
        for (let k=0;k<4;k++) {
          const height=.16+variation(i+k+85)*.24, bend=(k-1.5)*.09;
          blade(mesh,x+k*.027,z,height,bend,k%2 ? state.grass : state.second);
        }
      }
    }

    for (let i=0; i<6; i++) {
      const row=i<4 ? 0 : 1, x=-1.45+(i%4)*.18+row*.1;
      mesh.beam([x,.35+row*.14,.80],[x,.35+row*.14,1.18],.145,.154,"9a7552");
      mesh.box(x,.35+row*.14,1.19,.11,.10,.022,"bd9766");
    }
    mesh.revolved(-.38,1.43,[[.26,.25],[.49,.24],[.51,.23]],["8b6545","b39069"],10);

    if (term==="rain") {
      // Scattered fallen apricot petals and tiny yellow spring blooms along the courtyard and bank.
      for (let i=0; i<16; i++) {
        const x=4.6+variation(i+31)*2.7, z=.55+variation(i+67)*2.6;
        mesh.face([[x-.05,.268,z],[x+.06,.268,z-.06],[x+.09,.268,z+.05]],springPetals[i%4]);
      }
      for (let i=0; i<10; i++) {
        const x=i%2 ? plot.left-.36+variation(i+81)*.22 : plot.right+.28+variation(i+93)*.22;
        const z=plot.near+.8+i*1.12;
        mesh.canopy(x,.41,z,.055,i%3 ? "f6d956" : "f4938a",.75);
      }
    }
    if (term==="dew") {
      for (let i=0; i<16; i++) {
        const x=3.6+variation(i+14)*1.72, z=1.35+variation(i+52)*.82;
        mesh.face([[x-.06,.267,z],[x+.07,.267,z-.08],[x+.13,.267,z+.07]],autumnLeaves[i%4]);
      }
    }
    if (term==="grain") {
      for (let i=0; i<14; i++) {
        const angle=i*2.40, x=-.92+Math.cos(angle)*.12, z=10.42+Math.sin(angle)*.13;
        mesh.beam([x,.31,z],[x+Math.cos(angle)*.11,.77+(i%3)*.035,z+Math.sin(angle)*.13],.035,.026,i%2 ? "84cf50" : "439e46");
      }
      mesh.revolved(-.92,10.42,[[.40,.14],[.445,.14]],["d1a854"],10);
      // Early-summer pink-white water iris / lotus buds beside the side ditch.
      for (const [bx,bz] of [[-2.30,2.45],[-2.44,2.85],[-2.26,3.20]]) {
        mesh.beam([bx,.26,bz],[bx,.55,bz],.024,.024,"46944e");
        mesh.canopy(bx,.59,bz,.078,"f58da0",1.15);
        mesh.canopy(bx+.03,.63,bz-.02,.048,"fbd4dc",1.0);
      }
    }
  }

  const sunHeading = [-.8,-.6];
  const shadeOpacity = {rain:.52,grain:.80,dew:.84,winter:.62};
  const hazeColor = {rain:"a4d4c6",grain:"b6e0cc",dew:"cfbda8",winter:"b8cee0"};
  const gnomon = {x:-2.45,z:1.02,base:.345,height:1.02,radius:.062};

  function sundialStand(mesh) {
    const {x,z,base,height}=gnomon;
    const point=(along,across,y)=>[x+along*.8-across*.6,y,z+along*.6+across*.8];
    // 圭长随杆高走：最长影子落在刻度内，石板才不用变更长度
    const L=height*1.6;
    const slab=(start,end,width,y,tone)=>{
      mesh.face([point(start,-width,y),point(start,width,y),point(end,width,y),point(end,-width,y)],tone);
    };
    slab(-.20,L,.25,base-.011,"988a71");
    slab(-.17,L-.03,.214,base,"d9c9a9");
    for (const side of [-.25,.25]) {
      mesh.face([point(-.20,side,.275),point(L,side,.275),
        point(L,side,base-.011),point(-.20,side,base-.011)],"91826c");
    }
    slab(.13,L-.13,.012,base+.003,"a89574");
    for (let i=1;i<=6;i++) {
      const place=i*height/4;
      slab(place-.013,place+.013,i%4===0 ? .18 : .102,base+.004,
        i%4===0 ? "78674c" : "b3a07f");
    }
    mesh.box(x,base+.019,z,.19,.038,.19,"a89b81","88785d");
    mesh.beam([x,base+.038,z],[x,base+height,z],gnomon.radius*2,gnomon.radius*2,"80613f");
  }

  // —— 门口墙边靠着的镰刀：抢收用的道具 ——
  const sickleAt = { x: 2.92, z: -.24 };

  function sickleProp(mesh) {
    const { x, z } = sickleAt;
    const g = .345;
    const topX = x + .10, topY = g + .86, topZ = z + .04;
    // 木柄：下粗上细，斜靠墙边
    mesh.beam([x, g, z], [topX, topY, topZ], .075, .066, "6b4626");
    mesh.beam([x, g + .02, z], [x + .01, g + .20, z + .005], .098, .090, "51351e");
    mesh.beam([topX - .02, topY - .10, topZ], [topX, topY, topZ], .058, .052, "9a6b3a");
    // 刃根的铁箍
    mesh.box(topX, topY - .05, topZ + .01, .075, .075, .075, "8d939a", "71777d");
    // 刀刃：内半径小、外半径大的一段弯月，用一圈四边形拼出来
    const hub = [topX + .02, topY - .03, topZ + .02];
    const steps = 9, R = .46, r = .30, from = -.42, sweep = 2.15;
    const at = (radius, angle) => [
      hub[0] + Math.cos(angle) * radius,
      hub[1] + Math.sin(angle) * radius * .52,
      hub[2] + .035
    ];
    for (let i = 0; i < steps; i++) {
      const a0 = from + sweep * i / steps, a1 = from + sweep * (i + 1) / steps;
      const o0 = at(R, a0), o1 = at(R, a1), i0 = at(r, a0), i1 = at(r, a1);
      const shade = i < steps - 1 ? (i % 2 ? "9aa3ac" : "c3cad2") : "dfe6ec";
      mesh.face([o0, o1, i1, i0], shade);
      mesh.face([o0, i0, i1, o1], "6f767d");
    }
    // 刀尖
    const tipOuter = at(R, from + sweep), tipInner = at(r, from + sweep);
    mesh.face([tipOuter, tipInner, [hub[0] + Math.cos(from + sweep + .18) * .33,
      hub[1] + Math.sin(from + sweep + .18) * .33 * .52, hub[2] + .035]], "f2f6f9");
  }

  // —— 冬天：门口墙边靠着的竹扫把，用来扫雪 ——
  const broomAt = { x: 2.92, z: -.24 };

  function broomProp(mesh) {
    const { x, z } = broomAt;
    const g = .345;
    const topX = x + .16, topY = g + .96, topZ = z + .05;
    // 竹柄
    mesh.beam([x, g + .05, z], [topX, topY, topZ], .048, .044, "b98449");
    mesh.beam([x, g + .05, z], [x + .02, g + .30, z + .01], .062, .056, "9c6c3a");
    // 上端缠绳
    mesh.box(topX - .02, topY - .06, topZ, .062, .05, .062, "8d6b3f", "6f5330");
    // 下端的穗：从柄脚散开
    const hub = [x + .01, g + .34, z + .01];
    for (let i = 0; i < 15; i++) {
      const a = -.72 + i * .103;
      const reach = .30 + variation(i + 5) * .09;
      mesh.beam(hub, [hub[0] + Math.sin(a) * reach, g - .015, hub[2] + Math.cos(a) * reach * .55],
        .050, .030, i % 2 ? "c9a45c" : "dcbe7e");
    }
    // 穗心补一块，免得太透
    mesh.box(hub[0], g + .16, hub[2], .17, .30, .13, "c9a45c", "b8924f");
    // 穗根的铁箍
    mesh.box(hub[0], hub[1] + .03, hub[2], .085, .06, .085, "8a7355", "6b573e");
  }

  // —— 门口那张食桌：桌面一张、四条腿，四季换一样吃食 ——
  const foodTableAt = { x: 4.72, z: 1.86, height: .44, top: 1.24, deep: .84 };
  const FOOD_GROUND = .345;   // 檐前铺地石的高度
  const FOOD_TOP = FOOD_GROUND + foodTableAt.height + .045;

  function foodBall(mesh, x, y, z, r, color) {
    mesh.revolved(x, z, [[y - r, 0], [y - r * .5, r * .86], [y + r * .28, r * .74], [y + r, 0]], [color], 9);
  }

  function foodPlate(mesh, x, y, z, r, color, rim) {
    mesh.revolved(x, z, [[y, r], [y + .018, r * .92], [y + .045, r * .74]], [color], 12);
    mesh.revolved(x, z, [[y + .045, r * .74], [y + .052, r * .60]], [rim], 12);
  }

  let cakeRanges = [];

  function foodTable(mesh, term) {
    const {x, z, height, top, deep} = foodTableAt;
    const g = FOOD_GROUND;
    mesh.box(x, g + height, z, top, .07, deep, "b08249", "8e6636");
    mesh.box(x, g + height - .05, z, top - .06, .03, deep - .06, "8e6636", "7a5730");
    for (const [dx, dz] of [[-.38,-.23],[.38,-.23],[-.38,.23],[.38,.23]]) {
      mesh.box(x + dx, g + height / 2, z + dz, .075, height, .075, "7d5730", "6b4a28");
    }
    const y = FOOD_TOP;
    if (term === "rain") {
      // 青团
      foodPlate(mesh, x, y, z, .40, "e7dcc4", "cbbfa5");
      foodBall(mesh, x - .15, y + .13, z + .03, .125, "7f9c52");
      foodBall(mesh, x + .12, y + .13, z - .04, .125, "73924a");
      foodBall(mesh, x + .01, y + .13, z + .16, .115, "8aaa5d");
    } else if (term === "grain") {
      // 粽子：四角锥两只，外加一道麻绳
      const cone = (cx, cz, rot, color) => {
        const h = .21, r = .135;
        const a = [cx + Math.cos(rot) * r, y, cz + Math.sin(rot) * r];
        const b = [cx + Math.cos(rot + 2.1) * r, y, cz + Math.sin(rot + 2.1) * r];
        const c = [cx + Math.cos(rot + 4.2) * r, y, cz + Math.sin(rot + 4.2) * r];
        const d = [cx, y + h, cz];
        mesh.face([a, b, d], color);
        mesh.face([b, c, d], color);
        mesh.face([c, a, d], color);
        mesh.face([a, c, b], color);
      };
      foodPlate(mesh, x, y, z, .38, "e7dcc4", "cbbfa5");
      cone(x - .13, z + .03, .4, "5f7f42");
      cone(x + .14, z - .05, 2.2, "6d8c4a");
      mesh.beam([x - .22, y + .14, z + .03], [x - .04, y + .17, z + .03], .014, .014, "d8c9a8");
    } else if (term === "dew") {
      // 柿子
      foodPlate(mesh, x, y, z, .40, "e7dcc4", "cbbfa5");
      foodBall(mesh, x - .14, y + .13, z + .05, .125, "cf6f38");
      foodBall(mesh, x + .14, y + .13, z + .01, .125, "c26230");
      foodBall(mesh, x + .00, y + .13, z + .19, .115, "d87b41");
      for (const [dx, dz] of [[-.14,.05],[.14,.01],[0,.19]]) {
        mesh.box(x + dx, y + .255, z + dz, .07, .03, .07, "6f7f4a", "5d6b3d");
      }
    } else {
      // 糍粑：三块煎得两面焦黄的糯米糕
      foodPlate(mesh, x, y, z, .40, "e7dcc4", "cbbfa5");
      for (const [dx, dz, rot] of [[-.15,.03,.2],[.14,-.04,-.3],[.00,.18,.8]]) {
        const cakeStart = mesh.data.length / 9;
        mesh.box(x + dx, y + .06, z + dz, .24, .10, .17, "f4ecd8", "d9b478");
        cakeRanges.push([cakeStart, mesh.data.length / 9]);
      }
    }
  }

  function chrysanthemum(mesh, x, base, z, scale, seed) {
    for (let i=0;i<13;i++) {
      const angle=i*2.4, reach=(i===0 ? 0 : .18+variation(seed+i)*.42)*scale;
      const dx=Math.cos(angle)*reach, dz=Math.sin(angle)*reach;
      const height=(.52+variation(seed+i*3)*.36)*scale;
      const stem=[x+dx,base+height,z+dz];
      mesh.beam([x+dx*.24,base,z+dz*.24],stem,.024*scale,.025*scale,"687548");
      for (const side of [-1,1]) {
        const y=base+height*(side>0 ? .61 : .43);
        leaf(mesh,x+dx*.66+side*.094*scale,y,z+dz*.66,.143*scale,angle+side*.9,.38,
          side>0 ? "6f8152" : "566b45");
      }
      const radius=(.12+variation(seed+i*11)*.048)*scale;
      for (const [count,spread,lift,tone] of [[12,1,.037,"f7b628"],[9,.72,.074,"ffe458"]]) {
        for (let j=0;j<count;j++) {
          const theta=j*2*Math.PI/count+angle;
          const at=(distance,side,y)=>[stem[0]+Math.cos(theta)*distance-Math.sin(theta)*side,
            stem[1]+y*scale,stem[2]+Math.sin(theta)*distance+Math.cos(theta)*side];
          const edge=radius*spread;
          mesh.face([at(edge*.12,0,0),at(edge*.74,edge*.16,lift*.6),
            at(edge,0,lift),at(edge*.74,-edge*.15,lift*.53)],tone);
        }
      }
      mesh.canopy(stem[0],stem[1]+.051*scale,stem[2],radius*.27,"e07622",.62);
    }
  }

  function seasonalDetails(mesh, term) {
    if (term === "rain") {
      // A shallow channel crosses the bank beside the willow.
      mesh.box(-2.38,.245,3.44,.37,.015,2.57,"5baab8");
      for (const side of [-1,1]) {
        mesh.box(-2.38+side*.25,.28,3.47,.14,.073,2.65,"7f694e");
      }
      mesh.beam([-2.62,.322,2.7],[-2.12,.322,2.7],.12,.085,"be9d70");
      return;
    }
    if (term === "grain") {
      const x=-2.27, z=10.60;
      mesh.revolved(x,z,[[.26,.34],[.33,.44],[.41,.46],[.45,.42]],
        ["a17b4e","cc9f5a","aa7b46"],12);
      for (let i=0;i<17;i++) {
        const angle=i*2.4, reach=.32*Math.sqrt(variation(i+42));
        blade(mesh,x+Math.cos(angle)*reach,z+Math.sin(angle)*reach,
          .27+variation(i+19)*.23,(variation(i+51)-.5)*.25,i%2 ? "84cf50" : "3d9942");
      }
      return;
    }
    if (term === "dew") {
      // A break in the field bank connects the drained paddy to the side ditch.
      mesh.box(plot.left-.11,.279,outletZ,.99,.012,.27,"68b0bf");
      mesh.box(plot.left-.62,.253,outletZ-.24,.29,.023,1.53,"5a9eb0");
      for (const offset of [-.21,.21]) {
        mesh.box(plot.left-.08,.40,outletZ+offset,.084,.30,.085,"8a6342");
      }
      mesh.box(plot.left-.08,.49,outletZ,.073,.11,.36,"b88b58");
      for (const [x,z,scale,seed] of [[-.02,1.68,.93,21],[1.10,1.67,1.05,34],[7.22,4.68,.79,76]]) {
        mesh.revolved(x,z,[[.245,.27*scale],[.30,.33*scale],[.58,.40*scale],[.61,.42*scale],[.63,.37*scale]],
          ["b8593a","d4734c","e0875a","9e4b30"],12);
        mesh.revolved(x,z,[[.614,.37*scale],[.618,.37*scale]],["6b523b"],12);
        chrysanthemum(mesh,x,.62,z,scale,seed);
      }
      for (const {x,z,lean} of yardTrees) {
        for (let i=0;i<24;i++) {
          const angle=i*2.4, spread=.28+variation(i+23)*1.24;
          const px=around(footprint.left+.14,footprint.right-.14,x+lean*.32+Math.cos(angle)*spread*.71);
          const pz=z+Math.sin(angle)*spread;
          leaf(mesh,px,.282+variation(i)*.014,pz,.078+variation(i+5)*.078,angle,.28,autumnLeaves[i%4]);
        }
      }
      chrysanthemum(mesh,-2.36,.25,12.26,.94,91);
      chrysanthemum(mesh,-2.42,.25,13.41,.81,53);
      return;
    }
    const mildGreen = ["33824a","4ba058","66b866","86cc70"];
    mesh.box(-2.24,.268,10.29,.73,.058,4.29,"7d6d5c","6b5c4c");
    for (let i=0;i<16;i++) {
      const x=-2.40+(i%2)*.34, z=8.54+Math.floor(i/2)*.50;
      cropSpots.push([x, z, .16]);
      for (let j=0;j<5;j++) {
        const angle=j*2.4+i;
        leaf(mesh,x+Math.cos(angle)*.10,.336,z+Math.sin(angle)*.10,.12,angle,.48,mildGreen[j%4]);
      }
    }
    // Red-berried winter nandina / plum twigs beside the well and porch give a crisp winter accent.
    for (const [bx,bz] of [[-2.15,5.65],[5.75,1.55]]) {
      mesh.beam([bx,.26,bz],[bx+.06,.86,bz-.04],.03,.03,"5c4235");
      mesh.beam([bx,.26,bz],[bx-.11,.74,bz+.09],.025,.025,"6e4e3e");
      for (let k=0;k<7;k++) {
        const a=k*2.4;
        mesh.canopy(bx+Math.cos(a)*.12,.72+(k%3)*.09,bz+Math.sin(a)*.12,.048,k%2 ? "d93a32" : "ef5a4a",.95);
      }
    }
    for (let i=0;i<21;i++) {
      const x=i%2 ? plot.left-.43+variation(i+16)*.32 : plot.right+.72+variation(i+16)*.44;
      const z=plot.near+.31+variation(i+68)*(plot.far-plot.near-.49);
      mesh.canopy(x,.271,z,.15+variation(i+77)*.27,"edf5fa",.12);
    }
    for (let i=0;i<16;i++) {
      const x=plot.left+.02+variation(i+18)*(plot.right-plot.left-.05);
      const z=i%2 ? plot.far-.10 : plot.near+.09;
      mesh.canopy(x,.370,z,.20+variation(i+44)*.29,"f4f9fc",.12);
    }
    for (const [x,z,spread] of [[-.60,4.1,.84],[3.95,4.45,.60],[1.76,7.0,.77],
      [5.1,8.6,.84],[-.68,9.2,.54],[3.2,10.8,.64],[.35,12.6,.89]]) {
      for (let i=0;i<4;i++) {
        const angle=i*2.4, width=spread*(.44+variation(i+z)*.38);
        const cx=x+Math.cos(angle)*spread*.44, cz=z+Math.sin(angle)*spread*.55;
        const edge=Array.from({length:10},(_,j)=>{
          const theta=-j*Math.PI/5, reach=width*(.78+variation(i*13+j+z)*.35);
          return [cx+Math.cos(theta)*reach,.287+i*.001,cz+Math.sin(theta)*reach*.66];
        });
        mesh.face(edge,i%3 ? "f3f8fc" : "dcecf5");
      }
    }
    mesh.revolved(.84,.97,[[.255,.23],[.33,.32],[.57,.30],[.62,.24]],
      ["b5724e","c97e54","7a5340"],10);
    mesh.revolved(.84,.97,[[.62,.16],[.68,.235],[.80,.21],[.858,.16],[.86,.045]],
      ["3f4b52","576268","48545c","424442"],12);
    mesh.canopy(.84,.884,.97,.045,"8c543e",.65);
  }

  function bambooFence(mesh, startX, endX, z) {
    const sections=Math.round((endX-startX)/.82);
    const pitch=(endX-startX)/sections;
    for (let i=0;i<=sections;i++) {
      const x=startX+i*pitch;
      mesh.box(x,.51,z,.105,.53,.108,"ad9062","856a4c");
      mesh.box(x,.78,z,.14,.065,.143,"a98a60","745a42");
      if (i===sections) break;
      for (let j=1;j<=3;j++) {
        const height=.36+variation(i*4+j)*.08;
        const slatX=x+pitch*j/4;
        mesh.box(slatX,.26+height/2,z+.009,.048,height,.056,"c3a46c",j%2 ? "a98b5d" : "b99a65");
      }
    }
    for (const y of [.38,.58]) {
      mesh.beam([startX,y,z-.027],[endX,y,z-.027],.049,.060,"9e8155");
    }
  }

  function waterWell(mesh) {
    const x=-2.37, z=6.96;
    const point=(radius,y,angle)=>[x+Math.cos(angle)*radius,y,z+Math.sin(angle)*radius];
    mesh.revolved(x,z,[[.24,.42],[.30,.44],[.34,.39]],["969181","aaa28c"],12);
    mesh.revolved(x,z,[[.435,.29],[.441,.294]],["758e87"],12);
    for (let tier=0;tier<2;tier++) {
      const base=.33+tier*.194, top=base+.183;
      for (let side=0;side<12;side++) {
        const a=(side+.5*tier)*Math.PI/6+.017, b=a+Math.PI/6-.034;
        const stoneTone=["aaa490","989483","bcb29a"][Math.floor(variation(side+tier*9)*3)];
        const rim=tier ? .43 : .40;
        mesh.face([point(rim,base,a),point(rim,top,a),point(rim,top,b),point(rim,base,b)],stoneTone);
        mesh.face([point(rim,top,a),point(.28,top,a),point(.28,top,b),point(rim,top,b)],stoneTone);
        mesh.face([point(.28,base,b),point(.28,top,b),point(.28,top,a),point(.28,base,a)],"7c7a6c");
      }
    }
    const bucketX=-2.48, bucketZ=6.25;
    mesh.revolved(bucketX,bucketZ,[[.248,.139],[.289,.163],[.583,.195],[.608,.196],[.612,.166]],
      ["906a46","a77d50","b28a57","806347"],10);
    for (const [y,radius] of [[.32,.169],[.538,.192]]) {
      mesh.revolved(bucketX,bucketZ,[[y,radius],[y+.023,radius+.002]],["69594a"],10);
    }
    mesh.revolved(bucketX,bucketZ,[[.526,.161],[.529,.162]],["756547"],10);
    for (let i=0;i<8;i++) {
      const at=angle=>[bucketX+Math.cos(angle)*.173,.59+Math.sin(angle)*.16,bucketZ];
      mesh.beam(at(i*Math.PI/8),at((i+1)*Math.PI/8),.016,.016,"685744");
    }
  }

  function porchSupplies(mesh, term) {
    // Drying pole and folded cloths are placed clear of the doorway.
    const z=1.02, startX=5.93, endX=7.46;
    for (const x of [startX,endX]) {
      stone(mesh,x,.272,z,.30,.082,.29,"b0a58d","95896f");
      mesh.beam([x,.30,z],[x,1.59,z],.095,.085,"a88955");
      mesh.beam([x,.34,z],[x,.58,z-.24],.066,.062,"927345");
    }
    mesh.beam([startX-.07,1.52,z],[endX+.07,1.52,z],.061,.062,"be9e63");
    if (term!=="rain") {
      for (const [x,width,length,shade,hem] of [
        [6.31,.46,.57,"cf5a42","f6dfb0"],[6.98,.51,.46,"3c6f94","c8e4ee"]
      ]) {
        for (let i=0;i<6;i++) {
          const left=x+(i/6-.5)*width, right=left+width/6;
          const fold=i%2 ? .036 : .015;
          const y=1.52-length+Math.sin(i*Math.PI/6)*.046;
          mesh.face([[left,1.53,z],[left,y,z+fold],[right,y,z+fold],[right,1.53,z]],shade);
          mesh.face([[left,y+.042,z+fold+.008],[left,y,z+fold+.008],
            [right,y,z+fold+.008],[right,y+.042,z+fold+.008]],hem);
        }
      }
    }
    const crockX=3.85, crockZ=.99;
    mesh.revolved(crockX,crockZ,[[.248,.21],[.30,.26],[.62,.29],[.74,.22],[.76,.18]],
      ["7a5843","996c50","76523e","604536"],12);
    mesh.revolved(crockX,crockZ,[[.759,.21],[.797,.22],[.822,.14],[.835,.064]],["b39568","c3ab7b"],12);
    mesh.revolved(crockX,crockZ,[[.837,.052],[.90,.048]],["8b704e"],8);
    const stoolX=4.43, stoolZ=1.30;
    for (const dx of [-.19,.19]) {
      for (const dz of [-.103,.103]) {
        mesh.beam([stoolX+dx*1.16,.255,stoolZ+dz*1.14],[stoolX+dx,.53,stoolZ+dz],.063,.062,"816045");
      }
    }
    mesh.box(stoolX,.554,stoolZ,.55,.075,.30,"ba9667","98734e");
    mesh.revolved(stoolX,stoolZ,[[.591,.072],[.628,.059],[.677,.087],[.683,.085]],
      ["ad855a","d1bea0","83978c"],10);
    for (let i=0;i<3;i++) {
      const z=-1.06-i*.36, y=.86+i*.10;
      mesh.beam([-2.10,.27,z+.22],[-2.02,y+.38,z],.052,.052,"977653");
      mesh.beam([-2.02,y+.36,z],[-2.02,y+.36,z-.125],.064,.068,i%2 ? "807e6c" : "5a6460");
    }
    if (term==="rain") {
      // Put things that need to stay dry against the wall.
      mesh.box(3.57,.753,.35,.30,.08,.22,"788f95","657d82");
      mesh.box(3.83,.803,.35,.26,.045,.19,"b78f75","9b745a");
    }
  }

  function driftingPetals(mesh, time) {
    const {x,z,kind,lean,scale} = yardTrees[1];
    for (let i=0;i<12;i++) {
      const phase=(time*(.16+variation(i+47)*.09)+variation(i+91))%1;
      const tip=branches[kind][i%5][2];
      const flutter=time*3.9+i*2.1;
      const fallX=x+(tip[0]*lean*.76+Math.sin(flutter)*.30)*scale-phase*(3.2+variation(i)*1.7);
      const fallZ=z+tip[2]*scale+phase*2.6+Math.cos(flutter)*.26;
      const fallY=.32+(1-Math.pow(phase,1.45))*tip[1]*scale*.95;
      leaf(mesh,fallX,fallY,fallZ,.088+variation(i+23)*.045,flutter*.6,flutter,springPetals[i%4]);
    }
  }

  function driftingLeaves(mesh, time) {
    for (const [treeIndex,tree] of yardTrees.entries()) {
      const {x,z,kind,lean,scale} = tree;
      for (let i=0;i<8;i++) {
        const seed=i+treeIndex*9;
        const phase=(time*(.19+variation(seed+39)*.10)+variation(seed+65))%1;
        const tip=branches[kind][i%5][2];
        const flutter=time*4.4+seed*2;
        const fallX=x+(tip[0]*lean*.78+Math.sin(flutter)*.28)*scale-phase*(3.8+variation(seed)*1.9);
        const fallZ=z+tip[2]*scale+phase*2.25+Math.cos(flutter)*.28;
        const fallY=.31+(1-Math.pow(phase,1.65))*tip[1]*scale*.99;
        leaf(mesh,fallX,fallY,fallZ,.11+variation(seed+31)*.063,flutter*.56,flutter,autumnLeaves[i%4]);
      }
    }
  }

  function dragonflies(mesh, time) {
    for (let i=0;i<2;i++) {
      const turn=time*(.89+i*.23)+i*2.4;
      const x=2.5+Math.cos(turn)*(1.34+i*.40), z=7.5+Math.sin(turn)*(1.44+i*.7);
      const y=.72+Math.sin(turn*2)*.21+i*.17;
      const angle=Math.atan2(Math.cos(turn),-Math.sin(turn));
      const at=(a,b,c) => [x+a*Math.cos(angle)-c*Math.sin(angle),y+b,z+a*Math.sin(angle)+c*Math.cos(angle)];
      mesh.beam(at(-.12,0,0),at(.13,0,0),.034,.036,i ? "2c85b8" : "249e9c");
      const flap=Math.cos(time*51+i)*.095;
      for (const side of [-1,1]) {
        mesh.face([at(.055,0,0),at(.123,flap,side*.174),at(.045,flap*.84,side*.205),at(.005,0,0)],"d6f5ee");
        mesh.face([at(.015,0,0),at(-.02,flap*.72,side*.172),at(-.091,flap*.66,side*.149),at(-.028,0,0)],"e6faf5");
      }
    }
  }

  function kettleSteam(mesh, time) {
    for (let i=0;i<7;i++) {
      const phase=(time*.42+i/7)%1;
      const x=.84+phase*.48+Math.sin(time*1.65+i)*phase*.12;
      const y=.895+phase*1.42, z=.97+phase*.39;
      const w=.043+phase*.078;
      const pigment=["c8ccc0","d4d8cd","dce1d8"][Math.min(2,Math.floor(phase*3))];
      mesh.canopy(x,y,z,w,pigment,.55);
    }
  }

  function fireBed(mesh) {
    const {x,z,ground}=campfire;
    mesh.revolved(x,z,[[ground+.013,.26],[ground+.034,.27]],["5b453a"],12);
    for (let i=0;i<8;i++) {
      const angle=i*Math.PI/4;
      const rockX=x+Math.cos(angle)*.44, rockZ=z+Math.sin(angle)*.40;
      stone(mesh,rockX,ground+.06,rockZ,.17+variation(i+4)*.08,.11,.21,
        i%2 ? "92887b" : "a09a8b","685d52");
    }
    for (const [angle,level] of [[.52,.10],[2.1,.12],[-.26,.19]]) {
      const dx=Math.cos(angle)*.29,dz=Math.sin(angle)*.29;
      mesh.beam([x-dx,ground+level,z-dz],[x+dx,ground+level+.03,z+dz],.098,.10,"62422e");
    }
    mesh.emissive = true;
    for (let i=0;i<8;i++) {
      const angle=i*2.4;
      mesh.canopy(x+Math.cos(angle)*.24,ground+.055,z+Math.sin(angle)*.20,
        .026+variation(i+234)*.043,i%3 ? "d05b24" : "ffb34b",.58);
    }
    mesh.emissive = false;
  }

  const fireTongues = [
    [-.14,.02,.20,.55,"f2521e"],[.15,-.06,.20,.53,"f55d24"],
    [.00,-.08,.22,.78,"ff8c28"],[.02,.12,.16,.56,"ffd252"],
    [-.045,.16,.095,.38,"fff6c4"]
  ];

  function fireFlames(mesh,time) {
    const {x,z,ground}=campfire;
    mesh.emissive = true;
    for (const [index,[dx,dz,width,height,tone]] of fireTongues.entries()) {
      const wave=time*(8.3+index*.71)+index*2.7;
      const h=height*(.91+.15*Math.sin(wave)+.075*Math.sin(wave*1.9));
      const base=ground+.13, fx=x+dx, fz=z+dz;
      const tip=[fx+.10*Math.sin(wave+.9)+.045,base+h,fz+.048*Math.cos(wave)];
      const ring=(angle,r,y)=>[fx+Math.cos(angle)*width*r,base+y*h,fz+Math.sin(angle)*width*.76*r];
      for (let i=0;i<6;i++) {
        const a=i*Math.PI/3,b=(i+1)*Math.PI/3;
        const first=ring(a,1,.22), next=ring(b,1,.22);
        mesh.face([ring(a,.58,0),first,next,ring(b,.58,0)],tone);
        mesh.face([first,tip,next],index<2 ? tone : ["ff8a2f",tone,tone,"ffc454","ffe999","fff5ca"][i]);
      }
    }
    for (let i=0;i<12;i++) {
      const phase=(time*(.55+variation(i+138)*.47)+variation(i+62))%1;
      const angle=i*2.4+phase*.8;
      const reach=.11+phase*.27;
      const sx=x+Math.cos(angle)*reach+phase*.23;
      const sz=z+Math.sin(angle)*reach;
      const sy=ground+.37+phase*1.42;
      const size=(.024+variation(i+75)*.021)*(1-phase*.82);
      mesh.face([[sx-size,sy,sz],[sx,sy+size*1.7,sz],[sx+size,sy,sz],[sx,sy-size*.72,sz]],
        phase>.69 ? "ff7d34" : "ffe09a");
      mesh.face([[sx,sy,sz-size],[sx,sy+size*1.7,sz],[sx,sy,sz+size],[sx,sy-size*.72,sz]],"ffac5d");
    }
    mesh.emissive = false;
  }

  function rainStreak(mesh, x, y, z, width, length, tone) {
    const tip=[x,y+length,z], end=[x,y,z];
    mesh.face([tip,[x-width,y+length*.16,z],end,[x+width,y+length*.16,z]],tone);
    mesh.face([tip,[x,y+length*.16,z-width],end,[x,y+length*.16,z+width]],tone);
  }

  function snowfall(mesh, time) {
    const {left,right,back,front} = footprint;
    for (let i=0;i<108;i++) {
      const phase=(time*(.12+variation(i+181)*.105)+variation(i+16))%1;
      const x=left-.55+variation(i+231)*(right-left+1.1)+Math.sin(phase*6+i)*.38+phase*.67;
      const z=back+.26+variation(i+376)*(front-back-.52);
      const y=.297+(1-phase)*5.8;
      const size=(.060+variation(i+560)*.081)*Math.min(1,(1-phase)*12);
      const tone=i%3 ? "f5f9f8" : "eff4f7";
      const spokes=i%4===0 ? 6 : 4;
      for (let j=0;j<spokes;j++) {
        const theta=j*2*Math.PI/spokes+time*.63+i;
        const at=(angle,radius)=>[x+Math.cos(angle)*radius,y+Math.sin(angle)*radius,z+Math.cos(angle)*radius*.5];
        mesh.face([at(theta-.52,size*.25),at(theta,size),at(theta+.52,size*.25),[x,y,z]],tone);
      }
      mesh.face([[x-size*.38,y,z],[x,y,z-size*.38],[x+size*.38,y,z],[x,y,z+size*.38]],tone);
    }
  }

  function chickens(mesh, term, time) {
    const positions = term==="rain" ? [[.26,.45],[.98,.65]] : [[7.56,10.47],[7.28,11.38]];
    for (const [i,[x,z]] of positions.entries()) {
      const nod = (1-Math.cos(time*4.7+i*2.35))/2;
      const heading=i ? 2.21 : -.74;
      const at=(a,b,c)=>[x+a*Math.cos(heading)-c*Math.sin(heading),.25+b,z+a*Math.sin(heading)+c*Math.cos(heading)];
      const plumage=i ? "cfab7e" : "e2dabe";
      for (const spread of [-.052,.052]) {
        mesh.beam(at(0,.035,spread),at(-.016,.137,spread),.019,.018,"ab7c46");
        mesh.beam(at(-.024,.025,spread),at(.063,.025,spread),.016,.017,"ab7c46");
        mesh.beam(at(-.092,.165,spread),at(-.241,.262,spread*.63),.077,.056,i ? "8b684b" : "b2a998");
      }
      mesh.canopy(...at(-.033,.188,0),.164,plumage,.91);
      const head=at(.104+nod*.081,.314-nod*.19,0);
      mesh.beam(at(.066,.181,0),head,.107,.11,plumage);
      mesh.canopy(...head,.084,plumage,.92);
      const beak=at(.208+nod*.07,.299-nod*.208,0);
      mesh.beam(head,beak,.036,.038,"cc924e");
      mesh.canopy(head[0],head[1]+.065,head[2],.039,"b65f46",1.1);
    }
  }

  function waterRings(mesh, x, z, height, radius, width, tint) {
    for (let i=0;i<12;i++) {
      const a=i*Math.PI/6, b=(i+1)*Math.PI/6;
      const point=(angle,r)=>[x+Math.cos(angle)*r,height,z+Math.sin(angle)*r*.70];
      mesh.face([point(b,radius-width),point(a,radius-width),point(a,radius),point(b,radius)],tint);
    }
  }

  const farmerSites = {
    rain:   {row:0, position:[-2.47,.244,4.02], step:[.09,.69]},
    grain:  {row:1, position:[.64,.261,10.58], step:[.43,.15]},
    dew:    {row:2, position:[3.05,.245,1.91], step:[.65,.20]}
  };
  const farmerFrames = [0,0,1,1,2,2,3,0];
  const farmerWork = 1.28;
  const farmerMove = 3 * farmerWork;
  const farmerLoop = farmerMove + .62;
  const warmingFrames = [0,1,2,1];

  function warmingPose(time) {
    const rest=2.55, duration=3.42;
    const direction=Math.floor(time/duration)%2===0 ? 1 : -1;
    const phase=time%duration;
    const step=around(0,1,(phase-rest-.13)/.59);
    const progress=step*step*(3-2*step);
    const arc=Math.sin(step*Math.PI);
    const crouch=phase>=rest && (step===0 || step===1);
    return {
      row:3,frame:phase<rest ? warmingFrames[Math.floor(phase*8)%warmingFrames.length] : crouch ? 3 : 0,
      x:campfire.x+direction*(2*progress-1)*1.22,
      y:campfire.ground, z:campfire.z+.27+arc*.63,
      lift:arc*.29,flip:false,
      stretch:crouch ? .96 : 1+arc*.035
    };
  }

  function farmerPose(term,time) {
    if (term==="winter") return warmingPose(time);
    const {row,position,step} = farmerSites[term];
    const block = Math.floor(time / farmerLoop);
    const phase = time % farmerLoop;
    const moving = phase >= farmerMove;
    const hop = around(0,1,(phase - farmerMove - .09) / .44);
    const alternate = block % 2;
    const progress = alternate ? 1 - hop : hop;
    const lift = Math.sin(Math.PI * hop) * (term==="grain" ? .065 : .15);
    const frame = moving ? (phase - farmerMove < .09 ? 1 : 0) :
      farmerFrames[Math.floor((phase % farmerWork) / farmerWork * farmerFrames.length)];
    const [x,y,z] = position;
    const flip = term==="dew" && Boolean(hop >= 1 ? 1 - alternate : alternate);
    const settle = moving ? (hop === 0 || hop === 1 ? .036 : 0) : 0;
    return {x:x+step[0]*progress,y,z:z+step[1]*progress,row,frame,lift,flip,
      stretch:1 - settle + Math.sin(time*3.8)*.013};
  }

  function writeFarmerQuad(data, pose, project, alpha=1) {
    // The half-texel inset confines filtering to the current 128 px frame.
    const edge = .5/512, tileU = .25, tileV = .2;
    const left = pose.frame*tileU+edge, right = (pose.frame+1)*tileU-edge;
    const top = pose.row*tileV+edge, bottom = (pose.row+1)*tileV-edge;
    const nearU = pose.flip ? right : left, farU = pose.flip ? left : right;
    const makeVertex = (x,y,u,v) => [...project(x,y),0,1,alpha,u,v,0];
    const vertices = [
      makeVertex(-60,114,nearU,top),makeVertex(68,114,farU,top),
      makeVertex(68,-14,farU,bottom),makeVertex(-60,-14,nearU,bottom)
    ];
    for (const [index,corner] of [0,1,2,0,2,3].entries()) data.set(vertices[corner],index*9);
  }

  // 农夫手里的小镰刀：做在人物轮廓外侧，免得被贴图挡住
  function handSickle(mesh, x, y, z, flip) {
    const dir = flip ? -1 : 1;
    const hx = x - dir * .02, hz = z + .10;
    // 木柄：从手边往外上方伸
    mesh.beam([hx, y - .10, hz], [hx + dir * .26, y + .30, hz + .02], .040, .036, "6b4626");
    mesh.box(hx + dir * .01, y - .02, hz, .045, .05, .045, "51351e", "442c19");
    // 刃：从柄头折回来一道弯钩
    const hub = [hx + dir * .26, y + .30, hz + .02];
    const at = (rad, a) => [hub[0] + dir * Math.cos(a) * rad, hub[1] + Math.sin(a) * rad * .86, hub[2] + .015];
    for (let i = 0; i < 5; i++) {
      const a0 = -.40 + i * .44, a1 = a0 + .44, R = .27, r = .165;
      const o0 = at(R, a0), o1 = at(R, a1), i0 = at(r, a0), i1 = at(r, a1);
      mesh.face([o0, o1, i1, i0], i % 2 ? "c6cdd4" : "e6ecf2");
      mesh.face([o0, i0, i1, o1], "7a8189");
    }
  }

  function farmerLeafSweep(mesh,pose,time) {
    const pass = around(0,1,((time%farmerWork)/farmerWork-.42)/.58);
    const spread = Math.sin(pass*Math.PI)*.32;
    const side = pose.flip ? -1 : 1;
    for (let i=0;i<5;i++) {
      const reach = side*(.24 + i*.078 + spread);
      const x = pose.x + reach*Math.cos(homeView.yaw);
      const z = pose.z + .23 + i*.061 - reach*Math.sin(homeView.yaw);
      const y = .254 + (.10+variation(i+155)*.26)*spread;
      mesh.face([[x,y,z],[x+.084,y+.012,z+.013],[x+.032,y,z+.056]],autumnLeaves[i%4]);
    }
  }

  const framingPoints = [
    ...[footprint.left,footprint.right].flatMap(x => [footprint.back,footprint.front].flatMap(z => [[x,-.87,z],[x,.24,z]])),
    ...[-2.37,6.99].flatMap(x => [[x,2.64,-4.62],[x,4.36,-2.35],[x,2.6,.56]]),
    [-5,3.6,2.1],[-3.1,4.7,1.1],[8,5.69,-1.2],[10.4,4.72,-1.4],[8.82,2.45,8.5]
  ];
  const homeView = {yaw:-.53,pitch:.62,pivot:[2.44,1.11,4.98],verticalSpan:9.53};
  const orbitDiameter = 2*Math.max(...framingPoints.map(([x,,z]) =>
    Math.hypot(x-homeView.pivot[0],z-homeView.pivot[2])));
  const nowMs = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
  const wrapAngle = angle => {
    const turn = Math.PI * 2;
    return (((angle + Math.PI) % turn) + turn) % turn - Math.PI;
  };
  const shortestAngleDelta = (current, target) => wrapAngle(target - current);
  function stepSpring(current, target, velocity, omega, dt) {
    const change = current - target;
    const temp = (velocity + omega * change) * dt;
    const decay = Math.exp(-omega * dt);
    return [
      target + (change + temp) * decay,
      (velocity - omega * temp) * decay
    ];
  }

  function viewMatrix(yaw,pitch,width,height,zoom,panX,panZ,pivotY) {
    const forward=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)];
    const right=unit(cross([0,1,0],forward)), up=cross(forward,right);
    const span=Math.max(homeView.verticalSpan,orbitDiameter*height/(width*1.86))/zoom;
    const sx=height/(span*width), sy=1/span;
    const [x,,z]=homeView.pivot;
    const target=[x+panX,pivotY,z+panZ];
    return new Float32Array([
      right[0]*sx,up[0]*sy,-forward[0]/45,0,
      right[1]*sx,up[1]*sy,-forward[1]/45,0,
      right[2]*sx,up[2]*sy,-forward[2]/45,0,
      -dot(right,target)*sx,
      -dot(up,target)*sy,
      dot(forward,target)/45,1
    ]);
  }

  function outlineHull(points) {
    const sorted=points.slice().sort(([ax,ay],[bx,by])=>ax-bx || ay-by);
    function rim(sequence) {
      const chain=[];
      for (const point of sequence) {
        while (chain.length>=2) {
          const [a,b]=chain.slice(-2);
          if ((b[0]-a[0])*(point[1]-a[1])>(b[1]-a[1])*(point[0]-a[0])) break;
          chain.pop();
        }
        chain.push(point);
      }
      return chain.slice(0,-1);
    }
    return [...rim(sorted),...rim(sorted.reverse())];
  }

  // skip: [startVertex,endVertex) —— 物体自己的三角面要跳过，否则会被自己挡住
  function rayBlocked(vertices,forward,origin,skip) {
    const [x,y,z]=origin;
    const skipFrom=skip?skip[0]*9:-1, skipTo=skip?skip[1]*9:-1;
    for (let i=0;i<vertices.length;i+=27) {
      if (i>=skipFrom && i<skipTo) continue;
      // The camera stays above the yard. Only test geometry in front of the pole.
      if (Math.max(vertices[i+1],vertices[i+10],vertices[i+19])<y) continue;
      if (forward[0]*(vertices[i]-x)<0 && forward[0]*(vertices[i+9]-x)<0 && forward[0]*(vertices[i+18]-x)<0) continue;
      if (forward[2]*(vertices[i+2]-z)<0 && forward[2]*(vertices[i+11]-z)<0 && forward[2]*(vertices[i+20]-z)<0) continue;
      const a=[vertices[i],vertices[i+1],vertices[i+2]];
      const e1=subtract([vertices[i+9],vertices[i+10],vertices[i+11]],a);
      const e2=subtract([vertices[i+18],vertices[i+19],vertices[i+20]],a);
      const p=cross(forward,e2), det=dot(e1,p);
      if (Math.abs(det)<1e-7) continue;
      const delta=[x-a[0],y-a[1],z-a[2]];
      const u=dot(delta,p)/det;
      if (u<0 || u>1) continue;
      const q=cross(delta,e1), v=dot(forward,q)/det;
      if (v>=0 && u+v<=1 && dot(e2,q)/det>.13) return true;
    }
    return false;
  }

  function poleOccluded(vertices,forward) {
    return rayBlocked(vertices,forward,[gnomon.x,gnomon.base+gnomon.height*.66,gnomon.z]);
  }

  const lightGrid = {size:512,left:-7,back:-7,width:25,depth:32};

  // Store the highest surface along each light ray and each vertical ray.
  // The same light map serves WebGL and the Canvas fallback.
  function rasterLight(vertices, pixels, channel, shearX, shearZ) {
    const {size,left,back,width,depth}=lightGrid;
    const scaleX=size/width, scaleZ=size/depth;
    for (let i=0;i<vertices.length;i+=27) {
      const ay=vertices[i+1], by=vertices[i+10], cy=vertices[i+19];
      const ax=(vertices[i]-ay*shearX-left)*scaleX;
      const az=(vertices[i+2]-ay*shearZ-back)*scaleZ;
      const bx=(vertices[i+9]-by*shearX-left)*scaleX;
      const bz=(vertices[i+11]-by*shearZ-back)*scaleZ;
      const cx=(vertices[i+18]-cy*shearX-left)*scaleX;
      const cz=(vertices[i+20]-cy*shearZ-back)*scaleZ;
      const minX=Math.max(0,Math.ceil(Math.min(ax,bx,cx)-.5));
      const maxX=Math.min(size-1,Math.floor(Math.max(ax,bx,cx)-.5));
      const minZ=Math.max(0,Math.ceil(Math.min(az,bz,cz)-.5));
      const maxZ=Math.min(size-1,Math.floor(Math.max(az,bz,cz)-.5));
      if (minX>maxX || minZ>maxZ) continue;
      const det=(bx-ax)*(cz-az)-(bz-az)*(cx-ax);
      if (Math.abs(det)<.0001) continue;
      const du=(cz-az)/det, dv=(az-bz)/det;
      for (let z=minZ;z<=maxZ;z++) {
        const offsetX=minX+.5-ax, offsetZ=z+.5-az;
        let u=(offsetX*(cz-az)-offsetZ*(cx-ax))/det;
        let v=((bx-ax)*offsetZ-(bz-az)*offsetX)/det;
        for (let x=minX,p=(z*size+x)*4+channel;x<=maxX;x++,p+=4,u+=du,v+=dv) {
          if (u<0 || v<0 || u+v>1) continue;
          const encoded=Math.round((ay+u*(by-ay)+v*(cy-ay)+1)*32);
          if (encoded>pixels[p]) pixels[p]=Math.min(255,encoded);
        }
      }
    }
  }

  function lightMap(world, shadowRatio, term) {
    const shearX=sunHeading[0]*shadowRatio, shearZ=sunHeading[1]*shadowRatio;
    const {size}=lightGrid;
    const pixels=new Uint8Array(size*size*4);
    rasterLight(world,pixels,0,shearX,shearZ);
    rasterLight(world,pixels,1,0,0);
    // Expand nearby blockers by two texels so contact shadows hug the edges of objects.
    const stride=size*4;
    for (let z=0;z<size;z++) {
      const above=Math.max(0,z-2)*stride, below=Math.min(size-1,z+2)*stride;
      const row=z*stride;
      for (let x=0;x<size;x++) {
        const column=x*4+1, p=row+column;
        const near=Math.max(pixels[above+column],pixels[below+column],
          pixels[row+Math.max(0,x-2)*4+1],pixels[row+Math.min(size-1,x+2)*4+1]);
        pixels[p+1]=Math.max(pixels[p],near-4);
      }
    }
    const lantern=lanternStrength[term];
    const palette=seasonColors[term];
    return {pixels,shearX,shearZ,opacity:shadeOpacity[term],sun:unit([shearX,1,shearZ]),
      sunTint:palette.sunTint,shadowTint:palette.shadowTint,
      haze:color(hazeColor[term]),practicalPower:[lantern,lantern*.88,term==="winter" ? 1.95 : 0]};
  }

  function practicalGlow(x,y,z,nx,ny,nz,power,farmer) {
    let total=0;
    for (let i=0;i<practicalLights.length;i++) {
      if (!power[i]) continue;
      const [lx,ly,lz,radius]=practicalLights[i];
      const dx=lx-x,dy=ly-y,dz=lz-z;
      const distance2=dx*dx+dy*dy+dz*dz;
      const falloff=1-distance2/(radius*radius);
      if (falloff<=0) continue;
      const facing=farmer ? .68 : .26+.74*Math.max(0,(nx*dx+ny*dy+nz*dz)/Math.sqrt(Math.max(distance2,.015)));
      total+=falloff*falloff*power[i]*facing;
    }
    return total;
  }

  function shaderProgram(gl, api) {
    const modern=api==="webgl2";
    const version=modern ? "#version 300 es\n" : "";
    const readTexture=modern ? "texture" : "texture2D";
    const fragmentColor=modern ? "outputColor" : "gl_FragColor";
    const vertex = version+`
      ${modern ? "in" : "attribute"} vec3 position, normal, pigment;
      uniform mat4 camera;
      ${modern ? "out" : "varying"} mediump vec3 tint, faceNormal, worldPosition;
      ${modern ? "out" : "varying"} mediump float viewDepth;
      void main() {
        tint = pigment;
        faceNormal = normal;
        worldPosition = position;
        gl_Position = camera * vec4(position,1.0);
        viewDepth = gl_Position.z;
      }`;
    const fragment = version+`
      precision mediump float;
      ${modern ? "in" : "varying"} mediump vec3 tint, faceNormal, worldPosition;
      ${modern ? "in" : "varying"} mediump float viewDepth;
      ${modern ? "out vec4 outputColor;" : ""}
      uniform vec3 warmth;
      uniform vec3 sunTint;
      uniform vec3 shadowTint;
      uniform vec3 hazeTint;
      uniform vec3 shadowInfo;
      uniform vec3 practicalPower;
      uniform sampler2D shadowTexture;
      uniform sampler2D farmerTexture;
      uniform float farmerPass;
      uniform float waterPass;
      uniform float waterTime;
      vec2 lightUV(vec2 point) {
        return (point-vec2(${lightGrid.left.toFixed(1)},${lightGrid.back.toFixed(1)}))/
          vec2(${lightGrid.width.toFixed(1)},${lightGrid.depth.toFixed(1)});
      }
      float shadowAt(vec2 uv,float height) {
        float blocker=${readTexture}(shadowTexture,uv).r*(255.0/32.0)-1.0;
        return step(height,blocker);
      }
      float lamp(vec3 point,vec3 n,vec3 center,float radius,float power,bool actor) {
        if (power<=0.0) return 0.0;
        vec3 delta=center-point;
        float distance2=dot(delta,delta);
        float falloff=1.0-distance2/(radius*radius);
        if (falloff<=0.0) return 0.0;
        float facing=actor ? .68 : .26+.74*max(0.0,dot(n,delta)*inversesqrt(max(distance2,.015)));
        return falloff*falloff*power*facing;
      }
      vec3 lampTint(vec3 pigment,float glow) {
        return (pigment*.56+.17)*vec3(1.0,.52,.18)*glow;
      }
      void main() {
        if (farmerPass<0.5 && tint.r<0.0) {
          ${fragmentColor} = vec4(-tint,1.0);
          return;
        }
        vec4 sprite = vec4(1.0);
        if (farmerPass>0.5) {
          sprite = ${readTexture}(farmerTexture,tint.xy);
          if (farmerPass>1.5) {
            vec2 stepUV = vec2(.0045,0);
            float coverage = (2.0*sprite.a
              + ${readTexture}(farmerTexture,tint.xy+stepUV).a
              + ${readTexture}(farmerTexture,tint.xy-stepUV).a
              + ${readTexture}(farmerTexture,tint.xy+stepUV.yx).a
              + ${readTexture}(farmerTexture,tint.xy-stepUV.yx).a)/6.0;
            if (coverage<0.025) discard;
            ${fragmentColor} = vec4(.12,.18,.22,coverage*faceNormal.z);
            return;
          }
          if (sprite.a<0.025) discard;
        }
        vec3 n = normalize(faceNormal);
        vec3 sun = normalize(vec3(shadowInfo.x,1.0,shadowInfo.y));
        float diffuse = max(0.0,dot(n,sun));
        float sky = (n.y+1.0)*0.5;
        vec3 p = worldPosition;
        bool actor=farmerPass>0.5;
        float glow=${practicalLights.map(([x,y,z,radius],i)=>
          `lamp(p,n,vec3(${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}),${radius.toFixed(3)},practicalPower.${"xyz"[i]},actor)`
        ).join("+")};
        vec2 ray = lightUV(p.xz-shadowInfo.xy*p.y);
        float sampleStep=1.0/${lightGrid.size.toFixed(1)};
        float height=p.y+0.068;
        vec2 tap=vec2(sampleStep,sampleStep*.64);
        float shadowCoverage=(2.0*shadowAt(ray,height)+shadowAt(ray+tap,height)+shadowAt(ray-tap,height))*.25;
        float overhead=${readTexture}(shadowTexture,lightUV(p.xz)).b*(255.0/32.0)-1.0-p.y;
        float contact=smoothstep(.055,.19,overhead)*(1.0-.67*smoothstep(.18,1.65,overhead));
        if (farmerPass>0.5) {
          vec3 ink = sprite.rgb*warmth*(.98-.26*shadowCoverage*shadowInfo.z-.11*contact)+lampTint(sprite.rgb,glow);
          float mist = smoothstep(.12,.34,viewDepth)*.05;
          ${fragmentColor} = vec4(mix(ink,hazeTint,mist),sprite.a);
          return;
        }
        float bounce = max(0.0,dot(n,normalize(vec3(0.76,0.10,-0.67))))*0.095;
        float shadeMix = shadowCoverage*shadowInfo.z;
        vec3 ambientLight = mix(shadowTint,vec3(1.0),0.36+0.34*sky)*(0.47+0.16*sky+bounce)*(1.0-.32*contact);
        vec3 directLight = sunTint*(0.11+0.42*diffuse)*(1.0-shadeMix);
        float grain = sin(p.x*44.0+sin(p.z*9.0))*sin(p.z*37.0+sin(p.y*13.0));
        float textureMod = 1.0;
        if (p.y<0.45) textureMod *= 1.0+grain*0.013;
        if (p.y>0.4 && p.y<2.7 && tint.r-tint.g>0.11) {
          textureMod *= 1.0+sin((p.x+p.z)*65.0+cos(p.y*6.0))*0.036;
        }
        vec3 paint = tint;
        if (waterPass>0.5) {
          float wave = sin(p.z*15.0+cos(p.x*2.8)*0.85+waterTime*2.0);
          float ripple = smoothstep(0.89,0.99,wave)*(0.35+0.65*sin(p.x*3.8+waterTime*0.65)*sin(p.x*3.8));
          float pool = 0.35+0.25*sin(p.z*0.71)+0.10*sin(p.x*1.35+p.z*0.53);
          float rim = max(max(0.0,abs(p.x-2.395)-3.43),max(0.0,abs(p.z-8.585)-5.37));
          paint = mix(tint,vec3(0.28,0.74,0.73),pool);
          paint = mix(paint,vec3(0.46,0.58,0.38),smoothstep(0.0,0.75,rim)*0.18);
          float reflection = 0.72 + 0.28*sin(p.z*0.65+p.x*0.39);
          paint = mix(paint,vec3(0.99,0.98,0.82),ripple*reflection*0.56*(1.0-shadowCoverage));
        }
        vec3 lit = paint*warmth*(ambientLight+directLight)*textureMod;
        float luma = dot(lit,vec3(0.299,0.587,0.114));
        lit = mix(vec3(luma),lit,1.11);
        if (tint.r>.91 && tint.g>.94 && tint.b>.96) {
          vec3 snowColor = paint*mix(vec3(1.02,1.02,1.01),vec3(0.79,0.89,1.04),shadeMix*0.75);
          lit = mix(lit,snowColor,.76);
        }
        lit += lampTint(paint,glow);
        float mist = smoothstep(.12,.34,viewDepth)*.05;
        ${fragmentColor} = vec4(mix(lit,hazeTint,mist),waterPass>0.5 ? ${shallowWater.opacity} : 1.0);
      }`;
    const program = gl.createProgram();
    for (const [source,kind] of [[vertex,gl.VERTEX_SHADER],[fragment,gl.FRAGMENT_SHADER]]) {
      const shader = gl.createShader(kind);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const stage = kind === gl.VERTEX_SHADER ? "vertex" : "fragment";
        const details = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        gl.deleteProgram(program);
        throw Error("Yard " + stage + " shader: " + details);
      }
      gl.attachShader(program,shader);
      gl.deleteShader(shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) {
      const details = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw Error("Yard shader link: " + details);
    }
    return program;
  }

  function blendFarmerPixel(behind,r,g,b,alpha) {
    const transmitted=(behind>>>24)/255*(1-alpha);
    const coverage=alpha+transmitted;
    const mix=(channel,shift)=>Math.round(around(0,255,
      (channel*alpha+((behind>>>shift)&255)*transmitted)/coverage
    ));
    return (Math.round(coverage*255)<<24)|(mix(b,16)<<16)|(mix(g,8)<<8)|mix(r,0);
  }

  class CanvasYardRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.context = canvas.getContext("2d");
      if (!this.context) throw Error("Canvas 2D unavailable");
    }

    render(matrix, cssWidth, cssHeight, world, actor, water, warmth, light, farmer) {
      const scale = Math.min(1,Math.sqrt(920000/(cssWidth*cssHeight)));
      const width = Math.max(1,Math.round(cssWidth*scale));
      const height = Math.max(1,Math.round(cssHeight*scale));
      if (!this.frame || this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.frame = this.context.createImageData(width,height);
        this.pixels = new Uint32Array(this.frame.data.buffer);
        this.depth = new Float32Array(width*height);
        this.worldPixels = new Uint32Array(width*height);
        this.worldDepth = new Float32Array(width*height);
        this.waterPixels = new Uint32Array(width*height);
        this.waterDepth = new Float32Array(width*height);
        this.world = null;
      }
      if (this.world !== world || this.matrix !== matrix) {
        this.pixels.fill(0);
        this.depth.fill(Infinity);
        this.draw(world,matrix,warmth,light);
        this.worldDepth.set(this.depth);
        this.waterDepth.fill(Infinity);
        if (water.length) this.draw(water,matrix,warmth,light,"water");
        this.world = world;
        this.matrix = matrix;
        this.worldPixels.set(this.pixels);
      }
      this.pixels.set(this.worldPixels);
      this.depth.set(this.worldDepth);
      if (farmer) this.draw(farmer.shadow.data,matrix,warmth,light,"farmer-shadow",farmer.texture);
      this.draw(actor,matrix,warmth,light,water.length ? "actor" : "solid");
      if (farmer) this.draw(farmer.sprite.data,matrix,warmth,light,"farmer",farmer.texture);
      this.context.putImageData(this.frame,0,0);
    }

    draw(vertices,m,warmth,light,layer="solid",texture) {
      const {width,height} = this.canvas;
      const halfWidth = width/2, halfHeight = height/2;
      const [sunX,sunY,sunZ] = light.sun;
      const {size,left:lightLeft,back:lightBack,width:lightWidth,depth:lightDepth}=lightGrid;
      const lightX=size/lightWidth, lightZ=size/lightDepth;
      const readLight=(x,z,channel)=>light.pixels[
        (around(0,size-1,Math.floor(z))*size+around(0,size-1,Math.floor(x)))*4+channel
      ]/32-1;
      const {pixels,depth,waterDepth,waterPixels} = this;
      for (let i=0;i<vertices.length;i+=27) {
        const x0=vertices[i], y0=vertices[i+1], z0=vertices[i+2];
        const x1=vertices[i+9], y1=vertices[i+10], z1=vertices[i+11];
        const x2=vertices[i+18], y2=vertices[i+19], z2=vertices[i+20];
        const ax=(x0*m[0]+y0*m[4]+z0*m[8]+m[12]+1)*halfWidth;
        const ay=(1-x0*m[1]-y0*m[5]-z0*m[9]-m[13])*halfHeight;
        const az=x0*m[2]+y0*m[6]+z0*m[10]+m[14];
        const bx=(x1*m[0]+y1*m[4]+z1*m[8]+m[12]+1)*halfWidth;
        const by=(1-x1*m[1]-y1*m[5]-z1*m[9]-m[13])*halfHeight;
        const bz=x1*m[2]+y1*m[6]+z1*m[10]+m[14];
        const cx=(x2*m[0]+y2*m[4]+z2*m[8]+m[12]+1)*halfWidth;
        const cy=(1-x2*m[1]-y2*m[5]-z2*m[9]-m[13])*halfHeight;
        const cz=x2*m[2]+y2*m[6]+z2*m[10]+m[14];
        const left=Math.max(0,Math.ceil(Math.min(ax,bx,cx)-.5));
        const right=Math.min(width-1,Math.floor(Math.max(ax,bx,cx)-.5));
        const top=Math.max(0,Math.ceil(Math.min(ay,by,cy)-.5));
        const bottom=Math.min(height-1,Math.floor(Math.max(ay,by,cy)-.5));
        if (left>right || top>bottom) continue;
        const det=(bx-ax)*(cy-ay)-(cx-ax)*(by-ay);
        if (Math.abs(det)<.0001) continue;

        const nx=vertices[i+3], ny=vertices[i+4], nz=vertices[i+5];
        const diffuse=Math.max(0,nx*sunX+ny*sunY+nz*sunZ);
        const ambient=.49+.08*(vertices[i+4]+1);
        const direct=.10+.35*diffuse;
        const red=vertices[i+6]*warmth[0]*255;
        const green=vertices[i+7]*warmth[1]*255;
        const blue=vertices[i+8]*warmth[2]*255;
        const flake=vertices[i+6]>.93 && vertices[i+7]>.95 && vertices[i+8]>.963;
        const emissive=vertices[i+6]<0 && !texture;
        const emitted=(255<<24)|(Math.round(-vertices[i+8]*255)<<16)|
          (Math.round(-vertices[i+7]*255)<<8)|Math.round(-vertices[i+6]*255);

        const du=(cy-ay)/det, dv=(ay-by)/det;
        for (let y=top;y<=bottom;y++) {
          const offsetY=y+.5-ay, offsetX=left+.5-ax;
          let u=(offsetX*(cy-ay)-offsetY*(cx-ax))/det;
          let v=((bx-ax)*offsetY-(by-ay)*offsetX)/det;
          for (let x=left,p=y*width+left;x<=right;x++,p++,u+=du,v+=dv) {
            if (u<0 || v<0 || u+v>1) continue;
            const z=az+u*(bz-az)+v*(cz-az);
            if (z>=depth[p]) continue;
            if (emissive) {
              depth[p]=z;
              pixels[p]=emitted;
              continue;
            }
            let texel;
            if (texture) {
              const tx=vertices[i+6]+u*(vertices[i+15]-vertices[i+6])+v*(vertices[i+24]-vertices[i+6]);
              const ty=vertices[i+7]+u*(vertices[i+16]-vertices[i+7])+v*(vertices[i+25]-vertices[i+7]);
              texel=(Math.floor(ty*texture.height)*texture.width+Math.floor(tx*texture.width))*4;
              const alpha=texture.data[texel+3]/255;
              if (alpha<.025) continue;
              if (layer==="farmer-shadow") {
                pixels[p]=blendFarmerPixel(pixels[p],33,43,43,alpha*vertices[i+5]);
                continue;
              }
            }
            const worldX=x0+u*(x1-x0)+v*(x2-x0);
            const worldY=y0+u*(y1-y0)+v*(y2-y0);
            const worldZ=z0+u*(z1-z0)+v*(z2-z0);
            const lx=(worldX-lightLeft)*lightX, lz=(worldZ-lightBack)*lightZ;
            const blocker=readLight(lx-worldY*light.shearX*lightX,lz-worldY*light.shearZ*lightZ,0);
            const overhead=readLight(lx,lz,2)-worldY;
            const contact=around(0,1,(overhead-.055)/.135)*(1-.67*around(0,1,(overhead-.18)/1.47));
            const cast=blocker>=worldY+.068 ? light.opacity : 0;
            const glow=practicalGlow(worldX,worldY,worldZ,nx,ny,nz,light.practicalPower,Boolean(texture));
            if (texture) {
              const brightness=.97-.29*cast-.12*contact;
              const mist=around(0,.055,(z-.12)*.25);
              const surface=waterPixels[p], opacity=z>waterDepth[p] ? shallowWater.opacity : 0;
              const tex=texture.data;
              const channels=[0,1,2].map(i =>
                ((tex[texel+i]*warmth[i]*brightness+(tex[texel+i]*.62+23)*practicalTint[i]*glow)*(1-mist)
                  +light.haze[i]*255*mist)*(1-opacity) +
                ((surface>>>(i*8))&255)*opacity
              );
              pixels[p]=blendFarmerPixel(pixels[p],...channels,tex[texel+3]/255);
              depth[p]=z;
              continue;
            }
            const amb=ambient*(1-.32*contact), dir=direct*(1-cast);
            const mist=around(0,.05,(z-.12)*.25);
            const fogScale=255*mist, clear=1-mist;
            const lamp=glow*clear;
            const ambMix=.36+.34*((ny+1)*.5);
            const st=light.shadowTint, sn=light.sunTint;
            let r=red*(amb*(st[0]+(1-st[0])*ambMix)+dir*sn[0]);
            let g=green*(amb*(st[1]+(1-st[1])*ambMix)+dir*sn[1]);
            let b=blue*(amb*(st[2]+(1-st[2])*ambMix)+dir*sn[2]);
            const luma=r*.299+g*.587+b*.114;
            r=luma+(r-luma)*1.11; g=luma+(g-luma)*1.11; b=luma+(b-luma)*1.11;
            if (flake) {
              const sf=cast*.75;
              r=r*.24+vertices[i+6]*255*(1.02*(1-sf)+.79*sf)*.76;
              g=g*.24+vertices[i+7]*255*(1.02*(1-sf)+.89*sf)*.76;
              b=b*.24+vertices[i+8]*255*(1.01*(1-sf)+1.04*sf)*.76;
            }
            r=around(0,255,r*clear+light.haze[0]*fogScale+(vertices[i+6]*142.8+43)*practicalTint[0]*lamp);
            g=around(0,255,g*clear+light.haze[1]*fogScale+(vertices[i+7]*142.8+43)*practicalTint[1]*lamp);
            b=around(0,255,b*clear+light.haze[2]*fogScale+(vertices[i+8]*142.8+43)*practicalTint[2]*lamp);
            let coverage=1;
            if (layer==="water") {
              waterDepth[p]=z;
              waterPixels[p]=(Math.round(b)<<16)|(Math.round(g)<<8)|Math.round(r);
              const behind=pixels[p];
              const opacity=shallowWater.opacity;
              const transmitted=(behind>>>24)/255*(1-opacity);
              coverage=opacity+transmitted;
              r=(r*opacity+(behind&255)*transmitted)/coverage;
              g=(g*opacity+((behind>>>8)&255)*transmitted)/coverage;
              b=(b*opacity+((behind>>>16)&255)*transmitted)/coverage;
            } else if (layer==="actor" && z>waterDepth[p]) {
              const surface=waterPixels[p], a=shallowWater.opacity;
              r=r*(1-a)+(surface&255)*a;
              g=g*(1-a)+((surface>>>8)&255)*a;
              b=b*(1-a)+((surface>>>16)&255)*a;
            }
            depth[p]=z;
            pixels[p]=(Math.round(coverage*255)<<24)|(Math.round(b)<<16)|(Math.round(g)<<8)|Math.round(r);
          }
        }
      }
    }
  }

  class YardScene {
    constructor(canvas, compatibilityCanvas, plinthShadow, farmerAtlas) {
      this.canvas = canvas;
      this.compatibilityCanvas = compatibilityCanvas;
      this.plinthShadow = plinthShadow;
      this.world = {handle:null,data:null};
      this.actor = {handle:null,data:null};
      this.actorMesh = new Mesh();
      this.farmerAtlas = farmerAtlas;
      this.farmerSprite = {handle:null,data:new Float32Array(54),count:6};
      this.farmerShadow = {handle:null,data:new Float32Array(54),count:6};
      farmerAtlas?.addEventListener("load",() => this.invalidateView(),{once:true});
      this.onFrame = time => this.loop(time);
      try {
        const options={antialias:true,alpha:true,powerPreference:"high-performance",failIfMajorPerformanceCaveat:true};
        for (const api of ["webgl2","webgl"]) {
          const gl=canvas.getContext(api,options);
          if (!gl) continue;
          this.gpuContext=gl;
          this.gpuApi=api;
          break;
        }
        if (!this.gpuContext) throw Error("Hardware WebGL unavailable");
        this.initializeGraphics(this.gpuContext);
      } catch (error) {
        this.useSoftwareRenderer(error);
      }
      canvas.addEventListener("webglcontextlost", event => {
        event.preventDefault();
        this.useSoftwareRenderer(Error("WebGL context lost"));
        this.render();
      });
      canvas.addEventListener("webglcontextrestored", () => {
        try {
          this.initializeGraphics(this.gpuContext);
          if (this.state) {
            this.uploadGpuBuffer(this.world,false);
            this.uploadGpuBuffer(this.actor,true);
            this.uploadShadows();
          }
          this.software=null;
          this.compatibilityCanvas.hidden=true;
          this.canvas.classList.remove("compatibility-active");
          this.frameSample=undefined;
          delete this.canvas.dataset.frameRate;
        } catch (error) {
          this.useSoftwareRenderer(error);
        }
        this.render();
      });
      const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
      this.motion = !motionPreference.matches;
      motionPreference.addEventListener?.("change", () => {
        this.motion = !motionPreference.matches;
        this.lastActorFrame = undefined;
        if (this.motion) this.queueFrame();
        else {
          delete this.canvas.dataset.frameRate;
          if (this.targetView) this.applyViewImmediate(this.targetView);
          if (this.state) this.act(0,0);
          this.invalidateView();
        }
      });
      this.reset(true);
      if (typeof ResizeObserver === "function") {
        const observer = new ResizeObserver(() => this.invalidateView());
        observer.observe(canvas);
      } else {
        window.addEventListener("resize", () => this.invalidateView());
      }
    }

    initializeGraphics(gl) {
      const program = shaderProgram(gl,this.gpuApi);
      this.gl = gl;
      gl.useProgram(program);
      this.locations = ["position","normal","pigment"].map(name => gl.getAttribLocation(program,name));
      this.camera = gl.getUniformLocation(program,"camera");
      this.warmth = gl.getUniformLocation(program,"warmth");
      this.sunTint = gl.getUniformLocation(program,"sunTint");
      this.shadowTint = gl.getUniformLocation(program,"shadowTint");
      this.practicalPower = gl.getUniformLocation(program,"practicalPower");
      this.shadowInfo = gl.getUniformLocation(program,"shadowInfo");
      this.hazeTint = gl.getUniformLocation(program,"hazeTint");
      this.waterPass = gl.getUniformLocation(program,"waterPass");
      this.waterTime = gl.getUniformLocation(program,"waterTime");
      this.shadowTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D,this.shadowTexture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      this.world.handle = gl.createBuffer();
      this.actor.handle = gl.createBuffer();
      if (this.farmerAtlas) {
        this.farmerPass = gl.getUniformLocation(program,"farmerPass");
        this.farmerSampler = gl.getUniformLocation(program,"farmerTexture");
        this.farmerSprite.handle = gl.createBuffer();
        this.farmerShadow.handle = gl.createBuffer();
        this.farmerTexture = null;
      }
      gl.clearColor(0,0,0,0);
      gl.enable(gl.DEPTH_TEST);
      gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      const attributes = gl.getContextAttributes?.();
      const debug = gl.getExtension?.("WEBGL_debug_renderer_info");
      this.canvas.dataset.renderer = this.gpuApi==="webgl2" ? "WebGL 2" : "WebGL 1";
      this.canvas.dataset.antialias = attributes ? String(attributes.antialias) : "unknown";
      if (debug) this.canvas.dataset.renderDevice = gl.getParameter(debug.UNMASKED_RENDERER_WEBGL);
    }

    useSoftwareRenderer(error) {
      this.software ??= new CanvasYardRenderer(this.compatibilityCanvas);
      this.gl = null;
      this.compatibilityCanvas.hidden = false;
      this.canvas.classList.add("compatibility-active");
      this.canvas.dataset.renderer = "Canvas 2D";
      this.canvas.dataset.antialias = "false";
      delete this.canvas.dataset.renderDevice;
      delete this.canvas.dataset.frameRate;
      this.frameSample = undefined;
      console.warn("Yard switched to compatibility rendering:",error.message);
    }

    queueFrame() {
      if (this.frameQueued) return;
      this.frameQueued = true;
      requestAnimationFrame(this.onFrame);
    }

    invalidateView() {
      this.cameraDirty = true;
      this.queueFrame();
    }

    zeroCameraVelocity() {
      this.cameraVelocity = {yaw:0,pitch:0,logZoom:0,panX:0,panZ:0,pivotY:0};
      this.dragVelocity = {yaw:0,pitch:0,panX:0,panZ:0};
    }
    wakeCamera() {
      if (!this.cameraActive) {
        this.cameraActive = true;
        this.lastCameraTime = undefined;
      }
      this.queueFrame();
    }
    applyViewImmediate(view) {
      Object.assign(this,view);
      this.yaw = wrapAngle(this.yaw);
      this.targetView = this.currentView();
      this.zeroCameraVelocity();
      this.cameraMode = "idle";
      this.cameraActive = false;
      this.lastCameraTime = undefined;
      this.invalidateView();
    }
    reset(immediate = false) {
      this.gnomonView = null;
      const yaw = immediate || this.yaw === undefined
        ? homeView.yaw
        : this.yaw + shortestAngleDelta(this.yaw,homeView.yaw);
      const target = {
        yaw,
        pitch:homeView.pitch,
        zoom:1,
        panX:0,
        panZ:0,
        pivotY:homeView.pivot[1]
      };
      if (immediate || !this.motion) this.applyViewImmediate(target);
      else this.moveView(target);
    }
    currentView() {
      const {yaw,pitch,zoom,panX,panZ,pivotY}=this;
      return {yaw,pitch,zoom,panX,panZ,pivotY};
    }
    moveView(target) {
      if (!this.motion) {
        this.applyViewImmediate(target);
        return;
      }
      this.targetView = {...target};
      this.dragVelocity = {yaw:0,pitch:0,panX:0,panZ:0};
      this.cameraMode = "glide";
      this.wakeCamera();
    }
    // 割掉一株：顶点挪到画外，位置记下来（秸秆在 act 里画）
    harvestPlant(index) {
      const range = cropRanges[index];
      const spot = cropSpots[index];
      if (!range || !spot || !this.world || !this.world.data) return false;
      const data = this.world.data;
      for (let v = range[0]; v < range[1]; v++) {
        const o = v * 9;
        data[o + 1] = -9999;
      }
      this.uploadGpuBuffer(this.world, false);
      if (!this.harvested) this.harvested = [];
      if (!this.harvestedIndices) this.harvestedIndices = new Set();
      this.harvestedIndices.add(index);
      this.harvested.push([spot[0], spot[1]]);
      this.harvestSwing = { x: spot[0], z: spot[1], start: this.sceneTime || 0 };
      this.render();
      if (this.motion) this.queueFrame();
      return true;
    }

    // 多数采样点被挡住时，整条描边就别画了
    mostlyHidden(points, skip) {
      if (!this.landData || !this.cameraMatrix) return false;
      let hidden = 0;
      for (const [x, y, z] of points) {
        if (this.isHidden(x, y, z, skip)) hidden++;
      }
      return hidden * 2 >= points.length;
    }

    // 这个点是否被别的几何挡住（SVG 描边没有深度测试，只能自己判）
    isHidden(x, y, z, skip) {
      const m = this.cameraMatrix;
      if (!m || !this.landData) return false;
      return rayBlocked(this.landData, [-45 * m[2], -45 * m[6], -45 * m[10]], [x, y, z], skip);
    }

    // 把某段几何的三角面投影成屏幕坐标：每 6 个数是一个三角形
    outlineTriangles(range) {
      const m = this.cameraMatrix;
      if (!m || !this.viewWidth || !range) return null;
      const data = this.landData;
      if (!data) return null;
      const flat = [];
      // 整三角地遍历：被收起来（y 挪到 -9999）的那部分不参与描边
      for (let v = range[0]; v + 2 < range[1]; v += 3) {
        let hidden = false;
        for (let k = 0; k < 3; k++) {
          if (data[(v + k) * 9 + 1] < -9000) { hidden = true; break; }
        }
        if (hidden) continue;
        for (let k = 0; k < 3; k++) {
          const o = (v + k) * 9;
          const x = data[o], y = data[o + 1], z = data[o + 2];
          flat.push((x * m[0] + y * m[4] + z * m[8] + m[12] + 1) * this.viewWidth / 2,
                    (1 - x * m[1] - y * m[5] - z * m[9] - m[13]) * this.viewHeight / 2);
        }
      }
      return flat.length >= 6 ? flat : null;
    }
    foodSilhouette() { return this.outlineTriangles(this.foodRange); }
    treeSilhouette() { return this.outlineTriangles(this.treeRange); }

    fireSilhouette() { return this.outlineTriangles(this.fireRange); }

    fireProjection() {
      const flat = this.fireSilhouette();
      if (!flat) return null;
      const points = [];
      for (let i = 0; i < flat.length; i += 2) points.push([flat[i], flat[i + 1]]);
      if (points.every(([x]) => x < 0) || points.every(([x]) => x > this.viewWidth)) return null;
      return { outline: outlineHull(points) };
    }

    focusFire() {
      if (this.fireView) return;
      const base = this.targetView || this.currentView();
      this.fireView = {...base};
      this.moveView({
        yaw: this.yaw + shortestAngleDelta(this.yaw, base.yaw),
        pitch: around(.52,.74,base.pitch),
        zoom: 3.2,
        panX: campfire.x - homeView.pivot[0],
        panZ: campfire.z - homeView.pivot[2],
        pivotY: .48
      });
    }
    releaseFire() {
      if (!this.fireView) return;
      const target = this.fireView;
      this.fireView = null;
      this.moveView({...target, yaw: this.yaw + shortestAngleDelta(this.yaw, target.yaw)});
    }

    // 烤糍粑：桌上搬一块到火塘石头上
    roastCake() {
      if (!cakeRanges.length || (this.roasting || []).length >= cakeRanges.length) return false;
      const index = (this.roasting || []).length;
      const data = this.world && this.world.data;
      if (!data) return false;
      let touched = false;
      for (let v = cakeRanges[index][0]; v < cakeRanges[index][1]; v++) {
        if (data[v * 9 + 1] > -9000) { data[v * 9 + 1] = -9999; touched = true; }
      }
      if (touched) this.uploadGpuBuffer(this.world, false);
      if (!this.roasting) this.roasting = [];
      this.roasting.push(index);
      this.render();
      if (this.motion) this.queueFrame();
      return true;
    }

    broomSilhouette() { return this.outlineTriangles(this.broomRange); }

    broomProjection() {
      const flat = this.broomSilhouette();
      if (!flat) return null;
      const points = [];
      for (let i = 0; i < flat.length; i += 2) points.push([flat[i], flat[i + 1]]);
      if (points.every(([x]) => x < 0) || points.every(([x]) => x > this.viewWidth)) return null;
      return { outline: outlineHull(points) };
    }

    focusBroom() {
      if (this.broomView) return;
      const base = this.targetView || this.currentView();
      this.broomView = {...base};
      this.moveView({
        yaw: this.yaw + shortestAngleDelta(this.yaw, base.yaw),
        pitch: around(.46,.68,base.pitch),
        zoom: 4.4,
        panX: broomAt.x - homeView.pivot[0],
        panZ: broomAt.z - homeView.pivot[2],
        pivotY: .62
      });
    }
    releaseBroom() {
      if (!this.broomView) return;
      const target = this.broomView;
      this.broomView = null;
      this.moveView({...target, yaw: this.yaw + shortestAngleDelta(this.yaw, target.yaw)});
    }

    setSweepMode(on) {
      this.sweepMode = Boolean(on);
      if (this.sweepMode) { this.sweepStance = null; this.sweepSwing = null; }
      this.render();
      if (this.motion) this.queueFrame();
    }

    fireHitBox() {
      const projection = this.fireProjection();
      if (!projection) return null;
      const xs = projection.outline.map(([x]) => x);
      const ys = projection.outline.map(([, y]) => y);
      return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    }

    campfireScreen() {
      const m = this.cameraMatrix;
      if (!m || !this.viewWidth) return null;
      const wx = campfire.x, wy = campfire.ground + .28, wz = campfire.z;
      return [
        (wx * m[0] + wy * m[4] + wz * m[8] + m[12] + 1) * this.viewWidth / 2,
        (1 - wx * m[1] - wy * m[5] - wz * m[9] - m[13]) * this.viewHeight / 2
      ];
    }

    // 扫完雪：走回火堆边接着烤火
    returnToFire() {
      const f = this.farmer;
      this.fireWalk = { from: [f.x, f.z], start: this.sceneTime || 0 };
      this.sweepStance = null;
      this.sweepSwing = null;
      this.sweepMode = false;
      this.render();
      if (this.motion) this.queueFrame();
    }

    // 屏幕坐标命中的雪点
    snowSpotAt(px, py, radius = 56) {
      const m = this.cameraMatrix;
      if (!m || !this.viewWidth || !this.snowSpots) return -1;
      let best = -1, bestDistance = radius;
      for (let index = 0; index < this.snowSpots.length; index++) {
        const [wx, wz] = this.snowSpots[index];
        if (this.swept && this.swept.some(([sx, sz]) => Math.abs(sx - wx) < .01 && Math.abs(sz - wz) < .01)) continue;
        const wy = .28;
        const sx = (wx * m[0] + wy * m[4] + wz * m[8] + m[12] + 1) * this.viewWidth / 2;
        const sy = (1 - wx * m[1] - wy * m[5] - wz * m[9] - m[13]) * this.viewHeight / 2;
        const distance = Math.hypot(px - sx, py - sy);
        if (distance < bestDistance) { bestDistance = distance; best = index; }
      }
      return best;
    }

    // 扫开一处雪
    sweepSpot(index) {
      if (!this.snowSpots || !this.snowSpots[index]) return false;
      const [x, z] = this.snowSpots[index];
      if (!this.swept) this.swept = [];
      this.swept.push([x, z]);
      this.sweepSwing = { x, z, start: this.sceneTime || 0 };
      this.render();
      if (this.motion) this.queueFrame();
      return true;
    }

    sickleSilhouette() { return this.outlineTriangles(this.sickleRange); }

    sickleProjection() {
      const flat = this.sickleSilhouette();
      if (!flat) return null;
      const points = [];
      for (let i = 0; i < flat.length; i += 2) points.push([flat[i], flat[i + 1]]);
      if (points.every(([x]) => x < 0) || points.every(([x]) => x > this.viewWidth)) return null;
      return { outline: outlineHull(points) };
    }

    focusSickle() {
      if (this.sickleView) return;
      const base = this.targetView || this.currentView();
      this.sickleView = {...base};
      this.moveView({
        yaw: this.yaw + shortestAngleDelta(this.yaw, base.yaw),
        pitch: around(.46,.68,base.pitch),
        zoom: 4.4,
        panX: sickleAt.x - homeView.pivot[0],
        panZ: sickleAt.z - homeView.pivot[2],
        pivotY: .62
      });
    }
    releaseSickle() {
      if (!this.sickleView) return;
      const target = this.sickleView;
      this.sickleView = null;
      this.moveView({...target, yaw: this.yaw + shortestAngleDelta(this.yaw, target.yaw)});
    }

    // 进入/退出抢收：镰刀从门口消失，农夫手里多一把
    setHarvestMode(on) {
      this.harvestMode = Boolean(on);
      if (this.harvestMode) {
        this.harvestStance = null;
        this.harvestSwing = null;
      }
      this.render();
      if (this.motion) this.queueFrame();
    }

    // 屏幕坐标命中的那一株（抢收模式下点任意稻子）
    plantAtScreen(px, py, radius = 26) {
      const m = this.cameraMatrix;
      if (!m || !this.viewWidth) return -1;
      let best = -1, bestDistance = radius;
      const data = this.landData;
      for (let index = 0; index < cropSpots.length; index++) {
        if (this.harvestedIndices && this.harvestedIndices.has(index)) continue;
        const [wx, wz] = cropSpots[index];
        const wy = .52;
        const sx = (wx * m[0] + wy * m[4] + wz * m[8] + m[12] + 1) * this.viewWidth / 2;
        const sy = (1 - wx * m[1] - wy * m[5] - wz * m[9] - m[13]) * this.viewHeight / 2;
        const distance = Math.hypot(px - sx, py - sy);
        if (distance < bestDistance) { bestDistance = distance; best = index; }
      }
      return best;
    }

    cropProjection() {
      const m = this.cameraMatrix;
      if (!m || !this.viewWidth) return null;
      const project = (px, py, pz) => [
        (px*m[0] + py*m[4] + pz*m[8] + m[12] + 1) * this.viewWidth / 2,
        (1 - px*m[1] - py*m[5] - pz*m[9] - m[13]) * this.viewHeight / 2
      ];
      const items = [];
      if (this.term === "rain") {
        // 杏花：整棵树一圈，点取在各团树冠的圆周上
        // 杏花：树冠各团 + 树干，一起求凸包，整棵树描一圈
        const ring = [];
        for (const [sx, sy, sz, bulk] of treeSpots) {
          if (Math.hypot(sx - 7.32, sz - 4.10) > 2.4) continue;
          for (let a = 0; a < 10; a++) {
            const angle = a * Math.PI / 5;
            const ca = Math.cos(angle), sa = Math.sin(angle) * .84;
            ring.push(project(sx + ca * bulk, sy, sz + sa * bulk));
            ring.push(project(sx + ca * bulk * .72, sy + bulk * .58, sz + sa * bulk * .72));
            ring.push(project(sx + ca * bulk * .72, sy - bulk * .58, sz + sa * bulk * .72));
          }
        }
        for (const [dx, dz] of [[-.16, -.12], [.16, -.12], [-.16, .12], [.16, .12]]) {
          ring.push(project(7.32 + dx, .34, 4.10 + dz));
          ring.push(project(7.32 + dx * .6, 3.10, 4.10 + dz * .6));
        }
        const probes = [[7.32, 4.6, 4.10], [6.5, 4.2, 4.10], [8.2, 4.2, 4.10],
                        [7.32, 3.2, 3.4], [7.32, 3.2, 4.8], [7.32, 1.6, 4.10], [7.32, .6, 4.10]];
        if (this.mostlyHidden(probes, this.treeRange)) return null;
        if (ring.length) items.push(outlineHull(ring));
      } else {
        // 作物：一株一个椭圆
        const box = CROP_BOX[this.term] || CROP_BOX.grain;
        for (let index = 0; index < cropSpots.length; index++) {
          const [px, pz, height] = cropSpots[index];
          if (px < box.left - .2 || px > box.right + .2) continue;
          if (pz < box.near - .2 || pz > box.far + .2) continue;
          if (this.harvestedIndices && this.harvestedIndices.has(index)) continue;
          if (this.isHidden(px, .30 + height + .06, pz)) continue;
          const base = project(px, .30, pz);
          const side = project(px + .14, .30, pz + .07);
          const top = project(px, .30 + height * 1.04, pz);
          const radius = Math.hypot(side[0] - base[0], side[1] - base[1]);
          const centreY = (base[1] + top[1]) / 2;
          const radiusY = Math.max(radius, Math.abs(top[1] - base[1]) * .58);
          items.push({ ellipse: [base[0], centreY, radius, radiusY], index });
        }
      }
      if (!items.length) return null;
      const all = [];
      for (const item of items) {
        if (item.ellipse) {
          const [cx, cy, rx, ry] = item.ellipse;
          all.push([cx - rx, cy - ry], [cx + rx, cy + ry]);
        } else {
          all.push(...item);
        }
      }
      return { items, all, indices: items.map(item => item.index) };
    }
    focusCrop() {
      if (this.cropView) return;
      const base = this.targetView || this.currentView();
      this.cropView = {...base};
      const focus = CROP_FOCUS[this.term] || CROP_FOCUS.grain;
      this.moveView({
        yaw: this.yaw + shortestAngleDelta(this.yaw, base.yaw),
        pitch: around(.40,.60,base.pitch),
        zoom: focus.zoom,
        panX: focus.x - homeView.pivot[0],
        panZ: focus.z - homeView.pivot[2],
        pivotY: focus.y
      });
    }
    releaseCrop() {
      if (!this.cropView) return;
      const target = this.cropView;
      this.cropView = null;
      this.moveView({...target, yaw: this.yaw + shortestAngleDelta(this.yaw, target.yaw)});
    }
    foodProjection() {
      const m = this.cameraMatrix;
      if (!m || !this.viewWidth) return null;
      const project = (px, py, pz) => [
        (px*m[0] + py*m[4] + pz*m[8] + m[12] + 1) * this.viewWidth / 2,
        (1 - px*m[1] - py*m[5] - pz*m[9] - m[13]) * this.viewHeight / 2
      ];
      const {x, z, height, top, deep} = foodTableAt;
      const g = FOOD_GROUND;
      const points = [];
      for (const dx of [-top / 2, top / 2]) {
        for (const dz of [-deep / 2, deep / 2]) {
          points.push(project(x + dx, g + height, z + dz), project(x + dx, g + height + .07, z + dz));
        }
      }
      for (const [dx, dz] of [[-.38, -.23], [.38, -.23], [-.38, .23], [.38, .23]]) {
        points.push(project(x + dx - .04, g, z + dz - .04), project(x + dx + .04, g, z + dz + .04));
      }
      if (this.isHidden(x, g + height, z, this.foodRange)) return null;
      if (points.every(([px]) => px < 0) || points.every(([px]) => px > this.viewWidth) ||
          points.every(([, py]) => py < 0) || points.every(([, py]) => py > this.viewHeight)) return null;
      return { outline: outlineHull(points) };
    }
    focusFood() {
      if (this.foodView) return;
      const base = this.targetView || this.currentView();
      this.foodView = {...base};
      this.moveView({
        yaw: this.yaw + shortestAngleDelta(this.yaw, base.yaw),
        pitch: around(.52,.76,base.pitch),
        zoom: 4.6,
        panX: foodTableAt.x - homeView.pivot[0],
        panZ: foodTableAt.z - homeView.pivot[2],
        pivotY: FOOD_GROUND + foodTableAt.height * .9
      });
    }
    releaseFood() {
      if (!this.foodView) return;
      const target = this.foodView;
      this.foodView = null;
      this.moveView({...target, yaw: this.yaw + shortestAngleDelta(this.yaw, target.yaw)});
    }
    focusGnomon() {
      if (this.gnomonView) return;
      const base = this.targetView || this.currentView();
      this.gnomonView = {...base};
      this.moveView({
        yaw:this.yaw + shortestAngleDelta(this.yaw,base.yaw),
        pitch:around(.49,.78,base.pitch),
        zoom:5.25,
        panX:gnomon.x-homeView.pivot[0],
        panZ:gnomon.z-homeView.pivot[2],
        pivotY:gnomon.base+gnomon.height*.43
      });
    }
    releaseGnomon() {
      if (!this.gnomonView) return;
      const target = this.gnomonView;
      this.gnomonView = null;
      this.moveView({
        ...target,
        yaw:this.yaw + shortestAngleDelta(this.yaw,target.yaw)
      });
    }
    beginInteraction(mode = "drag") {
      this.dragVelocity = {yaw:0,pitch:0,panX:0,panZ:0};
      this.dragMoved = false;
      this.lastDragTime = nowMs();
      if (!this.motion) return;
      if (this.cameraMode === "coast" || (this.cameraMode === "glide" && !this.gnomonView)) {
        this.targetView.yaw = this.yaw;
        this.targetView.pitch = this.pitch;
        this.cameraVelocity.yaw *= .25;
        this.cameraVelocity.pitch *= .25;
        if (!this.gnomonView) {
          this.targetView.panX = this.panX;
          this.targetView.panZ = this.panZ;
          this.targetView.zoom = this.zoom;
          this.cameraVelocity.panX *= .25;
          this.cameraVelocity.panZ *= .25;
          this.cameraVelocity.logZoom *= .25;
        }
      }
      this.cameraMode = mode;
    }
    endInteraction(allowInertia = true) {
      const wasDrag = this.cameraMode === "drag";
      if (!this.motion) {
        this.cameraMode = "idle";
        return;
      }
      const idle = nowMs() - (this.lastDragTime || 0);
      if (wasDrag && allowInertia && this.dragMoved && idle < 110) {
        const freshness = Math.exp(-Math.max(0,idle - 16) / 34);
        const speedScale = this.software ? 1.5 : 1;
        const rotOmega = 6.2 * speedScale;
        const panOmega = 7.2 * speedScale;
        const pickSpeed = (springV, inputV, limit) => {
          const speed = Math.abs(springV) >= Math.abs(inputV) * .6 ? springV : inputV;
          return around(-limit,limit,speed * freshness);
        };
        const vy = pickSpeed(this.cameraVelocity.yaw,this.dragVelocity.yaw,5.5);
        const vp = pickSpeed(this.cameraVelocity.pitch,this.dragVelocity.pitch,2.2);
        const vpx = pickSpeed(this.cameraVelocity.panX,this.dragVelocity.panX,12);
        const vpz = pickSpeed(this.cameraVelocity.panZ,this.dragVelocity.panZ,12);
        let coasting = false;
        const projectCoast = (axis, vel, omega, min, max) => {
          if (Math.abs(vel) < .04) return;
          const projected = this[axis] + vel / omega;
          const existing = this.targetView[axis];
          const further = vel > 0 ? Math.max(existing,projected) : Math.min(existing,projected);
          const dest = min !== undefined ? around(min,max,further) : further;
          this.targetView[axis] = dest;
          const gap = dest - this[axis];
          this.cameraVelocity[axis] = Math.sign(gap) === Math.sign(vel)
            ? Math.sign(vel) * Math.min(Math.abs(vel),omega * Math.abs(gap))
            : 0;
          coasting = true;
        };
        projectCoast("yaw",vy,rotOmega);
        projectCoast("pitch",vp,rotOmega,0,Math.PI/2-.01);
        if (!this.gnomonView) {
          projectCoast("panX",vpx,panOmega,-9,9);
          projectCoast("panZ",vpz,panOmega,-9,9);
        }
        this.cameraMode = coasting ? "coast" : "idle";
        if (coasting) this.wakeCamera();
      } else {
        this.cameraMode = this.gnomonView && this.cameraActive ? "glide" : "idle";
      }
      this.dragVelocity = {yaw:0,pitch:0,panX:0,panZ:0};
      this.dragMoved = false;
    }
    rotate(dx, dy) {
      if (!this.motion) {
        this.yaw += dx;
        this.pitch = around(0,Math.PI/2-.01,this.pitch + dy);
        this.targetView.yaw = this.yaw;
        this.targetView.pitch = this.pitch;
        this.invalidateView();
        return;
      }
      this.targetView.yaw += dx;
      this.targetView.pitch = around(0,Math.PI/2-.01,this.targetView.pitch + dy);
      if (this.cameraMode === "drag") {
        const now = nowMs();
        const dt = around(.008,.08,(now - (this.lastDragTime || now)) / 1000);
        const blend = this.dragMoved ? 1 - Math.exp(-dt / .028) : 1;
        this.dragVelocity.yaw += (dx / dt - this.dragVelocity.yaw) * blend;
        this.dragVelocity.pitch += (dy / dt - this.dragVelocity.pitch) * blend;
        this.dragVelocity.panX *= 1 - blend;
        this.dragVelocity.panZ *= 1 - blend;
        this.lastDragTime = now;
        this.dragMoved = true;
      } else if (this.cameraMode === "coast") {
        this.cameraMode = "idle";
      }
      this.wakeCamera();
    }
    pan(dx, dy) {
      if (this.gnomonView) return;
      const scale = this.worldUnitsPerPixel;
      if (!scale) return;
      const depth = -dy*scale/Math.max(.28,Math.sin(this.pitch));
      const stepX = -dx*scale*Math.cos(this.yaw) + depth*Math.sin(this.yaw);
      const stepZ = dx*scale*Math.sin(this.yaw) + depth*Math.cos(this.yaw);
      if (!this.motion) {
        this.panX = around(-9,9,this.panX + stepX);
        this.panZ = around(-9,9,this.panZ + stepZ);
        this.targetView.panX = this.panX;
        this.targetView.panZ = this.panZ;
        this.invalidateView();
        return;
      }
      this.targetView.panX = around(-9,9,this.targetView.panX + stepX);
      this.targetView.panZ = around(-9,9,this.targetView.panZ + stepZ);
      if (this.cameraMode === "drag") {
        const now = nowMs();
        const dt = around(.008,.08,(now - (this.lastDragTime || now)) / 1000);
        const blend = this.dragMoved ? 1 - Math.exp(-dt / .028) : 1;
        this.dragVelocity.panX += (stepX / dt - this.dragVelocity.panX) * blend;
        this.dragVelocity.panZ += (stepZ / dt - this.dragVelocity.panZ) * blend;
        this.dragVelocity.yaw *= 1 - blend;
        this.dragVelocity.pitch *= 1 - blend;
        this.lastDragTime = now;
        this.dragMoved = true;
      } else if (this.cameraMode === "coast") {
        this.cameraMode = "idle";
      }
      this.wakeCamera();
    }
    magnify(factor) {
      const minZoom = this.gnomonView ? 3.85 : .72;
      const maxZoom = this.gnomonView ? 6.5 : 1.9;
      if (!this.motion) {
        this.zoom = around(minZoom,maxZoom,this.zoom * factor);
        this.targetView.zoom = this.zoom;
        this.invalidateView();
        return;
      }
      this.targetView.zoom = around(minZoom,maxZoom,this.targetView.zoom * factor);
      this.wakeCamera();
    }
    stepCamera(time) {
      if (!this.cameraActive || !this.motion) return;
      const dt = this.lastCameraTime === undefined
        ? 1 / 60
        : around(.001,.05,(time - this.lastCameraTime) / 1000);
      this.lastCameraTime = time;

      const mode = this.cameraMode;
      const speedScale = this.software ? 1.5 : 1;
      const rotOmega = (mode === "drag" || mode === "pinch" ? 36 : mode === "coast" ? 6.2 : mode === "glide" ? 9.5 : 15) * speedScale;
      const panOmega = (mode === "drag" || mode === "pinch" ? 36 : mode === "coast" ? 7.2 : mode === "glide" ? 9.5 : 16) * speedScale;
      const zoomOmega = (mode === "pinch" ? 34 : mode === "glide" ? 9.5 : 14) * speedScale;
      const pivotOmega = 9.5 * speedScale;

      const target = this.targetView;
      const vel = this.cameraVelocity;

      [this.yaw,vel.yaw] = stepSpring(this.yaw,target.yaw,vel.yaw,rotOmega,dt);
      [this.pitch,vel.pitch] = stepSpring(this.pitch,target.pitch,vel.pitch,rotOmega,dt);
      if (this.pitch < 0 || this.pitch > Math.PI/2-.01) {
        this.pitch = around(0,Math.PI/2-.01,this.pitch);
        vel.pitch = 0;
      }

      const [nextLogZoom,nextLogVel] = stepSpring(
        Math.log(this.zoom),Math.log(target.zoom),vel.logZoom,zoomOmega,dt
      );
      this.zoom = around(.72,6.5,Math.exp(nextLogZoom));
      vel.logZoom = (this.zoom === .72 || this.zoom === 6.5) ? 0 : nextLogVel;

      [this.panX,vel.panX] = stepSpring(this.panX,target.panX,vel.panX,panOmega,dt);
      [this.panZ,vel.panZ] = stepSpring(this.panZ,target.panZ,vel.panZ,panOmega,dt);
      if (this.panX < -9 || this.panX > 9) { this.panX = around(-9,9,this.panX); vel.panX = 0; }
      if (this.panZ < -9 || this.panZ > 9) { this.panZ = around(-9,9,this.panZ); vel.panZ = 0; }

      [this.pivotY,vel.pivotY] = stepSpring(this.pivotY,target.pivotY,vel.pivotY,pivotOmega,dt);

      this.cameraDirty = true;

      const posEps = this.software ? 1.5e-3 : 1.5e-4;
      const velEps = this.software ? 1.5e-2 : 1.5e-3;
      const settled =
        mode !== "drag" && mode !== "pinch" &&
        Math.abs(this.yaw - target.yaw) < posEps && Math.abs(vel.yaw) < velEps &&
        Math.abs(this.pitch - target.pitch) < posEps && Math.abs(vel.pitch) < velEps &&
        Math.abs(Math.log(this.zoom / target.zoom)) < posEps && Math.abs(vel.logZoom) < velEps &&
        Math.abs(this.panX - target.panX) < posEps && Math.abs(vel.panX) < velEps &&
        Math.abs(this.panZ - target.panZ) < posEps && Math.abs(vel.panZ) < velEps &&
        Math.abs(this.pivotY - target.pivotY) < posEps && Math.abs(vel.pivotY) < velEps;

      if (settled) {
        this.yaw = wrapAngle(target.yaw);
        this.pitch = target.pitch;
        this.zoom = target.zoom;
        this.panX = target.panX;
        this.panZ = target.panZ;
        this.pivotY = target.pivotY;
        this.targetView = this.currentView();
        this.zeroCameraVelocity();
        this.cameraMode = "idle";
        this.cameraActive = false;
        this.lastCameraTime = undefined;
      }
    }
    useTerm(term, shadowLength) {
      this.term = term;
      this.farmerStart = undefined;
      this.state = seasonColors[term];
      const mesh = new Mesh();
      cropSpots = [];
      cropRanges = [];
      cakeRanges = [];
      treeSpots = [];
      this.harvested = [];
      this.harvestedIndices = new Set();
      this.harvestSwing = null;
      platform(mesh,this.state);
      field(mesh,term,this.state);
      farmhouse(mesh,this.state,term);
      plantsAndTools(mesh,term,this.state);
      sundialStand(mesh);
    const foodStart = mesh.data.length / 9;
    foodTable(mesh,term);
    this.foodRange = [foodStart, mesh.data.length / 9];
    // 镰刀只在秋天的院子里出现
    if (term === "dew") {
      const sickleStart = mesh.data.length / 9;
      sickleProp(mesh);
      this.sickleRange = [sickleStart, mesh.data.length / 9];
    } else {
      this.sickleRange = null;
    }
    // 扫把只在冬天的院子里出现
    if (term === "winter") {
      const broomStart = mesh.data.length / 9;
      broomProp(mesh);
      this.broomRange = [broomStart, mesh.data.length / 9];
      // 院子里可扫的雪点
      this.snowSpots = [];
      // 院子中间的石板地
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 9; col++) {
          this.snowSpots.push([-1.62 + col * .96, 1.02 + row * .42]);
        }
      }
      // 门前那一排石阶
      for (let col = 0; col < 12; col++) {
        this.snowSpots.push([-1.45 + col * .66, .80]);
      }
      // 火塘周围一圈不落雪
      this.snowSpots = this.snowSpots.filter(([sx, sz]) => Math.hypot(sx - campfire.x, sz - campfire.z) > 1.05);
      // 田边那条石板小路（石心 x=7.05）
      for (let k = 0; k < 24; k++) {
        this.snowSpots.push([7.05 + variation(k + 3) * .06, 2.86 + k * .48]);
      }
      this.swept = [];
    } else {
      this.broomRange = null;
      this.snowSpots = [];
      this.swept = [];
    }
    this.sweepMode = false;
    this.sweepSwing = null;
    this.sweepStance = null;
      porchSupplies(mesh,term);
      waterWell(mesh);
      bambooFence(mesh,-1.62,2.01,15.20);
      bambooFence(mesh,2.83,6.52,15.20);
      for (const tree of yardTrees) {
        const start = mesh.data.length / 9;
        growTree(mesh,tree,term);
        if (Math.hypot(tree.x - 7.32, tree.z - 4.10) < .4) {
          this.treeRange = [start, mesh.data.length / 9];
        }
      }
      seasonalDetails(mesh,term);
      if (term==="winter") {
        const fireStart = mesh.data.length / 9;
        fireBed(mesh);
        this.fireRange = [fireStart, mesh.data.length / 9];
      } else {
        this.fireRange = null;
      }
      this.landCount=mesh.data.length/9;
      if (term==="grain") {
        const {left,right,near,far}=plot, y=shallowWater.height;
        mesh.face([[left+.10,y,near+.10],[left+.10,y,far-.10],
          [right-.10,y,far-.10],[right-.10,y,near+.10]],"52b8b5");
      }
      this.upload(this.world,mesh,false);
      this.landData=this.world.data.subarray(0,this.landCount*9);
      this.waterData=this.world.data.subarray(this.landCount*9);
      this.shadows=lightMap(this.landData,shadowLength,term);
      this.lampPower=new Float32Array(this.shadows.practicalPower);
      this.uploadShadows();
      this.act(0,0);
      this.render();
      if (this.motion) this.queueFrame();
    }

    uploadShadows() {
      const gl=this.gl;
      if (!gl) return;
      const format=this.gpuApi==="webgl2" ? gl.RGBA8 : gl.RGBA;
      gl.bindTexture(gl.TEXTURE_2D,this.shadowTexture);
      gl.texImage2D(gl.TEXTURE_2D,0,format,lightGrid.size,lightGrid.size,0,gl.RGBA,
        gl.UNSIGNED_BYTE,this.shadows.pixels);
    }
    act(time,farmerTime) {
      this.sceneTime = time;
      const mesh = this.actorMesh;
      mesh.data.length = 0;
      this.farmer = farmerPose(this.term,farmerTime);
      const basePower = this.shadows.practicalPower;
      this.lampPower[0] = basePower[0] * (1 + .05 * Math.sin(time * 3.1));
      this.lampPower[1] = basePower[1] * (1 + .05 * Math.sin(time * 2.7 + 1.4));
      // 扫雪模式下，墙上那把扫把收起来（在农夫手里）
      if (this.sweepMode && this.broomRange && this.world && this.world.data) {
        const bdata = this.world.data;
        let btouched = false;
        for (let v = this.broomRange[0]; v < this.broomRange[1]; v++) {
          if (bdata[v * 9 + 1] > -9000) { bdata[v * 9 + 1] = -9999; btouched = true; }
        }
        if (btouched) this.uploadGpuBuffer(this.world, false);
      }
      // 抢收模式下，门口那把镰刀收起来（在农夫手里）
      if (this.harvestMode && this.sickleRange && this.world && this.world.data) {
        const data = this.world.data;
        let touched = false;
        for (let v = this.sickleRange[0]; v < this.sickleRange[1]; v++) {
          if (data[v * 9 + 1] > -9000) { data[v * 9 + 1] = -9999; touched = true; }
        }
        if (touched) this.uploadGpuBuffer(this.world, false);
      }
      // 收割：农夫走过去、挥镰、留一茬秸秆
      const swing = this.harvestSwing;
      if (swing) {
        const t = time - swing.start;
        if (t > 3.2) {
          this.harvestSwing = null;
          this.harvestStance = [swing.x, swing.z];
        }
        else {
          const f = this.farmer;
          const walk = Math.min(1, t / 1.15);
          const ease = walk * walk * (3 - 2 * walk);
          const from = this.harvestStance || [f.x, f.z];
          f.flip = swing.x < from[0];
          f.x = from[0] + (swing.x - from[0]) * ease;
          f.z = from[1] + (swing.z - from[1]) * ease;
          f.y = shallowWater.height + .02;
          f.lift = 0;
          f.row = 4;
          if (t > 1.15) {
            const phase = (t - 1.15) * 3.4;
            f.frame = [0,1,2,3][Math.floor(phase) % 4];
            f.stretch = .96 + Math.sin(phase * 3.1) * .018;
          } else {
            f.frame = 0;
          }
        }
      }
      // 火塘石头上的糍粑
      if (this.roasting && this.roasting.length) {
        const spots = [[-.44, .02], [.04, -.44], [.44, .04]];
        for (let i = 0; i < this.roasting.length; i++) {
          const [dx, dz] = spots[i % 3];
          const bx = campfire.x + dx, bz = campfire.z + dz;
          mesh.box(bx, campfire.ground + .145, bz, .21, .075, .16, "ecd09a", "c7a25c");
          mesh.box(bx, campfire.ground + .187, bz, .19, .016, .14, "f7e4bb", "d3b073");
          if (i % 2 === 0) {
            mesh.canopy(bx, campfire.ground + .36, bz, .026, "eef6fb", .4);
          }
        }
      }
      // 走回火堆
      if (this.fireWalk) {
        const t = time - this.fireWalk.start;
        const f = this.farmer;
        if (t > .85) {
          this.fireWalk = null;
        } else {
          const ease = Math.min(1, t / .8);
          const e2 = ease * ease * (3 - 2 * ease);
          const [fx0, fz0] = this.fireWalk.from;
          f.x = fx0 + (campfire.x + .70 - fx0) * e2;
          f.z = fz0 + (campfire.z + .55 - fz0) * e2;
          f.y = campfire.ground;
          f.lift = 0;
          f.row = 3;
          f.frame = [0,1,2,1][Math.floor(t * 6) % 4];
        }
      }
      // 扫雪：农夫走过去、摆动扫把、把雪扫开
      const sweep = this.sweepSwing;
      if (sweep && this.term === "winter") {
        const t = time - sweep.start;
        const f = this.farmer;
        if (t > 2.8) {
          this.sweepSwing = null;
          this.sweepStance = [sweep.x, sweep.z];
        } else {
          const walk = Math.min(1, t / 1.05);
          const ease = walk * walk * (3 - 2 * walk);
          const from = this.sweepStance || [f.x, f.z];
          f.flip = sweep.x - .30 < from[0];
          f.x = from[0] + (sweep.x - .30 - from[0]) * ease;
          f.z = from[1] + (sweep.z - from[1]) * ease;
          f.y = .265;
          f.lift = 0;
          f.row = 2;
          if (t > 1.05) {
            const phase = (t - 1.05) * 3.2;
            f.frame = [0,1,2,3][Math.floor(phase) % 4];
            f.stretch = .96 + Math.sin(phase * 3) * .02;
          } else {
            f.frame = 0;
          }
        }
      }
      if (this.sweepMode && this.sweepStance && !this.sweepSwing && this.term === "winter") {
        const [sx, sz] = this.sweepStance;
        const f = this.farmer;
        f.x = sx - .30; f.z = sz; f.y = .265;
        f.lift = 0; f.row = 2;
        f.frame = [0,1,2,1][Math.floor(farmerTime * 3.4) % 4];
        f.stretch = .97 + Math.sin(farmerTime * 3.2) * .014;
      }
      // 冬天的雪：门口、小路上铺一层不规则的雪块，扫过就没了
      if (this.term === "winter" && this.snowSpots) {
        const swept = this.swept || [];
        const done = (sx, sz) => swept.some(([qx, qz]) => Math.abs(qx - sx) < .02 && Math.abs(qz - sz) < .02);
        for (let i = 0; i < this.snowSpots.length; i++) {
          const [sx, sz] = this.snowSpots[i];
          if (done(sx, sz)) {
            // 扫开后：露出石板，旁边一小堆雪
            mesh.box(sx, .288, sz, .46, .008, .26, "bfb396", "a2967b");
            mesh.canopy(sx + .26, .296, sz + .12, .10 + variation(i + 11) * .05, "eaf2f8", .5);
            continue;
          }
          mesh.canopy(sx, .292, sz, .23 + variation(i) * .13, "eef4f8", .55);
          mesh.canopy(sx + .16, .294, sz + .09, .15 + variation(i + 3) * .10, "e3ecf4", .55);
          mesh.canopy(sx - .13, .293, sz - .07, .12 + variation(i + 7) * .09, "f5f9fc", .55);
        }
      }
      for (const [hx, hz] of this.harvested || []) {
        for (let k = -3; k <= 3; k++) {
          blade(mesh, hx + k * .034, hz + Math.abs(k) * .024, .13 + variation((k + 4) * 9) * .06,
            k * .10, k % 2 ? "c9a86a" : "dcbe80");
        }
        mesh.box(hx, .263, hz, .13, .012, .13, "8f7a4e", "7c6a44");
      }
      if (this.harvestMode && this.farmer) {
      }
      if (this.harvestMode && this.harvestStance && !this.harvestSwing && this.farmer) {
        const [sx, sz] = this.harvestStance;
        const f = this.farmer;
        f.x = sx; f.z = sz; f.y = shallowWater.height + .02;
        f.lift = 0;
        f.row = 4;
        f.frame = [0,1,2,1][Math.floor(farmerTime * 4) % 4];
        f.stretch = .97 + Math.sin(farmerTime * 3.4) * .015;
      }
      if (this.term==="dew" && !this.harvestMode) farmerLeafSweep(mesh,this.farmer,farmerTime);
      chickens(mesh,this.term,time);
      if (this.term === "rain") {
        driftingPetals(mesh,time);
        for (let i = 0; i < 86; i++) {
          const phase=(time*(1.34+variation(i+18)*.47)+variation(i+28))%1;
          const x=footprint.left-.25+variation(i+110)*(footprint.right-footprint.left+.58);
          const z=footprint.back+.21+variation(i+160)*(footprint.front-footprint.back-.42);
          const y=.29+(1-phase)*5.15;
          rainStreak(mesh,x,y,z,.027+variation(i+57)*.026,.29+variation(i+68)*.25,
            i%3 ? "d4f0ec" : "98d2d8");
        }
        for (let i=0;i<13;i++) {
          const x=-2.15+i*.74, z=.59;
          const y=.39+(1-(time*1.63+variation(i+74))%1)*2.30;
          rainStreak(mesh,x,y-.08,z,.028,.16,"ccebe6");
        }
        for (const [i,[x,z,poolRadius]] of rainPools.entries()) {
          const phase = (time*.96 + variation(i+180)) % 1;
          const radius = .070 + phase * poolRadius * .73;
          waterRings(mesh,x,z,.284,radius,.028*(1-phase)+.007,"daf5f0");
          if (phase > .68) {
            const drop = .286 + (1-phase)*3.9;
            rainStreak(mesh,x,drop,z,.031,.20,"e4f7f5");
          }
        }
      }
      if (this.term === "grain") {
        dragonflies(mesh,time);
        for (let i=0;i<2;i++) {
          const radius=.10+((time*.35+i*.5)%1)*.38;
          waterRings(mesh,this.farmer.x,this.farmer.z+.15,.283,radius,.016,"c5f0e2");
        }
      }
      if (this.term === "dew") driftingLeaves(mesh,time);
      if (this.term === "winter") {
        fireFlames(mesh,farmerTime);
        this.lampPower[2]=basePower[2]*(1+.11*Math.sin(farmerTime*10)+.05*Math.sin(farmerTime*21));
        kettleSteam(mesh,time);
        snowfall(mesh,time);
      }
      this.upload(this.actor,mesh,true);
    }
    upload(buffer,mesh,dynamic) {
      if (dynamic) {
        if (!buffer.storage || buffer.storage.length<mesh.data.length) {
          buffer.storage = new Float32Array(mesh.data.length*2);
        }
        buffer.storage.set(mesh.data);
        buffer.data = buffer.storage.subarray(0,mesh.data.length);
      } else {
        buffer.data = new Float32Array(mesh.data);
      }
      buffer.count = buffer.data.length / 9;
      this.uploadGpuBuffer(buffer,dynamic);
    }
    uploadGpuBuffer(buffer,dynamic) {
      const gl = this.gl;
      if (!gl) return;
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer.handle);
      gl.bufferData(gl.ARRAY_BUFFER,buffer.data,dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
    }
    draw(buffer, first=0, count=buffer.count) {
      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer.handle);
      for (const [i, location] of this.locations.entries()) {
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location,3,gl.FLOAT,false,36,i*12);
      }
      gl.drawArrays(gl.TRIANGLES,first,count);
    }
    positionFarmer() {
      let pose = this.farmer;
      const cx=Math.cos(this.yaw), sx=Math.sin(this.yaw);
      const cy=Math.cos(this.pitch), sy=Math.sin(this.pitch);
      if (this.term==="winter") {
        pose={...pose,flip:(campfire.x-pose.x)*cx-(campfire.z-pose.z)*sx<0};
      }
      const feet=pose.y+pose.lift;
      const scale=.01475;
      writeFarmerQuad(this.farmerSprite.data,pose,(x,y)=>{
        const across=x*scale/Math.sqrt(pose.stretch), up=y*scale*pose.stretch;
        return [pose.x+cx*across-sx*sy*up,feet+cy*up,pose.z-sx*across-cx*sy*up];
      });
      const width=scale*(1+pose.lift*.68);
      const shadowX=this.shadows.shearX, shadowZ=this.shadows.shearZ;
      const ground=this.term==="grain" ? shallowWater.height : pose.y;
      writeFarmerQuad(this.farmerShadow.data,pose,(x,y)=>{
        const height=y*scale*pose.stretch+pose.lift;
        return [pose.x-shadowX*height-sunHeading[1]*x*width,ground+.007,
          pose.z-shadowZ*height+sunHeading[0]*x*width];
      },.35*(1-pose.lift*2.4));
    }
    readFarmerTexture() {
      if (!this.farmerPixels) {
        const atlas=this.farmerAtlas;
        const buffer=document.createElement("canvas");
        buffer.width=atlas.naturalWidth;
        buffer.height=atlas.naturalHeight;
        const context=buffer.getContext("2d",{willReadFrequently:true});
        context.drawImage(atlas,0,0);
        this.farmerPixels=context.getImageData(0,0,buffer.width,buffer.height);
      }
      return this.farmerPixels;
    }
    bindFarmerTexture() {
      const gl=this.gl;
      if (this.farmerTexture) return;
      const texture=gl.createTexture();
      gl.activeTexture(gl.TEXTURE1);
      try {
        gl.bindTexture(gl.TEXTURE_2D,texture);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,this.farmerAtlas);
        gl.uniform1i(this.farmerSampler,1);
        this.farmerTexture=texture;
      } finally {
        if (!this.farmerTexture) gl.deleteTexture(texture);
        gl.activeTexture(gl.TEXTURE0);
      }
    }
    prepareFarmer() {
      if (this.farmerAtlasBlocked || !this.farmerAtlas?.naturalWidth) return false;
      try {
        if (this.software) this.readFarmerTexture();
        else this.bindFarmerTexture();
      } catch (error) {
        if (error.name !== "SecurityError") throw error;
        this.farmerAtlasBlocked = true;
        console.warn("The browser blocked the farmer texture.",error.message);
        return false;
      }
      this.positionFarmer();
      return true;
    }
    gnomonProjection() {
      const m=this.cameraMatrix;
      const {x,z,base,height,radius}=gnomon;
      const project=(px,py,pz)=>[
        (px*m[0]+py*m[4]+pz*m[8]+m[12]+1)*this.viewWidth/2,
        (1-px*m[1]-py*m[5]-pz*m[9]-m[13])*this.viewHeight/2
      ];
      const points=[];
      for (const dx of [-radius,radius]) {
        for (const dz of [-radius,radius]) {
          points.push(project(x+dx,base+.038,z+dz),project(x+dx,base+height,z+dz));
        }
      }
      if (points.every(([px])=>px<0) || points.every(([px])=>px>this.viewWidth) ||
          points.every(([,py])=>py<0) || points.every(([,py])=>py>this.viewHeight)) return null;
      if (poleOccluded(this.landData,[-45*m[2],-45*m[6],-45*m[10]])) return null;
      const {shearX,shearZ}=this.shadows;
      return {
        outline:outlineHull(points),
        shadow:[project(x,base+.01,z),project(x-shearX*height,base+.01,z-shearZ*height)]
      };
    }
    // 把任意世界坐标投到画布像素坐标：给 DOM 热点贴到场景里的物件用
    projectPoint(px, py, pz) {
      const m = this.cameraMatrix;
      if (!m || !this.viewWidth) return null;
      return {
        x: (px*m[0] + py*m[4] + pz*m[8] + m[12] + 1) * this.viewWidth / 2,
        y: (1 - px*m[1] - py*m[5] - pz*m[9] - m[13]) * this.viewHeight / 2
      };
    }
    render() {
      if (!this.state) return;
      const canvas = this.canvas;
      const {clientWidth,clientHeight} = canvas;
      if (clientWidth<=0 || clientHeight<=0) return;
      const changedView=this.cameraDirty || clientWidth!==this.viewWidth || clientHeight!==this.viewHeight;
      if (changedView) {
        this.cameraMatrix=viewMatrix(this.yaw,this.pitch,clientWidth,clientHeight,this.zoom,this.panX,this.panZ,this.pivotY);
        this.worldUnitsPerPixel=2/(Math.hypot(this.cameraMatrix[0],this.cameraMatrix[8])*clientWidth);
        this.viewWidth=clientWidth;
        this.viewHeight=clientHeight;
        this.cameraDirty=false;
      }
      const matrix=this.cameraMatrix;
      if (changedView && this.onView) this.onView();
      if (this.onFireView && (changedView || this.fireGeometry!==this.landData)) {
        this.fireGeometry=this.landData;
        this.onFireView(this.fireProjection());
      }
      if (this.onBroomView && (changedView || this.broomGeometry!==this.landData)) {
        this.broomGeometry=this.landData;
        this.onBroomView(this.broomProjection());
      }
      if (this.onSickleView && (changedView || this.sickleGeometry!==this.landData)) {
        this.sickleGeometry=this.landData;
        this.onSickleView(this.sickleProjection());
      }
      if (this.onCropView && (changedView || this.cropGeometry!==this.landData)) {
        this.cropGeometry=this.landData;
        this.onCropView(this.cropProjection());
      }
      if (this.onFoodView && (changedView || this.foodGeometry!==this.landData)) {
        this.foodGeometry=this.landData;
        this.onFoodView(this.foodProjection());
      }
      if (this.onGnomonView && (changedView || this.gnomonGeometry!==this.landData)) {
        this.gnomonGeometry=this.landData;
        this.onGnomonView(this.gnomonProjection());
      }
      if (changedView && this.plinthShadow) {
        const {left,right,back,front}=footprint;
        const rim=[[left,back],[right,back],[right,front],[left,front]];
        const points=rim.map(([x,z])=>{
          const sx=(x*matrix[0]-.87*matrix[4]+z*matrix[8]+matrix[12]+1)*clientWidth/2;
          const sy=(1-x*matrix[1]+.87*matrix[5]-z*matrix[9]-matrix[13])*clientHeight/2;
          return sx.toFixed(1)+","+sy.toFixed(1);
        }).join(" ");
        if (points!==this.lastPlinthShadow) {
          this.plinthShadow.setAttribute("points",points);
          this.lastPlinthShadow=points;
        }
      }
      const farmerReady=this.prepareFarmer();
      if (this.software) {
        const farmer=farmerReady && {shadow:this.farmerShadow,sprite:this.farmerSprite,texture:this.farmerPixels};
        this.software.render(matrix,clientWidth,clientHeight,this.landData,this.actor.data,this.waterData,
          this.state.light,this.shadows,farmer);
        return;
      }
      const gl = this.gl;
      const ratio = Math.max(1,Math.min(devicePixelRatio || 1,2,Math.sqrt(2400000/(clientWidth*clientHeight))));
      const width = Math.max(1,Math.round(clientWidth*ratio)), height = Math.max(1,Math.round(clientHeight*ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0,0,width,height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(this.camera,false,matrix);
      gl.uniform3fv(this.shadowInfo,[this.shadows.shearX,this.shadows.shearZ,this.shadows.opacity]);
      gl.uniform3fv(this.hazeTint,this.shadows.haze);
      gl.uniform3fv(this.warmth,this.state.light);
      gl.uniform3fv(this.sunTint,this.state.sunTint);
      gl.uniform3fv(this.shadowTint,this.state.shadowTint);
      gl.uniform3fv(this.practicalPower,this.lampPower);
      gl.uniform1f(this.waterTime,this.sceneTime || 0);
      gl.uniform1f(this.waterPass,0);
      this.draw(this.world,0,this.landCount);
      if (farmerReady) {
        this.uploadGpuBuffer(this.farmerShadow,true);
        gl.enable(gl.BLEND);
        gl.depthMask(false);
        gl.uniform1f(this.farmerPass,2);
        this.draw(this.farmerShadow);
        gl.uniform1f(this.farmerPass,0);
        gl.depthMask(true);
        gl.disable(gl.BLEND);
      }
      this.draw(this.actor);
      if (farmerReady) {
        this.uploadGpuBuffer(this.farmerSprite,true);
        gl.enable(gl.BLEND);
        gl.uniform1f(this.farmerPass,1);
        this.draw(this.farmerSprite);
        gl.uniform1f(this.farmerPass,0);
        gl.disable(gl.BLEND);
      }
      if (this.waterData.length) {
        gl.enable(gl.BLEND);
        gl.uniform1f(this.waterPass,1);
        this.draw(this.world,this.landCount,this.world.count-this.landCount);
        gl.disable(gl.BLEND);
      }
    }
    loop(time) {
      this.frameQueued = false;
      if (!this.state) return;
      this.stepCamera(time);
      const animate=this.motion && (!this.software || this.lastActorFrame===undefined || time-this.lastActorFrame>=32);
      if (animate) {
        this.lastActorFrame=time;
        this.farmerStart ??= time;
        this.act(time/1000,(time-this.farmerStart)/1000);
      }
      if (animate || this.cameraDirty) this.render();
      if (!this.motion) return;
      const sample=this.frameSample ??= {start:time,frames:0};
      if (animate) sample.frames++;
      if (time-sample.start>=1000) {
        this.canvas.dataset.frameRate=(sample.frames*1000/(time-sample.start)).toFixed(1);
        this.frameSample={start:time,frames:0};
      }
      this.queueFrame();
    }
  }
  window.YardScene = YardScene;
})();






