// based on histogram, returns
// \prarm slope: 0 means equal amount of all colors, 5 means last color appear 5 times more often
// \param expFactor: if >0, distribution looks more exponential (significantly more bright tones than dark) rather than linear
// \param concave - if true, color distribution will look like bowl
function makeColorDistribution(numColors, slope = 5, expFactor = 0, concave = false) {
    let colorsDistr = [];
    for (let i = 0; i < numColors; ++i) {
        let x = lerp(0, 1, numColors-1, slope, i) * (1+(i/numColors*expFactor));
        colorsDistr.push(x);
    }

    if (concave) {
        let mid = colorsDistr.length/2 - 0.5;
        for (let i = 0; i < Math.ceil(mid); ++i) {
            leftIndex = Math.floor(mid-i-0.1);
            rightIndex = Math.ceil(mid+i+0.1);
            colorsDistr[leftIndex] = colorsDistr[rightIndex];

            // bowl shape => make it a little bit more exponential
            colorsDistr[leftIndex] *= (1+(i/numColors*expFactor))
            colorsDistr[rightIndex] *= (1+(i/numColors*expFactor))
    }   }

    // normalize
    let sum = 0;
    colorsDistr.forEach(function (x) {sum += x;});
    for (let i = 0; i < numColors; ++i) {
        colorsDistr[i] /= sum;
    }

    return colorsDistr;
}

// array of color distribution (N colors) -> array of ranges (N-1 ranges)
function colorDistrToRanges(colorsDistr) {
    let ranges = [];
    let rangeIndex = 0;
    let bucket = 0; // sum up pixels in bucket
    for (let tone = 0; tone < 255; ++tone) {
        bucket += Glob.hist[tone];
        if (bucket >= colorsDistr[rangeIndex]) {
            ranges.push(tone);
            bucket = 0;
            rangeIndex++;
        }
    }
    // fill the rest of the ranges for which no colors are left
    let numFakes = (colorsDistr.length - 1 - ranges.length);
    for (let i = 0; i < numFakes; ++i)
        ranges.push(255);
    return ranges;
}

// showDistrHist over canvas (draw new thing and display over canvas)
function showDistrHist(srcCanvas, distr) {
    // console.log("distr = ", distr);
    let plotSize = 190
    var canvas = $("<canvas></canvas>")
        .css('position', 'absolute')
        .css('z-index', '999')
        .css('left', srcCanvas.offset().left)
        .css('top', srcCanvas.offset().top)
        .attr('width', plotSize).attr('height', plotSize)
        .width(plotSize)
        .height(plotSize)
        .css('border', '2px solid black')
        .on('click', function () {
            canvas.hide();
        });

    // draw plot
    let ctx = canvas[0].getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    const step = plotSize / distr.length;
    for (let i = 0; i < distr.length; ++i) {
        let x = i*step + (step/2);
        let y = plotSize*(1-distr[i]);
        if (x != 0)
            ctx.lineTo(x, y);
        ctx.moveTo(x, y);

        // circle with color TODO here we just guess that it's a gradientPalette
        ctx.fillStyle = "black";
        ctx.fillRect(x-7, y-7, 14, 14);
        ctx.fillStyle = "rgb(" + gradientPalette()[i].join(',') + ")";
        ctx.fillRect(x-5, y-5, 10, 10);
    }
    ctx.stroke();
    srcCanvas.parent().append(canvas);
}

// useless legacy function. Returns how many of each pixels do we have
function howManyOfEach() {
    let count = { "Blue": 0, "Green":0, "Red":0, "Orange":0, "Yellow":0, "White":0 };
    const totalPixels = Glob.pixelWidth * Glob.pixelHeight;
    for (let i = 0; i < Glob.imageData.data.length; i += 4) {
        r = Glob.imageData.data[i];
        g = Glob.imageData.data[i+1];
        b = Glob.imageData.data[i+2];

        let prop = colorNameByRgb(r + ";" + g + ";" + b);
        if (!count.hasOwnProperty(prop))
            count[prop] = 1/totalPixels;
        else
            count[prop] += 1/totalPixels;
    }
    let s =
        count["Blue"] + "\n"
        + count["Red"] + "\n"
        + count["Orange"] + "\n"
        + count["Yellow"] + "\n"
        + count["White"] + "\n";
    console.log(s);
}
