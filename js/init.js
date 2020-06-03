$(document).ready(function() {
    initDropAccepting();
    initMenu();
    initLocalStorageVars();

    loDropImage();
});

// load locally saved params, such as mosaic size etc
function initLocalStorageVars() {
    Glob.initialCubeWidth = loadLocal('initialCubeWidth', Glob.initialCubeWidth);
    Glob.initialCubeHeight = loadLocal('initialCubeHeight', Glob.initialCubeHeight);
    Glob.initialCubeDimen = loadLocal('initialCubeDimen', Glob.initialCubeDimen);
}

function initMenu() {
    $(".closeMenu").attr('data-toggle', 'collapse').attr("data-target", "#navbarNav");
}

function initDropAccepting() {
    $("html")
        .on('dragover', function (event) {
            event.preventDefault();
            event.stopPropagation();
            $("#dropZone").addClass('drop');
            return false;
        })
        .on('dragleave', function (event) {
            event.preventDefault();
            event.stopPropagation();
            $("#dropZone").removeClass('drop');
            return false;
        })
        .on('drop', function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (event.originalEvent.dataTransfer && event.originalEvent.dataTransfer.files.length) {
                onUploadImgChange(event.originalEvent.dataTransfer.files[0]);
            } else {
                $("#dropLabel").html('oops, something went wrong. Please use the button to upload files');
            }
            return false;
        });
}
