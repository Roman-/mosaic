// ditheralgs.js - dithering algorithms from https://danielepiccone.github.io/ditherjs/

// returns new uint8data array
// ratio values: 0..5
// ImageData objecg (w, height)
function orderedDither(imageData, palette, ratio) {
    var d = new Uint8ClampedArray(imageData.data);
    var w = imageData.width; var h = imageData.height;
    var m = new Array(
        [  1,  9,  3, 11 ],
        [ 13,  5, 15,  7 ],
        [  4, 12,  2, 10 ],
        [ 16,  8, 14,  6 ]
    );

    var r, g, b, a, i, color, approx, tr, tg, tb;

    for (var y=0;y<h;y ++) {
        for (var x=0;x<w;x ++) {
            i = (4*x) + (4*y*w);

            // Define bytes
            r = i;
            g = i+1;
            b = i+2;
            a = i+3;

            d[r] += m[x%4][y%4] * ratio;
            d[g] += m[x%4][y%4] * ratio;
            d[b] += m[x%4][y%4] * ratio;

            color = new Array(d[r],d[g],d[b]);
            approx = approximateColor(color, palette);
            tr = approx[0];
            tg = approx[1];
            tb = approx[2];

            // Draw a pixel
            d[i] = tr;
            d[i+1] = tg;
            d[i+2] = tb;
        }
    }
    return new ImageData(d, w);
}

// ratioDenom values: 0..5
function errorDiffusionDither(imageData, palette, ratioDenom = 3) {
    var d = new Uint8ClampedArray(imageData.data);
    var out = new Uint8ClampedArray(imageData.data);
    var w = imageData.width; var h = imageData.height;
    let step = 1;
    let ratioDenomScaled = 1.5 + (ratioDenom / 5 * (15-1.5));
    // default ratio = 1/16;
    var ratio = 1/(ratioDenomScaled*4);

    var $i = function(x,y) {
        return (4*x) + (4*y*w);
    };

    var r, g, b, a, q, i, color, approx, tr, tg, tb, dx, dy, di;

    for (y=0;y<h;y += step) {
        for (x=0;x<w;x += step) {
            i = (4*x) + (4*y*w);

            // Define bytes
            r = i;
            g = i+1;
            b = i+2;
            a = i+3;

            color = new Array(d[r],d[g],d[b]);
            approx = this.approximateColor(color, palette);

            q = [];
            q[r] = d[r] - approx[0];
            q[g] = d[g] - approx[1];
            q[b] = d[b] - approx[2];

            // Diffuse the error
            d[$i(x+step,y)] =  d[$i(x+step,y)] + 7 * ratio * q[r];
            d[$i(x-step,y+1)] =  d[$i(x-1,y+step)] + 3 * ratio * q[r];
            d[$i(x,y+step)] =  d[$i(x,y+step)] + 5 * ratio * q[r];
            d[$i(x+step,y+step)] =  d[$i(x+1,y+step)] + 1 * ratio * q[r];

            d[$i(x+step,y)+1] =  d[$i(x+step,y)+1] + 7 * ratio * q[g];
            d[$i(x-step,y+step)+1] =  d[$i(x-step,y+step)+1] + 3 * ratio * q[g];
            d[$i(x,y+step)+1] =  d[$i(x,y+step)+1] + 5 * ratio * q[g];
            d[$i(x+step,y+step)+1] =  d[$i(x+step,y+step)+1] + 1 * ratio * q[g];

            d[$i(x+step,y)+2] =  d[$i(x+step,y)+2] + 7 * ratio * q[b];
            d[$i(x-step,y+step)+2] =  d[$i(x-step,y+step)+2] + 3 * ratio * q[b];
            d[$i(x,y+step)+2] =  d[$i(x,y+step)+2] + 5 * ratio * q[b];
            d[$i(x+step,y+step)+2] =  d[$i(x+step,y+step)+2] + 1 * ratio * q[b];

            // Color
            tr = approx[0];
            tg = approx[1];
            tb = approx[2];

            // Draw a block
            for (dx=0;dx<step;dx++){
                for (dy=0;dy<step;dy++){
                    di = i + (4 * dx) + (4 * w * dy);

                    // Draw pixel
                    out[di] = tr;
                    out[di+1] = tg;
                    out[di+2] = tb;

                }
            }
        }
    }
    // return out;
    return new ImageData(out, w);
}

// atkinsonDither isn't used in this software because results are very similar to errorDiffusion method
// ratioDenom vals: [0..5]
function atkinsonDither(imageData, palette, ratioDenom) {
    var d = new Uint8ClampedArray(imageData.data);
    var out = new Uint8ClampedArray(imageData.data);
    var w = imageData.width; var h = imageData.height;
    let step = 1;
    let ratioDenomScaled = 1.5 + (ratioDenom / 5 * (9-1.5))
    var ratio = 1/(ratioDenomScaled*8/3); // default is 1/8

    var $i = function(x,y) {
        return (4*x) + (4*y*w);
    };

    var r, g, b, a, q, i, color, approx, tr, tg, tb, dx, dy, di;

    for (var y=0;y<h;y += step) {
        for (var x=0;x<w;x += step) {
            i = (4*x) + (4*y*w);

            // Define bytes
            r = i;
            g = i+1;
            b = i+2;
            a = i+3;

            color = new Array(d[r],d[g],d[b]);
            approx = this.approximateColor(color, palette);

            q = [];
            q[r] = d[r] - approx[0];
            q[g] = d[g] - approx[1];
            q[b] = d[b] - approx[2];

            // Diffuse the error for three colors
            d[$i(x+step,y) + 0] += ratio * q[r];
            d[$i(x-step,y+step) + 0] += ratio * q[r];
            d[$i(x,y+step) + 0] += ratio * q[r];
            d[$i(x+step,y+step) + 0] += ratio * q[r];
            d[$i(x+(2*step),y) + 0] += ratio * q[r];
            d[$i(x,y+(2*step)) + 0] += ratio * q[r];

            d[$i(x+step,y) + 1] += ratio * q[g];
            d[$i(x-step,y+step) + 1] += ratio * q[g];
            d[$i(x,y+step) + 1] += ratio * q[g];
            d[$i(x+step,y+step) + 1] += ratio * q[g];
            d[$i(x+(2*step),y) + 1] += ratio * q[g];
            d[$i(x,y+(2*step)) + 1] += ratio * q[g];

            d[$i(x+step,y) + 2] += ratio * q[b];
            d[$i(x-step,y+step) + 2] += ratio * q[b];
            d[$i(x,y+step) + 2] += ratio * q[b];
            d[$i(x+step,y+step) + 2] += ratio * q[b];
            d[$i(x+(2*step),y) + 2] += ratio * q[b];
            d[$i(x,y+(2*step)) + 2] += ratio * q[b];

            tr = approx[0];
            tg = approx[1];
            tb = approx[2];

            // Draw a block
            for (dx=0;dx<step;dx++){
                for (dy=0;dy<step;dy++){
                    di = i + (4 * dx) + (4 * w * dy);

                    // Draw pixel
                    out[di] = tr;
                    out[di+1] = tg;
                    out[di+2] = tb;

                }
            }
        }
    }
    return new ImageData(out, w);
    // return out;
}

function approximateColor(color, palette) {
    var findIndex = function(fun, arg, list, min) {
        if (list.length == 2) {
            if (fun(arg,min) <= fun(arg,list[1])) {
                return min;
            }else {
                return list[1];
            }
        } else {
            var tl = list.slice(1);
            if (fun(arg,min) <= fun(arg,list[1])) {
                min = min;
            } else {
                min = list[1];
            }
            return findIndex(fun,arg,tl,min);
        }
    };
    var foundColor = findIndex(colorDistance, color, palette, palette[0]);
    return foundColor;
};

var colorDistance = function colorDistance(a, b) {
    return Math.sqrt(
        Math.pow( ((a[0]) - (b[0])),2 ) +
        Math.pow( ((a[1]) - (b[1])),2 ) +
        Math.pow( ((a[2]) - (b[2])),2 )
    );
};

/* does Gaussain blur on image
 * usage exmaple:
    var canvasBlur = new CanvasFastBlur({ blur: 6 });
	var blur = document.querySelector("#blur_val").value;
	canvasBlur.gBlur(blur);
	canvasBlur.recoverCanvas();
*/
class CanvasFastBlur {
    constructor(options) {
        const defaultRadius = 4;
        if (options && options.blur)
            this.blurRadius = options.blur || defaultRadius;
        else
            this.blurRadius = defaultRadius;
    }
    initCanvas(canvas){
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        let w = canvas.width;
        let h = canvas.height;
        this.canvas_off = document.createElement("canvas");
        this.ctx_off = this.canvas_off.getContext("2d");
        this.canvas_off.width = w;
        this.canvas_off.height = h;
        this.ctx_off.drawImage(canvas, 0, 0);
    }
    recoverCanvas(){
        let w = this.canvas_off.width;
        let h = this.canvas_off.height;
        this.canvas.width = w;
        this.canvas.height = h;
        this.ctx.drawImage(this.canvas_off,0,0);
    }
    gBlur(blur = 4) {
        blur = blur || this.blurRadius;
        let canvas = this.canvas;
        let ctx = this.ctx;

        let sum = 0;
        let delta = 5;
        let alpha_left = 1 / (2 * Math.PI * delta * delta);
        let step = blur < 3 ? 1 : 2;
        for (let y = -blur; y <= blur; y += step) {
            for (let x = -blur; x <= blur; x += step) {
                let weight = alpha_left * Math.exp(-(x * x + y * y) / (2 * delta * delta));
                sum += weight;
            }
        }
        let count = 0;
        for (let y = -blur; y <= blur; y += step) {
            for (let x = -blur; x <= blur; x += step) {
                count++;
                ctx.globalAlpha = alpha_left * Math.exp(-(x * x + y * y) / (2 * delta * delta)) / sum * blur;
                ctx.drawImage(canvas,x,y);
            }
        }
        ctx.globalAlpha = 1;
    }
    mBlur(distance){
        distance = distance<0?0:distance;
        console.log(distance);
        let w = this.canvas.width;
        let h = this.canvas.height;
        this.canvas.width = w;
        this.canvas.height = h;
        let ctx = this.ctx;
        ctx.clearRect(0,0,w,h);
        let canvas_off = this.canvas_off;

        for(let n=0;n<5;n+=0.1){
            ctx.globalAlpha = 1/(2*n+1);
            let scale = distance/5*n;
            ctx.transform(1+scale,0,0,1+scale,0,0);
            ctx.drawImage(canvas_off, 0, 0);
        }
        ctx.globalAlpha = 1;
        if(distance<0.01){
            window.requestAnimationFrame(()=>{
                this.mBlur(distance+0.0005);
            });
        }
    }
}
