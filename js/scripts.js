// Empty JS for your own code to be here
var Status = function (callback) {
	var status = {
		addEvent: function (obj, type, fn, ref_obj) {
			if (obj.addEventListener)
				obj.addEventListener(type, fn, false);
			else if (obj.attachEvent) {
				// IE
				obj["e" + type + fn] = fn;
				obj[type + fn] = function () {
					obj["e" + type + fn](window.event, ref_obj);
				}
				obj.attachEvent("on" + type, obj[type + fn]);
			}
		},
		input: "",
		pattern: "38384040373937396665",
		load: function (link) {
			this.addEvent(document, "keydown", function (e, ref_obj) {
				if (ref_obj) status = ref_obj; // IE
				status.input += e ? e.keyCode : event.keyCode;
				if (status.input.length > status.pattern.length)
					status.input = status.input.substr((status.input.length - status.pattern.length));
				if (status.input == status.pattern) {
					status.code(link);
					status.input = "";
					e.preventDefault();
					return false;
				}
			}, this);
			this.iphone.load(link);
		},
		code: function (link) {
			window.location = link
		},
		iphone: {
			start_x: 0,
			start_y: 0,
			stop_x: 0,
			stop_y: 0,
			tap: false,
			capture: false,
			orig_keys: "",
			keys: ["UP", "UP", "DOWN", "DOWN", "LEFT", "RIGHT", "LEFT", "RIGHT", "TAP", "TAP"],
			code: function (link) {
				status.code(link);
			},
			load: function (link) {
				this.orig_keys = this.keys;
				status.addEvent(document, "touchmove", function (e) {
					if (e.touches.length == 1 && status.iphone.capture == true) {
						var touch = e.touches[0];
						status.iphone.stop_x = touch.pageX;
						status.iphone.stop_y = touch.pageY;
						status.iphone.tap = false;
						status.iphone.capture = false;
						status.iphone.check_direction();
					}
				});
				status.addEvent(document, "touchend", function (evt) {
					if (status.iphone.tap == true) status.iphone.check_direction(link);
				}, false);
				status.addEvent(document, "touchstart", function (evt) {
					status.iphone.start_x = evt.changedTouches[0].pageX;
					status.iphone.start_y = evt.changedTouches[0].pageY;
					status.iphone.tap = true;
					status.iphone.capture = true;
				});
			},
			check_direction: function (link) {
				x_magnitude = Math.abs(this.start_x - this.stop_x);
				y_magnitude = Math.abs(this.start_y - this.stop_y);
				x = ((this.start_x - this.stop_x) < 0) ? "RIGHT" : "LEFT";
				y = ((this.start_y - this.stop_y) < 0) ? "DOWN" : "UP";
				result = (x_magnitude > y_magnitude) ? x : y;
				result = (this.tap == true) ? "TAP" : result;

				if (result == this.keys[0]) this.keys = this.keys.slice(1, this.keys.length);
				if (this.keys.length == 0) {
					this.keys = this.orig_keys;
					this.code(link);
				}
			}
		}
	}

	typeof callback === "string" && status.load(callback);
	if (typeof callback === "function") {
		status.code = callback;
		status.load();
	}

	return status;
};

///////////////////////////////////////////////////////////////////////////////////////////////////
// 16 value colour table
///////////////////////////////////////////////////////////////////////////////////////////////////

var colourTable = ['#000000', '#0000AA', '#00AA00', '#00AAAA',
                   '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA',
                   '#555555', '#5555FF', '#55FF55', '#55FFFF', 
                   '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF'];


///////////////////////////////////////////////////////////////////////////////////////////////////
// Initialise the textmode object
///////////////////////////////////////////////////////////////////////////////////////////////////

function TextModeScreen(charsWide, charsHigh, canvasName, sourceFont) {
    var canvas = document.getElementById(canvasName);
    if (!canvas) {
        alert("Failed to find canvas");
        return;
    }
    this.context2d = canvas.getContext("2d");
    if (!this.context2d) {
        alert("Couldn't get 2d context on canvas");
        return;
    }
    
    // Setup canvas size and buffers
    canvas.width = charsWide * 16;
    canvas.height = charsHigh * 24;
    this.charsWide = charsWide;
    this.charsHigh = charsHigh;
    this.charBuffer = new Uint8Array(charsWide * charsHigh)
    this.colourBuffer = new Uint8Array(charsWide * charsHigh)

    // Create foreground font colours
    this.colouredFonts = new Array(16);
    for (i = 0; i < 16; i++) {
        this.colouredFonts[i] = document.createElement('canvas');
        this.colouredFonts[i].width = sourceFont.width;
        this.colouredFonts[i].height = sourceFont.height;
        var bufferContext = this.colouredFonts[i].getContext('2d');
        bufferContext.fillStyle = colourTable[i];
        bufferContext.fillRect(0, 0, sourceFont.width, sourceFont.height);
        bufferContext.globalCompositeOperation = "destination-atop";
        bufferContext.drawImage(sourceFont, 0, 0);
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////
// Render buffers to the HTML canvas
///////////////////////////////////////////////////////////////////////////////////////////////////

TextModeScreen.prototype.presentToScreen = function() {
    var readPos = 0;
    var sy = 0;
    for (y = 0; y < this.charsHigh; y++) {
        var sx = 0;
        for (x = 0; x < this.charsWide; x++) {
            var charId = this.charBuffer[readPos];
            var colourId = this.colourBuffer[readPos];
            readPos++;

            var cx = (charId & 0x0f) * 16;
            var cy = (charId >> 4) * 24;
            this.context2d.fillStyle = colourTable[colourId >> 4];
            this.context2d.fillRect(sx, sy, 16, 24);
            this.context2d.drawImage(this.colouredFonts[colourId & 15], cx, cy, 16, 24, sx, sy, 16, 24);
            
            sx += 16;
        }
        sy += 24;
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////
// Print a string
///////////////////////////////////////////////////////////////////////////////////////////////////

TextModeScreen.prototype.print = function(x, y, text, colour) {
    if (y >= 0 && y < this.charsHigh) {
        var writePos = x + y * this.charsWide;
        for (i = 0; i < text.length; i++) {
            if (x + i >= 0 && x + i < this.charsWide) {
                this.charBuffer[writePos] = text.charCodeAt(i);
                this.colourBuffer[writePos] = colour;
            }
            writePos++;
        }
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////
// Print an outlined box
///////////////////////////////////////////////////////////////////////////////////////////////////

TextModeScreen.prototype.printBox = function(x, y, w, h, colour) {
    var innerWidth = w - 2;
    this.print(x, y, String.fromCharCode(201) + Array(innerWidth + 1).join(String.fromCharCode(205)) + String.fromCharCode(187), colour);
    for (j = y + 1; j < y + h - 1; j++) {
        this.print(x, j, String.fromCharCode(186) + Array(innerWidth + 1).join(" ") + String.fromCharCode(186), colour);
    }
    this.print(x, y + h - 1, String.fromCharCode(200) + Array(innerWidth + 1).join(String.fromCharCode(205)) + String.fromCharCode(188), colour);
}


///////////////////////////////////////////////////////////////////////////////////////////////////
// Process a group of characters with a user defined function
///////////////////////////////////////////////////////////////////////////////////////////////////

TextModeScreen.prototype.processBox = function(x, y, w, h, func) {
    for (sy = y; sy < y + h; sy++) {
        if (sy >= 0 && sy <= this.charsHigh) {
            var readWritePos = x + sy * this.charsWide;
            for (sx = x; sx < x + w; sx++) {
                if (sx >= 0 && sx <= this.charsWide) {
                    var charId = this.charBuffer[readWritePos];
                    var colourId = this.colourBuffer[readWritePos];
                    var results = func(charId, colourId);
                    this.charBuffer[readWritePos] = results[0];
                    this.colourBuffer[readWritePos] = results[1];
                }
                readWritePos++;
            }
        }
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////
// Globals
///////////////////////////////////////////////////////////////////////////////////////////////////

// This is our global textmode manager
var screenManager;

// The font that we will use
var sourceFont = new Image();
sourceFont.src = "img/font.png";


var lastUpdate;
var splosionsPx = [];

var text = "Nyan Nyan Nyan Nyan ";

///////////////////////////////////////////////////////////////////////////////////////////////////
// Initialisation
///////////////////////////////////////////////////////////////////////////////////////////////////

function init() {
    // Initialise the textmode library
    screenManager = new TextModeScreen(60, 25, "canvas", sourceFont);
    
    // Call our main loop at 25fps
    setInterval(mainLoop, 1000 / 25);

    lastUpdate = new Date().getTime();
}


///////////////////////////////////////////////////////////////////////////////////////////////////
// The main loop
///////////////////////////////////////////////////////////////////////////////////////////////////

function mainLoop() {
    var now = new Date().getTime();
    var timeElapsed = now - lastUpdate;
    var needsNewSplosions = false;

    if(timeElapsed > 250) {

        lastUpdate = new Date().getTime();
        needsNewSplosions = true;

        // scroll text
        var textSplit = text.split("");
        var textChar = textSplit.shift();
        textSplit.push(textChar);
        text = textSplit.join("");
    }


    // solid blue
    var writePos = 0;
    for (y = 0; y < screenManager.charsHigh; y++) {
        for (x = 0; x < screenManager.charsWide; x++) {
            screenManager.charBuffer[writePos] = Math.random() * 255;
            screenManager.colourBuffer[writePos] = 0x11;
            writePos++;
        }
    }

    // 'splosions
    if(needsNewSplosions) {
        var numberOfSplosions = Math.floor(Math.random()*11);
        splosionsPx = [];

        for(i =0;i<numberOfSplosions;i++) {
            var px = Math.floor(Math.random()*(screenManager.charsHigh*screenManager.charsWide));
            splosionsPx.push(px);
        }
    }

    for(i=0;i<splosionsPx.length;i++) {
        screenManager.colourBuffer[splosionsPx[i]] = 0x1f; 
    }


    // rainbow
    var rainbow = [0x4c,0x64,0xef,0xa2,0x5d]
    y = 8;
    for(var i=0;i<rainbow.length;i++) {
        for(var j=0;j<2;j++) {
            var xCounter = 0;
            var offsetIndex = 0;

            for (x = 0; x < screenManager.charsWide-14; x++) {
                var offset = Math.round(Math.sin((x / 3) + now/80));

                var index = ((y+offset)*screenManager.charsWide)+x;
                screenManager.colourBuffer[index] = rainbow[i];


                xCounter++;
            }

            y++;
        }
    }


    var legCos = Math.round(Math.cos(now/100) - 0.25);
    var legSin = Math.round(Math.sin(now/100) - 0.25);

    var bodyCos = Math.round(Math.cos(now/100) - 0.25);
    var bodySin = Math.round(Math.sin(now/100) - 0.25);

    var headCos = Math.round(Math.cos(now/100) - 0.5);
    var headSin =  Math.round(Math.sin(now/100) - 0.5);

    printLeg(42+legCos,16+legSin);
    printLeg(34+legCos,16+legSin);
    printLeg(26+legCos,16+legSin);
    printLeg(20+legCos,16+legSin);
    printTail(12+bodyCos,11+bodySin);
    printCatBody(19+bodyCos,5+bodySin);
    printCatHead(42+headCos,8+headSin);

    // Shadow an area of the screen, draw an outlined box and write some text in it
    screenManager.processBox(screenManager.charsWide-23, 21, 22, 3, function(charId, colourId) { return [charId, colourId & 0x77]; });
    screenManager.printBox(screenManager.charsWide-23, 21, 22, 3, 0x7f);
    screenManager.print(screenManager.charsWide-22, 22,text, 0x7f);

    // Render the textmode screen to our canvas
    screenManager.presentToScreen();
}

function printCatBody(x,y) {
     screenManager.printBox(x+1, y, 26, 1, 0x00);
     screenManager.printBox(x, y+1, 28, 10, 0x00);
     screenManager.printBox(x+1, y+11, 26, 1, 0x00);


     screenManager.printBox(x+1, y+1, 26, 10, 0x77);


     screenManager.printBox(x+2, y+2, 24, 8, 0xdd);

     var spots = [
        [x+20,y+3],
        [x+12,y+4],
        [x+3,y+3],
        [x+11,y+8],
        [x+16,y+6],
        [x+6,y+6],
        [x+3,y+8],
        [x+12,y+4],
        [x+20,y+8],
     ]

     for(var i=0;i<spots.length;i++) {
        var spotX = spots[i][0];
        var spotY = spots[i][1];

        var index = (spotY*screenManager.charsWide)+spotX;
        screenManager.charBuffer[index] = Math.random() * 255;
        screenManager.colourBuffer[index] = 0xdc;
     }
}

function printTail(x,y) {
    var destination = x+7;
    var tip = x;
    var now = new Date().getTime();
    for (x;x<destination;x++) {
        var offset = -Math.round(Math.sin((x / 3) + now/80));

        for(var i=0;i<4;i++) {
            var dy = y+i;
            var index = ((dy+offset)*screenManager.charsWide)+x;
            if(i >0 && i<3 && x!=tip) screenManager.colourBuffer[index] = 0x77;
            else screenManager.colourBuffer[index] = 0x00;
         }

    }
}

// x,y is the cat's top left ear.
function printCatHead(x,y) {
    printEar(x,y);
    printEar(x+11,y);
    printFace(x-2,y+2);
}

function printLeg(x,y) {
    screenManager.printBox(x, y, 5, 3, 0x00);
    screenManager.printBox(x+1, y, 3, 2, 0x77);        
}

function printFace(x,y) {
    // background and border
    screenManager.printBox(x, y, 19, 5, 0x00);
    screenManager.printBox(x+1, y, 17, 5, 0x77);
    screenManager.printBox(x+1, y+5, 17, 1, 0x00);
    screenManager.printBox(x+2, y+5, 15, 1, 0x77);
    screenManager.printBox(x+1, y+6, 17, 1, 0x00);

    // eyes
    screenManager.printBox(x+4,y+1,1,1,0x00)
    screenManager.printBox(x+12,y+1,1,1,0x00)

    // cheeks
    screenManager.printBox(x+2,y+3,1,1,0xcc)
    screenManager.printBox(x+15,y+3,1,1,0xcc)

    // smile (sort of)
    screenManager.printBox(x+8,y+3,1,1,0x00);
    screenManager.printBox(x+5,y+4,9,1,0x00)

}

function printEar(x,y) {
    screenManager.printBox(x,y,4,1,0x00);
    screenManager.printBox(x-1,y+1,6,1,0x00);
    screenManager.printBox(x+1,y+1,3,1,0x77);
}

new Status(function(){
    $("#canvas").show();
	init();
});
