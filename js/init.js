$(document).ready(function() {
    initMenu();
    initLocalStorageVars();

    loDropImage();
    // fakeFileUpload();
});

// load locally saved params, such as mosaic size etc
function initLocalStorageVars() {
    Glob.initialCubeWidth = loadLocalInt('initialCubeWidth', Glob.initialCubeWidth);
    Glob.initialCubeHeight = loadLocalInt('initialCubeHeight', Glob.initialCubeHeight);
    Glob.initialCubeDimen = loadLocalInt('initialCubeDimen', Glob.initialCubeDimen);
    Glob.pdfDrawLetters = loadLocalBool('pdfDrawLetters', Glob.pdfDrawLetters);
    Glob.bottomToTop = loadLocalBool('bottomToTop', Glob.bottomToTop);
    Glob.pdfBwPrinter = loadLocalBool('pdfBwPrinter', Glob.pdfBwPrinter);
}

function initMenu() {
    $(".closeMenu").attr('data-bs-toggle', 'collapse').attr("data-bs-target", "#navbarNav");
}
