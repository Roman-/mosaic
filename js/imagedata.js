// functions for imageData pixel manipulation

// returns array [r,g,b]
// imageData: object of type ImageData
// returns [-1, -1, -1] if out of bounds
function getRgbOfPixel(imageData, x, y) {
    if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height)
        return [-1, -1, -1];
    os = (imageData.width * y + x) * 4; // offset
    let d = imageData.data;
    r = (os+0) < d.length ? d[os+0] : -1;
    g = (os+1) < d.length ? d[os+1] : -1;
    b = (os+2) < d.length ? d[os+2] : -1;

    return [r,g,b];
}

// applies gradient method to imageData in-place
// imageData - object of type ImageData
// palette - array of arrays [r,g,b] - colors used for gradient
function portraitGradDither(imageData, palette, ranges) {
    let data = imageData.data;
    // returns array [r,g,b] - color that matches certain tone (0-255)
    // ranges - array of color borders. ranges.length is (number_of_colors - 1)
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

// applies closest-color method to imageData in-place
// imageData - object of type ImageData
// palette - array of arrays [r,g,b] - colors used for gradient
// lightCoeff - if >0, we also look at pixel brightness when looking for closest color
function closestColorDither(imageData, palette, lightCoeff = 0) {
// for a given color \param c, returns its best match from \param palette
// c - color array of [r,g,b]
// palette - array of arrays [r,g,b]
// \returns object {col: color, name: string}
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

// returns distance between 2 colors in [r,g,b] format
// saturation + lightness
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

// draws Glob.img image on canvas using some dither algorithm
// canvas - jquery canvas
// palette - array of colors [[r,g,b], [r,g,b], ...]
// mathod - one of ['grad', 'ordered', 'errorDiffusion', 'atkinson']
// param - for grad, an array of ranges of size (colors-1). Otherwise, a float number [0..5] = ratio
// returns imageData of resulting image
function drawMosaicOnCanvas(canvas, palette, method, param, asMiniature = true) {
    // Draw pixels on canvas -> process them -> increase canvas and draw framed picture
    let newWidth = canvas.width();
    canvas.attr('width', Glob.pixelWidth).attr('height', Glob.pixelHeight);
    let ctx = canvas[0].getContext('2d');
    ctx.drawImage(Glob.img, 0, 0, Glob.img.width, Glob.img.height, 0, 0, Glob.pixelWidth, Glob.pixelHeight);
    let imageData = ctx.getImageData(0, 0, Glob.pixelWidth, Glob.pixelHeight);
    let newImageData = null;
    switch(method) {
        case 'grad':
            newImageData = imageData;
            portraitGradDither(newImageData, palette, param); // in-place
            break;
        case 'ordered':
            newImageData = orderedDither(imageData, palette, param);
            break;
        case 'errorDiffusion':
            newImageData = errorDiffusionDither(imageData, palette, param);
            break;
        case 'atkinson':
            newImageData = atkinsonDither(imageData, palette, param);
            break;
        case 'closestColor':
            newImageData = imageData;
            closestColorDither(newImageData, palette, param); // in-place
            break;
        default:
            break;
    }

    ctx.putImageData(newImageData, 0, 0);

    if (!asMiniature) {
        // reisze canvas and draw pixels with squares
        let stickerSize = newWidth / Glob.pixelWidth;
        let newHeight = stickerSize * Glob.pixelHeight;
        // resize back
        canvas.attr('width', newWidth).attr('height', newHeight);
        var r,g,b,x,y;
        ctx.strokeStyle = Glob.plasticColor;
        ctx.lineWidth = stickerSize/7;
        for (let i = 0; i < newImageData.data.length; i += 4) {
            r = newImageData.data[i];
            g = newImageData.data[i+1];
            b = newImageData.data[i+2];
            x = (i/4) % Glob.pixelWidth;
            y = Math.floor((i/4) / Glob.pixelWidth);
            ctx.fillStyle = "rgb("+r+","+g+","+b+")";
            // draw rect
            ctx.fillRect(x * stickerSize, y * stickerSize, stickerSize, stickerSize);
            if (Glob.plasticColor)
                ctx.strokeRect(x * stickerSize, y * stickerSize, stickerSize, stickerSize);
        }
    }
    return newImageData;
}

// returns dataURL of PNG picture obtained from imagedata
// width, height - picture w and h in pixels. imageData size = width*height*4
// convert ImageData to PNG image ready to be downloaded
function imageDataToPngDataUrl(imageData) {
    let canvas = $("<canvas></canvas>");
    canvas.width(imageData.width).height(imageData.height).attr('width', imageData.width).attr('height', imageData.height);
    canvas[0].getContext('2d').putImageData(imageData, 0, 0);

    return canvas[0].toDataURL("image/png").replace("image/png", "image/octet-stream");
}
