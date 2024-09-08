PdfComposer = {};
PdfComposer.pt2mm = 25.4 / 72; // point to millimeter ratio
PdfComposer.fontFace = "helvetica";
PdfComposer.fontFaceMono = "courier";

// @returns object: {name: string; row: string; column: string}
function blockNameL(row, col, numBlocksHeight) {
    let letter = String.fromCharCode(65 + col);
    let number = '' + (numBlocksHeight - row);
    return {
        row: number,
        column: letter,
        name: (letter + number),
    };
}

function generatePdf() {
    var doc = new jsPDF('portrait', 'mm', "a4");
    doc.setFontSize(22);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const blockWidthCubes = Glob.blockWidthCubes;
    const blockHeightCubes = Glob.blockHeightCubes;
    const pageMargin = pageWidth * 0.07; // space from page bottoms
    const areaBlock = blockDrawArea(doc);
    const areaMiniautre = miniatureDrawArea(doc)['mini'];
    const nmRect = miniatureDrawArea(doc)['blockName'];
    Glob.pdfProgress = 0;

    let numBlocksWidth = Math.ceil(Glob.pixelWidth / Glob.cubeDimen / blockWidthCubes);
    let numBlocksHeight = Math.ceil(Glob.pixelHeight / Glob.cubeDimen / blockHeightCubes);

    // first page, first block
    drawTitlePage(doc, numBlocksWidth, numBlocksHeight, blockWidthCubes, blockHeightCubes, titlePicDrawArea(doc).imageArea);
    doc.setFont(PdfComposer.fontFace);
    drawDocHeader(doc, titlePicDrawArea(doc).headerArea)
    drawDocFooter(doc, titlePicDrawArea(doc).footerArea)

    // bottom-top
    var biBegin = Glob.bottomToTop ? numBlocksHeight-1 : 0;
    var biLast = Glob.bottomToTop ? -1 : numBlocksHeight; // non-inclusive. For-loop stops on this val
    var biInc = Glob.bottomToTop ? -1 : 1; // inclusive
    // sanity check
    if ((biLast - biBegin)/biInc <= 0) {
        return console.error("bottom-top sanity check failed", biBegin, biLast, biInc);
    }

    for (let blockI = biBegin; blockI !== biLast; blockI += biInc) { // i = row, denoted with digit
        for (let blockJ = 0; blockJ < numBlocksWidth; blockJ++) {
            doc.addPage();
            // drawing block #(blockI, blockJ)
            doc.setTextColor(0);
            drawMiniature(doc, blockI, blockJ, blockWidthCubes, blockHeightCubes, areaMiniautre, true);
            drawMiniRect(doc,  blockI, blockJ, blockWidthCubes, blockHeightCubes, areaMiniautre);
            drawTextInRect(doc, blockNameL(blockI, blockJ, numBlocksHeight).name, false, nmRect.x, nmRect.y,
                    nmRect.width, nmRect.height);
            drawCubesBlock(doc, blockI, blockJ, blockWidthCubes, blockHeightCubes, areaBlock);

            Glob.pdfProgress += 1/(numBlocksWidth * numBlocksHeight);
        }
    }
    // Output as Data URI
    terminatePdf(doc);
}

// @param drawAreaRect - where to draw the block: {x,y,width, height}
// @param blockWidthCubes: how many cubes are in one blocks (width)
function drawCubesBlock(doc, blockI, blockJ, blockWidthCubes, blockHeightCubes, drawAreaRect) {
    let stickerSize = Math.min(drawAreaRect.width / Glob.cubeDimen / blockWidthCubes,
                              drawAreaRect.height / Glob.cubeDimen / blockHeightCubes );
    const cubeSize = Glob.cubeDimen * stickerSize;

    for (let cubeI = 0; cubeI < blockHeightCubes; cubeI++) {
        for (let cubeJ = 0; cubeJ < blockWidthCubes; cubeJ++) {
            // draw one cube
            let cubePosX = drawAreaRect.x + cubeJ * cubeSize;
            let cubePosY = drawAreaRect.y + cubeI * cubeSize;

            doc.setLineWidth(1);
            doc.setDrawColor(100, 100, 100);

            // coordinates of top-left pixel of a cube

            let cubeX = blockJ * blockWidthCubes * Glob.cubeDimen + cubeJ * Glob.cubeDimen;
            let cubeY = blockI * blockHeightCubes * Glob.cubeDimen + cubeI * Glob.cubeDimen;

            // draw stickers
            for (let stickerI = 0; stickerI < Glob.cubeDimen; stickerI++) {
                for (let stickerJ = 0; stickerJ < Glob.cubeDimen; stickerJ++) {
                    // draw sticker. x,y are pixel coordinates
                    let x = cubeX + stickerJ;
                    let y = cubeY + stickerI;
                    if (x < Glob.imageData.width && y < Glob.imageData.height) {
                        let rgb = getRgbOfPixel(Glob.imageData, x, y);
                        if (Glob.pdfBwPrinter)
                            doc.setFillColor(255, 255, 255);
                        else
                            doc.setFillColor(rgb[0], rgb[1], rgb[2]);

                        // if rgb is too dark, make colors brighter otherwise we won't see separators
                        doc.rect(cubePosX + stickerJ * stickerSize, cubePosY + stickerI * stickerSize,
                                stickerSize, stickerSize, 'FD');

                        // letter inside square
                        if (Glob.pdfDrawLetters) {
                            let bgIsDark = (rgb[0] + rgb[1] + rgb[2] < 128);
                            let letterRgb;
                            if (Glob.pdfBwPrinter) {
                                let brightness = bgIsDark ? 255 : 0; // dark on bright BG and vice-versa
                                letterRgb = [brightness, brightness, brightness];
                            } else {
                                // smooth color
                                const addValue = 30;
                                letterRgb = [
                                    clamp(rgb[0] + (bgIsDark ? addValue : -addValue), 0, 255),
                                    clamp(rgb[1] + (bgIsDark ? addValue : -addValue), 0, 255),
                                    clamp(rgb[2] + (bgIsDark ? addValue : -addValue), 0, 255),
                                ];
                            }
                            const padding = stickerSize/10;
                            let rect = {x: cubePosX + stickerJ * stickerSize + padding,
                                        y: cubePosY + stickerI * stickerSize + padding,
                                        w: stickerSize - 2*padding, h: stickerSize - 2*padding};
                            doc.setTextColor(letterRgb[0], letterRgb[1], letterRgb[2]);
                            let letter = colorNameByRgb(rgb.join(';'), true);
                            drawTextInRect(doc, letter, true, rect.x, rect.y, rect.w, rect.h);
                        }
                    }
                }
            }

            if (Glob.cubeDimen > 1 && cubeX < Glob.imageData.width && cubeY < Glob.imageData.height) {
                // outline this cube
                doc.setDrawColor(0);
                doc.setLineWidth(2);
                doc.rect(cubePosX, cubePosY, cubeSize, cubeSize, 'D'); //Fill and Border = FD
            }
        }
    }
}

function terminatePdf(doc) {
    doc.output('datauristring');
    doc.save("Mosaic "+Glob.imgFileName.split('.')[0]+' '+getCurrentDateString()+".pdf");
    Glob.pdfProgress = null;
}

// draws the text in the center of the rect
// @param textUrl - if set, make a hyperlink instead
function drawTextInMidRect(doc, text, rect, textSize, textUrl = null) {
    doc.setFontSize(textSize);
    // instead of text width, calc width of max line
    let unitWidth = 0;
    text.split('\n').forEach(function (s) {
        let w = doc.getStringUnitWidth(s);
        if (w > unitWidth)
            unitWidth = w;
    });
    let realTextWidth = unitWidth * textSize * PdfComposer.pt2mm;
    let x = rect.x + (rect.width - realTextWidth)/2;
    let y = rect.y + rect.height/2;

    if (!textUrl)
        doc.text(x, y, text);
    else
        doc.textWithLink(text, x, y, {url: textUrl});
}

function drawTextInRect(doc, text, centered, x, y, rectWidth, rectHeight) {
    // adjust Text size based on rectWidth
    var realTextWidth = Infinity;
    var textSize = Math.ceil(rectHeight / PdfComposer.pt2mm);// + 1;
    var oldTextSize = textSize;

    do {
        textSize--;
        doc.setFontSize(textSize);
        realTextWidth = doc.getStringUnitWidth(text) * textSize * PdfComposer.pt2mm;
    } while (realTextWidth > rectWidth);


    if (centered) {
        x -= (realTextWidth - rectWidth)/2;
    }
    y += (textSize + (oldTextSize-textSize)/2) * PdfComposer.pt2mm;

    doc.text(x, y, text);
}

function drawMiniature(doc, blockI, blockJ, blockWidthCubes, blockHeightCubes, rect, border = false) {
    doc.addImage(Glob.canvas[0].toDataURL(), 'PNG', rect.x, rect.y, rect.width, rect.height, 'minia', 'NONE', 0);
    if (border) {
        doc.setLineWidth(0.5);
        doc.setDrawColor(200, 200, 200);
        doc.rect(rect.x, rect.y, rect.width, rect.height, 'D'); //Fill and Border = FD
    }
}

// @returns area where on the page we draw the cubes block
function blockDrawArea(doc) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageMargin = pageWidth * 0.07; // space from page bottoms
    const heightNoMargin = pageHeight - 2*pageMargin;
    const splitCoeff = 0.3; // block starts at 0.3 * page width;
    return {
        x: pageMargin,
        y: pageMargin + splitCoeff * heightNoMargin,
        width: (pageWidth - 2*pageMargin),
        height: heightNoMargin * (1-splitCoeff)
    };
}

// @returns area where on the page we draw the cubes block
// leave 15% from both sides
// @returns object with rects: {imageArea, headerArea, footerArea}
function titlePicDrawArea(doc) {
    const topMarginCoeff = 0.15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageMargin = pageWidth * 0.07; // space from page bottoms
    const heightNoMargin = pageHeight - 2*pageMargin;
    let imageArea = {
        x: pageMargin,
        y: pageMargin + topMarginCoeff * heightNoMargin,
        width: pageWidth - 2*pageMargin,
        height: pageHeight - 2*pageMargin - (2 * topMarginCoeff) * heightNoMargin // 0.15 from the top and the bottom
    };
    let headerArea = {
        x: pageMargin,
        y: pageMargin,
        width: pageWidth - 2*pageMargin,
        height: (topMarginCoeff) * heightNoMargin * 0.9
    };
    let footerHeight = topMarginCoeff * heightNoMargin * 0.9;
    let footerArea = {
        x: pageMargin,
        y: pageHeight - pageMargin - footerHeight,
        width: pageWidth - 2*pageMargin,
        height: footerHeight
    };
    return {
        'imageArea': imageArea,
        'headerArea': headerArea,
        'footerArea': footerArea,
    };
}

// @returns object {mini: miniatureRect; blockName: blockNameRect} area where on the page we draw miniature
function miniatureDrawArea(doc) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageMargin = pageWidth * 0.07; // space from page bottoms
    const heightWoMargin = pageHeight - 2*pageMargin;
    const splitCoeff = 0.3; // block starts at 0.3 * page width;
    const allowedWidth = (pageWidth - 2*pageMargin) * 0.5; // 0.5 of page width
    const allowedHeight = splitCoeff * heightWoMargin * 0.95; // from the top of the page; 0.95 specifies magin to cubes block

    let calcWidth = allowedHeight / Glob.pixelHeight * Glob.pixelWidth;
    let calcHeight = allowedWidth / Glob.pixelWidth * Glob.pixelHeight;

    let areaMini = {
        x: pageMargin,
        y: pageMargin,
        width: allowedWidth,
        height: calcHeight
    };
    if (calcHeight > allowedHeight) {
        areaMini = {
            x: pageMargin,
            y: pageMargin,
            width: calcWidth,
            height: allowedHeight
        }
    }

    let areaBlockName = {
        x: pageMargin + areaMini.width,
        y: pageMargin,
        width: allowedWidth,
        height: allowedHeight
    };

    return {
        'mini': areaMini,
        'blockName': areaBlockName
    };
}

// draws rectangle on top of the miniature
function drawMiniRect(doc, blockI, blockJ, blockWidthCubes, blockHeightCubes, areaMiniautre) {
    let pxInSticker = areaMiniautre.width / Glob.imageData.width;
    // outline this cube
    let bw = blockWidthCubes * Glob.cubeDimen * pxInSticker;
    let bh = blockHeightCubes * Glob.cubeDimen * pxInSticker;
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(2);
    doc.rect(areaMiniautre.x + blockJ * bw, areaMiniautre.y + blockI * bh, bw, bh, 'D');
    doc.setDrawColor(0);
    doc.setLineWidth(1);
    doc.rect(areaMiniautre.x + blockJ * bw, areaMiniautre.y + blockI * bh, bw, bh, 'D'); //Fill and Border = FD
}

function drawDocHeader(doc, rect) {
    doc.setFontSize(26);
    let cw = Glob.pixelWidth / Glob.cubeDimen;
    let ch = Glob.pixelHeight / Glob.cubeDimen;
    let text = '' + cw + 'x' + ch + ' = ' + (cw*ch) + (Glob.cubeDimen === 1 ? ' pixels' : ' cubes');

    drawTextInMidRect(doc, text, rect, 26)
}

function drawDocFooter(doc, rect) {
    let cw = Glob.pixelWidth / Glob.cubeDimen;
    let ch = Glob.pixelHeight / Glob.cubeDimen;
    let additionalText =
          Glob.hideWebsiteInfo
        ? 'Made with <3 by Roman Strakhov'
        : 'Bestsiteever Mosaic builder - free software by Roman Strakhov' + '\nhttps://bestsiteever.net/mosaic';

    let text = nearlySolvedCubesText();
    text += additionalText;
    drawTextInMidRect(doc, text, rect, 12)
}

// @param drawAreaRect - where to draw the block: {x,y,width, height}
// @param blockWidthCubes: how many cubes are in one blocks (width)
function drawTitlePage(doc, numBlocksWidth, numBlocksHeight, blockWidthCubes, blockHeightCubes, drawAreaRect) {
    let lettersMargin = drawAreaRect.width * 0.1; // margin for letters
    let rect = {
        x: drawAreaRect.x + lettersMargin,
        y: drawAreaRect.y + lettersMargin,
        width: drawAreaRect.width - 2 * lettersMargin,
        height: drawAreaRect.height - 2 * lettersMargin,
    };

    let stickerSize = Math.min(rect.width / Glob.imageData.width,
                               rect.height / Glob.imageData.height);

    // adjust rects
    let emptyHorSpace = rect.width - (stickerSize * Glob.imageData.width);
    rect.x += emptyHorSpace/2;
    rect.width -= emptyHorSpace;
    let emptyVerSpace = rect.height - (stickerSize * Glob.imageData.height);
    rect.y += emptyVerSpace/2;
    rect.height -= emptyVerSpace;

    // drawing pixelwise pic
    doc.setLineWidth(stickerSize/20);
    doc.setDrawColor(150, 150, 150);
    for (let i = 0; i < Glob.imageData.height; i++) {
        for (let j = 0; j < Glob.imageData.width; j++) {
            let rgb = getRgbOfPixel(Glob.imageData, j, i);
            doc.setFillColor(rgb[0], rgb[1], rgb[2]);
            doc.rect(rect.x + j * stickerSize, rect.y + i * stickerSize, stickerSize, stickerSize, 'FD');
        }
    }

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    // vertical lines
    doc.setFont(PdfComposer.fontFaceMono);
    let blockWidthPixels = (blockWidthCubes * Glob.cubeDimen);
    for (let px = 0; px <= Glob.imageData.width; px += blockWidthPixels) {
        let lineX = rect.x + px * stickerSize;
        doc.line(lineX, drawAreaRect.y, lineX, drawAreaRect.y + drawAreaRect.height);

        // text (letter)
        if (px < Glob.imageData.width) {
            let text = blockNameL(0, px/blockWidthPixels, numBlocksHeight).column;
            drawTextInRect(doc, text, true, lineX, rect.y - lettersMargin*1.1, blockWidthPixels * stickerSize, lettersMargin*0.9);
            drawTextInRect(doc, text, true, lineX, rect.y + rect.height, blockWidthPixels * stickerSize, lettersMargin*0.9);
        }
    }
    // horisontal lines
    let blockHeightPixels = (blockHeightCubes * Glob.cubeDimen);
    for (let py = 0; py <= Glob.imageData.height; py += blockHeightPixels) {
        let lineY = rect.y + py * stickerSize;
        doc.line(drawAreaRect.x, lineY, drawAreaRect.x + drawAreaRect.width, lineY);

        // text (number)
        if (py < Glob.imageData.height) {
            let text = blockNameL(py/blockHeightPixels, 0, numBlocksHeight).row;
            let fontSize = 20;
            doc.setFontSize(fontSize);
            let textHeight = fontSize * PdfComposer.pt2mm;
            doc.text(rect.x - textHeight * (0.5 + text.length * 0.5), lineY + textHeight, text);
            doc.text(rect.x + rect.width + textHeight/6, lineY + textHeight, text);
        }
    }
}

// Counts near-pure cubes (solved, 1-away and 2-away) and @returns string describing how many near-pure cubes are needed
function nearlySolvedCubesText() {
    const numberFill = Glob.cubeDimen * Glob.cubeDimen;
    let allCubes = {}; // {"0;255;0": 6; "255;128;0-almost": 2; ...}
    for (let i = 0; i < Glob.pixelWidth; i += Glob.cubeDimen) {
        for (let j = 0; j < Glob.pixelHeight; j += Glob.cubeDimen) {
            // i, j are coordinates of top-left pixel of a cube
            let thisCubeCols = {};
            for (let pi = i; pi < i + Glob.cubeDimen; pi++) {
                for (let pj = j; pj < j + Glob.cubeDimen; pj++) {
                    if (getRgbOfPixel(Glob.imageData, pi, pj)[0] === -1) {
                        console.warn("nearlySolvedCubesText: get pixel data: i = ", i, ", j = ", j, ", pi = ", pi, ", pj = ", pj);
                    }
                    let rgbJoined = getRgbOfPixel(Glob.imageData, pi, pj).join(";");
                    if (!thisCubeCols[rgbJoined])
                        thisCubeCols[rgbJoined] = 1;
                    else
                        thisCubeCols[rgbJoined]++;
                }
            }
            // count
            $.each(thisCubeCols, function(color, num) {
                // near-pure cubes are -2
                if (num >= numberFill - 2) {
                    let colorName = colorNameByRgb(color, false);
                    // there are cube is colored in "color"
                    if (!allCubes[colorName])
                        allCubes[colorName] = 1;
                    else
                        allCubes[colorName]++;
                }
            });
        }
    }

    if (allCubes.length === 0)
        return "";

    let stringArr = [];
    $.each(allCubes, function(color, num) {
        stringArr.push(num + " " + color);
    });

    let result = (Glob.cubeDimen === 1) ? "Pixels: " : "Solved (or almost solved) cubes: "
    for (let i = 0; i < stringArr.length; i++) {
        const comma = (i === stringArr.length - 1) ? ""
            : ((i > 0 && i % 6 === 0) ? ",\n  " : ", ");
        result += stringArr[i] + comma;
    }

    return result + ".\n";
}
