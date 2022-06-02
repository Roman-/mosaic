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

// @returns dataURL of PNG picture obtained from imageData
// width, height - picture w and h in pixels. imageData size = width*height*4
// convert ImageData to PNG image ready to be downloaded
function imageDataToPngDataUrl(imageData) {
    let canvas = $("<canvas></canvas>");
    canvas.width(imageData.width).height(imageData.height).attr('width', imageData.width).attr('height', imageData.height);
    canvas[0].getContext('2d').putImageData(imageData, 0, 0);

    return canvas[0].toDataURL("image/png").replace("image/png", "image/octet-stream");
}
