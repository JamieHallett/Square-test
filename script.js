const degToRad = Math.PI/180;
const scale = 0.25; // 1m/s = 0.25px/10ms 1m = 25px
const loopfreq = 100; // 100hz
const floorY = 440;
let right = 0;
let left = 0;
let up = 0;
let down = 0;
const Main = document.getElementById("main");
const Mouse = {
  X: 0,
  Y: 0,
  get relX() {return Mouse.X - Square.X}, // relative to square
  get relY() {return Mouse.Y - Square.Y},
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
  grounded: false,
  Cannon: { // no longer used
    angle: 0,
    vel: 75,
  },
};
const OtherSquare = {
  elem: document.getElementById("othersquare"),
  X: 212.5,
  Y: 212.5,
  Xvel: 0,
  Yvel: 0,
  size: 25,
  hit: function(dmg) {
    console.log(dmg)
    OtherSquare.elem.style.backgroundColor = "#800000"; // dark red
    setTimeout(function() {
      OtherSquare.elem.style.backgroundColor = "#050505"; // reset to standard square colour in 50ms
    }, 50)
  },
};
let mode = false;
let trail = false;
let menu = false;
let inventory = false;
let firing = false;
let typing = false;
let projectileID = 0;
let itemID = 0;
let artillery = [];
const storageUI = {
  pane: false,
  parentLocation: "machines",
  location: "magic_smelter#1",
  realParents: {
    get machines() {return universe.machines},
    get items() {return inventoryItems},
  },
  getStorage: function () {return (this.realParents[this.parentLocation])[this.location]},
  open: function () {this.pane = true; const paneStyle = document.getElementById("storageaccessUI").style; paneStyle.width = "250px"; paneStyle.paddingLeft = "8px";},
  close: function () {this.pane = false; const paneStyle = document.getElementById("storageaccessUI").style; paneStyle.width = "0px"; paneStyle.paddingLeft = "0px";},
  update: function () {
    const storagename = document.getElementById("storagename");
    storagename.innerText = JSON.stringify(this.getStorage(), null, 2);
    updInventoryTable(this.getStorage().storage, "accessedtable");
  },
  setToMouseoverMachine: function () {
    for (const [name, obj] of Object.entries(universe.machines)) {
      if (collision(Mouse, obj, true)) {
        this.parentLocation = "machines";
        this.location = name;
        this.update();
        return
      }
    }
  },
};
const inventoryItems = {
  ammo_a: {
    name: "ammo_a",
    unique: false,
    mult: 20
  },
  ammo_b: {
    name: "ammo_b",
    unique: false,
    mult: 60
  },
  ammo_c: {
    name: "ammo_c",
    unique: false,
    mult: 90
  },
  ammo_d: {
    name: "ammo_d",
    unique: false,
    mult: 20
  },
};
const universe = {
  get Square() {return Square;},
  get OtherSquare() {return OtherSquare;},
  get Projectiles() {return artillery;},
  items: {},
  machines: {},
};
const weapons = {
  code: "c", // this is the default weapon
  get current() {return weapons[weapons.code]},
  a: {
    rate: 2,
    interval: 500,
    dmg: 115,
    dmgrange: {start: 100, end: 225, endval : 100},
    vel: 950,
    auto: false,
    inacc: 0,
    projecMult: 1,
  },
  b: {
    rate: 9,
    interval: 110,
    dmg: 45,
    dmgrange: {start: 75, end: 150, endval : 35},
    vel: 950,
    auto: true,
    inacc: 0,
    projecMult: 1,
  },
  c: {
    rate: 13,
    interval: 75,
    dmg: 35,
    dmgrange: {start: 50, end: 150, endval : 30},
    vel: 950,
    auto: true,
    inacc: 0,
    projecMult: 1,
  },
  d: {
    rate: 10,
    interval: 100,
    dmg: 30,
    dmgrange: {start: 25, end: 75, endval : 20},
    vel: 400,
    auto: false,
    inacc: 0.05, // measured in radians (but it breaks down at higher values)
    projecMult: 8,
  },
  e: {
    rate: 20,
    interval: 50,
    dmg: 30,
    dmgrange: {start: 25, end: 75, endval : 15},
    vel: 200,
    auto: false,
    inacc: 0,
    projecMult: 1,
  },
  testwave: {
    rate: 2,
    interval: 500,
    dmg: 1,
    dmgrange: {start: 25, end: 75, endval : 20},
    vel: 40,
    auto: true,
    inacc: 0.2,
    projecMult: 50,
  },
  testinacc: {
    rate: 50,
    interval: 20,
    dmg: 35,
    dmgrange: {start: 50, end: 150, endval : 30},
    vel: 950,
    auto: true,
    inacc: 0.02, // inaccuracy with only 1 projectile
    projecMult: 1,
  },
  testlagmaker: {
    rate: 500,
    interval: 2,
    dmg: 1,
    dmgrange: {start: 50, end: 150, endval : 1},
    vel: 950,
    auto: true,
    inacc: 0,
    projecMult: 1,
  },
};
let firingIntervalID = 0;
let canFire = true;
const itemdb = {
  ammo_a: {
    title: "Ammo A",
    desc: "Heavy ammunition for weapon A.",
    unique: false,
    type: "resource",
    methods: ["item_drop"],
    mass: 0.1,
    volume: 0.000_056,
  },
  ammo_b: {
    title: "Ammo B",
    desc: "Medium ammunition for weapon B.",
    unique: false,
    type: "resource",
    methods: ["item_drop"],
    mass: 0.02,
    volume: 0.000_01,
  },
  ammo_c: {
    title: "Ammo C",
    desc: "Light rifle ammunition for weapon C.",
    unique: false,
    type: "resource",
    methods: ["item_drop"],
    mass: 0.01,
    volume: 0.000_005,
  },
  ammo_d: {
    title: "Ammo D",
    desc: "Ammunition for weapon D, containing several small projectiles.",
    unique: false,
    type: "resource",
    methods: ["item_drop"],
    mass: 0.034,
    volume: 0.000_018,
  },
  ammo_e: {
    title: "Ammo E",
    desc: "There is no weapon that fires this (yet), making it somewhat useless.",
    unique: false,
    type: "resource",
    methods: ["item_drop"],
    mass: 0.02,
    volume: 0.000_01,
  },
  iron_ore: {
    title: "Iron Ore",
    desc: "A rock with a high % of iron, as well as oxygen. Can be refined using carbon, or more advanced methods.",
    unique: false,
    type: "material",
    methods: ["item_drop"],
    mass: 1,
    volume: 0.4,
    hardness: 5.5,
    melting_point: 1838,
  },
  iron: {
    title: "Iron",
    desc: "Mostly pure iron. Stronger than most other metals, but not known for being light.",
    unique: false,
    type: "material",
    methods: ["item_drop"],
    mass: 1,
    volume: 0.125,
    hardness: 4.5,
    melting_point: 1811
  },
  carbon: {
    title: "Carbon",
    desc: "Carbon with no crystalline structure, like charcoal. Ideal for combustion and for refnery of some metals.",
    unique: false,
    type: "material_nomelting",
    methods: ["item_drop"],
    mass: 1,
    volume: 0.9,
    hardness: 3,
    melting_point: 800, // This item is set to no melting, so this is the ignition temperature
  },
  lead_ore: {
    title: "Lead Ore",
    desc: "A rock with a high % of lead, as well as sulphur and maybe even silver. Can be refined using carbon, or more advanced methods.",
    unique: false,
    type: "material",
    methods: ["item_drop"],
    mass: 1,
    volume: 0.13,
    hardness: 2.5,
    melting_point: 1387,
  },
  lead: {
    title: "Lead",
    desc: "A soft and malleable metal with a high density. Used in ammunition and simple rechargable batteries.",
    unique: false,
    type: "material",
    methods: ["item_drop"],
    mass: 1,
    volume: 0.09,
    hardness: 1.5,
    melting_point: 600,
  },
  magic_smelter: {
    title: "magic smelter",
    desc: "smelts items without electricity or fuel, converting all of the input's mass to the output",
    unique: true,
    type: "factory",
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
        interval: 100
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
        interval: 100
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
      }
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
    type: "resource", // type of item, can be "factory", "building", "resource", "material", "material_nomelting"
    methods: ["item_drop"], // methods that can be used on this item
  },
};
const itemMethodDB = {
  machine_place: function (name, obj) {placeMachine(name, true, obj)},
  item_drop: function (name, obj) {dropItem(name, Number(prompt("Enter amount to drop:")), obj)},
};

function squareleft(v) {
  Square.X -= v; //moves square left
  Square.elem.style.left = Square.X - Square.size/2 + "px";
}

function squareright(v) {
  Square.X += v; //moves square right
  Square.elem.style.left = Square.X - Square.size/2 + "px";
}

function squareup(v) {
  Square.Y -= v; //moves square up
  Square.elem.style.top = Square.Y - Square.size/2 + "px";
}

function squaredown(v) {
  Square.Y += v; //moves square down
  Square.elem.style.top = Square.Y - Square.size/2 + "px";
}

function objUp(obj, v) {
  obj.Y -= v; //moves object up
  obj.elem.style.top = obj.Y - obj.size/2 + "px";
}
function objDown(obj, v) {
  obj.Y += v; //moves object down
  obj.elem.style.top = obj.Y - obj.size/2 + "px";
}

function toggletrackMouse() {
  trackMouse = !trackMouse;
  if (trackMouse) {
    document.addEventListener("mousemove", trackmouse)
  } else {
    document.removeEventListener("mousemove", trackmouse)
  }
}

function trackmouse(event) {
  Mouse.X = event.pageX;
  Mouse.Y = event.pageY;
  //console.log(Mouse.X, Mouse.Y);
}

const slider = document.getElementById("myRange");
const output = document.getElementById("slidervalue");

output.innerHTML = slider.value; // Display the default slider value
Square.speed = slider.value * Square.sizetospd;

// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
  output.innerHTML = this.value;
  Square.elem.style.height = this.value + "px";
  Square.elem.style.width = this.value + "px";
  Square.size = this.value;
  Square.speed = this.value * Square.sizetospd;
}

const slider2 = document.getElementById("cannonAngle");
const output2 = document.getElementById("cannonAngValue");

output2.innerHTML = slider2.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
slider2.oninput = function() {
  output2.innerHTML = this.value;
  Square.Cannon.angle = this.value;
}

/* Set the width of the side navigation to 250px */
function openNav() {
  menu = true
  document.getElementById("mySidenav").style.width = "250px";
}

 /* Set the width of the side navigation to 0 */
function closeNav() {
  menu = false
  document.getElementById("mySidenav").style.width = "0";
}

function openInventory() {
  inventory = true;
  
  const pane = document.getElementById("inventory")
  
  pane.style.visibility = "visible";
  pane.getElementsByTagName("pre")[0].innerHTML = JSON.stringify(inventoryItems, null, 2);
  
  updInventoryTable(inventoryItems)
}

function closeInventory() {
  inventory = false;
  document.getElementById("inventory").style.visibility = "hidden";
}

function updInventoryTable(json = inventoryItems, containername = "itemtable") {
  // Get the container element where the table will be inserted
  let container = document.getElementById(containername);

  // Create the table element
  let table = document.createElement("table");

  // these are the names of the column headers
  let cols = [
    "Name",
    "Description",
    "Quantity",
    "Actions",
    "Internal ID",
  ];

  // this is how each column of the table body is created
  const columnFuncs = [
    (name) => (itemdb[name] || itemdb.example).title, // || itemdb[name.split("#")]
    (name) => (itemdb[name] || itemdb.example).desc,
    (name) => (json[name] || {mult:"-"}).mult, // if item is unique, name will not be in json and so mult will be "-"
    (name, idname) => {
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
        btn.onclick = function() {
          itemMethodDB[methodName](idname || name, Square); // uses name with id if that exists
          updInventoryTable() // update inventory table in case something changes
        };
      });
      return btncontainer;
    },
    (name, idname) => idname || name, // uses name with id if that exists
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
  table.append(tr) // Append the header to the table
  
  // Loop through the JSON data and create table rows
  Object.entries(json).forEach((key_item) => {
    let tr = document.createElement("tr");
    // Loop through the values and create table cells
    columnFuncs.forEach((func) => {
      const text = func(key_item[1].name, key_item[0]); // The functions return the text to be displayed in each cell
      if (["string", "number"].includes(typeof text)) {
        const td = document.createElement("td");
        td.innerText = text; // Set the text of the cell to the value returned by the function
        tr.appendChild(td);
      } else {
        console.log(text)
        const td = document.createElement("td");
        td.appendChild(text); // In this case, text is actually a div element, so append that to the cell
        tr.appendChild(td); // Append the table cell to the table row
      }
    });
    table.appendChild(tr); // Append the table row to the table
  });
  container.replaceChildren(table) // Put the table in its container element
};


// Add event listener on keydown
document.addEventListener('keydown', (event) => {
  const name = event.key;
  // const code = event.code;
  // Alert the key name and key code on keydown
  // alert(`Key pressed ${name} \r\n Key code value: ${code}`);
  
  if (!typing) {
    switch (name.toLowerCase()) {
      case "a":
        left = 1;
        break;
      case "d":
        right = 1;
        break;
      case "w":
        up = 1;
        break;
      case "s":
        down = 1;
        break;

      case " ":
        jump();
        break;
      case "b":
        setFiring(true)
        break;
    }
  }
    
}, false);

document.addEventListener('keyup', (event) => {
  const name = event.key;
  
  if (!typing) {
    switch (name.toLowerCase()) {
      case "a":
        left = 0;
        break;
      case "d":
        right = 0;
        break;
      case "w":
        up = 0;
        break;
      case "s":
        down = 0;
        break;

      case "b":
        setFiring(false);
        break;

      case "c":
        if (!menu) {openNav()}
        else {closeNav()};
        break;
      case "i":
        if (!inventory) {openInventory()}
        else {closeInventory()}
        break;
      case "u":
        if (!storageUI.pane) {storageUI.open(); storageUI.update();}
        else {storageUI.close()}
        break;

      case "g":
        storageUI.setToMouseoverMachine()
        break;
      case "t":
        teleport(); // by default teleports othersquare to mouse
        break;
      case "r":
        removprojecs();
        break;
      case "v":
        makeprojectile(true);
        break;
      case "o":
        makeItem("name");
        break;
      case "p":
        makeItem("stackable", 100, 50, undefined, false);
        break;
      case "e":
        pickItem();
        if (inventory) {updInventoryTable()}
        break;
      case "k":
        dropItem(prompt("enter item internal ID to drop"), Number(prompt("enter quantity to drop")) || 1);
        if (inventory) {updInventoryTable()}
        break;
      case "[":
        makeItem("magic_smelter", 275, 75)
        break;
      case "]":
        makeItem("magic_iron_ore_machine", 275, 100)
        break;
      case "#":
        storageUI.parentLocation = prompt("enter parent location");
        storageUI.location = prompt("enter location");
        storageUI.update();
        break;
      case "m":
        alert(JSON.stringify(universe.machines, null, 2))
        break;

      default:
        console.log("unrecognised key pressed:"+name);
        break;
    }
  }
  
}, false);

document.addEventListener("mousemove", trackmouse)

function loop() {
  movement();
  projectilemove();
  checkProjecColl();
  if (mode) {
    gravity();
  }
  if (trail) {
    makeprojectile();
  }
  /*if (firing) {
    makeprojectile(true);
  }*/
}

function toggleGravity() {
  mode = !mode;
  if (mode) {
    document.getElementById("floor").style.visibility = "visible";
  } else {
    document.getElementById("floor").style.visibility = "hidden";
  }
}

function gravity(obj = Square) {
  if (obj.Y > floorY - obj.size/2) {
    obj.grounded = true;
    if (obj.Y > floorY - obj.size/2 + 1) {objUp(obj, 1)}
  }
  else {obj.grounded = false}
  
  if (!obj.grounded) {
    obj.Yvel += 1;
  }
  else if (obj.grounded) {
    obj.jumps = obj.maxJumps;
    if (obj.Yvel > 0) {obj.Yvel = 0}
  }
  
  objDown(obj, obj.Yvel*Square.speed/50); 
  //moves object down by scale of the page
}

function teleport(obj = OtherSquare, destObj = Mouse) {
  obj.X = destObj.X;
  obj.Y = destObj.Y;
  obj.elem.style.left = obj.X - obj.size/2+ "px";
  obj.elem.style.top = obj.Y - obj.size/2 + "px";
}

function movement() { // there may be an easier way to do this
  let speed = Square.speed * scale;
  
  if (Math.abs((right-left) && (up-down)) == 1) {
    speed *= Math.SQRT1_2 // this is run if moving both vertically and horizontally
  }
  
  if (right == 1) {
    squareright(speed);
  }
  if (left == 1) {
    squareleft(speed);
  }
  if (!mode) {
    if (up == 1) {
      squareup(speed);
    }
    if (down == 1) {
      squaredown(speed);
    }
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
    Square.jumps --;
    Square.Yvel = -50;
  }
}

function collision(obj1, obj2, obj1IsPoint=false) {
  const diffX = obj1.X - obj2.X;
  const diffY = obj1.Y - obj2.Y;
  const dist = Math.sqrt(diffX*diffX + diffY*diffY);
  if (dist > obj1.size + obj2.size) {return false}; // return if objects are way too far for collision
  if (obj1IsPoint) {
    if (obj1.X > obj2.X - obj2.size/2 
        && obj1.X < obj2.X + obj2.size/2 
        && obj1.Y > obj2.Y - obj2.size/2 
        && obj1.Y < obj2.Y + obj2.size/2 
        ) // true if obj1's centre is within bounds of obj2
    {return true}
  } else {
    if (obj1.X + obj1.size/2 > obj2.X - obj2.size/2 
        && obj1.X - obj1.size/2 < obj2.X + obj2.size/2 
        && obj1.Y + obj1.size/2 > obj2.Y - obj2.size/2 
        && obj1.Y - obj1.size/2 < obj2.Y + obj2.size/2) // true if obj1's bounds are within bounds of obj2
    {return true};
  };
  return false;
}

function collisionPredict(obj1, obj2) { // here obj1 is always a point, and obj2 is assumed to be stationary
  const diffX = obj1.X - obj2.X;
  const diffY = obj1.Y - obj2.Y;
  const dist = Math.sqrt(diffX*diffX + diffY*diffY);

  if (collision(obj1, obj2, true)) {return true}; // if objects are already colliding, return true
  
  const spd = Math.sqrt(obj1.Xvel*obj1.Xvel + obj1.Yvel*obj1.Yvel);
  
  if (dist > spd*scale) {return false}; // if obj1 cannot reach obj2 in time, return false
  
  //console.log(dist, spd*scale);
    
  const topleftcorner = {X: diffX - obj2.size/2, Y: diffY - obj2.size/2};
  const toprightcorner = {X: diffX + obj2.size/2, Y: diffY - obj2.size/2};
  const bottomleftcorner = {X: diffX - obj2.size/2, Y: diffY + obj2.size/2};
  const botttomrightcorner = {X: diffX + obj2.size/2, Y: diffY + obj2.size/2};

  const corners = [topleftcorner, toprightcorner, bottomleftcorner, botttomrightcorner];
  
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
    notaDotProduct.push(Math.sign(corners[i].X * obj1.Yvel - corners[i].Y * obj1.Xvel))
  }; // this calculates if velocity vector is clockwise or counterclockwise from the corner vector (dot products don't use subtraction)

  //console.log(notaDotProduct);
  
  if (new Set(notaDotProduct).size > 1)
  {return true}; // if corner angles have at least 1 clockwise and counterclockwise of velocity vector, return true
  
  return false; // if the above did not return true
} 

function checkProjecColl() {
  for (let i = 0; i < artillery.length; i++) {
    if (collisionPredict(artillery[i], OtherSquare)) {
      //setTimeout( () => 
        {
        const delProjec = artillery.splice(i, 1);
        i--;
        OtherSquare.hit(delProjec[0].dmg);
        delProjec[0].elem.remove();
        }
      //, 10)
    }
  }
}

function removsquare() {
  const elmnt = document.getElementById("othersquare");
  elmnt.remove();
}

function removprojecs() {
  const len = artillery.length
  for (let i = 0; i < len; i++) {
    const removedElem = artillery.pop();
    removedElem.elem.remove();
  }
  
  const elmnts = document.getElementById("projectilecontainer").childNodes;
  const len2 = elmnts.length;
  for (let i = 0; i < len2; i++) {
    console.log(elmnts[0]);
    elmnts[0].remove();
    // turns out HTMLCollections and NodeLists automatically update when you add or remove elements
    // this requires me to set the length in a constant
    // so that it doesn't change, which would cause the loop to break exactly halfway through, which it used to do
    // I also had to remove element 0, not i, from the collection - otherwise it would delete elements in an alternating pattern, which it used to do
  }
}

function applyWeapon() {
  const inputElem = document.getElementById("enterweapon");
  weapons.code = inputElem.value;
}
  
function setFiring(fireon) {
  if (!firing && fireon && canFire) {
    currentWeapon = weapons.current;
    makeprojectile(true);
    firingIntervalID = setInterval(
      function() {
        makeprojectile(true);
        canFire = false;
        setTimeout(() => {canFire = true}, currentWeapon.interval);
      }, currentWeapon.interval)
    firing = true;
    canFire = false;
    setTimeout(() => {canFire = true}, currentWeapon.interval);
  } else if (!fireon) {
    clearInterval(firingIntervalID);
    firing = false;
  }
}

function makeprojectile(aiming = false) {
  // the aiming parameter is for artillery / mouse-aimed projectiles
  let singleProjectile;
  const weapon = weapons.current;
  if (!aiming || weapon.inacc == 0) { // if weapon is inaccurate, projectile element will be created in the for loop later
    projectileID ++;
    singleProjectile = document.createElement("div");
    if (aiming) {
      singleProjectile.className = "artillery";
    } else {
      singleProjectile.className = "projectile";
    }
    singleProjectile.id = projectileID
    singleProjectile.style.left = Square.X - 2.5 + "px"; // 2.5 is projectile radius
    singleProjectile.style.top = Square.Y - 2.5 + "px";
    document.getElementById("projectilecontainer").appendChild(singleProjectile);
  }
  if (aiming) {
    let sin_ang = 0;
    let cos_ang = 0;
    let velY = 0;
    let velX = 0;
    if (trackMouse) {
      const MouserelX = Mouse.relX;
      const MouserelY = Mouse.relY;
      const mousedist = Math.sqrt(MouserelX * MouserelX + MouserelY * MouserelY);
      sin_ang = MouserelY / mousedist;
      cos_ang = MouserelX / mousedist;
      velY = weapon.vel * scale * sin_ang;
      velX = weapon.vel * scale * cos_ang;
    } else {
      sin_ang = Math.sin(Square.Cannon.angle * degToRad);
      cos_ang = Math.cos(Square.Cannon.angle * degToRad);
      velY = Square.Cannon.vel * sin_ang;
      velX = Square.Cannon.vel * cos_ang;
    };
    if (weapon.inacc != 0) {
      const perpendicularX = -velY;
      const perpendicularY = velX;
      for (let i = 0; i < weapon.projecMult; i++) { // there can only be multiple projectiles if there is an inaccuracy, because it would just act as 1 projectile if 100% accurate
        projectileID ++;
        const projectile = document.createElement("div");
        projectile.className = "artillery";
        projectile.id = projectileID
        projectile.style.left = Square.X - 2.5 + "px"; // 2.5 is projectile radius
        projectile.style.top = Square.Y - 2.5 + "px";
        document.getElementById("projectilecontainer").appendChild(projectile);
        const randomInacc = Math.random() * weapon.inacc * 2 - weapon.inacc;
        artillery.push({
          id: projectileID,
          elem: projectile,
          X: Square.X,
          Y: Square.Y,
          Xvel: velX + perpendicularX*randomInacc,
          Yvel: velY + perpendicularY*randomInacc,
          grounded: false,
          size: 5,
          dmg: weapon.dmg,
        });
      }
    }
    if (weapon.inacc == 0) { // if weapon is inaccurate, projectile will be created in the for loop above
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
    }
  }
}

function projectilemove() {
  const projectiles = document.getElementsByClassName("projectile");
  // for projectiles:
  const len = projectiles.length;
  for (let i = 0; i < len; i++) {
    const projectile = projectiles[i];
    //console.log(projectile.style.left.slice(0, -2));
    projectile.style.left = (Number(projectile.style.left.slice(0,-2)) + Square.speed) + "px"; // slice removes "px" to make it a number
  }

  // for artillery:
  const len2 = artillery.length;
  for (let i = 0; i < len2; i++) {
    const projectile = artillery[i];
    projectile.X += projectile.Xvel * scale;
    projectile.elem.style.left = projectile.X - projectile.size/2 + "px";
    if (mode) {
      gravity(projectile)
    } else {
      // gravity() incorporates Y velocity, so change in Y has to be calculated separately when not using gravity()
      projectile.Y += projectile.Yvel * scale;
      projectile.elem.style.top = projectile.Y - projectile.size/2 + "px";
    }
  }
}

function makeItem(itemName, X = Math.random() * 400, Y = Math.random() * 440, nameOverride, isUnique = true, quantity = 1) {
  let name;
  if (nameOverride) {
    name = nameOverride;
  } else {
    itemID++;
    name = itemName + "#" + itemID;
  }
  const item = document.createElement("div");
  item.className = "generic-item";
  item.id = name;
  item.style.left = X - 5 + "px"; // 5 is item radius
  item.style.top = Y - 5 + "px";
  Main.appendChild(item);
  universe.items[name] = {
    name: itemName,
    elem: item,
    X: X,
    Y: Y,
    size: 10,
    unique: isUnique,
    mult: quantity,
  };
}

function pickItem(obj = Square) {
  for (const [key, value] of Object.entries(universe.items)) {
    if (collision(obj, value)) {
      value.elem.remove();
      quantity = value.mult || 1;
      delete universe.items[key];
      if (value.unique) {
        inventoryItems[key] = value;
      } else {
        if (inventoryItems[value.name]) {
          inventoryItems[value.name].mult += quantity;
        } else { // if the item is not in the inventory, add it
          inventoryItems[value.name] = value;
          inventoryItems[value.name].mult = quantity;
        }
      }
      return; // only 1 item picked up at a time
    }
  }
}

function dropItem(itemname, quantity = 1, obj = Square) {
  if (quantity == 0) {return}; // if 0 items will be dropped, end function early
  const item = inventoryItems[itemname];
  console.log(item,itemname); //debug
  if (item) { // if it exists
    if (item.unique) {
      // if unique, delete and make into element
      delete inventoryItems[itemname];
      makeItem(itemname.split("#")[0], obj.X, obj.Y, itemname); // name has to be defined for item pickup to work, so gets defined along with override
    } else {
      // if not unique, remove quantity and make into element with quantity
      if (inventoryItems[item.name].mult < quantity) {
        makeItem(item.name, obj.X, obj.Y, undefined, false, inventoryItems[item.name].mult);
        delete inventoryItems[item.name];
        return; // return so that the item is not dropped again
      }
      inventoryItems[item.name].mult -= quantity;
      if (inventoryItems[item.name].mult <= 0) {
        delete inventoryItems[item.name];
      }
      makeItem(item.name, obj.X, obj.Y, undefined, false, quantity); // key name is not overridden so that it can exist twice with unique IDs
    }
  }
}

function placeMachine(name, fromInventory = true,  obj = Square, dontOverrideID = false) {
  if (fromInventory) {
    if (inventoryItems[name]) {
      delete inventoryItems[name];
    } else {
      return // return if not in inventory
    }
  }
  let machineName
  if (dontOverrideID) {
    itemID++;
    machineName = name + "#" + itemID;
  } else {
    machineName = name
  }
  const item = document.createElement("div");
  item.className = "generic-machine";
  item.id = machineName;
  item.style.left = obj.X - 10 + "px"; // 10 is machine radius
  item.style.top = obj.Y - 10 + "px";
  Main.appendChild(item);
  universe.machines[machineName] = {
    name: name,
    elem: item,
    X: obj.X,
    Y: obj.Y,
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
  console.log("process started " + processName)
  const factoryName = (factory.name).split("#")[0]; // removes the id from the factory name
  const factorydata = itemdb[factoryName];
  const factoryStorage = factory.storage;
  const inOut = factorydata.in_out[processName];
  factory.in_outProcesses[processName] = setInterval(() => {
    if (!factoryStorage[inOut.in] || factoryStorage[inOut.in].quantity < inOut.in_amount) { // if process cannot be sustained, end process
      clearInterval(factory.in_outProcesses[processName]);
      console.log("process ended " + processName);
      return;
    };
    subtractFactoryStorage(factory.name, inOut.in, inOut.in_amount);
    addFactoryStorage(factory.name, {name: inOut.out, size: 10, unique: itemdb[inOut.out].unique, mult: inOut.out_amount} ,inOut.out_amount)
  }, inOut.interval);
}

function setFactoryProcessOut_Free(factory, processName) {
  console.log("process started " + processName)
  const factoryName = (factory.name).split("#")[0]; // removes the id from the factory name
  const factorydata = itemdb[factoryName];
  const factoryStorage = factory.storage;
  const outFree = factorydata.out_free[processName];
  factory.out_freeProcesses[processName] = setInterval(() => {
    addFactoryStorage(factory.name, {name: outFree.out, size: 10, unique: itemdb[outFree.out].unique, mult: 1} ,1)
  }, outFree.interval);
}

function addFactoryStorage(factoryName = "magic_smelter#1", item, quantity) {
  const storedItem = universe.machines[factoryName].storage[item.name];
  if (storedItem) { // if item exists in storage, add quantity
    universe.machines[factoryName].storage[item.name].mult += quantity;
  } else { // if item does not exist in storage, add it
    universe.machines[factoryName].storage[item.name] = item; // assumes that item.mult == quantity
  }
}

function subtractFactoryStorage(factoryName = "magic_smelter#1", itemName, quantity) {
  //console.log(factoryName, universe.machines, universe.machines[factoryName]);
  const item = universe.machines[factoryName].storage[itemName];
  if (item) { // if it exists
    if (item.unique) {
      // if unique, delete
      delete universe.machines[factoryName].storage[itemName];
    } else {
      // if not unique, remove quantity and delete if 0 or less quantity left
      if (universe.machines[factoryName].storage[itemName].mult < quantity) {
        delete universe.machines[factoryName].storage[itemName];
        return;
      }
      universe.machines[factoryName].storage[itemName].mult -= quantity;
      if (universe.machines[factoryName].storage[itemName].mult <= 0) {
        delete universe.machines[factoryName].storage[itemName];
      }
    }
  }
}

setInterval(loop, 1/loopfreq);
