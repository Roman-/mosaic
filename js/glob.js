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
Glob.maxCubesForMiniature = 2500; // heuristics for maximum cubes (pixels/9) that a miniature file can have

Glob.bottomToTop = true; // output PDF bottom-to-top
Glob.pdfDrawLetters = true; // draw color-notation letters inside squares
Glob.pdfBwPrinter = false; // black-and-white printer? If true, will draw white squares instead of colored

Glob.initialCubeDimen = 3; // 1 for pixart, 3 for 3x3 cubes
Glob.initialCubeWidth = 20;
Glob.initialCubeHeight = 30;
Glob.maxCubesSize = 999; // it could be 1 pixel, remember?

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
        {
            name: 'edWithDifferentDarkest',
            method: Methods.ERROR_DIFFUSION,
            palette: getFullPalette(),
            opts: [0.4, 1.0, 1.8, 2.9, 3.8, 5.7],
            displayName: 'Diffusion'
        },
        {
            name: 'Ordered',
            method: Methods.ORDERED,
            palette: getFullPalette(),
            opts: [-3.5, -1.5, 0.0, 2.0, 4.0, 6.2],
            displayName: 'Dithering'
        }
    ];
    // Atkinson dithering will be added as an option to choose from on the final dithering stage
/*
    chooseSets.push({
        name: 'Atkinson',
        method: Methods.ATKINSON,
        palette: getFullPalette(),
        opts: [0.8, 2.2, 3.5],
        displayName: 'Atkinson'
    });
*/

    let differentDarkPals = getPalettesReplacingDarkest();
    differentDarkPals.forEach(function (pal) {
    chooseSets.push({
            name: 'Ordered',
            method: Methods.ORDERED,
            palette: pal["colors"],
            opts: [-11, -6],
            displayName: 'Dithering ' + pal["name"]
        })
    });
    // for each color that is marked "try ED", generate a separate errorDiffusion thing WITHOUT this color
    let edPals = getPalettesExcludingColors();
    edPals.forEach(function (pal) {
        chooseSets.push({
            name: 'errorDiffusionSpecial',
            method: Methods.ERROR_DIFFUSION,
            palette: pal["colors"],
            opts: [1.9, 3.5, 6.2],
            displayName: ('Diffusion ' + pal["name"])
        });
    });
    // The 'closest color' option doesn't look different from the "ordered dithering", so don't display it
    /*
        chooseSets.push({
            name: 'Closest',
            method: Methods.CLOSEST_COLOR,
            palette: getFullPalette(),
            opts: [0],
            displayName: 'Closest color'
        });
    */
    return chooseSets;
}
