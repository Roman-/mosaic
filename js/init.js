$(document).ready(function() {
    initMenu();
    initLocalStorageVars();

    loDropImage();
    // fakeFileUpload();
});

// load locally saved params, such as mosaic size etc
function initLocalStorageVars() {
    Glob.initialCubeWidth = loadLocal('initialCubeWidth', Glob.initialCubeWidth);
    Glob.initialCubeHeight = loadLocal('initialCubeHeight', Glob.initialCubeHeight);
    Glob.initialCubeDimen = loadLocal('initialCubeDimen', Glob.initialCubeDimen);
}

function initMenu() {
    $(".closeMenu").attr('data-bs-toggle', 'collapse').attr("data-bs-target", "#navbarNav");
}
