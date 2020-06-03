// glob.js - global variables and parameters

Glob = function () {}
Glob.hideWebsiteInfo = false; // if true, website info in PDF file (https://bse/mosaic) will be hidden
Glob.pixelWidth = null;  // miniature width in pixels
Glob.pixelHeight = null; // miniature height in pixels

Glob.cubeDimen = null; // using 3x3x3 cubes
Glob.totalCubes = null; // total amount of cubes we can use
Glob.img = null; // <img> element with dataURI. Has .height and .width
Glob.canvas = null; // jquery canvas that we use to draw our image on
Glob.totalGradSteps = 3; // number of steps for grad method selection
Glob.imageData = null; // ImageData object which we'll eventually make PDF split of
Glob.imgFileName = ""; // uploaded file name
Glob.maxFileSizeMb = 8.0; // we don't want to give user the experience of waiting for large image to be processed
Glob.canvasBlur = null; // blur object (see ditheralgs.js)
Glob.maxCubesForMiniature = 1400; // heuristics for maximum cubes (pixels/9) that a miniature file can have

Glob.pdfDrawLetters = false; // draw color-notation letters inside squares
Glob.bottomToTop = true; // output PDF bottom-to-top

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

// returns array of chooseSet objects.
// chooseSet object represents a method with its parameters, that will be used to mosaic from the initial picture.
// Each chooseSet generates N pictures on the first choosing step, when user crops the picture. N is number
// of options specified for this method in chooseSet.opts
Glob.chooseSets = function () {
    let chooseSets = [
        // add a few gradients. The opts are purely heuristical :(
        {
            name: 'Portrait',
            method: 'grad',
            palette: getGradPalette(),
            opts: initialRangePopulation(getGradPalette(), [0.55, 0.65, 0.75], [0.35, 0.45])
        },
        // errorDiffusion with full palette: one is super dithered and another one more smooth
        {
            name: 'errorDiffusion',
            method: 'errorDiffusion',
            palette: getFullPalette(),
            opts: [1.9, 6.0]
        },
    ];

    // for each color that is marked "try ED", generate a separate errorDiffusion thing WITHOUT this color
    let edPals = getAllDitherPalettes();
    edPals.forEach(function (pal) {
        chooseSets.push({
            name: 'errorDiffusionSpecial',
            method: 'errorDiffusion',
            palette: pal,
            opts: [1.9, 6.0]
        });
    });
    // add ordered dithering
    chooseSets.push({
        name: 'Ordered',
        method: 'ordered',
        palette: getFullPalette(),
        opts: [0.0, 1.3]
    });
    // add 'closest color' as an option. On the layout however, it doesn't look different from the last "ordered dithering"
    chooseSets.push({
        name: 'Closest',
        method: 'closestColor',
        palette: getFullPalette(),
        opts: [0]
    });
    return chooseSets;
}
