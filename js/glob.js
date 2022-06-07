// glob.js - global variables and parameters

Glob = function () {}
Glob.hideWebsiteInfo = false; // if true, website info in PDF file (https://bse/mosaic) will be hidden
Glob.pixelWidth = null;  // miniature width in pixels
Glob.pixelHeight = null; // miniature height in pixels

Glob.cubeDimen = null; // using 3x3x3 cubes
Glob.totalCubes = null; // total amount of cubes we can use
Glob.img = null; // <img> element with dataURI. Has .height and .width
Glob.canvas = null; // jquery canvas that we use to draw our image on
Glob.imageData = null; // ImageData object which we'll eventually make PDF split of
Glob.imgFileName = ""; // uploaded file name
Glob.canvasBlur = null; // blur object (see ditheralgs.js)
Glob.maxCubesForMiniature = 1400; // heuristics for maximum cubes (pixels/9) that a miniature file can have

Glob.bottomToTop = true; // output PDF bottom-to-top
Glob.pdfDrawLetters = true; // draw color-notation letters inside squares
Glob.pdfBwPrinter = false; // black-and-white printer? If true, will draw white squares instead of colored

Glob.initialCubeDimen = 3; // 1 for pixart, 3 for 3x3 cubes
Glob.initialCubeWidth = 20;
Glob.initialCubeHeight = 30;
Glob.maxCubesSize = 100; // max is 100x100

// PDF-specific
Glob.blockWidthCubes = null;
Glob.blockHeightCubes = null;
Glob.pdfProgress = null; // 0 to 1 - is PDF ready

Glob.defaultBlockWidthCubes = 3;
Glob.defaultBlockHeightCubes = 4;
Glob.defaultBlockWidthPixels = 6;
Glob.defaultBlockHeightPixels = 8;

Glob.plasticColor = '#eee'; // color of cube plastic (border around stickers)

// @returns array of chooseSet objects.
// chooseSet object represents a method with its parameters, that will be used to mosaic from the initial picture.
// Each chooseSet generates N pictures on the first choosing step, when user crops the picture. N is number
// of options specified for this method in chooseSet.opts
Glob.chooseSets = function () {
    let chooseSets = [
        // add a few gradients. The opts are purely heuristical :(
        {
            name: 'Portrait',
            method: Methods.GRADIENT,
            palette: getGradPalette(),
            opts: initialRangePopulation(getGradPalette(), [0.55, 0.65, 0.75], [0.35, 0.45]),
            displayName: 'Gradient'
        },
        // errorDiffusion with full palette: one is super dithered and another one more smooth
        {
            name: 'errorDiffusion',
            method: Methods.ERROR_DIFFUSION,
            palette: getFullPalette(),
            opts: [1.9, 6.0],
            displayName: 'ED method, all colors'
        },
    ];

    // for each color that is marked "try ED", generate a separate errorDiffusion thing WITHOUT this color
    let edPals = getAllEdDitherPalettes();
    let edPalIndex = 1;
    edPals.forEach(function (pal) {
        chooseSets.push({
            name: 'errorDiffusionSpecial',
            method: Methods.ERROR_DIFFUSION,
            palette: pal,
            opts: [1.9, 6.0],
            displayName: ('ED method, colorset ' + (edPalIndex++))
        });
    });
    // add ordered dithering
    chooseSets.push({
        name: 'Ordered',
        method: Methods.ORDERED,
        palette: getFullPalette(),
        opts: [-15, -10, -5, 0.0, 1.5],
        displayName: 'Ordered dithering'
    });
    // add 'closest color' as an option. On the layout however, it doesn't look different from the last "ordered dithering"
    chooseSets.push({
        name: 'Closest',
        method: Methods.CLOSEST_COLOR,
        palette: getFullPalette(),
        opts: [0],
        displayName: 'Closest color'
    });
    return chooseSets;
}
