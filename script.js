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

var lastTime = (new Date()).getTime();
var currentTime = 0;
var delta = 0;

var mousPos;

var p;

function getMousePos(canvas, evt) {
	let rect = canvas.getBoundingClientRect();
	return {
		x: evt.clientX - rect.left,
		y: evt.clientY - rect.top
	};
}

function clrScrn() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

class Player {
	constructor() {
		this.isAlive = true;
		this.position = {
			x: canvasW/2, 
			y: canvasH/2
		}
		this.speed = 50;
		this.velocity = {
			x: 0,
			y: 0
		}
	}
	draw () {
		ctx.beginPath();
		ctx.arc(this.position.x, this.position.y, 3, 0, 2*Math.PI);
		ctx.fillStyle = "#000";
		ctx.fill();
		ctx.stroke();
	}
	updateVelocity (pos) {
		let xDiff = pos.x - this.position.x;
		let yDiff = pos.y - this.position.y;
		//normalize to velocity of 1:
		let newVelY = this.speed * yDiff / Math.sqrt( xDiff*xDiff + yDiff*yDiff );
		let newVelX = this.speed * xDiff / Math.sqrt( xDiff*xDiff + yDiff*yDiff );
		this.velocity.x = newVelX;
		this.velocity.y = newVelY;
	}
	move(delta) {
		this.position.x += this.velocity.x * delta;
		this.position.y += this.velocity.y * delta;
	}
}

function gameLoop() {
	window.requestAnimationFrame(gameLoop);

	currentTime = (new Date()).getTime();
	delta = (currentTime - lastTime) / 1000; 
	lastTime = currentTime;

	clrScrn();
	p.draw();
	p.updateVelocity(mousePos);
	p.move(delta);
}

function startGame() {
	p = new Player();
	canvas.addEventListener('mousemove', function(evt) {
		mousePos = getMousePos(canvas, evt);
		p.updateVelocity(mousePos);
	}, false);
	canvas.addEventListener('mousedown', function(evt) {
		p.isAlive = false;
	});
	if (typeof (canvas.getContext) !== undefined) {
		gameLoop();
	}
}