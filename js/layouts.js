// set page name and title to specified word
function setTitle(text) {
    $("#appName").html(text);
}

// places loading spinner to show "Loading..."
function showLoadingSpinner() {
    $("#mainLayout").html('<br><div class="text-center"> <div class="spinner-border" role="status" style="width: 4rem; height: 4rem;"> <span class="sr-only">Loading...</span> </div> </div>');
}

// main layout with "drop image" thing
function loDropImage() {
    if (Glob.cropper)
        Glob.cropper.destroy()

    let chooseImgBtn = $("<button class='btn btn-primary' id='chooseFileBtn'></button>")
        .html("Upload image <i class='fa fa-upload'></i>")
        .click(uploadImgClicked);

    let h1 = $("<h1></h1>").html("Welcome to Bestsiteever Mosaic!");
    let subtitle = $("<h4></h4>").html("Free Rubik's cube mosaic builder optimized for portraits");
    let dropZone = $('<div class="upload-drop-zone" id="dropZone"></div>')
        .append(chooseImgBtn, "<span id='dropLabel'> or drag it here</span>");

    let div = $("<div class='container'></div>").append(h1, subtitle, dropZone, aboutText());
    $("#mainLayout").html(div);
    setTitle('<span class="text-secondary">Bestsiteever Mosaic</span>');
}

// layout with last step, with fine adjustments of the portrait and "download PDF" button
function loAdjustPortrait(chooseOptions, opt) {
    // redraws mosaic on canvas
    function redrawMosaicWithUiRanges(asCubeStickers = true) {
        // returns array of N values that denotes borders (color transitions) - for 5 cubic portrait colors
        function getUiRangesArray() {
            if ($("input#rang0").length == 0) {
                console.error("getRangesArray: no ranges inputs");
            }
            let arr = [];
            for (let i = 0; $("input#rang" + i).length; ++i) {
                arr.push(Number.parseFloat($("input#rang" + i).val()));
            }
            return arr;
        }

        let uiOpt = (chooseOptions.method == 'grad') ? getUiRangesArray() : $("#optRatio").val();

        // drawing twice is a dirty hack have antialiasing corresponding to image size
        Glob.imageData = drawMosaicOnCanvas(Glob.canvas, chooseOptions.palette, chooseOptions.method, uiOpt, !asCubeStickers);
    }

    // info label
    let w = (Glob.pixelWidth/Glob.cubeDimen);
    let h = (Glob.pixelHeight/Glob.cubeDimen);
    let label = w + " &times; " + h + " = <b>" + (w*h) + "</b> cubes.";

    Glob.canvas = $("<canvas></canvas>")
        .css('border', '1px solid black')
        .attr('width', Glob.pixelWidth).attr('height', Glob.pixelHeight) // <- pixelwise size
        .addClass('col-6');
    let imgTag = $("<img/>")
        .attr('src', Glob.img.src)
        .css('vertical-align', 'inherit')
        .addClass('col-6');
    editPixelsBtn = $("<button class='btn btn-link pt-0'></button>")
        .html("<i class='fa fa-edit'></i> edit pixel-by-pixel").click(editPpClicked);
    let underMiniDiv = $("<div class='col-6'></div>").append(editPixelsBtn).css('margin-left', '50%');
    let underUnderDiv = $("<div></div>").append("");
    let imagesDiv = $("<div class='col-sm-8'></div>").append(imgTag, Glob.canvas);
    if (Glob.cubeDimen % 3==0 && (Glob.pixelWidth * Glob.pixelHeight < Glob.maxCubesForMiniature * 9)) {
        imagesDiv.append(underMiniDiv, underUnderDiv);
    }

    function editPpClicked() {
        downloadGlobImageData();
        underUnderDiv.html(Txt.editPixelByPixel);
    }

    // returns div with image adjustments spinners
    function buildRangesDiv() {
        if (chooseOptions.method == 'grad') {
            let rangesDiv = $("<div></div>");

            // returns color prefix for input spinner
            function inputPrefix(i) {
                let col = 'rgb(' + chooseOptions.palette[i][0] + ',' + chooseOptions.palette[i][1] + ',' + chooseOptions.palette[i][2] + ');';
                let style = 'font-weight: bold; background-color: '+col+'; border-radius: 3px; padding: 0 0.5em;';
                return '<span style="'+style+'">&nbsp;</span>';
            }

            for (let i = 0; i < opt.length; ++i) {
                let r = $("<input type='number'>")
                    .attr('min', 0).attr('max', 255)
                    .val(Math.ceil(opt[i]))
                    .attr('id', 'rang'+i)
                    .attr('data-prefix', inputPrefix(i))
                    .on('input', function () {redrawMosaicWithUiRanges()});
                rangesDiv.append(r);
            }
            return rangesDiv;
        } else { // if method !='grad'
            let rangesDiv = $("<div></div>")
                .attr('title', 'grain');
            let inputRatio = $("<input type='number'>")
                .attr('min', -2).attr('max', 1500)
                .val(opt)
                .attr('id', 'optRatio')
                .attr('step', 0.05)
                .attr('data-decimals', 2)
                .attr('data-prefix', 'G')
                .attr('title', 'grain')
                .on('input', function () {redrawMosaicWithUiRanges()});
            rangesDiv.append(inputRatio);
            return rangesDiv;
        }
    }


    // options div
    let plasticColorSelect = $("<select id='plasticColor' class='form-control my-1'></select>").change(function () {
        Glob.plasticColor = $("#plasticColor").find('option:selected').val();
        redrawMosaicWithUiRanges(true);
    });
    [['White', '#eee'], ['Black', '#111'], ['Color', null]].forEach(function (o) {
        let option = $("<option></option>").val(o[1]).html(o[0]).prop('selected', (o[0] == 'Color'));
        plasticColorSelect.append(option);
    });

    // miniaturesDiv
    Glob.canvasBlur = new CanvasFastBlur();
    Glob.canvasBlur.initCanvas(Glob.canvas[0]);
    let blurBtn = $("<button class='btn btn-outline-info form-control'></button>")
        .html("<i class='fa fa-glasses fa-fw'></i> Blur preview")
        .attr('title', 'Blur')
        .click(function () {
            Glob.canvasBlur.gBlur(3);
        })

    let startAgainBtn = $("<button class='btn btn-primary form-control my-1'></button>")
                            .html("<i class='fa fa-history'></i> Back to selection")
                            .click(function () {
                                showLoadingSpinner();
                                setTimeout(loChoose, 10);
                            });

    let drawLettersCb = $("<input type='checkbox'/>").on('input', function () {
        let checked = $(this).prop('checked');
        Glob.pdfDrawLetters = checked;

        // make sure to draw colors if there're no letters
        if (!checked) {
            dontUseColorCb.prop('checked', false);
            dontUseColorCb.trigger('input');
        }
    });
    let drawLettersLabel = $("<label class='form-control my-0'></label>")
        .append(drawLettersCb, " draw letters")
        .attr('title', 'Draw letters for each color in the color squares in PDF');

    var dontUseColorCb = $("<input type='checkbox'/>").prop('checked', Glob.pdfBwPrinter).on('input', function () {
        let checked = $(this).prop('checked');
        Glob.pdfBwPrinter = checked;

        // make sure to draw letters if no color
        if (checked) {
            drawLettersCb.prop('checked', true);
            drawLettersCb.trigger('input');
        }
    });
    var dontUseColorLabel = $("<label class='form-control my-0'></label>")
        .append(dontUseColorCb, " black-and-white PDF")
        .attr('title', 'Want to print PDF on black-and-white printer?');

    let bottomTopCb = $("<input type='checkbox' checked/>").on('input', function () {
        let checked = $(this).prop('checked');
        Glob.bottomToTop = checked;
    });
    let bottomTopLabel = $("<label class='form-control my-0'></label>")
        .append(bottomTopCb, " output bottom-to-top")
        .attr('title', 'In PDF, output bottom blocks first (useful when building mosaic in vertical frame)');

    let pdfBlocks = $("<div></div>").append(
            $("<input type='number' min='1' max='20'></input>")
                .attr('title', 'Block width')
                .attr('data-prefix', '<span class="fa fa-arrows-alt-h fa-fw"></span>')
                .val(Glob.cubeDimen == 1 ? Glob.defaultBlockWidthPixels : Glob.defaultBlockWidthCubes)
                .change(function () {Glob.blockWidthCubes = $(this).val();})
                .trigger('change'),
            $("<input type='number' min='1' max='20'></input>")
                .attr('title', 'Block height')
                .attr('data-prefix', '<span class="fa fa-arrows-alt-v fa-fw"></span>')
                .val(Glob.cubeDimen == 1 ? Glob.defaultBlockHeightPixels : Glob.defaultBlockHeightCubes)
                .change(function () {Glob.blockHeightCubes = $(this).val();})
                .trigger('change')
            );
    let collapsedDiv = $("<div class='collapse card-body border' id='collapsedOpts'></div>").append(
            $("<div>Preview plastic color:</div>"),
            plasticColorSelect,
            blurBtn,
            "<hr>",
            $("<div>PDF blocks size ("+(Glob.cubeDimen > 1 ? "cubes" : "pixels")+"):</div>"),
            pdfBlocks,
            bottomTopLabel,
            drawLettersLabel,
            dontUseColorLabel,
            "<hr>",
            startAgainBtn,
        );

    let collapseBtn = $("<button class='btn btn-outline-secondary form-control' data-toggle='collapse' data-target='#collapsedOpts'></button>")
        .html('More options <i class="fa fa-angle-down"></i>');

    let rightPanel = $("<div></div>").addClass('col-sm-4');
    let pdfBtnText = "<i class='fa fa-download'></i> Download PDF";
    var makePdfBtn = $("<button class='btn btn-success form-control'></button>")
        .css('height', '3.5em')
        .html(pdfBtnText)
        .click(function () {
            makePdfBtn.html("<i class='fas fa-cog fa-spin'></i> working...");
            redrawMosaicWithUiRanges(); // in case we've blurred canvas or something
            setTimeout(function () {
                generatePdf();
                makePdfBtn.html(pdfBtnText);
                setTitle('Your PDF is ready <i class="fa fa-rocket"></i>');
                underUnderDiv.empty();
                wasItHelpfulDiv.show();
            }, 50);

        });

    rightPanel.append(
            buildRangesDiv(),
            collapseBtn,
            collapsedDiv,
            makePdfBtn,
    );

    let row = $("<div class='row'></div>").append(imagesDiv, rightPanel);

    let div = $("<div class='container mt-2'></div>").append(row);
    $("#mainLayout").html(div);

    $("input[type='number']").inputSpinner();
    plasticColorSelect.trigger('change');
    // drawing twice is a dirty hack to deal with antialiasing, corresponding to image size
    redrawMosaicWithUiRanges(true);
    redrawMosaicWithUiRanges(true);
    let totalCubes = Glob.pixelWidth * Glob.pixelHeight / (Glob.cubeDimen * Glob.cubeDimen);
    setTitle('Your '+totalCubes+' cubes mosaic <i class="fa fa-cubes"></i>');
}

// layout with cropper
function loCropper() {
    // crop, set pixel size and build mosaic
    function onCropImage() {
        setTitle('Working...');
        let onImageCroppedLoaded = function () {
            let w = widthInput.val();
            let h = heightInput.val();
            Glob.cropper.destroy();
            Glob.cubeDimen = parseInt($("#cubeDimen").val());
            Glob.pixelWidth = w * Glob.cubeDimen;
            Glob.pixelHeight = h * Glob.cubeDimen;

            Glob.initialCubeWidth = w;
            Glob.initialCubeHeight = h;
            Glob.initialCubeDimen = Glob.cubeDimen;
            saveLocal('initialCubeWidth', w);
            saveLocal('initialCubeHeight', h);
            saveLocal('initialCubeDimen', Glob.cubeDimen);

            showLoadingSpinner();
            setTimeout(loChoose, 1);
        }

        Glob.img.removeEventListener('load', onImageHasBeenLoaded);
        Glob.img.addEventListener('load', onImageCroppedLoaded);
        Glob.img.src = Glob.cropper.getCroppedCanvas({fillColor: '#fff'}).toDataURL();
    }
    let cubeDimenSelect = $("<select id='cubeDimen' class='form-control'></select>");
    [1,2,3,4,5,6,7].forEach(function (d) {
        let sizeHtml = (d == 1) ? "1 pixel" : d+'x'+d+'x'+d;
        cubeDimenSelect.append($("<option></option>").val(d).html(sizeHtml));
    });
    cubeDimenSelect.val(Glob.initialCubeDimen);

    let imgTag = $("<img/>")
        .attr('src', Glob.img.src)
        .css('vertical-align', 'inherit')
        .css('max-width', '100%')
        .height(window.innerHeight * 0.7);

    // returns true if w,h > 1 and < maxCubes
    function whWithinBoundaries(w,h) {
        return w*h > 1 && w <= Glob.maxCubesSize && h <= Glob.maxCubesSize;
    }

    function changeAspectRadio() {
        let w = widthInput.val();
        let h = heightInput.val();
        if (whWithinBoundaries(w,h)) {
            $("#totalCubesSpan").html(w*h);
            Glob.cropper.setAspectRatio(w/h);
        } else {
            $("#totalCubesSpan").html("...");
        }
    }
    var widthInput = $("<input type='number' size='3'>")
        .attr('title', 'width (cubes)')
        .attr('min', 2).attr('max', Glob.maxCubesSize).val(Glob.initialCubeWidth).on('input', changeAspectRadio);
    var heightInput = $("<input type='number' size='3'>")
        .attr('title', 'height (cubes)')
        .attr('min', 2).attr('max', Glob.maxCubesSize).val(Glob.initialCubeHeight).on('input', changeAspectRadio);
    let equalWrap = $("<div id='totalCubesSpan'></div>").css('font-weight', 'bold').css('margin', 'auto 0.4em');
    let nextBtn = $("<button class='btn btn-success form-control' id='nextBtn'></button>")
        .html("Next <i class='fa fa-arrow-alt-circle-right'></i>")
        .click(function (e) {
            e.preventDefault();
            if (widthInput.val() < 1 || widthInput.val() > Glob.maxCubesSize)
                return widthInput.focus();
            if (heightInput.val() < 1 || heightInput.val() > Glob.maxCubesSize)
                return heightInput.focus();
            $(this).html("Cropping..."); setTimeout(onCropImage, 1)
    });

    let jqCol = (content, maxWidth) => {return $("<div class='col'></div>").append(content).css('max-width', maxWidth);};
    let jqMarginAuto = (content) => {return $("<div></div>").append(content).css('margin', 'auto');};
    let panel = $("<form></form>").append($("<div class='form-group row'></div>").css('margin-bottom', '0').append(
        jqCol(widthInput, '11em'), jqMarginAuto("&times;"),
        jqCol(heightInput, '11em'), jqMarginAuto("="), equalWrap,
        jqMarginAuto("cubes"), jqCol(cubeDimenSelect, '11em'), jqCol(nextBtn, 'none'))
    ).css('padding', '0.5em');

    let imgWrapper = $("<div></div>").append(imgTag);

    Glob.cropper = new Cropper(imgTag[0], {
      aspectRatio: 1,
      dragMode: 'move',
      center: false,
      autoCropArea: 0.999,
      viewMode: 1,
    });

    $("#mainLayout").empty().append(panel, imgWrapper);
    changeAspectRadio();
    widthInput.inputSpinner();
    heightInput.inputSpinner();

    setTitle('Specify the number of cubes <i class="fa fa-cubes"></i> and crop the image <i class="fa fa-cut"></i>');
}

// layout with 1-st step choose. Displays a bunch of canvases
function loChoose() {
    window.scrollTo(0,0); // for large amount of images
    let canvasesDiv = $("<div class='text-center'></div>");
    let canvasDisplayWidth = clamp(150, Glob.pixelWidth * 3, window.innerWidth * 0.40);

    Glob.chooseSets().forEach(function (chooseOptions) {
        chooseOptions.opts.forEach(function (opt) {
            // create canvas
            let canvas = $("<canvas class='rangeOptionCanvas'></canvas>")
                .attr('width', Glob.pixelWidth).attr('height', Glob.pixelHeight) // <- pixelwise size
                .width(canvasDisplayWidth) // <- resize
                .click(function () {
                    showLoadingSpinner();
                    setTimeout(function () {lo2ndChoice(chooseOptions, opt)}, 1);
                });

            // draw image with ranges
            drawMosaicOnCanvas(canvas, chooseOptions.palette, chooseOptions.method, opt, true);
            canvasesDiv.append(canvas);
        })
    });

    var btnChangePal = $("<button class='btn btn-primary m-1'></button>").html('Customize colors&hellip;').click(loPalette);
    $("#mainLayout").empty().append(canvasesDiv, btnChangePal);

    setTitle('Select the best looking picture <i class="fa fa-grip-horizontal"></i>');
}

// layout like lo2ndChoice but for gradient method
// callnumber - number of times it has been called so far
function loGradAdjustment(chooseOptions, opt, callNumber = 1) {
    showLoadingSpinner();
    if (callNumber > Glob.totalGradSteps)
        return loAdjustPortrait(chooseOptions, opt);
    window.scrollTo(0,0); // for large amount of images
    let topPanel = $("<div></div>");
    let canvas = $("<canvas></canvas>")
        .attr('width', Glob.pixelWidth).attr('height', Glob.pixelHeight) // <- pixelwise size
        .width(clamp(120, Glob.pixelWidth * 4, window.innerWidth * 0.40)) // <- resize
        .css('border', '1px solid #555');
    drawMosaicOnCanvas(canvas, chooseOptions.palette, chooseOptions.method, opt);
    let continueBtn = $("<button class='form-control btn btn-success'>Continue with this image <i class='fa fa-arrow-alt-circle-right'></i></button>")
        .click(function () {
            showLoadingSpinner();
            setTimeout(function () {loAdjustPortrait(chooseOptions, opt)}, 1);
        });

    let commentsDiv = $("<div class='text-muted'></div>").html("Don't worry, you will make it perfect on the next stage.");
    let canvasPart = $("<div class='col-6'></div>").append(canvas);
    let rightPart = $("<div class='col-6'></div>").append(continueBtn, commentsDiv);
    let splitter = $("<div></div>")
        .append('<h4>Or replace it (step <b>'+callNumber + "/"+Glob.totalGradSteps+'</b>):</h4>');

    let row = $("<div class='row'></div>").append(canvasPart, rightPart);
    topPanel.addClass('card bg-light').css('padding', '0.5em').html(row);

    let optsPopulation = populateSetOfRanges(opt);

    let canvasesDiv = $("<div class='text-center'></div>");

    optsPopulation.forEach(function (newOpt) {
        // create canvas
        let canvas = $("<canvas class='rangeOptionCanvas'></canvas>")
            .attr('width', Glob.pixelWidth).attr('height', Glob.pixelHeight) // <- pixelwise size
            .width(clamp(120, Glob.pixelWidth * 4, window.innerWidth * 0.40)) // <- resize
            .click(function () {
                showLoadingSpinner();
                setTimeout(function () {loGradAdjustment(chooseOptions, newOpt, callNumber + 1);}, 1);
            });

        // draw image with ranges
        drawMosaicOnCanvas(canvas, chooseOptions.palette, chooseOptions.method, newOpt);
        canvasesDiv.append(canvas);
    });

    $("#mainLayout").empty().append(topPanel, splitter, canvasesDiv);
    setTitle('Almost done');
}

// layout with pictures to select, after general method has been choosen
function lo2ndChoice(chooseOptions, opt) {
    showLoadingSpinner();
    window.scrollTo(0, 0); // for large amount of images
    if (chooseOptions.method == 'grad')
        return loGradAdjustment(chooseOptions, opt);
    else if (chooseOptions.method == 'closestColor')
        return loAdjustPortrait(chooseOptions, opt);

    // below is code for lo2ndchoice for different dithering methods

    let optsPopulation = populateOpts(chooseOptions, opt);

    let canvasesDiv = $("<div class='text-center'></div>");

    optsPopulation.forEach(function (opt) {
        // create canvas
        let canvas = $("<canvas class='rangeOptionCanvas'></canvas>")
            .attr('width', Glob.pixelWidth).attr('height', Glob.pixelHeight) // <- pixelwise size
            .width(clamp(120, Glob.pixelWidth * 4, window.innerWidth * 0.7)) // <- resize
            .click(function () {
                showLoadingSpinner();
                setTimeout(function () {loAdjustPortrait(chooseOptions, opt);}, 1);
            });

        // draw image with ranges
        drawMosaicOnCanvas(canvas, chooseOptions.palette, chooseOptions.method, opt);
        canvasesDiv.append(canvas);
    });

    $("#mainLayout").empty().append(canvasesDiv);
    setTitle('Which one looks better?');
}

// returns jquery div with intro text
function aboutText() {
    let aboutDiv = $("<div></div>");

    Txt.qaTitlesAndTexts.forEach(function (t) {
        aboutDiv.append(t)
    });
    return aboutDiv;
}

// palette editor layout
function loPalette() {
    $("#mainLayout").empty().append(jqPaletteLay());
    setTitle('Palette editor');
    window.scrollTo(0,0);
    $('[data-toggle="tooltip"]').tooltip({html: true});
}

// [unused function] based on cube dimentions and proportions, calc width and height
function calculatePixelWh() {
    let totalPixels = Glob.totalCubes * Glob.cubeDimen * Glob.cubeDimen;
    let ratio1 = Glob.img.width / Glob.img.height;
    let ratio2 = 1/ratio1;

    // sizing: attempts 1 and 2 for bigger amount of cubes in total
    let pixelHeight1 = Math.round(Math.sqrt(Glob.totalCubes/ratio1)) * Glob.cubeDimen;
    let pixelWidth1 = Math.round(ratio1 * pixelHeight1);
    pixelWidth1 -= (pixelWidth1 % Glob.cubeDimen);

    let pixelWidth2 = Math.round(Math.sqrt(Glob.totalCubes/ratio2)) * Glob.cubeDimen;
    let pixelHeight2 = Math.round(ratio2 * pixelWidth2);
    pixelHeight2 -= (pixelHeight2 % Glob.cubeDimen);

    console.log("can have these sizes: ", pixelHeight1/Glob.cubeDimen + 'x' + pixelWidth1/Glob.cubeDimen
            + " OR " + pixelHeight2/Glob.cubeDimen + 'x' + pixelWidth2/Glob.cubeDimen);

    Glob.pixelWidth = Math.max(pixelWidth1, pixelWidth2);
    Glob.pixelHeight = Math.max(pixelHeight1, pixelHeight2);
}

// download Glob.imageData as PNG image
function downloadGlobImageData() {
    let link = $("<a></a>");
    link.attr('download', 'miniature.png');
    link.attr('href', imageDataToPngDataUrl(Glob.imageData));
    link.get(0).click();
}

// 'upload image' button clicked
function uploadImgClicked() {
    $('#imgFile').val(null).trigger("click");
}

// for debugging purposes: call this function to imitate user uploading an image
function fakeFileUpload(imageUrl = "data/test.png") {
    Glob.cubeDimen = 3;
    Glob.pixelWidth = 25*Glob.cubeDimen;
    Glob.pixelHeight = 25*Glob.cubeDimen;
    Glob.plasticColor = 'red';
    Glob.img = new Image();
    Glob.img.crossOrigin = "Anonymous";
    Glob.img.addEventListener('load', function () {loChoose()});
    Glob.img.src = imageUrl;
}

// on image file uploaded
function onUploadImgChange(file = null) {
    $("#dropZone").removeClass('drop');
    if (file == null)
        file = $('#imgFile')[0].files[0];

    if (!file || !file.size)
        return;

    let maxFilesize = Glob.maxFileSizeMb * 1e6;
    if (file.size > maxFilesize) {
        $("#dropLabel").html(' ' + file.name + ' is too big ('+humanFileSize(file.size)+') &#128546;');
        $("#chooseFileBtn").html('Upload image (max. ' + humanFileSize(maxFilesize) + ')');
        return;
    }

    if (file.type.indexOf("image/") !== 0)
        return $("#dropLabel").html(file.name + ' is not an image');

    showLoadingSpinner();

    var reader  = new FileReader();
    reader.addEventListener("load", function () {
        Glob.img = new Image();
        Glob.img.src = reader.result;
        Glob.img.addEventListener('load', onImageHasBeenLoaded);
        Glob.imgFileName = file.name;
    }, false);

    reader.readAsDataURL(file);
}

// uploaded image has been loaded completely - check if it's a miniature or a normal picture
function onImageHasBeenLoaded() {
    // assuming miniature is uploaded if filename is preserved (starts with "miniature") or really small picture
    // with all sides devisible by 3
    let isMiniature = ((Glob.img.width%3==0) && (Glob.img.height%3==0))
        && (Glob.imgFileName.toLowerCase().startsWith('miniature')
               || (Glob.img.width * Glob.img.height < Glob.maxCubesForMiniature * 9));

    if (isMiniature) {
        onMiniatureUploaded();
    } else {
        loCropper();
    }
}

// if user has uploaded a miniature, use closest color method to build a mosaic
function onMiniatureUploaded() {
    setTitle('Miniature uploaded...');
    Glob.img.removeEventListener('load', onImageHasBeenLoaded);

    Glob.cubeDimen = 3;
    Glob.pixelWidth = Glob.img.width;
    Glob.pixelHeight = Glob.img.height;

    showLoadingSpinner();

    let chooseOpts = {
        name: 'Closest',
        method: 'closestColor',
        palette: getFullPalette(),
        opts: [0] // only look at [r,g,b] color and not on brightness
    };
    loAdjustPortrait(chooseOpts, 0);
    setTitle("Miniature uploaded <i class='fa fa-brain'></i>");
}

function getVidEmbedCode() {
    return `<iframe width="560" height="315" src="https://www.youtube.com/embed/MhVSOkys8pI" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
}
