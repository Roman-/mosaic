// functions for imageData pixel manipulation

// @returns array [r,g,b] - color of pixel with coordinates (x, y)
// @param imageData - object of type Imagedata {data, width, height}
// @returns [-1, -1, -1] if (x, y) is out of bounds
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

// draws Glob.img image on canvas using some dither algorithm
// @param canvas - jquery canvas
// @param palette - array of colors [[r,g,b], [r,g,b], ...]
// @param mathod - one of Methods constants
// @param param - for grad, an array of ranges of size (colors-1). Otherwise, a float number [0..5] = ratio
// @returns imageData of resulting image
function drawMosaicOnCanvas(canvas, palette, method, param, asMiniature = true) {
    // Draw pixels on canvas -> process them -> increase canvas and draw framed picture
    let newWidth = canvas.width();
    canvas.attr('width', Glob.pixelWidth).attr('height', Glob.pixelHeight);
    let ctx = canvas[0].getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(Glob.img, 0, 0, Glob.img.width, Glob.img.height, 0, 0, Glob.pixelWidth, Glob.pixelHeight);
    let imageData = ctx.getImageData(0, 0, Glob.pixelWidth, Glob.pixelHeight);
    let newImageData = null;
    switch(method) {
        case Methods.GRADIENT:
            newImageData = imageData;
            gradientMethod(newImageData, palette, param);
            break;
        case Methods.ORDERED:
            newImageData = orderedDither(imageData, palette, param);
            break;
        case Methods.ERROR_DIFFUSION:
            newImageData = errorDiffusionDither(imageData, palette, param);
            break;
        case Methods.ATKINSON:
            newImageData = atkinsonDither(imageData, palette, param);
            break;
        case Methods.CLOSEST_COLOR:
            newImageData = imageData;
            closestColorMethod(newImageData, palette, param);
            break;
        default:
            break;
    }

    if (asMiniature) {
        ctx.putImageData(newImageData, 0, 0);
    } else {
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
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            // draw rect
            ctx.fillRect(x * stickerSize, y * stickerSize, stickerSize, stickerSize);
            if (Glob.plasticColor)
                ctx.strokeRect(x * stickerSize, y * stickerSize, stickerSize, stickerSize);
        }
    }
    return newImageData;
}

// convert ImageData to a PNG blob ready to be downloaded
// asynchronous, because canvas.toBlob is
// @param cb - called with the resulting Blob
function imageDataToPngBlob(imageData, cb) {
    let canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d').putImageData(imageData, 0, 0);

    if (canvas.toBlob)
        canvas.toBlob(cb, "image/png");
    else
        cb(dataUrlToBlob(canvas.toDataURL("image/png")));
}

// @returns true if img looks like a miniature we've produced ourselves, judging by the picture
// alone: small, and made of a handful of distinct colors (a photo has thousands of them).
// Needed because the filename hint isn't reliable - mobile browsers rename downloaded files.
function looksLikeMiniature(img) {
    const MAX_SIDE = 600;   // 200 cubes per side, way above anything realistic
    const MAX_COLORS = 24;  // sticker palette is 6-7 colors; leave room for hand-editing slop

    if (img.width > MAX_SIDE || img.height > MAX_SIDE)
        return false;

    let canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    let data;
    try { data = ctx.getImageData(0, 0, img.width, img.height).data; }
    catch (e) { return false; } // tainted canvas - can't tell, treat it as a normal picture

    let colors = new Set();
    for (let i = 0; i < data.length; i += 4) {
        colors.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
        if (colors.size > MAX_COLORS)
            return false;
    }
    return true;
}
