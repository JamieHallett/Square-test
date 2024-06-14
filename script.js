const maxjumps = 1;
var right = 0;
var left = 0;
var up = 0;
var down = 0;
var squareX = 0;
var squareY = 0;
var squaresize = 0;
var squareYvel = 0;
var jumps = maxjumps;
var mode = false;
var grounded = false;
var trail = false;
let projectileID = 0;

function squareleft(v) {
  squareX = squareX - v; //moves square left
  square.style.left = squareX + "px";
}

function squareright(v) {
  squareX = squareX + v; //moves square right
  square.style.left = squareX + "px";
}

function squareup(v) {
  squareY = squareY - v; //moves square up
  square.style.top = squareY + "px";
}

function squaredown(v) {
  squareY = squareY + v; //moves square down
  square.style.top = squareY + "px";
}

const slider = document.getElementById("myRange");
const output = document.getElementById("slidervalue");

output.innerHTML = slider.value; // Display the default slider value
squaresize = slider.value / 5;

// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
  output.innerHTML = this.value;
  square.style.height = this.value + "px";
  square.style.width = this.value + "px";
  squaresize = this.value / 5;
}

// Add event listener on keydown
document.addEventListener('keydown', (event) => {
  const name = event.key;
  // var code = event.code;
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
function gravity() {
  if (squareY > 440 - squaresize * 5) {grounded = true}
  else {grounded = false}
  
  if (!grounded) {
    squareYvel = squareYvel + 1;
  }
  else if (grounded) {
    jumps = maxjumps;
    if (squareYvel > 0) {squareYvel = 0}
  }
  
}

function squaretomouse() { // doesn't work
  squareX = window.event.clientX;
  squareY = window.event.clientY;
  square.style.left = squareX + "px";
  square.style.top = squareY + "px";
}

function movement() { // there may be an easier way to do this
  if (right == 1) {
    squareright(squaresize);
  }
  if (left == 1) {
    squareleft(squaresize);
  }
  if (!mode) {
    if (up == 1) {
      squareup(squaresize);
    }
    if (down == 1) {
      squaredown(squaresize);
    }
  }
  if (mode) {
    squaredown(squareYvel*squaresize/50);
  }
}

function jump() {
  if (jumps > 0) {
    grounded = false;
    jumps = jumps - 1;
    squareYvel = -50;
  }
}

function removsquare() {
  const elmnt = document.getElementById("othersquare");
  elmnt.remove();
}

function removprojecs() {
  const elmnts = document.getElementsByClassName("projectile");
  for (let i = 0; i < elmnts.length; i++) {
    console.log(elmnts[i]);
    elmnts[i].remove();
  }
}

function makeprojectile() {
  projectileID ++;
  const projectile = document.createElement("div");
  projectile.className = "projectile";
  projectile.id = projectileID
  projectile.style.left = squareX + "px";
  projectile.style.top = squareY + "px";
  document.getElementById("projectilecontainer").appendChild(projectile);
}

function projectilemove() {
  const projectiles = document.getElementsByClassName("projectile");
  for (let i = 0; i < projectiles.length; i++) {
    const projectile = projectiles[i];
    //console.log(projectile.style.left.slice(0, -2));
    projectile.style.left = (Number(projectile.style.left.slice(0,-2)) + 10) + "px";
    //projectile.style.top = Number(projectile.style.top) + 10 + "px";
  }
}

setInterval(stuff, 10);