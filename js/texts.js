function Txt(){}

// questionmark tooltip: returns jquery object for tooltip with specified text
function questionTt(text) {
    return fa("question-circle").addClass("text-secondary")
        .attr("title", text)
        .attr("data-toggle", 'tooltip')
        .attr("data-placement", "bottom");
}

Txt.gradText = "If checked, the color will be used as a part of dark-to-bright <b>gradient</b>. In this gradient, you might want to only keep one color per each brightness level, e.g. exclude <b>green</b> color because 1) it does not look great on portraits and 2) its brightness isn't different from blue color";
Txt.edText = "<b>Diffusion exclusion</b><br>Produce separate result with this color <b>excluded</b> from the palette. E.g. since green doesn't look great on portraits, mark it as DE and see diffusion variation without green.";
Txt.availableText = "Uncheck the colors you want to exclude";
Txt.editPixelByPixel = "Downloaded <i>.png</i> file is called <strong>miniature</strong>: each pixel represents a sticker on the cube. You can edit it pixel-by-pixel in your favourite image editor.<br>When you are finished, simply upload the edited miniature (drag-and-drop here or click \"New mosaic\").";
Txt.littleHintUnder = "Mouse wheel to zoom in/out. Drag the box or the background to move. Drag the bottom-right corner to resize.";

Txt.qaTitlesAndTexts = [
    "<h3 class='mt-4'>What is this?</h3>",
    "You might have seen artists creating pictures from hundreds or even thousands of Rubik's cubes. The main challenge of this art is converting a full-color photo into a 6-color pixelized version. This tool automates the entire process for you.",
    "<h3 class='mt-4'>Video tutorial</h3>",
    "<div class='text-center' id='videoTutorialWrap'></div>",
    "<h3 class='mt-4'>Does it work with black stickers?</h3>",
"Yes. Click the menu button in the top-right corner of the page, go to palette editor and enable black color. You can change colors as you wish.",
    "<h3 class='mt-4'>I prefer to make mosaic pictures myself. Can I use this website just to split it into sections?</h3>",
    "Yes. If you have your miniature picture ready (e.g. 60x90 pixel image to make 20x30 cubes mosaic), simply drag-and-drop it here as you would with normal pictures. The program will skip all adjustments and  directly take you to the \"Download PDF\" stage.",
    "<h3 class='mt-4'>Why some images produce much better mosaics than others?</h3>",
    "The quality of the source picture is important. A low-contrast photo taken in poor lighting conditions won't work. Beautifiers will also render the photo unsuitable, as they flatten some facial regions in a way that important facial feature information is lost. However, <b>grayscale pictures are fine</b>. It's definitely worth experimenting with source images to find the ones that work best.",
    "<h3 class='mt-4'>How does it even work?</h3>",
    "Great question! Check the <a href='https://github.com/Roman-/mosaic' target='_blank'>Github repository</a> for the explanation.",
    "<h3 class='mt-4'>I still have questions</h3>",
"Feel free to ask me anything in <a href='https://www.speedsolving.com/threads/bse-mosaic-new-cube-mosaic-building-software.76139/' target='_blank'>this speedsolving thread</a> and share your thoughts. I wish this tool will improve your experience in Mosaic building!<br>"];
