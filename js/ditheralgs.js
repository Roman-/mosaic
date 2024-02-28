// ditheralgs.js - image approximation methods and dithering algorithms from https://danielepiccone.github.io/ditherjs/
const Methods = {
    GRADIENT         : 1,
    CLOSEST_COLOR    : 2,
    ORDERED          : 3,
    ERROR_DIFFUSION  : 4,
    ATKINSON         : 5,
};

// Applies gradient approximation method to @param imageData in-place
// Gradient method works best for close-up faces as it conveys the shadows/shapes rather than the original color.
// @param palette - array of arrays [r,g,b] - colors used for gradient, sorted darker-to-brighter
// @param imageData - object of type Imagedata {data, width, height}
// @param ranges - array of color borders. ranges.length is (number_of_colors - 1).
// Gradient method treats image as grayscale image and replaces colors according to palette:
//     colors with tone [0..ranges[0]] are replaced with palette[0],
//     colors with tone [ranges[0]..ranges[1]] are replaced with palette[1],
//     ...
//     colors with tone [ranges[N-1] .. 255] are replaced with palette[N],
function gradientMethod(imageData, palette, ranges) {
    let data = imageData.data;
    // @returns array [r,g,b] - color that matches certain tone (0-255)
    function matchGradientColor(tone, ranges) {
        // make sure ranges match colors
        if (ranges.length >= palette.length) {
            console.error("ranges/colors length mismatch:", ranges, palette);
            exit();
        }

        for (let i = 0; i < ranges.length; i++) {
            if (tone < ranges[i])
                return palette[i];
        }

        return palette[palette.length - 1];
    }

    for (var i = 0; i < data.length; i+=4) {
        let r = data[i];
        let g = data[i+1];
        let b = data[i+2];

        // to grayscale
        let tone = (r+g+b)/3;

        let c = matchGradientColor(tone, ranges);

        data[i] = c[0];
        data[i+1] = c[1];
        data[i+2] = c[2];
        data[i+3] = 255;
    }
}

// Applies closest-color method to @param imageData in-place
// Closest color method simply replaces the color of each pixel with the closest color from the palette
// @param imageData - object of type Imagedata {data, width, height}
// @param palette - array of arrays [r,g,b] - colors used for gradient
// @param lightCoeff - if >0, we also look at pixel brightness when looking for closest color
function closestColorMethod(imageData, palette, lightCoeff = 0) {
// For a given color @param c, @returns its best match from @param palette
// @param c - color array of [r,g,b]
// @param palette - array of arrays [r,g,b]
// @returns color in [r,g,b] format
function bestMatchFor(c) {
    let bestMatch = palette[0]; // palColor
    let bestDistance = Number.MAX_SAFE_INTEGER;
    palette.forEach(function (p) {
        let d = colorDistanceSL(c, p);
        if (d < bestDistance) {
            bestDistance = d;
            bestMatch = p;
        }
    });
    return bestMatch;
}

// @returns saturation/lightness-distance between 2 colors (arr1 and arr2 in [r,g,b]) format
function colorDistanceSL(arr1, arr2) {
    let c1 = jQuery.Color(arr1);
    let c2 = jQuery.Color(arr2);
    let r = Math.abs(c1.red() - c2.red()) / 255;
    let g = Math.abs(c1.green() - c2.green()) / 255;
    let b = Math.abs(c1.blue() - c2.blue()) / 255;
    let l = Math.abs(c1.lightness() - c2.lightness()) * lightCoeff;
    return r+g+b+l;
}
    let data = imageData.data;

    for (var i = 0; i < data.length; i+=4) {
        let r = data[i];
        let g = data[i+1];
        let b = data[i+2];

        let c = bestMatchFor([r,g,b]);

        data[i] = c[0];
        data[i+1] = c[1];
        data[i+2] = c[2];
        data[i+3] = 255;
    }
}

// @returns dithered image as uint8data array
// Ordered dither is most similar to the closest-color tactic, as it tends to only use colors,
// e.g. for the face it usually won't use any colors of the Rubik's Cube other than orange
// @param ratio - a value from 0.0 to 5.0. Smaller values give smoother (less grained) result
// @param imageData - object of type Imagedata {data, width, height}
function orderedDither(imageData, palette, ratio) {
    var d = new Uint8ClampedArray(imageData.data);
    var w = imageData.width; var h = imageData.height;
    var m = [
        [  1,  9,  3, 11 ],
        [ 13,  5, 15,  7 ],
        [  4, 12,  2, 10 ],
        [ 16,  8, 14,  6 ]
    ];

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

            color = [d[r],d[g],d[b]];
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

// @returns dithered image as uint8data array
// Error diffusion tends to make picture look good from far away by mixing
// different colors from the palette in a way that being blurred (mixed) they closely
// represent the original color
// @param ratioDenom: 0 = totally grained, [3..5] = quite smooth
// @param imageData - object of type Imagedata {data, width, height}
function errorDiffusionDither(imageData, palette, ratioDenom = 3) {
    var d = new Uint8ClampedArray(imageData.data);
    var out = new Uint8ClampedArray(imageData.data);
    var w = imageData.width; var h = imageData.height;
    let step = 1; // greater values combine multiple pixels in one, visually lowering the resolution
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

            color = [d[r],d[g],d[b]];
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
    return new ImageData(out, w);
}

// @returns dithered image as uint8data array
// Atkinson dither is visually very similar to error diffusion, but instead of making
// a chess pattern it produces stitches-like pattern
// @param ratioDenom: 0 = totally grained, [3..5] = quite smooth
// @param imageData - object of type Imagedata {data, width, height}
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

            color = [d[r],d[g],d[b]];
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
}

/// @returns array [r,g,b] - color from palette that's closest to @param color
/// @param palette - array of arrays [[r, g, b], [r, g, b], ...]
function approximateColor(color, palette) {
    var findIndex = function(fun, arg, list, min) {
        if (list.length === 2) {
            if (fun(arg,min) <= fun(arg,list[1])) {
                return min;
            } else {
                return list[1];
            }
        } else {
            var tl = list.slice(1);
            if (fun(arg,min) > fun(arg,list[1])) {
                min = list[1];
            }
            return findIndex(fun,arg,tl,min);
        }
    };
    return findIndex(colorDistance, color, palette, palette[0]);
}

/// @returns euclidian distance between colors
/// @param a, b - array [r, g, b]
function colorDistance(a, b) {
    return Math.sqrt(
        Math.pow( ((a[0]) - (b[0])),2 ) +
        Math.pow( ((a[1]) - (b[1])),2 ) +
        Math.pow( ((a[2]) - (b[2])),2 )
    );
}

