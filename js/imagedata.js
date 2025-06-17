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
function drawMosaicOnCanvas(canvas, palette, method, param, asMiniature = true, updateHistogram = false, histogramCanvas = null) {
    // Draw pixels on canvas -> process them -> increase canvas and draw framed picture
    let newWidth = canvas.width();
    canvas.attr('width', Glob.pixelWidth).attr('height', Glob.pixelHeight);
    let ctx = canvas[0].getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(Glob.img, 0, 0, Glob.img.width, Glob.img.height, 0, 0, Glob.pixelWidth, Glob.pixelHeight);
    let imageData = ctx.getImageData(0, 0, Glob.pixelWidth, Glob.pixelHeight);
    if (updateHistogram) {
        let hist = brightnessHistogram(imageData);
        let ranges = (method === Methods.GRADIENT && Array.isArray(param)) ? param : null;
        drawHistogram(hist, histogramCanvas, palette, ranges, -1);
        Glob.lastHistogram = hist;
        Glob.lastRanges = ranges;
        Glob.lastPalette = palette;
    }
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

// @returns dataURL of PNG picture obtained from imageData
// width, height - picture w and h in pixels. imageData size = width*height*4
// convert ImageData to PNG image ready to be downloaded
function imageDataToPngDataUrl(imageData) {
    let canvas = $("<canvas></canvas>");
    canvas.width(imageData.width).height(imageData.height).attr('width', imageData.width).attr('height', imageData.height);
    canvas[0].getContext('2d').putImageData(imageData, 0, 0);

    return canvas[0].toDataURL("image/png").replace("image/png", "image/octet-stream");
}

// create brightness histogram (256 values) from ImageData
// @param imageData - ImageData object
// @returns array[256] with pixel counts
function brightnessHistogram(imageData) {
    let hist = new Array(256).fill(0);
    let d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
        let tone = Math.round((d[i] + d[i + 1] + d[i + 2]) / 3);
        hist[tone]++;
    }
    return hist;
}

// draw brightness histogram on a canvas
// histogram - array[256] of counts
// canvas - jquery canvas element
function drawHistogram(histogram, canvas, palette = null, ranges = null, highlight = -1) {
    if (!canvas || canvas.length === 0) return;
    let cv = canvas[0];
    let ctx = cv.getContext('2d');
    let w = cv.width;
    let h = cv.height;
    ctx.clearRect(0, 0, w, h);

    let totalPixels = 0;
    for (let v of histogram) totalPixels += v;

    if (palette && Array.isArray(ranges)) {
        let start = 0;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (let i = 0; i < palette.length; ++i) {
            let end = (i < ranges.length) ? ranges[i] : 256;
            ctx.fillStyle = `rgba(${palette[i][0]},${palette[i][1]},${palette[i][2]},0.5)`;
            ctx.fillRect(start * w / 256, 0, (end - start) * w / 256, h);
            if (totalPixels > 0) {
                let sum = 0;
                for (let j = start; j < end; ++j) sum += histogram[j];
                let percent = ((sum / totalPixels) * 100).toFixed(1);
                let x = (start + end) * w / 512;
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#fff';
                ctx.fillStyle = 'gray';
                ctx.strokeText(percent, x, 0);
                ctx.fillText(percent, x, 0);
            }
            start = end;
        }
    }

    let max = 0;
    for (let v of histogram) if (v > max) max = v;
    if (max === 0) return;
    ctx.fillStyle = '#444';
    for (let i = 0; i < 256; ++i) {
        let barH = histogram[i] / max * h;
        ctx.fillRect(i * w / 256, h - barH, w / 256, barH);
    }

    if (highlight >= 0 && ranges && highlight < ranges.length) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        let x = ranges[highlight] * w / 256;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
}
