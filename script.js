const degToRad = Math.PI/180
const floorY = 440;
let right = 0;
let left = 0;
let up = 0;
let down = 0;
const Mouse = {
  X: 0,
  Y: 0,
  relX : () => {return Mouse.X - Square.X}, // relative to square
  relY : () => {return Mouse.Y - Square.Y},
};
let trackMouse = false;
const Square = {
  elem: document.getElementById("square"),
  X: 0,
  Y: 0,
  Xvel: 0,
  Yvel: 0,
  maxJumps: 1,
  jumps: this.maxjumps,
  speed: 10,
  sizetospd: 0.2,
  size: 50,
  grounded: false,
  Cannon: {
    angle: 0,
    vel: 75,
  },
};
const OtherSquare = {
  elem: document.getElementById("othersquare"),
  X: 225,
  Y: 225,
  Xvel: 0,
  Yvel: 0,
  size: 50,
  hit: function() {
    OtherSquare.elem.style.backgroundColor = "#800000"; // dark red
    setTimeout(function() {
      OtherSquare.elem.style.backgroundColor = "#050505"; // reset to standard square colour in 50ms
    }, 50)
  }
};
let mode = false;
let trail = false;
let menu = false;
let firing = false;
let projectileID = 0;
let artillery = [];


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

// Add event listener on keydown
document.addEventListener('keydown', (event) => {
  const name = event.key;
  // const code = event.code;
  // Alert the key name and key code on keydown
  // alert(`Key pressed ${name} \r\n Key code value: ${code}`);
  
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
      firing = true;
      break;
  }
    
}, false);

document.addEventListener('keyup', (event) => {
  const name = event.key;

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
      firing = false;
      break;
    
    case "c":
      if (!menu) {openNav()}
      else {closeNav()};
      break;
    case "e":
      squaretomouse();
      break;
    case "r":
      removprojecs();
      break;
    case "v":
      makeprojectile(true);
      break;
  }
  
}, false);

function stuff() {
  movement();
  projectilemove();
  checkProjecColl();
  if (mode) {
    gravity();
  }
  if (trail) {
    makeprojectile();
  }
  if (firing) {
    makeprojectile(true);
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
  if (right == 1) {
    squareright(Square.speed);
  }
  if (left == 1) {
    squareleft(Square.speed);
  }
  if (!mode) {
    if (up == 1) {
      squareup(Square.speed);
    }
    if (down == 1) {
      squaredown(Square.speed);
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

function checkProjecColl() {
  for (let i = 0; i < artillery.length; i++) {
    if (collision(artillery[i], OtherSquare, true)) {
      const delProjec = artillery.splice(i, 1);
      i--;
      OtherSquare.hit();
      delProjec[0].elem.remove();
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

function makeprojectile(aiming = false) {
  // the aiming parameter is for artillery / mouse-aimed projectiles
  projectileID ++;
  const projectile = document.createElement("div");
  if (aiming) {
    projectile.className = "artillery";
  } else {
    projectile.className = "projectile";
  }
  projectile.id = projectileID
  projectile.style.left = Square.X + "px";
  projectile.style.top = Square.Y + "px";
  document.getElementById("projectilecontainer").appendChild(projectile);
  if (aiming) {
    let sin_ang = 0;
    let cos_ang = 0;
    if (trackMouse) {
      const MouserelX = Mouse.relX();
      const MouserelY = Mouse.relY();
      const mousedist = Math.sqrt(MouserelX * MouserelX + MouserelY * MouserelY);

      sin_ang = MouserelY / mousedist;
      cos_ang = MouserelX / mousedist;
    } else {
      sin_ang = Math.sin(Square.Cannon.angle * degToRad);
      cos_ang = Math.cos(Square.Cannon.angle * degToRad);
    };
    
    artillery.push({
      id: projectileID,
      elem: projectile,
      X: Square.X,
      Y: Square.Y,
      Xvel: cos_ang * Square.Cannon.vel,
      Yvel: sin_ang * Square.Cannon.vel,
      grounded: false,
      size: 5,
    });
  }
}

function projectilemove() {
  const projectiles = document.getElementsByClassName("projectile");
  // for projectiles:
  const len = projectiles.length;
  for (let i = 0; i < len; i++) {
    const projectile = projectiles[i];
    //console.log(projectile.style.left.slice(0, -2));
    projectile.style.left = (Number(projectile.style.left.slice(0,-2)) + Square.speed) + "px";
  }

  // for artillery:
  const len2 = artillery.length;
  for (let i = 0; i < len2; i++) {
    const projectile = artillery[i];
    projectile.X += projectile.Xvel*Square.speed/50;
    projectile.elem.style.left = projectile.X + "px";
    if (mode) {
      gravity(projectile)
    } else {
      // gravity() incorporates Y velocity, so change in Y has to be calculated separately when not using gravity()
      projectile.Y += projectile.Yvel*Square.speed/50;
      projectile.elem.style.top = projectile.Y + "px";
    }
  }
}

setInterval(stuff, 10);