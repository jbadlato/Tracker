var vendors = ['webkit', 'moz'];
for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
}

var canvas = document.getElementById("game_screen");
canvas.width = 1040;
canvas.height = 640;
var canvasW = canvas.width;
var canvasH = canvas.height;
var ctx = canvas.getContext("2d");

var startTime; 
var lastTime;
var currentTime;
var delta;

var mousPos;

var player;
var missileArray;
var missileSpawner;
var scoreIncrement;
var score = 0;

class Ship {
	constructor(xPos, yPos, speed, turnSpeed) {
		this.isAlive = true;
		this.position = {
			x: xPos,
			y: yPos
		};
		this.speed = speed;
		this.velocity = {
			x: 0,
			y: 0
		};
		this.turnSpeed = turnSpeed;
		this.acceleration = {
			x: 0,
			y: 0
		}
	}
	updateAcceleration (target) {
		// check that ship is already moving
		if (this.velocity.x === 0 && this.velocity.y === 0) {
			let xDiff = target.x - this.position.x;
			let yDiff = target.y - this.position.y;
			//normalize to velocity of 1:
			let newVelY = yDiff / Math.sqrt( xDiff*xDiff + yDiff*yDiff );
			let newVelX = xDiff / Math.sqrt( xDiff*xDiff + yDiff*yDiff );
			this.velocity.x = newVelX;
			this.velocity.y = newVelY;
			return;
		}
		// check if need to turn left or right to point towards target:
		let a = this.position;
		let b = {
			x: this.position.x + this.velocity.x,
			y: this.position.y + this.velocity.y
		};
		let direct = leftOrRight(a, b, target);
		switch (direct) {
			case 1: // target is to the right
				this.acceleration = perpRight(this.velocity);
				break;
			case -1: // target is to the left
				this.acceleration = perpLeft(this.velocity);
				break;
			case 0: // target is directly ahead or behind
			case -0: 
				this.acceleration = {x: 0, y: 0};
				break;
			case NaN: 
				console.log('Error updating Acceleration');
		}
	}
	updateVelocity (delta) {
		this.velocity.x += this.turnSpeed*this.acceleration.x*delta;
		this.velocity.y += this.turnSpeed*this.acceleration.y*delta;
		let vel = Math.sqrt(this.velocity.x*this.velocity.x + this.velocity.y*this.velocity.y);
		if (vel !== 0) {
			this.velocity.x *= this.speed / vel;
			this.velocity.y *= this.speed / vel;
		}
	}
	updatePosition(delta) {
		this.position.x += this.speed*this.velocity.x*delta + 0.5*this.turnSpeed*this.acceleration.x*delta*delta;
		this.position.y += this.speed*this.velocity.y*delta + 0.5*this.turnSpeed*this.acceleration.y*delta*delta;
		/*
		// make sure position is still within canvas:
		if (this.position.x > canvasW - this.radius || this.position.x < 0 + this.radius 
			|| this.position.y > canvasH - this.radius || this.position.y < 0 + this.radius) {
			this.isAlive = false;
		}
		*/
	}
}

class Missile extends Ship {
	constructor(xPos, yPos) {
		let speed = 20;
		let turnSpeed = 3;
		super(xPos, yPos, speed, turnSpeed);
		this.color = "#F22";
		this.radius = 3;
	}
	draw () {
		ctx.beginPath();
		ctx.arc(this.position.x, this.position.y, this.radius, 0, 2*Math.PI);
		ctx.fillStyle = this.color;
		ctx.strokeStyle = this.color;
		ctx.fill();
		ctx.stroke();
	}
}

class Player extends Ship {
	constructor(xPos, yPos) {
		let speed = 15;
		let turnSpeed = 10;
		super(xPos, yPos, speed, turnSpeed);
		this.color = "#000";
		this.radius = 5;
	}
	draw () {
		ctx.beginPath();
		ctx.arc(this.position.x, this.position.y, this.radius, 0, 2*Math.PI);
		ctx.fillStyle = this.color;
		ctx.strokeStyle = this.color;
		ctx.fill();
		ctx.stroke();
	}
}

function clrScrn() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function leftOrRight(a, b, c) {
	// Checks to see if point c is left or right of the vector AB
	// makes use of 2d cross product of AB and AC.
	// +1 is right, -1 is left, 0 is on the vector.
	return Math.sign(((b.x - a.x)*(c.y - a.y) - (b.y - a.y)*(c.x - a.x)));
}

function perpLeft(vector) {
	// returns perpendicular vector to the left (counter-clockwise)
	return {x: vector.y, y: -vector.x};
}

function perpRight(vector) {
	// returns perpendicular vector to the right (clockwise)
	return {x: -vector.y, y: vector.x};
}

function spawnMissile() {
	//pick a random corner:
	let topBottom = Math.floor(Math.random() * 2);
	let rightLeft = Math.floor(Math.random() * 2); 
	let x, y;
	if (topBottom === 0) {
		x = Math.floor(canvasW * 0.05);
	} else {
		x = Math.floor(canvasW * 0.95);
	}
	if (rightLeft === 0) {
		y = Math.floor(canvasH * 0.05);
	} else {
		y = Math.floor(canvasH * 0.95);
	}
	missileArray.push(new Missile(x, y));
}

function getDistance (a, b) {
	return Math.sqrt((a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y));
}

function checkForCollisions () {
	for (let missile of missileArray) {
		if (getDistance(player.position, missile.position) < (player.radius + missile.radius)) {
			player.isAlive = false;
		}
	}
	for (let i = 0; i < missileArray.length; i++) {
		for (let j = i+1; j < missileArray.length; j++) {
			let missileA = missileArray[i];
			let missileB = missileArray[j];
			if (getDistance(missileA.position, missileB.position) < (missileA.radius + missileB.radius)) {
				missileA.isAlive = false;
				missileB.isAlive = false;
			}
		}
	}
}

function updateScore() {
	ctx.font = "50px Arial";
	ctx.fillStyle = "#CCC";
	ctx.textAlign = "center";
	ctx.fillText(score.toString(),canvasW/2,canvasH/2);
}

function gameLoop() {
	checkForCollisions();
	currentTime = (new Date()).getTime();
	delta = (currentTime - lastTime) / 1000; 
	lastTime = currentTime;

	// Spawn missile every 10 seconds

	clrScrn();
	updateScore();
	player.draw();
	if (typeof mousePos !== 'undefined') {
		player.updatePosition(delta);
		player.updateVelocity(delta);
		player.updateAcceleration(mousePos);
	}
	for (let missile of missileArray) {
		missile.draw();
		missile.updatePosition(delta);
		missile.updateVelocity(delta);
		missile.updateAcceleration(player.position);
	}

	// Check to see what is still alive:
	if (player.isAlive) {
		window.requestAnimationFrame(gameLoop);
	} else {
		endGame();
	}
	for (let i = 0; i < missileArray.length; i++) {
		let missile = missileArray[i];
		if (!missile.isAlive) {
			score += 100;
			missileArray.splice(i, 1);
		}
	}
}

function getMousePos(canvas, evt) {
	let rect = canvas.getBoundingClientRect();
	return {
		x: evt.clientX - rect.left,
		y: evt.clientY - rect.top
	};
}

function handleMouseMove (evt) {
	mousePos = getMousePos(canvas, evt);
	player.updateAcceleration(mousePos);
}

function handleMouseDown (evt) {
	//player.isAlive = false; // artificial way to die/end the game for now
}

function startGame() {
	startTime = (new Date()).getTime();
	lastTime = startTime;

	player = new Player(canvasW/2, canvasH/2);
	missileArray = [];
	spawnMissile();
	missileSpawner = setInterval(spawnMissile, 5000); // Spawns missile every 5 seconds
	scoreIncrement = setInterval(function(){ // Adds one to score every half second
		score += 1;
	}, 500);

	canvas.addEventListener('mousemove', handleMouseMove, false);
	canvas.addEventListener('mousedown', handleMouseDown);

	if (typeof (canvas.getContext) !== 'undefined') {
		window.requestAnimationFrame(gameLoop);
	}
	document.getElementById('start_button').style.display = 'none';
}

function endGame() {
	// reinitialize everything:
	clearInterval(missileSpawner);
	clearInterval(scoreIncrement);
	canvas.removeEventListener('mousemove', handleMouseMove, false);
	canvas.removeEventListener('mousedown', handleMouseDown);
	delete mousePos;
	score = 0;

	// Draw "Game Over":
	ctx.font = "75px Georgia";
	ctx.fillStyle = "#E00";
	ctx.textAlign = "center";
	ctx.fillText("GAME OVER",canvasW/2,canvasH/4);

	// Show start button for next game:
	document.getElementById('start_button').style.display = 'inline';
}