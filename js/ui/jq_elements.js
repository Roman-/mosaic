/**
 * @returns div object with dropzone
 * @param cfg - configuration object {
 *  callback: function(img, fileName) // on image loaded callback
 *    img: Image - uploaded image
 *    fileName: String - name of the uploaded file
 *  maxFileSizeMb: float // maximum filesize in megabytes
 *  initHtmlAcceptDrop: boolean // if true, the entire <html> will accept drag-and-drop on any layout. Otherwise just the dropzone
 * }
 */
function jqDropZone(cfg) {
    let inputFile = $("<input id='imgFile' type='file' accept='image/*' hidden>").on('change', ()=>onUploadImgChange(null));
    let chooseImgBtn = $("<button class='btn btn-primary'/>")
        .append("Upload image ", fa('upload'))
        .click(uploadImgClicked);
    let dropLabel = $("<span>").addClass('px-2').html("or drag it here");
    let dropZone = $('<div class="upload-drop-zone" id="dropZone"/>')
        .append(inputFile, chooseImgBtn, dropLabel);

    // initialize drop acceptance upon first use
    (cfg.initHtmlAcceptDrop ? $("html") : dropZone)
        .off('dragover')
        .on('dragover', function (event) {
            event.preventDefault();
            event.stopPropagation();
            dropZone.addClass('drop');
            return false;
        })
        .off('dragleave')
        .on('dragleave', function (event) {
            event.preventDefault();
            event.stopPropagation();
            dropZone.removeClass('drop');
            return false;
        })
        .off('drop')
        .on('drop', function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (event.originalEvent.dataTransfer && event.originalEvent.dataTransfer.files.length) {
                onUploadImgChange(event.originalEvent.dataTransfer.files[0]);
            } else {
                dropLabel.html('oops, something went wrong. Please use the button to upload');
            }
            return false;
        });

    // 'upload image' button clicked
    function uploadImgClicked() {
        inputFile.val(null).trigger("click");
    }

    function onUploadImgChange(file = null) {
        dropZone.removeClass('drop');
        if (file == null)
            file = inputFile[0].files[0];

        if (!file || !file.size)
            return;

        let maxFilesize = cfg.maxFileSizeMb * 1e6;
        if (file.size > maxFilesize) {
            dropLabel.html(file.name + ' is too big (' + humanFileSize(file.size) + ') &#128546;');
            chooseImgBtn.html('Upload image (max. ' + humanFileSize(maxFilesize) + ')');
            return;
        }

        if (file.type.indexOf("image/") !== 0)
            return dropLabel.html(file.name + ' is not an image');

        showLoadingSpinner(); // TODO also replace with injected func

        let reader  = new FileReader();
        reader.addEventListener('load', function () {
            let img = new Image();
            img.src = reader.result;
            img.addEventListener('load', () => cfg.callback(img, file.name));
        }, false);

        reader.readAsDataURL(file);
    }

    return dropZone;
}