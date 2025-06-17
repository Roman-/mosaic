// set page name and title to specified word
function setTitle(text) {
    $("#appName").html(text);
}

// places loading spinner to show "Loading..."
function showLoadingSpinner() {
    $("#mainLayout").html('<br><div class="text-center"> <div class="spinner-border" role="status" style="width: 4rem; height: 4rem;"> <span class="sr-only">Loading...</span> </div> </div>');
}

// shows loading spinner and launches the callback afterwards
function doAfterLoadingSpinner(callback) {
    showLoadingSpinner();
    setTimeout(callback, 10);
}

// resets image effects and restores the original image
function resetImgEffects() {
    Glob.imgEffects = {
        brightness:0,
        contrast:0,
        unsharpRadius:0,
        unsharpStrength:2,
        noise:0,
        hue:0,
        saturation:0,
        vibrance:0
    };
    Glob.fxCanvas = null;
    if (Glob.origImg)
        Glob.img.src = Glob.origImg.src;
}

// reset all image-related state when a new file is uploaded
function resetImageState() {
    if (Glob.cropper) {
        Glob.cropper.destroy();
    }
    Glob.cropper = null;
    Glob.origImg = null;
    Glob.fxCanvas = null;
    Glob.canvas = null;
    Glob.imageData = null;
    Glob.imgEffects = {
        brightness:0,
        contrast:0,
        unsharpRadius:0,
        unsharpStrength:2,
        noise:0,
        hue:0,
        saturation:0,
        vibrance:0
    };
}

let uploadOtherImageFooterBtn = () => $("<button class='btn btn-outline-warning m-1'></button>")
    .click(loDropImage)
    .append(fa("plus"), " Upload other image");
let editColorsFooterBtn = () => $("<button class='btn btn-outline-primary m-1'></button>")
    .append(fa("brush"), " Customize colors")
    .click(()=>doAfterLoadingSpinner(loPalette));
let changeMethodFooterBtn = () => $("<button class='btn btn-outline-primary m-1'></button>")
    .click(() => { resetImgEffects(); doAfterLoadingSpinner(loChoose) })
    .append(fa("undo"), " Choose different method");

// main layout with "drop image" thing
function loDropImage() {
    if (Glob.cropper)
        Glob.cropper.destroy()

    let h1 = $("<h1></h1>").html("Welcome to Bestsiteever Mosaic!");
    let subtitle = $("<h4></h4>").html("Free Rubik's cube mosaic builder optimized for portraits");

    let dropZoneConfig = {
        callback: onImageHasBeenLoaded,
        maxFileSizeMb: 10.0,
        initHtmlAcceptDrop: true
    };
    let dropZone = jqDropZone(dropZoneConfig);

    let div = $("<div class='container'></div>").append(h1, subtitle, dropZone, aboutText());
    $("#mainLayout").html(div);
    setTitle('<span class="text-secondary">Bestsiteever Mosaic</span>');
    let tutorialWrap = $("#videoTutorialWrap");

    tutorialWrap.empty().append(
        $("<div>")
            .addClass("ratio ratio-16x9")
            .append(
                $("<iframe>")
                    .addClass("w-100 h-100 border-0")
            )
    )

    if (Glob.debugModeOn) {
        tutorialWrap.empty().append("<h3>--- DEBUG MODE ON ---</h3>");
        return;
    }
    setTimeout(() => {
        tutorialWrap.empty().append(
            $("<div>")
                .addClass("ratio ratio-16x9")
                .append(
                    $("<iframe>")
                        .addClass("w-100 h-100 border-0")
                        .attr("src", "https://www.youtube.com/embed/uE54HH__H4g")
                        .attr("title", "YouTube video player")
                        .attr("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture")
                        .prop("allowfullscreen", true)
                )
        )
        window.scrollTo(0, 0);
    }, 1)
}

function downloadHighRes(heightPx) {
    if (!Glob.imageData) {         // nothing rendered yet? draw once.
        console.warn("No imageData – redrawing once.");
        return;                    // user should click again afterwards
    }

    const src      = Glob.imageData;
    const outW     = Math.round(src.width * heightPx / src.height);
    const outH     = heightPx
    const step     = outW / src.width;            // square size (float OK)

    const cv       = document.createElement("canvas");
    cv.width       = outW;
    cv.height      = outH;
    const ctx      = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    // draw coloured squares
    let i = 0;
    for (let y = 0; y < src.height; ++y) {
        for (let x = 0; x < src.width; ++x) {
            const r = src.data[i++];      // R
            const g = src.data[i++];      // G
            const b = src.data[i++];      // B
            i++;                          // skip A
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x * step, y * step, step, step);
            if (Glob.plasticColor) {
                ctx.strokeStyle = Glob.plasticColor;
                ctx.lineWidth   = 1;
                ctx.strokeRect(x * step, y * step, step, step);
            }
        }
    }

    // JPEG export & download
    const url  = cv.toDataURL("image/jpeg", 0.92).replace("image/jpeg", "image/octet-stream");
    const a    = document.createElement("a");
    a.href     = url;
    a.download = (Glob.imgFileName ? filenameFromPath(Glob.imgFileName) : "mosaic")
        + "_" + outW + "x" + heightPx + "px.jpg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// layout with last step, with fine adjustments of the portrait and "download PDF" button
function loAdjustPortrait(chooseOptions, opt) {
    if (!Glob.origImg) {
        Glob.origImg = new Image();
        Glob.origImg.src = Glob.img.src;
    }
    // reset image effects on entering the layout
    resetImgEffects();
    // store current parameter (ranges for gradient or ratio for others)
    let uiRanges = Array.isArray(opt) ? opt.slice() : null;

    // redraws mosaic on canvas
    function redrawMosaicWithUiRanges(asCubeStickers = true, updateHist = false) {
        let uiOpt = (chooseOptions.method === Methods.GRADIENT) ? uiRanges : $("#optRatio").val();

        // drawing twice is a dirty hack have antialiasing corresponding to image size
        Glob.imageData = drawMosaicOnCanvas(
            Glob.canvas,
            chooseOptions.palette,
            chooseOptions.method,
            uiOpt,
            !asCubeStickers,
            updateHist,
            histCanvas
        );
    }

    Glob.canvas = $("<canvas>")
        .css('border', '1px solid black')
        .attr('width', Glob.pixelWidth).attr('height', Glob.pixelHeight) // <- pixelwise size
        .addClass('col-6');
    let imgTag = $("<img/>")
        .attr('src', Glob.img.src)
        .css('vertical-align', 'inherit')
        .addClass('col-6');
    let editPixelsBtn = $("<button class='btn btn-link pt-0'></button>")
        .append(fa("edit"), " edit pixel-by-pixel").click(editPpClicked);
    let downloadPreviewBtn1 = $("<button class='btn btn-link pt-0'></button>")
        .append(fa("download"), " download preview (4k)")
        .click(() => downloadHighRes(4000));
    let downloadPreviewBtn2 = $("<button class='btn btn-link pt-0'></button>")
        .append(fa("download"), " download preview (8k)")
        .click(() => downloadHighRes(8000));
    let underMiniDiv =
        $("<div class='col-12'></div>")
            .append(editPixelsBtn);
    let underUnderDiv = $("<div></div>").append("");
    let histCanvas = $("<canvas id='histCanvas'></canvas>")
        .attr('width', 256)
        .attr('height', 80)
        .css('width', '100%')
        .css('border', '1px solid #ccc');
    let imagesDiv = $("<div class='col-sm-8'></div>").append(imgTag, Glob.canvas);
    imagesDiv.append(underMiniDiv, underUnderDiv, histCanvas);

    if (chooseOptions.method === Methods.GRADIENT) {
        let dragging = -1;
        function updateFromEvent(e) {
            const rect = histCanvas[0].getBoundingClientRect();
            let x = e.clientX - rect.left;
            let tone = clamp(Math.round(x / rect.width * 255), 0, 255);
            if (dragging < 0) return;
            if (dragging > 0) tone = Math.max(tone, uiRanges[dragging - 1]);
            if (dragging < uiRanges.length - 1) tone = Math.min(tone, uiRanges[dragging + 1]);
            uiRanges[dragging] = tone;
            redrawMosaicWithUiRanges(true, true);
        }
        histCanvas.on('mousedown', function (e) {
            const rect = histCanvas[0].getBoundingClientRect();
            let x = e.clientX - rect.left;
            let tone = clamp(Math.round(x / rect.width * 255), 0, 255);
            let best = 0;
            let dist = Math.abs(uiRanges[0] - tone);
            for (let i = 1; i < uiRanges.length; ++i) {
                let d = Math.abs(uiRanges[i] - tone);
                if (d < dist) { dist = d; best = i; }
            }
            dragging = best;
            updateFromEvent(e);
            $(document).on('mousemove.histdrag', updateFromEvent);
            $(document).on('mouseup.histdrag', function () {
                dragging = -1;
                $(document).off('.histdrag');
            });
        });
    }

    function editPpClicked() {
        downloadGlobImageData();
        underUnderDiv.html(Txt.editPixelByPixel);
    }

    function applyImgEffects() {
        if (!Glob.origImg) return;
        if (!Glob.fxCanvas) {
            try { Glob.fxCanvas = fx.canvas(); }
            catch (e) { console.error(e); return; }
        }
        let texture = Glob.fxCanvas.texture(Glob.origImg);
        Glob.fxCanvas.draw(texture);
        if (Glob.imgEffects.noise > 0)
            Glob.fxCanvas.noise(Glob.imgEffects.noise);
        if (Glob.imgEffects.hue !== 0 || Glob.imgEffects.saturation !== 0)
            Glob.fxCanvas.hueSaturation(Glob.imgEffects.hue, Glob.imgEffects.saturation);
        if (Glob.imgEffects.vibrance !== 0)
            Glob.fxCanvas.vibrance(Glob.imgEffects.vibrance);
        if (Glob.imgEffects.brightness !== 0 || Glob.imgEffects.contrast !== 0)
            Glob.fxCanvas.brightnessContrast(Glob.imgEffects.brightness, Glob.imgEffects.contrast);
        if (Glob.imgEffects.unsharpRadius > 0)
            Glob.fxCanvas.unsharpMask(Glob.imgEffects.unsharpRadius, Glob.imgEffects.unsharpStrength);
        Glob.fxCanvas.update();

        let dataUrl = Glob.fxCanvas.toDataURL();
        $(Glob.img).off('load.fx').one('load.fx', () => redrawMosaicWithUiRanges(true, true));
        Glob.img.src = dataUrl;
        imgTag.attr('src', dataUrl);
    }

    // @returns div with image adjustments spinners
    function buildRangesDiv() {
        let rangesDiv = $("<div></div>");
        if (!chooseOptions.opts || chooseOptions.opts.length === 0)
            return rangesDiv;

        if (chooseOptions.method === Methods.GRADIENT) {
            // no numeric inputs for gradient ranges
            return rangesDiv;
        } else {
            rangesDiv.attr('title', 'grain');
            let inputRatio = $("<input type='number'>")
                .attr('min', -50).attr('max', 1500)
                .val(opt)
                .attr('id', 'optRatio')
                .attr('step', 0.1)
                .attr('data-decimals', 2)
                .attr('data-prefix', 'G')
                .attr('title', 'grain')
                .on('input', function () {redrawMosaicWithUiRanges(true, true)});
            rangesDiv.append(inputRatio);
            return rangesDiv;
        }
    }


    // options div
    let plasticColorSelect = $("<select id='plasticColor' class='form-select my-1'></select>").change(function () {
        Glob.plasticColor = $("#plasticColor").find('option:selected').val();
        redrawMosaicWithUiRanges(true);
    });
    [['White', '#eee'], ['Black', '#111'], ['Color', null]].forEach(function (o) {
        let option = $("<option></option>").val(o[1]).html(o[0]).prop('selected', (o[0] === 'Color'));
        plasticColorSelect.append(option);
    });

    // miniaturesDiv
    Glob.canvasBlur = new CanvasFastBlur();
    Glob.canvasBlur.initCanvas(Glob.canvas[0]);
    let blurBtn = $("<button class='btn btn-outline-info form-control'></button>")
        .append(fa("glasses").addClass("fa-fw"), " Blur preview")
        .click(() => Glob.canvasBlur.gBlur(3));

    let drawLettersCb = $("<input type='checkbox'/>")
        .prop('checked', Glob.pdfDrawLetters)
        .on('input', () => {
            Glob.pdfDrawLetters = drawLettersCb.prop('checked');
            // make sure to draw colors if there're no letters
            if (!Glob.pdfDrawLetters) {
                dontUseColorCb.prop('checked', false);
                dontUseColorCb.trigger('input');
            }
    });
    let drawLettersLabel = $("<label class='form-control my-0'></label>")
        .append(drawLettersCb, " draw letters")
        .attr('title', 'Draw letters for each color in the color squares in PDF');

    let dontUseColorCb = $("<input type='checkbox'/>")
        .prop('checked', Glob.pdfBwPrinter)
        .on('input', () => {
            Glob.pdfBwPrinter = dontUseColorCb.prop('checked');

            // make sure to draw letters if no color
            if (Glob.pdfBwPrinter) {
                drawLettersCb.prop('checked', true);
                drawLettersCb.trigger('input');
            }
    });
    let dontUseColorLabel = $("<label class='form-control my-0'></label>")
        .append(dontUseColorCb, " black-and-white PDF")
        .attr('title', 'Want to print PDF on black-and-white printer?');

    let bottomTopCb = $("<input type='checkbox'/>")
        .prop("checked", Glob.bottomToTop)
        .on('input', () => Glob.bottomToTop = $(this).prop('checked'));
    let bottomTopLabel = $("<label class='form-control my-0'></label>")
        .append(bottomTopCb, " output bottom-to-top")
        .attr('title', 'In PDF, output bottom blocks first (useful when building mosaic in vertical frame)');

    let pdfBlocks = $("<div></div>").append(
            $("<input type='number' min='1' max='20'>")
                .attr('title', 'Block width')
                .attr('data-prefix', '<span class="fa fa-arrows-alt-h fa-fw"></span>')
                .val(Glob.blockWidthCubes)
                .change(function () {
                    Glob.blockWidthCubes = parseInt($(this).val());
                    saveLocal('blockWidthCubes', Glob.blockWidthCubes);
                })
                .trigger('change'),
            $("<input type='number' min='1' max='20'>")
                .attr('title', 'Block height')
                .attr('data-prefix', '<span class="fa fa-arrows-alt-v fa-fw"></span>')
                .val(Glob.blockHeightCubes)
                .change(function () {
                    Glob.blockHeightCubes = parseInt($(this).val());
                    saveLocal('blockHeightCubes', Glob.blockHeightCubes);
                })
                .trigger('change')
            );
    let brVal = $("<span class='ms-1'></span>").text(Glob.imgEffects.brightness);
    let brInput = $("<input type='range' min='-0.8' max='0.8' step='0.05' class='form-range'>")
        .val(Glob.imgEffects.brightness)
        .attr('title','brightness')
        .on('input', () => { Glob.imgEffects.brightness = parseFloat(brInput.val()); brVal.text(brInput.val()); applyImgEffects(); });

    let coVal = $("<span class='ms-1'></span>").text(Glob.imgEffects.contrast);
    let coInput = $("<input type='range' min='-0.8' max='0.8' step='0.05' class='form-range'>")
        .val(Glob.imgEffects.contrast)
        .attr('title','contrast')
        .on('input', () => { Glob.imgEffects.contrast = parseFloat(coInput.val()); coVal.text(coInput.val()); applyImgEffects(); });

    let noiseVal = $("<span class='ms-1'></span>").text(Glob.imgEffects.noise);
    let noiseInput = $("<input type='range' min='0' max='1' step='0.01' class='form-range'>")
        .val(Glob.imgEffects.noise)
        .attr('title','noise')
        .on('input', () => { Glob.imgEffects.noise = parseFloat(noiseInput.val()); noiseVal.text(noiseInput.val()); applyImgEffects(); });

    let hueVal = $("<span class='ms-1'></span>").text(Glob.imgEffects.hue);
    let hueInput = $("<input type='range' min='-1' max='1' step='0.01' class='form-range'>")
        .val(Glob.imgEffects.hue)
        .attr('title','hue')
        .on('input', () => { Glob.imgEffects.hue = parseFloat(hueInput.val()); hueVal.text(hueInput.val()); applyImgEffects(); });

    let satVal = $("<span class='ms-1'></span>").text(Glob.imgEffects.saturation);
    let satInput = $("<input type='range' min='0' max='0.9' step='0.01' class='form-range'>")
        .val(Glob.imgEffects.saturation)
        .attr('title','saturation')
        .on('input', () => { Glob.imgEffects.saturation = parseFloat(satInput.val()); satVal.text(satInput.val()); applyImgEffects(); });

    let vibVal = $("<span class='ms-1'></span>").text(Glob.imgEffects.vibrance);
    let vibInput = $("<input type='range' min='-1' max='1' step='0.01' class='form-range'>")
        .val(Glob.imgEffects.vibrance)
        .attr('title','vibrance')
        .on('input', () => { Glob.imgEffects.vibrance = parseFloat(vibInput.val()); vibVal.text(vibInput.val()); applyImgEffects(); });

    let unsharpRadiusVal = $("<span class='ms-1'></span>").text(Glob.imgEffects.unsharpRadius);
    let unsharpRadiusInput = $("<input type='range' min='0' max='20' step='0.1' class='form-range'>")
        .val(Glob.imgEffects.unsharpRadius)
        .attr('title','sharpen')
        .on('input', () => { Glob.imgEffects.unsharpRadius = parseFloat(unsharpRadiusInput.val()); unsharpRadiusVal.text(unsharpRadiusInput.val()); applyImgEffects(); });

    let unsharpStrengthVal = $("<span class='ms-1'></span>").text(Glob.imgEffects.unsharpStrength);
    let unsharpStrengthInput = $("<input type='range' min='0' max='5' step='0.1' class='form-range'>")
        .val(Glob.imgEffects.unsharpStrength)
        .attr('title','sharper')
        .on('input', () => { Glob.imgEffects.unsharpStrength = parseFloat(unsharpStrengthInput.val()); unsharpStrengthVal.text(unsharpStrengthInput.val()); applyImgEffects(); });
    let resetFxBtn = $("<button class='btn btn-secondary form-control my-1'></button>")
        .text('Reset effects')
        .click(() => {
            resetImgEffects();
            brInput.val(0); coInput.val(0); unsharpRadiusInput.val(0); unsharpStrengthInput.val(2);
            noiseInput.val(0); hueInput.val(0); satInput.val(0); vibInput.val(0);
            brVal.text(0); coVal.text(0); unsharpRadiusVal.text(0); unsharpStrengthVal.text(2);
            noiseVal.text(0); hueVal.text(0); satVal.text(0); vibVal.text(0);
            applyImgEffects();
        });

    let collapsedDiv = $("<div class='collapse card-body border mt-2' id='collapsedOpts'>").append(
            $("<div>").html("PDF blocks size ("+(Glob.cubeDimen > 1 ? "cubes" : "pixels")+"):"),
            pdfBlocks,
            bottomTopLabel,
            drawLettersLabel,
            dontUseColorLabel,
        );

    function mkFxControl(name, key, valSpan, input, defVal) {
        let resetBtn = $("<button type='button' class='btn btn-sm btn-outline-secondary fx-reset'></button>")
            .append(fa("undo"))
            .attr('title', 'reset')
            .click(() => {
                Glob.imgEffects[key] = defVal;
                input.val(defVal);
                valSpan.text(defVal);
                applyImgEffects();
            });
        return $("<div class='fx-control small mt-1'></div>")
            .append($("<span class='fx-label'></span>").text(name).attr('title', name))
            .append(valSpan.addClass('fx-val ms-1'))
            .append(input.addClass('flex-grow-1 ms-1'))
            .append(resetBtn);
    }

    let fxControlsDiv = $("<div class='collapse card-body border mt-2' id='collapsedFx'></div>").append(
            mkFxControl('Sharpen', 'unsharpRadius', unsharpRadiusVal, unsharpRadiusInput, 0),
            mkFxControl('Sharper', 'unsharpStrength', unsharpStrengthVal, unsharpStrengthInput, 2),
            mkFxControl('Brightness', 'brightness', brVal, brInput, 0),
            mkFxControl('Contrast', 'contrast', coVal, coInput, 0),
            mkFxControl('Noise', 'noise', noiseVal, noiseInput, 0),
            mkFxControl('Saturation', 'saturation', satVal, satInput, 0),
            mkFxControl('Vibrance', 'vibrance', vibVal, vibInput, 0),
            mkFxControl('Hue', 'hue', hueVal, hueInput, 0),
            resetFxBtn
        );

    let fxCollapseBtn = $("<button class='btn btn-outline-secondary form-control mt-2' data-bs-toggle='collapse' data-bs-target='#collapsedFx'></button>")
        .html('Effects <i class="fa fa-angle-down"></i>');

    let promoDiv = $("<div class='alert alert-secondary mt-2' role='alert'>").append(
        $("<div/>").append(
            $("<a href='https://discord.gg/8psRGEvyEj' target='_blank' class='btn btn-info form-control my-1 text-decoration-none'><i class='fab fa-discord'></i> Join Discord</a>"),
        )
    ).css('display', 'none');

    let collapseBtn = $("<button class='btn btn-outline-secondary form-control' data-bs-toggle='collapse' data-bs-target='#collapsedOpts'></button>")
        .html('PDF options <i class="fa fa-angle-down"></i>');

    let rightPanel = $("<div></div>").addClass('col-sm-4');
    let pdfBtnText = "<i class='fa fa-download'></i> Download PDF";
    let makePdfBtn = $("<button class='btn btn-success form-control my-1'></button>")
        .css('height', '3.5em')
        .html(pdfBtnText)
        .click(() => {
            makePdfBtn.html("<i class='fas fa-cog fa-spin'></i> working...").prop("disabled", true);
            redrawMosaicWithUiRanges(); // in case we've blurred canvas or something
            setTimeout(() => {
                generatePdf();
                makePdfBtn.html(pdfBtnText);
                setTitle('Your PDF is ready <i class="fa fa-rocket"></i>');
                underUnderDiv.empty();
                setTimeout(()=>{makePdfBtn.prop("disabled", false)}, 500);

                // save preferred parameters
                saveLocal('bottomToTop', Glob.bottomToTop);
                saveLocal('pdfDrawLetters', Glob.pdfDrawLetters);
                saveLocal('pdfBwPrinter', Glob.pdfBwPrinter);
                saveLocal('blockWidthCubes', Glob.blockWidthCubes);
                saveLocal('blockHeightCubes', Glob.blockHeightCubes);
                setTimeout(() => promoDiv.css('display', 'block'), 300)
            }, 50);
        });
    let editColorsBtn = $("<button class='btn btn-outline-primary form-control my-1'></button>")
        .append(fa("brush"), " Edit colors")
        .click(()=>{ resetImgEffects(); doAfterLoadingSpinner(loPalette)} );
    let changeMethodBtn = $("<button class='btn btn-outline-primary form-control my-1'></button>")
        .append(fa("undo"), " Change method")
        .click(() => { resetImgEffects(); doAfterLoadingSpinner(loChoose); });
    let newMosaicBtn = $("<button class='btn btn-outline-primary form-control my-1'></button>")
        .append(fa("plus"), " New mosaic")
        .click(loDropImage);

    const eligibleForAlgs = (Glob.cubeDimen === 3)
    let getAlgsBtn = $("<button class='btn btn-outline-primary form-control my-1'></button>")
        .append(fa("list"), " Get 3x3 algs")
        .css("display", eligibleForAlgs ? "block" : "none")
        .click(function () {
            downloadGlobImageData()
            window.open('https://bestsiteever.net/algs_for_mosaic', '_blank');
        });

    let previewCollapseDiv = $("<div class='collapse card-body border' id='collapsedPreview'></div>").append(
            $("<div>Plastic color:</div>"),
            plasticColorSelect,
            blurBtn,
            "<hr>",
            downloadPreviewBtn1,
            downloadPreviewBtn2,
            getAlgsBtn
        );
    let previewCollapseBtn = $("<button class='btn btn-outline-secondary form-control mt-2' data-bs-toggle='collapse' data-bs-target='#collapsedPreview'></button>")
        .html('Preview <i class="fa fa-angle-down"></i>');


    rightPanel.append(
        makePdfBtn,
        editColorsBtn,
        changeMethodBtn,
        newMosaicBtn,
        $("<hr>"),
        buildRangesDiv(),
        fxCollapseBtn,
        fxControlsDiv,
        collapseBtn,
        collapsedDiv,
        previewCollapseBtn,
        previewCollapseDiv,
        promoDiv
    );

    let row = $("<div class='row'></div>").append(imagesDiv, rightPanel);

    let div = $("<div class='container mt-2'></div>").append(row);
    $("#mainLayout").html(div);

    $("input[type='number']").inputSpinner();
    if (!Glob.origImg || !Glob.origImg.complete) {
        $(Glob.origImg).one('load.fxinit', applyImgEffects);
    } else {
        applyImgEffects();
    }
    plasticColorSelect.trigger('change');
    // drawing twice is a dirty hack to deal with antialiasing, corresponding to image size
    redrawMosaicWithUiRanges(true, true);
    redrawMosaicWithUiRanges(true);
    let totalCubes = Glob.pixelWidth * Glob.pixelHeight / (Glob.cubeDimen * Glob.cubeDimen);
    let artForm = Glob.cubeDimen === 1 ? "px artwork" : "cubes mosaic";
    setTitle(`Your ${totalCubes} ${artForm} <i class="fa fa-cubes"></i>`);
}

const populateDitheringClusters = (options, parameter) => {
    const doesntLookDifferent = options.method === Methods.ORDERED && parameter > 0 // heuristic
    let palettes = getPalettesReplacingDarkest()
    if (options.palette.length !== getFullPalette().length || (palettes.length === 1) || doesntLookDifferent) {
        return [{"options" : options, "name" : options.displayName}]; // this is "Diffusion without Blue"
    }
    let results = []
    for (let paletteVariation of palettes) {
        let newOpt = JSON.parse(JSON.stringify(options));
        newOpt.palette = paletteVariation.colors;
        results.push({"options": newOpt, "name": newOpt.displayName + " with " + paletteVariation.darkColor});
    }

    return results;
}

// layout with last step, with fine adjustments of the portrait and "download PDF" button
function loDitherAdjustment(initialOptions, parameter) {
    console.log("lo2ndChoice(chooseOptions, parameter): ", initialOptions, parameter);
    const clusters = populateDitheringClusters(initialOptions, parameter) // {name : string, chooseOptions : chooseOptions}

    let layout = $("<div/>");
    for (let cluster of clusters) {
        let optsPopulation = populateOpts(cluster.options, parameter);

        let canvasesDiv = $("<div class='text-center'></div>");

        optsPopulation.forEach(paramVariation => {
            // create canvas
            let canvas = $("<canvas class='rangeOptionCanvas'></canvas>")
                .attr('title', paramVariation.toFixed(2))
                .attr('width', Glob.pixelWidth).attr('height', Glob.pixelHeight) // <- pixelwise size
                .width(clamp(120, Glob.pixelWidth * 4, window.innerWidth * 0.7)) // <- resize
                .click(() => doAfterLoadingSpinner(()=>loAdjustPortrait(cluster.options, paramVariation)));

            // draw image with ranges
            drawMosaicOnCanvas(canvas, cluster.options.palette, cluster.options.method, paramVariation);
            canvasesDiv.append(canvas);
        });
        layout.append(
            $("<h3 class='mb-0'/>").
                html(cluster.name),
            $("<hr class='mb-1 mt-0'/>"),
            canvasesDiv
        )
    }

    $("#mainLayout").empty().append(layout, $("<hr class='my-1'>"),
        uploadOtherImageFooterBtn(), changeMethodFooterBtn(), editColorsFooterBtn());
    setTitle('Which one looks better?');
}

// layout with cropper
function loCropper() {
    // crop, set pixel size and build mosaic
    function onCropImage() {
        setTitle('Working...');
        function onImageCroppedLoaded() {
            $(Glob.img).off('load');
            let w = widthInput.val();
            let h = heightInput.val();
            Glob.cropper.destroy();
            Glob.cubeDimen = parseInt(cubeDimenSelect.val());
            Glob.pixelWidth = w * Glob.cubeDimen;
            Glob.pixelHeight = h * Glob.cubeDimen;

            Glob.initialCubeWidth = w;
            Glob.initialCubeHeight = h;
            Glob.initialCubeDimen = Glob.cubeDimen;
            saveLocal('initialCubeWidth', w);
            saveLocal('initialCubeHeight', h);
            saveLocal('initialCubeDimen', Glob.cubeDimen);

            loChoose();
        }

        $(Glob.img).off('load').on('load', onImageCroppedLoaded); // TODO I think off('load') wouldn't work
        let dataUrl = Glob.cropper.getCroppedCanvas({fillColor: '#fff'}).toDataURL();
        Glob.origImg = new Image();
        Glob.origImg.src = dataUrl;
        Glob.img.src = dataUrl;
    }
    let cubeDimenSelect = $("<select id='cubeDimen' class='form-select'></select>");
    [1,2,3,4,5,6,7].forEach(function (d) {
        let sizeHtml = (d === 1) ? "1 pixel" : d+'x'+d+'x'+d;
        cubeDimenSelect.append($("<option></option>").val(d).html(sizeHtml));
    });
    cubeDimenSelect.val(Glob.initialCubeDimen);

    let imgTag = $("<img>")
        .attr('src', Glob.img.src)
        .css('vertical-align', 'inherit')
        .css('max-width', '100%')
        .height(window.innerHeight * 0.7);

    // @returns true if w,h > 1 and < maxCubes
    function whWithinBoundaries(w,h) {
        return w*h > 1 && w <= Glob.maxCubesSize && h <= Glob.maxCubesSize;
    }

    function changeAspectRadio() {
        let w = widthInput.val();
        let h = heightInput.val();
        if (whWithinBoundaries(w,h)) {
            equalSpan.html(w*h);
            Glob.cropper.setAspectRatio(w/h);
        } else {
            equalSpan.html("...");
        }
    }
    let widthInput = $("<input type='number' size='3'>")
        .attr('title', 'width (cubes)')
        .attr('min', 2).attr('max', Glob.maxCubesSize).val(Glob.initialCubeWidth).on('input', changeAspectRadio);
    let heightInput = $("<input type='number' size='3'>")
        .attr('title', 'height (cubes)')
        .attr('min', 2).attr('max', Glob.maxCubesSize).val(Glob.initialCubeHeight).on('input', changeAspectRadio);
    let equalSpan = $("<span>").css('font-weight', 'bold');
    let nextBtn = $("<button class='btn btn-success form-control'></button>")
        .append("Next ", fa("arrow-alt-circle-right"))
        .click(function (e) {
            e.preventDefault();
            $(this).html("Cropping...");
            if (widthInput.val() < 1 || widthInput.val() > Glob.maxCubesSize)
                return widthInput.focus();
            if (heightInput.val() < 1 || heightInput.val() > Glob.maxCubesSize)
                return heightInput.focus();
            doAfterLoadingSpinner(onCropImage);
            //setTimeout(onCropImage, 1);
    });

    let panel = $("<div>").append(
        $("<div class='row g-1 align-items-center'></div>").css('margin-bottom', '0').append(
            $("<div>").addClass("col-auto").css("max-width", "11em").append(widthInput.addClass("form-control")),
            $("<div>").addClass("col-auto").append("&times;"),
            $("<div>").addClass("col-auto").css("max-width", "11em").append(heightInput.addClass("form-control")),
            $("<div>").addClass("col-auto").html("="),
            $("<div>").addClass("col-auto").append(equalSpan),
            $("<div>").addClass("col-auto").html("cubes"),
            $("<div>").addClass("col-auto").append(cubeDimenSelect),
            $("<div>").addClass("col ps-1").append(nextBtn),
    )).addClass("my-2");

    let imgWrapper = $("<div></div>").append(imgTag);

    Glob.cropper = new Cropper(imgTag[0], {
        aspectRatio: 1,
        dragMode: 'move',
        center: false,
        autoCropArea: 0.999,
        viewMode: 1, // restrict the crop box not to exceed the size of the canvas
        minCropBoxWidth: 25,
        minCropBoxHeight: 25,
    });

    let littleHintText = $("<div></div>").html(Txt.littleHintUnder).addClass("text-secondary font-italic small");

    $("#mainLayout").empty().append(panel, imgWrapper, littleHintText);
    changeAspectRadio();
    widthInput.inputSpinner();
    heightInput.inputSpinner();

    setTitle('Resize <i class="fa fa-cubes"></i> and crop <i class="fa fa-cut"></i>');
}

// layout with 1-st step choose. Displays a bunch of canvases
function loChoose() {
    if (getFullPalette().length < 2) {
        return loPalette();
    }
    window.scrollTo(0,0); // for large amount of images
    let optiontsDiv = $("<div/>");
    let canvasDisplayWidth = clamp(150, Glob.pixelWidth * 3, window.innerWidth * 0.40);

    Glob.chooseSets().forEach(function (chooseOptions) {
        let canvasesDiv = $("<div class='text-center'/>");
        optiontsDiv.append($("<h3 class='mb-0'/>").html(chooseOptions.displayName), $("<hr class='mb-1 mt-0'/>"), canvasesDiv);
        chooseOptions.opts.forEach(function (opt) {
            // create canvas
            let canvas = $("<canvas class='rangeOptionCanvas'></canvas>")
                .attr('width', Glob.pixelWidth).attr('height', Glob.pixelHeight) // <- pixelwise size
                .attr('title', typeof opt === "number" ? opt.toFixed(1) : "")
                .width(canvasDisplayWidth) // <- resize
                .click(() => doAfterLoadingSpinner(() => lo2ndChoice(chooseOptions, opt)));

            // draw image with ranges
            drawMosaicOnCanvas(canvas, chooseOptions.palette, chooseOptions.method, opt, true);
            canvasesDiv.append(canvas);
        })
    });

    $("#mainLayout").empty().append(optiontsDiv, $("<hr class='my-1'>"),
        uploadOtherImageFooterBtn(), editColorsFooterBtn());

    setTitle('Select the best looking picture');
}

// layout like lo2ndChoice but for gradient method
function loGradAdjustment(chooseOptions, opt) {
    showLoadingSpinner();
    window.scrollTo(0,0); // for large amount of images
    let topPanel = $("<div class='card bg-light'></div>").css('padding', '0.5em');
    let canvas = $("<canvas></canvas>")
        .attr('width', Glob.pixelWidth).attr('height', Glob.pixelHeight) // <- pixelwise size
        .width(clamp(120, Glob.pixelWidth * 4, window.innerWidth * 0.40)) // <- resize
        .css('border', '1px solid #555');
    drawMosaicOnCanvas(canvas, chooseOptions.palette, chooseOptions.method, opt);
    let continueBtn = $("<button class='mt-1 form-control btn btn-success'></button>")
        .append("Continue ", fa("arrow-alt-circle-right"))
        .click(function () {
            doAfterLoadingSpinner(()=>loAdjustPortrait(chooseOptions, opt));
        });

    let canvasPart = $("<div class='col-6'></div>").append(canvas);
    let rightPart = $("<div class='col-6'></div>").append(continueBtn);
    let splitter = $("<div></div>")
        .append('<h4>Or pick a different image:</h4>');

    let row = $("<div class='row'></div>").append(canvasPart, rightPart);
    topPanel.html(row);

    let optsPopulation = populateSetOfRanges(opt);

    let canvasesDiv = $("<div class='text-center'></div>");

    optsPopulation.forEach(function (newArray) {
        // create canvas
        let canvas = $("<canvas class='rangeOptionCanvas'></canvas>")
            .attr('width', Glob.pixelWidth).attr('height', Glob.pixelHeight) // <- pixelwise size
            .width(clamp(120, Glob.pixelWidth * 4, window.innerWidth * 0.40)) // <- resize
            .click(() => { doAfterLoadingSpinner(() => loGradAdjustment(chooseOptions, newArray)) });

        // draw image with ranges
        drawMosaicOnCanvas(canvas, chooseOptions.palette, chooseOptions.method, newArray);
        canvasesDiv.append(canvas);
    });

    $("#mainLayout").empty().append(topPanel, splitter, canvasesDiv,
        $("<hr class='my-1'>"), uploadOtherImageFooterBtn(), changeMethodFooterBtn(), editColorsFooterBtn());
    setTitle('Almost done');
}

// layout with pictures to select, after general method has been choosen
function lo2ndChoice(chooseOptions, opt) {
    showLoadingSpinner();
    window.scrollTo(0, 0); // for large amount of images
    switch  (chooseOptions.method) {
        case Methods.GRADIENT:
            return doAfterLoadingSpinner(()=>loGradAdjustment(chooseOptions, opt));
        case Methods.CLOSEST_COLOR:
            return doAfterLoadingSpinner(() => loAdjustPortrait(chooseOptions, opt));
        case Methods.ATKINSON:
        case Methods.ORDERED:
        case Methods.ERROR_DIFFUSION:
            return doAfterLoadingSpinner(()=>loDitherAdjustment(chooseOptions, opt));
        default: console.error("unknown chooseOptions.method", chooseOptions);
    }
}

// @returns jquery div with intro text
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
    link.attr('download', `miniature_${Glob.pixelWidth}x${Glob.pixelHeight}_px.png`);
    link.attr('href', imageDataToPngDataUrl(Glob.imageData));
    link.get(0).click();
}

// for debugging purposes: call this function to imitate user uploading an image
function fakeFileUpload(imageUrl = "data/test.jpg") {
    Glob.cubeDimen = 3;
    Glob.pixelWidth = 25*Glob.cubeDimen;
    Glob.pixelHeight = 25*Glob.cubeDimen;
    Glob.plasticColor = 'red';
    Glob.img = new Image();
    Glob.img.crossOrigin = "Anonymous";
    Glob.img.addEventListener('load', () => doAfterLoadingSpinner(loChoose));
    Glob.img.src = imageUrl;
}

// uploaded image has been loaded completely - check if it's a miniature or a normal picture
function onImageHasBeenLoaded(img, fileName) {
    //$(img).off('load'); Glob.img = img; - TODO this doesn't remove 'load' event
    Glob.img = new Image();
    Glob.img.src = img.src;
    Glob.imgFileName = fileName;
    // assuming miniature is uploaded if filename is preserved (starts with "miniature") or really small picture
    // with all sides devisible by 3
    let isMiniature = (Glob.img.width % (Glob.cubeDimen)===0)
        && (Glob.img.height % (Glob.cubeDimen)===0)
        && Glob.imgFileName.toLowerCase().startsWith('miniature');

    if (isMiniature) {
        doAfterLoadingSpinner(onMiniatureUploaded);
    } else {
        doAfterLoadingSpinner(loCropper);
    }
}

// if user has uploaded a miniature, use closest color method to build a mosaic
function onMiniatureUploaded() {
    $(Glob.img).off('load');

    Glob.pixelWidth = Glob.img.width;
    Glob.pixelHeight = Glob.img.height;

    let chooseOpts = {
        name: 'Closest',
        method: Methods.CLOSEST_COLOR,
        palette: getFullPalette(),
        opts: [] // only look at [r,g,b] color and not on brightness
    };
    doAfterLoadingSpinner(()=>{
        loAdjustPortrait(chooseOpts, 0);
        setTitle("Miniature uploaded");
    });
}
