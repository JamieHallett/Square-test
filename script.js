const degToRad = Math.PI/180;
const scale = 0.25; // 1m/s = 0.25px/10ms 1m = 25px
const loopfreq = 100;
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
let artillery = [];
const items = {
  ammo_a: 100,
  ammo_b: 200,
  ammo_c: 300,
  ammo_d: 20,
}
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
}
let firingIntervalID = 0;
let canFire = true;


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
  document.getElementById("inventory").style.visibility = "visible";
}

function closeInventory() {
  inventory = false;
  document.getElementById("inventory").style.visibility = "hidden";
}

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
      case "e":
        teleport(); // by default teleports othersquare to mouse
        break;
      case "r":
        removprojecs();
        break;
      case "v":
        makeprojectile(true);
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

  const spd = Math.sqrt(obj1.Xvel*obj1.Xvel + obj1.Yvel*obj1.Yvel);
  
  if (dist > spd/4) {return false}; // if obj1 cannot reach obj2 in time, return false
  
  //console.log(dist-spd);
  
  if (collision(obj1, obj2, true)) {return true}; // if objects are already colliding, return true
  
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
  }; // this calculates if velocity vector is clockwise or counterclockwise from the corner vector

  //console.log(notaDotProduct);
  
  if (new Set(notaDotProduct).size > 1)
  {return true}; // if corner angles are only clockwise or only counterclockwise of velocity vector, return true
  
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

setInterval(loop, 1/loopfreq);