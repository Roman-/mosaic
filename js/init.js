$(document).ready(function() {
    initMenu();
    initLocalStorageVars();

    if (Glob.debugModeOn) {
        console.warn("debug mode ON");
        document.getElementById("bootstrap_css_link").href = "css/bootstrap/darkly.min.css";
    }

    loDropImage();
});

// load locally saved params, such as mosaic size etc
function initLocalStorageVars() {
    Glob.initialCubeWidth = loadLocalInt('initialCubeWidth', Glob.initialCubeWidth);
    Glob.initialCubeHeight = loadLocalInt('initialCubeHeight', Glob.initialCubeHeight);
    Glob.initialCubeDimen = loadLocalInt('initialCubeDimen', Glob.initialCubeDimen);
    Glob.cubeDimen = Glob.initialCubeDimen;
    let defBw = (Glob.initialCubeDimen === 1) ? Glob.defaultBlockWidthPixels : Glob.defaultBlockWidthCubes;
    let defBh = (Glob.initialCubeDimen === 1) ? Glob.defaultBlockHeightPixels : Glob.defaultBlockHeightCubes;
    Glob.blockWidthCubes = loadLocalIntBounded('blockWidthCubes', defBw, 1, 20);
    Glob.blockHeightCubes = loadLocalIntBounded('blockHeightCubes', defBh, 1, 20);
    Glob.pdfDrawLetters = loadLocalBool('pdfDrawLetters', Glob.pdfDrawLetters);
    Glob.bottomToTop = loadLocalBool('bottomToTop', Glob.bottomToTop);
    Glob.pdfBwPrinter = loadLocalBool('pdfBwPrinter', Glob.pdfBwPrinter);
    Glob.debugModeOn = loadLocalBool('mosaicDebugMode', false);
}

function initMenu() {
    $(".closeMenu").attr('data-bs-toggle', 'collapse').attr("data-bs-target", "#navbarNav");
}
