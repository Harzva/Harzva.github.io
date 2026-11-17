/*! Habblaud v1.0.3 | MIT | faa1a012b5fbf632c66dc6801c5383e53a542406 | see vendor/habblaud/LICENSE */
var OpenBotHabblaudRuntime = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // vendor/habblaud/openbot-entry.ts
  var openbot_entry_exports = {};
  __export(openbot_entry_exports, {
    createWorld: () => createWorld,
    initializeLocale: () => initializeLocale,
    setLocale: () => setLocale,
    upstreamRevision: () => upstreamRevision
  });

  // vendor/habblaud/upstream/client/src/art/index.ts
  var art_exports = {};
  __export(art_exports, {
    CHARACTER_SHEET: () => CHARACTER_SHEET,
    FURNITURE: () => FURNITURE,
    TILE: () => TILE,
    appearanceFromSeed: () => appearanceFromSeed2,
    avatarCanvas: () => avatarCanvas,
    characterSprite: () => characterSprite,
    drawBoard: () => drawBoard,
    drawClock: () => drawClock,
    drawFloor: () => drawFloor,
    drawRug: () => drawRug,
    drawScreen: () => drawScreen,
    drawSouthWall: () => drawSouthWall,
    drawWallFace: () => drawWallFace,
    drawWallTop: () => drawWallTop,
    drawWindowView: () => drawWindowView,
    editorConflict: () => editorConflict,
    editorOptions: () => editorOptions,
    fitToOptions: () => fitToOptions,
    footballLance: () => footballLance,
    furnitureSprites: () => furnitureSprites,
    hash32: () => hash32,
    iconSprite: () => iconSprite,
    poseFrameCount: () => poseFrameCount,
    poseFrameDuration: () => poseFrameDuration,
    roomTheme: () => roomTheme2
  });

  // vendor/habblaud/upstream/shared/appearance.ts
  var HAIR_STYLES = [
    "short",
    "buzz",
    "spiky",
    "side_part",
    "curly",
    "afro",
    "bob",
    "long",
    "ponytail",
    "bun",
    "pigtails",
    "mohawk",
    "bald",
    "wavy"
  ];
  var TOP_STYLES = ["tshirt", "hoodie", "shirt_tie", "sweater", "jacket", "blouse", "polo"];
  var ACCESSORIES = ["none", "glasses", "sunglasses", "headphones", "cap", "beanie", "earrings", "bow"];
  var FACIAL_HAIR = ["none", "stubble", "beard", "mustache", "goatee"];
  var BOTTOM_STYLES = ["pants", "shorts", "skirt"];
  var PART_KEYS = [
    "skin",
    "hair",
    "hairStyle",
    "eyes",
    "top",
    "topAccent",
    "topStyle",
    "bottom",
    "bottomStyle",
    "shoes",
    "accessory",
    "accessoryColor",
    "facialHair"
  ];
  function partsKey(parts) {
    return parts ? PART_KEYS.map((k) => parts[k] ?? "").join(",") : "";
  }

  // vendor/habblaud/upstream/shared/hash.ts
  function hash32(input) {
    let h = 2166136261;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
      a = a + 1831565813 >>> 0;
      let t2 = a;
      t2 = Math.imul(t2 ^ t2 >>> 15, t2 | 1);
      t2 ^= t2 + Math.imul(t2 ^ t2 >>> 7, t2 | 61);
      return ((t2 ^ t2 >>> 14) >>> 0) / 4294967296;
    };
  }

  // vendor/habblaud/upstream/client/src/art/api.ts
  var TILE = 16;
  var FURNITURE = {
    desk: { mount: "floor", footprint: { w: 2, h: 1 }, blocks: true, variants: ["wood", "white", "dark"] },
    desk_back: { mount: "floor", footprint: { w: 2, h: 1 }, blocks: true, variants: ["wood", "white", "dark"] },
    office_chair_front: { mount: "floor", footprint: { w: 1, h: 1 }, blocks: false, seat: true, variants: ["black", "blue", "red", "green", "gray"] },
    office_chair: { mount: "floor", footprint: { w: 1, h: 1 }, blocks: false, seat: true, variants: ["black", "blue", "red", "green", "gray"] },
    bookshelf: { mount: "floor", footprint: { w: 2, h: 1 }, blocks: true },
    filing_cabinet: { mount: "floor", footprint: { w: 1, h: 1 }, blocks: true },
    printer: { mount: "floor", footprint: { w: 1, h: 1 }, blocks: true },
    trash_bin: { mount: "floor", footprint: { w: 1, h: 1 }, blocks: true },
    plant_small: { mount: "floor", footprint: { w: 1, h: 1 }, blocks: true, variants: ["fern", "succulent", "flower"] },
    plant_tall: { mount: "floor", footprint: { w: 1, h: 1 }, blocks: true, variants: ["palm", "ficus", "monstera", "bonsai"] },
    glass_partition: { mount: "floor", footprint: { w: 1, h: 1 }, blocks: true, variants: ["h", "v", "end"] },
    binder_shelf: { mount: "floor", footprint: { w: 1, h: 1 }, blocks: true },
    meeting_table: { mount: "floor", footprint: { w: 3, h: 2 }, blocks: true },
    stool: { mount: "floor", footprint: { w: 1, h: 1 }, blocks: false, seat: true },
    floor_lamp: { mount: "floor", footprint: { w: 1, h: 1 }, blocks: true },
    water_cooler: { mount: "floor", footprint: { w: 1, h: 1 }, blocks: true },
    whiteboard: { mount: "wall", footprint: { w: 3, h: 0 }, blocks: false },
    window: { mount: "wall", footprint: { w: 2, h: 0 }, blocks: false },
    clock: { mount: "wall", footprint: { w: 1, h: 0 }, blocks: false },
    poster: { mount: "wall", footprint: { w: 1, h: 0 }, blocks: false, variants: ["code", "coffee", "rocket", "cat", "bug", "ship_it"] },
    painting: { mount: "wall", footprint: { w: 2, h: 0 }, blocks: false },
    tv: { mount: "wall", footprint: { w: 2, h: 0 }, blocks: false },
    light_switch: { mount: "wall", footprint: { w: 1, h: 0 }, blocks: false, variants: ["on", "off"] },
    elevator: { mount: "wall", footprint: { w: 2, h: 0 }, blocks: false, states: 5 },
    door_frame: { mount: "wall", footprint: { w: 2, h: 0 }, blocks: false },
    sign: { mount: "wall", footprint: { w: 3, h: 0 }, blocks: false },
    mirror: { mount: "wall", footprint: { w: 1, h: 0 }, blocks: false },
    shelf_wall: { mount: "wall", footprint: { w: 2, h: 0 }, blocks: false },
    counter: { mount: "floor", footprint: { w: 1, h: 1 }, blocks: true, variants: ["plain", "drawers"] },
    counter_sink: { mount: "floor", footprint: { w: 1, h: 1 }, blocks: true },
    coffee_machine: { mount: "floor", footprint: { w: 1, h: 1 }, blocks: true, states: 2 },
    microwave: { mount: "floor", footprint: { w: 1, h: 1 }, blocks: true },
    fridge: { mount: "floor", footprint: { w: 1, h: 1 }, blocks: true },
    vending_machine: { mount: "floor", footprint: { w: 1, h: 1 }, blocks: true },
    cafe_table: { mount: "floor", footprint: { w: 1, h: 1 }, blocks: true },
    cafe_chair: { mount: "floor", footprint: { w: 1, h: 1 }, blocks: false, seat: true, variants: ["up", "down", "left", "right"] },
    sofa: { mount: "floor", footprint: { w: 3, h: 1 }, blocks: false, seat: true, variants: ["down", "up"] },
    armchair: { mount: "floor", footprint: { w: 1, h: 1 }, blocks: false, seat: true, variants: ["up", "down", "left", "right"] },
    coffee_table: { mount: "floor", footprint: { w: 2, h: 1 }, blocks: true },
    pingpong_table: { mount: "floor", footprint: { w: 3, h: 2 }, blocks: true },
    beanbag: { mount: "floor", footprint: { w: 1, h: 1 }, blocks: false, seat: true, variants: ["red", "blue", "yellow", "green"] },
    arcade: { mount: "floor", footprint: { w: 1, h: 1 }, blocks: true },
    toilet_stall: { mount: "floor", footprint: { w: 2, h: 2 }, blocks: true, states: 2 },
    sink: { mount: "floor", footprint: { w: 1, h: 1 }, blocks: true },
    reception_desk: { mount: "floor", footprint: { w: 3, h: 1 }, blocks: true },
    bench: { mount: "floor", footprint: { w: 2, h: 1 }, blocks: false, seat: true }
  };

  // vendor/habblaud/upstream/shared/world/appearance-flat.ts
  var SKINS = ["#ffe2cc", "#f6cfb0", "#eab894", "#d69f78", "#bd8560", "#9a6444", "#7a4a31", "#5a3623"];
  var HAIR_NATURAL = [
    ["#2b2530", 5],
    // preto
    ["#3f2c22", 5],
    // castanho-escuro
    ["#5f3c28", 4],
    // castanho
    ["#87593a", 2.5],
    // castanho-claro
    ["#b0703c", 1.2],
    // ruivo-acobreado
    ["#8e3b2b", 1],
    // acaju
    ["#d6ae68", 1.8],
    // loiro
    ["#ebdcb0", 0.7],
    // platinado
    ["#8f929b", 0.7],
    // grisalho
    ["#d9dbe0", 0.5]
    // branco
  ];
  var HAIR_FUN = ["#e47aa8", "#5b8fe0", "#8f6ad8", "#3fb3a0", "#e0584e", "#7cc45a", "#f0a24a"];
  var EYES = ["#2b2236", "#2b2236", "#4a2f22", "#5a3b22", "#2f5f9e", "#3c7a52"];
  var TOP_COLORS = [
    "#e2604f",
    "#4a86d8",
    "#4bab72",
    "#efb54a",
    "#8d66cf",
    "#36b0b0",
    "#e47aa8",
    "#3d4352",
    "#f1efe9",
    "#8a96a3",
    "#2f4c7d",
    "#c9713f",
    "#76913f",
    "#e3d3b2",
    "#f29b72",
    "#5bc0de",
    "#b04a5a",
    "#f2d16b"
  ];
  var SHIRT_COLORS = ["#f4f4f0", "#d3e3f4", "#f3d6de", "#dfe3e8", "#e9f1dc", "#fbf0d6"];
  var TIE_COLORS = ["#c0392b", "#2f4c7d", "#7b2d44", "#2e7d4f", "#d9a42e", "#5b3a8c", "#3d4352"];
  var JACKET_COLORS = ["#2f3b55", "#3d4352", "#6b4a35", "#55613b", "#262a33", "#b08a5e", "#7a2f3a", "#4a6a8a"];
  var LIGHT_ACCENTS = ["#f4f4f0", "#e8e3d6", "#dfe7ef", "#f6e7c8", "#c9ced6"];
  var BOTTOMS = [
    ["#3f5f8c", 5],
    ["#2e3e5e", 4],
    ["#2c2c35", 4],
    ["#b49c72", 2],
    ["#6d7480", 2],
    ["#6e4c38", 1.5],
    ["#5f6845", 1.2],
    ["#2c3655", 2],
    ["#7f9cc4", 1.5],
    ["#e2ded5", 0.5],
    ["#9b3b3b", 0.4]
  ];
  var SHOES = [
    ["#2b2b33", 5],
    ["#6b4630", 3],
    ["#ececec", 3],
    ["#d04848", 1],
    ["#3f63a8", 1],
    ["#b88752", 1.5],
    ["#7d8592", 1]
  ];
  var ACC_COLORS = {
    none: ["#2b2b33"],
    glasses: ["#2b2b33", "#5a3a28", "#3f63a8", "#b03a3a", "#8a8f99"],
    sunglasses: ["#22232b"],
    headphones: ["#2b2b33", "#f1efe9", "#e2604f", "#4a86d8", "#efb54a", "#36b0b0"],
    cap: ["#e2604f", "#4a86d8", "#2b2b33", "#4bab72", "#efb54a", "#f1efe9", "#2f4c7d"],
    beanie: ["#e2604f", "#efb54a", "#4bab72", "#8d66cf", "#3d4352", "#36b0b0"],
    earrings: ["#f2c14e", "#d9dde3"],
    bow: ["#e2604f", "#e47aa8", "#efb54a", "#4a86d8", "#8d66cf"]
  };
  var LANYARDS = ["#f2b33d", "#e2604f", "#4a86d8", "#4bab72", "#8d66cf", "#36b0b0"];
  var HAIR_W = {
    m: {
      short: 16,
      buzz: 9,
      spiky: 9,
      side_part: 12,
      curly: 9,
      afro: 6,
      bob: 2,
      long: 4,
      ponytail: 3,
      bun: 4,
      pigtails: 0.4,
      mohawk: 4,
      bald: 5,
      wavy: 9
    },
    f: {
      short: 4,
      buzz: 1.2,
      spiky: 2,
      side_part: 4,
      curly: 9,
      afro: 7,
      bob: 13,
      long: 16,
      ponytail: 13,
      bun: 10,
      pigtails: 6,
      mohawk: 1,
      bald: 0.4,
      wavy: 13
    }
  };
  var TOP_W = {
    m: { tshirt: 20, hoodie: 16, shirt_tie: 10, sweater: 13, jacket: 13, blouse: 2, polo: 14 },
    f: { tshirt: 17, hoodie: 14, shirt_tie: 5, sweater: 14, jacket: 12, blouse: 20, polo: 8 }
  };
  var ACC_W = {
    m: { none: 40, glasses: 18, sunglasses: 4, headphones: 13, cap: 7, beanie: 6, earrings: 2, bow: 0.3 },
    f: { none: 36, glasses: 16, sunglasses: 4, headphones: 11, cap: 4, beanie: 5, earrings: 13, bow: 7 }
  };
  var FACIAL_W = { none: 62, stubble: 12, beard: 13, mustache: 7, goatee: 6 };
  var BOTTOM_W = {
    m: { pants: 88, shorts: 12, skirt: 0 },
    f: { pants: 62, shorts: 10, skirt: 28 }
  };
  function scramble(seed) {
    let h = (seed ^ 2654435769) >>> 0;
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    return (h ^ h >>> 16) >>> 0;
  }
  function appearanceFromSeed(seed, opts = {}) {
    const rnd = mulberry32(scramble(seed));
    const pick3 = (arr) => arr[Math.floor(rnd() * arr.length) % arr.length];
    const weighted = (w) => {
      const entries = Object.entries(w);
      const total = entries.reduce((s, [, v]) => s + v, 0);
      let x = rnd() * total;
      for (const [k, v] of entries) {
        x -= v;
        if (x < 0) return k;
      }
      return entries[entries.length - 1][0];
    };
    const weightedPair = (arr) => weighted(Object.fromEntries(arr));
    const lookRoll = rnd();
    const look = opts.look ?? (lookRoll < 0.5 ? "f" : "m");
    const skin = pick3(SKINS);
    const fun = rnd() < 0.08;
    const hair = fun ? pick3(HAIR_FUN) : weightedPair(HAIR_NATURAL);
    let hairStyle = weighted(HAIR_W[look]);
    const eyes = pick3(EYES);
    const topStyle = weighted(TOP_W[look]);
    let top;
    let topAccent;
    switch (topStyle) {
      case "shirt_tie":
        top = pick3(SHIRT_COLORS);
        topAccent = pick3(TIE_COLORS);
        break;
      case "jacket":
        top = pick3(JACKET_COLORS);
        topAccent = rnd() < 0.7 ? pick3(LIGHT_ACCENTS) : pick3(TOP_COLORS);
        break;
      case "hoodie":
      case "polo":
        top = pick3(TOP_COLORS);
        topAccent = rnd() < 0.6 ? pick3(LIGHT_ACCENTS) : pick3(TOP_COLORS);
        break;
      default:
        top = pick3(TOP_COLORS);
        topAccent = pick3(TOP_COLORS);
    }
    if (topAccent === top) topAccent = pick3(LIGHT_ACCENTS);
    const bottom = weightedPair(BOTTOMS);
    const shoes = weightedPair(SHOES);
    let accessory = weighted(ACC_W[look]);
    if ((accessory === "cap" || accessory === "beanie") && (hairStyle === "afro" || hairStyle === "bun" || hairStyle === "mohawk" || hairStyle === "pigtails")) {
      accessory = "glasses";
    }
    if (accessory === "bow" && (hairStyle === "bald" || hairStyle === "buzz")) accessory = "earrings";
    const accessoryColor = pick3(ACC_COLORS[accessory]);
    const lanyardRoll = rnd();
    const facialRoll = weighted(FACIAL_W);
    const facialHair = look === "m" ? facialRoll : "none";
    const bottomStyle = weighted(BOTTOM_W[look]);
    if (look === "f" && hairStyle === "bald") hairStyle = "buzz";
    const a = {
      skin,
      hair,
      hairStyle,
      eyes,
      top,
      topAccent,
      topStyle,
      bottom,
      shoes,
      accessory,
      accessoryColor,
      lanyard: opts.sub ? LANYARDS[Math.floor(lanyardRoll * LANYARDS.length) % LANYARDS.length] : null,
      look,
      facialHair,
      bottomStyle
    };
    const parts = opts.parts;
    if (!parts) return a;
    const chosen = Object.fromEntries(PART_KEYS.filter((k) => parts[k] !== void 0).map((k) => [k, parts[k]]));
    return { ...a, ...chosen };
  }

  // vendor/habblaud/upstream/shared/locales/en.ts
  var EN = {
    // client/src/main.ts
    "Escrit\xF3rio virtual em pixel art que mostra, em tempo real, o que seus agentes do Claude Code est\xE3o fazendo.": "Pixel-art virtual office that shows, in real time, what your Claude Code agents are doing.",
    // client/src/net/store.ts
    "Este pedido j\xE1 foi respondido.": "This request has already been answered.",
    "N\xE3o foi poss\xEDvel responder (erro {0}).": "Couldn't reply (error {0}).",
    "Editar o personagem s\xF3 funciona com o escrit\xF3rio ao vivo.": "Editing the character only works with the live office.",
    "Sem conex\xE3o com o Habblaud.": "No connection to Habblaud.",
    "N\xE3o foi poss\xEDvel salvar o personagem (erro {0}).": "Couldn't save the character (error {0}).",
    "erro {0}": "error {0}",
    "agente desconhecido: ele j\xE1 saiu do escrit\xF3rio?": "unknown agent: has it already left the office?",
    "este agente n\xE3o recebe mensagens agora": "this agent can't receive messages right now",
    "o agente saiu do escrit\xF3rio": "the agent left the office",
    // client/src/net/timeline.ts
    "dia inv\xE1lido": "invalid day",
    // client/src/ui/character-editor.ts
    "Editar personagem": "Edit character",
    "Pr\xE9via do personagem": "Character preview",
    "Sortear": "Randomize",
    "Sortear outra apar\xEAncia (desfaz as pe\xE7as escolhidas)": "Randomize another look (undoes the pieces you chose)",
    "Salvar": "Save",
    "Cancelar": "Cancel",
    "Voltar ao sorteio": "Back to random",
    "Nome": "Name",
    "Vale para o projeto: a pr\xF3xima sess\xE3o nesta sala chega com este personagem.": "Applies to the project: the next session in this room arrives as this character.",
    "O agente saiu do escrit\xF3rio.": "The agent left the office.",
    "D\xEA um nome ao personagem.": "Give the character a name.",
    "Personagem salvo: {0}.": "Character saved: {0}.",
    "Confirmar: voltar ao sorteio": "Confirm: back to random",
    "O personagem voltou ao sorteio.": "The character is back to random.",
    // client/src/ui/character-model.ts
    "Pele": "Skin",
    "Tom": "Tone",
    "Cabelo": "Hair",
    "Estilo": "Style",
    "Cor": "Color",
    "Barba": "Beard",
    "Olhos": "Eyes",
    "Parte de cima": "Top",
    "Detalhe": "Detail",
    "Parte de baixo": "Bottom",
    "Sapatos": "Shoes",
    "Acess\xF3rio": "Accessory",
    "Tipo": "Type",
    "Curto": "Short",
    "Raspado": "Buzz cut",
    "Espetado": "Spiky",
    "Repartido": "Side part",
    "Cacheado": "Curly",
    "Black power": "Afro",
    "Chanel": "Bob",
    "Longo": "Long",
    "Rabo de cavalo": "Ponytail",
    "Coque": "Bun",
    "Moicano": "Mohawk",
    "Careca": "Bald",
    "Ondulado": "Wavy",
    "Camiseta": "T-shirt",
    "Moletom": "Hoodie",
    "Camisa e gravata": "Shirt and tie",
    "Su\xE9ter": "Sweater",
    "Jaqueta": "Jacket",
    "Blusa": "Blouse",
    "Cal\xE7a": "Pants",
    "Bermuda": "Shorts",
    "Saia": "Skirt",
    "Nenhum": "None",
    "\xD3culos": "Glasses",
    "\xD3culos escuros": "Sunglasses",
    "Fone": "Headphones",
    "Bon\xE9": "Cap",
    "Gorro": "Beanie",
    "Brincos": "Earrings",
    "La\xE7o": "Bow",
    "Sem barba": "No beard",
    "Por fazer": "Stubble",
    "Bigode": "Mustache",
    "Cavanhaque": "Goatee",
    // client/src/ui/composer-model.ts
    "Para mandar mensagens daqui: npm run mod:install (plugin habblaud-mensagens)": "To send messages from here: npm run mod:install (plugin habblaud-mensagens)",
    "Para mandar mensagens ao Codex: com o Habblaud no Docker, deixe npm run codex:bridge rodando; no modo Node funciona sozinho": "To send messages to Codex: with Habblaud in Docker, keep npm run codex:bridge running; in Node mode it works on its own",
    "Sem mensagens no timelapse: o escrit\xF3rio mostrado \xE9 o de outro momento": "No messages in timelapse: the office shown is from another moment",
    "Subagentes n\xE3o recebem mensagens: escreva para o agente principal": "Subagents don't receive messages: write to the main agent",
    "Sess\xE3o encerrada": "Session ended",
    "Para responder, use o Codex": "To reply, use Codex",
    "Para responder, use o terminal do Claude Code": "To reply, use the Claude Code terminal",
    "Para mandar mensagens por aqui, abra o Habblaud por http://localhost (ou 127.0.0.1)": "To send messages from here, open Habblaud at http://localhost (or 127.0.0.1)",
    "Entra na fila da sess\xE3o e vira o pr\xF3ximo prompt quando o Codex terminar o que est\xE1 fazendo. Enter manda; Shift+Enter quebra a linha.": "Joins the session queue and becomes the next prompt when Codex finishes what it's doing. Enter sends; Shift+Enter adds a new line.",
    "Entra na sess\xE3o como se voc\xEA tivesse digitado. Enter manda; Shift+Enter quebra a linha.": "Goes into the session as if you had typed it. Enter sends; Shift+Enter adds a new line.",
    "Enviando\u2026": "Sending\u2026",
    "Na fila: entregando ao Codex\u2026": "Queued: delivering to Codex\u2026",
    "Na fila: esperando a sess\xE3o buscar a mensagem\u2026": "Queued: waiting for the session to pick up the message\u2026",
    "Entregando \xE0 sess\xE3o\u2026": "Delivering to the session\u2026",
    "Entregue \u2713 na fila da sess\xE3o: entra quando o Codex terminar o que est\xE1 fazendo (at\xE9 ~10 s)": "Delivered \u2713 to the session queue: goes in when Codex finishes what it's doing (up to ~10 s)",
    "Entregue \u2713 (se o agente estiver ocupado, entra quando ele terminar)": "Delivered \u2713 (if the agent is busy, it goes in when it finishes)",
    "N\xE3o foi poss\xEDvel mandar: {0}": "Couldn't send: {0}",
    "erro desconhecido": "unknown error",
    "N\xE3o foi entregue: {0}": "Not delivered: {0}",
    "o Habblaud n\xE3o conhece mais esta mensagem (ele reiniciou?)": "Habblaud no longer knows this message (did it restart?)",
    "sem not\xEDcia da entrega: confira no terminal do Claude Code": "no word on delivery: check the Claude Code terminal",
    "sem not\xEDcia da entrega: confira no Codex": "no word on delivery: check Codex",
    "n\xE3o foi poss\xEDvel falar com o Habblaud": "couldn't reach Habblaud",
    // client/src/ui/composer.ts
    "Mandar (Enter)": "Send (Enter)",
    "Mandar a mensagem": "Send the message",
    "Enviar": "Send",
    "o agente": "the agent",
    "Mensagem para {0} (Enter manda, Shift+Enter quebra a linha)": "Message to {0} (Enter sends, Shift+Enter adds a new line)",
    "Mensagem para {0}\u2026": "Message to {0}\u2026",
    "Mensagem para {0}": "Message to {0}",
    // client/src/ui/daystats-launcher.ts
    "Meu dia: para onde foi o tempo (M)": "My day: where the time went (M)",
    "N\xE3o foi poss\xEDvel abrir o painel Meu dia.": "Couldn't open the My day panel.",
    // client/src/ui/daystats-model.ts
    "Esperando voc\xEA": "Waiting on you",
    "Trabalhando": "Working",
    "Ocioso": "Idle",
    "Esperando o shell": "Waiting on shell",
    "sem tempo registrado": "no time recorded",
    "{0} \xB7 {1} em {2}, \xE0s {3}{4}": "{0} \xB7 {1} in {2}, at {3}{4}",
    " (ainda esperando)": " (still waiting)",
    "Algu\xE9m esperou por voc\xEA durante {0} do dia": "Someone waited on you for {0} of the day",
    "espera": "wait",
    "esperas": "waits",
    "s\xF3 esperas de poucos segundos": "only waits of a few seconds",
    "nenhuma espera": "no waits",
    "subagente": "subagent",
    "subagentes": "subagents",
    "{0} entrada \xB7 {1} sa\xEDda": "{0} in \xB7 {1} out",
    "S\xF3 do Claude Code: o Codex n\xE3o grava custo, s\xF3 tokens": "Claude Code only: Codex doesn't record cost, only tokens",
    "Custo calculado pelo pr\xF3prio Claude Code": "Cost calculated by Claude Code itself",
    "O Codex n\xE3o grava custo, s\xF3 tokens": "Codex doesn't record cost, only tokens",
    "Os transcripts n\xE3o trouxeram o custo": "The transcripts didn't include the cost",
    "Nenhum gasto registrado": "No spending recorded",
    "ferramenta": "tool",
    "ferramentas": "tools",
    "tarefa conclu\xEDda": "task completed",
    "tarefas conclu\xEDdas": "tasks completed",
    "{0} esperando voc\xEA": "{0} waiting on you",
    "{0} no total": "{0} total",
    "{0}% do trabalho do dia": "{0}% of the day's work",
    "sess\xE3o": "session",
    "sess\xF5es": "sessions",
    "desde {0}": "since {0}",
    ", para {0}": ", for {0}",
    ", ainda esperando": ", still waiting",
    "Hoje": "Today",
    "Ontem": "Yesterday",
    // client/src/ui/daystats.ts
    "Tempo de agentes \xE9 a soma de todos eles: dois agentes trabalhando por 1 hora contam 2 horas. ": "Agent time is the sum of all agents: two agents working for 1 hour count as 2 hours. ",
    "\u201CEsperando voc\xEA\u201D \xE9 o tempo de m\xE3o levantada no escrit\xF3rio (permiss\xE3o, pergunta ou escolha). ": "\u201CWaiting on you\u201D is the time spent with a hand raised in the office (permission, question or choice). ",
    "O Habblaud s\xF3 conta o que acontece enquanto ele est\xE1 rodando.": "Habblaud only counts what happens while it's running.",
    "Dia": "Day",
    "Demonstra\xE7\xE3o": "Demo",
    "Dados reais": "Real data",
    "Dados exibidos": "Data shown",
    "demonstra\xE7\xE3o": "demo",
    "N\xFAmeros fict\xEDcios do modo demonstra\xE7\xE3o": "Made-up numbers from demo mode",
    "Fechar (Esc)": "Close (Esc)",
    "Tentar de novo": "Try again",
    "Meu dia": "My day",
    "N\xE3o foi poss\xEDvel carregar as estat\xEDsticas do dia.": "Couldn't load the day's stats.",
    "N\xE3o foi poss\xEDvel carregar as estat\xEDsticas ({0}).": "Couldn't load the stats ({0}).",
    "Carregando\u2026": "Loading\u2026",
    "Atualizado \xE0s {0} \xB7 atualiza a cada 30 s": "Updated at {0} \xB7 refreshes every 30 s",
    "Ainda n\xE3o h\xE1 tempo registrado hoje. Os n\xFAmeros aparecem assim que algum agente trabalhar com o Habblaud aberto.": "No time recorded today yet. The numbers show up as soon as an agent works with Habblaud open.",
    "Nada registrado neste dia.": "Nothing recorded on this day.",
    "Maior espera: ": "Longest wait: ",
    "Destaques do dia": "Day highlights",
    "soma do tempo de todos os agentes": "sum of all agents' time",
    "Sess\xF5es": "Sessions",
    "Pedidos": "Requests",
    "Custo": "Cost",
    "Esconder \u201C{0}\u201D dos gr\xE1ficos": "Hide \u201C{0}\u201D from the charts",
    "Mostrar \u201C{0}\u201D nos gr\xE1ficos": "Show \u201C{0}\u201D in the charts",
    "Status nos gr\xE1ficos (clique para mostrar ou esconder)": "Statuses in the charts (click to show or hide)",
    "Ver gr\xE1fico": "View chart",
    "Ver tabela": "View table",
    "Por hora": "By hour",
    "Tempo de agentes em cada hora do dia": "Agent time in each hour of the day",
    "Hora": "Hour",
    "Tempo de agentes por hora": "Agent time by hour",
    "Tempo de agentes por hora (setas para navegar)": "Agent time by hour (arrows to navigate)",
    " (agora)": " (now)",
    " \xB7 agora": " \xB7 now",
    " \xB7 ainda n\xE3o chegou": " \xB7 not yet",
    "Por projeto": "By project",
    "Ordenado pelo tempo esperando voc\xEA": "Sorted by time waiting on you",
    "Nenhum projeto com tempo neste dia.": "No projects with time on this day.",
    "Projeto": "Project",
    "Tempo de agentes por projeto": "Agent time by project",
    "Maiores esperas": "Longest waits",
    "Quanto tempo cada agente ficou de m\xE3o levantada esperando voc\xEA": "How long each agent kept a hand raised waiting on you",
    "Nenhuma espera por voc\xEA neste dia.": "Nobody waited on you this day.",
    "esperando agora": "waiting now",
    "Por conta": "By account",
    "Cada conta na cor dela, com a fatia do tempo de trabalho do dia": "Each account in its own color, with its share of the day's work time",
    "Nenhuma conta com tempo neste dia.": "No accounts with time on this day.",
    "s\xF3 tokens": "tokens only",
    // client/src/ui/drawer.ts
    "Copiado!": "Copied!",
    "N\xE3o foi poss\xEDvel copiar": "Couldn't copy",
    "conclu\xEDda": "completed",
    "em andamento": "in progress",
    "Comando": "Command",
    "Copiar comando": "Copy command",
    "Rodando h\xE1 {0} (desde {1})": "Running for {0} (since {1})",
    "Iniciado em {0} \xB7 id {1}": "Started {0} \xB7 id {1}",
    "{0}, {1}, rodando h\xE1 {2}": "{0}, {1}, running for {2}",
    "Sala": "Room",
    "Este agente j\xE1 saiu do escrit\xF3rio.": "This agent has already left the office.",
    "C\xE2mera acompanha o agente (F)": "Camera follows the agent (F)",
    "Seguir": "Follow",
    "Levar a c\xE2mera at\xE9 o agente": "Move the camera to the agent",
    "Centralizar": "Center",
    "Abrir terminal": "Open terminal",
    "Com o plugin habblaud-permissoes (npm run mod:install), d\xE1 para responder as perguntas por aqui.": "With the habblaud-permissoes plugin (npm run mod:install), you can answer questions from here.",
    "Precisa de voc\xEA": "Needs you",
    "Shells rodando": "Running shells",
    "Detalhes": "Details",
    "Agora": "Now",
    "Mandar mensagem": "Send message",
    "Progresso das tarefas": "Task progress",
    "Tarefas": "Tasks",
    "Nenhum subagente no momento.": "No subagents right now.",
    "Subagentes": "Subagents",
    "Mostrar menos": "Show less",
    "Linha do tempo": "Timeline",
    "Chamadas de ferramenta": "Tool calls",
    "Tokens de entrada": "Input tokens",
    "Tokens de sa\xEDda": "Output tokens",
    "Custo estimado": "Estimated cost",
    "Linhas": "Lines",
    "Subagentes disparados": "Subagents launched",
    "Modelo": "Model",
    "Permiss\xF5es": "Permissions",
    "Sess\xE3o": "Session",
    "Copiar id da sess\xE3o": "Copy session id",
    "In\xEDcio": "Start",
    "Dura\xE7\xE3o": "Duration",
    "Execu\xE7\xE3o": "Execution",
    "Estat\xEDsticas": "Stats",
    "plano {0}": "{0} plan",
    "{0}\nClique para ver a sala": "{0}\nClick to view the room",
    "Desde {0}": "Since {0}",
    "ao Codex{0}": "Codex{0}",
    "ao terminal da {0}": "the {0} terminal",
    "V\xE1 {0} em {1} para responder{2}": "Go to {0} in {1} to reply{2}",
    "seu projeto": "your project",
    "Pr\xF3xima fase em {0}": "Next phase in {0}",
    "Quanto falta para o personagem mudar o que faz enquanto espera (veja a Ajuda)": "Time left until the character changes what it does while waiting (see Help)",
    "Nenhum ativo agora ({0} nesta sess\xE3o).": "None active right now ({0} in this session).",
    "disparado": "launched",
    "disparados": "launched",
    "Nenhum subagente disparado ainda.": "No subagents launched yet.",
    "Respons\xE1vel": "Main agent",
    "O agente principal j\xE1 n\xE3o est\xE1 no escrit\xF3rio.": "The main agent is no longer in the office.",
    "Mostrar mais {0}": "Show {0} more",
    "Pode escolher mais de uma": "You can pick more than one",
    "interativo": "interactive",
    "ao vivo": "live",
    "em outro terminal": "in another terminal",
    "Fechar terminal": "Close terminal",
    "Fechar o terminal (T)": "Close the terminal (T)",
    "Sem terminal no timelapse: a conversa \xE9 a de agora, n\xE3o a do momento reproduzido.": "No terminal in timelapse: the conversation is the current one, not the one from the replayed moment.",
    "O agente j\xE1 saiu do escrit\xF3rio.": "The agent has already left the office.",
    "Ver a conversa desta sess\xE3o como no {0}, ao vivo{1} (T)": "View this session's conversation as in {0}, live{1} (T)",
    "terminal do Claude Code": "the Claude Code terminal",
    '; "Assumir daqui" continua nela aqui': '; "Take over here" continues it here',
    "Abrir o terminal desta sess\xE3o, que roda aqui no Habblaud (T)": "Open this session's terminal, which runs here in Habblaud (T)",
    "Abrir o terminal: a sess\xE3o roda em outro terminal; d\xE1 para assumir daqui (T)": "Open the terminal: the session runs in another terminal; you can take over here (T)",
    "Aprova\xE7\xF5es": "Approvals",
    "Em segundo plano": "In the background",
    "Renomear sala": "Rename room",
    "Levar a c\xE2mera at\xE9 a sala": "Move the camera to the room",
    "Esta sala foi fechada: todos os agentes sa\xEDram.": "This room was closed: all agents have left.",
    "Ningu\xE9m na sala agora.": "No one in the room right now.",
    "Agentes": "Agents",
    "Progresso das tarefas da sala": "Room task progress",
    "Atividade recente": "Recent activity",
    "Copiar caminho": "Copy path",
    "Fechar detalhes (Esc)": "Close details (Esc)",
    "Subagente": "Subagent",
    "Agente": "Agent",
    // client/src/ui/feed.ts
    "Eventos recentes": "Recent events",
    "Os eventos dos agentes aparecem aqui assim que acontecem.": "Agent events show up here as soon as they happen.",
    "Feed de atividade": "Activity feed",
    "Atividade": "Activity",
    "1 nova": "1 new",
    "{0} novas": "{0} new",
    "Nenhum evento das contas selecionadas.": "No events from the selected accounts.",
    "Sem {0} (filtro da barra lateral)": "Hiding {0} (sidebar filter)",
    "Recolher feed ( ] )": "Collapse feed ( ] )",
    "Abrir feed ( ] )": "Open feed ( ] )",
    // client/src/ui/format.ts
    "agora": "now",
    "h\xE1 {0} s": "{0} s ago",
    "h\xE1 {0} min": "{0} min ago",
    "h\xE1 {0} h": "{0} h ago",
    "h\xE1 {0} d": "{0} d ago",
    "em menos de 1 min": "in less than 1 min",
    "\xE0s {0}": "at {0}",
    "amanh\xE3 \xE0s {0}": "tomorrow at {0}",
    "renovada": "renewed",
    "renovada depois da \xFAltima leitura (uso atual desconhecido)": "renewed since the last reading (current usage unknown)",
    "{0}% usado": "{0}% used",
    "amanh\xE3, {0}": "tomorrow, {0}",
    "{0}% usado \xB7 reinicia {1} ({2})": "{0}% used \xB7 resets {1} ({2})",
    "Padr\xE3o (pergunta)": "Default (asks)",
    "Aceita edi\xE7\xF5es": "Accepts edits",
    "Modo plano": "Plan mode",
    "Sem confirma\xE7\xF5es": "No confirmations",
    "N\xE3o pergunta": "Doesn't ask",
    "Autom\xE1tico": "Automatic",
    // client/src/ui/help.ts
    "Na mesa, digitando: est\xE1 processando um pedido.": "At the desk, typing: processing a request.",
    "M\xE3o levantada: espera uma resposta sua no terminal (permiss\xE3o, pergunta ou escolha).": "Hand raised: waiting for your answer in the terminal (permission, question or choice).",
    "Ampulheta sobre a cabe\xE7a: terminou o turno e fica na mesa esperando um shell terminar.": "Hourglass overhead: finished its turn and stays at the desk waiting for a shell to finish.",
    "Terminou o turno e circula pelo escrit\xF3rio at\xE9 a pr\xF3xima instru\xE7\xE3o.": "Finished its turn and wanders around the office until the next instruction.",
    "Subagente que concluiu: entrega o resultado e vai embora.": "Subagent that finished: hands over the result and leaves.",
    "A sess\xE3o foi fechada: o personagem vai at\xE9 o elevador e sai.": "The session was closed: the character walks to the elevator and leaves.",
    "Recebeu um pedido": "Got a request",
    "Pensando": "Thinking",
    "Lendo arquivo": "Reading a file",
    "Buscando no c\xF3digo": "Searching the code",
    "Editando": "Editing",
    "Escrevendo arquivo": "Writing a file",
    "Comando no terminal": "Terminal command",
    "Esperando um shell": "Waiting on a shell",
    "Rodando testes": "Running tests",
    "Pesquisando na web": "Searching the web",
    "Organizando tarefas": "Organizing tasks",
    "Chamando subagentes": "Calling subagents",
    "Concluiu": "Done",
    "Shell falhou": "Shell failed",
    "Shell interrompido": "Shell interrupted",
    "Algo deu errado": "Something went wrong",
    "TV no lounge: futebol (comemoram o gol junto com a tela), novela ou desenho, com pipoca.": "TV in the lounge: soccer (they cheer the goal along with the screen), soap opera or cartoons, with popcorn.",
    "Videogame no sof\xE1 (melhor de 3) ou duelo nos fliperamas, com torcida.": "Video games on the couch (best of 3) or a duel at the arcade machines, with a cheering crowd.",
    "Pingue-pongue at\xE9 5 pontos, com placar e torcida atr\xE1s da mesa.": "Ping-pong to 5 points, with a scoreboard and fans behind the table.",
    "Papo na copa: pegam caf\xE9 e sentam para fofocar, contar piada e falar de trabalho.": "Chat in the kitchen: they grab coffee and sit down to gossip, tell jokes and talk shop.",
    "Jokenp\xF4 valendo moedinhas: jo-ken-p\xF4, revela\xE7\xE3o, quem ganha leva o \u{1FA99} (e quem perde pede revanche).": "Rock-paper-scissors for coins: rock, paper, scissors, reveal, the winner takes the \u{1FA99} (and the loser asks for a rematch).",
    "Espelho do banheiro: se arrumam (batom, pente) e aparecem refletidos no vidro.": "Bathroom mirror: they freshen up (lipstick, comb) and show up reflected in the glass.",
    "Carteira: entram com \u{1FA99}100 (subagentes \u{1FA99}30), ganham \u{1FA99}10 por tarefa conclu\xEDda, \u{1FA99}5 por pedido atendido e \u{1FA99}15 por entrega de subagente.": "Wallet: they arrive with \u{1FA99}100 (subagents \u{1FA99}30), earn \u{1FA99}10 per completed task, \u{1FA99}5 per handled request and \u{1FA99}15 per subagent delivery.",
    "Festa: PR aberto ou mergeado, release publicada (ou CI verde depois de um alarme). Confete cai na sala, todos comemoram e uma faixa diz o motivo (~12 s).": "Party: PR opened or merged, release published (or CI green after an alarm). Confetti falls in the room, everyone celebrates and a banner says why (~12 s).",
    "Alarme: o CI ficou vermelho. Giroflex nos cantos da sala, ch\xE3o avermelhado e um bal\xE3o \u201C!\u201D sobre quem viu a falha, at\xE9 um CI verde na sala (ou 10 min).": "Alarm: CI went red. Flashing beacons in the room's corners, a reddish floor and a \u201C!\u201D bubble over whoever saw the failure, until a green CI in the room (or 10 min).",
    "Push: s\xF3 o aviso e o feed, sem mexer na sala.": "Push: just the notice and the feed, nothing changes in the room.",
    "Cada projeto aberto no Codex (no terminal ou no app) vira uma sala: a mesma do Claude Code naquela pasta, e os dois dividem a sala.": "Each project open in Codex (in the terminal or the app) becomes a room: the same one as Claude Code for that folder, and the two share the room.",
    "Os agentes do Codex t\xEAm o chip da conta vazado (s\xF3 a borda na cor da conta) e o selo CODEX na etiqueta e nos detalhes.": "Codex agents have a hollow account chip (only the border in the account color) and the CODEX badge on the label and in the details.",
    "{0} Sem os hooks, o escrit\xF3rio l\xEA os arquivos de sess\xE3o do Codex: cada passo aparece quando termina.": "{0} Without the hooks, the office reads Codex's session files: each step shows up when it finishes.",
    "Aprovar pelo escrit\xF3rio: no Codex, a aprova\xE7\xE3o s\xF3 aparece no terminal depois que voc\xEA responder aqui ou o prazo acabar (alguns segundos). N\xE3o h\xE1 \u201Cn\xE3o perguntar de novo\u201D nem \u201Cinterromper\u201D, e recusar pede um motivo.": "Approving from the office: in Codex, the approval only shows up in the terminal after you answer here or the time runs out (a few seconds). There's no \u201Cdon't ask again\u201D or \u201Cinterrupt\u201D, and denying asks for a reason.",
    "Mensagens: entram na fila da sess\xE3o e viram o pr\xF3ximo prompt quando o Codex terminar o que est\xE1 fazendo (at\xE9 ~10\xA0s). Com o Habblaud no Docker, deixe `npm run codex:bridge` rodando; no modo Node funciona sozinho.": "Messages: they join the session queue and become the next prompt when Codex finishes what it's doing (up to ~10\xA0s). With Habblaud in Docker, keep `npm run codex:bridge` running; in Node mode it works on its own.",
    "Perguntas do Codex s\xE3o respondidas no pr\xF3prio Codex.": "Codex questions are answered in Codex itself.",
    "Uso: vem dos arquivos de sess\xE3o do Codex, sem instalar nada, e s\xF3 se renova enquanto alguma sess\xE3o roda (por isso o cart\xE3o mostra a idade, ex.: \u201Ch\xE1 12 min\u201D). \u201Csem cota\u201D quer dizer sem cota nem cr\xE9ditos para usar agora.": "Usage: comes from Codex's session files, with nothing to install, and only refreshes while a session is running (that's why the card shows its age, e.g. \u201C12 min ago\u201D). \u201Cno quota\u201D means no quota or credits to use right now.",
    "Meu dia: o Codex conta tokens, mas n\xE3o grava custo.": "My day: Codex counts tokens but doesn't record cost.",
    "Terminou bem: levanta, comemora com confete e uma estrela.": "Finished well: stands up, celebrates with confetti and a star.",
    "Falhou ou foi interrompido: nuvenzinha de chuva sobre a cabe\xE7a e ombros ca\xEDdos.": "Failed or was interrupted: a little rain cloud overhead and slumped shoulders.",
    "Cada projeto aberto no Claude Code ou no Codex vira uma sala (os dois no mesmo projeto dividem a sala), e cada sess\xE3o aberta \xE9 um personagem com nome pr\xF3prio. ": "Each project open in Claude Code or Codex becomes a room (both on the same project share the room), and each open session is a character with its own name. ",
    "Subagentes chegam como colegas novos, trabalham na mesma sala e v\xE3o embora quando terminam. ": "Subagents arrive as new coworkers, work in the same room and leave when they're done. ",
    "Quando a \xFAltima sess\xE3o de uma sala \xE9 fechada, quem sai apaga a luz e a sala \xE9 desmontada.": "When a room's last session closes, whoever leaves turns off the light and the room is taken down.",
    "Buscar agente, projeto ou conta": "Search for an agent, project or account",
    "Seguir o agente selecionado": "Follow the selected agent",
    "Abrir ou fechar o terminal do agente selecionado": "Open or close the selected agent's terminal",
    "Com o terminal em foco: buscar na conversa (\u2318F no Mac); Enter e Shift+Enter navegam": "With the terminal focused: search the conversation (\u2318F on Mac); Enter and Shift+Enter navigate",
    "Abrir ou fechar o timelapse do dia": "Open or close the day's timelapse",
    "Ir at\xE9 o pr\xF3ximo pedido de permiss\xE3o ou pergunta para responder pelo escrit\xF3rio": "Go to the next permission request or question to answer from the office",
    "Meu dia: para onde foi o tempo (trabalhando, esperando voc\xEA...)": "My day: where the time went (working, waiting on you...)",
    "Vis\xE3o geral do pr\xE9dio": "Building overview",
    "Fechar a busca do terminal, depois o terminal; depois, a gaveta e a sele\xE7\xE3o": "Close the terminal search, then the terminal; then the details panel and the selection",
    "Mostrar ou ocultar o painel lateral": "Show or hide the sidebar",
    "Mostrar ou ocultar o feed de atividade": "Show or hide the activity feed",
    "Abrir esta ajuda": "Open this help",
    "Mover a c\xE2mera (tamb\xE9m W A S D)": "Move the camera (also W A S D)",
    "Aproximar e afastar": "Zoom in and out",
    "Fechar ajuda": "Close help",
    "Como ler o escrit\xF3rio": "How to read the office",
    "Atividades": "Activities",
    "Controles": "Controls",
    "Arraste o escrit\xF3rio para mover a c\xE2mera e use a rolagem do mouse (ou pin\xE7a) para dar zoom.": "Drag the office to move the camera and use the mouse wheel (or pinch) to zoom.",
    "Clique em um personagem ou sala para ver os detalhes; duplo clique aproxima a c\xE2mera.": "Click a character or room to see its details; double-click zooms the camera in.",
    "Passe o mouse sobre um personagem para ver o que ele est\xE1 fazendo.": "Hover over a character to see what they're doing.",
    "Nos detalhes de um agente, \u201CAbrir terminal\u201D mostra a conversa da sess\xE3o como no Claude Code (ou no Codex), ao vivo (precisa do acesso local, bind 127.0.0.1).": "In an agent's details, \u201COpen terminal\u201D shows the session's conversation as in Claude Code (or Codex), live (requires local access, bind 127.0.0.1).",
    "Com o plugin habblaud-mensagens (npm run mod:install), d\xE1 para mandar mensagens ao agente principal pelos detalhes dele ou pela caixa no rodap\xE9 do terminal: o texto entra na sess\xE3o como se voc\xEA o tivesse digitado. Enter manda, Shift+Enter quebra a linha.": "With the habblaud-mensagens plugin (npm run mod:install), you can send messages to the main agent from its details or from the box at the bottom of the terminal: the text enters the session as if you had typed it. Enter sends, Shift+Enter adds a line break.",
    "No terminal: busca (lupa ou Ctrl/\u2318+F), filtro \u201CTudo / S\xF3 prompts / Sem ferramentas\u201D e um bot\xE3o de copiar em cada entrada. O rel\xF3gio da barra superior abre o hist\xF3rico das sess\xF5es dos \xFAltimos 7 dias, inclusive as j\xE1 encerradas.": "In the terminal: search (magnifier or Ctrl/\u2318+F), the \u201CAll / Prompts only / No tools\u201D filter and a copy button on each entry. The clock in the top bar opens the history of sessions from the last 7 days, including ended ones.",
    "Com o mod do Habblaud instalado (npm run mod:install, que inclui o plugin de permiss\xF5es), quem \u201Cpede permiss\xE3o\u201D mostra nos detalhes o comando ou a edi\xE7\xE3o e os bot\xF5es Aprovar, Recusar e Responder no terminal; quem faz uma pergunta mostra as op\xE7\xF5es (e um \u201COutro\u201D para escrever) para responder por aqui. O di\xE1logo continua no terminal: vale o que voc\xEA responder primeiro.": "With the Habblaud mod installed (npm run mod:install, which includes the permissions plugin), an agent that \u201Casks for permission\u201D shows the command or edit in its details, along with the Approve, Deny and Answer in terminal buttons; an agent that asks a question shows the options (and an \u201COther\u201D to write your own) so you can answer from here. The dialog stays open in the terminal: whichever answer comes first wins.",
    "Quando o agente termina o turno com um comando rodando em segundo plano (ou fica mais de 10 s parado num comando), ele n\xE3o sai para passear: ": "When the agent ends its turn with a command running in the background (or sits on a command for more than 10 s), it doesn't wander off: ",
    "fica na mesa com a ampulheta virando, o monitor mostra o progresso e um bal\xE3o diz qual shell ele espera e h\xE1 quanto tempo. Quanto mais demora\u2026": "it stays at its desk with the hourglass turning, the monitor shows the progress and a bubble says which shell it's waiting on and for how long. The longer it takes\u2026",
    "Vida social": "Social life",
    "Quando dois ou mais agentes est\xE3o \xE0 toa (ociosos, ou esperando um shell h\xE1 mais de 40 s), eles se juntam. Cada um tem 2 ou 3 tra\xE7os de personalidade ": "When two or more agents have nothing to do (idle, or waiting on a shell for more than 40 s), they get together. Each one has 2 or 3 personality traits ",
    "(competi\xE7\xE3o, fofoca, vaidade, sonecas\u2026), amizades e rivalidades, e isso decide o que preferem fazer, com quem e o que falam. ": "(competition, gossip, vanity, naps\u2026), friendships and rivalries, and that decides what they'd rather do, with whom and what they talk about. ",
    "Os detalhes do agente mostram a personalidade, a carteira e o extrato; as partidas e apostas aparecem no feed.": "The agent's details show its personality, wallet and statement; matches and bets show up in the feed.",
    "GitHub no escrit\xF3rio": "GitHub in the office",
    "O que os agentes fazem no GitHub (gh pr create/merge, git push, gh run watch, gh pr checks, gh release create e o MCP do GitHub) vira aviso, ": "What agents do on GitHub (gh pr create/merge, git push, gh run watch, gh pr checks, gh release create and the GitHub MCP) becomes a notice, ",
    "entra no feed e anima a sala do projeto. S\xF3 o que acontece ao vivo: o que j\xE1 estava nos transcripts quando o Habblaud abriu fica s\xF3 no hist\xF3rico.": "goes into the feed and livens up the project's room. Only what happens live: anything already in the transcripts when Habblaud opened stays in the history only.",
    "Contas e uso": "Accounts and usage",
    "O chip colorido com a letra (C, D\u2026) mostra de qual conta do Claude Code \xE9 cada agente: cada atalho de terminal usa uma pasta de configura\xE7\xE3o diferente.": "The colored chip with the letter (C, D\u2026) shows which Claude Code account each agent belongs to: each terminal shortcut uses a different config folder.",
    " Conta do Claude Code \xB7 ": " Claude Code account \xB7 ",
    " Conta do Codex (chip vazado, com o selo CODEX onde h\xE1 espa\xE7o).": " Codex account (outlined chip, with the CODEX badge where there's room).",
    "No topo, cada conta mostra o uso da sess\xE3o de 5 horas e da semana. O \u21BB indica quando cada limite reinicia (contagem regressiva se faltar menos de um dia). Verde abaixo de 50%, \xE2mbar at\xE9 80% e vermelho a partir da\xED.": "At the top, each account shows its 5-hour session and weekly usage. The \u21BB shows when each limit resets (a countdown if it's less than a day away). Green below 50%, amber up to 80% and red beyond that.",
    "N\xFAmeros antigos ficam acinzentados com a idade ao lado (ex.: \u201Ch\xE1 3 h\u201D); uma janela que j\xE1 reiniciou desde a leitura mostra \u201C\u2014\u201D e \u201Crenovada\u201D.": "Old numbers are grayed out with their age next to them (e.g. \u201C3 h ago\u201D); a window that has reset since the reading shows \u201C\u2014\u201D and \u201Crenewed\u201D.",
    "Para ver o uso de uma conta (\u201Csem dados de uso\u201D), em ordem de prefer\xEAncia:": "To see an account's usage (\u201Cno usage data\u201D), in order of preference:",
    "Conta {0}": "Account {0}",
    // client/src/ui/history.ts
    "Hist\xF3rico de sess\xF5es": "Session history",
    "Buscar por t\xEDtulo, projeto ou conta": "Search by title, project or account",
    "Buscar sess\xF5es por t\xEDtulo, projeto ou conta": "Search sessions by title, project or account",
    "Sess\xF5es recentes": "Recent sessions",
    "Fechar hist\xF3rico": "Close history",
    "\xDAltimos 7 dias, de todas as contas. Clique para ler a conversa no terminal.": "Last 7 days, all accounts. Click to read the conversation in the terminal.",
    "Hist\xF3rico de sess\xF5es (\xFAltimos 7 dias)": "Session history (last 7 days)",
    "Hist\xF3rico de sess\xF5es: {0}": "Session history: {0}",
    "N\xE3o foi poss\xEDvel carregar o hist\xF3rico.": "Couldn't load the history.",
    "N\xE3o foi poss\xEDvel falar com o servidor.": "Couldn't reach the server.",
    "Carregando as sess\xF5es\u2026": "Loading sessions\u2026",
    "Nenhuma sess\xE3o nos \xFAltimos 7 dias.": "No sessions in the last 7 days.",
    "Nenhuma sess\xE3o encontrada para \u201C{0}\u201D.": "No sessions found for \u201C{0}\u201D.",
    "Sess\xE3o sem t\xEDtulo": "Untitled session",
    "aberta": "open",
    "Ainda aberta: abre o terminal ao vivo do agente": "Still open: opens the agent's live terminal",
    "Encerrada: abre a conversa no terminal": "Ended: opens the conversation in the terminal",
    "\xFAltima atividade {0} \xE0s {1}": "last activity {0} at {1}",
    // client/src/ui/hovertip.ts
    "h\xE1 {0}": "{0} ago",
    // client/src/ui/index.ts
    "Selecione um agente para seguir.": "Select an agent to follow.",
    "Nenhum pedido de permiss\xE3o ou pergunta para responder agora.": "No permission requests or questions to answer right now.",
    "Selecione um agente para abrir o terminal.": "Select an agent to open the terminal.",
    // client/src/ui/model.ts
    "Conclu\xEDdo": "Done",
    "Saindo": "Leaving",
    "Trabalhando\u2026": "Working\u2026",
    "Precisa de voc\xEA: {0}": "Needs you: {0}",
    "Esperando o shell terminar": "Waiting for the shell to finish",
    "Concluiu a tarefa": "Finished the task",
    "Saindo do escrit\xF3rio": "Leaving the office",
    "Aguardando instru\xE7\xF5es": "Waiting for instructions",
    "Agente principal": "Main agent",
    "segundo plano": "background",
    "primeiro plano": "foreground",
    "Esperando o comando terminar": "Waiting for the command to finish",
    "Est\xE1 parado num comando no terminal, esperando ele terminar para continuar o turno.": "Stuck on a terminal command, waiting for it to finish to continue the turn.",
    "Terminou o turno e est\xE1 esperando {0} shells terminarem. A cada um que termina, o agente recebe o resultado.": "Finished the turn and is waiting for {0} shells to finish. As each one finishes, the agent gets its result.",
    "Terminou o turno e est\xE1 esperando o shell terminar. Quando ele terminar, o agente recebe o resultado.": "Finished the turn and is waiting for the shell to finish. When it does, the agent gets the result.",
    "Comendo pipoca e assistindo ao terminal": "Eating popcorn and watching the terminal",
    "At\xE9 3 min: recosta na cadeira com um balde de pipoca e assiste ao terminal como se fosse um filme.": "Up to 3 min: leans back in the chair with a bucket of popcorn and watches the terminal like a movie.",
    "A pipoca acabou: girando na cadeira": "Out of popcorn: spinning in the chair",
    "De 3 a 10 min: a pipoca acaba; bra\xE7os cruzados, dedos batendo e, de vez em quando, um giro completo na cadeira.": "From 3 to 10 min: the popcorn runs out; arms crossed, fingers tapping and, now and then, a full spin in the chair.",
    "J\xE1 tem teia de aranha na cadeira": "There's a cobweb on the chair already",
    "Depois de 10 min: aparece uma teia de aranha na cadeira (ela cresce depois de 20 min) e escapa um bocejo.": "After 10 min: a cobweb appears on the chair (it grows after 20 min) and a yawn slips out.",
    "Cochilou esperando o shell": "Dozed off waiting on the shell",
    "Depois de 25 min: cochila na mesa, coberto de teia.": "After 25 min: naps at the desk, covered in cobwebs.",
    "atalho {0}": "shortcut {0}",
    "atalhos {0} ou {1}": "shortcuts {0} or {1}",
    // client/src/ui/movable.ts
    "Restaurar o tamanho": "Restore size",
    "Expandir na tela toda": "Expand to full screen",
    // client/src/ui/notify.ts
    "Habblaud \u2014 precisa de voc\xEA": "Habblaud \u2014 needs you",
    // client/src/ui/overlays.ts
    "Conectando ao escrit\xF3rio\u2026": "Connecting to the office\u2026",
    "O servidor do Habblaud n\xE3o responde. Confira se ele est\xE1 rodando (npm run dev ou npm start); seguimos tentando.": "The Habblaud server isn't responding. Check that it's running (npm run dev or npm start); we'll keep trying.",
    "N\xE3o foi poss\xEDvel conectar ao servidor do Habblaud. Tentando de novo\u2026": "Couldn't connect to the Habblaud server. Retrying\u2026",
    "Ver demonstra\xE7\xE3o": "View demo",
    "O escrit\xF3rio est\xE1 vazio": "The office is empty",
    "N\xE3o foi poss\xEDvel ligar a demonstra\xE7\xE3o.": "Couldn't start the demo.",
    "Tentar agora": "Try now",
    "Sem conex\xE3o com o servidor do Habblaud h\xE1 algum tempo. O escrit\xF3rio mostra o \xFAltimo estado conhecido.": "No connection to the Habblaud server for a while. The office shows the last known state.",
    "O servidor do Habblaud n\xE3o responde. Confira se ele est\xE1 rodando (npm run dev ou npm start).": "The Habblaud server isn't responding. Check that it's running (npm run dev or npm start).",
    " Tentando reconectar\u2026": " Trying to reconnect\u2026",
    " Nova tentativa em {0} s.": " Retrying in {0} s.",
    // client/src/ui/permission.ts
    "s\xF3 nesta sess\xE3o": "this session only",
    "neste projeto, s\xF3 para voc\xEA": "in this project, just for you",
    "neste projeto, para todos (versionado)": "in this project, for everyone (versioned)",
    "em todos os projetos": "in all projects",
    "voltando ao terminal\u2026": "returning to the terminal\u2026",
    "volta ao terminal em {0} s": "returns to the terminal in {0} s",
    "volta ao terminal em menos de 1 min": "returns to the terminal in under 1 min",
    "volta ao terminal em {0}": "returns to the terminal in {0}",
    "No Codex, a aprova\xE7\xE3o s\xF3 aparece no terminal depois que voc\xEA responder aqui ou o prazo acabar.": "In Codex, the approval only shows up in the terminal after you answer here or the time runs out.",
    "Este subagente roda em segundo plano: o terminal s\xF3 mostra o pedido depois que voc\xEA responder aqui ou escolher \u201CResponder no terminal\u201D.": "This subagent runs in the background: the terminal only shows the request after you answer here or choose \u201CAnswer in terminal\u201D.",
    "recolher": "collapse",
    "Aprovado": "Approved",
    "Recusado": "Denied",
    "Respondido": "Answered",
    "Devolvido ao terminal": "Sent back to the terminal",
    "Para responder por aqui, abra o Habblaud por http://localhost (ou 127.0.0.1). Por enquanto, responda no terminal.": "To answer from here, open Habblaud at http://localhost (or 127.0.0.1). For now, answer in the terminal.",
    "\u2713 Aprovar": "\u2713 Approve",
    "\u2713 Responder": "\u2713 Answer",
    "Perguntas do agente": "Agent's questions",
    "\u2715 Recusar\u2026": "\u2715 Deny\u2026",
    "O Habblaud deixa este pedido de lado: vale o que voc\xEA responder no terminal": "Habblaud sets this request aside: your answer in the terminal is what counts",
    "Responder no terminal": "Answer in terminal",
    "Aprovar agora e n\xE3o perguntar de novo: {0} ({1})": "Approve now and don't ask again: {0} ({1})",
    "Aprovar e n\xE3o perguntar de novo:": "Approve and don't ask again:",
    "Motivo (opcional, vai para o agente). Ex.: use pnpm em vez de npm": "Reason (optional, goes to the agent). E.g.: use pnpm instead of npm",
    "Motivo da recusa (opcional)": "Reason for denying (optional)",
    "Interromper o agente (ele para e espera voc\xEA)": "Interrupt the agent (it stops and waits for you)",
    "Recusar": "Deny",
    "Pergunta do agente": "Agent's question",
    "Pedido de permiss\xE3o": "Permission request",
    "Perguntas para voc\xEA": "Questions for you",
    "Pergunta para voc\xEA": "Question for you",
    "Pede permiss\xE3o": "Asks for permission",
    " \xB7 subagente {0}": " \xB7 subagent {0}",
    "Aqui ou no terminal: vale a primeira resposta{0}": "Here or in the terminal: the first answer wins{0}",
    "Pedido feito \xE0s {0}. Sem resposta aqui at\xE9 {1}, o Codex segue sem a decis\xE3o do escrit\xF3rio e pede a aprova\xE7\xE3o no terminal.": "Requested at {0}. With no answer here by {1}, Codex moves on without the office's decision and asks for approval in the terminal.",
    "Pedido feito \xE0s {0}. Sem resposta aqui at\xE9 {1}, o Habblaud devolve o pedido ao terminal.": "Requested at {0}. With no answer here by {1}, Habblaud hands the request back to the terminal.",
    "Carregando os detalhes\u2026": "Loading details\u2026",
    "+{0} {1} deste agente na fila": "+{0} {1} from this agent in the queue",
    "pedido": "request",
    "pedidos": "requests",
    "N\xE3o responder: o agente segue sem a resposta (com o motivo, se voc\xEA escrever um)": "Don't answer: the agent continues without the answer (with the reason, if you write one)",
    "Recusar com um motivo (o Codex pede um)": "Deny with a reason (Codex requires one)",
    "O Habblaud solta o pedido agora: o Codex mostra a aprova\xE7\xE3o no terminal": "Habblaud releases the request now: Codex shows the approval in the terminal",
    "Motivo (obrigat\xF3rio no Codex, vai para o agente). Ex.: use pnpm em vez de npm": "Reason (required in Codex, goes to the agent). E.g.: use pnpm instead of npm",
    "Motivo (opcional, vai para o agente). Ex.: {0}": "Reason (optional, goes to the agent). E.g.: {0}",
    "decida voc\xEA, com o que for mais seguro": "you decide, going with the safest option",
    "use pnpm em vez de npm": "use pnpm instead of npm",
    "Motivo da recusa (obrigat\xF3rio)": "Reason for denying (required)",
    "Escreva o motivo: o Codex recusa s\xF3 com um motivo": "Write the reason: Codex only denies with a reason",
    "Enviando a resposta\u2026": "Sending the answer\u2026",
    "N\xE3o foi poss\xEDvel falar com o Habblaud. Responda no terminal.": "Couldn't reach Habblaud. Answer in the terminal.",
    "agente": "agent",
    "Escreva a sua resposta": "Write your answer",
    "Outra resposta para: {0}": "Other answer for: {0}",
    "Escolha uma": "Pick one",
    "Outro": "Other",
    "Mandar as respostas ao agente": "Send the answers to the agent",
    "Responda todas as perguntas (no \u201COutro\u201D, escreva a resposta)": "Answer all the questions (for \u201COther\u201D, write the answer)",
    // client/src/ui/provider.ts
    "Conta desconhecida": "Unknown account",
    " \xB7 plano {0}": " \xB7 {0} plan",
    "Abra o Claude Code em qualquer projeto{0} e veja seu agente chegar.": "Open Claude Code in any project{0} and watch your agent arrive.",
    "Abra o Claude Code{0} ou o Codex em qualquer projeto e veja seu agente chegar.": "Open Claude Code{0} or Codex in any project and watch your agent arrive.",
    "Para ver o Codex ao vivo e aprovar pelo escrit\xF3rio: `npm run codex:install` e aprove os hooks em `/hooks` no Codex.": "To see Codex live and approve from the office: `npm run codex:install`, then approve the hooks in `/hooks` in Codex.",
    "Pergunta antes de quase tudo": "Asks before almost everything",
    "Pergunta quando precisa": "Asks when needed",
    "Pergunta quando um comando falha": "Asks when a command fails",
    "Nunca pergunta": "Never asks",
    // client/src/ui/pty.ts
    "Fechar a janela (a sess\xE3o continua rodando)": "Close the window (the session keeps running)",
    "terminal": "terminal",
    "Esta sess\xE3o est\xE1 aberta em outro terminal": "This session is open in another terminal",
    'Use "Assumir daqui" (no topo) para encerrar l\xE1 e continuar a mesma conversa nesta janela, podendo digitar.': 'Use "Take over here" (at the top) to end it there and continue the same conversation in this window, with typing enabled.',
    "Terminal": "Terminal",
    "Sem terminal no timelapse": "No terminal in the timelapse",
    "Terminal interativo desligado": "Interactive terminal off",
    "Sess\xE3o encerrada.": "Session ended.",
    "encerrado": "ended",
    "retomando\u2026": "resuming\u2026",
    "iniciando\u2026": "starting\u2026",
    "saiu do escrit\xF3rio": "left the office",
    // client/src/ui/ptyapi.ts
    "o Habblaud n\xE3o respondeu": "Habblaud didn't respond",
    // client/src/ui/ptypane.ts
    "Claude Code encerrado (c\xF3digo {0})": "Claude Code exited (code {0})",
    "Claude Code encerrado": "Claude Code exited",
    // client/src/ui/roomrename.ts
    "Nome da sala": "Room name",
    "Enter salva \xB7 Esc cancela \xB7 vazio volta a \u201C{0}\u201D": "Enter saves \xB7 Esc cancels \xB7 empty resets to \u201C{0}\u201D",
    "Sala renomeada para {0}.": "Room renamed to {0}.",
    "A sala voltou ao nome da pasta.": "The room is back to the folder name.",
    "N\xE3o deu: {0}": "Didn't work: {0}",
    // client/src/ui/rows.ts
    "ocioso {0}": "idle {0}",
    "Ocioso h\xE1 {0}": "Idle for {0}",
    "{0}, h\xE1 {1}": "{0}, for {1}",
    "agente principal": "main agent",
    "subagente {0}": "subagent {0}",
    // client/src/ui/settings-sound.ts
    "Avisos": "Alerts",
    "Sino quando algu\xE9m precisa de voc\xEA; estalo quando uma tarefa termina.": "A bell when someone needs you; a click when a task finishes.",
    "Teclado": "Keyboard",
    "Digita\xE7\xE3o baixinha de quem trabalha nas salas \xE0 vista.": "Soft typing from whoever is working in the rooms in view.",
    "Elevador": "Elevator",
    '"Ding" quando algu\xE9m chega ou vai embora.': '"Ding" when someone arrives or leaves.',
    "Rodas": "Hangouts",
    "Pingue-pongue e fliperama no lounge.": "Ping-pong and arcade games in the lounge.",
    "Volume dos sons": "Sound volume",
    "Categorias de som": "Sound categories",
    "Volume": "Volume",
    "Tocar": "Play",
    "Avisos: sino e estalo \xB7 Teclado: quem digita nas salas \xE0 vista \xB7 Elevador: chegadas e sa\xEDdas \xB7 Rodas: pingue-pongue e fliperama.": "Alerts: bell and click \xB7 Keyboard: typing in the rooms in view \xB7 Elevator: arrivals and departures \xB7 Groups: ping-pong and arcade.",
    "Sons": "Sounds",
    "Sons do escrit\xF3rio": "Office sounds",
    'Sintetizados no navegador e baixinhos. Com a aba oculta, s\xF3 o sino de "precisa de voc\xEA".': 'Synthesized in the browser, and quiet. With the tab hidden, only the "needs you" bell.',
    // client/src/ui/settings.ts
    "Bal\xF5es de atividade": "Activity bubbles",
    "Todos": "All",
    "Importantes": "Important",
    "Movimento pelo escrit\xF3rio": "Movement around the office",
    "Calmo": "Calm",
    "Normal": "Normal",
    "Agitado": "Lively",
    "Ciclo dia/noite": "Day/night cycle",
    "Sempre dia": "Always day",
    "Sempre noite": "Always night",
    "Autom\xE1tico: c\xE9u, luzes e sol nas janelas seguem a hora local.": "Automatic: the sky, lights and sun in the windows follow local time.",
    "Tema do escrit\xF3rio": "Office theme",
    "Natal": "Christmas",
    "Halloween": "Halloween",
    "Autom\xE1tico: Halloween em outubro e Natal de 1\xBA de novembro a 26 de dezembro; no resto do ano, o visual original. Nenhum: sempre o original.": "Automatic: Halloween in October and Christmas from November 1 to December 26; the rest of the year, the original look. None: always the original.",
    "Idioma da interface": "Interface language",
    "Os textos das atividades v\xEAm do servidor: seguem HABBLAUD_LANG ou o idioma do sistema onde o Habblaud roda (o ingl\xEAs, s\xF3 com HABBLAUD_LANG=en).": "Activity texts come from the server: they follow HABBLAUD_LANG or the language of the system Habblaud runs on (English only with HABBLAUD_LANG=en).",
    "Dados": "Data",
    "Modo demonstra\xE7\xE3o": "Demo mode",
    "Coloca agentes fict\xEDcios no escrit\xF3rio, junto com os reais.": "Adds fictional agents to the office, alongside the real ones.",
    "Fechar configura\xE7\xF5es": "Close settings",
    "Configura\xE7\xF5es": "Settings",
    "Apar\xEAncia": "Appearance",
    "Escrit\xF3rio": "Office",
    "Mostrar nomes": "Show names",
    "Etiqueta com o nome acima de cada personagem.": "A name tag above each character.",
    "Notifica\xE7\xF5es do navegador": "Browser notifications",
    "Avisa quando algu\xE9m precisa de voc\xEA e a aba est\xE1 em segundo plano.": "Alerts you when someone needs you and the tab is in the background.",
    "Idioma": "Language",
    "Este navegador n\xE3o oferece notifica\xE7\xF5es.": "This browser doesn't support notifications.",
    "Bloqueadas pelo navegador: libere nas permiss\xF5es do site.": "Blocked by the browser: allow them in the site permissions.",
    "Notifica\xE7\xF5es bloqueadas pelo navegador.": "Notifications blocked by the browser.",
    "Modo demonstra\xE7\xE3o ligado.": "Demo mode on.",
    "Modo demonstra\xE7\xE3o desligado.": "Demo mode off.",
    "N\xE3o foi poss\xEDvel mudar o modo demonstra\xE7\xE3o.": "Couldn't change demo mode.",
    // client/src/ui/sidebar.ts
    "Atalho: /": "Shortcut: /",
    "Filtrar por conta": "Filter by account",
    "Mostrar a {0} na lista, no feed e nos avisos": "Show {0} in the list, feed and alerts",
    "Ocultar a {0} na lista, no feed e nos avisos (o escrit\xF3rio continua mostrando todos)": "Hide {0} in the list, feed and alerts (the office still shows everyone)",
    "Salas": "Rooms",
    "Limpar filtros": "Clear filters",
    "Fechar painel lateral": "Close sidebar",
    "Salas e agentes": "Rooms and agents",
    "Nenhum agente encontrado para \u201C{0}\u201D.": "No agents found for \u201C{0}\u201D.",
    "Nenhum agente nas contas selecionadas.": "No agents in the selected accounts.",
    "Nenhuma sess\xE3o aberta no momento.": "No open sessions right now.",
    "agentes": "agents",
    "Sala {0}, {1}": "Room {0}, {1}",
    "{0}/{1} tarefas": "{0}/{1} tasks",
    "Fechar o terminal": "Close the terminal",
    "Abrir o terminal de {0} ({1})": "Open {0}'s terminal ({1})",
    "Fechar o terminal de {0}": "Close {0}'s terminal",
    "Abrir o terminal de {0}": "Open {0}'s terminal",
    // client/src/ui/social.ts
    "Sem partidas ainda": "No matches yet",
    "vit\xF3ria": "win",
    "vit\xF3rias": "wins",
    "derrota": "loss",
    "derrotas": "losses",
    "\u{1F49B} Amizades": "\u{1F49B} Friendships",
    "\u2694\uFE0F Rivalidades": "\u2694\uFE0F Rivalries",
    "Extrato": "Statement",
    "Moedinhas fict\xEDcias: entra no escrit\xF3rio com um saldo, ganha \u{1FA99}10 por tarefa conclu\xEDda e \u{1FA99}5 por pedido atendido, e aposta com os colegas. Ficam salvas neste navegador.": "Pretend coins: arrives at the office with a balance, earns \u{1FA99}10 per finished task and \u{1FA99}5 per handled request, and bets with coworkers. Saved in this browser.",
    "{0} moedinhas": "{0} coins",
    "{0} ganhos trabalhando": "{0} earned working",
    "Bord\xE3o: \u201C{0}\u201D": "Catchphrase: \u201C{0}\u201D",
    "Retrospecto contra {0}: {1}": "Record against {0}: {1}",
    "Ver {0}": "View {0}",
    // client/src/ui/termactions.ts
    "Encerra a sess\xE3o no terminal onde ela est\xE1 e continua a mesma conversa aqui, podendo digitar": "Ends the session in the terminal where it's running and continues the same conversation here, where you can type",
    "Encerra esta sess\xE3o do Claude Code (a conversa fica salva)": "Ends this Claude Code session (the conversation is saved)",
    "Confirmar?": "Confirm?",
    "Assumir daqui": "Take over here",
    "Encerrar": "End",
    "Encerrando\u2026": "Ending\u2026",
    "Assumindo\u2026": "Taking over\u2026",
    // client/src/ui/terminal.ts
    "O terminal s\xF3 fica dispon\xEDvel quando o Habblaud roda com acesso local (bind 127.0.0.1)": "The terminal is only available when Habblaud runs with local access (bind 127.0.0.1)",
    "N\xE3o foi poss\xEDvel abrir o terminal. O recurso s\xF3 funciona no acesso local, com o agente ainda aberto.": "Couldn't open the terminal. This only works with local access, while the agent is still open.",
    "N\xE3o foi poss\xEDvel abrir a sess\xE3o. O hist\xF3rico s\xF3 funciona no acesso local, com o transcript ainda no disco.": "Couldn't open the session. History only works with local access, while the transcript is still on disk.",
    "Sess\xE3o encerrada \xE0s {0}": "Session ended at {0}",
    "Sess\xE3o encerrada ontem \xE0s {0}": "Session ended yesterday at {0}",
    "Sess\xE3o encerrada em {0} \xE0s {1}": "Session ended on {0} at {1}",
    "\u2026 mostrar tudo": "\u2026 show all",
    "linha": "line",
    "linhas": "lines",
    "Subagente conclu\xEDdo \xB7 sess\xE3o encerrada": "Subagent done \xB7 session ended",
    "Esperando o shell: {0}{1}": "Waiting on shell: {0}{1}",
    "Esperando voc\xEA: {0}": "Waiting on you: {0}",
    "Aguardando o pr\xF3ximo prompt": "Waiting for the next prompt",
    "Recolher": "Collapse",
    "Mostrar tudo ({0} {1})": "Show all ({0} {1})",
    "(erro sem mensagem)": "(error with no message)",
    "(sem sa\xEDda)": "(no output)",
    "(resultado cortado)": "(result truncated)",
    "resultado": "result",
    "comando": "command",
    "entrada da ferramenta": "tool input",
    "resposta": "response",
    "Pensando\u2026": "Thinking\u2026",
    "detalhes": "details",
    "reconectando\u2026": "reconnecting\u2026",
    "Buscar na conversa ({0})": "Search the conversation ({0})",
    "Fechar terminal (Esc)": "Close terminal (Esc)",
    "Filtrar a conversa": "Filter the conversation",
    "Buscar na conversa": "Search the conversation",
    "Resultado anterior (Shift+Enter)": "Previous result (Shift+Enter)",
    "Pr\xF3ximo resultado (Enter)": "Next result (Enter)",
    "Fechar a busca (Esc)": "Close search (Esc)",
    "Conversa anterior n\xE3o carregada": "Earlier conversation not loaded",
    "Conversa da sess\xE3o": "Session conversation",
    "sala {0}": "room {0}",
    "Terminal de {0}": "{0}'s terminal",
    "hist\xF3rico": "history",
    "Terminal da sess\xE3o {0}": "Session {0} terminal",
    "Resultado de uma ferramenta anterior": "Result from an earlier tool",
    "Copiar {0}": "Copy {0}",
    "Copiado": "Copied",
    "Copiado.": "Copied.",
    "N\xE3o foi poss\xEDvel copiar.": "Couldn't copy.",
    "resultados": "results",
    "Nenhum resultado": "No results",
    "Nada para mostrar com este filtro.": "Nothing to show with this filter.",
    "Abrindo o terminal\u2026": "Opening the terminal\u2026",
    "Nenhuma mensagem nesta sess\xE3o.": "No messages in this session.",
    "Nenhuma mensagem nesta sess\xE3o ainda.": "No messages in this session yet.",
    "\u2193 Novas mensagens": "\u2193 New messages",
    "\u2193 Ir para o fim": "\u2193 Jump to the end",
    // client/src/ui/termtabs.ts
    "Agentes do projeto (arraste para reordenar)": "Project agents (drag to reorder)",
    "Encerrar esta sess\xE3o": "End this session",
    "encerrar?": "end?",
    "Clique de novo para encerrar a sess\xE3o (a conversa fica salva)": "Click again to end the session (the conversation is saved)",
    " (interativo)": " (interactive)",
    "{0}: sess\xE3o encerrada.": "{0}: session ended.",
    "N\xE3o deu para encerrar: {0}": "Couldn't end it: {0}",
    // client/src/ui/termtools.ts
    "Tudo": "All",
    "Toda a conversa": "The whole conversation",
    "S\xF3 prompts": "Prompts only",
    "S\xF3 os seus prompts e as respostas finais do agente": "Only your prompts and the agent's final replies",
    "Sem ferramentas": "No tools",
    "Esconde as ferramentas e os resultados": "Hides tools and their results",
    // client/src/ui/timelapse.ts
    "Reproduzir": "Play",
    "Dia gravado": "Recorded day",
    "Velocidade": "Speed",
    "Mostrar tamb\xE9m os agentes do modo demonstra\xE7\xE3o gravados neste dia": "Also show demo mode agents recorded on this day",
    "Sair do timelapse e voltar ao escrit\xF3rio ao vivo (L)": "Exit the timelapse and return to the live office (L)",
    "Voltar ao vivo": "Back to live",
    "Momento da reprodu\xE7\xE3o": "Playback position",
    "Timelapse do dia": "Day timelapse",
    "Carregando os dias gravados\u2026": "Loading recorded days\u2026",
    "Nada gravado ainda: o Habblaud grava o escrit\xF3rio enquanto est\xE1 ligado. Volte daqui a pouco.": "Nothing recorded yet: Habblaud records the office while it's running. Check back in a bit.",
    "A grava\xE7\xE3o est\xE1 desligada neste servidor (HABBLAUD_TIMELINE=0) e n\xE3o h\xE1 dias gravados.": "Recording is off on this server (HABBLAUD_TIMELINE=0) and there are no recorded days.",
    "N\xE3o foi poss\xEDvel buscar a linha do tempo no servidor.": "Couldn't fetch the timeline from the server.",
    "De volta ao escrit\xF3rio ao vivo.": "Back to the live office.",
    "Pausar": "Pause",
    "Reproduzir de novo": "Play again",
    "{0} (espa\xE7o na linha do tempo)": "{0} (Space on the timeline)",
    "Carregando o dia\u2026": "Loading the day\u2026",
    "N\xE3o foi poss\xEDvel carregar este dia.": "Couldn't load this day.",
    "Nada gravado neste dia.": "Nothing recorded on this day.",
    "Fim da grava\xE7\xE3o deste dia.": "End of this day's recording.",
    "grava\xE7\xE3o pausada (limite do dia)": "recording paused (daily limit)",
    "sem dados (servidor desligado)": "no data (server off)",
    "Pico \xE0s {0}: {1} {2}": "Peak at {0}: {1} {2}",
    "agente trabalhando": "agent working",
    "agentes trabalhando": "agents working",
    "{0}\xD7 \u2014 1 min de reprodu\xE7\xE3o = {1} h do dia": "{0}\xD7 \u2014 1 min of playback = {1} h of the day",
    // client/src/ui/toasts.ts
    "Mostrar no escrit\xF3rio": "Show in the office",
    "Responder": "Reply",
    "Responder pelo escrit\xF3rio (aprovar, recusar ou responder a pergunta)": "Respond from the office (approve, deny, or answer the question)",
    "Fechar aviso": "Dismiss notice",
    // client/src/ui/topbar.ts
    "sala": "room",
    "salas": "rooms",
    "Salas abertas (uma por projeto)": "Open rooms (one per project)",
    "Agentes no escrit\xF3rio (principais e subagentes)": "Agents in the office (main and subagents)",
    "trabalhando": "working",
    "Agentes processando um pedido agora": "Agents processing a request right now",
    "Subagentes em atividade": "Active subagents",
    "precisa de voc\xEA": "needs you",
    "precisam de voc\xEA": "need you",
    "Agentes esperando sua resposta no terminal": "Agents waiting for your reply in the terminal",
    "Agentes de demonstra\xE7\xE3o ligados (desligue em Configura\xE7\xF5es)": "Demo agents on (turn them off in Settings)",
    "Resumo do escrit\xF3rio": "Office summary",
    "{0}. Clique para ir at\xE9 o primeiro.": "{0}. Click to go to the first one.",
    "Painel lateral ( [ )": "Sidebar ( [ )",
    "Feed de atividade ( ] )": "Activity feed ( ] )",
    "Timelapse: reproduzir o dia (L)": "Timelapse: replay the day (L)",
    "C\xE2mera": "Camera",
    "Vis\xE3o geral (O)": "Overview (O)",
    "Afastar (\u2212)": "Zoom out (\u2212)",
    "Aproximar (+)": "Zoom in (+)",
    "Pain\xE9is": "Panels",
    "Ajuda (?)": "Help (?)",
    "Conectado": "Connected",
    "Simula\xE7\xE3o": "Simulation",
    "Desconectado": "Disconnected",
    "Reconectando\u2026": "Reconnecting\u2026",
    "Conectando\u2026": "Connecting\u2026",
    "Dados simulados no navegador (?mock=1)": "Simulated data in the browser (?mock=1)",
    "Recebendo eventos do servidor em tempo real": "Receiving server events in real time",
    "Sem conex\xE3o com o servidor do Habblaud": "No connection to the Habblaud server",
    "{0}. {1} para responder por aqui: clique para ir at\xE9 {2} (P).": "{0}. {1} answered here: click to go to {2} (P).",
    "1 pedido (permiss\xE3o ou pergunta) d\xE1": "1 request (permission or question) can be",
    "{0} pedidos (permiss\xF5es ou perguntas) d\xE3o": "{0} requests (permissions or questions) can be",
    "ele": "it",
    "cada um": "each one",
    "{0} agentes": "{0} agents",
    "{0} {1}; {2} esperando. Ir at\xE9 o pr\xF3ximo.": "{0} {1}; {2} waiting. Go to the next one.",
    "shell rodando": "shell running",
    "shells rodando": "shells running",
    "\u2026 e mais {0}": "\u2026 and {0} more",
    "Shells rodando: {0} terminar.\n{1}\nClique para ir at\xE9 {2}.": "Shells running: {0} for them to finish.\n{1}\nClick to go to {2}.",
    "o agente espera": "the agent is waiting",
    "os agentes esperam": "the agents are waiting",
    // client/src/ui/update.ts
    "Recarregar agora": "Reload now",
    "Depois": "Later",
    "O Habblaud foi atualizado. Recarregando em {0} s\u2026": "Habblaud has been updated. Reloading in {0} s\u2026",
    "O Habblaud foi atualizado. Recarregue a p\xE1gina quando quiser.": "Habblaud has been updated. Reload the page whenever you like.",
    // client/src/ui/usage.ts
    "cache do /usage do Claude Code": "Claude Code /usage cache",
    "ao vivo (statusline do Claude Code)": "live (Claude Code statusline)",
    "arquivos do Codex": "Codex files",
    "ao vivo (mod do Habblaud)": "live (Habblaud mod)",
    "Recomendado: instala o mod do Habblaud no Claude Code (2.1.287 ou mais novo), que passa o uso de 5 h e da semana ao vivo. Rode na pasta do Habblaud, no computador onde o Claude Code roda; nas sess\xF5es j\xE1 abertas, `/reload-plugins`.": "Recommended: installs the Habblaud mod in Claude Code (2.1.287 or newer), which streams 5 h and weekly usage live. Run it in the Habblaud folder, on the computer where Claude Code runs; in sessions already open, `/reload-plugins`.",
    "No Claude Code anterior ao 2.1.287: liga um tap na linha de status, que passa os mesmos n\xFAmeros ao vivo.": "On Claude Code older than 2.1.287: hooks a tap into the status line, which streams the same numbers live.",
    "Sem instalar nada: rode `/usage` no Claude Code desta conta para atualizar o cache (os n\xFAmeros envelhecem at\xE9 a pr\xF3xima vez).": "Without installing anything: run `/usage` in Claude Code on this account to refresh the cache (the numbers go stale until the next time).",
    "\u21BB renovada": "\u21BB reset",
    "{0}: sem dados": "{0}: no data",
    "{0}: a janela j\xE1 renovou depois da \xFAltima leitura; o uso atual \xE9 desconhecido.": "{0}: the window has reset since the last reading; current usage is unknown.",
    "sem cota": "no quota",
    "sem dados ainda": "no data yet",
    "sem dados": "no data",
    "sem dados de uso": "no usage data",
    "N\xE3o precisa instalar nada: os n\xFAmeros chegam com a pr\xF3xima sess\xE3o do Codex.": "Nothing to install: the numbers arrive with the next Codex session.",
    "Na \xFAltima leitura ({0}), a conta estava sem cota nem cr\xE9ditos para usar (ex.: os cr\xE9ditos do workspace acabaram). N\xE3o \xE9 0%: o Codex n\xE3o informou as janelas. Os n\xFAmeros voltam com a pr\xF3xima sess\xE3o.": "At the last reading ({0}), the account had no quota or credits left to use (e.g. the workspace credits ran out). It's not 0%: Codex didn't report the windows. The numbers come back with the next session.",
    "O Codex s\xF3 grava o uso enquanto alguma sess\xE3o roda: estes n\xFAmeros s\xE3o da \xFAltima leitura ({0}).": "Codex only records usage while a session is running: these numbers are from the last reading ({0}).",
    "Uso por conta": "Usage by account",
    "Sess\xE3o de 5 horas": "5-hour session",
    "Semana": "Week",
    "Sem.": "Wk.",
    "Limite semanal": "Weekly limit",
    "Como ativar": "How to enable",
    "Ativar": "Enable",
    "Como mostrar o uso desta conta (abre a ajuda em \u201CContas e uso\u201D)": "How to show this account's usage (opens help at \u201CAccounts and usage\u201D)",
    "Como ter o uso ao vivo": "How to get live usage",
    "{0}{1}: uso do plano": "{0}{1}: plan usage",
    "Atualizado {0}: o Codex s\xF3 grava o uso enquanto alguma sess\xE3o roda.": "Updated {0}: Codex only records usage while a session is running.",
    "N\xFAmeros de {0}: podem n\xE3o refletir o uso atual.": "Numbers from {0}: they may not reflect current usage.",
    "Como funciona": "How it works",
    "Saber": "Learn more",
    "Como o uso do Codex chega ao Habblaud (abre a ajuda em \u201CCodex\u201D)": "How Codex usage reaches Habblaud (opens help at \u201CCodex\u201D)",
    "Ferramenta": "Tool",
    "Organiza\xE7\xE3o": "Organization",
    "Plano": "Plan",
    "Pasta": "Folder",
    "Sess\xF5es abertas": "Open sessions",
    "Sess\xE3o de 5 h": "5 h session",
    "Opus (semana)": "Opus (week)",
    "Sonnet (semana)": "Sonnet (week)",
    "Cota": "Quota",
    "sem cota nem cr\xE9ditos agora": "no quota or credits right now",
    "Origem": "Source",
    "Atualizado": "Updated",
    "A \xFAltima leitura ({0}, {1}) n\xE3o trouxe n\xFAmeros de 5 h nem da semana.": "The last reading ({0}, {1}) had no 5 h or weekly numbers.",
    "Ainda n\xE3o h\xE1 n\xFAmeros de uso para esta conta.": "No usage numbers for this account yet.",
    "N\xFAmeros antigos: refletem a \xFAltima leitura, n\xE3o o uso de agora.": "Old numbers: they reflect the last reading, not current usage.",
    "Cache do /usage: atualiza quando algu\xE9m roda /usage nesta conta.": "/usage cache: updates when someone runs /usage on this account.",
    "Uma das janelas j\xE1 reiniciou depois da \xFAltima leitura.": "One of the windows has reset since the last reading.",
    // client/src/ui/version.ts
    "Este servidor n\xE3o verifica vers\xF5es novas.": "This server doesn't check for new versions.",
    "Verifica\xE7\xE3o de vers\xE3o nova desligada (HABBLAUD_UPDATE_CHECK=0).": "New version check is off (HABBLAUD_UPDATE_CHECK=0).",
    "Verifica\xE7\xE3o de vers\xE3o nova desligada: o package.json n\xE3o aponta um reposit\xF3rio no GitHub.": "New version check is off: package.json doesn't point to a GitHub repository.",
    "Verificando se h\xE1 vers\xE3o nova\u2026": "Checking for a new version\u2026",
    "Nova vers\xE3o dispon\xEDvel: v{0}. A \xFAltima verifica\xE7\xE3o falhou ({1}).": "New version available: v{0}. The last check failed ({1}).",
    "erro": "error",
    "N\xE3o deu para verificar agora: {0}{1}.": "Couldn't check right now: {0}{1}.",
    " \xB7 \xFAltima verifica\xE7\xE3o {0}": " \xB7 last checked {0}",
    "Nova vers\xE3o dispon\xEDvel: v{0}{1}.": "New version available: v{0}{1}.",
    ", publicada em {0}": ", released {0}",
    "Nenhuma vers\xE3o publicada no GitHub ainda{0}.": "No version published on GitHub yet{0}.",
    "Voc\xEA est\xE1 \xE0 frente da \xFAltima vers\xE3o publicada (v{0}){1}.": "You're ahead of the latest published version (v{0}){1}.",
    "Voc\xEA est\xE1 na vers\xE3o mais recente{0}.": "You're on the latest version{0}.",
    "Nova vers\xE3o do Habblaud: v{0} (voc\xEA usa a v{1}). Clique para ver as novidades e como atualizar.": "New Habblaud version: v{0} (you're on v{1}). Click to see what's new and how to update.",
    "Habblaud v{0}. {1} Clique para ver detalhes.": "Habblaud v{0}. {1} Click for details.",
    "Configura\xE7\xF5es (nova vers\xE3o dispon\xEDvel)": "Settings (new version available)",
    "Nova vers\xE3o": "New version",
    "Nova vers\xE3o do Habblaud: v{0}. Veja as novidades e como atualizar em Configura\xE7\xF5es \u203A Sobre.": "New Habblaud version: v{0}. See what's new and how to update in Settings \u203A About.",
    "Verificar agora": "Check now",
    "Para atualizar, na pasta do Habblaud: ": "To update, in the Habblaud folder: ",
    " e de novo ": " and then ",
    " (sem Docker: ": " (without Docker: ",
    "C\xF3digo no GitHub": "Code on GitHub",
    "Sobre": "About",
    "Consultando o GitHub\u2026": "Checking GitHub\u2026",
    "Ver o que mudou na v{0}": "See what changed in v{0}",
    "N\xE3o deu para falar com o servidor do Habblaud.": "Couldn't reach the Habblaud server.",
    // client/src/ui/widgets.ts
    "Agente do Codex (OpenAI)": "Codex agent (OpenAI)",
    "Principal": "Main",
    "Subagente: {0}{1}": "Subagent: {0}{1}",
    " (em segundo plano)": " (in the background)",
    "Sem atividade ainda": "No activity yet",
    // client/src/world/render/overlay.ts
    "Recep\xE7\xE3o": "Reception",
    "Banheiros": "Restrooms",
    "Copa": "Kitchen",
    "Lounge": "Lounge",
    // client/src/world/sim/shell.ts
    "Monitorando um processo": "Monitoring a process",
    "Comando em segundo plano": "Background command",
    // client/src/world/sim/sim.ts
    "Entregando: {0}": "Delivering: {0}",
    // client/src/world/social/gathering.ts
    "Vendo TV": "Watching TV",
    "Jogando videogame": "Playing video games",
    "Duelo no fliperama": "Arcade showdown",
    "Jogando pingue-pongue": "Playing ping-pong",
    "Papo na copa": "Kitchen chat",
    "Conversando": "Chatting",
    "Jokenp\xF4": "Rock-paper-scissors",
    "Se arrumando no espelho": "Primping at the mirror",
    // client/src/world/social/lines.ts
    "Bora ver TV? \u{1F4FA}": "Wanna watch TV? \u{1F4FA}",
    "Sess\xE3o pipoca? \u{1F37F}": "Popcorn break? \u{1F37F}",
    "Vai come\xE7ar o programa!": "The show's starting!",
    "Bora ver um pouco de TV?": "Wanna watch some TV?",
    "Vai come\xE7ar o jogo! \u26BD": "The game's about to start! \u26BD",
    "Bora ver o futebol?": "Wanna watch the soccer game?",
    "T\xE1 passando o cl\xE1ssico! \u26BD": "The big rivalry game is on! \u26BD",
    "T\xE1 passando a novela! \u{1F4FA}": "The soap opera is on! \u{1F4FA}",
    "Bora ver o cap\xEDtulo de hoje?": "Wanna watch today's episode?",
    "T\xE1 passando desenho! \u{1F604}": "Cartoons are on! \u{1F604}",
    "Bora ver desenho?": "Wanna watch cartoons?",
    "Bora uma partida no videogame? \u{1F3AE}": "Up for a video game match? \u{1F3AE}",
    "Duvido voc\xEA me ganhar \u{1F3AE}": "Bet you can't beat me \u{1F3AE}",
    "Videogame? Melhor de tr\xEAs!": "Video games? Best of three!",
    "Fliperama? \u{1F47E}": "Arcade? \u{1F47E}",
    "Aposto que bato teu recorde \u{1F47E}": "Bet I'll beat your high score \u{1F47E}",
    "Bora no fliperama?": "Hit the arcade?",
    "Pingue-pongue? \u{1F3D3}": "Ping-pong? \u{1F3D3}",
    "Bora uma partidinha? \u{1F3D3}": "Quick game? \u{1F3D3}",
    "Vem jogar ping-pong!": "Come play ping-pong!",
    "Vem tomar uma surra no ping-pong \u{1F60F}": "Come get crushed at ping-pong \u{1F60F}",
    "Revanche no ping-pong? \u{1F3D3}": "Ping-pong rematch? \u{1F3D3}",
    "Bora tomar um caf\xE9? \u2615": "Grab a coffee? \u2615",
    "Pausa pro caf\xE9? \u2615": "Coffee break? \u2615",
    "Bora dar uma pausa na copa?": "Break in the kitchen?",
    "Tenho uma fofoca\u2026 \u{1F440}": "I've got some gossip\u2026 \u{1F440}",
    "Copa. Agora. Tenho novidade \u{1F440}": "Kitchen. Now. I've got news \u{1F440}",
    "E a\xED, tudo certo?": "Hey, all good?",
    "Ei, {nome}!": "Hey, {nome}!",
    "Bora trocar uma ideia?": "Wanna chat?",
    "Opa, {nome}! Beleza?": "Hey, {nome}! What's up?",
    "Jokenp\xF4 valendo \u{1FA99}{v}?": "Rock-paper-scissors for \u{1FA99}{v}?",
    "Aposto \u{1FA99}{v} no jokenp\xF4!": "I bet \u{1FA99}{v} on rock-paper-scissors!",
    "Pedra, papel e tesoura? \u{1FA99}{v}!": "Rock, paper, scissors? \u{1FA99}{v}!",
    "Jokenp\xF4? S\xF3 pela honra \u{1F605}": "Rock-paper-scissors? Just for glory \u{1F605}",
    "Jokenp\xF4 valendo nada?": "Rock-paper-scissors for nothing?",
    "Bora dar um tapa no visual? \u{1F484}": "Time for a touch-up? \u{1F484}",
    "Espelho? Preciso me arrumar \u2728": "Mirror? I need to freshen up \u2728",
    "Bora!": "Let's go!",
    "Partiu!": "Off we go!",
    "S\xF3 se for agora!": "Right now!",
    "Opa!": "Oh yeah!",
    "J\xE1 \xE9!": "You bet!",
    "Demorou!": "Sure thing!",
    "Prepara o bolso \u{1F4B0}": "Get your wallet ready \u{1F4B0}",
    "Vai perder!": "You're gonna lose!",
    "Aceito!": "Deal!",
    "T\xF4 liso \u{1F605} S\xF3 pela honra!": "I'm broke \u{1F605} Just for glory!",
    "Sem \u{1FA99}\u2026 valendo nada?": "No \u{1FA99}\u2026 play for nothing?",
    "H\xE3? Ah\u2026 bora \u{1F634}": "Huh? Oh\u2026 okay \u{1F634}",
    "Acordei! Bora.": "I'm up! Let's go.",
    "Cinco minutinhos\u2026 t\xE1, bora.": "Five more minutes\u2026 fine, let's go.",
    "Enquanto o build roda\u2026 bora! \u23F3": "While the build runs\u2026 let's go! \u23F3",
    "Meu comando t\xE1 rodando, d\xE1 tempo \u23F3": "My command's running, there's time \u23F3",
    "T\xF4 esperando o terminal mesmo\u2026": "I'm just waiting on the terminal anyway\u2026",
    "Aposta? S\xF3 um pouquinho \u{1F4B0}": "A bet? Just a little one \u{1F4B0}",
    "Valendo pouco, hein": "Low stakes, okay?",
    "\xC9 GOL!!": "GOAL!!",
    "GOLA\xC7O! \u26BD": "WHAT A GOAL! \u26BD",
    "Que gola\xE7o!": "What a screamer!",
    "Na trave!": "Off the post!",
    "Quase!": "So close!",
    "Perdeu essa?!": "How'd he miss that?!",
    "Ah n\xE3o! Gol deles \u{1F629}": "Oh no! Their goal \u{1F629}",
    "Que fase\u2026": "Rough times\u2026",
    "Acorda, zaga!": "Wake up, defense!",
    "N\xE3o acredito\u2026": "I can't believe it\u2026",
    "Juiz ladr\xE3o! \u{1F624}": "The ref's a crook! \u{1F624}",
    "Que jogada!": "What a play!",
    "Esse goleiro \xE9 bom demais": "That goalie is way too good",
    "Bora, time!": "Come on, team!",
    "Isso foi p\xEAnalti!": "That was a penalty!",
    "T\xE1 jogando muito!": "They're playing great!",
    "N\xE3o acredito! \u{1F631}": "No way! \u{1F631}",
    "Eu sabia!": "I knew it!",
    "Que reviravolta!": "What a twist!",
    "Mentira!!": "No way!!",
    "Esse casal! \u{1F60D}": "These two! \u{1F60D}",
    "Que romance\u2026": "So romantic\u2026",
    "Shhh, vai come\xE7ar!": "Shhh, it's starting!",
    "Chora n\xE3o\u2026 \u{1F62D}": "Don't cry\u2026 \u{1F62D}",
    "Esse vil\xE3o n\xE3o presta": "That villain is no good",
    "Amanh\xE3 \xE9 o \xFAltimo cap\xEDtulo!": "The finale is tomorrow!",
    "Hahaha!": "Hahaha!",
    "Muito bom \u{1F602}": "So good \u{1F602}",
    "Esse desenho \xE9 demais!": "This cartoon is awesome!",
    "Eu assistia isso crian\xE7a!": "I watched this as a kid!",
    "Cl\xE1ssico!": "A classic!",
    "Olha a cara dele \u{1F602}": "Look at his face \u{1F602}",
    "Bom demais!": "Too good!",
    "Amanh\xE3 tem mais \u{1F4FA}": "More tomorrow \u{1F4FA}",
    "Que epis\xF3dio!": "What an episode!",
    "Valeu a pausa!": "Worth the break!",
    "Vou te passar! \u{1F3CE}\uFE0F": "I'm passing you! \u{1F3CE}\uFE0F",
    "Que lag \xE9 esse?!": "What's with this lag?!",
    "N\xE3o vale!": "That doesn't count!",
    "T\xE1 f\xE1cil \u{1F60E}": "Too easy \u{1F60E}",
    "S\xF3 aquecendo\u2026": "Just warming up\u2026",
    "Ningu\xE9m me para!": "Nobody can stop me!",
    "Olha essa!": "Check this out!",
    "Ganhei essa! \u{1F3C6}": "Won that one! \u{1F3C6}",
    "Uma a zero!": "One-nothing!",
    "Toma!": "Take that!",
    "Vai, {nome}!": "Go, {nome}!",
    "Uooou!": "Whoooa!",
    "Aperta o bot\xE3o!": "Press the button!",
    "Ponto! \u{1F3D3}": "Point! \u{1F3D3}",
    "Na quina!": "Right on the edge!",
    "Corta!": "Smash!",
    "Defende essa!": "Return this one!",
    "Boa!": "Nice!",
    "Que ralo!": "What a shot!",
    "Ganhei de {a} a {b}! \u{1F3C6}": "I won {a} to {b}! \u{1F3C6}",
    "Jo\u2026": "Rock\u2026",
    "Ken\u2026": "Paper\u2026",
    "P\xF4!": "Scissors!",
    "Empate! De novo!": "Tie! Again!",
    "Pensamos igual \u{1F602}": "Great minds think alike \u{1F602}",
    "De novo!": "Again!",
    "Ganhei! \u{1F4B0}": "I won! \u{1F4B0}",
    "Hoje \xE9 meu dia!": "It's my day!",
    "Passa o \u{1FA99}!": "Hand over the \u{1FA99}!",
    "Mole demais \u{1F60E}": "Easy peasy \u{1F60E}",
    "Sabia!": "Knew it!",
    "Ganhei! \u{1F60E}": "I won! \u{1F60E}",
    "N\xE3o valeu!": "That didn't count!",
    "Sorte sua\u2026": "Lucky you\u2026",
    "Meu dinheiro\u2026 \u{1F62D}": "My money\u2026 \u{1F62D}",
    "T\xE1, t\xE1\u2026": "Yeah, yeah\u2026",
    "Era pra ser pedra!": "I meant to throw rock!",
    "Revanche!": "Rematch!",
    "Melhor de tr\xEAs!": "Best of three!",
    "De novo, valendo!": "Again, for real this time!",
    "Deixa quieto \u{1F605}": "Forget it \u{1F605}",
    "Empatamos, ent\xE3o.": "A tie, then.",
    "Uou!": "Whoa!",
    "Eita!": "Yikes!",
    "Paga!": "Pay up!",
    "Hoje eu t\xF4 on \u{1F60E}": "I'm on fire today \u{1F60E}",
    "Cabelo no lugar \u2705": "Hair on point \u2705",
    "Look aprovado \u2728": "Look approved \u2728",
    "Esse cabelo n\xE3o colabora\u2026": "This hair won't cooperate\u2026",
    "Pronto pra pr\xF3xima reuni\xE3o \u2728": "Ready for the next meeting \u2728",
    "Batom perfeito \u{1F484}": "Perfect lipstick \u{1F484}",
    "Agora sim \u{1F48B}": "Now we're talking \u{1F48B}",
    "Empresta o pente?": "Can I borrow your comb?",
    "Ficou \xF3timo!": "Looks great!",
    "Que tal?": "How do I look?",
    "T\xE1 arrasando!": "You're killing it!",
    "Viram o commit de {nome}? \u{1F440}": "Did you see {nome}'s commit? \u{1F440}",
    "Dizem que {sala} vai pro ar hoje\u2026": "Word is {sala} goes live today\u2026",
    "{nome} t\xE1 h\xE1 horas no mesmo bug \u{1F92B}": "{nome}'s been stuck on the same bug for hours \u{1F92B}",
    "Ouvi dizer que vai ter pizza \u{1F355}": "I heard there's gonna be pizza \u{1F355}",
    "Sabia que {nome} aposta tudo no jokenp\xF4?": "Did you know {nome} bets it all on rock-paper-scissors?",
    "Meu build passou de primeira \u{1F60E}": "My build passed on the first try \u{1F60E}",
    "Esse bug em {sala} t\xE1 osso": "This bug in {sala} is brutal",
    "Deploy na sexta? \u{1F608}": "Deploy on a Friday? \u{1F608}",
    "Quem mexeu no package-lock?!": "Who touched the package-lock?!",
    "Os testes est\xE3o verdes \u2705": "Tests are green \u2705",
    "T\xF4 esperando o review\u2026": "Still waiting on the review\u2026",
    "Escrevi 300 linhas e apaguei 400": "Wrote 300 lines and deleted 400",
    "Refatorei {sala} inteiro hoje": "Refactored all of {sala} today",
    "Esse caf\xE9 t\xE1 forte!": "This coffee is strong!",
    "J\xE1 \xE9 o quinto caf\xE9 \u2615": "Fifth coffee already \u2615",
    "Sem caf\xE9 n\xE3o compila \u2615": "No coffee, no compile \u2615",
    "Funciona na minha m\xE1quina! \u{1F602}": "Works on my machine! \u{1F602}",
    "Por que o dev foi ao m\xE9dico? Muitos bugs \u{1F41B}": "Why did the dev see a doctor? Too many bugs \u{1F41B}",
    "Existem 10 tipos de pessoas\u2026 \u{1F60F}": "There are 10 types of people\u2026 \u{1F60F}",
    'Commit: "ajustes finais (agora vai)"': 'Commit: "final tweaks (for real this time)"',
    "Meu c\xF3digo n\xE3o tem bug, tem feature surpresa": "My code has no bugs, just surprise features",
    "Viu o jogo ontem? \u26BD": "Did you catch the game yesterday? \u26BD",
    "Bora correr no fim de semana?": "Wanna go running this weekend?",
    "Viram o \xFAltimo epis\xF3dio? \u{1F4FA}": "Anyone see the latest episode? \u{1F4FA}",
    "Sem spoiler, por favor!": "No spoilers, please!",
    "Zerei aquele jogo ontem \u{1F3AE}": "Beat that game yesterday \u{1F3AE}",
    "Bora jogar online hoje?": "Wanna play online tonight?",
    "T\xF4 lendo um livro \xF3timo \u{1F4DA}": "I'm reading a great book \u{1F4DA}",
    "Terminei aquele livro!": "Finished that book!",
    "Respira\u2026 tudo vai compilar \u{1F9D8}": "Breathe\u2026 it'll all compile \u{1F9D8}",
    "Um passo de cada vez.": "One step at a time.",
    "Quem topa um jokenp\xF4 depois? \u{1F3B2}": "Who's up for rock-paper-scissors later? \u{1F3B2}",
    "T\xF4 com sorte hoje \u{1F340}": "Feeling lucky today \u{1F340}",
    "T\xF4 juntando \u{1FA99} pra f\xE9rias": "Saving up \u{1FA99} for vacation",
    "Caf\xE9 de gra\xE7a \xE9 o melhor caf\xE9": "Free coffee is the best coffee",
    "E o fim de semana?": "Any weekend plans?",
    "Preciso de f\xE9rias \u{1F3D6}\uFE0F": "I need a vacation \u{1F3D6}\uFE0F",
    "Que dia, hein": "What a day, huh",
    "T\xE1 tudo corrido hoje": "It's been crazy busy today",
    "S\xE9rio?!": "Seriously?!",
    "N\xE3o acredito \u{1F62E}": "I can't believe it \u{1F62E}",
    "Verdade!": "True!",
    "Hahaha": "Hahaha",
    "Nem me fala\u2026": "Tell me about it\u2026",
    "Pois \xE9": "Yep",
    "Mentira!": "No way!",
    "Que isso!": "Come on!",
    "Opa, me chamaram! \u{1F3C3}": "Oops, they're calling me! \u{1F3C3}",
    "Fui! Trabalho chegou": "Gotta go! Work's here",
    "Volto j\xE1!": "Be right back!",
    "Ih, tenho que ir!": "Uh-oh, gotta go!",
    "Meu comando terminou! \u{1F3C3}": "My command finished! \u{1F3C3}",
    "Terminou o build, fui!": "Build's done, gotta go!",
    "Sextou! \u{1F389}": "TGIF! \u{1F389}",
    "Segunda-feira, n\xE9\u2026": "Monday, huh\u2026",
    "Bom dia! \u2600\uFE0F": "Good morning! \u2600\uFE0F",
    "Que fome\u2026 almo\xE7o? \u{1F37D}\uFE0F": "So hungry\u2026 lunch? \u{1F37D}\uFE0F",
    "Ainda aqui a essa hora? \u{1F319}": "Still here at this hour? \u{1F319}",
    // client/src/world/social/persona.ts
    "Competi\xE7\xE3o": "Competition",
    "Adora competir: desafia os colegas no ping-pong, no videogame e no jokenp\xF4.": "Loves to compete: challenges coworkers at ping-pong, video games and rock-paper-scissors.",
    "Apostas": "Betting",
    "Topa qualquer aposta e aposta alto no jokenp\xF4.": "Takes any bet and bets big at rock-paper-scissors.",
    "Games": "Games",
    "Vive no videogame do lounge e nos fliperamas \u2014 e costuma ganhar.": "Lives on the lounge console and the arcade machines \u2014 and usually wins.",
    "S\xE9ries e TV": "TV & shows",
    "N\xE3o perde um programa na TV do lounge (de prefer\xEAncia com pipoca).": "Never misses a show on the lounge TV (ideally with popcorn).",
    "Fofoca": "Gossip",
    "Puxa papo na copa e sabe de tudo o que acontece nas salas.": "Strikes up chats in the kitchen and knows everything going on in the rooms.",
    "Vaidade": "Vanity",
    "Passa no espelho do banheiro para se arrumar sempre que pode.": "Stops by the bathroom mirror to freshen up whenever possible.",
    "Cafe\xEDna": "Caffeine",
    "Movido a caf\xE9: a cafeteira da copa \xE9 a segunda casa.": "Runs on coffee: the kitchen coffee maker is a second home.",
    "Piadas": "Jokes",
    "Conta piada em toda conversa e faz a roda rir.": "Cracks a joke in every chat and gets the group laughing.",
    "Esporte": "Sports",
    "Joga ping-pong, se alonga e vibra com o futebol na TV.": "Plays ping-pong, stretches and cheers for soccer on TV.",
    "Timidez": "Shyness",
    "Prefere ficar na sua: l\xEA, olha a janela e entra menos nas rodas.": "Keeps to themselves: reads, looks out the window and joins fewer groups.",
    "Economia": "Thrift",
    "P\xE3o-duro: aposta pouco e \xE0s vezes foge da aposta.": "Penny-pincher: bets small and sometimes dodges the bet.",
    "Sonecas": "Naps",
    "Qualquer sof\xE1 ou puff vira cama.": "Any couch or beanbag becomes a bed.",
    "Calma": "Calm",
    "Zen: alongamentos, janela e conversas tranquilas.": "Zen: stretches, the window and quiet chats.",
    "Leitura": "Reading",
    "Sempre com um livro da estante (ou o celular) na m\xE3o.": "Always has a book from the shelf (or a phone) in hand.",
    "T\xE1 pago!": "Done and done!",
    "\xC9 hoje!": "Today's the day!",
    "Simbora!": "Let's go!",
    "Bora codar!": "Let's code!",
    "Deu bom!": "It worked!",
    "Show de bola!": "Awesome!",
    "Tamo junto!": "Got your back!",
    "Sem estresse.": "No stress.",
    "Vai dar certo!": "It'll work out!",
    // client/src/world/social/social.ts
    "no jokenp\xF4": "at rock-paper-scissors",
    "no pingue-pongue": "at ping-pong",
    "no videogame": "at video games",
    "no fliperama": "at the arcade",
    "Posso ver junto? \u{1F4FA}": "Can I watch too? \u{1F4FA}",
    "Tem lugar pra mais um? \u2615": "Room for one more? \u2615",
    "Quem t\xE1 ganhando?": "Who's winning?",
    "Ganhei por W.O.! \u{1F60E}": "Won by forfeit! \u{1F60E}",
    "na aposta": "on a bet",
    " ({0} a {1})": " ({0}-{1})",
    "ganhou \u{1FA99}{0} de {1} {2}{3}": "won \u{1FA99}{0} from {1} {2}{3}",
    "venceu {0} {1}{2}": "beat {0} {1}{2}",
    "Pedido atendido": "Request handled",
    "Entregou: {0}": "Delivered: {0}",
    "Vendo {0} na TV": "Watching {0} on TV",
    "futebol": "soccer",
    "novela": "a soap opera",
    "desenho": "cartoons",
    " (a caminho)": " (on the way)",
    " \xB7 valendo \u{1FA99}{0}": " \xB7 betting \u{1FA99}{0}",
    // client/src/world/social/wallet.ts
    "Chegou ao escrit\xF3rio": "Arrived at the office",
    "1 tarefa j\xE1 conclu\xEDda": "1 task already done",
    "{0} tarefas j\xE1 conclu\xEDdas": "{0} tasks already done",
    "Tarefa conclu\xEDda: {0}": "Task done: {0}",
    "Perdeu {0} para {1}": "Lost {0} to {1}",
    "Ganhou {0} de {1}": "Won {0} against {1}",
    // shared/activity.ts
    "[chave privada]": "[private key]",
    "{0} e mais {1}": "{0} and {1} more",
    "Fazendo uma requisi\xE7\xE3o HTTP": "Making an HTTP request",
    "Testando a API local": "Testing the local API",
    "Testando o servidor local": "Testing the local server",
    "Chamando {0}": "Calling {0}",
    "Fazendo commit": "Committing",
    "Enviando commits (git push)": "Pushing commits (git push)",
    "Atualizando do remoto (git pull)": "Pulling from remote (git pull)",
    "Buscando do remoto (git fetch)": "Fetching from remote (git fetch)",
    "Trocando de branch": "Switching branches",
    "Fazendo merge": "Merging",
    "Fazendo rebase": "Rebasing",
    "Conferindo o git status": "Checking git status",
    "Conferindo as mudan\xE7as (diff)": "Reviewing changes (diff)",
    "Olhando um commit (git show)": "Looking at a commit (git show)",
    "Lendo o hist\xF3rico do git": "Reading git history",
    "Preparando arquivos (git add)": "Staging files (git add)",
    "Guardando mudan\xE7as (stash)": "Stashing changes (stash)",
    "Clonando reposit\xF3rio": "Cloning a repository",
    "Conferindo as branches": "Checking branches",
    "Mexendo nas worktrees": "Working with worktrees",
    "Desfazendo mudan\xE7as (git reset)": "Undoing changes (git reset)",
    "Restaurando arquivos (git restore)": "Restoring files (git restore)",
    "Mexendo nas tags": "Working with tags",
    "Vendo quem mudou cada linha": "Seeing who changed each line",
    "Trazendo um commit (cherry-pick)": "Picking a commit (cherry-pick)",
    "Usando o git": "Using git",
    "GitHub CLI: gh {0}": "GitHub CLI: gh {0}",
    "Instalando depend\xEAncias": "Installing dependencies",
    "Conferindo os tipos (TypeScript)": "Checking types (TypeScript)",
    "Compilando o projeto": "Building the project",
    "Subindo o preview do build": "Starting the build preview",
    "Subindo o servidor de dev": "Starting the dev server",
    "Rodando o linter": "Running the linter",
    "Rodando o script {0}": "Running script {0}",
    "Docker: {0}": "Docker: {0}",
    "Mexendo na nuvem ({0})": "Working in the cloud ({0})",
    "Consultando o banco de dados": "Querying the database",
    "Buscando \u201C{0}\u201D": "Searching for \u201C{0}\u201D",
    "Explorando pastas": "Exploring folders",
    "Mudando de pasta": "Changing folders",
    "Escrevendo {0}": "Writing {0}",
    "Escrevendo um arquivo": "Writing a file",
    "Mostrando texto no terminal": "Printing text to the terminal",
    "Editando {0}": "Editing {0}",
    "Editando via terminal": "Editing via the terminal",
    "Contando linhas de {0} arquivos": "Counting lines in {0} files",
    "Contando linhas de {0}": "Counting lines in {0}",
    "Contando linhas": "Counting lines",
    "Acompanhando {0}": "Following {0}",
    "Acompanhando um log": "Following a log",
    "Filtrando JSON": "Filtering JSON",
    "Lendo {0}": "Reading {0}",
    "Organizando arquivos": "Organizing files",
    "Aguardando um pouco": "Waiting a bit",
    "Abrindo no computador": "Opening on the computer",
    "Abrindo no editor": "Opening in the editor",
    "Parando um processo": "Stopping a process",
    "Conferindo quem usa a porta {0}": "Checking who's using port {0}",
    "Conferindo processos e portas": "Checking processes and ports",
    "Conferindo processos": "Checking processes",
    "Procurando um programa": "Looking for a program",
    "Comparando arquivos": "Comparing files",
    "Conferindo a data e a hora": "Checking the date and time",
    "Conferindo vari\xE1veis de ambiente": "Checking environment variables",
    "Conferindo um arquivo": "Checking a file",
    "Rodando o Claude Code": "Running Claude Code",
    "Usando a \xE1rea de transfer\xEAncia": "Using the clipboard",
    "Executando {0}": "Running {0}",
    "Executando um script de shell": "Running a shell script",
    "Executando o m\xF3dulo {0}": "Running module {0}",
    "Executando um script {0}": "Running a {0} script",
    "Repetindo um comando em lote": "Repeating a command in batch",
    "Rodando {0}": "Running {0}",
    "Rodando um comando no terminal": "Running a command in the terminal",
    "Abrindo {0}": "Opening {0}",
    "Navegando no navegador": "Browsing in the browser",
    "Tirando print da p\xE1gina": "Taking a screenshot of the page",
    "Clicando na p\xE1gina": "Clicking on the page",
    "Preenchendo formul\xE1rio": "Filling out a form",
    "Lendo a p\xE1gina": "Reading the page",
    "Navegador: {0}": "Browser: {0}",
    "Banco ({0}): {1}": "Database ({0}): {1}",
    "Olhando {0}": "Looking at {0}",
    "Editando arquivo": "Editing a file",
    "Editando notebook {0}": "Editing notebook {0}",
    "Procurando {0}": "Looking for {0}",
    "arquivos": "files",
    "Listando {0}": "Listing {0}",
    "pasta": "folder",
    "Conferindo sa\xEDda do terminal": "Checking terminal output",
    "Pesquisando \u201C{0}\u201D": "Searching the web for \u201C{0}\u201D",
    "Lendo uma p\xE1gina": "Reading a page",
    "Atualizando a lista de tarefas": "Updating the task list",
    "{0}/{1} conclu\xEDdas": "{0}/{1} done",
    "Nova tarefa: {0}": "New task: {0}",
    "sem t\xEDtulo": "untitled",
    "Concluiu a tarefa #{0}": "Completed task #{0}",
    "Come\xE7ou a tarefa #{0}": "Started task #{0}",
    "Atualizando a tarefa #{0}": "Updating task #{0}",
    "Revisando as tarefas": "Reviewing tasks",
    "Entrando no modo de planejamento": "Entering plan mode",
    "Apresentando o plano": "Presenting the plan",
    "Delegando: {0}": "Delegating: {0}",
    "Chamando um subagente": "Calling a subagent",
    "Orquestrando um workflow": "Orchestrating a workflow",
    "Entregando o resultado": "Delivering the result",
    "Conferindo a equipe": "Checking on the team",
    "outro agente": "another agent",
    "Fazendo uma pergunta a voc\xEA": "Asking you a question",
    "Usando a skill {0}": "Using the {0} skill",
    "Procurando ferramentas": "Looking for tools",
    "Lendo recursos MCP": "Reading MCP resources",
    "Publicando uma p\xE1gina": "Publishing a page",
    "Atualizando uma p\xE1gina publicada": "Updating a published page",
    "Agendando uma tarefa": "Scheduling a task",
    "Trocando de worktree": "Switching worktrees",
    "Enviando algo para voc\xEA": "Sending you something",
    "Usando {0}": "Using {0}",
    "Nova tarefa: \u201C{0}\u201D": "New task: \u201C{0}\u201D",
    "Escutando {0}": "Listening to {0}",
    "Escrevendo a resposta": "Writing the reply",
    "Concluiu em {0}": "Done in {0}",
    "Erro em {0}": "Error in {0}",
    "Interrompido por voc\xEA": "Interrupted by you",
    "Organizando a mem\xF3ria (compactando)": "Tidying up memory (compacting)",
    "Recebeu resultado em segundo plano": "Got a background result",
    "Instabilidade na API, tentando de novo": "API hiccup, retrying",
    "Voc\xEA recusou: {0}": "You denied: {0}",
    "Voc\xEA recusou a a\xE7\xE3o": "You denied the action",
    "Come\xE7ou uma conversa nova (/clear)": "Started a new conversation (/clear)",
    "Acompanhando os subagentes": "Keeping an eye on subagents",
    "Recebeu a sua resposta": "Got your answer",
    "Esperando {0} shells: ": "Waiting on {0} shells: ",
    "Esperando o shell: ": "Waiting on shell: ",
    "Shell falhou: ": "Shell failed: ",
    "Shell interrompido: ": "Shell interrupted: ",
    "Shell terminou: ": "Shell finished: ",
    "responder no terminal": "answer in the terminal",
    "responder uma pergunta": "answer a question",
    "aprovar o pedido de um worker": "approve a worker's request",
    "aprovar acesso do sandbox": "approve sandbox access",
    "fechar um di\xE1logo aberto": "close an open dialog",
    "aprovar uma permiss\xE3o": "approve a permission",
    "confiar nesta pasta": "trust this folder",
    // shared/answers.ts
    "op\xE7\xE3o {0}": "option {0}",
    // shared/daystats.ts
    "dia inv\xE1lido: {0}": "invalid day: {0}",
    // shared/demo/daystats.ts
    "escolher uma op\xE7\xE3o": "choose an option",
    "aprovar o plano": "approve the plan",
    "aprovar um comando": "approve a command",
    // shared/demo/github.ts
    "Testes": "Tests",
    "Lint e tipos": "Lint and types",
    // shared/demo/permission.ts
    "Onde guardo o cache das sess\xF5es de login?": "Where should I store the login session cache?",
    "R\xE1pido, e j\xE1 roda no docker-compose do projeto": "Fast, and already runs in the project's docker-compose",
    "Uma tabela a mais no banco que j\xE1 existe": "One more table in the existing database",
    "Mem\xF3ria": "Memory",
    "Mais simples, mas some quando o servidor reinicia": "Simpler, but lost when the server restarts",
    "Quais testes eu rodo antes do commit?": "Which tests should I run before committing?",
    "Unidade": "Unit",
    "npm test, cerca de 40 s": "npm test, about 40 s",
    "Integra\xE7\xE3o": "Integration",
    "Sobe um banco de teste no Docker": "Spins up a test database in Docker",
    "Playwright no navegador, uns 5 min": "Playwright in the browser, about 5 min",
    "Erro de rede": "Network error",
    "Como trato a falha de rede no checkout?": "How should I handle network failures at checkout?",
    "At\xE9 3 tentativas, com espera crescente": "Up to 3 attempts, with increasing delays",
    "Avisar o cliente": "Notify the customer",
    "Mensagem com um bot\xE3o para tentar de novo": "Message with a button to try again",
    "Guardar e enviar depois": "Save and send later",
    "Fila local at\xE9 a conex\xE3o voltar": "Local queue until the connection is back",
    "Telas": "Screens",
    "Em quais telas aplico a mudan\xE7a?": "Which screens should I apply the change to?",
    "Carrinho": "Cart",
    "Pagamento": "Payment",
    "Confirma\xE7\xE3o do pedido": "Order confirmation",
    "Resuma como tratar erros de rede com fetch": "Summarize how to handle network errors with fetch",
    "Acesso \xE0 rede: {0}": "Network access: {0}",
    // shared/demo/simulator.ts
    "Cria a p\xE1gina de checkout com resumo do pedido": "Build the checkout page with an order summary",
    "O total do carrinho n\xE3o atualiza ao remover item": "The cart total doesn't update when an item is removed",
    "Adiciona cupom de desconto no checkout": "Add discount coupons to checkout",
    "Melhora o layout mobile da vitrine": "Improve the storefront's mobile layout",
    "Criar p\xE1gina de checkout": "Create checkout page",
    "Validar formul\xE1rio de endere\xE7o": "Validate address form",
    "Integrar c\xE1lculo de frete": "Integrate shipping calculation",
    "Escrever testes do carrinho": "Write cart tests",
    "Ajustar layout mobile": "Adjust mobile layout",
    "c\xE1lculo de frete correios api": "shipping rate postal service api",
    "Implementa estorno de pagamentos via Pix": "Implement refunds for instant payments",
    "Os webhooks est\xE3o duplicando cobran\xE7as, investiga": "The webhooks are duplicating charges, look into it",
    "Adiciona rate limit nas rotas p\xFAblicas": "Add rate limiting to public routes",
    "Mapear fluxo de estorno": "Map refund flow",
    "Criar migration de refunds": "Create refunds migration",
    "Implementar rota POST /refunds": "Implement POST /refunds route",
    "Idempot\xEAncia nos webhooks": "Webhook idempotency",
    "Cobrir com testes": "Cover with tests",
    "pix devolu\xE7\xE3o api bacen": "instant payment refund api",
    "Cria a tela de perfil com foto e edi\xE7\xE3o": "Build the profile screen with photo and editing",
    "A navega\xE7\xE3o trava ao voltar da tela de detalhes": "Navigation freezes when going back from the details screen",
    "Adiciona modo escuro no app": "Add dark mode to the app",
    "Criar tela de perfil": "Create profile screen",
    "Upload de foto": "Photo upload",
    "Corrigir navega\xE7\xE3o": "Fix navigation",
    "Tema escuro": "Dark theme",
    "O relat\xF3rio di\xE1rio est\xE1 vindo com datas erradas": "The daily report is coming out with wrong dates",
    "Adiciona deduplica\xE7\xE3o na ingest\xE3o": "Add deduplication to ingestion",
    "Otimiza a transforma\xE7\xE3o que est\xE1 lenta": "Optimize the slow transformation",
    "Investigar fuso hor\xE1rio": "Investigate time zone",
    "Corrigir parse de datas": "Fix date parsing",
    "Deduplicar eventos": "Deduplicate events",
    "Testes de regress\xE3o": "Regression tests",
    "Cria a se\xE7\xE3o de depoimentos na home": "Build the testimonials section on the home page",
    "Melhora o SEO das p\xE1ginas do blog": "Improve SEO on the blog pages",
    "Adiciona formul\xE1rio de contato": "Add a contact form",
    "Se\xE7\xE3o de depoimentos": "Testimonials section",
    "Meta tags do blog": "Blog meta tags",
    "Formul\xE1rio de contato": "Contact form",
    "O bot n\xE3o est\xE1 encaminhando para humano": "The bot isn't handing off to a human",
    "Adiciona integra\xE7\xE3o com o Zendesk": "Add Zendesk integration",
    "Melhora o prompt para respostas mais curtas": "Improve the prompt for shorter replies",
    "Regra de escalonamento": "Escalation rule",
    "Cliente Zendesk": "Zendesk client",
    "Ajustar prompt": "Tweak prompt",
    "Testes de conversa": "Conversation tests",
    "Mapear arquivos envolvidos": "Map affected files",
    "Revisar c\xF3digo existente": "Review existing code",
    "Pesquisar documenta\xE7\xE3o": "Research documentation",
    "Rodar su\xEDte de testes": "Run test suite",
    "Investigar causa do bug": "Find the bug's root cause",
    "Propor plano de implementa\xE7\xE3o": "Propose an implementation plan",
    "Verificar cobertura de testes": "Check test coverage",
    "Analisar logs de erro": "Analyze error logs",
    "Rodar a su\xEDte de testes": "Run the test suite",
    "Build de produ\xE7\xE3o": "Production build",
    "Migra\xE7\xE3o do banco": "Database migration",
    "Rodar os testes de integra\xE7\xE3o": "Run the integration tests",
    "Gerar o relat\xF3rio completo": "Generate the full report",
    "Subir os containers": "Start the containers",
    "Testes de ponta a ponta": "End-to-end tests",
    "Auditoria de desempenho": "Performance audit",
    "Instalar as depend\xEAncias": "Install the dependencies",
    "Rodar os testes do m\xF3dulo": "Run the module tests",
    "Compilar o projeto": "Compile the project",
    "Baixar a imagem do banco": "Pull the database image",
    "Empresa": "Company",
    "(demonstra\xE7\xE3o)": "(demo)",
    "Respondido no Habblaud": "Answered in Habblaud",
    "Aprovado no Habblaud (sempre permitir)": "Approved in Habblaud (always allow)",
    "Aprovado no Habblaud": "Approved in Habblaud",
    "Recusado no Habblaud": "Denied in Habblaud",
    "\u270B {0} precisa de voc\xEA em {1}: {2}": "\u270B {0} needs you in {1}: {2}",
    "\u{1F3D7}\uFE0F Nova sala: {0}": "\u{1F3D7}\uFE0F New room: {0}",
    "\u{1F44B} {0} chegou em {1}{2}": "\u{1F44B} {0} arrived in {1}{2}",
    "\u{1F6AA} {0} encerrou a sess\xE3o": "\u{1F6AA} {0} ended the session",
    "Juntando os resultados da equipe": "Gathering the team's results",
    "\u2705 {0} concluiu em {1}": "\u2705 {0} finished in {1}",
    "{0} frentes em paralelo": "{0} workstreams in parallel",
    "\u{1F4E6} {0} entregou \u201C{1}\u201D para {2}": "\u{1F4E6} {0} delivered \u201C{1}\u201D to {2}",
    "\u23F3 {0} est\xE1 esperando o shell em {1}: {2}": "\u23F3 {0} is waiting on the shell in {1}: {2}",
    "\u2705 {0}: shell terminou em {1} \u2014 {2}": "\u2705 {0}: shell finished in {1} \u2014 {2}",
    "\u274C {0}: shell falhou em {1} \u2014 {2}": "\u274C {0}: shell failed in {1} \u2014 {2}",
    // shared/demo/terminal.ts
    "Antes de mexer, vale entender como esse fluxo est\xE1 montado hoje.": "Before touching anything, it's worth understanding how this flow is built today.",
    "O mais seguro \xE9 cobrir com um teste primeiro e depois ajustar o c\xF3digo.": "The safest move is to cover it with a test first and then adjust the code.",
    "Acho que o problema est\xE1 no c\xE1lculo; vou conferir quem chama essa fun\xE7\xE3o.": "I think the problem is in the calculation; I'll check who calls this function.",
    "D\xE1 para resolver com uma mudan\xE7a pequena, sem quebrar a API existente.": "This can be fixed with a small change, without breaking the existing API.",
    "Preciso checar se outros lugares dependem desse comportamento.": "I need to check whether other places depend on this behavior.",
    "Pronto! Ajustei o necess\xE1rio e os testes passaram.": "Done! I adjusted what was needed and the tests passed.",
    "Feito. A mudan\xE7a ficou pequena e coberta por testes.": "Done. The change is small and covered by tests.",
    "Conclu\xED a tarefa; deixei tudo verde no build e nos testes.": "Task complete; the build and the tests are all green.",
    "Terminei. Se quiser, posso abrir um PR com essas mudan\xE7as.": "Finished. If you want, I can open a PR with these changes.",
    "titulo: Lan\xE7amento": "titulo: Launch",
    "Agora o site carrega mais r\xE1pido.": "The site now loads faster.",
    "# Novidades da vers\xE3o 1.5": "# What's new in version 1.5",
    "\u2713 {0} testes passaram ({1} arquivos)\nDura\xE7\xE3o: {2}s": "\u2713 {0} tests passed ({1} files)\nDuration: {2}s",
    "Migra\xE7\xE3o 004_refunds aplicada\nSeed conclu\xEDdo ({0} registros)": "Migration 004_refunds applied\nSeed complete ({0} records)",
    "\u2713 Nenhum problema encontrado ({0} arquivos)": "\u2713 No problems found ({0} files)",
    "Performance: {0}\nAcessibilidade: {1}\nBoas pr\xE1ticas: 100\nSEO: 100": "Performance: {0}\nAccessibility: {1}\nBest practices: 100\nSEO: 100",
    "Servidor de desenvolvimento rodando em http://localhost:5173": "Development server running at http://localhost:5173",
    "Processados {0} registros em {1}s": "Processed {0} records in {1}s",
    "\u2713 Comando conclu\xEDdo": "\u2713 Command complete",
    "Comando rodando em segundo plano (sess\xE3o {0}).": "Command running in the background (session {0}).",
    "Comando rodando em segundo plano (id b{0}). Voc\xEA recebe um aviso quando ele terminar.": "Command running in the background (id b{0}). You'll be notified when it finishes.",
    "Tarefa em segundo plano falhou: {0}": "Background task failed: {0}",
    "Tarefa em segundo plano conclu\xEDda: {0}": "Background task completed: {0}",
    "Deixei rodando em segundo plano: {0}. Volto assim que terminar.": "Left it running in the background: {0}. I'll be back as soon as it finishes.",
    "Os subagentes terminaram; vou juntar o que cada um encontrou.": "The subagents are done; I'll gather what each one found.",
    "Encontrei o ponto do problema; vou ajustar agora.": "Found the source of the problem; fixing it now.",
    "Arquivo atualizado: {0}": "File updated: {0}",
    "Arquivo criado: {0} ({1} linhas)": "File created: {0} ({1} lines)",
    "{0} \u2014 guia completo": "{0} \u2014 complete guide",
    "Documenta\xE7\xE3o oficial: {0}": "Official documentation: {0}",
    "Discuss\xE3o no f\xF3rum: {0}": "Forum discussion: {0}",
    "A p\xE1gina explica a API com exemplos; o trecho relevante confirma o formato esperado.": "The page explains the API with examples; the relevant part confirms the expected format.",
    "Resuma o que importa para a nossa implementa\xE7\xE3o": "Summarize what matters for our implementation",
    "{0}({1}/{2} conclu\xEDdas)": "{0}({1}/{2} done)",
    "Lista de tarefas atualizada": "Task list updated",
    "Subagentes trabalhando em paralelo; os resultados chegam quando terminarem.": "Subagents working in parallel; results arrive when they finish.",
    "{0}. Investigue o c\xF3digo de {1} e devolva um resumo curto com os arquivos envolvidos.": "{0}. Look into the {1} code and return a short summary with the files involved.",
    "Aguardando voc\xEA: {0}": "Waiting on you: {0}",
    "Interrompido pelo usu\xE1rio": "Interrupted by user",
    "Entrega: {0}. Resumo enviado ao agente principal.": "Delivered: {0}. Summary sent to the main agent.",
    "Turno conclu\xEDdo em {0}": "Turn completed in {0}",
    "Conversa compactada automaticamente": "Conversation compacted automatically",
    "\u2713 Conclu\xEDdo": "\u2713 Done",
    // shared/github.ts
    "{0} aberto!": "{0} opened!",
    "{0} mergeado!": "{0} merged!",
    "Release {0} no ar!": "Release {0} is live!",
    "Release no ar!": "Release is live!",
    "CI falhou ({0})": "CI failed ({0})",
    "CI falhou": "CI failed",
    "CI verde de novo!": "CI green again!",
    "o PR #{0}": "PR #{0}",
    "um PR": "a PR",
    "\u{1F389} {0} abriu {1} em {2}": "\u{1F389} {0} opened {1} in {2}",
    "Abriu {0}": "Opened {0}",
    "\u{1F389} {0} mergeou {1} em {2}": "\u{1F389} {0} merged {1} in {2}",
    "Mergeou {0}": "Merged {0}",
    "\u{1F389} {0} publicou {1} em {2}": "\u{1F389} {0} published {1} in {2}",
    "a release {0}": "release {0}",
    "uma release": "a release",
    "Publicou a release {0}": "Published release {0}",
    "Publicou uma release": "Published a release",
    "\u{1F680} {0} enviou commits {1}em {2}": "\u{1F680} {0} pushed commits {1}in {2}",
    "para {0} ": "to {0} ",
    "Enviou commits para {0}": "Pushed commits to {0}",
    "Enviou commits ao GitHub": "Pushed commits to GitHub",
    "\u{1F6A8} CI falhou em {0}{1}": "\u{1F6A8} CI failed in {0}{1}",
    "CI falhou: {0}": "CI failed: {0}",
    "\u2705 CI passou em {0}{1}": "\u2705 CI passed in {0}{1}",
    "CI passou: {0}": "CI passed: {0}",
    "CI passou": "CI passed",
    // shared/messages.ts
    "Mensagem pelo Habblaud": "Message via Habblaud",
    // server/accounts/service.ts
    "Falha ao detectar contas: {0}": "Failed to detect accounts: {0}",
    "Falha ao ler o uso do statusline: {0}": "Failed to read statusline usage: {0}",
    // server/codex/http.ts
    "Eventos do Codex: falha ao aplicar um evento ({0}).": "Codex events: failed to apply an event ({0}).",
    // server/config.ts
    "HABBLAUD_BIND n\xE3o chegou ao container, ent\xE3o a porta pode estar exposta na rede": "HABBLAUD_BIND didn't reach the container, so the port may be exposed on the network",
    "a porta est\xE1 exposta na rede: HABBLAUD_BIND={0}": "the port is exposed on the network: HABBLAUD_BIND={0}",
    "a porta est\xE1 exposta na rede: HABBLAUD_HOST={0}": "the port is exposed on the network: HABBLAUD_HOST={0}",
    "mesma trava do terminal: {0}": "same lock as the terminal: {0}",
    // server/history/daystats.ts
    "N\xE3o foi poss\xEDvel ler {0} ({1}).": "Couldn't read {0} ({1}).",
    "{0} est\xE1 ileg\xEDvel; guardado como .corrupt e o dia recome\xE7a do zero.": "{0} is unreadable; kept as .corrupt and the day starts over from zero.",
    "N\xE3o foi poss\xEDvel gravar {0} ({1}); as estat\xEDsticas seguem s\xF3 na mem\xF3ria.": "Couldn't write {0} ({1}); stats are kept in memory only.",
    "N\xE3o foi poss\xEDvel apagar {0} ({1}).": "Couldn't delete {0} ({1}).",
    "Falha nas estat\xEDsticas do dia ({0}): {1}": "Day stats failed ({0}): {1}",
    // server/history/timeline.ts
    "Snapshot ignorado pela linha do tempo: {0}": "Snapshot ignored by the timeline: {0}",
    "Falha no gravador da linha do tempo: {0}": "Timeline recorder failed: {0}",
    "Linha do tempo de {0} chegou a {1} MB: a grava\xE7\xE3o para at\xE9 a virada do dia.": "Timeline for {0} reached {1} MB: recording stops until the day rolls over.",
    "N\xE3o foi poss\xEDvel gravar a linha do tempo em {0} ({1}); tento de novo em {2} s.": "Couldn't write the timeline to {0} ({1}); retrying in {2} s.",
    "Linha do tempo: voltou a gravar.": "Timeline: recording again.",
    "N\xE3o foi poss\xEDvel apagar {0} da linha do tempo ({1}).": "Couldn't delete {0} from the timeline ({1}).",
    // server/http/app.ts
    "agente n\xE3o encontrado: s\xF3 o agente principal de uma sess\xE3o aberta tem personagem edit\xE1vel": "agent not found: only the main agent of an open session has an editable character",
    "envie o corpo como JSON (Content-Type: application/json)": "send the body as JSON (Content-Type: application/json)",
    "corpo grande demais": "body too large",
    "JSON inv\xE1lido": "invalid JSON",
    "m\xE9todo n\xE3o permitido": "method not allowed",
    "esperado {name: texto de 1 a {0} caracteres, seed: inteiro de 0 a 4294967295, parts: pe\xE7as da apar\xEAncia}": "expected {name: text of 1 to {0} characters, seed: integer from 0 to 4294967295, parts: appearance parts}",
    "erro interno": "internal error",
    "terminal desligado: ele s\xF3 funciona com o Habblaud acess\xEDvel apenas pelo pr\xF3prio computador": "terminal disabled: it only works when Habblaud is reachable only from the computer running it",
    "o terminal s\xF3 abre pelo pr\xF3prio computador (http://localhost ou http://127.0.0.1)": "the terminal only opens from the computer running Habblaud (http://localhost or http://127.0.0.1)",
    "id inv\xE1lido": "invalid id",
    "responder pelo escrit\xF3rio desligado: s\xF3 funciona com o Habblaud acess\xEDvel apenas pelo pr\xF3prio computador": "replying from the office disabled: it only works when Habblaud is reachable only from the computer running it",
    "pedidos de permiss\xE3o s\xF3 s\xE3o respondidos pelo pr\xF3prio computador (http://localhost ou http://127.0.0.1)": "permission requests can only be answered from the computer running Habblaud (http://localhost or http://127.0.0.1)",
    "terminal interativo desligado (veja o log do servidor)": "interactive terminal disabled (see the server log)",
    "editar o personagem desligado: s\xF3 funciona com o Habblaud acess\xEDvel apenas pelo pr\xF3prio computador": "character editing disabled: it only works when Habblaud is reachable only from the computer running it",
    "o personagem s\xF3 \xE9 editado pelo pr\xF3prio computador (http://localhost ou http://127.0.0.1)": "the character can only be edited from the computer running Habblaud (http://localhost or http://127.0.0.1)",
    "eventos do Codex s\xF3 s\xE3o aceitos pelo pr\xF3prio computador (http://localhost ou http://127.0.0.1)": "Codex events are only accepted from the computer running Habblaud (http://localhost or http://127.0.0.1)",
    "mensagens pelo escrit\xF3rio desligadas: s\xF3 funcionam com o Habblaud acess\xEDvel apenas pelo pr\xF3prio computador (e sem HABBLAUD_MENSAGENS=0)": "messages from the office disabled: they only work when Habblaud is reachable only from the computer running it (and without HABBLAUD_MENSAGENS=0)",
    "mensagens s\xF3 s\xE3o mandadas pelo pr\xF3prio computador (http://localhost ou http://127.0.0.1)": "messages can only be sent from the computer running Habblaud (http://localhost or http://127.0.0.1)",
    "agente n\xE3o encontrado": "agent not found",
    "renomear salas desligado: s\xF3 funciona com o Habblaud acess\xEDvel apenas pelo pr\xF3prio computador": "room renaming disabled: it only works when Habblaud is reachable only from the computer running it",
    "renomear salas s\xF3 pelo pr\xF3prio computador (http://localhost)": "rooms can only be renamed from the computer running Habblaud (http://localhost)",
    "sala n\xE3o encontrada": "room not found",
    "rota desconhecida": "unknown route",
    // server/http/guard.ts
    "Host n\xE3o permitido: {0}. Abra o Habblaud por http://localhost (ou pelo IP) ": "Host not allowed: {0}. Open Habblaud at http://localhost (or by IP) ",
    "ou libere o nome em HABBLAUD_ALLOWED_HOSTS.": "or allow the name in HABBLAUD_ALLOWED_HOSTS.",
    "Origem n\xE3o permitida.": "Origin not allowed.",
    "Envie o corpo como JSON (Content-Type: application/json).": "Send the body as JSON (Content-Type: application/json).",
    // server/http/pty.ts
    "o terminal interativo s\xF3 pode ser usado no pr\xF3prio computador": "the interactive terminal can only be used on the computer running Habblaud",
    "abra o Habblaud por http://localhost para usar o terminal interativo": "open Habblaud at http://localhost to use the interactive terminal",
    "origem n\xE3o permitida para o terminal interativo": "origin not allowed for the interactive terminal",
    // server/http/sessions.ts
    "Hist\xF3rico de sess\xF5es: falha ao listar ({0}).": "Session history: failed to list ({0}).",
    "n\xE3o foi poss\xEDvel listar as sess\xF5es": "couldn't list the sessions",
    "endere\xE7o inv\xE1lido": "invalid address",
    // server/http/static.ts
    "M\xE9todo n\xE3o permitido": "Method not allowed",
    'Cliente n\xE3o compilado. Rode "npm run build" (ou use "npm run dev").': 'Client not built. Run "npm run build" (or use "npm run dev").',
    "Caminho inv\xE1lido": "Invalid path",
    "N\xE3o encontrado": "Not found",
    // server/http/stats.ts
    'par\xE2metro "{0}" repetido': 'repeated parameter "{0}"',
    "fuso inv\xE1lido: use um nome IANA, ex.: America/Sao_Paulo": "invalid time zone: use an IANA name, e.g. America/New_York",
    "fuso inv\xE1lido": "invalid time zone",
    "dia inv\xE1lido: use AAAA-MM-DD (ex.: 2026-10-08)": "invalid day: use YYYY-MM-DD (e.g. 2026-10-08)",
    "dia no futuro": "day in the future",
    "o Habblaud guarda s\xF3 os \xFAltimos {0} dias": "Habblaud only keeps the last {0} days",
    "fonte inv\xE1lida: use real ou demo": "invalid source: use real or demo",
    "estat\xEDsticas indispon\xEDveis": "stats unavailable",
    "o modo demonstra\xE7\xE3o est\xE1 desligado": "demo mode is off",
    "sem estat\xEDsticas para este dia": "no stats for this day",
    // server/http/terminal.ts
    "Terminal: linha do transcript ignorada ({0}).": "Terminal: transcript line ignored ({0}).",
    "terminais abertos demais (m\xE1ximo de {0}); feche algum e tente de novo": "too many open terminals (max {0}); close one and try again",
    "Terminal de {0}: n\xE3o foi poss\xEDvel ler o transcript ({1}).": "Terminal for {0}: couldn't read the transcript ({1}).",
    "n\xE3o foi poss\xEDvel ler o transcript": "couldn't read the transcript",
    "transcript do agente n\xE3o encontrado": "agent transcript not found",
    "Terminal de {0}: {1}": "Terminal for {0}: {1}",
    // server/http/timeline.ts
    "dia inv\xE1lido: use AAAA-MM-DD": "invalid day: use YYYY-MM-DD",
    "n\xE3o \xE9 arquivo": "not a file",
    "nada gravado neste dia": "nothing recorded on this day",
    // server/index.ts
    "desligado": "off",
    "desligado por HABBLAUD_PTY={0}": "off via HABBLAUD_PTY={0}",
    "desligado (ligue com HABBLAUD_PTY=1)": "off (turn it on with HABBLAUD_PTY=1)",
    "indispon\xEDvel no Docker (rode com npm start)": "unavailable in Docker (run with npm start)",
    "mesma trava do terminal ({0})": "same lock as the terminal ({0})",
    "HABBLAUD_CLAUDE_BIN n\xE3o encontrado no PATH ({0})": "HABBLAUD_CLAUDE_BIN not found in PATH ({0})",
    'execut\xE1vel "claude" n\xE3o encontrado no PATH (defina HABBLAUD_CLAUDE_BIN)': '"claude" executable not found in PATH (set HABBLAUD_CLAUDE_BIN)',
    "o execut\xE1vel do Claude Code n\xE3o roda: {0} (confira o HABBLAUD_CLAUDE_BIN)": "the Claude Code executable doesn't run: {0} (check HABBLAUD_CLAUDE_BIN)",
    "Terminal interativo sem a tela completa ({0}): ao reconectar, modos como a colagem entre colchetes podem se perder.": "Interactive terminal without the full screen ({0}): on reconnect, modes like bracketed paste may be lost.",
    "Falha no rel\xF3gio do escrit\xF3rio: {0}": "Office clock failed: {0}",
    "Erro ao responder {0} {1}: {2}": "Error responding to {0} {1}: {2}",
    "A porta {0} j\xE1 est\xE1 em uso (defina HABBLAUD_PORT para usar outra).": "Port {0} is already in use (set HABBLAUD_PORT to use another one).",
    "Erro no servidor HTTP: {0}": "HTTP server error: {0}",
    "\u{1F3E2} Habblaud {0}{1}{2} em http://{3}:{4}": "\u{1F3E2} Habblaud {0}{1}{2} at http://{3}:{4}",
    "Nenhuma pasta do Claude Code encontrada (defina HABBLAUD_CLAUDE_DIRS).": "No Claude Code folder found (set HABBLAUD_CLAUDE_DIRS).",
    "{0} \xE9 uma pasta do Codex, n\xE3o do Claude Code: fica fora das contas do Claude Code.": "{0} is a Codex folder, not a Claude Code one: it stays out of the Claude Code accounts.",
    "   Conta {0} ({1}): {2} sess\xE3o(\xF5es) aberta(s) \xB7 uso: {3} \xB7 {4}": "   Account {0} ({1}): {2} open session(s) \xB7 usage: {3} \xB7 {4}",
    "   Codex: {0} conta(s), {1} sess\xE3o(\xF5es) aberta(s).": "   Codex: {0} account(s), {1} open session(s).",
    "   Conta {0} do Codex ({1}): uso: {2} \xB7 {3}": "   Codex account {0} ({1}): usage: {2} \xB7 {3}",
    "   Codex: {0}.": "   Codex: {0}.",
    "nenhuma pasta do Codex encontrada (defina HABBLAUD_CODEX_DIRS)": "no Codex folder found (set HABBLAUD_CODEX_DIRS)",
    "desligado (HABBLAUD_CODEX=0)": "off (HABBLAUD_CODEX=0)",
    "   Modo demonstra\xE7\xE3o ligado (agentes simulados misturados aos reais).": "   Demo mode on (simulated agents mixed in with the real ones).",
    "   Terminal: ligado (acesso s\xF3 local).": "   Terminal: on (local access only).",
    "   Terminal: desligado ({0}).": "   Terminal: off ({0}).",
    "   Terminal interativo: ligado ({0}).": "   Interactive terminal: on ({0}).",
    "   Terminal interativo: {0}.": "   Interactive terminal: {0}.",
    "   Linha do tempo (timelapse): gravando em {0}.": "   Timeline (timelapse): recording to {0}.",
    "   Linha do tempo (timelapse): grava\xE7\xE3o desligada (HABBLAUD_TIMELINE).": "   Timeline (timelapse): recording off (HABBLAUD_TIMELINE).",
    "   Responder pelo escrit\xF3rio: {0}.": "   Reply from the office: {0}.",
    "ligado (precisa do mod: npm run mod:install; ou do hook antigo: npm run hooks:install)": "on (needs the mod: npm run mod:install; or the old hook: npm run hooks:install)",
    "desligado (mesma trava do terminal)": "off (same lock as the terminal)",
    "   Mensagens pelo escrit\xF3rio: ligadas (precisa do plugin habblaud-mensagens: npm run mod:install).": "   Messages from the office: on (needs the habblaud-mensagens plugin: npm run mod:install).",
    "   Mensagens pelo escrit\xF3rio: desligadas ({0}).": "   Messages from the office: off ({0}).",
    "   Mensagens ao Codex: pelo codex queue ({0}).": "   Messages to Codex: via codex queue ({0}).",
    "   Mensagens ao Codex: pelo auxiliar do host (deixe npm run codex:bridge rodando no Mac).": "   Messages to Codex: via the host helper (keep npm run codex:bridge running on the Mac).",
    "   Mensagens ao Codex: sem o bin\xE1rio do Codex (codex no PATH ou HABBLAUD_CODEX_BIN); o auxiliar npm run codex:bridge tamb\xE9m serve.": "   Messages to Codex: no Codex binary (codex in PATH or HABBLAUD_CODEX_BIN); the npm run codex:bridge helper also works.",
    "   Vers\xE3o nova: verificando as releases de github.com/{0} a cada 6 h.": "   New version: checking github.com/{0} releases every 6 h.",
    "   Vers\xE3o nova: verifica\xE7\xE3o desligada ({0}).": "   New version: check off ({0}).",
    "package.json sem reposit\xF3rio no GitHub": "package.json has no GitHub repository",
    "Encerrando ({0})\u2026": "Shutting down ({0})\u2026",
    // server/legacy.ts
    "no ambiente": "in the environment",
    "{0} {1}: {2}. Renomeie para valer de novo.": "{0} {1}: {2}. Rename to re-enable.",
    "vari\xE1vel do nome antigo ignorada": "old-name variable ignored",
    "vari\xE1veis do nome antigo ignoradas": "old-name variables ignored",
    "{0} existe e n\xE3o \xE9 uma pasta": "{0} exists and isn't a folder",
    "n\xE3o consegui levar ~/.{0} para ~/.habblaud ({1}); mova a pasta \xE0 m\xE3o.": "couldn't move ~/.{0} to ~/.habblaud ({1}); move the folder by hand.",
    "~/.{0} (nome antigo) agora \xE9 ~/.habblaud.": "~/.{0} (old name) is now ~/.habblaud.",
    "de ~/.{0} (nome antigo) para ~/.habblaud: {1}.": "from ~/.{0} (old name) to ~/.habblaud: {1}.",
    // server/messages/codex.ts
    "id de thread do Codex inv\xE1lido": "invalid Codex thread id",
    "pasta da conta do Codex inv\xE1lida": "invalid Codex account folder",
    "o codex queue n\xE3o respondeu em {0} s (a mensagem pode ter entrado na fila mesmo assim)": "codex queue didn't respond within {0} s (the message may have been queued anyway)",
    "n\xE3o consegui rodar o Codex ({0})": "couldn't run Codex ({0})",
    "o codex queue falhou (c\xF3digo {0})": "codex queue failed (code {0})",
    "a mensagem tem caracteres que n\xE3o d\xE1 para mandar ao Codex": "the message has characters that can't be sent to Codex",
    // server/messages/http.ts
    "j\xE1 h\xE1 {0} mensagens esperando a entrega para este agente: espere a sess\xE3o buscar": "there are already {0} messages waiting for delivery to this agent: wait for the session to fetch them",
    "mensagem desconhecida: ela j\xE1 foi resolvida h\xE1 mais de 10 min ou o Habblaud reiniciou": "unknown message: it was resolved more than 10 min ago or Habblaud restarted",
    // server/messages/registry.ts
    "a sess\xE3o n\xE3o buscou a mensagem: o plugin habblaud-mensagens est\xE1 instalado e a sess\xE3o aberta?": "the session didn't fetch the message: is the habblaud-mensagens plugin installed and the session open?",
    "a sess\xE3o n\xE3o confirmou a entrega": "the session didn't confirm delivery",
    "a sess\xE3o n\xE3o aceitou a mensagem": "the session didn't accept the message",
    "a conversa do agente mudou (/clear ou /resume) antes da entrega": "the agent's conversation changed (/clear or /resume) before delivery",
    "n\xE3o h\xE1 como entregar ao Codex agora: rode o Habblaud fora do Docker com o `codex` no PATH (ou HABBLAUD_CODEX_BIN) ou, no Docker, deixe o npm run codex:bridge rodando no Mac": "no way to deliver to Codex right now: run Habblaud outside Docker with `codex` in PATH (or HABBLAUD_CODEX_BIN) or, in Docker, keep npm run codex:bridge running on the Mac",
    "o auxiliar do Codex n\xE3o buscou a mensagem: o npm run codex:bridge est\xE1 rodando no Mac?": "the Codex helper didn't fetch the message: is npm run codex:bridge running on the Mac?",
    "o Codex demorou demais com as mensagens anteriores a este agente": "Codex took too long with the previous messages to this agent",
    "o auxiliar do Codex n\xE3o confirmou a entrega": "the Codex helper didn't confirm delivery",
    "a pasta da conta do Codex deste agente \xE9 desconhecida": "this agent's Codex account folder is unknown",
    "o codex queue n\xE3o aceitou a mensagem": "codex queue didn't accept the message",
    "subagentes n\xE3o recebem mensagens: mande para o agente principal": "subagents don't receive messages: send it to the main agent",
    "o agente j\xE1 saiu do escrit\xF3rio": "the agent has already left the office",
    "a sess\xE3o n\xE3o est\xE1 com o plugin habblaud-mensagens conectado (npm run mod:install)": "the session doesn't have the habblaud-mensagens plugin connected (npm run mod:install)",
    "a mensagem est\xE1 vazia": "the message is empty",
    "a mensagem passa de 20.000 caracteres": "the message exceeds 20,000 characters",
    "Mensagens: falha no rel\xF3gio ({0}).": "Messages: clock failed ({0}).",
    "esperado um objeto JSON ({})": "expected a JSON object ({})",
    // server/model/names.ts
    "names.json ileg\xEDvel ({0}); come\xE7ando do zero.": "names.json unreadable ({0}); starting from scratch.",
    "N\xE3o foi poss\xEDvel gravar {0} ({1}); os nomes valem s\xF3 nesta execu\xE7\xE3o.": "Couldn't write {0} ({1}); names only last for this run.",
    // server/model/office.ts
    "\u23F3 {0} est\xE1 esperando o shell em {1}{2}": "\u23F3 {0} is waiting on the shell in {1}{2}",
    "o trabalho": "the work",
    "\u{1F4E6} {0} entregou {1} para {2}": "\u{1F4E6} {0} delivered {1} to {2}",
    "o agente principal": "the main agent",
    "\u2753 {0} tem uma pergunta em {1}: {2}": "\u2753 {0} has a question in {1}: {2}",
    "\u{1F510} {0} pede permiss\xE3o em {1}: {2}": "\u{1F510} {0} asks for permission in {1}: {2}",
    "\u270F\uFE0F {0} mudou de visual em {1}": "\u270F\uFE0F {0} got a new look in {1}",
    "\u270F\uFE0F {0} agora \xE9 {1} em {2}": "\u270F\uFE0F {0} is now {1} in {2}",
    "{0} j\xE1 est\xE1 no escrit\xF3rio em {1}": "{0} is already in the office, in {1}",
    "{0} j\xE1 \xE9 o personagem de {1}": "{0} is already {1}'s character",
    // server/model/room-aliases.ts
    "rooms.json ileg\xEDvel ({0}); sem nomes de sala personalizados.": "rooms.json unreadable ({0}); no custom room names.",
    "N\xE3o consegui gravar {0}: {1}": "Couldn't write {0}: {1}",
    // server/permissions/codex.ts
    "Rede({0})": "Network({0})",
    "Acessar a rede: {0}": "Access the network: {0}",
    "Editando {0} arquivos": "Editing {0} files",
    "Criando {0}": "Creating {0}",
    "Apagando {0}": "Deleting {0}",
    "Aplicando um patch": "Applying a patch",
    "Pedindo mais permiss\xF5es": "Asking for more permissions",
    "Digitando num processo do terminal": "Typing into a terminal process",
    // server/permissions/http.ts
    "pedido desconhecido": "unknown request",
    "pedido desconhecido: j\xE1 foi respondido, expirou ou foi respondido no terminal": "unknown request: already answered, expired, or answered in the terminal",
    "este pedido j\xE1 foi respondido": "this request has already been answered",
    "sugest\xE3o de regra desconhecida para este pedido": "unknown rule suggestion for this request",
    'resposta que n\xE3o serve para este pedido: pergunta se responde com "answer" (cada pergunta uma vez, com as op\xE7\xF5es dela); os outros pedidos, com "allow" ou "deny"': `response doesn't fit this request: questions are answered with "answer" (each question once, with its own options); other requests, with "allow" or "deny"`,
    'o Codex n\xE3o aceita interromper nem "sempre permitir" pelo Habblaud: aprove, recuse (com um motivo, se quiser) ou responda no terminal': `Codex doesn't accept interrupting or "always allow" from Habblaud: approve, deny (with a reason, if you want) or answer in the terminal`,
    // server/permissions/registry.ts
    "esperado o JSON do hook PermissionRequest (session_id e tool_name)": "expected the PermissionRequest hook JSON (session_id and tool_name)",
    "Pedidos de permiss\xE3o: falha no rel\xF3gio ({0}).": "Permission requests: clock failed ({0}).",
    " (subagente {0})": " (subagent {0})",
    "Pergunta: {0}": "Question: {0}",
    "Pede permiss\xE3o: {0}": "Asks for permission: {0}",
    // server/pty/manager.ts
    "indispon\xEDvel": "unavailable",
    "n\xE3o consegui encerrar a sess\xE3o: {0}": "couldn't end the session: {0}",
    "Agente {0} encerrado pelo escrit\xF3rio.": "Agent {0} ended from the office.",
    "terminal desligado: {0}": "terminal disabled: {0}",
    "sess\xE3o sem id v\xE1lido para retomar": "session has no valid id to resume",
    "n\xE3o sei a pasta desta sess\xE3o": "I don't know this session's folder",
    "n\xE3o consegui encerrar a sess\xE3o no outro terminal: {0}": "couldn't end the session in the other terminal: {0}",
    "Agente {0} n\xE3o encerrou em {1} s: encerrando \xE0 for\xE7a.": "Agent {0} didn't exit within {1} s: forcing it to close.",
    "Falha ao encerrar \xE0 for\xE7a o processo {0}: {1}": "Failed to force-kill process {0}: {1}",
    "a sess\xE3o no outro terminal n\xE3o encerrou nem \xE0 for\xE7a; ela continua aberta l\xE1": "the session in the other terminal didn't close, even when forced; it's still open there",
    "a sess\xE3o foi encerrada no outro terminal, mas n\xE3o abriu aqui ({0}); para continuar: claude --resume {1}": "the session was ended in the other terminal, but didn't open here ({0}); to continue: claude --resume {1}",
    "Agente {0} assumido pelo escrit\xF3rio (sess\xE3o {1}).": "Agent {0} taken over by the office (session {1}).",
    "entrada inv\xE1lida": "invalid input",
    "informe a pasta do projeto (caminho absoluto)": "provide the project folder (absolute path)",
    "pasta n\xE3o encontrada: {0}": "folder not found: {0}",
    "conta desconhecida": "unknown account",
    "limite de {0} terminais abertos": "limit of {0} open terminals",
    "n\xE3o consegui abrir o Claude Code: {0}": "couldn't open Claude Code: {0}",
    "Terminal {0} aberto em {1} (conta {2}, retomando {3}).": "Terminal {0} opened in {1} (account {2}, resuming {3}).",
    "Terminal {0} aberto em {1} (conta {2}).": "Terminal {0} opened in {1} (account {2}).",
    "s\xF3 d\xE1 para encerrar ou assumir o agente principal de uma sess\xE3o": "only a session's main agent can be ended or taken over",
    "agente sem processo conhecido": "agent has no known process",
    "a sess\xE3o n\xE3o est\xE1 mais aberta": "the session is no longer open",
    "o processo n\xE3o \xE9 mais desta sess\xE3o": "the process no longer belongs to this session",
    "n\xE3o consegui conferir o processo desta sess\xE3o (talvez j\xE1 tenha encerrado)": "couldn't check this session's process (it may have already ended)",
    "o processo {0} n\xE3o \xE9 mais esta sess\xE3o do Claude Code (registro antigo?)": "process {0} is no longer this Claude Code session (stale record?)",
    "Falha ao encerrar o terminal {0}: {1}": "Failed to close terminal {0}: {1}",
    "terminal n\xE3o encontrado": "terminal not found",
    "o terminal j\xE1 foi encerrado": "the terminal has already been closed",
    "node-pty n\xE3o instalado ({0})": "node-pty not installed ({0})",
    "node-pty sem spawn()": "node-pty has no spawn()",
    "node-pty n\xE3o consegue abrir terminais ({0})": "node-pty can't open terminals ({0})",
    "node-pty abriu o terminal de teste, mas ele saiu com o c\xF3digo {0}": "node-pty opened the test terminal, but it exited with code {0}",
    // server/pty/screen.ts
    "@xterm/headless sem Terminal ou SerializeAddon": "@xterm/headless has no Terminal or SerializeAddon",
    "@xterm/headless n\xE3o instalado ({0})": "@xterm/headless not installed ({0})",
    // server/pty/winkill.ts
    "pid inv\xE1lido": "invalid pid",
    "in\xEDcio do processo desconhecido": "unknown process start time",
    "o processo n\xE3o \xE9 mais aquela sess\xE3o": "the process is no longer that session",
    // server/sources/codex/history.ts
    "id de sess\xE3o inv\xE1lido": "invalid session id",
    "sess\xE3o n\xE3o encontrada": "session not found",
    "sess\xE3o compactada pelo Codex (.zst): ainda n\xE3o d\xE1 para ler": "session compressed by Codex (.zst): can't be read yet",
    "Hist\xF3rico do Codex: rollout ileg\xEDvel ({0}).": "Codex history: unreadable rollout ({0}).",
    // server/sources/codex/rollout.ts
    "Recebeu \u201C{0}\u201D": "Received \u201C{0}\u201D",
    "Interagindo com um comando": "Interacting with a command",
    "Executando c\xF3digo": "Running code",
    "Atualizando o plano": "Updating the plan",
    "Esperando os subagentes": "Waiting on subagents",
    "Mensagem para um subagente": "Message to a subagent",
    "Encerrando um subagente": "Closing a subagent",
    "Pedindo permiss\xF5es": "Asking for permissions",
    "[imagem]": "[image]",
    "C\xF3digo de sa\xEDda {0}": "Exit code {0}",
    // server/sources/codex/source.ts
    "Agente principal (Codex)": "Main agent (Codex)",
    "Subagente (Codex)": "Subagent (Codex)",
    "Codex: falha no ciclo de leitura: {0}": "Codex: read cycle failed: {0}",
    "Codex: thread {0}: {1}": "Codex: thread {0}: {1}",
    "Codex: h\xE1 conversas compactadas (.jsonl.zst) que o Habblaud ainda n\xE3o l\xEA; elas ficam sem detalhes.": "Codex: there are compressed conversations (.jsonl.zst) that Habblaud can't read yet; they show no details.",
    "Codex: rollout de {0} ileg\xEDvel ({1}).": "Codex: unreadable rollout for {0} ({1}).",
    "Codex: n\xE3o foi poss\xEDvel ler o in\xEDcio de um rollout ({0}).": "Codex: couldn't read the start of a rollout ({0}).",
    "Codex: evento de hook ignorado ({0}).": "Codex: hook event ignored ({0}).",
    // server/sources/codex/terminal.ts
    "Conversa compactada": "Conversation compacted",
    "Erro: {0}": "Error: {0}",
    "desconhecido": "unknown",
    "Recusado pelo usu\xE1rio": "Denied by the user",
    "C\xF3digo de sa\xEDda {0}\n{1}": "Exit code {0}\n{1}",
    "Novo": "New",
    "Apagado": "Deleted",
    "Alterado": "Modified",
    "A mudan\xE7a n\xE3o foi aplicada": "The change wasn't applied",
    // server/sources/history.ts
    "Hist\xF3rico de sess\xF5es: transcript ileg\xEDvel ({0}).": "Session history: unreadable transcript ({0}).",
    // server/sources/registry.ts
    "pasta sessions/ n\xE3o encontrada": "sessions/ folder not found",
    "sessions/ ileg\xEDvel ({0})": "sessions/ unreadable ({0})",
    // server/sources/source.ts
    "Fonte de agentes {0}: falha ao iniciar ({1}).": "Agent source {0}: failed to start ({1}).",
    "Fonte de agentes {0}: falha ao parar ({1}).": "Agent source {0}: failed to stop ({1}).",
    "Hist\xF3rico de sess\xF5es ({0}): falha ao listar ({1}).": "Session history ({0}): failed to list ({1}).",
    // server/sources/tail.ts
    "Linha com mais de {0} MiB em {1} foi ignorada at\xE9 a pr\xF3xima quebra.": "Line over {0} MiB in {1} skipped until the next line break.",
    // server/sources/terminal.ts
    "(sem t\xEDtulo)": "(untitled)",
    "TodoWrite({0}/{1} conclu\xEDdas)": "TodoWrite({0}/{1} done)",
    "Resumo da conversa compactada": "Compacted conversation summary",
    "Sa\xEDda de {0}": "Output of {0}",
    "Sa\xEDda do comando": "Command output",
    "Notifica\xE7\xE3o de tarefa em segundo plano": "Background task notification",
    "Tarefa em segundo plano conclu\xEDda": "Background task completed",
    "Tarefa em segundo plano falhou": "Background task failed",
    "Tarefa em segundo plano interrompida": "Background task interrupted",
    "Evento de tarefa em segundo plano": "Background task event",
    "Recusado pelo usu\xE1rio: {0}": "Denied by the user: {0}",
    "Erro da API": "API error",
    "Conversa compactada (/compact)": "Conversation compacted (/compact)",
    " \u2014 tentando de novo{0}": " \u2014 retrying{0}",
    " (at\xE9 {0} vezes)": " (up to {0} times)",
    "Erro da API{0}{1}": "API error{0}{1}",
    "Recapitula\xE7\xE3o": "Recap",
    // server/sources/watcher.ts
    "Linha do transcript de {0} ignorada: {1}": "Transcript line from {0} skipped: {1}",
    "Falha no ciclo de leitura: {0}": "Read cycle failed: {0}",
    "Sess\xE3o {0}: {1}": "Session {0}: {1}",
    "Agente {0}": "Agent {0}",
    "Transcript da sess\xE3o {0} foi truncado/substitu\xEDdo; relendo.": "Transcript of session {0} was truncated/replaced; rereading.",
    "N\xE3o foi poss\xEDvel ler o in\xEDcio de um transcript ({0}).": "Couldn't read the start of a transcript ({0}).",
    "Subagente {0} ignorado: {1}": "Subagent {0} skipped: {1}",
    "Subagente {0}: {1}": "Subagent {0}: {1}",
    // server/updates/checker.ts
    "updates.json ileg\xEDvel ({0}); verificando de novo.": "updates.json unreadable ({0}); checking again.",
    "Verifica\xE7\xE3o de vers\xE3o nova falhou: {0}.": "New version check failed: {0}.",
    "A release mais recente de {0} tem uma tag fora do padr\xE3o de vers\xE3o ({1}): ignorada.": "The latest release of {0} has a tag outside the version format ({1}): ignored.",
    "limite de consultas do GitHub atingido; tento de novo mais tarde": "GitHub rate limit reached; will retry later",
    "o GitHub respondeu {0}": "GitHub responded {0}",
    "N\xE3o deu para gravar {0}: {1}.": "Couldn't write {0}: {1}.",
    "\u2B06\uFE0F  Nova vers\xE3o do Habblaud: v{0} (em uso: v{1}). Novidades: {2}": "\u2B06\uFE0F  New Habblaud version: v{0} (running: v{1}). What's new: {2}",
    "o GitHub n\xE3o respondeu a tempo": "GitHub didn't respond in time",
    "sem conex\xE3o com o GitHub": "no connection to GitHub",
    // scripts/codex-bridge.ts
    "--port precisa de um n\xFAmero entre 1 e 65535.": "--port needs a number between 1 and 65535.",
    "op\xE7\xE3o desconhecida: {0}\n\n{1}": "unknown option: {0}\n\n{1}",
    "mensagem sem id": "message without id",
    "mensagem vazia": "empty message",
    "a pasta do Codex {0} n\xE3o existe neste computador": "the Codex folder {0} doesn't exist on this computer",
    "(vazia)": "(empty)",
    "\u2717 mensagem recusada: {0}": "\u2717 message rejected: {0}",
    "\u2713 mensagem na fila do thread {0}\u2026 ({1})": "\u2713 message queued for thread {0}\u2026 ({1})",
    "Habblaud fora do ar em http://127.0.0.1:{0}; tentando de novo a cada {1} s.": "Habblaud is down at http://127.0.0.1:{0}; retrying every {1} s.",
    "o Habblaud recusou ({0}{1}).": "Habblaud refused ({0}{1}).",
    "conectado: os agentes do Codex j\xE1 recebem mensagens pelo escrit\xF3rio.": "connected: Codex agents now receive messages from the office.",
    "[codex-bridge] Erro: {0}": "[codex-bridge] Error: {0}",
    "[codex-bridge] Erro inesperado: {0}": "[codex-bridge] Unexpected error: {0}",
    // scripts/codex-install.ts
    "Aguardando resposta no Habblaud\u2026": "Waiting for an answer in Habblaud\u2026",
    "Uso: npm run codex:<install|uninstall|status> [-- op\xE7\xF5es]\n\n  install     acrescenta os hooks do Habblaud no hooks.json de cada pasta do Codex (faz backup antes)\n  uninstall   tira os hooks do Habblaud de cada pasta (os outros hooks ficam)\n  status      mostra se os hooks est\xE3o l\xE1 e se o Habblaud est\xE1 respondendo\n\nOp\xE7\xF5es:\n  --dry-run        mostra o que mudaria, sem gravar nada\n  --conta <id>     s\xF3 a pasta desta conta (o nome da pasta, ex.: .codex)\n  --port <n>       porta do Habblaud (padr\xE3o: HABBLAUD_PORT ou {0})\n  --espera <s>     quanto o Codex espera sua resposta no Habblaud antes de pedir a aprova\xE7\xE3o no terminal\n                   (padr\xE3o: {1} s; entre {2} e {3})\n  --node <caminho> o Node {4}+ que roda os hooks (padr\xE3o: o `node` do shell de login, se for {5}+;\n                   sen\xE3o o primeiro {6}+ entre /opt/homebrew/bin, /usr/local/bin e o deste comando)\n  -h, --help       mostra esta ajuda\n\nPastas: HABBLAUD_CODEX_DIRS (lista separada por v\xEDrgula) ou CODEX_HOME e as pastas ~/.codex* do Codex.\nDepois de instalar, abra o Codex e aprove os hooks do Habblaud em /hooks.": "Usage: npm run codex:<install|uninstall|status> [-- options]\n\n  install     adds the Habblaud hooks to the hooks.json in each Codex folder (backs it up first)\n  uninstall   removes the Habblaud hooks from each folder (other hooks stay)\n  status      shows whether the hooks are there and whether Habblaud is responding\n\nOptions:\n  --dry-run        shows what would change, without writing anything\n  --conta <id>     only this account's folder (the folder name, e.g. .codex)\n  --port <n>       Habblaud port (default: HABBLAUD_PORT or {0})\n  --espera <s>     how long Codex waits for your answer in Habblaud before asking for approval in the terminal\n                   (default: {1} s; between {2} and {3})\n  --node <path>    the Node {4}+ that runs the hooks (default: the login shell's `node`, if it is {5}+;\n                   otherwise the first {6}+ among /opt/homebrew/bin, /usr/local/bin and the one running this command)\n  -h, --help       shows this help\n\nFolders: HABBLAUD_CODEX_DIRS (comma-separated list) or CODEX_HOME and Codex's ~/.codex* folders.\nAfter installing, open Codex and approve the Habblaud hooks in /hooks.",
    '"hooks" em formato desconhecido; nada foi alterado': '"hooks" in an unknown format; nothing was changed',
    '"hooks.{0}" em formato desconhecido; nada foi alterado': '"hooks.{0}" in an unknown format; nothing was changed',
    "j\xE1 instalado": "already installed",
    "instalado em {0}": "installed in {0}",
    "instalado ({0} eventos)": "installed ({0} events)",
    "atualizado em {0}": "updated in {0}",
    "n\xE3o estava instalado": "wasn't installed",
    "hooks do Habblaud removidos": "Habblaud hooks removed",
    "--conta precisa do nome da pasta da conta (ex.: .codex).": "--conta needs the account folder name (e.g. .codex).",
    "--espera precisa de um n\xFAmero de segundos entre {0} e {1}.": "--espera needs a number of seconds between {0} and {1}.",
    "--node precisa do caminho absoluto de um Node 22+ (ex.: /opt/homebrew/bin/node).": "--node needs the absolute path to a Node 22+ (e.g. /opt/homebrew/bin/node).",
    "diga o que fazer: install, uninstall ou status.\n\n{0}": "specify what to do: install, uninstall or status.\n\n{0}",
    "! {0}: \xE9 uma pasta do Claude Code, n\xE3o do Codex; fica de fora.": "! {0}: it's a Claude Code folder, not a Codex one; skipped.",
    "Nenhuma pasta do Codex com o nome {0} (pastas encontradas: {1}).": "No Codex folder named {0} (folders found: {1}).",
    "nenhuma": "none",
    "Nenhuma pasta do Codex encontrada (~/.codex ou CODEX_HOME). Use HABBLAUD_CODEX_DIRS se ela estiver em outro lugar.": "No Codex folder found (~/.codex or CODEX_HOME). Use HABBLAUD_CODEX_DIRS if it's somewhere else.",
    "nenhum Node": "no Node",
    "i O shell de login (onde o Codex roda os hooks) tem {0}; o hook precisa do {1}+ e vai usar {2} ({3}).": "i The login shell (where Codex runs the hooks) has {0}; the hook needs {1}+ and will use {2} ({3}).",
    "! O shell de login (onde o Codex roda os hooks) tem {0} e n\xE3o achei um Node {1}+: os hooks podem falhar. Use --node <caminho de um Node {2}+>.": "! The login shell (where Codex runs the hooks) has {0} and no Node {1}+ was found: the hooks may fail. Use --node <path to a Node {2}+>.",
    "\u2022 {0}: n\xE3o instalado": "\u2022 {0}: not installed",
    " (esse arquivo n\xE3o existe mais: os hooks falham e nada chega ao escrit\xF3rio)": " (that file no longer exists: the hooks fail and nothing reaches the office)",
    "! {0}: os hooks apontam para {1}{2}; rode npm run codex:install para atualizar": "! {0}: the hooks point to {1}{2}; run npm run codex:install to update",
    "! {0}: diferente do esperado em {1}; rode npm run codex:install para atualizar": "! {0}: not as expected in {1}; run npm run codex:install to update",
    "! {0}: faltando em {1}; rode npm run codex:install": "! {0}: missing in {1}; run npm run codex:install",
    "\u2022 {0}: instalado em {1} de {2} eventos": "\u2022 {0}: installed on {1} of {2} events",
    "~ {0}: {1} (simula\xE7\xE3o: nada gravado)": "~ {0}: {1} (dry run: nothing written)",
    " \xB7 backup em {0}": " \xB7 backup in {0}",
    "    Hooks de outros apps que vinham depois dos do Habblaud ({0}) mudaram de posi\xE7\xE3o:": "    Hooks from other apps that came after Habblaud's ({0}) changed position:",
    "    o Codex vai pedir para aprov\xE1-los de novo em /hooks.": "    Codex will ask you to approve them again in /hooks.",
    "\u2717 {0}: n\xE3o consegui gravar ({1})": "\u2717 {0}: couldn't write ({1})",
    "~ configura\xE7\xE3o do hook ({0}): porta {1}, espera {2} s (simula\xE7\xE3o: nada gravado)": "~ hook config ({0}): port {1}, wait {2} s (dry run: nothing written)",
    "\u2713 configura\xE7\xE3o do hook gravada em {0} (porta {1}, espera {2} s)": "\u2713 hook config written to {0} (port {1}, wait {2} s)",
    "= configura\xE7\xE3o do hook ({0}): porta {1}, espera {2} s": "= hook config ({0}): port {1}, wait {2} s",
    "\u2717 n\xE3o consegui gravar {0} ({1}): o hook usa a porta {2} e espera {3} s": "\u2717 couldn't write {0} ({1}): the hook uses port {2} and waits {3} s",
    "Configura\xE7\xE3o do hook ({0}): porta {1}, espera {2} s.": "Hook config ({0}): port {1}, wait {2} s.",
    "Configura\xE7\xE3o do hook ({0}): n\xE3o existe (o hook usa HABBLAUD_PORT ou a porta {1} e espera {2} s).": "Hook config ({0}): missing (the hook uses HABBLAUD_PORT or port {1} and waits {2} s).",
    "Habblaud em http://127.0.0.1:{0}: fora do ar (com ele parado, os hooks saem na hora e o Codex segue normal).": "Habblaud at http://127.0.0.1:{0}: down (while it's stopped, the hooks exit right away and Codex works as usual).",
    "recebendo os eventos do Codex": "receiving Codex events",
    "no ar, mas sem a fonte do Codex (os eventos s\xE3o ignorados)": "up, but without the Codex source (events are ignored)",
    "aprovar pelo escrit\xF3rio ligado (com alguma p\xE1gina aberta)": "office approvals on (with a page open)",
    "aprovar pelo escrit\xF3rio desligado (porta exposta na rede ou HABBLAUD_TERMINAL=0)": "office approvals off (port exposed on the network or HABBLAUD_TERMINAL=0)",
    "Habblaud em http://127.0.0.1:{0}: {1}; {2}.": "Habblaud at http://127.0.0.1:{0}: {1}; {2}.",
    "Confian\xE7a: o Codex s\xF3 roda um hook novo ou alterado depois que voc\xEA o aprova; confira em /hooks dentro do Codex.": "Trust: Codex only runs a new or changed hook after you approve it; check /hooks inside Codex.",
    "! {0}: o Habblaud est\xE1 l\xE1 com outra espera; rode npm run codex:install sem --conta para alinhar.": "! {0}: Habblaud is there with a different wait; run npm run codex:install without --conta to align.",
    "Pronto. Falta um passo: abra o Codex e aprove os hooks do Habblaud em /hooks (o Codex s\xF3 roda hook novo": "Done. One step left: open Codex and approve the Habblaud hooks in /hooks (Codex only runs a new",
    "ou alterado depois que voc\xEA aprova). Com o Habblaud aberto no navegador, as sess\xF5es do Codex aparecem no": "or changed hook after you approve it). With Habblaud open in the browser, Codex sessions show up in the",
    "escrit\xF3rio e os pedidos de aprova\xE7\xE3o esperam sua resposta l\xE1 por at\xE9 {0} s antes de irem para o terminal.": "office and approval requests wait for your answer there for up to {0} s before going to the terminal.",
    "(A espera ou o caminho do Habblaud mudou: aprove de novo os hooks alterados em /hooks.)": "(The wait or the Habblaud path changed: approve the changed hooks again in /hooks.)",
    "Para desfazer: npm run codex:uninstall": "To undo: npm run codex:uninstall",
    "A configura\xE7\xE3o em ~/.habblaud/codex-hook.json fica (s\xF3 o hook a l\xEA).": "The config in ~/.habblaud/codex-hook.json stays (only the hook reads it).",
    "[codex] Erro: {0}": "[codex] Error: {0}",
    "[codex] Erro inesperado: {0}": "[codex] Unexpected error: {0}",
    // scripts/docker-up.ts
    "Uso: npm run docker:up [-- op\xE7\xF5es]\n\nOp\xE7\xF5es:\n  --no-build   sobe sem reconstruir a imagem\n  --down       derruba o container (o mesmo que npm run docker:down)\n  -h, --help   mostra esta ajuda\n\nVari\xE1veis: HABBLAUD_PORT (porta no host, padr\xE3o {0}), HABBLAUD_CLAUDE_DIRS\n(config dirs separados por v\xEDrgula, se as contas n\xE3o estiverem em ~/.claude*), HABBLAUD_CODEX_DIRS\n(pastas do Codex, se n\xE3o estiverem em ~/.codex* nem em CODEX_HOME) e HABBLAUD_CODEX=0 (sem o Codex).": "Usage: npm run docker:up [-- options]\n\nOptions:\n  --no-build   starts without rebuilding the image\n  --down       stops the container (same as npm run docker:down)\n  -h, --help   shows this help\n\nVariables: HABBLAUD_PORT (host port, default {0}), HABBLAUD_CLAUDE_DIRS\n(comma-separated config dirs, if the accounts aren't in ~/.claude*), HABBLAUD_CODEX_DIRS\n(Codex folders, if they aren't in ~/.codex* or CODEX_HOME) and HABBLAUD_CODEX=0 (without Codex).",
    "[docker-up] Aten\xE7\xE3o: {0}": "[docker-up] Warning: {0}",
    "uso atualizado": "usage up to date",
    "uso desatualizado": "usage outdated",
    'HABBLAUD_PORT inv\xE1lida: "{0}" (use um n\xFAmero de 1 a 65535).': 'Invalid HABBLAUD_PORT: "{0}" (use a number from 1 to 65535).',
    "  Uso de 5h/semanal ao vivo, responder e mandar mensagens pelo escrit\xF3rio: npm run mod:install (uma vez; Claude Code {0}+).": "  Live 5h/weekly usage, replying and sending messages from the office: npm run mod:install (once; Claude Code {0}+).",
    "  Em vers\xF5es anteriores do Claude Code: npm run usage:install e npm run hooks:install. Sem eles, vale o cache do /usage.": "  On earlier Claude Code versions: npm run usage:install and npm run hooks:install. Without them, the /usage cache is used.",
    "no .env": "in .env",
    "n\xE3o consegui criar {0} ({1}); o uso do statusline n\xE3o vai aparecer no container.": "couldn't create {0} ({1}); statusline usage won't show up in the container.",
    'o comando "docker" n\xE3o foi encontrado. Instale o Docker Desktop: https://www.docker.com/products/docker-desktop/': `the "docker" command wasn't found. Install Docker Desktop: https://www.docker.com/products/docker-desktop/`,
    "o Docker n\xE3o est\xE1 respondendo. Abra o Docker Desktop, espere ele terminar de iniciar e tente de novo.": "Docker isn't responding. Open Docker Desktop, wait for it to finish starting and try again.",
    'o Docker Compose v2 ("docker compose") n\xE3o est\xE1 dispon\xEDvel. Atualize o Docker Desktop.': `Docker Compose v2 ("docker compose") isn't available. Update Docker Desktop.`,
    'n\xE3o consegui rodar "docker compose {0}": {1}': `couldn't run "docker compose {0}": {1}`,
    '"docker compose {0}" falhou (c\xF3digo {1}).': '"docker compose {0}" failed (code {1}).',
    "c\xF3digo {0}": "code {0}",
    "existe um container {0} que n\xE3o \xE9 do CodeTown (imagem {1}); ele fica como est\xE1.": "there's a container {0} that isn't from CodeTown (image {1}); leaving it as is.",
    "o Compose n\xE3o criou o volume {0}; os dados do CodeTown n\xE3o foram copiados e continuam em {1}.": "Compose didn't create the volume {0}; the CodeTown data wasn't copied and is still in {1}.",
    "Copiando os dados do CodeTown (nomes dos personagens, linha do tempo e estat\xEDsticas) de {0} para {1}\u2026": "Copying CodeTown data (character names, timeline and stats) from {0} to {1}\u2026",
    "n\xE3o consegui copiar os dados do CodeTown ({0}). O escrit\xF3rio sobe sem eles; os dados continuam em {1}.\n": "couldn't copy the CodeTown data ({0}). The office starts without it; the data is still in {1}.\n",
    "  Para tentar de novo: npm run docker:down && docker volume rm {0} && npm run docker:up": "  To try again: npm run docker:down && docker volume rm {0} && npm run docker:up",
    "Dados copiados; o volume {0} ficou intacto.": "Data copied; the volume {0} was left intact.",
    "Removendo o container {0} (CodeTown, o nome antigo)\u2026": "Removing the container {0} (CodeTown, the old name)\u2026",
    "n\xE3o consegui remover o container antigo {0} ({1}). Remova com docker rm -f {2} e rode de novo.": "couldn't remove the old container {0} ({1}). Remove it with docker rm -f {2} and run again.",
    "n\xE3o consegui remover a rede antiga {0} ({1}); apague depois com docker network rm {2}.": "couldn't remove the old network {0} ({1}); delete it later with docker network rm {2}.",
    "{0} o container, ainda parado, para receber os dados do CodeTown\u2026": "{0} the container, still stopped, to receive the CodeTown data\u2026",
    "Construindo a imagem e criando": "Building the image and creating",
    "Criando": "Creating",
    "Subindo o container\u2026": "Starting the container\u2026",
    "Construindo a imagem e subindo o container\u2026": "Building the image and starting the container\u2026",
    "Subindo o container (sem reconstruir a imagem)\u2026": "Starting the container (without rebuilding the image)\u2026",
    "Derrubando o container\u2026": "Stopping the container\u2026",
    "Pronto. Os nomes dos personagens continuam guardados no volume habblaud-data.": "Done. Character names are still stored in the habblaud-data volume.",
    "j\xE1 existe um Habblaud rodando fora do Docker em {0} (npm run dev ou npm start?).\n": "a Habblaud is already running outside Docker at {0} (npm run dev or npm start?).\n",
    "Pare-o antes, ou use outra porta: HABBLAUD_PORT=4848 npm run docker:up": "Stop it first, or use another port: HABBLAUD_PORT=4848 npm run docker:up",
    "nenhuma pasta do Claude Code (com projects/ ou sessions/) foi encontrada em ~/.claude*.\n": "no Claude Code folder (with projects/ or sessions/) was found in ~/.claude*.\n",
    "  O escrit\xF3rio vai abrir vazio (d\xE1 para ligar o modo demonstra\xE7\xE3o na interface).\n": "  The office will open empty (you can turn on demo mode in the interface).\n",
    "  Se as contas estiverem em outro lugar: HABBLAUD_CLAUDE_DIRS=/caminho/conta1,/caminho/conta2 npm run docker:up": "  If the accounts are somewhere else: HABBLAUD_CLAUDE_DIRS=/path/account1,/path/account2 npm run docker:up",
    "Conta {0} ({1}): monta {2} de {3}, somente leitura.": "Account {0} ({1}): mounts {2} from {3}, read-only.",
    "{0} n\xE3o tem projects/ nem sessions/; conta ignorada.": "{0} has neither projects/ nor sessions/; account skipped.",
    "{0} \xE9 uma pasta do Codex, n\xE3o do Claude Code; conta ignorada.": "{0} is a Codex folder, not a Claude Code one; account skipped.",
    "Codex {0} ({1}): monta {2} de {3}, somente leitura.": "Codex {0} ({1}): mounts {2} from {3}, read-only.",
    "{0} ainda n\xE3o tem thread-writer-locks/: no container, sess\xE3o aberta = conversa modificada nos \xFAltimos 30 min (rode o docker:up de novo depois de usar o Codex).": "{0} doesn't have thread-writer-locks/ yet: in the container, open session = conversation modified in the last 30 min (run docker:up again after using Codex).",
    "Uso ao vivo (mod ou tap de statusline): monta {0} em {1}, somente leitura.": "Live usage (mod or statusline tap): mounts {0} at {1}, read-only.",
    "docker-compose.override.yml gerado.": "docker-compose.override.yml generated.",
    "Aguardando o Habblaud responder em {0}\u2026": "Waiting for Habblaud to respond at {0}\u2026",
    "o Habblaud n\xE3o respondeu em {0} s. Veja o que aconteceu com: npm run docker:logs": "Habblaud didn't respond within {0} s. See what happened with: npm run docker:logs",
    "Habblaud{0} no ar: {1}": "Habblaud{0} is up: {1}",
    "sess\xE3o aberta": "open session",
    "sess\xF5es abertas": "open sessions",
    "erro ao ler ({0})": "read error ({0})",
    "  Conta {0} ({1}): {2}{3}": "  Account {0} ({1}): {2}{3}",
    "  Sobrou do CodeTown; depois de conferir o escrit\xF3rio, apague com: {0}": "  Left over from CodeTown; after checking the office, delete with: {0}",
    "  Logs: npm run docker:logs \xB7 Parar: npm run docker:down": "  Logs: npm run docker:logs \xB7 Stop: npm run docker:down",
    "n\xE3o consegui conferir o mod do Habblaud ({0}).": "couldn't check the Habblaud mod ({0}).",
    "[docker-up] Erro: {0}": "[docker-up] Error: {0}",
    "[docker-up] Erro inesperado:": "[docker-up] Unexpected error:",
    // scripts/hooks-install.ts
    "Aguardando resposta no Habblaud": "Waiting for an answer in Habblaud",
    "Uso: npm run hooks:<install|uninstall|status> [-- op\xE7\xF5es]\n\n  install     acrescenta o hook de permiss\xE3o do Habblaud em cada conta (faz backup do settings.json)\n  uninstall   tira o hook do Habblaud de cada conta (os outros hooks ficam)\n  status      mostra se o hook est\xE1 instalado e se o Habblaud est\xE1 respondendo pedidos\n\nOp\xE7\xF5es:\n  --dry-run        mostra o que mudaria, sem gravar nada\n  --node <cmd>     comando do node usado no hook (padr\xE3o: detectado no PATH)\n  --port <n>       porta do Habblaud (padr\xE3o: HABBLAUD_PORT ou {0})\n  --timeout <s>    quanto o hook espera sua resposta no Habblaud antes de devolver o pedido ao terminal\n                   (padr\xE3o: {1} s)\n  -h, --help       mostra esta ajuda\n\nContas: as mesmas do servidor (~/.claude* com projects/ ou sessions/, CLAUDE_CONFIG_DIR ou\nHABBLAUD_CLAUDE_DIRS).": "Usage: npm run hooks:<install|uninstall|status> [-- options]\n\n  install     adds the Habblaud permission hook to each account (backs up settings.json)\n  uninstall   removes the Habblaud hook from each account (other hooks stay)\n  status      shows whether the hook is installed and whether Habblaud is handling requests\n\nOptions:\n  --dry-run        shows what would change, without writing anything\n  --node <cmd>     node command used in the hook (default: detected in PATH)\n  --port <n>       Habblaud port (default: HABBLAUD_PORT or {0})\n  --timeout <s>    how long the hook waits for your answer in Habblaud before handing the request back to the terminal\n                   (default: {1} s)\n  -h, --help       shows this help\n\nAccounts: the same as the server's (~/.claude* with projects/ or sessions/, CLAUDE_CONFIG_DIR or\nHABBLAUD_CLAUDE_DIRS).",
    "atualizado (novo caminho do Habblaud, do node ou das op\xE7\xF5es)": "updated (new Habblaud path, node path or options)",
    "instalado": "installed",
    "hook do Habblaud removido": "Habblaud hook removed",
    "--node precisa de um caminho.": "--node needs a path.",
    "Nenhuma conta do Claude Code encontrada (~/.claude* com projects/ ou sessions/). Use HABBLAUD_CLAUDE_DIRS se estiverem em outro lugar.": "No Claude Code account found (~/.claude* with projects/ or sessions/). Use HABBLAUD_CLAUDE_DIRS if they're somewhere else.",
    " (esse arquivo n\xE3o existe mais: o hook falha e vale s\xF3 o terminal)": " (that file no longer exists: the hook fails and only the terminal counts)",
    "! {0}: o hook aponta para {1}{2}; rode npm run hooks:install para atualizar": "! {0}: the hook points to {1}{2}; run npm run hooks:install to update",
    "\u2022 {0}: instalado ({1}; tempo limite {2} s)": "\u2022 {0}: installed ({1}; timeout {2} s)",
    "Habblaud em http://127.0.0.1:{0}: fora do ar (com ele parado, o hook sai na hora e o terminal segue normal).": "Habblaud at http://127.0.0.1:{0}: down (while it's stopped, the hook exits right away and the terminal works as usual).",
    "Habblaud em http://127.0.0.1:{0}: respondendo pedidos de permiss\xE3o (com alguma p\xE1gina aberta).": "Habblaud at http://127.0.0.1:{0}: handling permission requests (with a page open).",
    "Habblaud em http://127.0.0.1:{0}: no ar, mas responder pelo escrit\xF3rio est\xE1 desligado (porta exposta na rede ou HABBLAUD_TERMINAL=0).": "Habblaud at http://127.0.0.1:{0}: up, but answering from the office is off (port exposed on the network or HABBLAUD_TERMINAL=0).",
    "Pronto. Com o Habblaud aberto no navegador, os pedidos de permiss\xE3o aparecem no escrit\xF3rio e voc\xEA": "Done. With Habblaud open in the browser, permission requests show up in the office and you",
    "pode aprovar ou recusar por l\xE1; o di\xE1logo continua no terminal e vale o que responder primeiro.": "can approve or deny them there; the dialog stays in the terminal and whichever answer comes first wins.",
    "Sess\xF5es abertas costumam recarregar o settings.json sozinhas; se n\xE3o, reabra a sess\xE3o.": "Open sessions usually reload settings.json on their own; if not, reopen the session.",
    "Para desfazer: npm run hooks:uninstall": "To undo: npm run hooks:uninstall",
    "[hooks] Erro: {0}": "[hooks] Error: {0}",
    "[hooks] Erro inesperado: {0}": "[hooks] Unexpected error: {0}",
    // scripts/mod-install.ts
    "Uso: npm run mod:<install|uninstall|status> [-- op\xE7\xF5es]\n\n  install     instala o mod do Habblaud no Claude Code de cada conta (marketplace desta pasta + plugins)\n              e tira o que ele substitui: o tap de statusline e o hook de permiss\xE3o antigos e o mod do\n              nome antigo (codetown)\n  uninstall   tira os plugins e o marketplace do Habblaud de cada conta (e os do nome antigo, se sobraram)\n  status      mostra, por conta, o marketplace, os plugins (e vers\xF5es) e o que sobrou do jeito antigo\n\nOp\xE7\xF5es:\n  --sem-permissoes   n\xE3o instala o plugin de responder permiss\xF5es pelo escrit\xF3rio (e mant\xE9m o hook antigo)\n  --sem-mensagens    n\xE3o instala o plugin de mandar mensagens pelo escrit\xF3rio (um j\xE1 instalado continua)\n  --conta <pasta>    s\xF3 esta conta (ex.: --conta ~/.claude-conta2); pode repetir\n  --dry-run          mostra o que faria, sem instalar nem gravar nada\n  --claude <cmd>     comando do Claude Code (padr\xE3o: claude, do PATH)\n  -h, --help         mostra esta ajuda\n\nPrecisa do Claude Code {0} ou mais novo. Em vers\xF5es anteriores, use o jeito antigo:\nnpm run usage:install (uso ao vivo) e npm run hooks:install (responder permiss\xF5es); mandar mensagens pelo\nescrit\xF3rio s\xF3 existe com o mod.\n\nContas: as mesmas do servidor (~/.claude* com projects/ ou sessions/, CLAUDE_CONFIG_DIR ou\nHABBLAUD_CLAUDE_DIRS). Uso capturado em HABBLAUD_USAGE_DIR (padr\xE3o ~/.habblaud/usage).": "Usage: npm run mod:<install|uninstall|status> [-- options]\n\n  install     installs the Habblaud mod into each account's Claude Code (this folder's marketplace + plugins)\n              and removes what it replaces: the old statusline tap, the old permission hook and the mod under\n              the old name (codetown)\n  uninstall   removes the Habblaud plugins and marketplace from each account (and the old-name ones, if any are left)\n  status      shows, per account, the marketplace, the plugins (and versions) and what's left of the old way\n\nOptions:\n  --sem-permissoes   doesn't install the plugin for answering permissions from the office (and keeps the old hook)\n  --sem-mensagens    doesn't install the plugin for sending messages from the office (one already installed stays)\n  --conta <folder>   only this account (e.g. --conta ~/.claude-conta2); can be repeated\n  --dry-run          shows what it would do, without installing or writing anything\n  --claude <cmd>     Claude Code command (default: claude, from PATH)\n  -h, --help         shows this help\n\nRequires Claude Code {0} or newer. On earlier versions, use the old way:\nnpm run usage:install (live usage) and npm run hooks:install (answer permissions); sending messages from the\noffice only exists with the mod.\n\nAccounts: the same as the server's (~/.claude* with projects/ or sessions/, CLAUDE_CONFIG_DIR or\nHABBLAUD_CLAUDE_DIRS). Usage captured in HABBLAUD_USAGE_DIR (default ~/.habblaud/usage).",
    'o comando "{0}" n\xE3o foi encontrado no PATH': `the "{0}" command wasn't found in PATH`,
    '"{0} {1}" n\xE3o terminou em {2} s': `"{0} {1}" didn't finish within {2} s`,
    "{0} (nome antigo): removido": "{0} (old name): removed",
    "marketplace {0} (nome antigo): removido": "marketplace {0} (old name): removed",
    "marketplace {0}: adicionado (esta pasta)": "marketplace {0}: added (this folder)",
    "marketplace {0}: cat\xE1logo relido desta pasta": "marketplace {0}: catalog reloaded from this folder",
    "marketplace {0}: passou a apontar para esta pasta (antes: {1})": "marketplace {0}: now points to this folder (before: {1})",
    "outra origem": "another source",
    "{0}: instalado": "{0}: installed",
    "{0}: religado (estava desligado)": "{0}: re-enabled (was disabled)",
    "{0}: atualizado de {1} para {2}": "{0}: updated from {1} to {2}",
    "{0}: j\xE1 instalado na vers\xE3o {1}": "{0}: already installed at version {1}",
    "{0} j\xE1 estava instalado e continua ({1} n\xE3o o remove; para tirar: claude plugin uninstall {2})": "{0} was already installed and stays ({1} doesn't remove it; to remove it: claude plugin uninstall {2})",
    "{0}: removido": "{0}: removed",
    "{0}: n\xE3o estava instalado": "{0}: wasn't installed",
    "marketplace {0}: removido": "marketplace {0}: removed",
    "marketplace {0}: n\xE3o estava adicionado": "marketplace {0}: wasn't added",
    "tap de statusline antigo mantido (o mod n\xE3o ficou instalado)": "old statusline tap kept (the mod didn't get installed)",
    "tap de statusline antigo removido: o mod grava o uso no lugar dele ({0})": "old statusline tap removed: the mod records usage in its place ({0})",
    "tap de statusline antigo: {0} (rode npm run usage:uninstall depois de conferir)": "old statusline tap: {0} (run npm run usage:uninstall after checking)",
    "hook de permiss\xE3o antigo mantido (--sem-permissoes)": "old permission hook kept (--sem-permissoes)",
    "hook de permiss\xE3o antigo mantido (o plugin de permiss\xF5es n\xE3o ficou instalado)": "old permission hook kept (the permissions plugin didn't get installed)",
    "hook de permiss\xE3o antigo removido: o plugin {0} responde no lugar dele": "old permission hook removed: the {0} plugin answers in its place",
    "hook de permiss\xE3o antigo: {0} (rode npm run hooks:uninstall depois de conferir)": "old permission hook: {0} (run npm run hooks:uninstall after checking)",
    "{0}: n\xE3o aparece instalado na lista do Claude Code": "{0}: doesn't show as installed in the Claude Code list",
    "{0}: instalado, mas desligado (claude plugin enable {1})": "{0}: installed, but disabled (claude plugin enable {1})",
    "{0}: o Claude Code registra a vers\xE3o {1}, n\xE3o a {2} (o manifesto em mod/ est\xE1 com outra vers\xE3o?)": "{0}: Claude Code records version {1}, not {2} (does the manifest in mod/ have a different version?)",
    "rode npm run mod:install para mandar mensagens pelo escrit\xF3rio (plugin {0})": "run npm run mod:install to send messages from the office (plugin {0})",
    "ainda com o nome antigo ({0}); o docker:up n\xE3o troca sozinho: rode npm run mod:install": "still under the old name ({0}); docker:up doesn't switch it on its own: run npm run mod:install",
    "o mod est\xE1 instalado, mas o marketplace {0} sumiu; rode npm run mod:install": "the mod is installed, but the marketplace {0} is gone; run npm run mod:install",
    "o mod vem de outra pasta ({0}), ent\xE3o n\xE3o foi atualizado; para usar esta: npm run mod:install": "the mod comes from another folder ({0}), so it wasn't updated; to use this one: npm run mod:install",
    "marketplace {0}: cat\xE1logo relido": "marketplace {0}: catalog reloaded",
    "saiu com c\xF3digo {0}": "exited with code {0}",
    "marketplace {0}: n\xE3o adicionado": "marketplace {0}: not added",
    "marketplace {0}: esta pasta": "marketplace {0}: this folder",
    "marketplace {0}: outra origem ({1}); npm run mod:install aponta para esta pasta": "marketplace {0}: another source ({1}); npm run mod:install points it to this folder",
    "{0}: n\xE3o instalado": "{0}: not installed",
    "instalado{0}": "installed{0}",
    " (escopo {0})": " (scope {0})",
    "ligado": "enabled",
    "vers\xE3o {0}{1}": "version {0}{1}",
    " (esta pasta: {0}; npm run mod:install ou npm run docker:up atualiza)": " (this folder: {0}; npm run mod:install or npm run docker:up updates it)",
    "carrega {0} de {1}": "loads {0} from {1}",
    "esta pasta": "this folder",
    "! nome antigo ainda registrado: {0}; npm run mod:install troca pelo habblaud": "! old name still registered: {0}; npm run mod:install replaces it with habblaud",
    "! tap de statusline antigo ainda instalado junto com o mod: npm run mod:install tira (ou npm run usage:uninstall)": "! old statusline tap still installed alongside the mod: npm run mod:install removes it (or npm run usage:uninstall)",
    "tap de statusline antigo instalado (jeito antigo; o mod o substitui)": "old statusline tap installed (old way; the mod replaces it)",
    "! hook de permiss\xE3o antigo ainda no settings.json junto com o plugin: os dois respondem; npm run mod:install tira (ou npm run hooks:uninstall)": "! old permission hook still in settings.json alongside the plugin: both answer; npm run mod:install removes it (or npm run hooks:uninstall)",
    "hook de permiss\xE3o antigo instalado (jeito antigo; o plugin de permiss\xF5es o substitui)": "old permission hook installed (old way; the permissions plugin replaces it)",
    "! disableAllHooks est\xE1 ligado no settings.json desta conta: nenhum mod (nem hook) roda": "! disableAllHooks is on in this account's settings.json: no mod (or hook) runs",
    "--conta precisa da pasta da conta (ex.: --conta ~/.claude-conta2).": "--conta needs the account folder (e.g. --conta ~/.claude-conta2).",
    "--claude precisa de um comando ou caminho.": "--claude needs a command or path.",
    'package.json sem "version" em {0}': 'package.json without "version" in {0}',
    "n\xE3o consegui listar os marketplaces ({0})": "couldn't list the marketplaces ({0})",
    "n\xE3o entendi a lista de marketplaces do Claude Code": "couldn't parse Claude Code's marketplace list",
    "n\xE3o consegui listar os plugins ({0})": "couldn't list the plugins ({0})",
    "n\xE3o entendi a lista de plugins do Claude Code": "couldn't parse Claude Code's plugin list",
    "--conta {0}: pasta n\xE3o encontrada.": "--conta {0}: folder not found.",
    "\xFAltimo uso capturado h\xE1 {0} ({1})": "last usage captured {0} ago ({1})",
    "pelo mod": "via the mod",
    "pelo tap de statusline": "via the statusline tap",
    "nenhum uso capturado ainda (chega depois da pr\xF3xima resposta numa sess\xE3o aberta desta conta)": "no usage captured yet (it arrives after the next reply in an open session of this account)",
    "Nenhuma conta do Claude Code encontrada (~/.claude* com projects/ ou sessions/). Use --conta <pasta> ou HABBLAUD_CLAUDE_DIRS.": "No Claude Code account found (~/.claude* with projects/ or sessions/). Use --conta <folder> or HABBLAUD_CLAUDE_DIRS.",
    "N\xE3o achei {0}: esta pasta n\xE3o tem o mod (vers\xE3o antiga do Habblaud? rode git pull).": "{0} not found: this folder doesn't have the mod (old Habblaud version? run git pull).",
    "N\xE3o consegui rodar o Claude Code: {0}.": "Couldn't run Claude Code: {0}.",
    "Instale o Claude Code (https://code.claude.com) ou diga onde ele est\xE1: npm run mod:<comando> -- --claude <caminho>": "Install Claude Code (https://code.claude.com) or say where it is: npm run mod:<command> -- --claude <path>",
    '! N\xE3o entendi a vers\xE3o do Claude Code ("{0}"); sigo assim mesmo.': `! Couldn't parse the Claude Code version ("{0}"); continuing anyway.`,
    "O mod precisa do Claude Code {0} ou mais novo, e este \xE9 o {1}.": "The mod requires Claude Code {0} or newer, and this one is {1}.",
    "Atualize o Claude Code (claude update) e rode de novo. Ou use o jeito antigo, que funciona em vers\xF5es anteriores:": "Update Claude Code (claude update) and run again. Or use the old way, which works on earlier versions:",
    "  npm run usage:install    # uso de 5h/semanal ao vivo (tap de statusline)": "  npm run usage:install    # live 5h/weekly usage (statusline tap)",
    "  npm run hooks:install    # responder pedidos de permiss\xE3o pelo escrit\xF3rio": "  npm run hooks:install    # answer permission requests from the office",
    "Claude Code {0}{1} \xB7 Habblaud {2} em {3}": "Claude Code {0}{1} \xB7 Habblaud {2} in {3}",
    "(vers\xE3o desconhecida)": "(unknown version)",
    " \u2014 o mod precisa do {0}+": " \u2014 the mod requires {0}+",
    "\u2713 pasta do uso criada: {0}": "\u2713 usage folder created: {0}",
    "! n\xE3o consegui criar {0} ({1}); o uso ao vivo n\xE3o vai ser gravado": "! couldn't create {0} ({1}); live usage won't be recorded",
    "    \u2717 settings.json: {0}": "    \u2717 settings.json: {0}",
    "  ~ {0} (simula\xE7\xE3o: claude {1})": "  ~ {0} (dry run: claude {1})",
    "  \u2717 {0}: falhou ({1})": "  \u2717 {0}: failed ({1})",
    "  ! nome antigo ainda registrado: {0}; rode npm run mod:install de novo (ou confira com npm run mod:status)": "  ! old name still registered: {0}; run npm run mod:install again (or check with npm run mod:status)",
    "  \u2717 settings.json: {0}; o tap e o hook antigos n\xE3o foram conferidos": "  \u2717 settings.json: {0}; the old tap and hook weren't checked",
    "  ! disableAllHooks est\xE1 ligado no settings.json desta conta: o mod n\xE3o roda at\xE9 voc\xEA desligar": "  ! disableAllHooks is on in this account's settings.json: the mod won't run until you turn it off",
    "  ~ {0} (simula\xE7\xE3o: nada gravado)": "  ~ {0} (dry run: nothing written)",
    "    backup do settings.json em {0}": "    settings.json backup in {0}",
    "  \u2717 n\xE3o consegui gravar o settings.json ({0}); o tap e o hook antigos continuam": "  \u2717 couldn't write settings.json ({0}); the old tap and hook remain",
    "Pronto. Sess\xF5es novas do Claude Code j\xE1 carregam o mod; nas que j\xE1 est\xE3o abertas, rode /reload-plugins (ou": "Done. New Claude Code sessions already load the mod; in sessions already open, run /reload-plugins (or",
    "reabra a sess\xE3o). O uso de 5h/semanal chega ao Habblaud depois da pr\xF3xima resposta de cada sess\xE3o.": "reopen the session). The 5h/weekly usage reaches Habblaud after each session's next reply.",
    "Para conferir: npm run mod:status \xB7 Para desfazer: npm run mod:uninstall": "To check: npm run mod:status \xB7 To undo: npm run mod:uninstall",
    "Pronto. Sess\xF5es j\xE1 abertas continuam com o mod at\xE9 /reload-plugins (ou at\xE9 reabrir a sess\xE3o).": "Done. Sessions already open keep the mod until /reload-plugins (or until the session is reopened).",
    "Para voltar ao jeito antigo (Claude Code anterior ao 2.1.287): npm run usage:install e npm run hooks:install": "To go back to the old way (Claude Code before 2.1.287): npm run usage:install and npm run hooks:install",
    "Habblaud em http://127.0.0.1:{0}": "Habblaud at http://127.0.0.1:{0}",
    "{0}: fora do ar (o mod segue gravando o uso; os pedidos de permiss\xE3o ficam s\xF3 no terminal).": "{0}: down (the mod keeps recording usage; permission requests stay in the terminal only).",
    "{0}: no ar e respondendo pedidos de permiss\xE3o (com alguma p\xE1gina aberta).": "{0}: up and handling permission requests (with a page open).",
    "{0}: no ar, mas responder pelo escrit\xF3rio est\xE1 desligado (porta exposta na rede ou HABBLAUD_TERMINAL=0).": "{0}: up, but answering from the office is off (port exposed on the network or HABBLAUD_TERMINAL=0).",
    "Mensagens pelo escrit\xF3rio: ligadas (chegam \xE0s sess\xF5es abertas com o plugin {0}).": "Messages from the office: on (they reach open sessions with the {0} plugin).",
    "Mensagens pelo escrit\xF3rio: desligadas no Habblaud (porta exposta na rede, HABBLAUD_TERMINAL=0 ou HABBLAUD_MENSAGENS=0).": "Messages from the office: off in Habblaud (port exposed on the network, HABBLAUD_TERMINAL=0 or HABBLAUD_MENSAGENS=0).",
    "n\xE3o consegui consultar o Claude Code ({0}); o mod n\xE3o foi conferido.": "couldn't query Claude Code ({0}); the mod wasn't checked.",
    "mod na {0}: {1}": "mod on {0}: {1}",
    "Dica para a {0}: {1}": "Tip for {0}: {1}",
    "n\xE3o consegui atualizar o mod na {0}: {1} ({2}). Tente: npm run mod:install": "couldn't update the mod on {0}: {1} ({2}). Try: npm run mod:install",
    "Mod atualizado para {0} na {1}; sess\xF5es abertas: /reload-plugins": "Mod updated to {0} on {1}; open sessions: /reload-plugins",
    "[mod] Erro: {0}": "[mod] Error: {0}",
    "[mod] Erro inesperado: {0}": "[mod] Unexpected error: {0}",
    // scripts/statusline-install.ts
    "Uso: npm run usage:<install|uninstall|status> [-- op\xE7\xF5es]\n\n  install     envolve o statusline de cada conta com o tap do Habblaud (faz backup do settings.json)\n  uninstall   restaura o statusline original de cada conta\n  status      mostra se o tap est\xE1 instalado e quando chegou o \xFAltimo uso de cada conta\n\nOp\xE7\xF5es:\n  --dry-run        mostra o que mudaria, sem gravar nada\n  --node <cmd>     comando do node usado no statusline (padr\xE3o: detectado no PATH)\n  -h, --help       mostra esta ajuda\n\nContas: as mesmas do servidor (~/.claude* com projects/ ou sessions/, CLAUDE_CONFIG_DIR ou\nHABBLAUD_CLAUDE_DIRS). Uso capturado em HABBLAUD_USAGE_DIR (padr\xE3o ~/.habblaud/usage).": "Usage: npm run usage:<install|uninstall|status> [-- options]\n\n  install     wraps each account's statusline with the Habblaud tap (backs up settings.json)\n  uninstall   restores each account's original statusline\n  status      shows whether the tap is installed and when each account's last usage arrived\n\nOptions:\n  --dry-run        shows what would change, without writing anything\n  --node <cmd>     node command used in the statusline (default: detected in PATH)\n  -h, --help       shows this help\n\nAccounts: the same as the server's (~/.claude* with projects/ or sessions/, CLAUDE_CONFIG_DIR or\nHABBLAUD_CLAUDE_DIRS). Usage captured in HABBLAUD_USAGE_DIR (default ~/.habblaud/usage).",
    "statusLine em formato desconhecido; nada foi alterado": "statusLine in an unknown format; nothing was changed",
    "sem statusline antes: criado um que s\xF3 captura o uso (n\xE3o imprime nada)": "no statusline before: created one that only captures usage (prints nothing)",
    'statusLine do tipo "{0}" n\xE3o \xE9 suportado; nada foi alterado': `statusLine of type "{0}" isn't supported; nothing was changed`,
    "statusLine sem comando; nada foi alterado": "statusLine without a command; nothing was changed",
    "o comando j\xE1 menciona o tap, mas n\xE3o no formato esperado; confira \xE0 m\xE3o": "the command already mentions the tap, but not in the expected format; check it by hand",
    "atualizado (novo caminho do Habblaud ou do node)": "updated (new Habblaud or node path)",
    "instalado na frente de: {0}": "installed in front of: {0}",
    "o comando menciona o tap, mas n\xE3o no formato esperado; confira \xE0 m\xE3o": "the command mentions the tap, but not in the expected format; check it by hand",
    "statusline criado pelo Habblaud removido": "statusline created by Habblaud removed",
    "{0} dias": "{0} days",
    "n\xE3o consegui ler ({0})": "couldn't read ({0})",
    "n\xE3o \xE9 um objeto JSON; nada foi alterado": "not a JSON object; nothing was changed",
    "JSON inv\xE1lido; nada foi alterado": "invalid JSON; nothing was changed",
    "o arquivo mudou desde a leitura; nada foi alterado, rode o comando de novo": "the file changed since it was read; nothing was changed, run the command again",
    "~ ~/.{0} (nome antigo) vai para ~/.habblaud (simula\xE7\xE3o: nada movido)": "~ ~/.{0} (old name) goes to ~/.habblaud (dry run: nothing moved)",
    " (na frente de: {0})": " (in front of: {0})",
    " (sem statusline original)": " (no original statusline)",
    "n\xE3o instalado (statusline atual: {0})": "not installed (current statusline: {0})",
    "n\xE3o instalado (sem statusline)": "not installed (no statusline)",
    "! {0}: o tap aponta para {1}; rode npm run usage:install para atualizar": "! {0}: the tap points to {1}; run npm run usage:install to update",
    "\xFAltimo uso capturado h\xE1 {0}{1}{2}": "last usage captured {0} ago{1}{2}",
    " \xB7 semana {0}%": " \xB7 week {0}%",
    "nenhum uso capturado ainda (o Claude Code envia os limites depois da primeira resposta numa sess\xE3o aberta)": "no usage captured yet (Claude Code sends the limits after the first reply in an open session)",
    "nenhum uso capturado": "no usage captured",
    "Pronto. Os n\xFAmeros aparecem no Habblaud depois da pr\xF3xima resposta de cada sess\xE3o. Sess\xF5es j\xE1": "Done. The numbers show up in Habblaud after each session's next reply. Sessions that are already",
    "abertas costumam recarregar o settings.json sozinhas; se o uso n\xE3o aparecer, reabra a sess\xE3o.": "open usually reload settings.json on their own; if usage doesn't show up, reopen the session.",
    "Uso capturado em {0}. Para desfazer: npm run usage:uninstall": "Usage captured in {0}. To undo: npm run usage:uninstall",
    "[usage] Erro: {0}": "[usage] Error: {0}",
    "[usage] Erro inesperado: {0}": "[usage] Unexpected error: {0}",
    // client/src/ui/drawer.ts e daystats.ts (textos do terminal interativo e do Meu dia)
    "Nova sess\xE3o": "New session",
    "Abre um Claude Code novo nesta pasta, num terminal interativo": "Opens a new Claude Code in this folder, in an interactive terminal",
    "em {0}": "in {0}",
    // client/src/ui/deliveries.ts
    "1 passo": "1 step",
    "{0} passos": "{0} steps",
    "1 arquivo alterado": "1 file changed",
    "{0} arquivos alterados": "{0} files changed",
    "IMG": "IMG",
    "V\xCDDEO": "VIDEO",
    "P\xC1GINA": "PAGE",
    "TEXTO": "TEXT",
    "ARQ": "FILE",
    "Entregas: o que os agentes terminaram": "Deliveries: what the agents finished",
    "Entregas": "Deliveries",
    "Carregando as entregas\u2026": "Loading deliveries\u2026",
    "Fechar": "Close",
    "O que cada agente terminou, em poucas palavras. Toque para ver o pedido, a resposta e os anexos.": "What each agent finished, in a few words. Tap to see the request, the response, and the attachments.",
    "Entrega": "Delivery",
    "Abrir": "Open",
    "Anterior": "Previous",
    "Pr\xF3ximo": "Next",
    "Anexo": "Attachment",
    "n\xE3o deu para carregar": "couldn't load",
    "Entregas: {0} novas": "Deliveries: {0} new",
    "Entregas: 1 nova": "Deliveries: 1 new",
    "N\xE3o deu para carregar: {0}": "Couldn't load: {0}",
    "Nenhuma entrega nos \xFAltimos 7 dias.": "No deliveries in the last 7 days.",
    "nova": "new",
    "Em resumo": "In short",
    "Pedido": "Request",
    "(sem texto)": "(no text)",
    "Resposta completa": "Full response",
    "{0} de {1}": "{0} of {1}",
    "N\xE3o deu para abrir: {0}": "Couldn't open: {0}",
    "Baixar": "Download",
    "N\xE3o deu para abrir este anexo (o arquivo mudou de lugar ou o computador n\xE3o respondeu).": "Couldn't open this attachment (the file was moved or the computer didn't respond).",
    "{0} entregou": "{0} delivered",
    "Um agente entregou": "An agent delivered",
    // client/src/ui/dictation.ts
    "Ditado em portugu\xEAs: confira o texto.": "Dictated in Portuguese: check the text.",
    "Ditado em ingl\xEAs: confira o texto.": "Dictated in English: check the text.",
    "Ditado em espanhol: confira o texto.": "Dictated in Spanish: check the text.",
    "Ditado pronto: confira o texto.": "Dictation ready: check the text.",
    "n\xE3o deu para ler a grava\xE7\xE3o": "couldn't read the recording",
    "Ditar": "Dictate",
    "Ditar (portugu\xEAs ou ingl\xEAs, o idioma \xE9 detectado sozinho)": "Dictate (Portuguese or English, the language is detected automatically)",
    "Este navegador n\xE3o deixa gravar \xE1udio aqui (precisa de HTTPS).": "This browser won't record audio here (HTTPS required).",
    "Sem permiss\xE3o para o microfone: libere nas configura\xE7\xF5es do navegador e tente de novo.": "No microphone permission: allow it in the browser settings and try again.",
    "N\xE3o deu para abrir o microfone.": "Couldn't open the microphone.",
    "Este navegador n\xE3o grava \xE1udio.": "This browser can't record audio.",
    "Gravando\u2026 toque no microfone de novo para parar.": "Recording\u2026 tap the microphone again to stop.",
    "Gravando\u2026 fale em portugu\xEAs ou ingl\xEAs e toque em Parar.": "Recording\u2026 speak Portuguese or English and tap Stop.",
    "Parar {0}": "Stop {0}",
    "N\xE3o ouvi nada: tente de novo, mais perto do microfone.": "I didn't hear anything: try again, closer to the microphone.",
    "Transcrevendo no computador\u2026": "Transcribing on the computer\u2026",
    "o computador n\xE3o respondeu a tempo": "the computer didn't respond in time",
    "N\xE3o entendi nada na grava\xE7\xE3o: tente de novo.": "I couldn't make out anything in the recording: try again.",
    "Ditado falhou: {0}": "Dictation failed: {0}",
    "Parar o ditado": "Stop dictation",
    "Transcrevendo": "Transcribing",
    "Transcrevendo\u2026": "Transcribing\u2026",
    // client/src/ui/drawer.ts
    "O terminal n\xE3o est\xE1 liberado no acesso remoto (HABBLAUD_REMOTE_ALLOW).": "The terminal isn't enabled for remote access (HABBLAUD_REMOTE_ALLOW).",
    // client/src/ui/settings.ts
    "N\xE3o foi poss\xEDvel sair: sem resposta do servidor.": "Couldn't sign out: no response from the server.",
    // client/src/ui/spawn.ts
    "n\xE3o deu para ler o arquivo": "couldn't read the file",
    "Projetos recentes": "Recent projects",
    "+ Outra pasta": "+ Other folder",
    "Caminho da pasta": "Folder path",
    "O que o agente deve fazer (opcional)": "What the agent should do (optional)",
    "Anexar imagens ou arquivos ao pedido": "Attach images or files to the request",
    "Anexar": "Attach",
    "Anexos": "Attachments",
    "Come\xE7ar": "Start",
    "Novo agente": "New agent",
    "Come\xE7a na hora uma sess\xE3o do Claude Code em segundo plano no computador, na pasta escolhida; as permiss\xF5es chegam aqui. Pasta que o Claude Code ainda n\xE3o conhece abre no app do Claude e espera o Enter l\xE1. Anexos v\xE3o para ~/.habblaud/attachments e o pedido leva os caminhos.": "Instantly starts a Claude Code session in the background on the computer, in the chosen folder; permissions come here. A folder Claude Code doesn't know yet opens in the Claude app and waits for Enter there. Attachments go to ~/.habblaud/attachments and the request includes their paths.",
    "No m\xE1ximo {0} anexos por pedido.": "At most {0} attachments per request.",
    "{0} passa de {1} MB.": "{0} is over {1} MB.",
    "Tirar {0}": "Remove {0}",
    "Espere o ditado terminar.": "Wait for the dictation to finish.",
    "Escolha o projeto.": "Choose the project.",
    "Enviando anexos ({0} de {1})\u2026": "Sending attachments ({0} of {1})\u2026",
    "Enviando o anexo\u2026": "Sending the attachment\u2026",
    "Come\xE7ando no computador\u2026": "Starting on the computer\u2026",
    "Rodando: a sess\xE3o j\xE1 come\xE7ou no computador e aparece no escrit\xF3rio em instantes.": "Running: the session has started on the computer and will show up in the office in a moment.",
    "Abri no app do Claude: aperte Enter l\xE1 para come\xE7ar. N\xE3o rodou sozinho: {0}.": "Opened in the Claude app: press Enter there to start. It didn't run on its own: {0}.",
    "Abri no app do Claude: aperte Enter l\xE1 para come\xE7ar.": "Opened in the Claude app: press Enter there to start.",
    "Agente novo rodando.": "New agent running.",
    "Agente novo aberto no app do Claude.": "New agent opened in the Claude app.",
    "N\xE3o abriu: {0}": "Didn't open: {0}",
    "O computador n\xE3o confirmou a abertura.": "The computer didn't confirm it opened.",
    // client/src/ui/terminal.ts
    "{0} \xB7 responda no Codex: este pedido n\xE3o chegou ao Habblaud ou passou do tempo de espera": "{0} \xB7 answer in Codex: this request didn't reach Habblaud or timed out",
    "{0} \xB7 responda no Claude Code: este pedido n\xE3o chegou ao Habblaud ou passou do tempo de espera": "{0} \xB7 answer in Claude Code: this request didn't reach Habblaud or timed out",
    // client/src/ui/topbar.ts
    "Novo agente: come\xE7a uma sess\xE3o do Claude Code no computador": "New agent: starts a Claude Code session on the computer",
    // server/deliveries/deliveries.ts
    "Tela capturada pelo agente": "Screenshot taken by the agent",
    // server/deliveries/fetcher.ts
    "arquivo n\xE3o encontrado": "file not found",
    "o auxiliar do computador (npm run codex:bridge) n\xE3o est\xE1 rodando": "the computer's helper (npm run codex:bridge) isn't running",
    "arquivos demais sendo buscados: tente de novo": "too many files being fetched: try again",
    "o computador n\xE3o leu o arquivo": "the computer couldn't read the file",
    "arquivo ileg\xEDvel": "unreadable file",
    // server/deliveries/files.ts
    "caminho inv\xE1lido": "invalid path",
    "tipo de arquivo que n\xE3o se mostra aqui": "file type that can't be shown here",
    "arquivo protegido": "protected file",
    "n\xE3o \xE9 um arquivo": "not a file",
    "arquivo grande demais para ver aqui": "file too large to view here",
    // server/dictation/dictation.ts
    "formato de \xE1udio desconhecido": "unknown audio format",
    "\xE1udio ileg\xEDvel": "unreadable audio",
    "grava\xE7\xE3o curta demais": "recording too short",
    "grava\xE7\xE3o longa demais (at\xE9 uns 3 minutos)": "recording too long (up to about 3 minutes)",
    "ditado indispon\xEDvel: o Whisper n\xE3o est\xE1 instalado no computador ou o auxiliar (npm run codex:bridge) parou": "dictation unavailable: Whisper isn't installed on the computer or the helper (npm run codex:bridge) stopped",
    "ditados demais esperando: aguarde o anterior": "too many dictations waiting: wait for the previous one",
    "o auxiliar n\xE3o transcreveu": "the helper didn't transcribe",
    "\xE1udio perdido": "audio lost",
    "o Whisper falhou": "Whisper failed",
    "o auxiliar do computador n\xE3o buscou o \xE1udio": "the computer's helper didn't fetch the audio",
    "a transcri\xE7\xE3o demorou demais": "transcription took too long",
    // server/dictation/whisper.ts
    "um modelo multil\xEDngue do Whisper (ggml-small.bin ou ggml-base.bin em ~/.local/share/whisper)": "a multilingual Whisper model (ggml-small.bin or ggml-base.bin in ~/.local/share/whisper)",
    "falhou": "failed",
    "n\xE3o deu para ler o \xE1udio ({0})": "couldn't read the audio ({0})",
    "o Whisper falhou ({0})": "Whisper failed ({0})",
    // server/http/app.ts
    "n\xE3o liberado no acesso remoto (veja HABBLAUD_REMOTE_ALLOW)": "not allowed over remote access (see HABBLAUD_REMOTE_ALLOW)",
    "esperado {enabled: boolean}": "expected {enabled: boolean}",
    "rota s\xF3 do pr\xF3prio computador (hooks, plugins e o auxiliar do host)": "route only for the computer running Habblaud (hooks, plugins and the host helper)",
    "novo agente pelo escrit\xF3rio desligado": "new agent from the office disabled",
    "agentes novos s\xF3 s\xE3o abertos pelo pr\xF3prio computador (http://localhost)": "new agents can only be opened from the computer running Habblaud (http://localhost)",
    "anexos desligados": "attachments disabled",
    "ditado desligado": "dictation disabled",
    "o ditado s\xF3 funciona pelo pr\xF3prio computador (http://localhost)": "dictation only works from the computer running Habblaud (http://localhost)",
    "ditado desconhecido": "unknown dictation",
    "entregas desligadas (precisam do terminal: acesso local)": "deliveries disabled (they need the terminal: local access)",
    "as entregas s\xF3 abrem pelo pr\xF3prio computador (http://localhost)": "deliveries only open from the computer running Habblaud (http://localhost)",
    "anexo desconhecido: atualize a lista de entregas": "unknown attachment: refresh the deliveries list",
    "arquivos desligados": "files disabled",
    "s\xF3 o auxiliar do pr\xF3prio computador": "only the helper on the computer running Habblaud",
    "esperado {id, name}": "expected {id, name}",
    // server/http/remote.ts
    "acesso remoto desligado: senha em texto puro (HABBLAUD_REMOTE_PASSWORD) n\xE3o \xE9 aceita; rode npm run remote:setup": "remote access off: a plain-text password (HABBLAUD_REMOTE_PASSWORD) isn't accepted; run npm run remote:setup",
    "acesso remoto desligado: faltam HABBLAUD_REMOTE_USER e HABBLAUD_REMOTE_PASSWORD_HASH; rode npm run remote:setup": "remote access off: HABBLAUD_REMOTE_USER and HABBLAUD_REMOTE_PASSWORD_HASH are missing; run npm run remote:setup",
    "acesso remoto desligado: HABBLAUD_REMOTE_PASSWORD_HASH inv\xE1lido; rode npm run remote:setup": "remote access off: invalid HABBLAUD_REMOTE_PASSWORD_HASH; run npm run remote:setup",
    "acesso remoto desligado: sem certificado em {0} (HTTPS \xE9 obrigat\xF3rio); rode npm run remote:setup": "remote access off: no certificate in {0} (HTTPS is required); run npm run remote:setup",
    "Primeira vez neste celular?": "First time on this phone?",
    "Instale o certificado do Habblaud": "Install the Habblaud certificate",
    "para tirar o aviso de seguran\xE7a (confira a impress\xE3o digital que o npm run remote:setup mostrou).": "to remove the security warning (check the fingerprint that npm run remote:setup showed).",
    "Habblaud \xB7 entrar": "Habblaud \xB7 sign in",
    "Acesso pelo celular. Entre com o usu\xE1rio e a senha que voc\xEA escolheu no npm run remote:setup.": "Phone access. Sign in with the username and password you chose in npm run remote:setup.",
    "Usu\xE1rio": "Username",
    "Senha": "Password",
    "Entrar": "Sign in",
    "N\xE3o deu para entrar.": "Couldn't sign in.",
    "Muitas tentativas. Tente de novo em {0} s.": "Too many attempts. Try again in {0} s.",
    "Usu\xE1rio ou senha incorretos.": "Incorrect username or password.",
    "requisi\xE7\xE3o inv\xE1lida": "invalid request",
    "sem certificado da CA": "no CA certificate",
    "fa\xE7a login: abra o Habblaud por esta porta no navegador e entre com usu\xE1rio e senha": "sign in: open Habblaud on this port in your browser and enter your username and password",
    "Acesso remoto: n\xE3o deu para escutar na porta {0} ({1}).": "Remote access: couldn't listen on port {0} ({1}).",
    "   Acesso remoto: certificado recarregado.": "   Remote access: certificate reloaded.",
    "   Acesso remoto: certificado novo ileg\xEDvel, mantendo o anterior ({0}).": "   Remote access: new certificate unreadable, keeping the previous one ({0}).",
    "Use https://": "Use https://",
    // server/index.ts
    "Erro ao responder (remoto) {0} {1}: {2}": "Error responding (remote) to {0} {1}: {2}",
    "s\xF3 ver": "view only",
    "publicada pelo HABBLAUD_REMOTE_BIND": "published via HABBLAUD_REMOTE_BIND",
    "HTTP SEM criptografia (HABBLAUD_REMOTE_INSECURE_HTTP)": "HTTP WITHOUT encryption (HABBLAUD_REMOTE_INSECURE_HTTP)",
    "   Acesso remoto: ligado na porta {0} ({1}), {2}, com login; libera: {3}.": "   Remote access: on at port {0} ({1}), {2}, with login; allows: {3}.",
    '   Acesso remoto: "spawn" liberado, mas o Novo agente est\xE1 desligado (ligue com HABBLAUD_PTY=1).': '   Remote access: "spawn" allowed, but New agent is off (turn it on with HABBLAUD_PTY=1).',
    "   Novo agente: desligado ({0}).": "   New agent: off ({0}).",
    "ligue com HABBLAUD_PTY=1": "turn it on with HABBLAUD_PTY=1",
    "mesma trava das mensagens": "same lock as messages",
    "   Novo agente: ligado, pelo auxiliar do host (deixe npm run codex:bridge rodando no computador).": "   New agent: on, via the host helper (keep npm run codex:bridge running on the computer).",
    "   Novo agente: ligado ({0} --bg; pasta ainda n\xE3o confi\xE1vel abre no app do Claude).": "   New agent: on ({0} --bg; a folder not yet trusted opens in the Claude app).",
    "   Novo agente: ligado, s\xF3 pelo app do Claude (claude n\xE3o encontrado no PATH).": "   New agent: on, only via the Claude app (claude not found in PATH).",
    // server/remote/tls.ts
    "certificado do servidor ainda n\xE3o existe": "server certificate doesn't exist yet",
    "a CA local n\xE3o existe": "the local CA doesn't exist",
    "certificado ileg\xEDvel": "unreadable certificate",
    "certificado n\xE3o foi assinado pela CA atual": "certificate wasn't signed by the current CA",
    "certificado perto de vencer": "certificate about to expire",
    "faltam no certificado: {0}": "missing from the certificate: {0}",
    "n\xE3o achei o openssl ({0}); instale-o e rode de novo": "couldn't find openssl ({0}); install it and run again",
    "openssl {0} falhou: {1}": "openssl {0} failed: {1}",
    "a CA local n\xE3o existe: rode npm run remote:setup": "the local CA doesn't exist: run npm run remote:setup",
    "a CA local n\xE3o cobre {0}: rode npm run remote:setup (ele cria uma CA nova)": "the local CA doesn't cover {0}: run npm run remote:setup (it creates a new CA)",
    "CA nova": "new CA",
    // server/spawn/attachments.ts
    "arquivo vazio": "empty file",
    "arquivo ileg\xEDvel (base64)": "unreadable file (base64)",
    "o arquivo passa de {0} MB": "the file exceeds {0} MB",
    "anexos demais esperando: envie o pedido ou tente de novo daqui a pouco": "too many attachments waiting: send the request or try again shortly",
    "anexos inv\xE1lidos": "invalid attachments",
    "no m\xE1ximo {0} anexos por pedido": "at most {0} attachments per request",
    "um anexo expirou: anexe de novo": "an attachment expired: attach it again",
    "Anexo enviado pelo Habblaud (leia antes de come\xE7ar):": "Attachment sent via Habblaud (read it before starting):",
    "Anexos enviados pelo Habblaud (leia antes de come\xE7ar):": "Attachments sent via Habblaud (read them before starting):",
    // server/spawn/spawn.ts
    "escolha uma pasta (caminho absoluto, ex.: /Users/voce/projeto)": "choose a folder (absolute path, e.g. /Users/you/project)",
    "o pedido passa de {0} caracteres": "the request exceeds {0} characters",
    "o claude n\xE3o come\xE7ou a sess\xE3o": "claude didn't start the session",
    "a pasta ainda n\xE3o \xE9 confi\xE1vel para o Claude Code: rode `claude` nela uma vez no computador e aceite o aviso": "the folder isn't trusted by Claude Code yet: run `claude` in it once on the computer and accept the warning",
    "falhou ao abrir o app": "couldn't open the app",
    "{0}; e o app n\xE3o abriu ({1})": "{0}; and the app didn't open ({1})",
    "n\xE3o \xE9 uma pasta": "not a folder",
    "pasta n\xE3o encontrada neste computador": "folder not found on this computer",
    "o auxiliar do computador n\xE3o est\xE1 rodando: deixe npm run codex:bridge no ar (o Habblaud est\xE1 no Docker)": "the computer's helper isn't running: keep npm run codex:bridge running (Habblaud is in Docker)",
    "j\xE1 h\xE1 {0} agentes novos esperando para abrir": "there are already {0} new agents waiting to open",
    "o auxiliar n\xE3o abriu o app": "the helper didn't open the app",
    "n\xE3o deu para gravar os anexos ({0})": "couldn't save the attachments ({0})",
    "o auxiliar do computador n\xE3o buscou o pedido": "the computer's helper didn't fetch the request",
    "o auxiliar do computador n\xE3o confirmou": "the computer's helper didn't confirm",
    // scripts/codex-bridge.ts
    "Uso: npm run codex:bridge [-- op\xE7\xF5es]\n\nEntrega as mensagens do escrit\xF3rio \xE0s sess\xF5es do Codex quando o Habblaud roda no Docker (deixe rodando no computador).\n\nOp\xE7\xF5es:\n  --port <n>   porta do Habblaud (padr\xE3o: HABBLAUD_PORT ou {0})\n  --once       faz uma rodada s\xF3 e sai\n  -h, --help   mostra esta ajuda\n\nBin\xE1rio do Codex: HABBLAUD_CODEX_BIN ou `codex` do PATH.": "Usage: npm run codex:bridge [-- options]\n\nDelivers office messages to Codex sessions when Habblaud runs in Docker (keep it running on the computer).\n\nOptions:\n  --port <n>   Habblaud port (default: HABBLAUD_PORT or {0})\n  --once       runs a single pass and exits\n  -h, --help   shows this help\n\nCodex binary: HABBLAUD_CODEX_BIN or `codex` from PATH.",
    "anexo ileg\xEDvel": "unreadable attachment",
    "anexo vazio ou grande demais": "attachment empty or too large",
    "\u2713 agente novo rodando em segundo plano em {0}": "\u2713 new agent in {0} running in the background",
    "\u2713 agente novo rodando em segundo plano em {0} com {1} anexos": "\u2713 new agent in {0} running in the background with {1} attachments",
    "\u2713 agente novo rodando em segundo plano em {0} com 1 anexo": "\u2713 new agent in {0} running in the background with 1 attachment",
    "\u2713 agente novo aberto no app do Claude em {0} (n\xE3o rodou sozinho: {1})": "\u2713 new agent in {0} opened in the Claude app (didn't run on its own: {1})",
    "\u2713 agente novo aberto no app do Claude em {0} com {1} anexos (n\xE3o rodou sozinho: {2})": "\u2713 new agent in {0} opened in the Claude app with {1} attachments (didn't run on its own: {2})",
    "\u2713 agente novo aberto no app do Claude em {0} com 1 anexo (n\xE3o rodou sozinho: {1})": "\u2713 new agent in {0} opened in the Claude app with 1 attachment (didn't run on its own: {1})",
    "\u2713 agente novo aberto no app do Claude em {0}": "\u2713 new agent in {0} opened in the Claude app",
    "\u2713 agente novo aberto no app do Claude em {0} com {1} anexos": "\u2713 new agent in {0} opened in the Claude app with {1} attachments",
    "\u2713 agente novo aberto no app do Claude em {0} com 1 anexo": "\u2713 new agent in {0} opened in the Claude app with 1 attachment",
    "pedido inv\xE1lido": "invalid request",
    "\u2717 agente novo recusado: {0}": "\u2717 new agent rejected: {0}",
    "\u2717 agente novo em {0}: {1}": "\u2717 new agent in {0}: {1}",
    "\u2713 ditado transcrito ({0}, {1} s)": "\u2713 dictation transcribed ({0}, {1} s)",
    "\u2717 ditado: {0}": "\u2717 dictation: {0}",
    "fora das pastas de projeto conhecidas": "outside the known project folders",
    "\u2717 arquivo de entrega recusado: {0}": "\u2717 delivery file rejected: {0}",
    "Entregando as mensagens do Habblaud (http://127.0.0.1:{0}) \xE0s sess\xF5es do Codex com {1}, e come\xE7ando os agentes novos pedidos no escrit\xF3rio. Ctrl+C para parar.": "Delivering Habblaud messages (http://127.0.0.1:{0}) to Codex sessions with {1}, and starting the new agents requested in the office. Ctrl+C to stop.",
    "Sem o Codex (codex no PATH ou HABBLAUD_CODEX_BIN): s\xF3 come\xE7o os agentes novos pedidos no Habblaud (http://127.0.0.1:{0}). Ctrl+C para parar.": "No Codex (codex in PATH or HABBLAUD_CODEX_BIN): only starting the new agents requested in Habblaud (http://127.0.0.1:{0}). Ctrl+C to stop.",
    "Agentes novos rodam em segundo plano com {0} --bg (pasta confi\xE1vel; sen\xE3o, no app do Claude).": "New agents run in the background with {0} --bg (trusted folder; otherwise, in the Claude app).",
    "Sem o claude no PATH (ou HABBLAUD_CLAUDE_BIN): agentes novos abrem no app do Claude e esperam o Enter.": "No claude in PATH (or HABBLAUD_CLAUDE_BIN): new agents open in the Claude app and wait for Enter.",
    "Ditado desligado: falta {0}.": "Dictation off: {0} is missing.",
    "Ditado: Whisper local ({0}), idiomas {1} detectados sozinhos.": "Dictation: local Whisper ({0}), languages {1} auto-detected.",
    "conectado ao Habblaud.": "connected to Habblaud.",
    // scripts/docker-up.ts
    "acesso remoto configurado, mas sem a CA local: rode npm run remote:setup.": "remote access configured, but no local CA: run npm run remote:setup.",
    "Acesso remoto: certificado do servidor renovado ({0}).": "Remote access: server certificate renewed ({0}).",
    "Acesso remoto: monta {0} em {1}, somente leitura.": "Remote access: mounts {0} at {1}, read-only.",
    "acesso remoto: n\xE3o consegui conferir o certificado ({0}).": "remote access: couldn't check the certificate ({0}).",
    "Acesso remoto: publica {0} (porta {1} do container).": "Remote access: publishes {0} (container port {1}).",
    // scripts/hooks-install.ts
    "--timeout precisa de um n\xFAmero de segundos entre 5 e 86400 (24 h).": "--timeout needs a number of seconds between 5 and 86400 (24 h).",
    // scripts/remote-mdns.ts
    "[remote-mdns] sem HABBLAUD_REMOTE_NAME v\xE1lido no .env: rode npm run remote:setup.": "[remote-mdns] no valid HABBLAUD_REMOTE_NAME in .env: run npm run remote:setup.",
    "[remote-mdns] sem rede: an\xFAncio suspenso.": "[remote-mdns] no network: announcement paused.",
    "[remote-mdns] {0} sem suporte: use o IP ou um endere\xE7o no DNS do roteador.": "[remote-mdns] {0} not supported: use the IP or an address in the router's DNS.",
    "[remote-mdns] n\xE3o deu para rodar {0}: {1}": "[remote-mdns] couldn't run {0}: {1}",
    "[remote-mdns] anunciando {0}.local -> {1}": "[remote-mdns] announcing {0}.local -> {1}",
    // scripts/remote-setup.ts
    "Uso: npm run remote:setup [-- op\xE7\xF5es]\n\nLiga o acesso pelo celular (https://<nome>.local) com usu\xE1rio, senha e HTTPS.\n\n  --user <nome>        usu\xE1rio do login (padr\xE3o: o seu usu\xE1rio do sistema)\n  --name <nome>        endere\xE7o <nome>.local (padr\xE3o: habblaud)\n  --domain <endere\xE7o>  endere\xE7o pr\xF3prio, ex.: meuclaude.home (precisa de uma entrada no DNS do roteador)\n  --port <n>           porta no computador (padr\xE3o: 443 se estiver livre, sen\xE3o 4748)\n  --allow <lista>      o que o celular pode fazer: permissions, messages, terminal, spawn, none (padr\xE3o: permissions)\n  --password-stdin     l\xEA a senha da entrada padr\xE3o (automa\xE7\xE3o), em vez de perguntar\n  --no-service         n\xE3o instala o servi\xE7o do an\xFAncio <nome>.local (rode npm run remote:mdns voc\xEA mesmo)\n  --off                desliga o acesso pelo celular (tira as linhas do .env e o servi\xE7o; mant\xE9m a CA)": "Usage: npm run remote:setup [-- options]\n\nTurns on phone access (https://<name>.local) with username, password and HTTPS.\n\n  --user <name>        login username (default: your system username)\n  --name <name>        address <name>.local (default: habblaud)\n  --domain <address>   own address, e.g. myclaude.home (needs an entry in the router's DNS)\n  --port <n>           port on the computer (default: 443 if free, otherwise 4748)\n  --allow <list>       what the phone can do: permissions, messages, terminal, spawn, none (default: permissions)\n  --password-stdin     reads the password from standard input (automation) instead of asking\n  --no-service         doesn't install the <name>.local announcement service (run npm run remote:mdns yourself)\n  --off                turns off phone access (removes the lines from .env and the service; keeps the CA)",
    "falta o valor de {0}": "missing value for {0}",
    "op\xE7\xE3o desconhecida: {0}": "unknown option: {0}",
    "porta inv\xE1lida": "invalid port",
    "use pelo menos {0} caracteres": "use at least {0} characters",
    "sem espa\xE7os no come\xE7o ou no fim": "no spaces at the start or end",
    "a senha n\xE3o pode ser o usu\xE1rio": "the password can't be the username",
    "sem terminal para perguntar a senha: use --password-stdin": "no terminal to ask for the password: use --password-stdin",
    "servi\xE7o {0} ligado (log: ~/.habblaud/logs/remote-mdns.log)": "service {0} enabled (log: ~/.habblaud/logs/remote-mdns.log)",
    "n\xE3o consegui ligar o servi\xE7o: {0}": "couldn't enable the service: {0}",
    "Habblaud: anuncia o endere\xE7o .local do acesso pelo celular": "Habblaud: announces the .local address for phone access",
    "servi\xE7o habblaud-remote-mdns ligado (para seguir ligado sem login: loginctl enable-linger)": "habblaud-remote-mdns service enabled (to keep it on while logged out: loginctl enable-linger)",
    "{0}: sem servi\xE7o autom\xE1tico; deixe npm run remote:mdns rodando ou use o IP": "{0}: no automatic service; keep npm run remote:mdns running or use the IP",
    "[remote-setup] Acesso pelo celular desligado (a CA continua em ~/.habblaud/remote-tls). Agora: npm run docker:up": "[remote-setup] Phone access turned off (the CA stays in ~/.habblaud/remote-tls). Now: npm run docker:up",
    "Usu\xE1rio do login": "Login username",
    "usu\xE1rio inv\xE1lido (sem espa\xE7os)": "invalid username (no spaces)",
    "senha recusada: {0}": "password rejected: {0}",
    "Senha ({0}+ caracteres; n\xE3o aparece enquanto voc\xEA digita)": "Password ({0}+ characters; hidden while you type)",
    "Repita a senha": "Repeat the password",
    "  as duas n\xE3o batem; de novo.": "  they don't match; try again.",
    "Nome do endere\xE7o (vira <nome>.local)": "Address name (becomes <name>.local)",
    'nome inv\xE1lido: "{0}" (letras, n\xFAmeros e h\xEDfen)': 'invalid name: "{0}" (letters, numbers and hyphens)',
    "Endere\xE7o pr\xF3prio, opcional (ex.: meuclaude.home; Enter pula)": "Own address, optional (e.g. myclaude.home; Enter skips)",
    'endere\xE7o inv\xE1lido: "{0}"': 'invalid address: "{0}"',
    "[remote-setup] Gerando o hash da senha\u2026": "[remote-setup] Generating the password hash\u2026",
    "servi\xE7o n\xE3o instalado (--no-service): rode npm run remote:mdns": "service not installed (--no-service): run npm run remote:mdns",
    " CA local nova (o endere\xE7o mudou ou a anterior n\xE3o tinha restri\xE7\xE3o de nomes): instale o certificado de novo no celular.": " New local CA (the address changed or the previous one had no name constraints): install the certificate on the phone again.",
    " CA local criada.": " Local CA created.",
    "   (ou {0})": "   (or {0})",
    "{0}   (depois de criar no roteador: {1} -> {2})": "{0}   (after creating it in the router: {1} -> {2})",
    "IP deste computador": "this computer's IP",
    "[remote-setup] Pronto.{0}": "[remote-setup] Done.{0}",
    '  .env:        usu\xE1rio "{0}", senha guardada s\xF3 como hash (scrypt), porta {1}': '  .env:        user "{0}", password stored only as a hash (scrypt), port {1}',
    "  Certificado: {0}": "  Certificate: {0}",
    "  An\xFAncio:     {0}": "  Announcing:  {0}",
    "  Agora rode:  npm run docker:up": "  Now run:     npm run docker:up",
    "  No celular (mesmo Wi-Fi):": "  On the phone (same Wi-Fi):",
    '  Primeira vez: aceite o aviso, toque em "Instale o certificado do Habblaud" e confie nele': '  First time: accept the warning, tap "Install the Habblaud certificate" and trust it',
    "    iPhone:  Ajustes > Perfil Baixado > Instalar; depois Ajustes > Geral > Sobre > Ajustes de Confian\xE7a de Certificados": "    iPhone:  Settings > Profile Downloaded > Install; then Settings > General > About > Certificate Trust Settings",
    "    Android: Configura\xE7\xF5es > Seguran\xE7a > Criptografia e credenciais > Instalar certificado > Certificado de CA": "    Android: Settings > Security > Encryption & credentials > Install a certificate > CA certificate",
    "  Impress\xE3o digital da CA (confira no celular antes de confiar):": "  CA fingerprint (check it on the phone before trusting it):",
    "(indispon\xEDvel)": "(unavailable)",
    "[remote-setup] Erro: {0}": "[remote-setup] Error: {0}",
    // client/src/ui/settings.ts
    "Sair": "Sign out",
    "Acesso pelo celular": "Phone access",
    "Sair deste aparelho": "Sign out of this device",
    "Encerra o login aqui (uma c\xF3pia do cookie tamb\xE9m deixa de valer). Para voltar, entre com usu\xE1rio e senha.": "Ends the login here (a copy of the cookie stops working too). To come back, sign in with your username and password.",
    // client/src/art/character/appearance.ts
    "N\xE3o combina com este cabelo": "Doesn't go with this hair",
    "N\xE3o combina com o bon\xE9 ou o gorro": "Doesn't go with the cap or beanie",
    "N\xE3o combina com o la\xE7o": "Doesn't go with the bow",
    // shared/world/intro.ts
    "Codo de madrugada": "I code late at night",
    "Acordo cedo para codar": "I get up early to code",
    "Movido a caf\xE9": "Powered by coffee",
    "Time do ch\xE1": "Team tea",
    "Time dos tabs": "Team tabs",
    "Time dos espa\xE7os": "Team spaces",
    "Modo escuro sempre": "Dark mode, always",
    "Modo claro, sem medo": "Light mode, no fear",
    "Vim at\xE9 o fim": "Vim till the end",
    "Testo antes de escrever": "I test before I write",
    "Entrego r\xE1pido": "I ship fast",
    "Refatorar \xE9 meu hobby": "Refactoring is my hobby",
    "F\xE3 de pixel art": "Pixel art fan",
    "Codo ouvindo m\xFAsica": "I code with music on",
    "Codo em sil\xEAncio": "I code in silence",
    "Gente de gato": "Cat person",
    "Gente de cachorro": "Dog person",
    "Vivo de c\xF3digo aberto": "Open source all the way",
    "Sempre aprendendo": "Always learning",
    "Oi, prazer!": "Hi, nice to meet you!",
    // server/config.ts, server/index.ts, server/http/app.ts e server/world/ (Habblaud World)
    "HABBLAUD_WORLD_URL n\xE3o \xE9 um endere\xE7o v\xE1lido": "HABBLAUD_WORLD_URL is not a valid address",
    "HABBLAUD_WORLD_URL com http:// (127.0.0.1 ou host.docker.internal) s\xF3 vale no modo de desenvolvimento (--dev ou HABBLAUD_WORLD_DEV=1)": "HABBLAUD_WORLD_URL with http:// (127.0.0.1 or host.docker.internal) only works in development mode (--dev or HABBLAUD_WORLD_DEV=1)",
    "HABBLAUD_WORLD_URL precisa come\xE7ar com https:// ou wss://": "HABBLAUD_WORLD_URL must start with https:// or wss://",
    "HABBLAUD_WORLD_URL deve ter s\xF3 o endere\xE7o do servidor (sem caminho, usu\xE1rio, senha ou par\xE2metros)": "HABBLAUD_WORLD_URL must contain only the server address (no path, user, password or parameters)",
    "o Habblaud World s\xF3 \xE9 usado pelo pr\xF3prio computador (http://localhost)": "Habblaud World can only be used from this computer (http://localhost)",
    "   Habblaud World: escondido (HABBLAUD_WORLD=0).": "   Habblaud World: hidden (HABBLAUD_WORLD=0).",
    "   Habblaud World: desligado (HABBLAUD_WORLD_URL recusada).": "   Habblaud World: off (HABBLAUD_WORLD_URL rejected).",
    "{0} (padr\xE3o)": "{0} (default)",
    "   Habblaud World: {0}, conta neste computador: {1}{2}.": "   Habblaud World: {0}, account on this computer: {1}{2}.",
    " (s\xF3 leitura: a trava do terminal est\xE1 desligada)": " (read-only: the terminal lock is off)",
    "esperado um objeto JSON": "expected a JSON object",
    "e-mail inv\xE1lido": "invalid email",
    "a senha precisa ter de {0} a {1} caracteres": "the password must be {0} to {1} characters long",
    "o c\xF3digo tem 6 d\xEDgitos": "the code has 6 digits",
    "nome de jogador recusado ({0})": "player name refused ({0})",
    'esperado {name?, look: "f" ou "m", parts, traits: 2 ou 3 tra\xE7os que combinam, intro}': 'expected {name?, look: "f" or "m", parts, traits: 2 or 3 traits that go together, intro}',
    "idioma desconhecido": "unknown language",
    "c\xF3digo de convite inv\xE1lido": "invalid invite code",
    "senha ausente": "missing password",
    'esperado {mode: "live" ou "discreet", closed, hideCountry, tokensVisible, leaderboard, compactions, notifyInactivity?, knocks?}': 'expected {mode: "live" or "discreet", closed, hideCountry, tokensVisible, leaderboard, compactions, notifyInactivity?, knocks?}',
    "dispositivo desconhecido": "unknown device",
    "o Habblaud World s\xF3 age pela conta com o Habblaud acess\xEDvel apenas pelo pr\xF3prio computador": "Habblaud World only acts on your account when Habblaud is reachable only from this computer",
    "Habblaud World desligado: HABBLAUD_WORLD_URL recusada (veja o log do servidor)": "Habblaud World is off: HABBLAUD_WORLD_URL was rejected (see the server log)",
    "world.json fora do formato: ignorado (entre de novo no Habblaud World).": "world.json is malformed: ignored (sign in to Habblaud World again).",
    "world.json ileg\xEDvel ({0}): ignorado (entre de novo no Habblaud World).": "world.json unreadable ({0}): ignored (sign in to Habblaud World again).",
    "N\xE3o foi poss\xEDvel gravar {0} ({1}); a sess\xE3o do Habblaud World vale s\xF3 nesta execu\xE7\xE3o.": "Couldn't write {0} ({1}); the Habblaud World session only lasts for this run.",
    // client/src/ui/world/world-popups.ts
    "Novidade: Habblaud World": "New: Habblaud World",
    "Seu escrit\xF3rio agora pode virar um pr\xE9dio numa cidade online, aceso enquanto os seus agentes trabalham.": "Your office can now become a building in an online city, lit up while your agents work.",
    "Seu escrit\xF3rio vira um pr\xE9dio numa cidade em pixel art, aceso enquanto os seus agentes trabalham.": "Your office becomes a building in a pixel-art city, lit up while your agents work.",
    "Crie um personagem, ande pela cidade e visite os pr\xE9dios de outras pessoas.": "Create a character, walk around the city and visit other people's buildings.",
    "Cumprimente quem passa e deixe likes nos pr\xE9dios, sem chat e sem spam.": "Greet passersby and like buildings, with no chat and no spam.",
    "Nada do seu trabalho sai do computador: s\xF3 o tema, quantos andares e se cada personagem est\xE1 ocupado ou \xE0 toa.": "Nothing about your work leaves your computer: only the theme, how many floors, and whether each character is busy or idle.",
    "Ver a lista": "See the list",
    "Nada \xE9 enviado enquanto voc\xEA n\xE3o criar a conta. O acesso \xE9 liberado aos poucos, por lista de espera.": "Nothing is sent until you create an account. Access opens gradually, through a waitlist.",
    "Criar conta": "Create account",
    "Agora n\xE3o": "Not now",
    "N\xE3o mostrar de novo": "Don't show again",
    "Voc\xEA est\xE1 na lista de espera": "You're on the waitlist",
    "O acesso \xE9 liberado aos poucos, em lotes. Avisamos por e-mail quando chegar a sua vez.": "Access opens gradually, in batches. We'll email you when it's your turn.",
    "Enquanto isso, o Habblaud continua normal e nada do escrit\xF3rio \xE9 enviado.": "Meanwhile, Habblaud works as usual and nothing from the office is sent.",
    "Entendi": "Got it",
    "Chegou a sua vez: crie o seu personagem e entre na cidade.": "It's your turn: create your character and enter the city.",
    // client/src/ui/world/settings-world.ts
    "\u2190 Voltar": "\u2190 Back",
    "Mostrar senha": "Show password",
    "Esconder senha": "Hide password",
    "E-mail": "Email",
    "C\xF3digo de 6 d\xEDgitos": "6-digit code",
    "Dispositivo {0}": "Device {0}",
    "Mandamos outro c\xF3digo.": "We sent another code.",
    "Senha trocada. Entre com a senha nova.": "Password changed. Sign in with the new password.",
    "Voc\xEA saiu da conta do Habblaud World neste computador.": "You signed out of Habblaud World on this computer.",
    "Personagem salvo.": "Character saved.",
    "Dispositivo revogado.": "Device revoked.",
    "Fechado a visitas": "Closed to visitors",
    "D\xE1 para ver o pr\xE9dio por fora, mas ningu\xE9m entra.": "People can see the building from outside, but nobody can come in.",
    "Esconder o pa\xEDs": "Hide country",
    "No lugar da bandeira do pa\xEDs (visto pelo IP da conex\xE3o) aparece uma bandeira neutra.": "A neutral flag shows instead of your country's flag (taken from the connection's IP).",
    "Mostrar o consumo de tokens": "Show token usage",
    "Total do dia e da semana do pr\xE9dio inteiro, s\xF3 em faixas (at\xE9 100 mil, 1 milh\xE3o\u2026). Nunca o custo.": "Daily and weekly total for the whole building, only in ranges (up to 100k, 1 million\u2026). Never the cost.",
    "Entrar no placar": "Join the leaderboard",
    "O pr\xE9dio pode aparecer nos placares de tokens da cidade.": "Your building can show up on the city's token leaderboards.",
    "Mostrar as compacta\xE7\xF5es": "Show compactions",
    "Quando um agente compacta o contexto, a lixeira da sala enche. Sai s\xF3 o fato, nada do conte\xFAdo.": "When an agent compacts its context, the room's trash can fills up. Only the fact is sent, nothing of the content.",
    "Habblaud World": "Habblaud World",
    "S\xF3 pelo computador": "Computer only",
    "Sem conta": "No account",
    "Na lista de espera": "On the waitlist",
    "Liberado": "Approved",
    "A conta do Habblaud World s\xF3 pode ser mexida no pr\xF3prio computador, com o Habblaud em acesso local (bind 127.0.0.1) e aberto por http://localhost.": "The Habblaud World account can only be managed on the computer itself, with Habblaud on local access (bind 127.0.0.1) and opened via http://localhost.",
    "J\xE1 tenho conta": "I already have an account",
    "Leve o seu escrit\xF3rio para uma cidade em pixel art: um pr\xE9dio seu, aceso enquanto os agentes trabalham, e um personagem para passear e visitar os pr\xE9dios de outras pessoas.": "Take your office to a pixel-art city: a building of your own, lit up while your agents work, and a character to stroll around and visit other people's buildings.",
    "O acesso \xE9 liberado aos poucos: quem cria a conta entra numa lista de espera.": "Access opens gradually: new accounts join a waitlist.",
    "O que sai do seu computador": "What leaves your computer",
    "Quem visita o mundo v\xEA, ao vivo, quantos projetos e agentes voc\xEA est\xE1 rodando e o que cada personagem est\xE1 fazendo (trabalhando, esperando, \xE0 toa). Ningu\xE9m v\xEA quais projetos s\xE3o, o que os agentes fazem, nem quem voc\xEA \xE9: s\xF3 o nickname e o avatar que voc\xEA escolheu.": "People visiting the world see, live, how many projects and agents you are running and what each character is doing (working, waiting, idle). Nobody sees which projects they are, what the agents are doing, or who you are: only the nickname and the avatar you chose.",
    "Sai:": "Sent:",
    "o tema do escrit\xF3rio; um andar por sala aberta, com um c\xF3digo aleat\xF3rio que muda todo dia; de cada agente, se \xE9 principal ou subagente, a ferramenta, o status, a apar\xEAncia, um nome sorteado e a faixa de tarefas conclu\xEDdas no dia; os tokens do pr\xE9dio arredondados em faixas (d\xE1 para desligar); se voc\xEA ligar, o fato de um agente ter compactado o contexto; a vers\xE3o e o commit do Habblaud, com a marca de c\xF3pia modificada; e o idioma da interface, s\xF3 para os e-mails.": "the office theme; one floor per open room, with a random code that changes every day; for each agent, whether it's a main agent or a subagent, its tool, status, appearance, a name drawn at random and the range of tasks completed that day; the building's tokens rounded into ranges (can be turned off); if you turn it on, the fact that an agent compacted its context; the Habblaud version and build commit, with the modified-copy flag; and the interface language, only for emails.",
    "Nunca sai:": "Never sent:",
    "caminhos e nomes de projetos, t\xEDtulos de sess\xE3o, comandos, mensagens, c\xF3digo, custo, a sua conta do Claude, o seu e-mail e o nome do computador.": "project paths and names, session titles, commands, messages, code, cost, your Claude account, your email and the computer's name.",
    "Com os dados que saem n\xE3o d\xE1 para saber quem voc\xEA \xE9 nem em que trabalha.": "From the data that is sent, nobody can tell who you are or what you work on.",
    "Os agentes trabalham sem voc\xEA: pr\xE9dio aceso n\xE3o quer dizer que voc\xEA est\xE1 no computador. Se preferir, use o modo discreto ou feche o pr\xE9dio a visitas.": "Agents work without you: a lit building doesn't mean you're at the computer. If you prefer, use discreet mode or close the building to visitors.",
    "Ver a lista completa": "See the full list",
    "Pelo menos 12 caracteres. Uma frase longa vale mais do que s\xEDmbolos; senhas que j\xE1 vazaram s\xE3o recusadas.": "At least 12 characters. A long phrase beats symbols; passwords that have leaked are rejected.",
    "Criando a conta\u2026": "Creating account\u2026",
    "Digite um e-mail v\xE1lido.": "Enter a valid email.",
    "Para criar a conta, aceite os Termos de Uso e a Pol\xEDtica de Privacidade.": "To create the account, accept the Terms of Use and the Privacy Policy.",
    "O World s\xF3 funciona se os pr\xE9dios forem verdadeiros. Mandar dados inventados quebra os termos e bane a conta.": "World only works if the buildings are real. Sending made-up data breaks the terms and gets the account banned.",
    "Li e aceito os {0} e a {1} do Habblaud World.": "I have read and accept the {0} and the {1} of Habblaud World.",
    "Termos de Uso": "Terms of Use",
    "Pol\xEDtica de Privacidade": "Privacy Policy",
    "Entrando\u2026": "Signing in\u2026",
    "Digite a senha.": "Enter your password.",
    "Esqueci a senha": "Forgot password",
    "Entrar na conta": "Sign in to your account",
    "Ainda n\xE3o tem conta?": "Don't have an account yet?",
    "Demonstra\xE7\xE3o: o c\xF3digo \xE9 {0}.": "Demo: the code is {0}.",
    "Reenviar c\xF3digo": "Resend code",
    "Confirmar e-mail": "Confirm email",
    "Conferindo\u2026": "Checking\u2026",
    "Digite os 6 d\xEDgitos do c\xF3digo.": "Enter the 6 digits of the code.",
    "Confirmar o e-mail": "Confirm your email",
    "Mandamos um c\xF3digo de 6 d\xEDgitos para {0}. Ele vale por 10 minutos.": "We sent a 6-digit code to {0}. It's valid for 10 minutes.",
    "N\xE3o chegou? Confira o spam ou pe\xE7a outro. Se este e-mail j\xE1 tinha conta, a mensagem avisa: a\xED \xE9 s\xF3 entrar com a senha.": "Didn't get it? Check your spam folder or ask for another one. If this email already had an account, the message says so: just sign in with your password.",
    "Usar outro e-mail": "Use another email",
    "Mandar c\xF3digo": "Send code",
    "Mandando\u2026": "Sending\u2026",
    "Digite o e-mail da conta. Se ele estiver cadastrado, chega um c\xF3digo para criar uma senha nova.": "Enter the account's email. If it is registered, you'll get a code to create a new password.",
    "Senha nova": "New password",
    "Trocar a senha": "Change password",
    "Trocando\u2026": "Changing\u2026",
    "Trocar a senha desconecta todos os dispositivos da conta.": "Changing the password signs out every device on the account.",
    "Se {0} tiver conta, chegou um c\xF3digo de 6 d\xEDgitos. Digite o c\xF3digo e a senha nova.": "If {0} has an account, a 6-digit code is on its way. Enter the code and the new password.",
    "Acesso liberado!": "Access granted!",
    "Voc\xEA est\xE1 na lista de espera. Estamos liberando o acesso aos poucos e avisamos por e-mail quando chegar a sua vez.": "You're on the waitlist. We're opening access gradually and will let you know by email when it's your turn.",
    "Seu pr\xE9dio vai aparecer aqui": "Your building will show up here",
    "pa\xEDs escondido": "country hidden",
    "Crie o seu personagem para entrar no mundo.": "Create your character to enter the world.",
    "Enquanto espera, j\xE1 d\xE1 para criar o seu personagem.": "While you wait, you can already create your character.",
    "Criar meu personagem": "Create my character",
    "Discreto": "Discreet",
    "Ao vivo": "Live",
    "fechado a visitas": "closed to visitors",
    "Visibilidade do pr\xE9dio": "Building visibility",
    "Dispositivos": "Devices",
    "{0} de 3": "{0} of 3",
    "\xDAltimo problema com o mundo: {0}": "Last problem with the world: {0}",
    "Conta: {0}": "Account: {0}",
    "Sair da conta": "Sign out",
    "Este computador deixa de entrar no mundo; a conta e o personagem continuam.": "This computer stops joining the world; your account and character stay.",
    "Confirmar: sair da conta": "Confirm: sign out",
    "Dica visual": "Visual hint",
    "Feminina": "Feminine",
    "Masculina": "Masculine",
    "Muda detalhes do rosto e o sorteio de cabelo e roupa; tudo d\xE1 para trocar nas pe\xE7as abaixo.": "Changes face details and the random pick of hair and clothes; you can change everything in the pieces below.",
    "J\xE1 s\xE3o 3 tra\xE7os: desmarque um para trocar.": "That's 3 traits already: unselect one to swap.",
    "N\xE3o combina com {0}.": "Doesn't go with {0}.",
    "Frase de apresenta\xE7\xE3o": "Intro phrase",
    "Escolha uma frase\u2026": "Pick a phrase\u2026",
    "Salvar personagem": "Save character",
    "Salvando\u2026": "Saving\u2026",
    "Personalidade": "Personality",
    "Escolha 2 ou 3 tra\xE7os de personalidade.": "Pick 2 or 3 personality traits.",
    "Escolha uma frase de apresenta\xE7\xE3o.": "Pick an intro phrase.",
    "Nome de jogador": "Player name",
    "De 3 a 20 caracteres: letras de um s\xF3 alfabeto, n\xFAmeros, espa\xE7o, _ - e . \xC9 o seu nome no mundo e n\xE3o pode repetir o de ningu\xE9m.": "3 to 20 characters: letters from a single alphabet, numbers, space, _ - and . It's your name in the world and can't match anyone else's.",
    "D\xE1 para trocar uma vez a cada 30 dias.": "It can be changed once every 30 days.",
    "3 a 20 caracteres; \xE9 o nome do seu personagem e fica reservado para voc\xEA, mesmo na lista de espera. \xDAnico no mundo.": "3 to 20 characters; it's your character's name and stays reserved for you, even on the waitlist. Unique in the world.",
    "Esse nome j\xE1 est\xE1 em uso. Escolha outro.": "That name is already taken. Pick another one.",
    "Seu nome de jogador: {0} (reservado)": "Your player name: {0} (reserved)",
    "Escolhido no cadastro. D\xE1 para trocar depois, uma vez a cada 30 dias.": "Chosen at sign-up. You can change it later, once every 30 days.",
    "Desta vez o nome novo entra na hora, sem esperar os 30 dias.": "This time the new name applies right away, without waiting 30 days.",
    "Escolha um nome novo": "Choose a new name",
    "Escolher nome novo": "Choose new name",
    "Escolha um nome novo: a modera\xE7\xE3o trocou o seu nome de jogador. O nome novo entra na hora, sem esperar os 30 dias.": "Choose a new name: the moderators changed your player name. The new name applies right away, without waiting 30 days.",
    "Escolha 2 ou 3 tra\xE7os. Os que n\xE3o combinam com os j\xE1 escolhidos ficam apagados.": "Pick 2 or 3 traits. The ones that don't go with those already picked are dimmed.",
    "Aparece no seu perfil, traduzida para quem l\xEA. No mundo n\xE3o h\xE1 texto livre al\xE9m do nome.": "Shows on your profile, translated for whoever reads it. Besides your name, there's no free text in the world.",
    "Criar personagem": "Create character",
    "Dispon\xEDvel depois de criar o personagem.": "Available after you create your character.",
    "Modo do pr\xE9dio": "Building mode",
    "Ao vivo: andares, contadores e o que cada personagem est\xE1 fazendo, em tempo real. Discreto: s\xF3 aceso ou apagado e o n\xFAmero de andares.": "Live: floors, counters and what each character is doing, in real time. Discreet: only lit or dark and the number of floors.",
    "Pa\xEDs: escondido (aparece uma bandeira neutra).": "Country: hidden (a neutral flag shows).",
    "Pa\xEDs visto na \xFAltima conex\xE3o: {0}.": "Country seen on the last connection: {0}.",
    "Pa\xEDs: aparece depois da primeira conex\xE3o com o mundo.": "Country: shows after the first connection to the world.",
    "As mudan\xE7as valem na hora.": "Changes apply right away.",
    "At\xE9 3 por conta. Revogar desconecta o dispositivo na hora; para voltar, ele entra de novo com a senha.": "Up to 3 per account. Revoking signs the device out right away; to come back, it signs in again with the password.",
    "entrou em {0}": "signed in on {0}",
    "\xFAltimo acesso {0}": "last seen {0}",
    "este computador": "this computer",
    "Revogar": "Revoke",
    "Revogar {0}": "Revoke {0}",
    "Confirmar": "Confirm",
    // client/src/ui/world/world-model.ts
    "A senha precisa ter pelo menos 12 caracteres.": "The password needs at least 12 characters.",
    "A senha pode ter no m\xE1ximo 128 caracteres.": "The password can have at most 128 characters.",
    "A senha n\xE3o pode ser o seu e-mail.": "The password can't be your email.",
    'A senha n\xE3o pode ser s\xF3 uma repeti\xE7\xE3o (como "aaaaaaaaaaaa").': `The password can't be just a repetition (like "aaaaaaaaaaaa").`,
    "O nome precisa ter de 3 a 20 caracteres.": "The name needs 3 to 20 characters.",
    "Use s\xF3 letras, n\xFAmeros, espa\xE7o, _ - e . no nome.": "Use only letters, numbers, space, _ - and . in the name.",
    "Use letras de um s\xF3 alfabeto no nome.": "Use letters from a single alphabet in the name.",
    "Tire do nome os caracteres invis\xEDveis e os espa\xE7os especiais.": "Remove invisible characters and special spaces from the name.",
    "O nome precisa ter pelo menos uma letra.": "The name needs at least one letter.",
    "Este nome \xE9 reservado. Escolha outro.": "This name is reserved. Pick another one.",
    "C\xF3digo errado ou vencido. Confira o e-mail ou pe\xE7a outro c\xF3digo.": "Wrong or expired code. Check the email or ask for another code.",
    "E-mail ou senha n\xE3o conferem.": "Email or password don't match.",
    "Falta confirmar o e-mail: mandamos um c\xF3digo novo.": "Your email still needs confirming: we sent a new code.",
    "Esta conta foi banida do Habblaud World. Para recorrer, responda ao e-mail do banimento.": "This account was banned from Habblaud World. To appeal, reply to the ban email.",
    "Este nome j\xE1 est\xE1 em uso no mundo. Escolha outro.": "This name is already taken in the world. Pick another one.",
    "Nome inv\xE1lido: de 3 a 20 caracteres, com letras de um s\xF3 alfabeto, n\xFAmeros, espa\xE7o, _ - e .": "Invalid name: 3 to 20 characters, with letters from a single alphabet, numbers, space, _ - and .",
    "Este nome n\xE3o \xE9 permitido. Escolha outro.": "This name isn't allowed. Pick another one.",
    "O Habblaud World n\xE3o est\xE1 ligado neste Habblaud (HABBLAUD_WORLD_URL recusada; veja o log do servidor).": "Habblaud World isn't turned on in this Habblaud (HABBLAUD_WORLD_URL was rejected; see the server log).",
    "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.": "Too many attempts in a row. Wait a few minutes and try again.",
    "O servidor do Habblaud World n\xE3o respondeu. Tente de novo em instantes.": "The Habblaud World server didn't respond. Try again in a moment.",
    "A conta do World s\xF3 pode ser mexida pelo pr\xF3prio computador, com o Habblaud aberto em localhost.": "The World account can only be managed from the computer itself, with Habblaud opened on localhost.",
    "Esta conta est\xE1 suspensa no Habblaud World por enquanto.": "This account is suspended from Habblaud World for now.",
    "A sess\xE3o do Habblaud World neste computador terminou. Entre de novo.": "The Habblaud World session on this computer has ended. Sign in again.",
    "O nome s\xF3 pode ser trocado uma vez a cada 30 dias.": "The name can only be changed once every 30 days.",
    "A senha precisa ter de 12 a 128 caracteres.": "The password must be 12 to 128 characters long.",
    "Senha fraca: n\xE3o use o e-mail, o nome de jogador nem s\xF3 repeti\xE7\xE3o.": "Weak password: don't use your email, your player name or just repetition.",
    "Esta senha aparece em vazamentos de dados conhecidos. Escolha outra.": "This password appears in known data breaches. Choose another one.",
    "E-mail inv\xE1lido. Confira o endere\xE7o.": "Invalid email. Check the address.",
    "A verifica\xE7\xE3o anti-rob\xF4 n\xE3o passou. Tente de novo em instantes.": "The anti-bot check didn't pass. Try again in a moment.",
    "Esta conta j\xE1 tem 3 computadores; revogue um em Dispositivos.": "This account already has 3 computers; revoke one in Devices.",
    "Crie o personagem primeiro.": "Create your character first.",
    "O Habblaud World est\xE1 em manuten\xE7\xE3o. Tente de novo mais tarde.": "Habblaud World is under maintenance. Try again later.",
    "O servidor do mundo teve um erro; tente de novo.": "The world server had an error; try again.",
    "Este dispositivo n\xE3o est\xE1 mais na conta.": "This device is no longer on the account.",
    "O servidor do Habblaud World n\xE3o encontrou o que foi pedido.": "The Habblaud World server couldn't find what was requested.",
    "O pedido saiu num formato que o servidor n\xE3o aceita. Atualize o Habblaud e tente de novo.": "The request was sent in a format the server doesn't accept. Update Habblaud and try again.",
    "O servidor do Habblaud World respondeu algo inesperado. Tente de novo em instantes.": "The Habblaud World server sent an unexpected response. Try again in a moment.",
    "N\xE3o deu para gravar a sess\xE3o neste computador: ela vale s\xF3 at\xE9 o Habblaud reiniciar.": "Couldn't save the session on this computer: it only lasts until Habblaud restarts.",
    "A conta do World s\xF3 pode ser mexida com o Habblaud acess\xEDvel apenas pelo pr\xF3prio computador (acesso local, bind 127.0.0.1).": "The World account can only be managed when Habblaud is reachable only from this computer (local access, bind 127.0.0.1).",
    "O servidor recusou o e-mail ou a senha. A senha precisa ter de 12 a 128 caracteres e n\xE3o pode estar numa lista de senhas vazadas.": "The server rejected the email or the password. The password needs 12 to 128 characters and can't be on a list of leaked passwords.",
    "O servidor recusou o personagem. Confira o nome, os tra\xE7os (2 ou 3) e a frase de apresenta\xE7\xE3o.": "The server rejected the character. Check the name, the traits (2 or 3) and the intro phrase.",
    "O servidor recusou as op\xE7\xF5es de visibilidade.": "The server rejected the visibility options.",
    "O servidor recusou o pedido. Confira os dados e tente de novo.": "The server rejected the request. Check the details and try again.",
    "Algo deu errado. Tente de novo em instantes.": "Something went wrong. Try again in a moment.",
    "Projeto Ip\xEA": "Project Ip\xEA",
    "Projeto Jacarand\xE1": "Project Jacaranda",
    "Projeto Jatob\xE1": "Project Jatob\xE1",
    "Projeto Peroba": "Project Peroba",
    "Projeto Cedro": "Project Cedar",
    "Projeto Aroeira": "Project Aroeira",
    "Projeto Arauc\xE1ria": "Project Araucaria",
    "Projeto Buriti": "Project Buriti",
    "Projeto Carna\xFAba": "Project Carnauba",
    "Projeto Figueira": "Project Fig Tree",
    "Projeto Oliveira": "Project Olive Tree",
    "Projeto Carvalho": "Project Oak",
    "Projeto Salgueiro": "Project Willow",
    "Projeto Sequoia": "Project Sequoia",
    "Projeto Baob\xE1": "Project Baobab",
    "Projeto Ac\xE1cia": "Project Acacia",
    "Projeto Magn\xF3lia": "Project Magnolia",
    "Projeto Cerejeira": "Project Cherry Tree",
    "Projeto Pinheiro": "Project Pine",
    "Projeto Palmeira": "Project Palm",
    "Projeto Jade": "Project Jade",
    "Projeto \xC2mbar": "Project Amber",
    "Projeto Ametista": "Project Amethyst",
    "Projeto Quartzo": "Project Quartz",
    "Projeto Top\xE1zio": "Project Topaz",
    "Projeto Turmalina": "Project Tourmaline",
    "Projeto \xC1gata": "Project Agate",
    "Projeto \xD4nix": "Project Onyx",
    "Projeto Opala": "Project Opal",
    "Projeto Safira": "Project Sapphire",
    "Projeto Rubi": "Project Ruby",
    "Projeto Esmeralda": "Project Emerald",
    "Projeto Granada": "Project Garnet",
    "Projeto Jaspe": "Project Jasper",
    "Projeto Malaquita": "Project Malachite",
    "Projeto Obsidiana": "Project Obsidian",
    "Projeto Turquesa": "Project Turquoise",
    "Projeto Citrino": "Project Citrine",
    "Projeto Peridoto": "Project Peridot",
    "Projeto L\xE1pis-laz\xFAli": "Project Lapis Lazuli",
    "Projeto Aurora": "Project Aurora",
    "Projeto \xD3rion": "Project Orion",
    "Projeto Lira": "Project Lyra",
    "Projeto Cisne": "Project Cygnus",
    "Projeto Drag\xE3o": "Project Draco",
    "Projeto Andr\xF4meda": "Project Andromeda",
    "Projeto Cassiopeia": "Project Cassiopeia",
    "Projeto Perseu": "Project Perseus",
    "Projeto F\xEAnix": "Project Phoenix",
    "Projeto Hidra": "Project Hydra",
    "Projeto \xC1guia": "Project Aquila",
    "Projeto Quilha": "Project Carina",
    "Projeto Vela": "Project Vela",
    "Projeto Centauro": "Project Centaurus",
    "Projeto Cruzeiro do Sul": "Project Crux",
    "Projeto Pav\xE3o": "Project Pavo",
    "Projeto Pomba": "Project Columba",
    "Projeto Cocheiro": "Project Auriga",
    "Projeto Lobo": "Project Lupus",
    "Projeto Tucano": "Project Tucana",
    "Habblaud World: pr\xE9dio conectado.": "Habblaud World: building connected.",
    "Habblaud World: o servidor recusou o pacote do pr\xE9dio ({0}).": "Habblaud World: the server rejected the building packet ({0}).",
    "Habblaud World: esta vers\xE3o do Habblaud n\xE3o entra mais no mundo; atualize para o pr\xE9dio voltar.": "Habblaud World: this Habblaud version can no longer join the world; update it to bring the building back.",
    "Habblaud World: o servidor encerrou a conex\xE3o do pr\xE9dio ({0}).": "Habblaud World: the server closed the building connection ({0}).",
    "Habblaud World: sem conex\xE3o com o servidor do mundo; tentando de novo.": "Habblaud World: no connection to the world server; trying again.",
    "Habblaud World: o pr\xE9dio passou dos limites do mundo; {0} andar(es) e {1} agente(s) ficaram de fora.": "Habblaud World: the building went over the world's limits; {0} floor(s) and {1} agent(s) were left out.",
    "N\xE3o foi poss\xEDvel gravar {0} ({1}).": "Couldn't write {0} ({1}).",
    'esperado {theme: "auto", "none", "halloween" ou "christmas"}': 'expected {theme: "auto", "none", "halloween" or "christmas"}',
    "Habblaud World: o servidor do mundo n\xE3o confirmou a pausa ou a retomada do pr\xE9dio ({0}).": "Habblaud World: the world server didn't confirm pausing or resuming the building ({0}).",
    // client/src/ui/world/ (Fase 2: cartão "Seu prédio", "Ver o que foi enviado", tema e chip do topo)
    "Seu pr\xE9dio": "Your building",
    "Seu pr\xE9dio agora": "Your building now",
    "Sem personagem": "No character",
    "Pausado": "Paused",
    "Retomar": "Resume",
    "1 andar": "1 floor",
    "{0} andares": "{0} floors",
    "1 agente": "1 agent",
    "\xDAltima remessa: {0}": "Last upload: {0}",
    "Nenhuma remessa ainda": "No uploads yet",
    "Aceso no mundo: um andar por sala aberta e cada personagem no status de agora. Os tokens, se voc\xEA deixar, aparecem s\xF3 em faixas, no medidor da fachada.": "Lit in the world: one floor per open room and each character in its current status. Tokens, if you allow it, show up only as ranges, on the facade meter.",
    "O pr\xE9dio acende com a primeira remessa.": "The building lights up with the first upload.",
    "Sem conex\xE3o com o mundo agora: o Habblaud tenta de novo sozinho. Com 2 minutos sem not\xEDcias, o pr\xE9dio apaga.": "No connection to the world right now: Habblaud keeps retrying on its own. After 2 minutes without news, the building goes dark.",
    "Pausado: seu pr\xE9dio est\xE1 apagado, mas voc\xEA pode andar pela cidade. Nada do escrit\xF3rio sai deste computador.": "Paused: your building is dark, but you can walk around the city. Nothing from the office leaves this computer.",
    "Crie o seu personagem: o pr\xE9dio entra no mundo junto com ele.": "Create your character: the building joins the world along with it.",
    "Pausar interrompe o envio na hora e apaga o pr\xE9dio no mundo.": "Pausing stops sending right away and turns the building off in the world.",
    "Retomar volta a enviar e acende o pr\xE9dio.": "Resuming starts sending again and lights the building up.",
    "Pausado por 30 dias, o pr\xE9dio some do mapa e, 30 dias depois, \xE9 retirado; retomar antes disso traz de volta, no mesmo lote.": "After 30 days paused, the building disappears from the map and is removed 30 days later; resuming before that brings it back, on the same lot.",
    "O mundo recusou a \xFAltima remessa.": "The world rejected the last upload.",
    "O pacote saiu fora do formato do protocolo. Atualize o Habblaud.": "The packet didn't match the protocol format. Update Habblaud.",
    "O escrit\xF3rio passou dos limites do mundo (64 andares, 64 agentes por andar, 256 agentes ou 64 KB).": "The office went over the world's limits (64 floors, 64 agents per floor, 256 agents or 64 KB).",
    "Um nome de personagem n\xE3o est\xE1 na lista de nomes do mundo.": "A character name isn't on the world's list of names.",
    "Uma pe\xE7a de apar\xEAncia est\xE1 fora das paletas do editor.": "An appearance part is outside the editor's palettes.",
    "Um c\xF3digo de andar ou de agente est\xE1 fora do formato.": "A floor or agent code isn't in the right format.",
    "Remessas demais em pouco tempo (o limite \xE9 12 por minuto). A pr\xF3xima vai normalmente.": "Too many uploads in a short time (the limit is 12 per minute). The next one goes through normally.",
    "Um motivo que esta vers\xE3o do Habblaud n\xE3o conhece.": "A reason this version of Habblaud doesn't know.",
    "Ver o que foi enviado": "See what was sent",
    "O que foi enviado": "What was sent",
    "Nada saiu deste computador ainda: o pr\xE9dio entra no mundo com a primeira remessa.": "Nothing has left this computer yet: the building joins the world with the first upload.",
    "O que pode sair e o que nunca sai": "What can leave and what never does",
    "Copiar": "Copy",
    "N\xE3o deu para copiar": "Couldn't copy",
    "Enviada {0} ({1})": "Sent {0} ({1})",
    "1 byte": "1 byte",
    "{0} bytes": "{0} bytes",
    "Sem resposta do mundo ainda.": "No reply from the world yet.",
    "Aceita pelo mundo.": "Accepted by the world.",
    "Recusada pelo mundo.": "Rejected by the world.",
    "Isto \xE9 tudo o que saiu do seu computador. Nenhum caminho, nome de projeto, texto ou hor\xE1rio do escrit\xF3rio.": "This is everything that left your computer. No paths, project names, text or office times.",
    "Pacote enviado (JSON)": "Sent packet (JSON)",
    "O tema tamb\xE9m vale para o seu pr\xE9dio no Habblaud World.": "The theme also applies to your building in Habblaud World.",
    "N\xE3o deu para mandar o tema para o pr\xE9dio: {0}": "Couldn't send the theme to the building: {0}",
    "no mundo": "in the world",
    "pausado": "paused",
    "Seu pr\xE9dio est\xE1 aceso no Habblaud World: {0} e {1}. Clique para abrir o Habblaud World.": "Your building is lit in Habblaud World: {0} and {1}. Click to open Habblaud World.",
    "Pausado: seu pr\xE9dio est\xE1 apagado, mas voc\xEA pode andar pela cidade. Nada do escrit\xF3rio sai deste computador; clique para retomar.": "Paused: your building is dark, but you can walk around the city. Nothing from the office leaves this computer; click to resume.",
    "Sem conex\xE3o com o Habblaud World agora; o Habblaud tenta de novo sozinho. Clique para ver o seu pr\xE9dio.": "No connection to Habblaud World right now; Habblaud keeps retrying on its own. Click to see your building.",
    "Um erro no servidor do mundo. A pr\xF3xima remessa tenta de novo.": "An error on the world server. The next upload tries again.",
    "Habblaud World: o servidor do mundo n\xE3o confirmou a sa\xEDda do pr\xE9dio ({0}).": "Habblaud World: the world server didn't confirm the building leaving the world ({0}).",
    "A conta voltou para a lista de espera: o pr\xE9dio sai do mundo at\xE9 o acesso ser liberado de novo.": "The account went back to the waiting list: the building leaves the world until access is granted again.",
    "A sua conta conectou o pr\xE9dio em outro computador, e este parou de enviar.": "Your account connected the building on another computer, and this one stopped sending.",
    "Atualize o Habblaud": "Update Habblaud",
    "Conectado em outro computador": "Connected on another computer",
    "Confirmar: sair do mundo": "Confirm: leave the world",
    "Conta banida": "Account banned",
    "Conta suspensa": "Account suspended",
    "Entre de novo": "Sign in again",
    "Esta conta est\xE1 suspensa no Habblaud World: o pr\xE9dio fica apagado e nada sai deste computador.": "This account is suspended in Habblaud World: the building stays dark and nothing leaves this computer.",
    "Esta vers\xE3o do Habblaud n\xE3o entra mais no mundo. Atualize para o pr\xE9dio voltar a acender.": "This version of Habblaud can no longer join the world. Update it to light the building up again.",
    "Fora do mundo": "Out of the world",
    "O Habblaud World baniu esta conta: o pr\xE9dio saiu do mundo e nada mais sai deste computador.": "Habblaud World banned this account: the building left the world and nothing else leaves this computer.",
    "O mundo contou {0}.": "The world counted {0}.",
    "O mundo n\xE3o encontrou o seu personagem: crie de novo para o pr\xE9dio voltar.": "The world couldn't find your character: create it again to bring the building back.",
    "O mundo recebeu os mesmos {0}.": "The world received the same {0}.",
    "O pr\xE9dio volta a subir daqui, e o outro computador para de enviar.": "The building goes back to uploading from here, and the other computer stops sending.",
    "O servidor do mundo n\xE3o reconheceu este computador: entre de novo na conta.": "The world server didn't recognize this computer: sign in to the account again.",
    "parado": "stopped",
    "Pausar apaga o pr\xE9dio e guarda o lote: retomar traz de volta, no mesmo lugar. Sair do mundo retira o pr\xE9dio na hora e libera o lote; a conta e o personagem continuam, e voltar depois cria um pr\xE9dio novo, em outro lote.": "Pausing turns the building off and keeps the lot: resuming brings it back, in the same place. Leaving the world removes the building right away and frees the lot; the account and the character stay, and coming back later creates a new building, on another lot.",
    "Sair do mundo": "Leave the world",
    "Se a suspens\xE3o j\xE1 acabou, o pr\xE9dio volta a acender.": "If the suspension is over, the building lights up again.",
    "Seu pr\xE9dio parou de subir ao Habblaud World. Clique para ver o motivo.": "Your building stopped uploading to Habblaud World. Click to see why.",
    "Trazer para este computador": "Bring it to this computer",
    "Voc\xEA saiu do mundo: o pr\xE9dio foi retirado e o lote, liberado. D\xE1 para andar pela cidade; nada do escrit\xF3rio sai deste computador.": "You left the world: the building was removed and the lot freed. You can still walk around the city; nothing from the office leaves this computer.",
    "Voltar ao mundo": "Back to the world",
    "Voltar cria um pr\xE9dio novo, em outro lote; a conta e o personagem s\xE3o os mesmos.": "Coming back creates a new building, on another lot; the account and the character are the same.",
    // Habblaud World, Fase 3: a cena Mundo (stream, comandos, avisos e a volta ao mundo)
    "A cidade j\xE1 est\xE1 aberta em outras abas do Habblaud. Feche uma delas para abrir aqui.": "The city is already open in other Habblaud tabs. Close one of them to open it here.",
    "A cena Mundo perdeu a conex\xE3o com o Habblaud. Abra a cidade de novo.": "The World scene lost its connection to Habblaud. Open the city again.",
    "A conta saiu do mundo (por este ou por outro computador): nada mais sai at\xE9 voc\xEA voltar ao mundo.": "The account left the world (from this or another computer): nothing else is sent until you come back to the world.",
    "a cena Mundo s\xF3 abre pela pr\xF3pria p\xE1gina do Habblaud": "the World scene only opens from Habblaud's own page",
    'Habblaud World: a conta saiu do mundo; o pr\xE9dio s\xF3 volta com "Voltar ao mundo".': 'Habblaud World: the account left the world; the building only comes back with "Back to the world".',
    "Habblaud World: o servidor do mundo n\xE3o confirmou a volta ao mundo ({0}).": "Habblaud World: the world server didn't confirm the return to the world ({0}).",
    // client/src/world/city (cidade do Habblaud World) e client/src/ui/world/scene-switch.ts
    "Voc\xEA est\xE1 na cidade do Habblaud World. Esc volta ao escrit\xF3rio.": "You're in the Habblaud World city. Esc goes back to the office.",
    "De volta ao escrit\xF3rio.": "Back at the office.",
    "Mundo": "World",
    "Voltar ao escrit\xF3rio (Esc)": "Back to the office (Esc)",
    "Mundo: andar pela cidade do Habblaud World": "World: walk around the Habblaud World city",
    "s\xF3 o t\xE9rreo": "ground floor only",
    "1 curtida": "1 like",
    "{0} curtidas": "{0} likes",
    "Luzes acesas": "Lights on",
    "Luzes apagadas": "Lights off",
    "Cart\xE3o": "Card",
    "Agentes trabalhando": "Agents working",
    "Agentes esperando o dono": "Agents waiting for the owner",
    "esperando": "waiting",
    "Agentes \xE0 toa": "Idle agents",
    "\xE0 toa": "idle",
    "Modo discreto: o dono n\xE3o mostra os agentes.": "Discreet mode: the owner doesn't show the agents.",
    "No mundo desde {0}": "In the world since {0}",
    "{0} recebidas": "{0} received",
    "Ver o pr\xE9dio": "See the building",
    "Pr\xE9dio longe daqui": "Building far from here",
    "Ainda sem pr\xE9dio": "No building yet",
    "Fechado": "Closed",
    "Entrando na cidade\u2026": "Entering the city\u2026",
    "andar": "walk",
    "correr": "run",
    "clique": "click",
    "ir at\xE9 l\xE1": "go there",
    "escrit\xF3rio": "office",
    "Chegue perto da porta de um pr\xE9dio e aperte E.": "Get close to a building's door and press E.",
    "Devagar: o mundo pediu um tempo entre as a\xE7\xF5es.": "Slow down: the world asked for a pause between actions.",
    "Aviso do Habblaud World.": "Notice from Habblaud World.",
    "Minimapa: clique para levar a c\xE2mera at\xE9 l\xE1": "Minimap: click to move the camera there",
    "Sem conex\xE3o com o Habblaud World agora; o Habblaud tenta de novo sozinho.": "No connection to Habblaud World right now; Habblaud tries again on its own.",
    "Essa pessoa n\xE3o est\xE1 mais por perto.": "That person isn't nearby anymore.",
    "Voc\xEA ficou um bom tempo parado e saiu da rua: ande para voltar.": "You stood still for a long time and left the street: walk to come back.",
    "A \xE1rea est\xE1 cheia: s\xF3 os jogadores mais perto aparecem.": "The area is full: only the closest players show up.",
    "Voc\xEA ficou um tempo parado.": "You stood still for a while.",
    "O Habblaud World vai reiniciar: a conex\xE3o cai e volta sozinha.": "Habblaud World is restarting: the connection drops and comes back on its own.",
    'Sua conta saiu do mundo: o pr\xE9dio volta com "Voltar ao mundo", em Configura\xE7\xF5es.': 'Your account left the world: the building comes back with "Back to the world", in Settings.',
    "Entrar (E)": "Enter (E)",
    "entrar": "enter",
    "Sair do pr\xE9dio": "Leave",
    "Ver como os outros veem": "See it as others do",
    "Entrar no seu pr\xE9dio pela cidade e ver o que quem visita v\xEA (sem nada do escrit\xF3rio real)": "Enter your building through the city and see what visitors see (nothing from your real office)",
    "Avisar quando algu\xE9m visitar": "Notify me when someone visits",
    "Um aviso quando o primeiro visitante entra no seu pr\xE9dio. Voc\xEA v\xEA s\xF3 quantos est\xE3o l\xE1 dentro, nunca quem.": "A notice when the first visitor enters your building. You only see how many are inside, never who.",
    "Algu\xE9m entrou no seu pr\xE9dio no Habblaud World.": "Someone entered your building in Habblaud World.",
    "1 visitante agora": "1 visitor now",
    "{0} visitantes agora": "{0} visitors now",
    "Este pr\xE9dio n\xE3o est\xE1 no mundo agora.": "This building isn't in the world right now.",
    "O pr\xE9dio saiu do mundo: voc\xEA voltou para a rua.": "The building left the world: you're back on the street.",
    "Chegue mais perto da porta para entrar.": "Get closer to the door to go in.",
    "O pr\xE9dio fechou a visitas: voc\xEA voltou para a rua.": "The building closed to visitors: you're back on the street.",
    "Este pr\xE9dio est\xE1 fechado a visitas.": "This building is closed to visitors.",
    "Voc\xEA n\xE3o pode mais ficar neste pr\xE9dio: voltou para a rua.": "You can't stay in this building anymore: you're back on the street.",
    "Voc\xEA n\xE3o pode entrar neste pr\xE9dio.": "You can't enter this building.",
    "O pr\xE9dio est\xE1 lotado (20 visitantes). Tente daqui a pouco.": "The building is full (20 visitors). Try again in a bit.",
    "Esperando o dono": "Waiting for the owner",
    "visitante": "visitor",
    "Visitante": "Visitor",
    "Curtir": "Like",
    "Sair do pr\xE9dio (Esc)": "Leave the building (Esc)",
    "Visita": "Visit",
    "Salas do pr\xE9dio": "Building rooms",
    "S\xF3 o nome, o papel, a ferramenta e o status de cada agente: o resto do escrit\xF3rio n\xE3o sai do computador do dono.": "Only each agent's name, role, tool and status: the rest of the office never leaves the owner's computer.",
    "Sair pelo elevador": "Leave by the elevator",
    "elevador": "elevator",
    "sair": "leave",
    "Saindo do pr\xE9dio\u2026": "Leaving the building\u2026",
    "apagado": "lights off",
    "discreto": "discreet",
    "modo discreto": "discreet mode",
    "Seu pr\xE9dio, como os outros veem": "Your building, as others see it",
    "Pr\xE9dio de {0}": "{0}'s building",
    "esperando o dono": "waiting for the owner",
    "de olho no terminal": "watching the terminal",
    "Pr\xE9dio apagado: o dono pausou ou n\xE3o est\xE1 com o Habblaud aberto. As salas ficam escuras e vazias.": "Lights off: the owner paused or doesn't have Habblaud open. The rooms are dark and empty.",
    "Modo discreto: o dono n\xE3o mostra os agentes. As salas aparecem vazias, com a luz acesa.": "Discreet mode: the owner doesn't show the agents. The rooms look empty, with the lights on.",
    "O mundo est\xE1 em manuten\xE7\xE3o; tentamos de novo em instantes.": "The world is under maintenance; we'll try again in a moment.",
    "Conta exclu\xEDda": "Account deleted",
    "A conta do Habblaud World foi exclu\xEDda: o pr\xE9dio e o perfil sa\xEDram do mundo e nada mais sai deste computador.": "The Habblaud World account was deleted: the building and the profile left the world, and nothing else leaves this computer.",
    "Habblaud World: desligado (HABBLAUD_WORLD={0}).": "Habblaud World: off (HABBLAUD_WORLD={0}).",
    "Habblaud World: ligado: {0}": "Habblaud World: on: {0}",
    "Habblaud World: ligado: {0} (padr\xE3o)": "Habblaud World: on: {0} (default)",
    "HABBLAUD_WORLD_URL recusada": "HABBLAUD_WORLD_URL rejected",
    "Habblaud World: desligado ({0}).": "Habblaud World: off ({0}).",
    "A conta do Habblaud World foi exclu\xEDda. O pr\xE9dio e o perfil sa\xEDram do mundo na hora; o resto \xE9 apagado do banco em 7 dias e dos backups em at\xE9 30.": "The Habblaud World account was deleted. The building and the profile left the world right away; the rest is deleted from the database within 7 days and from backups within 30.",
    "Habblaud World: conta exclu\xEDda; a sess\xE3o e o world.json foram apagados deste computador.": "Habblaud World: account deleted; the session and world.json were removed from this computer.",
    "os dados da conta s\xF3 saem pela pr\xF3pria p\xE1gina do Habblaud": "the account data only leaves through Habblaud's own page",
    "a conta, o personagem, os likes dados e recebidos, os bloqueios, as den\xFAncias feitas e os dispositivos s\xE3o apagados do banco.": "the account, the character, the likes given and received, the blocks, the reports you made and the devices are deleted from the database.",
    "Abre um e-mail para {0}: conte o que aconteceu, e uma pessoa rev\xEA o caso.": "Opens an e-mail to {0}: tell us what happened, and a person reviews the case.",
    "Abre um e-mail para {0}: se for engano, uma pessoa rev\xEA os n\xFAmeros e tira o selo.": "Opens an e-mail to {0}: if it's a mistake, a person reviews the numbers and removes the badge.",
    "Avisar por e-mail antes de retirar meu pr\xE9dio por inatividade": "E-mail me before my building is removed for inactivity",
    "Baixar meus dados": "Download my data",
    "Conta e dados": "Account and data",
    "Contestar por e-mail": "Dispute by e-mail",
    "D\xE1 para baixar os dados uma vez por dia. Tente de novo amanh\xE3.": "You can download your data once a day. Try again tomorrow.",
    "D\xFAvidas ou pedidos sobre os seus dados: {0}.": "Questions or requests about your data: {0}.",
    "Em 7 dias:": "Within 7 days:",
    "Em at\xE9 30 dias:": "Within 30 days:",
    "Em manuten\xE7\xE3o": "Under maintenance",
    "Excluindo\u2026": "Deleting\u2026",
    "Excluir a conta tira voc\xEA do Habblaud World:": "Deleting the account takes you out of Habblaud World:",
    "Excluir a conta": "Delete the account",
    "Excluir conta": "Delete account",
    "Excluir conta\u2026": "Delete account\u2026",
    "Mandamos um c\xF3digo de 6 d\xEDgitos para {0}. Digite o c\xF3digo para excluir a conta.": "We sent a 6-digit code to {0}. Enter the code to delete the account.",
    "Mandar o c\xF3digo": "Send the code",
    "Na hora:": "Right away:",
    "N\xE3o verificado": "Unverified",
    "O aviso de inatividade fica dispon\xEDvel depois de criar o personagem.": "The inactivity warning becomes available after you create the character.",
    'O mundo marcou o seu pr\xE9dio como "n\xE3o verificado": os n\xFAmeros pareceram fora do normal e est\xE3o em revis\xE3o. Ele continua no mundo, mas fora de placares e destaques.': 'The world marked your building as "unverified": its numbers looked unusual and are under review. It stays in the world, but out of leaderboards and highlights.',
    "o pr\xE9dio e o perfil somem do mundo, e este computador sai da conta.": "the building and the profile disappear from the world, and this computer signs out of the account.",
    "Os n\xFAmeros deste pr\xE9dio pareceram fora do normal e est\xE3o em revis\xE3o; enquanto isso, ele fica fora de placares e destaques.": "This building's numbers looked unusual and are under review; meanwhile, it stays out of leaderboards and highlights.",
    "Para confirmar, mandamos um c\xF3digo de 6 d\xEDgitos para o e-mail da conta ({0}).": "To confirm, we send a 6-digit code to the account's e-mail ({0}).",
    "Pronto: o arquivo {0} foi para a pasta de downloads.": "Done: the file {0} went to your downloads folder.",
    "Recorrer por e-mail": "Appeal by e-mail",
    "Se quiser guardar uma c\xF3pia, baixe os seus dados antes.": "If you want to keep a copy, download your data first.",
    "Sem not\xEDcias deste Habblaud por 7 dias, o pr\xE9dio some do mapa e, 30 dias depois, \xE9 retirado. O e-mail chega 3 dias antes da retirada.": "With no word from this Habblaud for 7 days, the building disappears from the map and, 30 days later, is removed. The e-mail arrives 3 days before the removal.",
    "Seus dados": "Your data",
    "somem tamb\xE9m dos backups.": "they also disappear from the backups.",
    "Tem certeza? O pr\xE9dio e o perfil saem do mundo assim que voc\xEA digitar o c\xF3digo.": "Are you sure? The building and the profile leave the world as soon as you enter the code.",
    "Um arquivo JSON com o que o Habblaud World guarda da sua conta: e-mail, datas, personagem, visibilidade, dispositivos, pr\xE9dio, likes dados, bloqueios e den\xFAncias feitas. D\xE1 para baixar uma vez por dia.": "A JSON file with what Habblaud World keeps about your account: e-mail, dates, character, visibility, devices, building, likes given, blocks and reports you made. You can download it once a day.",
    "O pacote contradiz o anterior de um jeito que o Habblaud n\xE3o produz: o mundo o descartou, e o pr\xE9dio fica com o \xFAltimo aceito. As pr\xF3ximas remessas v\xE3o normalmente.": "The packet contradicts the previous one in a way Habblaud doesn't produce: the world discarded it, and the building keeps the last accepted one. The next uploads go out normally.",
    // Fase 5 do Habblaud World (social leve)
    // shared/world/social-labels.ts
    "Ol\xE1!": "Hello!",
    "Pr\xE9dio bonito!": "Nice building!",
    "Bora um caf\xE9?": "Coffee?",
    "Parab\xE9ns pela entrega!": "Congrats on shipping!",
    "Prazer!": "Nice to meet you!",
    "At\xE9 mais!": "See you!",
    "Valeu!": "Thanks!",
    "Boa sorte!": "Good luck!",
    "Oi, oi!": "Hey there!",
    "Mandou bem!": "Well done!",
    "Passei por aqui": "I was here",
    "Pr\xE9dio lindo": "Lovely building",
    "Continue assim": "Keep it up",
    "Fica o caf\xE9": "Have a coffee",
    "Um aceno": "A wave",
    "Nota 10": "Top marks",
    "Com carinho": "With love",
    "Decolando!": "Taking off!",
    "Nome ofensivo": "Offensive name",
    "Fingindo ser outra pessoa": "Pretending to be someone else",
    "Persegui\xE7\xE3o": "Harassment",
    "Spam de cumprimentos": "Greeting spam",
    "Pr\xE9dio falso": "Fake building",
    "Outro motivo": "Other reason",
    "{0} horas de agentes trabalhando": "{0} hours of agents working",
    "at\xE9 100 mil tokens": "up to 100 thousand tokens",
    "at\xE9 1 milh\xE3o de tokens": "up to 1 million tokens",
    "at\xE9 10 milh\xF5es de tokens": "up to 10 million tokens",
    "at\xE9 100 milh\xF5es de tokens": "up to 100 million tokens",
    "mais de 100 milh\xF5es de tokens": "over 100 million tokens",
    "quase nada de tokens": "almost no tokens",
    // server/world/social.ts
    "sem conex\xE3o com o servidor do mundo agora": "no connection to the world server right now",
    "entre na conta do Habblaud World": "sign in to your Habblaud World account",
    "esperado {playerId}": "expected {playerId}",
    // client/src/ui/world/away-summary.ts
    "1 visita": "1 visit",
    "{0} visitas": "{0} visits",
    "1 like": "1 like",
    "{0} likes": "{0} likes",
    "1 carimbo": "1 stamp",
    "{0} carimbos": "{0} stamps",
    "visita": "visit",
    "visitas": "visits",
    "like": "like",
    "likes": "likes",
    "carimbo": "stamp",
    "carimbos": "stamps",
    "Enquanto voc\xEA estava fora: {0}, {1} e {2}.": "While you were away: {0}, {1} and {2}.",
    "\u2764\uFE0F {0} hoje": "\u2764\uFE0F {0} today",
    "Seu pr\xE9dio ganhou 1 like hoje.": "Your building got 1 like today.",
    "Seu pr\xE9dio ganhou {0} likes hoje.": "Your building got {0} likes today.",
    "Carimbos na portaria": "Stamps at the front desk",
    "C\xF3digo do pr\xE9dio": "Building code",
    'Mande a um amigo: na cidade, "Ir para" leva direto \xE0 sua porta.': 'Send it to a friend: in the city, "Go to" takes them straight to your door.',
    "Ok, vi": "Got it",
    "Enquanto voc\xEA estava fora": "While you were away",
    "Ver o meu pr\xE9dio": "See my building",
    "Algu\xE9m bateu na porta do seu pr\xE9dio.": "Someone knocked on your building's door.",
    "Bateram {0} vezes na porta do seu pr\xE9dio.": "Someone knocked {0} times on your building's door.",
    // client/src/ui/world/blocked.ts
    "Desbloquear": "Unblock",
    "Desbloquear {0}": "Unblock {0}",
    "{0} desbloqueado.": "{0} unblocked.",
    "Ningu\xE9m bloqueado.": "Nobody blocked.",
    "Quem voc\xEA bloqueia n\xE3o te v\xEA e voc\xEA n\xE3o v\xEA a pessoa: na rua, nos pr\xE9dios, nos cumprimentos e nos carimbos. Para bloquear algu\xE9m, abra o cart\xE3o da pessoa na cidade.": "People you block don't see you and you don't see them: on the street, in buildings, in greetings and in stamps. To block someone, open their card in the city.",
    // client/src/ui/world/settings-world.ts
    "Avisar quando baterem na porta": "Let me know when someone knocks",
    "Quem estiver na porta do seu pr\xE9dio pode bater; o aviso chega aqui no Habblaud, sem o nome de quem bateu.": "Whoever is at your building's door can knock; the notice shows up here in Habblaud, without the name of who knocked.",
    "Bloqueados": "Blocked",
    // client/src/ui/world/world-model.ts
    "Sem conex\xE3o com o Habblaud World agora: desbloquear precisa do pr\xE9dio aceso ou da cidade aberta.": "No connection to Habblaud World right now: unblocking needs your building lit or the city open.",
    // client/src/world/city/notice.ts
    "Limite do dia atingido: amanh\xE3 tem mais.": "Daily limit reached: more tomorrow.",
    "Voc\xEA j\xE1 fez isso hoje.": "You already did that today.",
    "Bloqueio feito: voc\xEAs deixam de se ver.": "Blocked: you no longer see each other.",
    "Carimbo deixado na portaria.": "Stamp left at the front desk.",
    // client/src/world/city/greetings.ts
    "Cumprimentar": "Greet",
    "Cumprimentos": "Greetings",
    // client/src/world/city/fireworks.ts
    "Meta batida!": "Goal reached!",
    "{0} de {1} h": "{0} of {1} h",
    "A cidade consumiu \u2248 {0} esta semana": "The city used \u2248 {0} this week",
    "A soma aparece com 10 pr\xE9dios ou mais.": "The total shows up with 10 buildings or more.",
    "1 pr\xE9dio aceso agora": "1 building lit now",
    "{0} pr\xE9dios acesos agora": "{0} buildings lit now",
    // client/src/world/city/teleport.ts
    "Ir": "Go",
    "Ir at\xE9 a porta deste pr\xE9dio": "Go to this building's door",
    "Visitar um pr\xE9dio aleat\xF3rio": "Visit a random building",
    "Aleat\xF3rio": "Random",
    "Ir para um pr\xE9dio pelo c\xF3digo": "Go to a building by its code",
    "Ir para": "Go to",
    "O c\xF3digo tem o formato HB-XXXX (letras e n\xFAmeros, sem 0, O, 1, I, L e U).": "The code looks like HB-XXXX (letters and numbers, no 0, O, 1, I, L or U).",
    // client/src/world/city/social.ts
    "A\xE7\xF5es perto de voc\xEA": "Actions near you",
    "Testar os fogos": "Test the fireworks",
    "curtir": "like",
    "cumprimentar": "greet",
    "bater": "knock",
    "A cidade bateu a meta da semana: {0}!": "The city hit this week's goal: {0}!",
    "A cidade bateu a meta da semana!": "The city hit this week's goal!",
    "Algu\xE9m": "Someone",
    "{0}: {1} {2} \u2014 G para responder": "{0}: {1} {2} \u2014 G to reply",
    "Chegue mais perto da porta para curtir (at\xE9 4 passos).": "Get closer to the door to like (up to 4 steps).",
    "Voc\xEA j\xE1 deu os 50 likes de hoje. Amanh\xE3 tem mais!": "You've used today's 50 likes. More tomorrow!",
    "N\xE3o d\xE1 para curtir o pr\xF3prio pr\xE9dio.": "You can't like your own building.",
    "Este pr\xE9dio n\xE3o est\xE1 mais aqui.": "This building isn't here anymore.",
    "Devagar com os likes: espere um pouquinho.": "Easy on the likes: wait a moment.",
    "Chegue mais perto da porta para bater (at\xE9 2 passos).": "Get closer to the door to knock (up to 2 steps).",
    "Voc\xEA bateu nesta porta h\xE1 pouco. Espere um minuto.": "You knocked on this door a moment ago. Wait a minute.",
    "Voc\xEA j\xE1 deixou um carimbo aqui hoje.": "You already left a stamp here today.",
    "Chegue mais perto da porta para carimbar.": "Get closer to the door to stamp.",
    "Nenhum pr\xE9dio com o c\xF3digo {0}.": "No building with code {0}.",
    "Nenhum pr\xE9dio aceso para visitar agora.": "No lit building to visit right now.",
    "Devagar: espere um pouco antes de ir para outro pr\xE9dio.": "Slow down: wait a bit before going to another building.",
    "Devagar: um cumprimento a cada 3 segundos.": "Slow down: one greeting every 3 seconds.",
    "Voc\xEA j\xE1 mandou as 5 den\xFAncias de hoje.": "You've already sent today's 5 reports.",
    "Chegue perto da porta de um pr\xE9dio (at\xE9 4 passos) e aperte L para curtir.": "Get close to a building's door (up to 4 steps) and press L to like.",
    "Chegue a 2 passos da porta de um pr\xE9dio e aperte K para bater.": "Get within 2 steps of a building's door and press K to knock.",
    "O dono deste pr\xE9dio n\xE3o recebe batidas na porta.": "This building's owner doesn't take knocks.",
    "Toc, toc! Voc\xEA bateu na porta de {0}.": "Knock, knock! You knocked on {0}'s door.",
    "Ningu\xE9m por perto para cumprimentar.": "Nobody nearby to greet.",
    "{0} bloqueado. Para desfazer: Configura\xE7\xF5es \u203A Habblaud World \u203A Bloqueados.": "{0} blocked. To undo: Settings \u203A Habblaud World \u203A Blocked.",
    "Den\xFAncia enviada. Obrigado: a modera\xE7\xE3o vai olhar.": "Report sent. Thanks: the moderators will take a look.",
    "O mundo n\xE3o respondeu a tempo. Tente de novo.": "The world didn't answer in time. Try again.",
    "Descurtir": "Unlike",
    "Desfazer o like no pr\xE9dio de {0}": "Undo the like on {0}'s building",
    "Curtir o pr\xE9dio de {0}": "Like {0}'s building",
    "Bater": "Knock",
    "Bater na porta de {0}": "Knock on {0}'s door",
    "Cumprimentar quem est\xE1 perto": "Greet someone nearby",
    "META DA CIDADE": "CITY GOAL",
    "A meta aparece com 10 pr\xE9dios acesos.": "The goal shows up with 10 lit buildings.",
    "PREFEITURA": "CITY HALL",
    'C\xF3digo do pr\xE9dio: "Ir para", no minimapa, leva at\xE9 a porta': 'Building code: "Go to", on the minimap, takes you to the door',
    "N\xE3o verificado: os dados deste pr\xE9dio est\xE3o em revis\xE3o.": "Unverified: this building's data is under review.",
    "Seu pr\xE9dio: os likes de hoje aparecem na barra do escrit\xF3rio.": "Your building: today's likes show up in the office bar.",
    "Chegue perto da porta para curtir (L).": "Get close to the door to like (L).",
    "Mais perto da porta, d\xE1 para bater (K).": "Closer to the door, you can knock (K).",
    "Motivo da den\xFAncia": "Report reason",
    "Qual o motivo?": "What's the reason?",
    "Den\xFAncia enviada.": "Report sent.",
    "Confirmar: bloquear": "Confirm: block",
    "Bloquear": "Block",
    "Voc\xEAs deixam de se ver: na rua, nos pr\xE9dios, nos cumprimentos e nos carimbos.": "You stop seeing each other: on the street, in buildings, in greetings and in stamps.",
    "Denunciado": "Reported",
    "Denunciar": "Report",
    // client/src/world/visit-social.ts
    "Escolha um carimbo para a portaria": "Pick a stamp for the front desk",
    "Um carimbo por pr\xE9dio por dia. O dono v\xEA quantos de cada recebeu, nunca quem deixou.": "One stamp per building per day. The owner sees how many of each they got, never who left them.",
    "Carimbo de hoje: {0}": "Today's stamp: {0}",
    "Deixar um carimbo": "Leave a stamp",
    "Carimbos da portaria": "Stamps at the front desk",
    "Carimbos da portaria: nenhum ainda": "Stamps at the front desk: none yet",
    "Carimbo deixado na portaria: {0}": "Stamp left at the front desk: {0}",
    "Entre no pr\xE9dio ou chegue mais perto da porta para carimbar.": "Go into the building or get closer to the door to stamp.",
    "O carimbo n\xE3o foi deixado. Tente de novo.": "The stamp wasn't left. Try again."
  };

  // vendor/habblaud/openbot/locale.ts
  var current = "zh-CN";
  var ZH = {
    "Recep\xE7\xE3o": "\u524D\u53F0",
    "Banheiros": "\u6D17\u624B\u95F4",
    "Copa": "\u8336\u6C34\u95F4",
    "Lounge": "\u4F11\u606F\u533A",
    "Responder no terminal": "\u7B49\u5F85\u56DE\u590D",
    "Esperando o dono": "\u7B49\u5F85\u4F19\u4F34",
    "visitante": "\u8BBF\u5BA2",
    "resultado": "\u7ED3\u679C",
    "Entregando: {0}": "\u4EA4\u4ED8\uFF1A{0}",
    "Chegou ao escrit\xF3rio": "\u6765\u5230\u529E\u516C\u5BA4",
    "1 tarefa j\xE1 conclu\xEDda": "\u5DF2\u5B8C\u6210 1 \u9879\u4EFB\u52A1",
    "{0} tarefas j\xE1 conclu\xEDdas": "\u5DF2\u5B8C\u6210 {0} \u9879\u4EFB\u52A1",
    "Tarefa conclu\xEDda: {0}": "\u4EFB\u52A1\u5B8C\u6210\uFF1A{0}"
  };
  function initializeLocale(locale = "zh-CN") {
    current = locale === "en" ? "en" : "zh-CN";
    return current;
  }
  var setLocale = initializeLocale;
  function tr(source, args) {
    const translated = (current === "zh-CN" ? ZH[source] : void 0) || EN[source] || source;
    return args?.length ? translated.replace(/\{(\d+)\}/g, (match, index) => Number(index) < args.length ? String(args[Number(index)]) : match) : translated;
  }

  // vendor/habblaud/upstream/client/src/art/character/appearance.ts
  function appearanceKey(a) {
    return [
      a.skin,
      a.hair,
      a.hairStyle,
      a.eyes,
      a.top,
      a.topAccent,
      a.topStyle,
      a.bottom,
      a.shoes,
      a.accessory,
      a.accessoryColor,
      a.lanyard ?? "-",
      a.look,
      a.facialHair ?? "-",
      a.bottomStyle ?? "-"
    ].join("|");
  }
  var uniq = (list) => [...new Set(list)];
  var colorsOf = (pairs) => pairs.map(([c]) => c);
  var ACCENTS = uniq([...LIGHT_ACCENTS, ...TOP_COLORS]);
  function topPalettes(style) {
    switch (style) {
      case "shirt_tie":
        return { top: SHIRT_COLORS, topAccent: TIE_COLORS };
      case "jacket":
        return { top: JACKET_COLORS, topAccent: ACCENTS };
      default:
        return { top: TOP_COLORS, topAccent: ACCENTS };
    }
  }
  function editorOptions(a) {
    const top = topPalettes(a.topStyle);
    return {
      skin: SKINS,
      hair: [...colorsOf(HAIR_NATURAL), ...HAIR_FUN],
      hairStyle: HAIR_STYLES,
      eyes: uniq(EYES),
      top: top.top,
      topAccent: top.topAccent,
      topStyle: TOP_STYLES,
      bottom: colorsOf(BOTTOMS),
      bottomStyle: BOTTOM_STYLES,
      shoes: colorsOf(SHOES),
      accessory: ACCESSORIES,
      accessoryColor: ACC_COLORS[a.accessory],
      facialHair: FACIAL_HAIR
    };
  }
  var TALL_HAIR = ["afro", "bun", "mohawk", "pigtails"];
  var SHORT_HAIR = ["bald", "buzz"];
  function editorConflict(a, key, value) {
    if (key === "accessory") {
      if ((value === "cap" || value === "beanie") && TALL_HAIR.includes(a.hairStyle)) return tr("N\xE3o combina com este cabelo");
      if (value === "bow" && SHORT_HAIR.includes(a.hairStyle)) return tr("N\xE3o combina com este cabelo");
    }
    if (key === "hairStyle") {
      if ((a.accessory === "cap" || a.accessory === "beanie") && TALL_HAIR.includes(value)) return tr("N\xE3o combina com o bon\xE9 ou o gorro");
      if (a.accessory === "bow" && SHORT_HAIR.includes(value)) return tr("N\xE3o combina com o la\xE7o");
    }
    return void 0;
  }
  function fitToOptions(a) {
    const o = editorOptions(a);
    const fit = (v, list) => list.includes(v) ? v : list[0];
    return { ...a, top: fit(a.top, o.top), topAccent: fit(a.topAccent, o.topAccent), accessoryColor: fit(a.accessoryColor, o.accessoryColor) };
  }

  // vendor/habblaud/upstream/client/src/art/core/color.ts
  var parseCache = /* @__PURE__ */ new Map();
  var MAGENTA = [255, 0, 255, 255];
  function parseColor(c) {
    let v = parseCache.get(c);
    if (!v) {
      v = parseUncached(c);
      parseCache.set(c, v);
    }
    return v;
  }
  function parseUncached(c) {
    const s = c.trim().toLowerCase();
    if (s === "transparent") return [0, 0, 0, 0];
    if (s.startsWith("#")) {
      const hex3 = s.slice(1);
      if (hex3.length === 3 || hex3.length === 4) {
        const n = [...hex3].map((ch) => parseInt(ch + ch, 16));
        return [n[0], n[1], n[2], hex3.length === 4 ? n[3] : 255];
      }
      if (hex3.length === 6 || hex3.length === 8) {
        const n = (i) => parseInt(hex3.slice(i, i + 2), 16);
        return [n(0), n(2), n(4), hex3.length === 8 ? n(6) : 255];
      }
      return MAGENTA;
    }
    const fn = /^(rgba?|hsla?)\(([^)]*)\)$/.exec(s);
    if (!fn) return MAGENTA;
    const parts = fn[2].split(/[\s,/]+/).filter(Boolean);
    const num = (p, scale) => {
      if (p === void 0) return 1;
      return p.endsWith("%") ? parseFloat(p) / 100 * scale : parseFloat(p);
    };
    const alphaOf = (p) => {
      if (p === void 0) return 255;
      const a = p.endsWith("%") ? parseFloat(p) / 100 : parseFloat(p);
      return Math.round(clamp01(a) * 255);
    };
    if (fn[1].startsWith("rgb")) {
      return [
        Math.round(num(parts[0], 255)),
        Math.round(num(parts[1], 255)),
        Math.round(num(parts[2], 255)),
        alphaOf(parts[3])
      ];
    }
    const h = parseFloat(parts[0] ?? "0");
    const sat = num(parts[1], 1);
    const lig = num(parts[2], 1);
    const [r, g, b] = hslToRgb(h, sat, lig);
    return [r, g, b, alphaOf(parts[3])];
  }
  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }
  var hex2 = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");
  function toHex(r, g, b, a = 255) {
    return a >= 255 ? `#${hex2(r)}${hex2(g)}${hex2(b)}` : `#${hex2(r)}${hex2(g)}${hex2(b)}${hex2(a)}`;
  }
  function rgbToHsl(r, g, b) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    return [h * 60, s, l];
  }
  function hslToRgb(h, s, l) {
    const hh = (h % 360 + 360) % 360 / 360;
    if (s === 0) {
      const v = Math.round(l * 255);
      return [v, v, v];
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const ch = (t2) => {
      let x = t2;
      if (x < 0) x += 1;
      if (x > 1) x -= 1;
      if (x < 1 / 6) return p + (q - p) * 6 * x;
      if (x < 1 / 2) return q;
      if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
      return p;
    };
    return [Math.round(ch(hh + 1 / 3) * 255), Math.round(ch(hh) * 255), Math.round(ch(hh - 1 / 3) * 255)];
  }
  function towardHue(h, target, deg) {
    let d = (target - h + 540) % 360 - 180;
    if (Math.abs(d) < deg) return target;
    d = Math.sign(d) * deg;
    return (h + d + 360) % 360;
  }
  var shadeCache = /* @__PURE__ */ new Map();
  function shade(c, k) {
    if (k === 0) return c;
    const key = `${c}|${k}`;
    const hit = shadeCache.get(key);
    if (hit) return hit;
    const [r, g, b, a] = parseColor(c);
    let [h, s, l] = rgbToHsl(r, g, b);
    const amt = Math.abs(k);
    if (k < 0) {
      h = towardHue(h, 235, amt * 55 * Math.min(1, s * 2 + 0.2));
      s = clamp01(s + amt * 0.12);
    } else {
      h = towardHue(h, 48, amt * 35 * Math.min(1, s * 2 + 0.2));
      s = clamp01(s - amt * 0.05);
    }
    l = clamp01(l + k);
    const [nr, ng, nb] = hslToRgb(h, s, l);
    const out = toHex(nr, ng, nb, a);
    shadeCache.set(key, out);
    return out;
  }
  function mix(a, b, t2) {
    const ca = parseColor(a);
    const cb = parseColor(b);
    const u = clamp01(t2);
    return toHex(
      ca[0] + (cb[0] - ca[0]) * u,
      ca[1] + (cb[1] - ca[1]) * u,
      ca[2] + (cb[2] - ca[2]) * u,
      ca[3] + (cb[3] - ca[3]) * u
    );
  }
  function luminance(c) {
    const [r, g, b] = parseColor(c);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }
  var rampCache = /* @__PURE__ */ new Map();
  function ramp(base, step = 0.08) {
    const key = `${base}|${step}`;
    let r = rampCache.get(key);
    if (!r) {
      r = {
        hi: shade(base, step * 2),
        lt: shade(base, step),
        base,
        dk: shade(base, -step),
        dd: shade(base, -step * 2)
      };
      rampCache.set(key, r);
    }
    return r;
  }
  var OUTLINE = "#272b3b";
  var outlineCache = /* @__PURE__ */ new Map();
  function outlineFor(r, g, b) {
    const key = r << 16 | g << 8 | b;
    let v = outlineCache.get(key);
    if (!v) {
      v = mix(shade(toHex(r, g, b), -0.45), OUTLINE, 0.7);
      outlineCache.set(key, v);
    }
    return v;
  }

  // vendor/habblaud/upstream/client/src/art/core/pixbuf.ts
  var PixelBuf = class _PixelBuf {
    constructor(w, h) {
      this.w = w;
      this.h = h;
      this.data = new Uint8ClampedArray(w * h * 4);
    }
    data;
    /**
     * Origem de desenho: todas as operações de pintura (set, rect, stamp, draw, shadow...) somam
     * (ox, oy). Operações globais (outline, bounds, crop) usam coordenadas absolutas.
     */
    ox = 0;
    oy = 0;
    inside(x, y) {
      return x >= 0 && y >= 0 && x < this.w && y < this.h;
    }
    alpha(x, y) {
      const xi = x + this.ox;
      const yi = y + this.oy;
      if (!this.inside(xi, yi)) return 0;
      return this.data[(yi * this.w + xi) * 4 + 3];
    }
    /** Pinta um pixel; cores com alfa < 1 são compostas por cima (source-over). */
    set(x, y, c) {
      if (!c) return;
      const xi = Math.floor(x) + this.ox;
      const yi = Math.floor(y) + this.oy;
      if (!this.inside(xi, yi)) return;
      const [r, g, b, a] = parseColor(c);
      this.blend(xi, yi, r, g, b, a);
    }
    /** Escrita rápida de cor opaca já convertida (sem parse nem mistura); respeita a origem. */
    put(x, y, c) {
      const xi = x + this.ox;
      const yi = y + this.oy;
      if (xi < 0 || yi < 0 || xi >= this.w || yi >= this.h) return;
      const i = (yi * this.w + xi) * 4;
      this.data[i] = c[0];
      this.data[i + 1] = c[1];
      this.data[i + 2] = c[2];
      this.data[i + 3] = c[3];
    }
    blend(x, y, r, g, b, a) {
      const i = (y * this.w + x) * 4;
      const d = this.data;
      if (a >= 255) {
        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
        d[i + 3] = 255;
        return;
      }
      if (a <= 0) return;
      const sa = a / 255;
      const da = d[i + 3] / 255;
      const oa = sa + da * (1 - sa);
      d[i] = (r * sa + d[i] * da * (1 - sa)) / oa;
      d[i + 1] = (g * sa + d[i + 1] * da * (1 - sa)) / oa;
      d[i + 2] = (b * sa + d[i + 2] * da * (1 - sa)) / oa;
      d[i + 3] = oa * 255;
    }
    /** Pinta POR BAIXO do que já existe (destination-over) — usado em sombras de contato. */
    under(x, y, c) {
      const xi = Math.floor(x) + this.ox;
      const yi = Math.floor(y) + this.oy;
      if (!this.inside(xi, yi)) return;
      const i = (yi * this.w + xi) * 4;
      const d = this.data;
      const [r, g, b, a] = parseColor(c);
      const da = d[i + 3] / 255;
      if (da >= 1) return;
      const sa = a / 255 * (1 - da);
      const oa = da + sa;
      if (oa <= 0) return;
      d[i] = (d[i] * da + r * sa) / oa;
      d[i + 1] = (d[i + 1] * da + g * sa) / oa;
      d[i + 2] = (d[i + 2] * da + b * sa) / oa;
      d[i + 3] = oa * 255;
    }
    clear(x, y) {
      const xi = x + this.ox;
      const yi = y + this.oy;
      if (!this.inside(xi, yi)) return;
      this.data.fill(0, (yi * this.w + xi) * 4, (yi * this.w + xi) * 4 + 4);
    }
    clearRect(x, y, w, h) {
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.clear(xx, yy);
    }
    rect(x, y, w, h, c) {
      if (!c || w <= 0 || h <= 0) return;
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c);
    }
    /** Linha horizontal inclusiva de x0 a x1. */
    hline(x0, x1, y, c) {
      const a = Math.min(x0, x1);
      const b = Math.max(x0, x1);
      for (let x = a; x <= b; x++) this.set(x, y, c);
    }
    /** Linha vertical inclusiva de y0 a y1. */
    vline(x, y0, y1, c) {
      const a = Math.min(y0, y1);
      const b = Math.max(y0, y1);
      for (let y = a; y <= b; y++) this.set(x, y, c);
    }
    /** Linha de Bresenham (com pincel quadrado opcional de `size` px). */
    line(x0, y0, x1, y1, c, size = 1) {
      let x = Math.round(x0);
      let y = Math.round(y0);
      const xe = Math.round(x1);
      const ye = Math.round(y1);
      const dx = Math.abs(xe - x);
      const dy = -Math.abs(ye - y);
      const sx = x < xe ? 1 : -1;
      const sy = y < ye ? 1 : -1;
      let err = dx + dy;
      for (; ; ) {
        if (size <= 1) this.set(x, y, c);
        else this.rect(x, y, size, size, c);
        if (x === xe && y === ye) break;
        const e2 = 2 * err;
        if (e2 >= dy) {
          err += dy;
          x += sx;
        }
        if (e2 <= dx) {
          err += dx;
          y += sy;
        }
      }
    }
    /** Elipse preenchida com centro (cx, cy) e raios rx, ry (aceita meios pixels). */
    ellipse(cx, cy, rx, ry, c) {
      if (!c) return;
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const nx = (x + 0.5 - cx) / rx;
          const ny = (y + 0.5 - cy) / ry;
          if (nx * nx + ny * ny <= 1) this.set(x, y, c);
        }
      }
    }
    /** Sombra de contato (elipse) composta por baixo do sprite. */
    shadow(cx, cy, rx, ry, c = "#1c2034", alpha = 0.22) {
      const [r, g, b] = parseColor(c);
      const col = `rgba(${r},${g},${b},${alpha})`;
      const inner = `rgba(${r},${g},${b},${Math.min(1, alpha * 1.35)})`;
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const nx = (x + 0.5 - cx) / rx;
          const ny = (y + 0.5 - cy) / ry;
          const d = nx * nx + ny * ny;
          if (d <= 1) this.under(x, y, d < 0.45 ? inner : col);
        }
      }
    }
    /**
     * Carimba um template ASCII: cada caractere é procurado na paleta; '.' e ' ' (ou ausentes) são
     * ignorados. `flip` espelha horizontalmente dentro da largura do template.
     */
    stamp(rows, x, y, pal, flip = false) {
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        for (let i = 0; i < row.length; i++) {
          const ch = row[i];
          if (ch === "." || ch === " ") continue;
          const col = pal[ch];
          if (!col) continue;
          const cx = flip ? row.length - 1 - i : i;
          this.set(x + cx, y + r, col);
        }
      }
    }
    /** Copia outro buffer por cima deste (com alfa), opcionalmente espelhado. */
    draw(src, dx, dy, flip = false) {
      for (let y = 0; y < src.h; y++) {
        for (let x = 0; x < src.w; x++) {
          const i = (y * src.w + x) * 4;
          const a = src.data[i + 3];
          if (!a) continue;
          const tx = dx + this.ox + (flip ? src.w - 1 - x : x);
          const ty = dy + this.oy + y;
          if (!this.inside(tx, ty)) continue;
          this.blend(tx, ty, src.data[i], src.data[i + 1], src.data[i + 2], a);
        }
      }
    }
    flipped() {
      const out = new _PixelBuf(this.w, this.h);
      out.draw(this, 0, 0, true);
      return out;
    }
    /** Recorta uma região em um novo buffer. */
    crop(x, y, w, h) {
      const out = new _PixelBuf(w, h);
      for (let yy = 0; yy < h; yy++) {
        for (let xx = 0; xx < w; xx++) {
          if (!this.inside(x + xx, y + yy)) continue;
          const si = ((y + yy) * this.w + (x + xx)) * 4;
          const di = (yy * w + xx) * 4;
          out.data[di] = this.data[si];
          out.data[di + 1] = this.data[si + 1];
          out.data[di + 2] = this.data[si + 2];
          out.data[di + 3] = this.data[si + 3];
        }
      }
      return out;
    }
    /**
     * Contorno automático de 1px (vizinhança 4) ao redor dos pixels opacos: usa uma versão escura da
     * cor vizinha mais escura, puxada para o cinza-azulado padrão (nunca preto puro).
     * `only` restringe a uma região (x, y, w, h).
     */
    outline(only) {
      const { w, h } = this;
      const src = this.data.slice();
      const x0 = only ? Math.max(0, only.x) : 0;
      const y0 = only ? Math.max(0, only.y) : 0;
      const x1 = only ? Math.min(w, only.x + only.w) : w;
      const y1 = only ? Math.min(h, only.y + only.h) : h;
      const opaque = (x, y) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] >= 160;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * w + x) * 4;
          if (src[i + 3] >= 160) continue;
          let best = -1;
          let bestLum = 1e9;
          const tryN = (nx, ny) => {
            if (!opaque(nx, ny)) return;
            const j = (ny * w + nx) * 4;
            const lum = src[j] * 0.3 + src[j + 1] * 0.59 + src[j + 2] * 0.11;
            if (lum < bestLum) {
              bestLum = lum;
              best = j;
            }
          };
          tryN(x, y - 1);
          tryN(x - 1, y);
          tryN(x + 1, y);
          tryN(x, y + 1);
          if (best < 0) continue;
          const [r, g, b] = parseColor(outlineFor(src[best], src[best + 1], src[best + 2]));
          this.data[i] = r;
          this.data[i + 1] = g;
          this.data[i + 2] = b;
          this.data[i + 3] = 255;
        }
      }
    }
    /** Caixa delimitadora dos pixels visíveis, ou null se vazio. */
    bounds() {
      let minX = this.w;
      let minY = this.h;
      let maxX = -1;
      let maxY = -1;
      for (let y = 0; y < this.h; y++) {
        for (let x = 0; x < this.w; x++) {
          if (this.data[(y * this.w + x) * 4 + 3] === 0) continue;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
      return maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
    }
    /** Quantidade de pixels visíveis (alfa > 0). */
    countOpaque() {
      let n = 0;
      for (let i = 3; i < this.data.length; i += 4) if (this.data[i]) n++;
      return n;
    }
  };

  // vendor/habblaud/upstream/client/src/art/character/hair.ts
  var t = (x, y, rows) => ({ x, y, rows });
  var HEAD_BASE = {
    down: t(0, 4, [
      "...ssssssss...",
      "..ssssssssss..",
      ".sssssssssssS.",
      ".sssssssssssS.",
      ".sssssssssssS.",
      ".sssssssssssS.",
      "ssssessssessSs",
      "SsssEssssEssSS",
      ".ssbssssssbsS.",
      "..ssssmmsssS..",
      "...sssssssS..."
    ]),
    up: t(0, 4, [
      "...ssssssss...",
      "..ssssssssss..",
      ".sssssssssssS.",
      ".sssssssssssS.",
      ".sssssssssssS.",
      ".sssssssssssS.",
      "ssssssssssssSs",
      "SssssssssssSSS",
      ".sssssssssssS.",
      "..ssssssssSS..",
      "...sssssssS..."
    ]),
    side: t(0, 4, [
      "...ssssssss...",
      "..ssssssssss..",
      ".sssssssssssS.",
      ".sssssssssssS.",
      ".sssssssssssS.",
      ".sssssssssssS.",
      ".sseSssssrsSS.",
      "sssEsssssrsSS.",
      ".sssbsssssSS..",
      ".smssssssSS...",
      "..sssssssS...."
    ])
  };
  var HAIR = {
    short: {
      down: {
        front: t(0, 2, [
          "....oooooo....",
          "..ooohhhhooo..",
          ".oohhHHhhoood.",
          "oohhhhhhoooodd",
          "ohhooooooooddd",
          "oooooooo...odd",
          "ood.d.......dd",
          "od..........dd"
        ])
      },
      up: {
        front: t(0, 2, [
          "....oooooo....",
          "..ooohhhhooo..",
          ".oohhHHhhoood.",
          "oohhhhhhoooodd",
          "ohhooooooooddd",
          "oooooooooooodd",
          "oooooooooooodd",
          "oooooooooooddd",
          ".oooooooooodd.",
          ".dooooooooodd.",
          "..ddoooooddd..",
          "....dddddd...."
        ])
      },
      side: {
        front: t(0, 2, [
          "....oooooo....",
          "..oohhhhhooo..",
          ".ohhHHhhhoood.",
          "oohhhhhhoooodd",
          "oooooohooooodd",
          ".o.o.ooooooodd",
          ".......oooodd.",
          ".......ooooddd",
          ".......d.oodd.",
          ".........oddd.",
          "..........dd.."
        ])
      }
    },
    buzz: {
      down: {
        front: t(0, 3, [
          "...oooooooo...",
          "..ohhhhooood..",
          ".ohhooooooood.",
          ".oooooooooood.",
          ".od........do.",
          ".d..........d."
        ])
      },
      up: {
        front: t(0, 3, [
          "...oooooooo...",
          "..ohhhhooood..",
          ".ohhooooooood.",
          ".oooooooooood.",
          ".oooooooooood.",
          ".oooooooooodd.",
          ".oooooooooodd.",
          ".dooooooooodd.",
          "..dooooooodd..",
          "...dddddddd..."
        ])
      },
      side: {
        front: t(0, 3, [
          "...oooooooo...",
          "..ohhhhooood..",
          ".ohhooooooood.",
          ".oooooooooood.",
          "....oooooood..",
          ".......ooood..",
          ".......d.ood..",
          ".........od...",
          ".........dd..."
        ])
      }
    },
    spiky: {
      down: {
        front: t(0, 0, [
          "...o...o..o...",
          "..oo..oho.oo..",
          ".ooohhhhhoood.",
          ".ohhHHhhooood.",
          "oohhhhhooooodd",
          "ohhooooooooodd",
          "oooo.ooo.oo.dd",
          "oo.o..o.....dd",
          "od..........dd",
          ".d..........d."
        ])
      },
      up: {
        front: t(0, 0, [
          "...o...o..o...",
          "..oo..oho.oo..",
          ".ooohhhhhoood.",
          ".ohhHHhhooood.",
          "oohhhhhooooodd",
          "ohhooooooooodd",
          "oooooooooooodd",
          "oooooooooooodd",
          "oooooooooooddd",
          ".oooooooooodd.",
          ".dooooooooodd.",
          "..ddoooooddd..",
          "....dddddd...."
        ])
      },
      side: {
        front: t(0, 0, [
          ".......o...o..",
          "....oo.oo.oo..",
          "..ooohhhhooo..",
          ".ohhHHhhhoood.",
          "oohhhhhhoooodd",
          "oooooohooooodd",
          "oo.o.ooooooodd",
          ".......oooodd.",
          ".......ooooddd",
          ".......d.oodd.",
          ".........oddd.",
          "..........dd.."
        ])
      }
    },
    side_part: {
      down: {
        front: t(0, 2, [
          "....oooooo....",
          "..ooDhhhhooo..",
          ".ooDhHHhhhood.",
          "oooDhhhhhhoodd",
          "ooo.oooooooddd",
          "oo....oooooodd",
          "od.......oo.dd",
          "od..........dd"
        ])
      },
      up: {
        front: t(0, 2, [
          "....oooooo....",
          "..ooDhhhhooo..",
          ".ooDhHHhhhood.",
          "oooDhhhhhhoodd",
          "oooDoooooooddd",
          "oooooooooooodd",
          "oooooooooooodd",
          "oooooooooooddd",
          ".oooooooooodd.",
          ".dooooooooodd.",
          "..ddoooooddd..",
          "....dddddd...."
        ])
      },
      side: {
        front: t(0, 2, [
          "....oooooo....",
          "..oohhhhhooo..",
          ".ohhHHhhhoood.",
          "oohhhhhhoooodd",
          "ohhhooooooodd.",
          "oo.ooooooooodd",
          "o......oooodd.",
          ".......ooooddd",
          ".......d.oodd.",
          ".........oddd.",
          "..........dd.."
        ])
      }
    },
    curly: {
      down: {
        front: t(0, 1, [
          "....ohoooo....",
          "..ohoHohooho..",
          ".oHohhohohood.",
          "ohohoohooohodd",
          "oohoohoooohodd",
          "ohoodoohodoodd",
          "oodo.o..o.oodd",
          "odo........odd",
          "do..........dd"
        ])
      },
      up: {
        front: t(0, 1, [
          "....ohoooo....",
          "..ohoHohooho..",
          ".oHohhohohood.",
          "ohohoohooohodd",
          "oohoohoooohodd",
          "ohoodoohodoodd",
          "oodoohoodoohdd",
          "odohoodohoodod",
          "ooodohooododdd",
          ".ohoodohoodod.",
          ".dodoohodoodd.",
          "..ddodooddd...",
          "....dddddd...."
        ])
      },
      side: {
        front: t(0, 1, [
          "....ohoooo....",
          "..ohoHohooho..",
          ".oHohhohohood.",
          "ohohoohooohodd",
          "oohoohoooohodd",
          "odo.dooohodood",
          ".o.o..oodoohdd",
          ".......ohooddd",
          ".......doodod.",
          "........d.odd.",
          ".........oddd.",
          "..........dd.."
        ])
      }
    },
    afro: {
      down: {
        front: t(-1, 0, [
          "....oohhhooo....",
          "..oohhHHhhoooo..",
          ".oohhHHhhhooooo.",
          "oohhhhhhoooooodd",
          "ohhhhooooooooodd",
          "ohhooooooooooodd",
          "oooooooooooooodd",
          "oooo........oodd",
          "ooo..........odd",
          "ood..........ddd",
          "od............dd",
          ".d............d."
        ])
      },
      up: {
        front: t(-1, 0, [
          "....oohhhooo....",
          "..oohhHHhhoooo..",
          ".oohhHHhhhooooo.",
          "oohhhhhhoooooodd",
          "ohhhhooooooooodd",
          "ohhooooooooooodd",
          "oooooooooooooodd",
          "oooooooooooooodd",
          "oooooooooooooddd",
          "oooooooooooooddd",
          ".oooooooooooodd.",
          ".ddooooooooddd..",
          "...ddddddddd...."
        ])
      },
      side: {
        front: t(-1, 0, [
          "....oohhhooo....",
          "..oohhHHhhoooo..",
          ".oohhHHhhhooooo.",
          "oohhhhhhoooooodd",
          "ohhhoooooooooodd",
          "ohhooooooooooodd",
          "oooooooooooooodd",
          "oo...ooooooooodd",
          "........oooooddd",
          "........d.oooddd",
          "..........oooddd",
          "..........oddd..",
          "...........dd..."
        ])
      }
    },
    bob: {
      down: {
        front: t(0, 2, [
          "....oooooo....",
          "..oohhhhhooo..",
          ".ohhHHhhhoood.",
          "ohhhhhhhoooodd",
          "ohhooooooooodd",
          "oooooooooooodd",
          "ooo........odd",
          "ood........odd",
          "od..........dd",
          "od..........dd",
          "od..........dd",
          "odd........ddd",
          ".dd........dd."
        ])
      },
      up: {
        front: t(0, 2, [
          "....oooooo....",
          "..oohhhhhooo..",
          ".ohhHHhhhoood.",
          "ohhhhhhhoooodd",
          "ohhooooooooodd",
          "oooooooooooodd",
          "oooooooooooodd",
          "oooooooooooodd",
          "oooooooooooddd",
          "oooooooooooddd",
          "oooooooooooddd",
          "odoooooooodddd",
          ".dddddddddddd."
        ])
      },
      side: {
        front: t(0, 2, [
          "....oooooo....",
          "..oohhhhhooo..",
          ".ohhHHhhhoood.",
          "oohhhhhhoooodd",
          "ohhooooooooood",
          "ooooooooooood.",
          "oo....oooooodd",
          "o.....oooooddd",
          "......ohoooddd",
          "......oooooddd",
          "......ooooodd.",
          "......dddoddd.",
          ".......ddddd.."
        ])
      }
    },
    long: {
      down: {
        front: t(0, 2, [
          "....oooooo....",
          "..oohhhhhooo..",
          ".ohhHhDhhHood.",
          "ohhhhDDohhoodd",
          "ohhoo....ooodd",
          "oho........odd",
          "oho........odd",
          "oo..........dd",
          "oo..........dd",
          "oh..........dd",
          "oo..........dd",
          "oo..........dd",
          "oho........odd",
          "ooo........odd",
          "odd........ddd",
          ".dd........dd."
        ]),
        back: t(-1, 8, [
          "oooooooooooooodd",
          "oooooooooooooodd",
          "oooooooooooooodd",
          "oooooooooooooodd",
          "oooooooooooooodd",
          "oooooooooooooodd",
          "oooooooooooooodd",
          "oooooooooooooodd",
          "dooooooooooooddd",
          "dddoooooooooddd.",
          ".dddddddddddd..."
        ])
      },
      up: {
        front: t(0, 2, [
          "....oooooo....",
          "..oohhhhhooo..",
          ".ohhHHhhhoood.",
          "ohhhhhhhoooodd",
          "ohhooooooooodd",
          "oooooooooooodd",
          "ohoooooooooodd",
          "ohoooooooooodd",
          "oooooooooooddd",
          "oooooooooooddd",
          "ooohoooooooddd",
          "oooooooooooddd",
          "ooohooooooodd.",
          "oooooooooooddd",
          "odoooooooooddd",
          "oddooooooodddd",
          ".dddoooooddd..",
          "...dddddddd..."
        ])
      },
      side: {
        front: t(0, 2, [
          "....oooooo....",
          "..oohhhhhooo..",
          ".ohhHHhhhoood.",
          "oohhhhhhoooodd",
          "ohhooooooooodd",
          "ooooooooooood.",
          "oo....oooooodd",
          "o.....ooooodd.",
          "......ohooodd.",
          "......oooooddd",
          "......ooohoddd",
          ".......oooodd.",
          ".......ooooddd",
          ".......ohooodd",
          ".......oooodd.",
          ".......ooood..",
          "........dddd.."
        ])
      }
    },
    ponytail: {
      down: {
        front: t(0, 2, [
          "....oooooo....",
          "..oohhhhhooo..",
          ".ohhHHhhhoood.",
          "ohhhhhhhoooodd",
          "ohoooooooooodd",
          "oo..........dd",
          "od..........dd",
          ".d...........d"
        ]),
        back: t(12, 4, [
          ".aa",
          "ohd",
          "ohd",
          "ood",
          "ohd",
          ".od",
          ".od",
          ".od",
          ".dd",
          "..d"
        ])
      },
      up: {
        front: t(0, 2, [
          "....oooooo....",
          "..oohhhhhooo..",
          ".ohhHHhhhoood.",
          "ohhhhhhhoooodd",
          "ohoooohooooddd",
          "ooooodaadooodd",
          "oooooohhoooodd",
          "ooooohoodooood",
          ".ooooohoddood.",
          ".dooooohodood.",
          "..ddooohodod..",
          "....ddohoddd..",
          "......ohod....",
          "......ohdd....",
          "......ood.....",
          ".......dd....."
        ])
      },
      side: {
        front: t(0, 2, [
          "....oooooo.....",
          "..oohhhhhoooo..",
          ".ohhHHhhhooaad.",
          "oohhhhhhoooohd.",
          "ohoooooooooohd.",
          "oo.ooooooooohd.",
          ".......ooood.od",
          ".......oood..od",
          ".......d.od..od",
          ".........dd..dd",
          "..............d"
        ])
      }
    },
    bun: {
      down: {
        front: t(0, 0, [
          ".....oooo.....",
          "....ohHhod....",
          "...ooddddoo...",
          "..oohhhhhooo..",
          ".ohhHHhhhoood.",
          "ohhhhhhhoooodd",
          "ohoooooooooodd",
          "oo..........dd",
          "od..........dd",
          ".d..........d."
        ])
      },
      up: {
        front: t(0, 0, [
          ".....oooo.....",
          "....ohHhod....",
          "...ooddddoo...",
          "..oohhhhhooo..",
          ".ohhHHhhhoood.",
          "ohhhhhhhoooodd",
          "ohoooooooooodd",
          "oooooooooooodd",
          "oooooooooooodd",
          "oooooooooooddd",
          ".oooooooooodd.",
          ".dooooooooodd.",
          "..ddoooooddd..",
          "....dddddd...."
        ])
      },
      side: {
        front: t(0, 0, [
          ".........ooo..",
          "........ohHod.",
          "....ooooodddd.",
          "..oohhhhhooo..",
          ".ohhHHhhhoood.",
          "oohhhhhhoooodd",
          "ohoooooooooodd",
          "oo.ooooooooodd",
          ".......oooodd.",
          ".......ooooddd",
          ".......d.oodd.",
          ".........oddd.",
          "..........dd.."
        ])
      }
    },
    pigtails: {
      down: {
        front: t(0, 2, [
          "....oooooo....",
          "..oohhDhhooo..",
          ".ohhHhDhHhood.",
          "ohhhhhDhhhoodd",
          "ohhooooooooodd",
          "ooo.o....o.odd",
          "od..........dd",
          "od..........dd"
        ]),
        back: t(-2, 8, [
          ".a..............a.",
          "oho............ohd",
          "ohd............ohd",
          "ohd............odd",
          "ood............odd",
          ".od............dd.",
          ".d..............d."
        ])
      },
      up: {
        front: t(-2, 2, [
          "......oooooo......",
          "....oohhDhhooo....",
          "...ohhHhDhHhood...",
          "..ohhhhhDhhhoodd..",
          "..ohhoooDooooodd..",
          "..ooooooDoooooddd.",
          "..ooooooDoooooodd.",
          ".aooooooDooooodda.",
          "ohooooooDoooooodhd",
          "ohd.ooooDooooo.ohd",
          "ohd..ddoDoodd..odd",
          "ood....dddd....odd",
          ".od............dd.",
          ".d..............d."
        ])
      },
      side: {
        front: t(0, 2, [
          "....oooooo....",
          "..oohhhhhooo..",
          ".ohhHHhhhoood.",
          "oohhhhhhoooodd",
          "ohhooooooooodd",
          "oo.o.ooooooodd",
          ".......oooodd.",
          ".......oooaad.",
          ".......d.oohd.",
          ".........ohdd.",
          ".........ohd..",
          ".........ood..",
          ".........odd..",
          "..........d..."
        ])
      }
    },
    mohawk: {
      down: {
        front: t(0, 0, [
          "......oo......",
          ".....ohoo.....",
          ".....hHod.....",
          "...zzhhodzz...",
          "..zzzohodzzz..",
          ".zzzzoooodzzz.",
          ".zzzzoood.zzz.",
          ".z..........z."
        ])
      },
      up: {
        front: t(0, 0, [
          "......oo......",
          ".....ohoo.....",
          ".....hHod.....",
          "...zzhhodzz...",
          "..zzzohodzzz..",
          ".zzzzoooodzzz.",
          ".zzzzoooodzzz.",
          ".zzzzoooodzzz.",
          ".zzzzoooodzzz.",
          ".zzzzzoodzzzz.",
          ".zzzzzoodzzzz.",
          "..zzzzoddzzz..",
          "....zzddzz...."
        ])
      },
      side: {
        front: t(0, 0, [
          "...ooo.o......",
          "..oohhoooo.o..",
          "..ohHHhhoooo..",
          "..zzzzzzzzodd.",
          ".zzzzzzzzzzzz.",
          ".zzzzzzzzzzzz.",
          ".......zzzzzz.",
          "........zzzzz.",
          ".......z.zzzz.",
          ".........zzz.."
        ])
      }
    },
    bald: {
      down: {
        front: t(0, 4, [
          "..............",
          "....kk........",
          "...k..........",
          "..............",
          "zz..........zz",
          "zz..........zz"
        ])
      },
      up: {
        front: t(0, 4, [
          "..............",
          "....kk........",
          "...k..........",
          "..............",
          ".zzzzzzzzzzzz.",
          "zzzzzzzzzzzzzz",
          ".zzzzzzzzzzzz.",
          "..zzzzzzzzzz.."
        ])
      },
      side: {
        front: t(0, 4, [
          "..............",
          "....kk........",
          "...k..........",
          "..............",
          ".......zzzzzz.",
          ".......z.zzzz.",
          ".........zzz.."
        ])
      }
    },
    wavy: {
      down: {
        front: t(0, 2, [
          "....oooooo....",
          "..oohhhhhooo..",
          ".ohhHHhhhoood.",
          "ohhhhhhhoooodd",
          "ohhooooooooddd",
          "oooooo....oodd",
          "ohd.......oodd",
          "oo........ohdd",
          "ho..........dh",
          "oh..........od",
          "oo..........hd",
          "ho..........do",
          "dho........ohd",
          ".dd........dd."
        ]),
        back: t(-1, 9, [
          "oooooooooooooodd",
          "hoooooooooooooho",
          "oooooooooooooodd",
          "ohooooooooooodhd",
          "oooooooooooooodd",
          "dhooooooooooohdd",
          ".ddoooooooooddd."
        ])
      },
      up: {
        front: t(0, 2, [
          "....oooooo....",
          "..oohhhhhooo..",
          ".ohhHHhhhoood.",
          "ohhhhhhhoooodd",
          "ohhooooooooddd",
          "oooooooooooodd",
          "ohoooohooooodd",
          "oohooooohooodd",
          "ooohoooooohodd",
          "oohooooohooodd",
          "ohoooohooooddd",
          "oohoooooohoddd",
          "ooohoooohooddd",
          "dohooohooohodd",
          ".ddohooohoddd.",
          "...dddddddd..."
        ])
      },
      side: {
        front: t(0, 2, [
          "....oooooo....",
          "..oohhhhhooo..",
          ".ohhHHhhhoood.",
          "oohhhhhhoooodd",
          "ohhooooooooodd",
          "oooooo.oooood.",
          "oo....oooooodd",
          "......ohoooodd",
          "......oohoohd.",
          "......ohooohdd",
          ".......oohoodd",
          ".......ohoohd.",
          ".......dohodd.",
          "........ddd..."
        ])
      }
    }
  };
  var TEXTURED = /* @__PURE__ */ new Set(["curly", "afro"]);

  // vendor/habblaud/upstream/client/src/art/character/render.ts
  var CHAR_W = 24;
  var CHAR_H = 34;
  var CHAR_AX = 12;
  var CHAR_AY = 31;
  var HX = 5;
  var HY = 3;
  var SEAT_DROP = 4;
  var POSE_FRAMES = {
    stand: 2,
    walk: 4,
    run: 4,
    sit: 2,
    type: 4,
    sleep: 2,
    drink: 2,
    use: 2,
    raise_hand: 2,
    talk: 2,
    stretch: 2,
    read: 2,
    play: 2,
    wait: 2,
    cheer: 2,
    laugh: 2,
    game: 2,
    rps: 2,
    groom: 2,
    sulk: 2
  };
  var POSE_DURATION = {
    stand: 650,
    walk: 140,
    run: 95,
    sit: 800,
    type: 120,
    sleep: 1e3,
    drink: 700,
    use: 380,
    raise_hand: 320,
    talk: 280,
    stretch: 800,
    read: 1100,
    play: 200,
    wait: 480,
    cheer: 260,
    laugh: 190,
    game: 150,
    rps: 300,
    groom: 420,
    sulk: 1300
  };
  var SEATED_ONLY = /* @__PURE__ */ new Set(["sit", "type", "sleep", "wait"]);
  var NEVER_SEATED = /* @__PURE__ */ new Set(["walk", "run", "stretch", "play", "groom"]);
  var OWN_HANDS = /* @__PURE__ */ new Set(["play", "drink", "raise_hand", "stretch", "cheer", "laugh", "game", "rps", "groom", "sulk"]);
  var GESTURES = /* @__PURE__ */ new Set(["rock", "paper", "scissors"]);
  function isSeated(pose, seated) {
    return SEATED_ONLY.has(pose) || !!seated && !NEVER_SEATED.has(pose);
  }
  var palCache = /* @__PURE__ */ new Map();
  function paletteOf(a) {
    let p = palCache.get(a);
    if (p) return p;
    const skin = ramp(a.skin, 0.07);
    const dark = luminance(a.skin) < 0.38;
    p = {
      skin,
      hair: ramp(a.hair, 0.09),
      top: ramp(a.top, 0.08),
      acc: ramp(a.topAccent, 0.08),
      bottom: ramp(a.bottom, 0.07),
      shoes: ramp(a.shoes, 0.08),
      item: ramp(a.accessoryColor, 0.1),
      eyeTop: dark ? "#ece8f2" : "#1d1826",
      eyeBot: dark ? mix(a.eyes, "#0c0910", 0.55) : mix(a.eyes, "#1d1826", 0.25),
      blush: mix(a.skin, "#ff7a7a", 0.32),
      mouth: shade(a.skin, -0.2),
      mouthOpen: "#7a2e35",
      shaved: mix(a.skin, a.hair, 0.42),
      stubble: mix(a.skin, a.hair, 0.3)
    };
    if (palCache.size > 4096) palCache.clear();
    palCache.set(a, p);
    return p;
  }
  var DOWN_A = { pts: [[6, 18], [6, 22]] };
  var DOWN_B = { pts: [[16, 18], [16, 22]] };
  function arm(...pts) {
    return { pts };
  }
  var TWO_HANDED = /* @__PURE__ */ new Set(["box", "laptop", "papers", "book"]);
  function makeRig(req, view) {
    const pose = req.pose;
    const n = POSE_FRAMES[pose];
    const f = (Math.floor(req.frame) % n + n) % n;
    const seated = isSeated(pose, req.seated);
    const held = req.held ?? "none";
    const rig = {
      view,
      seated,
      ub: seated ? SEAT_DROP : 0,
      hd: 0,
      lean: 0,
      legA: { dx: 0, dy: 0 },
      legB: { dx: 0, dy: 0 },
      armA: view === "side" ? arm([12, 18], [12, 22]) : DOWN_A,
      armB: view === "side" ? arm([10, 18], [10, 22]) : DOWN_B,
      eyes: "open",
      mouth: "none",
      held,
      itemBehind: view === "up",
      twoHands: false,
      itemAt: null,
      toeTap: false,
      tapAt: null,
      kernelAt: null,
      crossFront: null
    };
    const side = view === "side";
    switch (pose) {
      case "stand":
      case "sit":
        if (f === 1) rig.hd = 1;
        break;
      case "walk":
      case "run": {
        const run = pose === "run";
        const amp = run ? 2 : 1;
        if (f === 1 || f === 3) rig.ub -= 1;
        if (side) {
          const sw = [amp + 2, 0, -(amp + 2), 0][f];
          rig.legB = { dx: -sw, dy: f === 3 ? -2 : 0 };
          rig.legA = { dx: sw, dy: f === 1 ? -2 : 0 };
          const hs = [-2 - (run ? 1 : 0), 0, 2 + (run ? 1 : 0), 0][f];
          rig.armB = arm([10, 18], [10 + hs, run ? 21 : 22]);
          rig.armA = arm([12, 18], [12 - hs, run ? 21 : 22]);
          if (run) rig.lean = -1;
        } else {
          rig.legA.dy = [1, 0, 0, -amp][f];
          rig.legB.dy = [0, -amp, 1, 0][f];
          const sA = [-1, 0, 1, 0][f] * (run ? 2 : 1);
          rig.armA = arm([6, 18], [6 - (run ? 1 : 0), 22 + sA]);
          rig.armB = arm([16, 18], [16 + (run ? 1 : 0), 22 - sA]);
        }
        break;
      }
      case "type": {
        const up = f % 2 === 0;
        if (view === "up") {
          rig.armA = arm([7, 19], [5, 21], [6, 18 + (up ? -1 : 0)]);
          rig.armB = arm([15, 19], [17, 21], [16, 18 + (up ? 0 : -1)]);
        } else if (view === "down") {
          rig.armA = arm([6, 18], [6, 21], [8, 22 + (up ? 0 : 1)]);
          rig.armB = arm([16, 18], [16, 21], [14, 22 + (up ? 1 : 0)]);
        } else {
          rig.armB = arm([10, 18], [9, 21], [6, 21 + (up ? 0 : -1)]);
          rig.armA = arm([12, 18], [11, 21], [7, 21 + (up ? -1 : 0)]);
        }
        break;
      }
      case "sleep":
        rig.hd = f === 0 ? 2 : 3;
        rig.eyes = "closed";
        if (view === "down") {
          rig.armA = arm([6, 18], [7, 21], [9, 22]);
          rig.armB = arm([16, 18], [15, 21], [13, 22]);
        }
        break;
      case "raise_hand": {
        const wave = f === 1 ? 1 : 0;
        if (side) {
          rig.armB = arm([10, 18], [4, 14], [3 - wave, 6]);
        } else {
          rig.armB = arm([16, 18], [19, 14], [19 + wave, 7 + wave]);
        }
        rig.mouth = view === "down" && f === 0 ? "open" : "none";
        break;
      }
      case "talk":
        rig.mouth = f === 0 ? "open" : "none";
        if (side) {
          rig.armB = arm([10, 18], [9, 21], f === 0 ? [6, 19] : [7, 21]);
        } else if (f === 0) {
          rig.armB = arm([16, 18], [17, 21], [18, 19]);
        } else {
          rig.armA = arm([6, 18], [5, 21], [4, 19]);
        }
        break;
      case "stretch":
        rig.eyes = "closed";
        rig.mouth = view === "down" ? "open" : "none";
        if (f === 1) rig.ub -= 1;
        if (side) {
          rig.armB = arm([10, 18], [5, 13], [5, f === 0 ? 4 : 3]);
          rig.armA = arm([12, 18], [17, 12], [16, f === 0 ? 4 : 3]);
        } else {
          rig.armA = arm([6, 18], [4, 13], f === 0 ? [5, 5] : [4, 4]);
          rig.armB = arm([16, 18], [18, 13], f === 0 ? [17, 5] : [18, 4]);
        }
        break;
      case "read": {
        rig.held = held === "none" ? "book" : held;
        if (f === 1) rig.hd = 1;
        break;
      }
      case "play":
        rig.held = "paddle";
        if (side) {
          rig.armB = f === 0 ? arm([10, 18], [13, 20], [15, 18]) : arm([10, 18], [8, 19], [5, 18]);
        } else {
          rig.armB = f === 0 ? arm([16, 18], [18, 20], [19, 18]) : arm([16, 18], [18, 17], [19, 14]);
        }
        break;
      case "use": {
        const p = f === 1 ? 1 : 0;
        if (view === "up") rig.armB = arm([16, 18], [17, 15], [16, 12 - p]);
        else if (view === "down") rig.armB = arm([16, 18], [16, 21], [14, 23 + p]);
        else rig.armB = arm([10, 18], [8, 20], [5 - p, 20]);
        break;
      }
      case "wait":
        waitRig(rig, view, f, held);
        break;
      case "drink": {
        if (held === "none") rig.held = "coffee";
        const up = f === 1;
        if (side) rig.armB = up ? arm([10, 18], [8, 19], [6, 15]) : arm([10, 18], [10, 21], [8, 21]);
        else if (view === "down") rig.armB = up ? arm([16, 18], [16, 19], [13, 15]) : arm([16, 18], [17, 21], [16, 21]);
        else rig.armB = up ? arm([16, 18], [18, 17], [16, 14]) : arm([16, 18], [17, 21], [16, 21]);
        break;
      }
      case "cheer":
        cheerRig(rig, view, f);
        break;
      case "laugh":
        laughRig(rig, view, f);
        break;
      case "game":
        gameRig(rig, view, f);
        break;
      case "rps":
        rpsRig(rig, view, f, held);
        break;
      case "groom":
        groomRig(rig, view, f, held);
        break;
      case "sulk":
        sulkRig(rig, view, f);
        break;
    }
    const h = rig.held;
    if (h !== "none" && !rig.itemAt && !OWN_HANDS.has(pose)) {
      if (TWO_HANDED.has(h) || pose === "read") {
        rig.twoHands = true;
        if (side) {
          rig.armB = arm([10, 18], [10, 21], [7, 21]);
          rig.armA = arm([12, 18], [12, 21], [8, 20]);
        } else {
          rig.armA = arm([6, 18], [6, 20], [8, 21]);
          rig.armB = arm([16, 18], [16, 20], [14, 21]);
        }
      } else if (pose !== "type" && pose !== "use" && pose !== "sleep" && pose !== "talk") {
        if (side) rig.armB = arm([10, 18], [10, 21], [8, 21]);
        else rig.armB = arm([16, 18], [17, 21], [16, 21]);
      }
    }
    if (h === "paddle" && pose !== "play") rig.held = pose === "stand" || pose === "walk" || pose === "run" ? "paddle" : "none";
    return rig;
  }
  function waitRig(rig, view, f, held) {
    if (view === "down") rig.ub -= 1;
    else if (view === "up") rig.ub += 1;
    else rig.lean = 1;
    const eat = f === 1;
    if (held === "popcorn") {
      rig.itemBehind = false;
      if (view === "down") {
        rig.itemAt = [9, 17];
        rig.armA = arm([6, 18], [6, 21], [9, 21]);
        rig.armB = eat ? arm([16, 18], [17, 19], [11, 15]) : arm([16, 18], [16, 20], [15, 20]);
        rig.mouth = eat ? "none" : "open";
        if (eat) rig.kernelAt = [11, 14];
      } else if (view === "up") {
        rig.itemAt = [0, 18];
        rig.armB = arm([16, 18], [16, 22]);
        rig.armA = eat ? arm([6, 18], [3, 16], [6, 13]) : arm([6, 18], [4, 20], [3, 18]);
      } else {
        rig.itemAt = [3, 18];
        rig.armA = arm([12, 18], [12, 21], [8, 22]);
        rig.armB = eat ? arm([10, 18], [9, 21], [5, 16]) : arm([10, 18], [10, 21], [6, 19]);
        rig.mouth = eat ? "none" : "open";
        if (eat) rig.kernelAt = [5, 15];
      }
      return;
    }
    if (held !== "none") return;
    const lifted = f === 1;
    rig.eyes = "half";
    rig.toeTap = lifted;
    const tap = lifted ? -1 : 0;
    if (view === "down") {
      rig.crossFront = lifted ? 1 : 0;
    } else if (view === "up") {
      rig.armA = arm([6, 18], [4, 20], [6, 22]);
      rig.armB = arm([16, 18], [18, 20], [16, 22]);
      rig.tapAt = [3, 19 + tap];
    } else {
      rig.armA = arm([12, 18], [12, 21], [9, 21]);
      rig.armB = arm([10, 18], [10, 21], [7, 20 + tap]);
    }
  }
  function cheerRig(rig, view, f) {
    const jump = f === 1;
    rig.mouth = "open";
    if (jump) rig.eyes = "happy";
    if (jump) {
      if (rig.seated) rig.ub -= 1;
      else {
        rig.ub -= 2;
        rig.legA = { dx: 0, dy: -2 };
        rig.legB = { dx: 0, dy: -2 };
      }
    }
    if (view === "side") {
      rig.armB = jump ? arm([10, 18], [5, 13], [3, 3]) : arm([10, 18], [6, 13], [4, 4]);
      rig.armA = jump ? arm([12, 18], [17, 12], [18, 2]) : arm([12, 18], [16, 12], [17, 3]);
      return;
    }
    rig.armA = jump ? arm([6, 18], [3, 12], [2, 3]) : arm([6, 18], [4, 12], [3, 4]);
    rig.armB = jump ? arm([16, 18], [19, 12], [20, 3]) : arm([16, 18], [18, 12], [19, 4]);
  }
  function laughRig(rig, view, f) {
    rig.eyes = "happy";
    rig.mouth = f === 0 ? "wide" : "open";
    if (f === 0) rig.ub -= 1;
    if (view === "side") {
      rig.lean = f === 0 ? 1 : -1;
      rig.armB = arm([10, 18], [10, 21], [7, 22]);
      rig.armA = f === 0 ? arm([12, 18], [12, 22]) : arm([12, 18], [11, 21], [9, 23]);
      return;
    }
    if (view === "up") {
      rig.armA = arm([6, 18], [4, 21], [7, 22]);
      rig.armB = arm([16, 18], [18, 21], [15, 22]);
      return;
    }
    rig.armB = arm([16, 18], [17, 21], [14, 22]);
    rig.armA = f === 0 ? arm([6, 18], [6, 22]) : arm([6, 18], [5, 21], [4, 23]);
  }
  function gameRig(rig, view, f) {
    rig.held = "controller";
    rig.twoHands = true;
    const a = f === 0 ? 0 : 1;
    const b = 1 - a;
    if (view === "down") {
      rig.itemAt = [9, 20];
      rig.armA = arm([6, 18], [6, 20], [8, 20 + a]);
      rig.armB = arm([16, 18], [16, 20], [15, 20 + b]);
      return;
    }
    if (view === "side") {
      rig.lean = -1;
      rig.itemAt = [4, 19];
      rig.armA = arm([12, 18], [11, 21], [7, 20 + a]);
      rig.armB = arm([10, 18], [10, 21], [6, 20 + b]);
      return;
    }
    rig.held = "none";
    rig.twoHands = false;
    rig.armA = arm([6, 18], [4, 20], [7, 21 + a]);
    rig.armB = arm([16, 18], [18, 20], [15, 21 + b]);
  }
  function rpsRig(rig, view, f, held) {
    const reveal = GESTURES.has(held);
    rig.held = reveal ? held : "rock";
    rig.itemBehind = false;
    if (!reveal) {
      const up = f === 0;
      if (view !== "up") rig.mouth = up ? "open" : "none";
      if (view === "side") {
        rig.armB = up ? arm([10, 18], [6, 16], [3, 12]) : arm([10, 18], [6, 18], [3, 16]);
        rig.armA = arm([12, 18], [12, 22]);
      } else if (view === "down") {
        rig.armB = up ? arm([16, 18], [18, 15], [18, 11]) : arm([16, 18], [18, 18], [18, 15]);
        rig.armA = arm([6, 18], [5, 21], [6, 22]);
      } else {
        rig.armB = up ? arm([16, 18], [19, 15], [20, 11]) : arm([16, 18], [19, 18], [20, 15]);
        rig.armA = arm([6, 18], [6, 22]);
      }
      return;
    }
    const bob = f === 1 ? -1 : 0;
    if (view === "side") {
      rig.armB = arm([10, 18], [7, 19], [4, 19 + bob]);
      rig.armA = arm([12, 18], [12, 22]);
    } else if (view === "down") {
      rig.armB = arm([16, 18], [16, 20], [13, 20 + bob]);
      rig.armA = arm([6, 18], [6, 22]);
    } else {
      rig.armB = arm([16, 18], [19, 18], [21, 17 + bob]);
      rig.armA = arm([6, 18], [6, 22]);
    }
  }
  function groomRig(rig, view, f, held) {
    rig.itemBehind = false;
    const comb = held === "comb";
    if (view === "up") {
      rig.armB = f === 0 ? arm([16, 18], [20, 15], [18, 11]) : arm([16, 18], [20, 14], [17, 9]);
      return;
    }
    if (view === "side") {
      rig.armB = comb ? f === 0 ? arm([10, 18], [8, 15], [9, 9]) : arm([10, 18], [8, 14], [11, 8]) : f === 0 ? arm([10, 18], [9, 17], [6, 15]) : arm([10, 18], [9, 16], [6, 14]);
      return;
    }
    rig.armB = comb ? f === 0 ? arm([16, 18], [19, 14], [18, 9]) : arm([16, 18], [19, 13], [16, 8]) : f === 0 ? arm([16, 18], [18, 17], [14, 15]) : arm([16, 18], [18, 17], [13, 15]);
    if (!comb) rig.mouth = "none";
  }
  function sulkRig(rig, view, f) {
    rig.eyes = "half";
    rig.mouth = "frown";
    rig.hd = f === 0 ? 1 : 2;
    if (!rig.seated) rig.ub += 1;
    if (view === "side") {
      rig.lean = -1;
      rig.armB = arm([10, 18], [10, 22]);
      rig.armA = arm([12, 18], [12, 22]);
      return;
    }
    rig.armA = arm([6, 18], [7, 22]);
    rig.armB = arm([16, 18], [15, 22]);
  }
  function drawCrossedArms(dc, sleeveCol, sleeve, fingersUp) {
    const { b, p, r } = dc;
    const y = r.ub;
    const sl = sleeveCol;
    const fa = sleeve < 4 ? p.skin : sl;
    const sk = p.skin;
    for (let yy = 18; yy <= 20; yy++) {
      b.set(6, yy + y, yy === 20 ? sl.dk : sl.base);
      b.set(7, yy + y, sl.dk);
      b.set(16, yy + y, sl.base);
      b.set(17, yy + y, yy === 20 ? sl.dd : sl.dk);
    }
    b.hline(8, 15, 21 + y, fa.dk);
    b.set(16, 21 + y, sk.base);
    b.set(17, 21 + y, sk.dk);
    b.hline(8, 17, 19 + y, fa.lt);
    b.hline(8, 17, 20 + y, fa.base);
    b.set(17, 20 + y, fa.dk);
    b.set(12, 20 + y, fa.dk);
    const hy = fingersUp ? 18 : 19;
    b.set(5, hy + y, sk.lt);
    b.set(6, hy + y, sk.base);
    b.set(5, hy + 1 + y, sk.base);
    b.set(6, hy + 1 + y, sk.dk);
    b.set(7, 19 + y, sk.base);
    b.set(7, 20 + y, sk.dk);
  }
  function hairPalette(p, buzz) {
    const h = p.hair;
    if (buzz) {
      const b = mix(h.base, p.skin.base, 0.3);
      return { o: b, h: mix(h.lt, p.skin.base, 0.3), H: mix(h.hi, p.skin.base, 0.35), d: mix(h.dk, p.skin.base, 0.2), D: h.dd, z: p.shaved, k: p.skin.hi };
    }
    return { o: h.base, h: h.lt, H: h.hi, d: h.dk, D: h.dd, z: p.shaved, k: p.skin.hi };
  }
  function stampTpl(dc, tpl, pal, dy, textured = false) {
    const { b } = dc;
    const ox = HX + tpl.x + dc.r.lean;
    const oy = HY + tpl.y + dy;
    if (!textured) {
      b.stamp(tpl.rows, ox, oy, pal);
      return;
    }
    for (let r = 0; r < tpl.rows.length; r++) {
      const row = tpl.rows[r];
      for (let i = 0; i < row.length; i++) {
        let ch = row[i];
        if (ch === "." || ch === " ") continue;
        if (ch === "o") {
          const k = (i * 5 + (tpl.y + r) * 3) % 7;
          if (k === 0) ch = "d";
          else if (k === 3 && r < tpl.rows.length / 2) ch = "h";
        }
        b.set(ox + i, oy + r, pal[ch]);
      }
    }
  }
  function drawHead(dc) {
    const { p, r } = dc;
    const tpl = HEAD_BASE[r.view];
    const dy = r.ub + r.hd;
    const closed = r.eyes === "closed" || r.eyes === "happy";
    const half = r.eyes === "half";
    const pupil = luminance(p.eyeTop) > 0.5 ? p.eyeBot : p.eyeTop;
    const pal = {
      s: p.skin.base,
      S: p.skin.dk,
      L: p.skin.lt,
      e: closed ? p.skin.base : half ? shade(p.skin.base, -0.16) : p.eyeTop,
      E: closed ? shade(p.skin.base, -0.3) : half ? pupil : p.eyeBot,
      b: p.blush,
      m: r.mouth === "open" || r.mouth === "wide" ? p.mouthOpen : dc.a.look === "f" ? mix(p.mouth, "#c0505a", 0.25) : p.mouth,
      r: p.skin.dk
    };
    dc.b.stamp(tpl.rows, HX + tpl.x + r.lean, HY + tpl.y + dy, pal);
    const ox = HX + tpl.x + r.lean;
    const oy = HY + tpl.y + dy;
    if (r.eyes === "happy" && r.view !== "up") {
      const ink = mix(p.skin.base, "#1d1826", 0.7);
      for (const cx of r.view === "down" ? [4, 9] : [3]) {
        dc.b.set(ox + cx, oy + 6, ink);
        dc.b.set(ox + cx, oy + 7, p.skin.base);
        dc.b.set(ox + cx - 1, oy + 7, ink);
        dc.b.set(ox + cx + 1, oy + 7, ink);
      }
    }
    if (r.mouth === "frown" && r.view !== "up") {
      const corner = shade(p.mouth, -0.12);
      if (r.view === "down") {
        dc.b.set(ox + 5, oy + 10, corner);
        dc.b.set(ox + 8, oy + 10, corner);
      } else dc.b.set(ox + 3, oy + 10, corner);
    }
    if (r.mouth === "wide" && r.view !== "up") {
      const tongue = "#d8646e";
      if (r.view === "down") {
        dc.b.set(ox + 5, oy + 9, p.mouthOpen);
        dc.b.set(ox + 8, oy + 9, p.mouthOpen);
        dc.b.set(ox + 6, oy + 10, tongue);
        dc.b.set(ox + 7, oy + 10, tongue);
      } else {
        dc.b.set(ox + 1, oy + 9, p.mouthOpen);
        dc.b.set(ox + 2, oy + 10, tongue);
      }
    }
    if (r.view !== "up") dc.b.set(HX + 3 + r.lean, HY + 7 + dy, p.skin.lt);
  }
  function drawFacialHair(dc) {
    const style = dc.a.facialHair ?? "none";
    if (style === "none" || dc.r.view === "up") return;
    const { b, p, r } = dc;
    const ox = HX + r.lean;
    const oy = HY + r.ub + r.hd;
    const c = style === "stubble" ? p.stubble : p.hair.base;
    const cd = style === "stubble" ? shade(p.stubble, -0.04) : p.hair.dk;
    const put = (cx, cy, col = c) => b.set(ox + cx, oy + cy, col);
    if (r.view === "down") {
      if (style === "beard" || style === "stubble") {
        for (const cx of [1, 12]) for (const cy of [10, 11]) put(cx, cy, cd);
        for (let cx = 1; cx <= 12; cx++) put(cx, 12, cx > 9 ? cd : c);
        for (let cx = 2; cx <= 11; cx++) if (cx < 6 || cx > 7) put(cx, 13, cx > 9 ? cd : c);
        for (let cx = 3; cx <= 10; cx++) put(cx, 14, cd);
        if (style === "beard") {
          put(5, 12, p.hair.dk);
          put(8, 12, p.hair.dk);
        }
      } else if (style === "mustache") {
        for (let cx = 5; cx <= 8; cx++) put(cx, 12, cx === 8 ? cd : c);
      } else if (style === "goatee") {
        put(5, 13, c);
        put(8, 13, cd);
        for (let cx = 5; cx <= 8; cx++) put(cx, 14, cx > 6 ? cd : c);
      }
    } else {
      if (style === "beard" || style === "stubble") {
        for (const cy of [10, 11]) put(7, cy, cd);
        for (let cx = 1; cx <= 8; cx++) put(cx, 12, c);
        for (let cx = 1; cx <= 8; cx++) if (cx !== 2) put(cx, 13, cx > 5 ? cd : c);
        for (let cx = 2; cx <= 8; cx++) put(cx, 14, cd);
      } else if (style === "mustache") {
        put(1, 12, c);
        put(2, 12, c);
        put(3, 12, cd);
      } else if (style === "goatee") {
        put(1, 13, c);
        put(2, 14, c);
        put(3, 14, cd);
      }
    }
  }
  function drawHair(dc, layer) {
    const style = dc.a.hairStyle;
    const set = HAIR[style]?.[dc.r.view];
    const tpl = set?.[layer];
    if (!tpl) return;
    const pal = hairPalette(dc.p, style === "buzz");
    const pal2 = { ...pal, a: dc.a.accessory === "bow" ? dc.p.item.base : shade(dc.a.top, 0.05) };
    stampTpl(dc, tpl, pal2, dc.r.ub + dc.r.hd, TEXTURED.has(style));
  }
  function drawAccessory(dc) {
    const { b, p, r, a } = dc;
    const ox = HX + r.lean;
    const oy = HY + r.ub + r.hd;
    const put = (cx, cy, col) => b.set(ox + cx, oy + cy, col);
    const it = p.item;
    const v = r.view;
    switch (a.accessory) {
      case "glasses": {
        const fr = shade(it.dk, -0.08);
        const lens = "rgba(225,240,255,0.6)";
        if (v === "down") {
          for (const x0 of [3, 8]) {
            put(x0, 10, fr);
            put(x0 + 1, 10, fr);
            put(x0 + 2, 10, fr);
            put(x0, 11, fr);
            put(x0 + 2, 11, lens);
          }
          for (const cx of [1, 2, 6, 7, 11, 12]) put(cx, 10, it.base);
        } else if (v === "side") {
          put(2, 10, fr);
          put(3, 10, fr);
          put(4, 10, fr);
          put(2, 11, fr);
          put(4, 11, fr);
          for (let cx = 5; cx <= 8; cx++) put(cx, 10, it.base);
        } else {
          put(0, 10, it.dk);
          put(13, 10, it.dk);
        }
        break;
      }
      case "sunglasses": {
        if (v === "down") {
          for (let cx = 2; cx <= 11; cx++) put(cx, 10, "#15161c");
          for (const cx of [2, 3, 4, 5, 8, 9, 10, 11]) put(cx, 11, cx === 3 || cx === 9 ? "#5a6b8a" : "#15161c");
          put(0, 10, "#15161c");
          put(13, 10, "#15161c");
        } else if (v === "side") {
          for (let cx = 1; cx <= 4; cx++) put(cx, 10, "#15161c");
          for (let cx = 1; cx <= 3; cx++) put(cx, 11, cx === 2 ? "#5a6b8a" : "#15161c");
          for (let cx = 5; cx <= 8; cx++) put(cx, 10, "#15161c");
        } else {
          put(0, 10, "#15161c");
          put(13, 10, "#15161c");
        }
        break;
      }
      case "headphones": {
        if (v === "side") {
          for (let cx = 5; cx <= 9; cx++) put(cx, 2, cx === 7 ? it.lt : it.base);
          put(4, 3, it.base);
          put(10, 3, it.dk);
          for (let cy = 4; cy <= 8; cy++) put(7, cy, it.dk);
          for (let cy = 9; cy <= 12; cy++) for (let cx = 6; cx <= 9; cx++) put(cx, cy, cy === 9 || cx === 6 ? it.lt : it.base);
          put(9, 12, it.dk);
        } else {
          for (let cx = 3; cx <= 10; cx++) put(cx, 1, cx < 6 ? it.lt : it.base);
          put(2, 2, it.base);
          put(11, 2, it.dk);
          for (let cy = 3; cy <= 8; cy++) {
            put(1, cy, it.base);
            put(12, cy, it.dk);
          }
          for (let cy = 9; cy <= 12; cy++) {
            put(0, cy, it.base);
            put(1, cy, cy === 9 ? it.lt : it.base);
            put(12, cy, it.dk);
            put(13, cy, it.dk);
          }
        }
        break;
      }
      case "cap": {
        const brim = it.dk;
        if (v === "down") {
          const rows = ["....oooooo....", "..oohhhhoooo..", ".ohhHhhhooood.", ".oohhhooooood.", "bbbbbbbbbbbbbb"];
          b.stamp(rows, ox, oy + 2, { o: it.base, h: it.lt, H: it.hi, d: it.dk, b: brim });
          put(6, 3, "#f4f2ee");
          put(7, 3, "#f4f2ee");
        } else if (v === "up") {
          const rows = ["....oooooo....", "..oohhhhoooo..", ".ohhHhhhooood.", ".oohhhooooood.", ".oooo....oodd.", ".....d..d....."];
          b.stamp(rows, ox, oy + 2, { o: it.base, h: it.lt, H: it.hi, d: it.dk });
        } else {
          const rows = [".....oooooo...", "...oohhhhooo..", "..ohHhhhoooood", "..ohhhooooooo.", "bbbbbboooood.."];
          b.stamp(rows, ox - 1, oy + 2, { o: it.base, h: it.lt, H: it.hi, d: it.dk, b: brim });
        }
        break;
      }
      case "beanie": {
        const rib = it.dk;
        const rows = v === "side" ? [".....ww.......", "....oooooo....", "..oohhhooooo..", ".ohhHhhoooood.", ".ohhhhooooood.", ".rrrrrrrrrrrr."] : ["......ww......", "....oooooo....", "..oohhhooooo..", ".ohhHhhoooood.", ".ohhhhooooood.", "rrrrrrrrrrrrrr"];
        b.stamp(rows, ox, oy + 1, { o: it.base, h: it.lt, H: it.hi, d: it.dk, r: rib, w: "#f4f2ee" });
        for (let cx = 1; cx <= 12; cx += 2) put(cx, 6, shade(rib, -0.06));
        break;
      }
      case "earrings": {
        if (v === "down") {
          put(0, 12, it.base);
          put(13, 12, it.dk);
        } else if (v === "side") put(8, 12, it.base);
        break;
      }
      case "bow": {
        const rows = ["oo.oo", "ohdho", ".o.o."];
        const pal = { o: it.base, h: it.lt, d: it.dd };
        if (v === "down") b.stamp(rows, ox + 8, oy + 2, pal);
        else if (v === "up") b.stamp(rows, ox + 1, oy + 2, pal);
        else b.stamp(rows, ox + 7, oy + 1, pal);
        break;
      }
      case "none":
        break;
    }
  }
  function drawArm(dc, a, sleeveCol, sleeve, dim = 0, backShadow = false) {
    const { b, p, r } = dc;
    const pts = [];
    for (let i = 0; i < a.pts.length - 1; i++) {
      const [x0, y0] = a.pts[i];
      const [x1, y1] = a.pts[i + 1];
      const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let s = i === 0 ? 0 : 1; s <= steps; s++) {
        pts.push([Math.round(x0 + (x1 - x0) * s / Math.max(1, steps)), Math.round(y0 + (y1 - y0) * s / Math.max(1, steps))]);
      }
    }
    if (a.pts.length === 1) pts.push([a.pts[0][0], a.pts[0][1]]);
    const dy = r.ub;
    const lean = r.lean;
    const sk = dim ? ramp(shade(p.skin.base, -dim), 0.07) : p.skin;
    const sl = dim ? ramp(shade(sleeveCol.base, -dim), 0.08) : sleeveCol;
    if (backShadow) {
      const sep = shade(sleeveCol.dd, -0.06);
      for (const [x, y] of pts) {
        if (b.alpha(x + 2 + lean, y + dy) > 0) b.set(x + 2 + lean, y + dy, sep);
      }
    }
    pts.forEach(([x, y], i) => {
      const last = i === pts.length - 1;
      const isSleeve = i < sleeve && !last;
      const c = isSleeve ? sl : sk;
      b.set(x + lean, y + dy, c.base);
      b.set(x + 1 + lean, y + dy, c.dk);
      b.set(x + lean, y + 1 + dy, isSleeve && i === sleeve - 1 ? c.dk : c.base);
      b.set(x + 1 + lean, y + 1 + dy, c.dk);
    });
    const [hx, hy] = pts[pts.length - 1];
    b.set(hx + lean, hy + dy, sk.lt);
    b.set(hx + 1 + lean, hy + dy, sk.base);
    b.set(hx + lean, hy + 1 + dy, sk.base);
    b.set(hx + 1 + lean, hy + 1 + dy, sk.dk);
  }
  function sleeveLength(a) {
    switch (a.topStyle) {
      case "tshirt":
      case "polo":
        return 2;
      case "blouse":
        return 3;
      default:
        return 99;
    }
  }
  function drawLegs(dc) {
    const { b, p, r, a } = dc;
    const pants = p.bottom;
    const sh = p.shoes;
    const style = a.bottomStyle ?? "pants";
    const skinLeg = style !== "pants";
    if (r.view === "side") {
      drawLegsSide(dc, pants, sh, skinLeg);
      return;
    }
    if (r.seated) {
      if (r.view === "down") {
        const y0 = 24 + r.ub;
        const lapTop = style === "skirt" ? p.bottom : pants;
        b.rect(8, y0, 8, 1, lapTop.lt);
        b.rect(8, y0 + 1, 8, 1, lapTop.base);
        b.set(15, y0, lapTop.base);
        b.set(15, y0 + 1, lapTop.dk);
        b.set(11, y0 + 1, lapTop.dk);
        if (skinLeg) {
          b.rect(9, y0 + 2, 2, 1, p.skin.base);
          b.rect(13, y0 + 2, 2, 1, p.skin.dk);
        } else {
          b.rect(8, y0 + 2, 3, 1, pants.dk);
          b.rect(13, y0 + 2, 3, 1, pants.dk);
        }
        b.rect(8, 30, 3, 1, sh.base);
        b.set(8, 30, sh.lt);
        if (r.toeTap) {
          b.rect(13, 29, 3, 1, sh.base);
          b.set(13, 29, sh.lt);
          b.set(14, 30, sh.dk);
        } else {
          b.rect(13, 30, 3, 1, sh.base);
          b.set(13, 30, sh.lt);
        }
      } else {
        const y0 = 24 + r.ub;
        b.rect(8, y0, 8, 2, pants.base);
        b.rect(8, y0 + 1, 8, 1, pants.dk);
        b.set(11, y0, pants.dk);
        b.set(12, y0, pants.dk);
      }
      return;
    }
    const top = 24 + r.ub;
    b.rect(8, top, 8, 2, pants.base);
    b.set(15, top, pants.dk);
    b.set(15, top + 1, pants.dk);
    if (style === "skirt") {
      b.rect(7, top + 2, 10, 1, pants.base);
      b.set(16, top + 2, pants.dk);
      b.rect(8, top + 2, 1, 1, pants.lt);
      b.set(11, top + 1, pants.dk);
      b.set(12, top + 2, pants.dk);
    }
    const leg = (x, dyFoot, shadeRight) => {
      const y1 = 28 + dyFoot;
      for (let y = top + 2; y <= y1; y++) {
        const isSkin = skinLeg && y >= top + 3;
        const c = isSkin ? p.skin : pants;
        b.set(x, y, c.base);
        b.set(x + 1, y, c.base);
        b.set(x + 2, y, shadeRight ? c.dk : c.base);
      }
      b.rect(x, y1 + 1, 3, 1, sh.base);
      b.set(x, y1 + 1, sh.lt);
      b.rect(x, y1 + 2, 3, 1, sh.dk);
    };
    const a1 = r.view === "up" ? r.legB.dy : r.legA.dy;
    const b1 = r.view === "up" ? r.legA.dy : r.legB.dy;
    leg(8, a1, true);
    leg(13, b1, true);
    if (!skinLeg || style === "shorts") {
      b.set(10, top + 2, pants.dk);
      b.set(13, top + 2, pants.base);
    }
  }
  function drawLegsSide(dc, pants, sh, skinLeg) {
    const { b, p, r, a } = dc;
    const style = a.bottomStyle ?? "pants";
    if (r.seated) {
      const y0 = 24 + r.ub;
      b.rect(7, y0 - 1, 7, 2, pants.base);
      b.rect(7, y0 - 1, 6, 1, pants.lt);
      b.set(13, y0, pants.dk);
      const shin = skinLeg ? p.skin : pants;
      b.rect(7, y0 + 1, 2, 30 - (y0 + 1), shin.base);
      b.set(8, y0 + 1, shin.dk);
      if (r.toeTap) {
        b.rect(5, 29, 2, 1, sh.base);
        b.set(5, 29, sh.lt);
        b.rect(7, 30, 2, 1, sh.base);
      } else {
        b.rect(5, 30, 4, 1, sh.base);
        b.set(5, 30, sh.lt);
      }
      return;
    }
    const top = 24 + r.ub;
    b.rect(9, top, 5, 2, pants.base);
    b.set(9, top, pants.lt);
    b.set(13, top, pants.dk);
    b.set(13, top + 1, pants.dk);
    if (style === "skirt") {
      b.rect(8, top + 1, 7, 2, pants.base);
      b.set(8, top + 1, pants.lt);
      b.set(14, top + 2, pants.dk);
    }
    const leg = (dx, lift, dim) => {
      const pc = dim ? ramp(pants.dk, 0.07) : pants;
      const sc = dim ? ramp(p.skin.dk, 0.07) : p.skin;
      const shc = dim ? ramp(sh.dk, 0.08) : sh;
      const y0 = top + 2;
      const y1 = 28 - lift;
      for (let y = y0; y <= y1; y++) {
        const tt = (y - y0) / Math.max(1, y1 - y0);
        const x = Math.round(10 + dx * tt);
        const c = skinLeg && y >= top + 3 ? sc : pc;
        b.set(x, y, c.lt);
        b.set(x + 1, y, c.base);
        b.set(x + 2, y, c.dk);
      }
      const fx = Math.round(10 + dx);
      b.rect(fx - 1, y1 + 1, 4, 1, shc.base);
      b.set(fx - 1, y1 + 1, shc.lt);
      b.rect(fx - 1, y1 + 2, 4, 1, shc.dk);
    };
    leg(r.legA.dx, -r.legA.dy, true);
    leg(r.legB.dx, -r.legB.dy, false);
  }
  function drawTorso(dc) {
    const { b, p, r, a } = dc;
    const y = 18 + r.ub;
    const t2 = p.top;
    const ac = p.acc;
    const lx = r.lean;
    if (r.view === "side") {
      b.rect(8 + lx, y, 7, 6, t2.base);
      for (let yy = y; yy < y + 6; yy++) {
        b.set(8 + lx, yy, t2.lt);
        b.set(14 + lx, yy, t2.dk);
      }
      b.rect(8 + lx, y + 5, 7, 1, t2.dk);
      switch (a.topStyle) {
        case "hoodie":
          b.rect(12 + lx, y - 1, 3, 2, t2.dk);
          b.set(13 + lx, y - 1, t2.base);
          b.set(9 + lx, y + 1, ac.base);
          b.set(9 + lx, y + 2, ac.base);
          b.rect(9 + lx, y + 4, 4, 1, t2.dk);
          break;
        case "shirt_tie":
          b.set(9 + lx, y, t2.hi);
          b.set(10 + lx, y, t2.hi);
          for (let yy = y + 1; yy <= y + 4; yy++) b.set(9 + lx, yy, ac.base);
          b.set(9 + lx, y, ac.dk);
          break;
        case "jacket":
          b.set(9 + lx, y + 1, ac.base);
          b.set(9 + lx, y + 2, ac.base);
          b.set(9 + lx, y + 3, ac.base);
          b.set(10 + lx, y, t2.hi);
          break;
        case "sweater":
          b.rect(9 + lx, y + 2, 6, 1, ac.base);
          b.rect(9 + lx, y + 5, 6, 1, t2.dd);
          break;
        case "polo":
          b.set(10 + lx, y, ac.base);
          b.set(11 + lx, y, ac.base);
          break;
        case "blouse":
          b.set(9 + lx, y, ac.lt);
          b.set(10 + lx, y, ac.lt);
          b.set(9 + lx, y + 2, ac.base);
          b.rect(8 + lx, y + 5, 7, 1, t2.dk);
          break;
        case "tshirt":
          b.set(9 + lx, y + 2, ac.base);
          break;
      }
      drawLanyard(dc);
      return;
    }
    b.rect(8, y, 8, 6, t2.base);
    for (let yy = y; yy < y + 6; yy++) {
      b.set(8, yy, t2.lt);
      b.set(15, yy, t2.dk);
    }
    b.rect(8, y + 5, 8, 1, t2.dk);
    b.set(8, y + 5, t2.base);
    const front = r.view === "down";
    switch (a.topStyle) {
      case "tshirt":
        b.rect(10, y, 4, 1, t2.dk);
        if (front) {
          b.rect(10, y + 2, 2, 2, ac.base);
          b.set(11, y + 3, ac.dk);
        }
        break;
      case "hoodie":
        if (front) {
          b.rect(9, y, 6, 1, t2.dk);
          b.set(9, y, t2.lt);
          b.set(10, y + 1, ac.lt);
          b.set(10, y + 2, ac.base);
          b.set(13, y + 1, ac.lt);
          b.set(13, y + 2, ac.base);
          b.rect(9, y + 3, 6, 2, t2.dk);
          b.rect(10, y + 3, 4, 1, t2.base);
        } else {
          b.rect(9, y, 6, 3, t2.dk);
          b.rect(10, y, 4, 2, t2.dd);
          b.rect(10, y, 4, 1, t2.dk);
        }
        b.rect(8, y + 5, 8, 1, t2.dd);
        break;
      case "shirt_tie":
        if (front) {
          b.set(9, y, t2.hi);
          b.set(10, y, t2.hi);
          b.set(13, y, t2.hi);
          b.set(14, y, t2.hi);
          b.set(11, y, ac.lt);
          b.set(12, y, ac.base);
          for (let yy = y + 1; yy <= y + 4; yy++) {
            b.set(11, yy, ac.base);
            b.set(12, yy, ac.dk);
          }
          b.set(11, y + 5, ac.dk);
        } else {
          b.rect(9, y, 6, 1, t2.hi);
        }
        break;
      case "sweater":
        if (front) b.rect(10, y, 4, 1, t2.dd);
        b.rect(8, y + 2, 8, 1, ac.base);
        b.set(15, y + 2, ac.dk);
        b.rect(8, y + 5, 8, 1, t2.dd);
        break;
      case "jacket":
        if (front) {
          b.rect(10, y, 4, 6, ac.base);
          b.set(13, y, ac.dk);
          for (let yy = y; yy < y + 6; yy++) b.set(13, yy, ac.dk);
          b.set(10, y, t2.hi);
          b.set(13, y, t2.lt);
          b.set(10, y + 1, t2.lt);
          b.set(13, y + 1, t2.base);
        } else {
          b.vline(11, y + 1, y + 5, t2.dk);
          b.rect(9, y, 6, 1, t2.lt);
        }
        break;
      case "blouse":
        if (front) {
          b.rect(9, y, 6, 1, ac.lt);
          b.set(11, y + 1, ac.lt);
          b.set(12, y + 1, ac.base);
          b.set(11, y + 3, ac.dk);
        } else b.rect(9, y, 6, 1, ac.base);
        b.rect(7, y + 5, 10, 1, t2.dk);
        b.set(7, y + 5, t2.base);
        break;
      case "polo":
        if (front) {
          b.set(9, y, ac.lt);
          b.set(10, y, ac.base);
          b.set(13, y, ac.base);
          b.set(14, y, ac.dk);
          b.set(11, y, t2.dk);
          b.set(12, y, t2.dk);
          b.set(11, y + 1, t2.dk);
          b.set(11, y + 2, ac.lt);
        } else b.rect(9, y, 6, 1, ac.base);
        break;
    }
    drawLanyard(dc);
  }
  function drawLanyard(dc) {
    const col = dc.a.lanyard;
    if (!col) return;
    const { b, r } = dc;
    const y = 18 + r.ub;
    const card = "#f6f4ee";
    const lx = r.lean;
    if (r.view === "down") {
      b.set(10, y, col);
      b.set(13, y, col);
      b.set(10, y + 1, col);
      b.set(13, y + 1, col);
      b.set(11, y + 2, col);
      b.set(12, y + 2, col);
      b.rect(10, y + 3, 4, 3, card);
      b.rect(10, y + 3, 4, 1, shade(col, -0.05));
      b.set(11, y + 4, "#7f93b3");
      b.set(12, y + 4, "#c9d2e0");
      b.set(13, y + 5, "#d6d3cb");
    } else if (r.view === "up") {
      b.hline(9, 14, y, col);
      b.set(9, y + 1, shade(col, -0.1));
      b.set(14, y + 1, shade(col, -0.1));
    } else {
      b.set(11 + lx, y, col);
      b.set(10 + lx, y + 1, col);
      b.set(9 + lx, y + 2, col);
      b.rect(8 + lx, y + 3, 2, 3, card);
      b.set(8 + lx, y + 3, shade(col, -0.05));
      b.set(9 + lx, y + 3, shade(col, -0.05));
    }
  }
  var MUG = ["wwwo", "cccw", "rrrh", "wwwh", "www."];
  var CUP = ["bbb", "www", "www", ".w."];
  function drawItem(dc, x, y) {
    const { b, r } = dc;
    const it = r.held;
    const side = r.view === "side";
    switch (it) {
      case "coffee":
        b.stamp(MUG, x, y, { w: "#f4f2ee", c: "#6b4226", r: "#e2604f", h: "#cfcac0", o: "#f4f2ee" }, side);
        break;
      case "water":
        b.stamp(CUP, x, y, { b: "#9ad4f5", w: "#eef6fb" });
        break;
      case "papers":
        if (side) {
          b.rect(x, y, 2, 6, "#f6f4ee");
          b.vline(x + 1, y, y + 5, "#d9d5cb");
        } else {
          b.rect(x + 1, y - 1, 6, 6, "#e7e3d8");
          b.rect(x, y, 6, 6, "#f8f6f0");
          for (let i = 0; i < 3; i++) b.hline(x + 1, x + 3 + i % 2, y + 1 + i * 2, "#a6b0c0");
        }
        break;
      case "book":
        if (side) {
          b.rect(x, y, 2, 6, "#3f63a8");
          b.vline(x + 1, y + 1, y + 4, "#f2efe6");
        } else if (r.view === "down" && r.twoHands) {
          b.rect(x, y, 8, 5, "#f6f3ea");
          b.vline(x + 3, y, y + 4, "#cfc8b8");
          b.vline(x + 4, y, y + 4, "#e2dccd");
          for (let i = 0; i < 2; i++) {
            b.hline(x + 1, x + 2, y + 1 + i * 2, "#a8b0bf");
            b.hline(x + 5, x + 6, y + 1 + i * 2, "#a8b0bf");
          }
          b.hline(x, x + 7, y + 5, "#3f63a8");
        } else {
          b.rect(x, y, 5, 6, "#3f63a8");
          b.rect(x + 1, y + 1, 3, 1, "#f2c14e");
          b.vline(x + 4, y, y + 5, "#2d4a85");
        }
        break;
      case "laptop":
        if (side) {
          b.rect(x, y, 2, 7, "#aeb6c2");
          b.vline(x, y, y + 6, "#d3d8df");
        } else {
          b.rect(x, y, 8, 5, "#b9c0cb");
          b.hline(x, x + 7, y, "#d9dee5");
          b.rect(x + 3, y + 2, 2, 1, "#eef1f5");
          b.hline(x, x + 7, y + 4, "#8d96a5");
        }
        break;
      case "box": {
        const w = side ? 6 : 10;
        b.rect(x, y, w, 7, "#c99a5e");
        b.hline(x, x + w - 1, y, "#dcb27a");
        b.hline(x, x + w - 1, y + 6, "#a87b45");
        b.rect(x + Math.floor(w / 2) - 1, y, 2, 7, "#e8d3a8");
        b.vline(x + w - 1, y + 1, y + 5, "#b3854d");
        break;
      }
      case "paddle":
        b.stamp([".rr.", "rRrr", "rrrd", ".rd.", ".h..", ".h.."], x, y, { r: "#d64545", R: "#ef7a6a", d: "#a83232", h: "#6b4a32" }, side);
        break;
      case "popcorn":
        b.stamp(POPCORN, x, y, POPCORN_PAL);
        break;
      case "controller":
        b.stamp(side ? CONTROLLER_SIDE : CONTROLLER, x, y, CONTROLLER_PAL);
        break;
      case "phone":
        b.stamp(side ? PHONE_SIDE : PHONE, x, y, PHONE_PAL);
        break;
      case "lipstick":
        if (r.view !== "up") b.stamp(["rgG"], x, y, { r: "#d8365a", g: "#f0c75a", G: "#b38a2e" });
        break;
      case "comb":
        b.stamp(["cccc", "c.c."], x, y, { c: "#3d4252" });
        break;
      case "rock":
      case "paper":
      case "scissors":
        drawGesture(dc, it, x, y);
        break;
      case "none":
        break;
    }
  }
  var CONTROLLER = [".hLLLL.", "LdLLrbL", "cc...cc"];
  var CONTROLLER_SIDE = ["hLL", "cLr"];
  var CONTROLLER_PAL = { L: "#4c5263", h: "#737b8f", d: "#1d2029", r: "#e8545a", b: "#4f8fe6", c: "#363b48" };
  var PHONE = ["dDd", "dBd", "dbd", "dbd", "ddd"];
  var PHONE_SIDE = ["dB", "db", "db", "dd"];
  var PHONE_PAL = { d: "#2b2f3a", D: "#5a6172", b: "#6fbdf0", B: "#c8eaff" };
  var GESTURE_SIDE = {
    // Punho redondo, maior que a mão parada.
    rock: { rows: [".LLs", "LsLs", "sssS", ".SS."], dx: -2, dy: -1 },
    // Mão aberta em leque: quatro dedos separados e o polegar para cima.
    paper: { rows: ["..L.L.", "L.L.Ls", ".LsLss", "LsssSS", ".SSSS."], dx: -4, dy: -3 },
    // Indicador e médio abertos em V para a frente.
    scissors: { rows: ["L....", ".L...", "..Lss", ".SsSS", "S...."], dx: -3, dy: -2 }
  };
  var GESTURE_FRONT = {
    rock: { rows: [".LL.", "LsLs", "sSsS", ".SS."], dx: -1, dy: -1 },
    paper: { rows: ["L.L.L", "L.L.s", "sLsLs", "sssss", "SsssS", ".SSS."], dx: -2, dy: -4 },
    scissors: { rows: ["L...s", "L...s", ".L.s.", ".LsS.", ".sSS.", "..S.."], dx: -2, dy: -4 }
  };
  function drawGesture(dc, kind, hx, hy) {
    const { b, p, r } = dc;
    const pal = { L: p.skin.lt, s: p.skin.base, S: p.skin.dk };
    let rows;
    let x0;
    let flip = false;
    if (r.view === "down") {
      const g = GESTURE_FRONT[kind];
      rows = g.rows;
      x0 = hx + g.dx;
      hy += g.dy;
    } else {
      const g = GESTURE_SIDE[kind];
      rows = g.rows;
      flip = r.view === "up";
      x0 = flip ? hx - g.dx - rows[0].length + 2 : hx + g.dx;
      hy += g.dy;
    }
    b.stamp(rows, x0, hy, pal, flip);
    const ink = mix(p.skin.dd, "#1d2433", 0.45);
    const w = rows[0].length;
    const on = (cx, cy) => {
      if (cy < 0 || cy >= rows.length || cx < 0 || cx >= w) return false;
      const ch = rows[cy][flip ? w - 1 - cx : cx];
      return ch !== "." && ch !== " ";
    };
    const skins = [p.skin.lt, p.skin.base, p.skin.dk, p.skin.hi].map(hexKey);
    for (let cy = -1; cy <= rows.length; cy++) {
      for (let cx = -1; cx <= w; cx++) {
        if (on(cx, cy)) continue;
        if (!(on(cx - 1, cy) || on(cx + 1, cy) || on(cx, cy - 1) || on(cx, cy + 1))) continue;
        const X = x0 + cx;
        const Y = hy + cy;
        if (b.alpha(X, Y) < 160 || skins.includes(pixelKey(b, X, Y))) continue;
        b.set(X, Y, ink);
      }
    }
  }
  function hexKey(c) {
    const m = /^#([0-9a-f]{6})$/i.exec(c);
    return m ? parseInt(m[1], 16) : -1;
  }
  function pixelKey(b, x, y) {
    const xi = x + b.ox;
    const yi = y + b.oy;
    if (!b.inside(xi, yi)) return -1;
    const i = (yi * b.w + xi) * 4;
    return b.data[i] << 16 | b.data[i + 1] << 8 | b.data[i + 2];
  }
  var POPCORN = [".pk.p.", "kpypkK", "aAAAAa", "lwrwrW", "lwrwrW", "lwrwrW", ".wrwr."];
  var POPCORN_PAL = {
    p: "#fff9e6",
    // pipoca (luz)
    k: "#f3e3b8",
    // pipoca (sombra)
    K: "#e2cc92",
    y: "#ffd75e",
    // manteiga
    a: "#e9e3d6",
    // aro (bordas)
    A: "#fbf8f1",
    // aro
    l: "#ef6457",
    // listra vermelha iluminada (borda esquerda)
    r: "#d8413f",
    // listra vermelha
    w: "#f6f1e6",
    // listra branca
    W: "#cfc6b6"
    // listra branca na sombra (borda direita)
  };
  function itemPos(dc) {
    const { r } = dc;
    const it = r.held;
    if (it === "none") return null;
    if (r.itemAt) return [r.itemAt[0] + r.lean, r.itemAt[1] + r.ub];
    const hand = r.armB.pts[r.armB.pts.length - 1];
    const hx = hand[0] + r.lean;
    const hy = hand[1] + r.ub;
    if (GESTURES.has(it)) return [hx, hy];
    if (r.twoHands) {
      if (r.view === "side") return [hx - 2, hy - 3];
      const y = 18 + r.ub + 1;
      if (it === "phone") return [10, y];
      if (it === "box") return [7, y];
      if (it === "laptop") return [8, y + 1];
      if (it === "book" && r.view === "down") return [8, y + 1];
      return [9, y];
    }
    switch (it) {
      case "coffee":
        return r.view === "side" ? [hx - 3, hy - 3] : [hx, hy - 3];
      case "water":
        return r.view === "side" ? [hx - 2, hy - 3] : [hx, hy - 3];
      case "paddle":
        return r.view === "side" ? [hx - 2, hy - 5] : [hx + 1, hy - 4];
      case "popcorn":
        return r.view === "side" ? [hx - 5, hy - 4] : [hx + 1, hy - 4];
      case "controller":
        return r.view === "side" ? [hx - 2, hy] : [hx - 2, hy];
      case "phone":
        return r.view === "side" ? [hx - 2, hy - 3] : [hx, hy - 4];
      case "lipstick":
        return r.view === "side" ? [hx - 2, hy + 1] : [hx - 2, hy + 1];
      case "comb":
        return [hx - 1, hy - 2];
      default:
        return [hx, hy - 2];
    }
  }
  function drawCostume(dc, costume) {
    if (!costume) return;
    const { b, r } = dc;
    const x = HX + r.lean;
    const y = HY + r.ub + r.hd;
    if (costume === "santa") {
      b.rect(x + 2, y, 9, 4, "#c93945");
      b.rect(x + 4, y - 2, 5, 2, "#e95452");
      b.rect(x + 9, y - 1, 3, 3, "#a82436");
      b.rect(x + 11, y + 1, 3, 3, "#fff3d9");
      b.rect(x + 1, y + 4, 11, 2, "#fff3d9");
      b.hline(x + 2, x + 10, y + 5, "#ddd9cb");
    } else if (costume === "witch") {
      b.rect(x + 6, y - 2, 2, 2, "#50336f");
      b.rect(x + 5, y, 4, 2, "#69428e");
      b.rect(x + 3, y + 2, 7, 3, "#50336f");
      b.hline(x + 3, x + 9, y + 4, "#e9a548");
      b.rect(x - 1, y + 5, 15, 2, "#372641");
      b.set(x + 7, y + 4, "#ffe0a3");
    } else if (costume === "pumpkin") {
      b.rect(x + 6, y - 2, 2, 3, "#47754b");
      b.rect(x + 2, y + 1, 10, 4, "#ed963c");
      b.rect(x + 1, y + 2, 12, 3, "#dc792e");
      b.vline(x + 4, y + 1, y + 4, "#f9ae48");
      b.vline(x + 8, y + 1, y + 4, "#f9ae48");
      b.hline(x + 2, x + 11, y + 5, "#8d4930");
    } else {
      b.rect(x, y + 12, 2, 5, "#702743");
      b.rect(x + 12, y + 12, 2, 5, "#702743");
    }
  }
  function renderCharacter(req) {
    if (req.dir === "right") {
      const left = renderCharacter({ ...req, dir: "left" });
      return { buf: left.buf.flipped(), ax: CHAR_W - left.ax, ay: left.ay };
    }
    const view = req.dir === "up" ? "up" : req.dir === "down" ? "down" : "side";
    const b = new PixelBuf(CHAR_W, CHAR_H);
    const a = req.appearance;
    const dc = { b, a, p: paletteOf(a), r: makeRig(req, view) };
    const r = dc.r;
    const sleeve = sleeveLength(a);
    const sr = dc.p.top;
    const ip = itemPos(dc);
    if (req.costume === "vampire") {
      b.rect(5 + r.lean, 18 + r.ub, 14, 8, "#35283e");
      b.rect(6 + r.lean, 19 + r.ub, 12, 6, "#702743");
    }
    drawHair(dc, "back");
    if (ip && r.itemBehind) drawItem(dc, ip[0], ip[1]);
    const headStack = () => {
      drawHead(dc);
      drawFacialHair(dc);
      drawHair(dc, "front");
      drawAccessory(dc);
      drawCostume(dc, req.costume);
    };
    if (view !== "side" && r.itemAt) {
      drawLegs(dc);
      drawTorso(dc);
      if (view === "up") {
        if (ip) drawItem(dc, ip[0], ip[1]);
        drawArm(dc, r.armA, sr, sleeve);
        drawArm(dc, r.armB, sr, sleeve);
        headStack();
      } else {
        headStack();
        if (ip) drawItem(dc, ip[0], ip[1]);
        drawArm(dc, r.armA, sr, sleeve);
        drawArm(dc, r.armB, sr, sleeve);
      }
    } else if (view === "side") {
      drawArm(dc, r.armA, sr, sleeve, 0.08);
      drawLegs(dc);
      drawTorso(dc);
      drawHead(dc);
      drawFacialHair(dc);
      drawHair(dc, "front");
      drawAccessory(dc);
      drawCostume(dc, req.costume);
      if (ip && !r.itemBehind) drawItem(dc, ip[0], ip[1]);
      drawArm(dc, r.armB, sr, sleeve, 0, true);
    } else {
      drawLegs(dc);
      const armsBehindHead = r.view === "up" && (req.pose === "type" || req.pose === "use" || req.pose === "drink");
      drawTorso(dc);
      if (armsBehindHead) {
        drawArm(dc, r.armA, sr, sleeve);
        drawArm(dc, r.armB, sr, sleeve);
      }
      const raisedHigh = (arm2) => arm2.pts[arm2.pts.length - 1][1] < 16;
      if (r.crossFront === null && !armsBehindHead) {
        if (!raisedHigh(r.armA)) drawArm(dc, r.armA, sr, sleeve);
        if (!raisedHigh(r.armB) && !(ip && !r.itemBehind && r.twoHands)) drawArm(dc, r.armB, sr, sleeve);
      }
      drawHead(dc);
      drawFacialHair(dc);
      drawHair(dc, "front");
      drawAccessory(dc);
      drawCostume(dc, req.costume);
      if (r.crossFront !== null) drawCrossedArms(dc, sr, sleeve, r.crossFront === 1);
      if (ip && !r.itemBehind) {
        drawItem(dc, ip[0], ip[1]);
        if (r.twoHands) {
          drawArm(dc, r.armA, sr, sleeve);
          drawArm(dc, r.armB, sr, sleeve);
        }
      }
      if (!armsBehindHead && r.crossFront === null) {
        if (raisedHigh(r.armA)) drawArm(dc, r.armA, sr, sleeve);
        if (raisedHigh(r.armB)) drawArm(dc, r.armB, sr, sleeve);
      }
    }
    if (r.tapAt) {
      const [tx, ty] = r.tapAt;
      b.set(tx + r.lean, ty + r.ub, dc.p.skin.base);
      b.set(tx + r.lean, ty + 1 + r.ub, dc.p.skin.dk);
    }
    if (r.kernelAt) {
      const [kx, ky] = r.kernelAt;
      b.set(kx + r.lean, ky + r.ub, POPCORN_PAL.p);
      b.set(kx + 1 + r.lean, ky + r.ub, POPCORN_PAL.y);
    }
    b.outline();
    if (!r.seated) b.shadow(CHAR_AX, CHAR_AY - 0.5, 6, 2, "#1c2034", 0.2);
    return { buf: b, ax: CHAR_AX, ay: CHAR_AY };
  }

  // vendor/habblaud/upstream/client/src/art/dynamic.ts
  var clipX0 = -Infinity;
  var clipY0 = -Infinity;
  var clipX1 = Infinity;
  var clipY1 = Infinity;
  function clipTo(x, y, w, h) {
    clipX0 = x;
    clipY0 = y;
    clipX1 = x + w;
    clipY1 = y + h;
  }
  function fill(ctx, x, y, w, h, c) {
    const x0 = Math.max(x, clipX0);
    const y0 = Math.max(y, clipY0);
    const x1 = Math.min(x + w, clipX1);
    const y1 = Math.min(y + h, clipY1);
    if (x1 <= x0 || y1 <= y0) return;
    ctx.fillStyle = c;
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  }
  function h32(a, b = 0) {
    let x = (Math.imul(a | 0, 668265261) ^ Math.imul(b | 0, 374761393)) >>> 0;
    x ^= x >>> 15;
    x = Math.imul(x, 2246822507) >>> 0;
    x ^= x >>> 13;
    return x >>> 0;
  }
  function frac(n) {
    return n - Math.floor(n);
  }
  var SYNTAX = ["#ff79c6", "#8be9fd", "#f1fa8c", "#50fa7b", "#bd93f9", "#ffb86c", "#f8f8f2"];
  function drawScreen(ctx, r, mode, t2, seed) {
    const x = Math.round(r.x);
    const y = Math.round(r.y);
    const w = Math.round(r.w);
    const h = Math.round(r.h);
    if (w <= 0 || h <= 0) return;
    clipTo(x, y, w, h);
    const s = seed >>> 0;
    switch (mode) {
      case "off": {
        fill(ctx, x, y, w, h, "#22324f");
        fill(ctx, x, y, w, 1, "#2a3d5f");
        fill(ctx, x, y + h - 1, w, 1, "#1d2b45");
        const k0 = w - 3 - Math.floor(h / 3);
        for (let i = 0; i < h; i++) {
          const sx = x + k0 - i;
          fill(ctx, sx, y + i, 2, 1, "#2f4569");
          fill(ctx, sx + 2, y + i, 1, 1, "#293c5e");
          fill(ctx, sx + 5, y + i, 1, 1, "#283b5b");
        }
        break;
      }
      case "standby": {
        const bands = ["#2d63ad", "#285a9f", "#235192", "#1f4884"];
        for (let i = 0; i < h; i++) fill(ctx, x, y + i, w, 1, bands[Math.min(bands.length - 1, Math.floor(i * bands.length / h))]);
        fill(ctx, x, y, w, 1, "#3a74c0");
        const cx = x + Math.floor((w - 1) / 2);
        const cy = y + Math.floor((h - 1) / 2) - (h >= 9 ? 1 : 0);
        const pulse = (Math.floor(t2 / 700) + s % 3) % 4;
        const logo = ["#9fcaf5", "#b7d8f8", "#d3e8fb", "#b7d8f8"][pulse];
        fill(ctx, cx, cy - 1, 1, 1, logo);
        fill(ctx, cx - 1, cy, 1, 1, logo);
        fill(ctx, cx + 1, cy, 1, 1, logo);
        fill(ctx, cx, cy + 1, 1, 1, logo);
        fill(ctx, cx, cy, 1, 1, "#6aa6e6");
        if (h >= 7) fill(ctx, cx - 2, cy + 3, 5, 1, "#4f86c9");
        break;
      }
      case "idle": {
        for (let i = 0; i < h; i++) fill(ctx, x, y + i, w, 1, mix("#1b2a4a", "#2c1f4a", i / h));
        const px = bounce(t2 / 140 + s % 17, Math.max(1, w - 2));
        const py = bounce(t2 / 190 + s % 11, Math.max(1, h - 2));
        const hue = Math.floor(t2 / 900 + s) % 4;
        fill(ctx, x + px, y + py, 2, 2, ["#7fd0ff", "#ff9ad5", "#9be59b", "#ffd36b"][hue]);
        break;
      }
      case "code": {
        fill(ctx, x, y, w, h, "#1d2130");
        fill(ctx, x, y, Math.min(2, w), h, "#252a3c");
        const rows = Math.floor(h / 2);
        const scroll = Math.floor(t2 / 420 + s % 50);
        for (let i = 0; i < rows; i++) {
          const line = scroll + i;
          const hh = h32(s, line);
          const yy = y + i * 2 + 1;
          if (yy >= y + h) break;
          fill(ctx, x, yy, 1, 1, "#4a5170");
          let cx = x + 3 + hh % 4;
          const tokens = 1 + (hh >>> 3) % 3;
          if ((hh >>> 7) % 7 === 0) continue;
          for (let k = 0; k < tokens && cx < x + w - 1; k++) {
            const tw = 1 + (hh >>> 9 + k * 4) % 4;
            fill(ctx, cx, yy, Math.min(tw, x + w - 1 - cx), 1, SYNTAX[(hh >>> 5 + k * 3) % SYNTAX.length]);
            cx += tw + 1;
          }
          if (i === rows - 1 && Math.floor(t2 / 500) % 2 === 0 && cx < x + w) fill(ctx, cx, yy, 1, 1, "#f8f8f2");
        }
        break;
      }
      case "terminal": {
        fill(ctx, x, y, w, h, "#0c120f");
        const rows = Math.floor((h - 1) / 2);
        const step = Math.floor(t2 / 260) + s % 40;
        const lineLen = (n) => 2 + h32(s, n) % Math.max(2, w - 4);
        const slot = Math.max(2, w - 4) + 3;
        const line = Math.floor(step / slot);
        const typed = Math.min(lineLen(line), step - line * slot);
        for (let i = 0; i < rows; i++) {
          const n = line - (rows - 1) + i;
          if (n < 0) continue;
          const yy = y + 1 + i * 2;
          const len = n === line ? typed : lineLen(n);
          fill(ctx, x + 1, yy, 1, 1, "#5cff7a");
          fill(ctx, x + 3, yy, Math.min(len, w - 4), 1, n === line ? "#8ef0a0" : "#3fae5c");
          if (n === line && Math.floor(t2 / 450) % 2 === 0) fill(ctx, x + 3 + Math.min(len, w - 5), yy, 1, 1, "#d6ffe0");
        }
        break;
      }
      case "browser": {
        fill(ctx, x, y, w, h, "#f3f5f8");
        fill(ctx, x, y, w, 2, "#d5dbe4");
        fill(ctx, x + 1, y, 1, 1, "#ff6b6b");
        if (w > 6) fill(ctx, x + 3, y, 1, 1, "#f7c948");
        if (w > 8) fill(ctx, x + 5, y + 1, w - 6, 1, "#ffffff");
        const off = Math.floor(t2 / 900 + s % 9) % 4;
        const accent = ["#5b8fe0", "#4cae6a", "#e2604f", "#8d66cf"][s % 4];
        const top = y + 3;
        for (let i = 0; i < h - 3; i++) {
          const row = i + off;
          const yy = top + i;
          if (row % 6 < 3) {
            if (row % 12 < 3) fill(ctx, x + 1, yy, Math.max(1, Math.floor(w * 0.45)), 1, accent);
            else fill(ctx, x + 1, yy, Math.max(1, w - 2 - row % 5), 1, row % 6 === 0 ? "#9aa5b5" : "#c8cfd9");
          } else if (row % 6 === 3) {
            fill(ctx, x + 1, yy, Math.floor(w / 2) - 1, 2, mix(accent, "#ffffff", 0.55));
            fill(ctx, x + Math.floor(w / 2) + 1, yy, Math.ceil(w / 2) - 2, 1, "#c8cfd9");
          }
        }
        break;
      }
      case "search": {
        fill(ctx, x, y, w, h, "#ffffff");
        fill(ctx, x + 1, y + 1, w - 2, 2, "#e3e8ef");
        fill(ctx, x + 2, y + 1, Math.max(1, w - 6), 1, "#ffffff");
        fill(ctx, x + w - 3, y + 1, 1, 1, "#3f7fd8");
        fill(ctx, x + w - 2, y + 2, 1, 1, "#3f7fd8");
        const sel = Math.floor(t2 / 700 + s % 5) % 3;
        for (let i = 0; i < 3; i++) {
          const yy = y + 4 + i * 3;
          if (yy + 1 >= y + h) break;
          if (i === sel) fill(ctx, x, yy - 1, w, 3, "#eef4ff");
          fill(ctx, x + 1, yy, Math.max(1, w - 4 - (s + i) % 4), 1, "#3f7fd8");
          fill(ctx, x + 1, yy + 1, Math.max(1, w - 6 + (s + i) % 3), 1, "#b6bfcc");
        }
        break;
      }
      case "chat": {
        fill(ctx, x, y, w, h, "#eef1f6");
        const step = Math.floor(t2 / 1100 + s % 13);
        const bubbles = Math.floor(h / 3);
        for (let i = 0; i < bubbles; i++) {
          const n = step + i;
          const mine = (h32(s, n) & 1) === 1;
          const bw = Math.max(3, Math.min(w - 3, 4 + (h32(s, n) >>> 2) % Math.max(1, w - 5)));
          const yy = y + h - 3 - (bubbles - 1 - i) * 3;
          if (yy < y) continue;
          fill(ctx, mine ? x + w - 1 - bw : x + 1, yy, bw, 2, mine ? "#5b8fe0" : "#d6dce6");
        }
        const dot = Math.floor(t2 / 250) % 3;
        for (let k = 0; k < 3; k++) fill(ctx, x + 2 + k * 2, y + 1, 1, 1, k === dot ? "#5b6b85" : "#b8c2d2");
        break;
      }
      case "docs": {
        fill(ctx, x, y, w, h, "#e9edf2");
        fill(ctx, x + 1, y, w - 2, h, "#ffffff");
        const off = Math.floor(t2 / 1500 + s % 7) % 3;
        fill(ctx, x + 2, y + 1, Math.max(1, Math.floor(w * 0.5)), 1, "#2b2f3b");
        for (let i = 0; i < h - 3; i++) {
          const row = i + off;
          const yy = y + 3 + i;
          if (row % 4 === 3) continue;
          fill(ctx, x + 2, yy, Math.max(1, w - 4 - h32(s, row) % 4), 1, row % 4 === 0 ? "#7d8796" : "#b9c1cd");
        }
        break;
      }
      case "tasks": {
        fill(ctx, x, y, w, h, "#fffaf0");
        const rows = Math.floor((h - 1) / 2);
        const done = Math.floor(t2 / 900 + s % 6) % (rows + 2);
        for (let i = 0; i < rows; i++) {
          const yy = y + 1 + i * 2;
          const ok = i < done;
          fill(ctx, x + 1, yy, 1, 1, ok ? "#3fae5c" : "#b9c1cd");
          fill(ctx, x + 3, yy, Math.max(1, w - 5 - (s + i) % 3), 1, ok ? "#a8d8b3" : "#8b95a5");
        }
        break;
      }
      case "progress": {
        fill(ctx, x, y, w, h, "#0b1210");
        fill(ctx, x, y + h - 1, w, 1, "#0f1916");
        const tiny = h < 9;
        fill(ctx, x + 1, y + 1, 1, 1, "#5cff7a");
        fill(ctx, x + 3, y + 1, Math.max(1, Math.min(w - 5, 4 + h32(s, 1) % Math.max(1, w - 7))), 1, "#3c8f57");
        if (h >= 13) {
          fill(ctx, x + 3, y + 3, Math.max(1, Math.min(w - 5, 3 + h32(s, 2) % Math.max(1, w - 6))), 1, "#2a5c3c");
          fill(ctx, x + 3, y + 5, Math.max(1, Math.min(w - 5, 2 + h32(s, 3) % Math.max(1, w - 6))), 1, "#2a5c3c");
        }
        const by = tiny ? y + 3 : h >= 13 ? y + h - 7 : y + 3;
        const bh = tiny ? 1 : 2;
        const inner = Math.max(1, w - 4);
        fill(ctx, x + 1, by, 1, bh, "#7d8ea0");
        fill(ctx, x + w - 2, by, 1, bh, "#7d8ea0");
        fill(ctx, x + 2, by, inner, bh, "#163322");
        const period = 3400 + s % 5 * 300;
        const cycle = (t2 + s % 997 * 37) / period;
        const p = frac(cycle);
        const filled = p < 0.85 ? Math.floor(p / 0.85 * (inner + 1)) : inner;
        const done = p >= 0.85;
        if (filled > 0) {
          const blink = done && Math.floor(t2 / 160) % 2 === 0;
          fill(ctx, x + 2, by, filled, bh, blink ? "#b9ffca" : "#3ccf63");
          if (bh > 1) fill(ctx, x + 2, by, filled, 1, blink ? "#e4ffe9" : "#7cf09a");
          if (!done) fill(ctx, x + 1 + filled, by, 1, bh, "#d8ffe2");
        }
        const sy = tiny ? y + h - 3 : h >= 13 ? y + h - 4 : y + h - 4;
        if (sy + 2 < y + h) {
          const RING = [[1, 0], [2, 0], [2, 1], [2, 2], [1, 2], [0, 2], [0, 1], [0, 0]];
          const head = Math.floor(t2 / 110 + s % 8) % 8;
          for (let k = 0; k < 8; k++) {
            const age = (head - k + 8) % 8;
            const c = age === 0 ? "#9ff3ff" : age === 1 ? "#4fb8d6" : age === 2 ? "#2b6f86" : "#173a45";
            fill(ctx, x + 1 + RING[k][0], sy + RING[k][1], 1, 1, c);
          }
          const dots = Math.floor(t2 / 420 + s % 3) % 4;
          for (let k = 0; k < dots && 5 + k * 2 < w - 2; k++) fill(ctx, x + 5 + k * 2, sy + 2, 1, 1, "#3c8f57");
          if (Math.floor(t2 / 500) % 2 === 0 && x + 11 < x + w) fill(ctx, x + 11, sy + 1, 1, 2, "#d6ffe0");
        }
        break;
      }
      case "show": {
        const prog = s % 3;
        if (prog === 0) drawFootball(ctx, x, y, w, h, t2, s);
        else if (prog === 1) drawSoap(ctx, x, y, w, h, t2, s);
        else drawCartoon(ctx, x, y, w, h, t2, s);
        break;
      }
      case "game": {
        if (s % 2 === 0) drawRace(ctx, x, y, w, h, t2, s);
        else drawFight(ctx, x, y, w, h, t2, s);
        break;
      }
      case "alert": {
        const on = Math.floor(t2 / 380) % 2 === 0;
        fill(ctx, x, y, w, h, on ? "#f2b33d" : "#8a5a12");
        const cx = x + Math.floor(w / 2);
        const cy = y + Math.floor(h / 2);
        const ink = on ? "#3a2a08" : "#f7d27a";
        fill(ctx, cx, cy - 2, 1, 3, ink);
        fill(ctx, cx, cy + 2, 1, 1, ink);
        if (h >= 9) {
          fill(ctx, cx - 1, cy - 3, 3, 1, ink);
          fill(ctx, cx, cy - 4, 1, 1, ink);
        }
        break;
      }
    }
  }
  var GLYPHS = {
    G: ["###", "#..", "#.#", "#.#", "###"],
    O: ["###", "#.#", "#.#", "#.#", "###"],
    L: ["#..", "#..", "#..", "#..", "###"],
    K: ["#.#", "##.", "#..", "##.", "#.#"]
  };
  function drawWord(ctx, word, x, y, c) {
    for (let i = 0; i < word.length; i++) {
      const g = GLYPHS[word[i]];
      if (!g) continue;
      for (let r = 0; r < g.length; r++) {
        const row = g[r];
        let k = 0;
        while (k < row.length) {
          if (row[k] !== "#") {
            k++;
            continue;
          }
          let e = k;
          while (e < row.length && row[e] === "#") e++;
          fill(ctx, x + i * 4 + k, y + r, e - k, 1, c);
          k = e;
        }
      }
    }
  }
  function banner(ctx, word, x, y, w, h, c) {
    const ww = word.length * 4 - 1;
    const bx = x + Math.floor((w - ww) / 2);
    const by = y + Math.floor((h - 5) / 2);
    fill(ctx, bx - 2, by - 1, ww + 4, 7, "rgba(12,16,28,0.78)");
    drawWord(ctx, word, bx, by, c);
  }
  var FOOTBALL_LANCE_MS = 7e3;
  var FOOTBALL_GOAL_AT = 0.8;
  function footballLance(t2, s) {
    const k = Math.floor((t2 + s % 997 * 13) / FOOTBALL_LANCE_MS);
    const p = frac((t2 + s % 997 * 13) / FOOTBALL_LANCE_MS);
    return { lance: k, progress: p, right: (h32(s, k) & 1) === 1, period: FOOTBALL_LANCE_MS, goalAt: FOOTBALL_GOAL_AT };
  }
  function drawFootball(ctx, x, y, w, h, t2, s) {
    const { lance: k, progress: p } = footballLance(t2, s);
    fill(ctx, x, y, w, h, "#3f9a4a");
    for (let i = 0; i * 4 < w; i += 2) fill(ctx, x + i * 4, y, 4, h, "#48a855");
    const mx = x + Math.floor(w / 2);
    const my = y + Math.floor(h / 2);
    fill(ctx, mx, y, 1, h, "#cfeccd");
    if (h >= 9) {
      fill(ctx, mx - 2, my - 1, 1, 3, "#cfeccd");
      fill(ctx, mx + 2, my - 1, 1, 3, "#cfeccd");
      fill(ctx, mx - 1, my - 2, 3, 1, "#cfeccd");
      fill(ctx, mx - 1, my + 2, 3, 1, "#cfeccd");
    }
    const gh = Math.max(3, Math.floor(h / 3));
    fill(ctx, x, my - Math.floor(gh / 2), 1, gh, "#ffffff");
    fill(ctx, x + w - 1, my - Math.floor(gh / 2), 1, gh, "#ffffff");
    const right = footballLance(t2, s).right;
    const u = Math.min(1, p / 0.8);
    const ease2 = u * u * (3 - 2 * u);
    const span = Math.floor(w / 2) - 1;
    const bx = mx + Math.round((right ? 1 : -1) * span * ease2);
    const sway = Math.round(Math.sin(u * Math.PI * 3 + s % 7) * Math.max(1, (h - 6) / 3) * (1 - ease2));
    const by = my + sway;
    for (let i = 0; i < 6; i++) {
      const red = i < 3;
      const hh = h32(s + i * 31, 7);
      const baseX = mx + (red ? -1 : 1) * Math.floor(w / 2 * (0.25 + i % 3 * 0.22));
      const baseY = y + 2 + Math.floor((i % 3 + 0.5) * ((h - 4) / 3));
      const pull = 0.35 + hh % 5 * 0.08;
      const jx = Math.round(Math.sin(t2 / (420 + hh % 300) + i) * 1.2);
      const px = Math.round(baseX + (bx - baseX) * pull) + jx;
      const py = Math.round(baseY + (by - baseY) * pull * 0.6);
      fill(ctx, px, py - 1, 1, 2, red ? "#e8454a" : "#3d7ce0");
    }
    fill(ctx, bx, by + 1, 1, 1, "rgba(10,40,10,0.45)");
    fill(ctx, bx, by, 1, 1, "#ffffff");
    if (w >= 16 && h >= 9) {
      const goals = [0, 0];
      for (let j = k - k % 4; j < k; j++) goals[h32(s, j) & 1]++;
      fill(ctx, x + 1, y + 1, 11, 3, "rgba(12,16,28,0.8)");
      fill(ctx, x + 2, y + 2, 1, 1, "#e8454a");
      for (let g = 0; g < goals[0]; g++) fill(ctx, x + 4 + g, y + 2, 1, 1, "#ffffff");
      fill(ctx, x + 9, y + 2, 1, 1, "#3d7ce0");
      for (let g = 0; g < goals[1]; g++) fill(ctx, x + 8 - g - 1, y + 2, 1, 1, "#9fc4ff");
    }
    if (p >= FOOTBALL_GOAL_AT) {
      const blink = Math.floor(t2 / 180) % 2 === 0;
      const c = blink ? "#ffd84d" : "#ffffff";
      fill(ctx, x, y, w, 1, c);
      fill(ctx, x, y + h - 1, w, 1, c);
      fill(ctx, x, y, 1, h, c);
      fill(ctx, x + w - 1, y, 1, h, c);
      if (w >= 15 && h >= 9) banner(ctx, "GOL", x, y, w, h, c);
    }
  }
  function soapFace(ctx, cx, cy, sc, skin, hair, long, look, blush) {
    const fw = 6 * sc;
    const fh = 7 * sc;
    const fx = cx - Math.floor(fw / 2);
    const fy = cy - Math.floor(fh / 2);
    if (long) fill(ctx, fx - sc, fy, fw + 2 * sc, fh + 2 * sc, hair);
    fill(ctx, fx, fy + sc, fw, fh - sc, skin);
    fill(ctx, fx + sc, fy + fh, fw - 2 * sc, sc, skin);
    fill(ctx, fx, fy - sc, fw, 2 * sc, hair);
    if (!long) fill(ctx, fx, fy + sc, sc, 2 * sc, hair);
    const ex = look === 0 ? sc : 0;
    fill(ctx, fx + sc + ex, fy + 3 * sc, sc, sc, "#2b2236");
    fill(ctx, fx + 4 * sc + ex - sc, fy + 3 * sc, sc, sc, "#2b2236");
    if (blush) {
      fill(ctx, fx + sc - (sc > 1 ? 0 : 1) + ex, fy + 4 * sc + (sc > 1 ? 1 : 0), sc, sc > 1 ? 1 : 1, "#f08a96");
      fill(ctx, fx + 4 * sc + ex - sc + (sc > 1 ? 0 : 1), fy + 4 * sc + (sc > 1 ? 1 : 0), sc, 1, "#f08a96");
    }
    fill(ctx, fx + 2 * sc + ex, fy + 5 * sc, Math.max(1, sc + Math.floor(sc / 2)), Math.max(1, Math.floor(sc / 2)), "#b4475a");
  }
  function heart(ctx, x, y, c) {
    fill(ctx, x, y, 1, 1, c);
    fill(ctx, x + 2, y, 1, 1, c);
    fill(ctx, x, y + 1, 3, 1, c);
    fill(ctx, x + 1, y + 2, 1, 1, c);
  }
  function drawSoap(ctx, x, y, w, h, t2, s) {
    const CUT = 2600;
    const shot = Math.floor((t2 + s % 97 * 31) / CUT) % 4;
    const wall = ["#c98a6a", "#b77a62", "#d6a27c", "#8f6f9e"][s % 4];
    fill(ctx, x, y, w, h, wall);
    fill(ctx, x, y + h - Math.max(2, Math.floor(h / 5)), w, Math.max(2, Math.floor(h / 5)), mix(wall, "#2b2236", 0.35));
    fill(ctx, x + w - Math.floor(w / 3), y + 1, Math.floor(w / 4), Math.floor(h / 2), "#ffd59a");
    fill(ctx, x + w - Math.floor(w / 3) + Math.floor(w / 8), y + 1, 1, Math.floor(h / 2), mix(wall, "#2b2236", 0.2));
    const sc = h >= 13 ? 2 : 1;
    const her = { skin: "#f2c3a0", hair: "#5a2f24" };
    const him = { skin: "#c98f68", hair: "#2b2530" };
    const my = y + Math.floor(h / 2) + (sc > 1 ? 1 : 0);
    if (shot === 0) soapFace(ctx, x + Math.floor(w / 2), my, sc, her.skin, her.hair, true, 0, true);
    else if (shot === 1) soapFace(ctx, x + Math.floor(w / 2), my, sc, him.skin, him.hair, false, 1, false);
    else {
      const s1 = w >= 34 ? sc : 1;
      soapFace(ctx, x + Math.floor(w * 0.3), my, s1, her.skin, her.hair, true, 0, shot === 3);
      soapFace(ctx, x + Math.floor(w * 0.7), my, s1, him.skin, him.hair, false, 1, false);
      if (shot === 3) {
        for (let i = 0; i < 2; i++) {
          const life = frac((t2 + i * 700) / 1400);
          heart(ctx, x + Math.floor(w / 2) - 1 + (i ? 1 : -1), y + h - 3 - Math.floor(life * (h - 2)), i ? "#ff7aa8" : "#ff4f7e");
        }
      }
    }
  }
  function drawCartoon(ctx, x, y, w, h, t2, s) {
    fill(ctx, x, y, w, h, "#7fd3ff");
    fill(ctx, x, y, w, Math.floor(h / 3), "#9fe0ff");
    const gh = Math.max(2, Math.floor(h / 4));
    fill(ctx, x, y + h - gh, w, gh, "#6cc04a");
    fill(ctx, x, y + h - gh, w, 1, "#8ee070");
    fill(ctx, x + w - 4, y + 1, 3, 3, "#ffd84d");
    fill(ctx, x + w - 3, y + 2, 1, 1, "#fff2a8");
    for (let i = 0; i < 2; i++) {
      const cx = x + w - 1 - Math.floor(frac(t2 / (9e3 + i * 4e3) + i * 0.5 + s % 5 * 0.1) * (w + 8));
      const cy = y + 1 + i * 3;
      fill(ctx, cx, cy + 1, 5, 2, "#ffffff");
      fill(ctx, cx + 1, cy, 3, 1, "#ffffff");
    }
    const run = frac(t2 / 5200 + s % 11 * 0.09);
    const ground = y + h - gh;
    const hop = Math.abs(Math.sin(t2 / 260 % Math.PI)) * Math.max(2, h / 3);
    const px = x + Math.floor(run * (w + 6)) - 3;
    const py = ground - 4 - Math.round(hop);
    fill(ctx, px, py, 4, 4, "#ff7ab8");
    fill(ctx, px + 1, py + 1, 1, 1, "#2b2236");
    fill(ctx, px + 3, py + 1, 1, 1, "#2b2236");
    fill(ctx, px + 1, py + 3, 2, 1, "#d84a8a");
    const qx = px - 7;
    const qy = ground - 3 - Math.round(Math.abs(Math.sin((t2 / 260 + 1.2) % Math.PI)) * Math.max(1, h / 4));
    fill(ctx, qx, qy, 3, 3, "#ffd84d");
    fill(ctx, qx + 2, qy + 1, 1, 1, "#2b2236");
  }
  function drawRace(ctx, x, y, w, h, t2, s) {
    const half = Math.floor(h / 2);
    const cars = ["#e8454a", "#3d7ce0"];
    for (let i = 0; i < 2; i++) {
      const hy = y + i * (h - half);
      const hh = i === 0 ? half : h - half;
      fill(ctx, x, hy, w, hh, "#6a7280");
      fill(ctx, x, hy, w, 1, "#4caf50");
      fill(ctx, x, hy + hh - 1, w, 1, "#4caf50");
      const speed = 0.045 + i * 6e-3;
      const off = Math.floor(t2 * speed + s % 13) % 6;
      const lane = hy + Math.floor(hh / 2);
      for (let lx = -off; lx < w; lx += 6) fill(ctx, x + lx, lane, 3, 1, "#f4f4f0");
      const tree = Math.floor(t2 * speed * 0.8 + i * 9) % (w + 6);
      fill(ctx, x + w - tree, hy, 2, 1, "#2e7d32");
      const lead = Math.sin(t2 / 2300 + s % 9 + i * Math.PI);
      const cx = x + Math.floor(w * 0.3) + Math.round(lead * Math.max(1, w / 8));
      const cy = lane - 1 + (Math.floor(t2 / 130 + i) % 2 === 0 ? 0 : hh >= 6 ? 1 : 0);
      fill(ctx, cx, cy, 4, 2, cars[i]);
      fill(ctx, cx + 2, cy, 1, 1, "#cfe6ff");
      fill(ctx, cx, cy + 2 <= hy + hh - 2 ? cy + 2 : cy + 1, 1, 1, "#1d2029");
      fill(ctx, cx + 3, cy + 2 <= hy + hh - 2 ? cy + 2 : cy + 1, 1, 1, "#1d2029");
    }
    fill(ctx, x, y + half - (h % 2 === 0 ? 1 : 0), w, 1, "#11141c");
  }
  function drawFight(ctx, x, y, w, h, t2, s) {
    const ROUND = 9e3;
    const tt = t2 + s % 991 * 17;
    const k = Math.floor(tt / ROUND);
    const p = frac(tt / ROUND);
    fill(ctx, x, y, w, h, "#3b2a6b");
    fill(ctx, x, y + Math.floor(h / 3), w, Math.floor(h / 3), "#4b3784");
    const floorH = Math.max(2, Math.floor(h / 4));
    fill(ctx, x, y + h - floorH, w, floorH, "#7a4f2a");
    fill(ctx, x, y + h - floorH, w, 1, "#a8723f");
    const loser = h32(s, k) & 1;
    const bw = Math.max(3, Math.floor(w / 2) - 2);
    const fight = Math.min(1, p / 0.82);
    const lifeOf = (who) => Math.max(0, 1 - fight * (who === loser ? 1 : 0.55));
    for (let who = 0; who < 2; who++) {
      const bx = who === 0 ? x + 1 : x + w - 1 - bw;
      fill(ctx, bx, y + 1, bw, 2, "#5a1d2a");
      const lw = Math.round(bw * lifeOf(who));
      if (lw > 0) fill(ctx, who === 0 ? bx : bx + bw - lw, y + 1, lw, 2, lifeOf(who) > 0.35 ? "#ffd84d" : "#ff6b4a");
    }
    const ground = y + h - floorH;
    const gap = Math.max(3, Math.round(w * (0.18 + 0.12 * Math.abs(Math.sin(tt / 900)))));
    const mx = x + Math.floor(w / 2);
    const hitter = h32(s, Math.floor(tt / 300)) % 3;
    const ko = p >= 0.82;
    for (let who = 0; who < 2; who++) {
      const dir = who === 0 ? 1 : -1;
      const fx = who === 0 ? mx - gap - 2 : mx + gap;
      const down = ko && who === loser;
      const body = who === 0 ? "#e8454a" : "#3d7ce0";
      const hit = !ko && hitter === 1 - who;
      if (down) {
        fill(ctx, fx - 1, ground - 2, 4, 2, body);
        fill(ctx, who === 0 ? fx - 3 : fx + 3, ground - 2, 2, 2, "#f2c3a0");
        continue;
      }
      const bob = Math.floor(tt / 220 + who) % 2;
      fill(ctx, fx, ground - 7 + bob, 2, 2, hit ? "#ffffff" : "#f2c3a0");
      fill(ctx, fx, ground - 5 + bob, 2, 3, hit ? "#ffffff" : body);
      fill(ctx, fx, ground - 2, 1, 2, "#2b2530");
      fill(ctx, fx + 1, ground - 2, 1, 2, "#2b2530");
      const punching = !ko && hitter === who;
      const ax = dir > 0 ? fx + 2 : fx - (punching ? 3 : 1);
      fill(ctx, ax, ground - 5 + bob, punching ? 3 : 1, 1, "#f2c3a0");
    }
    if (ko && Math.floor(tt / 200) % 2 === 0 && w >= 12 && h >= 9) banner(ctx, "KO", x, y, w, h, "#ffd84d");
  }
  function bounce(v, span) {
    const p = frac(v / (span * 2)) * span * 2;
    return Math.floor(p < span ? p : span * 2 - p);
  }
  var NOTE = {
    pending: ["#ffe27a", "#ffd0a8"],
    in_progress: ["#8fd0ff", "#a9e0ff"],
    completed: ["#9be59b", "#b8efb0"]
  };
  function drawBoard(ctx, r, items, t2) {
    const x = Math.round(r.x);
    const y = Math.round(r.y);
    const w = Math.round(r.w);
    const h = Math.round(r.h);
    clipTo(x, y, w, h);
    const colW = Math.floor(w / 3);
    const header = ["#f2b33d", "#3f7fd8", "#3fae5c"];
    for (let c = 0; c < 3; c++) {
      fill(ctx, x + c * colW + 1, y, colW - 2, 1, header[c]);
      if (c > 0) fill(ctx, x + c * colW - 1, y + 2, 1, h - 3, "#e1e6ec");
    }
    const order = ["pending", "in_progress", "completed"];
    const per = colW >= 11 ? 2 : 1;
    const counts2 = [0, 0, 0];
    for (const it of items) {
      const c = order.indexOf(it.status);
      if (c < 0) continue;
      const k = counts2[c]++;
      const nx = x + c * colW + 1 + k % per * 5;
      const ny = y + 2 + Math.floor(k / per) * 4;
      if (ny + 3 > y + h) {
        if (k % per === 0) fill(ctx, x + c * colW + Math.floor(colW / 2) - 1, y + h - 1, 3, 1, "#9aa4b2");
        continue;
      }
      const pal = NOTE[it.status];
      const col = pal[k % 2];
      fill(ctx, nx, ny, 4, 3, col);
      fill(ctx, nx, ny + 2, 4, 1, mix(col, "#7a6a4a", 0.25));
      fill(ctx, nx + 1, ny + 1, 2, 1, mix(col, "#2b2f3b", 0.35));
      if (it.status === "completed") fill(ctx, nx + 3, ny, 1, 1, "#2e8a46");
      if (it.status === "in_progress" && Math.floor(t2 / 600 + k) % 2 === 0) fill(ctx, nx, ny, 4, 1, "#e8f6ff");
    }
  }
  var SKY = [
    [0, "#0b1230", "#1f2b57"],
    [4.6, "#0e1838", "#28335f"],
    [5.6, "#38397a", "#e48a6c"],
    [6.6, "#6ea6df", "#f5c99c"],
    [8, "#79b8eb", "#d2ebfa"],
    [16, "#70b0e8", "#d8edf8"],
    [17.4, "#5f86c8", "#f5b37c"],
    [18.4, "#4a4f96", "#ef8a68"],
    [19.4, "#26295f", "#7a4e86"],
    [20.4, "#111b42", "#2b3565"],
    [24, "#0b1230", "#1f2b57"]
  ];
  function skyAt(hour) {
    const hr = (hour % 24 + 24) % 24;
    let i = 0;
    while (i < SKY.length - 2 && SKY[i + 1][0] <= hr) i++;
    const [h0, t0, b0] = SKY[i];
    const [h1, t1, b1] = SKY[i + 1];
    const u = (hr - h0) / Math.max(1e-3, h1 - h0);
    const night = hr < 5 || hr > 20 ? 1 : hr < 6.2 ? Math.max(0, (6.2 - hr) / 1.2) : hr > 19 ? Math.min(1, (hr - 19) / 1.2) : 0;
    const day = hr > 7 && hr < 17 ? 1 : hr >= 6 && hr <= 7 ? hr - 6 : hr >= 17 && hr <= 18.5 ? (18.5 - hr) / 1.5 : 0;
    return { top: mix(t0, t1, u), bottom: mix(b0, b1, u), night, day };
  }
  function drawWindowView(ctx, r, hour, t2, seed) {
    const x = Math.round(r.x);
    const y = Math.round(r.y);
    const w = Math.round(r.w);
    const h = Math.round(r.h);
    if (w <= 0 || h <= 0) return;
    clipTo(x, y, w, h);
    const s = seed >>> 0;
    const sky = skyAt(hour);
    for (let i = 0; i < h; i++) fill(ctx, x, y + i, w, 1, mix(sky.top, sky.bottom, i / Math.max(1, h - 1)));
    if (sky.night > 0.3) {
      for (let k2 = 0; k2 < 7; k2++) {
        const hh = h32(s, k2 + 101);
        const sx = x + hh % w;
        const sy = y + (hh >>> 8) % Math.max(1, Math.floor(h * 0.55));
        const tw = Math.floor(t2 / 600 + k2) % 5 === 0;
        fill(ctx, sx, sy, 1, 1, tw ? "#8090c0" : "#f2f4ff");
      }
      const mx = x + Math.floor(w * 0.72);
      fill(ctx, mx, y + 2, 3, 3, "#f4efd2");
      fill(ctx, mx + 2, y + 2, 1, 1, sky.top);
      fill(ctx, mx, y + 4, 1, 1, "#d9d2ad");
    }
    const hr = (hour % 24 + 24) % 24;
    if (hr > 5.6 && hr < 19) {
      const p = (hr - 5.6) / 13.4;
      const sx = x + Math.floor(p * (w - 3));
      const sy = y + Math.floor((1 - Math.sin(p * Math.PI)) * (h * 0.55)) + 1;
      const warm = sky.day < 0.7;
      fill(ctx, sx - 1, sy, 5, 3, warm ? "rgba(255,190,120,0.35)" : "rgba(255,250,210,0.35)");
      fill(ctx, sx, sy, 3, 3, warm ? "#ffcf86" : "#fff6c8");
    }
    if (sky.night < 0.8) {
      const cloud = sky.day > 0.5 ? "rgba(255,255,255,0.9)" : "rgba(255,214,190,0.75)";
      for (let k2 = 0; k2 < 2; k2++) {
        const hh = h32(s, k2 + 7);
        const span = w + 12;
        const cx = x - 6 + Math.floor(frac(t2 / 1e3 * (0.35 + k2 * 0.2) / span + hh % 100 / 100) * span);
        const cy = y + 2 + k2 * 3 + (hh >>> 4) % 2;
        const cw = 5 + hh % 3;
        for (let i = 0; i < cw; i++) {
          const xx = cx + i;
          if (xx < x || xx >= x + w) continue;
          fill(ctx, xx, cy + 1, 1, 1, cloud);
          if (i > 0 && i < cw - 1) fill(ctx, xx, cy, 1, 1, cloud);
        }
      }
    }
    const city = mix("#8ea8c6", "#1a2138", Math.max(sky.night, 1 - sky.day) * 0.9);
    const cityFar = mix("#b3c6dc", "#262f4d", Math.max(sky.night, 1 - sky.day) * 0.9);
    let bx = x;
    let k = 0;
    while (bx < x + w) {
      const hh = h32(s, k + 300);
      const bw = 3 + hh % 4;
      const bh = 3 + (hh >>> 4) % Math.max(2, Math.floor(h * 0.42));
      const far = (hh >>> 9) % 3 === 0;
      const ww = Math.min(bw, x + w - bx);
      fill(ctx, bx, y + h - bh - (far ? 2 : 0), ww, bh + (far ? 2 : 0), far ? cityFar : city);
      if (sky.night > 0.2) {
        for (let wy = y + h - bh + 1; wy < y + h - 1; wy += 2) {
          for (let wx = bx + 1; wx < bx + ww - 1; wx += 2) {
            const on = h32(s + wx * 31, wy) % 3 === 0;
            if (on) fill(ctx, wx, wy, 1, 1, Math.floor(t2 / 3e3 + wx + wy) % 17 === 0 ? "#c99a40" : "#f7d77a");
          }
        }
      } else if (!far && bw > 3) {
        for (let wy = y + h - bh + 1; wy < y + h - 1; wy += 2) fill(ctx, bx + 1, wy, ww - 2, 1, mix(city, "#e6f0fa", 0.35));
      }
      bx += bw;
      k++;
    }
  }
  function drawClock(ctx, r, date) {
    clipTo(Math.round(r.x), Math.round(r.y), Math.round(r.w), Math.round(r.h));
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const sec = date.getSeconds();
    const min = date.getMinutes() + sec / 60;
    const hr = date.getHours() % 12 + min / 60;
    const hand = (angle, len, color) => {
      const a = angle - Math.PI / 2;
      const steps = Math.ceil(len * 2);
      let lx = -999;
      let ly = -999;
      for (let i = 1; i <= steps; i++) {
        const d = len * i / steps;
        const px = Math.floor(cx + Math.cos(a) * d);
        const py = Math.floor(cy + Math.sin(a) * d);
        if (px === lx && py === ly) continue;
        fill(ctx, px, py, 1, 1, color);
        lx = px;
        ly = py;
      }
    };
    const size = Math.min(r.w, r.h);
    hand(hr / 12 * Math.PI * 2, size * 0.26, "#2b2f3b");
    hand(min / 60 * Math.PI * 2, size * 0.4, "#3a3f4b");
    hand(sec / 60 * Math.PI * 2, size * 0.38, "rgba(224,90,90,0.85)");
    fill(ctx, Math.floor(cx), Math.floor(cy), 1, 1, "#e05a5a");
  }

  // vendor/habblaud/upstream/client/src/art/core/sprite.ts
  function floorSheet(wTiles, hTiles, up, side = 4, down = 3) {
    const buf = new PixelBuf(wTiles * TILE + side * 2, up + hTiles * TILE + down);
    buf.ox = side;
    buf.oy = up;
    return { buf, ax: side + wTiles * TILE / 2, ay: up + hTiles * TILE };
  }
  function wallSheet(wTiles, side = 2) {
    const up = TILE * 2 + 4;
    const buf = new PixelBuf(wTiles * TILE + side * 2, up + 2);
    buf.ox = side;
    buf.oy = up;
    return { buf, ax: side + wTiles * TILE / 2, ay: up };
  }
  function rectAt(s, x, y, w, h) {
    return { x: x + s.buf.ox, y: y + s.buf.oy, w, h };
  }
  function trim(s) {
    const b = s.buf.bounds();
    if (!b) return s;
    const buf = s.buf.crop(b.x, b.y, b.w, b.h);
    let rects;
    if (s.rects) {
      rects = {};
      for (const [k, r] of Object.entries(s.rects)) {
        rects[k] = { x: r.x - b.x, y: r.y - b.y, w: r.w, h: r.h };
      }
    }
    return { buf, ax: s.ax - b.x, ay: s.ay - b.y, rects };
  }

  // vendor/habblaud/upstream/client/src/art/furniture/kit.ts
  var M = {
    oak: ramp("#d9b88e", 0.06),
    oakDark: ramp("#b88c5e", 0.06),
    white: ramp("#e9e8e4", 0.045),
    walnut: ramp("#7a5a45", 0.065),
    steel: ramp("#b9c0ca", 0.06),
    steelDark: ramp("#6d7583", 0.07),
    graphite: ramp("#474d5c", 0.065),
    plastic: ramp("#e4e6ea", 0.045),
    stone: ramp("#e8e6e1", 0.04),
    terracotta: ramp("#c9714a", 0.07),
    ceramic: ramp("#eeebe4", 0.05),
    leaf: ramp("#4c9a55", 0.08),
    leafDark: ramp("#2f7044", 0.07),
    cardboard: ramp("#c99a5e", 0.06),
    blueFabric: ramp("#4f78b8", 0.07),
    orange: ramp("#ec8a3c", 0.07)
  };
  var ACCENTS2 = ["#3f7fd8", "#ec8a3c", "#4cae6a", "#e05a5a", "#f2c14e", "#8d66cf", "#36b0b0", "#e47aa8"];
  var SCREEN_BG = "#22324f";
  function rngOf(seed, salt = 0) {
    return mulberry32((seed * 2654435761 ^ salt * 40503 ^ 1540483477) >>> 0);
  }
  function pick(r, arr) {
    return arr[Math.floor(r() * arr.length) % arr.length];
  }
  function topFace(b, x, y, w, h, m) {
    b.rect(x, y, w, h, m.lt);
    if (h > 2) b.hline(x, x + w - 1, y, m.base);
    b.hline(x, x + w - 1, y + h - 1, m.hi);
  }
  function frontFace(b, x, y, w, h, m) {
    b.rect(x, y, w, h, m.base);
    b.hline(x, x + w - 1, y + h - 1, m.dk);
    b.vline(x + w - 1, y, y + h - 1, m.dk);
    if (h > 1) b.hline(x, x + w - 1, y, m.base);
  }
  function woodGrain(b, x, y, w, h, m, seed, vertical = false) {
    const r = rngOf(seed, 7);
    if (vertical) {
      for (let xx = x + 2; xx < x + w - 1; xx += 3 + Math.floor(r() * 2)) {
        const y0 = y + Math.floor(r() * h);
        const len = 2 + Math.floor(r() * (h - 1));
        for (let yy = y0; yy < Math.min(y + h, y0 + len); yy++) b.set(xx, yy, m.base);
      }
      return;
    }
    for (let yy = y + 1; yy < y + h - 1; yy += 2 + Math.floor(r() * 2)) {
      const x0 = x + Math.floor(r() * w);
      const len = 3 + Math.floor(r() * (w / 2));
      for (let xx = x0; xx < Math.min(x + w, x0 + len); xx++) b.set(xx, yy, m.base);
    }
  }
  function contact(b, x, y, w, h, alpha = 0.2) {
    const c = `rgba(28,32,52,${alpha})`;
    const c2 = `rgba(28,32,52,${alpha * 0.55})`;
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        const corner = (xx === x || xx === x + w - 1) && (yy === y || yy === y + h - 1);
        if (corner) continue;
        const edge = xx === x || xx === x + w - 1 || yy === y + h - 1;
        b.under(xx, yy, edge ? c2 : c);
      }
    }
  }
  function underRect(b, x, y, w, h, c) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) b.under(xx, yy, c);
  }
  function glass(b, x, y, w, h, opts = {}) {
    const a = opts.alpha ?? 0.42;
    b.rect(x, y, w, h, `rgba(168,212,238,${a})`);
    if (opts.streaks === false) return;
    const period = opts.period ?? 9;
    for (let k = -h + (opts.offset ?? 0); k < w; k += period) {
      for (let i = 0; i < h; i++) {
        const xx = x + k + (h - 1 - i);
        const yy = y + i;
        if (xx >= x && xx < x + w) b.set(xx, yy, "rgba(255,255,255,0.42)");
        if (xx + 1 >= x && xx + 1 < x + w) b.set(xx + 1, yy, "rgba(255,255,255,0.22)");
      }
    }
    b.hline(x, x + w - 1, y, "rgba(255,255,255,0.35)");
  }
  var SURFACE_SHADOW = "rgba(60,40,40,0.2)";
  var SURFACE_SHADOW_LIGHT = "rgba(40,46,70,0.3)";
  function mug(b, x, y, color) {
    b.hline(x + 1, x + 3, y + 3, SURFACE_SHADOW);
    b.hline(x, x + 2, y, "#f4f2ee");
    b.set(x + 1, y, "#6b4226");
    b.rect(x, y + 1, 3, 2, color);
    b.set(x, y + 1, shade(color, 0.12));
    b.set(x + 2, y + 2, shade(color, -0.12));
    b.set(x + 3, y + 1, shade(color, -0.08));
    b.set(x + 3, y + 2, shade(color, -0.15));
  }
  function papers(b, x, y, w = 6, h = 4, tone = "light") {
    const on = tone === "onLight";
    b.hline(x + 1, x + w, y + h, on ? SURFACE_SHADOW_LIGHT : SURFACE_SHADOW);
    if (on) b.vline(x + w, y, y + h - 1, SURFACE_SHADOW_LIGHT);
    b.rect(x + 1, y - 1, w, h, on ? "#c4bfb2" : "#dedad0");
    b.rect(x, y, w, h, on ? "#fbfaf6" : "#f8f7f3");
    b.hline(x, x + w - 1, y + h - 1, on ? "#b9b3a6" : "#d6d2c8");
    if (on) b.vline(x + w - 1, y, y + h - 1, "#cfcabd");
    for (let i = 1; i < h - 1; i++) b.hline(x + 1, x + 1 + Math.max(1, w - 3 - i % 2), y + i, on ? "#93a0b4" : "#b9c2d0");
  }
  function keyboard(b, x, y, w = 10, tone = "light") {
    const pal = tone === "dark" ? { base: "#3d4250", key: "#5a6070", edge: "#2a2e38", sh: SURFACE_SHADOW } : tone === "onLight" ? { base: "#b9c0cc", key: "#e4e8ee", edge: "#7d8696", sh: SURFACE_SHADOW_LIGHT } : { base: "#d9dce2", key: "#f4f5f7", edge: "#a9aeb8", sh: SURFACE_SHADOW };
    b.hline(x + 1, x + w, y + 3, pal.sh);
    b.rect(x, y, w, 3, pal.base);
    for (let i = 0; i < w - 1; i += 2) {
      b.set(x + 1 + i, y, pal.key);
      b.set(x + i, y + 1, pal.key);
    }
    b.hline(x, x + w - 1, y + 2, pal.edge);
    if (tone === "onLight") {
      b.vline(x, y, y + 2, "#a3abb8");
      b.vline(x + w - 1, y, y + 2, pal.edge);
    }
  }
  function mouse(b, x, y, tone = "light") {
    const on = tone === "onLight";
    const dark = tone === "dark";
    b.hline(x + 1, x + 2, y + 2, on ? SURFACE_SHADOW_LIGHT : SURFACE_SHADOW);
    if (on) b.set(x + 2, y + 1, SURFACE_SHADOW_LIGHT);
    b.rect(x, y, 2, 2, dark ? "#3d4250" : on ? "#c3c9d3" : "#eceef1");
    b.set(x + 1, y + 1, dark ? "#2a2e38" : on ? "#7d8696" : "#b4b9c2");
    if (on) b.set(x, y, "#e4e8ee");
  }
  function monitorFront(b, x, y, w = 16, h = 11) {
    const body = "#2c313d";
    b.hline(x + 3, x + w - 2, y + h + 3, SURFACE_SHADOW);
    b.rect(x, y, w, h, body);
    b.hline(x, x + w - 1, y, "#3e4554");
    b.vline(x, y, y + h - 1, "#363c4a");
    b.hline(x, x + w - 1, y + h - 1, "#232732");
    const sx = x + 1;
    const sy = y + 1;
    const sw = w - 2;
    const sh = h - 2;
    b.rect(sx, sy, sw, sh, SCREEN_BG);
    b.rect(sx, sy, sw, 1, "#2a3d5f");
    for (let i = 0; i < sh; i++) b.set(sx + sw - 3 - i, sy + i, "#2f4569");
    b.set(x + w - 2, y + h - 1, "#5fd07a");
    const cx = x + Math.floor(w / 2) - 1;
    b.rect(cx, y + h, 2, 2, "#4a5060");
    b.rect(cx - 2, y + h + 2, 6, 1, "#5b6272");
    b.set(cx - 2, y + h + 2, "#6b7282");
    return { x: sx, y: sy, w: sw, h: sh };
  }
  function staticScreen(b, r, kind, seed) {
    const { x, y, w, h } = r;
    const rnd = rngOf(seed, 41);
    if (kind === "sheet") {
      b.rect(x, y, w, h, "#b4c0d2");
      b.hline(x, x + w - 1, y, "#5f86c4");
      b.vline(x, y + 1, y + h - 1, "#9aa8bd");
      for (let yy = y + 2; yy < y + h; yy += 2) b.hline(x + 1, x + w - 1, yy, "#a2afc3");
      for (let xx = x + 4; xx < x + w; xx += 4) b.vline(xx, y + 1, y + h - 1, "#a2afc3");
      for (let k = 0; k < 3; k++) {
        const cx = x + 1 + 4 * Math.floor(rnd() * Math.max(1, Math.floor((w - 1) / 4)));
        const cy = y + 1 + 2 * Math.floor(rnd() * Math.max(1, Math.floor((h - 1) / 2)));
        b.rect(cx, cy, Math.min(3, x + w - cx), 1, pick(rnd, ["#6fa784", "#d29b58", "#7d9ad0"]));
      }
      return;
    }
    if (kind === "chart") {
      b.rect(x, y, w, h, "#22304a");
      b.hline(x + 1, x + Math.max(1, Math.floor(w / 2)), y + 1, "#6d7f9e");
      const base = y + h - 1;
      b.hline(x, x + w - 1, base, "#3d4f70");
      const cols = ["#4a86c8", "#4fae7a", "#d09a4a"];
      for (let xx = x + 1, i = 0; xx < x + w - 1; xx += 2, i++) {
        const bh = Math.max(1, Math.min(h - 3, 1 + Math.floor(rnd() * (h - 3)) + Math.floor(i / 2)));
        b.vline(xx, base - bh, base - 1, cols[i % cols.length]);
      }
      return;
    }
    const syn = ["#a0628e", "#4f8fa6", "#a8a35f", "#4f9c68", "#8a72b0", "#b08156"];
    b.rect(x, y, w, h, "#232a3d");
    b.vline(x, y, y + h - 1, "#2c3449");
    for (let yy = y + 1; yy < y + h; yy += 2) {
      let cx = x + 2 + Math.floor(rnd() * 3);
      const tokens = 1 + Math.floor(rnd() * 3);
      for (let k = 0; k < tokens && cx < x + w - 1; k++) {
        const tw = Math.min(1 + Math.floor(rnd() * 4), x + w - 1 - cx);
        b.hline(cx, cx + tw - 1, yy, pick(rnd, syn));
        cx += tw + 1;
      }
    }
  }
  function monitorBack(b, x, y, w = 16, h = 10, tone = "light") {
    const p = tone === "mid" ? { hi: "#b4bcc8", lt: "#a3abb8", base: "#8f98a6", dk: "#747d8c", line: "#454c5a", stand: "#6b7383", foot: "#596170" } : { hi: "#e6eaf0", lt: "#d8dee6", base: "#c9d0da", dk: "#aab3c0", line: "#5b6577", stand: "#9aa3b0", foot: "#7d8696" };
    const cx = x + Math.floor(w / 2);
    b.hline(x + 2, x + w - 1, y + h + 3, SURFACE_SHADOW_LIGHT);
    b.rect(cx - 4, y + h + 1, 8, 2, p.foot);
    b.hline(cx - 4, cx + 3, y + h + 1, p.stand);
    b.set(cx - 4, y + h + 2, p.line);
    b.set(cx + 3, y + h + 2, p.line);
    b.rect(cx - 1, y + h - 1, 2, 3, p.stand);
    b.vline(cx, y + h - 1, y + h + 1, p.dk);
    b.rect(x, y, w, h, p.base);
    b.hline(x + 1, x + w - 2, y + 1, p.lt);
    b.vline(x + 1, y + 1, y + h - 2, p.lt);
    b.vline(x + w - 2, y + 1, y + h - 2, p.dk);
    b.hline(x + 1, x + w - 2, y + h - 2, p.dk);
    b.hline(x, x + w - 1, y, p.hi);
    b.vline(x, y + 1, y + h - 1, p.line);
    b.vline(x + w - 1, y + 1, y + h - 1, p.line);
    b.hline(x, x + w - 1, y + h - 1, p.line);
    b.set(x, y, p.lt);
    b.set(x + w - 1, y, p.dk);
    for (let xx = x + 3; xx <= x + w - 4; xx += 2) b.set(xx, y + 2, p.dk);
    b.rect(cx - 3, y + 4, 6, Math.max(2, h - 6), p.lt);
    b.hline(cx - 3, cx + 2, y + 4, p.hi);
    b.hline(cx - 3, cx + 2, y + 4 + Math.max(2, h - 6) - 1, p.dk);
    b.vline(cx + 2, y + 5, y + 4 + Math.max(2, h - 6) - 1, p.dk);
    b.set(cx - 1, y + 5, tone === "mid" ? "#cfd5de" : "#f6f8fb");
    b.set(cx, y + 5, tone === "mid" ? "#cfd5de" : "#f6f8fb");
    b.vline(cx + 2, y + h, y + h + 2, p.line);
  }
  function pencilCup(b, x, y) {
    b.set(x, y - 2, "#e05a5a");
    b.set(x + 1, y - 3, "#3f7fd8");
    b.set(x + 2, y - 2, "#f2c14e");
    b.rect(x, y - 1, 3, 3, "#5b6272");
    b.set(x, y - 1, "#7a8292");
  }
  function smallSucculent(b, x, y) {
    b.rect(x, y, 4, 3, "#e3e1db");
    b.set(x + 3, y + 1, "#c2bfb7");
    b.set(x + 3, y + 2, "#c2bfb7");
    b.set(x + 1, y - 1, "#6fbf6a");
    b.set(x + 2, y - 1, "#4c9a55");
    b.set(x, y - 2, "#6fbf6a");
    b.set(x + 3, y - 2, "#4c9a55");
    b.set(x + 1, y - 3, "#8fd68a");
    b.set(x + 2, y - 2, "#3e8a4c");
  }
  function photoFrame(b, x, y) {
    b.rect(x, y, 4, 4, "#3a3f4b");
    b.rect(x + 1, y + 1, 2, 2, "#8fc8f0");
    b.set(x + 1, y + 2, "#6fbf6a");
  }
  function book(b, x, y, w, h, color) {
    b.rect(x, y, w, h, color);
    b.vline(x, y, y + h - 1, shade(color, 0.1));
    b.vline(x + w - 1, y, y + h - 1, shade(color, -0.12));
    if (h > 4) b.hline(x, x + w - 1, y + 1, shade(color, 0.22));
    if (h > 6 && w > 1) b.hline(x, x + w - 1, y + h - 3, shade(color, 0.22));
  }
  function foliage(b, cx, cy, rx, ry, m, seed) {
    const r = rngOf(seed, 3);
    b.ellipse(cx, cy + 0.5, rx, ry, m.dd);
    const bubbles = [];
    const br = Math.max(1.6, Math.min(rx, ry) * 0.55);
    for (let gy = -ry + br * 0.6; gy <= ry - br * 0.4; gy += br * 1.05) {
      for (let gx = -rx + br * 0.6; gx <= rx - br * 0.4; gx += br * 1.15) {
        const jx = gx + (r() - 0.5) * br * 0.7;
        const jy = gy + (r() - 0.5) * br * 0.6;
        if ((jx / rx) ** 2 + (jy / ry) ** 2 > 0.82) continue;
        bubbles.push([cx + jx, cy + jy, br * (0.85 + r() * 0.35)]);
      }
    }
    bubbles.sort((a, c) => a[1] - c[1]);
    for (const [bx, by, rad] of bubbles) {
      const low = (by - cy) / ry;
      const left = (cx - bx) / rx;
      const body = low > 0.35 ? m.dk : low > -0.2 || left < -0.4 ? m.base : m.lt;
      for (let y = Math.floor(by - rad); y <= Math.ceil(by + rad); y++) {
        for (let x = Math.floor(bx - rad); x <= Math.ceil(bx + rad); x++) {
          const dx = (x + 0.5 - bx) / rad;
          const dy = (y + 0.5 - by) / (rad * 0.9);
          const d = dx * dx + dy * dy;
          if (d > 1) continue;
          let c = body;
          if (d > 0.4 && dx + dy * 1.3 < -0.75) c = body === m.lt ? m.hi : body === m.base ? m.lt : m.base;
          else if (d > 0.5 && dx * 0.4 + dy > 0.7) c = body === m.lt ? m.base : m.dd;
          b.set(x, y, c);
        }
      }
    }
  }
  function bigLeaf(b, x0, y0, x1, y1, width, m, cuts = "monstera") {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const ux = (x1 - x0) / len;
    const uy = (y1 - y0) / len;
    const nx = -uy;
    const ny = ux;
    const steps = Math.ceil(len * 3);
    const shapeW = (t2) => width / 2 * Math.sin(Math.PI * Math.pow(Math.min(1, t2), 0.7));
    const paint = (grow, color) => {
      for (let i = 0; i <= steps; i++) {
        const t2 = i / steps;
        const w = shapeW(t2) + grow;
        for (let k = -w; k <= w; k += 0.4) {
          b.set(Math.round(x0 + ux * len * t2 + nx * k), Math.round(y0 + uy * len * t2 + ny * k), color(k));
        }
      }
      if (grow > 0) b.set(Math.round(x1 + ux * grow), Math.round(y1 + uy * grow), m.dd);
    };
    paint(0.9, () => m.dd);
    paint(0, (k) => nx * k + ny * k < 0 ? m.lt : m.base);
    b.line(Math.round(x0), Math.round(y0), Math.round(x0 + ux * len * 0.92), Math.round(y0 + uy * len * 0.92), m.dk);
    b.set(Math.round(x0 + ux * len * 0.3 + nx * -shapeW(0.3) * 0.5), Math.round(y0 + uy * len * 0.3 + ny * -shapeW(0.3) * 0.5), m.hi);
    if (cuts === "none") return;
    const cutList = cuts === "monstera" ? [[0.42, 1], [0.6, -1], [0.76, 1]] : Array.from({ length: Math.floor(len / 1.2) }, (_, i) => [0.18 + i * 1.2 / len, i % 2 ? 1 : -1]).filter(([t2]) => t2 < 0.95);
    for (const [t2, side] of cutList) {
      const w = shapeW(t2);
      for (let k = w * 0.35; k <= w + 0.5; k += 0.4) {
        const x = Math.round(x0 + ux * len * (t2 + 0.04) + nx * k * side);
        const y = Math.round(y0 + uy * len * (t2 + 0.04) + ny * k * side);
        if (cuts === "pinnate") b.clear(x, y);
        else b.set(x, y, m.dd);
      }
    }
  }
  function leafBlade(b, x0, y0, x1, y1, width, m, light) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.ceil(len * 2);
    const nx = -(y1 - y0) / len;
    const ny = (x1 - x0) / len;
    for (let i = 0; i <= steps; i++) {
      const t2 = i / steps;
      const w = width * Math.sin(Math.PI * Math.min(1, t2 * 1.15)) * 0.5;
      const px = x0 + (x1 - x0) * t2;
      const py = y0 + (y1 - y0) * t2;
      for (let k = -w; k <= w; k += 0.5) b.set(Math.round(px + nx * k), Math.round(py + ny * k), k < 0 === light ? m.lt : m.base);
    }
    b.line(x0, y0, Math.round(x0 + (x1 - x0) * 0.85), Math.round(y0 + (y1 - y0) * 0.85), m.dk);
  }
  function pot(b, x, y, w, h, m = M.terracotta) {
    b.rect(x, y, w, 2, m.lt);
    b.hline(x, x + w - 1, y, m.hi);
    b.hline(x + 1, x + w - 2, y + 1, shade(m.dd, -0.1));
    for (let i = 2; i < h; i++) {
      const inset = i >= h - 2 ? 1 : 0;
      b.hline(x + inset, x + w - 1 - inset, y + i, m.base);
      b.set(x + inset, y + i, m.lt);
      b.set(x + w - 1 - inset, y + i, m.dk);
      if (i === h - 1) b.hline(x + inset, x + w - 1 - inset, y + i, m.dk);
    }
  }

  // vendor/habblaud/upstream/client/src/art/furniture/common.ts
  var CAB = ramp("#d8b98f", 0.06);
  var TOP = ramp("#eceae5", 0.04);
  function seamless(b, w = 16) {
    for (let y = -b.oy; y < b.h - b.oy; y++) {
      b.clear(-1, y);
      b.clear(w, y);
    }
  }
  function counterBase(b, kind) {
    frontFace(b, 0, 5, 16, 11, CAB);
    b.vline(0, 5, 15, CAB.lt);
    b.vline(15, 5, 13, CAB.dd);
    b.rect(1, 14, 14, 2, "#5a4a3c");
    b.hline(1, 14, 14, "#43372d");
    if (kind === "drawers") {
      for (const y of [8, 11]) {
        b.hline(1, 14, y, CAB.dd);
        b.hline(1, 14, y + 1, CAB.lt);
      }
      for (const y of [6, 9, 12]) b.rect(6, y, 4, 1, "#8b939f");
    } else if (kind === "doors") {
      b.vline(7, 6, 13, CAB.dd);
      b.vline(8, 6, 13, CAB.lt);
      b.rect(5, 8, 1, 3, "#8b939f");
      b.rect(10, 8, 1, 3, "#8b939f");
    } else {
      b.rect(12, 8, 1, 3, "#8b939f");
      b.hline(1, 14, 6, CAB.lt);
    }
    topFace(b, 0, -3, 16, 7, TOP);
    b.hline(0, 15, 4, TOP.dk);
    b.hline(0, 15, 3, TOP.hi);
    for (const [x, y] of [[3, -1], [11, 1], [7, 0]]) b.set(x, y, TOP.base);
  }
  function counter(variant) {
    const s = floorSheet(1, 1, 6);
    counterBase(s.buf, variant === "drawers" ? "drawers" : "plain");
    s.buf.outline();
    seamless(s.buf);
    contact(s.buf, 0, 14, 16, 3, 0.2);
    return { base: s };
  }
  function counterSink() {
    const s = floorSheet(1, 1, 10);
    const b = s.buf;
    counterBase(b, "doors");
    b.rect(3, -1, 10, 4, "#aeb6c2");
    b.rect(4, 0, 8, 3, "#7d8592");
    b.hline(4, 11, 0, "#5d6573");
    b.set(8, 2, "#3d4350");
    b.hline(3, 12, -1, "#d3d8df");
    b.rect(7, -6, 2, 5, "#c3cad4");
    b.hline(7, 10, -7, "#e3e7ec");
    b.set(10, -6, "#c3cad4");
    b.set(9, -7, "#ffffff");
    b.rect(5, -3, 1, 2, "#c3cad4");
    b.outline();
    seamless(b);
    contact(b, 0, 14, 16, 3, 0.2);
    return { base: s };
  }
  function coffeeMachine(state) {
    const s = floorSheet(1, 1, 18);
    const b = s.buf;
    counterBase(b, "drawers");
    const on = state >= 1;
    const body = ramp("#3a3f4b", 0.06);
    const steel = ramp("#c3cad4", 0.06);
    topFace(b, 2, -15, 12, 3, steel);
    b.rect(2, -12, 12, 13, body.base);
    b.vline(2, -12, 0, body.lt);
    b.vline(13, -12, 0, body.dd);
    b.rect(3, -11, 10, 2, "#22262f");
    b.set(4, -10, on ? "#5fd07a" : "#3b4a3f");
    b.set(6, -10, on ? "#f2c14e" : "#4a4535");
    b.rect(9, -11, 3, 2, on ? "#7fd0ff" : "#2a3a52");
    b.rect(5, -7, 6, 2, steel.base);
    b.hline(5, 10, -7, steel.hi);
    b.rect(7, -5, 2, 1, steel.dk);
    b.rect(4, 0, 8, 1, steel.dk);
    b.hline(4, 11, -1, steel.base);
    b.rect(6, -3, 4, 3, "#f4f2ee");
    b.set(10, -2, "#d6d2c8");
    b.hline(6, 9, -3, on ? "#6b4226" : "#f4f2ee");
    if (on) {
      b.vline(7, -4, -3, "#7a4a2a");
      b.set(8, -4, "#9a6a3e");
    }
    b.rect(10, -18, 3, 3, "rgba(120,80,50,0.9)");
    b.hline(10, 12, -18, "rgba(240,240,240,0.8)");
    b.outline();
    seamless(b);
    contact(b, 0, 14, 16, 3, 0.2);
    if (on) {
      for (const [x, y, a] of [[12, -17, 0.55], [13, -18, 0.45], [12, -19, 0.35]]) b.set(x, y, `rgba(255,255,255,${a})`);
    }
    return { base: s };
  }
  function microwave() {
    const s = floorSheet(1, 1, 12);
    const b = s.buf;
    counterBase(b, "plain");
    const body = ramp("#e8eaee", 0.05);
    topFace(b, 1, -11, 14, 3, body);
    frontFace(b, 1, -8, 14, 9, body);
    b.rect(2, -7, 9, 6, "#2a303c");
    b.hline(2, 10, -7, "#3d4656");
    b.line(4, -7, 8, -2, "rgba(255,255,255,0.12)");
    b.rect(12, -7, 2, 2, "#1f2a1f");
    b.set(12, -7, "#7be08a");
    b.set(13, -7, "#7be08a");
    b.set(12, -4, "#9aa2ae");
    b.set(13, -4, "#9aa2ae");
    b.set(12, -3, "#9aa2ae");
    b.set(13, -3, "#9aa2ae");
    b.outline();
    seamless(b);
    contact(b, 0, 14, 16, 3, 0.2);
    return { base: s };
  }
  function fridge() {
    const s = floorSheet(1, 1, 24);
    const b = s.buf;
    const m = ramp("#dfe3e9", 0.05);
    topFace(b, 0, -23, 16, 3, m);
    frontFace(b, 0, -20, 16, 34, m);
    b.vline(0, -20, 13, m.hi);
    b.rect(1, 14, 14, 2, "#4a505c");
    b.hline(0, 15, -9, m.dd);
    b.hline(0, 15, -8, m.lt);
    b.rect(12, -17, 2, 6, "#9aa2ae");
    b.vline(12, -17, -12, "#c3cad4");
    b.rect(12, -5, 2, 9, "#9aa2ae");
    b.vline(12, -5, 3, "#c3cad4");
    b.rect(3, -4, 4, 5, "#fbf4c0");
    b.hline(4, 6, -2, "#c9b77a");
    b.hline(4, 5, 0, "#c9b77a");
    b.set(5, -5, "#e05a5a");
    b.set(8, 4, "#3f7fd8");
    b.set(4, 6, "#4cae6a");
    b.set(3, -15, "#f2c14e");
    b.rect(6, -16, 3, 3, "#e47aa8");
    b.outline();
    contact(b, 0, 13, 16, 4, 0.24);
    return { base: s };
  }
  function vendingMachine() {
    const s = floorSheet(1, 1, 24);
    const b = s.buf;
    const m = ramp("#c94a52", 0.07);
    topFace(b, 0, -23, 16, 3, m);
    frontFace(b, 0, -20, 16, 36, m);
    b.vline(0, -20, 15, m.lt);
    const gx = 2;
    const gy = -18;
    const gw = 9;
    const gh = 22;
    b.rect(gx, gy, gw, gh, "#fff7e0");
    const r = rngOf(7, 61);
    const snacks = ["#e05a5a", "#f2c14e", "#3f7fd8", "#4cae6a", "#ec8a3c", "#8d66cf", "#e47aa8"];
    for (let row = 0; row < 5; row++) {
      const y = gy + 1 + row * 4;
      for (let k = 0; k < 3; k++) {
        const c = pick(r, snacks);
        b.rect(gx + 1 + k * 3, y, 2, 3, c);
        b.set(gx + 1 + k * 3, y, shade(c, 0.2));
      }
      b.hline(gx, gx + gw - 1, y + 3, "#c9b98a");
    }
    glass(b, gx, gy, gw, gh, { alpha: 0.18 });
    b.rect(12, -16, 3, 12, "#2f333d");
    b.rect(13, -15, 1, 2, "#7fd0ff");
    for (let i = 0; i < 4; i++) b.set(13, -11 + i * 2, "#d9dde3");
    b.rect(12, -2, 3, 2, "#22262f");
    b.rect(2, 7, 9, 4, "#22262f");
    b.hline(2, 10, 7, "#3a3f4b");
    b.outline();
    contact(b, 0, 13, 16, 4, 0.26);
    s.rects = { glow: rectAt(s, gx, gy, gw, gh) };
    return { base: s };
  }
  function cafeTable() {
    const s = floorSheet(1, 1, 4);
    const b = s.buf;
    b.ellipse(8, 14.5, 3.5, 1.3, "#3a3f4b");
    b.rect(7, 7, 2, 7, "#4a505c");
    b.vline(7, 7, 13, "#6b7282");
    const t2 = ramp("#f2efe8", 0.05);
    b.ellipse(8, 5.5, 7, 3.5, t2.dk);
    b.ellipse(8, 4.8, 7, 3.2, t2.lt);
    b.set(4, 3, t2.hi);
    b.set(5, 3, t2.hi);
    b.rect(7, 2, 2, 2, "#8fc8f0");
    b.set(7, 1, "#4cae6a");
    b.set(8, 0, "#f26d8a");
    b.set(8, 1, "#4cae6a");
    b.outline();
    contact(b, 3, 13, 10, 3, 0.22);
    return { base: s };
  }
  var CAFE_SEAT = ramp("#e0a84a", 0.07);
  function cafeChair(variant) {
    const v = variant ?? "down";
    const s = floorSheet(1, 1, 10);
    const b = s.buf;
    const legs2 = "#3a3f4b";
    for (const x of [4, 11]) b.vline(x, 9, 15, legs2);
    for (const x of [5, 10]) b.vline(x, 9, 13, "#5a6070");
    const seat = () => {
      b.rect(3, 5, 10, 4, CAFE_SEAT.lt);
      b.hline(3, 12, 5, CAFE_SEAT.hi);
      b.hline(3, 12, 8, CAFE_SEAT.dk);
      b.hline(3, 12, 9, CAFE_SEAT.dd);
    };
    const backPanel2 = (x, y, w, h, m) => {
      b.rect(x, y, w, h, m.base);
      b.hline(x, x + w - 1, y, m.hi);
      b.vline(x, y, y + h - 1, m.lt);
      b.vline(x + w - 1, y, y + h - 1, m.dk);
    };
    if (v === "down") {
      for (const x of [4, 11]) b.vline(x, -3, 5, legs2);
      backPanel2(3, -6, 10, 5, CAFE_SEAT);
      seat();
      b.outline();
      contact(b, 2, 13, 12, 3, 0.2);
      return { base: s };
    }
    if (v === "up") {
      seat();
      b.outline();
      const front = floorSheet(1, 1, 10);
      const f = front.buf;
      for (const x of [4, 11]) f.vline(x, 6, 10, legs2);
      f.rect(3, 3, 10, 5, CAFE_SEAT.base);
      f.hline(3, 12, 3, CAFE_SEAT.hi);
      f.hline(3, 12, 7, CAFE_SEAT.dk);
      f.vline(12, 3, 7, CAFE_SEAT.dk);
      f.outline();
      return { base: s, front };
    }
    seat();
    const bx = v === "left" ? 11 : 3;
    b.vline(bx + 1, 0, 8, legs2);
    backPanel2(bx, -6, 2, 12, CAFE_SEAT);
    b.outline();
    return { base: s };
  }
  var SOFA = ramp("#5b7fbd", 0.07);
  var PILLOW = ramp("#ee8d3e", 0.07);
  function pillow(b, x, y) {
    b.rect(x, y, 6, 5, PILLOW.base);
    b.hline(x + 1, x + 4, y, PILLOW.hi);
    b.vline(x, y + 1, y + 3, PILLOW.lt);
    b.vline(x + 5, y + 1, y + 4, PILLOW.dk);
    b.hline(x + 1, x + 5, y + 4, PILLOW.dk);
    b.set(x + 2, y + 2, PILLOW.dk);
  }
  function cushion(b, x, y, w, h, m, top = 1) {
    b.rect(x, y, w, h, m.base);
    b.rect(x, y, w, top, m.lt);
    b.hline(x + 1, x + w - 2, y, m.hi);
    b.hline(x, x + w - 1, y + h - 1, m.dk);
    b.vline(x + w - 1, y + 1, y + h - 1, m.dk);
    b.vline(x, y + 1, y + h - 2, m.lt);
    b.set(x, y, m.base);
    b.set(x + w - 1, y, m.dk);
    b.set(x, y + h - 1, m.dk);
  }
  function rollArm(b, x, top, w, bottom) {
    b.rect(x, top + 2, w, bottom - top - 2, SOFA.base);
    b.rect(x, top, w, 3, SOFA.lt);
    b.hline(x + 1, x + w - 2, top, SOFA.hi);
    b.hline(x, x + w - 1, top + 3, SOFA.dk);
    b.vline(x, top + 3, bottom, SOFA.lt);
    b.vline(x + w - 1, top + 1, bottom, SOFA.dk);
    b.hline(x, x + w - 1, bottom, SOFA.dd);
    b.clear(x, top);
    b.clear(x + w - 1, top);
  }
  function legs(b, xs, y) {
    for (const x of xs) {
      b.rect(x, y, 2, 2, "#5a4232");
      b.set(x, y, "#7a5a42");
    }
  }
  function sofa(variant) {
    const up = variant === "up";
    const s = floorSheet(3, 1, 14);
    const b = s.buf;
    if (!up) {
      b.rect(5, -11, 38, 13, SOFA.dk);
      b.hline(6, 41, -11, SOFA.base);
      for (let i = 0; i < 3; i++) cushion(b, 6 + i * 12, -10, 12, 11, SOFA, 2);
      b.hline(6, 41, 1, SOFA.dd);
      for (let i = 0; i < 3; i++) cushion(b, 6 + i * 12, 2, 12, 7, ramp(SOFA.lt, 0.06), 4);
      b.rect(5, 9, 38, 5, SOFA.dk);
      b.hline(5, 42, 9, SOFA.base);
      b.hline(5, 42, 13, SOFA.dd);
      legs(b, [7, 39], 14);
      rollArm(b, 0, -5, 6, 13);
      rollArm(b, 42, -5, 6, 13);
      legs(b, [1, 45], 14);
      pillow(b, 7, -5);
      pillow(b, 35, -5);
      b.outline();
      contact(b, -1, 13, 50, 4, 0.24);
      return { base: s };
    }
    backSeat(b, 5, 42);
    pillowTop(b, 8, -3);
    pillowTop(b, 34, -3);
    rollArm(b, 0, -7, 6, 13);
    rollArm(b, 42, -7, 6, 13);
    b.outline();
    contact(b, -1, 13, 50, 4, 0.24);
    const front = floorSheet(3, 1, 14);
    const f = front.buf;
    backPanel(f, 0, 47);
    darkLegs(f, [2, 23, 44], 14);
    f.outline();
    return { base: s, front };
  }
  function backSeat(b, x0, x1) {
    const seat = ramp(SOFA.lt, 0.06);
    b.rect(x0, -3, x1 - x0 + 1, 5, seat.base);
    b.hline(x0, x1, -3, SOFA.base);
    b.hline(x0, x1, -2, seat.lt);
  }
  function pillowTop(b, x, y) {
    b.rect(x, y, 6, 4, PILLOW.base);
    b.hline(x + 1, x + 4, y, PILLOW.hi);
    b.vline(x, y + 1, y + 3, PILLOW.lt);
    b.vline(x + 5, y + 1, y + 3, PILLOW.dk);
    b.set(x, y, PILLOW.lt);
    b.set(x + 5, y, PILLOW.dk);
  }
  function backPanel(f, x0, x1) {
    const back = SOFA.dk;
    const deep = SOFA.dd;
    f.hline(x0 + 3, x1 - 3, 1, SOFA.lt);
    f.hline(x0 + 1, x1 - 1, 2, SOFA.base);
    f.hline(x0 + 4, x0 + 9, 2, SOFA.lt);
    f.hline(x0, x1, 3, SOFA.base);
    f.set(x0 + 2, 1, SOFA.base);
    f.set(x1 - 2, 1, SOFA.base);
    f.hline(x0, x1, 4, deep);
    f.rect(x0, 5, x1 - x0 + 1, 7, back);
    f.hline(x0, x1, 5, mix(back, SOFA.base, 0.45));
    f.hline(x0, x1, 6, mix(back, SOFA.base, 0.2));
    f.vline(x0, 4, 12, SOFA.base);
    f.vline(x1, 3, 12, deep);
    f.hline(x0, x1, 12, deep);
    f.hline(x0, x1, 13, shade(deep, -0.05));
  }
  function darkLegs(b, xs, y) {
    for (const x of xs) {
      b.rect(x, y, 2, 2, "#3b2d24");
      b.set(x, y, "#54402f");
    }
  }
  function armchair(variant) {
    const v = variant ?? "down";
    const s = floorSheet(1, 1, 14);
    const b = s.buf;
    if (v === "down" || v === "up") {
      if (v === "down") {
        b.rect(3, -10, 10, 12, SOFA.dk);
        cushion(b, 3, -9, 10, 10, SOFA, 2);
        cushion(b, 3, 2, 10, 7, ramp(SOFA.lt, 0.06), 4);
        b.rect(3, 9, 10, 5, SOFA.dk);
        b.hline(3, 12, 9, SOFA.base);
        rollArm(b, 0, -4, 4, 13);
        rollArm(b, 12, -4, 4, 13);
        legs(b, [1, 13], 14);
        b.outline();
        contact(b, -1, 13, 18, 4, 0.24);
        return { base: s };
      }
      backSeat(b, 3, 12);
      rollArm(b, 0, -6, 4, 13);
      rollArm(b, 12, -6, 4, 13);
      b.outline();
      contact(b, -1, 13, 18, 4, 0.24);
      const front = floorSheet(1, 1, 14);
      const f = front.buf;
      backPanel(f, 0, 15);
      darkLegs(f, [1, 13], 14);
      f.outline();
      return { base: s, front };
    }
    const left = v === "left";
    const bx = left ? 11 : 0;
    cushion(b, 1, 2, 14, 8, ramp(SOFA.lt, 0.06), 5);
    b.rect(1, 9, 14, 5, SOFA.dk);
    b.hline(1, 14, 9, SOFA.base);
    b.rect(bx, -10, 5, 24, SOFA.base);
    b.rect(bx, -10, 5, 2, SOFA.lt);
    b.hline(bx + 1, bx + 3, -10, SOFA.hi);
    b.vline(bx, -8, 13, SOFA.lt);
    b.vline(bx + 4, -8, 13, SOFA.dk);
    b.clear(bx, -10);
    b.clear(bx + 4, -10);
    b.hline(bx, bx + 4, 13, SOFA.dd);
    legs(b, [1, 13], 14);
    b.outline();
    contact(b, -1, 13, 18, 4, 0.24);
    return { base: s };
  }
  function coffeeTable(seed) {
    const s = floorSheet(2, 1, 6);
    const b = s.buf;
    const w = ramp("#5d4637", 0.06);
    for (const x of [2, 28]) {
      b.rect(x, 9, 2, 5, w.dd);
    }
    topFace(b, 1, 1, 30, 8, w);
    woodGrain(b, 2, 2, 28, 6, w, seed);
    b.hline(1, 30, 9, w.base);
    b.hline(1, 30, 10, w.dk);
    b.ellipse(11, 4, 4, 2, "#f4f2ee");
    b.ellipse(11, 4.6, 3, 1.3, "#d6d2c8");
    for (const [x, y, c] of [[9, 2, "#ee8d3e"], [11, 2, "#e05a5a"], [13, 3, "#ee8d3e"], [10, 3, "#7cc45a"]]) {
      b.rect(x, y, 2, 2, c);
      b.set(x, y, shade(c, 0.2));
    }
    b.rect(19, 3, 8, 5, "#3f7fd8");
    b.rect(20, 2, 7, 5, "#f4f2ee");
    b.rect(21, 3, 4, 2, "#e05a5a");
    b.hline(21, 25, 6, "#b9c2d0");
    if (seed % 2) mug(b, 4, 4, "#f2c14e");
    b.outline();
    contact(b, 0, 12, 32, 4, 0.22);
    return { base: s };
  }
  function pingpongTable() {
    const s = floorSheet(3, 2, 8);
    const b = s.buf;
    const t2 = ramp("#2f72b8", 0.07);
    for (const x of [4, 42]) {
      b.rect(x, 22, 2, 9, "#3a3f4b");
      b.vline(x, 22, 30, "#5a6070");
    }
    b.rect(22, 22, 4, 7, "#3a3f4b");
    b.rect(0, -4, 48, 25, t2.lt);
    b.hline(0, 47, 20, t2.dk);
    b.hline(0, 47, 21, t2.dd);
    b.rect(0, 22, 48, 1, "#2a2e38");
    b.hline(0, 47, -4, "#f4f6f8");
    b.hline(0, 47, 19, "#f4f6f8");
    b.vline(0, -4, 19, "#f4f6f8");
    b.vline(47, -4, 19, "#f4f6f8");
    b.hline(1, 46, 7, "rgba(244,246,248,0.8)");
    for (let y = -8; y <= 18; y++) {
      b.set(23, y, y % 2 ? "rgba(240,244,248,0.55)" : "rgba(40,46,60,0.45)");
      b.set(24, y, "rgba(40,46,60,0.35)");
    }
    b.hline(22, 25, -9, "#3a3f4b");
    b.hline(22, 25, 19, "#3a3f4b");
    b.vline(22, -9, 15, "#f4f6f8");
    b.outline();
    contact(b, 0, 27, 48, 5, 0.22);
    return { base: s };
  }
  var BEANBAG = { red: "#d65454", blue: "#4f78c8", yellow: "#e8b83f", green: "#4fae6a" };
  function beanbag(variant) {
    const m = ramp(BEANBAG[variant ?? "red"] ?? BEANBAG.red, 0.08);
    const s = floorSheet(1, 1, 6);
    const b = s.buf;
    b.ellipse(8, 9, 7.5, 6, m.dk);
    b.ellipse(7.6, 8, 7, 5.5, m.base);
    b.ellipse(7.2, 6.5, 5, 3.5, m.lt);
    b.ellipse(8, 7.5, 3.5, 2, m.base);
    b.set(4, 4, m.hi);
    b.set(5, 3, m.hi);
    b.set(6, 3, m.hi);
    b.hline(4, 12, 14, m.dd);
    b.outline();
    contact(b, 0, 12, 16, 4, 0.24);
    return { base: s };
  }
  function arcade() {
    const s = floorSheet(1, 1, 24);
    const b = s.buf;
    const m = ramp("#5b3f9a", 0.07);
    frontFace(b, 1, -20, 14, 36, m);
    b.vline(1, -20, 15, m.lt);
    b.rect(1, -22, 14, 4, "#f2c14e");
    b.hline(1, 14, -22, "#fff2b0");
    for (const x of [3, 5, 8, 10, 12]) b.set(x, -20, "#e05a5a");
    b.rect(2, -17, 12, 9, "#1a1f2e");
    const screen = { x: 3, y: -16, w: 10, h: 7 };
    b.rect(screen.x, screen.y, screen.w, screen.h, "#14213d");
    b.rect(5, -13, 2, 2, "#7be08a");
    b.rect(9, -15, 2, 1, "#ff79c6");
    b.set(8, -11, "#f2c14e");
    b.rect(1, -7, 14, 4, m.hi);
    b.hline(1, 14, -4, m.dk);
    b.rect(4, -7, 2, 2, "#e05a5a");
    b.set(4, -7, "#ff9a9a");
    b.vline(5, -5, -4, "#2a2e38");
    for (const [x, c] of [[9, "#3f7fd8"], [11, "#f2c14e"], [13, "#4cae6a"]]) b.set(x, -6, c);
    b.rect(5, 2, 6, 6, m.dd);
    b.set(6, 4, "#f2a03d");
    b.set(9, 4, "#f2a03d");
    b.line(2, 13, 6, 9, "#e47aa8");
    b.line(3, 13, 7, 9, "#36b0b0");
    b.outline();
    contact(b, 0, 13, 16, 4, 0.26);
    s.rects = { screen: rectAt(s, screen.x, screen.y, screen.w, screen.h) };
    return { base: s };
  }
  function toiletStall(state) {
    const occupied = state >= 1;
    const panel = ramp("#a9c4cf", 0.06);
    const rail = ramp("#c3cad4", 0.06);
    const s = floorSheet(2, 2, 26, 3, 4);
    const b = s.buf;
    const c = ramp("#f6f6f3", 0.045);
    b.rect(11, -7, 10, 6, c.base);
    b.hline(11, 20, -7, c.hi);
    b.hline(11, 20, -2, c.dk);
    b.rect(14, -6, 4, 1, "#c9ced6");
    b.ellipse(16, 3, 5.5, 4, c.dk);
    b.ellipse(16, 2.5, 5, 3.6, c.lt);
    b.ellipse(16, 3, 3, 2.2, "#cfd8e0");
    b.ellipse(16, 3.2, 2, 1.4, "#a9c9de");
    b.rect(3, 2, 3, 3, "#ffffff");
    b.set(5, 4, "#d9dde3");
    b.vline(3, 2, 4, "#9aa2ae");
    for (const x of [0, 29]) {
      b.rect(x, -22, 3, 34, panel.base);
      b.vline(x, -22, 11, panel.lt);
      b.vline(x + 2, -22, 11, panel.dk);
      b.hline(x, x + 2, -22, rail.hi);
    }
    b.outline();
    underRect(b, 2, 0, 28, 12, "rgba(30,34,52,0.12)");
    const front = floorSheet(2, 2, 26, 3, 4);
    const f = front.buf;
    f.rect(0, 10, 32, 20, panel.base);
    f.rect(0, 9, 32, 2, rail.lt);
    f.hline(0, 31, 9, rail.hi);
    f.vline(0, 11, 29, panel.lt);
    f.vline(31, 11, 29, panel.dk);
    f.hline(0, 31, 29, panel.dk);
    for (const x of [1, 30]) f.rect(x, 30, 1, 2, "#9aa2ae");
    if (occupied) {
      f.rect(7, 12, 18, 17, panel.lt);
      f.vline(7, 12, 28, panel.dk);
      f.vline(24, 12, 28, panel.dd);
      f.hline(7, 24, 12, panel.hi);
      f.rect(21, 18, 2, 3, "#5a6070");
      f.rect(21, 15, 2, 2, "#e05a5a");
    } else {
      f.rect(19, 12, 6, 17, "#3a4250");
      f.rect(20, 13, 4, 15, "#5a6577");
      f.rect(7, 12, 12, 17, panel.lt);
      f.vline(7, 12, 28, panel.dk);
      f.vline(18, 12, 28, panel.dk);
      f.hline(7, 18, 12, panel.hi);
      f.rect(16, 18, 2, 3, "#5a6070");
      f.rect(21, 15, 2, 2, "#5fd07a");
    }
    f.outline();
    return { base: s, front };
  }
  function sink() {
    const s = floorSheet(1, 1, 10);
    const b = s.buf;
    const cab = ramp("#e9e8e4", 0.05);
    frontFace(b, 1, 4, 14, 12, cab);
    b.vline(7, 5, 14, cab.dd);
    b.vline(8, 5, 14, cab.lt);
    b.rect(5, 8, 1, 3, "#9aa2ae");
    b.rect(10, 8, 1, 3, "#9aa2ae");
    topFace(b, 0, -3, 16, 7, ramp("#d7dbe1", 0.04));
    b.ellipse(8, 0.5, 5, 2.6, "#f8f8f6");
    b.ellipse(8, 0.8, 4, 1.8, "#dfe5ea");
    b.set(8, 1, "#7d8592");
    b.rect(7, -5, 2, 3, "#c3cad4");
    b.set(7, -5, "#ffffff");
    b.hline(7, 9, -6, "#d3d8df");
    b.rect(12, -4, 2, 3, "#f2c14e");
    b.set(12, -5, "#5a6070");
    b.outline();
    contact(b, 0, 14, 16, 3, 0.2);
    return { base: s };
  }
  function receptionDesk(seed) {
    const s = floorSheet(3, 1, 16);
    const b = s.buf;
    const wood = M.oak;
    const stone = ramp("#efede8", 0.04);
    topFace(b, 1, -10, 46, 6, M.white);
    monitorBack(b, 8, -15, 13, 7);
    pot(b, 38, -13, 5, 4, M.ceramic);
    foliage(b, 40.5, -16, 3.5, 3, M.leaf, seed + 1);
    frontFace(b, 0, -2, 48, 18, wood);
    woodGrain(b, 1, -1, 46, 14, wood, seed, true);
    b.rect(0, 5, 48, 3, "#3f7fd8");
    b.hline(0, 47, 5, "#6aa0ec");
    b.hline(0, 47, 7, "#2d62b3");
    b.rect(0, 14, 48, 2, wood.dd);
    topFace(b, -1, -6, 50, 5, stone);
    b.hline(-1, 48, -2, stone.dk);
    b.rect(30, -6, 4, 2, "#d9a42e");
    b.set(31, -7, "#f2c14e");
    b.set(32, -7, "#f2c14e");
    papers(b, 4, -5, 7, 3);
    b.line(14, -4, 18, -5, "#3a3f4b");
    b.outline();
    contact(b, -1, 13, 50, 4, 0.24);
    return { base: s };
  }
  function bench() {
    const s = floorSheet(2, 1, 10);
    const b = s.buf;
    const w = M.oak;
    const frame = "#3a3f4b";
    for (const x of [2, 29]) {
      b.vline(x, -6, 15, frame);
      b.vline(x + 1, 8, 15, "#5a6070");
    }
    b.hline(2, 30, 13, frame);
    for (const y of [-6, -3]) {
      b.rect(1, y, 30, 2, w.base);
      b.hline(1, 30, y, w.lt);
    }
    for (const y of [2, 5]) {
      b.rect(0, y, 32, 3, w.lt);
      b.hline(0, 31, y, w.hi);
      b.hline(0, 31, y + 2, w.dk);
    }
    b.rect(0, 8, 32, 1, w.dd);
    b.outline();
    contact(b, 0, 13, 32, 3, 0.22);
    return { base: s };
  }

  // vendor/habblaud/upstream/client/src/art/furniture/office.ts
  function deskMats(variant) {
    switch (variant) {
      case "white":
        return { top: M.white, edge: ramp("#d7d6d1", 0.05), legs: M.steel, ped: ramp("#dcdbd6", 0.05) };
      case "dark":
        return { top: M.walnut, edge: ramp("#5f4535", 0.06), legs: M.graphite, ped: ramp("#5a4334", 0.06) };
      default:
        return { top: M.oak, edge: M.oakDark, legs: ramp("#e9e8e4", 0.05), ped: ramp("#e6e4de", 0.05) };
    }
  }
  var MUG_COLORS = ["#e2604f", "#3f7fd8", "#f2c14e", "#4cae6a", "#f4f2ee", "#8d66cf"];
  function deskShadow(b) {
    underRect(b, 3, 8, 26, 7, "rgba(30,34,52,0.2)");
    contact(b, -1, 13, 34, 4, 0.2);
  }
  function deskBody(s, m, seed, back) {
    const b = s.buf;
    if (back) {
      frontFace(b, 1, 8, 30, 6, m.ped);
      b.hline(1, 30, 8, m.ped.dk);
      b.hline(2, 29, 11, m.ped.lt);
    }
    for (const x of [0, 29]) {
      b.rect(x, 8, 3, 8, m.legs.base);
      b.vline(x, 8, 15, m.legs.lt);
      b.vline(x + 2, 8, 15, m.legs.dk);
      b.hline(x, x + 2, 15, m.legs.dd);
    }
    if (!back) {
      frontFace(b, 19, 8, 10, 8, m.ped);
      b.hline(19, 28, 11, m.ped.dk);
      b.hline(19, 28, 12, m.ped.lt);
      b.hline(22, 25, 9, m.ped.dd);
      b.hline(22, 25, 13, m.ped.dd);
    }
    topFace(b, 0, -6, 32, 12, m.top);
    woodGrain(b, 1, -5, 30, 10, m.top, seed);
    b.hline(0, 31, 6, m.edge.base);
    b.hline(0, 31, 7, m.edge.dk);
    b.set(0, 6, m.edge.lt);
  }
  function deskTop(s, seed, tone) {
    const b = s.buf;
    const r = rngOf(seed, 11);
    const v = seed % 6;
    const mugC = pick(r, MUG_COLORS);
    let screen;
    let screen2;
    switch (v) {
      case 1: {
        screen = monitorFront(b, 2, -17, 16, 11);
        screen2 = monitorFront(b, 18, -16, 13, 10);
        staticScreen(b, screen2, "sheet", seed);
        keyboard(b, 6, -1, 11, tone);
        mouse(b, 20, 0, tone);
        mug(b, 26, -2, mugC);
        break;
      }
      case 2: {
        screen = monitorFront(b, 5, -17, 16, 11);
        b.rect(22, -9, 9, 6, "#3a404d");
        b.hline(22, 30, -9, "#4d5464");
        screen2 = { x: 23, y: -8, w: 7, h: 4 };
        staticScreen(b, screen2, "ide", seed);
        b.rect(21, -3, 11, 2, "#c9ced6");
        b.hline(21, 31, -2, "#9aa1ad");
        b.hline(22, 31, -1, tone === "onLight" ? "rgba(40,46,70,0.3)" : "rgba(60,40,40,0.2)");
        keyboard(b, 8, -1, 10, tone);
        smallSucculent(b, 1, -3);
        break;
      }
      case 3: {
        screen = monitorFront(b, 8, -17, 16, 11);
        b.rect(22, -15, 2, 2, "#f7d154");
        b.rect(9, -15, 2, 2, "#ff9fb2");
        keyboard(b, 11, -1, 10, tone);
        mouse(b, 23, 0, tone);
        photoFrame(b, 2, -5);
        papers(b, 24, -4, 6, 4, tone);
        mug(b, 3, 0, mugC);
        break;
      }
      case 4: {
        screen = monitorFront(b, 4, -17, 15, 11);
        screen2 = monitorFront(b, 19, -17, 12, 10);
        staticScreen(b, screen2, "chart", seed);
        keyboard(b, 7, -1, 11, tone);
        mouse(b, 21, 0, tone);
        papers(b, 1, -2, 5, 4, tone);
        break;
      }
      case 5: {
        screen = monitorFront(b, 8, -17, 16, 11);
        keyboard(b, 11, -1, 10, tone);
        mouse(b, 23, 0, tone);
        b.hline(2, 6, -4, "#3a3f4b");
        b.set(1, -3, "#3a3f4b");
        b.set(7, -3, "#3a3f4b");
        b.rect(1, -2, 2, 2, "#e2604f");
        b.rect(6, -2, 2, 2, "#e2604f");
        mug(b, 26, -3, mugC);
        pencilCup(b, 28, 2);
        break;
      }
      default: {
        screen = monitorFront(b, 8, -17, 16, 11);
        keyboard(b, 11, -1, 10, tone);
        mouse(b, 23, 0, tone);
        mug(b, 3, -2, mugC);
        papers(b, 25, -4, 6, 4, tone);
        smallSucculent(b, 26, 2);
        break;
      }
    }
    return { screen, screen2 };
  }
  function itemTone(variant) {
    return variant === "white" ? "onLight" : "light";
  }
  function desk(variant, seed) {
    const s = floorSheet(2, 1, 20);
    const m = deskMats(variant);
    deskBody(s, m, seed, false);
    const scr = deskTop(s, seed, itemTone(variant));
    s.buf.outline();
    deskShadow(s.buf);
    s.rects = { screen: rectAt(s, scr.screen.x, scr.screen.y, scr.screen.w, scr.screen.h) };
    if (scr.screen2) s.rects.screen2 = rectAt(s, scr.screen2.x, scr.screen2.y, scr.screen2.w, scr.screen2.h);
    return { base: s };
  }
  function deskBack(variant, seed) {
    const s = floorSheet(2, 1, 12);
    const m = deskMats(variant);
    const b = s.buf;
    deskBody(s, m, seed, true);
    const r = rngOf(seed, 12);
    const v = seed % 4;
    const mugC = pick(r, MUG_COLORS);
    const tone = itemTone(variant);
    const plastic = variant === "dark" ? "mid" : "light";
    if (v === 1) {
      monitorBack(b, 2, -7, 15, 10, plastic);
      monitorBack(b, 17, -6, 13, 9, plastic);
    } else {
      monitorBack(b, 8, -7, 16, 10, plastic);
      if (v === 2) smallSucculent(b, 26, 0);
      else papers(b, 25, -1, 6, 4, tone);
      if (v === 3) photoFrame(b, 2, -3);
      else mug(b, 2, 0, mugC);
    }
    b.outline();
    deskShadow(b);
    return { base: s };
  }
  var CHAIR_COLORS = {
    black: "#41465a",
    blue: "#3f62a3",
    red: "#b44a4a",
    green: "#3f8a62",
    gray: "#8b929e"
  };
  function chairRamp(variant) {
    return ramp(CHAIR_COLORS[variant ?? "black"] ?? CHAIR_COLORS.black, 0.07);
  }
  function starBase(b) {
    const metal = "#565d6b";
    const caster = "#23262e";
    b.hline(3, 12, 13, metal);
    b.hline(5, 10, 14, metal);
    b.set(3, 13, "#6c7382");
    for (const [x, y] of [[2, 14], [13, 14], [4, 15], [11, 15]]) {
      b.set(x, y, caster);
      b.set(x + (x < 8 ? 1 : -1), y, caster);
    }
    b.rect(7, 9, 2, 4, "#a3aab6");
    b.vline(8, 9, 12, "#7d8592");
  }
  function officeChair(variant) {
    const c = chairRamp(variant);
    const base = floorSheet(1, 1, 6);
    const b = base.buf;
    starBase(b);
    b.rect(2, 4, 12, 6, c.lt);
    b.hline(3, 12, 4, c.hi);
    b.hline(2, 13, 8, c.base);
    b.hline(2, 13, 9, c.dk);
    b.set(2, 4, c.base);
    b.set(13, 4, c.base);
    b.outline();
    contact(b, 1, 13, 14, 3, 0.22);
    const front = floorSheet(1, 1, 6);
    const f = front.buf;
    f.rect(4, 7, 8, 6, c.base);
    f.hline(5, 10, 6, c.lt);
    f.hline(4, 11, 7, c.lt);
    f.set(5, 7, c.hi);
    f.set(6, 7, c.hi);
    f.vline(4, 8, 11, c.lt);
    f.vline(11, 7, 12, c.dk);
    f.hline(5, 10, 9, c.dk);
    f.hline(5, 10, 10, c.dk);
    f.hline(4, 11, 12, c.dd);
    f.rect(7, 13, 2, 1, "#4a505c");
    f.outline();
    return { base, front };
  }
  function officeChairFront(variant) {
    const c = chairRamp(variant);
    const s = floorSheet(1, 1, 10);
    const b = s.buf;
    starBase(b);
    b.rect(3, -6, 10, 10, c.base);
    b.hline(4, 11, -7, c.lt);
    b.rect(4, -5, 8, 7, c.lt);
    b.hline(5, 10, -5, c.hi);
    b.vline(12, -6, 3, c.dk);
    b.hline(3, 12, 3, c.dd);
    b.rect(7, 4, 2, 2, "#4a505c");
    b.rect(2, 5, 12, 5, c.lt);
    b.hline(3, 12, 5, c.hi);
    b.hline(2, 13, 9, c.dk);
    b.hline(2, 13, 10, c.dd);
    for (const x of [1, 13]) {
      b.rect(x, 3, 2, 5, "#3a3f4b");
      b.set(x, 3, "#5a6070");
    }
    b.outline();
    contact(b, 1, 13, 14, 3, 0.22);
    return { base: s };
  }
  function bookshelf(seed) {
    const s = floorSheet(2, 1, 22);
    const b = s.buf;
    const w = M.oak;
    const r = rngOf(seed, 21);
    topFace(b, 0, -21, 32, 3, w);
    b.rect(0, -18, 32, 34, w.dk);
    b.rect(2, -17, 28, 31, shade(w.dd, -0.12));
    b.vline(0, -18, 15, w.lt);
    b.vline(1, -18, 15, w.base);
    b.vline(30, -18, 15, w.base);
    b.vline(31, -18, 15, w.dd);
    const shelves = [-8, 3, 15];
    for (const y of shelves) {
      b.hline(1, 30, y, w.lt);
      b.hline(1, 30, y + 1, w.dk);
    }
    b.hline(0, 31, 15, w.dd);
    shelves.forEach((shelf, i) => {
      const bottom = shelf - 1;
      let x = 3;
      while (x < 29) {
        const kind = r();
        if (kind < 0.12 && x < 25) {
          pot(b, x, bottom - 3, 4, 4, M.ceramic);
          foliage(b, x + 2, bottom - 5, 2.5, 2, M.leaf, seed + x + i * 7);
          x += 5;
        } else if (kind < 0.2 && x < 24) {
          const bc = pick(r, ["#e9e4d6", "#c9a46e", "#9fb6cf"]);
          b.rect(x, bottom - 4, 5, 5, bc);
          b.hline(x, x + 4, bottom - 4, shade(bc, 0.1));
          b.rect(x + 1, bottom - 2, 3, 1, shade(bc, -0.2));
          x += 6;
        } else if (kind < 0.26 && x < 26) {
          b.rect(x + 1, bottom - 4, 3, 2, "#f2c14e");
          b.set(x, bottom - 4, "#d9a42e");
          b.set(x + 4, bottom - 4, "#d9a42e");
          b.set(x + 2, bottom - 2, "#d9a42e");
          b.rect(x + 1, bottom - 1, 3, 2, "#6b4a32");
          x += 6;
        } else {
          const n = 2 + Math.floor(r() * 4);
          for (let k = 0; k < n && x < 29; k++) {
            const bw = 1 + Math.floor(r() * 2);
            const bh = 6 + Math.floor(r() * 4);
            book(b, x, bottom - bh + 1, bw, bh, pick(r, ACCENTS2));
            x += bw;
          }
          if (r() < 0.3 && x < 26) {
            b.line(x, bottom, x + 3, bottom - 6, pick(r, ACCENTS2), 1);
            b.line(x + 1, bottom, x + 4, bottom - 6, pick(r, ACCENTS2), 1);
            x += 5;
          } else x += 1;
        }
      }
    });
    b.outline();
    contact(b, -1, 13, 34, 4, 0.22);
    return { base: s };
  }
  function binderShelf(seed) {
    const s = floorSheet(1, 1, 22);
    const b = s.buf;
    const w = ramp("#ecebe6", 0.05);
    const r = rngOf(seed, 23);
    topFace(b, 0, -21, 16, 3, w);
    b.rect(0, -18, 16, 34, w.dk);
    b.rect(1, -17, 14, 31, "#7d8592");
    b.vline(0, -18, 15, w.lt);
    b.vline(15, -18, 15, w.dd);
    const shelves = [-8, 3, 15];
    for (const y of shelves) {
      b.hline(1, 14, y, w.lt);
      b.hline(1, 14, y + 1, w.dk);
    }
    const tops = [-17, -6, 5];
    const binders = ["#3f7fd8", "#ec8a3c", "#4cae6a", "#3f7fd8", "#ec8a3c", "#e05a5a", "#f2c14e"];
    tops.forEach((top, i) => {
      const bottom = shelves[i] - 1;
      const h = bottom - top + 1;
      if (i === 2 && r() < 0.6) {
        b.rect(2, bottom - 6, 6, 7, M.cardboard.base);
        b.hline(2, 7, bottom - 6, M.cardboard.lt);
        b.rect(3, bottom - 4, 4, 2, "#f4efe2");
        b.rect(8, bottom - 5, 6, 6, M.cardboard.dk);
        b.hline(8, 13, bottom - 5, M.cardboard.base);
        b.rect(9, bottom - 3, 4, 2, "#f4efe2");
        return;
      }
      let x = 2;
      while (x < 14) {
        const c = pick(r, binders);
        const bh = Math.min(h - 1, 8 + Math.floor(r() * 2));
        b.rect(x, bottom - bh + 1, 2, bh, c);
        b.vline(x, bottom - bh + 1, bottom, shade(c, 0.1));
        b.set(x, bottom - bh + 3, "#f4f2ee");
        b.set(x + 1, bottom - bh + 3, "#f4f2ee");
        b.set(x + 1, bottom - 1, shade(c, -0.2));
        x += 2;
        if (r() < 0.12) x += 1;
      }
    });
    b.outline();
    contact(b, 0, 13, 16, 4, 0.22);
    return { base: s };
  }
  function filingCabinet() {
    const s = floorSheet(1, 1, 8);
    const b = s.buf;
    const m = ramp("#c3c9d2", 0.06);
    topFace(b, 1, -7, 14, 4, m);
    frontFace(b, 1, -3, 14, 19, m);
    for (const y of [3, 9]) {
      b.hline(1, 14, y, m.dd);
      b.hline(1, 14, y + 1, m.lt);
    }
    for (const y of [-1, 5, 11]) {
      b.rect(6, y, 4, 1, "#7d8592");
      b.rect(6, y + 1, 4, 1, "#eef1f5");
      b.set(5, y + 1, "#9aa2ae");
    }
    b.set(2, -3, m.hi);
    smallSucculent(b, 9, -9);
    b.outline();
    contact(b, 0, 13, 16, 4, 0.22);
    return { base: s };
  }
  function printer() {
    const s = floorSheet(1, 1, 14);
    const b = s.buf;
    const body = ramp("#dfe2e7", 0.05);
    const dark = ramp("#7b8391", 0.06);
    frontFace(b, 0, 2, 16, 14, body);
    for (const y of [6, 10]) {
      b.hline(1, 14, y, body.dd);
      b.rect(6, y + 1, 4, 1, dark.base);
    }
    topFace(b, 0, -11, 16, 6, body);
    b.rect(1, -10, 14, 3, "#f4f5f7");
    b.hline(1, 14, -8, "#c9ced6");
    frontFace(b, 0, -5, 16, 7, body);
    b.rect(10, -10, 5, 3, dark.base);
    b.rect(11, -9, 3, 1, "#7fd0ff");
    b.set(14, -8, "#5fd07a");
    b.rect(2, -4, 9, 2, "#3d4350");
    b.rect(3, -5, 7, 2, "#fbfbf8");
    b.hline(3, 9, -3, "#e3e1da");
    b.set(13, -2, "#5fd07a");
    b.outline();
    contact(b, -1, 13, 18, 4, 0.22);
    return { base: s };
  }
  function trashBin() {
    const s = floorSheet(1, 1, 2);
    const b = s.buf;
    const m = ramp("#8a96a8", 0.07);
    for (let y = 7; y <= 15; y++) {
      const inset = y > 13 ? 1 : 0;
      b.hline(4 + inset, 11 - inset, y, m.base);
      b.set(4 + inset, y, m.lt);
      b.set(11 - inset, y, m.dk);
    }
    b.hline(5, 10, 15, m.dk);
    b.ellipse(8, 6.5, 4.5, 2, m.lt);
    b.ellipse(8, 6.6, 3.5, 1.3, "#3b4150");
    b.rect(6, 5, 3, 2, "#f4f2ee");
    b.set(8, 5, "#d8d4ca");
    b.set(9, 6, "#f7d154");
    b.outline();
    contact(b, 3, 14, 10, 2, 0.22);
    return { base: s };
  }
  function plantSmall(variant, seed) {
    const s = floorSheet(1, 1, 10);
    const b = s.buf;
    const v = variant ?? "fern";
    if (v === "succulent") {
      pot(b, 4, 9, 8, 7, M.ceramic);
      b.rect(5, 9, 6, 1, "#5b4636");
      const g = ramp("#7fbf9f", 0.08);
      const petals = [[3, 8, 6, 5], [13, 8, 10, 5], [5, 5, 7, 3], [11, 5, 9, 3], [8, 3, 8, 6], [4, 7, 8, 6], [12, 7, 8, 6]];
      petals.forEach(([x1, y1, x0, y0], i) => leafBlade(b, x0, y0 + 2, x1, y1, 3, i < 2 ? ramp(g.dk, 0.08) : g, true));
      b.set(8, 5, g.hi);
      b.set(7, 6, g.lt);
    } else if (v === "flower") {
      pot(b, 4, 9, 8, 7, M.terracotta);
      b.rect(5, 9, 6, 1, "#5b4636");
      const g = M.leaf;
      for (const [x1, y1] of [[2, 6], [14, 5], [5, 2], [11, 2], [8, 4]]) leafBlade(b, 8, 9, x1, y1, 3, g, x1 < 8);
      const petals = pick(rngOf(seed, 5), ["#f26d8a", "#f2c14e", "#ffffff", "#b07ae8"]);
      for (const [x, y] of [[4, 1], [10, 0], [7, 3], [12, 4], [3, 5]]) {
        b.set(x, y, petals);
        b.set(x + 1, y, shade(petals, 0.12));
        b.set(x, y + 1, shade(petals, -0.12));
        b.set(x + 1, y + 1, "#f7d154");
      }
    } else {
      pot(b, 4, 9, 8, 7, M.terracotta);
      b.rect(5, 9, 6, 1, "#5b4636");
      const g = M.leaf;
      const fr = [[0, 7, 0], [16, 7, 0], [2, 1, 1], [14, 1, 0], [5, -3, 1], [11, -3, 1], [8, -5, 1], [-1, 11, 0], [17, 11, 0]];
      fr.forEach(([x1, y1, light]) => leafBlade(b, 8, 9, x1, y1, 2.6, light ? g : ramp(g.dk, 0.07), x1 < 8));
      b.set(8, -5, g.hi);
    }
    b.outline();
    contact(b, 3, 14, 10, 2, 0.24);
    return { base: s };
  }
  function plantTall(variant, seed) {
    const s = floorSheet(1, 1, 24, 6);
    const b = s.buf;
    const v = variant ?? "ficus";
    if (v === "bonsai") {
      const st = M.walnut;
      topFace(b, 1, 7, 14, 3, st);
      frontFace(b, 1, 10, 14, 3, st);
      for (const x of [2, 12]) b.rect(x, 13, 2, 3, st.dd);
      const tray = ramp("#4f6a8f", 0.07);
      b.rect(3, 4, 10, 1, tray.lt);
      b.rect(3, 5, 10, 2, tray.base);
      b.hline(4, 11, 4, "#5b4636");
      b.vline(12, 5, 6, tray.dk);
      b.hline(4, 11, 6, tray.dk);
      const tr2 = ramp("#7a5a40", 0.08);
      b.line(7, 4, 6, 0, tr2.base, 2);
      b.line(6, 0, 9, -4, tr2.base, 2);
      b.line(9, -4, 8, -8, tr2.base, 1);
      b.line(8, -3, 4, -5, tr2.base, 1);
      b.line(9, -5, 12, -6, tr2.base, 1);
      b.set(6, 3, tr2.dk);
      b.set(9, 4, tr2.lt);
      b.set(5, 4, tr2.lt);
      foliage(b, 4, -6.5, 3.6, 2.2, M.leafDark, seed + 3);
      foliage(b, 12.5, -7.5, 3.2, 2, M.leafDark, seed + 4);
      foliage(b, 8.5, -10.5, 4, 2.4, M.leaf, seed + 5);
    } else if (v === "palm") {
      pot(b, 3, 6, 10, 10, M.ceramic);
      b.rect(4, 6, 8, 1, "#5b4636");
      const g = M.leaf;
      const dark = ramp(M.leaf.dk, 0.07);
      for (const sx of [6, 8, 10]) b.line(8, 6, sx, -4, "#86a04f", 1);
      const fronds = [
        [7, -3, -2, -20, dark],
        [9, -3, 17, -19, dark],
        [7, -2, -5, -8, g],
        [9, -2, 21, -8, g],
        [8, -3, 8, -23, g]
      ];
      for (const [x0, y0, x1, y1, m] of fronds) bigLeaf(b, x0, y0, x1, y1, 6, m, "pinnate");
    } else if (v === "monstera") {
      pot(b, 3, 6, 10, 10, M.terracotta);
      b.rect(4, 6, 8, 1, "#5b4636");
      const g = ramp("#43995a", 0.08);
      const dark = ramp("#2f7a45", 0.08);
      const leaves = [
        [7, -7, 1, -17, 9, dark],
        [9, -7, 16, -16, 9, dark],
        [8, -6, 9, -21, 9, g],
        [6, 1, -3, -6, 9, g],
        [10, 1, 19, -5, 9, g],
        [8, 3, 6, -5, 7, dark]
      ];
      for (const [x0, y0] of leaves) b.line(8, 6, x0, y0, "#2f6b3d");
      for (const [x0, y0, x1, y1, w, m] of leaves) bigLeaf(b, x0, y0, x1, y1, w, m, "monstera");
    } else {
      pot(b, 3, 6, 10, 10, M.ceramic);
      b.rect(4, 6, 8, 1, "#5b4636");
      const tr2 = "#7a5a3c";
      b.line(8, 6, 8, -4, tr2, 1);
      b.line(7, 6, 7, 0, "#8e6b48", 1);
      b.line(8, -1, 5, -5, tr2, 1);
      b.line(8, -3, 11, -6, tr2, 1);
      foliage(b, 8, -10, 7, 5.5, M.leafDark, seed + 7);
      foliage(b, 6, -13, 4.6, 3.6, M.leaf, seed + 8);
      foliage(b, 11.5, -9, 3.8, 3.2, M.leaf, seed + 9);
      foliage(b, 4, -7, 3.2, 2.6, M.leaf, seed + 10);
    }
    b.outline();
    contact(b, 2, 14, 12, 3, 0.24);
    return { base: s };
  }
  function glassPartition(variant) {
    const v = variant ?? "h";
    const s = floorSheet(1, 1, 22, 2);
    const b = s.buf;
    const wall = ramp("#f1f1ee", 0.045);
    const metal = ramp("#c3cad4", 0.06);
    if (v === "v") {
      const cols = ["#aab2be", "#fbfbf9", "#f0f0ec", "#dce9f3", "rgba(130,190,230,0.75)", "#e1e1dc", "#d0d0cb", "#9aa2ae"];
      cols.forEach((c, i) => b.vline(4 + i, -16, 15, c));
      for (let y = -16; y < 16; y += 7) b.set(8, y, "rgba(255,255,255,0.8)");
      underRect(b, 12, -16, 2, 32, "rgba(30,34,52,0.12)");
      return { base: s };
    }
    if (v === "end") {
      topFace(b, 4, 3, 8, 4, wall);
      frontFace(b, 4, 7, 8, 9, wall);
      b.hline(4, 11, 13, mix(wall.dk, "#9aa2ae", 0.5));
      b.rect(6, -18, 4, 22, metal.base);
      b.vline(6, -18, 3, metal.hi);
      b.vline(9, -18, 3, metal.dk);
      b.hline(6, 9, -18, metal.hi);
      b.outline();
      contact(b, 3, 13, 10, 4, 0.2);
      return { base: s };
    }
    b.rect(0, -14, 16, 20, "#000000");
    b.rect(0, -17, 16, 3, metal.lt);
    b.hline(0, 15, -17, metal.hi);
    b.hline(0, 15, -15, metal.dk);
    topFace(b, 0, 6, 16, 3, wall);
    frontFace(b, 0, 9, 16, 7, wall);
    b.hline(0, 15, 14, mix(wall.dk, "#9aa2ae", 0.5));
    b.outline();
    b.clearRect(0, -14, 16, 20);
    b.rect(0, -14, 16, 20, "rgba(172,214,238,0.34)");
    b.rect(0, -14, 16, 3, "rgba(255,255,255,0.22)");
    for (let i = 0; i < 20; i++) {
      const x = 13 - Math.floor(i * 0.6);
      b.set(x, -14 + i, "rgba(255,255,255,0.3)");
      b.set(x - 2, -14 + i, "rgba(255,255,255,0.14)");
    }
    b.vline(0, -14, 5, "rgba(195,202,212,0.85)");
    b.hline(0, 15, 5, "rgba(120,150,175,0.35)");
    for (let y = 0; y < b.h; y++) {
      b.clear(-1, y - b.oy);
      b.clear(16, y - b.oy);
    }
    contact(b, 0, 14, 16, 3, 0.16);
    return { base: s };
  }
  function meetingTable(seed) {
    const s = floorSheet(3, 2, 10);
    const b = s.buf;
    const m = M.white;
    const r = rngOf(seed, 31);
    for (const x of [2, 43]) {
      b.rect(x, 21, 3, 11, M.steel.base);
      b.vline(x, 21, 31, M.steel.lt);
      b.vline(x + 2, 21, 31, M.steel.dk);
    }
    topFace(b, 0, -4, 48, 24, m);
    b.hline(0, 47, 20, m.base);
    b.hline(0, 47, 21, m.dk);
    b.rect(4, 2, 40, 10, M.oak.lt);
    b.hline(4, 43, 2, M.oak.base);
    b.hline(4, 43, 11, M.oak.hi);
    woodGrain(b, 4, 3, 40, 8, M.oak, seed);
    b.rect(21, 5, 6, 3, "#3a404d");
    b.rect(22, 5, 4, 1, "#5a6070");
    b.set(24, 6, "#5fd07a");
    const laptop = (x, y, facing2) => {
      if (facing2 === "down") {
        b.rect(x, y, 9, 5, "#3a404d");
        b.hline(x, x + 8, y, "#4d5464");
        staticScreen(b, { x: x + 1, y: y + 1, w: 7, h: 3 }, x < 20 ? "ide" : "sheet", seed + x);
        b.rect(x - 1, y + 5, 11, 2, "#c9ced6");
        b.hline(x - 1, x + 9, y + 6, "#9aa1ad");
      } else {
        b.rect(x - 1, y, 11, 2, "#c9ced6");
        b.rect(x, y + 2, 9, 4, "#aeb5c0");
        b.hline(x, x + 8, y + 2, "#d6dbe2");
        b.set(x + 4, y + 4, "#eef1f5");
      }
    };
    laptop(6, -3, "down");
    laptop(32, 13, "up");
    if (seed % 2 === 0) laptop(34, -3, "down");
    else papers(b, 34, -1, 7, 5);
    papers(b, 8, 14, 6, 4);
    mug(b, 18, 14, pick(r, MUG_COLORS));
    b.rect(29, -1, 2, 3, "rgba(190,225,245,0.9)");
    b.set(29, -1, "#ffffff");
    b.rect(16, -2, 2, 3, "rgba(190,225,245,0.9)");
    b.set(16, -2, "#ffffff");
    b.outline();
    contact(b, -1, 28, 50, 5, 0.22);
    underRect(b, 4, 22, 40, 8, "rgba(30,34,52,0.16)");
    return { base: s };
  }
  function stool() {
    const s = floorSheet(1, 1, 2);
    const b = s.buf;
    b.ellipse(8, 14.5, 4, 1.4, "#5b6272");
    b.rect(7, 8, 2, 6, "#9aa1ad");
    b.vline(8, 8, 13, "#737b89");
    b.hline(5, 10, 11, "#9aa1ad");
    const seat = ramp("#3f7fd8", 0.07);
    b.ellipse(8, 6, 5.5, 3, seat.dk);
    b.ellipse(8, 5.4, 5.5, 2.6, seat.lt);
    b.set(5, 4, seat.hi);
    b.set(6, 4, seat.hi);
    b.outline();
    contact(b, 3, 13, 10, 3, 0.22);
    return { base: s };
  }
  function floorLamp() {
    const s = floorSheet(1, 1, 26);
    const b = s.buf;
    b.ellipse(8, 14, 4, 1.5, "#3a3f4b");
    b.hline(6, 9, 13, "#5a6070");
    b.vline(8, -17, 13, "#4a505c");
    b.vline(7, -17, 13, "#6b7282");
    const sh = ramp("#f3e6c8", 0.05);
    for (let i = 0; i < 7; i++) {
      const half = 3 + Math.floor(i / 2);
      b.hline(8 - half, 7 + half, -24 + i, i === 0 ? sh.hi : sh.lt);
      b.set(8 - half, -24 + i, sh.hi);
      b.set(7 + half, -24 + i, sh.dk);
    }
    b.hline(3, 12, -17, sh.dk);
    b.hline(5, 10, -16, "#fff6d8");
    b.outline();
    contact(b, 3, 13, 10, 3, 0.22);
    s.rects = { glow: rectAt(s, 4, -20, 8, 6) };
    return { base: s };
  }
  function waterCooler() {
    const s = floorSheet(1, 1, 20);
    const b = s.buf;
    const body = ramp("#eceef1", 0.05);
    topFace(b, 3, -5, 10, 3, body);
    frontFace(b, 3, -2, 10, 18, body);
    b.vline(3, -2, 15, body.hi);
    b.rect(5, 1, 2, 2, "#4a86d8");
    b.rect(9, 1, 2, 2, "#e05a5a");
    b.set(5, 1, "#8ab8f0");
    b.set(9, 1, "#f08a8a");
    b.rect(4, 5, 8, 2, "#c3c9d2");
    b.hline(5, 10, 5, "#9aa2ae");
    b.rect(4, 8, 8, 7, body.base);
    b.hline(4, 11, 8, body.dk);
    b.rect(10, 11, 1, 2, "#9aa2ae");
    const g = "rgba(92,170,240,0.78)";
    b.rect(5, -6, 6, 1, "#5b8fd0");
    for (let y = -17; y <= -7; y++) {
      const narrow = y < -15 ? 1 : 0;
      b.hline(4 + narrow, 11 - narrow, y, g);
    }
    b.rect(6, -19, 4, 2, "#3f74c0");
    b.vline(5, -15, -8, "rgba(255,255,255,0.65)");
    b.vline(6, -14, -9, "rgba(255,255,255,0.3)");
    b.hline(5, 10, -12, "rgba(60,120,200,0.6)");
    b.vline(10, -15, -8, "rgba(40,90,170,0.55)");
    b.rect(13, -1, 2, 6, "#f4f6f8");
    b.set(14, -1, "#c9ced6");
    b.outline();
    contact(b, 1, 13, 14, 4, 0.22);
    return { base: s };
  }

  // vendor/habblaud/upstream/client/src/art/furniture/wall.ts
  function wallShadow(b, x, y, w, h) {
    for (let yy = y + 1; yy <= y + h; yy++) b.under(x + w, yy, "rgba(30,34,52,0.16)");
    for (let xx = x + 1; xx <= x + w; xx++) b.under(xx, y + h, "rgba(30,34,52,0.16)");
  }
  function whiteboard() {
    const s = wallSheet(3);
    const b = s.buf;
    const frame = ramp("#c3cad4", 0.06);
    const x = 2;
    const y = -27;
    const w = 44;
    const h = 19;
    b.rect(x, y, w, h, frame.base);
    b.hline(x, x + w - 1, y, frame.hi);
    b.vline(x, y, y + h - 1, frame.lt);
    b.vline(x + w - 1, y, y + h - 1, frame.dk);
    b.hline(x, x + w - 1, y + h - 1, frame.dk);
    b.rect(x + 1, y + 1, w - 2, h - 2, "#fbfcfd");
    b.line(x + 30, y + 1, x + 24, y + h - 2, "rgba(210,225,240,0.5)");
    b.line(x + 33, y + 1, x + 27, y + h - 2, "rgba(210,225,240,0.35)");
    b.rect(x + 3, y + h, w - 6, 2, frame.base);
    b.hline(x + 3, x + w - 4, y + h, frame.lt);
    for (const [i, c] of [[0, "#e05a5a"], [3, "#3f7fd8"], [6, "#2b2f3b"], [9, "#4cae6a"]]) {
      b.rect(x + 8 + i, y + h - 1, 2, 1, c);
    }
    b.rect(x + w - 14, y + h - 2, 5, 2, "#3a3f4b");
    b.hline(x + w - 14, x + w - 10, y + h - 2, "#f2efe6");
    b.outline();
    wallShadow(b, x - 1, y - 1, w + 2, h + 3);
    s.rects = { board: rectAt(s, x + 2, y + 2, w - 4, h - 4) };
    return { base: s };
  }
  function windowItem() {
    const s = wallSheet(2);
    const b = s.buf;
    const fr = ramp("#f4f4f1", 0.05);
    const x = 2;
    const y = -27;
    const w = 28;
    const h = 19;
    b.rect(x, y, w, 2, fr.lt);
    b.rect(x, y + h - 2, w, 2, fr.base);
    b.rect(x, y, 2, h, fr.lt);
    b.rect(x + w - 2, y, 2, h, fr.base);
    b.hline(x, x + w - 1, y, fr.hi);
    b.vline(x + w - 1, y, y + h - 1, fr.dk);
    b.rect(x + 13, y + 2, 2, h - 4, fr.base);
    b.vline(x + 14, y + 2, y + h - 3, fr.dk);
    b.hline(x + 2, x + w - 3, y + 2, "rgba(40,50,70,0.25)");
    const gx = x + 2;
    const gy = y + 2;
    const gw = w - 4;
    const gh = h - 4;
    for (const off of [3, 16]) {
      b.line(gx + off + 6, gy, gx + off, gy + gh - 1, "rgba(255,255,255,0.28)");
      b.line(gx + off + 7, gy, gx + off + 1, gy + gh - 1, "rgba(255,255,255,0.16)");
    }
    b.rect(x - 1, y + h, w + 2, 2, fr.lt);
    b.hline(x - 1, x + w, y + h, fr.hi);
    b.hline(x - 1, x + w, y + h + 1, fr.dk);
    b.outline();
    wallShadow(b, x - 1, y, w + 2, h + 3);
    s.rects = { glass: rectAt(s, gx, gy, gw, gh) };
    return { base: s };
  }
  function clock() {
    const s = wallSheet(1);
    const b = s.buf;
    const cx = 8;
    const cy = -21.5;
    b.ellipse(cx, cy, 6.5, 6.5, "#3a3f4b");
    b.ellipse(cx, cy, 5.5, 5.5, "#fbfbf8");
    b.ellipse(cx - 1, cy - 1, 3, 3, "#ffffff");
    for (const [dx, dy] of [[0, -5], [5, 0], [0, 4], [-5, 0]]) b.set(Math.floor(cx + dx), Math.floor(cy + dy), "#5a6070");
    b.outline();
    wallShadow(b, 1, -29, 14, 14);
    s.rects = { face: rectAt(s, 3, -27, 10, 10) };
    return { base: s };
  }
  function poster(variant) {
    const s = wallSheet(1);
    const b = s.buf;
    const x = 2;
    const y = -28;
    const w = 12;
    const h = 16;
    b.rect(x, y, w, h, "#2f3440");
    const ix = x + 1;
    const iy = y + 1;
    const iw = w - 2;
    const ih = h - 2;
    switch (variant ?? "code") {
      case "coffee": {
        b.rect(ix, iy, iw, ih, "#f2d7b0");
        b.rect(ix, iy + ih - 4, iw, 4, "#c98a52");
        mug(b, ix + 3, iy + 5, "#e2604f");
        b.set(ix + 4, iy + 3, "#ffffff");
        b.set(ix + 5, iy + 2, "#ffffff");
        b.set(ix + 4, iy + 1, "#ffffff");
        b.hline(ix + 2, ix + 7, iy + ih - 2, "#f4efe2");
        break;
      }
      case "rocket": {
        b.rect(ix, iy, iw, ih, "#24325a");
        for (const [px, py] of [[1, 2], [8, 1], [6, 5], [2, 9], [9, 8]]) b.set(ix + px, iy + py, "#f7e7a1");
        b.rect(ix + 4, iy + 3, 2, 6, "#f4f2ee");
        b.set(ix + 4, iy + 2, "#e05a5a");
        b.set(ix + 5, iy + 2, "#e05a5a");
        b.set(ix + 4, iy + 5, "#5bc0de");
        b.set(ix + 3, iy + 8, "#e05a5a");
        b.set(ix + 6, iy + 8, "#e05a5a");
        b.rect(ix + 4, iy + 9, 2, 2, "#f2a03d");
        b.set(ix + 4, iy + 11, "#f7d154");
        b.hline(ix, ix + iw - 1, iy + ih - 1, "#3b4a7a");
        break;
      }
      case "cat": {
        b.rect(ix, iy, iw, ih, "#f7c9d4");
        const c = "#3a3f4b";
        b.set(ix + 2, iy + 4, c);
        b.set(ix + 7, iy + 4, c);
        b.rect(ix + 2, iy + 5, 6, 5, c);
        b.set(ix + 3, iy + 7, "#f7d154");
        b.set(ix + 6, iy + 7, "#f7d154");
        b.set(ix + 4, iy + 8, "#e47aa8");
        b.set(ix + 5, iy + 8, "#e47aa8");
        b.hline(ix + 1, ix + 8, iy + ih - 2, "#e47aa8");
        break;
      }
      case "bug": {
        b.rect(ix, iy, iw, ih, "#f7d154");
        const c = "#3a3f4b";
        b.rect(ix + 3, iy + 5, 4, 5, "#4cae6a");
        b.vline(ix + 5, iy + 5, iy + 9, c);
        b.rect(ix + 4, iy + 3, 2, 2, c);
        for (const dy of [5, 7, 9]) {
          b.set(ix + 2, iy + dy, c);
          b.set(ix + 7, iy + dy, c);
        }
        b.line(ix + 1, iy + 1, ix + 8, iy + 12, "#e05a5a");
        break;
      }
      case "ship_it": {
        b.rect(ix, iy, iw, ih, "#bfe3f2");
        b.rect(ix, iy + 9, iw, 5, "#3f7fd8");
        b.hline(ix, ix + iw - 1, iy + 9, "#8fc8f0");
        b.rect(ix + 2, iy + 7, 6, 2, "#e05a5a");
        b.hline(ix + 3, ix + 6, iy + 9, "#a83232");
        b.vline(ix + 5, iy + 1, iy + 6, "#6b4a32");
        b.rect(ix + 6, iy + 2, 3, 2, "#f4f2ee");
        b.set(ix + 1, iy + 2, "#f7d154");
        break;
      }
      default: {
        b.rect(ix, iy, iw, ih, "#1f2433");
        const cols = ["#ff79c6", "#8be9fd", "#f1fa8c", "#50fa7b", "#bd93f9"];
        for (let i = 0; i < 6; i++) b.hline(ix + 1 + i % 3, ix + 2 + i * 3 % 5 + 2, iy + 1 + i * 2, cols[i % cols.length]);
        break;
      }
    }
    b.outline();
    wallShadow(b, x - 1, y - 1, w + 2, h + 2);
    return { base: s };
  }
  function painting(seed) {
    const s = wallSheet(2);
    const b = s.buf;
    const fr = ramp("#c89b5c", 0.07);
    const x = 3;
    const y = -27;
    const w = 26;
    const h = 17;
    b.rect(x, y, w, h, fr.base);
    b.hline(x, x + w - 1, y, fr.hi);
    b.vline(x, y, y + h - 1, fr.lt);
    b.vline(x + w - 1, y, y + h - 1, fr.dk);
    b.hline(x, x + w - 1, y + h - 1, fr.dk);
    const ax = x + 2;
    const ay = y + 2;
    const aw = w - 4;
    const ah = h - 4;
    const r = rngOf(seed, 41);
    const warm = r() < 0.5;
    for (let i = 0; i < ah; i++) b.hline(ax, ax + aw - 1, ay + i, shade(warm ? "#f6c48a" : "#9fd3f0", -i * 0.012));
    b.ellipse(ax + 15, ay + 3, 2, 2, warm ? "#fff2c2" : "#fffbe6");
    const mt = warm ? "#7a5a8a" : "#5a7fa8";
    for (let i = 0; i < aw; i++) {
      const hh = Math.round(3 + 2.5 * Math.sin(i * 0.55 + seed) + 1.5 * Math.sin(i * 1.3));
      b.vline(ax + i, ay + ah - 4 - hh, ay + ah - 4, mt);
      b.set(ax + i, ay + ah - 4 - hh, shade(mt, 0.15));
    }
    b.rect(ax, ay + ah - 4, aw, 4, warm ? "#4f8a6a" : "#3f7fb0");
    b.hline(ax + 3, ax + 9, ay + ah - 3, "rgba(255,255,255,0.5)");
    b.outline();
    wallShadow(b, x - 1, y - 1, w + 2, h + 2);
    s.rects = { art: rectAt(s, ax, ay, aw, ah) };
    return { base: s };
  }
  function tv() {
    const s = wallSheet(2);
    const b = s.buf;
    const x = 1;
    const y = -27;
    const w = 30;
    const h = 18;
    b.rect(x, y, w, h, "#23262f");
    b.hline(x, x + w - 1, y, "#3a3f4b");
    b.hline(x, x + w - 1, y + h - 1, "#15171d");
    b.rect(x + 1, y + 1, w - 2, h - 3, "#151b26");
    b.line(x + 20, y + 1, x + 12, y + h - 3, "rgba(255,255,255,0.08)");
    b.line(x + 22, y + 1, x + 14, y + h - 3, "rgba(255,255,255,0.05)");
    b.set(x + w - 3, y + h - 2, "#e05a5a");
    b.outline();
    wallShadow(b, x - 1, y - 1, w + 2, h + 2);
    s.rects = { tv: rectAt(s, x + 1, y + 1, w - 2, h - 3) };
    return { base: s };
  }
  function lightSwitch(variant) {
    const s = wallSheet(1);
    const b = s.buf;
    const on = (variant ?? "on") === "on";
    b.rect(6, -19, 5, 7, "#f6f6f3");
    b.hline(6, 10, -19, "#ffffff");
    b.vline(10, -19, -13, "#d3d6dc");
    b.hline(6, 10, -13, "#c9cdd4");
    b.rect(7, -17, 3, 3, on ? "#e9ebee" : "#d5d8de");
    b.hline(7, 9, on ? -17 : -15, on ? "#ffffff" : "#b9bec7");
    b.hline(7, 9, on ? -15 : -17, on ? "#c3c8d0" : "#f4f5f7");
    b.set(8, -18, on ? "#7be08a" : "#9aa1ad");
    b.outline();
    return { base: s };
  }
  function elevator(state) {
    const s = wallSheet(2, 2);
    const b = s.buf;
    const st = Math.max(0, Math.min(4, Math.round(state)));
    const frame = ramp("#aeb6c2", 0.06);
    const door = ramp("#c9d0d9", 0.05);
    b.rect(0, -28, 32, 28, frame.base);
    b.hline(0, 31, -28, frame.hi);
    b.vline(0, -28, -1, frame.lt);
    b.vline(31, -28, -1, frame.dk);
    b.rect(10, -27, 12, 3, "#22262f");
    const lit = st > 0;
    b.set(13, -26, lit ? "#5fd07a" : "#3b4a3f");
    b.set(12, -25, lit ? "#5fd07a" : "#3b4a3f");
    b.set(14, -25, lit ? "#5fd07a" : "#3b4a3f");
    b.rect(16, -26, 4, 1, lit ? "#f2c14e" : "#4a4535");
    const ix = 3;
    const iy = -23;
    const iw = 26;
    const ih = 23;
    b.rect(ix, iy, iw, ih, "#f3e2bf");
    b.rect(ix, iy, iw, 3, "#fff3d6");
    b.rect(ix + 2, iy + 3, iw - 4, ih - 7, "#e4caa0");
    b.hline(ix + 2, ix + iw - 3, iy + 12, "#b9c0ca");
    b.rect(ix, iy + ih - 4, iw, 4, "#b89a72");
    b.hline(ix, ix + iw - 1, iy + ih - 4, "#a5865f");
    const leaf = 13;
    const open = st * 3;
    const drawLeaf = (x0, w) => {
      if (w <= 0) return;
      b.rect(x0, iy, w, ih, door.base);
      b.hline(x0, x0 + w - 1, iy, door.hi);
      b.vline(x0, iy, iy + ih - 1, door.lt);
      b.vline(x0 + w - 1, iy, iy + ih - 1, door.dk);
      for (let k = 2; k < w - 1; k += 4) b.vline(x0 + k, iy + 2, iy + ih - 3, "rgba(255,255,255,0.18)");
    };
    drawLeaf(ix, leaf - open);
    drawLeaf(ix + leaf + open, leaf - open);
    if (st === 0) b.vline(ix + leaf, iy, iy + ih - 1, door.dd);
    b.rect(29, -15, 2, 4, "#22262f");
    b.set(29, -14, lit ? "#f2c14e" : "#6b7282");
    b.set(29, -12, "#6b7282");
    b.outline();
    return { base: s };
  }
  function doorFrame() {
    const s = wallSheet(2, 3);
    const b = s.buf;
    const tr2 = ramp("#f2f1ed", 0.05);
    b.rect(-2, -27, 3, 27, tr2.base);
    b.vline(-2, -27, -1, tr2.hi);
    b.vline(0, -26, -1, tr2.dk);
    b.rect(31, -27, 3, 27, tr2.base);
    b.vline(31, -26, -1, tr2.dk);
    b.vline(33, -27, -1, tr2.dd);
    b.rect(-2, -30, 36, 3, tr2.lt);
    b.hline(-2, 33, -30, tr2.hi);
    b.hline(1, 30, -27, "rgba(30,34,52,0.35)");
    b.outline();
    return { base: s };
  }
  function sign() {
    const s = wallSheet(3);
    const b = s.buf;
    const x = 3;
    const y = -28;
    const w = 42;
    const h = 11;
    const fr = ramp("#3a4256", 0.07);
    b.rect(x, y, w, h, fr.base);
    b.hline(x, x + w - 1, y, fr.lt);
    b.hline(x, x + w - 1, y + h - 1, fr.dd);
    b.rect(x + 1, y + 1, w - 2, h - 2, "#f7f3e8");
    b.hline(x + 1, x + w - 2, y + 1, "#ffffff");
    b.hline(x + 1, x + w - 2, y + h - 2, "#e6e0cf");
    b.set(x + 2, y + 2, "#b9c0ca");
    b.set(x + w - 3, y + 2, "#b9c0ca");
    b.set(x + 2, y + h - 3, "#b9c0ca");
    b.set(x + w - 3, y + h - 3, "#b9c0ca");
    b.outline();
    wallShadow(b, x - 1, y - 1, w + 2, h + 2);
    s.rects = { sign: rectAt(s, x + 4, y + 2, w - 8, h - 4) };
    return { base: s };
  }
  function mirror() {
    const s = wallSheet(1);
    const b = s.buf;
    const x = 2;
    const y = -28;
    const w = 12;
    const h = 14;
    const fr = ramp("#c3cad4", 0.06);
    b.rect(x, y, w, h, fr.base);
    b.hline(x, x + w - 1, y, fr.hi);
    b.vline(x + w - 1, y, y + h - 1, fr.dk);
    b.rect(x + 1, y + 1, w - 2, h - 2, "#cfe6f2");
    glass(b, x + 1, y + 1, w - 2, h - 2, { alpha: 0.5 });
    b.line(x + 8, y + 1, x + 3, y + h - 2, "rgba(255,255,255,0.75)");
    b.outline();
    wallShadow(b, x - 1, y - 1, w + 2, h + 2);
    s.rects = { glass: rectAt(s, x + 1, y + 1, w - 2, h - 2) };
    return { base: s };
  }
  function shelfWall(seed) {
    const s = wallSheet(2);
    const b = s.buf;
    const r = rngOf(seed, 51);
    const w = M.oak;
    const plank = (y) => {
      b.rect(1, y, 30, 2, w.lt);
      b.hline(1, 30, y, w.hi);
      b.hline(1, 30, y + 1, w.dk);
      for (const x2 of [4, 26]) b.rect(x2, y + 2, 2, 2, "#5a6070");
    };
    plank(-19);
    plank(-9);
    let x = 3;
    const n = 3 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const bw = 1 + Math.floor(r() * 2);
      const bh = 5 + Math.floor(r() * 3);
      book(b, x, -19 - bh, bw, bh, pick(r, ACCENTS2));
      x += bw;
    }
    b.line(x, -20, x + 3, -25, pick(r, ACCENTS2));
    b.line(x + 1, -20, x + 4, -25, pick(r, ACCENTS2));
    pot(b, 21, -23, 5, 4, M.ceramic);
    foliage(b, 23.5, -25, 3, 2.2, M.leaf, seed + 2);
    b.line(22, -23, 20, -20, M.leaf.dk);
    b.line(25, -23, 27, -19, M.leaf.base);
    const v = seed % 3;
    if (v === 0) {
      b.rect(3, -14, 6, 5, "#e9e4d6");
      b.hline(3, 8, -14, "#f7f3e8");
      b.rect(4, -12, 4, 1, "#c9bfa6");
      b.rect(11, -13, 3, 2, "#f2c14e");
      b.set(10, -13, "#d9a42e");
      b.set(14, -13, "#d9a42e");
      b.set(12, -11, "#d9a42e");
      b.rect(11, -10, 3, 1, "#6b4a32");
      mug(b, 18, -13, "#3f7fd8");
      smallSucculent(b, 24, -12);
    } else if (v === 1) {
      for (let i = 0; i < 4; i++) book(b, 4 + i * 2, -16, 2, 7, pick(r, ACCENTS2));
      b.rect(14, -13, 7, 4, "#c99a5e");
      b.hline(14, 20, -13, "#dcb27a");
      b.rect(23, -15, 4, 6, "#3a3f4b");
      b.rect(24, -14, 2, 2, "#8fc8f0");
    } else {
      smallSucculent(b, 4, -12);
      b.rect(10, -15, 5, 6, "#f4f2ee");
      b.rect(11, -14, 3, 3, "#e47aa8");
      for (let i = 0; i < 3; i++) book(b, 18 + i * 2, -15 + i % 2, 2, 6 - i % 2, pick(r, ACCENTS2));
    }
    b.outline();
    return { base: s };
  }

  // vendor/habblaud/upstream/client/src/art/furniture/index.ts
  var SEED_VARIATIONS = {
    desk: 6,
    desk_back: 4,
    bookshelf: 4,
    binder_shelf: 4,
    meeting_table: 2,
    shelf_wall: 3,
    painting: 2,
    coffee_table: 2,
    plant_small: 3,
    plant_tall: 3
  };
  function normalizeFurniture(kind, variant, state, seed) {
    const def = FURNITURE[kind];
    const v = def.variants ? variant && def.variants.includes(variant) ? variant : def.variants[0] : void 0;
    const states = def.states ?? 1;
    const st = Math.max(0, Math.min(states - 1, Math.floor(state ?? 0)));
    const n = SEED_VARIATIONS[kind] ?? 1;
    const vseed = n > 1 ? (Math.floor(seed ?? 0) % n + n) % n : 0;
    return { variant: v, state: st, vseed };
  }
  function build(kind, variant, state, seed) {
    switch (kind) {
      case "desk":
        return desk(variant, seed);
      case "desk_back":
        return deskBack(variant, seed);
      case "office_chair":
        return officeChair(variant);
      case "office_chair_front":
        return officeChairFront(variant);
      case "bookshelf":
        return bookshelf(seed);
      case "filing_cabinet":
        return filingCabinet();
      case "printer":
        return printer();
      case "trash_bin":
        return trashBin();
      case "plant_small":
        return plantSmall(variant, seed);
      case "plant_tall":
        return plantTall(variant, seed);
      case "glass_partition":
        return glassPartition(variant);
      case "binder_shelf":
        return binderShelf(seed);
      case "meeting_table":
        return meetingTable(seed);
      case "stool":
        return stool();
      case "floor_lamp":
        return floorLamp();
      case "water_cooler":
        return waterCooler();
      case "whiteboard":
        return whiteboard();
      case "window":
        return windowItem();
      case "clock":
        return clock();
      case "poster":
        return poster(variant);
      case "painting":
        return painting(seed);
      case "tv":
        return tv();
      case "light_switch":
        return lightSwitch(variant);
      case "elevator":
        return elevator(state);
      case "door_frame":
        return doorFrame();
      case "sign":
        return sign();
      case "mirror":
        return mirror();
      case "shelf_wall":
        return shelfWall(seed);
      case "counter":
        return counter(variant);
      case "counter_sink":
        return counterSink();
      case "coffee_machine":
        return coffeeMachine(state);
      case "microwave":
        return microwave();
      case "fridge":
        return fridge();
      case "vending_machine":
        return vendingMachine();
      case "cafe_table":
        return cafeTable();
      case "cafe_chair":
        return cafeChair(variant);
      case "sofa":
        return sofa(variant);
      case "armchair":
        return armchair(variant);
      case "coffee_table":
        return coffeeTable(seed);
      case "pingpong_table":
        return pingpongTable();
      case "beanbag":
        return beanbag(variant);
      case "arcade":
        return arcade();
      case "toilet_stall":
        return toiletStall(state);
      case "sink":
        return sink();
      case "reception_desk":
        return receptionDesk(seed);
      case "bench":
        return bench();
    }
  }
  function renderFurniture(kind, variant, state, seed) {
    const n = normalizeFurniture(kind, variant, state, seed);
    const f = build(kind, n.variant, n.state, n.vseed);
    return { base: trim(f.base), front: f.front ? trim(f.front) : void 0 };
  }

  // vendor/habblaud/upstream/client/src/art/icons.ts
  var HOURGLASS_PAL = {
    t: "#e6b37a",
    // madeira (brilho)
    c: "#c48a52",
    // madeira
    C: "#8f5d36",
    // madeira (sombra)
    g: "#e4f3fc",
    // vidro
    w: "#ffffff",
    // reflexo
    G: "#a6c9e3",
    // vidro na sombra (direita)
    s: "#f5c451",
    // areia
    S: "#d6952a"
    // areia na sombra
  };
  var ICONS = {
    alert: {
      rows: [
        "....o....",
        "...oyo...",
        "...yky...",
        "..yykyy..",
        "..yykyy..",
        ".yyykyyy.",
        ".yyyyyyy.",
        "yyyykyyyy",
        "ddddddddd"
      ],
      pal: { o: "#fff2a8", y: "#f7c843", k: "#4a3510", d: "#d9a12a" }
    },
    question: {
      rows: [
        "..bbbbb..",
        ".bbwwwbb.",
        "bbwbbbwbb",
        "bbbbbbwbb",
        "bbbbbwbbb",
        "bbbbwbbbb",
        "bbbbbbbbb",
        ".bbbwbbb.",
        "..ddddd.."
      ],
      pal: { b: "#4f8fe6", w: "#ffffff", d: "#3466b8" }
    },
    zzz: {
      rows: [
        ".....zzzz",
        ".......z.",
        "......z..",
        "zzz..zzzz",
        "..z......",
        ".z.......",
        "zzz......"
      ],
      pal: { z: "#cfe3ff" }
    },
    check: {
      rows: [
        "..ggggg..",
        ".ggggggg.",
        "gggggggwg",
        "ggggggwwg",
        "gwggggwgg",
        "gwwggwwgg",
        "ggwwwwggg",
        ".ggwwggg.",
        "..ddddd.."
      ],
      pal: { g: "#45b866", w: "#ffffff", d: "#2f8a4a" }
    },
    heart: {
      rows: [
        ".rr...rr.",
        "rhrr.rrrr",
        "rhrrrrrrr",
        "rrrrrrrrr",
        ".rrrrrrd.",
        "..rrrrd..",
        "...rrd...",
        "....d...."
      ],
      pal: { r: "#ef5a6f", h: "#ffb3bf", d: "#c23a50" }
    },
    coffee: {
      rows: [
        "..s..s...",
        ".s..s....",
        "..s..s...",
        "wwwwwww..",
        "wccccchhh",
        "wrrrrrw.h",
        "wrrrrrwhh",
        "wwwwwww..",
        ".ddddd..."
      ],
      pal: { s: "#e6ecf5", w: "#f4f2ee", c: "#6b4226", r: "#e2604f", h: "#d6d2c8", d: "#b9b3a6" }
    },
    music: {
      rows: [
        "...nnnnnn",
        "...nhhhhn",
        "...n....n",
        "...n....n",
        "...n....n",
        ".nnn..nnn",
        "nnnn.nnnn",
        ".nn...nn."
      ],
      pal: { n: "#8d66cf", h: "#b89aea" }
    },
    idea: {
      rows: [
        "..yyyyy..",
        ".yhhyyyy.",
        "yhhyyyyyy",
        "yhyyyyyyy",
        "yyyyyyyyd",
        ".yyyyyyd.",
        "..yyyyd..",
        "..ggggg..",
        "...ggg..."
      ],
      pal: { y: "#ffd84d", h: "#fff4b8", d: "#e0b12e", g: "#9aa2ae" }
    },
    sweat: {
      rows: [
        "...b...",
        "...b...",
        "..bbb..",
        ".bwbbb.",
        ".bwbbb.",
        "bbbbbbb",
        ".bbbbd.",
        "..ddd.."
      ],
      pal: { b: "#6fc3f2", w: "#e6f6ff", d: "#3f9ad6" }
    },
    star: {
      rows: [
        "....y....",
        "...yhy...",
        "...yhy...",
        "yyyyhyyyy",
        ".yyyyyyy.",
        "..yyyyy..",
        "..yyyyy..",
        ".yyd.dyy.",
        ".yd...dy."
      ],
      pal: { y: "#ffcf3f", h: "#fff2a8", d: "#d99e1f" }
    },
    lightning: {
      rows: [
        "....yyy",
        "...yyy.",
        "..yyy..",
        ".yyyyyy",
        "...yyy.",
        "..yyy..",
        ".yyd...",
        ".yd....",
        "yd....."
      ],
      pal: { y: "#ffd84d", d: "#e0a62e" }
    },
    chat: {
      rows: [
        ".wwwwwwww.",
        "wwwwwwwwww",
        "wwkwwkwwkw",
        "wwwwwwwwww",
        ".wwwwwwww.",
        "..ww......",
        ".w........"
      ],
      pal: { w: "#ffffff", k: "#5b6b85" }
    },
    box: {
      rows: [
        ".hhhtthhh.",
        "hhhhtthhhh",
        "ccccttcccc",
        "cccctttccd",
        "ccccccccdd",
        "cccllllccd",
        "ccccccccdd",
        ".ddddddddd"
      ],
      pal: { h: "#e2b47a", c: "#c99a5e", t: "#f1dfb6", l: "#8b6a43", d: "#a87b45" }
    },
    hourglass: {
      // Em pé: quase toda a areia em cima, um fio caindo e um montinho embaixo.
      rows: [
        "tcccccccC",
        "CCCCCCCCC",
        ".wgggggG.",
        ".wsssssG.",
        "..wsssG..",
        "...gSG...",
        "..wgsgG..",
        ".wggsggG.",
        ".wgsssSG.",
        "tcccccccC",
        "CCCCCCCCC"
      ],
      pal: HOURGLASS_PAL
    },
    hourglass_flip: {
      // A mesma ampulheta deitada (meio giro): a areia escorre para o lado de baixo dos dois bulbos.
      // Alternada com 'hourglass' (mesma âncora no centro inferior) parece girar sobre a cabeça.
      rows: [
        "tc.......tc",
        "tcw.....Gtc",
        "tcwg...gGtc",
        "tcggg.ggGtc",
        "tcsssSggGtc",
        "tcsss.ggGtc",
        "tcSs...sStc",
        "tcS.....Stc",
        "tc.......tc"
      ],
      pal: { ...HOURGLASS_PAL, t: "#d9a46c", c: "#a8723f" }
    },
    cobweb: {
      // Teia de canto, triangular (o canto fica em cima à esquerda; espelhe para outros cantos):
      // fios das bordas, o raio diagonal e dois arcos de quarto de círculo; uma aranhinha de olhos
      // claros na borda de fora. Fios brancos com contorno translúcido só na silhueta (as células
      // ficam quase limpas), legível tanto no piso claro quanto no estofado escuro.
      rows: [
        "wwwwwwwwwwww",
        "wf...w....w.",
        "w.f..w....w.",
        "w..fw.....w.",
        "w..wf....w..",
        "www..f...w..",
        "w.....f.w...",
        "w......w....",
        "w.....w.l.l.",
        "w...ww.lkKkl",
        "wwww....eke.",
        "w......l...l"
      ],
      pal: { w: "#ffffff", f: "#d3dbe5", k: "#3a3346", K: "#6f6287", e: "#fff7d6", l: "#55496a" },
      outlineAlpha: 0.6,
      holeOutlineAlpha: 0.14
    },
    storm: {
      // Nuvem carregada com chuva e um raio amarelo (algo falhou).
      rows: [
        "...hHHh....",
        ".hhHHHHhhh.",
        "hhHhhhhhhcc",
        "cccccccccdd",
        ".dddddddddd",
        "......yo..b",
        ".b...yo...B",
        ".B..yyyyo..",
        "......yo...",
        ".b...yo....",
        ".B...o....."
      ],
      pal: { h: "#8d97ab", H: "#b3bccc", c: "#6b7489", d: "#4f566a", y: "#ffd84d", o: "#e3a530", b: "#9fd2f6", B: "#5a9fd8" }
    },
    wave: {
      rows: [
        "..s.s.s..",
        "..s.s.s.s",
        "..s.s.s.s",
        "s.sssssss",
        "sssssssss",
        ".sssssssd",
        "..ssssssd",
        "...ssssd."
      ],
      pal: { s: "#ffd2a8", d: "#e0a87a" }
    },
    coin: {
      // Moeda dourada de frente: aro claro em cima à esquerda, sombra embaixo à direita, um "C"
      // gravado no meio e um brilho.
      rows: [
        "..yyyy..",
        ".yhwyyy.",
        "yhyKKyyd",
        "yhKyyyyd",
        "yhKyyyyd",
        "yyyKKyyd",
        ".yyyyydd",
        "..dddd.."
      ],
      pal: { y: "#ffcf3f", h: "#fff2a8", w: "#ffffff", K: "#d4931c", d: "#c98a1c" }
    },
    sparkle: {
      // Brilho de 4 pontas: centro branco e braços finos e longos.
      rows: [
        "....y....",
        "....y....",
        "...yhy...",
        "..yhwhy..",
        "yyhwwwhyy",
        "..yhwhy..",
        "...yhy...",
        "....y....",
        "....y...."
      ],
      pal: { y: "#ffe07a", h: "#fff6c8", w: "#ffffff" }
    },
    trophy: {
      // Taça dourada com alças e pedestal de madeira.
      rows: [
        "yhhhyyyyd",
        "yhwhyyydy",
        "y.hhyyd.y",
        ".yhhyyd.y",
        "..hyyyd..",
        "...yyd...",
        "....y....",
        "..bbbbb..",
        ".BBBBBBB."
      ],
      pal: { y: "#ffcf3f", h: "#fff2a8", w: "#ffffff", d: "#d99e1f", b: "#a8723f", B: "#7a4f2a" }
    },
    hand_rock: {
      // Punho fechado de frente: três nós dos dedos em cima, vincos entre os dedos e o polegar
      // atravessado embaixo (tom mais quente).
      rows: [
        ".LL.LL.LL.",
        "LsskssksSS",
        "LsskssksSS",
        "LssssssssS",
        "LTTTTTsssS",
        ".TTTTTssS.",
        "..SSSSSS.."
      ],
      pal: { L: "#ffe0c4", s: "#f6c9a2", S: "#d99d72", k: "#c48660", T: "#ecb68b" }
    },
    hand_paper: {
      // Mão aberta: quatro dedos esticados e separados, polegar aberto para o lado.
      rows: [
        "..L.L....",
        ".LsLsL...",
        ".LsLsLs..",
        ".LsLsLs..",
        "LLsssss..",
        "sLssssss.",
        ".sssssSS.",
        "..ssssS..",
        "..SSSS..."
      ],
      pal: { L: "#ffe0c4", s: "#f6c9a2", S: "#d99d72" }
    },
    hand_scissors: {
      // Indicador e médio abertos em V; os outros dedos dobrados no punho.
      rows: [
        ".L...L...",
        ".Ls..Ls..",
        "..Ls.Ls..",
        "..LsLs...",
        ".LLsssk..",
        ".LsksksS.",
        ".sssssSS.",
        "..SSSSS.."
      ],
      pal: { L: "#ffe0c4", s: "#f6c9a2", S: "#d99d72", k: "#c48660" }
    }
  };
  var ICON_NAMES = Object.keys(ICONS);
  function renderIcon(name) {
    const def = ICONS[name];
    const w = Math.max(...def.rows.map((r) => r.length));
    const h = def.rows.length;
    const b = new PixelBuf(w + 2, h + 2);
    b.stamp(def.rows, 1, 1, def.pal);
    const soft = def.outlineAlpha !== void 0 || def.holeOutlineAlpha !== void 0;
    const before = soft ? b.data.slice() : null;
    b.outline();
    if (before) {
      const outer = alpha255(def.outlineAlpha ?? 1);
      const hole = alpha255(def.holeOutlineAlpha ?? def.outlineAlpha ?? 1);
      const outside = reachableFromBorder(before, b.w, b.h);
      for (let p = 0; p < b.w * b.h; p++) {
        const i = p * 4 + 3;
        if (before[i] === 0 && b.data[i] > 0) b.data[i] = outside[p] ? outer : hole;
      }
    }
    return { buf: b, ax: Math.floor((w + 2) / 2), ay: h + 2 };
  }
  function alpha255(a) {
    return Math.round(Math.max(0, Math.min(1, a)) * 255);
  }
  function reachableFromBorder(data, w, h) {
    const seen = new Uint8Array(w * h);
    const stack = [];
    const push = (x, y) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const p = y * w + x;
      if (seen[p] || data[p * 4 + 3] !== 0) return;
      seen[p] = 1;
      stack.push(p);
    };
    for (let x = 0; x < w; x++) {
      push(x, 0);
      push(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      push(0, y);
      push(w - 1, y);
    }
    while (stack.length) {
      const p = stack.pop();
      const x = p % w;
      const y = (p - x) / w;
      push(x + 1, y);
      push(x - 1, y);
      push(x, y + 1);
      push(x, y - 1);
    }
    return seen;
  }

  // vendor/habblaud/upstream/client/src/art/surfaces/floor.ts
  var CHUNK_TILES = 8;
  var CHUNK_PX = CHUNK_TILES * TILE;
  function h3(a, b, c = 0, seed = 0) {
    let h = Math.imul(a | 0, 2654435761) ^ Math.imul(b | 0, 2246822519) ^ Math.imul(c | 0, 3266489917) ^ Math.imul(seed | 0, 668265263);
    h ^= h >>> 15;
    h = Math.imul(h, 739982445);
    h ^= h >>> 12;
    h = Math.imul(h, 695872825);
    h ^= h >>> 15;
    return h >>> 0;
  }
  function rnd01(a, b, c = 0, seed = 0) {
    return h3(a, b, c, seed) / 4294967296;
  }
  function noise(x, y, cell, seed) {
    const gx = Math.floor(x / cell);
    const gy = Math.floor(y / cell);
    const fx = x / cell - gx;
    const fy = y / cell - gy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = rnd01(gx, gy, 0, seed);
    const b = rnd01(gx + 1, gy, 0, seed);
    const c = rnd01(gx, gy + 1, 0, seed);
    const d = rnd01(gx + 1, gy + 1, 0, seed);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  }
  function floorChunk(kind, cx, cy, o) {
    const b = new PixelBuf(CHUNK_PX, CHUNK_PX);
    const x0 = cx * CHUNK_PX;
    const y0 = cy * CHUNK_PX;
    switch (kind) {
      case "wood":
        paintWood(b, x0, y0, o.seed);
        break;
      case "concrete":
        paintConcrete(b, x0, y0, o.seed);
        break;
      case "marble":
        paintMarble(b, x0, y0, o.seed);
        break;
      case "sidewalk":
        paintSidewalk(b, x0, y0, o.seed);
        break;
      default:
        for (let ty = 0; ty < CHUNK_TILES; ty++) {
          for (let tx = 0; tx < CHUNK_TILES; tx++) {
            b.ox = tx * TILE;
            b.oy = ty * TILE;
            paintTile(b, kind, cx * CHUNK_TILES + tx, cy * CHUNK_TILES + ty, o);
          }
        }
        b.ox = 0;
        b.oy = 0;
    }
    return b;
  }
  function paintTile(b, kind, tx, ty, o) {
    const r = (i) => rnd01(tx, ty, i, o.seed);
    switch (kind) {
      case "carpet": {
        const c1 = o.tint ?? "#c9d1dc";
        const c2 = o.tint2 ?? shade(c1, -0.03);
        const odd = tx + ty & 1;
        const base = mix(c1, c2, odd ? 0.55 : 0.15);
        b.rect(0, 0, TILE, TILE, base);
        const weave = shade(base, -0.018);
        for (let a = 1; a < TILE - 1; a += 3) {
          for (let k = 1; k < TILE - 1; k++) {
            if ((k + a) % 4 === 0) continue;
            if (odd) b.set(k, a, weave);
            else b.set(a, k, weave);
          }
        }
        for (let i = 0; i < 3; i++) b.set(Math.floor(r(i) * 14) + 1, Math.floor(r(i + 9) * 14) + 1, shade(base, i % 2 ? 0.03 : -0.035));
        b.hline(0, TILE - 1, TILE - 1, shade(base, -0.06));
        b.vline(TILE - 1, 0, TILE - 1, shade(base, -0.06));
        b.hline(0, TILE - 2, 0, shade(base, 0.025));
        b.vline(0, 0, TILE - 2, shade(base, 0.025));
        break;
      }
      case "tile_check": {
        const a = "#f2ede4";
        const c = "#d2d8de";
        for (let qy = 0; qy < 2; qy++) {
          for (let qx = 0; qx < 2; qx++) {
            const col = (qx + qy + tx + ty) % 2 ? c : a;
            b.rect(qx * 8, qy * 8, 8, 8, col);
            b.hline(qx * 8, qx * 8 + 6, qy * 8, shade(col, 0.02));
            b.hline(qx * 8, qx * 8 + 7, qy * 8 + 7, shade(col, -0.045));
            b.vline(qx * 8 + 7, qy * 8, qy * 8 + 7, shade(col, -0.045));
            if (r(qx + qy * 2) < 0.3) b.set(qx * 8 + 2 + Math.floor(r(5) * 4), qy * 8 + 2 + Math.floor(r(6) * 4), shade(col, -0.02));
          }
        }
        break;
      }
      case "tile_white": {
        const col = "#eef2f5";
        const grout = "#d3dae1";
        b.rect(0, 0, TILE, TILE, col);
        for (let q = 0; q < 2; q++) {
          b.hline(0, TILE - 1, q * 8 + 7, grout);
          b.vline(q * 8 + 7, 0, TILE - 1, grout);
        }
        for (let qy = 0; qy < 2; qy++) for (let qx = 0; qx < 2; qx++) b.hline(qx * 8, qx * 8 + 2, qy * 8, "#fbfcfd");
        if (r(1) < 0.4) b.set(Math.floor(r(2) * 14), Math.floor(r(3) * 14), "#e4eaef");
        break;
      }
      case "grass": {
        const g = ramp("#6cab57", 0.045);
        const n = noise(tx * TILE, ty * TILE, 48, o.seed + 5);
        const base = mix(g.dk, g.lt, n);
        b.rect(0, 0, TILE, TILE, base);
        for (let i = 0; i < 12; i++) {
          const x = Math.floor(r(i) * TILE);
          const y = Math.floor(r(i + 20) * TILE);
          const c = r(i + 40) < 0.5 ? shade(base, 0.05) : shade(base, -0.05);
          b.set(x, y, c);
          if (r(i + 60) < 0.5) b.set(x, y - 1, shade(c, 0.03));
        }
        for (let i = 0; i < 2; i++) {
          const x = 2 + Math.floor(r(i + 80) * 12);
          const y = 3 + Math.floor(r(i + 90) * 11);
          b.set(x, y, g.dd);
          b.set(x - 1, y - 1, g.dk);
          b.set(x + 1, y - 1, g.dk);
          b.set(x, y - 2, g.lt);
        }
        if (r(99) < 0.12) {
          const fx = 3 + Math.floor(r(100) * 10);
          const fy = 3 + Math.floor(r(101) * 10);
          const fc = ["#ffffff", "#f7d154", "#f28fb0", "#b9a2f0"][Math.floor(r(102) * 4)];
          b.set(fx, fy, fc);
          b.set(fx + 1, fy, fc);
          b.set(fx, fy - 1, fc);
          b.set(fx + 1, fy + 1, "#f2c14e");
        }
        break;
      }
      case "street": {
        const n = noise(tx * TILE, ty * TILE, 64, o.seed + 9);
        const col = mix("#4b4f58", "#565a63", n);
        b.rect(0, 0, TILE, TILE, col);
        for (let i = 0; i < 14; i++) b.set(Math.floor(r(i) * TILE), Math.floor(r(i + 30) * TILE), r(i + 60) < 0.5 ? "#5f636c" : "#43464e");
        break;
      }
      default:
        b.rect(0, 0, TILE, TILE, "#dcdedf");
    }
  }
  function rgba(c) {
    return parseColor(c);
  }
  var WOOD_TONES = ["#c99668", "#c48f61", "#cf9f72", "#c6925f"];
  var WOOD = WOOD_TONES.map(
    (t2) => [t2, shade(t2, 0.03), shade(t2, -0.075), shade(t2, -0.03), shade(t2, -0.1), shade(t2, 0.03), shade(t2, -0.12)].map(rgba)
  );
  function paintWood(b, x0, y0, seed) {
    for (let py = 0; py < CHUNK_PX; py++) {
      const wy = y0 + py;
      const row = Math.floor(wy / 4);
      const iy = wy - row * 4;
      const off = h3(row, 0, 1, seed) % 48;
      for (let px = 0; px < CHUNK_PX; px++) {
        const wx = x0 + px + off;
        const plank = Math.floor(wx / 48);
        const ix = wx - plank * 48;
        const ph = h3(row, plank, 2, seed);
        const t2 = WOOD[ph % WOOD.length];
        let k = 0;
        if (ix === 0) k = 4;
        else if (iy === 3) k = 2;
        else if (iy === 0) k = ix === 1 ? 5 : 1;
        else if (iy === 2 && ix === 10 + (ph >>> 12) % 20 && (ph >>> 20) % 5 === 0) k = 6;
        else if (iy === 1 + (ph >>> 5) % 2 && (ix + (ph >>> 8)) % 23 < 7) k = 3;
        else if (ix === 1) k = 5;
        b.put(px, py, t2[k]);
      }
    }
  }
  var LEVELS = 16;
  var CONCRETE = Array.from({ length: LEVELS }, (_, i) => rgba(mix("#d6d9dc", "#e4e6e8", i / (LEVELS - 1))));
  var CONCRETE_EDGE = CONCRETE.map((c) => rgba(shade(`rgb(${c[0]},${c[1]},${c[2]})`, 0.02)));
  var CONCRETE_SEAM = rgba("#c8cdd2");
  var CONCRETE_SPECK = [rgba("#cdd1d5"), rgba("#eceeef")];
  function paintConcrete(b, x0, y0, seed) {
    for (let py = 0; py < CHUNK_PX; py++) {
      for (let px = 0; px < CHUNK_PX; px++) {
        const wx = x0 + px;
        const wy = y0 + py;
        const sx = wx & 31;
        const sy = wy & 31;
        if (sx === 31 || sy === 31) {
          b.put(px, py, CONCRETE_SEAM);
          continue;
        }
        const sp = h3(wx, wy, 3, seed) % 61;
        if (sp < 2) {
          b.put(px, py, CONCRETE_SPECK[sp]);
          continue;
        }
        const n = noise(wx, wy, 26, seed) * 0.6 + noise(wx, wy, 7, seed + 3) * 0.4;
        const lv = Math.min(LEVELS - 1, Math.floor(n * LEVELS));
        b.put(px, py, sx === 0 || sy === 0 ? CONCRETE_EDGE[lv] : CONCRETE[lv]);
      }
    }
  }
  var MARBLE = Array.from({ length: LEVELS }, (_, i) => rgba(mix("#ebe8e3", "#f5f3f0", i / (LEVELS - 1))));
  var MARBLE_VEIN = [rgba("#e2e3e6"), rgba("#cfd2d7")];
  var MARBLE_SEAM = rgba("#d6d3ce");
  function paintMarble(b, x0, y0, seed) {
    for (let py = 0; py < CHUNK_PX; py++) {
      for (let px = 0; px < CHUNK_PX; px++) {
        const wx = x0 + px;
        const wy = y0 + py;
        if ((wx & 31) === 31 || (wy & 31) === 31) {
          b.put(px, py, MARBLE_SEAM);
          continue;
        }
        const slab = h3(wx >> 5, wy >> 5, 4, seed);
        const ax = slab % 1e3 / 1e3;
        const veined = (slab >>> 12) % 5 < 2;
        const v = veined ? Math.sin(wx * 0.08 + wy * (0.14 + ax * 0.1) + noise(wx, wy, 14, seed + 12) * 2.4 + ax * 6.28) : 0;
        if (v > 0.997) b.put(px, py, MARBLE_VEIN[1]);
        else if (v > 0.986) b.put(px, py, MARBLE_VEIN[0]);
        else b.put(px, py, MARBLE[Math.min(LEVELS - 1, Math.floor(noise(wx, wy, 20, seed + 11) * LEVELS))]);
      }
    }
  }
  var WALK_TONES = ["#d3cdc2", "#cfc8bc", "#d8d2c8"];
  var WALK = WALK_TONES.map((t2) => [t2, "#b8b1a5", shade(t2, 0.03), shade(t2, -0.05)].map(rgba));
  function paintSidewalk(b, x0, y0, seed) {
    for (let py = 0; py < CHUNK_PX; py++) {
      for (let px = 0; px < CHUNK_PX; px++) {
        const wx = x0 + px;
        const wy = y0 + py;
        const row = wy >> 3;
        const off = row & 1 ? 8 : 0;
        const ix = wx + off & 15;
        const iy = wy & 7;
        const t2 = WALK[h3(wx + off >> 4, row, 5, seed) % WALK.length];
        let k = 0;
        if (iy === 7 || ix === 15) k = 1;
        else if (iy === 0 || ix === 0) k = 2;
        else if (h3(wx, wy, 6, seed) % 41 === 0) k = 3;
        b.put(px, py, t2[k]);
      }
    }
  }

  // vendor/habblaud/upstream/client/src/art/surfaces/walls.ts
  function speckle(b, seed, n, colors) {
    const r = rngOf(seed, 91);
    for (let i = 0; i < n; i++) {
      b.set(Math.floor(r() * TILE), Math.floor(r() * TILE * 2), colors[Math.floor(r() * colors.length)]);
    }
  }
  var WALL_FACE_H = TILE * 2;
  var WALL_CAP_H = 4;
  var BASEBOARD_H = 3;
  function capColor(style) {
    return mix(style.exterior ? "#4a4f5c" : "#3d4356", style.base, 0.1);
  }
  function wallFaceTile(style, variant, col) {
    const b = new PixelBuf(TILE, WALL_FACE_H);
    const base = style.base;
    const pattern = style.pattern ?? "plain";
    const trim2 = style.trim ?? shade(base, -0.16);
    const cap = capColor(style);
    const fy = WALL_CAP_H;
    const fh = WALL_FACE_H - WALL_CAP_H - BASEBOARD_H;
    const r = rngOf(variant * 31 + col, 43);
    for (let y = 0; y < fh; y++) b.hline(0, TILE - 1, fy + y, shade(base, 0.02 - y / fh * 0.035));
    switch (pattern) {
      case "stripes": {
        const s = shade(base, -0.035);
        for (let x = 0; x < TILE; x += 4) b.rect(x, fy, 2, fh, s);
        for (let x = 1; x < TILE; x += 4) b.vline(x, fy, fy + fh - 1, shade(base, -0.02));
        break;
      }
      case "tiles": {
        const grout = shade(base, -0.09);
        for (let y = fy; y < fy + fh; y++) {
          const ry = y - fy;
          if (ry % 6 === 5) b.hline(0, TILE - 1, y, grout);
        }
        for (let ry = 0; ry < fh; ry += 6) {
          const off = Math.floor(ry / 6) % 2 * 4;
          for (let x = off; x < TILE + 8; x += 8) b.vline((x + 7) % 16, fy + ry, Math.min(fy + fh - 1, fy + ry + 4), grout);
          b.hline(0, TILE - 1, fy + ry, shade(base, 0.035));
        }
        break;
      }
      case "wood_panel": {
        const w = ramp(mix("#b98a5e", base, 0.15), 0.04);
        const top = fy + Math.floor(fh * 0.45);
        b.rect(0, top, TILE, fy + fh - top, w.base);
        for (let x = 0; x < TILE; x += 4) {
          b.vline(x, top, fy + fh - 1, w.dk);
          b.vline(x + 1, top + 1, fy + fh - 1, w.lt);
        }
        b.hline(0, TILE - 1, top - 1, w.hi);
        b.hline(0, TILE - 1, top, w.lt);
        b.hline(0, TILE - 1, top + 1, w.dk);
        break;
      }
      case "brick": {
        const brick = ramp(base, 0.035);
        const mortar = mix(base, "#e9e4dc", 0.5);
        for (let row = 0; row * 4 < fh; row++) {
          const y = fy + row * 4;
          const off = row % 2 ? 4 : 0;
          for (let bx = -8; bx < TILE; bx += 8) {
            const x0 = bx + off;
            const tone = [brick.lt, brick.base, brick.base, brick.dk][Math.floor(r() * 4)];
            for (let x = Math.max(0, x0); x < Math.min(TILE, x0 + 7); x++) {
              for (let yy = y; yy < Math.min(fy + fh, y + 3); yy++) b.set(x, yy, yy === y ? shade(tone, 0.03) : tone);
            }
            if (x0 + 7 >= 0 && x0 + 7 < TILE) b.vline(x0 + 7, y, Math.min(fy + fh - 1, y + 2), mortar);
          }
          if (y + 3 < fy + fh) b.hline(0, TILE - 1, y + 3, mortar);
        }
        break;
      }
      case "glass": {
        b.clearRect(0, fy, TILE, fh);
        b.rect(0, fy, TILE, fh, "rgba(175,215,238,0.38)");
        b.vline(0, fy, fy + fh - 1, "rgba(195,202,212,0.95)");
        b.hline(0, TILE - 1, fy, "rgba(255,255,255,0.45)");
        for (let i = 0; i < fh; i++) {
          const x = col * 5 + 11 - i & 15;
          b.set(x, fy + i, "rgba(255,255,255,0.35)");
          b.set(x + 1 & 15, fy + i, "rgba(255,255,255,0.18)");
        }
        break;
      }
      case "marble": {
        const m = mix("#c9cdd3", base, 0.25);
        b.rect(0, fy, TILE, fh, m);
        for (let v = 0; v < 2; v++) {
          let x = r() * TILE;
          for (let y = 0; y < fh; y++) {
            b.set(Math.floor(x) & 15, fy + y, v ? "rgba(120,126,138,0.4)" : "rgba(250,250,252,0.55)");
            x += (r() - 0.35) * 1.4;
          }
        }
        for (let i = 0; i < 8; i++) b.set(Math.floor(r() * TILE), fy + Math.floor(r() * fh), r() < 0.5 ? "#d8dbe0" : "#b8bdc6");
        b.hline(0, TILE - 1, fy + Math.floor(fh / 2), "rgba(120,126,138,0.35)");
        if (col % 2 === 1) b.vline(TILE - 1, fy, fy + fh - 1, "rgba(120,126,138,0.35)");
        break;
      }
      case "plain":
        if (style.exterior) speckle(b, variant * 13 + col, 5, [shade(base, -0.03), shade(base, 0.03)]);
        break;
    }
    if (pattern !== "glass") b.hline(0, TILE - 1, fy, shade(base, -0.06));
    b.rect(0, 0, TILE, WALL_CAP_H, cap);
    b.hline(0, TILE - 1, 0, shade(cap, 0.08));
    b.hline(0, TILE - 1, WALL_CAP_H - 1, shade(cap, -0.06));
    const by = WALL_FACE_H - BASEBOARD_H;
    b.rect(0, by, TILE, BASEBOARD_H, trim2);
    b.hline(0, TILE - 1, by, shade(trim2, 0.08));
    b.hline(0, TILE - 1, WALL_FACE_H - 1, shade(trim2, -0.08));
    return b;
  }
  function southWallTile(style, col) {
    const b = new PixelBuf(TILE, TILE);
    const cap = capColor(style);
    const capH = 6;
    b.rect(0, 0, TILE, capH, cap);
    b.hline(0, TILE - 1, 0, shade(cap, 0.08));
    b.hline(0, TILE - 1, capH - 1, shade(cap, -0.05));
    const face = shade(style.base, -0.05);
    b.rect(0, capH, TILE, TILE - capH, face);
    b.hline(0, TILE - 1, capH, shade(face, -0.06));
    const trim2 = style.trim ?? shade(style.base, -0.16);
    b.rect(0, TILE - 2, TILE, 2, trim2);
    b.hline(0, TILE - 1, TILE - 2, shade(trim2, 0.06));
    if (style.pattern === "brick" || style.exterior) {
      for (let y = capH + 2; y < TILE - 2; y += 3) b.hline(0, TILE - 1, y, shade(face, -0.035));
    }
    if (col % 4 === 3) b.set(TILE - 1, capH + 1, shade(face, -0.03));
    return b;
  }

  // vendor/habblaud/upstream/client/src/art/surfaces/rug.ts
  function renderRug(w, h, color, seed) {
    const b = new PixelBuf(w, h);
    const m = ramp(color, 0.06);
    const fringe = "#efe6d2";
    const x0 = 1;
    const x1 = w - 2;
    for (let y = 2; y < h - 2; y += 2) {
      b.set(0, y, fringe);
      b.set(w - 1, y, fringe);
    }
    b.rect(x0, 0, x1 - x0 + 1, h, m.dk);
    b.rect(x0 + 1, 1, x1 - x0 - 1, h - 2, m.base);
    b.rect(x0 + 2, 2, x1 - x0 - 3, 1, m.hi);
    b.rect(x0 + 2, h - 3, x1 - x0 - 3, 1, m.hi);
    b.rect(x0 + 2, 2, 1, h - 4, m.hi);
    b.rect(x1 - 2, 2, 1, h - 4, m.hi);
    const fx = x0 + 3;
    const fy = 3;
    const fw = x1 - x0 - 5;
    const fh = h - 6;
    const kind = Math.abs(seed) % 3;
    for (let y = 0; y < fh; y++) {
      for (let x = 0; x < fw; x++) {
        let c = m.lt;
        if (kind === 0) {
          const d = (Math.abs((x + 3) % 8 - 4) + Math.abs((y + 3) % 8 - 4)) % 8;
          if (d === 4) c = m.base;
          else if (d === 0) c = m.hi;
        } else if (kind === 1) {
          if (y % 6 === 0) c = m.base;
          else if (y % 6 === 3) c = shade(m.lt, 0.03);
        } else if ((x * 7 + y * 13) % 11 === 0) c = m.base;
        b.set(fx + x, fy + y, c);
      }
    }
    for (const [cx, cy] of [[x0, 0], [x1, 0], [x0, h - 1], [x1, h - 1]]) b.clear(cx, cy);
    return b;
  }

  // vendor/habblaud/upstream/client/src/art/theme.ts
  var THEMES = [
    { carpet: "#c9d1dc", carpet2: "#bdc6d3", wall: { base: "#eef1f4", trim: "#9fb0c4", pattern: "plain" }, accent: "#3f7fd8", deskVariant: "white", chairVariant: "blue" },
    { carpet: "#dbcfba", carpet2: "#d0c2ab", wall: { base: "#f6f0e5", trim: "#b99f7a", pattern: "stripes" }, accent: "#ec8a3c", deskVariant: "wood", chairVariant: "black" },
    { carpet: "#c4cfbb", carpet2: "#b8c5af", wall: { base: "#f1f3ea", trim: "#93a487", pattern: "wood_panel" }, accent: "#4cae6a", deskVariant: "wood", chairVariant: "green" },
    { carpet: "#cdc8de", carpet2: "#c2bbd5", wall: { base: "#f3f1f8", trim: "#a59cc4", pattern: "plain" }, accent: "#8d66cf", deskVariant: "white", chairVariant: "gray" },
    { carpet: "#e4cdbe", carpet2: "#dbc1b0", wall: { base: "#f8f1eb", trim: "#c99a83", pattern: "plain" }, accent: "#e2604f", deskVariant: "wood", chairVariant: "red" },
    { carpet: "#bfd9d2", carpet2: "#b2cfc7", wall: { base: "#eef6f4", trim: "#7fb3a6", pattern: "stripes" }, accent: "#36b0b0", deskVariant: "white", chairVariant: "green" },
    { carpet: "#aab1bd", carpet2: "#9fa7b4", wall: { base: "#e8eaee", trim: "#6d7583", pattern: "brick" }, accent: "#f2c14e", deskVariant: "dark", chairVariant: "black" },
    { carpet: "#e0cad2", carpet2: "#d6bdc6", wall: { base: "#f9f2f4", trim: "#c08ea0", pattern: "stripes" }, accent: "#e47aa8", deskVariant: "white", chairVariant: "black" },
    { carpet: "#c0d2e7", carpet2: "#b3c7e0", wall: { base: "#eef4fa", trim: "#8aa6c8", pattern: "wood_panel" }, accent: "#5b8fe0", deskVariant: "wood", chairVariant: "blue" },
    { carpet: "#d1c5b8", carpet2: "#c5b8aa", wall: { base: "#f4efe8", trim: "#8a6a52", pattern: "wood_panel" }, accent: "#c9713f", deskVariant: "dark", chairVariant: "gray" }
  ];
  var THEME_COUNT = THEMES.length;
  function roomTheme(seed) {
    const n = THEMES.length;
    const t2 = THEMES[(Math.floor(seed) % n + n) % n];
    return { ...t2, wall: { ...t2.wall } };
  }

  // vendor/habblaud/upstream/client/src/art/index.ts
  function toCanvas(buf) {
    const c = document.createElement("canvas");
    c.width = Math.max(1, buf.w);
    c.height = Math.max(1, buf.h);
    const ctx = c.getContext("2d");
    if (ctx && buf.w > 0 && buf.h > 0) ctx.putImageData(new ImageData(buf.data, buf.w, buf.h), 0, 0);
    return c;
  }
  function toSprite(s) {
    return { canvas: toCanvas(s.buf), ax: s.ax, ay: s.ay, rects: s.rects };
  }
  var Cache = class {
    constructor(limit) {
      this.limit = limit;
    }
    map = /* @__PURE__ */ new Map();
    get(key, make2) {
      let v = this.map.get(key);
      if (v === void 0) {
        if (this.map.size >= this.limit) this.map.clear();
        v = make2();
        this.map.set(key, v);
      }
      return v;
    }
  };
  var charCache = new Cache(3e4);
  var furnCache = new Cache(4e3);
  var tileCache = new Cache(2e3);
  var floorCache = new Cache(1500);
  var iconCache = new Cache(64);
  var avatarCache = new Cache(2e3);
  var rugCache = new Cache(512);
  var appearanceKeys = /* @__PURE__ */ new WeakMap();
  function keyOf(a) {
    let k = appearanceKeys.get(a);
    if (!k) {
      k = appearanceKey(a);
      appearanceKeys.set(a, k);
    }
    return k;
  }
  function appearanceFromSeed2(seed, opts = {}) {
    return appearanceFromSeed(seed, opts);
  }
  function poseFrameCount(pose) {
    return POSE_FRAMES[pose] ?? 1;
  }
  function poseFrameDuration(pose) {
    return POSE_DURATION[pose] ?? 500;
  }
  function characterSprite(req) {
    const n = poseFrameCount(req.pose);
    const frame = (Math.floor(req.frame) % n + n) % n;
    const seated = isSeated(req.pose, req.seated);
    const key = `${keyOf(req.appearance)}|${req.dir}|${req.pose}|${frame}|${req.held ?? "none"}|${seated ? 1 : 0}|${req.costume ?? "none"}`;
    return charCache.get(key, () => toSprite(renderCharacter({ ...req, frame, seated })));
  }
  function avatarCanvas(seed, opts = {}) {
    const scale = Math.max(1, Math.round(opts.scale ?? 3));
    const key = `${seed}|${opts.look ?? "-"}|${opts.sub ? 1 : 0}|${scale}|${partsKey(opts.parts)}`;
    return avatarCache.get(key, () => {
      const s = renderCharacter({ appearance: appearanceFromSeed(seed, opts), dir: "down", pose: "stand", frame: 0 });
      const crop = s.buf.crop(2, 2, CHAR_W - 4, 20);
      const out = new PixelBuf(crop.w * scale, crop.h * scale);
      for (let y = 0; y < out.h; y++) {
        for (let x = 0; x < out.w; x++) {
          const si = (Math.floor(y / scale) * crop.w + Math.floor(x / scale)) * 4;
          const di = (y * out.w + x) * 4;
          out.data[di] = crop.data[si];
          out.data[di + 1] = crop.data[si + 1];
          out.data[di + 2] = crop.data[si + 2];
          out.data[di + 3] = crop.data[si + 3];
        }
      }
      return toCanvas(out);
    });
  }
  function furnitureSprites(kind, variant, state, opts = {}) {
    const n = normalizeFurniture(kind, variant, state, opts.seed);
    const key = `${kind}|${n.variant ?? "-"}|${n.state}|${n.vseed}`;
    return furnCache.get(key, () => {
      const f = renderFurniture(kind, n.variant, n.state, n.vseed);
      return { base: toSprite(f.base), front: f.front ? toSprite(f.front) : void 0 };
    });
  }
  function iconSprite(name) {
    return iconCache.get(name, () => toSprite(renderIcon(name)));
  }
  function roomTheme2(seed) {
    return roomTheme(seed);
  }
  function tileHash(seed, tx, ty) {
    let h = Math.imul(tx | 0, 2654435761) ^ Math.imul(ty | 0, 2246822519) ^ Math.imul(seed | 0, 3266489917);
    h ^= h >>> 15;
    h = Math.imul(h, 739982445);
    h ^= h >>> 12;
    return h >>> 0;
  }
  function drawFloor(ctx, kind, x, y, w, h, opts) {
    const cx0 = Math.floor(x / CHUNK_PX);
    const cy0 = Math.floor(y / CHUNK_PX);
    const cx1 = Math.ceil((x + w) / CHUNK_PX);
    const cy1 = Math.ceil((y + h) / CHUNK_PX);
    for (let cy = cy0; cy < cy1; cy++) {
      for (let cx = cx0; cx < cx1; cx++) {
        const key = `f|${kind}|${opts.seed}|${opts.tint ?? ""}|${opts.tint2 ?? ""}|${cx}|${cy}`;
        const chunk = floorCache.get(key, () => toCanvas(floorChunk(kind, cx, cy, opts)));
        const px = cx * CHUNK_PX;
        const py = cy * CHUNK_PX;
        const sx = Math.max(0, x - px);
        const sy = Math.max(0, y - py);
        const ex = Math.min(CHUNK_PX, x + w - px);
        const ey = Math.min(CHUNK_PX, y + h - py);
        if (ex <= sx || ey <= sy) continue;
        ctx.drawImage(chunk, sx, sy, ex - sx, ey - sy, px + sx, py + sy, ex - sx, ey - sy);
      }
    }
  }
  function drawRug(ctx, x, y, w, h, color, seed) {
    const rw = Math.max(4, Math.round(w));
    const rh = Math.max(4, Math.round(h));
    const key = `${rw}|${rh}|${color}|${seed}`;
    const c = rugCache.get(key, () => toCanvas(renderRug(rw, rh, color, seed)));
    ctx.drawImage(c, Math.round(x), Math.round(y));
  }
  function styleKey(s) {
    return `${s.base}|${s.trim ?? ""}|${s.pattern ?? "plain"}|${s.exterior ? 1 : 0}`;
  }
  function solidSegments(x, w, doorways) {
    let segs = [[x, x + w]];
    for (const d of doorways ?? []) {
      const next = [];
      for (const [a, b] of segs) {
        const da = d.x;
        const db = d.x + d.w;
        if (db <= a || da >= b) {
          next.push([a, b]);
          continue;
        }
        if (da > a) next.push([a, da]);
        if (db < b) next.push([db, b]);
      }
      segs = next;
    }
    return segs;
  }
  function drawTiled(ctx, x0, x1, y, h, tileFor) {
    for (let tx = Math.floor(x0 / TILE); tx * TILE < x1; tx++) {
      const px = tx * TILE;
      const sx = Math.max(0, x0 - px);
      const ex = Math.min(TILE, x1 - px);
      if (ex <= sx) continue;
      ctx.drawImage(tileFor(tx), sx, 0, ex - sx, h, px + sx, y, ex - sx, h);
    }
  }
  function drawWallFace(ctx, x, y, w, style, opts = {}) {
    const sk = styleKey(style);
    const tileFor = (tx) => {
      const variant = tileHash(7, tx, 0) % 4;
      const col = tx & 1;
      return tileCache.get(`w|${sk}|${variant}|${col}`, () => toCanvas(wallFaceTile(style, variant, col)));
    };
    const segs = solidSegments(x, w, opts.doorways);
    const jamb = shade(style.base, -0.14);
    const jambLight = shade(style.base, 0.04);
    const cap = capColor(style);
    for (const [a, b] of segs) {
      drawTiled(ctx, a, b, y, WALL_FACE_H, tileFor);
      if (b < x + w) {
        ctx.fillStyle = jamb;
        ctx.fillRect(b - 2, y + WALL_CAP_H, 2, WALL_FACE_H - WALL_CAP_H);
        ctx.fillStyle = shade(cap, -0.08);
        ctx.fillRect(b - 1, y, 1, WALL_CAP_H);
      }
      if (a > x) {
        ctx.fillStyle = jambLight;
        ctx.fillRect(a, y + WALL_CAP_H, 1, WALL_FACE_H - WALL_CAP_H);
        ctx.fillStyle = jamb;
        ctx.fillRect(a + 1, y + WALL_CAP_H, 1, WALL_FACE_H - WALL_CAP_H);
        ctx.fillStyle = shade(cap, 0.06);
        ctx.fillRect(a, y, 1, WALL_CAP_H);
      }
    }
  }
  function drawWallTop(ctx, x, y, w, h, style) {
    const cap = capColor(style);
    ctx.fillStyle = cap;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = shade(cap, 0.08);
    ctx.fillRect(x, y, w, 1);
    if (w > 2) ctx.fillRect(x, y, 1, h);
    ctx.fillStyle = shade(cap, -0.06);
    if (h > 2) ctx.fillRect(x, y + h - 1, w, 1);
    if (w > 2) ctx.fillRect(x + w - 1, y, 1, h);
  }
  function drawSouthWall(ctx, x, y, w, style, opts = {}) {
    const sk = styleKey(style);
    const tileFor = (tx) => {
      const col = tx & 3;
      return tileCache.get(`s|${sk}|${col}`, () => toCanvas(southWallTile(style, col)));
    };
    const cap = capColor(style);
    for (const [a, b] of solidSegments(x, w, opts.doorways)) {
      drawTiled(ctx, a, b, y, TILE, tileFor);
      if (b < x + w) {
        ctx.fillStyle = shade(cap, -0.08);
        ctx.fillRect(b - 1, y, 1, TILE);
      }
      if (a > x) {
        ctx.fillStyle = shade(cap, 0.08);
        ctx.fillRect(a, y, 1, TILE);
      }
    }
  }
  var CHARACTER_SHEET = { w: CHAR_W, h: CHAR_H };

  // vendor/habblaud/upstream/client/src/world/api.ts
  function seasonalThemeFor(theme, date) {
    if (theme && theme !== "auto") return theme;
    const month = date.getMonth();
    if (month === 9) return "halloween";
    if (month === 10 || month === 11 && date.getDate() <= 26) return "christmas";
    return "none";
  }
  var DEFAULT_WORLD_OPTIONS = {
    showNames: true,
    bubbles: "important",
    liveliness: "normal",
    followSelected: false,
    dayNight: true,
    theme: "auto"
  };

  // vendor/habblaud/openbot/assets.ts
  async function loadWorldAssets() {
    return null;
  }

  // vendor/habblaud/upstream/client/src/world/constants.ts
  var COL_W = 16;
  var ROOM_H = 12;
  var CORRIDOR_H = 5;
  var CORE_COLS = 2;
  var NORTH_Y = 0;
  var CORRIDOR_Y = ROOM_H;
  var SOUTH_Y = ROOM_H + CORRIDOR_H;
  var BUILDING_H = ROOM_H * 2 + CORRIDOR_H;
  var DOOR_X = 7;
  var DOOR_W = 2;
  var EXT_WEST = 20;
  var EXT_EAST = 20;
  var EXT_NORTH = 16;
  var EXT_SOUTH = 24;
  var WALK_SPEED = 3.2 * TILE;
  var RUN_SPEED = 6 * TILE;
  var FOOT_DX = TILE / 2;
  var FOOT_DY = 11;
  var ZOOM_MIN = 1;
  var ZOOM_MAX = 6;
  var BUILD_MS = 2600;
  var DISMANTLE_MS = 2200;
  var DISMANTLE_DELAY_MS = 1500;
  var COMPACT_DELAY_MS = 1200;
  var MISSING_DEBOUNCE_MS = 3e3;

  // vendor/habblaud/upstream/client/src/world/camera.ts
  var OVERVIEW_MARGIN = { top: 34, bottom: 10, side: 16 };
  function overviewFrame(building, viewW, viewH, insets) {
    const m = OVERVIEW_MARGIN;
    const r = { x: building.x - TILE / 2, y: building.y - 1.5 * TILE, w: building.w + TILE, h: building.h + 3.5 * TILE };
    const freeW = Math.max(80, viewW - insets.left - insets.right - 2 * m.side);
    const freeH = Math.max(80, viewH - insets.top - insets.bottom - m.top - m.bottom);
    return { zoom: Math.min(freeW / r.w, freeH / r.h), cx: r.x + r.w / 2, cy: r.y + r.h / 2, dy: (m.top - m.bottom) / 2 };
  }
  var ease = (t2) => t2 < 0.5 ? 4 * t2 * t2 * t2 : 1 - Math.pow(-2 * t2 + 2, 3) / 2;
  var Camera = class {
    x = 0;
    y = 0;
    zoom = 2;
    viewW = 800;
    viewH = 600;
    dpr = 1;
    /** Zoom mínimo dinâmico (permite enquadrar prédios grandes abaixo de 1×). */
    minZoom = ZOOM_MIN;
    bounds = { x: 0, y: 0, w: 800, h: 600 };
    follow = null;
    /** Margens cobertas pela UI (px CSS): enquadramentos usam só a área livre. */
    insets = { top: 0, right: 0, bottom: 0, left: 0 };
    anim = null;
    /** Zoom contínuo em andamento (pinça); ao terminar, encaixa num nível nítido. */
    freeZoom = false;
    setView(w, h, dpr) {
      this.viewW = Math.max(1, w);
      this.viewH = Math.max(1, h);
      this.dpr = dpr || 1;
    }
    get animating() {
      return this.anim !== null;
    }
    /** Níveis de zoom nítidos: zoom × dpr inteiro (e meio-inteiro acima de 2× no dpr 1). */
    levels() {
      const min = Math.min(this.minZoom, ZOOM_MIN);
      const set = /* @__PURE__ */ new Set();
      for (let k = 1; k <= ZOOM_MAX * this.dpr; k++) set.add(Math.round(k / this.dpr * 1e3) / 1e3);
      for (let h = 4; h <= ZOOM_MAX * 2; h++) set.add(h / 2);
      const out = [...set].filter((z) => z >= min - 1e-6 && z <= ZOOM_MAX + 1e-6).sort((a, b) => a - b);
      if (!out.length || out[0] > min + 1e-6) out.unshift(min);
      return out;
    }
    snapZoom(z, dir = "nearest") {
      const lv = this.levels();
      if (dir === "down") {
        let best2 = lv[0];
        for (const l of lv) if (l <= z + 1e-6) best2 = l;
        return best2;
      }
      if (dir === "up") {
        for (const l of lv) if (l >= z - 1e-6) return l;
        return lv[lv.length - 1];
      }
      let best = lv[0];
      for (const l of lv) if (Math.abs(l - z) < Math.abs(best - z)) best = l;
      return best;
    }
    /** Próximo nível acima/abaixo do zoom atual. */
    stepZoom(steps) {
      const lv = this.levels();
      const cur = this.anim ? this.anim.tz : this.zoom;
      let i = 0;
      for (let k = 0; k < lv.length; k++) if (Math.abs(lv[k] - cur) < Math.abs(lv[i] - cur)) i = k;
      return lv[Math.max(0, Math.min(lv.length - 1, i + steps))];
    }
    animateTo(x, y, zoom, now, dur = 400) {
      const tz = Math.max(Math.min(this.minZoom, ZOOM_MIN), Math.min(ZOOM_MAX, zoom));
      this.anim = { fx: this.x, fy: this.y, fz: this.zoom, tx: x, ty: y, tz, t0: now, dur };
    }
    stop() {
      this.anim = null;
    }
    /** Arrastar: desloca pelo equivalente em px CSS. */
    panBy(dx, dy) {
      this.anim = null;
      this.x -= dx / this.zoom;
      this.y -= dy / this.zoom;
      this.clamp();
    }
    /** Zoom ancorado num ponto da tela (CSS px). */
    zoomAt(newZoom, sx, sy, now, animate = true) {
      const z = Math.max(Math.min(this.minZoom, ZOOM_MIN), Math.min(ZOOM_MAX, newZoom));
      const wx = this.x + (sx - this.viewW / 2) / this.zoom;
      const wy = this.y + (sy - this.viewH / 2) / this.zoom;
      const nx = wx - (sx - this.viewW / 2) / z;
      const ny = wy - (sy - this.viewH / 2) / z;
      if (animate) this.animateTo(nx, ny, z, now, 160);
      else {
        this.anim = null;
        this.x = nx;
        this.y = ny;
        this.zoom = z;
        this.freeZoom = true;
        this.clamp();
      }
    }
    /** Encaixa o zoom contínuo (pinça) no nível nítido mais próximo. */
    settle(now) {
      if (!this.freeZoom) return;
      this.freeZoom = false;
      this.zoomAt(this.snapZoom(this.zoom), this.viewW / 2, this.viewH / 2, now, true);
    }
    update(now, followTarget, dt) {
      if (this.anim) {
        const a = this.anim;
        const t2 = Math.min(1, (now - a.t0) / a.dur);
        const k = ease(t2);
        this.zoom = a.fz + (a.tz - a.fz) * k;
        this.x = a.fx + (a.tx - a.fx) * k;
        this.y = a.fy + (a.ty - a.fy) * k;
        if (t2 >= 1) this.anim = null;
      } else if (followTarget) {
        const k = 1 - Math.exp(-dt * 6);
        this.x += (followTarget.x - this.x) * k;
        this.y += (followTarget.y - this.y) * k;
      }
      this.clamp();
    }
    /** Mantém a área livre (fora dos painéis da UI) dentro dos limites; se couber inteira, centraliza. */
    clamp() {
      const b = this.bounds;
      const z = this.zoom;
      const ins = this.insets;
      const l = (-this.viewW / 2 + ins.left) / z;
      const r = (this.viewW / 2 - ins.right) / z;
      const t2 = (-this.viewH / 2 + ins.top) / z;
      const btm = (this.viewH / 2 - ins.bottom) / z;
      if (b.w <= r - l) this.x = b.x + b.w / 2 - (l + r) / 2;
      else this.x = Math.max(b.x - l, Math.min(b.x + b.w - r, this.x));
      if (b.h <= btm - t2) this.y = b.y + b.h / 2 - (t2 + btm) / 2;
      else this.y = Math.max(b.y - t2, Math.min(b.y + b.h - btm, this.y));
    }
    /** Transformação para o contexto em px de dispositivo, com deslocamento inteiro (sem tremido). */
    transform() {
      const scale = this.zoom * this.dpr;
      const ox = Math.round(this.viewW * this.dpr / 2 - this.x * scale);
      const oy = Math.round(this.viewH * this.dpr / 2 - this.y * scale);
      return { scale, ox, oy };
    }
    worldToScreen(wx, wy) {
      const { scale, ox, oy } = this.transform();
      return { x: (wx * scale + ox) / this.dpr, y: (wy * scale + oy) / this.dpr };
    }
    screenToWorld(sx, sy) {
      const { scale, ox, oy } = this.transform();
      return { x: (sx * this.dpr - ox) / scale, y: (sy * this.dpr - oy) / scale };
    }
    /** Zoom que enquadra um retângulo do mundo com margem (CSS px), dentro da área livre. */
    fitZoom(r, margin = 24) {
      const w = Math.max(80, this.viewW - this.insets.left - this.insets.right);
      const h = Math.max(80, this.viewH - this.insets.top - this.insets.bottom);
      return Math.min((w - margin * 2) / r.w, (h - margin * 2) / r.h);
    }
    /** Centro de câmera que põe o ponto (wx, wy) no meio da área livre, para um dado zoom. */
    centerFor(wx, wy, zoom) {
      return { x: wx - (this.insets.left - this.insets.right) / 2 / zoom, y: wy - (this.insets.top - this.insets.bottom) / 2 / zoom };
    }
  };

  // vendor/habblaud/upstream/shared/activity.ts
  var MAX_TEXT = 46;
  var MAX_DETAIL = 300;
  function truncate(s, n) {
    const one = s.replace(/\s+/g, " ").trim();
    return one.length > n ? `${one.slice(0, Math.max(1, n - 1)).trimEnd()}\u2026` : one;
  }
  function make(kind, icon, text, detail) {
    return {
      kind,
      icon,
      text: truncate(maskSecrets(text.slice(0, MAX_TEXT * 8)), MAX_TEXT),
      ...detail ? { detail: truncate(maskSecrets(detail.slice(0, MAX_DETAIL * 4)), MAX_DETAIL) } : {}
    };
  }
  var SECRET_PATTERNS = [
    // Blocos de chave privada (PEM).
    [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g, tr("[chave privada]")],
    // Cabeçalhos com credenciais: Authorization, Cookie, X-Api-Key...
    [/\b(authorization|proxy-authorization|cookie|set-cookie|x-api-key|api-key|x-auth-token|private-token)(\s*:\s*)[^'"\n]+/gi, "$1$2***"],
    // Bearer/Basic/Token <valor> soltos.
    [/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{6,}/g, "$1 ***"],
    // URL com usuário:senha.
    [/(\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/'"]+:)[^\s@/'"]+@/gi, "$1***@"],
    // Webhook: o host fica, o caminho com o segredo sai.
    [/(\bhttps?:\/\/hooks\.slack\.com\/services\/)T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]+/gi, "$1***"],
    [/(\bhttps?:\/\/(?:discordapp|discord)\.com\/api\/webhooks\/)\d+\/[A-Za-z0-9_-]+/gi, "$1***"],
    [/(\bhttps?:\/\/api\.telegram\.org\/bot)\d+:[A-Za-z0-9_-]+/gi, "$1***"],
    // curl -u usuario:senha / --user usuario:senha.
    [/((?:^|\s)(?:-u|--user)\s+['"]?[^\s:'"]+:)[^\s'"]+/g, "$1***"],
    // --token X, --password=X, --api-key X...
    [/((?:^|\s)--?(?:token|password|passwd|pass|secret|api-key|apikey|access-token|auth-token)(?:\s+|=))(['"]?)[^\s'"]+\2/gi, "$1$2***$2"],
    // NOME_SENSIVEL=valor / "password": "valor" (GITHUB_TOKEN, DB_PASSWORD, client_secret, api_key...).
    [
      /\b([A-Za-z0-9_.-]*?(?:token|secret|passw(?:or)?d|pwd|api[_-]?key|access[_-]?key|private[_-]?key|_key|credentials?))(["']?\s*[=:]\s*)(["']?)([^\s"'&;|,}]+)\3/gi,
      "$1$2$3***$3"
    ],
    // Chaves com prefixo conhecido.
    [/\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{8,}/g, "sk-***"],
    [/\bgh[pousr]_[A-Za-z0-9]{16,}/g, "gh*_***"],
    [/\bgithub_pat_[A-Za-z0-9_]{16,}/g, "github_pat_***"],
    [/\bglpat-[A-Za-z0-9_-]{16,}/g, "glpat-***"],
    [/\bxox[abposr]-[A-Za-z0-9-]{8,}/g, "xox*-***"],
    [/\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, "AKIA***"],
    [/\bAIza[0-9A-Za-z_-]{30,}/g, "AIza***"],
    [/\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{10,}/g, "sk_***"],
    // Token solto do npm e do Hugging Face (tamanho de token real; "npm test" e "hf" ficam).
    [/\bnpm_[A-Za-z0-9]{30,}/g, "npm_***"],
    [/\bhf_[A-Za-z0-9]{30,}/g, "hf_***"],
    // JWT.
    [/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, "eyJ***"]
  ];
  function maskSecrets(s) {
    let out = s;
    for (const [re, rep] of SECRET_PATTERNS) out = out.replace(re, rep);
    return out;
  }
  var GIT_TEXT = {
    commit: ["\u{1F4E6}", tr("Fazendo commit")],
    push: ["\u{1F680}", tr("Enviando commits (git push)")],
    pull: ["\u2B07\uFE0F", tr("Atualizando do remoto (git pull)")],
    fetch: ["\u2B07\uFE0F", tr("Buscando do remoto (git fetch)")],
    checkout: ["\u{1F33F}", tr("Trocando de branch")],
    switch: ["\u{1F33F}", tr("Trocando de branch")],
    merge: ["\u{1F500}", tr("Fazendo merge")],
    rebase: ["\u{1F500}", tr("Fazendo rebase")],
    status: ["\u{1F33F}", tr("Conferindo o git status")],
    diff: ["\u{1F33F}", tr("Conferindo as mudan\xE7as (diff)")],
    show: ["\u{1F33F}", tr("Olhando um commit (git show)")],
    log: ["\u{1F33F}", tr("Lendo o hist\xF3rico do git")],
    add: ["\u{1F33F}", tr("Preparando arquivos (git add)")],
    stash: ["\u{1F33F}", tr("Guardando mudan\xE7as (stash)")],
    clone: ["\u2B07\uFE0F", tr("Clonando reposit\xF3rio")],
    branch: ["\u{1F33F}", tr("Conferindo as branches")],
    worktree: ["\u{1F33F}", tr("Mexendo nas worktrees")],
    reset: ["\u{1F33F}", tr("Desfazendo mudan\xE7as (git reset)")],
    restore: ["\u{1F33F}", tr("Restaurando arquivos (git restore)")],
    tag: ["\u{1F3F7}\uFE0F", tr("Mexendo nas tags")],
    blame: ["\u{1F33F}", tr("Vendo quem mudou cada linha")],
    "cherry-pick": ["\u{1F352}", tr("Trazendo um commit (cherry-pick)")]
  };
  function formatDuration(ms) {
    const s = Math.round(ms / 1e3);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}min${s % 60 ? ` ${s % 60}s` : ""}`;
    return `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}min` : ""}`;
  }
  var SHELL_DONE_TOOL = "ShellDone";
  var SHELL_WAIT_TOOL = "ShellWait";
  function fitLabel(prefix, label, suffix = "") {
    if (!label) return `${prefix.replace(/:\s*$/, "")}${suffix}`;
    const room = Math.max(8, MAX_TEXT - prefix.length - suffix.length);
    return `${prefix}${truncate(label, room)}${suffix}`;
  }
  var SPECIAL = {
    think: () => make("think", "\u{1F4AD}", tr("Pensando\u2026")),
    respond: (text) => make("respond", "\u{1F4AC}", tr("Escrevendo a resposta"), text),
    turnDone: (ms) => make("done", "\u2705", ms ? tr("Concluiu em {0}", [formatDuration(ms)]) : tr("Concluiu")),
    error: (tool, detail) => make("error", "\u26A0\uFE0F", tool ? tr("Erro em {0}", [tool]) : tr("Algo deu errado"), detail),
    interrupted: () => make("wait", "\u270B", tr("Interrompido por voc\xEA")),
    compact: () => make("compact", "\u{1F9F9}", tr("Organizando a mem\xF3ria (compactando)")),
    waiting: (reason) => make("wait", "\u270B", reason ? tr("Precisa de voc\xEA: {0}", [reason]) : tr("Precisa de voc\xEA")),
    backgroundResult: (summary) => make("other", "\u{1F4EC}", tr("Recebeu resultado em segundo plano"), summary),
    apiRetry: () => make("wait", "\u{1F501}", tr("Instabilidade na API, tentando de novo")),
    rejected: (tool) => make("wait", "\u{1F6AB}", tool ? tr("Voc\xEA recusou: {0}", [tool]) : tr("Voc\xEA recusou a a\xE7\xE3o")),
    cleared: () => make("compact", "\u{1F9FD}", tr("Come\xE7ou uma conversa nova (/clear)")),
    supervising: () => make("delegate", "\u{1F465}", tr("Acompanhando os subagentes")),
    answered: (question) => make("ask", "\u{1F4AC}", tr("Recebeu a sua resposta"), question),
    /** Balão do status 'shell': "Esperando o shell: <rótulo>" (ou "Esperando 2 shells: ..."). */
    waitingShell: (label, n = 1, detail) => ({
      ...make("wait", "\u23F3", fitLabel(n > 1 ? tr("Esperando {0} shells: ", [n]) : tr("Esperando o shell: "), label), detail),
      tool: SHELL_WAIT_TOOL
    }),
    /**
     * Fim de um shell em segundo plano (marcador 'ShellDone'): sucesso "Shell terminou: <rótulo> (<duração>)",
     * falha "Shell falhou: <rótulo>" e morto "Shell interrompido: <rótulo>" (os dois com `error`).
     */
    shellDone: (label, outcome, ms, detail) => {
      if (outcome === "failed") return { ...make("run", "\u274C", fitLabel(tr("Shell falhou: "), label), detail), tool: SHELL_DONE_TOOL, error: true };
      if (outcome === "killed") return { ...make("run", "\u{1F6D1}", fitLabel(tr("Shell interrompido: "), label), detail), tool: SHELL_DONE_TOOL, error: true };
      const took = ms !== void 0 && ms >= 1e3 ? ` (${formatDuration(ms)})` : "";
      return { ...make("run", "\u2705", fitLabel(tr("Shell terminou: "), label, took), detail), tool: SHELL_DONE_TOOL };
    }
  };

  // vendor/habblaud/upstream/client/src/world/sim/shell.ts
  var SHELL_DONE_TOOL2 = "ShellDone";
  var SHELL_RESTLESS_MS = 3 * 6e4;
  var SHELL_COBWEB_MS = 10 * 6e4;
  var SHELL_COBWEB_BIG_MS = 20 * 6e4;
  var SHELL_NAP_MS = 25 * 6e4;
  var FOREGROUND_WAIT_MS = 1e4;
  var SPIN_MS = 800;
  var SPIN_GAP_MIN_MS = 15e3;
  var SPIN_GAP_MAX_MS = 25e3;
  var SPIN_FIRST_MS = 2500;
  var YAWN_MS = 1300;
  var YAWN_GAP_MIN_MS = 18e3;
  var YAWN_GAP_MAX_MS = 32e3;
  var YAWN_FIRST_MS = 4e3;
  var STORM_LIFT = 3;
  var HOURGLASS_FLIP_MS = 1200;
  var SHELL_BUBBLE_ENTER_MS = 6e3;
  var SHELL_BUBBLE_EVERY_MS = 3e4;
  var SHELL_BUBBLE_SHOW_MS = 4e3;
  var BUBBLE_FADE_IN_MS = 150;
  var BUBBLE_FADE_OUT_MS = 400;
  function shellStage(ageMs) {
    if (ageMs >= SHELL_NAP_MS) return "nap";
    if (ageMs >= SHELL_COBWEB_MS) return "cobweb";
    if (ageMs >= SHELL_RESTLESS_MS) return "restless";
    return "popcorn";
  }
  function cobwebScale(ageMs) {
    if (ageMs < SHELL_COBWEB_MS) return 0;
    return ageMs >= SHELL_COBWEB_BIG_MS ? 2 : 1;
  }
  function hourglassIcon(now) {
    return Math.floor(now / HOURGLASS_FLIP_MS) % 2 ? "hourglass_flip" : "hourglass";
  }
  function counts(j, foregroundOnly) {
    return !foregroundOnly || j.background === false;
  }
  function oldestShell(shells, foregroundOnly) {
    if (!shells) return null;
    let best = null;
    for (const j of shells) {
      if (!counts(j, foregroundOnly) || !Number.isFinite(j.startedAt)) continue;
      if (!best || j.startedAt < best.startedAt) best = j;
    }
    return best;
  }
  function countShells(shells, foregroundOnly) {
    if (!shells) return 0;
    let n = 0;
    for (const j of shells) if (counts(j, foregroundOnly)) n++;
    return n;
  }
  function foregroundWaiting(shells, now) {
    const j = oldestShell(shells, true);
    return !!j && now - j.startedAt > FOREGROUND_WAIT_MS;
  }
  function shellWaitSince(a) {
    const j = oldestShell(a.shells, a.status !== "shell");
    return j ? j.startedAt : a.statusSince;
  }
  function shellLabel(a) {
    const fg = a.status !== "shell";
    const j = oldestShell(a.shells, fg);
    const label = j?.label?.trim();
    if (label) return label;
    if (j?.kind === "monitor") return tr("Monitorando um processo");
    return fg ? tr("Comando no terminal") : tr("Comando em segundo plano");
  }
  function latestShellDone(a) {
    let best = a.activity?.tool === SHELL_DONE_TOOL2 ? a.activity : null;
    const recent = a.recent;
    if (recent) {
      for (let i = recent.length - 1; i >= 0; i--) {
        const r = recent[i];
        if (r.tool === SHELL_DONE_TOOL2 && (!best || r.at > best.at)) best = r;
      }
    }
    return best;
  }
  function formatShellAge(ms) {
    const s = Math.max(0, Math.floor(ms / 1e3));
    if (s < 60) return `${s} s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h} h ${mm < 10 ? "0" : ""}${mm}`;
  }
  function shellAgeKey(ms) {
    const s = Math.max(0, Math.floor(ms / 1e3));
    return s < 60 ? s : 60 + Math.floor(s / 60);
  }
  function shellBubbleText(label, ageMs) {
    return `${label} \xB7 ${formatShellAge(ageMs)}`;
  }
  function shellBubbleAlpha(ms, offsetMs = 0) {
    if (ms < 0) return 0;
    if (ms < SHELL_BUBBLE_ENTER_MS) return windowAlpha(ms, SHELL_BUBBLE_ENTER_MS);
    const off = (offsetMs % SHELL_BUBBLE_EVERY_MS + SHELL_BUBBLE_EVERY_MS) % SHELL_BUBBLE_EVERY_MS;
    const t2 = ms - SHELL_BUBBLE_EVERY_MS - off;
    if (t2 < 0) return 0;
    const inCycle = t2 % SHELL_BUBBLE_EVERY_MS;
    return inCycle < SHELL_BUBBLE_SHOW_MS ? windowAlpha(inCycle, SHELL_BUBBLE_SHOW_MS) : 0;
  }
  function windowAlpha(t2, len) {
    return Math.max(0, Math.min(1, t2 / BUBBLE_FADE_IN_MS, (len - t2) / BUBBLE_FADE_OUT_MS));
  }
  function unitHash(seed, k, salt) {
    let h = (seed ^ Math.imul(k + 1, 2654435761) ^ Math.imul(salt, 2246822519)) >>> 0;
    h ^= h >>> 16;
    h = Math.imul(h, 2146121005);
    h ^= h >>> 15;
    h = Math.imul(h, 2221713035);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function periodicPhase(ageMs, fromMs, toMs, firstMs, gapMin, gapMax, durMs, seed, salt) {
    if (ageMs < fromMs || ageMs >= toMs) return -1;
    let t2 = fromMs + firstMs;
    for (let k = 0; t2 <= ageMs && k < 1e4; k++) {
      if (ageMs < t2 + durMs) return (ageMs - t2) / durMs;
      t2 += gapMin + unitHash(seed, k, salt) * (gapMax - gapMin);
    }
    return -1;
  }
  function spinPhase(ageMs, seed) {
    return periodicPhase(ageMs, SHELL_RESTLESS_MS, SHELL_COBWEB_MS, SPIN_FIRST_MS, SPIN_GAP_MIN_MS, SPIN_GAP_MAX_MS, SPIN_MS, seed, 1);
  }
  function yawnPhase(ageMs, seed) {
    return periodicPhase(ageMs, SHELL_COBWEB_MS, SHELL_NAP_MS, YAWN_FIRST_MS, YAWN_GAP_MIN_MS, YAWN_GAP_MAX_MS, YAWN_MS, seed, 2);
  }
  var CLOCKWISE = ["up", "right", "down", "left"];
  function spinDir(phase, base) {
    if (phase < 0) return base;
    const i = CLOCKWISE.indexOf(base);
    const q = Math.min(3, Math.floor(phase * 4));
    return CLOCKWISE[(i + q + 1) % 4];
  }

  // vendor/habblaud/upstream/client/src/world/debug.ts
  var NAMES = ["Lia", "Ot\xE1vio", "Bruna", "Caio", "Iara", "Rui", "Nina", "Davi", "Tais", "Ivo"];
  function createDebug(sim, renderer, camera, onCameraMoved) {
    let seq = 0;
    const now = () => Date.now();
    const reapply = () => sim.reapply(now());
    const freeSlot = () => {
      const used = new Set([...sim.rooms.values()].map((r) => r.slot));
      for (const r of sim.injected.rooms) used.add(r.slot);
      let s = 0;
      while (used.has(s)) s++;
      return s;
    };
    const makeAgent = (base) => {
      const t2 = now();
      return {
        look: seq % 2 ? "f" : "m",
        role: base.kind === "main" ? "Agente principal" : "Explore",
        status: "working",
        recent: [],
        tasks: base.kind === "main" ? [{ id: "1", title: "Testar o mundo", status: "in_progress" }, { id: "2", title: "Revisar", status: "pending" }] : [],
        startedAt: t2,
        lastEventAt: t2,
        statusSince: t2,
        stats: { toolCalls: 0, tokensIn: 0, tokensOut: 0, subagents: 0 },
        seed: hash32(base.id),
        activity: { id: `dbg-act-${++seq}`, kind: "edit", icon: "\u270F\uFE0F", text: "Editando world.ts", at: t2 },
        ...base
      };
    };
    const makeJobs = (jobs) => jobs.map((j) => ({
      id: j.id ?? `bdbg${(++seq).toString(36)}`,
      label: j.label ?? "Rodar a su\xEDte de testes",
      command: j.command ?? "npm test",
      startedAt: j.startedAt ?? now() - (j.ageMinutes ?? 0) * 6e4 - (j.ageSeconds ?? 0) * 1e3,
      background: j.background ?? true,
      kind: j.kind ?? "shell"
    }));
    const statusFor = (cur, shells) => {
      if (cur === "waiting" || cur === "offline" || cur === "done") return cur;
      if (shells.some((j) => j.background)) return "shell";
      if (shells.length) return "working";
      return cur === "shell" ? "idle" : cur;
    };
    const editAgent = (id, fn) => {
      const i = sim.injected.agents.findIndex((x) => x.id === id);
      if (i >= 0) {
        const a2 = { ...sim.injected.agents[i] };
        fn(a2);
        sim.injected.agents[i] = a2;
        return true;
      }
      const ch = sim.chars.get(id);
      if (!ch) return false;
      const a = { ...ch.info };
      fn(a);
      const patch = { ...sim.agentPatches.get(id) };
      for (const k of ["status", "statusSince", "shells", "activity"]) if (a[k] !== ch.info[k]) Object.assign(patch, { [k]: a[k] });
      sim.agentPatches.set(id, patch);
      return true;
    };
    const applyShells = (a, shells) => {
      const status = statusFor(a.status, shells);
      if (status !== a.status) a.statusSince = now();
      a.status = status;
      a.shells = shells;
      const oldest = oldestShell(shells, false);
      if (status === "shell" && oldest) a.statusSince = Math.min(a.statusSince, oldest.startedAt);
    };
    return {
      state: () => ({
        cols: sim.building.cols,
        camera: { x: Math.round(camera.x), y: Math.round(camera.y), zoom: camera.zoom },
        rooms: [...sim.rooms.values()].map((r) => ({
          id: r.id,
          name: r.info.name,
          slot: r.slot,
          phase: r.phase,
          listed: r.listed,
          lightOn: r.lightOn,
          light: Math.round(r.light(now()) * 100) / 100,
          occupants: sim.occupants(r)
        })),
        chars: [...sim.chars.values()].map((c) => ({
          id: c.id,
          name: c.info.name,
          kind: c.info.kind,
          status: c.info.status,
          mode: c.mode,
          step: c.step?.t ?? null,
          queue: c.queue.map((s) => s.t),
          tile: [c.tx, c.ty],
          room: c.roomId,
          spot: c.atSpot,
          leaving: c.leaving,
          pose: c.pose,
          held: c.held,
          dir: c.dir,
          icon: c.icon,
          shell: c.mode === "shell" ? { stage: c.shellStage, count: c.shellCount, label: c.shellLabel, ageMin: Math.round((now() - c.shellSince) / 6e4 * 10) / 10 } : null
        }))
      }),
      spawnSession: (opts = {}) => {
        const project = opts.project ?? `projeto-teste-${seq + 1}`;
        let room = [...sim.rooms.values()].map((r) => r.info).find((r) => r.name === project) ?? sim.injected.rooms.find((r) => r.name === project);
        if (!room) {
          const id = `/debug/${project}`;
          room = { id, name: project, path: id, slot: freeSlot(), seed: hash32(id), createdAt: now() };
          sim.injected.rooms.push(room);
        }
        const n = ++seq;
        const sessionId = `dbg-sess-${n}`;
        const account = opts.account ?? [...sim.accounts.keys()][n % Math.max(1, sim.accounts.size)] ?? ".claude";
        const main = makeAgent({
          id: `dbg:${n}`,
          kind: "main",
          name: opts.name ?? NAMES[n % NAMES.length],
          roomId: room.id,
          account,
          sessionId,
          status: opts.status ?? "working",
          title: `Sess\xE3o de teste ${n}`
        });
        if (opts.shell) {
          const sh = opts.shell;
          const n2 = Math.max(1, Math.floor(sh.count ?? 1));
          const jobs = [];
          for (let i = 0; i < n2; i++) {
            jobs.push({
              label: i === 0 ? sh.label : `${sh.label ?? "Rodar a su\xEDte de testes"} (${i + 1})`,
              command: sh.command,
              // os demais começaram depois do primeiro
              ageMinutes: Math.max(0, (sh.ageMinutes ?? 0) - i * 0.5),
              background: sh.background ?? true,
              kind: sh.kind
            });
          }
          applyShells(main, makeJobs(jobs));
          main.activity = { id: `dbg-act-${++seq}`, kind: "run", icon: "\u{1F4BB}", text: "Rodando em segundo plano", tool: "Bash", at: now() };
        }
        sim.injected.agents.push(main);
        for (let i = 0; i < (opts.subs ?? 0); i++) {
          const k = ++seq;
          sim.injected.agents.push(
            makeAgent({ id: `${sessionId}:sub${k}`, kind: "sub", parentId: main.id, name: NAMES[k % NAMES.length], roomId: room.id, account, sessionId, title: "Investigar o bug" })
          );
        }
        reapply();
        return main.id;
      },
      setStatus: (id, status, waitingFor) => {
        const i = sim.injected.agents.findIndex((x) => x.id === id);
        if (i < 0) return;
        const a = { ...sim.injected.agents[i] };
        sim.injected.agents[i] = a;
        a.status = status;
        a.statusSince = now();
        a.waitingFor = status === "waiting" ? waitingFor ?? "aprovar uma permiss\xE3o" : void 0;
        a.activity = {
          id: `dbg-act-${++seq}`,
          kind: status === "idle" || status === "done" ? "done" : status === "waiting" ? "wait" : "run",
          icon: status === "idle" || status === "done" ? "\u2705" : status === "waiting" ? "\u270B" : "\u{1F4BB}",
          text: status === "idle" || status === "done" ? "Concluiu" : status === "waiting" ? "Precisa de voc\xEA" : "Rodando testes",
          at: now()
        };
        reapply();
      },
      endSession: (id) => {
        const main = sim.injected.agents.find((x) => x.id === id);
        sim.injected.agents = sim.injected.agents.filter((x) => x.id !== id && x.parentId !== id);
        if (main && !sim.injected.agents.some((x) => x.roomId === main.roomId)) sim.injected.rooms = sim.injected.rooms.filter((r) => r.id !== main.roomId);
        reapply();
      },
      closeSession: (id) => {
        sim.forcedOffline.add(id);
        for (const c of sim.chars.values()) if (c.info.parentId === id) sim.forcedOffline.add(c.id);
        reapply();
      },
      closeRoom: (roomId) => {
        for (const c of sim.chars.values()) if (c.roomId === roomId) sim.forcedOffline.add(c.id);
        sim.hiddenRooms.add(roomId);
        reapply();
      },
      reset: () => {
        sim.agentPatches.clear();
        sim.forcedOffline.clear();
        sim.hiddenRooms.clear();
        sim.injected.agents = [];
        sim.injected.rooms = [];
        reapply();
      },
      setHour: (h) => {
        renderer.hourOverride = h;
      },
      lookAt: (tx, ty, zoom) => {
        onCameraMoved();
        camera.follow = null;
        camera.stop();
        camera.x = tx * TILE;
        camera.y = ty * TILE;
        if (zoom) camera.zoom = zoom;
        camera.clamp();
      },
      lookAtRoom: (idOrName, zoom = 2.5) => {
        const room = [...sim.rooms.values()].find((r2) => r2.id === idOrName || r2.info.name === idOrName);
        if (!room) return;
        const r = room.layout.rect;
        onCameraMoved();
        camera.follow = null;
        camera.stop();
        camera.x = (r.x + r.w / 2) * TILE;
        camera.y = (r.y + r.h / 2) * TILE;
        camera.zoom = zoom;
        camera.clamp();
      },
      fastForward: () => sim.fastForward(now()),
      wanderNow: () => {
        for (const c of sim.chars.values()) c.nextOutingAt = 1;
      },
      socialize: (kind, ids) => {
        sim.fastForward(now());
        return sim.social.force(kind, now(), ids);
      },
      gatherings: () => [...sim.social.gatherings].map((g) => ({
        kind: g.kind,
        phase: g.phase,
        program: g.program,
        bet: g.bet,
        score: g.score,
        members: g.members.map((m) => ({ name: sim.chars.get(m.id)?.info.name ?? m.id, role: m.role, arrived: m.arrived, left: m.left, pose: m.pose }))
      })),
      coins: (id, delta) => {
        const w = sim.social.wallets.get(id);
        if (!w) return 0;
        if (delta > 0) sim.social.wallets.credit(id, delta, "\u{1F6E0}\uFE0F", "Ajuste (depura\xE7\xE3o)", now());
        else w.coins = Math.max(0, w.coins + delta);
        return w.coins;
      },
      setShells: (id, jobs) => {
        if (editAgent(id, (a) => applyShells(a, makeJobs(jobs)))) reapply();
      },
      ageShells: (minutes, agentId) => {
        const ms = minutes * 6e4;
        if (!Number.isFinite(ms) || !ms) return;
        const ids = agentId ? [agentId] : [...sim.injected.agents.map((a) => a.id), ...sim.agentPatches.keys()];
        for (const id of ids) {
          editAgent(id, (a) => {
            if (!a.shells?.length) return;
            a.shells = a.shells.map((j) => ({ ...j, startedAt: j.startedAt - ms }));
            if (a.status === "shell") a.statusSince -= ms;
          });
        }
        reapply();
      },
      finishShell: (id, result = "completed", opts = {}) => {
        const ok = result === "completed";
        const done = editAgent(id, (a) => {
          const shells = [...a.shells ?? []].sort((x, y) => x.startedAt - y.startedAt);
          const ended = opts.all ? shells : shells.slice(0, 1);
          const rest = opts.all ? [] : shells.slice(1);
          const t2 = now();
          const ms = ended[0] ? t2 - ended[0].startedAt : void 0;
          const outcome = ok ? "ok" : result === "killed" ? "killed" : "failed";
          const detail = ended.map((j) => j.command ?? j.label).join(" | ") || void 0;
          const activity = { id: `dbg-act-${++seq}`, at: t2, ...SPECIAL.shellDone(ended[0]?.label, outcome, ms, detail) };
          if (ok && ms !== void 0) activity.durationMs = ms;
          a.activity = activity;
          a.recent = [...a.recent ?? [], activity].slice(-30);
          a.shells = rest;
          const next = rest.some((j) => j.background) ? "shell" : rest.length ? "working" : opts.then ?? "working";
          if (next !== a.status) {
            a.status = next;
            a.statusSince = t2;
          }
        });
        if (done) reapply();
      },
      roomEffect: (idOrName, kind, opts = {}) => {
        const room = [...sim.rooms.values()].find((r) => r.id === idOrName || r.info.name === idOrName);
        if (!room) return;
        if (!kind) {
          sim.roomFx.active.delete(room.id);
          return;
        }
        const t2 = now();
        const text = opts.text ?? (kind === "party" ? "PR #12 mergeado!" : "CI falhou (main)");
        const agentId = opts.agentId ?? [...sim.chars.values()].find((c) => c.roomId === room.id && !c.leaving)?.id;
        const end = t2 + (kind === "party" ? 12e3 : 36e5);
        sim.roomFx.active.set(room.id, { roomId: room.id, kind, text, agentId, key: t2, start: t2, end, cheered: /* @__PURE__ */ new Set(), sticky: true });
      },
      sim,
      camera
    };
  }

  // vendor/habblaud/upstream/client/src/world/layout/builder.ts
  var SEAT_FOOT_DY = 3;
  var SEATED_SORT_BIAS = 0.25;
  var AreaBuilder = class {
    area;
    seq = 0;
    constructor(id, kind, rect) {
      this.area = { id, kind, rect, floors: [], rugs: [], walls: [], wallItems: [], furniture: [], spots: [], walkable: [] };
    }
    get x0() {
      return this.area.rect.x;
    }
    get y0() {
      return this.area.rect.y;
    }
    /** px absoluto de uma coordenada local em tiles (aceita frações). */
    px(lx) {
      return (this.x0 + lx) * TILE;
    }
    py(ly) {
      return (this.y0 + ly) * TILE;
    }
    floor(kind, lx, ly, w, h, seed, tint, tint2) {
      this.area.floors.push({ kind, x: this.px(lx), y: this.py(ly), w: w * TILE, h: h * TILE, seed, tint, tint2 });
      return this;
    }
    rug(lx, ly, w, h, color, seed) {
      this.area.rugs.push({ x: Math.round(this.px(lx)), y: Math.round(this.py(ly)), w: Math.round(w * TILE), h: Math.round(h * TILE), color, seed });
      return this;
    }
    /** Face da parede norte (2 tiles) entre lx e lx+w (tiles locais, aceita frações). */
    face(lx, w, style, doorways = [], ly = 0) {
      this.area.walls.push({ kind: "face", x: this.px(lx), y: this.py(ly), w: w * TILE, style, doorways: this.doors(doorways) });
      return this;
    }
    south(lx, w, ly, style, doorways = []) {
      this.area.walls.push({ kind: "south", x: this.px(lx), y: this.py(ly), w: w * TILE, style, doorways: this.doors(doorways) });
      return this;
    }
    cap(lx, ly, w, h, style) {
      this.area.walls.push({ kind: "cap", x: this.px(lx), y: this.py(ly), w: w * TILE, h: h * TILE, style });
      return this;
    }
    doors(list) {
      return list.length ? list.map((d) => ({ x: this.px(d.lx), w: d.w * TILE })) : void 0;
    }
    /** Item de parede centrado em `lcx` (tiles locais). `ly` = linha local do rodapé (default 2 = base da face norte). */
    wall(kind, lcx, variant, opts = {}) {
      const id = `${this.area.id}#w${this.seq++}:${kind}`;
      this.area.wallItems.push({
        id,
        kind,
        variant,
        cx: Math.round(this.px(lcx)),
        baseY: this.py(opts.ly ?? 2),
        on: opts.on ?? "face",
        order: opts.order ?? 0.5
      });
      return id;
    }
    /** Móvel de chão com o canto superior esquerdo do footprint em (lx, ly). */
    furn(kind, lx, ly, variant, opts = {}) {
      const id = `${this.area.id}#f${this.seq++}:${kind}`;
      const f = {
        id,
        kind,
        variant,
        tx: this.x0 + lx,
        ty: this.y0 + ly,
        dx: opts.dx,
        dy: opts.dy,
        order: opts.order ?? 0.5,
        seat: opts.seat
      };
      this.area.furniture.push(f);
      return id;
    }
    /** Spot com aproximação no tile local (lx, ly). Posição final padrão = pés no tile. */
    spot(kind, lx, ly, dir, opts = {}) {
      const tx = this.x0 + lx;
      const ty = this.y0 + ly;
      const s = {
        id: `${this.area.id}#s${this.seq++}:${kind}`,
        kind,
        areaId: this.area.id,
        tx,
        ty,
        x: opts.x ?? tx * TILE + FOOT_DX + (opts.dx ?? 0),
        y: opts.y ?? ty * TILE + FOOT_DY + (opts.dy ?? 0),
        dir,
        seated: opts.seated,
        furnitureId: opts.furnitureId,
        sortY: opts.sortY,
        group: opts.group,
        deskId: opts.deskId,
        rank: opts.rank,
        side: opts.side
      };
      this.area.spots.push(s);
      return s;
    }
    /**
     * Assento (cadeira, banqueta, poltrona...) no tile local (lx, ly). O personagem se aproxima
     * pelo próprio tile do assento e encaixa na posição do assento (com `dx` opcional em px).
     */
    seat(kind, furnitureKind, lx, ly, dir, variant, opts = {}) {
      const furnitureId = opts.noFurniture ? opts.furnitureId : this.furn(furnitureKind, lx, ly, variant, { dx: opts.dx, order: opts.order });
      const base = this.py(ly + 1);
      return this.spot(kind, lx, ly, dir, {
        ...opts,
        furnitureId,
        seated: true,
        x: this.px(lx) + TILE / 2 + (opts.dx ?? 0),
        y: base - SEAT_FOOT_DY + (opts.dy ?? 0),
        sortY: base + SEATED_SORT_BIAS
      });
    }
    walk(lx, ly, w, h) {
      this.area.walkable.push({ x: this.x0 + lx, y: this.y0 + ly, w, h });
      return this;
    }
    block(lx, ly, w, h) {
      (this.area.blocked ??= []).push({ x: this.x0 + lx, y: this.y0 + ly, w, h });
      return this;
    }
    build() {
      return this.area;
    }
  };
  function furnitureBlocks(kind) {
    const def = FURNITURE[kind];
    return def.mount === "floor" && def.blocks;
  }
  function furnitureIsSeat(kind) {
    const def = FURNITURE[kind];
    return def.mount === "floor" && !!def.seat;
  }

  // vendor/habblaud/upstream/client/src/world/layout/core.ts
  var RECEPTION_ID = "core:recepcao";
  var RESTROOM_ID = "core:banheiros";
  var CAFE_ID = "core:copa";
  var LOUNGE_ID = "core:lounge";
  var CORE_WALLS = {
    reception: { base: "#e9e5dc", trim: "#a88e6c", pattern: "wood_panel" },
    restroom: { base: "#dce8ee", trim: "#8fb0c0", pattern: "tiles" },
    cafe: { base: "#eef0ee", trim: "#9aa6ad", pattern: "plain" },
    cafeSplash: { base: "#d9dcdf", trim: "#8d969e", pattern: "marble" },
    lounge: { base: "#e6e2ea", trim: "#8f8aa3", pattern: "plain" },
    glass: { base: "#cfe6f0", trim: "#9fb9c6", pattern: "glass" }
  };
  var ELEVATOR_CX = [3, 6.5];
  function layoutReception() {
    const b = new AreaBuilder(RECEPTION_ID, "reception", { x: 0, y: NORTH_Y, w: COL_W, h: ROOM_H });
    const wall = CORE_WALLS.reception;
    b.floor("marble", 0, 0, 16, 12, 101);
    b.rug(1.5, 2.2, 6.5, 2.6, "#3d5a80", 102);
    b.rug(8.6, 6.4, 5.2, 3.2, "#b65f3a", 103);
    b.face(0.5, 15, wall);
    b.cap(0, 0, 0.5, 12, wall);
    b.cap(15.5, 0, 0.5, 12, wall);
    ELEVATOR_CX.forEach((cx, i) => {
      b.wall("elevator", cx, void 0, { order: 0.2 + i * 0.1 });
      const lx = Math.floor(cx - 0.5);
      b.spot("elevator", lx, 2, "up", { x: b.px(cx), y: b.py(2) + 2, group: `elevator:${i}` });
    });
    b.wall("sign", 11, void 0, { order: 0.9 });
    b.wall("clock", 8.15, void 0, { order: 0.7 });
    b.wall("painting", 14.25, void 0, { order: 0.6 });
    b.furn("plant_tall", 1, 2, "monstera", { order: 0.2 });
    b.furn("plant_tall", 14, 4, "ficus", { order: 0.21 });
    b.furn("reception_desk", 9, 5, void 0, { order: 0.4 });
    b.furn("plant_small", 12, 5, "flower", { order: 0.45 });
    b.furn("filing_cabinet", 8, 5, void 0, { order: 0.42 });
    b.seat("armchair", "armchair", 9, 8, "right", "right", { order: 0.6 });
    b.furn("coffee_table", 10, 8, void 0, { order: 0.58 });
    b.seat("armchair", "armchair", 12, 8, "left", "left", { order: 0.61 });
    b.furn("plant_tall", 14, 9, "palm", { order: 0.22 });
    const bench2 = b.furn("bench", 2, 7, void 0, { order: 0.5 });
    for (let i = 0; i < 2; i++) b.seat("bench", "bench", 2 + i, 7, "down", void 0, { noFurniture: true, furnitureId: bench2 });
    b.furn("plant_small", 4, 7, "fern", { order: 0.52 });
    b.furn("water_cooler", 1, 7, void 0, { order: 0.53 });
    b.spot("water", 1, 8, "up", { dy: -3 });
    for (const lx of [1, 2, 3, 12, 13, 14]) b.furn("glass_partition", lx, 11, "h", { order: 0.15 });
    b.walk(1, 2, 14, 10);
    b.spot("talk", 6, 9, "right", { group: "talk:recepcao", dx: -1 });
    b.spot("talk", 7, 9, "left", { group: "talk:recepcao", dx: 1 });
    const a = b.build();
    a.shade = void 0;
    return a;
  }
  function layoutRestroom() {
    const b = new AreaBuilder(RESTROOM_ID, "restroom", { x: 0, y: SOUTH_Y, w: COL_W, h: ROOM_H });
    const wall = CORE_WALLS.restroom;
    b.floor("tile_white", 0, 0, 16, 12, 201);
    b.rug(2, 3.15, 3, 0.85, "#6fa3b8", 202);
    b.face(0.5, 15, wall, [{ lx: 7, w: 2 }]);
    b.wall("door_frame", 8, void 0, { order: 0.05 });
    b.south(0.5, 15, 11, { ...wall, exterior: true });
    b.cap(0, 0, 0.5, 12, wall);
    b.cap(15.5, 0, 0.5, 12, wall);
    b.walk(1, 2, 14, 9);
    b.walk(7, 0, 2, 2);
    b.area.door = { x: 7, y: SOUTH_Y, w: 2, h: 2 };
    for (let i = 0; i < 3; i++) {
      b.wall("mirror", 2.5 + i, void 0, { order: 0.3 });
      b.furn("sink", 2 + i, 2, void 0, { order: 0.35 });
      b.spot("sink", 2 + i, 3, "up", { dy: -3 });
    }
    b.furn("trash_bin", 5, 2, void 0, { order: 0.4 });
    b.furn("plant_small", 1, 2, "fern", { order: 0.2 });
    b.wall("clock", 6, void 0, { order: 0.5 });
    for (let i = 0; i < 3; i++) {
      const lx = 9 + i * 2;
      const stall = b.furn("toilet_stall", lx, 2, void 0, { order: 0.3 + i * 0.05 });
      b.spot("stall", lx, 4, "up", { furnitureId: stall, x: b.px(lx + 1), y: b.py(4) - 3, sortY: b.py(4) - 0.5 });
    }
    b.wall("poster", 1.5, "cat", { order: 0.5 });
    b.furn("plant_small", 14, 6, "succulent", { order: 0.2 });
    b.furn("plant_tall", 1, 10, "ficus", { order: 0.21 });
    b.furn("plant_tall", 14, 10, "monstera", { order: 0.22 });
    const bench2 = b.furn("bench", 3, 9, void 0, { order: 0.5 });
    for (let i = 0; i < 2; i++) b.seat("bench", "bench", 3 + i, 9, "down", void 0, { noFurniture: true, furnitureId: bench2 });
    b.furn("trash_bin", 9, 10, void 0, { order: 0.6 });
    b.rug(2.5, 9.9, 3, 0.9, "#9cc3cf", 203);
    b.furn("plant_small", 1, 6, "flower", { order: 0.24 });
    b.furn("plant_small", 12, 10, "fern", { order: 0.25 });
    return b.build();
  }
  function layoutCafe() {
    const b = new AreaBuilder(CAFE_ID, "cafe", { x: COL_W, y: NORTH_Y, w: COL_W, h: ROOM_H });
    const wall = CORE_WALLS.cafe;
    b.floor("tile_check", 0, 0, 16, 12, 301);
    b.face(0.5, 9, CORE_WALLS.cafeSplash);
    b.face(9.5, 6, wall);
    b.cap(0, 0, 0.5, 12, wall);
    b.cap(15.5, 0, 0.5, 12, wall);
    b.furn("fridge", 1, 2, void 0, { order: 0.2 });
    b.spot("fridge", 1, 3, "up", { dy: -3 });
    b.furn("counter", 2, 2, "drawers", { order: 0.22 });
    b.furn("counter_sink", 3, 2, void 0, { order: 0.24 });
    b.spot("sink", 3, 3, "up", { dy: -3 });
    b.furn("counter", 4, 2, "plain", { order: 0.26 });
    for (const lx of [5, 6]) {
      const m = b.furn("coffee_machine", lx, 2, void 0, { order: 0.28 });
      b.spot("coffee", lx, 3, "up", { dy: -3, furnitureId: m });
    }
    b.furn("microwave", 7, 2, void 0, { order: 0.3 });
    b.furn("counter", 8, 2, "drawers", { order: 0.32 });
    b.wall("shelf_wall", 3, void 0, { order: 0.4 });
    b.wall("poster", 5.5, "coffee", { order: 0.45 });
    b.wall("clock", 7.5, void 0, { order: 0.6 });
    const vend = b.furn("vending_machine", 9, 2, void 0, { order: 0.34 });
    b.spot("snack", 9, 3, "up", { dy: -3, furnitureId: vend });
    b.furn("water_cooler", 10, 2, void 0, { order: 0.36 });
    b.spot("water", 10, 3, "up", { dy: -3 });
    b.wall("window", 12, void 0, { order: 0.4 });
    b.wall("window", 14.25, void 0, { order: 0.45 });
    b.spot("window", 11, 2, "up", { dx: 8, dy: 1 });
    b.spot("window", 13, 2, "up", { dx: 12, dy: 1 });
    b.rug(2.6, 4.15, 8.8, 3.7, "#b98a5e", 302);
    b.furn("meeting_table", 4, 5, void 0, { order: 0.5 });
    b.furn("meeting_table", 7, 5, void 0, { order: 0.51 });
    for (let i = 0; i < 6; i++) {
      const lx = 4 + i;
      b.seat("cafe_seat", "cafe_chair", lx, 4, "down", "down", { order: 0.55 + i * 0.01 });
      b.seat("cafe_seat", "cafe_chair", lx, 7, "up", "up", { order: 0.62 + i * 0.01 });
    }
    b.furn("plant_small", 3, 5, "flower", { order: 0.52 });
    for (const [lx, ly, i] of [
      [12, 5, 0],
      [12, 8, 1]
    ]) {
      b.furn("cafe_table", lx, ly, void 0, { order: 0.7 + i * 0.03 });
      b.seat("cafe_seat", "cafe_chair", lx - 1, ly, "right", "right", { order: 0.72 + i * 0.03 });
      b.seat("cafe_seat", "cafe_chair", lx + 1, ly, "left", "left", { order: 0.73 + i * 0.03 });
    }
    b.furn("plant_tall", 1, 10, "monstera", { order: 0.2 });
    b.furn("plant_tall", 14, 10, "ficus", { order: 0.21 });
    b.furn("trash_bin", 1, 6, void 0, { order: 0.6 });
    for (const lx of [1, 2, 3, 4, 5, 10, 11, 12, 13, 14]) b.furn("glass_partition", lx, 11, "h", { order: 0.15 });
    b.walk(1, 2, 14, 10);
    b.spot("talk", 7, 9, "right", { group: "talk:copa", dx: -1 });
    b.spot("talk", 8, 9, "left", { group: "talk:copa", dx: 1 });
    b.area.shade = void 0;
    return b.build();
  }
  function layoutLounge() {
    const b = new AreaBuilder(LOUNGE_ID, "lounge", { x: COL_W, y: SOUTH_Y, w: COL_W, h: ROOM_H });
    const wall = CORE_WALLS.lounge;
    b.floor("wood", 0, 0, 16, 12, 401);
    b.rug(1.5, 3.2, 7, 5.2, "#4f8a5b", 402);
    b.rug(9.2, 4.6, 5.6, 4.4, "#d7c8a8", 403);
    b.face(0.5, 6.5, wall);
    b.face(10, 5.5, CORE_WALLS.glass);
    b.south(0.5, 15, 11, { ...wall, exterior: true });
    b.cap(0, 0, 0.5, 12, wall);
    b.cap(15.5, 0, 0.5, 12, wall);
    b.walk(1, 2, 14, 9);
    b.walk(7, 0, 3, 2);
    b.area.door = { x: COL_W + 7, y: SOUTH_Y, w: 3, h: 2 };
    b.wall("tv", 4.5, void 0, { order: 0.4 });
    b.wall("painting", 1.75, void 0, { order: 0.5 });
    const sofa2 = b.furn("sofa", 3, 6, "up", { order: 0.5 });
    for (let i = 0; i < 3; i++) b.seat("sofa", "sofa", 3 + i, 6, "up", "up", { noFurniture: true, furnitureId: sofa2 });
    b.furn("coffee_table", 3, 4, void 0, { dx: TILE / 2, order: 0.45 });
    b.block(5, 4, 1, 1);
    b.seat("armchair", "armchair", 2, 4, "right", "right", { order: 0.55 });
    b.seat("armchair", "armchair", 6, 4, "left", "left", { order: 0.56 });
    b.furn("pingpong_table", 10, 6, void 0, { order: 0.4 });
    const ppY = b.py(7) + 5;
    const ppSort = b.py(8) + SEATED_SORT_BIAS;
    b.spot("pingpong", 9, 7, "right", { x: b.px(10) - 8, y: ppY, group: "pingpong", sortY: ppSort });
    b.spot("pingpong", 13, 7, "left", { x: b.px(13) + 8, y: ppY, group: "pingpong", sortY: ppSort });
    for (const lx of [13, 14]) {
      b.furn("arcade", lx, 2, void 0, { order: 0.3 });
      b.spot("arcade", lx, 3, "up", { dy: -3 });
    }
    b.furn("bookshelf", 10, 2, void 0, { order: 0.3 });
    b.spot("shelf", 10, 3, "up", { dx: 8, dy: -2 });
    b.furn("binder_shelf", 12, 2, void 0, { order: 0.31 });
    b.furn("plant_small", 1, 2, "fern", { order: 0.2 });
    b.furn("plant_tall", 6, 2, "palm", { order: 0.21 });
    b.furn("printer", 1, 10, void 0, { order: 0.3 });
    b.furn("floor_lamp", 1, 7, void 0, { order: 0.32 });
    b.furn("plant_tall", 14, 10, "monstera", { order: 0.22 });
    ["red", "blue", "yellow"].forEach((c, i) => {
      b.seat("beanbag", "beanbag", 6 + i * 2, 9, "down", c, { order: 0.6 + i * 0.02 });
    });
    b.spot("talk", 11, 9, "right", { group: "talk:lounge", dx: -1 });
    b.spot("talk", 12, 9, "left", { group: "talk:lounge", dx: 1 });
    b.spot("watch", 10, 5, "down", { group: "watch:pingpong", dx: 2 });
    b.spot("watch", 12, 5, "down", { group: "watch:pingpong", dx: -2 });
    return b.build();
  }

  // vendor/habblaud/upstream/client/src/world/layout/geometry.ts
  function slotColumn(slot) {
    return CORE_COLS + Math.floor(Math.max(0, slot) / 2);
  }
  function slotSide(slot) {
    return Math.max(0, slot) % 2 === 0 ? "north" : "south";
  }
  function cellRect(col, side) {
    return { x: col * COL_W, y: side === "north" ? NORTH_Y : SOUTH_Y, w: COL_W, h: ROOM_H };
  }
  function slotRect(slot) {
    return cellRect(slotColumn(slot), slotSide(slot));
  }
  function slotAt(col, side) {
    return (col - CORE_COLS) * 2 + (side === "north" ? 0 : 1);
  }
  function columnsFor(slots) {
    let maxCol = 0;
    for (const s of slots) maxCol = Math.max(maxCol, Math.floor(Math.max(0, s) / 2));
    return CORE_COLS + maxCol + 1;
  }
  function buildingRect(cols) {
    return { x: 0, y: 0, w: cols * COL_W, h: BUILDING_H };
  }
  function inRect(r, tx, ty) {
    return tx >= r.x && ty >= r.y && tx < r.x + r.w && ty < r.y + r.h;
  }

  // vendor/habblaud/upstream/client/src/world/input.ts
  var DRAG_THRESHOLD = 5;
  var PAN_KEY_STEP = 90;
  function modalOpen(target) {
    if (target?.closest?.('dialog, [popover], [role="dialog"], [aria-modal="true"]')) return true;
    if (typeof document === "undefined") return false;
    if (document.querySelector('dialog[open], :not(dialog)[aria-modal="true"]')) return true;
    try {
      return !!document.querySelector(":popover-open");
    } catch {
      return false;
    }
  }
  function attachInput(canvas2, camera, h) {
    const pointers = /* @__PURE__ */ new Map();
    let downX = 0;
    let downY = 0;
    let dragging = false;
    let pinch = null;
    let wheelAcc = 0;
    let wheelSettle = null;
    let lastTap = { t: 0, x: 0, y: 0 };
    canvas2.style.touchAction = "none";
    canvas2.style.cursor = "grab";
    const local = (e) => {
      const r = canvas2.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onDown = (e) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      const p = local(e);
      pointers.set(e.pointerId, p);
      try {
        canvas2.setPointerCapture(e.pointerId);
      } catch {
      }
      if (pointers.size === 1) {
        downX = p.x;
        downY = p.y;
        dragging = false;
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, zoom: camera.zoom, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
        dragging = true;
        h.interact();
      }
    };
    const onMove = (e) => {
      const p = local(e);
      const prev = pointers.get(e.pointerId);
      if (!prev) {
        if (e.pointerType === "mouse") h.hover(p.x, p.y, true);
        return;
      }
      pointers.set(e.pointerId, p);
      if (pinch && pointers.size >= 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const cx = (a.x + b.x) / 2;
        const cy = (a.y + b.y) / 2;
        camera.panBy(cx - pinch.cx, cy - pinch.cy);
        camera.zoomAt(pinch.zoom * (dist / pinch.dist), cx, cy, Date.now(), false);
        pinch.cx = cx;
        pinch.cy = cy;
        return;
      }
      if (!dragging && Math.hypot(p.x - downX, p.y - downY) > DRAG_THRESHOLD) {
        dragging = true;
        canvas2.style.cursor = "grabbing";
        h.interact();
      }
      if (dragging) camera.panBy(p.x - prev.x, p.y - prev.y);
    };
    const onUp = (e) => {
      const p = local(e);
      const had = pointers.delete(e.pointerId);
      if (!had) return;
      if (pinch && pointers.size < 2) {
        pinch = null;
        camera.settle(Date.now());
        return;
      }
      if (pointers.size > 0) return;
      canvas2.style.cursor = "grab";
      if (dragging) {
        dragging = false;
        return;
      }
      const hit = h.pick(p.x, p.y);
      if (e.pointerType !== "mouse") {
        const now = performance.now();
        if (now - lastTap.t < 320 && Math.hypot(p.x - lastTap.x, p.y - lastTap.y) < 24) {
          h.doubleClick(hit);
          lastTap = { t: 0, x: 0, y: 0 };
          return;
        }
        lastTap = { t: now, x: p.x, y: p.y };
      }
      h.click(hit, p);
    };
    const onCancel = (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (!pointers.size) {
        dragging = false;
        canvas2.style.cursor = "grab";
      }
    };
    const onLeave = () => h.hover(0, 0, false);
    const onDbl = (e) => {
      const p = local(e);
      h.doubleClick(h.pick(p.x, p.y));
    };
    const onWheel = (e) => {
      e.preventDefault();
      const p = local(e);
      h.interact();
      const delta = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
      if (e.ctrlKey) {
        camera.zoomAt(camera.zoom * Math.exp(-delta * 0.012), p.x, p.y, Date.now(), false);
        if (wheelSettle) clearTimeout(wheelSettle);
        wheelSettle = setTimeout(() => camera.settle(Date.now()), 180);
        return;
      }
      wheelAcc += delta;
      if (Math.abs(wheelAcc) >= 50) {
        h.zoomStep(wheelAcc < 0 ? 1 : -1, p.x, p.y);
        wheelAcc = 0;
      }
    };
    const onKey = (e) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (h.active && !h.active()) return;
      if (h.keys && !h.keys()) return;
      const t2 = e.target;
      if (t2 && (t2.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t2.tagName) || t2.getAttribute?.("role") === "radio")) return;
      if (modalOpen(t2)) return;
      let dx = 0;
      let dy = 0;
      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          dx = PAN_KEY_STEP;
          break;
        case "ArrowRight":
        case "d":
        case "D":
          dx = -PAN_KEY_STEP;
          break;
        case "ArrowUp":
        case "w":
        case "W":
          dy = PAN_KEY_STEP;
          break;
        case "ArrowDown":
        case "s":
        case "S":
          dy = -PAN_KEY_STEP;
          break;
        case "+":
        case "=":
          h.zoomStep(1);
          e.preventDefault();
          return;
        case "-":
        case "_":
          h.zoomStep(-1);
          e.preventDefault();
          return;
        case "0":
          h.overview();
          e.preventDefault();
          return;
        default:
          return;
      }
      e.preventDefault();
      h.interact();
      camera.panBy(dx, dy);
    };
    canvas2.addEventListener("pointerdown", onDown);
    canvas2.addEventListener("pointermove", onMove);
    canvas2.addEventListener("pointerup", onUp);
    canvas2.addEventListener("pointercancel", onCancel);
    canvas2.addEventListener("pointerleave", onLeave);
    canvas2.addEventListener("dblclick", onDbl);
    canvas2.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      canvas2.removeEventListener("pointerdown", onDown);
      canvas2.removeEventListener("pointermove", onMove);
      canvas2.removeEventListener("pointerup", onUp);
      canvas2.removeEventListener("pointercancel", onCancel);
      canvas2.removeEventListener("pointerleave", onLeave);
      canvas2.removeEventListener("dblclick", onDbl);
      canvas2.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      if (wheelSettle) clearTimeout(wheelSettle);
    };
  }

  // vendor/habblaud/upstream/client/src/world/playback.ts
  function rebaseSnapshot(snap, delta) {
    if (!delta) return snap;
    return {
      ...snap,
      serverTime: snap.serverTime + delta,
      agents: snap.agents.map((a) => {
        const out = { ...a, statusSince: a.statusSince + delta };
        if (a.shells) out.shells = a.shells.map((j) => ({ ...j, startedAt: j.startedAt + delta }));
        return out;
      })
    };
  }

  // vendor/habblaud/upstream/client/src/world/render/anim.ts
  var clamp012 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  function easeOutBack(t2) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t2 - 1, 3) + c1 * Math.pow(t2 - 1, 2);
  }
  function easeInBack(t2) {
    const c1 = 1.70158;
    return (c1 + 1) * t2 * t2 * t2 - c1 * t2 * t2;
  }
  function easeOutCubic(t2) {
    return 1 - Math.pow(1 - t2, 3);
  }
  var NO_ANIM = { floor: 1, walls: 1, sign: 1, mode: "none", p: 1 };
  function buildAnim(phase, p) {
    if (phase === "building") {
      return { floor: clamp012(p / 0.4), walls: easeOutCubic(clamp012((p - 0.22) / 0.3)), sign: easeOutCubic(clamp012((p - 0.84) / 0.16)), mode: "build", p };
    }
    if (phase === "dismantling") {
      return {
        floor: 1 - clamp012((p - 0.7) / 0.3),
        walls: 1 - clamp012((p - 0.47) / 0.25),
        sign: 1 - clamp012(p / 0.15),
        mode: "dismantle",
        p
      };
    }
    return NO_ANIM;
  }
  function furnitureScale(a, order) {
    if (a.mode === "build") {
      const t2 = clamp012((a.p - (0.48 + order * 0.36)) / 0.13);
      return t2 <= 0 ? 0 : t2 >= 1 ? 1 : Math.max(0, easeOutBack(t2));
    }
    if (a.mode === "dismantle") {
      const t2 = clamp012((a.p - (1 - order) * 0.33) / 0.12);
      return t2 <= 0 ? 1 : t2 >= 1 ? 0 : Math.max(0, 1 - easeInBack(t2));
    }
    return 1;
  }
  function sweepDelay(i, j, w, h) {
    return (i + j * 0.8) / (w + h * 0.8);
  }

  // vendor/habblaud/upstream/client/src/world/render/github-fx.ts
  var UI_FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';
  var BANNER_FONT = `800 11.5px ${UI_FONT}`;
  var BANNER_H = 22;
  var SPIN_MS2 = 900;
  var CONFETTI_RATE = 42;
  var reducedMq;
  function reducedMotion() {
    if (reducedMq === void 0) reducedMq = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
    return !!reducedMq?.matches;
  }
  function fxFade(fx, now) {
    return Math.max(0, Math.min(1, (now - fx.start) / 300, (fx.end - now) / 600));
  }
  function sprite2(rows, pal) {
    const c = document.createElement("canvas");
    c.width = rows[0].length;
    c.height = rows.length;
    const ctx = c.getContext("2d");
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const col = pal[row[x]];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x, y, 1, 1);
      }
    });
    return c;
  }
  var BEACON_ROWS = [
    ["..kkkkk..", ".kRbwbrk.", "kRRbwbRrk", "kRRbwbRrk", "kRRRRRRrk", "kmmmmmmmk", "kMMMMMMMk", ".kkkkkkk."],
    ["..kkkkk..", ".kRRRwbk.", "kRRRRRwbk", "kRRRRRwbk", "kRRRRRRrk", "kmmmmmmmk", "kMMMMMMMk", ".kkkkkkk."],
    ["..kkkkk..", ".kddddek.", "kdddddddk", "kdddddddk", "kdddddeek", "kmmmmmmmk", "kMMMMMMMk", ".kkkkkkk."],
    ["..kkkkk..", ".kbwRRrk.", "kbwRRRRrk", "kbwRRRRrk", "kRRRRRRrk", "kmmmmmmmk", "kMMMMMMMk", ".kkkkkkk."]
  ];
  var BEACON_PAL = { k: "#3a1012", R: "#ff3b3b", r: "#c4161f", b: "#ff9a9a", w: "#fff4f4", d: "#9b161d", e: "#6d0d12", m: "#8d96a6", M: "#5c6372" };
  var BANG_ROWS = [".kkkkkkk.", "krrrrrrrk", "krrrwrrrk", "krrrwrrrk", "krrrwrrrk", "krrrrrrrk", "krrrwrrrk", "krrrrrrrk", ".kkkkkkk.", "...krk...", "....k...."];
  var BANG_PAL = { k: "#4a0d10", r: "#e5383b", w: "#ffffff" };
  var beacons = null;
  var bang = null;
  function beaconFrames() {
    return beacons ??= BEACON_ROWS.map((rows) => sprite2(rows, BEACON_PAL));
  }
  function bangSprite() {
    return bang ??= sprite2(BANG_ROWS, BANG_PAL);
  }
  function beaconFrame(ph) {
    return Math.min(3, Math.floor(((ph + 0.125) % 1 + 1) % 1 * 4));
  }
  function beaconFacing(ph) {
    return Math.max(0, Math.cos(ph * Math.PI * 2));
  }
  var glows = /* @__PURE__ */ new Map();
  function redGlow(size) {
    let c = glows.get(size);
    if (c) return c;
    c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,36,48,0.75)");
    g.addColorStop(0.45, "rgba(255,36,48,0.3)");
    g.addColorStop(1, "rgba(255,36,48,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    glows.set(size, c);
    return c;
  }
  function roomRects(r) {
    return {
      room: { x: r.x * TILE, y: r.y * TILE, w: r.w * TILE, h: r.h * TILE },
      floor: { x: (r.x + 0.5) * TILE, y: (r.y + 2) * TILE, w: (r.w - 1) * TILE, h: (r.h - 3) * TILE }
    };
  }
  var RoomFxRenderer = class {
    /** Acumulador da taxa de confete por sala. */
    acc = /* @__PURE__ */ new Map();
    visibleRoom(sim, fx, v) {
      const room = sim.rooms.get(fx.roomId);
      if (!room || !room.present || room.phase === "dismantling") return null;
      const rects = roomRects(room.layout.rect);
      const p = rects.room;
      if (p.x > v.x1 || p.x + p.w < v.x0 || p.y - 8 > v.y1 || p.y + p.h < v.y0) return null;
      return rects;
    }
    /** Tom vermelho pulsando no piso das salas em alarme (antes dos móveis e personagens). */
    drawFloor(ctx, sim, now, v) {
      if (!sim.roomFx.active.size) return;
      const still = reducedMotion();
      for (const fx of sim.roomFx.active.values()) {
        if (fx.kind !== "alarm" || now >= fx.end) continue;
        const rects = this.visibleRoom(sim, fx, v);
        if (!rects) continue;
        const pulse = still ? 0.5 : 0.5 + 0.5 * Math.sin((now - fx.start) / 1100 * Math.PI * 2);
        const f = rects.floor;
        ctx.globalAlpha = fxFade(fx, now) * (0.08 + 0.09 * pulse);
        ctx.fillStyle = "#ff2a36";
        ctx.fillRect(f.x, f.y, f.w, f.h);
      }
      ctx.globalAlpha = 1;
    }
    /** Confete caindo nas salas em festa (antes de as partículas andarem). */
    emit(particles, sim, now, dt, v) {
      if (!sim.roomFx.active.size) {
        if (this.acc.size) this.acc.clear();
        return;
      }
      const still = reducedMotion();
      for (const [id, fx] of sim.roomFx.active) {
        if (fx.kind !== "party" || now >= fx.end || still) {
          this.acc.delete(id);
          continue;
        }
        const rects = this.visibleRoom(sim, fx, v);
        if (!rects) continue;
        const k = Math.min(1, (fx.end - now) / 2e3) * (now - fx.start < 1500 ? 1.6 : 1);
        let a = (this.acc.get(id) ?? 0) + Math.min(0.1, dt) * CONFETTI_RATE * k;
        const f = rects.floor;
        const top = rects.room.y + 4;
        while (a >= 1) {
          a -= 1;
          const y = top + Math.random() * 6;
          particles.confettiFall(f.x + 2 + Math.random() * (f.w - 4), y, f.y + f.h - 4 - y);
        }
        this.acc.set(id, a);
      }
      for (const id of this.acc.keys()) if (!sim.roomFx.active.has(id)) this.acc.delete(id);
    }
    /**
     * Giroflex nos dois cantos de cima da sala em alarme, com a luz girando pelo chão, e o balão "!" do
     * responsável. Desenhado por cima da luz/escuridão (brilha também à noite e com a sala apagada).
     */
    drawLights(ctx, sim, heads, now, v) {
      if (!sim.roomFx.active.size) return;
      const still = reducedMotion();
      for (const fx of sim.roomFx.active.values()) {
        if (fx.kind !== "alarm" || now >= fx.end) continue;
        const fade = fxFade(fx, now);
        const rects = this.visibleRoom(sim, fx, v);
        if (rects) this.drawBeacons(ctx, rects, now - fx.start, fade, still);
        const head = fx.agentId ? heads.get(fx.agentId) : void 0;
        if (head?.visible) {
          const s = bangSprite();
          const bob = still ? 0 : Math.round(Math.abs(Math.sin((now - fx.start) / 260)) * 2);
          ctx.globalAlpha = fade;
          ctx.drawImage(s, Math.round(head.x + 4), Math.round(head.y - s.height - 1 - bob));
          ctx.globalAlpha = 1;
        }
      }
    }
    drawBeacons(ctx, rects, t2, fade, still) {
      const frames = beaconFrames();
      const r = rects.room;
      const f = rects.floor;
      const spots = [r.x + 4, r.x + r.w - 4];
      const ph = still ? 0 : t2 / SPIN_MS2;
      const facing2 = (i) => still ? 0.6 : beaconFacing(ph + i * 0.5);
      if (!still) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(r.x, r.y, r.w, r.h);
        ctx.clip();
        const sweep = redGlow(128);
        const cx = f.x + f.w / 2;
        const cy = f.y + f.h / 2;
        for (let i = 0; i < 2; i++) {
          const a = ph * Math.PI * 2 + i * Math.PI;
          ctx.globalAlpha = 0.3 * fade;
          ctx.drawImage(sweep, Math.round(cx + Math.cos(a) * f.w * 0.3 - 64), Math.round(cy + Math.sin(a) * f.h * 0.3 - 64));
        }
        ctx.restore();
      }
      const glow = redGlow(48);
      for (const [i, x] of spots.entries()) {
        ctx.globalAlpha = (0.25 + 0.75 * facing2(i)) * fade;
        ctx.drawImage(glow, Math.round(x - 24), Math.round(r.y + 3 - 24));
      }
      ctx.globalAlpha = fade;
      for (const [i, x] of spots.entries()) {
        const s = frames[still ? 0 : beaconFrame(ph + i * 0.5)];
        const sx = Math.round(x - s.width / 2);
        const sy = Math.round(r.y + 7 - s.height);
        ctx.drawImage(s, sx, sy);
        if (!still && facing2(i) > 0.75) {
          ctx.fillStyle = "#ff6b6b";
          const cy = sy + 2;
          ctx.fillRect(sx - 4, cy, 3, 1);
          ctx.fillRect(sx + s.width + 1, cy, 3, 1);
          ctx.fillRect(sx - 2, cy - 3, 1, 1);
          ctx.fillRect(sx - 3, cy - 4, 1, 1);
          ctx.fillRect(sx + s.width + 1, cy - 3, 1, 1);
          ctx.fillRect(sx + s.width + 2, cy - 4, 1, 1);
          ctx.fillRect(sx + Math.floor(s.width / 2), sy - 3, 1, 2);
        }
      }
      ctx.globalAlpha = 1;
    }
  };
  function drawFxBanner(ctx, fx, cx, top, maxW, now, fit, measure) {
    const fade = fxFade(fx, now);
    if (fade <= 0) return null;
    const still = reducedMotion();
    const party = fx.kind === "party";
    const emoji = party ? "\u{1F389}" : "\u{1F6A8}";
    const enter = still ? 0 : Math.max(0, 1 - (now - fx.start) / 260);
    const wave = !still && party ? Math.sin((now - fx.start) / 320) * 1.5 : 0;
    const y = Math.round(top - enter * 10 + wave);
    const notch = 6;
    const text = maxW >= 70 ? fit(BANNER_FONT, `${emoji} ${fx.text}`, maxW - 24 - 2 * notch) : "";
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.font = BANNER_FONT;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    const pulse = still ? 0 : 0.5 + 0.5 * Math.sin((now - fx.start) / 700 * Math.PI * 2);
    const body = party ? "#ffcf3a" : pulse > 0.5 ? "#ef3340" : "#c8202e";
    const edge = party ? "#c98a12" : "#7a0d16";
    const ink = party ? "#3a2606" : "#ffffff";
    if (!text || text === "\u2026") {
      const r = 11;
      ctx.fillStyle = "rgba(16,20,32,0.25)";
      ctx.beginPath();
      ctx.arc(cx, y + r + 1.5, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, y + r, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `13px ${UI_FONT}`;
      ctx.fillText(emoji, cx, y + r + 1);
      ctx.restore();
      return { x: cx - r, y, w: 2 * r, h: 2 * r };
    }
    const tw = measure(BANNER_FONT, text);
    const w = Math.round(tw + 24 + 2 * notch);
    const x = Math.round(cx - w / 2);
    const h = BANNER_H;
    const ribbon = (dy) => {
      ctx.beginPath();
      ctx.moveTo(x, y + dy);
      ctx.lineTo(x + w, y + dy);
      ctx.lineTo(x + w - notch, y + dy + h / 2);
      ctx.lineTo(x + w, y + dy + h);
      ctx.lineTo(x, y + dy + h);
      ctx.lineTo(x + notch, y + dy + h / 2);
      ctx.closePath();
    };
    ctx.fillStyle = "rgba(16,20,32,0.28)";
    ribbon(2);
    ctx.fill();
    ctx.fillStyle = edge;
    ribbon(1);
    ctx.fill();
    ctx.fillStyle = body;
    ribbon(0);
    ctx.fill();
    if (party) {
      const colors = ["#ff4d6d", "#3fa7ff", "#3ddc84", "#b06bff"];
      for (let i = 0, px = x + notch + 6; px < x + w - notch - 6; i++, px += 9) {
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.moveTo(px - 3, y);
        ctx.lineTo(px + 3, y);
        ctx.lineTo(px, y + 4);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.fillStyle = ink;
    ctx.fillText(text, Math.round(cx), y + h / 2 + 1);
    ctx.restore();
    return { x, y, w, h };
  }

  // vendor/habblaud/upstream/client/src/world/render/overlay.ts
  var UI_FONT2 = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';
  var LABEL_FONT = `600 10.5px ${UI_FONT2}`;
  var BUBBLE_FONT = `500 11.5px ${UI_FONT2}`;
  var SAY_FONT = `500 10.5px ${UI_FONT2}`;
  var FLOAT_FONT = `800 12px ${UI_FONT2}`;
  var CHIP_FONT = `700 8px ${UI_FONT2}`;
  var BADGE_FONT = `700 8px ${UI_FONT2}`;
  var ROOM_FONT = `700 12px ${UI_FONT2}`;
  var CORE_FONT = `600 11px ${UI_FONT2}`;
  var CORE_FONT_SMALL = `600 9.5px ${UI_FONT2}`;
  var signFont = (size) => `700 ${size}px ${UI_FONT2}`;
  var BUBBLE_MAX_W = 220;
  var ALERT_MAX_W = 340;
  var BUBBLE_H = 20;
  var LABEL_H = 15;
  var RECENT_MS = 4e3;
  var SIGN_MIN_PX = 14;
  var OVERVIEW_ZOOM = 1.8;
  var TINY_ZOOM = 0.6;
  var OVERVIEW_PER_ROOM = 1;
  var OVERVIEW_TOTAL = 4;
  var CORE_NAMES = {
    get "core:recepcao"() {
      return tr("Recep\xE7\xE3o");
    },
    get "core:banheiros"() {
      return tr("Banheiros");
    },
    get "core:copa"() {
      return tr("Copa");
    },
    get "core:lounge"() {
      return tr("Lounge");
    }
  };
  var SAY_MAX_W = 170;
  var SAY_H = 17;
  var SHELL_BUBBLE_ICON = "\u23F3";
  var CODEX_CHIP_BG = "#161b26";
  var CODEX_BADGE = "CODEX";
  function steppedRect(ctx, x, y, w, h, s) {
    ctx.beginPath();
    ctx.moveTo(x + s, y);
    ctx.lineTo(x + w - s, y);
    ctx.lineTo(x + w, y + s);
    ctx.lineTo(x + w, y + h - s);
    ctx.lineTo(x + w - s, y + h);
    ctx.lineTo(x + s, y + h);
    ctx.lineTo(x, y + h - s);
    ctx.lineTo(x, y + s);
    ctx.closePath();
  }
  function accountDot(ctx, x, y, r, acc) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (acc.provider === "codex") {
      ctx.fillStyle = CODEX_CHIP_BG;
      ctx.fill();
      ctx.lineWidth = Math.max(1.2, r * 0.55);
      ctx.strokeStyle = acc.color;
      ctx.beginPath();
      ctx.arc(x, y, r - ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }
    ctx.fillStyle = acc.color;
    ctx.fill();
  }
  function luminance2(hex3) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex3);
    if (!m) return 0.5;
    const n = parseInt(m[1], 16);
    return (0.2126 * (n >> 16 & 255) + 0.7152 * (n >> 8 & 255) + 0.0722 * (n & 255)) / 255;
  }
  function headIconLift(ch) {
    if (ch.icon === "storm") return 13 + STORM_LIFT;
    return ch.mode === "wait" || ch.mode === "shell" || ch.icon ? 13 : 0;
  }
  function waitBubbleText(waitingFor) {
    const why = (waitingFor ?? "").trim().replace(/^precisa de você:?\s*/i, "");
    return why ? why.charAt(0).toUpperCase() + why.slice(1) : tr("Responder no terminal");
  }
  function rationBubbles(items, perRoom, total) {
    const order = items.map((_, i) => i).sort((a, b) => items[b].prio - items[a].prio || items[b].changedAt - items[a].changedAt);
    const keep = /* @__PURE__ */ new Set();
    const byRoom = /* @__PURE__ */ new Map();
    for (const i of order) {
      if (keep.size >= total) break;
      const n = byRoom.get(items[i].room) ?? 0;
      if (n >= perRoom) continue;
      byRoom.set(items[i].room, n + 1);
      keep.add(i);
    }
    return keep;
  }
  var Overlay = class {
    constructor(ctx, sim, renderer, camera) {
      this.ctx = ctx;
      this.sim = sim;
      this.renderer = renderer;
      this.camera = camera;
    }
    widths = /* @__PURE__ */ new Map();
    fitted = /* @__PURE__ */ new Map();
    placed = [];
    items = [];
    /** Objetos reaproveitados entre frames (sem alocação no caminho quente). */
    bubblePool = [];
    labelPool = [];
    nb = 0;
    nl = 0;
    rationIn = [];
    rationIdx = [];
    /** Transformação mundo -> tela (px CSS) do frame atual. */
    k = 1;
    ox = 0;
    oy = 0;
    zoom = 1;
    /** Descarta medições (ex.: depois que uma fonte carregou). */
    resetCaches() {
      this.widths.clear();
      this.fitted.clear();
    }
    measure(font, text) {
      const key = `${font}|${text}`;
      let w = this.widths.get(key);
      if (w === void 0) {
        if (this.widths.size > 4e3) this.widths.clear();
        this.ctx.font = font;
        w = this.ctx.measureText(text).width;
        this.widths.set(key, w);
      }
      return w;
    }
    /** Corta o texto com reticências para caber em `maxW` px. */
    fit(font, text, maxW) {
      const key = `${font}|${maxW}|${text}`;
      const hit = this.fitted.get(key);
      if (hit !== void 0) return hit;
      if (this.fitted.size > 2e3) this.fitted.clear();
      let out = text;
      if (this.measure(font, text) > maxW) {
        let lo = 0;
        let hi = text.length;
        while (lo < hi) {
          const mid = lo + hi + 1 >> 1;
          if (this.measure(font, `${text.slice(0, mid).trimEnd()}\u2026`) <= maxW) lo = mid;
          else hi = mid - 1;
        }
        out = lo > 0 ? `${text.slice(0, lo).trimEnd()}\u2026` : "";
      }
      this.fitted.set(key, out);
      return out;
    }
    /** x/y de tela (px CSS) de um ponto do mundo, pela transformação do frame. */
    sx(wx) {
      return wx * this.k + this.ox;
    }
    sy(wy) {
      return wy * this.k + this.oy;
    }
    overlaps(x, y, w, h) {
      const p = this.placed;
      for (let i = 0; i < p.length; i += 4) {
        if (x < p[i] + p[i + 2] && x + w > p[i] && y < p[i + 1] + p[i + 3] && y + h > p[i + 1]) return true;
      }
      return false;
    }
    place(x, y, w, h) {
      this.placed.push(x, y, w, h);
    }
    draw(now, opts, sel) {
      const { ctx, camera } = this;
      const dpr = camera.dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textBaseline = "middle";
      this.placed.length = 0;
      const t2 = camera.transform();
      this.k = t2.scale / dpr;
      this.ox = t2.ox / dpr;
      this.oy = t2.oy / dpr;
      this.nb = 0;
      this.nl = 0;
      const zoom = this.zoom = camera.zoom;
      const vw = camera.viewW;
      const vh = camera.viewH;
      if (sel.room) {
        const room = this.sim.rooms.get(sel.room);
        if (room && room.present) {
          const r = room.layout.rect;
          const ax = this.sx(r.x * TILE);
          const ay = this.sy(r.y * TILE);
          const bx = this.sx((r.x + r.w) * TILE);
          const by = this.sy((r.y + r.h) * TILE);
          ctx.save();
          ctx.strokeStyle = room.theme.accent;
          ctx.lineWidth = 2.5;
          ctx.globalAlpha = 0.85 + Math.sin(now / 300) * 0.15;
          ctx.beginPath();
          ctx.roundRect(ax - 2, ay - 2, bx - ax + 4, by - ay + 4, 6);
          ctx.stroke();
          ctx.restore();
        }
      }
      this.drawRoomTexts(now, zoom);
      this.drawFxBanners(now, zoom);
      const items = this.items;
      items.length = 0;
      const heads = this.renderer.heads;
      const showAll = opts.showNames && zoom >= 0.99;
      for (const ch of this.sim.people()) {
        const head = heads.get(ch.id);
        if (!head || !head.visible) continue;
        const hx = this.sx(head.x);
        const hy = this.sy(head.y);
        if (hx < -120 || hx > vw + 120 || hy < -60 || hy > vh + 80) continue;
        const selected = sel.agent === ch.id;
        const hovered = sel.hover === ch.id;
        const visitor = ch === this.sim.visitor;
        const labeled = selected || hovered || ch.mode === "wait" || showAll || visitor;
        const above = labeled && this.labelAbove(ch);
        const b = this.bubbleFor(ch, head, now, opts, selected, hovered);
        if (b) {
          b.extraLift = above ? LABEL_H + 3 : 0;
          items.push(b);
        }
        if (labeled) {
          const prio = selected ? 100 : hovered ? 95 : visitor ? 92 : ch.mode === "wait" ? 90 : ch.info.kind === "main" ? 50 : 40;
          let l = this.labelPool[this.nl];
          if (!l) this.labelPool[this.nl] = l = { type: "label", ch, head, prio, above, compact: false, x: 0, y: 0, w: 0, h: 0 };
          else {
            l.ch = ch;
            l.head = head;
            l.prio = prio;
            l.above = above;
          }
          l.compact = zoom < 2.5 && !selected && !hovered;
          this.nl++;
          items.push(l);
        }
      }
      this.ration(zoom);
      items.sort((a, b) => b.prio - a.prio || (a.type === b.type ? a.head.feetY - b.head.feetY : a.type === "bubble" ? -1 : 1));
      let n = 0;
      for (const it of items) {
        const ok = it.type === "bubble" ? this.placeBubble(it) : this.placeLabel(it);
        if (ok) items[n++] = it;
      }
      items.length = n;
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        if (it.type === "bubble") this.drawBubble(it, now);
        else this.drawLabel(it, sel);
      }
      this.drawChats(now);
      this.drawFloaters(now);
      ctx.textBaseline = "alphabetic";
    }
    /** Quem senta virado para a câmera atrás de uma mesa: a etiqueta nos pés cobriria a tela do colega. */
    labelAbove(ch) {
      if (!ch.seated || ch.dir !== "down" || !ch.atSpot) return false;
      const spot = this.sim.spots.get(ch.atSpot);
      return !!spot && spot.kind === "desk";
    }
    /** Racionamento por zoom: visão geral com poucos textos; telas minúsculas só com ícones críticos. */
    ration(zoom) {
      const items = this.items;
      if (zoom < TINY_ZOOM) {
        let n = 0;
        for (const it of items) {
          if (it.type === "bubble") {
            if (it.tone === "info" && it.prio < 75 || it.tone === "say") continue;
            it.chip = true;
          }
          items[n++] = it;
        }
        items.length = n;
        return;
      }
      if (zoom >= OVERVIEW_ZOOM) return;
      const rin = this.rationIn;
      const idx = this.rationIdx;
      rin.length = 0;
      idx.length = 0;
      for (const it of items) {
        if (it.type !== "bubble" || it.tone !== "info" && it.tone !== "shell" && it.tone !== "say" || it.prio >= 75) continue;
        const ch = it.ch;
        rin.push({ room: `${Math.floor(ch.tx / COL_W)}:${ch.ty < CORRIDOR_Y ? "n" : ch.ty < SOUTH_Y ? "c" : "s"}`, prio: it.prio, changedAt: it.changedAt });
        idx.push(it);
      }
      if (!idx.length) return;
      const keep = rationBubbles(rin, OVERVIEW_PER_ROOM, OVERVIEW_TOTAL);
      for (let i = 0; i < idx.length; i++) if (!keep.has(i)) idx[i].chip = true;
    }
    // =================================================================== salas
    drawRoomTexts(now, zoom) {
      const { camera } = this;
      const vw = camera.viewW;
      const vh = camera.viewH;
      const colW = COL_W * TILE * zoom;
      for (const vis of this.renderer.areas.values()) {
        const room = vis.room;
        const r = vis.layout.rect;
        const anim = room ? buildAnim(room.phase, room.progress(now)) : null;
        const rect = this.renderer.signRect(vis);
        const text = room ? room.info.name : vis.id === "core:recepcao" ? "Habblaud" : null;
        const readable = !!rect && rect.h * zoom >= SIGN_MIN_PX;
        if (readable && rect && text && (!anim || anim.sign >= 1)) {
          const ax = this.sx(rect.x);
          const ay = this.sy(rect.y);
          const w = rect.w * zoom;
          const h = rect.h * zoom;
          if (ax + w > 0 && ax < vw && ay + h > 0 && ay < vh) {
            this.drawSignText(text, ax, ay, w, h, this.renderer.signIsDark(vis), room?.accounts ?? []);
            this.place(ax, ay, w, h);
          }
        }
        if (room ? readable : zoom >= 1.4) continue;
        const cx = this.sx((r.x + r.w / 2) * TILE);
        const cy = this.sy(r.y * TILE + 6);
        if (cx < -200 || cx > vw + 200 || cy < -40 || cy > vh + 40) continue;
        if (room) {
          if (!room.present || room.ghost || anim && anim.walls < 0.6) continue;
          this.drawRoomPill(room.info.name, cx, cy, colW - 8, room.accounts, this.countIn(room.id), room.theme.accent, room.lightOn);
        } else if (CORE_NAMES[vis.id]) {
          this.drawCorePill(CORE_NAMES[vis.id], cx, cy, colW - 8);
        }
      }
    }
    /** Altura dos ícones sobre a cabeça, contando o balão "!" de quem viu o CI falhar (render/github-fx.ts). */
    iconLift(ch) {
      const lift = headIconLift(ch);
      return this.sim.roomFx.active.size && this.sim.roomFx.alarmOwner(ch.id, this.sim.now) ? Math.max(lift, 13) : lift;
    }
    /** Faixa da festa/alarme (eventos do GitHub) no alto do piso de cada sala com efeito. */
    drawFxBanners(now, zoom) {
      const fxs = this.sim.roomFx.active;
      if (!fxs.size) return;
      const { camera } = this;
      for (const fx of fxs.values()) {
        const room = this.sim.rooms.get(fx.roomId);
        if (!room || !room.present || now >= fx.end) continue;
        const r = room.layout.rect;
        const cx = this.sx((r.x + r.w / 2) * TILE);
        const top = this.sy((r.y + 2) * TILE) + 4;
        if (cx < -200 || cx > camera.viewW + 200 || top < -40 || top > camera.viewH + 40) continue;
        const b = drawFxBanner(this.ctx, fx, cx, top, r.w * TILE * zoom - 12, now, (f, t2, w) => this.fit(f, t2, w), (f, t2) => this.measure(f, t2));
        if (b) this.place(b.x, b.y, b.w, b.h);
      }
    }
    countIn(roomId) {
      let n = 0;
      for (const c of this.sim.chars.values()) if (c.roomId === roomId && !c.leaving) n++;
      return n;
    }
    drawSignText(text, x, y, w, h, dark, accounts) {
      const { ctx } = this;
      let size = Math.min(18, Math.max(7, Math.floor(h * 0.72)));
      let font = signFont(size);
      while (size > 7 && this.measure(font, text) > w - 4) {
        size--;
        font = signFont(size);
      }
      const t2 = this.fit(font, text, w - 4);
      ctx.font = font;
      ctx.textAlign = "center";
      const cx = Math.round(x + w / 2);
      const cy = Math.round(y + h / 2) + 0.5;
      ctx.fillStyle = dark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.45)";
      ctx.fillText(t2, cx, cy + 1);
      ctx.fillStyle = dark ? "#f5f1e6" : "#26303e";
      ctx.fillText(t2, cx, cy);
      ctx.textAlign = "left";
      const r = Math.max(2.5, Math.min(4, h * 0.22));
      let dx = x + w + r + 3;
      for (const id of accounts) {
        const acc = this.sim.accounts.get(id);
        if (!acc) continue;
        accountDot(ctx, dx, y + h / 2, r, acc);
        ctx.beginPath();
        ctx.arc(dx, y + h / 2, r, 0, Math.PI * 2);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(20,24,36,0.65)";
        ctx.stroke();
        dx += r * 2 + 2;
      }
    }
    drawRoomPill(name, cx, cy, maxW, accounts, count, accent, lit) {
      const { ctx } = this;
      let dots = accounts.filter((a) => this.sim.accounts.has(a));
      let countText = count > 0 ? String(count) : "";
      let cw = countText ? this.measure(LABEL_FONT, countText) + 14 : 0;
      let text = this.fit(ROOM_FONT, name, Math.min(180, maxW - (18 + dots.length * 10 + cw)));
      if (text.length < Math.min(7, name.length)) {
        const alone = this.fit(ROOM_FONT, name, maxW - 18);
        if (alone.length >= 4) {
          text = alone;
          dots = [];
          countText = "";
          cw = 0;
        }
      }
      const extras = 18 + dots.length * 10 + cw;
      const compact = text !== name && text.length < 4;
      const tw = compact ? 0 : this.measure(ROOM_FONT, text);
      const w = Math.round(compact ? Math.max(12, 10 + cw + dots.length * 10) : tw + extras);
      const h = 22;
      const x = Math.round(cx - w / 2);
      const y = Math.round(cy - h - 4);
      ctx.save();
      ctx.globalAlpha = lit ? 1 : 0.8;
      ctx.fillStyle = "rgba(16,20,32,0.28)";
      ctx.beginPath();
      ctx.roundRect(x, y + 2, w, h, 7);
      ctx.fill();
      ctx.fillStyle = "rgba(22,27,40,0.9)";
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 7);
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.roundRect(x, y, 4, h, [7, 0, 0, 7]);
      ctx.fill();
      let dx = x + 10;
      if (!compact) {
        ctx.font = ROOM_FONT;
        ctx.fillStyle = "#f3f5fa";
        ctx.fillText(text, x + 10, y + h / 2 + 1);
        dx = x + 10 + tw + 8;
      }
      for (const id of dots) {
        accountDot(ctx, dx + 3, y + h / 2, 3.5, this.sim.accounts.get(id));
        dx += 10;
      }
      if (countText) {
        ctx.fillStyle = "rgba(255,255,255,0.14)";
        ctx.beginPath();
        ctx.roundRect(dx + 2, y + 4, cw - 4, h - 8, 5);
        ctx.fill();
        ctx.font = LABEL_FONT;
        ctx.fillStyle = "#dfe5f2";
        ctx.fillText(countText, dx + 7, y + h / 2 + 0.5);
      }
      ctx.restore();
      this.place(x, y, w, h);
    }
    drawCorePill(name, cx, cy, maxW) {
      const { ctx } = this;
      const font = this.measure(CORE_FONT, name) <= maxW - 14 ? CORE_FONT : CORE_FONT_SMALL;
      const text = this.fit(font, name, maxW - 14);
      if (text.length < 3) return;
      const tw = this.measure(font, text);
      const w = Math.round(tw + 14);
      const h = 18;
      const x = Math.round(cx - w / 2);
      const y = Math.round(cy - h - 4);
      ctx.fillStyle = "rgba(22,27,40,0.62)";
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 6);
      ctx.fill();
      ctx.font = font;
      ctx.fillStyle = "#e8ecf5";
      ctx.fillText(text, x + 7, y + h / 2 + 1);
      this.place(x, y, w, h);
    }
    // =================================================================== balões
    takeBubble(ch, head, icon, text, tone, prio, alpha, changedAt) {
      let b = this.bubblePool[this.nb];
      if (!b) {
        b = { type: "bubble", ch, head, icon, text, tone, prio, alpha, chip: false, extraLift: 0, changedAt, x: 0, y: 0, w: 0, h: 0, fitted: "", lifted: false };
        this.bubblePool[this.nb] = b;
      } else {
        b.ch = ch;
        b.head = head;
        b.icon = icon;
        b.text = text;
        b.tone = tone;
        b.prio = prio;
        b.alpha = alpha;
        b.chip = false;
        b.extraLift = 0;
        b.changedAt = changedAt;
        b.lifted = false;
      }
      this.nb++;
      return b;
    }
    bubbleFor(ch, head, now, opts, selected, hovered) {
      if (opts.bubbles === "none") return null;
      if (ch.mode === "wait") return this.takeBubble(ch, head, "\u270B", this.sim.visit ? tr("Esperando o dono") : waitBubbleText(ch.info.waitingFor), "alert", 100, 1, now);
      if (ch.bubbleText && now < ch.bubbleUntil) {
        const a = Math.min(1, (now - ch.bubbleAt) / 150, (ch.bubbleUntil - now) / 400);
        return this.takeBubble(ch, head, ch.bubbleIcon, ch.bubbleText, "deliver", 90, a, ch.bubbleAt);
      }
      if (ch.sayText && now < ch.sayUntil && !ch.leaving) {
        const a = Math.min(1, (now - ch.sayAt) / 120, (ch.sayUntil - now) / 300);
        return this.takeBubble(ch, head, sayIcon(ch.sayText), ch.sayText, "say", 55, a, ch.sayAt);
      }
      const act = ch.info.activity;
      if (ch.mode === "shell" && ch.shellSince > 0 && !ch.leaving) {
        const sb = this.shellBubble(ch, head, now, opts, selected, hovered);
        if (sb) return sb;
      }
      if (!act || ch.leaving) return null;
      const age = now - ch.activityChangedAt;
      if (selected) return this.takeBubble(ch, head, act.icon, act.text, "info", 80, 1, ch.activityChangedAt);
      if (hovered) return this.takeBubble(ch, head, act.icon, act.text, "info", 75, 1, ch.activityChangedAt);
      if (opts.bubbles === "all" && ch.mode === "work") return this.takeBubble(ch, head, act.icon, act.text, "info", age < RECENT_MS ? 50 : 30, 1, ch.activityChangedAt);
      if (age < RECENT_MS && ch.activityChangedAt > 0) {
        const a = Math.min(1, age / 150, (RECENT_MS - age) / 500);
        return this.takeBubble(ch, head, act.icon, act.text, "info", 50, a, ch.activityChangedAt);
      }
      return null;
    }
    /**
     * Balão "⏳ <rótulo> · <tempo>" de quem espera um shell. Modo 'all': sempre; 'important': ao entrar
     * no estado e depois por 4 s a cada ~30 s; selecionado/hover: sempre. Uma atividade nova (ex.: o
     * fim de um dos shells) tem a vez enquanto é recente.
     */
    shellBubble(ch, head, now, opts, selected, hovered) {
      const recent = now - ch.activityChangedAt < RECENT_MS && ch.activityChangedAt > ch.shellEnteredAt + 500;
      if (recent && !selected && !hovered) return null;
      const text = this.shellText(ch, now);
      if (selected) return this.takeBubble(ch, head, SHELL_BUBBLE_ICON, text, "shell", 80, 1, ch.shellEnteredAt);
      if (hovered) return this.takeBubble(ch, head, SHELL_BUBBLE_ICON, text, "shell", 75, 1, ch.shellEnteredAt);
      if (opts.bubbles === "all") return this.takeBubble(ch, head, SHELL_BUBBLE_ICON, text, "shell", 45, 1, ch.shellEnteredAt);
      const a = shellBubbleAlpha(now - ch.shellEnteredAt, unitHash(ch.info.seed, 0, 3) * 9e3);
      return a > 0.01 ? this.takeBubble(ch, head, SHELL_BUBBLE_ICON, text, "shell", 50, a, ch.shellEnteredAt) : null;
    }
    /** Texto do balão de shell, refeito só quando o tempo exibido muda (não a cada frame). */
    shellText(ch, now) {
      if (this.sim.visit) return ch.shellLabel;
      const age = now - ch.shellSince;
      const key = shellAgeKey(age);
      if (key !== ch.shellTextKey || !ch.shellText) {
        ch.shellTextKey = key;
        ch.shellText = shellBubbleText(ch.shellLabel, age);
      }
      return ch.shellText;
    }
    /** Calcula o retângulo do balão (completo ou só o ícone) na posição base sobre a cabeça. */
    layoutBubble(b) {
      const { camera } = this;
      const lift = Math.max(1, this.iconLift(b.ch)) * this.zoom + b.extraLift;
      const headX = this.sx(b.head.x);
      const headY = this.sy(b.head.y);
      const say = b.tone === "say";
      const iconW = b.icon && !say ? this.measure(BUBBLE_FONT, b.icon) + 4 : 0;
      if (b.chip || !b.text) {
        b.fitted = "";
        b.w = Math.round(Math.max(20, (say ? this.measure(BUBBLE_FONT, b.icon) + 4 : iconW) + 10));
      } else if (say) {
        b.fitted = this.fit(SAY_FONT, b.text, SAY_MAX_W - 14);
        b.w = Math.round(Math.min(SAY_MAX_W, this.measure(SAY_FONT, b.fitted) + 14));
      } else {
        const maxW = b.tone === "alert" ? ALERT_MAX_W : BUBBLE_MAX_W;
        b.fitted = this.fit(BUBBLE_FONT, b.text, maxW - 16 - iconW);
        b.w = Math.round(Math.min(maxW, this.measure(BUBBLE_FONT, b.fitted) + iconW + 14));
      }
      b.h = say && !b.chip ? SAY_H : BUBBLE_H;
      b.x = Math.max(4, Math.min(camera.viewW - b.w - 4, Math.round(headX - b.w / 2)));
      b.y = Math.round(headY - lift - b.h - 6);
    }
    /** Posiciona o balão sem cobrir o que já está na tela. Retorna false se ele deve sumir. */
    placeBubble(b) {
      this.layoutBubble(b);
      if (!this.overlaps(b.x, b.y, b.w, b.h)) {
        this.place(b.x, b.y, b.w, b.h);
        return true;
      }
      if (b.tone === "alert") {
        const up = b.y - b.h - 6;
        if (!this.overlaps(b.x, up, b.w, b.h)) {
          b.y = up;
          b.lifted = true;
        }
        this.place(b.x, b.y, b.w, b.h);
        return true;
      }
      if (!b.chip) {
        b.chip = true;
        this.layoutBubble(b);
        if (!this.overlaps(b.x, b.y, b.w, b.h)) {
          this.place(b.x, b.y, b.w, b.h);
          return true;
        }
      }
      return false;
    }
    drawBubble(b, now) {
      const { ctx } = this;
      const { x, y, w, h } = b;
      const headX = this.sx(b.head.x);
      const tone = b.tone;
      const bg = tone === "alert" ? "#ffcf4a" : tone === "deliver" ? "#e2f0ff" : tone === "shell" ? "#1d2433" : tone === "say" ? "#ffffff" : "#fffdf8";
      const border = tone === "alert" ? "#c58f10" : tone === "deliver" ? "#7aa7d9" : tone === "shell" ? "#4b5d7e" : tone === "say" ? "rgba(40,48,66,0.38)" : "rgba(40,48,66,0.22)";
      const fg = tone === "alert" ? "#3b2a00" : tone === "deliver" ? "#17324f" : tone === "shell" ? "#b9f6b4" : tone === "say" ? "#1d2330" : "#232a36";
      const pulse = tone === "alert" ? 1 + Math.sin(now / 160) * 0.035 : 1;
      ctx.save();
      ctx.globalAlpha = b.alpha;
      if (b.lifted) {
        const tx = Math.max(x + 8, Math.min(x + w - 8, Math.round(headX)));
        ctx.strokeStyle = border;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(tx + 0.5, y + h);
        ctx.lineTo(tx + 0.5, y + 2 * h + 11);
        ctx.stroke();
      }
      if (pulse !== 1) {
        ctx.translate(headX, y + h);
        ctx.scale(pulse, pulse);
        ctx.translate(-headX, -(y + h));
      }
      const tailX = Math.max(x + 8, Math.min(x + w - 8, Math.round(headX)));
      ctx.fillStyle = "rgba(16,20,32,0.22)";
      ctx.beginPath();
      ctx.roundRect(x, y + 2, w, h, 7);
      ctx.fill();
      ctx.fillStyle = bg;
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, 7);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tailX - 4.5, y + h - 1);
      ctx.lineTo(tailX, y + h + 5);
      ctx.lineTo(tailX + 4.5, y + h - 1);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(tailX - 4.5, y + h - 0.5);
      ctx.lineTo(tailX, y + h + 5);
      ctx.lineTo(tailX + 4.5, y + h - 0.5);
      ctx.stroke();
      ctx.fillStyle = bg;
      ctx.fillRect(tailX - 4, y + h - 2, 8, 2);
      ctx.font = tone === "say" && !b.chip ? SAY_FONT : BUBBLE_FONT;
      ctx.fillStyle = fg;
      if (tone === "say" && !b.chip && b.fitted) {
        ctx.textAlign = "center";
        ctx.fillText(b.fitted, x + w / 2, y + h / 2 + 1);
        ctx.textAlign = "left";
      } else if (b.chip || !b.fitted) {
        ctx.textAlign = "center";
        ctx.fillText(b.icon || "\u2026", x + w / 2, y + h / 2 + 1);
        ctx.textAlign = "left";
      } else {
        let tx = x + 7;
        if (b.icon) {
          ctx.fillText(b.icon, tx, y + h / 2 + 1);
          tx += this.measure(BUBBLE_FONT, b.icon) + 4;
        }
        ctx.fillText(b.fitted, tx, y + h / 2 + 1);
      }
      ctx.restore();
    }
    /** Mini-balões das conversas (só emoji). */
    drawChats(now) {
      const { ctx } = this;
      for (const ch of this.sim.chars.values()) {
        if (!ch.chatEmoji || now > ch.chatUntil) continue;
        const head = this.renderer.heads.get(ch.id);
        if (!head || !head.visible) continue;
        const px = this.sx(head.x);
        const py = this.sy(head.y);
        const k = Math.min(1, (ch.chatUntil - now) / 300, 1 - (ch.chatUntil - now - 1e3) / 200);
        const r = 12;
        const side = ch.dir === "left" ? -1 : 1;
        const x = Math.round(px + side * 12);
        const y = Math.round(py - 16 - (1 - Math.min(1, k)) * 4);
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, k));
        ctx.fillStyle = "rgba(16,20,32,0.2)";
        ctx.beginPath();
        ctx.arc(x, y + 1.5, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.moveTo(x - side * 4, y + r - 2);
        ctx.lineTo(x - side * 9, y + r + 4);
        ctx.lineTo(x - side * 1, y + r - 1);
        ctx.fill();
        ctx.font = `14px ${UI_FONT2}`;
        ctx.textAlign = "center";
        ctx.fillText(ch.chatEmoji, x, y + 1);
        ctx.textAlign = "left";
        ctx.restore();
      }
    }
    /** "+🪙10" subindo e sumindo sobre quem ganhou (ou "−🪙10" sobre quem perdeu). */
    drawFloaters(now) {
      const fl = this.sim.social.floaters;
      if (!fl.length || this.zoom < TINY_ZOOM) return;
      const { ctx } = this;
      ctx.save();
      ctx.font = FLOAT_FONT;
      ctx.textAlign = "center";
      ctx.lineJoin = "round";
      for (const f of fl) {
        const head = this.renderer.heads.get(f.charId);
        if (!head || !head.visible || now < f.at) continue;
        const t2 = Math.min(1, (now - f.at) / (f.until - f.at));
        const x = Math.round(this.sx(head.x) + 10 * this.zoom + 12);
        const y = Math.round(this.sy(head.y) + 4 * this.zoom - t2 * 24);
        ctx.globalAlpha = t2 < 0.12 ? t2 / 0.12 : Math.max(0, 1 - Math.max(0, t2 - 0.6) / 0.4);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(20,24,36,0.85)";
        ctx.strokeText(f.text, x, y);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, x, y);
      }
      ctx.restore();
    }
    // =================================================================== etiquetas
    /** Larguras das partes da etiqueta. O selo "CODEX" (como o "SUB") só aparece fora do modo compacto. */
    labelWidth(l) {
      const ch = l.ch;
      const acc = this.sim.accounts.get(ch.info.account);
      const nameW = this.measure(LABEL_FONT, ch.info.name);
      const chipW = acc ? 13 : 0;
      const visitor = ch === this.sim.visitor;
      const badgeW = visitor ? this.measure(BADGE_FONT, visitorBadge()) + 7 : ch.info.kind === "sub" && !l.compact ? this.measure(BADGE_FONT, "SUB") + 7 : 0;
      const codexW = ch.info.provider === "codex" && !l.compact ? this.measure(BADGE_FONT, CODEX_BADGE) + 7 : 0;
      return { nameW, chipW, badgeW, codexW };
    }
    /** Posiciona a etiqueta: nos pés (ou acima da cabeça); se colidir, tenta o outro lado. */
    placeLabel(l) {
      const { nameW, chipW, badgeW, codexW } = this.labelWidth(l);
      const w = Math.round(nameW + 10 + chipW + (badgeW ? badgeW + 3 : 0) + (codexW ? codexW + 3 : 0));
      const h = LABEL_H;
      const x = Math.round(this.sx(l.head.x) - w / 2);
      const below = Math.round(this.sy(l.head.feetY) + 3);
      const iconLift = this.iconLift(l.ch) * this.zoom;
      const over = Math.round(this.sy(l.head.y) - iconLift - h - 3);
      const first = l.above ? over : below;
      const second = l.above ? below : over;
      l.w = w;
      l.h = h;
      l.x = x;
      if (!this.overlaps(x, first, w, h)) l.y = first;
      else if (!this.overlaps(x, second, w, h)) l.y = second;
      else if (l.prio >= 90) l.y = first;
      else return false;
      this.place(l.x, l.y, w, h);
      return true;
    }
    drawLabel(l, sel) {
      const { ctx } = this;
      const ch = l.ch;
      const acc = this.sim.accounts.get(ch.info.account);
      const sub = ch.info.kind === "sub";
      const codex = ch.info.provider === "codex" || acc?.provider === "codex";
      const { nameW, chipW, badgeW, codexW } = this.labelWidth(l);
      const { x, y, w, h } = l;
      const selected = sel.agent === ch.id;
      ctx.fillStyle = selected ? "rgba(18,96,140,0.95)" : ch.mode === "wait" ? "rgba(120,78,0,0.92)" : "rgba(22,26,38,0.82)";
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 7.5);
      ctx.fill();
      let cx = x + 4;
      if (acc && codex) {
        steppedRect(ctx, cx, y + h / 2 - 5, 10, 10, 2);
        ctx.fillStyle = CODEX_CHIP_BG;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = acc.color;
        steppedRect(ctx, cx + 0.75, y + h / 2 - 4.25, 8.5, 8.5, 1.6);
        ctx.stroke();
        ctx.font = CHIP_FONT;
        ctx.textAlign = "center";
        ctx.fillStyle = acc.color;
        ctx.fillText(acc.short.slice(0, 1), cx + 5, y + h / 2 + 0.5);
        ctx.textAlign = "left";
        cx += chipW;
      } else if (acc) {
        ctx.beginPath();
        ctx.arc(cx + 5, y + h / 2, 5, 0, Math.PI * 2);
        ctx.fillStyle = acc.color;
        ctx.fill();
        ctx.font = CHIP_FONT;
        ctx.textAlign = "center";
        ctx.fillStyle = luminance2(acc.color) > 0.62 ? "#1d2330" : "#ffffff";
        ctx.fillText(acc.short.slice(0, 1), cx + 5, y + h / 2 + 0.5);
        ctx.textAlign = "left";
        cx += chipW;
      }
      ctx.font = LABEL_FONT;
      ctx.fillStyle = "#f5f7fb";
      ctx.fillText(ch.info.name, cx + 1, y + h / 2 + 0.5);
      cx += nameW + 4;
      if (badgeW) {
        ctx.fillStyle = ch.appearance.lanyard ?? "#f2b33d";
        ctx.beginPath();
        ctx.roundRect(cx, y + 3, badgeW, h - 6, 4);
        ctx.fill();
        ctx.font = BADGE_FONT;
        ctx.fillStyle = "#2a2000";
        ctx.fillText(ch === this.sim.visitor ? visitorBadge() : "SUB", cx + 3.5, y + h / 2 + 0.5);
        cx += badgeW + 3;
      } else if (sub) {
        ctx.fillStyle = ch.appearance.lanyard ?? "#f2b33d";
        ctx.beginPath();
        ctx.arc(x + w - 3, y + 3, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (codexW) {
        ctx.fillStyle = "rgba(255,255,255,0.16)";
        ctx.beginPath();
        ctx.roundRect(cx, y + 3, codexW, h - 6, 3);
        ctx.fill();
        ctx.font = BADGE_FONT;
        ctx.fillStyle = "#e8ecf5";
        ctx.fillText(CODEX_BADGE, cx + 3.5, y + h / 2 + 0.5);
      }
    }
  };
  function sayIcon(text) {
    const m = new RegExp("\\p{Extended_Pictographic}(?:\\uFE0F)?", "u").exec(text);
    return m ? m[0] : "\u{1F4AC}";
  }
  function visitorBadge() {
    return tr("visitante").toLocaleUpperCase();
  }

  // vendor/habblaud/openbot/actor-adapter.ts
  var imageCaches = /* @__PURE__ */ new WeakMap();
  var actorsByCanvas = /* @__PURE__ */ new WeakMap();
  function safeColor(value, fallback2) {
    return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback2;
  }
  function avatarState(status, mode) {
    if (status === "waiting" || mode === "wait") return "peeking";
    if (status === "working" || status === "thinking" || mode === "work" || mode === "shell") return "thinking";
    if (status === "done") return "done";
    if (status === "error" || status === "interrupted") return "rest";
    return "idle";
  }
  function svgFor(agent, state, reducedMotion2) {
    const avatars = window.OpenBotAvatars;
    const characters = window.OpenBotCharacters;
    if (!avatars || !characters || typeof characters.svg !== "function") return null;
    const raw = agent.openbot?.avatar || avatars.defaultForId?.(agent.id) || "orbit";
    const display = avatars.displayFor?.(raw) || raw;
    const characterId = display.startsWith("pal-") ? display.slice(4) : display;
    const phase = -(agent.id.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 13 * 0.41);
    try {
      return characters.svg(characterId, {
        state,
        size: 52,
        phase,
        motion: reducedMotion2 ? "off" : "auto",
        withStyle: true
      });
    } catch {
      return null;
    }
  }
  function svgImage(canvas2, agent, state) {
    let cache3 = imageCaches.get(canvas2);
    if (!cache3) {
      cache3 = /* @__PURE__ */ new Map();
      imageCaches.set(canvas2, cache3);
    }
    const reducedMotion2 = canvas2.dataset.reducedMotion === "true";
    const avatar = agent.openbot?.avatar || agent.id;
    const agentAvatars = window.OpenBotAgentAvatars;
    const dark = window.matchMedia?.("(prefers-color-scheme: dark)").matches === true;
    const raster = agentAvatars?.ids.includes(avatar) ? `assets/agent-hud/${avatar.slice(6)}-${dark ? "dark" : "light"}.png` : null;
    const key = [avatar, state, reducedMotion2 ? "off" : "auto", dark ? "dark" : "light"].join("");
    const cached = cache3.get(key);
    if (cached) return cached;
    const svg = raster ? null : svgFor(agent, state, reducedMotion2);
    if (!raster && !svg) return null;
    const image = document.createElement("img");
    image.decoding = "async";
    image.setAttribute("alt", "");
    image.onload = () => {
      image.__obReady = true;
      canvas2.dispatchEvent(new Event("habblaud-avatar-ready"));
    };
    image.onerror = () => {
      image.__obFailed = true;
      canvas2.dispatchEvent(new Event("habblaud-avatar-ready"));
    };
    image.setAttribute("src", raster || `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
    cache3.set(key, image);
    return image;
  }
  function beginOpenBotFrame(canvas2) {
    actorsByCanvas.set(canvas2, /* @__PURE__ */ new Set());
    canvas2.dataset.officeActorRenderer = "openbot-svg";
    canvas2.dataset.officeActorIds = "";
    canvas2.dataset.officeAvatarCount = "0";
  }
  function recordActor(canvas2, id) {
    let actors = actorsByCanvas.get(canvas2);
    if (!actors) {
      beginOpenBotFrame(canvas2);
      actors = actorsByCanvas.get(canvas2);
    }
    actors.add(id);
    canvas2.dataset.officeActorIds = Array.from(actors).sort().join(",");
    canvas2.dataset.officeAvatarCount = String(actors.size);
  }
  function fallback(canvas2, ctx, agent, x, y) {
    const avatars = window.OpenBotAvatars;
    const raw = agent.openbot?.avatar || avatars?.defaultForId?.(agent.id) || "orbit";
    const display = avatars?.displayFor?.(raw) || raw;
    const tone = safeColor(avatars?.meta?.[display]?.tone || agent.openbot?.color, "#54bff3");
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = tone;
    ctx.beginPath();
    ctx.ellipse(x, y - 16, 10, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x - 3, y - 18, 1.8, 0, Math.PI * 2);
    ctx.arc(x + 3, y - 18, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#25252b";
    ctx.beginPath();
    ctx.arc(x - 3, y - 18, 0.8, 0, Math.PI * 2);
    ctx.arc(x + 3, y - 18, 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  function drawServiceLight(ctx, agent, x, y) {
    const light = agent.openbot?.light;
    const colors = { on: "#52d59a", dim: "#e6b95c", off: "#46505b", unknown: "#9aa2ac" };
    const color = colors[light || "unknown"] || colors.unknown;
    const cx = x + 12;
    const cy = y - 6;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(18, 23, 31, .88)";
    ctx.beginPath();
    ctx.roundRect(cx - 5.5, cy - 5.5, 11, 11, 3);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.68)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    if (light === "off") {
      ctx.fillStyle = color;
      ctx.arc(cx, cy, 2.8, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.fillStyle = color;
      ctx.arc(cx, cy, 3.1, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!light || light === "unknown") {
      ctx.strokeStyle = "#10151d";
      ctx.lineWidth = 1.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx - 1.2, cy);
      ctx.lineTo(cx + 1.2, cy);
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawOpenBotServiceLights(ctx, characters, heads) {
    for (const ch of characters) {
      if (!ch.info?.openbot) continue;
      const head = heads.get(ch.id);
      if (head?.visible) drawServiceLight(ctx, ch.info, head.x, head.feetY);
    }
  }
  function drawOpenBotActor(ctx, ch, x, y) {
    const agent = ch.info;
    if (!agent || !agent.openbot) return null;
    const canvas2 = ctx.canvas;
    recordActor(canvas2, agent.id);
    const state = avatarState(agent.openbot.status, ch.mode);
    const image = svgImage(canvas2, agent, state);
    const walking = ch.pose === "walk" || ch.pose === "run";
    const reducedMotion2 = canvas2.dataset.reducedMotion === "true";
    const bob = walking && !reducedMotion2 ? Math.sin(ch.animT / 95) * 1.15 : 0;
    const left = ch.dir === "left";
    const width = ch.seated ? 28 : 31;
    const height = ch.seated ? 28 : 31;
    const top = y - height + bob;
    if (image?.complete && image.naturalWidth > 0) {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      if (left) {
        ctx.translate(x, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(image, -width / 2, top, width, height);
      } else {
        ctx.drawImage(image, x - width / 2, top, width, height);
      }
      ctx.restore();
    } else if (image?.__obFailed || !image || !image.complete) {
      fallback(canvas2, ctx, agent, x, y - bob);
    }
    return { bx: x - width / 2, by: top, bw: width, bh: height, y: top };
  }

  // vendor/habblaud/upstream/client/src/world/layout/exterior.ts
  var EXTERIOR_WALL = { base: "#cfc8bd", trim: "#8a8174", pattern: "brick", exterior: true };
  function layoutExterior(cols) {
    const w = cols * COL_W;
    const bounds = { x: -EXT_WEST, y: -EXT_NORTH, w: w + EXT_WEST + EXT_EAST, h: BUILDING_H + EXT_NORTH + EXT_SOUTH };
    const px = (t2) => t2 * TILE;
    const floors = [];
    const props = [];
    const rng = mulberry32(49374 + cols);
    floors.push({ kind: "grass", x: px(bounds.x), y: px(bounds.y), w: px(bounds.w), h: px(bounds.h), seed: 11 });
    const south = BUILDING_H;
    floors.push({ kind: "sidewalk", x: px(bounds.x), y: px(south + 2), w: px(bounds.w), h: px(2), seed: 12 });
    floors.push({ kind: "street", x: px(bounds.x), y: px(south + 4), w: px(bounds.w), h: px(5), seed: 13 });
    floors.push({ kind: "sidewalk", x: px(bounds.x), y: px(south + 9), w: px(bounds.w), h: px(2), seed: 14 });
    floors.push({ kind: "sidewalk", x: px(-3), y: px(CORRIDOR_Y), w: px(3), h: px(5), seed: 15 });
    floors.push({ kind: "sidewalk", x: px(-3), y: px(CORRIDOR_Y + 5), w: px(2), h: px(south + 2 - CORRIDOR_Y - 5), seed: 16 });
    for (let x = bounds.x + 1; x < bounds.x + bounds.w - 1; x += 4 + Math.floor(rng() * 3)) {
      props.push({ kind: rng() < 0.25 ? "pine" : "tree", x: px(x) + Math.floor(rng() * 8), y: px(-3) - Math.floor(rng() * 20), seed: Math.floor(rng() * 1e9) });
      if (rng() < 0.6) props.push({ kind: "bush", x: px(x + 2), y: px(-1) - 2, seed: Math.floor(rng() * 1e9) });
    }
    for (const [row, gap] of [
      [-6, 5],
      [-10, 6],
      [-14, 8]
    ]) {
      for (let x = bounds.x + 2; x < bounds.x + bounds.w - 1; x += gap + Math.floor(rng() * 4)) {
        props.push({ kind: rng() < 0.3 ? "pine" : "tree", x: px(x) + Math.floor(rng() * 8), y: px(row) - Math.floor(rng() * 12), seed: Math.floor(rng() * 1e9) });
      }
    }
    for (const side of [-1, 1]) {
      for (const band of [0, 7, 13]) {
        const baseX = side < 0 ? -6 - band : w + 4 + band;
        for (let y = 1; y < BUILDING_H; y += 3 + Math.floor(rng() * 3)) {
          if (side < 0 && band === 0 && y >= CORRIDOR_Y - 1 && y <= south + 1) continue;
          props.push({ kind: rng() < 0.3 ? "pine" : "tree", x: px(baseX + Math.floor(rng() * 5)), y: px(y + 1), seed: Math.floor(rng() * 1e9) });
          if (band === 0 && rng() < 0.5) props.push({ kind: "bush", x: px(side < 0 ? -2 : w + 1), y: px(y + 2), seed: Math.floor(rng() * 1e9) });
        }
      }
    }
    for (let x = 0; x < w; x += 2) {
      const col = Math.floor(x / COL_W);
      const lx = x - col * COL_W;
      const gate = col >= CORE_COLS && (lx === 6 || lx === 8) ? slotAt(col, "south") : void 0;
      props.push({ kind: x / 2 % 3 === 1 ? "flowers" : "hedge", x: px(x) + TILE, y: px(south + 1) + 10, seed: x * 7 + 3, whenRoom: gate });
    }
    for (let x = bounds.x + 4; x < bounds.x + bounds.w; x += 10) {
      props.push({ kind: "lamp", x: px(x), y: px(south + 3) + 6, seed: x });
    }
    for (const row of [13, 17, 21]) {
      for (let x = bounds.x + 3; x < bounds.x + bounds.w - 2; x += 6 + Math.floor(rng() * 5)) {
        props.push({ kind: rng() < 0.2 ? "pine" : "tree", x: px(x) + Math.floor(rng() * 10), y: px(south + row) + Math.floor(rng() * 10), seed: Math.floor(rng() * 1e9) });
        if (rng() < 0.3) props.push({ kind: "bush", x: px(x + 3), y: px(south + row + 1), seed: Math.floor(rng() * 1e9) });
      }
    }
    props.push({ kind: "bench", x: px(-4), y: px(CORRIDOR_Y + 3) + 6, seed: 1 });
    props.push({ kind: "totem", x: px(-3) + 6, y: px(CORRIDOR_Y + 1), seed: 2 });
    const streetY = px(south + 4);
    const streetH = px(5);
    return {
      bounds,
      floors,
      props,
      lanes: [
        { y: streetY + Math.round(streetH * 0.36), dir: 1 },
        { y: streetY + Math.round(streetH * 0.86), dir: -1 }
      ],
      streetY,
      streetH
    };
  }
  function slotShell(slot, lastColumn) {
    const col = slotColumn(slot);
    const side = slotSide(slot);
    const rect = cellRect(col, side);
    const x0 = rect.x * TILE;
    const rng = mulberry32(39549 + slot * 31);
    const walls = [];
    const windows = [];
    const floors = [];
    const props = [];
    const W = COL_W * TILE;
    const T = (n) => n * TILE;
    const seed = () => Math.floor(rng() * 1e9);
    const deck = (lx, ly, w, h) => {
      floors.push({ kind: "sidewalk", x: x0 + T(lx), y: T(rect.y + ly), w: T(w), h: T(h), seed: slot + 7 });
      floors.push({ kind: "wood", x: x0 + T(lx) + 4, y: T(rect.y + ly) + 4, w: T(w) - 8, h: T(h) - 8, seed: slot + 8 });
    };
    if (side === "north") {
      const fy = (CORRIDOR_Y - 2) * TILE;
      walls.push({ kind: "face", x: x0, y: fy, w: W, style: EXTERIOR_WALL });
      [3, 8, 13].forEach(
        (cx, i) => windows.push({ id: `shell:${slot}:janela${i}`, kind: "window", cx: x0 + cx * TILE, baseY: CORRIDOR_Y * TILE, on: "face", order: 0 })
      );
      if (lastColumn) walls.push({ kind: "cap", x: x0 + W - TILE / 2, y: fy, w: TILE / 2, h: 2 * TILE, style: EXTERIOR_WALL });
      floors.push({ kind: "sidewalk", x: x0 + T(7), y: T(rect.y), w: T(2), h: T(3), seed: slot });
      deck(3, 3, 10, 5);
      props.push({ kind: "parasol", x: x0 + T(5.5), y: T(rect.y + 6) + 4, seed: seed(), slot });
      props.push({ kind: "parasol", x: x0 + T(10.5), y: T(rect.y + 6) + 4, seed: seed(), slot });
      props.push({ kind: "bush", x: x0 + T(3.5), y: T(rect.y + 3) + 6, seed: seed(), slot });
      props.push({ kind: "bush", x: x0 + T(12.5), y: T(rect.y + 3) + 6, seed: seed(), slot });
      for (const cx of [3, 8, 13]) props.push({ kind: "flowers", x: x0 + T(cx), y: T(rect.y + 9) + 12, seed: slot * 3 + cx, slot });
      props.push({ kind: "tree", x: x0 + T(1) + 4, y: T(rect.y + 3), seed: seed(), slot });
      props.push({ kind: rng() < 0.5 ? "pine" : "tree", x: x0 + T(15) - 4, y: T(rect.y + 3) + 6, seed: seed(), slot });
      props.push({ kind: "bush", x: x0 + T(1) + 8, y: T(rect.y + 8), seed: seed(), slot });
      props.push({ kind: "bush", x: x0 + T(15) - 8, y: T(rect.y + 8), seed: seed(), slot });
    } else {
      walls.push({ kind: "south", x: x0, y: SOUTH_Y * TILE, w: W, style: EXTERIOR_WALL });
      if (lastColumn) walls.push({ kind: "cap", x: x0 + W - TILE / 2, y: SOUTH_Y * TILE, w: TILE / 2, h: TILE, style: EXTERIOR_WALL });
      floors.push({ kind: "sidewalk", x: x0 + T(7), y: T(rect.y + 1), w: T(2), h: T(rect.h - 1), seed: slot });
      props.push({ kind: "paving", x: x0 + T(7), y: T(BUILDING_H), seed: slot, slot });
      deck(3, 3.5, 10, 5);
      props.push({ kind: "parasol", x: x0 + T(5.5), y: T(rect.y + 6.5) + 4, seed: seed(), slot });
      props.push({ kind: "parasol", x: x0 + T(10.5), y: T(rect.y + 6.5) + 4, seed: seed(), slot });
      props.push({ kind: "bush", x: x0 + T(3.5), y: T(rect.y + 4) + 4, seed: seed(), slot });
      props.push({ kind: "bush", x: x0 + T(12.5), y: T(rect.y + 4) + 4, seed: seed(), slot });
      for (const cx of [3, 13]) props.push({ kind: "flowers", x: x0 + T(cx), y: T(rect.y + 2), seed: slot * 3 + cx, slot });
      props.push({ kind: "bench", x: x0 + T(4), y: T(rect.y + 10) + 6, seed: slot, slot });
      props.push({ kind: "bench", x: x0 + T(12), y: T(rect.y + 10) + 6, seed: slot + 1, slot });
      props.push({ kind: "tree", x: x0 + T(1) + 6, y: T(rect.y + 11), seed: seed(), slot });
      props.push({ kind: rng() < 0.5 ? "pine" : "tree", x: x0 + T(15) - 6, y: T(rect.y + 11) + 4, seed: seed(), slot });
      props.push({ kind: "rock", x: x0 + T(14), y: T(rect.y + 2) + 4, seed: slot + 3, slot });
    }
    return { slot, rect, walls, windows, floors, props };
  }

  // vendor/habblaud/upstream/client/src/world/sim/behavior.ts
  function modeFor(status, opts) {
    if (opts.missing || status === "offline") return "leave";
    if (status === "done") return opts.kind === "sub" ? "deliver" : "idle";
    if (opts.kind === "sub" && opts.parentGone) return "leave";
    if (status === "waiting") return "wait";
    if (status === "shell") return "shell";
    if (status === "working") return opts.now !== void 0 && foregroundWaiting(opts.shells, opts.now) ? "shell" : "work";
    return "idle";
  }
  function screenModeFor(kind) {
    switch (kind) {
      case "edit":
      case "write":
      case "think":
        return "code";
      case "run":
      case "test":
      case "git":
        return "terminal";
      case "web":
      case "browser":
      case "mcp":
        return "browser";
      case "search":
        return "search";
      case "read":
      case "respond":
      case "compact":
        return "docs";
      case "plan":
        return "tasks";
      case "communicate":
      case "ask":
      case "prompt":
      case "delegate":
        return "chat";
      case "wait":
      case "error":
        return "alert";
      case "skill":
        return "tasks";
      case "done":
        return "idle";
      default:
        return "code";
    }
  }
  var IDLE_WEIGHTS = {
    coffee: 18,
    water: 12,
    bathroom: 8,
    lounge: 12,
    pingpong: 9,
    talk: 13,
    window: 7,
    shelf: 6,
    stretch: 8,
    arcade: 5,
    snack: 5,
    mirror: 3,
    phone: 6
  };
  function pickIdleActivity(rng, avail = {}, weights = IDLE_WEIGHTS) {
    let total = 0;
    for (const k of Object.keys(IDLE_WEIGHTS)) if (avail[k] !== false) total += weights[k];
    if (total <= 0) return null;
    let r = rng() * total;
    for (const k of Object.keys(IDLE_WEIGHTS)) {
      if (avail[k] === false) continue;
      r -= weights[k];
      if (r < 0) return k;
    }
    return null;
  }
  var SIT_RANGE = {
    calm: [16e3, 42e3],
    normal: [6e3, 2e4],
    lively: [3e3, 1e4]
  };
  function idleSitMs(rng, liveliness) {
    const [a, b] = SIT_RANGE[liveliness] ?? SIT_RANGE.normal;
    return a + rng() * (b - a);
  }
  var LONG_IDLE_MS = 10 * 6e4;
  function isLongIdle(status, statusSince, now) {
    return status === "idle" && now - statusSince > LONG_IDLE_MS;
  }
  function chooseSeat(spots, isFree, _kind) {
    const desks = spots.filter((s) => s.kind === "desk" && isFree(s.id)).sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
    if (desks.length) return desks[0];
    for (const kind of ["stool", "nook", "stand"]) {
      const free = spots.find((s) => s.kind === kind && isFree(s.id));
      if (free) return free;
    }
    return null;
  }
  function shouldRun(pathTiles, mode) {
    if (mode === "wait") return pathTiles > 2;
    if (mode === "work") return pathTiles > 12;
    if (mode === "shell") return pathTiles > 20;
    return false;
  }
  function isLastInRoom(roomId, selfId, chars) {
    for (const c of chars) if (c.id !== selfId && c.roomId === roomId && !c.leaving) return false;
    return true;
  }
  function canDismantle(r, delayMs) {
    return !r.listed && r.occupants === 0 && !r.lightOn && r.dark && r.unlistedForMs >= delayMs;
  }
  function lightLevel(on, elapsedMs) {
    const e = Math.max(0, elapsedMs);
    if (on) {
      if (e < 70) return 0.75;
      if (e < 160) return 0.1;
      if (e < 220) return 0.9;
      if (e < 330) return 0.25;
      return Math.min(1, 0.25 + (e - 330) / 220);
    }
    if (e < 60) return 0.55;
    if (e < 120) return 0.95;
    return Math.max(0, 0.95 * (1 - (e - 120) / 480));
  }

  // vendor/habblaud/upstream/client/src/world/render/daylight.ts
  var FIXED_DAY_HOUR = 13.5;
  var FIXED_NIGHT_HOUR = 22.5;
  var WHITE = [255, 255, 255];
  var LAMP = [244, 220, 184];
  var SUN = [255, 222, 184];
  var VIGIL = [138, 144, 180];
  var KEYS = [
    [0, 1, 0, [70, 84, 140]],
    [4.5, 1, 0, [72, 86, 142]],
    [5.25, 0.86, 0.25, [104, 100, 156]],
    [5.9, 0.56, 0.8, [190, 146, 168]],
    [6.5, 0.2, 1, [255, 208, 174]],
    [7.25, 0, 0.35, [255, 238, 220]],
    [8, 0, 0, WHITE],
    [16.25, 0, 0, WHITE],
    [17.25, 0.04, 0.45, [255, 236, 206]],
    [18, 0.24, 1, [255, 202, 162]],
    [18.6, 0.55, 0.75, [194, 148, 164]],
    [19.25, 0.85, 0.3, [110, 108, 162]],
    [20, 1, 0, [80, 96, 150]],
    [24, 1, 0, [70, 84, 140]]
  ];
  var clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  function wrapHour(hour) {
    if (!Number.isFinite(hour)) return 0;
    return (hour % 24 + 24) % 24;
  }
  function mixRgb(a, b, t2) {
    const k = clamp(t2, 0, 1);
    return [Math.round(a[0] + (b[0] - a[0]) * k), Math.round(a[1] + (b[1] - a[1]) * k), Math.round(a[2] + (b[2] - a[2]) * k)];
  }
  function phaseOf(hour) {
    const h = wrapHour(hour);
    if (h < 5) return "madrugada";
    if (h < 7) return "amanhecer";
    if (h < 17) return "dia";
    if (h < 19) return "entardecer";
    return "noite";
  }
  function ambientAt(hour) {
    const h = wrapHour(hour);
    let i = 0;
    while (i < KEYS.length - 2 && KEYS[i + 1][0] <= h) i++;
    const [h0, n0, w0, c0] = KEYS[i];
    const [h1, n1, w1, c1] = KEYS[i + 1];
    const u = (h - h0) / Math.max(1e-6, h1 - h0);
    const night = n0 + (n1 - n0) * u;
    const warm = w0 + (w1 - w0) * u;
    const outside = mixRgb(c0, c1, u);
    const inside = mixRgb(mixRgb(WHITE, LAMP, night), SUN, warm * (1 - night) * 0.55);
    const dim = mixRgb(WHITE, VIGIL, night);
    return { hour: h, phase: phaseOf(h), night, warm, outside, inside, dim };
  }
  function isNeutral(a) {
    return a.night < 5e-3 && a.outside[0] >= 254 && a.outside[1] >= 254 && a.outside[2] >= 254 && a.inside[2] >= 254;
  }
  function approachAmbient(cur, target, k) {
    const t2 = clamp(k, 0, 1);
    if (t2 >= 1) return target;
    const lerp = (a, b) => a + (b - a) * t2;
    return {
      hour: target.hour,
      phase: target.phase,
      night: lerp(cur.night, target.night),
      warm: lerp(cur.warm, target.warm),
      outside: mixRgb(cur.outside, target.outside, t2),
      inside: mixRgb(cur.inside, target.inside, t2),
      dim: mixRgb(cur.dim, target.dim, t2)
    };
  }
  function ambientDistance(a, b) {
    let d = Math.abs(a.night - b.night) * 255 + Math.abs(a.warm - b.warm) * 255;
    for (let i = 0; i < 3; i++) d += Math.abs(a.outside[i] - b.outside[i]) + Math.abs(a.inside[i] - b.inside[i]) + Math.abs(a.dim[i] - b.dim[i]);
    return d;
  }
  function sunbeamAt(hour) {
    const h = wrapHour(hour);
    if (h <= 6.1 || h >= 18.4) return null;
    const p = clamp((h - 6) / 12, 0, 1);
    const elevation = Math.sin(p * Math.PI);
    const len = clamp(18 + (1 - elevation) * 70, 18, 88);
    const skew = clamp(-Math.cos(p * Math.PI) * 0.9, -0.9, 0.9);
    const edge = Math.min(clamp((h - 6.1) / 0.6, 0, 1), clamp((18.4 - h) / 0.6, 0, 1));
    const golden = Math.max(0, 1 - Math.abs(h - 7.2) / 1.6, 1 - Math.abs(h - 17.2) / 1.6);
    return { len: Math.round(len), skew, alpha: edge * (0.12 + 0.2 * golden) };
  }
  function parseHourParam(search) {
    if (!search) return null;
    let raw;
    try {
      raw = new URLSearchParams(search).get("hora");
    } catch {
      return null;
    }
    if (raw === null) return null;
    const m = /^\s*(\d{1,2})(?:\s*[:h]\s*(\d{2})?)?\s*$/i.exec(raw);
    if (!m) return null;
    const hh = Number(m[1]);
    const mm = m[2] === void 0 ? 0 : Number(m[2]);
    if (hh > 24 || mm > 59 || hh === 24 && mm > 0) return null;
    return wrapHour(hh + mm / 60);
  }
  function effectiveHour(mode, override, date) {
    if (override !== null && Number.isFinite(override)) return wrapHour(override);
    if (mode === "day") return FIXED_DAY_HOUR;
    if (mode === "night") return FIXED_NIGHT_HOUR;
    return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  }
  function daylightModeOf(o) {
    if (o.daylight === "auto" || o.daylight === "day" || o.daylight === "night") return o.daylight;
    return o.dayNight ? "auto" : "day";
  }
  function rgbCss(c) {
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }

  // vendor/habblaud/upstream/client/src/world/render/props.ts
  var cache = /* @__PURE__ */ new Map();
  function makeCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    return [c, ctx];
  }
  function hex(c) {
    const n = parseInt(c.slice(1), 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }
  var Painter = class {
    constructor(ctx, w, h) {
      this.ctx = ctx;
      this.w = w;
      this.h = h;
      this.data = ctx.getImageData(0, 0, w, h);
    }
    data;
    set(x, y, color, a = 255) {
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      const [r, g, b] = hex(color);
      const i = (y * this.w + x) * 4;
      this.data.data[i] = r;
      this.data.data[i + 1] = g;
      this.data.data[i + 2] = b;
      this.data.data[i + 3] = a;
    }
    alpha(x, y) {
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
      return this.data.data[(y * this.w + x) * 4 + 3];
    }
    flush() {
      this.ctx.putImageData(this.data, 0, 0);
    }
  };
  function shadowEllipse(ctx, cx, cy, rx, ry, a = 0.22) {
    ctx.fillStyle = `rgba(28,36,52,${a})`;
    for (let y = -ry; y <= ry; y++) {
      const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - y * y / (ry * ry))));
      ctx.fillRect(cx - half, cy + y, half * 2, 1);
    }
  }
  function canopy(p, rng, cx, cy, r, tones, outline) {
    const blobs = [[cx, cy, r]];
    for (let i = 0; i < 4; i++) {
      const a = rng() * Math.PI * 2;
      const d = r * (0.35 + rng() * 0.35);
      blobs.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, r * (0.55 + rng() * 0.25)]);
    }
    const inside = (x, y) => blobs.some(([bx, by, br]) => (x - bx) ** 2 + (y - by) ** 2 <= br * br);
    const x0 = Math.floor(cx - r * 1.8);
    const x1 = Math.ceil(cx + r * 1.8);
    const y0 = Math.floor(cy - r * 1.6);
    const y1 = Math.ceil(cy + r * 1.6);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (!inside(x + 0.5, y + 0.5)) continue;
        const edge = !inside(x - 0.5, y + 0.5) || !inside(x + 1.5, y + 0.5) || !inside(x + 0.5, y - 0.5) || !inside(x + 0.5, y + 1.5);
        if (edge) {
          p.set(x, y, outline);
          continue;
        }
        const nx = (x - cx) / r;
        const ny = (y - cy) / r;
        const light = -nx * 0.45 - ny * 0.75 + (rng() - 0.5) * 0.55;
        const k = light > 0.55 ? 3 : light > 0.05 ? 2 : light > -0.5 ? 1 : 0;
        p.set(x, y, tones[k]);
      }
    }
  }
  function treeSprite(seed) {
    const rng = mulberry32(seed);
    const [c, ctx] = makeCanvas(36, 48);
    shadowEllipse(ctx, 18, 45, 12, 3, 0.25);
    const p = new Painter(ctx, 36, 48);
    for (let y = 30; y < 46; y++) {
      for (let x = 16; x < 21; x++) {
        const col = x === 16 ? "#8a6243" : x === 20 ? "#4a3222" : "#6b4a32";
        p.set(x, y, col);
      }
    }
    p.set(15, 45, "#4a3222");
    p.set(21, 45, "#4a3222");
    const variants = [
      ["#2f6a43", "#3f8550", "#5aa45d", "#86c873"],
      ["#356b3c", "#4b8a45", "#6aa956", "#9fcf74"],
      ["#2c6250", "#3a7e5f", "#53a071", "#82c489"]
    ];
    canopy(p, rng, 18, 18, 11 + Math.floor(rng() * 3), variants[Math.floor(rng() * variants.length)], "#25463a");
    p.flush();
    return { canvas: c, ax: 18, ay: 45 };
  }
  function pineSprite(seed) {
    const rng = mulberry32(seed);
    const [c, ctx] = makeCanvas(28, 48);
    shadowEllipse(ctx, 14, 45, 9, 3, 0.25);
    const p = new Painter(ctx, 28, 48);
    for (let y = 38; y < 46; y++) for (let x = 12; x < 16; x++) p.set(x, y, x === 12 ? "#8a6243" : x === 15 ? "#4a3222" : "#6b4a32");
    const tones = ["#24533f", "#2f6b4f", "#3f8a5f", "#62ab79"];
    const layers = 4;
    for (let l = 0; l < layers; l++) {
      const top = 4 + l * 8;
      const bottom = top + 14;
      for (let y = top; y < bottom; y++) {
        const half = Math.round((y - top) / (bottom - top) * (5 + l * 2.2));
        for (let x = 14 - half; x <= 14 + half; x++) {
          const edge = x === 14 - half || x === 14 + half || y === bottom - 1;
          const light = (14 - x) / (half + 1) - (y - top) / (bottom - top) + (rng() - 0.5) * 0.5;
          p.set(x, y, edge ? "#1d3f33" : tones[light > 0.5 ? 3 : light > -0.1 ? 2 : light > -0.6 ? 1 : 0]);
        }
      }
    }
    p.flush();
    return { canvas: c, ax: 14, ay: 45 };
  }
  function bushSprite(seed) {
    const rng = mulberry32(seed);
    const [c, ctx] = makeCanvas(22, 16);
    shadowEllipse(ctx, 11, 14, 9, 2, 0.22);
    const p = new Painter(ctx, 22, 16);
    canopy(p, rng, 11, 9, 6, ["#34663f", "#47864c", "#62a45a", "#8cc66f"], "#264a36");
    if (rng() < 0.6) {
      const col = ["#f2d14b", "#f28aa5", "#ffffff"][Math.floor(rng() * 3)];
      for (let i = 0; i < 4; i++) p.set(6 + Math.floor(rng() * 10), 5 + Math.floor(rng() * 6), col);
    }
    p.flush();
    return { canvas: c, ax: 11, ay: 14 };
  }
  function flowersSprite(seed) {
    const rng = mulberry32(seed);
    const [c, ctx] = makeCanvas(30, 14);
    const p = new Painter(ctx, 30, 14);
    for (let y = 4; y < 13; y++) {
      for (let x = 1; x < 29; x++) {
        const border = y === 4 || y === 12 || x === 1 || x === 28;
        p.set(x, y, border ? y === 12 ? "#8d8a82" : "#b9b5aa" : "#6a4b35");
      }
    }
    const cols = ["#e8574a", "#f2c94c", "#f08bb0", "#ffffff", "#9b7be0"];
    for (let i = 0; i < 26; i++) {
      const x = 3 + Math.floor(rng() * 24);
      const y = 2 + Math.floor(rng() * 9);
      p.set(x, y + 1, "#3f8550");
      p.set(x, y, rng() < 0.75 ? cols[Math.floor(rng() * cols.length)] : "#5aa45d");
    }
    p.flush();
    return { canvas: c, ax: 15, ay: 13 };
  }
  function hedgeSprite(seed) {
    const rng = mulberry32(seed);
    const [c, ctx] = makeCanvas(34, 16);
    shadowEllipse(ctx, 17, 14, 15, 2, 0.2);
    const p = new Painter(ctx, 34, 16);
    for (let y = 3; y < 14; y++) {
      for (let x = 1; x < 33; x++) {
        const r = y === 3 ? 2 : y === 4 ? 1 : 0;
        if (x < 1 + r || x > 32 - r) continue;
        const edge = y === 3 || y === 13 || x === 1 + r || x === 32 - r;
        const light = -(y - 3) / 10 + (rng() - 0.5) * 0.6;
        p.set(x, y, edge ? "#264a36" : light > 0 ? "#6aa956" : light > -0.4 ? "#4b8a45" : "#356b3c");
      }
    }
    p.flush();
    return { canvas: c, ax: 17, ay: 14 };
  }
  function lampSprite() {
    const [c, ctx] = makeCanvas(10, 36);
    shadowEllipse(ctx, 5, 34, 4, 1, 0.25);
    ctx.fillStyle = "#2e3648";
    ctx.fillRect(4, 6, 2, 28);
    ctx.fillStyle = "#4a5468";
    ctx.fillRect(4, 6, 1, 28);
    ctx.fillStyle = "#2e3648";
    ctx.fillRect(1, 2, 8, 5);
    ctx.fillStyle = "#ffe9a8";
    ctx.fillRect(2, 4, 6, 2);
    ctx.fillStyle = "#fff6d6";
    ctx.fillRect(3, 4, 2, 1);
    ctx.fillStyle = "#3a4152";
    ctx.fillRect(3, 32, 4, 2);
    return { canvas: c, ax: 5, ay: 34 };
  }
  function benchSprite() {
    const [c, ctx] = makeCanvas(26, 14);
    shadowEllipse(ctx, 13, 12, 11, 2, 0.22);
    ctx.fillStyle = "#2e3648";
    ctx.fillRect(3, 8, 2, 4);
    ctx.fillRect(21, 8, 2, 4);
    ctx.fillStyle = "#7a5232";
    ctx.fillRect(1, 1, 24, 3);
    ctx.fillRect(1, 6, 24, 3);
    ctx.fillStyle = "#a0703f";
    ctx.fillRect(1, 1, 24, 1);
    ctx.fillRect(1, 6, 24, 1);
    ctx.fillStyle = "#5b3c25";
    ctx.fillRect(1, 8, 24, 1);
    ctx.fillRect(1, 3, 24, 1);
    return { canvas: c, ax: 13, ay: 12 };
  }
  function rockSprite(seed) {
    const rng = mulberry32(seed);
    const [c, ctx] = makeCanvas(16, 12);
    const p = new Painter(ctx, 16, 12);
    canopy(p, rng, 8, 7, 4, ["#7d8590", "#959da8", "#b3bac4", "#d3d8de"], "#4d5562");
    p.flush();
    return { canvas: c, ax: 8, ay: 11 };
  }
  function parasolSprite(seed) {
    const [c, ctx] = makeCanvas(32, 34);
    const palettes = [
      ["#e8574a", "#f6efe2", "#a83a33"],
      ["#2fb3a3", "#f6efe2", "#1f8579"],
      ["#f2b33d", "#fbf4e4", "#c88a1f"]
    ];
    const [a, b, dk] = palettes[seed % palettes.length];
    shadowEllipse(ctx, 16, 29, 12, 3, 0.24);
    ctx.fillStyle = "#5b3c25";
    ctx.fillRect(2, 24, 6, 5);
    ctx.fillRect(24, 24, 6, 5);
    ctx.fillStyle = "#a0703f";
    ctx.fillRect(2, 24, 6, 2);
    ctx.fillRect(24, 24, 6, 2);
    ctx.fillStyle = "#d8dde3";
    ctx.fillRect(10, 24, 12, 5);
    ctx.fillStyle = "#f4f6f8";
    ctx.fillRect(10, 24, 12, 2);
    ctx.fillStyle = "#8d96a3";
    ctx.fillRect(10, 28, 12, 1);
    ctx.fillStyle = "#4a5468";
    ctx.fillRect(15, 11, 2, 14);
    const p = new Painter(ctx, 32, 34);
    const cx = 15.5;
    const cy = 8;
    for (let y = 0; y <= 15; y++) {
      for (let x = 0; x < 32; x++) {
        const dx = (x - cx) / 14.5;
        const dy = (y - cy) / 7.5;
        const d = Math.abs(dx) + Math.abs(dy) * 0.55 + Math.hypot(dx, dy) * 0.45;
        if (d > 1) continue;
        const ang = Math.atan2(y - cy, x - cx);
        const gomo = Math.floor((ang + Math.PI) / (Math.PI * 2) * 8) % 2;
        const edge = d > 0.86;
        const lit = y < cy - 1;
        p.set(x, y, edge ? dk : gomo ? lit ? "#ffffff" : b : lit ? a : dk);
      }
    }
    p.set(15, 8, "#2e3648");
    p.set(16, 8, "#2e3648");
    p.flush();
    return { canvas: c, ax: 16, ay: 29 };
  }
  function totemSprite() {
    const [c, ctx] = makeCanvas(14, 34);
    shadowEllipse(ctx, 7, 32, 6, 1.5, 0.25);
    ctx.fillStyle = "#141b30";
    ctx.fillRect(2, 2, 10, 30);
    ctx.fillStyle = "#1c2541";
    ctx.fillRect(3, 3, 8, 28);
    ctx.fillStyle = "#2a355a";
    ctx.fillRect(3, 3, 1, 28);
    ctx.fillStyle = "#f2a33a";
    ctx.fillRect(3, 5, 8, 2);
    ctx.fillStyle = "#f5f1e6";
    ctx.fillRect(4, 11, 1, 6);
    ctx.fillRect(8, 11, 1, 6);
    ctx.fillRect(5, 13, 3, 1);
    ctx.fillStyle = "#f2a33a";
    ctx.fillRect(5, 19, 1, 6);
    ctx.fillRect(6, 21, 2, 1);
    ctx.fillRect(8, 22, 1, 2);
    ctx.fillRect(6, 24, 2, 1);
    ctx.fillStyle = "#8d96a3";
    ctx.fillRect(1, 31, 12, 2);
    return { canvas: c, ax: 7, ay: 32 };
  }
  function propSprite(prop2) {
    const key = prop2.kind === "lamp" || prop2.kind === "bench" || prop2.kind === "totem" ? prop2.kind : `${prop2.kind}:${prop2.seed % 7}`;
    let s = cache.get(key);
    if (s) return s;
    switch (prop2.kind) {
      case "tree":
        s = treeSprite(prop2.seed % 7);
        break;
      case "pine":
        s = pineSprite(prop2.seed % 7);
        break;
      case "bush":
        s = bushSprite(prop2.seed % 7);
        break;
      case "flowers":
        s = flowersSprite(prop2.seed % 7);
        break;
      case "hedge":
        s = hedgeSprite(prop2.seed % 7);
        break;
      case "lamp":
        s = lampSprite();
        break;
      case "bench":
        s = benchSprite();
        break;
      case "rock":
        s = rockSprite(prop2.seed % 7);
        break;
      case "parasol":
        s = parasolSprite(prop2.seed % 7);
        break;
      case "totem":
        s = totemSprite();
        break;
      default:
        s = { canvas: makeCanvas(1, 1)[0], ax: 0, ay: 0 };
    }
    cache.set(key, s);
    return s;
  }
  var CAR_COLORS = [
    ["#d9534a", "#a83a33", "#f08a80"],
    ["#3f7fd8", "#2c5ea6", "#7fb0f0"],
    ["#f2f2ee", "#c4c6c8", "#ffffff"],
    ["#f2b33d", "#c88a1f", "#ffd889"],
    ["#2fb3a3", "#1f8579", "#79dccf"],
    ["#4a5468", "#323a4a", "#76819a"]
  ];
  function carSprite(variant, flip) {
    const key = `car:${variant % CAR_COLORS.length}:${flip ? 1 : 0}`;
    const hit = cache.get(key);
    if (hit) return hit;
    const [body, dark, light] = CAR_COLORS[variant % CAR_COLORS.length];
    const [c, ctx] = makeCanvas(36, 20);
    if (flip) {
      ctx.translate(36, 0);
      ctx.scale(-1, 1);
    }
    shadowEllipse(ctx, 18, 17, 16, 2, 0.3);
    const o = "#2e3648";
    ctx.fillStyle = o;
    ctx.fillRect(2, 8, 32, 8);
    ctx.fillRect(8, 3, 18, 6);
    ctx.fillStyle = body;
    ctx.fillRect(3, 9, 30, 6);
    ctx.fillRect(9, 4, 16, 5);
    ctx.fillStyle = light;
    ctx.fillRect(3, 9, 30, 1);
    ctx.fillRect(9, 4, 16, 1);
    ctx.fillStyle = dark;
    ctx.fillRect(3, 13, 30, 2);
    ctx.fillStyle = "#3a5f86";
    ctx.fillRect(10, 5, 6, 3);
    ctx.fillRect(18, 5, 6, 3);
    ctx.fillStyle = "#9cc7ec";
    ctx.fillRect(10, 5, 2, 1);
    ctx.fillRect(18, 5, 2, 1);
    ctx.fillStyle = "#fff3c4";
    ctx.fillRect(32, 10, 2, 2);
    ctx.fillStyle = "#e04a3a";
    ctx.fillRect(2, 10, 1, 2);
    for (const wx of [7, 25]) {
      ctx.fillStyle = o;
      ctx.fillRect(wx, 13, 5, 5);
      ctx.fillStyle = "#6b7385";
      ctx.fillRect(wx + 1, 14, 3, 3);
      ctx.fillStyle = "#9aa3b5";
      ctx.fillRect(wx + 2, 15, 1, 1);
    }
    const s = { canvas: c, ax: 18, ay: 17 };
    cache.set(key, s);
    return s;
  }
  function shadowSprite() {
    const hit = cache.get("shadow");
    if (hit) return hit;
    const [c, ctx] = makeCanvas(14, 6);
    shadowEllipse(ctx, 7, 3, 6, 2, 0.28);
    const s = { canvas: c, ax: 7, ay: 3 };
    cache.set("shadow", s);
    return s;
  }
  function glowSprite(color, size = 64) {
    const key = `glow:${color}:${size}`;
    const hit = cache.get(key);
    if (hit) return hit.canvas;
    const [c, ctx] = makeCanvas(size, size);
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    const [r, gg, b] = hex(color);
    g.addColorStop(0, `rgba(${r},${gg},${b},0.9)`);
    g.addColorStop(0.4, `rgba(${r},${gg},${b},0.35)`);
    g.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    cache.set(key, { canvas: c, ax: size / 2, ay: size / 2 });
    return c;
  }

  // vendor/habblaud/upstream/client/src/art/seasonal.ts
  function renderSeasonalProp(kind) {
    const b = new PixelBuf(40, 64);
    const rect = (x, y, w, h, c) => b.rect(x, y, w, h, c);
    if (kind === "tree") {
      b.shadow(20, 59, 17, 3, "#252c39", 0.22);
      rect(17, 49, 6, 9, "#80573d");
      for (let row = 0; row < 4; row++) {
        const y = 13 + row * 8;
        const half = 6 + row * 3;
        rect(20 - half, y, half * 2 + 1, 9, "#245644");
        rect(22 - half, y, half * 2 - 4, 6, "#387956");
        rect(22 - half, y + 1, half - 1, 3, "#4d9361");
      }
      b.vline(20, 5, 13, "#ffe0a0");
      b.hline(16, 24, 9, "#ffe0a0");
      rect(18, 7, 5, 5, "#ffc45d");
      for (const [x, y] of [[16, 20], [24, 24], [13, 31], [25, 36], [9, 42], [20, 43], [31, 44]]) {
        rect(x, y, 3, 3, "#e05250");
        b.set(x, y, "#ffb27b");
      }
      for (const [x, y] of [[21, 17], [15, 26], [23, 30], [15, 38], [26, 42], [11, 47]]) {
        rect(x, y, 2, 2, "#ffe8b2");
      }
      rect(3, 52, 10, 8, "#a82d42");
      rect(6, 51, 2, 9, "#e5c17b");
      rect(3, 54, 10, 1, "#e5c17b");
      rect(26, 51, 10, 9, "#e6b357");
      rect(30, 50, 2, 10, "#b33549");
      rect(26, 54, 10, 1, "#b33549");
    } else if (kind === "gift") {
      b.shadow(20, 59, 9, 2, "#252c39", 0.2);
      rect(11, 49, 17, 11, "#bf3849");
      rect(11, 49, 17, 3, "#e35a58");
      rect(18, 49, 3, 11, "#efd1a0");
      rect(11, 54, 17, 2, "#efd1a0");
      rect(14, 46, 5, 3, "#e8b860");
      rect(21, 46, 5, 3, "#e8b860");
    } else if (kind === "pumpkin") {
      b.shadow(20, 59, 11, 2, "#252c39", 0.2);
      rect(18, 41, 3, 6, "#557342");
      rect(11, 46, 18, 14, "#c56832");
      rect(8, 49, 24, 8, "#e18b39");
      rect(13, 46, 4, 13, "#f0a647");
      rect(23, 47, 3, 12, "#f0a647");
      rect(12, 50, 4, 3, "#523347");
      rect(24, 50, 4, 3, "#523347");
      rect(17, 56, 7, 2, "#523347");
      b.set(13, 51, "#ffd680");
      b.set(25, 51, "#ffd680");
      b.hline(18, 22, 56, "#ffd680");
    } else if (kind === "ghost") {
      rect(15, 39, 10, 3, "#e0dae9");
      rect(12, 42, 16, 15, "#e0dae9");
      rect(14, 41, 11, 15, "#fff4ed");
      rect(10, 47, 4, 4, "#e0dae9");
      rect(26, 47, 4, 4, "#e0dae9");
      for (const x of [12, 18, 24]) rect(x, 56, 4, 3, "#e0dae9");
      rect(16, 46, 2, 3, "#574563");
      rect(23, 46, 2, 3, "#574563");
      rect(19, 51, 3, 2, "#574563");
    } else if (kind === "wreath") {
      rect(12, 39, 16, 4, "#347653");
      rect(10, 43, 5, 10, "#245644");
      rect(25, 43, 5, 10, "#347653");
      rect(13, 53, 15, 4, "#245644");
      for (const [x, y] of [[14, 41], [26, 47], [12, 50], [23, 54]]) rect(x, y, 2, 2, "#e45c58");
      rect(15, 55, 4, 4, "#c93945");
      rect(21, 55, 4, 4, "#c93945");
      rect(19, 54, 2, 4, "#f07368");
    } else {
      rect(18, 51, 5, 6, "#47344f");
      rect(10, 50, 9, 4, "#47344f");
      rect(22, 50, 9, 4, "#47344f");
      rect(7, 48, 4, 4, "#47344f");
      rect(30, 48, 4, 4, "#47344f");
      rect(13, 53, 3, 3, "#47344f");
      rect(25, 53, 3, 3, "#47344f");
      b.set(19, 52, "#f5b95f");
      b.set(21, 52, "#f5b95f");
    }
    b.outline();
    return { buf: b, ax: 20, ay: 60 };
  }

  // vendor/habblaud/upstream/client/src/world/render/seasonal.ts
  var sprites = /* @__PURE__ */ new Map();
  function prop(kind) {
    let sprite3 = sprites.get(kind);
    if (!sprite3) {
      const { buf, ax, ay } = renderSeasonalProp(kind);
      const canvas2 = document.createElement("canvas");
      canvas2.width = buf.w;
      canvas2.height = buf.h;
      canvas2.getContext("2d").putImageData(new ImageData(buf.data, buf.w, buf.h), 0, 0);
      sprites.set(kind, sprite3 = { canvas: canvas2, ax, ay });
    }
    return sprite3;
  }
  function seasonalCostume(theme, seed) {
    if (theme === "christmas") return "santa";
    if (theme === "halloween") return ["witch", "pumpkin", "vampire"][(seed >>> 0) % 3];
    return void 0;
  }
  function seasonalFurniture(theme, kind, area, seed) {
    if (theme === "none" || area.kind === "restroom") return null;
    if (kind === "plant_tall") {
      const first = area.furniture.find((f) => f.kind === "plant_tall");
      if (!first || hash32(first.id) !== seed) return null;
      return prop(theme === "christmas" ? "tree" : seed % 3 === 0 ? "ghost" : "pumpkin");
    }
    if (kind === "plant_small") return prop(theme === "christmas" ? "gift" : "pumpkin");
    return null;
  }
  function seasonalRugColor(theme, original) {
    return theme === "christmas" ? "#a93649" : theme === "halloween" ? "#60416f" : original;
  }
  function seasonalWallStyle(theme, original) {
    if (theme === "none" || original.pattern === "glass") return original;
    return { ...original, base: mix(original.base, theme === "christmas" ? "#ffe3b4" : "#bc97d1", 0.18), trim: theme === "christmas" ? "#4e7756" : "#725486" };
  }
  function decorateSeasonalRug(ctx, theme, rug) {
    if (theme === "none") return;
    const x = Math.round(rug.x), y = Math.round(rug.y), w = Math.floor(rug.w), h = Math.floor(rug.h);
    if (w < 25 || h < 16) return;
    ctx.save();
    ctx.fillStyle = theme === "christmas" ? "#ddb66e" : "#e5a457";
    ctx.fillRect(x + 4, y + 4, w - 8, 1);
    ctx.fillRect(x + 4, y + h - 5, w - 8, 1);
    for (let cx = x + 14; cx < x + w - 10; cx += 28) {
      const cy = Math.round(y + h / 2);
      if (theme === "christmas") {
        ctx.fillRect(cx - 4, cy, 9, 1);
        ctx.fillRect(cx, cy - 4, 1, 9);
        for (const d of [-2, 2]) {
          ctx.fillRect(cx + d, cy + d, 1, 1);
          ctx.fillRect(cx + d, cy - d, 1, 1);
        }
      } else {
        ctx.fillRect(cx - 3, cy - 2, 7, 5);
        ctx.fillRect(cx, cy - 4, 1, 2);
        ctx.fillStyle = "#60416f";
        ctx.fillRect(cx - 2, cy - 1, 1, 1);
        ctx.fillRect(cx + 2, cy - 1, 1, 1);
        ctx.fillStyle = "#e5a457";
      }
    }
    ctx.restore();
  }
  function decorateSeasonalWall(ctx, theme, wall) {
    if (theme === "none" || wall.kind !== "face") return;
    ctx.save();
    const x0 = Math.round(wall.x + 3), end = Math.floor(wall.x + wall.w - 3), y = Math.round(wall.y + 5);
    for (let x = x0; x < end; x++) {
      if (wall.doorways?.some((d) => x >= d.x - 1 && x < d.x + d.w + 1)) continue;
      const sag = Math.round(Math.sin((x - x0) % 48 / 48 * Math.PI) * 3);
      ctx.fillStyle = theme === "christmas" ? "#347653" : "#584068";
      ctx.fillRect(x, y + sag, 1, theme === "christmas" ? 3 : 1);
      if ((x - x0) % 12 === 6) {
        ctx.fillStyle = theme === "christmas" ? "#f5d491" : "#eea24d";
        ctx.fillRect(x, y + sag + 3, 2, 3);
        ctx.fillStyle = theme === "christmas" ? "#fff0be" : "#ffd78a";
        ctx.fillRect(x, y + sag + 3, 1, 1);
      }
    }
    if (theme === "halloween") {
      ctx.strokeStyle = "#d6bfdd";
      ctx.lineWidth = 1;
      for (const side of [1, -1]) {
        const x = side === 1 ? x0 : end;
        ctx.beginPath();
        for (const [dx, dy] of [[15, 0], [13, 7], [7, 13], [0, 15]]) {
          ctx.moveTo(x, y + 2);
          ctx.lineTo(x + side * dx, y + 2 + dy);
        }
        for (const r of [5, 10, 15]) {
          ctx.moveTo(x + side * r, y + 2);
          ctx.lineTo(x + side * Math.round(r * 0.7), y + 2 + Math.round(r * 0.7));
          ctx.lineTo(x, y + 2 + r);
        }
        ctx.stroke();
      }
      if (wall.w > 90) {
        const bat = prop("bat");
        ctx.drawImage(bat.canvas, Math.round(wall.x + wall.w / 2 - bat.ax), y + 18 - bat.ay);
      }
    }
    ctx.restore();
  }
  function decorateElevator(ctx, theme, x, y) {
    if (theme === "none") return;
    const sprite3 = prop(theme === "christmas" ? "wreath" : "bat");
    ctx.drawImage(sprite3.canvas, Math.round(x - sprite3.ax), Math.round(y - 19 - sprite3.ay));
  }
  var glows2 = /* @__PURE__ */ new Map();
  function glowSprite2(theme) {
    let canvas2 = glows2.get(theme);
    if (!canvas2) {
      canvas2 = document.createElement("canvas");
      canvas2.width = canvas2.height = 34;
      const ctx = canvas2.getContext("2d");
      const glow = ctx.createRadialGradient(17, 17, 1, 17, 17, 17);
      glow.addColorStop(0, theme === "christmas" ? "#ffd58b" : "#d8a5ed");
      glow.addColorStop(1, "rgba(255,220,180,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 34, 34);
      glows2.set(theme, canvas2);
    }
    return canvas2;
  }
  function drawSeasonalLights(ctx, theme, layout, light) {
    if (theme === "none" || light <= 0.01) return;
    ctx.save();
    for (const wall of layout.walls) {
      if (wall.kind !== "face") continue;
      ctx.save();
      ctx.beginPath();
      ctx.rect(wall.x, wall.y + 4, wall.w, 27);
      ctx.clip();
      for (let x = wall.x + 14; x < wall.x + wall.w - 6; x += 24) {
        if (wall.doorways?.some((d) => x >= d.x - 10 && x <= d.x + d.w + 10)) continue;
        ctx.globalAlpha = light * 0.3;
        ctx.drawImage(glowSprite2(theme), Math.round(x - 17), wall.y - 8);
        ctx.globalAlpha = light * 0.85;
        ctx.fillStyle = theme === "christmas" ? "#ffe4a9" : "#ffd181";
        ctx.fillRect(Math.round(x), wall.y + 9, 2, 2);
      }
      ctx.restore();
    }
    ctx.restore();
  }
  function drawSeasonalWindow(ctx, theme, glass2, now, seed) {
    if (theme !== "christmas") return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(glass2.x, glass2.y, glass2.w, glass2.h);
    ctx.clip();
    ctx.fillStyle = "#edf3f3";
    ctx.globalAlpha *= 0.7;
    ctx.fillRect(glass2.x, glass2.y + glass2.h - 2, glass2.w, 2);
    for (let i = 0; i < 12; i++) {
      const x = ((seed >>> 0) + i * 17) % Math.max(1, Math.floor(glass2.w));
      const y = (Math.floor(now / 180) + i * 11) % Math.max(1, Math.floor(glass2.h));
      ctx.fillRect(Math.floor(glass2.x + x), Math.floor(glass2.y + y), 1, 1);
    }
    ctx.restore();
  }

  // vendor/habblaud/upstream/client/src/world/render/scene.ts
  var WALL_MARGIN = 16;
  var DYNAMIC_WALL = /* @__PURE__ */ new Set(["window", "clock", "whiteboard", "tv", "elevator", "light_switch", "sign", "mirror"]);
  function makeCanvas2(w, h) {
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    return [c, ctx];
  }
  function furnitureSprites2(art2, f, state = 0) {
    const hit = f.states[state];
    if (hit !== void 0) return hit;
    let s = null;
    try {
      s = art2.furnitureSprites(f.kind, f.variant, state, { seed: f.seed }) ?? null;
      if (s && !s.base?.canvas) s = null;
    } catch {
      s = null;
    }
    f.states[state] = s;
    return s;
  }
  var opaqueCache = /* @__PURE__ */ new WeakMap();
  function opaqueBounds(c) {
    const hit = opaqueCache.get(c);
    if (hit) return hit;
    let box = { x: 0, y: 0, w: c.width, h: c.height };
    try {
      const ctx = c.getContext("2d");
      if (ctx && c.width > 0 && c.height > 0) {
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        let x0 = c.width;
        let y0 = c.height;
        let x1 = -1;
        let y1 = -1;
        for (let y = 0; y < c.height; y++) {
          for (let x = 0; x < c.width; x++) {
            if (d[(y * c.width + x) * 4 + 3] > 16) {
              if (x < x0) x0 = x;
              if (x > x1) x1 = x;
              if (y < y0) y0 = y;
              if (y > y1) y1 = y;
            }
          }
        }
        if (x1 >= 0) box = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
      }
    } catch {
    }
    opaqueCache.set(c, box);
    return box;
  }
  function wallItemOrigin(w, s) {
    if (w.on === "south") {
      const b = opaqueBounds(s.canvas);
      const top = w.baseY - TILE;
      return { x: Math.round(w.cx - (b.x + b.w / 2)), y: Math.round(top + 9 - (b.y + b.h / 2)) };
    }
    return { x: Math.round(w.cx - s.ax), y: Math.round(w.baseY - s.ay) };
  }
  function wallSprites(art2, kind, variant, state, seed) {
    try {
      const s = art2.furnitureSprites(kind, variant, state, { seed });
      return s && s.base?.canvas ? s : null;
    } catch {
      return null;
    }
  }
  function drawWallSegment(art2, ctx, w) {
    try {
      if (w.kind === "face") art2.drawWallFace(ctx, w.x, w.y, w.w, w.style, w.doorways ? { doorways: w.doorways } : void 0);
      else if (w.kind === "south") art2.drawSouthWall(ctx, w.x, w.y, w.w, w.style, w.doorways ? { doorways: w.doorways } : void 0);
      else art2.drawWallTop(ctx, w.x, w.y, w.w, w.h, w.style);
    } catch {
      ctx.fillStyle = w.style.base;
      ctx.fillRect(w.x, w.y, w.w, w.kind === "face" ? 2 * TILE : w.kind === "south" ? TILE : w.h);
    }
  }
  var WALL_ART_TOP = 28;
  function pickWallArt(assets, kind, tiles, variant, seed) {
    if (!assets) return null;
    let pool = assets.wallArt.filter((a) => a.kind === kind && a.tiles === tiles);
    if (kind === "poster" && variant) {
      const same = pool.filter((a) => a.variant === variant);
      if (same.length) pool = same;
    }
    if (!pool.length) return null;
    return pool[(seed >>> 0) % pool.length];
  }
  function drawWallArtAsset(ctx, item, a) {
    const img = a.framed ?? (a.kind === "poster" ? a : null);
    if (!img) return false;
    const x = Math.round(item.cx - img.w / 2);
    const y = item.baseY - WALL_ART_TOP;
    ctx.fillStyle = "rgba(30,34,52,0.16)";
    ctx.fillRect(x + img.w, y + 1, 1, img.h);
    ctx.fillRect(x + 1, y + img.h, img.w, 1);
    ctx.drawImage(img.img, x, y);
    return true;
  }
  function drawRawPainting(ctx, s, ox, oy, a) {
    let r = s.rects?.art;
    if (!r) {
      const b = opaqueBounds(s.canvas);
      r = { x: b.x + 2, y: b.y + 2, w: b.w - 4, h: b.h - 4 };
    }
    if (r.w <= 2 || r.h <= 2) return;
    const sw = Math.min(a.w, r.w);
    const sh = Math.min(a.h, r.h);
    const sx = Math.floor((a.w - sw) / 2);
    const sy = Math.floor((a.h - sh) / 2);
    ctx.drawImage(a.img, sx, sy, sw, sh, ox + r.x + Math.floor((r.w - sw) / 2), oy + r.y + Math.floor((r.h - sh) / 2), sw, sh);
  }
  function tintFloor(ctx, px, color) {
    const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
    if (!m) return;
    const n = parseInt(m[1], 16);
    const k = 0.1;
    const ch = (v) => Math.round(255 + (v - 255) * k);
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = `rgb(${ch(n >> 16 & 255)},${ch(n >> 8 & 255)},${ch(n & 255)})`;
    ctx.fillRect(px.x, px.y, px.w, px.h);
    ctx.restore();
  }
  function buildAreaVis(art2, layout, room, assets, theme = "none") {
    const r = layout.rect;
    const px = { x: r.x * TILE, y: r.y * TILE, w: r.w * TILE, h: r.h * TILE };
    const [floor, fctx] = makeCanvas2(px.w, px.h);
    fctx.translate(-px.x, -px.y);
    for (const f of layout.floors) {
      try {
        art2.drawFloor(fctx, f.kind, f.x, f.y, f.w, f.h, { seed: f.seed, tint: f.tint, tint2: f.tint2 });
      } catch {
        fctx.fillStyle = "#d9dde2";
        fctx.fillRect(f.x, f.y, f.w, f.h);
      }
    }
    if (layout.floorTint) tintFloor(fctx, px, layout.floorTint);
    for (const rug of layout.rugs) {
      const color = seasonalRugColor(theme, rug.color);
      try {
        art2.drawRug(fctx, rug.x, rug.y, rug.w, rug.h, color, rug.seed);
      } catch {
        fctx.fillStyle = color;
        fctx.fillRect(rug.x, rug.y, rug.w, rug.h);
      }
      decorateSeasonalRug(fctx, theme, rug);
    }
    const [walls, wctx] = makeCanvas2(px.w, px.h + WALL_MARGIN);
    wctx.translate(-px.x, -px.y + WALL_MARGIN);
    const order = { face: 0, south: 1, cap: 2 };
    for (const w of [...layout.walls].sort((a, b) => order[a.kind] - order[b.kind])) drawWallSegment(art2, wctx, { ...w, style: seasonalWallStyle(theme, w.style) });
    for (const w of layout.walls) decorateSeasonalWall(wctx, theme, w);
    const wallItems = [];
    let sign2;
    for (const it of layout.wallItems) {
      const vis = toWallVis(it, layout.id);
      if (DYNAMIC_WALL.has(it.kind)) {
        if (it.kind === "sign") sign2 = vis;
        else wallItems.push(vis);
        continue;
      }
      const ai = it.kind === "painting" || it.kind === "poster" ? pickWallArt(assets, it.kind, it.kind === "poster" ? 1 : it.variant === "wide" ? 4 : 2, it.variant, vis.seed) : null;
      if (ai && vis.on === "face" && drawWallArtAsset(wctx, vis, ai)) continue;
      const s = wallSprites(art2, it.kind, it.variant === "wide" ? void 0 : it.variant, 0, vis.seed);
      if (!s) continue;
      const o = wallItemOrigin(vis, s.base);
      wctx.drawImage(s.base.canvas, o.x, o.y);
      if (ai && it.kind === "painting") drawRawPainting(wctx, s.base, o.x, o.y, ai);
    }
    const furniture = layout.furniture.map((f) => {
      const def = FURNITURE[f.kind];
      const ax = (f.tx + def.footprint.w / 2) * TILE + (f.dx ?? 0);
      const ay = (f.ty + def.footprint.h) * TILE + (f.dy ?? 0);
      return {
        id: f.id,
        kind: f.kind,
        variant: f.variant,
        seed: hash32(f.id),
        ax,
        ay,
        order: f.order,
        areaId: layout.id,
        seatSpot: layout.spots.find((s) => s.deskId === f.id)?.id,
        states: []
      };
    });
    return { id: layout.id, layout, room, px, floor, walls, furniture, wallItems, sign: sign2, version: room?.version ?? 0 };
  }
  function toWallVis(it, areaId) {
    return { id: it.id, kind: it.kind, variant: it.variant, seed: hash32(it.id), cx: it.cx, baseY: it.baseY, on: it.on, order: it.order, areaId };
  }
  function paintShell(art2, ctx, floors, walls) {
    for (const f of floors) {
      try {
        art2.drawFloor(ctx, f.kind, f.x, f.y, f.w, f.h, { seed: f.seed, tint: f.tint, tint2: f.tint2 });
      } catch {
        ctx.fillStyle = "#9fc77f";
        ctx.fillRect(f.x, f.y, f.w, f.h);
      }
    }
    for (const w of walls) drawWallSegment(art2, ctx, w);
  }

  // vendor/habblaud/upstream/client/src/world/render/lighting.ts
  var RECALC_MS = 4e3;
  var MAP_SCALE = 2;
  var FADE_MS = 1200;
  var OCCUPANCY_MS = 250;
  var LAMP_WARM = [255, 236, 196];
  var STREET_WARM = [255, 214, 150];
  var SCREEN_COOL = [196, 222, 255];
  var ARCADE_GLOW = [236, 190, 255];
  var FIREFLIES = 26;
  var halos = /* @__PURE__ */ new Map();
  function haloSprite(c, size) {
    const key = `${c.join(",")}:${size}`;
    let s = halos.get(key);
    if (s) return s;
    s = document.createElement("canvas");
    s.width = size;
    s.height = size;
    const ctx = s.getContext("2d");
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    const [r, gg, b] = c;
    g.addColorStop(0, `rgba(${r},${gg},${b},1)`);
    g.addColorStop(0.35, `rgba(${r},${gg},${b},0.8)`);
    g.addColorStop(0.7, `rgba(${r},${gg},${b},0.3)`);
    g.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    halos.set(key, s);
    return s;
  }
  var vignette = null;
  function vignetteSprite() {
    if (vignette) return vignette;
    const size = 64;
    vignette = document.createElement("canvas");
    vignette.width = size;
    vignette.height = size;
    const ctx = vignette.getContext("2d");
    const g = ctx.createRadialGradient(size / 2, size * 0.45, 0, size / 2, size * 0.45, size * 0.62);
    g.addColorStop(0, "rgb(255,255,255)");
    g.addColorStop(0.5, "rgb(252,248,242)");
    g.addColorStop(1, "rgb(212,196,176)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return vignette;
  }
  var beams = /* @__PURE__ */ new Map();
  function beamSprite(c) {
    const key = c.join(",");
    let s = beams.get(key);
    if (s) return s;
    s = document.createElement("canvas");
    s.width = 8;
    s.height = 64;
    const ctx = s.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},0.9)`);
    g.addColorStop(0.55, `rgba(${c[0]},${c[1]},${c[2]},0.55)`);
    g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 64);
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, 1, 64);
    ctx.fillRect(7, 0, 1, 64);
    beams.set(key, s);
    return s;
  }
  var prefersReducedMotion = () => {
    try {
      return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  };
  var Lighting = class {
    constructor(art2, sim) {
      this.art = art2;
      this.sim = sim;
    }
    /** Ambiente aplicado (pode estar em transição até `target`). */
    ambient = ambientAt(12);
    target = this.ambient;
    calcAt = -1e9;
    lastNow = 0;
    mode = null;
    override = null;
    map = null;
    mapCtx = null;
    mapKey = "";
    mapX = 0;
    mapY = 0;
    /** Luz por presença das áreas comuns (0 = penumbra, 1 = acesa), com transição. */
    coreLevel = /* @__PURE__ */ new Map();
    coreBusy = /* @__PURE__ */ new Map();
    occAt = 0;
    flies = [];
    fliesFor = null;
    reduced = prefersReducedMotion();
    reducedAt = 0;
    /**
     * Atualiza o ambiente (recalcula a luz no máximo a cada RECALC_MS, ou já ao trocar a preferência
     * ou a hora forçada) e devolve a hora efetiva, para o céu das janelas.
     */
    update(now, mode, override, date) {
      const hour = effectiveHour(mode, override, date);
      const changed = mode !== this.mode || override !== this.override;
      if (now - this.reducedAt > 5e3) {
        this.reducedAt = now;
        this.reduced = prefersReducedMotion();
      }
      if (changed || now - this.calcAt >= RECALC_MS) {
        const first = this.mode === null;
        this.mode = mode;
        this.override = override;
        this.calcAt = now;
        this.target = ambientAt(hour);
        if (first || this.reduced) this.ambient = this.target;
      }
      const dt = Math.max(0, Math.min(250, now - this.lastNow));
      this.lastNow = now;
      if (this.ambient !== this.target) {
        this.ambient = this.reduced ? this.target : approachAmbient(this.ambient, this.target, dt / FADE_MS * 3);
        if (ambientDistance(this.ambient, this.target) < 3) this.ambient = this.target;
      }
      return hour;
    }
    get night() {
      return this.ambient.night;
    }
    // =================================================================== mapa de luz
    /** Multiplica o mapa de luz sobre o que está visível (nada de dia). */
    drawAmbient(ctx, scene, view, now, dt) {
      const amb = this.ambient;
      this.updateOccupancy(scene, now, dt);
      if (isNeutral(amb)) return;
      const map = this.ensureMap(scene, now);
      if (!map) return;
      const mx0 = this.mapX;
      const my0 = this.mapY;
      const mx1 = mx0 + map.width * MAP_SCALE;
      const my1 = my0 + map.height * MAP_SCALE;
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      const sx = Math.max(0, Math.floor((view.x0 - mx0) / MAP_SCALE) - 1);
      const sy = Math.max(0, Math.floor((view.y0 - my0) / MAP_SCALE) - 1);
      const ex = Math.min(map.width, Math.ceil((view.x1 - mx0) / MAP_SCALE) + 1);
      const ey = Math.min(map.height, Math.ceil((view.y1 - my0) / MAP_SCALE) + 1);
      if (ex > sx && ey > sy) ctx.drawImage(map, sx, sy, ex - sx, ey - sy, mx0 + sx * MAP_SCALE, my0 + sy * MAP_SCALE, (ex - sx) * MAP_SCALE, (ey - sy) * MAP_SCALE);
      ctx.fillStyle = rgbCss(amb.outside);
      const w = view.x1 - view.x0 + 4;
      if (view.y0 < my0) ctx.fillRect(view.x0 - 2, view.y0 - 2, w, my0 - view.y0 + 2);
      if (view.y1 > my1) ctx.fillRect(view.x0 - 2, my1, w, view.y1 - my1 + 2);
      const top = Math.max(view.y0 - 2, my0);
      const bottom = Math.min(view.y1 + 2, my1);
      if (bottom > top) {
        if (view.x0 < mx0) ctx.fillRect(view.x0 - 2, top, mx0 - view.x0 + 2, bottom - top);
        if (view.x1 > mx1) ctx.fillRect(mx1, top, view.x1 - mx1 + 2, bottom - top);
      }
      ctx.restore();
    }
    /** Áreas comuns acendem com gente dentro (banheiro com sensor de presença, copa, lounge). */
    updateOccupancy(scene, now, dt) {
      if (now - this.occAt >= OCCUPANCY_MS) {
        this.occAt = now;
        for (const vis of scene.areas.values()) {
          if (vis.room || !this.presenceLit(vis)) continue;
          this.coreBusy.set(vis.id, this.someoneIn(vis.layout.rect));
        }
      }
      const k = this.reduced ? 1 : Math.min(1, dt * 3.5);
      for (const [id, busy] of this.coreBusy) {
        const cur = this.coreLevel.get(id) ?? (busy ? 1 : 0);
        const want = busy ? 1 : 0;
        this.coreLevel.set(id, Math.abs(want - cur) < 0.02 ? want : cur + (want - cur) * k);
      }
    }
    /** Copa, lounge e banheiros: luz por presença. Recepção e corredor ficam sempre acesos. */
    presenceLit(vis) {
      const kind = vis.layout.kind;
      return kind === "cafe" || kind === "lounge" || kind === "restroom";
    }
    someoneIn(r) {
      for (const c of this.sim.chars.values()) {
        if (c.gone || c.inside) continue;
        if (c.tx >= r.x && c.ty >= r.y && c.tx < r.x + r.w && c.ty < r.y + r.h) return true;
      }
      return false;
    }
    /** Luz (0..1) e cobertura (montagem/desmontagem) de uma área. */
    areaLight(vis, now) {
      const room = vis.room;
      if (room) {
        const cover = room.phase === "building" || room.phase === "dismantling" ? buildAnim(room.phase, room.progress(now)).floor : 1;
        return { lit: room.light(now), cover };
      }
      if (this.presenceLit(vis)) return { lit: this.coreLevel.get(vis.id) ?? 0, cover: 1 };
      return { lit: 1, cover: 1 };
    }
    /** Cor de multiplicação de uma área no mapa. */
    areaColor(vis, lit, cover) {
      const amb = this.ambient;
      let c;
      if (vis.room) {
        c = mixRgb(WHITE, amb.inside, lit);
      } else if (vis.layout.kind === "corridor") {
        c = mixRgb(amb.inside, amb.dim, 0.18);
      } else {
        c = mixRgb(amb.dim, amb.inside, lit);
      }
      return cover >= 1 ? c : mixRgb(amb.outside, c, cover);
    }
    ensureMap(scene, now) {
      const b = scene.exterior.bounds;
      const w = Math.ceil(b.w * TILE / MAP_SCALE);
      const h = Math.ceil(b.h * TILE / MAP_SCALE);
      if (!this.map || this.map.width !== w || this.map.height !== h) {
        try {
          this.map = document.createElement("canvas");
          this.map.width = w;
          this.map.height = h;
          this.mapCtx = this.map.getContext("2d");
        } catch {
          this.map = null;
          this.mapCtx = null;
        }
        this.mapKey = "";
      }
      if (!this.map || !this.mapCtx) return null;
      this.mapX = b.x * TILE;
      this.mapY = b.y * TILE;
      const key = this.lightKey(scene, now);
      if (key !== this.mapKey) {
        this.mapKey = key;
        this.paintMap(this.mapCtx, scene, now);
      }
      return this.map;
    }
    /** Tudo o que muda o mapa, em passos discretos (evita refazê-lo a cada frame). */
    lightKey(scene, now) {
      const a = this.ambient;
      let k = `${Math.round(a.night * 200)}|${a.outside.join(",")}|${a.inside.join(",")}|${a.dim.join(",")}|${this.sim.building.cols}`;
      for (const vis of scene.areas.values()) {
        const { lit, cover } = this.areaLight(vis, now);
        k += `|${vis.id}:${Math.round(lit * 24)}:${Math.round(cover * 20)}`;
      }
      for (const sh of scene.shells) if (scene.roomInSlot(sh.slot)) k += `|s${sh.slot}`;
      return k;
    }
    paintMap(m, scene, now) {
      const amb = this.ambient;
      const n = amb.night;
      m.setTransform(1, 0, 0, 1, 0, 0);
      m.globalCompositeOperation = "source-over";
      m.globalAlpha = 1;
      m.fillStyle = rgbCss(amb.outside);
      m.fillRect(0, 0, this.map.width, this.map.height);
      m.setTransform(1 / MAP_SCALE, 0, 0, 1 / MAP_SCALE, -this.mapX / MAP_SCALE, -this.mapY / MAP_SCALE);
      const corridorLit = rgbCss(mixRgb(amb.inside, amb.dim, 0.18));
      for (const sh of scene.shells) {
        if (scene.roomInSlot(sh.slot)) continue;
        const r = sh.rect;
        m.fillStyle = corridorLit;
        if (r.y === 0) m.fillRect(r.x * TILE, (r.y + r.h - 2) * TILE, r.w * TILE, 2 * TILE);
        else m.fillRect(r.x * TILE, r.y * TILE, r.w * TILE, TILE);
      }
      const lit = /* @__PURE__ */ new Map();
      for (const vis of scene.areas.values()) {
        const l = this.areaLight(vis, now);
        if (l.cover <= 0.01) continue;
        lit.set(vis, vis.room ? l.lit * l.cover : this.presenceLit(vis) ? 0.4 + 0.6 * l.lit : 1);
        const p = vis.px;
        const shade3 = vis.room ? vis.layout.shade : void 0;
        if (shade3 && l.cover >= 1) {
          m.fillStyle = corridorLit;
          m.fillRect(p.x, p.y, p.w, p.h);
          m.fillStyle = rgbCss(this.areaColor(vis, l.lit, l.cover));
          m.fillRect(shade3.x, shade3.y, shade3.w, shade3.h);
        } else {
          m.fillStyle = rgbCss(this.areaColor(vis, l.lit, l.cover));
          m.fillRect(p.x, p.y, p.w, p.h);
        }
        const glow = (vis.room ? l.lit : this.presenceLit(vis) ? l.lit : vis.layout.kind === "corridor" ? 0 : 1) * l.cover * n;
        if (glow > 0.05) {
          const r = shade3 ?? p;
          m.globalCompositeOperation = "multiply";
          m.globalAlpha = Math.min(1, glow);
          m.drawImage(vignetteSprite(), r.x, r.y, r.w, r.h);
          m.globalAlpha = 1;
          m.globalCompositeOperation = "source-over";
        }
      }
      if (n < 0.12) {
        m.setTransform(1, 0, 0, 1, 0, 0);
        return;
      }
      m.globalCompositeOperation = "lighten";
      const lamp = haloSprite(LAMP_WARM, 64);
      const street = haloSprite(STREET_WARM, 64);
      const cool = haloSprite(SCREEN_COOL, 48);
      const arcade2 = haloSprite(ARCADE_GLOW, 48);
      const k = Math.min(1, (n - 0.12) / 0.5);
      const halo = (img, cx, cy, w, h, a) => {
        if (a <= 0.01) return;
        m.globalAlpha = Math.min(1, a);
        m.drawImage(img, cx - w / 2, cy - h / 2, w, h);
      };
      for (const [vis, l] of lit) {
        const on = vis.room ? vis.room.lightOn && l >= 0.3 : true;
        if (!on) continue;
        const a = vis.room ? k * l : k;
        for (const f of vis.furniture) {
          if (f.kind === "floor_lamp") halo(lamp, f.ax, f.ay - 6, 92, 66, a);
          else if (f.kind === "vending_machine") halo(cool, f.ax, f.ay + 4, 52, 34, 0.9 * a);
          else if (f.kind === "arcade") halo(arcade2, f.ax, f.ay + 4, 44, 30, 0.8 * a);
        }
      }
      for (const prop2 of scene.exterior.props) {
        if (prop2.kind === "lamp") {
          halo(street, prop2.x, prop2.y + 6, 120, 84, k);
          halo(street, prop2.x, prop2.y - 30, 30, 24, 0.7 * k);
        } else if (prop2.kind === "totem") halo(cool, prop2.x, prop2.y - 4, 34, 22, 0.6 * k);
      }
      this.paintWindowSpill(scene, lit, k, halo, street);
      m.globalAlpha = 1;
      m.globalCompositeOperation = "source-over";
      m.setTransform(1, 0, 0, 1, 0, 0);
    }
    /** À noite, a luz das janelas e das fachadas de vidro se projeta no gramado e na calçada. */
    paintWindowSpill(scene, lit, k, halo, warm) {
      const bw = this.sim.building.cols * COL_W * TILE;
      const bh = BUILDING_H * TILE;
      for (const [vis, l] of lit) {
        if (l < 0.3) continue;
        const r = vis.layout.rect;
        if (r.y === 0) {
          for (const w of vis.wallItems) if (w.kind === "window") halo(warm, w.cx, -12, 58, 30, 0.55 * k * l);
        } else if (vis.layout.kind !== "corridor" && r.y + r.h >= BUILDING_H) {
          for (const fx of [0.25, 0.75]) halo(warm, (r.x + r.w * fx) * TILE, bh + 16, 96, 30, 0.35 * k * l);
        }
      }
      const cy = (CORRIDOR_Y + CORRIDOR_H / 2) * TILE;
      halo(warm, -20, cy, 56, 92, 0.6 * k);
      halo(warm, bw + 20, cy, 56, 92, 0.45 * k);
      for (const w of scene.shellWindows) {
        const slot = Number(w.areaId.slice(6));
        if (scene.roomInSlot(slot)) continue;
        halo(warm, w.cx, w.baseY - 2 * TILE - 14, 52, 28, 0.5 * k);
      }
    }
    // =================================================================== brilhos por frame
    /** Brilhos aditivos: monitores, TV, máquinas, bulbos dos postes, faróis e vaga-lumes. */
    drawGlows(ctx, scene, view, now) {
      const n = this.ambient.night;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const cool = glowSprite("#7fb8ff", 48);
      const warm = glowSprite("#ffcf7a", 64);
      const inView = (x, y, m) => x > view.x0 - m && x < view.x1 + m && y > view.y0 - m && y < view.y1 + m;
      for (const vis of scene.areas.values()) {
        const p = vis.px;
        if (p.x > view.x1 + 40 || p.x + p.w < view.x0 - 40 || p.y > view.y1 + 40 || p.y + p.h < view.y0 - 40) continue;
        const room = vis.room;
        const dark = room ? 1 - room.light(now) : 0;
        const k = Math.max(n, dark);
        if (k < 0.2) continue;
        for (const f of vis.furniture) {
          if (!inView(f.ax, f.ay, 40)) continue;
          if (f.kind === "desk" || f.kind === "desk_back") {
            const mode = scene.deskScreen(f, vis);
            if (mode === "off") continue;
            ctx.globalAlpha = (mode === "idle" ? 0.2 : 0.35) * k;
            ctx.drawImage(cool, Math.round(f.ax - 24), Math.round(f.ay - 34));
          } else if (f.kind === "floor_lamp" && n > 0.2 && (!room || room.lightOn)) {
            const g = this.lampHead(f);
            ctx.globalAlpha = 0.5 * n;
            ctx.drawImage(warm, Math.round(g.x - 16), Math.round(g.y - 16), 32, 32);
          } else if (f.kind === "vending_machine" || f.kind === "arcade") {
            ctx.globalAlpha = 0.25 * k;
            ctx.drawImage(cool, Math.round(f.ax - 24), Math.round(f.ay - 36));
          }
        }
        if (n > 0.2) {
          for (const w of vis.wallItems) {
            if (w.kind !== "tv" || !inView(w.cx, w.baseY, 60)) continue;
            ctx.globalAlpha = 0.3 * n;
            ctx.drawImage(cool, Math.round(w.cx - 28), Math.round(w.baseY - 30), 56, 56);
          }
        }
      }
      this.drawSunbeams(ctx, scene, view);
      if (n > 0.2) {
        for (const prop2 of scene.exterior.props) {
          if (prop2.kind !== "lamp" || !inView(prop2.x, prop2.y, 64)) continue;
          ctx.globalAlpha = 0.6 * n;
          ctx.drawImage(warm, Math.round(prop2.x - 14), Math.round(prop2.y - 43), 28, 28);
        }
        this.drawHeadlights(ctx, scene, view, n);
        if (n > 0.6 && !this.reduced) this.drawFireflies(ctx, scene, view, now, (n - 0.6) / 0.4);
      }
      ctx.restore();
    }
    /**
     * Sol entrando pelas janelas da parede norte (o sol do Brasil passa ao norte): faixas de luz no
     * piso, curtas ao meio-dia e longas e alaranjadas de manhã cedo e no fim da tarde; de manhã
     * tombam para oeste, à tarde para leste.
     */
    drawSunbeams(ctx, scene, view) {
      const sun = sunbeamAt(this.ambient.hour);
      if (!sun) return;
      const img = beamSprite(mixRgb([255, 226, 160], [255, 150, 64], this.ambient.warm));
      ctx.globalCompositeOperation = "lighter";
      const draw = (ws, clip) => {
        if (clip.x > view.x1 || clip.x + clip.w < view.x0 || clip.y > view.y1 || clip.y + clip.h < view.y0) return;
        ctx.save();
        ctx.beginPath();
        ctx.rect(clip.x, clip.y, clip.w, clip.h);
        ctx.clip();
        ctx.globalAlpha = sun.alpha;
        for (const w of ws) {
          const r = this.windowGlass(w);
          if (!r) continue;
          ctx.save();
          ctx.transform(1, 0, sun.skew, 1, r.x - sun.skew * w.baseY, 0);
          ctx.drawImage(img, 0, w.baseY, r.w, sun.len);
          ctx.restore();
        }
        ctx.restore();
      };
      for (const vis of scene.areas.values()) {
        if (vis.layout.rect.y !== 0) continue;
        if (vis.room && vis.room.phase !== "ready") continue;
        const ws = vis.wallItems.filter((w) => w.kind === "window");
        if (!ws.length) continue;
        const p = vis.px;
        draw(ws, { x: p.x, y: p.y + 2 * TILE, w: p.w, h: p.h - 3 * TILE });
      }
      for (const sh of scene.shells) {
        if (sh.rect.y !== 0 || scene.roomInSlot(sh.slot)) continue;
        const ws = scene.shellWindows.filter((w) => w.areaId === `shell:${sh.slot}`);
        draw(ws, { x: sh.rect.x * TILE, y: CORRIDOR_Y * TILE, w: sh.rect.w * TILE, h: CORRIDOR_H * TILE });
      }
    }
    /** Retângulo do vidro de uma janela (px de mundo, só x e largura importam). */
    windowGlass(w) {
      const s = wallSprites(this.art, "window", w.variant, 0, w.seed);
      if (!s) return null;
      const o = wallItemOrigin(w, s.base);
      const g = s.base.rects?.glass;
      return g ? { x: o.x + g.x, w: g.w } : { x: o.x + 3, w: s.base.canvas.width - 6 };
    }
    /** Centro do bulbo da luminária (rects.glow da arte, ou um palpite pela altura). */
    lampHead(f) {
      const s = furnitureSprites2(this.art, f)?.base;
      const r = s?.rects?.glow;
      if (s && r) return { x: f.ax - s.ax + r.x + r.w / 2, y: f.ay - s.ay + r.y + r.h / 2 };
      return { x: f.ax, y: f.ay - 33 };
    }
    /** Faróis (facho amarelado à frente) e lanternas vermelhas dos carros. */
    drawHeadlights(ctx, scene, view, n) {
      if (!scene.cars.length) return;
      const beam = glowSprite("#fff1c4", 64);
      const tail = glowSprite("#ff4a3a", 16);
      for (const car of scene.cars) {
        if (car.x < view.x0 - 80 || car.x > view.x1 + 80 || car.y < view.y0 - 30 || car.y > view.y1 + 30) continue;
        const front = car.x + car.dir * 16;
        ctx.globalAlpha = 0.55 * n;
        ctx.drawImage(beam, Math.round(front + (car.dir > 0 ? 0 : -46)), Math.round(car.y - 15), 46, 16);
        ctx.globalAlpha = 0.8 * n;
        ctx.drawImage(tail, Math.round(car.x - car.dir * 16 - 4), Math.round(car.y - 11), 8, 8);
      }
    }
    /** Vaga-lumes piscando sobre o gramado e os jardins (só com a noite fechada). */
    drawFireflies(ctx, scene, view, now, k) {
      if (this.fliesFor !== scene.exterior) this.seedFireflies(scene.exterior);
      const dot = glowSprite("#d8ff7a", 12);
      const t2 = now / 1e3;
      for (const f of this.flies) {
        const x = f.x + Math.sin(t2 * f.sx + f.ph) * 7;
        const y = f.y + Math.cos(t2 * f.sy + f.ph * 1.7) * 4;
        if (x < view.x0 - 8 || x > view.x1 + 8 || y < view.y0 - 8 || y > view.y1 + 8) continue;
        const on = Math.sin(t2 * f.blink + f.ph * 3);
        if (on <= 0.2) continue;
        const a = Math.pow((on - 0.2) / 0.8, 2) * k;
        ctx.globalAlpha = 0.9 * a;
        ctx.drawImage(dot, Math.round(x - 6), Math.round(y - 6));
        ctx.globalAlpha = a;
        ctx.fillStyle = "#f4ffc8";
        ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
    }
    /** Vaga-lumes perto de arbustos, flores e árvores (posições fixas pela semente). */
    seedFireflies(ext) {
      this.fliesFor = ext;
      this.flies = [];
      const rng = mulberry32(61925 + ext.bounds.w);
      const spots = ext.props.filter((p) => p.kind === "bush" || p.kind === "flowers" || p.kind === "tree");
      if (!spots.length) return;
      for (let i = 0; i < FIREFLIES; i++) {
        const p = spots[Math.floor(rng() * spots.length)];
        this.flies.push({
          x: p.x + (rng() - 0.5) * 28,
          y: p.y - 6 - rng() * 14,
          ph: rng() * Math.PI * 2,
          sx: 0.25 + rng() * 0.35,
          sy: 0.3 + rng() * 0.4,
          blink: 0.6 + rng() * 0.9
        });
      }
    }
  };

  // vendor/habblaud/upstream/client/src/world/render/particles.ts
  var CONFETTI_COLORS = ["#ff4d6d", "#ffb11f", "#ffe14d", "#3ddc84", "#3fa7ff", "#b06bff", "#ff7ad9"];
  var POPCORN_BODY = "#fff6dc";
  var POPCORN_SHADE = "#f2c75c";
  var RAIN_COLOR = "#7cc4ff";
  var COIN_BODY = "#ffcf3a";
  var COIN_EDGE = "#c98a12";
  var COIN_SHINE = "#fff6c2";
  var SPARKLE_COLORS = ["#ffffff", "#fff3a6", "#ffd1f0", "#bfe9ff"];
  var GRAVITY = { [0 /* Popcorn */]: 260, [1 /* Confetti */]: 150, [2 /* Rain */]: 0, [3 /* Coin */]: 240, [4 /* Sparkle */]: -14 };
  var DRAG = { [0 /* Popcorn */]: 0, [1 /* Confetti */]: 2.2, [2 /* Rain */]: 0, [3 /* Coin */]: 0, [4 /* Sparkle */]: 3 };
  var Particles = class {
    cap;
    n = 0;
    x;
    y;
    vx;
    vy;
    age;
    life;
    /** Fase própria (oscilação do confete). */
    ph;
    kind;
    color;
    constructor(cap = 600) {
      this.cap = cap;
      this.x = new Float32Array(cap);
      this.y = new Float32Array(cap);
      this.vx = new Float32Array(cap);
      this.vy = new Float32Array(cap);
      this.age = new Float32Array(cap);
      this.life = new Float32Array(cap);
      this.ph = new Float32Array(cap);
      this.kind = new Uint8Array(cap);
      this.color = new Uint8Array(cap);
    }
    get count() {
      return this.n;
    }
    /** Adiciona uma partícula (ignorada se o pool estiver cheio). `life` em segundos. */
    spawn(kind, x, y, vx, vy, life, color = 0) {
      if (this.n >= this.cap) return;
      const i = this.n++;
      this.kind[i] = kind;
      this.x[i] = x;
      this.y[i] = y;
      this.vx[i] = vx;
      this.vy[i] = vy;
      this.age[i] = 0;
      this.life[i] = Math.max(0.01, life);
      this.ph[i] = Math.random() * 6.283;
      this.color[i] = color;
    }
    /** Uma pipoca pula do balde: arco curto para cima e cai de volta. */
    popcorn(x, y) {
      const vy = -(62 + Math.random() * 26);
      this.spawn(0 /* Popcorn */, x + (Math.random() * 4 - 2), y, Math.random() * 28 - 14, vy, -2 * vy / GRAVITY[0 /* Popcorn */] + 0.05);
    }
    /** Explosão de confete colorido a partir de (x, y). */
    confetti(x, y, count = 42) {
      for (let i = 0; i < count; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        const sp = 55 + Math.random() * 70;
        this.spawn(1 /* Confetti */, x + (Math.random() * 6 - 3), y, Math.cos(a) * sp, Math.sin(a) * sp, 1.3 + Math.random() * 0.9, Math.floor(Math.random() * CONFETTI_COLORS.length));
      }
    }
    /** Um confete caindo do alto (festa da sala): balança no ar e some depois de cair ~`fall` px. */
    confettiFall(x, y, fall) {
      this.spawn(1 /* Confetti */, x, y, Math.random() * 24 - 12, 8 + Math.random() * 16, Math.max(0.3, fall / 34) * (0.85 + Math.random() * 0.3), Math.floor(Math.random() * CONFETTI_COLORS.length));
    }
    /** Um pingo de chuva caindo `fall` px a partir de (x, y). */
    rain(x, y, fall) {
      const v = 32;
      this.spawn(2 /* Rain */, x, y, 0, v, Math.max(0.05, fall / v));
    }
    /**
     * Moedinhas em arco de (x0, y0) até (x1, y1): cada uma é um lançamento balístico que chega ao
     * destino no fim da vida (umas antes, outras depois, como um punhado jogado).
     */
    coins(x0, y0, x1, y1, count = 7) {
      const g = GRAVITY[3 /* Coin */];
      for (let i = 0; i < count; i++) {
        const t2 = 0.55 + i * 0.07 + Math.random() * 0.06;
        const tx = x1 + (Math.random() * 6 - 3);
        const ty = y1 + (Math.random() * 3 - 1);
        const sx = x0 + (Math.random() * 4 - 2);
        this.spawn(3 /* Coin */, sx, y0, (tx - sx) / t2, (ty - y0) / t2 - 0.5 * g * t2, t2);
      }
    }
    /** Brilhos subindo em volta de (x, y). */
    sparkle(x, y, count = 9) {
      for (let i = 0; i < count; i++) {
        const a = i / count * Math.PI * 2 + Math.random() * 0.5;
        const r = 5 + Math.random() * 6;
        this.spawn(4 /* Sparkle */, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8 - 6, Math.cos(a) * 6, -10 - Math.random() * 8, 0.8 + Math.random() * 0.6, Math.floor(Math.random() * SPARKLE_COLORS.length));
      }
    }
    update(dt) {
      const d = Math.min(0.1, Math.max(0, dt));
      let i = 0;
      while (i < this.n) {
        this.age[i] += d;
        if (this.age[i] >= this.life[i]) {
          this.remove(i);
          continue;
        }
        const k = this.kind[i];
        this.vy[i] += GRAVITY[k] * d;
        if (DRAG[k]) this.vx[i] *= Math.max(0, 1 - DRAG[k] * d);
        if (k === 1 /* Confetti */ && this.vy[i] > 38) this.vy[i] = 38;
        this.x[i] += this.vx[i] * d;
        this.y[i] += this.vy[i] * d;
        i++;
      }
    }
    /** Desenha as partículas visíveis no retângulo (px de mundo). */
    draw(ctx, vx0, vy0, vx1, vy1, now) {
      if (!this.n) return;
      for (let i = 0; i < this.n; i++) {
        const x = Math.round(this.x[i]);
        const y = Math.round(this.y[i]);
        if (x < vx0 - 2 || x > vx1 + 2 || y < vy0 - 2 || y > vy1 + 2) continue;
        const k = this.kind[i];
        const left = 1 - this.age[i] / this.life[i];
        if (k === 0 /* Popcorn */) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = POPCORN_BODY;
          ctx.fillRect(x, y, 2, 2);
          ctx.fillStyle = POPCORN_SHADE;
          ctx.fillRect(x + 1, y + 1, 1, 1);
        } else if (k === 1 /* Confetti */) {
          ctx.globalAlpha = Math.min(1, left * 3.5);
          ctx.fillStyle = CONFETTI_COLORS[this.color[i] % CONFETTI_COLORS.length];
          const flip = Math.sin(now / 90 + this.ph[i]) > 0;
          ctx.fillRect(x, y, flip ? 2 : 1, flip ? 1 : 2);
        } else if (k === 3 /* Coin */) {
          ctx.globalAlpha = 1;
          const face = Math.sin(now / 70 + this.ph[i]) > -0.3;
          if (face) {
            ctx.fillStyle = COIN_EDGE;
            ctx.fillRect(x - 1, y - 1, 3, 3);
            ctx.fillStyle = COIN_BODY;
            ctx.fillRect(x - 1, y - 1, 2, 2);
            ctx.fillStyle = COIN_SHINE;
            ctx.fillRect(x - 1, y - 1, 1, 1);
          } else {
            ctx.fillStyle = COIN_BODY;
            ctx.fillRect(x, y - 1, 1, 3);
          }
        } else if (k === 4 /* Sparkle */) {
          ctx.globalAlpha = Math.min(1, left * 2.5);
          ctx.fillStyle = SPARKLE_COLORS[this.color[i] % SPARKLE_COLORS.length];
          if (Math.sin(now / 90 + this.ph[i]) > 0) {
            ctx.fillRect(x - 1, y, 3, 1);
            ctx.fillRect(x, y - 1, 1, 3);
          } else ctx.fillRect(x, y, 1, 1);
        } else {
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = RAIN_COLOR;
          ctx.fillRect(x, y, 1, 2);
        }
      }
      ctx.globalAlpha = 1;
    }
    clear() {
      this.n = 0;
    }
    /** Remove trocando pelo último (ordem não importa). */
    remove(i) {
      const j = --this.n;
      if (i === j) return;
      this.x[i] = this.x[j];
      this.y[i] = this.y[j];
      this.vx[i] = this.vx[j];
      this.vy[i] = this.vy[j];
      this.age[i] = this.age[j];
      this.life[i] = this.life[j];
      this.ph[i] = this.ph[j];
      this.kind[i] = this.kind[j];
      this.color[i] = this.color[j];
    }
  };

  // vendor/habblaud/upstream/client/src/world/render/shell-sprites.ts
  var GLYPHS2 = {
    "\xD7": ["000", "101", "010", "101", "000"],
    "+": ["000", "010", "111", "010", "000"],
    "0": ["111", "101", "101", "101", "111"],
    "1": ["010", "110", "010", "010", "111"],
    "2": ["110", "001", "010", "100", "111"],
    "3": ["110", "001", "010", "001", "110"],
    "4": ["101", "101", "111", "001", "001"],
    "5": ["111", "100", "110", "001", "110"],
    "6": ["011", "100", "111", "101", "111"],
    "7": ["111", "001", "010", "010", "010"],
    "8": ["111", "101", "111", "101", "111"],
    "9": ["111", "101", "111", "001", "110"]
  };
  var BADGE_BG = "#2b3346";
  var BADGE_EDGE = "#151a26";
  var BADGE_FG = "#ffe08a";
  var badges = /* @__PURE__ */ new Map();
  function canvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    return { c, ctx };
  }
  function badgeText(n) {
    return n > 9 ? "\xD79+" : `\xD7${Math.max(0, Math.floor(n))}`;
  }
  function countBadge(n) {
    const key = Math.min(10, Math.max(2, Math.floor(n)));
    let s = badges.get(key);
    if (s) return s;
    const text = badgeText(key);
    const glyphs = [...text];
    const tw = glyphs.length * 4 - 1;
    const w = tw + 4;
    const h = 9;
    const { c, ctx } = canvas(w, h);
    ctx.fillStyle = BADGE_EDGE;
    ctx.fillRect(1, 0, w - 2, h);
    ctx.fillRect(0, 1, w, h - 2);
    ctx.fillStyle = BADGE_BG;
    ctx.fillRect(1, 1, w - 2, h - 2);
    ctx.fillStyle = BADGE_FG;
    let x = 2;
    for (const g of glyphs) {
      const rows = GLYPHS2[g];
      if (rows) {
        for (let r = 0; r < 5; r++) for (let k = 0; k < 3; k++) if (rows[r][k] === "1") ctx.fillRect(x + k, 2 + r, 1, 1);
      }
      x += 4;
    }
    s = { canvas: c, ax: 0, ay: h };
    badges.set(key, s);
    return s;
  }
  var OUT = "#2a3142";
  var TEMPLATES = {
    hourglass: {
      rows: [
        "oooooooo",
        ".owwwwo.",
        ".oyyyyo.",
        "..oyyo..",
        "...oo...",
        "..owwo..",
        ".owyywo.",
        ".oyyyyo.",
        "oooooooo"
      ],
      pal: { o: "#8a5a2b", w: "#e8f4ff", y: "#ffd166" }
    },
    hourglass_flip: {
      rows: [
        "...oo...",
        "..owwo..",
        ".owwyyo.",
        "oowyyyoo",
        "o.oyyo.o",
        "oowwwwoo",
        ".owwwwo.",
        "..owwo..",
        "...oo..."
      ],
      pal: { o: "#8a5a2b", w: "#e8f4ff", y: "#ffd166" }
    },
    cobweb: {
      rows: [
        "w....w....w.",
        ".w...w...w..",
        "..wwwwwww...",
        "..w.w.w.w...",
        ".wwwwwwwww..",
        "..w.w.w.w...",
        "...wwwwww...",
        "....w.w.....",
        ".....ww.....",
        "......s.....",
        "......s.....",
        ".....kkk...."
      ],
      pal: { w: "#e9eef7", s: "#c9d1de", k: "#2b2b33" },
      outline: false
    },
    storm: {
      rows: [
        "...cccc....",
        ".cccwwccc..",
        "cwwwwwwwcc.",
        "cwwwwwwwwwc",
        ".cccccyccc.",
        ".....yy....",
        "....yy.....",
        ".....y....."
      ],
      pal: { c: "#7d8799", w: "#c3cad6", y: "#ffd23f" }
    }
  };
  var fallbacks = /* @__PURE__ */ new Map();
  function fallbackIcon(name) {
    if (fallbacks.has(name)) return fallbacks.get(name);
    const t2 = TEMPLATES[name];
    let s = null;
    if (t2 && typeof document !== "undefined") {
      const w = Math.max(...t2.rows.map((r) => r.length));
      const h = t2.rows.length;
      const { c, ctx } = canvas(w + 2, h + 2);
      ctx.fillStyle = OUT;
      if (t2.outline !== false) {
        for (let y = 0; y < h; y++) for (let x = 0; x < t2.rows[y].length; x++) if (t2.pal[t2.rows[y][x]]) ctx.fillRect(x, y, 3, 3);
      }
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < t2.rows[y].length; x++) {
          const col = t2.pal[t2.rows[y][x]];
          if (!col) continue;
          ctx.fillStyle = col;
          ctx.fillRect(x + 1, y + 1, 1, 1);
        }
      }
      s = { canvas: c, ax: Math.floor((w + 2) / 2), ay: h + 2 };
    }
    fallbacks.set(name, s);
    return s;
  }

  // vendor/habblaud/upstream/client/src/world/render/renderer.ts
  var TV_MODES = ["browser", "idle", "chat", "code"];
  var POPCORN_DX = { down: 0, up: -9, left: -5, right: 5 };
  var POPCORN_DY = { down: 11, up: 8, left: 9, right: 9 };
  var WEB_MAX_OUT = 9;
  var VIGNETTE_ALPHA = 0.2;
  var VIGNETTE_EDGE = `rgba(18,40,26,${VIGNETTE_ALPHA})`;
  var Renderer = class {
    constructor(canvas2, art2, sim, camera) {
      this.canvas = canvas2;
      this.art = art2;
      this.sim = sim;
      this.camera = camera;
      this.ctx = canvas2.getContext("2d", { alpha: false });
      this.exterior = layoutExterior(sim.building.cols);
      this.lighting = new Lighting(art2, sim);
    }
    ctx;
    areas = /* @__PURE__ */ new Map();
    heads = /* @__PURE__ */ new Map();
    exterior;
    shells = [];
    shellWindows = [];
    base = null;
    baseX = 0;
    baseY = 0;
    baseCols = -1;
    layoutVersion = -1;
    assetsVersion = 0;
    builtAssetsVersion = 0;
    cars = [];
    nextCarAt = 0;
    ents = [];
    pool = [];
    date = /* @__PURE__ */ new Date();
    icons = [];
    /** Pipoca, confete e chuva (pool fixo). */
    particles = new Particles();
    /** Festa e alarme das salas (eventos do GitHub). */
    roomFx = new RoomFxRenderer();
    /** dt do frame atual (s), para as partículas emitidas durante o desenho. */
    dt = 0;
    iconCount = 0;
    elevatorVis = [];
    occupiedSlots = /* @__PURE__ */ new Set();
    /** Hora forçada (?hora=21:30 na URL ou depuração) ou null para a hora local. */
    hourOverride = parseHourParam(typeof location === "undefined" ? "" : location.search);
    /** Relógio da hora do dia (céu, iluminação, relógio de parede); o timelapse troca pelo instante reproduzido. */
    clock = () => Date.now();
    /** Ciclo dia/noite: mapa de luz e brilhos. */
    lighting;
    assets = null;
    /** Último fator noturno aplicado (usado pelo overlay). */
    night = 0;
    clearColor = "#7fae62";
    grass = null;
    theme = "none";
    setAssets(a) {
      this.assets = a;
      this.assetsVersion++;
    }
    // =================================================================== sincronização com a simulação
    /** Mantém caches e visuais coerentes com o prédio atual. */
    sync(theme = "none") {
      const sim = this.sim;
      const themeChanged = theme !== this.theme;
      this.theme = theme;
      const assetsChanged = this.builtAssetsVersion !== this.assetsVersion || themeChanged;
      if (this.baseCols !== sim.building.cols || assetsChanged) this.buildBase();
      if (this.layoutVersion !== sim.layoutVersion || assetsChanged) {
        this.layoutVersion = sim.layoutVersion;
        const want = /* @__PURE__ */ new Set();
        for (const a of [...sim.building.core, sim.building.corridor]) {
          want.add(a.id);
          const cur = this.areas.get(a.id);
          if (!cur || cur.layout !== a || assetsChanged) this.areas.set(a.id, buildAreaVis(this.art, a, void 0, this.assets, theme));
        }
        for (const room of sim.rooms.values()) {
          if (!room.present) continue;
          want.add(room.id);
        }
        for (const id of [...this.areas.keys()]) if (!want.has(id)) this.areas.delete(id);
        this.elevatorVis = this.areas.get("core:recepcao")?.wallItems.filter((w) => w.kind === "elevator") ?? [];
      }
      this.occupiedSlots.clear();
      for (const room of sim.rooms.values()) {
        if (!room.present) continue;
        this.occupiedSlots.add(room.slot);
        const cur = this.areas.get(room.id);
        if (!cur || cur.layout !== room.layout || cur.version !== room.version || assetsChanged) {
          this.areas.set(room.id, buildAreaVis(this.art, room.layout, room, this.assets, theme));
        } else cur.room = room;
      }
      for (const [id, vis] of this.areas) if (vis.room && !vis.room.present) this.areas.delete(id);
      this.builtAssetsVersion = this.assetsVersion;
    }
    /** Camada base: área externa, pátios dos slots e fechamentos do corredor. */
    buildBase() {
      const cols = this.sim.building.cols;
      this.baseCols = cols;
      this.exterior = layoutExterior(cols);
      const b = this.exterior.bounds;
      this.baseX = b.x * TILE;
      this.baseY = b.y * TILE;
      const c = document.createElement("canvas");
      c.width = b.w * TILE;
      c.height = b.h * TILE;
      const ctx = c.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.translate(-this.baseX, -this.baseY);
      paintShell(this.art, ctx, this.exterior.floors, []);
      const ly = this.exterior.streetY + Math.round(this.exterior.streetH / 2) - 1;
      ctx.fillStyle = "rgba(255,236,170,0.75)";
      for (let x = this.baseX + 4; x < this.baseX + c.width; x += 24) ctx.fillRect(x, ly, 12, 2);
      this.shells = [];
      this.shellWindows = [];
      for (let col = CORE_COLS; col < cols; col++) {
        for (const side of ["north", "south"]) {
          const sh = slotShell(slotAt(col, side), col === cols - 1);
          this.shells.push(sh);
          paintShell(this.art, ctx, sh.floors, sh.walls);
          for (const w of sh.windows) this.shellWindows.push(toWallVis(w, `shell:${sh.slot}`));
        }
      }
      this.desaturate(ctx);
      const s = 4 * TILE;
      try {
        const tile = document.createElement("canvas");
        tile.width = 2 * s;
        tile.height = 2 * s;
        const tctx = tile.getContext("2d");
        tctx.imageSmoothingEnabled = false;
        for (const [mx, my] of [
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1]
        ]) {
          tctx.setTransform(mx ? -1 : 1, 0, 0, my ? -1 : 1, mx ? 2 * s : 0, my ? 2 * s : 0);
          tctx.drawImage(c, 0, 0, s, s, 0, 0, s, s);
        }
        tctx.setTransform(1, 0, 0, 1, 0, 0);
        const d = tctx.getImageData(0, 0, 2 * s, 2 * s).data;
        let r = 0;
        let g = 0;
        let bl = 0;
        for (let i = 0; i < d.length; i += 4) {
          r += d[i];
          g += d[i + 1];
          bl += d[i + 2];
        }
        const n = d.length / 4;
        const avg = `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(bl / n)})`;
        tctx.globalAlpha = 0.6;
        tctx.fillStyle = avg;
        tctx.fillRect(0, 0, 2 * s, 2 * s);
        tctx.globalAlpha = 1;
        tctx.fillStyle = VIGNETTE_EDGE;
        tctx.fillRect(0, 0, 2 * s, 2 * s);
        this.grass = this.ctx.createPattern(tile, "repeat");
        const k = VIGNETTE_ALPHA;
        this.clearColor = `rgb(${Math.round(r / n * (1 - k) + 18 * k)},${Math.round(g / n * (1 - k) + 40 * k)},${Math.round(bl / n * (1 - k) + 26 * k)})`;
      } catch {
        this.grass = null;
        this.clearColor = "#6f9a5a";
      }
      this.finishBase(ctx, cols);
      this.base = c;
    }
    /** Grama ~15% menos saturada: o gramado não compete com o escritório. */
    desaturate(ctx) {
      const b = this.exterior.bounds;
      ctx.save();
      try {
        ctx.globalCompositeOperation = "saturation";
        ctx.fillStyle = "rgba(128,128,128,0.16)";
        ctx.fillRect(b.x * TILE, b.y * TILE, b.w * TILE, b.h * TILE);
      } catch {
      }
      ctx.restore();
    }
    /** Acabamento da camada externa: bordas levemente mais escuras (vinheta) e o capacho da entrada. */
    finishBase(ctx, cols) {
      const b = this.exterior.bounds;
      const x0 = b.x * TILE;
      const y0 = b.y * TILE;
      const w = b.w * TILE;
      const h = b.h * TILE;
      ctx.save();
      const bwT = cols * COL_W;
      const smooth = (a, z, v) => {
        const t2 = Math.max(0, Math.min(1, (v - a) / Math.max(1e-6, z - a)));
        return t2 * t2 * (3 - 2 * t2);
      };
      try {
        const m = document.createElement("canvas");
        m.width = b.w;
        m.height = b.h;
        const mctx = m.getContext("2d");
        const img = mctx.createImageData(b.w, b.h);
        for (let ty = 0; ty < b.h; ty++) {
          for (let tx = 0; tx < b.w; tx++) {
            const wx = b.x + tx + 0.5;
            const wy = b.y + ty + 0.5;
            const fx = wx < 0 ? smooth(6, -b.x, -wx) : wx > bwT ? smooth(6, b.x + b.w - bwT, wx - bwT) : 0;
            const fy = wy < 0 ? smooth(5, -b.y, -wy) : wy > BUILDING_H ? smooth(12, b.y + b.h - BUILDING_H, wy - BUILDING_H) : 0;
            const i = (ty * b.w + tx) * 4;
            img.data[i] = 18;
            img.data[i + 1] = 40;
            img.data[i + 2] = 26;
            img.data[i + 3] = Math.round(Math.max(fx, fy) * VIGNETTE_ALPHA * 255);
          }
        }
        mctx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(m, x0, y0, w, h);
        ctx.imageSmoothingEnabled = false;
      } catch {
      }
      const my = (CORRIDOR_Y + 1.25) * TILE;
      ctx.fillStyle = "#3f4652";
      ctx.fillRect(-1.75 * TILE, my, 1.5 * TILE, 2.5 * TILE);
      ctx.fillStyle = "#596170";
      ctx.fillRect(-1.75 * TILE + 2, my + 2, 1.5 * TILE - 4, 2.5 * TILE - 4);
      ctx.fillStyle = "#4b525f";
      for (let y = my + 4; y < my + 2.5 * TILE - 4; y += 3) ctx.fillRect(-1.75 * TILE + 3, y, 1.5 * TILE - 6, 1);
      ctx.restore();
    }
    // =================================================================== frame
    frame(now, dt, opts, sel) {
      const { ctx, camera } = this;
      this.date.setTime(this.clock());
      this.dt = dt;
      this.updateCars(now, dt);
      const W = this.canvas.width;
      const H = this.canvas.height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = this.clearColor;
      ctx.fillRect(0, 0, W, H);
      const { scale, ox, oy } = camera.transform();
      ctx.setTransform(scale, 0, 0, scale, ox, oy);
      const vx0 = -ox / scale;
      const vy0 = -oy / scale;
      const vx1 = vx0 + W / scale;
      const vy1 = vy0 + H / scale;
      if (this.grass && this.base) {
        const bx1 = this.baseX + this.base.width;
        const by1 = this.baseY + this.base.height;
        if (vx0 < this.baseX || vy0 < this.baseY || vx1 > bx1 || vy1 > by1) {
          ctx.fillStyle = this.grass;
          ctx.save();
          ctx.translate(this.baseX, this.baseY);
          ctx.fillRect(vx0 - this.baseX - 1, vy0 - this.baseY - 1, vx1 - vx0 + 2, vy1 - vy0 + 2);
          ctx.restore();
        }
      }
      const visible = (x, y, w, h) => x < vx1 && x + w > vx0 && y < vy1 && y + h > vy0;
      if (this.base) {
        const sx = Math.max(0, Math.floor(vx0 - this.baseX) - 1);
        const sy = Math.max(0, Math.floor(vy0 - this.baseY) - 1);
        const sw = Math.min(this.base.width - sx, Math.ceil(vx1 - vx0) + 3);
        const sh = Math.min(this.base.height - sy, Math.ceil(vy1 - vy0) + 3);
        if (sw > 0 && sh > 0) ctx.drawImage(this.base, sx, sy, sw, sh, this.baseX + sx, this.baseY + sy, sw, sh);
      }
      if (this.hourOverride !== null) {
        const min = Math.round(this.hourOverride * 60);
        this.date.setHours(Math.floor(min / 60) % 24, min % 60);
      }
      const hour = this.lighting.update(now, daylightModeOf(opts), this.hourOverride, this.date);
      const t2 = now;
      for (const w of this.shellWindows) {
        const slot = Number(w.areaId.slice(6));
        const room = this.roomInSlot(slot);
        if (room && room.phase === "ready") continue;
        if (!visible(w.cx - 24, w.baseY - 40, 48, 44)) continue;
        this.drawWindow(w, hour, t2, 1);
      }
      for (const vis of this.areas.values()) {
        const p = vis.px;
        if (!visible(p.x, p.y - WALL_MARGIN, p.w, p.h + WALL_MARGIN)) continue;
        const anim = vis.room ? buildAnim(vis.room.phase, vis.room.progress(now)) : NO_ANIM;
        this.drawFloor(vis, anim);
      }
      for (const vis of this.areas.values()) {
        const p = vis.px;
        if (!visible(p.x, p.y - WALL_MARGIN, p.w, p.h + WALL_MARGIN)) continue;
        const anim = vis.room ? buildAnim(vis.room.phase, vis.room.progress(now)) : NO_ANIM;
        this.drawWalls(vis, anim, now, hour);
      }
      const view = { x0: vx0, y0: vy0, x1: vx1, y1: vy1 };
      this.roomFx.drawFloor(ctx, this.sim, now, view);
      const ents = this.ents;
      ents.length = 0;
      let used = 0;
      const push = (k, y, ref, area, scale2) => {
        let e = this.pool[used];
        if (!e) this.pool[used] = e = { k, y, ref, area, scale: scale2 };
        else {
          e.k = k;
          e.y = y;
          e.ref = ref;
          e.area = area;
          e.scale = scale2;
        }
        used++;
        ents.push(e);
      };
      for (const vis of this.areas.values()) {
        const p = vis.px;
        if (!visible(p.x - TILE, p.y - 3 * TILE, p.w + 2 * TILE, p.h + 4 * TILE)) continue;
        const anim = vis.room ? buildAnim(vis.room.phase, vis.room.progress(now)) : NO_ANIM;
        for (const f of vis.furniture) {
          const s = anim.mode === "none" ? 1 : furnitureScale(anim, f.order);
          if (s <= 0.01) continue;
          if (!visible(f.ax - 3 * TILE, f.ay - 4 * TILE, 6 * TILE, 4 * TILE + 4)) continue;
          push(0 /* FurnBase */, f.ay, f, vis, s);
          const fs = furnitureSprites2(this.art, f, this.furnState(f, now));
          if (fs?.front) push(1 /* FurnFront */, f.ay + 0.5, f, vis, s);
        }
      }
      for (const ch of this.sim.people()) {
        const head = this.headOf(ch);
        head.visible = false;
        if (ch.inside || ch.alpha <= 0.01 || now < ch.hiddenUntil) continue;
        if (!visible(ch.x - 24, ch.y - 48, 48, 56)) {
          head.x = ch.x;
          head.y = ch.y - 26;
          head.feetY = ch.y;
          continue;
        }
        push(2 /* Char */, ch.depth(), ch, null, 1);
      }
      for (const prop2 of this.exterior.props) {
        if (!visible(prop2.x - 24, prop2.y - 56, 48, 60)) continue;
        let alpha = 1;
        if (prop2.whenRoom !== void 0) {
          const room = this.roomInSlot(prop2.whenRoom);
          if (!room) continue;
          if (room.phase === "building" || room.phase === "dismantling") {
            const pr = room.progress(now);
            alpha = room.phase === "building" ? Math.min(1, pr * 3) : 1 - Math.min(1, Math.max(0, (pr - 0.75) * 4));
            if (alpha <= 0.02) continue;
          }
        }
        push(3 /* Prop */, prop2.y, prop2, null, alpha);
      }
      for (const sh of this.shells) {
        const room = this.roomInSlot(sh.slot);
        let alpha = 1;
        if (room) {
          if (room.phase !== "building" && room.phase !== "dismantling") continue;
          const pr = room.progress(now);
          alpha = room.phase === "building" ? 1 - Math.min(1, pr * 3) : Math.min(1, Math.max(0, (pr - 0.75) * 4));
          if (alpha <= 0.02) continue;
        }
        for (const prop2 of sh.props) {
          if (!visible(prop2.x - 24, prop2.y - 56, 48, 60)) continue;
          push(3 /* Prop */, prop2.y, prop2, null, alpha);
        }
      }
      for (const car of this.cars) if (visible(car.x - 24, car.y - 24, 48, 28)) push(4 /* Car */, car.y, car, null, 1);
      ents.sort((a, b) => a.y - b.y || a.k - b.k);
      beginOpenBotFrame(this.canvas);
      this.iconCount = 0;
      for (const e of ents) {
        switch (e.k) {
          case 0 /* FurnBase */:
            this.drawFurniture(e.ref, e.area, e.scale, false, now);
            break;
          case 1 /* FurnFront */:
            this.drawFurniture(e.ref, e.area, e.scale, true, now);
            break;
          case 2 /* Char */:
            this.drawCharacter(e.ref, now, sel);
            break;
          case 3 /* Prop */:
            this.drawProp(e.ref, e.scale);
            break;
          case 4 /* Car */:
            this.drawCar(e.ref);
            break;
        }
      }
      this.drawPingPong(now);
      this.drawCobwebs(now);
      this.drainEffects(now);
      this.roomFx.emit(this.particles, this.sim, now, dt, view);
      this.particles.update(dt);
      this.particles.draw(ctx, vx0, vy0, vx1, vy1, now);
      this.night = this.lighting.night;
      this.drawLighting(now, vx0, vy0, vx1, vy1);
      drawOpenBotServiceLights(ctx, this.sim.chars.values(), this.heads);
      if (this.theme !== "none") {
        for (const vis of this.areas.values()) {
          if (vis.room && vis.room.phase !== "ready") continue;
          if (!visible(vis.px.x, vis.px.y, vis.px.w, vis.px.h)) continue;
          drawSeasonalLights(ctx, this.theme, vis.layout, vis.room ? vis.room.light(now) : 1);
        }
      }
      this.roomFx.drawLights(ctx, this.sim, this.heads, now, view);
      for (let i = 0; i < this.iconCount; i++) {
        const ic = this.icons[i];
        const s = this.icon(ic.name);
        if (!s) continue;
        ctx.globalAlpha = ic.alpha;
        const ix = Math.round(ic.x - s.ax);
        const iy = Math.round(ic.y - s.ay - ic.bounce);
        ctx.drawImage(s.canvas, ix, iy);
        if (ic.badge > 1) {
          const b = countBadge(ic.badge);
          ctx.drawImage(b.canvas, ix + s.canvas.width - 1, iy + s.canvas.height - b.ay + 1);
        }
      }
      ctx.globalAlpha = 1;
    }
    headOf(ch) {
      let h = this.heads.get(ch.id);
      if (!h) this.heads.set(ch.id, h = { x: 0, y: 0, feetY: 0, visible: false, bx: 0, by: 0, bw: 0, bh: 0, depth: 0 });
      return h;
    }
    /** Remove entradas de personagens que já saíram. */
    pruneHeads() {
      for (const id of this.heads.keys()) if (!this.sim.person(id)) this.heads.delete(id);
    }
    roomInSlot(slot) {
      if (!this.occupiedSlots.has(slot)) return void 0;
      for (const r of this.sim.rooms.values()) if (r.slot === slot && r.present) return r;
      return void 0;
    }
    // =================================================================== áreas
    drawFloor(vis, anim) {
      const { ctx } = this;
      const p = vis.px;
      if (anim.floor >= 1) {
        ctx.drawImage(vis.floor, p.x, p.y);
        return;
      }
      if (anim.floor <= 0) return;
      const w = vis.layout.rect.w;
      const h = vis.layout.rect.h;
      const k = anim.floor * 1.06;
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          if (sweepDelay(i, j, w, h) > k) continue;
          ctx.drawImage(vis.floor, i * TILE, j * TILE, TILE, TILE, p.x + i * TILE, p.y + j * TILE, TILE, TILE);
        }
      }
    }
    drawWalls(vis, anim, now, hour) {
      const { ctx } = this;
      const p = vis.px;
      if (anim.walls <= 0) return;
      const rise = Math.round((1 - anim.walls) * 10);
      if (anim.walls < 1) ctx.globalAlpha = anim.walls;
      ctx.drawImage(vis.walls, p.x, p.y - WALL_MARGIN + rise);
      for (const w of vis.wallItems) this.drawWallItem(vis, w, now, hour, rise);
      ctx.globalAlpha = 1;
      if (vis.sign && anim.sign > 0) {
        const slide = Math.round((1 - anim.sign) * -18);
        ctx.globalAlpha = anim.sign;
        this.drawSign(vis, vis.sign, slide);
        ctx.globalAlpha = 1;
      }
    }
    drawWallItem(vis, w, now, hour, rise) {
      const { ctx } = this;
      switch (w.kind) {
        case "window":
          this.drawWindow(w, hour, now, 1, rise);
          return;
        case "elevator": {
          const idx = this.elevatorVis.indexOf(w);
          const state = this.sim.elevators[idx]?.state ?? 0;
          const s = wallSprites(this.art, "elevator", w.variant, state, w.seed);
          if (!s) return;
          const o = wallItemOrigin(w, s.base);
          ctx.drawImage(s.base.canvas, o.x, o.y + rise);
          decorateElevator(ctx, this.theme, w.cx, w.baseY + rise);
          return;
        }
        case "light_switch": {
          const on = vis.room ? vis.room.lightOn : true;
          const s = wallSprites(this.art, "light_switch", on ? "on" : "off", 0, w.seed);
          if (!s) return;
          const o = wallItemOrigin(w, s.base);
          ctx.drawImage(s.base.canvas, o.x, o.y + rise);
          return;
        }
        case "clock": {
          const s = wallSprites(this.art, "clock", w.variant, 0, w.seed);
          if (!s) return;
          const o = wallItemOrigin(w, s.base);
          ctx.drawImage(s.base.canvas, o.x, o.y + rise);
          const r = s.base.rects?.face;
          if (r) this.safe(() => this.art.drawClock(ctx, { x: o.x + r.x, y: o.y + rise + r.y, w: r.w, h: r.h }, this.date));
          return;
        }
        case "whiteboard": {
          const s = wallSprites(this.art, "whiteboard", w.variant, 0, w.seed);
          if (!s) return;
          const o = wallItemOrigin(w, s.base);
          ctx.drawImage(s.base.canvas, o.x, o.y + rise);
          const r = s.base.rects?.board;
          if (r) this.safe(() => this.art.drawBoard(ctx, { x: o.x + r.x, y: o.y + rise + r.y, w: r.w, h: r.h }, vis.room?.board ?? [], now));
          return;
        }
        case "tv": {
          const s = wallSprites(this.art, "tv", w.variant, 0, w.seed);
          if (!s) return;
          const o = wallItemOrigin(w, s.base);
          ctx.drawImage(s.base.canvas, o.x, o.y + rise);
          const r = s.base.rects?.tv;
          const live = this.sim.social.tvScreen();
          const mode = live ? live.mode : TV_MODES[Math.floor(now / 9e3) % TV_MODES.length];
          const seed = live ? live.seed : w.seed;
          if (r) this.safe(() => this.art.drawScreen(ctx, { x: o.x + r.x, y: o.y + rise + r.y, w: r.w, h: r.h }, mode, now, seed));
          return;
        }
        case "mirror": {
          const s = wallSprites(this.art, "mirror", w.variant, 0, w.seed);
          if (!s) return;
          const o = wallItemOrigin(w, s.base);
          ctx.drawImage(s.base.canvas, o.x, o.y + rise);
          const r = s.base.rects?.glass;
          if (r) this.drawReflection(w, o.x + r.x, o.y + rise + r.y, r.w, r.h);
          return;
        }
        default: {
          const s = wallSprites(this.art, w.kind, w.variant, 0, w.seed);
          if (!s) return;
          const o = wallItemOrigin(w, s.base);
          ctx.drawImage(s.base.canvas, o.x, o.y + rise);
        }
      }
    }
    drawWindow(w, hour, now, alpha, rise = 0) {
      const { ctx } = this;
      const s = wallSprites(this.art, "window", w.variant, 0, w.seed);
      if (!s) return;
      const o = wallItemOrigin(w, s.base);
      let r = s.base.rects?.glass;
      if (!r) {
        const b = opaqueBounds(s.base.canvas);
        r = { x: b.x + 2, y: b.y + 2, w: b.w - 4, h: b.h - 4 };
      }
      ctx.globalAlpha *= alpha;
      this.safe(() => this.art.drawWindowView(ctx, { x: o.x + r.x, y: o.y + rise + r.y, w: r.w, h: r.h }, hour, now, w.seed));
      drawSeasonalWindow(ctx, this.theme, { x: o.x + r.x, y: o.y + rise + r.y, w: r.w, h: r.h }, now, w.seed);
      ctx.drawImage(s.base.canvas, o.x, o.y + rise);
    }
    /** Placa com o nome (o texto nítido é escrito pelo overlay em espaço de tela). */
    drawSign(vis, w, slide) {
      const { ctx } = this;
      if (!vis.room && this.assets?.signage && vis.id === "core:recepcao") {
        const a = this.assets.signage;
        const maxW = 5 * TILE;
        const maxH = 24;
        const fit = Math.min(maxW / a.w, maxH / a.h);
        const k = fit >= 1 ? Math.floor(fit) : fit;
        const dw = Math.round(a.w * k);
        const dh = Math.round(a.h * k);
        ctx.save();
        ctx.imageSmoothingEnabled = k < 1;
        ctx.drawImage(a.img, Math.round(w.cx - dw / 2), Math.round(w.baseY - 8 - dh) + slide, dw, dh);
        ctx.restore();
        return;
      }
      const s = wallSprites(this.art, "sign", w.variant, 0, w.seed);
      if (!s) return;
      const o = wallItemOrigin(w, s.base);
      ctx.drawImage(s.base.canvas, o.x, o.y + slide);
    }
    /** Retângulo (px de mundo) da área de texto da placa de uma área, se houver. */
    signRect(vis) {
      if (!vis.sign) return null;
      if (!vis.room && this.assets?.signage && vis.id === "core:recepcao") return null;
      const s = wallSprites(this.art, "sign", vis.sign.variant, 0, vis.sign.seed);
      if (!s) return null;
      const o = wallItemOrigin(vis.sign, s.base);
      const r = s.base.rects?.sign ?? (() => {
        const b = opaqueBounds(s.base.canvas);
        return { x: b.x + 3, y: b.y + 3, w: b.w - 6, h: b.h - 6 };
      })();
      return { x: o.x + r.x, y: o.y + r.y, w: r.w, h: r.h };
    }
    /**
     * Retângulo (px de mundo) do quadro (`painting`) da parede de uma área, pintado junto com as paredes: a cena Visita
     * põe o quadro de carimbos da portaria em cima do da recepção.
     */
    paintingRect(areaId) {
      const vis = this.areas.get(areaId);
      const it = vis?.layout.wallItems.find((x) => x.kind === "painting");
      if (!vis || !it) return null;
      const w = toWallVis(it, vis.id);
      const s = wallSprites(this.art, "painting", it.variant === "wide" ? void 0 : it.variant, 0, w.seed);
      if (!s) return null;
      const o = wallItemOrigin(w, s.base);
      const b = opaqueBounds(s.base.canvas);
      return { x: o.x + b.x, y: o.y + b.y, w: b.w, h: b.h };
    }
    /** Luminância média da área de texto da placa (para escolher a cor do texto). */
    signIsDark(vis) {
      const s = vis.sign ? wallSprites(this.art, "sign", vis.sign.variant, 0, vis.sign.seed) : null;
      if (!s) return false;
      const c = s.base.canvas;
      if (c.__dark !== void 0) return c.__dark;
      let dark = false;
      try {
        const r = s.base.rects?.sign ?? { x: 2, y: 2, w: c.width - 4, h: c.height - 4 };
        const d = c.getContext("2d").getImageData(r.x, r.y, Math.max(1, r.w), Math.max(1, r.h)).data;
        let sum = 0;
        let n = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 128) continue;
          sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
          n++;
        }
        dark = n > 0 && sum / n < 120;
      } catch {
        dark = false;
      }
      c.__dark = dark;
      return dark;
    }
    // =================================================================== entidades
    furnState(f, now) {
      if (f.kind === "coffee_machine") return (this.sim.machineUntil.get(f.id) ?? 0) > now ? 1 : 0;
      if (f.kind === "toilet_stall") return this.sim.stallBusy.has(f.id) ? 1 : 0;
      return 0;
    }
    drawFurniture(f, area, scale, front, now) {
      const { ctx } = this;
      const state = this.furnState(f, now);
      const fs = furnitureSprites2(this.art, f, state);
      if (!fs) return;
      const s = front ? fs.front : seasonalFurniture(this.theme, f.kind, area.layout, f.seed) ?? fs.base;
      if (!s) return;
      const dx = Math.round(f.ax - s.ax);
      const dy = Math.round(f.ay - s.ay);
      const scaled = scale !== 1;
      if (scaled) {
        ctx.save();
        ctx.translate(f.ax, f.ay);
        ctx.scale(scale, scale);
        ctx.translate(-f.ax, -f.ay);
      }
      ctx.drawImage(s.canvas, dx, dy);
      if (!front) {
        if (f.kind === "desk" && s.rects?.screen) {
          const r = s.rects.screen;
          const mode = this.deskScreen(f, area);
          this.safe(() => this.art.drawScreen(ctx, { x: dx + r.x, y: dy + r.y, w: r.w, h: r.h }, mode, now, f.seed));
        } else if (f.kind === "coffee_machine" && state === 1) {
          this.drawSteam(f.ax, dy + 2, now, f.seed);
        } else if (f.kind === "arcade" && s.rects?.screen) {
          const seed = this.sim.social.arcadeSeed();
          const r = s.rects.screen;
          if (seed !== null) this.safe(() => this.art.drawScreen(ctx, { x: dx + r.x, y: dy + r.y, w: r.w, h: r.h }, "game", now, seed));
        }
      }
      if (scaled) ctx.restore();
    }
    /** Tela do monitor: segue a atividade de quem senta ali. */
    deskScreen(f, area) {
      const room = area.room;
      if (room && room.light(this.sim.now) < 0.3) return "off";
      const owner = f.seatSpot ? this.sim.spots.ownerOf(f.seatSpot) : void 0;
      const ch = owner ? this.sim.chars.get(owner) : void 0;
      if (!ch || ch.leaving) return "off";
      const seated = ch.atSpot === f.seatSpot;
      if (ch.mode === "wait") return "alert";
      if (!seated) return "idle";
      if (ch.mode === "work") return screenModeFor(ch.info.activity?.kind);
      if (ch.mode === "shell") return "progress";
      return "idle";
    }
    drawSteam(x, y, now, seed) {
      const { ctx } = this;
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 3; i++) {
        const ph = ((now / 900 + i / 3 + seed % 7 / 7) % 1 + 1) % 1;
        ctx.globalAlpha = 0.75 * (1 - ph);
        const sx = Math.round(x - 1 + Math.sin(ph * 6 + i * 2) * 1.5 + (i - 1));
        const sy = Math.round(y - ph * 9);
        ctx.fillRect(sx, sy, 1, 2);
      }
      ctx.globalAlpha = 1;
    }
    drawCharacter(ch, now, sel) {
      const { ctx } = this;
      const head = this.headOf(ch);
      const x = Math.round(ch.x + ch.offX);
      const y = Math.round(ch.y + ch.offY);
      ctx.globalAlpha = ch.alpha;
      if (ch.mode === "wait") this.drawAlertRing(x, y, now);
      if (sel.agent === ch.id) this.drawRing(x, y, "#7fe3ff", now, true);
      else if (sel.hover === ch.id) this.drawRing(x, y, "#ffffff", now, false);
      if (!ch.seated) {
        const sh = shadowSprite();
        ctx.drawImage(sh.canvas, x - sh.ax, y - sh.ay);
      }
      const officeActor = drawOpenBotActor(ctx, ch, x, y);
      if (officeActor) {
        head.bx = officeActor.bx;
        head.by = officeActor.by;
        head.bw = officeActor.bw;
        head.bh = officeActor.bh;
        head.y = officeActor.y;
      } else {
        let sprite3 = null;
        const req = this.req;
        req.appearance = ch.appearance;
        req.dir = ch.dir;
        req.pose = ch.pose;
        req.held = ch.held;
        req.seated = ch.seated;
        req.costume = seasonalCostume(this.theme, ch.info.seed);
        try {
          sprite3 = this.charSprite(req, ch.animT);
        } catch {
          sprite3 = null;
        }
        if (!sprite3 && (req.pose === "wait" || req.held === "popcorn")) {
          req.pose = req.pose === "wait" ? "sit" : req.pose;
          req.held = "none";
          try {
            sprite3 = this.charSprite(req, ch.animT);
          } catch {
            sprite3 = null;
          }
        }
        if (sprite3) {
          const sx = x - sprite3.ax;
          const sy = y - sprite3.ay;
          ctx.drawImage(sprite3.canvas, sx, sy);
          const b = opaqueBounds(sprite3.canvas);
          head.bx = sx + b.x;
          head.by = sy + b.y;
          head.bw = b.w;
          head.bh = b.h;
          head.y = sy + b.y;
        } else {
          head.bx = x - 7;
          head.by = y - 26;
          head.bw = 14;
          head.bh = 26;
          head.y = y - 26;
        }
      }
      ctx.globalAlpha = 1;
      head.x = x;
      head.feetY = y;
      head.visible = true;
      head.depth = ch.depth();
      let name = ch.mode === "wait" ? "alert" : ch.icon;
      const shell = ch.mode === "shell" && ch.shellSince > 0 && !ch.leaving;
      let badge = 0;
      if (shell && (!name || name === "zzz")) {
        name = hourglassIcon(now);
        badge = ch.shellCount;
      }
      if (name) {
        const bounce2 = name === "alert" ? Math.round(Math.abs(Math.sin(now / 180)) * 4) : name === "zzz" ? Math.round(Math.sin(now / 500) * 1.5) : name === "hourglass" || name === "hourglass_flip" ? now % HOURGLASS_FLIP_MS < 110 ? 1 : 0 : Math.round(Math.max(0, 1 - (now - ch.iconAt) / 250) * 4);
        const lift = name === "storm" ? STORM_LIFT : 0;
        this.pushIcon(x, head.y - 2 - lift, name, bounce2, ch.alpha, badge);
        if (name === "storm" && Math.random() < this.dt * 24) this.particles.rain(x - 3 + Math.floor(Math.random() * 7), head.y - 3 - lift, lift + 1);
      }
      if (shell && ch.shellStage === "nap" && ch.pose === "sleep") {
        this.pushIcon(x + 10, head.y - 13, "zzz", Math.round(Math.sin(now / 500) * 1.5), ch.alpha, 0);
      }
      if (shell && ch.pose === "wait" && ch.held === "popcorn" && sprite && now >= ch.popcornAt) {
        ch.popcornAt = now + 450 + Math.random() * 1200;
        const px = x - 1 + (POPCORN_DX[ch.dir] ?? 0);
        const py = y - 1 - (POPCORN_DY[ch.dir] ?? 10);
        this.particles.popcorn(px, py);
        if (Math.random() < 0.3) this.particles.popcorn(px, py);
      }
    }
    pushIcon(x, y, name, bounce2, alpha, badge) {
      if (this.iconCount >= 256) return;
      let ic = this.icons[this.iconCount];
      if (!ic) this.icons[this.iconCount] = ic = { x: 0, y: 0, name, bounce: 0, alpha: 1, badge: 0 };
      ic.x = x;
      ic.y = y;
      ic.name = name;
      ic.bounce = bounce2;
      ic.alpha = alpha;
      ic.badge = badge;
      this.iconCount++;
    }
    /** Sprite do personagem no frame da animação (tolera arte sem a pose: contagem/duração inválidas). */
    charSprite(req, animT) {
      const { art: art2 } = this;
      const count = Math.max(1, art2.poseFrameCount(req.pose) || 1);
      const dur = Math.max(30, art2.poseFrameDuration(req.pose) || 500);
      req.frame = Math.floor(animT / dur) % count;
      return art2.characterSprite(req);
    }
    /**
     * Teia de aranha no canto do personagem que espera um shell há mais de 10 min (escala inteira:
     * 1x, depois 2x com 20 min). Cochilando, fica coberto: uma teia de cada lado. A teia vai para o
     * lado sem vizinho; com vizinhos dos dois lados, cobre mais o próprio personagem (não invade a
     * mesa ao lado).
     */
    drawCobwebs(now) {
      if (this.sim.visit) return;
      const { ctx } = this;
      for (const ch of this.sim.chars.values()) {
        if (ch.mode !== "shell" || !ch.shellSince || ch.leaving || !ch.seated || ch.atSpot !== ch.homeSpot) continue;
        const scale = cobwebScale(now - ch.shellSince);
        if (!scale) continue;
        const head = this.heads.get(ch.id);
        if (!head || !head.visible) continue;
        const web = this.icon("cobweb");
        if (!web) return;
        let left = (ch.info.seed & 1) === 0;
        const busyL = this.neighborAt(head, -1);
        const busyR = this.neighborAt(head, 1);
        if (left ? busyL && !busyR : busyR && !busyL) left = !left;
        ctx.globalAlpha = ch.alpha;
        this.drawWeb(web, head, left, scale, left ? busyL : busyR);
        if (ch.shellStage === "nap") this.drawWeb(web, head, !left, 1, left ? busyR : busyL);
      }
      ctx.globalAlpha = 1;
    }
    /** Alguém visível logo ao lado (mesma fileira, até ~2 mesas) no lado `side` (-1 esquerda, 1 direita)? */
    neighborAt(head, side) {
      for (const h of this.heads.values()) {
        if (h === head || !h.visible || Math.abs(h.feetY - head.feetY) > 10) continue;
        const dx = (h.x - head.x) * side;
        if (dx > 0 && dx < 2.2 * TILE) return true;
      }
      return false;
    }
    /**
     * Uma teia presa no ombro (o canto da teia, em cima, fica para fora do corpo; espelhada do lado
     * direito). Com vizinho do lado, no máximo WEB_MAX_OUT px para fora: o resto cobre o personagem.
     */
    drawWeb(web, head, left, scale, crowded) {
      const { ctx } = this;
      const w = web.canvas.width * scale;
      const h = web.canvas.height * scale;
      const out = crowded ? Math.min(w - 3 * scale, WEB_MAX_OUT) : w - 3 * scale;
      const y = Math.round(head.by + 2);
      if (left) {
        ctx.drawImage(web.canvas, Math.round(head.bx - out), y, w, h);
        return;
      }
      const x = Math.round(head.bx + head.bw + out - w);
      ctx.save();
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(web.canvas, 0, 0, w, h);
      ctx.restore();
    }
    /**
     * Efeitos pedidos pela simulação: confete (shell concluído) sobre quem comemora, moedinhas voando de
     * quem perdeu a aposta para quem ganhou e o brilho de quem se arrumou no espelho.
     */
    drainEffects(now) {
      const fx = this.sim.effects;
      for (let i = 0; i < fx.length; i++) {
        const e = fx[i];
        const head = this.heads.get(e.charId);
        if (!head || !head.visible || now - e.at > 1500) continue;
        if (e.kind === "confetti") this.particles.confetti(head.x, head.y - 4);
        else if (e.kind === "sparkle") this.particles.sparkle(head.x, head.y + 4);
        else if (e.kind === "coins") {
          const to = this.heads.get(e.toId);
          if (to && to.visible) this.particles.coins(head.x, head.y + 2, to.x, to.y + 2);
        }
      }
      fx.length = 0;
    }
    reflectReq = {
      appearance: void 0,
      dir: "down",
      pose: "stand",
      frame: 0,
      held: "none",
      seated: false
    };
    /**
     * Reflexo no espelho do banheiro: quem está em pé diante da pia, virado para o espelho, aparece de
     * frente no vidro (rosto centrado, meio transparente, com o véu azulado do vidro por cima).
     */
    drawReflection(w, gx, gy, gw, gh) {
      const { ctx } = this;
      for (const ch of this.sim.chars.values()) {
        if (ch.inside || ch.alpha < 0.5 || ch.dir !== "up" || ch.seated) continue;
        if (Math.abs(ch.x - w.cx) > 5) continue;
        const dy = ch.y - w.baseY;
        if (dy < 14 || dy > 30) continue;
        const req = this.reflectReq;
        req.appearance = ch.appearance;
        req.pose = ch.pose === "groom" ? "groom" : "stand";
        req.held = ch.pose === "groom" ? ch.held : "none";
        req.seated = false;
        req.costume = seasonalCostume(this.theme, ch.info.seed);
        let s;
        try {
          s = this.charSprite(req, ch.animT);
        } catch {
          return;
        }
        ctx.save();
        ctx.beginPath();
        ctx.rect(gx, gy, gw, gh);
        ctx.clip();
        ctx.globalAlpha = 0.8 * ch.alpha;
        ctx.drawImage(s.canvas, Math.round(gx + gw / 2 - s.ax), Math.round(gy - 6));
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = "#cfe6f2";
        ctx.fillRect(gx, gy, gw, gh);
        ctx.restore();
        return;
      }
    }
    req = {
      appearance: void 0,
      dir: "down",
      pose: "stand",
      frame: 0,
      held: "none",
      seated: false
    };
    drawRing(x, y, color, now, pulse) {
      const { ctx } = this;
      const k = pulse ? 1 + Math.sin(now / 220) * 0.08 : 1;
      ctx.save();
      ctx.globalAlpha *= pulse ? 0.95 : 0.6;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x, y, 8 * k, 3.5 * k, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    drawAlertRing(x, y, now) {
      const { ctx } = this;
      const ph = now % 1100 / 1100;
      ctx.save();
      ctx.strokeStyle = "#ffb11f";
      ctx.lineWidth = 1.5;
      ctx.globalAlpha *= 0.9 * (1 - ph);
      ctx.beginPath();
      ctx.ellipse(x, y, 6 + ph * 12, 2.5 + ph * 5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    drawProp(prop2, alpha) {
      if (prop2.kind === "paving") {
        const c = this.pavingCanvas(prop2);
        if (alpha < 1) this.ctx.globalAlpha = alpha;
        this.ctx.drawImage(c, prop2.x, prop2.y);
        this.ctx.globalAlpha = 1;
        return;
      }
      const s = propSprite(prop2);
      if (alpha < 1) this.ctx.globalAlpha = alpha;
      this.ctx.drawImage(s.canvas, Math.round(prop2.x - s.ax), Math.round(prop2.y - s.ay));
      this.ctx.globalAlpha = 1;
    }
    pavings = /* @__PURE__ */ new Map();
    /** Trecho de calçada (2x2 tiles) com o mesmo desenho da calçada vizinha (coordenadas de mundo). */
    pavingCanvas(prop2) {
      const key = `${prop2.x},${prop2.y}`;
      let c = this.pavings.get(key);
      if (c) return c;
      c = document.createElement("canvas");
      c.width = 2 * TILE;
      c.height = 2 * TILE;
      const ctx = c.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.translate(-prop2.x, -prop2.y);
      this.safe(() => this.art.drawFloor(ctx, "sidewalk", prop2.x, prop2.y, 2 * TILE, 2 * TILE, { seed: prop2.seed }));
      this.pavings.set(key, c);
      return c;
    }
    drawCar(car) {
      const s = carSprite(car.variant, car.dir < 0);
      this.ctx.drawImage(s.canvas, Math.round(car.x - s.ax), Math.round(car.y - s.ay));
    }
    updateCars(now, dt) {
      const b = this.exterior.bounds;
      const x0 = b.x * TILE - 40;
      const x1 = (b.x + b.w) * TILE + 40;
      if (now >= this.nextCarAt) {
        this.nextCarAt = now + 4e3 + Math.random() * 9e3;
        const lane = this.exterior.lanes[Math.floor(Math.random() * this.exterior.lanes.length)];
        if (lane) this.cars.push({ x: lane.dir > 0 ? x0 : x1, y: lane.y, dir: lane.dir, speed: 38 + Math.random() * 30, variant: Math.floor(Math.random() * 6) });
      }
      for (const c of this.cars) c.x += c.dir * c.speed * Math.min(dt, 0.1);
      if (this.cars.length) this.cars = this.cars.filter((c) => c.x >= x0 - 10 && c.x <= x1 + 10);
    }
    drawPingPong(now) {
      const { ctx } = this;
      for (const g of this.sim.social.gatherings) {
        if (g.kind !== "pingpong" || g.phase !== "run") continue;
        let a;
        let b;
        for (const m of g.members) {
          if (m.role !== "player" || m.left) continue;
          if (!a) a = this.sim.chars.get(m.id);
          else b = this.sim.chars.get(m.id);
        }
        if (!a || !b) continue;
        const left = a.x < b.x ? a : b;
        const right = a.x < b.x ? b : a;
        const period = 1100;
        const ph = (now - g.startAt) % (period * 2) / period;
        const u = ph < 1 ? ph : 2 - ph;
        const x = left.x + 9 + (right.x - left.x - 18) * u;
        const baseY = (left.y + right.y) / 2 - 9;
        const arc = Math.sin(Math.PI * (u * 2 % 1)) * 6;
        ctx.fillStyle = "rgba(30,40,60,0.35)";
        ctx.fillRect(Math.round(x) - 1, Math.round(baseY) + 1, 2, 1);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(Math.round(x) - 1, Math.round(baseY - arc) - 1, 2, 2);
      }
    }
    icon(name) {
      try {
        const s = this.art.iconSprite(name);
        if (s && s.canvas.width > 0) return s;
      } catch {
      }
      return fallbackIcon(name);
    }
    // =================================================================== luz
    /**
     * Luz: o mapa do ciclo dia/noite (exterior, interiores e halos; nada de dia), a sombra das salas
     * com a luz apagada (e a transição de acender/apagar) e os brilhos por cima.
     */
    drawLighting(now, vx0, vy0, vx1, vy1) {
      const { ctx } = this;
      const view = { x0: vx0, y0: vy0, x1: vx1, y1: vy1 };
      this.lighting.drawAmbient(ctx, this, view, now, this.dt);
      const n = this.night;
      for (const vis of this.areas.values()) {
        const room = vis.room;
        if (!room || !vis.layout.shade) continue;
        const light = room.light(now);
        const strength = (room.phase === "building" ? 0.5 : 0.74) + 0.1 * n;
        const cover = room.phase === "building" || room.phase === "dismantling" ? buildAnim(room.phase, room.progress(now)).floor : 1;
        const dark = (1 - light) * strength * cover;
        if (dark <= 0.01) continue;
        const s = vis.layout.shade;
        ctx.fillStyle = `rgba(8,12,36,${dark})`;
        ctx.fillRect(s.x, s.y, s.w, s.h);
      }
      this.lighting.drawGlows(ctx, this, view, now);
    }
    safe(fn) {
      try {
        fn();
      } catch {
      }
    }
  };

  // vendor/habblaud/upstream/client/src/world/path/grid.ts
  var BLOCKED = 0;
  var FREE = 1;
  var SEAT = 2;
  var WalkGrid = class {
    constructor(w, h, version = 0) {
      this.w = w;
      this.h = h;
      this.version = version;
      this.cells = new Uint8Array(w * h);
    }
    cells;
    inside(x, y) {
      return x >= 0 && y >= 0 && x < this.w && y < this.h;
    }
    get(x, y) {
      return this.inside(x, y) ? this.cells[y * this.w + x] : BLOCKED;
    }
    set(x, y, v) {
      if (this.inside(x, y)) this.cells[y * this.w + x] = v;
    }
    walkable(x, y) {
      return this.get(x, y) !== BLOCKED;
    }
    fill(x, y, w, h, v) {
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, v);
    }
    /** Tile caminhável mais próximo (busca em anel), ou null. */
    nearestWalkable(x, y, maxR = 12) {
      if (this.walkable(x, y)) return { x, y };
      for (let r = 1; r <= maxR; r++) {
        let best = null;
        let bestD = Infinity;
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
            if (!this.walkable(x + dx, y + dy)) continue;
            const d = dx * dx + dy * dy;
            if (d < bestD) {
              bestD = d;
              best = { x: x + dx, y: y + dy };
            }
          }
        }
        if (best) return best;
      }
      return null;
    }
    /** BFS: conjunto de índices alcançáveis a partir de (x, y). */
    reachableFrom(x, y) {
      const seen = new Uint8Array(this.w * this.h);
      if (!this.walkable(x, y)) return seen;
      const queue = new Int32Array(this.w * this.h);
      let head = 0;
      let tail = 0;
      queue[tail++] = y * this.w + x;
      seen[y * this.w + x] = 1;
      while (head < tail) {
        const i = queue[head++];
        const cx = i % this.w;
        const cy = (i - cx) / this.w;
        for (let k = 0; k < 4; k++) {
          const nx = cx + (k === 0 ? 1 : k === 1 ? -1 : 0);
          const ny = cy + (k === 2 ? 1 : k === 3 ? -1 : 0);
          if (!this.walkable(nx, ny)) continue;
          const j = ny * this.w + nx;
          if (seen[j]) continue;
          seen[j] = 1;
          queue[tail++] = j;
        }
      }
      return seen;
    }
  };

  // vendor/habblaud/upstream/client/src/world/layout/corridor.ts
  var CORRIDOR_ID = "core:corredor";
  var TALL = ["ficus", "palm", "monstera", "bonsai"];
  var SMALL = ["fern", "succulent", "flower"];
  var RUNNERS = ["#8b9bb0", "#8597ab", "#909fb3"];
  function layoutCorridor(cols) {
    const w = cols * COL_W;
    const b = new AreaBuilder(CORRIDOR_ID, "corridor", { x: 0, y: CORRIDOR_Y, w, h: CORRIDOR_H });
    b.floor("concrete", 0, 0, w, CORRIDOR_H, 501);
    for (let ly = 0; ly < CORRIDOR_H; ly++) {
      b.furn("glass_partition", 0, ly, ly === 0 || ly === CORRIDOR_H - 1 ? "end" : "v", { order: 0.1 });
      b.furn("glass_partition", w - 1, ly, ly === 0 || ly === CORRIDOR_H - 1 ? "end" : "v", { order: 0.1 });
    }
    b.walk(1, 0, w - 2, CORRIDOR_H);
    for (let c = 0; c < cols; c++) {
      const x = c * COL_W;
      const last = c === cols - 1;
      if (c === 0) {
        b.furn("plant_tall", x + 2, 4, "palm", { order: 0.5 });
        b.furn("plant_small", x + 13, 4, "flower", { order: 0.5 });
      } else if (c === 1) {
        const bench2 = b.furn("bench", x + 2, 0, void 0, { order: 0.5 });
        for (let i = 0; i < 2; i++) b.seat("bench", "bench", x + 2 + i, 0, "down", void 0, { noFurniture: true, furnitureId: bench2 });
        b.furn("plant_tall", x + 13, 0, "monstera", { order: 0.5 });
      } else {
        const k = c - CORE_COLS;
        if (k % 2 === 0) {
          b.furn("water_cooler", x + 3, 0, void 0, { order: 0.5 });
          b.spot("water", x + 3, 1, "up", { dy: -3 });
          b.furn("plant_small", x + 4, 0, SMALL[k % SMALL.length], { order: 0.5 });
        } else {
          const bench2 = b.furn("bench", x + 11, 0, void 0, { order: 0.5 });
          for (let i = 0; i < 2; i++) b.seat("bench", "bench", x + 11 + i, 0, "down", void 0, { noFurniture: true, furnitureId: bench2 });
          b.furn("plant_tall", x + 13, 0, TALL[k % TALL.length], { order: 0.5 });
        }
        if (k % 2 === 1) b.furn("plant_small", x + 12, 4, SMALL[(k + 1) % SMALL.length], { order: 0.5 });
      }
      if (!last && c % 2 === 1) b.furn("plant_tall", x + 15, 4, TALL[(c + 1) % TALL.length], { order: 0.5 });
      b.rug(x + 2, 1.95, COL_W - 4, 1.1, RUNNERS[c % RUNNERS.length], 502 + c);
      b.spot("talk", x + 5, 2, "right", { group: `talk:corredor:${c}`, dx: -1 });
      b.spot("talk", x + 6, 2, "left", { group: `talk:corredor:${c}`, dx: 1 });
    }
    return b.build();
  }

  // vendor/habblaud/upstream/client/src/world/layout/building.ts
  var coreCache = null;
  function coreAreas() {
    return coreCache ??= [layoutReception(), layoutRestroom(), layoutCafe(), layoutLounge()];
  }
  function paintArea(grid, area) {
    for (const r of area.walkable) grid.fill(r.x, r.y, r.w, r.h, FREE);
    for (const r of area.blocked ?? []) grid.fill(r.x, r.y, r.w, r.h, BLOCKED);
    for (const f of area.furniture) {
      const def = FURNITURE[f.kind];
      if (def.mount !== "floor") continue;
      const { w, h } = def.footprint;
      if (furnitureBlocks(f.kind)) grid.fill(f.tx, f.ty, w, h, BLOCKED);
      else if (furnitureIsSeat(f.kind)) {
        for (let y = f.ty; y < f.ty + h; y++) for (let x = f.tx; x < f.tx + w; x++) if (grid.get(x, y) === FREE) grid.set(x, y, SEAT);
      }
    }
  }
  function buildWalkGrid(cols, areas, version = 0) {
    const grid = new WalkGrid(cols * COL_W, BUILDING_H, version);
    for (const a of areas) paintArea(grid, a);
    return grid;
  }
  function assembleBuilding(cols, rooms, version = 0) {
    const core = coreAreas();
    const corridor = layoutCorridor(cols);
    const all = [...core, corridor, ...rooms];
    const grid = buildWalkGrid(cols, all, version);
    const spots = [];
    for (const a of all) spots.push(...a.spots);
    return { cols, rect: buildingRect(cols), core, corridor, rooms: [...rooms], grid, spots };
  }

  // vendor/habblaud/upstream/client/src/world/layout/room.ts
  var PLANTS_TALL = ["palm", "ficus", "monstera", "bonsai"];
  var PLANTS_SMALL = ["fern", "succulent", "flower"];
  var POSTERS = ["code", "coffee", "rocket", "cat", "bug", "ship_it"];
  var BEANBAGS = ["red", "blue", "yellow", "green"];
  function shade2(hex3, amount) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex3.trim());
    if (!m) return hex3;
    const n = parseInt(m[1], 16);
    const ch = (v) => Math.max(0, Math.min(255, Math.round(v + (amount > 0 ? (255 - v) * amount : v * amount))));
    const r = ch(n >> 16 & 255);
    const g = ch(n >> 8 & 255);
    const b = ch(n & 255);
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
  }
  function roomVariant(seed) {
    const rng = mulberry32((seed ^ 31249) >>> 0);
    const mirror2 = rng() < 0.5;
    const m = rng();
    const meeting = m < 0.45 ? "table" : m < 0.78 ? "round" : "lounge";
    const lefts = ["rest", "print", "green"];
    const rights = ["standdesk", "stands", "green"];
    const left = lefts[Math.floor(rng() * lefts.length) % lefts.length];
    let right = rights[Math.floor(rng() * rights.length) % rights.length];
    if (right === left) right = "stands";
    return { mirror: mirror2, meeting, left, right };
  }
  function layoutProjectRoom(room, theme) {
    const rect = slotRect(room.slot);
    const side = slotSide(room.slot);
    const rng = mulberry32(room.seed ^ 24301);
    const pick3 = (arr) => arr[Math.floor(rng() * arr.length) % arr.length];
    const v = roomVariant(room.seed);
    const b = new AreaBuilder(room.id, "room", rect);
    const area = b.area;
    area.side = side;
    const wall = theme.wall;
    const north = side === "north";
    const door = { lx: DOOR_X, w: DOOR_W };
    const mir = v.mirror;
    const fx = (lx, w = 1) => mir ? 16 - lx - w : lx;
    const fdir = (d) => mir && (d === "left" || d === "right") ? d === "left" ? "right" : "left" : d;
    const fdx = (dx) => dx === void 0 ? void 0 : mir ? -dx : dx;
    const furn = (kind, lx, ly, variant, o = {}) => b.furn(kind, fx(lx, FURNITURE[kind].footprint.w), ly, variant, { ...o, dx: fdx(o.dx) });
    const spot = (kind, lx, ly, dir, o = {}) => b.spot(kind, fx(lx), ly, fdir(dir), { ...o, dx: fdx(o.dx) });
    const seat = (kind, fk, lx, ly, dir, variant, o = {}, dirVariant = false) => b.seat(kind, fk, fx(lx), ly, fdir(dir), dirVariant ? fdir(dir) : variant, { ...o, dx: fdx(o.dx) });
    const wallItem = (kind, cx, variant, o = {}) => b.wall(kind, mir ? 16 - cx : cx, variant, o);
    const rug = (lx, ly, w, h, color, seed) => b.rug(fx(lx, w), ly, w, h, color, seed);
    b.floor("marble", 0, 0, 16, 12, room.seed);
    area.floorTint = theme.carpet;
    rug(1.5, 3.25, 7, 5.5, theme.carpet, room.seed);
    rug(DOOR_X - 0.25, north ? 9.5 : 2, DOOR_W + 0.5, 1.25, shade2(theme.carpet2, -0.1), room.seed + 1);
    if (north) {
      b.face(0.5, 15, wall);
      b.south(0.5, 15, 11, wall, [door]);
    } else {
      b.face(0.5, 15, wall, [door]);
      b.south(0.5, 15, 11, { ...wall, exterior: true });
      b.wall("door_frame", DOOR_X + DOOR_W / 2, void 0, { order: 0.05 });
    }
    b.cap(0, 0, 0.5, 12, wall);
    b.cap(15.5, 0, 0.5, 12, wall);
    b.walk(1, 2, 14, 9);
    area.door = north ? { x: rect.x + DOOR_X, y: rect.y + 11, w: DOOR_W, h: 1 } : { x: rect.x + DOOR_X, y: rect.y, w: DOOR_W, h: 2 };
    b.walk(area.door.x - rect.x, area.door.y - rect.y, area.door.w, area.door.h);
    const signCx = north ? 8 : 10.5;
    area.signId = wallItem("sign", signCx, void 0, { order: 0.95 });
    if (north) {
      wallItem("whiteboard", 4.5, void 0, { order: 0.6 });
      wallItem("clock", 10, void 0, { order: 0.7 });
      wallItem("poster", 11.1, pick3(POSTERS), { order: 0.5 });
      wallItem("window", 12.75, void 0, { order: 0.4 });
      wallItem("light_switch", DOOR_X - 0.5, "on", { ly: 12, on: "south", order: 0.8 });
      spot("switch", DOOR_X - 1, 10, "down", { dy: -1 });
    } else {
      wallItem("whiteboard", 2.5, void 0, { order: 0.6 });
      wallItem("light_switch", DOOR_X - 0.5, "on", { order: 0.8 });
      wallItem("clock", 12.3, void 0, { order: 0.7 });
      wallItem("poster", 13.35, pick3(POSTERS), { order: 0.5 });
      spot("switch", DOOR_X - 1, 2, "up", { dy: -3 });
    }
    spot("whiteboard", north ? 4 : 2, 2, "up", { dx: 8, dy: 2 });
    const deskV = theme.deskVariant;
    const chairV = theme.chairVariant;
    const ranks = [2, 0, 4];
    for (let i = 0; i < 3; i++) {
      const lx = 2 + i * 2;
      const back = furn("desk_back", lx, 5, deskV, { order: 0.35 + i * 0.05, seat: `N${i}` });
      const front = furn("desk", lx, 6, deskV, { order: 0.4 + i * 0.05, seat: `S${i}` });
      seat("desk", "office_chair_front", lx, 4, "down", chairV, { dx: TILE / 2, deskId: back, rank: ranks[i] + 1, side: "N", order: 0.55 + i * 0.03 });
      seat("desk", "office_chair", lx, 7, "up", chairV, { dx: TILE / 2, deskId: front, rank: ranks[i], side: "S", order: 0.6 + i * 0.03 });
    }
    furn("trash_bin", 9, 6, void 0, { order: 0.7 });
    if (v.meeting === "table") {
      furn("meeting_table", 10, 5, void 0, { order: 0.45 });
      seat("stool", "stool", 10, 4, "down", void 0, { order: 0.65 });
      seat("stool", "stool", 12, 4, "down", void 0, { order: 0.66 });
      seat("stool", "stool", 10, 7, "up", void 0, { order: 0.67 });
      seat("stool", "stool", 12, 7, "up", void 0, { order: 0.68 });
    } else if (v.meeting === "round") {
      furn("cafe_table", 11, 4, void 0, { order: 0.45 });
      seat("stool", "stool", 10, 4, "right", void 0, { order: 0.65 });
      seat("stool", "stool", 12, 4, "left", void 0, { order: 0.66 });
      furn("cafe_table", 11, 7, void 0, { order: 0.46 });
      seat("stool", "stool", 10, 7, "right", void 0, { order: 0.67 });
      seat("stool", "stool", 12, 7, "left", void 0, { order: 0.68 });
      furn("plant_small", 12, 5, pick3(PLANTS_SMALL), { order: 0.47 });
    } else {
      rug(9.6, 3.7, 4.8, 4.6, shade2(theme.carpet2, 0.25), room.seed + 2);
      furn("coffee_table", 10, 5, void 0, { order: 0.45 });
      seat("nook", "armchair", 9, 5, "right", void 0, { order: 0.65 }, true);
      seat("nook", "armchair", 12, 5, "left", void 0, { order: 0.66 }, true);
      seat("nook", "beanbag", 10, 7, "up", pick3(BEANBAGS), { order: 0.67 });
      seat("nook", "beanbag", 11, 7, "up", pick3(BEANBAGS), { order: 0.68 });
      seat("nook", "beanbag", 11, 3, "down", pick3(BEANBAGS), { order: 0.69 });
    }
    const tall = pick3(PLANTS_TALL);
    const shelfX = north ? 1 : 4;
    furn("bookshelf", shelfX, 2, void 0, { order: 0.25 });
    spot("shelf", shelfX, 3, "up", { dx: 8, dy: -2 });
    furn("plant_tall", 14, 2, tall, { order: 0.2 });
    if (north) spot("window", 12, 2, "up", { dx: 12, dy: 1 });
    else furn("plant_small", 1, 2, pick3(PLANTS_SMALL), { order: 0.22 });
    const column = Math.floor(rng() * 3);
    if (column === 0) {
      furn("binder_shelf", 14, 4, void 0, { order: 0.3 });
      furn("printer", 14, 6, void 0, { order: 0.32 });
      furn("floor_lamp", 14, 8, void 0, { order: 0.34 });
    } else if (column === 1) {
      furn("binder_shelf", 14, 4, void 0, { order: 0.3 });
      furn("binder_shelf", 14, 5, void 0, { order: 0.31 });
      furn("floor_lamp", 14, 8, void 0, { order: 0.34 });
    } else {
      furn("floor_lamp", 14, 4, void 0, { order: 0.3 });
      furn("filing_cabinet", 14, 6, void 0, { order: 0.32 });
      furn("plant_tall", 14, 8, pick3(PLANTS_TALL), { order: 0.34 });
    }
    corner(v.left, "left");
    corner(v.right, "right");
    function corner(style, where) {
      const x0 = where === "left" ? 1 : 10;
      const o = 0.2 + (where === "left" ? 0 : 0.05);
      switch (style) {
        case "rest": {
          rug(x0 + 0.5, 8.85, 4, 2, shade2(theme.carpet, 0.35), room.seed + 3);
          seat("nook", "beanbag", x0 + 1, 10, "up", pick3(BEANBAGS), { order: o + 0.4 });
          seat("nook", "beanbag", x0 + 3, 10, "up", pick3(BEANBAGS), { order: o + 0.41 });
          furn("plant_small", x0 + 2, 10, pick3(PLANTS_SMALL), { order: o });
          furn("plant_tall", where === "left" ? x0 : x0 + 4, 10, pick3(PLANTS_TALL), { order: o + 0.01 });
          return;
        }
        case "print": {
          furn("printer", x0, 10, void 0, { order: o });
          furn("binder_shelf", x0 + 1, 10, void 0, { order: o + 0.01 });
          furn("binder_shelf", x0 + 2, 10, void 0, { order: o + 0.02 });
          furn("filing_cabinet", x0 + 3, 10, void 0, { order: o + 0.03 });
          furn("trash_bin", x0 + 4, 10, void 0, { order: o + 0.04 });
          return;
        }
        case "green": {
          furn("plant_tall", x0, 10, pick3(PLANTS_TALL), { order: o });
          furn("floor_lamp", x0 + 1, 10, void 0, { order: o + 0.01 });
          seat("nook", "armchair", x0 + 2, 10, "up", void 0, { order: o + 0.4 }, true);
          furn("plant_small", x0 + 3, 10, pick3(PLANTS_SMALL), { order: o + 0.02 });
          furn("plant_tall", x0 + 4, 10, pick3(PLANTS_TALL), { order: o + 0.03 });
          return;
        }
        case "standdesk": {
          furn("cafe_table", x0 + 2, 10, void 0, { order: o });
          spot("stand", x0 + 2, 9, "down", { dy: -1 });
          furn("plant_small", x0 + 4, 10, pick3(PLANTS_SMALL), { order: o + 0.01 });
          furn("trash_bin", x0, 10, void 0, { order: o + 0.02 });
          return;
        }
        case "stands": {
          furn("filing_cabinet", x0 + 4, 10, void 0, { order: o });
          furn("plant_small", x0, 10, pick3(PLANTS_SMALL), { order: o + 0.01 });
          spot("stand", x0 + 1, 9, "up", { dy: -2 });
          spot("stand", x0 + 2, 9, "up", { dy: -2 });
          return;
        }
      }
    }
    spot("stand", 9, 3, "left");
    spot("stand", 1, 7, "right");
    spot("stand", 13, 9, "up", { dy: -2 });
    const p = { x: rect.x * TILE, y: rect.y * TILE, w: rect.w * TILE, h: rect.h * TILE };
    area.shade = north ? { x: p.x, y: p.y, w: p.w, h: p.h - TILE } : { x: p.x, y: p.y, w: p.w, h: p.h };
    return b.build();
  }

  // vendor/habblaud/upstream/client/src/world/path/astar.ts
  var SEAT_COST = 6;
  var TURN_COST = 0.35;
  var DX = [1, -1, 0, 0];
  var DY = [0, 0, 1, -1];
  var PathFinder = class {
    g;
    f;
    from;
    dirIn;
    stamp;
    closed;
    heap;
    heapKey;
    heapSize = 0;
    gen = 0;
    grid;
    constructor(grid) {
      this.setGrid(grid);
    }
    setGrid(grid) {
      const n = grid.w * grid.h;
      if (!this.g || this.g.length !== n) {
        this.g = new Float32Array(n);
        this.f = new Float32Array(n);
        this.from = new Int32Array(n);
        this.dirIn = new Int8Array(n);
        this.stamp = new Uint32Array(n);
        this.closed = new Uint32Array(n);
        this.heap = new Int32Array(n * 4 + 8);
        this.heapKey = new Float32Array(n * 4 + 8);
        this.gen = 0;
      }
      this.grid = grid;
    }
    /**
     * Caminho de (sx, sy) até (gx, gy). Preenche `out` com pares [x0, y0, x1, y1, ...] SEM o ponto
     * de partida e COM o destino. O ponto de partida pode estar bloqueado (ex.: personagem num assento).
     * Retorna false se não houver caminho.
     */
    find(sx, sy, gx, gy, out) {
      out.length = 0;
      const grid = this.grid;
      if (!grid.inside(sx, sy) || !grid.walkable(gx, gy)) return false;
      if (sx === gx && sy === gy) return true;
      const w = grid.w;
      const cells = grid.cells;
      if (++this.gen >= 4294967295) {
        this.stamp.fill(0);
        this.closed.fill(0);
        this.gen = 1;
      }
      const gen = this.gen;
      const start = sy * w + sx;
      const goal = gy * w + gx;
      this.heapSize = 0;
      this.stamp[start] = gen;
      this.g[start] = 0;
      this.f[start] = Math.abs(sx - gx) + Math.abs(sy - gy);
      this.from[start] = -1;
      this.dirIn[start] = -1;
      this.push(start);
      while (this.heapSize > 0) {
        const cur = this.pop();
        if (cur === goal) {
          this.reconstruct(goal, start, w, out);
          return true;
        }
        if (this.closed[cur] === gen) continue;
        this.closed[cur] = gen;
        const cx = cur % w;
        const cy = (cur - cx) / w;
        const gCur = this.g[cur];
        const dIn = this.dirIn[cur];
        for (let k = 0; k < 4; k++) {
          const nx = cx + DX[k];
          const ny = cy + DY[k];
          if (nx < 0 || ny < 0 || nx >= w || ny >= grid.h) continue;
          const ni = ny * w + nx;
          const cell = cells[ni];
          if (cell === BLOCKED) continue;
          if (this.closed[ni] === gen) continue;
          let cost = cell === SEAT && ni !== goal ? SEAT_COST : 1;
          if (dIn >= 0 && dIn !== k) cost += TURN_COST;
          const ng = gCur + cost;
          if (this.stamp[ni] === gen && ng >= this.g[ni]) continue;
          this.stamp[ni] = gen;
          this.g[ni] = ng;
          const h = Math.abs(nx - gx) + Math.abs(ny - gy);
          this.f[ni] = ng + h * 1.001;
          this.from[ni] = cur;
          this.dirIn[ni] = k;
          this.push(ni);
        }
      }
      return false;
    }
    reconstruct(goal, start, w, out) {
      let n = 0;
      for (let i = goal; i !== start && i >= 0; i = this.from[i]) n++;
      out.length = n * 2;
      let k = n - 1;
      for (let i = goal; i !== start && i >= 0; i = this.from[i]) {
        const x = i % w;
        out[k * 2] = x;
        out[k * 2 + 1] = (i - x) / w;
        k--;
      }
    }
    push(i) {
      if (this.heapSize >= this.heap.length) {
        const bi = new Int32Array(this.heap.length * 2);
        bi.set(this.heap);
        this.heap = bi;
        const bk = new Float32Array(this.heapKey.length * 2);
        bk.set(this.heapKey);
        this.heapKey = bk;
      }
      const heap = this.heap;
      const key = this.heapKey;
      const k = this.f[i];
      let pos = this.heapSize++;
      while (pos > 0) {
        const parent = pos - 1 >> 1;
        if (key[parent] <= k) break;
        heap[pos] = heap[parent];
        key[pos] = key[parent];
        pos = parent;
      }
      heap[pos] = i;
      key[pos] = k;
    }
    pop() {
      const heap = this.heap;
      const key = this.heapKey;
      const top = heap[0];
      const size = --this.heapSize;
      const last = heap[size];
      const lastK = key[size];
      let pos = 0;
      while (true) {
        const l = pos * 2 + 1;
        if (l >= size) break;
        const r = l + 1;
        const c = r < size && key[r] < key[l] ? r : l;
        if (key[c] >= lastK) break;
        heap[pos] = heap[c];
        key[pos] = key[c];
        pos = c;
      }
      heap[pos] = last;
      key[pos] = lastK;
      return top;
    }
  };

  // vendor/habblaud/upstream/shared/world/protocol.ts
  var TRAIT_IDS = [
    "competicao",
    "apostas",
    "games",
    "series",
    "fofoca",
    "vaidade",
    "cafeina",
    "piadas",
    "esporte",
    "timidez",
    "economia",
    "sonecas",
    "calma",
    "leitura"
  ];
  var TRAIT_CLASHES = [
    ["timidez", "piadas"],
    ["timidez", "fofoca"],
    ["apostas", "economia"],
    ["esporte", "sonecas"],
    ["calma", "competicao"]
  ];
  var UPLINK_LIMITS = { floors: 64, agentsPerFloor: 64, agentsTotal: 256, bytes: 64 * 1024 };

  // vendor/habblaud/upstream/shared/world/traits.ts
  var TRAITS = {
    competicao: { id: "competicao", emoji: "\u{1F3C6}", label: tr("Competi\xE7\xE3o"), desc: tr("Adora competir: desafia os colegas no ping-pong, no videogame e no jokenp\xF4.") },
    apostas: { id: "apostas", emoji: "\u{1F3B2}", label: tr("Apostas"), desc: tr("Topa qualquer aposta e aposta alto no jokenp\xF4.") },
    games: { id: "games", emoji: "\u{1F3AE}", label: tr("Games"), desc: tr("Vive no videogame do lounge e nos fliperamas \u2014 e costuma ganhar.") },
    series: { id: "series", emoji: "\u{1F4FA}", label: tr("S\xE9ries e TV"), desc: tr("N\xE3o perde um programa na TV do lounge (de prefer\xEAncia com pipoca).") },
    fofoca: { id: "fofoca", emoji: "\u{1F5E3}\uFE0F", label: tr("Fofoca"), desc: tr("Puxa papo na copa e sabe de tudo o que acontece nas salas.") },
    vaidade: { id: "vaidade", emoji: "\u{1F484}", label: tr("Vaidade"), desc: tr("Passa no espelho do banheiro para se arrumar sempre que pode.") },
    cafeina: { id: "cafeina", emoji: "\u2615", label: tr("Cafe\xEDna"), desc: tr("Movido a caf\xE9: a cafeteira da copa \xE9 a segunda casa.") },
    piadas: { id: "piadas", emoji: "\u{1F602}", label: tr("Piadas"), desc: tr("Conta piada em toda conversa e faz a roda rir.") },
    esporte: { id: "esporte", emoji: "\u{1F3D3}", label: tr("Esporte"), desc: tr("Joga ping-pong, se alonga e vibra com o futebol na TV.") },
    timidez: { id: "timidez", emoji: "\u{1F648}", label: tr("Timidez"), desc: tr("Prefere ficar na sua: l\xEA, olha a janela e entra menos nas rodas.") },
    economia: { id: "economia", emoji: "\u{1F4B0}", label: tr("Economia"), desc: tr("P\xE3o-duro: aposta pouco e \xE0s vezes foge da aposta.") },
    sonecas: { id: "sonecas", emoji: "\u{1F634}", label: tr("Sonecas"), desc: tr("Qualquer sof\xE1 ou puff vira cama.") },
    calma: { id: "calma", emoji: "\u{1F9D8}", label: tr("Calma"), desc: tr("Zen: alongamentos, janela e conversas tranquilas.") },
    leitura: { id: "leitura", emoji: "\u{1F4DA}", label: tr("Leitura"), desc: tr("Sempre com um livro da estante (ou o celular) na m\xE3o.") }
  };
  function traitsClash(a, b) {
    return TRAIT_CLASHES.some(([x, y]) => x === a && y === b || x === b && y === a);
  }

  // vendor/habblaud/upstream/client/src/world/social/persona.ts
  var CATCHPHRASES = [
    tr("Bora!"),
    tr("Partiu!"),
    tr("T\xE1 pago!"),
    tr("\xC9 hoje!"),
    tr("Simbora!"),
    tr("Bora codar!"),
    tr("Deu bom!"),
    tr("Que isso!"),
    tr("Show de bola!"),
    tr("Tamo junto!"),
    tr("Sem estresse."),
    tr("Vai dar certo!")
  ];
  function mix2(seed) {
    let h = (seed ^ 1540483477) >>> 0;
    h = Math.imul(h ^ h >>> 15, 739982445);
    h = Math.imul(h ^ h >>> 12, 695872825);
    return (h ^ h >>> 15) >>> 0;
  }
  var cache2 = /* @__PURE__ */ new Map();
  function personaFor(seed) {
    const hit = cache2.get(seed);
    if (hit) return hit;
    const rng = mulberry32(mix2(seed));
    const n = rng() < 0.55 ? 2 : 3;
    const traits = [];
    for (let guard = 0; traits.length < n && guard < 40; guard++) {
      const t2 = TRAIT_IDS[Math.floor(rng() * TRAIT_IDS.length) % TRAIT_IDS.length];
      if (traits.includes(t2) || traits.some((o) => traitsClash(o, t2))) continue;
      traits.push(t2);
    }
    let sociability = 0.45 + rng() * 0.3;
    if (traits.includes("timidez")) sociability -= 0.3;
    if (traits.includes("fofoca")) sociability += 0.2;
    if (traits.includes("piadas")) sociability += 0.12;
    let skill = 0.3 + rng() * 0.4;
    if (traits.includes("games")) skill += 0.2;
    if (traits.includes("esporte")) skill += 0.15;
    if (traits.includes("sonecas")) skill -= 0.1;
    const catchphrase = CATCHPHRASES[Math.floor(rng() * CATCHPHRASES.length) % CATCHPHRASES.length];
    const p = { traits, sociability: clamp013(sociability), skill: clamp013(skill), catchphrase };
    if (cache2.size > 500) cache2.clear();
    cache2.set(seed, p);
    return p;
  }
  function clamp013(v) {
    return Math.max(0.05, Math.min(0.95, v));
  }
  function hasTrait(p, t2) {
    return p.traits.includes(t2);
  }
  function bondBetween(seedA, seedB) {
    if (seedA === seedB) return null;
    const lo = Math.min(seedA >>> 0, seedB >>> 0);
    const hi = Math.max(seedA >>> 0, seedB >>> 0);
    const r = mulberry32(mix2(lo ^ Math.imul(hi, 2654435761)))();
    const a = personaFor(seedA);
    const b = personaFor(seedB);
    const rivalry = 0.12 + (hasTrait(a, "competicao") && hasTrait(b, "competicao") ? 0.18 : 0);
    const friendship = 0.22 + ([a, b].some((p) => hasTrait(p, "fofoca") || hasTrait(p, "piadas")) ? 0.08 : 0);
    if (r < rivalry) return "rivalidade";
    if (r < rivalry + friendship) return "amizade";
    return null;
  }
  var SOLO_K = {
    cafeina: { coffee: 3 },
    vaidade: { mirror: 5, bathroom: 1.3 },
    leitura: { shelf: 3, phone: 1.6, window: 1.2 },
    sonecas: { lounge: 2.5 },
    esporte: { stretch: 2.5, water: 1.5 },
    calma: { window: 2.5, stretch: 1.5 },
    games: { arcade: 3, phone: 1.4 },
    timidez: { window: 1.5, shelf: 1.5, phone: 1.5 },
    fofoca: { coffee: 1.4, phone: 1.4 },
    series: { phone: 1.5, lounge: 1.3 },
    economia: { snack: 0.4, water: 1.6 }
  };
  function soloWeights(p) {
    const out = { ...IDLE_WEIGHTS };
    for (const t2 of p.traits) for (const [k, v] of Object.entries(SOLO_K[t2] ?? {})) out[k] *= v;
    return out;
  }

  // vendor/habblaud/upstream/client/src/world/social/gathering.ts
  var PROGRAM_SEED = { futebol: 0, novela: 1, desenho: 2 };
  var KINDS = {
    tv: { label: tr("Vendo TV"), emoji: "\u{1F4FA}", min: 2, max: 5 },
    videogame: { label: tr("Jogando videogame"), emoji: "\u{1F3AE}", min: 2, max: 5, match: true },
    arcade: { label: tr("Duelo no fliperama"), emoji: "\u{1F47E}", min: 2, max: 2, match: true },
    pingpong: { label: tr("Jogando pingue-pongue"), emoji: "\u{1F3D3}", min: 2, max: 4, match: true },
    kitchen: { label: tr("Papo na copa"), emoji: "\u2615", min: 2, max: 4 },
    talk: { label: tr("Conversando"), emoji: "\u{1F4AC}", min: 2, max: 2 },
    rps: { label: tr("Jokenp\xF4"), emoji: "\u270A", min: 2, max: 4, match: true },
    mirror: { label: tr("Se arrumando no espelho"), emoji: "\u{1F484}", min: 1, max: 2, solo: true }
  };
  function ownerTag(g) {
    return `g:${g.id}`;
  }
  function players(g) {
    return g.members.filter((m) => m.role === "player" && !m.left);
  }
  function active(g) {
    return g.members.filter((m) => !m.left);
  }
  var BASE = {
    tv: 10,
    videogame: 9,
    arcade: 5,
    pingpong: 9,
    kitchen: 12,
    talk: 8,
    rps: 8,
    mirror: 2
  };
  var TRAIT_K = {
    series: { tv: 3 },
    games: { videogame: 3, arcade: 2.5 },
    esporte: { pingpong: 3, tv: 1.3 },
    competicao: { pingpong: 1.8, videogame: 1.8, rps: 1.8, arcade: 1.5 },
    apostas: { rps: 3.5 },
    fofoca: { kitchen: 2.5, talk: 1.8 },
    cafeina: { kitchen: 2.2 },
    piadas: { kitchen: 1.5, talk: 1.5 },
    vaidade: { mirror: 5 },
    timidez: { talk: 0.6, kitchen: 0.7, rps: 0.6, pingpong: 0.7, videogame: 0.8 },
    sonecas: { tv: 1.5, pingpong: 0.6 },
    economia: { rps: 0.4 },
    calma: { talk: 1.3, kitchen: 1.2, rps: 0.5, pingpong: 0.7 },
    leitura: { tv: 0.8 }
  };
  function kindWeight(kind, p) {
    let w = BASE[kind];
    for (const t2 of p.traits) w *= TRAIT_K[t2]?.[kind] ?? 1;
    return w;
  }
  function pickKind(rng, p, avail) {
    const kinds = Object.keys(BASE).filter((k) => avail[k]);
    let total = 0;
    for (const k of kinds) total += kindWeight(k, p);
    if (total <= 0) return null;
    let r = rng() * total;
    for (const k of kinds) {
      r -= kindWeight(k, p);
      if (r < 0) return k;
    }
    return kinds[kinds.length - 1] ?? null;
  }
  function partnerScore(kind, p, bond, rng) {
    let s = kindWeight(kind, p) / BASE[kind] + p.sociability;
    if (bond === "amizade") s += 1.2;
    if (bond === "rivalidade") s += KINDS[kind].match ? 1.6 : -0.8;
    return s + rng() * 1.2;
  }
  function pickProgram(rng, p) {
    if (hasTrait(p, "esporte") && rng() < 0.7) return "futebol";
    if (hasTrait(p, "series") && rng() < 0.6) return "novela";
    const r = rng();
    return r < 0.4 ? "futebol" : r < 0.75 ? "novela" : "desenho";
  }
  var MAX_BET = 50;
  function betFor(kind, a, b, coinsA, coinsB, bond, rng) {
    const cap = Math.min(coinsA, coinsB, MAX_BET);
    if (cap < 1) return 0;
    let v;
    if (kind === "rps") {
      v = 10;
      if (hasTrait(a, "apostas") || hasTrait(b, "apostas")) v = 20;
      if (hasTrait(a, "competicao")) v += 5;
    } else if (KINDS[kind].match) {
      const keen = bond === "rivalidade" || hasTrait(a, "apostas") || hasTrait(b, "apostas");
      if (!keen && !(hasTrait(a, "competicao") && rng() < 0.35)) return 0;
      if (keen && rng() < 0.3) return 0;
      v = bond === "rivalidade" ? 15 : 10;
    } else return 0;
    if (hasTrait(a, "economia") || hasTrait(b, "economia")) v = 5;
    return Math.max(1, Math.min(cap, v));
  }
  function rpsResult(a, b) {
    if (a === b) return 0;
    const beats = { rock: "scissors", scissors: "paper", paper: "rock" };
    return beats[a] === b ? 1 : 2;
  }
  var GESTURES2 = ["rock", "paper", "scissors"];
  function pickGesture(rng, p) {
    if (hasTrait(p, "competicao") && rng() < 0.2) return "rock";
    return GESTURES2[Math.floor(rng() * 3) % 3];
  }
  function winChance(skillA, skillB) {
    return Math.max(0.15, Math.min(0.85, 0.5 + (skillA - skillB) * 0.6));
  }
  var TARGET = { pingpong: 5, videogame: 2, arcade: 1 };
  var GESTURE_ICON = { rock: "hand_rock", paper: "hand_paper", scissors: "hand_scissors" };

  // vendor/habblaud/upstream/client/src/world/sim/character.ts
  var Character = class {
    id;
    info;
    appearance;
    rng;
    // posição (px de mundo; pés) e tile lógico (sempre caminhável quando parado)
    x = 0;
    y = 0;
    tx = 0;
    ty = 0;
    dir = "down";
    pose = "stand";
    held = "none";
    seated = false;
    alpha = 1;
    visible = true;
    /** Profundidade forçada (assentos). null = usa y. */
    sortY = null;
    /** Tempo (ms) na pose atual, para escolher o frame da animação. */
    animT = 0;
    // comportamento
    mode = "idle";
    queue = [];
    step = null;
    stepT = 0;
    stepStarted = false;
    /** Replanejar assim que o passo atual (não interrompível) terminar. */
    replan = false;
    /** Spot da mesa/banqueta/ponto de trabalho (reservado enquanto o personagem existir). */
    homeSpot = null;
    /** Spot onde está agora (assento/máquina), além do home. */
    atSpot = null;
    /** Spots temporários reservados durante um passeio. */
    tempSpots = [];
    roomId;
    leaving = false;
    gone = false;
    arriving = false;
    missingSince = null;
    /** Próximo passeio do ocioso (ms epoch). */
    nextOutingAt = 0;
    /** Roda de que participa (ou a caminho dela). */
    gathering = null;
    /** Quem espera um shell: próxima tentativa de entrar numa roda (ms epoch; 0 = agendar). */
    nextSocialAt = 0;
    /** Desenha só depois deste instante (fila no elevador). */
    hiddenUntil = 0;
    /** Escondido (dentro de cabine ou elevador fechado). */
    inside = false;
    /** Próxima vez que o planejador pode rodar (evita replanejar a cada frame sem necessidade). */
    thinkAt = 0;
    /** Subagente já entregou o resultado ao pai. */
    delivered = false;
    /** Fim do uso da cabine (ms epoch). */
    stallUntil = 0;
    /** Origem do encaixe/saída de um assento (interpolação curta). */
    enterFrom = null;
    /** Sala lotada: tile em que trabalha em pé (sem lugar reservado). */
    standTile = null;
    /** Ritmo próprio da caminhada (±8%), para quem sai junto não andar em fila perfeita. */
    speedK;
    /** Faixa lateral (px) ao andar: dois personagens no mesmo caminho não se sobrepõem. */
    lane;
    /** Deslocamento visual atual (px), suavizado em direção à faixa enquanto anda. */
    offX = 0;
    offY = 0;
    // marcadores
    icon = null;
    iconUntil = 0;
    iconAt = 0;
    bubbleText = null;
    bubbleIcon = "";
    bubbleAt = 0;
    bubbleUntil = 0;
    /** Mini-balão de conversa (emoji). */
    chatEmoji = "";
    chatUntil = 0;
    /** Fala curta (balãozinho com texto) das rodas: convites, papo, torcida, apostas. */
    sayText = "";
    sayAt = 0;
    sayUntil = 0;
    lastActivityId = null;
    activityChangedAt = 0;
    // espera de shell (modo 'shell'; regras em sim/shell.ts)
    /** Início (epoch ms) da espera atual: o shell mais antigo. 0 = não está esperando. */
    shellSince = 0;
    /** Quantos shells espera (o "×N" da ampulheta). */
    shellCount = 0;
    shellLabel = "";
    /** Estágio da gag (recalculado a cada frame pela idade da espera). */
    shellStage = null;
    /** Quando entrou no modo 'shell' (relógio do mundo): ritmo do balão no modo 'important'. */
    shellEnteredAt = 0;
    /** Texto do balão em cache: refeito só quando o tempo exibido muda (sem string nova por frame). */
    shellText = "";
    shellTextKey = -1;
    /**
     * Reação ao fim de um shell (comemoração/lamento) em andamento até este instante: uma mudança de
     * modo não a interrompe (a fila termina de volta na mesa e o planejador segue o status atual).
     */
    reactUntil = 0;
    /** `at` da última Activity 'ShellDone' já tratada (as anteriores à chegada não comemoram). */
    shellDoneAt = 0;
    /** Render: próxima pipoca que pula do balde (epoch ms). */
    popcornAt = 0;
    constructor(info, appearance) {
      this.id = info.id;
      this.info = info;
      this.appearance = appearance;
      this.roomId = info.roomId;
      this.rng = mulberry32((info.seed ^ 2654435769) >>> 0);
      const r = mulberry32((info.seed ^ 1374496675) >>> 0);
      this.speedK = 0.92 + r() * 0.16;
      this.lane = Math.round((r() * 2 - 1) * 3.5);
    }
    /** Aproxima o deslocamento visual da faixa (andando) ou do centro (parado). */
    updateLane(dt) {
      const walking = this.pose === "walk" || this.pose === "run";
      const horiz = this.dir === "left" || this.dir === "right";
      const tx = walking && !horiz ? this.lane : 0;
      const ty = walking && horiz ? this.lane * 0.6 : 0;
      const k = Math.min(1, dt * 5);
      this.offX += (tx - this.offX) * k;
      this.offY += (ty - this.offY) * k;
      if (Math.abs(this.offX) < 0.05) this.offX = 0;
      if (Math.abs(this.offY) < 0.05) this.offY = 0;
    }
    /** Coloca os pés no ponto padrão de um tile. */
    placeAtTile(tx, ty) {
      this.tx = tx;
      this.ty = ty;
      this.x = tx * TILE + FOOT_DX;
      this.y = ty * TILE + FOOT_DY;
    }
    setPose(pose, held = "none") {
      if (this.pose !== pose) {
        this.pose = pose;
        this.animT = 0;
      }
      this.held = held;
    }
    setIcon(icon, ms, now) {
      this.icon = icon;
      this.iconAt = now;
      this.iconUntil = icon ? now + ms : 0;
    }
    showBubble(icon, text, ms, now) {
      this.bubbleIcon = icon;
      this.bubbleText = text;
      this.bubbleAt = now;
      this.bubbleUntil = now + ms;
    }
    depth() {
      return this.sortY ?? this.y;
    }
  };
  function dirOf(dx, dy, fallback2) {
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return fallback2;
    if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? "right" : "left";
    return dy > 0 ? "down" : "up";
  }
  function facing(ax, ay, bx, by) {
    return dirOf(bx - ax, by - ay, "down");
  }

  // vendor/habblaud/upstream/client/src/world/social/lines.ts
  var INVITE = {
    tv: [tr("Bora ver TV? \u{1F4FA}"), tr("Sess\xE3o pipoca? \u{1F37F}"), tr("Vai come\xE7ar o programa!"), tr("Bora ver um pouco de TV?")],
    futebol: [tr("Vai come\xE7ar o jogo! \u26BD"), tr("Bora ver o futebol?"), tr("T\xE1 passando o cl\xE1ssico! \u26BD")],
    novela: [tr("T\xE1 passando a novela! \u{1F4FA}"), tr("Bora ver o cap\xEDtulo de hoje?")],
    desenho: [tr("T\xE1 passando desenho! \u{1F604}"), tr("Bora ver desenho?")],
    videogame: [tr("Bora uma partida no videogame? \u{1F3AE}"), tr("Duvido voc\xEA me ganhar \u{1F3AE}"), tr("Videogame? Melhor de tr\xEAs!")],
    arcade: [tr("Fliperama? \u{1F47E}"), tr("Aposto que bato teu recorde \u{1F47E}"), tr("Bora no fliperama?")],
    pingpong: [tr("Pingue-pongue? \u{1F3D3}"), tr("Bora uma partidinha? \u{1F3D3}"), tr("Vem jogar ping-pong!")],
    pingpongRival: [tr("Vem tomar uma surra no ping-pong \u{1F60F}"), tr("Revanche no ping-pong? \u{1F3D3}")],
    kitchen: [tr("Bora tomar um caf\xE9? \u2615"), tr("Pausa pro caf\xE9? \u2615"), tr("Bora dar uma pausa na copa?")],
    kitchenGossip: [tr("Tenho uma fofoca\u2026 \u{1F440}"), tr("Copa. Agora. Tenho novidade \u{1F440}")],
    talk: [tr("E a\xED, tudo certo?"), tr("Ei, {nome}!"), tr("Bora trocar uma ideia?"), tr("Opa, {nome}! Beleza?")],
    rps: [tr("Jokenp\xF4 valendo \u{1FA99}{v}?"), tr("Aposto \u{1FA99}{v} no jokenp\xF4!"), tr("Pedra, papel e tesoura? \u{1FA99}{v}!")],
    rpsHonor: [tr("Jokenp\xF4? S\xF3 pela honra \u{1F605}"), tr("Jokenp\xF4 valendo nada?")],
    mirror: [tr("Bora dar um tapa no visual? \u{1F484}"), tr("Espelho? Preciso me arrumar \u2728")]
  };
  var ACCEPT = [tr("Bora!"), tr("Partiu!"), "Fechado! \u{1F91D}", tr("S\xF3 se for agora!"), tr("Opa!"), tr("J\xE1 \xE9!"), tr("Demorou!")];
  var ACCEPT_BET = ["Fechado! \u{1F91D}", tr("Prepara o bolso \u{1F4B0}"), tr("Vai perder!"), tr("Aceito!")];
  var ACCEPT_BROKE = [tr("T\xF4 liso \u{1F605} S\xF3 pela honra!"), tr("Sem \u{1FA99}\u2026 valendo nada?")];
  var ACCEPT_SLEEPY = [tr("H\xE3? Ah\u2026 bora \u{1F634}"), tr("Acordei! Bora."), tr("Cinco minutinhos\u2026 t\xE1, bora.")];
  var ACCEPT_SHELL = [tr("Enquanto o build roda\u2026 bora! \u23F3"), tr("Meu comando t\xE1 rodando, d\xE1 tempo \u23F3"), tr("T\xF4 esperando o terminal mesmo\u2026")];
  var ACCEPT_STINGY = [tr("Aposta? S\xF3 um pouquinho \u{1F4B0}"), tr("Valendo pouco, hein")];
  var TV = {
    futebol: {
      goal: ["GOOOL! \u26BD", tr("\xC9 GOL!!"), tr("GOLA\xC7O! \u26BD"), tr("Que gola\xE7o!")],
      miss: ["Uuuuh! \u{1F631}", tr("Na trave!"), tr("Quase!"), tr("Perdeu essa?!")],
      against: [tr("Ah n\xE3o! Gol deles \u{1F629}"), tr("Que fase\u2026"), tr("Acorda, zaga!"), tr("N\xE3o acredito\u2026")],
      talk: [tr("Juiz ladr\xE3o! \u{1F624}"), tr("Que jogada!"), tr("Esse goleiro \xE9 bom demais"), tr("Bora, time!"), tr("Isso foi p\xEAnalti!"), tr("T\xE1 jogando muito!")]
    },
    novela: {
      twist: [tr("N\xE3o acredito! \u{1F631}"), tr("Eu sabia!"), tr("Que reviravolta!"), tr("Mentira!!")],
      love: [tr("Esse casal! \u{1F60D}"), "Finalmente! \u{1F60D}", tr("Que romance\u2026")],
      talk: [tr("Shhh, vai come\xE7ar!"), tr("Chora n\xE3o\u2026 \u{1F62D}"), tr("Esse vil\xE3o n\xE3o presta"), tr("Amanh\xE3 \xE9 o \xFAltimo cap\xEDtulo!")]
    },
    desenho: {
      funny: ["KKKKK \u{1F602}", tr("Hahaha!"), tr("Muito bom \u{1F602}"), tr("Esse desenho \xE9 demais!")],
      talk: [tr("Eu assistia isso crian\xE7a!"), tr("Cl\xE1ssico!"), tr("Olha a cara dele \u{1F602}")]
    },
    end: [tr("Bom demais!"), tr("Amanh\xE3 tem mais \u{1F4FA}"), tr("Que epis\xF3dio!"), tr("Valeu a pausa!")]
  };
  var GAME = {
    trash: [tr("Vou te passar! \u{1F3CE}\uFE0F"), tr("Que lag \xE9 esse?!"), "Combo! \u{1F4A5}", tr("N\xE3o vale!"), tr("T\xE1 f\xE1cil \u{1F60E}"), tr("S\xF3 aquecendo\u2026"), tr("Ningu\xE9m me para!"), tr("Olha essa!")],
    round: [tr("Ganhei essa! \u{1F3C6}"), tr("Uma a zero!"), tr("Toma!")],
    cheer: [tr("Vai, {nome}!"), tr("Uooou!"), tr("Que jogada!"), tr("Aperta o bot\xE3o!")]
  };
  var PINGPONG = {
    point: [tr("Ponto! \u{1F3D3}"), tr("Toma!"), tr("Na quina!"), tr("Corta!"), tr("Defende essa!")],
    cheer: [tr("Boa!"), tr("Vai, {nome}!"), tr("Uooou!"), tr("Que ralo!")],
    final: ["{a} a {b}! \u{1F3C6}", tr("Ganhei de {a} a {b}! \u{1F3C6}")]
  };
  var RPS = {
    count: [tr("Jo\u2026"), tr("Ken\u2026"), tr("P\xF4!")],
    tie: [tr("Empate! De novo!"), tr("Pensamos igual \u{1F602}"), tr("De novo!")],
    win: [tr("Ganhei! \u{1F4B0}"), tr("Hoje \xE9 meu dia!"), tr("Passa o \u{1FA99}!"), tr("Mole demais \u{1F60E}"), tr("Sabia!")],
    winHonor: [tr("Ganhei! \u{1F60E}"), tr("Sabia!"), tr("Hoje \xE9 meu dia!")],
    lose: [tr("N\xE3o valeu!"), tr("Sorte sua\u2026"), tr("Meu dinheiro\u2026 \u{1F62D}"), tr("T\xE1, t\xE1\u2026"), tr("Era pra ser pedra!")],
    rematch: [tr("Revanche!"), tr("Melhor de tr\xEAs!"), tr("De novo, valendo!")],
    stalemate: [tr("Deixa quieto \u{1F605}"), tr("Empatamos, ent\xE3o.")],
    watch: ["KKKKK", tr("Uou!"), tr("Eita!"), tr("Paga!")]
  };
  var MIRROR = {
    solo: ["Arrasei \u2728", tr("Hoje eu t\xF4 on \u{1F60E}"), tr("Cabelo no lugar \u2705"), tr("Look aprovado \u2728"), tr("Esse cabelo n\xE3o colabora\u2026"), tr("Pronto pra pr\xF3xima reuni\xE3o \u2728")],
    lipstick: [tr("Batom perfeito \u{1F484}"), tr("Agora sim \u{1F48B}")],
    duo: [tr("Empresta o pente?"), tr("Ficou \xF3timo!"), tr("Que tal?"), tr("T\xE1 arrasando!")]
  };
  var CHAT = {
    fofoca: [tr("Viram o commit de {nome}? \u{1F440}"), tr("Dizem que {sala} vai pro ar hoje\u2026"), tr("{nome} t\xE1 h\xE1 horas no mesmo bug \u{1F92B}"), tr("Ouvi dizer que vai ter pizza \u{1F355}"), tr("Sabia que {nome} aposta tudo no jokenp\xF4?")],
    work: [tr("Meu build passou de primeira \u{1F60E}"), tr("Esse bug em {sala} t\xE1 osso"), tr("Deploy na sexta? \u{1F608}"), tr("Quem mexeu no package-lock?!"), tr("Os testes est\xE3o verdes \u2705"), tr("T\xF4 esperando o review\u2026"), tr("Escrevi 300 linhas e apaguei 400"), tr("Refatorei {sala} inteiro hoje")],
    cafeina: [tr("Esse caf\xE9 t\xE1 forte!"), tr("J\xE1 \xE9 o quinto caf\xE9 \u2615"), tr("Sem caf\xE9 n\xE3o compila \u2615")],
    piadas: [tr("Funciona na minha m\xE1quina! \u{1F602}"), tr("Por que o dev foi ao m\xE9dico? Muitos bugs \u{1F41B}"), tr("Existem 10 tipos de pessoas\u2026 \u{1F60F}"), tr('Commit: "ajustes finais (agora vai)"'), tr("Meu c\xF3digo n\xE3o tem bug, tem feature surpresa")],
    esporte: [tr("Viu o jogo ontem? \u26BD"), tr("Bora correr no fim de semana?")],
    series: [tr("Viram o \xFAltimo epis\xF3dio? \u{1F4FA}"), tr("Sem spoiler, por favor!")],
    games: [tr("Zerei aquele jogo ontem \u{1F3AE}"), tr("Bora jogar online hoje?")],
    leitura: [tr("T\xF4 lendo um livro \xF3timo \u{1F4DA}"), tr("Terminei aquele livro!")],
    calma: [tr("Respira\u2026 tudo vai compilar \u{1F9D8}"), tr("Um passo de cada vez.")],
    apostas: [tr("Quem topa um jokenp\xF4 depois? \u{1F3B2}"), tr("T\xF4 com sorte hoje \u{1F340}")],
    economia: [tr("T\xF4 juntando \u{1FA99} pra f\xE9rias"), tr("Caf\xE9 de gra\xE7a \xE9 o melhor caf\xE9")],
    generic: [tr("E o fim de semana?"), tr("Preciso de f\xE9rias \u{1F3D6}\uFE0F"), tr("Que dia, hein"), tr("T\xE1 tudo corrido hoje")],
    react: ["KKKKK", tr("S\xE9rio?!"), tr("N\xE3o acredito \u{1F62E}"), tr("Verdade!"), tr("Hahaha"), tr("Nem me fala\u2026"), "\u{1F440}", tr("Pois \xE9"), tr("Mentira!"), tr("Que isso!")],
    laugh: ["KKKKK", tr("Hahaha!"), "\u{1F602}\u{1F602}\u{1F602}"]
  };
  var CALLED = [tr("Opa, me chamaram! \u{1F3C3}"), tr("Fui! Trabalho chegou"), tr("Volto j\xE1!"), tr("Ih, tenho que ir!")];
  var SHELL_DONE = [tr("Meu comando terminou! \u{1F3C3}"), tr("Terminou o build, fui!")];
  var TRAIT_TOPICS = {
    fofoca: "fofoca",
    cafeina: "cafeina",
    piadas: "piadas",
    esporte: "esporte",
    series: "series",
    games: "games",
    leitura: "leitura",
    calma: "calma",
    apostas: "apostas",
    economia: "economia"
  };
  function timeLine(d) {
    const day = d.getDay();
    const h = d.getHours();
    if (day === 5 && h >= 12) return tr("Sextou! \u{1F389}");
    if (day === 1 && h < 12) return tr("Segunda-feira, n\xE9\u2026");
    if (h >= 6 && h < 10) return tr("Bom dia! \u2600\uFE0F");
    if (h >= 11 && h < 14) return tr("Que fome\u2026 almo\xE7o? \u{1F37D}\uFE0F");
    if (h >= 20 || h < 5) return tr("Ainda aqui a essa hora? \u{1F319}");
    return null;
  }
  function fill2(line, vars) {
    let ok = true;
    const out = line.replace(/\{(nome|sala|v|a|b)\}/g, (_, k) => {
      const v = vars[k];
      if (v === void 0 || v === "") {
        ok = false;
        return "";
      }
      return String(v);
    });
    return ok ? out : null;
  }
  function pick2(pool, rng, vars = {}, avoid) {
    const n = pool.length;
    const start = Math.floor(rng() * n);
    let fallback2 = null;
    for (let i = 0; i < n; i++) {
      const s = fill2(pool[(start + i) % n], vars);
      if (s === null) continue;
      if (s !== avoid) return s;
      fallback2 ??= s;
    }
    return fallback2 ?? pool.find((l) => !/\{\w+\}/.test(l)) ?? "\u2026";
  }

  // vendor/habblaud/upstream/shared/world/office-from-world.ts
  var WORLD_ID_PREFIX = "world:";
  function isWorldId(id) {
    return id.startsWith(WORLD_ID_PREFIX);
  }

  // vendor/habblaud/upstream/client/src/world/social/wallet.ts
  var START_COINS = { main: 100, sub: 30 };
  var TASK_REWARD = 10;
  var DELIVERY_REWARD = 15;
  var TURN_REWARD = 5;
  var STORAGE_KEY = "habblaud.wallets.v1";
  var WORLD_STORAGE_KEY = "habblaud:world-wallet";
  var LEDGER_MAX = 12;
  var PAID_MAX = 300;
  var FORGET_MS = 3 * 24 * 36e5;
  var MAX_WALLETS = 400;
  var PARTS = ["office", "world"];
  var KEYS2 = { office: STORAGE_KEY, world: WORLD_STORAGE_KEY };
  var partOf = (id) => isWorldId(id) ? "world" : "office";
  function browserStorage() {
    return null;
  }
  function taskKey(t2) {
    return `${t2.id}|${t2.title}`;
  }
  var Wallets = class {
    constructor(storage) {
      this.storage = storage;
      this.load();
    }
    map = /* @__PURE__ */ new Map();
    /** O que mudou desde a última gravação, por economia: cada uma só regrava a própria chave. */
    dirty = { office: false, world: false };
    get(id) {
      return this.map.get(id);
    }
    coins(id) {
      return this.map.get(id)?.coins ?? 0;
    }
    /**
     * Garante a carteira do agente. Na primeira vez: saldo inicial e as tarefas que já estavam
     * concluídas pagas em silêncio (quem já trabalhou antes de a página abrir não perde o que fez).
     */
    ensure(a, now) {
      let w = this.map.get(a.id);
      if (w) {
        if (w.name !== a.name) w.name = a.name;
        if (now - w.seenAt > 6e4) {
          w.seenAt = now;
          this.touch(a.id);
        }
        return { entry: w, created: false };
      }
      const start = START_COINS[a.kind] ?? START_COINS.main;
      w = { name: a.name, coins: start, earned: start, wins: 0, losses: 0, vs: {}, paid: [], ledger: [], createdAt: now, seenAt: now };
      this.map.set(a.id, w);
      this.log(w, { at: now, delta: start, icon: "\u{1F3E2}", text: tr("Chegou ao escrit\xF3rio") });
      const done = a.tasks.filter((t2) => t2.status === "completed");
      if (done.length) {
        for (const t2 of done) w.paid.push(taskKey(t2));
        const v = done.length * TASK_REWARD;
        w.coins += v;
        w.earned += v;
        this.log(w, { at: now, delta: v, icon: "\u2705", text: done.length === 1 ? tr("1 tarefa j\xE1 conclu\xEDda") : tr("{0} tarefas j\xE1 conclu\xEDdas", [done.length]) });
      }
      this.touch(a.id);
      return { entry: w, created: true };
    }
    /** Paga as tarefas concluídas que ainda não foram pagas. Retorna quanto pagou agora. */
    payTasks(a, now) {
      const w = this.map.get(a.id);
      if (!w) return 0;
      let total = 0;
      for (const t2 of a.tasks) {
        if (t2.status !== "completed") continue;
        const k = taskKey(t2);
        if (w.paid.includes(k)) continue;
        w.paid.push(k);
        if (w.paid.length > PAID_MAX) w.paid.splice(0, w.paid.length - PAID_MAX);
        w.coins += TASK_REWARD;
        w.earned += TASK_REWARD;
        total += TASK_REWARD;
        this.log(w, { at: now, delta: TASK_REWARD, icon: "\u2705", text: tr("Tarefa conclu\xEDda: {0}", [t2.title]) });
      }
      if (total) this.touch(a.id);
      return total;
    }
    /** Crédito por trabalho (pedido atendido, entrega de subagente). */
    credit(id, amount, icon, text, now) {
      const w = this.map.get(id);
      if (!w || amount <= 0) return 0;
      w.coins += amount;
      w.earned += amount;
      this.log(w, { at: now, delta: amount, icon, text });
      this.touch(id);
      return amount;
    }
    /**
     * Aposta paga: tira até `amount` de quem perdeu (nunca deixa negativo) e dá a quem ganhou.
     * Retorna o valor que de fato mudou de mãos.
     */
    transfer(fromId, toId, amount, icon, what, now) {
      const from = this.map.get(fromId);
      const to = this.map.get(toId);
      if (!from || !to || fromId === toId) return 0;
      const v = Math.max(0, Math.min(Math.floor(amount), from.coins));
      if (!v) return 0;
      from.coins -= v;
      to.coins += v;
      this.log(from, { at: now, delta: -v, icon, text: tr("Perdeu {0} para {1}", [what, to.name]) });
      this.log(to, { at: now, delta: v, icon, text: tr("Ganhou {0} de {1}", [what, from.name]) });
      this.touch(fromId);
      this.touch(toId);
      return v;
    }
    /** Placar de uma partida/aposta (vale também sem dinheiro em jogo). */
    recordMatch(winnerId, loserId) {
      const w = this.map.get(winnerId);
      const l = this.map.get(loserId);
      if (!w || !l) return;
      w.wins++;
      l.losses++;
      (w.vs[loserId] ??= [0, 0])[0]++;
      (l.vs[winnerId] ??= [0, 0])[1]++;
      this.touch(winnerId);
      this.touch(loserId);
    }
    /**
     * Grava no navegador o que mudou (chamado com baixa frequência), cada economia na sua chave: a visita a um prédio
     * do mundo nunca regrava a do escritório (nem com uma cópia velha dela) e vice-versa.
     */
    save(now) {
      for (const part of PARTS) {
        if (!this.dirty[part]) continue;
        this.dirty[part] = false;
        this.prune(now, part);
        if (!this.storage) continue;
        const wallets = Object.fromEntries([...this.map].filter(([id]) => partOf(id) === part));
        try {
          this.storage.setItem(KEYS2[part], JSON.stringify({ v: 1, wallets }));
        } catch {
        }
      }
    }
    /** Esquece carteiras de quem não aparece há dias (e limita o total de cada economia). */
    prune(now, only) {
      for (const part of only ? [only] : PARTS) {
        const entries = [...this.map].filter(([id]) => partOf(id) === part);
        for (const [id, w] of entries) if (now - w.seenAt > FORGET_MS) this.map.delete(id);
        const left = entries.filter(([id]) => this.map.has(id));
        if (left.length <= MAX_WALLETS) continue;
        const old = left.sort((a, b) => a[1].seenAt - b[1].seenAt);
        for (const [id] of old.slice(0, left.length - MAX_WALLETS)) this.map.delete(id);
      }
    }
    touch(id) {
      this.dirty[partOf(id)] = true;
    }
    log(w, e) {
      w.ledger.unshift(e);
      if (w.ledger.length > LEDGER_MAX) w.ledger.length = LEDGER_MAX;
    }
    load() {
      for (const part of PARTS) this.loadPart(part);
    }
    loadPart(part) {
      if (!this.storage) return;
      try {
        const raw = this.storage.getItem(KEYS2[part]);
        if (!raw) return;
        const j = JSON.parse(raw);
        for (const [id, w] of Object.entries(j.wallets ?? {})) {
          if (partOf(id) !== part) continue;
          if (!w || typeof w.coins !== "number" || !Number.isFinite(w.coins)) continue;
          this.map.set(id, {
            name: typeof w.name === "string" ? w.name : id,
            coins: Math.max(0, Math.floor(w.coins)),
            earned: typeof w.earned === "number" ? w.earned : w.coins,
            wins: typeof w.wins === "number" ? w.wins : 0,
            losses: typeof w.losses === "number" ? w.losses : 0,
            vs: w.vs && typeof w.vs === "object" ? w.vs : {},
            paid: Array.isArray(w.paid) ? w.paid.filter((p) => typeof p === "string") : [],
            ledger: Array.isArray(w.ledger) ? w.ledger.slice(0, LEDGER_MAX) : [],
            createdAt: typeof w.createdAt === "number" ? w.createdAt : 0,
            seenAt: typeof w.seenAt === "number" ? w.seenAt : 0
          });
        }
      } catch {
      }
    }
  };

  // vendor/habblaud/upstream/client/src/world/social/social.ts
  var SHELL_SOCIAL_MIN_MS = 4e4;
  var GATHER_TIMEOUT_MS = 35e3;
  var SAY_MS = 2600;
  var FLOATER_MS = 1900;
  var MAX_FLOATERS = 24;
  var MAX_EVENTS = 40;
  var COIN_COLOR = "#ffd34d";
  var LOSS_COLOR = "#ff8a8a";
  var KIND_LIST = Object.keys(KINDS);
  var PLACES = { [LOUNGE_ID]: tr("Lounge"), [CAFE_ID]: tr("Copa"), [RECEPTION_ID]: tr("Recep\xE7\xE3o"), [RESTROOM_ID]: tr("Banheiros") };
  var MATCH_WHAT = {
    rps: tr("no jokenp\xF4"),
    pingpong: tr("no pingue-pongue"),
    videogame: tr("no videogame"),
    arcade: tr("no fliperama")
  };
  function between(rng, a, b) {
    return a + rng() * (b - a);
  }
  var Social = class {
    constructor(sim, storage) {
      this.sim = sim;
      this.wallets = new Wallets(storage);
    }
    gatherings = /* @__PURE__ */ new Set();
    wallets;
    floaters = [];
    events = [];
    seq = 1;
    eventSeq = 0;
    nextSaveAt = 0;
    // =================================================================== disponibilidade
    /**
     * Pode entrar numa roda agora: ocioso (ou esperando um shell há SHELL_SOCIAL_MIN_MS), sentado na
     * própria mesa, sem nada planejado. Quem cochila de tão ocioso pode ser acordado por um convite.
     */
    canJoin(c, now) {
      if (c.gone || c.leaving || c.arriving || c.inside || c.gathering) return false;
      if (c.mode !== "idle" && c.mode !== "shell") return false;
      if (c.step || c.queue.length) return false;
      if (!c.homeSpot || c.atSpot !== c.homeSpot) return false;
      if (now < c.reactUntil) return false;
      if (c.mode === "shell" && (!c.shellSince || now - c.shellSince < SHELL_SOCIAL_MIN_MS)) return false;
      return true;
    }
    candidates(ch, now) {
      const out = [];
      for (const c of this.sim.chars.values()) if (c !== ch && this.canJoin(c, now)) out.push(c);
      return out;
    }
    /** Há alguém livre para uma roda com `ch`? */
    hasCompany(ch, now) {
      for (const c of this.sim.chars.values()) if (c !== ch && this.canJoin(c, now)) return true;
      return [...this.gatherings].some((g) => this.openSpotFor(g, ch) !== void 0);
    }
    // =================================================================== começar / entrar
    /**
     * `ch` quer companhia: entra numa roda em andamento (TV, torcida, papo) ou começa uma nova com
     * colegas livres. `groupOnly` (esperando shell): nada de atividade sozinho.
     */
    tryInitiate(ch, now, groupOnly) {
      if (!this.canJoin(ch, now)) return false;
      const p = personaFor(ch.info.seed);
      const open = this.joinable(ch, p);
      if (open && ch.rng() < 0.4) return this.join(open, ch, now);
      const cands = this.candidates(ch, now);
      const avail = {};
      for (const k of KIND_LIST) {
        const need = k === "mirror" ? groupOnly ? 1 : 0 : KINDS[k].min - 1;
        if (cands.length < need) continue;
        if (k === "mirror" && !groupOnly) {
          avail[k] = !!this.plan(k, 1, ch);
          continue;
        }
        if (KINDS[k].solo && need === 0) continue;
        avail[k] = !!this.plan(k, need + 1, ch);
      }
      const kind = pickKind(ch.rng, p, avail);
      if (kind && this.start(kind, ch, cands, now, groupOnly)) return true;
      return open ? this.join(open, ch, now) : false;
    }
    /** Atividade sozinho que usa o roteiro das rodas (o espelho). */
    startSolo(kind, ch, now) {
      if (!this.canJoin(ch, now)) return false;
      return this.start(kind, ch, [], now, false, 0);
    }
    /** Força uma roda (depuração). Usa `ids` (se vierem) como participantes. */
    force(kind, now, ids) {
      const pool = ids?.length ? ids.map((id) => this.sim.chars.get(id)).filter((c) => !!c) : [...this.sim.chars.values()];
      for (const c of pool) {
        if (c.gathering) this.sim.clearPlan(c);
        if ((c.mode === "idle" || c.mode === "shell") && !c.leaving && (c.step || c.queue.length)) this.sim.clearPlan(c);
      }
      const free = pool.filter((c) => !c.leaving && !c.gone && (c.mode === "idle" || c.mode === "shell") && c.homeSpot && c.atSpot === c.homeSpot && !c.step && !c.queue.length);
      if (!free.length) return null;
      const [host, ...rest] = free;
      const extra = kind === "mirror" ? Math.min(1, rest.length) : Math.min(rest.length, KINDS[kind].max - 1);
      const ok = this.start(kind, host, rest, now, false, Math.max(KINDS[kind].min - 1, Math.min(extra, kind === "tv" || kind === "kitchen" ? 3 : 1)), true);
      if (!ok) return null;
      const g = host.gathering;
      return g ? g.members.map((m) => this.sim.chars.get(m.id)?.info.name ?? m.id) : null;
    }
    start(kind, host, cands, now, groupOnly, wantOverride, forced = false) {
      const info = KINDS[kind];
      const rng = host.rng;
      const hp = personaFor(host.info.seed);
      let want;
      if (wantOverride !== void 0) want = wantOverride;
      else if (kind === "tv") want = 1 + Math.floor(rng() * 3);
      else if (kind === "kitchen") want = 1 + Math.floor(rng() * 2.4);
      else if (kind === "mirror") want = groupOnly ? 1 : cands.some((c) => hasTrait(personaFor(c.info.seed), "vaidade")) && rng() < 0.5 ? 1 : 0;
      else want = info.min - 1;
      if (wantOverride === void 0 && (kind === "pingpong" || kind === "videogame" || kind === "rps") && rng() < 0.3) want++;
      want = Math.max(0, Math.min(want, cands.length, info.max - 1));
      const ranked = cands.map((c) => {
        const cp = personaFor(c.info.seed);
        let s = partnerScore(kind, cp, bondBetween(host.info.seed, c.info.seed), rng);
        if (this.sim.longIdle(c, now)) s -= 1.5;
        if (kind === "mirror" && !hasTrait(cp, "vaidade")) s -= 2;
        return { c, s };
      }).sort((a, b) => b.s - a.s);
      let chosen = ranked.slice(0, want).map((x) => x.c);
      if (!forced) chosen = chosen.filter((c, i) => i < info.min - 1 || !this.sim.longIdle(c, now) || rng() < 0.35);
      if (chosen.length + 1 < (kind === "mirror" ? groupOnly ? 2 : 1 : info.min)) return false;
      const plan = this.plan(kind, chosen.length + 1, host);
      if (!plan) return false;
      const id = this.seq++;
      const g = {
        id,
        kind,
        host: host.id,
        members: [],
        phase: "gather",
        createdAt: now,
        startAt: 0,
        until: 0,
        nextAt: 0,
        step: 0,
        seed: (host.info.seed ^ Math.imul(id, 2654435761)) >>> 0,
        rng: mulberry32((host.info.seed ^ Math.imul(id, 2246822507)) >>> 0),
        program: kind === "tv" ? pickProgram(rng, hp) : null,
        bet: 0,
        score: [0, 0],
        gestures: null,
        ties: 0,
        rematches: 0,
        winner: null,
        loser: null,
        pool: [],
        lastLine: null,
        lastSpeaker: null,
        pending: []
      };
      const tag = ownerTag(g);
      for (const s of plan.pool) if (this.sim.spots.reserve(s.id, tag)) g.pool.push(s.id);
      const everyone = [host, ...chosen];
      const nPlayers = info.match ? 2 : everyone.length;
      everyone.forEach((c, i) => {
        const role = info.match ? i < nPlayers ? "player" : "watcher" : kind === "kitchen" || kind === "talk" ? "talker" : "player";
        const spot = plan.seats[i] ?? null;
        const m = this.member(c, role, spot);
        if (!spot && role === "watcher") m.tile = this.standNear(g, c) ?? void 0;
        g.members.push(m);
      });
      if (info.match) {
        const [a, b] = everyone;
        g.bet = betFor(kind, hp, personaFor(b.info.seed), this.wallets.coins(a.id), this.wallets.coins(b.id), bondBetween(a.info.seed, b.info.seed), g.rng);
      }
      this.gatherings.add(g);
      for (const m of g.members) this.dispatch(g, m, this.sim.chars.get(m.id), now);
      this.invite(g, host, chosen, now);
      return true;
    }
    member(c, role, spot) {
      return { id: c.id, role, spot: spot?.id ?? null, arrived: false, left: false, pose: "stand", held: "none", actPose: null, actHeld: "none", actUntil: 0, carry: "none" };
    }
    /** Convite (quem chamou) e o "bora!" de cada convidado, um pouco depois. */
    invite(g, host, guests, now) {
      const rng = g.rng;
      const hp = personaFor(host.info.seed);
      const first = guests[0];
      const vars = { nome: first?.info.name, v: g.bet };
      let pool = ACCEPT;
      let text = null;
      switch (g.kind) {
        case "tv":
          text = pick2(rng() < 0.5 ? INVITE.tv : INVITE[g.program ?? "futebol"], rng, vars);
          break;
        case "pingpong":
          text = pick2(first && bondBetween(host.info.seed, first.info.seed) === "rivalidade" ? INVITE.pingpongRival : INVITE.pingpong, rng, vars);
          break;
        case "kitchen":
          text = pick2(hasTrait(hp, "fofoca") ? INVITE.kitchenGossip : INVITE.kitchen, rng, vars);
          break;
        case "rps":
          text = pick2(g.bet ? INVITE.rps : INVITE.rpsHonor, rng, vars);
          pool = g.bet ? first && hasTrait(personaFor(first.info.seed), "economia") ? ACCEPT_STINGY : ACCEPT_BET : ACCEPT_BROKE;
          break;
        case "mirror":
          text = guests.length ? pick2(INVITE.mirror, rng, vars) : null;
          break;
        default:
          text = pick2(INVITE[g.kind], rng, vars);
      }
      if (text) this.say(host, text, now);
      guests.forEach((c, i) => {
        const sleepy = this.sim.longIdle(c, now);
        const p = sleepy ? ACCEPT_SLEEPY : c.mode === "shell" && g.kind !== "rps" ? ACCEPT_SHELL : pool;
        g.pending.push({ id: c.id, at: now + 900 + i * 650, text: pick2(p, rng) });
      });
    }
    /** Coloca o personagem a caminho do seu lugar na roda (e de volta à mesa no fim). */
    dispatch(g, m, ch, now) {
      const sim = this.sim;
      ch.gathering = g;
      ch.nextSocialAt = 0;
      if (ch.icon === "zzz") ch.setIcon(null, 0, now);
      const steps = [];
      if (ch.atSpot) steps.push({ t: "exit" });
      let held = "none";
      if (g.kind === "kitchen") {
        const kind = hasTrait(personaFor(ch.info.seed), "cafeina") || ch.rng() < 0.65 ? "coffee" : "water";
        const stop = sim.spots.findFree(kind, { by: ch.id, rng: ch.rng }) ?? sim.spots.findFree(kind === "coffee" ? "water" : "coffee", { by: ch.id, rng: ch.rng });
        if (stop && ch.rng() < 0.8 && sim.reserveTemp(ch, stop)) {
          const coffee = stop.kind === "coffee";
          steps.push(
            { t: "go", tx: stop.tx, ty: stop.ty, fx: stop.x, fy: stop.y, dir: stop.dir },
            { t: "act", pose: "use", ms: coffee ? 1500 : 900, machine: coffee ? stop.furnitureId : void 0, icon: coffee ? "coffee" : void 0 },
            { t: "do", fn: () => sim.spots.release(stop.id, ch.id) }
          );
          held = m.carry = coffee ? "coffee" : "water";
        }
      }
      const spot = m.spot ? sim.spots.get(m.spot) : void 0;
      if (spot?.seated) steps.push({ t: "go", tx: spot.tx, ty: spot.ty, held }, { t: "enter", spot: spot.id });
      else if (spot) steps.push({ t: "go", tx: spot.tx, ty: spot.ty, fx: spot.x, fy: spot.y, dir: spot.dir, held });
      else if (m.tile) steps.push({ t: "go", tx: m.tile.x, ty: m.tile.y, dir: m.tile.dir, held });
      steps.push({ t: "gather", g }, { t: "exit" }, { t: "do", fn: () => ch.gathering === g && (ch.gathering = null) });
      ch.queue.push(...steps);
      sim.pushHome(ch, m.carry);
      void now;
    }
    // =================================================================== rodas em andamento
    /** Roda em andamento que aceita mais um (TV, torcida do jogo, papo na copa), pelo gosto de `ch`. */
    joinable(ch, p) {
      let best = null;
      let bestScore = 0;
      for (const g of this.gatherings) {
        if (g.phase !== "run" && g.phase !== "gather") continue;
        if (g.kind === "talk" || g.kind === "arcade" || g.kind === "mirror") continue;
        if (active(g).length >= KINDS[g.kind].max) continue;
        if (this.openSpotFor(g, ch) === void 0) continue;
        let s = KINDS[g.kind].match ? 0.8 : 1;
        s *= g.kind === "tv" ? hasTrait(p, "series") ? 3 : 1.4 : g.kind === "kitchen" ? hasTrait(p, "fofoca") || hasTrait(p, "cafeina") ? 2.5 : 1 : hasTrait(p, "competicao") || hasTrait(p, "esporte") || hasTrait(p, "games") ? 2 : 1;
        for (const m of active(g)) {
          const o = this.sim.chars.get(m.id);
          const b = o ? bondBetween(ch.info.seed, o.info.seed) : null;
          if (b === "amizade") s += 0.8;
        }
        s *= 0.6 + ch.rng() * 0.8;
        if (s > bestScore) {
          bestScore = s;
          best = g;
        }
      }
      return best;
    }
    /** Lugar livre para mais um na roda: spot do pool (TV, torcida, copa) ou tile em pé (jokenpô). undefined = não cabe. */
    openSpotFor(g, ch) {
      if (g.phase === "final" || g.phase === "ended") return void 0;
      if (g.kind === "talk" || g.kind === "arcade" || g.kind === "mirror") return void 0;
      if (active(g).length >= KINDS[g.kind].max) return void 0;
      const used = new Set(active(g).map((m) => m.spot));
      for (const id of g.pool) if (!used.has(id)) return this.sim.spots.get(id) ?? void 0;
      if (g.kind === "rps") return this.standNear(g, ch) ? null : void 0;
      return void 0;
    }
    join(g, ch, now) {
      const spot = this.openSpotFor(g, ch);
      if (spot === void 0) return false;
      const role = g.kind === "kitchen" ? "talker" : KINDS[g.kind].match ? "watcher" : "player";
      const m = this.member(ch, role, spot);
      m.late = true;
      if (!spot) {
        const t2 = this.standNear(g, ch);
        if (!t2) return false;
        m.tile = t2;
      }
      if (g.phase === "run") this.basePose(g, m, now);
      g.members.push(m);
      this.dispatch(g, m, ch, now);
      const line = g.kind === "tv" ? tr("Posso ver junto? \u{1F4FA}") : g.kind === "kitchen" ? tr("Tem lugar pra mais um? \u2615") : tr("Quem t\xE1 ganhando?");
      this.say(ch, line, now);
      return true;
    }
    /** Tile livre em pé perto dos jogadores (torcida do jokenpô), virado para eles. */
    standNear(g, ch) {
      const ps = g.members.filter((m) => m.role === "player" && !m.left);
      const spots = ps.map((m) => m.spot ? this.sim.spots.get(m.spot) : void 0).filter((s) => !!s);
      if (!spots.length) return null;
      const cx = spots.reduce((a, s) => a + s.tx, 0) / spots.length;
      const cy = spots.reduce((a, s) => a + s.ty, 0) / spots.length;
      const grid = this.sim.building.grid;
      const busy = this.sim.busyTiles(ch.id);
      const taken = new Set(g.members.filter((m) => m.tile && !m.left).map((m) => m.tile.y * grid.w + m.tile.x));
      let best = null;
      let bestD = Infinity;
      const rowCost = (dy) => dy === -1 ? 0 : dy === -2 ? 1.2 : dy === 1 ? 2.5 : dy === 0 ? 2 : 4;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 3; dx++) {
          const x = Math.round(cx) + dx;
          const y = Math.round(cy) + dy;
          const k = y * grid.w + x;
          if (grid.get(x, y) !== FREE || busy.has(k) || taken.has(k)) continue;
          if (spots.some((s) => s.tx === x && s.ty === y)) continue;
          const hidden = spots.some((s) => s.tx === x && s.ty === y + 1);
          const d = Math.abs(x + 0.5 - cx) + rowCost(dy) + (hidden ? 3 : 0);
          if (d >= bestD) continue;
          bestD = d;
          best = { x, y };
        }
      }
      if (!best) return null;
      return { ...best, dir: facing(best.x * TILE, best.y * TILE, cx * TILE, cy * TILE) };
    }
    // =================================================================== lugares de cada roda
    /** Lugares para `n` participantes da roda (null = não há lugar livre agora). */
    plan(kind, n, ch) {
      const spots = this.sim.spots;
      const free = (s) => spots.isFree(s.id, ch.id) && !this.inPool(s.id);
      switch (kind) {
        case "tv":
        case "videogame": {
          if (this.tvBusy()) return null;
          const seats = [...spots.ofKind("sofa"), ...spots.ofKind("armchair")].filter((s) => s.areaId === LOUNGE_ID && free(s));
          const sofa2 = seats.filter((s) => s.kind === "sofa").sort((a, b) => a.tx - b.tx);
          const chairs = seats.filter((s) => s.kind !== "sofa");
          if (kind === "videogame") {
            for (let i = 0; i + 1 < sofa2.length; i++) {
              if (sofa2[i + 1].tx !== sofa2[i].tx + 1) continue;
              const pair = [sofa2[i], sofa2[i + 1]];
              const rest = [...sofa2.filter((s) => !pair.includes(s)), ...chairs];
              if (n > 2 + rest.length) return null;
              return { seats: [...pair, ...rest.slice(0, n - 2)], pool: [...pair, ...rest] };
            }
            return null;
          }
          const order = [...sofa2, ...chairs];
          if (order.length < n) return null;
          return { seats: order.slice(0, n), pool: order };
        }
        case "arcade": {
          const a = spots.ofKind("arcade").filter(free);
          return a.length >= 2 && n <= 2 ? { seats: a.slice(0, 2), pool: a.slice(0, 2) } : null;
        }
        case "pingpong": {
          const g = spots.findFreeGroup("pingpong", { filter: (grp) => grp.every(free) });
          if (!g) return null;
          const watch = spots.ofKind("watch").filter(free);
          if (n > 2 + watch.length) return null;
          return { seats: [...g, ...watch].slice(0, n), pool: [...g, ...watch] };
        }
        case "talk":
        case "rps": {
          const g = spots.findFreeGroup("talk", { rng: ch.rng, filter: (grp) => grp.every(free) });
          if (!g) return null;
          return { seats: [...g], pool: [...g] };
        }
        case "kitchen":
          return this.kitchenSeats(n, free, ch.rng);
        case "mirror": {
          const sinks = spots.ofKind("sink").filter((s) => s.areaId === RESTROOM_ID && free(s)).sort((a, b) => a.tx - b.tx);
          if (n === 1) return sinks.length ? { seats: [sinks[Math.floor(ch.rng() * sinks.length)]], pool: [] } : null;
          for (let i = 0; i + 1 < sinks.length; i++) if (sinks[i + 1].tx === sinks[i].tx + 1) return { seats: [sinks[i], sinks[i + 1]], pool: [] };
          return null;
        }
      }
    }
    /**
     * Mesa da copa: pares de cadeiras frente a frente (mesa comprida: norte/sul; mesinhas: oeste/leste).
     * Para 3–4, dois pares vizinhos da mesa comprida.
     */
    kitchenSeats(n, free, rng) {
      const seats = this.sim.spots.ofKind("cafe_seat").filter((s) => s.areaId === CAFE_ID);
      const at = (x, y, dir) => seats.find((s) => s.tx === x && s.ty === y && s.dir === dir);
      const pairs = [];
      for (const s of seats) {
        if (s.dir === "down") {
          const o = at(s.tx, s.ty + 3, "up");
          if (o) pairs.push([s, o]);
        } else if (s.dir === "right") {
          const o = at(s.tx + 2, s.ty, "left");
          if (o) pairs.push([s, o]);
        }
      }
      const freePairs = pairs.filter((p) => p.every(free));
      if (!freePairs.length) return null;
      if (n <= 2) {
        const p = freePairs[Math.floor(rng() * freePairs.length)];
        return { seats: p, pool: p };
      }
      const blocks = [];
      for (const a of freePairs) {
        if (a[0].dir !== "down") continue;
        const b = freePairs.find((p) => p[0].dir === "down" && p[0].tx === a[0].tx + 1);
        if (b) blocks.push([a[0], b[0], a[1], b[1]]);
      }
      if (!blocks.length) return null;
      const blk = blocks[Math.floor(rng() * blocks.length)];
      const order = [blk[0], blk[2], blk[1], blk[3]];
      return { seats: order.slice(0, n), pool: order };
    }
    inPool(id) {
      const owner = this.sim.spots.ownerOf(id);
      return !!owner && owner.startsWith("g:");
    }
    /** A TV do lounge está ocupada (programa ou videogame). */
    tvBusy() {
      for (const g of this.gatherings) if ((g.kind === "tv" || g.kind === "videogame") && g.phase !== "ended") return true;
      return false;
    }
    /** O que a TV do lounge mostra agora (null = programação normal). */
    tvScreen() {
      for (const g of this.gatherings) {
        if (g.phase !== "run" && g.phase !== "final") continue;
        if (g.kind === "tv") return { mode: "show", seed: PROGRAM_SEED[g.program ?? "futebol"] };
        if (g.kind === "videogame") return { mode: "game", seed: g.seed };
      }
      return null;
    }
    /** Partida no fliperama em andamento (as telas mostram o jogo). */
    arcadeSeed() {
      for (const g of this.gatherings) if (g.kind === "arcade" && (g.phase === "run" || g.phase === "final")) return g.seed;
      return null;
    }
    // =================================================================== passo 'gather' (por personagem)
    /** Pose do participante enquanto a roda dura. Retorna true quando ele deve sair (roda acabou). */
    stepGather(ch, g, now) {
      const m = g.members.find((x) => x.id === ch.id);
      if (!m || m.left || g.phase === "ended") return true;
      if (!m.arrived) m.arrived = true;
      const spot = m.spot ? this.sim.spots.get(m.spot) : void 0;
      if (m.actPose && now < m.actUntil) ch.setPose(m.actPose, m.actHeld);
      else if (g.phase === "gather") ch.setPose(ch.seated ? "sit" : "stand", m.carry === "none" ? "none" : m.carry);
      else ch.setPose(m.pose, m.held);
      const dir = m.tile?.dir ?? spot?.dir;
      if (dir) ch.dir = dir;
      return false;
    }
    // =================================================================== saída de alguém
    /** O plano de `ch` foi descartado (trabalho chamou, foi embora...): sai da roda. */
    leave(ch, now) {
      const g = ch.gathering;
      ch.gathering = null;
      if (!g || g.phase === "ended") return;
      const m = g.members.find((x) => x.id === ch.id);
      if (!m || m.left) return;
      m.left = true;
      g.pending = g.pending.filter((p) => p.id !== ch.id);
      const rest = active(g);
      if (!rest.length) return this.end(g, now);
      if (g.phase === "gather") {
        const need = KINDS[g.kind].match ? 2 : g.kind === "mirror" ? 1 : KINDS[g.kind].min;
        const left = KINDS[g.kind].match ? players(g).length : rest.length;
        if (left < need) this.end(g, now);
        return;
      }
      if (g.phase !== "run") return;
      if (KINDS[g.kind].match && m.role === "player") {
        const other = players(g)[0];
        const oc = other ? this.sim.chars.get(other.id) : void 0;
        if (oc) {
          this.say(oc, tr("Ganhei por W.O.! \u{1F60E}"), now);
          this.act(other, "cheer", "none", 1600, now);
        }
        g.phase = "final";
        g.until = now + 1800;
        return;
      }
      if (rest.length < Math.max(1, KINDS[g.kind].min) || g.kind !== "tv" && rest.length < 2 && g.kind !== "mirror") {
        g.until = Math.min(g.until || now + 4e3, now + 4e3);
        if (g.kind !== "tv") {
          g.phase = "final";
          g.until = now + 1200;
        }
      }
    }
    /** Saindo da roda porque o trabalho chamou (ou o shell terminou): avisa a turma. */
    calledAway(ch, prevMode, now) {
      if (!ch.gathering) return;
      this.say(ch, pick2(prevMode === "shell" ? SHELL_DONE : CALLED, ch.rng), now);
    }
    end(g, now) {
      if (g.phase === "ended") return;
      g.phase = "ended";
      const tag = ownerTag(g);
      for (const id of g.pool) this.sim.spots.release(id, tag);
      g.pool.length = 0;
      for (const m of g.members) {
        if (m.left || m.arrived) continue;
        const c = this.sim.chars.get(m.id);
        if (c && c.gathering === g) this.sim.clearPlan(c);
      }
      void now;
    }
    /** Encerra tudo (aba volta do segundo plano). */
    reset(now) {
      for (const g of this.gatherings) this.end(g, now);
      this.gatherings.clear();
      for (const c of this.sim.chars.values()) c.gathering = null;
      this.floaters.length = 0;
    }
    // =================================================================== diretor (por quadro)
    update(now) {
      for (const g of this.gatherings) {
        if (g.phase === "ended") continue;
        if (g.pending.length) this.flushPending(g, now);
        if (g.phase === "gather") {
          this.checkStart(g, now);
          continue;
        }
        if (g.phase === "final") {
          if (now >= g.until) this.end(g, now);
          continue;
        }
        if (now >= g.nextAt) this.beat(g, now);
      }
      if (this.floaters.length) {
        let n = 0;
        for (const f of this.floaters) if (now < f.until) this.floaters[n++] = f;
        this.floaters.length = n;
      }
    }
    /** Baixa frequência: limpa rodas encerradas e grava as carteiras. */
    housekeeping(now) {
      for (const g of this.gatherings) if (g.phase === "ended") this.gatherings.delete(g);
      if (now >= this.nextSaveAt) {
        this.nextSaveAt = now + 5e3;
        this.wallets.save(now);
      }
    }
    flushPending(g, now) {
      let n = 0;
      for (const p of g.pending) {
        if (now < p.at) {
          g.pending[n++] = p;
          continue;
        }
        const c = this.sim.chars.get(p.id);
        if (c) this.say(c, p.text, now);
      }
      g.pending.length = n;
    }
    checkStart(g, now) {
      const need = g.members.filter((m) => !m.left && m.role !== "watcher" && !m.late);
      const ready = need.filter((m) => m.arrived);
      const min = g.kind === "mirror" ? 1 : KINDS[g.kind].min;
      if (ready.length === need.length && ready.length >= min) return this.begin(g, now);
      if (now - g.createdAt < GATHER_TIMEOUT_MS) return;
      if (!KINDS[g.kind].match && ready.length >= min) {
        for (const m of need) if (!m.arrived) this.dropMember(g, m);
        return this.begin(g, now);
      }
      this.end(g, now);
    }
    dropMember(g, m) {
      m.left = true;
      const c = this.sim.chars.get(m.id);
      if (c && c.gathering === g) this.sim.clearPlan(c);
    }
    begin(g, now) {
      g.phase = "run";
      g.startAt = now;
      g.nextAt = now + 900;
      const rng = g.rng;
      for (const m of active(g)) this.basePose(g, m, now);
      switch (g.kind) {
        case "tv":
          g.until = now + between(rng, 3e4, 65e3);
          g.nextAt = now + 1500;
          break;
        case "kitchen":
          g.until = now + between(rng, 24e3, 45e3);
          g.nextAt = now + 500;
          break;
        case "talk":
          g.until = now + between(rng, 1e4, 18e3);
          g.nextAt = now + 400;
          break;
        case "mirror":
          g.until = now + between(rng, 6e3, 11e3);
          g.nextAt = now + between(rng, 2e3, 3500);
          break;
        case "videogame":
        case "arcade":
          g.until = now + between(rng, 7e3, 1e4);
          g.nextAt = now + 1200;
          break;
        case "pingpong":
          g.nextAt = now + between(rng, 1800, 3e3);
          break;
        case "rps":
          g.nextAt = now + 600;
          break;
      }
    }
    /** Pose de base de cada um enquanto a roda rola. */
    basePose(g, m, now) {
      const rng = g.rng;
      const c = this.sim.chars.get(m.id);
      const p = c ? personaFor(c.info.seed) : null;
      switch (g.kind) {
        case "tv":
          if (p && (hasTrait(p, "series") || hasTrait(p, "sonecas") || rng() < 0.3)) [m.pose, m.held] = ["wait", "popcorn"];
          else [m.pose, m.held] = ["sit", "none"];
          break;
        case "videogame":
          [m.pose, m.held] = m.role === "player" ? ["game", "controller"] : ["sit", "none"];
          break;
        case "arcade":
          [m.pose, m.held] = ["use", "none"];
          break;
        case "pingpong":
          [m.pose, m.held] = m.role === "player" ? ["play", "paddle"] : ["stand", "none"];
          break;
        case "kitchen":
          [m.pose, m.held] = ["sit", m.carry === "none" ? "none" : m.carry];
          break;
        case "mirror":
          [m.pose, m.held] = ["groom", rng() < 0.5 ? "lipstick" : "comb"];
          break;
        default:
          [m.pose, m.held] = ["stand", "none"];
      }
      void now;
    }
    // =================================================================== roteiros
    beat(g, now) {
      switch (g.kind) {
        case "tv":
          return this.beatTv(g, now);
        case "videogame":
        case "arcade":
          return this.beatGame(g, now);
        case "pingpong":
          return this.beatPingPong(g, now);
        case "kitchen":
        case "talk":
          return this.beatChat(g, now);
        case "rps":
          return this.beatRps(g, now);
        case "mirror":
          return this.beatMirror(g, now);
      }
    }
    beatTv(g, now) {
      const rng = g.rng;
      const ms = active(g);
      if (now >= g.until) {
        const c = this.charOf(this.randomOf(ms, rng));
        if (c) this.say(c, pick2(TV.end, rng), now);
        g.phase = "final";
        g.until = now + 1400;
        return;
      }
      g.nextAt = now + between(rng, 3500, 6500);
      for (const m of ms) {
        const c = this.charOf(m);
        if (c && m.pose !== "sleep" && hasTrait(personaFor(c.info.seed), "sonecas") && now - g.startAt > (g.until - g.startAt) * 0.5) {
          [m.pose, m.held] = ["sleep", "none"];
          c.setIcon("zzz", Math.max(1e3, g.until - now), now);
        }
      }
      const awake = ms.filter((m) => m.pose !== "sleep");
      if (!awake.length) return;
      const speaker = this.charOf(this.randomOf(awake, rng));
      const r = rng();
      switch (g.program) {
        case "futebol": {
          const lance = this.sim.footballLance(now);
          const goal = lance ? lance.progress >= lance.goalAt && g.step !== lance.lance : r < 0.25;
          if (lance) {
            const toGoal = (lance.goalAt - lance.progress + (lance.progress >= lance.goalAt ? 1 : 0)) * lance.period + 150;
            g.nextAt = Math.min(g.nextAt, now + toGoal);
          }
          if (goal && lance && !lance.right) {
            g.step = lance.lance;
            for (const m of awake) this.act(m, "sulk", "none", 1600, now);
            if (speaker) this.say(speaker, pick2(TV.futebol.against, rng), now);
          } else if (goal) {
            if (lance) g.step = lance.lance;
            for (const m of awake) this.act(m, "cheer", "none", 1900, now);
            if (speaker) this.say(speaker, pick2(TV.futebol.goal, rng), now);
            for (const m of awake) {
              const c = this.charOf(m);
              if (c && hasTrait(personaFor(c.info.seed), "esporte")) c.setIcon("star", 1600, now);
            }
          } else if (r < 0.3) {
            if (speaker) this.say(speaker, pick2(TV.futebol.miss, rng), now);
            for (const m of awake) if (this.charOf(m) !== speaker) this.emote(m, "\u{1F631}", now);
          } else if (speaker && r < 0.75) this.say(speaker, pick2(TV.futebol.talk, rng, {}, g.lastLine), now);
          break;
        }
        case "novela":
          if (r < 0.3) {
            if (speaker) this.say(speaker, pick2(TV.novela.twist, rng), now);
            for (const m of awake) if (this.charOf(m) !== speaker) this.emote(m, "\u{1F631}", now);
          } else if (r < 0.5) {
            if (speaker) this.say(speaker, pick2(TV.novela.love, rng), now);
            for (const m of awake) this.charOf(m)?.setIcon("heart", 1600, now);
          } else if (speaker) this.say(speaker, pick2(TV.novela.talk, rng, {}, g.lastLine), now);
          break;
        default:
          if (r < 0.45) {
            for (const m of awake) this.act(m, "laugh", "none", 1600, now);
            if (speaker) this.say(speaker, pick2(TV.desenho.funny, rng), now);
          } else if (speaker) this.say(speaker, pick2(TV.desenho.talk, rng, {}, g.lastLine), now);
      }
    }
    /** Videogame (melhor de 3, no sofá) e fliperama (uma partida, em pé). */
    beatGame(g, now) {
      const rng = g.rng;
      const ps = players(g);
      if (ps.length < 2) {
        g.phase = "final";
        g.until = now + 1e3;
        return;
      }
      if (now < g.until) {
        g.nextAt = now + between(rng, 2e3, 3400);
        const who = ps[g.step++ % 2];
        const c = this.charOf(who);
        if (c && rng() < 0.75) this.say(c, pick2(GAME.trash, rng, {}, g.lastLine), now);
        for (const w2 of active(g).filter((m) => m.role === "watcher")) {
          if (rng() < 0.35) {
            this.act(w2, "cheer", "none", 1300, now);
            const wc = this.charOf(w2);
            const fav = this.charOf(ps[Math.floor(rng() * 2)]);
            if (wc && fav && rng() < 0.6) this.say(wc, pick2(GAME.cheer, rng, { nome: fav.info.name }), now);
          }
        }
        return;
      }
      const [a, b] = ps;
      const ca = this.charOf(a);
      const cb = this.charOf(b);
      const pa = ca ? personaFor(ca.info.seed) : null;
      const pb = cb ? personaFor(cb.info.seed) : null;
      const aWins = rng() < winChance(pa?.skill ?? 0.5, pb?.skill ?? 0.5);
      const [w, l] = aWins ? [a, b] : [b, a];
      g.score[aWins ? 0 : 1]++;
      const target = TARGET[g.kind] ?? 1;
      if (Math.max(...g.score) >= target) return this.finishMatch(g, w, l, now);
      this.act(w, "cheer", g.kind === "videogame" ? "controller" : "none", 1500, now);
      this.act(l, "sulk", g.kind === "videogame" ? "controller" : "none", 1500, now);
      const cw = this.charOf(w);
      if (cw) this.say(cw, pick2(GAME.round, rng), now);
      g.until = now + 1500 + between(rng, 7e3, 1e4);
      g.nextAt = now + 1900;
    }
    beatPingPong(g, now) {
      const rng = g.rng;
      const ps = players(g);
      if (ps.length < 2) {
        g.phase = "final";
        g.until = now + 1e3;
        return;
      }
      g.nextAt = now + between(rng, 2200, 3800);
      const [a, b] = ps;
      const pa = this.charOf(a);
      const pb = this.charOf(b);
      const aWins = rng() < winChance(pa ? personaFor(pa.info.seed).skill : 0.5, pb ? personaFor(pb.info.seed).skill : 0.5);
      const i = aWins ? 0 : 1;
      g.score[i]++;
      const scorer = aWins ? a : b;
      const other = aWins ? b : a;
      if (g.score[i] >= (TARGET.pingpong ?? 5)) return this.finishMatch(g, scorer, other, now);
      const c = this.charOf(scorer);
      if (c && rng() < 0.6) {
        const mine = g.score[i];
        const theirs = g.score[1 - i];
        this.say(c, rng() < 0.5 ? `${mine} \xD7 ${theirs} \u{1F3D3}` : pick2(PINGPONG.point, rng, {}, g.lastLine), now);
      }
      for (const w of active(g).filter((m) => m.role === "watcher")) {
        if (rng() < 0.4) {
          this.act(w, "cheer", "none", 1200, now);
          const wc = this.charOf(w);
          if (wc && c && rng() < 0.4) this.say(wc, pick2(PINGPONG.cheer, rng, { nome: c.info.name }), now);
        }
      }
    }
    /** Fim de uma partida: comemoração, troféu, aposta paga, placar registrado. */
    finishMatch(g, w, l, now) {
      const rng = g.rng;
      const cw = this.charOf(w);
      const cl = this.charOf(l);
      g.winner = w.id;
      g.loser = l.id;
      const held = g.kind === "videogame" ? "controller" : g.kind === "pingpong" ? "paddle" : "none";
      this.act(w, "cheer", held, 3e3, now);
      this.act(l, "sulk", held === "paddle" ? "none" : held, 3e3, now);
      cw?.setIcon("trophy", 3e3, now);
      const [sa, sb] = g.score;
      const hi = Math.max(sa, sb);
      const lo = Math.min(sa, sb);
      if (cw) this.say(cw, g.kind === "pingpong" ? pick2(PINGPONG.final, rng, { a: hi, b: lo }) : pick2(GAME.round, rng), now);
      if (cl) g.pending.push({ id: cl.id, at: now + 1e3, text: pick2(RPS.lose, rng) });
      for (const m of active(g)) if (m.role === "watcher") this.act(m, rng() < 0.5 ? "cheer" : "laugh", "none", 1800, now);
      this.settle(g, w, l, now);
      g.phase = "final";
      g.until = now + 3400;
    }
    /** Paga a aposta (se houver), registra o placar e conta para a interface. */
    settle(g, w, l, now) {
      const cw = this.charOf(w);
      const cl = this.charOf(l);
      if (!cw || !cl) return;
      this.wallets.recordMatch(w.id, l.id);
      const what = MATCH_WHAT[g.kind] ?? tr("na aposta");
      const icon = KINDS[g.kind].emoji;
      const paid = g.bet ? this.wallets.transfer(l.id, w.id, g.bet, icon, what, now) : 0;
      if (paid) {
        this.float(cw, `+\u{1FA99}${paid}`, COIN_COLOR, now);
        this.float(cl, `\u2212\u{1FA99}${paid}`, LOSS_COLOR, now);
        this.sim.pushEffect({ kind: "coins", charId: cl.id, toId: cw.id, at: now });
      }
      const score = g.kind === "pingpong" || g.kind === "videogame" ? tr(" ({0} a {1})", [Math.max(...g.score), Math.min(...g.score)]) : "";
      this.event(g, icon, cw.id, paid ? tr("ganhou \u{1FA99}{0} de {1} {2}{3}", [paid, cl.info.name, what, score]) : tr("venceu {0} {1}{2}", [cl.info.name, what, score]), now);
    }
    beatChat(g, now) {
      const rng = g.rng;
      const ms = active(g);
      if (ms.length < 2 || now >= g.until) {
        g.phase = "final";
        g.until = now + 900;
        return;
      }
      g.nextAt = now + between(rng, 2400, 4200);
      const pool = ms.filter((m) => m.id !== g.lastSpeaker);
      let speaker = pool[0];
      let best = -1;
      for (const m of pool) {
        const c2 = this.charOf(m);
        const s = (c2 ? personaFor(c2.info.seed).sociability : 0.5) + rng();
        if (s > best) {
          best = s;
          speaker = m;
        }
      }
      const c = this.charOf(speaker);
      if (!c) return;
      const p = personaFor(c.info.seed);
      const { line, topic } = this.topicLine(g, c, p, now);
      g.lastSpeaker = speaker.id;
      this.act(speaker, "talk", speaker.pose === "sit" ? speaker.held : "none", 1700, now);
      this.say(c, line, now);
      const listeners = ms.filter((m) => m !== speaker);
      if (topic === "piadas") {
        for (const m of listeners) this.act(m, "laugh", "none", 1600, now);
        const lc = this.charOf(this.randomOf(listeners, rng));
        if (lc) g.pending.push({ id: lc.id, at: now + 800, text: pick2(CHAT.laugh, rng) });
      } else if (topic === "fofoca") {
        for (const m of listeners) this.emote(m, "\u{1F440}", now + 300);
      } else if (rng() < 0.45) {
        const lc = this.charOf(this.randomOf(listeners, rng));
        if (lc) g.pending.push({ id: lc.id, at: now + 1100, text: pick2(CHAT.react, rng) });
      }
      for (const m of ms) if (m !== speaker && (m.held === "coffee" || m.held === "water") && rng() < 0.2) this.act(m, "drink", m.held, 1400, now);
    }
    /** Assunto da fala: o do traço de quem fala, o dia/hora, trabalho ou papo genérico. */
    topicLine(g, c, p, now) {
      const rng = g.rng;
      const vars = { nome: this.otherName(g, c, rng), sala: this.roomName(c, rng) };
      const r = rng();
      if (r < 0.12) {
        const t2 = timeLine(new Date(now));
        if (t2 && t2 !== g.lastLine) return { line: t2, topic: "time" };
      }
      if (r < 0.2) return { line: p.catchphrase, topic: "catch" };
      const topics = p.traits.map((t2) => TRAIT_TOPICS[t2]).filter((t2) => !!t2);
      let topic = topics.length && rng() < 0.65 ? topics[Math.floor(rng() * topics.length)] : rng() < 0.6 ? "work" : "generic";
      if (topic === "react" || topic === "laugh") topic = "generic";
      return { line: pick2(CHAT[topic], rng, vars, g.lastLine), topic };
    }
    beatRps(g, now) {
      const rng = g.rng;
      const ps = players(g);
      if (ps.length < 2) {
        g.phase = "final";
        g.until = now + 1e3;
        return;
      }
      const [a, b] = ps;
      const ca = this.charOf(a);
      const cb = this.charOf(b);
      if (!ca || !cb) return;
      if (g.step <= 2) {
        for (const m of ps) this.act(m, "rps", "none", 540, now);
        this.say(ca, RPS.count[g.step], now, 700);
        if (g.step === 0) for (const m of ps) this.emote(m, "\u270A", now);
        g.step++;
        g.nextAt = now + 540;
        return;
      }
      if (g.step === 3) {
        const ga = pickGesture(rng, personaFor(ca.info.seed));
        const gb = pickGesture(rng, personaFor(cb.info.seed));
        g.gestures = [ga, gb];
        this.act(a, "rps", ga, 2200, now);
        this.act(b, "rps", gb, 2200, now);
        ca.setIcon(GESTURE_ICON[ga], 2200, now);
        cb.setIcon(GESTURE_ICON[gb], 2200, now);
        g.step = 4;
        g.nextAt = now + 1500;
        return;
      }
      if (g.step === 4) {
        const res = rpsResult(g.gestures[0], g.gestures[1]);
        if (res === 0) {
          g.ties++;
          for (const m of ps) this.act(m, "laugh", "none", 1e3, now);
          if (g.ties >= 3) {
            this.say(ca, pick2(RPS.stalemate, rng), now);
            g.phase = "final";
            g.until = now + 1600;
            return;
          }
          this.say(this.charOf(ps[g.ties % 2]) ?? ca, pick2(RPS.tie, rng), now);
          g.step = 0;
          g.nextAt = now + 1400;
          return;
        }
        const [w, l] = res === 1 ? [a, b] : [b, a];
        const cw = this.charOf(w);
        const cl = this.charOf(l);
        this.act(w, "cheer", "none", 2600, now);
        this.act(l, "sulk", "none", 2600, now);
        cw.setIcon(g.bet ? "coin" : "trophy", 2600, now);
        this.say(cw, pick2(g.bet ? RPS.win : RPS.winHonor, rng), now);
        g.pending.push({ id: cl.id, at: now + 1e3, text: pick2(RPS.lose, rng) });
        for (const m of active(g)) if (m.role === "watcher") this.act(m, "laugh", "none", 1600, now);
        const watcher = active(g).find((m) => m.role === "watcher");
        const wc = watcher ? this.charOf(watcher) : void 0;
        if (wc) g.pending.push({ id: wc.id, at: now + 600, text: pick2(RPS.watch, rng) });
        this.settle(g, w, l, now);
        const lp = personaFor(cl.info.seed);
        const keen = hasTrait(lp, "competicao") || hasTrait(lp, "apostas");
        if (keen && g.rematches < 1 && rng() < 0.6 && (!g.bet || this.wallets.coins(cl.id) >= 1)) {
          g.rematches++;
          g.bet = g.bet ? Math.min(g.bet, this.wallets.coins(cl.id), this.wallets.coins(cw.id)) : 0;
          g.pending.push({ id: cl.id, at: now + 2200, text: pick2(RPS.rematch, rng) });
          g.step = 0;
          g.ties = 0;
          g.nextAt = now + 3400;
          return;
        }
        g.phase = "final";
        g.until = now + 2900;
      }
    }
    beatMirror(g, now) {
      const rng = g.rng;
      const ms = active(g);
      if (!ms.length) return;
      if (now >= g.until) {
        for (const m of ms) {
          const c = this.charOf(m);
          if (!c) continue;
          c.setIcon("sparkle", 1800, now);
          this.sim.pushEffect({ kind: "sparkle", charId: c.id, at: now });
          this.say(c, pick2(m.held === "lipstick" && rng() < 0.6 ? MIRROR.lipstick : MIRROR.solo, rng), now);
          this.act(m, "stand", "none", 2e3, now);
        }
        g.phase = "final";
        g.until = now + 1600;
        return;
      }
      g.nextAt = now + between(rng, 2600, 3600);
      if (ms.length > 1) {
        const c = this.charOf(ms[g.step++ % ms.length]);
        if (c) this.say(c, pick2(MIRROR.duo, rng, {}, g.lastLine), now);
      } else if (rng() < 0.3) {
        const c = this.charOf(ms[0]);
        if (c) this.emote(ms[0], rng() < 0.5 ? "\u{1F485}" : "\u2728", now);
      }
    }
    // =================================================================== dinheiro do trabalho
    /** Snapshot: garante a carteira e paga tarefas concluídas (com "+🪙" quando é ao vivo). */
    syncAgent(ch, a, now, live) {
      const { created } = this.wallets.ensure(a, now);
      if (created) return;
      const paid = this.wallets.payTasks(a, now);
      if (paid && live) this.earned(ch, paid, now);
    }
    /** Pedido do usuário atendido (fim de turno do principal). */
    turnDone(ch, now) {
      const v = this.wallets.credit(ch.id, TURN_REWARD, "\u{1F4AC}", tr("Pedido atendido"), now);
      if (v) this.earned(ch, v, now);
    }
    /** Subagente entregou o resultado: a tarefa dele está paga. */
    delivered(ch, now) {
      const v = this.wallets.credit(ch.id, DELIVERY_REWARD, "\u{1F4E6}", tr("Entregou: {0}", [ch.info.title ?? tr("resultado")]), now);
      if (v) this.earned(ch, v, now);
    }
    earned(ch, v, now) {
      this.float(ch, `+\u{1FA99}${v}`, COIN_COLOR, now);
      if (!ch.icon) ch.setIcon("coin", 1400, now);
    }
    // =================================================================== consulta (interface)
    /** "Vendo TV com Rafaela e Bia" — o que o agente está fazendo numa roda, se estiver. */
    doing(id) {
      const ch = this.sim.chars.get(id);
      const g = ch?.gathering;
      if (!g || g.phase === "ended") return null;
      const others = active(g).filter((m) => m.id !== id).map((m) => this.sim.chars.get(m.id)?.info.name).filter((n) => !!n);
      const label = g.kind === "tv" && g.program ? tr("Vendo {0} na TV", [g.program === "futebol" ? tr("futebol") : g.program === "novela" ? tr("novela") : tr("desenho")]) : KINDS[g.kind].label;
      const going = g.phase === "gather" ? tr(" (a caminho)") : "";
      const bet = g.bet && KINDS[g.kind].match ? tr(" \xB7 valendo \u{1FA99}{0}", [g.bet]) : "";
      return `${KINDS[g.kind].emoji} ${label}${others.length ? ` com ${joinNames(others)}` : ""}${bet}${going}`;
    }
    /** Tudo o que a interface mostra da vida social de um agente presente (null se não está no escritório). */
    info(id) {
      const ch = this.sim.chars.get(id);
      if (!ch) return null;
      const p = personaFor(ch.info.seed);
      const w = this.wallets.get(id);
      const bonds = [];
      for (const o of this.sim.chars.values()) {
        if (o === ch || o.leaving || o.gone) continue;
        const kind = bondBetween(ch.info.seed, o.info.seed);
        if (kind) bonds.push({ id: o.id, name: o.info.name, kind, record: w?.vs[o.id] ? [w.vs[o.id][0], w.vs[o.id][1]] : null });
      }
      bonds.sort((a, b) => a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "amizade" ? -1 : 1);
      return {
        traits: p.traits.map((t2) => ({ emoji: TRAITS[t2].emoji, label: TRAITS[t2].label, desc: TRAITS[t2].desc })),
        catchphrase: p.catchphrase,
        coins: w?.coins ?? 0,
        earned: w?.earned ?? 0,
        wins: w?.wins ?? 0,
        losses: w?.losses ?? 0,
        bonds,
        doing: this.doing(id),
        ledger: w ? w.ledger.map((e) => ({ ...e })) : []
      };
    }
    // =================================================================== utilidades
    say(ch, text, now, ms = SAY_MS) {
      ch.sayText = text;
      ch.sayAt = now;
      ch.sayUntil = now + ms;
      const g = ch.gathering;
      if (g) g.lastLine = text;
    }
    act(m, pose, held, ms, now) {
      m.actPose = pose;
      m.actHeld = held;
      m.actUntil = now + ms;
    }
    emote(m, emoji, now) {
      const c = this.charOf(m);
      if (!c || c.sayText && now < c.sayUntil) return;
      c.chatEmoji = emoji;
      c.chatUntil = now + 1300;
    }
    float(ch, text, color, now) {
      if (this.floaters.length >= MAX_FLOATERS) this.floaters.shift();
      this.floaters.push({ charId: ch.id, text, color, at: now, until: now + FLOATER_MS });
    }
    event(g, icon, agentId, text, now) {
      if (this.events.length >= MAX_EVENTS) this.events.shift();
      const first = g.members.find((m) => m.spot);
      const area = first?.spot ? this.sim.spots.get(first.spot)?.areaId : void 0;
      const place = area && (PLACES[area] ?? this.sim.rooms.get(area)?.info.name) || tr("Escrit\xF3rio");
      this.events.push({ id: `social:${g.id}:${++this.eventSeq}`, at: now, icon, agentId, text, place });
    }
    charOf(m) {
      return m ? this.sim.chars.get(m.id) : void 0;
    }
    randomOf(list, rng) {
      return list.length ? list[Math.floor(rng() * list.length) % list.length] : void 0;
    }
    /** Nome de um colega para a fofoca: de preferência alguém de fora da roda. */
    otherName(g, c, rng) {
      const inside = new Set(g.members.map((m) => m.id));
      const all = [...this.sim.chars.values()].filter((o) => o !== c && !o.leaving);
      const out = all.filter((o) => !inside.has(o.id));
      return this.randomOf(out.length ? out : all, rng)?.info.name;
    }
    roomName(c, rng) {
      const own = this.sim.rooms.get(c.roomId)?.info.name;
      if (own && rng() < 0.6) return own;
      const rooms = [...this.sim.rooms.values()].filter((r) => r.listed);
      return this.randomOf(rooms, rng)?.info.name ?? own;
    }
  };
  function joinNames(names) {
    if (names.length <= 1) return names[0] ?? "";
    if (names.length === 2) return `${names[0]} e ${names[1]}`;
    return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
  }

  // vendor/habblaud/upstream/client/src/world/sim/elevator.ts
  var DOOR_SPEED = 9;
  var HOLD_MS = 650;
  var ELEVATOR_STAGGER_MS = 520;
  var Elevator = class {
    constructor(index, spotId) {
      this.index = index;
      this.spotId = spotId;
    }
    /** Abertura contínua da porta, 0 (fechada) .. 4 (aberta). */
    door = 0;
    holdUntil = 0;
    users = /* @__PURE__ */ new Set();
    /** Próximo instante livre para alguém surgir (fila de chegada). */
    nextAppearAt = 0;
    request(id) {
      this.users.add(id);
    }
    release(id, now) {
      if (this.users.delete(id)) this.holdUntil = Math.max(this.holdUntil, now + HOLD_MS);
    }
    get load() {
      return this.users.size;
    }
    get isOpen() {
      return this.door >= 3.95;
    }
    get state() {
      return Math.max(0, Math.min(4, Math.round(this.door)));
    }
    update(dt, now) {
      const want = this.users.size > 0 || now < this.holdUntil;
      this.door = Math.max(0, Math.min(4, this.door + (want ? 1 : -1) * DOOR_SPEED * dt));
    }
    /** Reserva um horário para surgir dentro do elevador (escalonando chegadas simultâneas). */
    reserveAppear(now) {
      const at = Math.max(now, this.nextAppearAt);
      this.nextAppearAt = at + ELEVATOR_STAGGER_MS;
      return at;
    }
    reset() {
      this.users.clear();
      this.door = 0;
      this.holdUntil = 0;
      this.nextAppearAt = 0;
    }
  };

  // vendor/habblaud/upstream/client/src/world/sim/github.ts
  var PARTY_CHEER_MS = 2600;
  var SEAT_MS = 180;
  var CHEER_STAGGER_MS = 700;
  var CHEER_MIN_LEFT_MS = 3e3;
  var RoomFxState = class {
    active = /* @__PURE__ */ new Map();
    /**
     * Aplica os efeitos do snapshot. Relógios do servidor e do navegador podem divergir: o que vale é
     * quanto já passou e quanto falta segundo o próprio servidor (`serverTime`).
     */
    sync(rooms, serverTime, now) {
      const seen = /* @__PURE__ */ new Set();
      for (const r of rooms) {
        const e = r.effect;
        if (!e || e.until <= serverTime) continue;
        seen.add(r.id);
        const end = now + (e.until - serverTime);
        const cur = this.active.get(r.id);
        if (cur && cur.key === e.at && cur.kind === e.kind) {
          cur.end = end;
          cur.text = e.text;
          cur.agentId = e.agentId;
          continue;
        }
        const elapsed = Math.max(0, Math.min(serverTime - e.at, e.until - e.at));
        this.active.set(r.id, { roomId: r.id, kind: e.kind, text: e.text, agentId: e.agentId, key: e.at, start: now - elapsed, end, cheered: /* @__PURE__ */ new Set() });
      }
      for (const [id, fx] of [...this.active]) if (!seen.has(id) && !fx.sticky) this.active.delete(id);
    }
    /** Efeito visível da sala agora, se houver. */
    get(roomId, now) {
      const fx = this.active.get(roomId);
      return fx && now < fx.end ? fx : void 0;
    }
    /** Quem está com o alarme da própria sala ligado (o balão "!"): id do agente -> efeito. */
    alarmOwner(agentId, now) {
      for (const fx of this.active.values()) if (fx.kind === "alarm" && fx.agentId === agentId && now < fx.end) return fx;
      return void 0;
    }
    /** Esquece os vencidos e faz a sala comemorar as festas em andamento. */
    update(sim, now) {
      for (const [id, fx] of this.active) {
        if (now >= fx.end) {
          this.active.delete(id);
          continue;
        }
        if (fx.kind === "party" && fx.end - now >= CHEER_MIN_LEFT_MS) celebrate(sim, fx, now);
      }
    }
  };
  function cheerDelay(charId) {
    return hash32(charId) % CHEER_STAGGER_MS;
  }
  function celebrate(sim, fx, now) {
    const room = sim.rooms.get(fx.roomId);
    if (!room || !room.present) return;
    for (const ch of sim.chars.values()) {
      if (fx.cheered.has(ch.id) || !inParty(ch, fx.roomId, room.layout.rect, now)) continue;
      if (now - fx.start < cheerDelay(ch.id)) continue;
      fx.cheered.add(ch.id);
      const mine = ch.id === fx.agentId;
      if (mine) {
        ch.setIcon("star", PARTY_CHEER_MS, now);
        sim.pushEffect({ kind: "confetti", charId: ch.id, at: now });
      }
      const home = sim.spots.get(ch.homeSpot);
      if (home && ch.atSpot === home.id && !ch.step && !ch.queue.length && !ch.gathering) {
        ch.reactUntil = now + PARTY_CHEER_MS + 2 * SEAT_MS + 200;
        if (home.seated) ch.queue.push({ t: "exit" });
        ch.queue.push({ t: "act", pose: "cheer", ms: PARTY_CHEER_MS });
        if (home.seated) ch.queue.push({ t: "enter", spot: home.id });
      } else if (!mine) {
        ch.chatEmoji = "\u{1F389}";
        ch.chatUntil = now + 2400;
      }
    }
  }
  function inParty(ch, roomId, rect, now) {
    if (ch.gone || ch.leaving || ch.inside || ch.arriving || ch.alpha < 0.5 || now < ch.hiddenUntil) return false;
    if (ch.mode === "wait" || ch.mode === "leave" || ch.mode === "deliver") return false;
    return ch.roomId === roomId || inRect(rect, ch.tx, ch.ty);
  }

  // vendor/habblaud/upstream/client/src/world/sim/room-state.ts
  var RoomState = class {
    info;
    /** Semente com que o tema e o layout foram gerados (fixa desde a criação, mesmo se info.seed mudar). */
    seed;
    /** Vaga no prédio escolhida pelo cliente (sem buracos; ver Sim.compact). Pode diferir de info.slot. */
    slot;
    theme;
    layout;
    phase;
    phaseAt;
    listed = true;
    unlistedAt = 0;
    lightOn;
    lightAt = -1e9;
    /** Personagem que se encarregou do interruptor (acender ao chegar / apagar ao sair). */
    switchClaim = null;
    /** Quando todas as condições de desmontagem ficaram verdadeiras (0 = não estão). */
    readyToDismantleAt = 0;
    /** Contas presentes (para as bolinhas da placa), atualizadas pelo mundo. */
    accounts = [];
    /** Itens do quadro kanban. */
    board = [];
    /** Incrementa quando algo do cache estático muda (nome, tema). */
    version = 0;
    /**
     * Endereço antigo de uma sala que se mudou: fica no lugar só até quem estava nela sair, apagar
     * e ser desmontado. Ninguém pertence a ela e ela não aparece no snapshot.
     */
    ghost = false;
    constructor(info, theme, layout, phase, now, lit, slot) {
      this.info = info;
      this.seed = info.seed;
      this.slot = slot;
      this.theme = theme;
      this.layout = layout;
      this.phase = phase;
      this.phaseAt = now;
      this.lightOn = lit;
      if (lit) this.lightAt = now - 1e4;
    }
    get id() {
      return this.info.id;
    }
    /** Progresso da animação da fase atual (0..1). */
    progress(now) {
      if (this.phase === "building") return Math.min(1, (now - this.phaseAt) / BUILD_MS);
      if (this.phase === "dismantling") return Math.min(1, (now - this.phaseAt) / DISMANTLE_MS);
      if (this.phase === "ready") return 1;
      return 0;
    }
    /** Ocupa a grade (caminhável) e é desenhada. */
    get present() {
      return this.phase === "building" || this.phase === "ready" || this.phase === "dismantling";
    }
    setPhase(phase, now) {
      this.phase = phase;
      this.phaseAt = now;
    }
    /** Reverte uma desmontagem em andamento para construção, continuando do ponto visual equivalente. */
    rebuild(now) {
      if (this.phase === "dismantling") {
        const p = this.progress(now);
        this.phase = "building";
        this.phaseAt = now - (1 - p) * BUILD_MS;
      } else if (this.phase === "gone") {
        this.setPhase("building", now);
      }
    }
    setLight(on, now) {
      if (this.lightOn === on) return;
      this.lightOn = on;
      this.lightAt = now;
    }
    light(now) {
      return lightLevel(this.lightOn, now - this.lightAt);
    }
  };

  // vendor/habblaud/upstream/client/src/world/sim/spots.ts
  var SpotRegistry = class {
    spots = /* @__PURE__ */ new Map();
    owners = /* @__PURE__ */ new Map();
    byKind = /* @__PURE__ */ new Map();
    byGroup = /* @__PURE__ */ new Map();
    /** Substitui o conjunto de spots mantendo as reservas dos que continuam existindo. Retorna as reservas perdidas. */
    setSpots(spots) {
      this.spots.clear();
      this.byKind.clear();
      this.byGroup.clear();
      for (const s of spots) {
        this.spots.set(s.id, s);
        let list = this.byKind.get(s.kind);
        if (!list) this.byKind.set(s.kind, list = []);
        list.push(s);
        if (s.group) {
          let g = this.byGroup.get(s.group);
          if (!g) this.byGroup.set(s.group, g = []);
          g.push(s);
        }
      }
      const lost = [];
      for (const [spotId, owner] of this.owners) {
        if (!this.spots.has(spotId)) {
          lost.push({ spotId, owner });
          this.owners.delete(spotId);
        }
      }
      return lost;
    }
    get(id) {
      return id ? this.spots.get(id) : void 0;
    }
    all() {
      return this.spots.values();
    }
    ofKind(kind) {
      return this.byKind.get(kind) ?? [];
    }
    group(group) {
      return this.byGroup.get(group) ?? [];
    }
    ownerOf(id) {
      return this.owners.get(id);
    }
    isFree(id, by) {
      const o = this.owners.get(id);
      return o === void 0 || o === by;
    }
    reserve(id, by) {
      if (!this.spots.has(id) || !this.isFree(id, by)) return false;
      this.owners.set(id, by);
      return true;
    }
    release(id, by) {
      if (id && this.owners.get(id) === by) this.owners.delete(id);
    }
    releaseAll(by) {
      for (const [id, o] of this.owners) if (o === by) this.owners.delete(id);
    }
    /** Spots reservados por alguém. */
    reservedBy(by) {
      const out = [];
      for (const [id, o] of this.owners) if (o === by) out.push(id);
      return out;
    }
    /**
     * Spot livre de um tipo, o mais próximo de `near` (distância Manhattan em tiles), opcionalmente
     * filtrado. Com `rng`, sorteia entre os 3 mais próximos para variar o destino.
     */
    findFree(kind, opts = {}) {
      const list = this.byKind.get(kind);
      if (!list) return null;
      const cands = [];
      for (const s of list) {
        if (!this.isFree(s.id, opts.by)) continue;
        if (opts.filter && !opts.filter(s)) continue;
        const d = opts.near ? Math.abs(s.tx - opts.near.tx) + Math.abs(s.ty - opts.near.ty) : 0;
        cands.push({ s, d });
      }
      if (!cands.length) return null;
      cands.sort((a, b) => a.d - b.d);
      if (opts.rng) return cands[Math.floor(opts.rng() * Math.min(3, cands.length))].s;
      return cands[0].s;
    }
    /** Grupo (par) totalmente livre de um tipo: retorna os spots do grupo. */
    findFreeGroup(kind, opts = {}) {
      const groups = [];
      const seen = /* @__PURE__ */ new Set();
      for (const s of this.byKind.get(kind) ?? []) {
        if (!s.group || seen.has(s.group)) continue;
        seen.add(s.group);
        const g = this.group(s.group);
        if (g.length < 2 || !g.every((x) => this.isFree(x.id))) continue;
        if (opts.filter && !opts.filter(g)) continue;
        groups.push(g);
      }
      if (!groups.length) return null;
      return groups[Math.floor((opts.rng ?? Math.random)() * groups.length)];
    }
  };

  // vendor/habblaud/upstream/client/src/world/sim/visitor.ts
  var VISITOR_ID = "visita:eu";
  var VISITOR_LANYARD = "#ff8a3d";
  var EXIT_RADIUS = 1.6;
  var NO_INTENT = { dx: 0, dy: 0, run: false };
  function visitorInfo(me, now) {
    return {
      id: VISITOR_ID,
      kind: "main",
      provider: "claude",
      roomId: RECEPTION_ID,
      name: me.name,
      look: me.look,
      ...me.parts && Object.keys(me.parts).length ? { parts: me.parts } : {},
      role: tr("Visitante"),
      sessionId: VISITOR_ID,
      account: "",
      status: "idle",
      recent: [],
      tasks: [],
      startedAt: now,
      lastEventAt: now,
      statusSince: now,
      stats: { toolCalls: 0, tokensIn: 0, tokensOut: 0, subagents: 0 },
      seed: hash32(`${VISITOR_ID}:${me.name}`)
    };
  }
  function tileAt(x, y) {
    return { x: Math.floor(x / TILE), y: Math.floor(y / TILE) };
  }
  var HALF_W = 4;
  var UP = 4;
  var DOWN = 2;
  function canStand(grid, x, y) {
    for (const [ox, oy] of [
      [-HALF_W, -UP],
      [HALF_W, -UP],
      [-HALF_W, DOWN],
      [HALF_W, DOWN]
    ]) {
      const t2 = tileAt(x + ox, y + oy);
      const c = grid.get(t2.x, t2.y);
      if (c === BLOCKED || c === SEAT) return false;
    }
    return true;
  }
  function stepFree(grid, pos, intent, dist) {
    let { dx, dy } = intent;
    dx = Math.sign(dx);
    dy = Math.sign(dy);
    if (!dx && !dy) return { ...pos, moved: false };
    const k = dx && dy ? Math.SQRT1_2 : 1;
    let { x, y } = pos;
    let moved = false;
    if (dx) {
      const nx = x + dx * dist * k;
      if (canStand(grid, nx, y)) {
        x = nx;
        moved = true;
      }
    }
    if (dy) {
      const ny = y + dy * dist * k;
      if (canStand(grid, x, ny)) {
        y = ny;
        moved = true;
      }
    }
    return { x, y, dir: dirOf(dx, dy, pos.dir), moved };
  }

  // vendor/habblaud/upstream/client/src/world/sim/sim.ts
  var CHEER_MS = 2200;
  var SULK_MS = 4e3;
  var MAX_EFFECTS = 32;
  var GHOST_OWNER = "@mudan\xE7a";
  var FALLBACK_THEME = {
    carpet: "#5b7fa6",
    carpet2: "#4f7093",
    wall: { base: "#e7e3db", trim: "#9b9184", pattern: "plain" },
    accent: "#3f7fd8",
    deskVariant: "wood",
    chairVariant: "black"
  };
  var LOUNGE_SEATS = ["sofa", "armchair", "beanbag"];
  var PHONE_SEATS = ["beanbag", "sofa", "armchair", "cafe_seat", "bench"];
  var INITIAL_LOUNGE_SEATS = ["sofa", "armchair", "beanbag", "cafe_seat"];
  var INITIAL_LOUNGE_SHARE = 0.15;
  var INITIAL_LOUNGE_MIN_IDLE_MS = 9e4;
  var INITIAL_OUTING_DELAY_MS = 5e3;
  var ENTER_MS = 180;
  function between2(rng, a, b) {
    return a + rng() * (b - a);
  }
  var lookSig = (a) => `${a.seed}|${a.look}|${partsKey(a.parts)}`;
  var Sim = class {
    /** `storage` das carteiras: null = só em memória (o timelapse não mexe nas moedinhas de verdade). */
    constructor(art2, options, storage = browserStorage(), mode = {}) {
      this.art = art2;
      this.options = options;
      this.visit = !!mode.visit;
      this.social = new Social(this, storage);
      this.building = assembleBuilding(columnsFor([]), [], 0);
      this.finder = new PathFinder(this.building.grid);
      this.spots.setSpots(this.building.spots);
      for (const s of this.spots.ofKind("elevator")) this.elevators.push(new Elevator(this.elevators.length, s.id));
    }
    chars = /* @__PURE__ */ new Map();
    rooms = /* @__PURE__ */ new Map();
    spots = new SpotRegistry();
    elevators = [];
    building;
    finder;
    /** Incrementa quando o prédio muda (salas surgem/somem, largura). */
    layoutVersion = 0;
    now = 0;
    initialized = false;
    /** furnitureId -> até quando a máquina está em uso (cafeteira passando café). */
    machineUntil = /* @__PURE__ */ new Map();
    /** Cabines ocupadas (furnitureId). */
    stallBusy = /* @__PURE__ */ new Set();
    /** Vida social: rodas dos ociosos, personalidades e carteiras (social/social.ts). */
    social;
    /** Depuração: agentes forçados a encerrar e salas forçadas a sumir do snapshot. */
    forcedOffline = /* @__PURE__ */ new Set();
    hiddenRooms = /* @__PURE__ */ new Set();
    /** Contas do snapshot (id -> cor/letra/ferramenta) para etiquetas: a do Codex ganha chip vazado e o selo. */
    accounts = /* @__PURE__ */ new Map();
    /** Depuração: salas/agentes extras mesclados a cada snapshot (sessões simuladas). */
    injected = { rooms: [], agents: [] };
    /** Depuração: campos sobrepostos a agentes reais do snapshot (ex.: shells forçados). */
    agentPatches = /* @__PURE__ */ new Map();
    /** Efeitos pontuais (confete) para o render desenhar; o render esvazia a lista. */
    effects = [];
    /** Festa e alarme das salas (eventos do GitHub; sim/github.ts). */
    roomFx = new RoomFxState();
    lastSnapshot = null;
    /** Desde quando há uma vaga livre antes da última sala (0 = não há). */
    gapSince = 0;
    moveSeq = 0;
    shrinkPending = false;
    nextHousekeeping = 0;
    /** Visita a um prédio do mundo (SimMode.visit). */
    visit;
    /** Visita: o meu personagem (fora de `chars`: nem snapshot, nem vida social, nem lugar reservado). */
    visitor = null;
    /** Visita: para onde o teclado manda o visitante. */
    visitorIntent = { ...NO_INTENT };
    /** Visita: as luzes do prédio (aplicadas a cada snapshot e a cada segundo). */
    visitLight = "live";
    // =================================================================== snapshot
    applySnapshot(input, now) {
      let snap = this.injected.rooms.length || this.injected.agents.length ? { ...input, rooms: [...input.rooms, ...this.injected.rooms], agents: [...input.agents, ...this.injected.agents] } : input;
      if (this.agentPatches.size) {
        const patches = this.agentPatches;
        snap = { ...snap, agents: snap.agents.map((a) => patches.has(a.id) ? { ...a, ...patches.get(a.id) } : a) };
      }
      this.lastSnapshot = input;
      this.now = now;
      const first = !this.initialized;
      this.initialized = true;
      this.accounts = new Map(snap.accounts.map((a) => [a.id, { short: a.short, color: a.color, name: a.name, ...a.provider === "codex" ? { provider: a.provider } : {} }]));
      let layoutDirty = false;
      const listed = /* @__PURE__ */ new Set();
      for (const r of [...snap.rooms].sort((a, b) => a.slot - b.slot)) {
        if (this.hiddenRooms.has(r.id)) continue;
        listed.add(r.id);
        const rs = this.rooms.get(r.id);
        if (!rs) {
          this.createRoom(r, first, now);
          layoutDirty = true;
          continue;
        }
        if (rs.info.name !== r.name || rs.info.seed !== r.seed) rs.version++;
        rs.info = r;
        if (!rs.listed) {
          rs.listed = true;
          rs.readyToDismantleAt = 0;
          if (rs.phase === "dismantling") rs.rebuild(now);
        }
      }
      for (const rs of this.rooms.values()) {
        if (!listed.has(rs.id) && rs.listed) {
          rs.listed = false;
          rs.unlistedAt = now;
        }
      }
      if (layoutDirty) this.relayout();
      this.roomFx.sync(snap.rooms, input.serverTime, now);
      const seen = /* @__PURE__ */ new Set();
      const fresh = [];
      for (const a of snap.agents) {
        seen.add(a.id);
        const ch = this.chars.get(a.id);
        if (ch) {
          this.updateAgent(ch, a, now);
          this.social.syncAgent(ch, a, now, true);
          continue;
        }
        if (a.status === "offline" || this.forcedOffline.has(a.id) || this.hiddenRooms.has(a.roomId)) continue;
        if (a.status === "done") continue;
        if (a.kind === "sub" && a.parentId) {
          const parent = this.chars.get(a.parentId);
          if (parent && (parent.leaving || parent.gone)) continue;
        }
        const nc = this.spawn(a, first, now);
        if (nc) {
          fresh.push(nc);
          this.social.syncAgent(nc, a, now, false);
        }
      }
      for (const ch of this.chars.values()) {
        if (!seen.has(ch.id) && !ch.leaving && ch.missingSince === null) ch.missingSince = now;
      }
      for (const ch of fresh) {
        ch.mode = this.modeOf(ch);
        this.refreshShell(ch, now);
      }
      if (first) {
        const seated = /* @__PURE__ */ new Set();
        const order = [...fresh].sort((a, b) => Number(a.mode === "idle") - Number(b.mode === "idle"));
        for (const ch of order) this.placeInitial(ch, now, seated);
      }
      this.refreshRoomInfo();
      if (this.visit) this.applyVisitLight(now, first);
    }
    /** Reaplica o último snapshot (depuração). */
    reapply(now) {
      if (this.lastSnapshot) this.applySnapshot(this.lastSnapshot, now);
    }
    createRoom(r, first, now) {
      let theme = FALLBACK_THEME;
      try {
        theme = this.art.roomTheme(r.seed) ?? FALLBACK_THEME;
      } catch {
        theme = FALLBACK_THEME;
      }
      const slot = this.freeSlot();
      const layout = layoutProjectRoom({ id: r.id, slot, seed: r.seed }, theme);
      const rs = new RoomState(r, theme, layout, first ? "ready" : "building", now, first, slot);
      this.rooms.set(r.id, rs);
      return rs;
    }
    /** Menor vaga sem sala (contando as que ainda estão desmontando). */
    freeSlot() {
      const used = /* @__PURE__ */ new Set();
      for (const r of this.rooms.values()) if (r.phase !== "gone") used.add(r.slot);
      let slot = 0;
      while (used.has(slot)) slot++;
      return slot;
    }
    updateAgent(ch, a, now) {
      const prevStatus = ch.info.status;
      const hadShells = !!ch.info.shells?.length;
      const prevLook = lookSig(ch.info);
      ch.info = a;
      if (lookSig(a) !== prevLook) {
        try {
          ch.appearance = this.art.appearanceFromSeed(a.seed, { look: a.look, sub: a.kind === "sub", parts: a.parts });
        } catch {
        }
      }
      ch.missingSince = null;
      if (a.roomId !== ch.roomId && !ch.leaving) {
        if (ch.homeSpot) this.spots.release(ch.homeSpot, ch.id);
        ch.homeSpot = null;
        ch.roomId = a.roomId;
        this.interrupt(ch);
      }
      const act = a.activity;
      if (act && act.id !== ch.lastActivityId) {
        const firstSeen = ch.lastActivityId === null;
        ch.lastActivityId = act.id;
        if (!firstSeen) {
          ch.activityChangedAt = now;
          if (act.kind === "done") ch.setIcon("check", 2600, now);
          if (act.kind === "error") ch.setIcon("sweat", 2200, now);
          if (act.kind === "delegate" && ch.info.kind === "main" && a.status === "working") this.planDelegate(ch, now);
          if (act.kind === "done" && ch.info.kind === "main") this.social.turnDone(ch, now);
        }
      }
      const sd = latestShellDone(a);
      if (sd && sd.at > ch.shellDoneAt) {
        ch.shellDoneAt = sd.at;
        this.reactShellDone(ch, !sd.error, now);
      }
      if (prevStatus !== a.status || hadShells || !!a.shells?.length || ch.mode === "shell" || this.forcedOffline.has(ch.id)) this.refreshMode(ch);
      this.refreshShell(ch, now);
    }
    /** Recalcula o modo e interrompe o plano se mudou. */
    refreshMode(ch) {
      if (ch.leaving) return;
      const mode = this.modeOf(ch);
      if (mode === ch.mode) return;
      const prev = ch.mode;
      ch.mode = mode;
      if (prev === "idle" && mode !== "idle") ch.nextOutingAt = 0;
      if (ch.icon === "zzz") ch.setIcon(null, 0, this.now);
      this.refreshShell(ch, this.now);
      if (ch.gathering && (mode === "idle" || mode === "shell") && (prev === "idle" || prev === "shell")) return;
      if (ch.gathering) this.social.calledAway(ch, prev, this.now);
      if (this.now < ch.reactUntil && mode !== "leave" && mode !== "deliver") return;
      ch.reactUntil = 0;
      this.interrupt(ch);
    }
    modeOf(ch) {
      const a = ch.info;
      if (ch.leaving) return "leave";
      const parent = a.parentId ? this.chars.get(a.parentId) : void 0;
      const parentGone = !!parent && (parent.leaving || parent.gone);
      const missing = ch.missingSince !== null && this.now - ch.missingSince >= MISSING_DEBOUNCE_MS;
      const offline = this.forcedOffline.has(ch.id);
      if (a.kind === "sub" && a.status === "done" && !ch.delivered && !offline && !parentGone) return "deliver";
      const m = modeFor(offline ? "offline" : a.status, { kind: a.kind, missing, parentGone, shells: a.shells, now: this.now });
      if (m === "deliver" && ch.delivered) return "leave";
      return m;
    }
    // =================================================================== espera de shell
    /** Atualiza início/quantidade/rótulo da espera de shell (no snapshot e quando o modo muda). */
    refreshShell(ch, now) {
      if (ch.mode !== "shell") {
        ch.shellSince = 0;
        ch.shellCount = 0;
        ch.shellStage = null;
        ch.shellEnteredAt = 0;
        return;
      }
      const a = ch.info;
      if (!ch.shellEnteredAt) ch.shellEnteredAt = now;
      ch.shellSince = Math.min(now, shellWaitSince(a));
      ch.shellCount = Math.max(1, countShells(a.shells, a.status !== "shell"));
      const label = shellLabel(a);
      if (label !== ch.shellLabel) {
        ch.shellLabel = label;
        ch.shellTextKey = -1;
      }
      ch.shellStage = this.visit ? null : shellStage(now - ch.shellSince);
    }
    /**
     * Um shell terminou (Activity 'ShellDone'): sucesso -> levanta e comemora com confete e ⭐;
     * falha/morto -> nuvenzinha de chuva ('storm') e ombros caídos. Depois segue o status atual.
     */
    reactShellDone(ch, ok, now) {
      if (ch.leaving || ch.mode === "leave" || ch.mode === "deliver") return;
      ch.setIcon(ok ? "star" : "storm", ok ? CHEER_MS : SULK_MS, now);
      if (ok) this.pushEffect({ kind: "confetti", charId: ch.id, at: now });
      const home = this.spots.get(ch.homeSpot);
      if (!home || ch.atSpot !== home.id || ch.step || ch.queue.length || ch.gathering) return;
      if (ok) {
        ch.reactUntil = now + CHEER_MS + 2 * ENTER_MS + 200;
        if (home.seated) ch.queue.push({ t: "exit" });
        ch.queue.push({ t: "act", pose: "stretch", ms: CHEER_MS * 0.55 }, { t: "act", pose: "raise_hand", ms: CHEER_MS * 0.45 });
        if (home.seated) ch.queue.push({ t: "enter", spot: home.id });
      } else {
        ch.reactUntil = now + SULK_MS;
        ch.queue.push({ t: "act", pose: home.seated ? "sleep" : "stand", ms: SULK_MS });
      }
    }
    /** Lance do futebol da TV agora (para a torcida comemorar junto com o "GOL" da tela). */
    footballLance(t2) {
      try {
        return this.art.footballLance?.(t2, PROGRAM_SEED.futebol) ?? null;
      } catch {
        return null;
      }
    }
    /** Pede um efeito visual ao render (confete, moedinhas, brilho). */
    pushEffect(e) {
      if (this.effects.length >= MAX_EFFECTS) this.effects.shift();
      this.effects.push(e);
    }
    // =================================================================== nascimento e posicionamento
    spawn(a, first, now) {
      let appearance;
      try {
        appearance = this.art.appearanceFromSeed(a.seed, { look: a.look, sub: a.kind === "sub", parts: a.parts });
      } catch {
        return null;
      }
      const ch = new Character(a, appearance);
      ch.lastActivityId = a.activity?.id ?? null;
      ch.shellDoneAt = latestShellDone(a)?.at ?? 0;
      this.chars.set(a.id, ch);
      if (first) return ch;
      const el = this.pickElevator(ch);
      const spot = this.spots.get(el.spotId);
      ch.placeAtTile(spot.tx, spot.ty);
      ch.x = spot.x;
      ch.y = spot.y - 6;
      ch.dir = "down";
      ch.alpha = 0;
      ch.inside = true;
      ch.arriving = true;
      ch.hiddenUntil = el.reserveAppear(now);
      if (a.kind === "sub") ch.hiddenUntil += Math.floor(ch.rng() * 600);
      ch.queue.push({ t: "elevOut", elev: el.index, phase: 0 });
      return ch;
    }
    /**
     * Carga inicial: todos começam no lugar natural (a própria mesa), sem ninguém "parado no
     * corredor". Só uma minoria dos ociosos de verdade (parados há um tempo, sem cochilar) aparece
     * num sofá/poltrona/puff/café — nunca em banco de corredor ou banheiro, e nunca esvaziando a sala.
     */
    placeInitial(ch, now, roomsSeated) {
      this.assignHome(ch);
      const home = this.spots.get(ch.homeSpot);
      ch.nextOutingAt = now + INITIAL_OUTING_DELAY_MS + idleSitMs(ch.rng, this.options().liveliness) * ch.rng();
      const relaxing = ch.mode === "idle" && !!home && roomsSeated.has(ch.roomId) && now - ch.info.statusSince >= INITIAL_LOUNGE_MIN_IDLE_MS && !isLongIdle(ch.info.status, ch.info.statusSince, now) && ch.rng() < INITIAL_LOUNGE_SHARE;
      if (relaxing) {
        const seat = this.randomFree(INITIAL_LOUNGE_SEATS, ch);
        if (seat && this.spots.reserve(seat.id, ch.id)) {
          ch.tempSpots.push(seat.id);
          this.snapTo(ch, seat);
          const held = seat.kind === "cafe_seat" ? "coffee" : "none";
          ch.queue.push({ t: "act", pose: "sit", held, ms: between2(ch.rng, 4e3, 14e3) }, { t: "exit" }, { t: "do", fn: () => this.releaseTemp(ch) });
          return;
        }
      }
      if (home) {
        this.snapTo(ch, home);
        roomsSeated.add(ch.roomId);
      } else this.placeOverflow(ch);
    }
    /** Sem lugar reservado: em pé dentro da própria sala (se ela existe) ou na recepção. */
    placeOverflow(ch) {
      const room = this.rooms.get(ch.roomId);
      const t2 = room && room.present ? this.overflowTile(ch, room) : null;
      ch.standTile = t2;
      const p = t2 ?? this.lobbyTile(ch);
      ch.placeAtTile(p.x, p.y);
    }
    snapTo(ch, s) {
      ch.tx = s.tx;
      ch.ty = s.ty;
      ch.x = s.x;
      ch.y = s.y;
      ch.dir = s.dir;
      ch.atSpot = s.id;
      ch.seated = !!s.seated;
      ch.sortY = s.sortY ?? null;
    }
    /** Reserva mesa (ou banqueta/ponto em pé) na sala do personagem. */
    assignHome(ch) {
      if (ch.homeSpot && this.spots.get(ch.homeSpot) && this.spots.ownerOf(ch.homeSpot) === ch.id) return;
      ch.homeSpot = null;
      const room = this.rooms.get(ch.roomId);
      if (!room || !room.present) return;
      const seat = chooseSeat(room.layout.spots, (id) => this.spots.isFree(id, ch.id), ch.info.kind);
      if (seat && this.spots.reserve(seat.id, ch.id)) ch.homeSpot = seat.id;
    }
    pickElevator(ch) {
      let best = this.elevators[0];
      for (const e of this.elevators) if (e.load < best.load || e.load === best.load && ch.rng() < 0.5) best = e;
      return best;
    }
    // =================================================================== layout
    /** Recalcula o prédio (largura, grade, spots) a partir das salas presentes. */
    relayout(force = false) {
      const present = [...this.rooms.values()].filter((r) => r.present);
      let cols = columnsFor(present.map((r) => r.slot));
      const cur = this.building.cols;
      if (cols < cur && !force) {
        const limit = cols * COL_W * TILE;
        if ([...this.chars.values()].some((c) => !c.gone && c.x >= limit - TILE)) {
          cols = cur;
          this.shrinkPending = true;
        } else this.shrinkPending = false;
      } else this.shrinkPending = false;
      const building = assembleBuilding(
        cols,
        present.map((r) => r.layout),
        this.layoutVersion + 1
      );
      this.building = building;
      this.layoutVersion++;
      this.finder.setGrid(building.grid);
      const lost = this.spots.setSpots(building.spots);
      for (const { owner } of lost) {
        const ch = this.chars.get(owner);
        if (!ch) continue;
        if (ch.homeSpot && !this.spots.get(ch.homeSpot)) ch.homeSpot = null;
        ch.tempSpots = ch.tempSpots.filter((s) => this.spots.get(s));
      }
      for (const ch of this.chars.values()) {
        if (ch.atSpot && !this.spots.get(ch.atSpot)) {
          ch.atSpot = null;
          ch.seated = false;
          ch.sortY = null;
        }
        let stale = false;
        for (const s of ch.step ? [ch.step, ...ch.queue] : ch.queue) {
          if (s.t !== "go") continue;
          s.path = void 0;
          if (!this.building.grid.nearestWalkable(s.tx, s.ty, 4)) stale = true;
        }
        if (stale) this.interrupt(ch);
        if (!this.building.grid.walkable(ch.tx, ch.ty) && !ch.atSpot && !ch.inside) {
          const n = this.building.grid.nearestWalkable(ch.tx, ch.ty);
          if (n) {
            ch.tx = n.x;
            ch.ty = n.y;
          }
        }
      }
    }
    // =================================================================== atualização por frame
    update(dt, now) {
      this.now = now;
      for (const e of this.elevators) e.update(dt, now);
      this.updateRooms(now);
      this.social.update(now);
      if (this.roomFx.active.size) this.roomFx.update(this, now);
      for (const ch of this.chars.values()) {
        if (ch.missingSince !== null && !ch.leaving && now - ch.missingSince >= MISSING_DEBOUNCE_MS) this.refreshMode(ch);
        this.runCharacter(ch, dt, now);
      }
      if (this.visitor) this.runVisitor(this.visitor, dt, now);
      for (const [id, ch] of this.chars) {
        if (ch.gone) {
          this.spots.releaseAll(id);
          this.chars.delete(id);
        }
      }
      if (now >= this.nextHousekeeping) {
        this.nextHousekeeping = now + 1e3;
        this.housekeeping(now);
      }
    }
    /** Verificações de baixa frequência (pai saindo, salas sem dono, encolher prédio). */
    housekeeping(now) {
      for (const ch of this.chars.values()) {
        if (ch.info.kind === "sub" && !ch.leaving) this.refreshMode(ch);
        else if (!ch.leaving && (ch.mode === "shell" || ch.info.status === "working" && ch.info.shells?.length)) this.refreshMode(ch);
        if (ch.mode === "idle" && this.longIdle(ch, now) && ch.atSpot === ch.homeSpot && ch.pose === "sleep" && ch.icon !== "zzz") {
          ch.setIcon("zzz", 1e12, now);
        }
      }
      if (this.shrinkPending) this.relayout();
      this.social.housekeeping(now);
      for (const [id, until] of this.machineUntil) if (until < now) this.machineUntil.delete(id);
      this.refreshRoomInfo();
      if (this.visit) this.applyVisitLight(now);
    }
    updateRooms(now) {
      let dirty = false;
      for (const room of this.rooms.values()) {
        if (room.phase === "building" && room.progress(now) >= 1) room.setPhase("ready", now);
        if (room.phase === "dismantling" && room.progress(now) >= 1) {
          room.setPhase("gone", now);
          dirty = true;
        }
        if (!room.listed && (room.phase === "ready" || room.phase === "building")) {
          const occupants = this.occupants(room);
          if (occupants === 0 && room.lightOn && !this.switchClaimValid(room) && now - room.unlistedAt > 2500) room.setLight(false, now);
          const ok = canDismantle({ listed: room.listed, occupants, lightOn: room.lightOn, dark: room.light(now) <= 0.01, unlistedForMs: now - room.unlistedAt }, 0);
          if (!ok) room.readyToDismantleAt = 0;
          else if (!room.readyToDismantleAt) room.readyToDismantleAt = now;
          else if (now - room.readyToDismantleAt >= DISMANTLE_DELAY_MS) room.setPhase("dismantling", now);
        }
      }
      for (const [id, room] of this.rooms) {
        if (room.phase === "gone") {
          this.rooms.delete(id);
          dirty = true;
        }
      }
      if (dirty) this.relayout();
      this.compact(now);
    }
    // =================================================================== mudança de sala
    /**
     * Sem buracos entre as salas: quando uma vaga fica livre antes da última sala (um terminal fechou e a
     * sala foi desmontada), a sala mais distante se muda para ela depois de COMPACT_DELAY_MS. Uma sala por
     * vez, só sala pronta e com a sessão aberta; o prédio encolhe quando o endereço antigo é desmontado.
     */
    compact(now) {
      const free = this.freeSlot();
      let far = null;
      for (const r of this.rooms.values()) {
        if (r.slot > free && !r.ghost && r.listed && r.phase === "ready" && (!far || r.slot > far.slot)) far = r;
      }
      if (!far) {
        this.gapSince = 0;
        return;
      }
      if (!this.gapSince) this.gapSince = now;
      if (now - this.gapSince < COMPACT_DELAY_MS) return;
      this.gapSince = 0;
      this.moveRoom(far, free, now);
    }
    /**
     * Muda a sala para outra vaga: ela é construída de novo lá (apagada; o primeiro a chegar acende a luz)
     * e o endereço antigo vira uma sala fantasma que espera esvaziar, apaga e é desmontada. Os lugares
     * mantêm os ids (cada um continua com a sua mesa, agora na sala nova); quem está sentado ou a caminho
     * de um lugar da sala passa a usar o lugar equivalente da fantasma, levanta dali e vai andando.
     */
    moveRoom(room, slot, now) {
      const before = room.layout;
      const ghostId = `${room.id}#mudan\xE7a${++this.moveSeq}`;
      const ghostLayout = layoutProjectRoom({ id: ghostId, slot: room.slot, seed: room.seed }, room.theme);
      const ghost = new RoomState({ ...room.info, id: ghostId, seed: room.seed }, room.theme, ghostLayout, "ready", now, false, room.slot);
      ghost.ghost = true;
      ghost.listed = false;
      ghost.unlistedAt = now;
      ghost.lightOn = room.lightOn;
      ghost.lightAt = room.lightAt;
      this.rooms.set(ghostId, ghost);
      const alias = /* @__PURE__ */ new Map();
      before.spots.forEach((s, i) => {
        const g = ghostLayout.spots[i];
        if (g && g.kind === s.kind) alias.set(s.id, g.id);
      });
      room.slot = slot;
      room.layout = layoutProjectRoom({ id: room.id, slot, seed: room.seed }, room.theme);
      room.setPhase("building", now);
      room.lightOn = false;
      room.lightAt = -1e9;
      room.switchClaim = null;
      room.readyToDismantleAt = 0;
      room.version++;
      this.relayout();
      for (const s of ghostLayout.spots) this.spots.reserve(s.id, GHOST_OWNER);
      for (const ch of this.chars.values()) {
        if (ch.gone) continue;
        let touched = false;
        if (ch.atSpot && alias.has(ch.atSpot)) {
          ch.atSpot = alias.get(ch.atSpot);
          touched = true;
        }
        for (const step of ch.step ? [ch.step, ...ch.queue] : ch.queue) {
          if (step.t === "enter" && alias.has(step.spot)) {
            step.spot = alias.get(step.spot);
            touched = true;
          } else if (step.t === "switch" && step.room === room.id) {
            step.room = ghostId;
            touched = true;
          } else if (step.t === "go" && inRect(before.rect, step.tx, step.ty)) touched = true;
        }
        if (ch.tempSpots.some((id) => alias.has(id))) touched = true;
        if (touched || ch.roomId === room.id && ch.standTile || inRect(before.rect, ch.tx, ch.ty)) {
          ch.standTile = null;
          this.interrupt(ch);
        }
      }
    }
    switchClaimValid(room) {
      if (!room.switchClaim) return false;
      const c = this.chars.get(room.switchClaim);
      if (!c || c.gone) {
        room.switchClaim = null;
        return false;
      }
      return true;
    }
    /** Personagens associados à sala (não saindo) + qualquer um fisicamente dentro dela. */
    occupants(room, except) {
      let n = 0;
      for (const c of this.chars.values()) {
        if (c.gone || c.id === except) continue;
        if (c.roomId === room.id && !c.leaving || inRect(room.layout.rect, c.tx, c.ty)) n++;
      }
      return n;
    }
    /** Quantos estão fisicamente dentro do retângulo da sala. */
    physicallyInside(room, except) {
      let n = 0;
      for (const c of this.chars.values()) if (!c.gone && c.id !== except && inRect(room.layout.rect, c.tx, c.ty)) n++;
      return n;
    }
    /** Contas presentes e quadro kanban de cada sala. */
    refreshRoomInfo() {
      for (const room of this.rooms.values()) {
        const accs = /* @__PURE__ */ new Set();
        const board = [];
        for (const c of this.chars.values()) {
          if (c.roomId !== room.id || c.leaving) continue;
          accs.add(c.info.account);
          if (c.info.kind === "main") {
            for (const t2 of c.info.tasks) if (board.length < 15) board.push({ status: t2.status });
          }
        }
        room.accounts = [...accs].sort();
        room.board = board;
      }
    }
    // =================================================================== execução dos passos
    runCharacter(ch, dt, now) {
      ch.animT += dt * 1e3;
      ch.updateLane(dt);
      if (ch.icon && now >= ch.iconUntil) ch.icon = null;
      if (ch.icon === "zzz" && ch.pose !== "sleep") ch.icon = null;
      if (ch.mode === "shell" && ch.shellSince && !this.visit) ch.shellStage = shellStage(now - ch.shellSince);
      if (!ch.step) {
        if (ch.replan) {
          ch.replan = false;
          this.clearPlan(ch);
        }
        ch.step = ch.queue.shift() ?? null;
        ch.stepT = 0;
        ch.stepStarted = false;
      }
      if (ch.step) {
        const done = this.runStep(ch, ch.step, dt, now);
        ch.stepT += dt * 1e3;
        if (done) {
          ch.step = null;
          if (ch.replan) {
            ch.replan = false;
            this.clearPlan(ch);
          }
        }
        return;
      }
      if (now >= ch.thinkAt) {
        const planned = this.think(ch, now);
        if (!planned) ch.thinkAt = now + 400;
      }
      if (!ch.step && !ch.queue.length) this.restPose(ch, now);
    }
    runStep(ch, s, dt, now) {
      const first = !ch.stepStarted;
      ch.stepStarted = true;
      switch (s.t) {
        case "go":
          return this.stepGo(ch, s, dt);
        case "enter": {
          const spot = this.spots.get(s.spot);
          if (!spot) return true;
          if (first) {
            ch.enterFrom = { x: ch.x, y: ch.y };
            if (spot.seated) ch.sortY = spot.sortY ?? null;
          }
          const k = Math.min(1, (ch.stepT + dt * 1e3) / ENTER_MS);
          const from = ch.enterFrom ?? { x: ch.x, y: ch.y };
          ch.x = from.x + (spot.x - from.x) * k;
          ch.y = from.y + (spot.y - from.y) * k;
          if (k >= 1) {
            this.snapTo(ch, spot);
            ch.setPose(spot.seated ? "sit" : "stand", ch.held);
            return true;
          }
          return false;
        }
        case "exit": {
          if (!ch.atSpot) return true;
          const spot = this.spots.get(ch.atSpot);
          if (!spot) {
            ch.atSpot = null;
            ch.seated = false;
            ch.sortY = null;
            return true;
          }
          const tx = spot.tx * TILE + FOOT_DX;
          const ty = spot.ty * TILE + FOOT_DY;
          if (first) ch.enterFrom = { x: ch.x, y: ch.y };
          const k = Math.min(1, (ch.stepT + dt * 1e3) / ENTER_MS);
          const from = ch.enterFrom ?? { x: ch.x, y: ch.y };
          ch.x = from.x + (tx - from.x) * k;
          ch.y = from.y + (ty - from.y) * k;
          ch.seated = false;
          ch.setPose("stand", ch.held);
          if (k >= 1) {
            ch.atSpot = null;
            ch.sortY = null;
            ch.tx = spot.tx;
            ch.ty = spot.ty;
            return true;
          }
          return false;
        }
        case "act": {
          if (first) {
            if (s.dir) ch.dir = s.dir;
            if (s.icon) ch.setIcon(s.icon, s.ms, now);
            if (s.machine) this.machineUntil.set(s.machine, now + s.ms);
          }
          ch.setPose(s.pose, s.held ?? "none");
          return ch.stepT >= s.ms;
        }
        case "until": {
          if (first && s.dir) ch.dir = s.dir;
          ch.setPose(s.pose ?? (ch.seated ? "sit" : "stand"), s.held ?? ch.held);
          if (ch.stepT >= s.maxMs) return true;
          return ch.stepT >= s.minMs && s.cond();
        }
        case "elevOut":
          return this.stepElevOut(ch, s, dt, now);
        case "elevIn":
          return this.stepElevIn(ch, s, dt, now);
        case "stall":
          return this.stepStall(ch, s, dt, now);
        case "switch":
          return this.stepSwitch(ch, s, now);
        case "gather":
          return this.social.stepGather(ch, s.g, now);
        case "do":
          s.fn();
          return true;
        case "remove":
          ch.gone = true;
          return true;
      }
    }
    findPath(sx, sy, gx, gy, out) {
      const grid = this.building.grid;
      if (!grid.walkable(gx, gy)) {
        const n = grid.nearestWalkable(gx, gy, 4);
        if (!n) return false;
        gx = n.x;
        gy = n.y;
      }
      if (this.finder.find(sx, sy, gx, gy, out)) return true;
      const s = grid.nearestWalkable(sx, sy, 6);
      if (s && (s.x !== sx || s.y !== sy) && this.finder.find(s.x, s.y, gx, gy, out)) {
        out.unshift(s.x, s.y);
        return true;
      }
      return false;
    }
    stepGo(ch, s, dt) {
      if (!s.path) {
        s.path = [];
        s.i = 0;
        if (!this.findPath(ch.tx, ch.ty, s.tx, s.ty, s.path)) {
          ch.placeAtTile(s.tx, s.ty);
          s.path.length = 0;
        }
      }
      const path = s.path;
      let budget = (s.run ? RUN_SPEED : WALK_SPEED) * ch.speedK * dt;
      let moved = false;
      while (budget > 1e-4) {
        let gx;
        let gy;
        const i = s.i ?? 0;
        if (i < path.length) {
          ch.tx = path[i];
          ch.ty = path[i + 1];
          gx = ch.tx * TILE + FOOT_DX;
          gy = ch.ty * TILE + FOOT_DY;
        } else if (s.fx !== void 0 && s.fy !== void 0 && !s.fine) {
          gx = s.fx;
          gy = s.fy;
        } else break;
        const dx = gx - ch.x;
        const dy = gy - ch.y;
        const d = Math.hypot(dx, dy);
        if (d > 1e-3) ch.dir = dirOf(dx, dy, ch.dir);
        if (d <= budget) {
          ch.x = gx;
          ch.y = gy;
          budget -= d;
          if (i < path.length) s.i = i + 2;
          else s.fine = true;
        } else {
          ch.x += dx / d * budget;
          ch.y += dy / d * budget;
          budget = 0;
        }
        moved = true;
      }
      const arrived = (s.i ?? 0) >= path.length && (s.fx === void 0 || s.fine);
      if (arrived) {
        if (s.dir) ch.dir = s.dir;
        ch.setPose("stand", s.held ?? "none");
        return true;
      }
      if (moved) ch.setPose(s.run ? "run" : "walk", s.held ?? "none");
      return false;
    }
    stepElevOut(ch, s, dt, now) {
      const el = this.elevators[s.elev] ?? this.elevators[0];
      const spot = this.spots.get(el.spotId);
      ch.dir = "down";
      if (s.phase === 0) {
        ch.alpha = 0;
        ch.setPose("stand");
        if (now >= ch.hiddenUntil) {
          el.request(ch.id);
          s.phase = 1;
        }
        return false;
      }
      if (s.phase === 1) {
        ch.x = spot.x;
        ch.y = spot.y - 6;
        if (el.door >= 2.5) {
          ch.inside = false;
          ch.alpha = Math.min(1, ch.alpha + dt * 5);
          if (ch.alpha >= 1 && el.isOpen) s.phase = 2;
        }
        return false;
      }
      const gx = spot.tx * TILE + FOOT_DX;
      const gy = spot.ty * TILE + FOOT_DY;
      const dx = gx - ch.x;
      const dy = gy - ch.y;
      const d = Math.hypot(dx, dy);
      const step = WALK_SPEED * dt;
      ch.alpha = 1;
      if (d <= step) {
        ch.x = gx;
        ch.y = gy;
        ch.tx = spot.tx;
        ch.ty = spot.ty;
        el.release(ch.id, now);
        ch.setPose("stand");
        return true;
      }
      ch.x += dx / d * step;
      ch.y += dy / d * step;
      ch.setPose("walk");
      return false;
    }
    stepElevIn(ch, s, dt, now) {
      const el = this.elevators[s.elev] ?? this.elevators[0];
      const spot = this.spots.get(el.spotId);
      if (s.phase === 0) {
        ch.dir = "up";
        ch.setPose("stand");
        el.request(ch.id);
        if (el.isOpen) s.phase = 1;
        return false;
      }
      if (s.phase === 1) {
        const gx = spot.x;
        const gy = spot.y - 6;
        const dx = gx - ch.x;
        const dy = gy - ch.y;
        const d = Math.hypot(dx, dy);
        const step = WALK_SPEED * dt;
        ch.dir = "up";
        if (d <= step) {
          ch.x = gx;
          ch.y = gy;
          s.phase = 2;
          ch.dir = "down";
          ch.setPose("stand");
        } else {
          ch.x += dx / d * step;
          ch.y += dy / d * step;
          ch.setPose("walk");
        }
        return false;
      }
      ch.alpha = Math.max(0, ch.alpha - dt * 3.5);
      if (ch.alpha <= 0) {
        ch.inside = true;
        el.release(ch.id, now);
        return true;
      }
      return false;
    }
    stepStall(ch, s, dt, now) {
      const spot = this.spots.get(s.spot);
      if (!spot) return true;
      const furn = spot.furnitureId ?? spot.id;
      const ax = spot.tx * TILE + FOOT_DX;
      const ay = spot.ty * TILE + FOOT_DY;
      if (s.phase === 0) {
        const dx2 = spot.x - ch.x;
        const dy2 = spot.y - ch.y;
        const d2 = Math.hypot(dx2, dy2);
        const step2 = WALK_SPEED * 0.8 * dt;
        ch.dir = "up";
        ch.setPose("walk");
        if (d2 > step2) {
          ch.x += dx2 / d2 * step2;
          ch.y += dy2 / d2 * step2;
        } else {
          ch.x = spot.x;
          ch.y = spot.y;
        }
        ch.alpha = Math.max(0, ch.alpha - dt * 4);
        if (d2 <= step2 && ch.alpha <= 0) {
          ch.inside = true;
          this.stallBusy.add(furn);
          s.phase = 1;
          ch.stallUntil = now + s.ms;
        }
        return false;
      }
      if (s.phase === 1) {
        if (now >= (ch.stallUntil ?? 0)) {
          s.phase = 2;
          this.stallBusy.delete(furn);
          ch.inside = false;
          ch.dir = "down";
        }
        return false;
      }
      const dx = ax - ch.x;
      const dy = ay - ch.y;
      const d = Math.hypot(dx, dy);
      const step = WALK_SPEED * 0.8 * dt;
      ch.alpha = Math.min(1, ch.alpha + dt * 4);
      ch.dir = "down";
      ch.setPose("walk");
      if (d > step) {
        ch.x += dx / d * step;
        ch.y += dy / d * step;
        return false;
      }
      ch.x = ax;
      ch.y = ay;
      ch.alpha = 1;
      ch.tx = spot.tx;
      ch.ty = spot.ty;
      ch.setPose("stand");
      return true;
    }
    stepSwitch(ch, s, now) {
      const room = this.rooms.get(s.room);
      if (!room) return true;
      const spot = room.layout.spots.find((p) => p.kind === "switch");
      if (spot) ch.dir = spot.dir;
      if (s.phase === 0) {
        ch.setPose("use");
        if (ch.stepT >= 420) {
          s.phase = 1;
          const stillLast = !s.onlyIfLast || isLastInRoom(room.id, ch.id, this.chars.values());
          if (stillLast && (s.on ? room.present : true)) room.setLight(s.on, now);
        }
        return false;
      }
      ch.setPose("use");
      if (ch.stepT >= 700) {
        ch.setPose("stand");
        return true;
      }
      return false;
    }
    // =================================================================== planejamento
    /** Interrompe o plano atual (respeitando passos que precisam terminar). */
    interrupt(ch) {
      if (ch.step && !this.interruptible(ch.step)) {
        ch.replan = true;
        if (ch.step.t === "stall" && ch.step.phase <= 1) ch.stallUntil = Math.min(ch.stallUntil ?? 0, this.now + 2e3);
        return;
      }
      this.clearPlan(ch);
    }
    interruptible(s) {
      return s.t === "go" || s.t === "act" || s.t === "until" || s.t === "gather" || s.t === "do";
    }
    /** Descarta a fila (e sai da roda, se estiver numa). */
    clearPlan(ch) {
      ch.queue.length = 0;
      ch.step = null;
      ch.thinkAt = 0;
      this.releaseTemp(ch);
      const room = this.rooms.get(ch.roomId);
      if (room && room.switchClaim === ch.id) room.switchClaim = null;
      if (ch.gathering) this.social.leave(ch, this.now);
      ch.chatUntil = 0;
    }
    releaseTemp(ch) {
      for (const id of ch.tempSpots) if (id !== ch.homeSpot) this.spots.release(id, ch.id);
      ch.tempSpots.length = 0;
    }
    reserveTemp(ch, spot) {
      if (!this.spots.reserve(spot.id, ch.id)) return false;
      ch.tempSpots.push(spot.id);
      return true;
    }
    /** Decide o próximo plano. Retorna true se planejou algo. */
    think(ch, now) {
      if (ch.gone) return false;
      if (ch.mode === "leave") return this.planLeave(ch, now);
      if (ch.mode === "deliver") return this.planDeliver(ch, now);
      const room = this.rooms.get(ch.roomId);
      if (!room || !room.present) return this.planLobby(ch, room);
      this.assignHome(ch);
      if (!ch.homeSpot) return this.planOverflow(ch, room);
      ch.standTile = null;
      if (!room.lightOn && room.phase !== "dismantling" && !this.switchClaimValid(room)) {
        room.switchClaim = ch.id;
        const sw = room.layout.spots.find((p) => p.kind === "switch");
        if (sw) {
          const steps = [];
          this.pushLeave(ch, steps);
          steps.push(
            { t: "go", tx: sw.tx, ty: sw.ty, fx: sw.x, fy: sw.y, dir: sw.dir, run: ch.mode === "wait" },
            { t: "until", cond: () => room.phase === "ready", minMs: 0, maxMs: 6e3, dir: sw.dir },
            { t: "switch", room: room.id, on: true, phase: 0 },
            { t: "do", fn: () => room.switchClaim === ch.id && (room.switchClaim = null) }
          );
          ch.queue.push(...steps);
          return true;
        }
      }
      if (ch.atSpot !== ch.homeSpot) return this.planGoHome(ch, now);
      ch.arriving = false;
      if (ch.mode === "idle" && !this.longIdle(ch, now)) {
        if (!ch.nextOutingAt) ch.nextOutingAt = now + idleSitMs(ch.rng, this.options().liveliness);
        if (now >= ch.nextOutingAt) {
          if (this.planOuting(ch, now)) return true;
          ch.nextOutingAt = now + idleSitMs(ch.rng, this.options().liveliness);
        }
      }
      if (ch.mode === "shell") {
        if (!ch.nextSocialAt) ch.nextSocialAt = now + idleSitMs(ch.rng, this.options().liveliness) * 1.3;
        if (now >= ch.nextSocialAt) {
          ch.nextSocialAt = now + idleSitMs(ch.rng, this.options().liveliness) * 1.3;
          const p = personaFor(ch.info.seed);
          if (this.social.hasCompany(ch, now) && ch.rng() < 0.5 + p.sociability * 0.4 && this.social.tryInitiate(ch, now, true)) return true;
        }
      }
      return false;
    }
    /** Levantar/sair do lugar atual antes de andar. */
    pushLeave(ch, steps) {
      if (ch.atSpot) steps.push({ t: "exit" });
    }
    planGoHome(ch, now, held = "none") {
      const home = this.spots.get(ch.homeSpot);
      if (!home) return false;
      const steps = [];
      this.pushLeave(ch, steps);
      const dist = Math.abs(home.tx - ch.tx) + Math.abs(home.ty - ch.ty);
      const run = shouldRun(dist, ch.mode) && (!ch.arriving || ch.mode === "wait");
      steps.push({ t: "go", tx: home.tx, ty: home.ty, run, held }, { t: "enter", spot: home.id });
      if (ch.mode === "idle") steps.push({ t: "do", fn: () => ch.nextOutingAt = this.now + idleSitMs(ch.rng, this.options().liveliness) });
      void now;
      ch.queue.push(...steps);
      return true;
    }
    /** Sem sala ainda (aguardando slot): espera na recepção. */
    planLobby(ch, room) {
      const t2 = this.lobbyTile(ch);
      ch.queue.push(
        { t: "go", tx: t2.x, ty: t2.y },
        { t: "until", cond: () => !!room && room.present, minMs: 800, maxMs: 4e3, dir: "down" }
      );
      return true;
    }
    /**
     * Sala lotada (todos os lugares reservados): trabalha em pé dentro da própria sala, num canto
     * livre, até vagar um lugar. Nunca fica rodando pela recepção.
     */
    planOverflow(ch, room) {
      const stay = ch.standTile && !ch.atSpot && ch.tx === ch.standTile.x && ch.ty === ch.standTile.y && this.overflowFree(ch.tx, ch.ty, ch);
      const t2 = stay ? ch.standTile : this.overflowTile(ch, room);
      if (!t2) return this.planLobby(ch, room);
      ch.standTile = t2;
      ch.arriving = false;
      const steps = [];
      this.pushLeave(ch, steps);
      const r = room.layout.rect;
      const dir = facing(t2.x * TILE, t2.y * TILE, (r.x + 5) * TILE, (r.y + 6) * TILE);
      if (t2.x !== ch.tx || t2.y !== ch.ty || ch.atSpot) {
        const dist = Math.abs(t2.x - ch.tx) + Math.abs(t2.y - ch.ty);
        steps.push({ t: "go", tx: t2.x, ty: t2.y, dir, run: shouldRun(dist, ch.mode) });
      }
      const pose = ch.mode === "wait" ? "raise_hand" : ch.mode === "work" ? "read" : "stand";
      const held = ch.mode === "work" ? "laptop" : "none";
      steps.push({ t: "until", cond: () => this.hasFreeSeat(room, ch), minMs: 1500, maxMs: 12e3, pose, held, dir });
      ch.queue.push(...steps);
      return true;
    }
    hasFreeSeat(room, ch) {
      return !!chooseSeat(room.layout.spots, (id) => this.spots.isFree(id, ch.id), ch.info.kind);
    }
    /** Tile livre para alguém ficar em pé (sem assento, sem spot e sem outra pessoa). */
    overflowFree(x, y, ch, busy = this.busyTiles(ch.id)) {
      const grid = this.building.grid;
      if (grid.get(x, y) !== FREE || busy.has(y * grid.w + x)) return false;
      for (const s of this.spots.all()) if (s.tx === x && s.ty === y) return false;
      return true;
    }
    /** Melhor tile livre da sala para trabalhar em pé: junto a paredes/móveis, longe da porta. */
    overflowTile(ch, room) {
      const grid = this.building.grid;
      const r = room.layout.rect;
      const door = room.layout.door;
      const busy = this.busyTiles(ch.id);
      let best = null;
      let bestScore = -Infinity;
      for (let y = r.y + 2; y <= r.y + 10; y++) {
        for (let x = r.x + 1; x <= r.x + 14; x++) {
          if (!this.overflowFree(x, y, ch, busy)) continue;
          if (door && Math.abs(x - (door.x + door.w / 2 - 0.5)) <= 1.5 && Math.abs(y - (door.y + door.h / 2 - 0.5)) <= 2) continue;
          const solidAt = (dx, dy) => grid.get(x + dx, y + dy) === BLOCKED;
          let crowd = 0;
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
          ]) if (busy.has((y + dy) * grid.w + x + dx)) crowd++;
          const backed = solidAt(0, -1) || solidAt(0, 1) ? 2 : solidAt(1, 0) || solidAt(-1, 0) ? 1 : 0;
          const squeezed = solidAt(1, 0) && solidAt(-1, 0) || solidAt(0, 1) && solidAt(0, -1) ? 3 : 0;
          const score = backed - squeezed - crowd * 3 - (Math.abs(x - ch.tx) + Math.abs(y - ch.ty)) * 0.05 + ch.rng() * 0.8;
          if (score > bestScore) {
            bestScore = score;
            best = { x, y };
          }
        }
      }
      return best;
    }
    lobbyTile(ch) {
      const reception = this.building.core.find((a) => a.id === RECEPTION_ID);
      const r = reception.rect;
      for (let k = 0; k < 20; k++) {
        const x = r.x + 2 + Math.floor(ch.rng() * 12);
        const y = r.y + 3 + Math.floor(ch.rng() * 7);
        if (this.building.grid.get(x, y) === 1) return { x, y };
      }
      return { x: r.x + 6, y: r.y + 9 };
    }
    planDelegate(ch, now) {
      if (ch.step || ch.queue.length || ch.atSpot !== ch.homeSpot || !ch.homeSpot) return;
      const room = this.rooms.get(ch.roomId);
      const door = room?.layout.door;
      const dir = door ? facing(ch.x, ch.y, (door.x + door.w / 2) * TILE, (door.y + door.h / 2) * TILE) : "down";
      const home = ch.homeSpot;
      ch.queue.push(
        { t: "exit" },
        {
          // em pé, virado para a porta, "explicando" a tarefa a quem chega ('raise_hand' e ✋ ficam
          // reservados para quando o agente precisa do usuário)
          t: "until",
          cond: () => ![...this.chars.values()].some((c) => c.info.parentId === ch.id && c.arriving),
          minMs: 2600,
          maxMs: 7500,
          pose: "talk",
          held: "none",
          dir
        },
        { t: "go", tx: ch.tx, ty: ch.ty },
        { t: "enter", spot: home }
      );
      ch.setIcon("chat", 2600, now);
    }
    planLeave(ch, now) {
      ch.leaving = true;
      ch.arriving = false;
      this.spots.releaseAll(ch.id);
      ch.homeSpot = null;
      ch.tempSpots.length = 0;
      if (ch.gathering) this.social.leave(ch, now);
      const steps = [];
      this.pushLeave(ch, steps);
      const room = this.rooms.get(ch.roomId);
      if (room && room.present && room.lightOn && !this.switchClaimValid(room) && isLastInRoom(room.id, ch.id, this.chars.values())) {
        const sw = room.layout.spots.find((p) => p.kind === "switch");
        if (sw) {
          room.switchClaim = ch.id;
          steps.push(
            { t: "go", tx: sw.tx, ty: sw.ty, fx: sw.x, fy: sw.y, dir: sw.dir },
            { t: "until", cond: () => this.physicallyInside(room, ch.id) === 0, minMs: 250, maxMs: 9e3, dir: sw.dir },
            { t: "switch", room: room.id, on: false, phase: 0, onlyIfLast: true },
            { t: "do", fn: () => room.switchClaim === ch.id && (room.switchClaim = null) }
          );
        }
      }
      const el = this.pickElevator(ch);
      const es = this.spots.get(el.spotId);
      steps.push({ t: "go", tx: es.tx, ty: es.ty, fx: es.tx * TILE + FOOT_DX + (es.x - (es.tx * TILE + FOOT_DX)) * 0.5, fy: es.ty * TILE + FOOT_DY - 2, dir: "up" });
      steps.push({ t: "elevIn", elev: el.index, phase: 0 }, { t: "remove" });
      ch.queue.push(...steps);
      void now;
      return true;
    }
    planDeliver(ch, now) {
      const parent = ch.info.parentId ? this.chars.get(ch.info.parentId) : void 0;
      if (!parent || parent.leaving || parent.gone) {
        ch.delivered = true;
        ch.mode = "leave";
        return this.planLeave(ch, now);
      }
      const target = this.besideTile(parent, ch);
      const steps = [];
      this.pushLeave(ch, steps);
      const held = ch.rng() < 0.5 ? "papers" : "box";
      const title = ch.info.title ?? tr("resultado");
      steps.push(
        { t: "go", tx: target.x, ty: target.y, held },
        {
          t: "do",
          fn: () => {
            ch.dir = facing(ch.x, ch.y, parent.x, parent.y);
            ch.showBubble("\u{1F4E6}", tr("Entregando: {0}", [title]), 3e3, this.now);
            ch.setIcon("box", 2800, this.now);
            parent.setIcon(parent.rng() < 0.5 ? "heart" : "check", 2800, this.now);
          }
        },
        { t: "act", pose: "talk", held, ms: 2700 },
        {
          t: "do",
          fn: () => {
            ch.delivered = true;
            ch.mode = "leave";
            this.social.delivered(ch, this.now);
          }
        }
      );
      ch.queue.push(...steps);
      return true;
    }
    /** Tile caminhável ao lado de alguém (evitando assentos e tiles ocupados), o mais próximo de quem vem. */
    besideTile(target, from) {
      const grid = this.building.grid;
      const busy = this.busyTiles(from.id, target.id);
      let best = null;
      let bestD = Infinity;
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, 1],
        [0, -1],
        [-1, 1],
        [1, 1],
        [-1, -1],
        [1, -1]
      ]) {
        const x = target.tx + dx;
        const y = target.ty + dy;
        const cell = grid.get(x, y);
        if (cell === 0) continue;
        const d = Math.abs(x - from.tx) + Math.abs(y - from.ty) + (cell === SEAT ? 20 : 0) + (busy.has(y * grid.w + x) ? 40 : 0) + (dx && dy ? 3 : 0);
        if (d < bestD) {
          bestD = d;
          best = { x, y };
        }
      }
      return best ?? grid.nearestWalkable(target.tx, target.ty) ?? { x: target.tx, y: target.ty };
    }
    /** Tiles (índice y*w+x) onde há alguém parado ou indo parar, exceto `a` e `b`. */
    busyTiles(a, b) {
      const w = this.building.grid.w;
      const out = /* @__PURE__ */ new Set();
      for (const c of this.chars.values()) {
        if (c.gone || c.id === a || c.id === b) continue;
        out.add(c.ty * w + c.tx);
        const go = c.step?.t === "go" ? c.step : c.queue.find((s) => s.t === "go");
        if (go) out.add(go.ty * w + go.tx);
        if (c.standTile) out.add(c.standTile.y * w + c.standTile.x);
      }
      return out;
    }
    randomFree(kinds, ch) {
      const cands = [];
      for (const k of kinds) for (const s of this.spots.ofKind(k)) if (this.spots.isFree(s.id, ch.id)) cands.push(s);
      if (!cands.length) return null;
      return cands[Math.floor(ch.rng() * cands.length)];
    }
    planOuting(ch, now) {
      const near = { tx: ch.tx, ty: ch.ty };
      const rng = ch.rng;
      const persona = personaFor(ch.info.seed);
      if (this.social.hasCompany(ch, now) && rng() < 0.45 + persona.sociability * 0.4 && this.social.tryInitiate(ch, now, false)) return true;
      const avail = {
        coffee: !!this.spots.findFree("coffee", { by: ch.id }),
        water: !!this.spots.findFree("water", { by: ch.id }),
        bathroom: !!this.spots.findFree("stall", { by: ch.id }),
        lounge: LOUNGE_SEATS.some((k) => !!this.spots.findFree(k, { by: ch.id })),
        // jogos e conversas são rodas (social/): aqui só o que se faz sozinho
        pingpong: false,
        talk: false,
        window: !!this.spots.findFree("window", { by: ch.id }),
        shelf: !!this.spots.findFree("shelf", { by: ch.id }),
        arcade: !!this.spots.findFree("arcade", { by: ch.id }),
        snack: !!this.spots.findFree("snack", { by: ch.id }),
        stretch: true,
        mirror: !!this.social.plan("mirror", 1, ch),
        phone: !!this.randomFree(PHONE_SEATS, ch)
      };
      const what = pickIdleActivity(rng, avail, soloWeights(persona));
      if (!what) return false;
      const steps = [];
      const goUse = (s, held = "none") => {
        steps.push({ t: "go", tx: s.tx, ty: s.ty, fx: s.x, fy: s.y, dir: s.dir, held });
      };
      const release = (s) => steps.push({ t: "do", fn: () => this.spots.release(s.id, ch.id) });
      let carry = "none";
      switch (what) {
        case "coffee": {
          const s = this.spots.findFree("coffee", { near, by: ch.id, rng });
          if (!this.reserveTemp(ch, s)) return false;
          this.pushLeave(ch, steps);
          goUse(s);
          steps.push({ t: "act", pose: "use", ms: 1900, machine: s.furnitureId, icon: "coffee" }, { t: "act", pose: "drink", held: "coffee", ms: 2600 });
          release(s);
          carry = "coffee";
          if (rng() < 0.45) {
            const seat = this.spots.findFree("cafe_seat", { by: ch.id, rng, near: { tx: s.tx, ty: s.ty } });
            if (seat && this.reserveTemp(ch, seat)) {
              steps.push(
                { t: "go", tx: seat.tx, ty: seat.ty, held: "coffee" },
                { t: "enter", spot: seat.id },
                { t: "act", pose: "sit", held: "coffee", ms: between2(rng, 6e3, 15e3) },
                { t: "exit" }
              );
              release(seat);
            }
          }
          break;
        }
        case "water": {
          const s = this.spots.findFree("water", { near, by: ch.id, rng });
          if (!this.reserveTemp(ch, s)) return false;
          this.pushLeave(ch, steps);
          goUse(s);
          steps.push({ t: "act", pose: "use", ms: 1e3 }, { t: "act", pose: "drink", held: "water", ms: 2500 });
          release(s);
          carry = rng() < 0.4 ? "water" : "none";
          break;
        }
        case "bathroom": {
          const s = this.spots.findFree("stall", { by: ch.id, rng });
          if (!this.reserveTemp(ch, s)) return false;
          this.pushLeave(ch, steps);
          steps.push({ t: "go", tx: s.tx, ty: s.ty }, { t: "stall", spot: s.id, ms: between2(rng, 5e3, 12e3), phase: 0 });
          release(s);
          const sink2 = this.spots.findFree("sink", { near: { tx: s.tx, ty: s.ty }, by: ch.id });
          if (sink2 && this.reserveTemp(ch, sink2)) {
            goUse(sink2);
            steps.push({ t: "act", pose: "use", ms: 2200 });
            release(sink2);
          }
          break;
        }
        case "lounge": {
          const s = this.randomFree(LOUNGE_SEATS, ch);
          if (!s || !this.reserveTemp(ch, s)) return false;
          this.pushLeave(ch, steps);
          steps.push({ t: "go", tx: s.tx, ty: s.ty }, { t: "enter", spot: s.id });
          if (rng() < (hasTrait(persona, "sonecas") ? 0.7 : 0.25)) steps.push({ t: "act", pose: "sit", ms: between2(rng, 3e3, 6e3) }, { t: "act", pose: "sleep", ms: between2(rng, 8e3, 16e3), icon: "zzz" });
          else steps.push({ t: "act", pose: "sit", ms: between2(rng, 9e3, 22e3), icon: rng() < 0.3 ? "music" : void 0 });
          steps.push({ t: "exit" });
          release(s);
          break;
        }
        case "pingpong":
        case "talk":
          return this.social.tryInitiate(ch, now, false);
        case "mirror":
          return this.social.startSolo("mirror", ch, now);
        case "phone": {
          const s = this.randomFree(PHONE_SEATS, ch);
          if (!s || !this.reserveTemp(ch, s)) return false;
          this.pushLeave(ch, steps);
          steps.push({ t: "go", tx: s.tx, ty: s.ty }, { t: "enter", spot: s.id }, { t: "act", pose: "read", held: "phone", ms: between2(rng, 8e3, 18e3) }, { t: "exit" });
          release(s);
          break;
        }
        case "window": {
          const board = rng() < 0.35 ? this.spots.findFree("whiteboard", { by: ch.id, filter: (p) => p.areaId === ch.roomId }) : null;
          const s = board ?? this.spots.findFree("window", { by: ch.id, rng });
          if (!s || !this.reserveTemp(ch, s)) return false;
          this.pushLeave(ch, steps);
          goUse(s);
          steps.push({ t: "act", pose: board ? "read" : "stand", held: board ? "papers" : "none", ms: between2(rng, 5e3, 1e4), icon: rng() < 0.3 ? "idea" : void 0 });
          release(s);
          break;
        }
        case "shelf": {
          const s = this.spots.findFree("shelf", { by: ch.id, rng });
          if (!this.reserveTemp(ch, s)) return false;
          this.pushLeave(ch, steps);
          goUse(s);
          steps.push({ t: "act", pose: "read", held: "book", ms: between2(rng, 5e3, 9e3) });
          release(s);
          break;
        }
        case "arcade": {
          const s = this.spots.findFree("arcade", { by: ch.id, rng });
          if (!this.reserveTemp(ch, s)) return false;
          this.pushLeave(ch, steps);
          goUse(s);
          steps.push({ t: "act", pose: "use", ms: between2(rng, 6e3, 12e3), icon: rng() < 0.4 ? "star" : void 0 });
          release(s);
          break;
        }
        case "snack": {
          const s = this.spots.findFree(rng() < 0.6 ? "snack" : "fridge", { by: ch.id, rng }) ?? this.spots.findFree("snack", { by: ch.id, rng });
          if (!s || !this.reserveTemp(ch, s)) return false;
          this.pushLeave(ch, steps);
          goUse(s);
          steps.push({ t: "act", pose: "use", ms: 1600 }, { t: "act", pose: "stand", ms: 900 });
          release(s);
          break;
        }
        case "stretch": {
          const home = ch.homeSpot;
          if (!home) return false;
          steps.push({ t: "exit" }, { t: "act", pose: "stretch", ms: 2600 }, { t: "enter", spot: home });
          steps.push({ t: "do", fn: () => ch.nextOutingAt = this.now + idleSitMs(ch.rng, this.options().liveliness) });
          ch.queue.push(...steps);
          return true;
        }
      }
      ch.queue.push(...steps);
      this.pushHome(ch, carry);
      void now;
      return true;
    }
    /** Volta para a mesa ao final de um passeio. */
    pushHome(ch, held) {
      const home = this.spots.get(ch.homeSpot);
      ch.queue.push({ t: "do", fn: () => this.releaseTemp(ch) });
      if (!home) return;
      ch.queue.push({ t: "go", tx: home.tx, ty: home.ty, held }, { t: "enter", spot: home.id });
      ch.queue.push({ t: "do", fn: () => ch.nextOutingAt = this.now + idleSitMs(ch.rng, this.options().liveliness) });
    }
    /** Pose de descanso quando não há passos (na mesa: digitando, pedindo atenção, sentado ou cochilando). */
    restPose(ch, now) {
      const spot = ch.atSpot ? this.spots.get(ch.atSpot) : void 0;
      const atHome = !!spot && ch.atSpot === ch.homeSpot;
      if (!spot) {
        if (ch.mode === "wait") ch.setPose("raise_hand");
        else if (ch.mode === "work" && ch.standTile) ch.setPose("read", "laptop");
        else ch.setPose("stand");
        return;
      }
      if (spot.kind === "stand") {
        ch.dir = spot.dir;
        if (ch.mode === "work") ch.setPose("read", "laptop");
        else if (ch.mode === "wait") ch.setPose("raise_hand");
        else ch.setPose("stand");
        return;
      }
      if (!spot.seated) {
        ch.setPose("stand");
        return;
      }
      ch.dir = spot.dir;
      const laptop = spot.kind === "stool" || spot.kind === "nook";
      if (atHome && ch.mode === "work") ch.setPose("type", laptop ? "laptop" : "none");
      else if (atHome && ch.mode === "wait") ch.setPose("raise_hand");
      else if (atHome && ch.mode === "shell") this.shellPose(ch, spot, now);
      else if (ch.mode === "idle" && this.longIdle(ch, now)) ch.setPose("sleep");
      else ch.setPose("sit");
    }
    /**
     * Pose da espera de shell sentado na mesa, pela escalada (sim/shell.ts): pipoca, braços cruzados
     * com giros na cadeira, bocejos sob a teia e, por fim, o cochilo. Sem alocação (roda por frame).
     */
    shellPose(ch, spot, now) {
      if (this.visit) {
        ch.setPose("wait");
        return;
      }
      const age = now - ch.shellSince;
      switch (ch.shellStage ?? shellStage(age)) {
        case "popcorn":
          ch.setPose("wait", "popcorn");
          return;
        case "restless": {
          ch.dir = spinDir(spinPhase(age, ch.info.seed), spot.dir);
          ch.setPose("wait");
          return;
        }
        case "cobweb": {
          const yawn = yawnPhase(age, ch.info.seed);
          if (yawn >= 0) {
            if (now > ch.chatUntil) {
              ch.chatEmoji = "\u{1F971}";
              ch.chatUntil = now + 1300;
            }
            ch.setPose("sleep");
          } else ch.setPose("wait");
          return;
        }
        case "nap":
          ch.setPose("sleep");
          return;
      }
    }
    // =================================================================== visita
    /** Ocioso há muito tempo (cochila na mesa, nem sempre aceita convite)? Na visita, nunca: o tempo não veio do mundo. */
    longIdle(ch, now) {
      return !this.visit && isLongIdle(ch.info.status, ch.info.statusSince, now);
    }
    /** Os personagens desenhados: os agentes e, na visita, o visitante (por último). */
    *people() {
      yield* this.chars.values();
      if (this.visitor && !this.visitor.gone) yield this.visitor;
    }
    /** Um personagem desenhado pelo id (agente ou o visitante). */
    person(id) {
      return this.chars.get(id) ?? (this.visitor?.id === id ? this.visitor : void 0);
    }
    /** Visita: o visitante surge no elevador da recepção e sai para o hall (null = tira o visitante). */
    setVisitor(info, now) {
      const old = this.visitor;
      if (old) for (const e of this.elevators) e.release(old.id, now);
      this.visitor = null;
      this.visitorIntent = { ...NO_INTENT };
      if (!info) return null;
      let appearance;
      try {
        appearance = { ...this.art.appearanceFromSeed(info.seed, { look: info.look, sub: false, parts: info.parts }), lanyard: VISITOR_LANYARD };
      } catch {
        return null;
      }
      const ch = new Character(info, appearance);
      const el = this.elevators[0];
      const spot = el ? this.spots.get(el.spotId) : void 0;
      if (!el || !spot) return null;
      ch.placeAtTile(spot.tx, spot.ty);
      ch.x = spot.x;
      ch.y = spot.y - 6;
      ch.dir = "down";
      ch.alpha = 0;
      ch.inside = true;
      ch.arriving = true;
      ch.hiddenUntil = el.reserveAppear(now);
      ch.queue.push({ t: "elevOut", elev: el.index, phase: 0 });
      this.visitor = ch;
      return ch;
    }
    /** O visitante está no elevador (chegando ou saindo): não anda nem sai de novo. */
    get visitorBusy() {
      const v = this.visitor;
      if (!v || v.gone) return true;
      return v.leaving || [v.step, ...v.queue].some((s) => s?.t === "elevOut" || s?.t === "elevIn");
    }
    /** Visita: o visitante anda até o tile (clique; o teclado cancela). */
    visitorWalkTo(tx, ty, run = false) {
      const v = this.visitor;
      if (!v || this.visitorBusy) return false;
      v.queue.length = 0;
      v.step = null;
      v.queue.push({ t: "go", tx, ty, run });
      return true;
    }
    /** O elevador perto do visitante (a até EXIT_RADIUS tiles da frente), ou null: dali ele sai do prédio. */
    visitorElevator() {
      const v = this.visitor;
      if (!v || this.visitorBusy) return null;
      const t2 = tileAt(v.x, v.y);
      for (const e of this.elevators) {
        const spot = this.spots.get(e.spotId);
        if (spot && Math.hypot(spot.tx - t2.x, spot.ty - t2.y) <= EXIT_RADIUS) return e;
      }
      return null;
    }
    /** Visita: o visitante entra no elevador mais perto e some; `done` quando a porta fecha (a cena manda o `leave`). */
    visitorExit(done) {
      const v = this.visitor;
      if (!v || this.visitorBusy) return false;
      const t2 = tileAt(v.x, v.y);
      let best = null;
      for (const e of this.elevators) {
        const spot = this.spots.get(e.spotId);
        if (!spot) continue;
        const d = Math.hypot(spot.tx - t2.x, spot.ty - t2.y);
        if (!best || d < best.d) best = { e, d, tx: spot.tx, ty: spot.ty };
      }
      if (!best) return false;
      v.queue.length = 0;
      v.step = null;
      v.leaving = true;
      this.visitorIntent = { ...NO_INTENT };
      v.queue.push({ t: "go", tx: best.tx, ty: best.ty }, { t: "elevIn", elev: best.e.index, phase: 0 }, { t: "do", fn: done });
      return true;
    }
    /**
     * Luzes da visita (veja VisitLight): apagado, as salas sem ninguém escuras; discreto, as salas prontas acesas. Ao vivo,
     * nada (quem chega acende, o último a sair apaga). `instant`: sem a transição (a entrada no prédio).
     */
    applyVisitLight(now, instant = false) {
      if (!this.visit || this.visitLight === "live") return;
      const at = instant ? now - 1e4 : now;
      for (const room of this.rooms.values()) {
        if (!room.present || room.ghost) continue;
        if (this.visitLight === "away") {
          if (room.lightOn && this.occupants(room) === 0 && !this.switchClaimValid(room)) room.setLight(false, at);
        } else if (!room.lightOn && room.phase === "ready") room.setLight(true, at);
      }
    }
    /** Visita: o teclado anda livre (com colisão); senão, o passo da fila (elevador, caminho do clique). */
    runVisitor(v, dt, now) {
      v.animT += dt * 1e3;
      if (v.icon && now >= v.iconUntil) v.icon = null;
      const intent = this.visitorIntent;
      const busy = this.visitorBusy;
      if (!busy && (intent.dx || intent.dy)) {
        v.queue.length = 0;
        v.step = null;
        const r = stepFree(this.building.grid, { x: v.x, y: v.y, dir: v.dir }, intent, (intent.run ? RUN_SPEED : WALK_SPEED) * dt);
        v.x = r.x;
        v.y = r.y;
        v.dir = r.dir;
        const t2 = tileAt(v.x, v.y);
        v.tx = t2.x;
        v.ty = t2.y;
        v.setPose(r.moved ? intent.run ? "run" : "walk" : "stand");
        return;
      }
      if (!v.step) {
        v.step = v.queue.shift() ?? null;
        v.stepT = 0;
        v.stepStarted = false;
      }
      if (v.step) {
        const done = this.runStep(v, v.step, dt, now);
        v.stepT += dt * 1e3;
        if (done) v.step = null;
        if (v.arriving && !v.step && !v.queue.length) v.arriving = false;
        return;
      }
      v.setPose("stand");
    }
    // =================================================================== aba oculta
    /** Avança tudo instantaneamente para os destinos (usado ao voltar de uma aba oculta). */
    fastForward(now) {
      this.now = now;
      for (const room of this.rooms.values()) {
        if (room.phase === "building") room.setPhase("ready", now - 1e4);
        if (room.phase === "dismantling") room.setPhase("gone", now);
        room.lightAt = now - 1e4;
      }
      this.updateRooms(now);
      for (const e of this.elevators) e.reset();
      this.machineUntil.clear();
      this.social.reset(now);
      for (const ch of [...this.chars.values()]) {
        for (let guard = 0; guard < 60 && !ch.gone; guard++) {
          if (!ch.step) ch.step = ch.queue.shift() ?? null;
          if (!ch.step) break;
          this.finishStep(ch, ch.step, now);
          ch.step = null;
        }
        ch.gathering = null;
        if (ch.leaving && !ch.gone) ch.gone = true;
        if (ch.gone) {
          this.spots.releaseAll(ch.id);
          this.chars.delete(ch.id);
          continue;
        }
        ch.alpha = 1;
        ch.inside = false;
        ch.arriving = false;
        ch.hiddenUntil = 0;
        ch.stepT = 0;
        if (ch.mode === "work" || ch.mode === "wait" || ch.mode === "idle" || ch.mode === "shell") {
          ch.reactUntil = 0;
          this.assignHome(ch);
          const home = this.spots.get(ch.homeSpot);
          if (home) {
            this.snapTo(ch, home);
            ch.standTile = null;
          } else {
            ch.atSpot = null;
            ch.seated = false;
            ch.sortY = null;
            this.placeOverflow(ch);
          }
          this.releaseTemp(ch);
          ch.nextOutingAt = now + idleSitMs(ch.rng, this.options().liveliness);
        }
      }
      for (const room of this.rooms.values()) {
        if (room.present && this.occupants(room) > 0) room.setLight(true, now - 1e4);
        room.switchClaim = null;
      }
      this.stallBusy.clear();
      const v = this.visitor;
      if (v) {
        for (let guard = 0; guard < 10; guard++) {
          if (!v.step) v.step = v.queue.shift() ?? null;
          if (!v.step) break;
          const s = v.step;
          v.step = null;
          if (s.t === "elevIn") {
            v.inside = true;
            v.alpha = 0;
          } else this.finishStep(v, s, now);
        }
        if (!v.leaving) {
          v.alpha = 1;
          v.inside = false;
          v.arriving = false;
          v.hiddenUntil = 0;
          v.setPose("stand");
        }
      }
      if (this.visit) this.applyVisitLight(now);
    }
    finishStep(ch, s, now) {
      switch (s.t) {
        case "go":
          ch.placeAtTile(s.tx, s.ty);
          if (s.fx !== void 0 && s.fy !== void 0) {
            ch.x = s.fx;
            ch.y = s.fy;
          }
          if (s.dir) ch.dir = s.dir;
          break;
        case "enter": {
          const spot = this.spots.get(s.spot);
          if (spot) this.snapTo(ch, spot);
          break;
        }
        case "exit":
          if (ch.atSpot) {
            const spot = this.spots.get(ch.atSpot);
            if (spot) ch.placeAtTile(spot.tx, spot.ty);
          }
          ch.atSpot = null;
          ch.seated = false;
          ch.sortY = null;
          break;
        case "switch": {
          const room = this.rooms.get(s.room);
          if (room && (!s.onlyIfLast || isLastInRoom(room.id, ch.id, this.chars.values()))) room.setLight(s.on, now - 1e4);
          break;
        }
        case "stall": {
          const spot = this.spots.get(s.spot);
          if (spot) ch.placeAtTile(spot.tx, spot.ty);
          break;
        }
        case "elevOut": {
          const el = this.elevators[s.elev] ?? this.elevators[0];
          const spot = this.spots.get(el.spotId);
          if (spot) ch.placeAtTile(spot.tx, spot.ty);
          break;
        }
        case "do":
          s.fn();
          break;
        case "remove":
        case "elevIn":
          ch.gone = true;
          break;
        default:
          break;
      }
    }
  };

  // vendor/habblaud/upstream/client/src/world/sound-cues.ts
  var KEYS_TICK_MS = 160;
  var PINGPONG_PERIOD = 1100;
  var SoundCues = class {
    constructor(sim, camera, rng = Math.random) {
      this.sim = sim;
      this.camera = camera;
      this.rng = rng;
    }
    doors = [];
    keysAt = 0;
    nextKeysAt = 0;
    nextArcadeAt = 0;
    rally = /* @__PURE__ */ new Map();
    update(now, emit) {
      const a = this.camera.screenToWorld(0, 0);
      const b = this.camera.screenToWorld(this.camera.viewW, this.camera.viewH);
      const view = { x0: a.x, y0: a.y, x1: b.x, y1: b.y };
      const near = Math.max(0.45, Math.min(1, 0.25 + this.camera.zoom * 0.25));
      this.elevators(view, emit);
      this.keys(now, view, near, emit);
      this.social(now, view, near, emit);
    }
    pan(x, v) {
      const half = Math.max(1, (v.x1 - v.x0) / 2);
      return Math.max(-0.7, Math.min(0.7, (x - (v.x0 + v.x1) / 2) / half * 0.7));
    }
    inView(x, y, v, m = 16) {
      return x > v.x0 - m && x < v.x1 + m && y > v.y0 - m && y < v.y1 + m;
    }
    /** "Ding" quando a porta começa a abrir; fora da tela, mais baixo (ainda avisa que alguém chegou). */
    elevators(view, emit) {
      this.sim.elevators.forEach((e, i) => {
        const prev = this.doors[i];
        this.doors[i] = e.door;
        if (prev === void 0 || prev > 0.01 || e.door <= 0.01) return;
        const spot = this.sim.spots.get(e.spotId);
        if (!spot) return;
        emit({ kind: "elevator", gain: this.inView(spot.x, spot.y, view, 24) ? 1 : 0.5, pan: this.pan(spot.x, view) });
      });
    }
    /** Rajadas de teclas, mais frequentes quanto mais gente digita na tela. */
    keys(now, view, near, emit) {
      if (now - this.keysAt < KEYS_TICK_MS) return;
      this.keysAt = now;
      let n = 0;
      let sx = 0;
      for (const ch of this.sim.chars.values()) {
        if (!typing(ch) || !this.inView(ch.x, ch.y, view)) continue;
        n++;
        sx += ch.x;
      }
      if (!n || now < this.nextKeysAt) return;
      if (this.rng() > Math.min(0.8, 0.3 + 0.12 * n)) return;
      this.nextKeysAt = now + (700 + this.rng() * 1500) / Math.sqrt(Math.min(n, 6));
      emit({ kind: "keys", gain: near * Math.min(1, 0.6 + 0.1 * n), pan: this.pan(sx / n, view), count: 2 + Math.floor(this.rng() * 5) });
    }
    /** Pingue-pongue (raquetadas e quiques no ritmo da bolinha desenhada) e o fliperama. */
    social(now, view, near, emit) {
      const alive = /* @__PURE__ */ new Set();
      for (const g of this.sim.social.gatherings) {
        if (g.phase !== "run") continue;
        if (g.kind !== "pingpong" && g.kind !== "arcade") continue;
        let x = 0;
        let y = 0;
        let k = 0;
        for (const m of g.members) {
          if (m.role !== "player" || m.left) continue;
          const ch = this.sim.chars.get(m.id);
          if (!ch) continue;
          x += ch.x;
          y += ch.y;
          k++;
        }
        if (!k) continue;
        x /= k;
        y /= k;
        if (!this.inView(x, y, view, 24)) continue;
        if (g.kind === "pingpong") {
          alive.add(g.id);
          const seg = Math.floor((now - g.startAt) % (PINGPONG_PERIOD * 2) / (PINGPONG_PERIOD / 2));
          const prev = this.rally.get(g.id);
          this.rally.set(g.id, seg);
          if (prev !== void 0 && prev !== seg) emit({ kind: seg % 2 === 0 ? "pingpong" : "table", gain: near, pan: this.pan(x, view) });
        } else if (now >= this.nextArcadeAt) {
          this.nextArcadeAt = now + 500 + this.rng() * 900;
          emit({ kind: "arcade", gain: near * 0.8, pan: this.pan(x, view) });
        }
      }
      for (const id of this.rally.keys()) if (!alive.has(id)) this.rally.delete(id);
    }
  };
  function typing(ch) {
    return ch.mode === "work" && ch.seated && ch.pose === "type" && !ch.leaving && !ch.inside && ch.alpha > 0.5;
  }

  // vendor/habblaud/upstream/client/src/world/index.ts
  var art = art_exports;
  function createWorld(canvas2, store, o = {}) {
    let options = { ...DEFAULT_WORLD_OPTIONS };
    const visitMode = !!o.visit;
    const camera = new Camera();
    let sim = new Sim(art, () => options, void 0, { visit: visitMode });
    let renderer = new Renderer(canvas2, art, sim, camera);
    let overlay = new Overlay(renderer.ctx, sim, renderer, camera);
    let assets = null;
    let playback = null;
    let worldNow = 0;
    const selectCbs = /* @__PURE__ */ new Set();
    const hoverCbs = /* @__PURE__ */ new Set();
    const socialCbs = /* @__PURE__ */ new Set();
    const soundCbs = /* @__PURE__ */ new Set();
    const roomMenuCbs = /* @__PURE__ */ new Set();
    let cues = new SoundCues(sim, camera);
    let selection = null;
    let hover = null;
    let mouse2 = null;
    let raf = 0;
    let lastTs = 0;
    let hiddenAt = 0;
    let suspended = false;
    let suspendedAt = 0;
    let userMoved = false;
    let framed = false;
    let lastCols = -1;
    const abort = new AbortController();
    const resize = () => {
      const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
      const w = canvas2.clientWidth || window.innerWidth;
      const h = canvas2.clientHeight || window.innerHeight;
      const pw = Math.floor(w * dpr);
      const ph = Math.floor(h * dpr);
      if (canvas2.width !== pw || canvas2.height !== ph) {
        canvas2.width = pw;
        canvas2.height = ph;
      }
      camera.setView(w, h, dpr);
      updateBounds();
    };
    const buildingRect2 = () => ({ x: 0, y: 0, w: sim.building.cols * COL_W * TILE, h: BUILDING_H * TILE });
    const updateBounds = () => {
      const b = buildingRect2();
      camera.bounds = { x: b.x - 7 * TILE, y: b.y - 6 * TILE, w: b.w + 14 * TILE, h: b.h + 18 * TILE };
      const fit = camera.fitZoom(b, 16);
      camera.minZoom = Math.min(1, Math.max(0.25, fit));
      camera.clamp();
    };
    const overviewTarget = () => {
      const f = overviewFrame(buildingRect2(), camera.viewW, camera.viewH, camera.insets);
      const fit = Math.max(camera.minZoom, f.zoom);
      const snapped = camera.snapZoom(fit, "down");
      const zoom = snapped >= fit * 0.82 ? snapped : fit;
      const z = Math.min(zoom, 4);
      const c = camera.centerFor(f.cx, f.cy, z);
      return { x: c.x, y: c.y - f.dy / z, zoom: z };
    };
    const overview = (animate = true) => {
      camera.follow = null;
      const o2 = overviewTarget();
      if (animate) camera.animateTo(o2.x, o2.y, o2.zoom, Date.now(), 420);
      else {
        camera.stop();
        camera.x = o2.x;
        camera.y = o2.y;
        camera.zoom = o2.zoom;
        camera.clamp();
      }
    };
    const emitSelect = () => selectCbs.forEach((cb) => cb(selection));
    const sameSelection = (a, b) => a === b || !!a && !!b && a.type === b.type && a.id === b.id;
    const setSelection = (sel, focus = false) => {
      const same = sameSelection(sel, selection);
      selection = sel;
      if (options.followSelected) camera.follow = sel?.type === "agent" ? sel.id : null;
      if (focus && sel) {
        if (sel.type === "agent") focusAgent(sel.id, { follow: options.followSelected });
        else focusRoom(sel.id);
      }
      if (!same) emitSelect();
    };
    const focusAgent = (id, opts = {}) => {
      const ch = sim.person(id);
      if (!ch) return;
      userMoved = true;
      const zoom = Math.max(camera.zoom, camera.snapZoom(3));
      const c = camera.centerFor(ch.x, ch.y - 12, zoom);
      camera.animateTo(c.x, c.y, zoom, Date.now(), 420);
      camera.follow = opts.follow ? id : null;
    };
    const focusRoom = (id) => {
      const room = sim.rooms.get(id);
      if (!room) return;
      userMoved = true;
      camera.follow = null;
      const r = room.layout.rect;
      const rect = { x: r.x * TILE, y: r.y * TILE - 8, w: r.w * TILE, h: r.h * TILE + 16 };
      const fit = camera.fitZoom(rect, 40);
      const zoom = Math.min(4, Math.max(camera.minZoom, camera.snapZoom(fit, "down")));
      const c = camera.centerFor(rect.x + rect.w / 2, rect.y + rect.h / 2, zoom);
      camera.animateTo(c.x, c.y, zoom, Date.now(), 420);
    };
    const zoomStep = (steps, sx = camera.viewW / 2, sy = camera.viewH / 2) => {
      userMoved = true;
      camera.zoomAt(camera.stepZoom(steps), sx, sy, Date.now(), true);
    };
    const pick3 = (sx, sy) => {
      const w = camera.screenToWorld(sx, sy);
      let best = null;
      let bestDepth = -Infinity;
      const slack = Math.max(1, 3 / camera.zoom);
      for (const [id, h] of renderer.heads) {
        if (!h.visible || id === VISITOR_ID) continue;
        if (w.x < h.bx - slack || w.x > h.bx + h.bw + slack || w.y < h.by - slack || w.y > h.by + h.bh + slack) continue;
        if (h.depth > bestDepth) {
          bestDepth = h.depth;
          best = id;
        }
      }
      if (best) return { type: "agent", id: best };
      const tx = Math.floor(w.x / TILE);
      const ty = Math.floor(w.y / TILE);
      for (const room of sim.rooms.values()) if (room.present && !room.ghost && inRect(room.layout.rect, tx, ty)) return { type: "room", id: room.id };
      return null;
    };
    const setHover = (id) => {
      if (id === hover) return;
      hover = id;
      canvas2.style.cursor = id ? "pointer" : "grab";
      hoverCbs.forEach((cb) => cb(id));
    };
    const visitClick = (hit, at) => {
      if (hit?.type === "agent") return setSelection(hit);
      setSelection(null);
      const w = camera.screenToWorld(at.x, at.y);
      if (sim.visitorWalkTo(Math.floor(w.x / TILE), Math.floor(w.y / TILE))) followVisitor();
    };
    const followVisitor = () => {
      if (!sim.visitor) return;
      userMoved = true;
      camera.follow = VISITOR_ID;
    };
    const detachInput = attachInput(canvas2, camera, {
      pick: pick3,
      click: (hit, at) => visitMode ? visitClick(hit, at) : setSelection(hit),
      doubleClick: (hit) => {
        if (hit?.type === "agent") {
          setSelection(hit);
          focusAgent(hit.id, { follow: true });
        } else if (hit?.type === "room") focusRoom(hit.id);
      },
      hover: (sx, sy, inside) => {
        mouse2 = inside ? { x: sx, y: sy } : null;
        if (!inside) setHover(null);
      },
      interact: () => {
        userMoved = true;
        camera.follow = null;
        camera.stop();
      },
      overview: () => overview(true),
      zoomStep,
      active: () => !suspended,
      keys: () => !visitMode
    });
    const onSnapshot = () => {
      const snap = store.snapshot;
      if (!snap) return;
      try {
        if (playback) sim.applySnapshot(rebaseSnapshot(snap, worldNow - snap.serverTime), worldNow);
        else sim.applySnapshot(snap, Date.now());
      } catch (err) {
        console.error("[mundo] snapshot inv\xE1lido ignorado", err);
      }
    };
    const offSnapshot = store.on("snapshot", onSnapshot);
    if (store.snapshot) onSnapshot();
    void loadWorldAssets(abort.signal).then((a) => {
      if (!a) return;
      assets = a;
      renderer.setAssets(a);
    });
    if (document.fonts) document.fonts.addEventListener?.("loadingdone", () => overlay.resetCaches(), { signal: abort.signal });
    const loop = (ts) => {
      raf = requestAnimationFrame(loop);
      const real = Date.now();
      const realDt = lastTs ? Math.min(0.1, Math.max(0, (ts - lastTs) / 1e3)) : 1 / 60;
      lastTs = ts;
      const k = playback ? Math.max(0, playback.scale()) : 1;
      const dt = realDt * k;
      if (playback) worldNow += dt * 1e3;
      const now = playback ? worldNow : real;
      try {
        const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
        if (canvas2.clientWidth !== camera.viewW || canvas2.clientHeight !== camera.viewH || dpr !== camera.dpr) resize();
        sim.update(dt, now);
        const events = sim.social.events;
        if (events.length) {
          if (!playback) for (const e of events) for (const cb of socialCbs) cb(e);
          events.length = 0;
        }
        renderer.sync(seasonalThemeFor(options.theme, /* @__PURE__ */ new Date()));
        if (sim.building.cols !== lastCols) {
          lastCols = sim.building.cols;
          updateBounds();
          if (!framed && sim.initialized) {
            overview(false);
            framed = true;
          } else if (!userMoved) overview(true);
        }
        if (visitMode && sim.visitor && (sim.visitorIntent.dx || sim.visitorIntent.dy) && camera.follow !== VISITOR_ID) followVisitor();
        const followCh = camera.follow ? sim.person(camera.follow) : void 0;
        if (camera.follow && !followCh) camera.follow = null;
        camera.update(real, followCh ? camera.centerFor(followCh.x, followCh.y - 12, camera.zoom) : null, realDt);
        renderer.frame(now, dt, options, { agent: selection?.type === "agent" ? selection.id : null, room: selection?.type === "room" ? selection.id : null, hover });
        overlay.draw(now, options, { agent: selection?.type === "agent" ? selection.id : null, room: selection?.type === "room" ? selection.id : null, hover });
        renderer.pruneHeads();
        if (soundCbs.size && !playback) cues.update(now, (c) => soundCbs.forEach((cb) => cb(c)));
        if (mouse2) {
          const hit = pick3(mouse2.x, mouse2.y);
          setHover(hit?.type === "agent" ? hit.id : null);
        }
        if (selection?.type === "agent" && !sim.chars.has(selection.id)) setSelection(null);
        if (selection?.type === "room" && !sim.rooms.has(selection.id)) setSelection(null);
      } catch (err) {
        console.error("[mundo] erro no frame", err);
      }
    };
    const onVisibility = () => {
      if (suspended) return;
      if (document.hidden) {
        hiddenAt = Date.now();
        return;
      }
      lastTs = 0;
      if (hiddenAt && Date.now() - hiddenAt > 5e3) sim.fastForward(playback ? worldNow : Date.now());
      hiddenAt = 0;
    };
    const onContextMenu = (e) => {
      if (!roomMenuCbs.size) return;
      const r = canvas2.getBoundingClientRect();
      const sx = e.clientX - r.left;
      const sy = e.clientY - r.top;
      const hit = pick3(sx, sy);
      const w = camera.screenToWorld(sx, sy);
      const roomId = hit?.type === "room" ? hit.id : hit?.type === "agent" ? sim.chars.get(hit.id)?.roomId ?? null : [...sim.rooms.values()].find((room) => room.present && !room.ghost && inRect(room.layout.rect, Math.floor(w.x / TILE), Math.floor(w.y / TILE)))?.id ?? null;
      if (!roomId || !sim.rooms.has(roomId)) return;
      e.preventDefault();
      roomMenuCbs.forEach((cb) => cb(roomId, { x: e.clientX, y: e.clientY }));
    };
    canvas2.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    resize();
    raf = requestAnimationFrame(loop);
    const markMoved = () => userMoved = true;
    let debug = createDebug(sim, renderer, camera, markMoved);
    const rebuild = () => {
      sim.social.wallets.save(Date.now());
      sim = new Sim(art, () => options, playback ? null : void 0, { visit: visitMode });
      renderer = new Renderer(canvas2, art, sim, camera);
      if (assets) renderer.setAssets(assets);
      if (playback) {
        const p = playback;
        renderer.clock = () => p.clock();
      }
      overlay = new Overlay(renderer.ctx, sim, renderer, camera);
      debug = createDebug(sim, renderer, camera, markMoved);
      cues = new SoundCues(sim, camera);
      lastCols = -1;
      setHover(null);
    };
    return {
      select: (sel, opts) => setSelection(sel, !!opts?.focus),
      getSelection: () => selection,
      onSelect: (cb) => {
        selectCbs.add(cb);
        return () => void selectCbs.delete(cb);
      },
      onHover: (cb) => {
        hoverCbs.add(cb);
        return () => void hoverCbs.delete(cb);
      },
      focusAgent,
      focusRoom,
      overview: () => {
        userMoved = false;
        overview(true);
      },
      zoomBy: (factor) => {
        if (!Number.isFinite(factor) || factor <= 0 || factor === 1) return;
        const target = camera.snapZoom(camera.zoom * factor, factor > 1 ? "up" : "down");
        if (Math.abs(target - camera.zoom) < 1e-3) zoomStep(factor > 1 ? 1 : -1);
        else {
          userMoved = true;
          camera.zoomAt(target, camera.viewW / 2, camera.viewH / 2, Date.now(), true);
        }
      },
      getOptions: () => ({ ...options }),
      setOptions: (o2) => {
        options = { ...options, ...o2 };
        if (o2.followSelected !== void 0) camera.follow = o2.followSelected && selection?.type === "agent" ? selection.id : null;
      },
      setViewInsets: (ins) => {
        const v = (n, cur2) => typeof n === "number" && Number.isFinite(n) ? Math.max(0, n) : cur2;
        const cur = camera.insets;
        camera.insets = { top: v(ins.top, cur.top), right: v(ins.right, cur.right), bottom: v(ins.bottom, cur.bottom), left: v(ins.left, cur.left) };
        updateBounds();
        if (!userMoved && framed) overview(true);
      },
      screenPositionOf: (id) => {
        const h = renderer.heads.get(id);
        if (!h || !h.visible) return null;
        const p = camera.worldToScreen(h.x, h.y - 2);
        if (p.x < 0 || p.y < 0 || p.x > camera.viewW || p.y > camera.viewH) return null;
        return p;
      },
      social: (id) => sim.social.info(id),
      onRoomContextMenu: (cb) => {
        roomMenuCbs.add(cb);
        return () => void roomMenuCbs.delete(cb);
      },
      onSocialEvent: (cb) => {
        socialCbs.add(cb);
        return () => void socialCbs.delete(cb);
      },
      setPlayback: (p) => {
        playback = p;
        worldNow = p ? p.clock() : 0;
        rebuild();
      },
      onSound: (cb) => {
        soundCbs.add(cb);
        return () => void soundCbs.delete(cb);
      },
      setSuspended: (on) => {
        if (on === suspended) return;
        suspended = on;
        if (on) {
          cancelAnimationFrame(raf);
          suspendedAt = Date.now();
          setHover(null);
          mouse2 = null;
          return;
        }
        lastTs = 0;
        if (suspendedAt && Date.now() - suspendedAt > 5e3) sim.fastForward(playback ? worldNow : Date.now());
        suspendedAt = 0;
        hiddenAt = 0;
        raf = requestAnimationFrame(loop);
      },
      destroy: () => {
        cancelAnimationFrame(raf);
        abort.abort();
        offSnapshot();
        detachInput();
        window.removeEventListener("resize", resize);
        canvas2.removeEventListener("contextmenu", onContextMenu);
        document.removeEventListener("visibilitychange", onVisibility);
        selectCbs.clear();
        hoverCbs.clear();
        socialCbs.clear();
        soundCbs.clear();
      },
      get debug() {
        return debug;
      },
      visit: {
        setVisitor: (me) => {
          if (!visitMode) return;
          sim.setVisitor(me ? visitorInfo(me, Date.now()) : null, Date.now());
        },
        setIntent: (intent) => {
          sim.visitorIntent = visitMode ? { ...intent } : { ...NO_INTENT };
        },
        setLight: (mode) => {
          if (!visitMode || sim.visitLight === mode) return;
          sim.visitLight = mode;
          sim.applyVisitLight(Date.now());
        },
        atExit: () => visitMode && !!sim.visitorElevator(),
        exit: (done) => {
          if (!visitMode || !sim.visitorExit(done)) return false;
          followVisitor();
          return true;
        },
        visitorScreen: () => {
          const h = renderer.heads.get(VISITOR_ID);
          if (!h || !h.visible) return null;
          const p = camera.worldToScreen(h.x, h.y - 2);
          if (p.x < 0 || p.y < 0 || p.x > camera.viewW || p.y > camera.viewH) return null;
          return p;
        },
        boardScreen: () => {
          const r = visitMode ? renderer.paintingRect(RECEPTION_ID) : null;
          if (!r) return null;
          const a = camera.worldToScreen(r.x, r.y);
          const b = camera.worldToScreen(r.x + r.w, r.y + r.h);
          if (b.x < 0 || b.y < 0 || a.x > camera.viewW || a.y > camera.viewH) return null;
          return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
        }
      }
    };
  }

  // vendor/habblaud/openbot-entry.ts
  var upstreamRevision = "faa1a012b5fbf632c66dc6801c5383e53a542406";
  return __toCommonJS(openbot_entry_exports);
})();
