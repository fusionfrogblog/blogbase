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

function initStage() {
	stage = {
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
}


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
		solid: type == "uniRainbow" ? false : true,
		delete: function () {
			dom.remove();
		},
		fadeIn: function(pl,cd,score) {
			audio.win.play();
			dom.hide();
			dom.fadeIn( 2000, function() {
  		});
			this.upScore = function(pl,cd,score) {
				game.score += score;
				cd--;
				if (cd > 0) {
				self= this;
				window.setTimeout(function() { self.upScore(pl,cd,score); }, 100);
			} else {
				pl.vx = pl.vy = 0;
				pl.x = 0;
				pl.y = 6;
				pl.move(0, 0);
				stage.timer = 0;
				game.goal++;
				game.score += game.goal * game.score;
				game.try = 1;
				// to do: completely rewrite and reset level
				//touch.active = true;
				cd = 1;
				this.waitForMessage = function() {
					window.setTimeout(function() { self.waitForMessage(cd)},1000);
				}
			}
			}
			this.upScore(pl,cd,score);
		},

		fadeOut: function(index,cd,score) {
			cd--;
			game.score += score;
			dom.css(
				"transform",
				sp(
					"scale(%f, %f)",
					cd/10,
					cd/10
				)
			);
			self = this;
			if (cd > 0) window.setTimeout(function() {self.fadeOut(index,cd,score); },30);
		}
	};
	stage.props.push(self);
	//if (stage.props.length > stage.maxprops) {
	if (game.rainbowCount > 30) {
		stage.props.find(function (prop, i) {
			if (prop.type == "uniRainbow") {
				prop.delete();
				game.rainbowCount --;
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
		delete: function () {
			dom.remove();
		},
		move: function (dx, dy) {
			this.x += dx;
			this.y += dy;
			dom.css("left", this.x + "pc");
			dom.css("top", this.y + "pc");
		},
		update: function () {
			if (this.y > 256) this.die();
			if (input.jump()) {
				game.jumpPressed = true;
				if (this.type == "player" && touch.active && this.canjump ) {
					player.vy = -0.72;
					audio.jump.play();
					this.canjump = false;

				}
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
			audio.music2.pause();
			touch.active = false;
			//this.vx = this.vy = 0;
			this.vx = 1;
			this.vy = 0;

			this.move(0, 0);
			stage.timer = 0;
			audio.die.play();
			stage.animDie = 1;
			this.animDieLoop(this);
		},
		animDieLoop: function(self) {
			stage.animDie++;
			if (stage.animDie < 8) {
				self.x += .5;
			dom.css(
				"transform",
				sp(
					"scale(%f, %f) rotate(%fdeg)",
					1 + Math.abs(stage.animDie / 9),
					1 + Math.abs(stage.animDie/ 9),
					stage.animDie * 4
				)
			);
		}
			 if (stage.animDie > 18) {
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
				 self.x = game.map.player.x;
				 self.y = game.map.player.y;
				 self.move(0, 0);
				 touch.active = true;
				 game.try++;
				 resetPlayer();
			 } else {
				 window.setTimeout(self.animDieLoop, 40, self);
			 }
		},

		win: function () {
			touch.active = false;
			if (!game.atGoal) {
				prop("iceCream", this.x-1,this.y-10, 4.5,9.5);
				$('.iceCream').hide();
				this.x -= 1;
				self = this;
				$('.iceCream').fadeIn( 2000, function() {
					game.score += 1200;
					prop("speech-bubble", self.x+9,self.y-5, 10,4);
					$('.speech-bubble').html("Congratulations!<br/>Enjoy your Ice cream.");
					self = this;
					game.jumpPressed = false;
					clickId = setInterval(function() {
						if (game.jumpPressed) {
							game.jumpPressed = false;
							clearInterval(clickId);
							loadNextLevel();
						}
					}, 100);
				});
				audio.win.play();
			}
			game.atGoal = true;

		}
	};
	stage.actors.push(self);
	return self;
}

function collision(actor) {
	var collide = 0;
	stage.props.forEach(function (prop,index) {
		if (
			prop.solid &&
			actor.y + actor.h >= prop.y &&
			actor.y <= prop.y + prop.h &&
			actor.x + actor.w >= prop.x &&
			actor.x <= prop.x + prop.w
		) {
			if (prop.type == "poop" || prop.type == "lava") {
				if (game.score > 0) game.score --;
				if (touch.active) actor.die();
				return;
			}
			if (prop.type == "diamond" || prop.type == "cupcake1") {
				//prop.delete();
				//stage.props.splice(index, 1);
				if (prop.type == "diamond") {
					audio.bling.play();
				}
				if (prop.type == "cupcake1") {
					audio.yummy.play();
				}

				stage.props[index].y = -1;
				stage.props[index].x = -1;
				prop.fadeOut(index,10,5);
				//prop.y = 0;
				return;
			}

			if (prop.type == "goal") {
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
		this.x = lerp(this.x+3, this.fx(), this.speed);
		this.y = lerp(this.y, this.fy(), this.speed);
		if (game.doRainbow) {
			prop("uniRainbow", stage.actors[0].x-2,stage.actors[0].y+1, 2,2);
			game.rainbowCount ++;
		}
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

function loadNextLevel() {
	// unload previous level
	stage.props.find(function (prop, i) {
			prop.delete();
	});
	stage.actors.find(function (actor, i) {
			actor.delete();
	});
	stage.props = {};
	initStage();
	game.level++;
	loadLevel(game.levels.level[game.level-1]);
}

function loadLevel(level) {
	// block multiplier
	var ym = 2;
	var xm = 2;
	// start position
	var sx = 0;
	var sy = 12;
	game.map.largestLine = 0;
	//console.log('loadLevel',level);
	for (var pLine in level.map) {
		//console.log(level.map[pLine]);
		var y = pLine * ym + sy;
		var mapLine = level.map[pLine];
		if (mapLine.length > game.map.largestLine) {
			game.map.largestLine = mapLine.length;
		}
		var platStart1 = -1;
		var platStart2 = -1;
		for (i=0;i<=mapLine.length;i++) {
			//console.log(mapLine.substring(i,i+1));
			var char = mapLine.substring(i,i+1);
			if (char == '*' && platStart1 == -1) {
				platStart1 = i;
			}
			if (platStart1 > -1 && (char != '*' || i == mapLine.length)) {
				platEnd1 = i;
				if (char == 'R') {
					platEnd1 = game.map.largestLine;
				}
				prop("grass", sx+xm*platStart1,y, (platEnd1-platStart1)*xm,ym);
				platStart1 = -1;
			}
			if (char == '_' && platStart2 == -1) {
				platStart2 = i;
			}
			if (platStart2 > -1 && (char != '_' || i == mapLine.length)) {
				platEnd2 = i;
				prop("grassTop", sx+xm*platStart2,y, (platEnd2-platStart2)*xm,ym);
				platStart2 = -1;
			}

			if (char == 'p') {
				prop("poop", sx+xm*i,y-1, 3,3);
			}
			if (char == 'l') {
				prop("lava", sx+xm*i,y-1, 3,3);
			}
			if (char == 'd') {
				prop("diamond", sx+xm*i,y-1, 3,3.2);
			}
			if (char == 'c') {
				prop("cupcake1", sx+xm*i,y-1, 3,4);
			}
			if (char == 'g') {
				//prop("platform goal", i * 16 + w + 2, y - 8, 2, 8);
				prop("goal", sx+xm*i,y, 5,7);
			}
			if (char == 'u') {
				game.map.player.x = sx+xm*i;
				game.map.player.y = y;
				audio.letsHop.play();
				resetPlayer();
				game.try = 1;
			}
		}
		if (level.id == '2') {
			game.doRainbow = true;
		}


	}

	//prop("platform", sx+4,sy+4, ym+2,xm);

	// game frame and player init
	//prop("platform", 0, 0, 2, 48);
	prop("grass", -2, 46, 302, 2);
	player = actor("player", game.map.player.x, game.map.player.y, 3, 3);
	cam.target = player;
	cam.reset();
	touch.active = false;
	game.atGoal = false;
}

function resetPlayer() {
	touch.active = false;
	x = game.map.player.x;
	y = game.map.player.y;

	// audio.music2.addEventListener('canplaythrough', function() {
	// 	audio.music2.currentTime = 0;
	// })
	window.startBubble = prop("speech-bubble", x+6,y-1, 10,4);
	$('.speech-bubble').html("Let's hop!<br>Press space or click.");

	self = this;
	game.jumpPressed = false;
	clickId = setInterval(function() {
		if (game.jumpPressed) {
			game.jumpPressed = false;
			clearInterval(clickId);
			startBubble.delete();
			touch.active = true;
			audio.music2.play();
			return;
		}
	}, 100);

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
	$("#i").text(sp("Level: %f Try: %f  Score: %f", game.level, game.try, game.score));
	touch.right = false;
	touch.left = false;
}
cam.zoom();

function startGame(levels) {
	initStage();
	game = {};
	game.map = {};
	game.map.player = {};
	game.score = 0;
	game.goal = 0;
	game.level = 1;
	game.levels = levels;
	game.rainbowCount = 0;
	//console.log('startGame - got levels',levels);
	const firstLevel = levels.level[0];
	loadLevel(firstLevel);
	window.requestAnimationFrame(gameloop);
}

// Load levels
$.getJSON("/assets/js/uvp/levels/levels.json")
	.done(function (allLevels ) {
		startGame(allLevels);
	// keep comment breaks on mobile
	// })
	// .fail(function( xhr, textStatus, error ) {
  //   var err = textStatus + ", " + error;
	// 	var errArray = error.toString().split(' ');
	// 	var pos = errArray[errArray.length-1];
	// 	var before1 = xhr.responseText.substring(pos-20,pos-2);
	// 	var offender1 = xhr.responseText.substring(pos-2,pos-1);
	// 	var after1 = xhr.responseText.substring(pos-1,pos+2);
  //   console.log( "Level JSON incorrect: " + err);
	// 	console.log(`%c${before1}%c${offender1}%c${after1}`,`color:green`, `color:red`,`color:green`);
	});

	(function() {
  if(!(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream)){ return false; }
  if(window.navigator.standalone == true){ return false; }
  if(document.cookie.search("alreadAsked") >= 0){ return false; }
  // show prompt

});
// function hidePromptInFuture(){
//   document.cookie = "alreadAsked=true; expires=Thu, 01 Dec 2020 12:00:00 UTC";
// }
