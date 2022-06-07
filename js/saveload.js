/// @param value stringified json object or standard type
/// @returns true if succeed
function saveLocal(name, value) {
    if (value === null)
        return;
    // If the platform supports localStorage, then save the value
    try {
        localStorage.setItem(name, value);
        return true;
    }
    catch(e) {
        // Most likely cause of errors is a very old browser that doesn't support localStorage (fail silently)
        console.warn("saving error");
        return false;
    }
}

/// @returns loaded value or specified defaultValue in case of error
function loadLocal(name, defaultValue) {
    // If the platform supports localStorage, then load the selection
    try {
        let result = localStorage.getItem(name);
        return (result === null) ? defaultValue : result;
    }
    catch(e) {
        // Either no selection in localStorage or browser does not support localStorage (fail silently)
        console.warn("can\'t load from localstorage");
        return defaultValue;
    }
}

// @returns loaded value as integer
function loadLocalInt(name, defaultValue) {
    let result = loadLocal(name, defaultValue);
    if (typeof result === 'string' || result instanceof String)
        result = parseInt(result);

    return (Number.isSafeInteger(result)) ? result : defaultValue;
}

// @returns loaded value as boolean
function loadLocalBool(name, defaultValue) {
    let result = loadLocal(name, defaultValue);
    if (typeof result === 'string' || result instanceof String) {
        if (result.toLowerCase() === 'true')
            return true;
        if (result.toLowerCase() === 'false')
            return false;
    }
    return defaultValue;
}
