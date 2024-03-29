// palette is array of color object:
// {
//     available: if color is available
//     rgb: [r,g,b]
//     name: string - color name (used for PDF and visual)
//     notation: string (preferably 1 letter for PDF purposes)
//     grad: use this color in gradient method
//     tryDitherWo: if true, try dithering alg without this color (in Glob.chooseSets)
// }
// Order is important, see how Glob.chooseSets is formed
Glob.defaultPalette = [
    {
        available: false,
        rgb: [  0,   0,   0], // Black
        name: 'Black',
        notation: 'D',
        grad: true,
        tryDitherWo: true
    },
    {
        available: true,
        rgb: [  0,   0, 255], // Blue
        name: 'Blue',
        notation: 'B',
        grad: true,
        tryDitherWo: true
    },
    {
        available: true,
        rgb: [  0, 255,   0], // Green
        name: 'Green',
        notation: 'G',
        grad: false,
        tryDitherWo: true
    },
    {
        available: true,
        rgb: [255,   0,   0], // Red
        name: 'Red',
        notation: 'R',
        grad: true,
        tryDitherWo: false
    },
    {
        available: false,
        rgb: [255, 105, 180], // Pink
        name: 'Pink',
        notation: 'P',
        grad: true,
        tryDitherWo: true
    },
    {
        available: true,
        rgb: [255, 153,   0], // Orange
        name: 'Orange',
        notation: 'O',
        grad: true,
        tryDitherWo: false
    },
    {
        available: true,
        rgb: [255, 255,   0], // Yellow
        name: 'Yellow',
        notation: 'Y',
        grad: true,
        tryDitherWo: false
    },
    {
        available: true,
        rgb: [255, 255, 255], // White
        name: 'White',
        notation: 'W',
        grad: true,
        tryDitherWo: false
    }
];
Glob.palette = JSON.parse(JSON.stringify(Glob.defaultPalette));

// @returns new color to be inserted into pal
function newColor() {
    return {
        available: false,
        rgb: [128, 128, 128],
        name: 'NewColor',
        notation: 'N',
        grad: true,
        tryDitherWo: false
    }
}

// @returns array of RGBs of all available colors
function getFullPalette() {
    let result = [];
    Glob.palette.forEach(function (pal) {
        if (pal.available)
            result.push(pal.rgb);
    });
    return result;
}

// @returns array of RGBs for gradient method
function getGradPalette() {
    let result = [];
    Glob.palette.forEach(function (c) {
        if (c.available && c.grad)
            result.push(c.rgb);
    });
    // TODO should we always sort the result palette by darkness?
    // One problem that might occur is if both green (0,255,0) and blue (0,0,255) are
    // in the palette, the user will have no control over their order.
    result.sort((a, b) => {return ((a[0]+a[1]+a[2]) - (b[0]+b[1]+b[2]));});
    return result;
}

// @returns array of palettes, which are the same as original Glob.palette but missing one color
function getPalettesExcludingColors() {
    let pals = [];
    let indexes = []; // indices of colors to try out error diffusion without
    let pal = Glob.palette;

    for (let i = 0; i < pal.length; ++i) {
        if (pal[i].available && pal[i].tryDitherWo) {
            indexes.push(i);
        }
    }

    indexes.forEach(function (index) {
        // add to PALS palette of all colors except for index
        let currentPal = [];

        for (let i = 0; i < pal.length; ++i) {
            if (pal[i].available && i !== index)
                currentPal.push(pal[i].rgb);
        }

        pals.push({"colors": currentPal, "name": "without " + Glob.palette[index]["name"]});
    });
    return pals;
}

// @returns array of palettes which have the same colors as in Glob.palette, but with the first (darkest) color being different
function getPalettesReplacingDarkest() {
    const availablePalette = Glob.palette.filter(p => p.available);
    const tone = (rgb) => rgb[0] + rgb[1] + rgb[2];
    let darkestTone = null
    // find first darkest color
    for (let color of availablePalette) {
        if (darkestTone === null || tone(color.rgb) < darkestTone) {
            darkestTone = tone(color.rgb);
        }
    }

    let indexesOfDarkestColors = availablePalette.filter(p => tone(p.rgb) === darkestTone).map(p => availablePalette.indexOf(p));

    let pals = []
    indexesOfDarkestColors.forEach(function (index) {
        let currentPal = [];
        for (let i = 0; i < availablePalette.length; ++i) {
            if (i === index) {
                continue;
            }
            currentPal.push(availablePalette[i].rgb);
        }
        currentPal.unshift(availablePalette[index].rgb);
        pals.push({"colors": currentPal, "darkColor": availablePalette[index]["name"]});
    });

    return pals;
}

function resetColorNamesCache() {
    colorNameByRgb.colorMap = null;
    colorNameByRgb.letterMap = null;
}

// @returns color name by its rgb value
// @param l - get letter (notation) instad of full color
// @param rgbJoined - rgb joined by semicolon
function colorNameByRgb(rgbJoined, l = false) {
    if (null == colorNameByRgb.colorMap || null == colorNameByRgb.letterMap) {
        // init
        colorNameByRgb.colorMap = {};
        colorNameByRgb.letterMap = {};
        // else we cache color names
        Glob.palette.forEach(function (p) {
            let j = p.rgb.join(';');
            colorNameByRgb.colorMap[j] = p.name;
            colorNameByRgb.letterMap[j] = p.notation;
        });
    }

    if (colorNameByRgb.colorMap.hasOwnProperty(rgbJoined)) {
        return l ? colorNameByRgb.letterMap[rgbJoined] : colorNameByRgb.colorMap[rgbJoined];
    }
    return l ? "?" : rgbJoined;
}
resetColorNamesCache(); // reset cache on init

/* palette display funcs */

// @returns palette editor div
function jqPaletteLay() {
    // displays Global.palette on the screen
    function updatePalOnScreen() {
        tableContainer.html(paletteToJqTable(Glob.palette, advanced));
        $('[data-toggle="tooltip"]').tooltip({html: true});
        resetColorNamesCache();
    }

    let advanced = false;
    let div = $("<div></div>");

    let panel = $("<div></div>").addClass('row');
    let colPadding = "0 0.3em";

    let btnReset = $("<button></button>")
        .html('Reset to defaults')
        .addClass('btn btn-warning m-1 form-control')
        .click(function () {
            if (!confirm('Are you sure to reset palette? You will loose all changes'))
                return;
            Glob.palette = JSON.parse(JSON.stringify(Glob.defaultPalette));
            updatePalOnScreen();
        });
    let btnResetWrap = jqCol(btnReset).css('padding', colPadding);

    let btnDone = $("<button>")
        .html('Done')
        .addClass('btn btn-success m-1 form-control')
        .click(function () {
            let proceed = (null != Glob.img) && (Glob.cubeDimen > 0) && (Glob.imgFileName.length > 0);
            let returnLayout = proceed ? loChoose : loDropImage;
            doAfterLoadingSpinner(returnLayout);
        });
    let btnDoneWrap = jqCol(btnDone, false).css('padding', colPadding);

    let btnAdvanced = $("<button></button>")
        .html('Advanced settings')
        .addClass('btn btn-outline-primary m-1 form-control')
        .click(function () {
            advanced = true;
            updatePalOnScreen();
            btnAdvancedWrap.hide();
            btnAddColorWrap.show();
            btnSaveWrap.show();
            btnLoadWrap.show();
        });
    let btnAdvancedWrap = jqCol(btnAdvanced).css('padding', colPadding);

    let btnLoad = $("<button></button>")
        .append(fa("folder-open"), ' Import from file&hellip;')
        .addClass('btn btn-outline-primary m-1 form-control')
        .click(function () {
            openLoadPalDialog(updatePalOnScreen);
        });
    let btnLoadWrap = jqCol(btnLoad).css('padding', colPadding).hide();

    let btnSave = $("<button></button>")
        .append(fa("download"), ' Export')
        .addClass('btn btn-outline-primary m-1 form-control')
        .click(function () {downloadPlainText(JSON.stringify(Glob.palette, null, 2), "My palette.pal")})
    let btnSaveWrap = jqCol(btnSave).css('padding', colPadding).hide();

    let btnAddColor = $("<button></button>")
        .append(fa("plus"), ' Add color')
        .addClass('btn btn-outline-primary m-1 form-control')
        .click(function () {
            Glob.palette.push(newColor());
            updatePalOnScreen();
        });
    let btnAddColorWrap = jqCol(btnAddColor).css('padding', colPadding).hide();

    panel.append(btnResetWrap, btnAddColorWrap, btnAdvancedWrap, btnSaveWrap, btnLoadWrap, btnDoneWrap);

    let tableContainer = $("<div></div>");
    updatePalOnScreen();

    div.append(tableContainer, panel);

    return div;
}

// load palette from file
// @param onSuccess - callback on successful palette update
function openLoadPalDialog(onSuccess) {
    $('<input id="csvFileInput" type="file" style="display: none;" accept=".pal" hidden/>')
        .change(function () {onUploadPalFile($(this), onSuccess)})
        .trigger('click')
}

// on (palette) file upload changed
function onUploadPalFile(fileinput, onSuccess) {
    // indicate that loading palette has been failed
    function palFail(msg) {
        showBsModal(msg, 'Failed to load palette');
    }

    let file = fileinput[0].files[0];
    let reader  = new FileReader();
    reader.addEventListener("load", function () {
        let paletteName = filenameFromPath(file.name);
        let jsonString = reader.result;
        try {
            let json = JSON.parse(jsonString);
            let validationRes = validateJsonPal(json);
            if (!validationRes.valid)
                return palFail(validationRes.msg);

            Glob.palette = json;
            onSuccess();
        } catch (e) {
            return palFail('Unable to parse JSON');
        }
    }, false);
    if (file)
        reader.readAsText(file);
}


// @returns true if palette in JSON format is valid. Helpful for checking loaded palette
// @returns object {valid: boolean; msg: string}: msg is reason why invalid
function validateJsonPal(pal) {
    function nope(reason) {
        return {"valid": false, "msg": reason};
    }

    if (!Array.isArray(pal))
        return nope("Is not array");

    if (pal.length === 0)
        return nope("Empty palette");

    const properties = ["available", "rgb", "name", "grad"];
    for (let i = 0; i < pal.length; ++i) {
        let c = pal[i];
        // check for all properties
        for (let j = 0; j < properties.length; ++j) {
            let prop = properties[j];
            if (!c.hasOwnProperty(prop))
                return nope("Color #" + i + " doesn't have property \"" + prop + "\"");
        }
        // check if color is rgb
        if (!Array.isArray(c["rgb"]) || c["rgb"].length !== 3
                || (typeof c["rgb"][0] !== "number")
                || (typeof c["rgb"][1] !== "number")
                || (typeof c["rgb"][2] !== "number")) {
            console.log(c["rgb"]);
            return nope("Invalid RGB of color #" + i);
        }
        if (typeof c["name"] !== "string" || c["name"].length < 1 || c["name"].length > 25)
            return nope("invalid name of color #" + i);
        if (typeof c["notation"] !== "string" || c["notation"].length > 5)
            return nope("invalid notation of color #" + i);
    }

    return {valid: true};
}

// @param pal - palette in JSON format (see Glob.palette)
// @param advanced = show advanced options
function paletteToJqTable(pal, advanced = false) {
    let headersTr = $("<tr>");
    let table = $("<table class='table'></table>").append(headersTr);

    headersTr.append(
        $("<th>").append(questionTt(Txt.availableText)).addClass("shrink"),
        $("<th>").addClass("px-1").append("Name"),
        $("<th>").addClass("px-1 shrink").append("Value"));

    if (advanced) {
        headersTr.append(
            $("<th>").addClass("px-1").append("Letter"),
            $("<th>").addClass("px-1 text-nowrap").append("Use in gradient", questionTt(Txt.gradText)),
            $("<th>").addClass("px-1 text-nowrap").append("DE", questionTt(Txt.edText)));
    }

    // insert tr
    pal.forEach(function (col) {
        let tr = $("<tr></tr>");

        let cbAllow = $("<input type='checkbox'/>")
            .addClass('form-check-input big-checkbox mx-1')
            .prop('checked', col.available)
            .attr('title', 'Use this color')
            .on('input', function () {
                col.available = $(this).prop('checked');
                toggleAvailable(col.available);
            });
        tr.append($("<td>").addClass("shrink").append(cbAllow));

        let inputName = $("<input type='text'/>")
            .val(col.name)
            .attr('size', 25)
            .attr('title', 'Latin letters only')
            .attr('placeholder', 'Unique color name')
            .addClass('form-control')
            .on('input', function () {
                let newName = $(this).val();
                if (newName.length > 0 && newName.length < 25 && newName.match(/^[0-9A-Za-z]*$/g)) {
                    col.name = newName;
                    $(this).removeClass('border border-danger');
                    resetColorNamesCache();
                } else {
                    $(this).addClass('border border-danger');
                }
            });
        tr.append($("<td></td>").append(inputName));

        let jqCol = jQuery.Color(col.rgb)
        let inputColor = $("<input type='color'/>")
            .addClass('form-control form-control-color')
            .val(jqCol.toHexString())
            .attr('title', 'Edit color')
            .on('input', function () {
                let c = jQuery.Color($(this).val());
                col.rgb = [c.red(), c.green(), c.blue()]
            });
        tr.append($("<td></td>").addClass("shrink").append(inputColor));

        let inputLetter = $("<input type='text'/>")
            .val(col.notation)
            .attr('size', 5)
            .attr('title', 'Short name (notation)')
            .attr('placeholder', 'Notation')
            .addClass('form-control')
            .on('input', function () {
                let newNotation = $(this).val();
                if (newNotation.length > 0 && newNotation.length < 5 && newNotation.match(/^[0-9A-Za-z]*$/g)) {
                    col.notation = newNotation;
                    $(this).removeClass('border border-danger');
                    resetColorNamesCache();
                } else {
                    $(this).addClass('border border-danger');
                }
            });
        if (advanced)
            tr.append($("<td></td>").append(inputLetter));

        let cbGrad = $("<input type='checkbox'/>")
            .addClass('form-check-input big-checkbox')
            .prop('checked', col.grad)
            .on('input', function () {
                col.grad = $(this).prop('checked');
            });
        if (advanced)
            tr.append($("<td></td>").addClass("text-center shrink").append(cbGrad));

        let cbWo = $("<input type='checkbox'/>")
            .addClass('form-check-input big-checkbox')
            .prop('checked', (col.tryDitherWo === true))
            .on('input', function () {
                col.tryDitherWo = $(this).prop('checked');
            });
        if (advanced)
            tr.append($("<td></td>").addClass("text-center shrink").append(cbWo));

        let elementsToEnable = [inputName, inputColor, inputLetter, cbGrad, cbWo];
        function toggleAvailable(a) {
            if (a)
                tr.removeClass('bg-light');
            else
                tr.addClass('bg-light');

            $(elementsToEnable).each(function (index, elem) {
                elem.prop('disabled', !a);
            });
        }
        toggleAvailable(col.available);

        table.append(tr);
    });

    return table;
}
