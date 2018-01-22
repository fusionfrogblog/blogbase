const keyboard = {
	keymap: {
		" ": 32,
		space: 32,
		spacebar: 32,
		control: 33,
		shift: 34,
		alt: 35,
		tab: 36,
		return: 37,
		enter: 38,
		lshift: 39,
		arrowleft: 40,
		left: 40,
		arrowright: 41,
		right: 41,
		arrowup: 42,
		up: 42,
		arrowdown: 43,
		down: 43,
		a: 97,
		b: 98,
		c: 99,
		d: 100,
		e: 101,
		f: 102,
		g: 103,
		h: 104,
		i: 105,
		j: 106,
		k: 107,
		l: 108,
		m: 109,
		n: 110,
		o: 111,
		p: 112,
		q: 113,
		r: 114,
		s: 115,
		t: 116,
		u: 117,
		v: 118,
		w: 119,
		x: 120,
		y: 121,
		z: 122
	},
	keys: new Uint8Array(128),
	keyspressed: new Uint8Array(128),
	down: function () {
		return !!Array.from(arguments).find(function (key) {
			return keyboard.keys[keyboard.keymap[key]] == 1;
		});
	},
	pressed: function () {
		return !!Array.from(arguments).find(function (key) {
			return keyboard.keyspressed[keyboard.keymap[key]] == 1;
		});
	}
};
$(document).keydown(function (event) {
	keyboard.keys[keyboard.keymap[event.key.toLowerCase()]] = 1;
	keyboard.keyspressed[keyboard.keymap[event.key.toLowerCase()]] = 1;
});
$(document).keyup(function (event) {
	keyboard.keys[keyboard.keymap[event.key.toLowerCase()]] = 0;
});
$(window).resize(function (event) {
	cam.zoom();
});
const touch = {
	right: false,
	righthold: false,
	left: false,
	lefthold: false,
	last: -1,
	time: 0,
	timer: null,
	active: true
};
const input = {
	jump: function () {
		return keyboard.pressed("space", "w", "up") || touch.right || touch.left;
	},
	right: function () {
		return true;
		//return keyboard.down("right", "d") || touch.righthold;
	},
	left: function () {
		return false;
		//return keyboard.down("left", "a") || touch.lefthold;
	}
};
$(document).on("touchstart", function (event) {
	var x = event.touches[0].clientX;
	var y = event.touches[0].clientY;
	if (y > window.innerWidth / 2) touch.righthold = true;
	else touch.lefthold = true;
	if (touch.righthold || touch.lefthold) {
		touch.right = true;
	}
});
$(document).on("touchend", function (event) {
	if (event.touches.length == 0) {
		touch.righthold = false;
		touch.lefthold = false;
	}
});
$(document).on("touchmove", function (event) {
	//console.log("move");
});
const sp = sprintf;
const body = $("#game");
const BOTTOM = 1;
const TOP = 2;
const LEFT = 4;
const RIGHT = 8;

function lerp(v0, v1, t) {
	return (1 - t) * v0 + t * v1;
}

var stage = {
	maxprops: 180,
	props: [],
	actors: [],
	update: function () {
		for (var i = 0; i < this.actors.length; i++) {
			this.actors[i].update();
		}
	},
	timer: 0
};

const audio = (function () {
	var self = {};
	Array.from($("audio")).forEach(function (element) {
		this[element.id] = element;
	}, self);
	return self;
})();

function prop(type, x, y, w, h, text) {
	x = x || 0;
	y = y || 0;
	w = w || 2;
	h = h || 2;
	var dom = $("<div>", {
		class: type,
		style: sp("left:%dpc;top:%dpc;width:%dpc;height:%dpc;", x, y, w, h),
		text: text || ""
	});
	body.append(dom);
	var self = {
		type: type,
		x: x,
		y: y,
		w: w,
		h: h,
		solid: type == "grave" ? false : true,
		delete: function () {
			dom.remove();
		}
	};
	stage.props.push(self);
	if (stage.props.length > stage.maxprops) {
		stage.props.find(function (prop, i) {
			if (prop.type == "grave") {
				prop.delete();
				stage.props.splice(i, 1);
				return true;
			} else return false;
		});
	}
	return self;
}

function actor(type, x, y, w, h, face) {
	x = x || 0;
	y = y || 0;
	w = w || 2;
	h = h || 2;
	face = face || "";
	var dom = $("<div>", {
		class: type,
		style: sp("left:%dpc;top:%dpc;width:%dpc;height:%dpc;", x, y, w, h),
		text: face
	});
	body.append(dom);
	var self = {
		type: type,
		face: face,
		canjump: false,
		x: x,
		y: y,
		w: w,
		h: h,
		vx: 0,
		vy: 0,
		move: function (dx, dy) {
			this.x += dx;
			this.y += dy;
			dom.css("left", this.x + "pc");
			dom.css("top", this.y + "pc");
			// animates transforms css player
			// dom.css(
			// 	"transform",
			// 	sp(
			// 		"scale(%f, %f) rotate(%fdeg)",
			// 		1 + Math.abs(this.vx / 3),
			// 		1 + Math.abs(this.vy / 3),
			// 		90 + this.vx * 15
			// 	)
			// );
		},
		update: function () {
			if (this.y > 256) this.die();
			if (this.type == "player" && touch.active && this.canjump && input.jump()) {
				player.vy = -0.72;
				audio.jump.play();
				this.canjump = false;
			}
			this.move(this.vx, this.vy);
			this.vy += 0.04;
			this.vx /= 2;
			var spd = this.vy;
			var coll = collision(this);
			if (spd > 0.1 && this.vy === 0 && coll & BOTTOM) {
				audio.land.play();
			}
			if (coll & BOTTOM) {
				this.canjump = true;
			}
		},
		die: function () {
			//prop("grave", this.x - this.vx, this.y - this.vy, 4, 3, ":(");
			touch.active = false;
			//this.vx = this.vy = 0;
			this.vx = 1;
			this.vy = 0;
			//this.x = 2;
			//this.y = 6;
			this.move(0, 0);
			stage.timer = 0;
			audio.die.play();
			stage.animDie = 1;
			this.animDieLoop(this);
		},
		animDieLoop: function(self) {
			stage.animDie++;
			dom.css(
				"transform",
				sp(
					"scale(%f, %f) rotate(%fdeg)",
					1 + Math.abs(stage.animDie / 3),
					1 + Math.abs(stage.animDie/ 3),
					stage.animDie * 5
				)
			);
			 if (stage.animDie > 8) {
				 dom.css(
					 "transform",
					 sp(
						 "scale(%f, %f) rotate(%fdeg) ",
						 1,
						 1,
						 0
					 )
				 );
				 self.vx = this.vy = 0;
				 self.vx = 1;
				 self.x = 2;
				 self.y = 6;
				 self.move(0, 0);
				 touch.active = true;
				 game.try++;
			 } else {
				 window.setTimeout(self.animDieLoop, 40, self);
			 }
		},

		win: function () {
			this.vx = this.vy = 0;
			this.x = 2;
			this.y = 6;
			this.move(0, 0);
			stage.timer = 0;
			game.goal++;
			game.score += game.goal * game.score;
			audio.win.play();
		}
	};
	stage.actors.push(self);
	return self;
}

function collision(actor) {
	var collide = 0;
	stage.props.forEach(function (prop) {
		if (
			prop.solid &&
			actor.y + actor.h >= prop.y &&
			actor.y <= prop.y + prop.h &&
			actor.x + actor.w >= prop.x &&
			actor.x <= prop.x + prop.w
		) {
			if (prop.type == "spike" || prop.type == "lava") {
				if (touch.active) actor.die();
				return;
			}
			if (prop.type == "platform goal") {
				actor.win();
				return;
			}
			var dy1 = actor.y + actor.h - prop.y;
			var dy2 = prop.y + prop.h - actor.y;
			var dx1 = actor.x + actor.w - prop.x;
			var dx2 = prop.x + prop.w - actor.x;
			var c = Math.min(
				Math.abs(dy1),
				Math.abs(dy2),
				Math.abs(dx1),
				Math.abs(dx2)
			);
			if (c == dy1) {
				actor.y = prop.y - actor.h;
				actor.vy = 0;
				collide |= BOTTOM;
			} else if (c == dy2) {
				actor.y = prop.y + prop.h;
				actor.vy = -actor.vy / 2 + 0.1;
				collide |= TOP;
			} else if (c == dx1) {
				actor.x = prop.x - actor.w;
				collide |= RIGHT;
			} else if (c == dx2) {
				actor.x = prop.x + prop.w;
				collide |= LEFT;
			}
			actor.move(0, 0);
		}
	});
	return collide;
}

const cam = {
	x: 0,
	y: 0,
	currFFZoom: 1,
	currIEZoom: 100,
	zoomlvl: 1,
	rot: false,
	target: null,
	speed: 0.1,
	update: function () {
		this.follow();
		window.scrollTo(0, 0);
		body.css(
			"transform",
			sp(
				"scale(%.2f, %.2f) translate(%.2fpc, %.2fpc) %s",
				this.zoomlvl,
				this.zoomlvl,
				this.rot ? this.y + ((window.innerHeight / this.zoomlvl) / 32) : -this.x,
				this.rot ? -this.x + ((window.innerHeight / this.zoomlvl) / 32) : -this.y,
				this.rot ? "rotate(90deg)" : ""
			)
		);
	},
	zoom: function () {
		this.rot = (window.innerHeight / window.innerWidth) > 1;
		this.zoomlvl = ((window.innerWidth + window.innerHeight) / (1280 + 720)) + (this.rot ? 0.3 : 0);
	},
	follow: function () {
		this.x = lerp(this.x, this.fx(), this.speed);
		this.y = lerp(this.y, this.fy(), this.speed);
	},
	reset: function () {
		this.x = this.fx();
		this.y = this.fy();
	},
	fx: function () {
		return this.target.x + this.target.w / 2 - ((window.innerWidth) / 32);
	},
	fy: function () {
		return this.target.y + this.target.h / 2 - ((window.innerHeight / cam.zoomlvl) / 32);
	}
};
// setup level

// var y = 16;
// for (var i = 0; i < 16; i++) {
// 	y = Math.round(y + (Math.random() - 0.5) * 3);
// 	var w = Math.round(8 + Math.random() * 2) * 2;
// 	prop("platform", i * 16, y, w, 2);
// 	if (i == 15) prop("platform goal", i * 16 + w + 2, y - 8, 2, 8);
// 	if (Math.random() < 0.5 && i > 1) prop("spike", i * 16 + 4, y - 2, Math.round(w / 6) * 2);
// }
//prop("spike", 2, 44, 302, 3);
// prop("platform", 0, 0, 2, 48);
// prop("platform", -2, 46, 302, 2);
// var player = actor("player", 2, 8, 3, 3);
// cam.target = player;
// cam.reset();

function setLevel(level) {
	// block multiplier
	var ym = 2;
	var xm = 2;
	// start position
	var sx = 0;
	var sy = 12;
	console.log('setLevel',level);
	for (var pLine in level.map) {
		console.log(level.map[pLine]);
		var y = pLine * ym + sy;
		var mapLine = level.map[pLine];
		var platStart = -1;
		for (i=0;i<=mapLine.length;i++) {
			//console.log(mapLine.substring(i,i+1));
			var char = mapLine.substring(i,i+1);
			if (char == '*' && platStart == -1) {
				platStart = i;
			}
			if (platStart > -1 && (char != '*' || i == mapLine.length)) {
				platEnd = i;
				//console.log('Platform ',platStart,platEnd,sx+xm*platStart,y, (platEnd-platStart)*xm,ym);
				prop("platform", sx+xm*platStart,y, (platEnd-platStart)*xm,ym);
				platStart = -1;
			}
			if (char == 'p') {
				prop("spike", sx+xm*i,y-1, 3,3);
			}
			if (char == 'l') {
				prop("lava", sx+xm*i,y-1, 3,3);
			}
			if (char == 'g') {
				//prop("platform goal", i * 16 + w + 2, y - 8, 2, 8);
				prop("platform goal", sx+xm*i,y-1, 3,8);
			}
		}


	}
	//prop("platform", sx+4,sy+4, ym+2,xm);

	// game frame and player init
	prop("platform", 0, 0, 2, 48);
	prop("platform", -2, 46, 302, 2);
	player = actor("player", 2, 8, 3, 3);
	cam.target = player;
	cam.reset();
}

function gameloop(time) {
	window.requestAnimationFrame(gameloop);
	if (touch.active && input.right()) player.vx += 0.25;
	if (touch.active && input.left()) player.vx -= 0.25;
	if (stage) stage.update();
	cam.update();
	keyboard.keyspressed.forEach(function (v, i, a) {
		a[i] = 0;
	});
	stage.timer++;
	// stage.timer /60
	$("#i").text(sp("Try: %f | Score: %f", game.try, game.goal));
	touch.right = false;
	touch.left = false;
}
cam.zoom();

function startGame(levels) {
	game = {};
	game.score = 0;
	game.try = 1;
	game.goal = 0;
	console.log('startGame - got levels',levels);
	const firstLevel = levels.level[0];
	setLevel(firstLevel);
	window.requestAnimationFrame(gameloop);
}

// Load levels
$.getJSON("/assets/js/uvp/levels/levels.json")
	.done(function (allLevels ) {
		startGame(allLevels);
	})
	.fail(function( jqxhr, textStatus, error ) {
    var err = textStatus + ", " + error;
    console.log( "Request Failed: " + err );
});
//window.requestAnimationFrame(gameloop);
