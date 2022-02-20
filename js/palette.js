// palette is array of color object:
// {
//     available: if color is available
//     rgb: [r,g,b]
//     name: string - color name (used for PDF and visual)
//     notation: string (preferably 1 letter for PDF purposes)
//     grad: use this color in gradient method
//     tryDitherWo: if true, try dithering alg without this color (in Glob.chooseSets)
// }
// palette should be sorted dark-to-bright for grad method
Glob.defaultPalette = [
    {
        available: false,
        rgb: [000, 000, 000], // Black
        name: 'Black',
        notation: 'D',
        grad: true,
        tryDitherWo: false
    },
    {
        available: true,
        rgb: [000, 000, 255], // Blue
        name: 'Blue',
        notation: 'B',
        grad: true,
        tryDitherWo: true
    },
    {
        available: true,
        rgb: [000, 255, 000], // Green
        name: 'Green',
        notation: 'G',
        grad: false,
        tryDitherWo: true
    },
    {
        available: true,
        rgb: [255, 000, 000], // Red
        name: 'Red',
        notation: 'R',
        grad: true,
        tryDitherWo: false
    },
    /*
    {
        available: false,
        rgb: [255, 105, 180], // Pink
        name: 'Pink',
        notation: 'P',
        grad: true,
        tryDitherWo: true
    },
    */
    {
        available: true,
        rgb: [255, 153, 000], // Orange
        name: 'Orange',
        notation: 'O',
        grad: true,
        tryDitherWo: false
    },
    {
        available: true,
        rgb: [255, 255, 000], // Yellow
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

// returns new color to be inserted into pal
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

// returns array of RGBs of all available colors
function getFullPalette() {
    let result = [];
    Glob.palette.forEach(function (pal) {
        if (pal.available)
            result.push(pal.rgb);
    });
    return result;
}

// returns array of RGBs for gradient method
function getGradPalette() {
    let result = [];
    Glob.palette.forEach(function (c) {
        if (c.available && c.grad)
            result.push(c.rgb);
    });
    return result;
}

// returns array palettes to try out error diffusion method with
function getAllDitherPalettes() {
    let pals = [];
    let indeces = []; // indeces of colors to try out error diffusion without
    let pal = Glob.palette;

    for (let i = 0; i < pal.length; ++i) {
        if (pal[i].available  && pal[i].tryDitherWo) {
            indeces.push(i);
    }   }

    indeces.forEach(function (index) {
        // add to PALS palette of all colors except for index
        let currentPal = [];

        for (let i = 0; i < pal.length; ++i) {
            if (pal[i].available && i != index)
                currentPal.push(pal[i].rgb);
        }

        pals.push(currentPal);
    });
    return pals;
}

function resetColorNamesCache() {
    colorNameByRgb.colorMap = null;
    colorNameByRgb.letterMap = null;
}

// returns color name by its rgb value
// \param l - get letter (notation) instad of full color
// \param rgbJoined - rgb joined by semicolon
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

// returns palette editor div
function jqPaletteLay() {
    // displays Global.palette on the screen
    function updatePalOnScreen() {
        tableContainer.html(paletteToJqTable(Glob.palette, advanced));
        $('[data-toggle="tooltip"]').tooltip({html: true});
        resetColorNamesCache();
    }

    var advanced = false;
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
    let btnResetWrap = jqCol(btnReset, '16em').css('padding', colPadding);

    let btnDone = $("<button></button>")
        .html('Done')
        .addClass('btn btn-success m-1 form-control')
        .click(function () {
            let proceed = (null != Glob.img) && (Glob.cubeDimen > 0) && (Glob.imgFileName.length > 0);
            let returnLayout = proceed ? loChoose : loDropImage;
            showLoadingSpinner();
            setTimeout(returnLayout, 10);
        });
    let btnDoneWrap = jqCol(btnDone, 'none').css('padding', colPadding);

    var btnAdvanced = $("<button></button>")
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
    let btnAdvancedWrap = jqCol(btnAdvanced, '16em').css('padding', colPadding);

    var btnLoad = $("<button></button>")
        .html('Load from file&hellip;')
        .addClass('btn btn-outline-primary m-1 form-control')
        .click(function () {
            openLoadPalDialog(updatePalOnScreen);
        });
    let btnLoadWrap = jqCol(btnLoad, '12em').css('padding', colPadding).hide();

    var btnSave = $("<button></button>")
        .html('Download this palette')
        .addClass('btn btn-outline-primary m-1 form-control')
        .click(function () {downloadPlainText(JSON.stringify(Glob.palette), "My palette.pal")})
    let btnSaveWrap = jqCol(btnSave, '16em').css('padding', colPadding).hide();

    var btnAddColor = $("<button></button>")
        .html('<i class="fa fa-plus"></i> Add color')
        .addClass('btn btn-outline-primary m-1 form-control')
        .click(function () {
            Glob.palette.push(newColor());
            updatePalOnScreen();
        });
    let btnAddColorWrap = jqCol(btnAddColor, '12em').css('padding', colPadding).hide();

    panel.append(btnResetWrap, btnAddColorWrap, btnAdvancedWrap, btnSaveWrap, btnLoadWrap, btnDoneWrap);

    var tableContainer = $("<div></div>");
    updatePalOnScreen();

    div.append(tableContainer, panel);

    return div;
}

// load palette from file
// \param onSuccess - callback on successful palette update
function openLoadPalDialog(onSuccess) {
    let fileInput = $('<input id="csvFileInput" type="file" style="display: none;" accept=".pal" hidden/>')
        .change(function () {onUploadPalFile($(this), onSuccess)})
        .trigger('click')
}

// on (palette) file upload changed
function onUploadPalFile(fileinput, onSuccess) {
    // indicate that loading palette has been failed
    function palFail(msg) {
        showBsModal(msg, 'Failed to load palette');
    }

    var file = fileinput[0].files[0];
    var reader  = new FileReader();
    reader.addEventListener("load", function () {
        let paletteName = filenameFromPath(file.name);
        let jsonString = reader.result;
        try {
            let json = JSON.parse(jsonString);
            let validationRes = validateJsonPal(json);
            if (validationRes.valid == false)
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


// returns true if palette in JSON format is valid. Helpful for checking loaded palette
// returns object {valid: boolean; msg: string}: msg is reason why invalid
function validateJsonPal(pal) {
    function nope(reason) {
        return {"valid": false, "msg": reason};
    }

    if (!Array.isArray(pal))
        return nope("Is not array");

    if (pal.length == 0)
        return nope("Empty palette");

    const properties = ["available", "rgb", "name", "grad", "tryDitherWo"];
    for (let i = 0; i < pal.length; ++i) {
        let c = pal[i];
        // check for all properties
        for (let j = 0; j < properties.length; ++j) {
            let prop = properties[j];
            if (!c.hasOwnProperty(prop))
                return nope("Color #" + i + " doesn't have property \"" + prop + "\"");
        }
        // check if color is rgb
        if (!Array.isArray(c["rgb"]) || c["rgb"].length != 3
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
        if (typeof c["available"] !== "boolean"
                || typeof c["grad"] !== "boolean"
                || typeof c["tryDitherWo"] !== "boolean")
            return nope("boolean types are not boolean on color #" + i);
    }

        return {valid: true};
}

// \param pal - palette in JSON format (see Glob.palette)
// \param advanced = show advanced options
function paletteToJqTable(pal, advanced = false) {
    let table = $("<table class='table'></table>");

    let headersHtml = "<th>Available "+questionTt(Txt.availableText)+"</th><th>Name</th><th>Value</th>";

    if (advanced) {
        headersHtml += "<th>Letter</th>"+
                "<th>Use in gradient "+questionTt(Txt.gradText)+"</th><th>Try ED "+questionTt(Txt.edText)+"</th>";
    }

    table.append($("<tr>" + headersHtml + "</tr>"));
    // insert tr
    pal.forEach(function (col) {
        let tr = $("<tr></tr>");

        var cbAllow = $("<input type='checkbox'/>")
            .addClass('form-control')
            .prop('checked', col.available)
            .attr('title', 'Use this color')
            .on('input', function () {
                col.available = $(this).prop('checked');
                toggleAvailable(col.available);
            });
        tr.append($("<td></td>").append(cbAllow));

        var inputName = $("<input type='text'/>")
            .val(col.name)
            .attr('size', 25)
            .attr('title', 'Latin letters only')
            .attr('placeholder', 'Unique color name')
            .addClass('form-control')
            .on('input', function () {
                let newName = $(this).val();
                if (newName.length > 0 && newName.length < 25 && newName.match(/^[A-Za-z]*$/g)) {
                    col.name = newName;
                    $(this).removeClass('border border-danger');
                    resetColorNamesCache();
                } else {
                    $(this).addClass('border border-danger');
                }
            });
        tr.append($("<td></td>").append(inputName));

        let jqCol = jQuery.Color(col.rgb)
        var inputColor = $("<input type='color'/>")
            .addClass('form-control')
            .val(jqCol.toHexString())
            .attr('title', 'Edit color')
            .on('input', function () {
                let c = jQuery.Color($(this).val());
                col.rgb = [c.red(), c.green(), c.blue()]
            });
        tr.append($("<td></td>").append(inputColor));

        var inputLetter = $("<input type='text'/>")
            .val(col.notation)
            .attr('size', 5)
            .attr('title', 'Short name (notation)')
            .attr('placeholder', 'Notation')
            .addClass('form-control')
            .on('input', function () {
                let newNotation = $(this).val();
                if (newNotation.length < 5 && newNotation.match(/^[A-Za-z]*$/g)) {
                    col.notation = newNotation;
                    $(this).removeClass('border border-danger');
                    resetColorNamesCache();
                } else {
                    $(this).addClass('border border-danger');
                }
            });
        if (advanced)
            tr.append($("<td></td>").append(inputLetter));

        var cbGrad = $("<input type='checkbox'/>")
            .addClass('form-control')
            .prop('checked', col.grad)
            .on('input', function () {
                col.grad = $(this).prop('checked');
            });
        if (advanced)
            tr.append($("<td></td>").append(cbGrad));

        var cbWo = $("<input type='checkbox'/>")
            .addClass('form-control')
            .prop('checked', col.tryDitherWo)
            .on('input', function () {
                col.tryDitherWo = $(this).prop('checked');
            });
        if (advanced)
            tr.append($("<td></td>").append(cbWo));

        var elementsToEnable = [inputName, inputColor, inputLetter, cbGrad, cbWo];
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
