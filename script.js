const floorY = 440;
let right = 0;
let left = 0;
let up = 0;
let down = 0;
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
  grounded: false
}
let mode = false;
let trail = false;
let projectileID = 0;

function squareleft(v) {
  Square.X -= v; //moves square left
  square.style.left = Square.X + "px";
}

function squareright(v) {
  Square.X += v; //moves square right
  square.style.left = Square.X + "px";
}

function squareup(v) {
  Square.Y -= v; //moves square up
  square.style.top = Square.Y + "px";
}

function squaredown(v) {
  Square.Y += v; //moves square down
  square.style.top = Square.Y + "px";
}

const slider = document.getElementById("myRange");
const output = document.getElementById("slidervalue");

output.innerHTML = slider.value; // Display the default slider value
Square.speed = slider.value * Square.sizetospd;

// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
  output.innerHTML = this.value;
  square.style.height = this.value + "px";
  square.style.width = this.value + "px";
  Square.size = this.value;
  Square.speed = this.value * Square.sizetospd;
}

// Add event listener on keydown
document.addEventListener('keydown', (event) => {
  const name = event.key;
  // const code = event.code;
  // Alert the key name and key code on keydown
  // alert(`Key pressed ${name} \r\n Key code value: ${code}`);
  
  if (name.toLowerCase() == "a") {
    left = 1;
  }
  if (name.toLowerCase() == "d") {
    right = 1;
  }
  if (name.toLowerCase() == "w") {
    up = 1;
  }
  if (name.toLowerCase() == "s") {
    down = 1;
  }
  if (name.toLowerCase() == " ") {
    jump();
  }
    
}, false);

document.addEventListener('keyup', (event) => {
  const name = event.key;
  
  if (name.toLowerCase() == "a") {
    left = 0;
  }
  if (name.toLowerCase() == "d") {
    right = 0;
  }
  if (name.toLowerCase() == "w") {
    up = 0; 
  }
  if (name.toLowerCase() == "s") {
    down = 0;
  }
  if (name.toLowerCase() == "b") {
    makeprojectile()
  }
  
}, false);

function stuff() {
  movement();
  projectilemove();
  if (mode) {
    gravity();
  }
  if (trail) {
    makeprojectile();
  }
}
function gravity(obj = Square) {
  if (obj.Y > floorY - obj.size) {
    obj.grounded = true;
    if (obj.Y > floorY - obj.size + 1) {squareup(1)}
  }
  else {obj.grounded = false}
  
  if (!obj.grounded) {
    obj.Yvel += 1;
  }
  else if (obj.grounded) {
    obj.jumps = obj.maxJumps;
    if (obj.Yvel > 0) {obj.Yvel = 0}
  }
  
}

function squaretomouse() { // doesn't work
  Square.X = window.event.clientX;
  Square.Y = window.event.clientY;
  square.style.left = Square.X + "px";
  square.style.top = Square.Y + "px";
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
  if (mode) {
    squaredown(Square.Yvel*Square.speed/50);
  }
}

function jump() {
  if (Square.jumps > 0) {
    Square.grounded = false;
    Square.jumps = Square.jumps - 1;
    Square.Yvel = -50;
  }
}

function removsquare() {
  const elmnt = document.getElementById("othersquare");
  elmnt.remove();
}

function removprojecs() {
  const elmnts = document.getElementById("projectilecontainer").childNodes;
  const len = elmnts.length;
  for (let i = 0; i < len; i++) {
    console.log(elmnts[0]);
    elmnts[0].remove();
    // turns out HTMLCollections and NodeLists automatically update when you add or remove elements
    // this requires me to set the length in a constant
    // so that it doesn't change, which would cause the loop to break exactly halfway through, which it used to do
    // I also had to remove element 0, not i, from the collection - otherwise it would delete elements in an alternating pattern, which it used to do
  }
}

function makeprojectile() {
  projectileID ++;
  const projectile = document.createElement("div");
  projectile.className = "projectile";
  projectile.id = projectileID
  projectile.style.left = Square.X + "px";
  projectile.style.top = Square.Y + "px";
  document.getElementById("projectilecontainer").appendChild(projectile);
}

function projectilemove() {
  const projectiles = document.getElementsByClassName("projectile");
  const len = projectiles.length;
  for (let i = 0; i < len; i++) {
    const projectile = projectiles[i];
    //console.log(projectile.style.left.slice(0, -2));
    projectile.style.left = (Number(projectile.style.left.slice(0,-2)) + 10) + "px";
    //projectile.style.top = Number(projectile.style.top) + 10 + "px";
  }
}

setInterval(stuff, 10);