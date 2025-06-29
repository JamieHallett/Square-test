const degToRad = Math.PI / 180;
const scale = 0.25; // 1m/s = 0.25px/10ms 1m = 25px
const loopfreq = 100; // 100hz
const floorY = 440;
const keyStatus = {
  w: false,
  a: false,
  s: false,
  d: false,
};
const main = document.getElementById("main");
const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");
let renderDeltaTime = 0;
let then = 0;

class Projectile {
  constructor(
    origin = { X: 0, Y: 0, id: "genericPlayer" },
    Xvel,
    Yvel,
    size,
    dmg
  ) {
    this.type = "projectile";
    this.id = origin.id + "#" + projectileID;
    this.projecID = projectileID;
    this.X = origin.X;
    this.Y = origin.Y;
    this.Xvel = Xvel;
    this.Yvel = Yvel;
    this.size = size;
    this.dmg = dmg;
    this.ownerID = origin.id;
    artillery[origin.id + "#" + projectileID] = this;
    projectileID++; // projectileID is only incremented after (this is important)
  }
}

class Item {
  constructor(name, material = "null", mult = 1) {
    this.type = "item";
    this.name = name;
    this.material = material; // material is null if item is for testing purposes
    this.mult = mult; // mult is the amount of items in the stack
    this.id = itemID;
    itemID++;
  }
}

class Dust extends Item {
  // a material on its own in an inventory is considered a dust and can be moulded into a shape
  constructor(material, mult = 1) {
    super(material, undefined, mult);
  }
}

class Shape extends Item {
  // a shape is a single material shaped into a shape, if it is not made of a single material it is made of an alloy
  constructor(name, material, mult = 1) {
    super(name, material, mult);
    this.attachments = {}; // attachments are other items that can be attached to this item
  }
}

class Construct extends Item {
  // a construct is a collection of attached shapes in a commonly used configuration made into a single item for simplicity
  constructor(name, materials, mult = 1) {
    super(name, JSON.stringify(materials), mult);
    this.materials = materials; // materials of the shapes that make up this construct, it is an object with keys being the shape names and values being the materials
    this.attachments = {}; // attachments are other items that can be attached to this item
  }
}

const camera = {
  X: 0,
  Y: 0,
  width: 300,
  height: 150,
  scale: 1,
  lockToPlayer: true, // if true, camera will follow the player
  makeRelative: function (obj) {
    // turns the coordinates of an object in the game world into coordinates on the canvas
    return Object.assign({}, obj, {
      X: (obj.X - camera.X) * camera.scale + camera.width / 2,
      Y: (obj.Y - camera.Y) * camera.scale + camera.height / 2,
      size: obj.size * camera.scale,
    });
  },
  makeAbsolute: function (obj) {
    // turns the coordinates of an object on the canvas into coordinates in the game world
    console.log(camera.X, camera.Y, camera.scale);
    return Object.assign({}, obj, {
      X: obj.X / camera.scale + camera.X - camera.width / camera.scale / 2,
      Y: obj.Y / camera.scale + camera.Y - camera.height / camera.scale / 2,
      size: obj.size / camera.scale,
    });
  },
  centerForDrawing: function (obj) {
    // centers the coordinates of an object on the canvas for drawing
    return Object.assign({}, obj, {
      X: obj.X - obj.size / 2,
      Y: obj.Y - obj.size / 2,
    });
  },
};
const mouse = {
  X: 0,
  Y: 0,
  get relX() {
    return camera.makeAbsolute({ X: mouse.X, Y: mouse.Y }).X - Square.X;
  }, // relative to player
  get relY() {
    return camera.makeAbsolute({ X: mouse.X, Y: mouse.Y }).Y - Square.Y;
  },
  getPlayerRelCoords: function () {
    const { X, Y } = camera.makeAbsolute({ X: mouse.X, Y: mouse.Y });
    // console.log("mouse abs", X, Y);
    // console.log(Square.X + X);
    return {
      X: X - Square.X,
      Y: Y - Square.Y,
    };
  },
  getCamRelCoords: function () {
    const { X, Y } = camera.makeAbsolute({ X: mouse.X, Y: mouse.Y });
    // console.log("mouse abs", X, Y);
    // console.log(Square.X + X);
    return {
      X: X - camera.X,
      Y: Y - camera.Y,
    };
  },
  getAbsCoords: function () {
    return camera.makeAbsolute({ X: mouse.X, Y: mouse.Y });
  },
};
let trackMouse = true;
const Square = {
  elem: document.getElementById("square"),
  X: 0,
  Y: 0,
  Xvel: 0,
  Yvel: 0,
  maxJumps: 1,
  jumps: this.maxjumps,
  speed: 4.3, // in m/s
  sizetospd: 0.172,
  size: 25, // in pixels
  color: "#050505",
  grounded: false,
  cannon: {
    // no longer used
    angle: 0,
    vel: 75,
  },
};
const otherSquare = {
  elem: document.getElementById("othersquare"),
  X: 212.5,
  Y: 212.5,
  Xvel: 0,
  Yvel: 0,
  size: 25,
  color: "#050505", // standard square colour
  hit: function (dmg) {
    console.log(dmg);
    otherSquare.color = "#800000"; // dark red
    setTimeout(function () {
      otherSquare.color = "#050505"; // reset to standard square colour in 50ms
    }, 50);
  },
};

let gravitymode = false;
let trail = false;
let menu = false;
let inventory = false;
let firing = false;
let typing = false;
let projectileID = 0;
let itemID = 0;
let artillery = {};
const storageUI = {
  pane: false,
  parentLocation: "machines",
  location: "magic_smelter#1",
  realParents: {
    get machines() {
      return universe.machines;
    },
    get items() {
      return inventoryItems;
    },
  },
  getStorage: function () {
    return this.realParents[this.parentLocation][this.location];
  },
  open() {
    this.pane = true;
    const paneStyle = document.getElementById("storageaccessUI").style;
    paneStyle.width = "250px";
    paneStyle.paddingLeft = "8px";
    this.startAutoUpdate();
  },
  close() {
    this.pane = false;
    const paneStyle = document.getElementById("storageaccessUI").style;
    paneStyle.width = "0px";
    paneStyle.paddingLeft = "0px";
    this.stopAutoUpdate();
  },
  update: function () {
    // update table inside the storage pane then update buttons with processes
    const storagecontainer = document.getElementById("storagename");
    const storageloc = this.getStorage();
    storagecontainer.innerText = JSON.stringify(storageloc, null, 2);
    updInventoryTable(storageloc.storage, "accessedtable");
    this.updMachineProcessButtons();
  },
  autoUpdateID: 0,
  startAutoUpdate() {
    this.autoUpdateID = setInterval(() => {
      updInventoryTable(this.getStorage().storage, "accessedtable");
    }, 10);
  },
  stopAutoUpdate() {
    clearInterval(this.autoUpdateID);
  },
  updMachineProcessButtons: function () {
    const btncontainer = document.getElementById("processcontainer");
    btncontainer.replaceChildren(); // remove all existing buttons by replacing with nothing
    const storageloc = this.getStorage();
    const db = itemdb[storageloc.name.split("#")[0]];
    for (const [processName, process] of Object.entries(db.in_out || {})) {
      // create button for each process
      const btn = document.createElement("button");
      btn.innerText = "In out " + processName;
      btncontainer.appendChild(btn);
      btn.onclick = function () {
        // startup process on click
        setFactoryProcessIn_Out(storageloc, processName);
      };
    }
    for (const [processName, process] of Object.entries(db.out_free || {})) {
      // repeat for out_free
      const btn = document.createElement("button");
      btn.innerText = "Free output " + processName;
      btncontainer.appendChild(btn);
      btn.onclick = function () {
        // startup process on click
        setFactoryProcessOut_Free(storageloc, processName);
      };
    }
    // repeat for out_free
  },
  setToMouseoverMachine: function () {
    // sets storage location to the factory that is being moused over
    for (const [name, obj] of Object.entries(universe.machines)) {
      if (collision(mouse.getCamRelCoords(), obj, true)) {
        this.parentLocation = "machines";
        this.location = name;
        this.update();
        return;
      }
    }
  },
  transferTo(itemName, itemMaterial = "null") {
    addToStorage(this.getStorage(), itemName);
    subtractFromStorage();
    this.update(); // update the table
  },
  transferFrom() {},
};
const OLDinventoryItems = {
  ammo_a: {
    name: "ammo_a",
    unique: false,
    mult: 20,
  },
  ammo_b: {
    name: "ammo_b",
    unique: false,
    mult: 60,
  },
  ammo_c: {
    name: "ammo_c",
    unique: false,
    mult: 90,
  },
  ammo_d: {
    name: "ammo_d",
    unique: false,
    mult: 20,
  },
  "weapon_c#0": {
    name: "weapon_c",
    unique: true,
    mult: 1,
  },
  cube: {
    name: "cube",
    unique: false,
    mult: 1,
    material: "tungsten",
  },
};
///*
const inventoryItems = {
  ammo_a: {
    null: {
      name: "ammo_a",
      unique: false,
      mult: 20,
    },
  },
  ammo_b: {
    null: {
      name: "ammo_b",
      unique: false,
      mult: 60,
    },
  },
  ammo_c: {
    null: {
      name: "ammo_c",
      unique: false,
      mult: 90,
    },
  },
  ammo_d: {
    null: {
      name: "ammo_d",
      unique: false,
      mult: 20,
    },
  },
  weapon_c: {
    null: {
      name: "weapon_c",
      unique: true,
      mult: 1,
    },
  },
  cube: {
    tungsten: {
      name: "cube",
      unique: false,
      mult: 1,
      material: "tungsten",
    },
    tungsten_carbide: {
      name: "cube",
      unique: false,
      mult: 1,
      material: "tungsten_carbide",
    },
  },
  weapon_c_part1: {
    iron: {
      name: "weapon_c_part1",
      unique: false,
      mult: 1,
      material: "iron",
      attachments: {
        upper: {
          /*
          weapon_c_part2: {
            name: "weapon_c_part2",
            unique: false,
            mult: 1,
            material: "iron",
            attachments: {
              barrel: {
                weapon_c_part3: {
                  name: "weapon_c_part3",
                  unique: false,
                  mult: 1,
                  material: "iron",
                },
              },
            },
          },
          */
        },
      },
    },
  },
};
//*/
const universe = {
  get Square() {
    return Square;
  },
  get OtherSquare() {
    return otherSquare;
  },
  get Projectiles() {
    return artillery;
  },
  items: {},
  machines: {},
};
const weapons = {
  code: "c", // this is the default weapon
  get current() {
    return weapons[weapons.code];
  },
  a: {
    rate: 4.16,
    interval: 240,
    dmg: 115,
    dmgrange: { start: 100, end: 225, endval: 100 },
    vel: 950,
    auto: false,
    inacc: 0,
    projecMult: 1,
  },
  b: {
    rate: 9,
    interval: 110,
    dmg: 45,
    dmgrange: { start: 75, end: 150, endval: 35 },
    vel: 950,
    auto: true,
    inacc: 0,
    projecMult: 1,
  },
  c: {
    rate: 13,
    interval: 75,
    dmg: 35,
    dmgrange: { start: 50, end: 150, endval: 30 },
    vel: 950,
    auto: true,
    inacc: 0,
    projecMult: 1,
  },
  d: {
    rate: 10,
    interval: 100,
    dmg: 30,
    dmgrange: { start: 25, end: 75, endval: 20 },
    vel: 400,
    auto: false,
    inacc: 0.05, // max inaccuracy measured in radians (but it breaks down at higher values)
    projecMult: 8,
  },
  e: {
    rate: 20,
    interval: 50,
    dmg: 30,
    dmgrange: { start: 25, end: 75, endval: 15 },
    vel: 200,
    auto: false,
    inacc: 0,
    projecMult: 1,
  },
  testwave: {
    rate: 2,
    interval: 500,
    dmg: 1,
    dmgrange: { start: 25, end: 75, endval: 20 },
    vel: 40,
    auto: true,
    inacc: 0.2,
    projecMult: 50,
  },
  testinacc: {
    rate: 50,
    interval: 20,
    dmg: 35,
    dmgrange: { start: 50, end: 150, endval: 30 },
    vel: 950,
    auto: true,
    inacc: 0.02, // inaccuracy with only 1 projectile
    projecMult: 1,
  },
  testlagmaker: {
    rate: 500,
    interval: 2,
    dmg: 1,
    dmgrange: { start: 50, end: 150, endval: 1 },
    vel: 950,
    auto: true,
    inacc: 0,
    projecMult: 1,
  },
};
let firingIntervalID = 0;
let canFire = true;
const itemdb = {
  weapon_a: {
    title: "Weapon A",
    desc: "Massive weapon designed to destroy many things, mostly vehicles.",
    unique: true,
    type: "construct",
    tags: ["takes_attachments", "weapon"],
    methods: ["item_drop"],
    mass: 13.5,
    volume: 0.001_7,
  },
  ammo_a: {
    title: "Ammo A",
    desc: "Heavy ammunition for weapon A.",
    unique: false,
    type: "construct",
    tags: [],
    methods: ["item_drop"],
    mass: 0.1,
    volume: 0.000_056,
  },
  weapon_b: {
    title: "Weapon B",
    desc: "Weapon designed for 600-800m, while still being usable at closer distances.",
    unique: true,
    type: "construct",
    tags: ["takes_attachments", "weapon"],
    methods: ["item_drop"],
    mass: 3.58,
    volume: 0.000_5,
  },
  ammo_b: {
    title: "Ammo B",
    desc: "Medium ammunition for weapon B.",
    unique: false,
    type: "construct",
    tags: [],
    methods: ["item_drop"],
    mass: 0.02,
    volume: 0.000_010,
  },
  weapon_c: {
    title: "Weapon C",
    desc: "Weapon designed to be lightweight while still being effective outside of close quarters.",
    unique: true,
    type: "construct",
    tags: ["takes_attachments", "weapon"],
    methods: ["item_drop"],
    mass: 2.92,
    volume: 0.000_4,
  },
  weapon_c_part1: {
    title: "Weapon C part 1",
    desc: "The basis of weapon C.",
    unique: false,
    type: "construct",
    tags: ["takes_attachments", "weapon"],
    methods: ["item_drop"],
    mass: 1,
    volume: 0.000_1,
    attachpoints: ["upper"],
  },
  weapon_c_part2: {
    title: "Weapon C part 2",
    desc: "A part of weapon C.",
    unique: false,
    type: "construct",
    tags: ["takes_attachments", "attachment"],
    methods: ["item_drop"],
    mass: 1,
    volume: 0.000_25,
    attachlocations: ["upper"],
    attachpoints: ["barrel"],
  },
  weapon_c_part3: {
    title: "Weapon C part 3",
    desc: "A part of weapon C.",
    unique: false,
    type: "shape",
    tags: ["attachment"],
    methods: ["item_drop"],
    mass: 0.92,
    volume: 0.000_05,
    attachlocations: ["barrel"],
  },
  ammo_c: {
    title: "Ammo C",
    desc: "Light ammunition for weapon C.",
    unique: false,
    type: "construct",
    tags: [],
    methods: ["item_drop"],
    mass: 0.01,
    volume: 0.000_005,
  },
  ammo_d: {
    title: "Ammo D",
    desc: "Ammunition for weapon D, containing several small projectiles.",
    unique: false,
    type: "construct",
    tags: [],
    methods: ["item_drop"],
    mass: 0.034,
    volume: 0.000_018,
  },
  ammo_e: {
    title: "Ammo E",
    desc: "Small ferromagnetic pellets for weapon E.",
    unique: false,
    type: "construct",
    tags: [],
    methods: ["item_drop"],
    mass: 0.05,
    volume: 0.000_006_3,
  },

  iron_ore: {
    title: "Iron Ore",
    desc: "A rock with a high % of iron, as well as oxygen. Can be refined using carbon, or more advanced methods.",
    unique: false,
    type: "material",
    tags: [],
    methods: ["item_drop"],
    mass: 1,
    volume: 0.000_400,
    hardness: 5.5,
    melting_point: 1838,
  },
  iron: {
    title: "Iron",
    desc: "Mostly pure iron. Stronger than most other metals, but not known for being light.",
    unique: false,
    type: "material",
    tags: [],
    methods: ["item_drop"],
    mass: 1,
    volume: 0.000_125,
    hardness: 4.5,
    melting_point: 1811,
  },
  carbon: {
    title: "Carbon",
    desc: "Carbon with no crystalline structure, like charcoal. Ideal for combustion and for refnery of some metals.",
    unique: false,
    type: "material",
    tags: ["nomelting"],
    methods: ["item_drop"],
    mass: 1,
    volume: 0.000_900,
    hardness: 3,
    melting_point: 800, // This item is set to no melting, so this is the ignition temperature
  },
  lead_ore: {
    title: "Lead Ore",
    desc: "A rock with a high % of lead, as well as sulphur and maybe even silver. Can be refined using carbon, or more advanced methods.",
    unique: false,
    type: "material",
    tags: [],
    methods: ["item_drop"],
    mass: 1,
    volume: 0.000_130,
    hardness: 2.5,
    melting_point: 1387,
  },
  lead: {
    title: "Lead",
    desc: "A soft and malleable metal with a high density. Used in ammunition and simple rechargable batteries.",
    unique: false,
    type: "material",
    tags: [],
    methods: ["item_drop"],
    mass: 1,
    volume: 0.000_090,
    hardness: 1.5,
    melting_point: 600,
  },
  tungsten_ore: {
    title: "Tungsten Ore",
    desc: "A rock containing tungsten, as well as calcium. ",
    unique: false,
    type: "material",
    tags: [],
    methods: ["item_drop"],
    mass: 1,
    volume: 0.000_164,
    hardness: 4.5,
    melting_point: 3695, // I couldn't find the melting point of tungsten ore, so I used the melting point of tungsten
  },
  tungsten: {
    title: "Tungsten",
    desc: "The hardest and most heat resistant metal known, with an exceptionally high density. Used in high performance tools, ammunition, armour, everything.",
    unique: false,
    type: "material",
    tags: [],
    methods: ["item_drop"],
    mass: 1,
    volume: 0.000_052,
    hardness: 7.5,
    melting_point: 3695,
  },
  tungsten_carbide: {
    title: "Tungsten Carbide",
    desc: "A compound of tungsten and carbon, with a hardness only surpassed by diamond. Used mostly in cutting tools.",
    unique: false,
    type: "material",
    tags: [],
    methods: ["item_drop"],
    mass: 1,
    volume: 0.000_064,
    hardness: 9.5,
    melting_point: 3143,
  },

  cube: {
    title: "{material} Cube",
    desc: "A cube made of {material}.",
    unique: false,
    type: "shape",
    tags: ["format_title"],
    methods: ["item_drop"],
    volume: 0.000_125,
  },

  magic_smelter: {
    title: "magic smelter",
    desc: "smelts items without electricity or fuel, converting all of the input's mass to the output",
    unique: true,
    type: "factory",
    tags: [],
    methods: ["machine_place", "item_drop"],
    in_out: {
      iron_ore: {
        in: "iron_ore",
        in_amount: 1,
        out: "iron",
        out_amount: 1,
        other_required: [],
        other_quantity: [],
        byproducts: [],
        byproduct_quantity: [],
        interval: 100,
      },
      lead_ore: {
        in: "lead_ore",
        in_amount: 1,
        out: "lead",
        out_amount: 1,
        other_required: [],
        other_quantity: [],
        byproducts: [],
        byproduct_quantity: [],
        interval: 100,
      },
    },
    storage: {
      max_volume: 200,
      drop_on_pickup: false,
    },
  },
  magic_iron_ore_machine: {
    title: "magic iron ore maker",
    desc: "creates iron ore for free",
    unique: true,
    type: "factory",
    methods: ["machine_place", "item_drop"],
    out_free: {
      iron_ore: {
        out: "iron_ore",
        interval: 100,
      },
    },
    storage: {
      max_volume: 200,
      drop_on_pickup: true,
    },
  },

  example: {
    title: "Example Item",
    desc: "If you are reading this, this item is not in the database (unless the internal name is 'example')",
    unique: true, // if item is unique, it cannot be stacked
    type: "construct", // type of item, can be "factory", "building", "construct", "material", "shape"
    /* 
    - factory is a machine that can be walked over and used to create or process items
    - building cannot be walked over but works as a machine
    - construct is an item made of multiple shapes
    - shapes are single materials shaped into shapes, if it is not made of a single material it is made of an alloy
    - material is a single material that can be used in a shape 
    */
    tags: [], // miscellaneous data about the item
    methods: ["item_drop"], // methods that can be used on this item
    mass: 1, // in kg
    volume: 0.001, // in m^3
  },
};
const itemMethodDB = {
  machine_place: function (name, origin) {
    placeMachine(name, true, origin);
  },
  item_drop: function (name, origin, item) {
    dropItem(
      name,
      Number(prompt("Enter amount to drop:")),
      origin,
      item.material
    );
  },
};
const assemblydb = {
  weapon_c: {
    weapon_c_part1: {
      mult: 1,
    },
    weapon_c_part2: {
      mult: 1,
    },
    weapon_c_part3: {
      mult: 1,
      allowed_materials: ["iron"],
    },
  },
};

function squareleft(v) {
  Square.X -= v; //moves square left
  Square.elem.style.left = Square.X - Square.size / 2 + "px";
}

function squareright(v) {
  Square.X += v; //moves square right
  Square.elem.style.left = Square.X - Square.size / 2 + "px";
}

function squareup(v) {
  Square.Y -= v; //moves square up
  Square.elem.style.top = Square.Y - Square.size / 2 + "px";
}

function squaredown(v) {
  Square.Y += v; //moves square down
  Square.elem.style.top = Square.Y - Square.size / 2 + "px";
}

function objUp(obj, v) {
  obj.Y -= v; //moves object up
  obj.elem.style.top = obj.Y - obj.size / 2 + "px";
}
function objDown(obj, v) {
  obj.Y += v; //moves object down
  obj.elem.style.top = obj.Y - obj.size / 2 + "px";
}

function toggletrackMouse() {
  trackMouse = !trackMouse;
  if (trackMouse) {
    canvas.addEventListener("mousemove", trackmouse);
  } else {
    canvas.removeEventListener("mousemove", trackmouse);
  }
}

function trackmouse(event) {
  // track mouse position on the canvas
  mouse.X = event.offsetX;
  mouse.Y = event.offsetY;
  //console.log(Mouse.X, Mouse.Y);
}

/*
const slider = document.getElementById("myRange");
const output = document.getElementById("slidervalue");

output.innerHTML = slider.value; // Display the default slider value
Square.speed = slider.value * Square.sizetospd;

// Update the current slider value (each time you drag the slider handle)
slider.oninput = function () {
  output.innerHTML = this.value;
  Square.elem.style.height = this.value + "px";
  Square.elem.style.width = this.value + "px";
  Square.size = this.value;
  Square.speed = this.value * Square.sizetospd;
};

*/

window.addEventListener("resize", function () {
  console.log("Resizing canvas to fit window");
  // update camera width and height on resize
  camera.width = window.innerWidth;
  camera.height = window.innerHeight;
  canvas.width = camera.width;
  canvas.height = camera.height;
  //Square.elem.style.width = Square.size + "px";
  //Square.elem.style.height = Square.size + "px";
  //otherSquare.elem.style.width = otherSquare.size + "px";
  //otherSquare.elem.style.height = otherSquare.size + "px";
});

function changezoom(event) {
  event.preventDefault(); // we don't want to scroll the page while zooming the canvas even if it is too small to scroll
  event.deltaY > 0 ? (camera.scale *= 0.8) : (camera.scale *= 1.25);
}

canvas.addEventListener("wheel", changezoom);

const slider2 = document.getElementById("cannonAngle");
const output2 = document.getElementById("cannonAngValue");

output2.innerHTML = slider2.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
slider2.oninput = function () {
  output2.innerHTML = this.value;
  Square.cannon.angle = this.value;
};

/* Set the width of the side navigation to 250px */
function openNav() {
  menu = true;
  document.getElementById("mySidenav").style.width = "250px";
}

/* Set the width of the side navigation to 0 */
function closeNav() {
  menu = false;
  document.getElementById("mySidenav").style.width = "0";
}

function openInventory() {
  inventory = true;

  const pane = document.getElementById("inventory");

  pane.style.visibility = "visible";
  pane.getElementsByTagName("pre")[0].innerHTML = JSON.stringify(
    inventoryItems,
    null,
    2
  );

  updInventoryTable(inventoryItems);
}

function closeInventory() {
  inventory = false;
  document.getElementById("inventory").style.visibility = "hidden";
}

function storageToArray(storage) {
  /* storage looks like this:
  {
    cube: {iron: ironcube, lead: leadcube, ...},
    sphere: {iron: ironsphere, lead: leadsphere, ...},
    ...
  }
  */
  const arr = [];
  for (const [name, items] of Object.entries(storage)) {
    for (const [name, item] of Object.entries(items)) {
      arr.push(item);
    }
  }
  return arr;
}

function updInventoryTable(json = inventoryItems, containername = "itemtable") {
  json = storageToArray(json);

  // Get the container element where the table will be inserted
  let container = document.getElementById(containername);

  // Create the table element
  let table = document.createElement("table");

  // these are the names of the column headers
  let cols = ["Name", "Description", "Quantity", "Actions", "Internal ID"];

  // this is how each column of the table body is created
  const columnFuncs = [
    (name, item) =>
      (itemdb[name].tags || []).includes("format_title")
        ? (itemdb[name] || itemdb.example).title.replaceAll(
            "{material}",
            itemdb[item.material].title
          )
        : (itemdb[name] || itemdb.example).title,
    (name, item) =>
      (itemdb[name].tags || []).includes("format_title")
        ? (itemdb[name] || itemdb.example).desc.replaceAll(
            "{material}",
            itemdb[item.material].title
          )
        : (itemdb[name] || itemdb.example).desc,
    (name, item) => (item || { mult: "-" }).mult, // if item is unique, name will not be in json and so mult will be "-"
    (name, item) => {
      // create button(s) for each action, put in container, return container
      const btncontainer = document.createElement("div");
      /*const btn = document.createElement("button");
      btn.innerText = "Do nothing!";
      btncontainer.appendChild(btn);
      btn.onclick = function() {
        alert("I lied, this is not nothing");
      };*/
      //console.log(name,itemdb[name]); //debug
      (itemdb[name] || itemdb.example).methods.forEach((methodName) => {
        const btn = document.createElement("button");
        btn.innerText = methodName;
        btncontainer.appendChild(btn);
        btn.onclick = function () {
          itemMethodDB[methodName](name, Square, item); // uses name with id if that exists
          updInventoryTable(); // update inventory table in case something changes
        };
      });
      return btncontainer;
    },
    (name) => name, // uses name with id if that exists
  ];

  // Create the header element
  let thead = document.createElement("thead");
  let tr = document.createElement("tr");

  // Loop through the column names and create header cells
  cols.forEach((item) => {
    let th = document.createElement("th");
    th.innerText = item; // Set the column name as the text of the header cell
    tr.appendChild(th); // Append the header cell to the header row
  });
  thead.appendChild(tr); // Append the header row to the header
  table.append(tr); // Append the header to the table

  // Loop through the JSON data and create table rows
  json.forEach((item) => {
    let tr = document.createElement("tr");
    // Loop through the values and create table cells
    columnFuncs.forEach((func) => {
      const content = func(item.name.split("#")[0], item); // The functions return the content to be displayed in each cell
      if (["string", "number"].includes(typeof content)) {
        const td = document.createElement("td");
        td.innerText = content; // Set the text of the cell to the value returned by the function
        tr.appendChild(td);
      } else {
        //console.log(text, func);
        const td = document.createElement("td");
        td.appendChild(content); // In this case, content is actually a div element, so append that to the cell
        tr.appendChild(td); // Append the table cell to the table row
      }
    });
    table.appendChild(tr); // Append the table row to the table
  });
  container.replaceChildren(table); // Put the table in its container element
}

// Add event listener on keydown
document.addEventListener(
  "keydown",
  (event) => {
    const name = event.key;
    // const code = event.code;
    // Alert the key name and key code on keydown
    // alert(`Key pressed ${name} \r\n Key code value: ${code}`);

    if (!typing) {
      switch (name.toLowerCase()) {
        case "a":
          keyStatus.a = 1;
          break;
        case "d":
          keyStatus.d = 1;
          break;
        case "w":
          keyStatus.w = 1;
          break;
        case "s":
          keyStatus.s = 1;
          break;

        case " ":
          jump();
          break;
        case "v":
          setFiring(true);
          break;
      }
    }
  },
  false
);

document.addEventListener(
  "keyup",
  (event) => {
    const name = event.key;

    if (!typing) {
      switch (name.toLowerCase()) {
        case "a":
          keyStatus.a = 0;
          break;
        case "d":
          keyStatus.d = 0;
          break;
        case "w":
          keyStatus.w = 0;
          break;
        case "s":
          keyStatus.s = 0;
          break;

        case "v":
          setFiring(false);
          break;

        case "c":
          if (!menu) {
            openNav();
          } else {
            closeNav();
          }
          break;
        case "i":
          if (!inventory) {
            openInventory();
          } else {
            closeInventory();
          }
          break;
        case "u":
          if (!storageUI.pane) {
            storageUI.open();
            storageUI.update();
          } else {
            storageUI.close();
          }
          break;

        case "g":
          storageUI.setToMouseoverMachine();
          break;
        case "t":
          teleport(); // by default teleports othersquare to mouse
          break;
        case "r":
          removprojecs();
          break;
        case "o":
          makeItem("name");
          break;
        case "p":
          makeItem("iron", 100, 50);
          break;
        case "e":
          pickItem();
          if (inventory) {
            updInventoryTable();
          }
          break;
        case "k":
          dropItem(
            prompt("enter item internal ID to drop"),
            Number(prompt("enter quantity to drop")) || 1
          );
          if (inventory) {
            updInventoryTable();
          }
          break;
        case "[":
          makeItem("magic_smelter", 275, 75);
          break;
        case "]":
          makeItem("magic_iron_ore_machine", 275, 100);
          break;
        case "#":
          storageUI.parentLocation = prompt("enter parent location");
          storageUI.location = prompt("enter location");
          storageUI.update();
          break;
        case "m":
          alert(JSON.stringify(universe.machines, null, 2));
          break;

        default:
          console.log("unrecognised key pressed:" + name);
          break;
      }
    }
  },
  false
);

document.addEventListener("mousemove", trackmouse);

function renderFrame(now) {
  now *= 0.001; // convert to seconds
  renderDeltaTime = now - then;
  then = now;

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  Object.values([Square, otherSquare]).forEach((player) => {
    // draw players
    ctx.fillStyle = player.color;
    const draw = camera.centerForDrawing(camera.makeRelative(player));
    //console.log("camera is ", camera.X, camera.Y); //////////////////////////////
    ctx.fillRect(draw.X, draw.Y, draw.size, draw.size);
  });

  ctx.fillStyle = "#616161";
  Object.values(artillery).forEach((projectile) => {
    //console.log("x and vel", projectile.X, projectile.Xvel); /////////////////
    const draw = camera.centerForDrawing(camera.makeRelative(projectile));
    ctx.fillRect(draw.X, draw.Y, draw.size, draw.size);
  });

  ctx.fillStyle = "#ffff0f";
  Object.values(universe.items).forEach((item) => {
    const draw = camera.centerForDrawing(camera.makeRelative(item));
    ctx.fillRect(draw.X, draw.Y, draw.size, draw.size);
  });

  ctx.fillStyle = "#303030";
  Object.values(universe.machines).forEach((machine) => {
    const draw = camera.centerForDrawing(camera.makeRelative(machine));
    ctx.fillRect(draw.X, draw.Y, draw.size, draw.size);
  });

  requestAnimationFrame(renderFrame);
}

function loop() {
  movement();
  projectilemove();
  checkProjecColl();
  /*if (trail) {
    makeprojectile();
  }*/
  /*if (firing) {
    makeprojectile(true);
  }*/
}

function toggleGravity() {
  gravitymode = !gravitymode;
  if (gravitymode) {
    document.getElementById("floor").style.visibility = "visible";
  } else {
    document.getElementById("floor").style.visibility = "hidden";
  }
}

function gravity(obj = Square) {
  if (obj.Y > floorY - obj.size / 2) {
    obj.grounded = true;
    if (obj.Y > floorY - obj.size / 2 + 1) {
      objUp(obj, 1);
    }
  } else {
    obj.grounded = false;
  }

  if (!obj.grounded) {
    obj.Yvel += 1;
  } else if (obj.grounded) {
    obj.jumps = obj.maxJumps;
    if (obj.Yvel > 0) {
      obj.Yvel = 0;
    }
  }

  objDown(obj, (obj.Yvel * Square.speed) / 50);
  //moves object down by scale of the page
}

function teleport(obj = otherSquare, destObj = mouse.getAbsCoords()) {
  obj.X = destObj.X;
  obj.Y = destObj.Y;
  //obj.elem.style.left = obj.X - obj.size / 2 + "px";
  //obj.elem.style.top = obj.Y - obj.size / 2 + "px";
}

function movement() {
  // there may be an easier way to do this
  let speed = Square.speed * scale;

  const horizontal = keyStatus.d - keyStatus.a; // 1 if moving right, -1 if moving left, 0 if not moving horizontally
  const vertical = keyStatus.s - keyStatus.w; // 1 if moving up, -1 if moving down, 0 if not moving vertically

  if (Math.abs(horizontal && vertical) == 1) {
    speed *= Math.SQRT1_2; // this is run if moving both vertically and horizontally
  }

  Square.X += horizontal * speed; // move horizontally
  Square.Y += vertical * speed; // move vertically

  if (camera.lockToPlayer) {
    // if camera is locked to player, move camera with player
    camera.X = Square.X;
    camera.Y = Square.Y;
    // console.log("camera is locked", camera.X, camera.Y); ///////////////////////////
  }
  /*
  if (mode) {
    squaredown(Square.Yvel*Square.speed/50);
  }
  */
}

function jump() {
  if (Square.jumps > 0) {
    Square.grounded = false;
    Square.jumps--;
    Square.Yvel = -50;
  }
}

function collision(obj1, obj2, obj1IsPoint = false) {
  const diffX = obj1.X - obj2.X;
  const diffY = obj1.Y - obj2.Y;
  const dist = Math.sqrt(diffX * diffX + diffY * diffY);
  if (dist > obj1.size + obj2.size) {
    return false;
  } // return if objects are way too far for collision
  if (obj1IsPoint) {
    if (
      obj1.X > obj2.X - obj2.size / 2 &&
      obj1.X < obj2.X + obj2.size / 2 &&
      obj1.Y > obj2.Y - obj2.size / 2 &&
      obj1.Y < obj2.Y + obj2.size / 2
    ) {
      // true if obj1's centre is within bounds of obj2
      return true;
    }
  } else {
    if (
      obj1.X + obj1.size / 2 > obj2.X - obj2.size / 2 &&
      obj1.X - obj1.size / 2 < obj2.X + obj2.size / 2 &&
      obj1.Y + obj1.size / 2 > obj2.Y - obj2.size / 2 &&
      obj1.Y - obj1.size / 2 < obj2.Y + obj2.size / 2
    ) {
      // true if obj1's bounds are within bounds of obj2
      return true;
    }
  }
  return false;
}

function collisionPredict(obj1, obj2) {
  // here obj1 is always a point, and obj2 is assumed to be stationary
  const diffX = obj1.X - obj2.X;
  const diffY = obj1.Y - obj2.Y;
  const dist = Math.sqrt(diffX * diffX + diffY * diffY);

  if (collision(obj1, obj2, true)) {
    return true;
  } // if objects are already colliding, return true

  const spd = Math.sqrt(obj1.Xvel * obj1.Xvel + obj1.Yvel * obj1.Yvel);

  if (dist > spd * scale) {
    return false;
  } // if obj1 cannot reach obj2 in time, return false

  //console.log(dist, spd*scale);

  const topleftcorner = { X: diffX - obj2.size / 2, Y: diffY - obj2.size / 2 };
  const toprightcorner = { X: diffX + obj2.size / 2, Y: diffY - obj2.size / 2 };
  const bottomleftcorner = {
    X: diffX - obj2.size / 2,
    Y: diffY + obj2.size / 2,
  };
  const botttomrightcorner = {
    X: diffX + obj2.size / 2,
    Y: diffY + obj2.size / 2,
  };

  const corners = [
    topleftcorner,
    toprightcorner,
    bottomleftcorner,
    botttomrightcorner,
  ];

  //const cornerAngs = [];

  //console.log(corners);

  //const velAng = Math.atan2(obj1.Yvel, obj1.Xvel);

  /*
  for (let i = 0; i < 4; i++) {
    const cornerAng = Math.atan2(corners[i].Y , corners[i].X)
    cornerAngs.push(cornerAng)
  };
  */

  //const cornerAngsSorted = cornerAngs.sort(function(a, b){return a - b});

  const notaDotProduct = [];

  for (let i = 0; i < 4; i++) {
    notaDotProduct.push(
      Math.sign(corners[i].X * obj1.Yvel - corners[i].Y * obj1.Xvel)
    );
  } // this calculates if velocity vector is clockwise or counterclockwise from the corner vector (dot products don't use subtraction)

  //console.log(notaDotProduct);

  if (new Set(notaDotProduct).size > 1) {
    return true;
  } // if corner angles have at least 1 clockwise and counterclockwise of velocity vector, return true

  return false; // if the above did not return true
}

function checkProjecColl() {
  for (const [id, projectile] of Object.entries(artillery)) {
    if (collisionPredict(projectile, otherSquare)) {
      //setTimeout( () =>
      {
        otherSquare.hit(projectile.dmg);
        delete artillery[id]; // remove projectile from artillery array
      }
      //, 10)
    }
  }
}

function removprojecs() {
  artillery = {}; // clear artillery array

  /*
  const len = artillery.length;
  for (let i = 0; i < len; i++) {
    const removedElem = artillery.pop();
    //removedElem.elem.remove();
  }
  */

  //const elmnts = document.getElementById("projectilecontainer").childNodes;
  //const len2 = elmnts.length;
  //for (let i = 0; i < len2; i++) {
  //  console.log(elmnts[0]);
  //  elmnts[0].remove();
  //  // turns out HTMLCollections and NodeLists automatically update when you add or remove elements
  //  // this requires me to set the length in a constant
  //  // so that it doesn't change, which would cause the loop to break exactly halfway through, which it used to do
  //  // I also had to remove element 0, not i, from the collection - otherwise it would delete elements in an alternating pattern, which it used to do
  //}
}

function applyWeapon() {
  const inputElem = document.getElementById("enterweapon");
  weapons.code = inputElem.value;
}

function setFiring(fireon) {
  if (!firing && fireon && canFire) {
    const currentWeapon = weapons.current;
    makeprojectile(true);
    firingIntervalID = setInterval(function () {
      makeprojectile(true);
      canFire = false;
      setTimeout(() => {
        canFire = true;
      }, currentWeapon.interval);
    }, currentWeapon.interval);
    firing = true;
    canFire = false;
    setTimeout(() => {
      canFire = true;
    }, currentWeapon.interval);
  } else if (!fireon) {
    clearInterval(firingIntervalID);
    firing = false;
  }
}

function makeprojectile(aiming = false) {
  // the aiming parameter is for artillery / mouse-aimed projectiles
  // let singleProjectile;
  const weapon = weapons.current;
  if (!aiming || weapon.inacc == 0) {
    /*
    // if weapon is inaccurate, projectile element will be created in the for loop later
    projectileID++;
    singleProjectile = document.createElement("div");
    if (aiming) {
      singleProjectile.className = "artillery";
    } else {
      singleProjectile.className = "projectile";
    }
    singleProjectile.id = projectileID;
    singleProjectile.style.left = Square.X - 2.5 + "px"; // 2.5 is projectile radius
    singleProjectile.style.top = Square.Y - 2.5 + "px";
    document
      .getElementById("projectilecontainer")
      .appendChild(singleProjectile);
    */
  }
  if (aiming) {
    let sin_ang = 0;
    let cos_ang = 0;
    let velY = 0;
    let velX = 0;
    if (trackMouse) {
      // if tracking mouse, use mouse position
      const MouserelX = mouse.relX;
      const MouserelY = mouse.relY;
      const mousedist = Math.sqrt(
        MouserelX * MouserelX + MouserelY * MouserelY
      );
      sin_ang = MouserelY / mousedist;
      cos_ang = MouserelX / mousedist;
      velY = weapon.vel * scale * sin_ang;
      velX = weapon.vel * scale * cos_ang;
    } else {
      // if not tracking mouse, use cannon angles
      sin_ang = Math.sin(Square.cannon.angle * degToRad);
      cos_ang = Math.cos(Square.cannon.angle * degToRad);
      velY = Square.cannon.vel * sin_ang;
      velX = Square.cannon.vel * cos_ang;
    }
    if (weapon.inacc != 0) {
      const perpendicularX = -velY;
      const perpendicularY = velX;
      for (let i = 0; i < weapon.projecMult; i++) {
        // there can only be multiple projectiles if there is an inaccuracy, because it would just act as 1 projectile if 100% accurate

        /*
        projectileID++;
        const projectile = document.createElement("div");
        projectile.className = "artillery";
        projectile.id = projectileID;
        projectile.style.left = Square.X - 2.5 + "px"; // 2.5 is projectile radius
        projectile.style.top = Square.Y - 2.5 + "px";
        document.getElementById("projectilecontainer").appendChild(projectile);
        */

        const randomInacc = Math.random() * weapon.inacc * 2 - weapon.inacc;

        const projectileObj = new Projectile(
          Square,
          velX + perpendicularX * randomInacc,
          velY + perpendicularY * randomInacc,
          5,
          weapon.dmg
        );
        //projectileObj.elem = projectile;
        //projectileObj.id = projectileID;
        //artillery.push(projectileObj);
        /*
        artillery.push({
          id: projectileID,
          elem: projectile,
          X: Square.X,
          Y: Square.Y,
          Xvel: velX + perpendicularX * randomInacc,
          Yvel: velY + perpendicularY * randomInacc,
          grounded: false,
          size: 5,
          dmg: weapon.dmg,
        });
        */
      }
    }
    if (weapon.inacc == 0) {
      // if weapon is inaccurate, projectile will be created in the for loop above
      const projectileObj = new Projectile(Square, velX, velY, 5, weapon.dmg);
      //projectileObj.elem = singleProjectile;
      //projectileObj.id = projectileID;
      //artillery.push(projectileObj);
      /*
      artillery.push({
        id: projectileID,
        elem: singleProjectile,
        X: Square.X,
        Y: Square.Y,
        Xvel: velX,
        Yvel: velY,
        grounded: false,
        size: 5,
        dmg: weapon.dmg,
      });
      */
    }
  }
}

function projectilemove() {
  /*
  const projectiles = document.getElementsByClassName("projectile");

  // for projectiles:
  const len = projectiles.length;
  for (let i = 0; i < len; i++) {
    const projectile = projectiles[i];
    //console.log(projectile.style.left.slice(0, -2));
    projectile.style.left =
      Number(projectile.style.left.slice(0, -2)) + Square.speed + "px"; // slice removes "px" to make it a number
  }
  */

  // for artillery:
  for (const [_, projectile] of Object.entries(artillery)) {
    projectile.X += projectile.Xvel * scale;
    projectile.Y += projectile.Yvel * scale;
  }
}

function makeItem(
  itemName,
  X = Math.random() * 400,
  Y = Math.random() * 440,
  nameOverride = undefined,
  quantity = 1,
  uniqueOverride = undefined,
  material
) {
  let name;
  if (nameOverride) {
    name = nameOverride;
  } else {
    name = `${itemName}#${++itemID}`;
  }
  //const item = document.createElement("div");
  //item.className = "generic-item";
  //item.id = name;
  //item.style.left = X - 5 + "px"; // 5 is item radius
  //item.style.top = Y - 5 + "px";
  //main.appendChild(item);
  universe.items[name] = {
    name: itemName,
    idname: name,
    // elem: item,
    X: X,
    Y: Y,
    size: 10,
    unique: uniqueOverride || (itemdb[itemName] || itemdb.example).unique,
    mult: quantity,
    material: material,
  };
}

function pickItem(obj = Square) {
  // find an item that is colliding with obj (prefers first item in universe.items)
  for (const [key, item] of Object.entries(universe.items)) {
    if (collision(obj, item)) {
      //value.elem.remove();
      quantity = item.mult || 1;
      delete universe.items[key];
      addToStorage(inventoryItems, item, quantity);
      return; // only 1 item picked up at a time
    }
  }
}

function dropItem(itemname, quantity = 1, objOrigin = Square, material) {
  if (quantity == 0) {
    return;
  } // if 0 items will be dropped, end function early
  const item = inventoryItems[itemname][material || "null"];
  console.log("dropped item:", item, itemname, material); //debug
  if (item) {
    // if it exists
    if (item.unique) {
      // if unique, delete and make into element
      subtractFromStorage(inventoryItems, itemname, quantity);
      makeItem(
        itemname.split("#")[0],
        objOrigin.X,
        objOrigin.Y,
        itemname,
        1,
        true,
        item.material
      ); // name has to be defined for item pickup to work, so gets defined along with override
    } else {
      // if not unique, remove quantity and make into element with quantity
      if (item.mult < quantity) {
        makeItem(
          item.name,
          objOrigin.X,
          objOrigin.Y,
          undefined,
          item.mult,
          false,
          item.material
        );
        subtractFromStorage(inventoryItems, itemname, item.mult, material);
        return; // return so that the item is not dropped again
      }
      subtractFromStorage(inventoryItems, itemname, quantity, material);
      makeItem(
        item.name,
        objOrigin.X,
        objOrigin.Y,
        undefined,
        quantity,
        false,
        item.material
      ); // key name is not overridden so that it can exist twice with unique IDs
    }
  }
}

function addToStorage(storage = inventoryItems, item, quantity) {
  // find similar items in storage
  if (!storage[item.name]) {
    // if no similar items, create a new object for the item
    storage[item.name] = {};
  }

  // find item in storage
  const storedItem = storage[item.name][item.material || "null"];

  if (storedItem) {
    // if item exists in storage, add quantity
    storedItem.mult += quantity;
  } else {
    // if item does not exist in storage, add it
    storage[item.name][item.material || "null"] = item; // assumes that item.mult == quantity
  }
}

function subtractFromStorage(
  storage = inventoryItems,
  itemName,
  quantity,
  material
) {
  //console.log(factoryName, universe.machines, universe.machines[factoryName]);
  const item = storage[itemName][material || "null"];
  if (!item) {
    return item; // if item doesn't exist, return nothing
  }

  // first check if subtraction would have remainder
  if (item.mult < quantity) {
    delete storage[itemName][material || "null"];
    console.log(
      `Tried to remove ${quantity} of ${itemName}, but only ${item.mult} left. Removing all.`,
      storage[itemName][material || "null"],
      item
    );
    return item; // return item that was removed
  }

  // remove quantity and then delete if 0 or less quantity left (though it should never be less than 0 after the above check)
  item.mult -= quantity;
  if (item.mult <= 0) {
    delete storage[itemName][material || "null"];
    return item; // return item that was removed
  }
}

function assembleItem(itemName, storage = inventoryItems) {
  const assemblydata = assemblydb[itemName];
  if (!assemblydata) {
    return;
  } // if item cannot be assembled, return
  Object.entries(assemblydata).forEach(([name, ingredient]) => {
    if ((storage[name] || { mult: 0 }).mult < ingredient.mult) {
      return;
    } // if there is not enough of any ingredient, return
  });

  Object.entries(assemblydata).forEach(([name, ingredient]) => {
    // remove amount of ingredients
    subtractFromStorage(storage, name, ingredient.mult);
  });
  addToStorage(storage, {
    name: `${itemName}#${++itemID}`,
    size: 10,
    unique: itemdb[itemName].unique,
    mult: 1,
  });
}

function addToAttachments(attachPlatform, attachLocation, item) {
  // find item that is attached
  const attachList = attachPlatform.attachments;
  if (!attachList) {
    attachPlatform.attachments = {};
  }
  const attachNode = attachList[attachLocation];

  // if no item is attached, attach it
  attachList[attachLocation] = item;
}

function removeFromAttachments(attachPlatform, attachLocation) {
  // find item that is attached
  const attachList = attachPlatform.attachments;
  if (!attachList) {
    attachPlatform.attachments = {};
  }

  const attachNode = attachList[attachLocation];
  if (attachNode) {
    // if an item is attached, remove it
    const removedItem = attachNode;
    attachList[attachLocation] = undefined;
    return removedItem; // return the item that was removed
  }
  return;
}

function placeMachine(
  name,
  fromInventory = true,
  objOrigin = Square,
  dontOverrideID = false
) {
  // check if item is in inventory, if it isn't don't place
  if (fromInventory) {
    if (inventoryItems[name]) {
      subtractFromStorage(inventoryItems, name, 1);
    } else {
      return; // return if not in inventory
    }
  }
  let machineName;
  if (dontOverrideID) {
    machineName = `${itemName}#${++itemID}`;
  } else {
    machineName = name;
  }
  //const item = document.createElement("div");
  //item.className = "generic-machine";
  //item.id = machineName;
  //item.style.left = objOrigin.X - 10 + "px"; // 10 is machine radius
  //item.style.top = objOrigin.Y - 10 + "px";
  //main.appendChild(item);
  universe.machines[machineName] = {
    name: name,
    // elem: item,
    X: objOrigin.X,
    Y: objOrigin.Y,
    size: 20,
    unique: true,
    storage: {},
    in_outProcesses: {},
    out_freeProcesses: {},
  };
}

/*
function runMachines() {
  const factories = []
  const buildings = []
  for (const [key, value] of Object.entries(universe.machines)) {
    if (value.type == "factory") {factories.push(key)}
    else {buildings.push(key)}
  };
  runFactories(factories)
  //runBuildings(buildings)
}

function runFactories(factories) {
  factories.forEach(runFactory);
}

function runFactory(factory) {
  const factorydata = itemdb[factory];
  if (factorydata.in_out) {
    for (const [key, value] of factorydata.in_out) {
      if (factory.storage[value.in]) {
        
      };
    };
  };
  if (factorydata.out_free) {
    factorydata.out_free.out
  };
}
*/

function setFactoryProcessIn_Out(factory, processName) {
  if (factory.in_outProcesses[processName]) {
    return;
  } // if already running return
  console.log("process started " + processName);
  const factoryName = factory.name.split("#")[0]; // removes the id from the factory name
  const factorydata = itemdb[factoryName];
  const factoryStorage = factory.storage;
  const inOut = factorydata.in_out[processName];
  if (inOut.other_required.length && inOut.byproducts.length) {
    // if byproducts or other required exist, use modified code
    // not implemented (subract all inputs, add all outputs)
    // implement for out_free as well
  } else {
    factory.in_outProcesses[processName] = setInterval(() => {
      if (
        !factoryStorage[inOut.in] ||
        factoryStorage[inOut.in].quantity < inOut.in_amount
      ) {
        // if process cannot be sustained, end process
        clearInterval(factory.in_outProcesses[processName]);
        delete factory.in_outProcesses[processName];
        console.log("process ended " + processName);
        return;
      }
      // subtract input, add output
      subtractFactoryStorage(factory.name, inOut.in, inOut.in_amount);
      addFactoryStorage(
        factory.name,
        {
          name: inOut.out,
          size: 10,
          unique: itemdb[inOut.out].unique,
          mult: inOut.out_amount,
        },
        inOut.out_amount
      );
    }, inOut.interval);
  }
}

function setFactoryProcessOut_Free(factory, processName) {
  if (factory.out_freeProcesses[processName]) {
    return;
  } // if already running return
  console.log("process started " + processName);
  const factoryName = factory.name.split("#")[0]; // removes the id from the factory name
  const factorydata = itemdb[factoryName];
  const factoryStorage = factory.storage;
  const outFree = factorydata.out_free[processName];
  factory.out_freeProcesses[processName] = setInterval(() => {
    addFactoryStorage(
      factory.name,
      {
        name: outFree.out,
        size: 10,
        unique: itemdb[outFree.out].unique,
        mult: 1,
      },
      1
    );
  }, outFree.interval);
}

function addFactoryStorage(factoryName = "magic_smelter#1", item, quantity) {
  addToStorage(universe.machines[factoryName].storage, item, quantity);
}

function subtractFactoryStorage(
  factoryName = "magic_smelter#1",
  itemName,
  quantity
) {
  //console.log(factoryName, universe.machines, universe.machines[factoryName]);
  subtractFromStorage(
    universe.machines[factoryName].storage,
    itemName,
    quantity
  );
}

setInterval(loop, 1000 / loopfreq);

requestAnimationFrame(renderFrame);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
camera.width = window.innerWidth;
camera.height = window.innerHeight;
