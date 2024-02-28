// @returns array of length numBorders
// @param scatter [0..1] how wide the range is. 1 for occupying the entire (0..255) scale
// @param position [0..1] where on the scale (0,255) this range is
function createUniformRange(numBorders, scatter, position) {
    let rangeLength = 255*scatter; // yes, for scatter=1 we won't see white nor blue colors
    let distance = rangeLength / (numBorders-1);
    let x0 = (255 - rangeLength) * position;

    let range = [];
    for (let i = 0; i < numBorders; ++i)
        range.push(Math.round(x0 + i*distance));
    return range;
}

// @returns initial set of ranges for gradient method. Return type = array of arrays (ranges).
// Number of ranges returned = positions.length * scatter.length, i.e. it creates a range for each position/scatter pair
// @param positions: array of range positions, e.g. [0.58, 0.66]
// @param scatters: array of range scatters, e.g. = [0.45, 0.38]
function initialRangePopulation(palette, positions, scatters) {
    let setOfRanges = [];
    positions.forEach(function (position) {
        scatters.forEach(function (scatter) {
            setOfRanges.push(createUniformRange(palette.length - 1, scatter, position));
        });
    });
    return setOfRanges;
}

// given chooseSet object (see glob.js) and selected option @param opt,
// @returns array of opts that are close to opt
// pre-requirement: opt is in chooseSet.opts
function populateOpts(chooseSet, opt) {
    // else assume opt is a float number in the array chooseSet.opts
    // and return an evenly spreaded array of [ opts[i-1], opts[i+1] ]
    // TODO remove hardcode
    const rightShift = 2; // if user has selected the last option, how wide should we extend the interval to the right?
    const amountOfOptions = 4;
    let index = chooseSet.opts.indexOf(opt);
    let min = (index === 0) ? (chooseSet.opts[0] - rightShift) : chooseSet.opts[index-1];
    const grainShouldBePositive = [Methods.ERROR_DIFFUSION, Methods.ATKINSON].indexOf(chooseSet.method) >= 0
    if (grainShouldBePositive && min < 0) {min = 0} // ERROR_DIFFUSION Grain can't be < 0
    let max = (index === chooseSet.opts.length-1) ? (opt+rightShift) : chooseSet.opts[index+1];
    let start = min + (max - min) / (amountOfOptions + 1) // ( |  |  | )
    let l = (max - min) / (amountOfOptions);

    let result = [];
    for (let o = start; o < max; o += l)
        result.push(o);
    return result;
}

// given a set of ranges for gradient method, returns array of new sets of ranges, slightly changed
function populateSetOfRanges(range) {
    // change = array [shrink_factor, shift (* 1/length)]
    let changes = [
        // original scale/offset is [1, 0]
        // widen
        [1.1, -0.1],
        [1.1, 0],
        // shift
        [1, -0.15],
        [1, 0.15],
        // shrink
        [0.9, -0.1],
        [0.9, -0.0],
        [0.9, 0.1],
        [0.9, 0.2],
    ];
    let x0 = range[0];
    let len = range[range.length - 1] - x0;

    let results = [];
    changes.forEach(function (shrinkShift) {
        let localRange = [];
        range.forEach(function (x) {
            let distanceFromx0 = (x - x0) * shrinkShift[0];
            localRange.push(x0 + distanceFromx0 + shrinkShift[1]*len);
        });
        results.push(localRange);
    });

    // shift mid-ranges: for each range except for left and right, shift it back and forth
    for (let i = 1; i < range.length-1; ++i) {
        // construct 2 new ranges: with handle[i] being shifted left and right
        let newRangeL = range.slice();
        newRangeL[i] -= (newRangeL[i] - newRangeL[i-1])/3;

        let newRangeR = range.slice();
        newRangeR[i] += (newRangeR[i+1] - newRangeR[i])/3;

        results.push(newRangeL);
        results.push(newRangeR);
    }

    // sort results by last element in array (white in gradient) so they appear from brightest to darkest
    results.sort(function (a, b) { return a[a.length-1] - b[b.length-1]; });

    return results;
}
