// Please forgive my javascript, I am but a humble systems programmer unfamiliar with your j-ways.
console.log("position:gtfo start");

// HashSet of css rules & element styles that have had trash stylings.
var effed_off_styles = new Set();

function scan_css_for_trash() {
    //var css = window.styleSheets, rules;
    var css = document.styleSheets;
    if (!css) return;

    for (var i in css) { // FIXME: forEach
        if (typeof css[i] === "object") {
            try {
                var rules = css[i].rules || css[i].cssRules;
            } catch (e) {
                continue;
            }
            scan_for_trash(rules);
        }
    }
}

function scan_dom_for_trash() {
    scan_element_for_trash(document.head);
    scan_element_for_trash(document.body);
}

function scan_element_for_trash(e) {
    if (!e) return;
    scan_for_trash(e.style);
    if (e.sheet) {
        var sheet = e.sheet.rules || e.sheet.cssRules;
        scan_for_trash(sheet);
    }
    if (!e.children) return;
    for (var i in e.children) {
        scan_element_for_trash(e.children[i]);
    }
}

function needs_to_gtfo(style) {
    if (!style) {
        return false;
    }
    return style.position == "fixed" || style.position == "sticky";
}

function scan_for_trash(rules) {
    if (!rules) { return; }
    for (var i = 0; i < rules.length; i++) {
        var rule = rules[i];
        if (rule && needs_to_gtfo(rule.style)) {
            effed_off_styles.add(rule.style);
        }
    }
}

function update_sinners() {
    console.log("effed_off_styles: ", effed_off_styles);
    effed_off_styles.forEach(function(style) {
        console.log("Checking sinner ", style);
        if (needs_to_gtfo(style)) {
            your_style_is_trash(style);
        }
    });
}



function your_style_is_trash(style) {
    // style.display = "none";
    style.border = "5px solid cyan";
    style.opacity = "0.5";
}

var body_observer_config = {
    "childList": true,
    "attributes": true,
    "subtree": true,
    "attributeFilter": ["style"]
};
var body_observer = new MutationObserver(function(mutations, observer) {
    pause_observers();
    try {
        mutations.forEach(function(mutation) {
            if (mutation.target.style.position != "fixed") return;
            effed_off_styles.add(mutation.target.style);
            your_style_is_trash(mutation.target.style);
        });
    } catch (e) {
        console.log(e);
    }
    resume_observers();
});

var stylesheet_observer_config = {
    "childList": true,
};
var stylesheet_observer = new MutationObserver(function(mutations, observer) {
    var any_change = false;
    console.log("mutation", mutations);
    mutations.forEach(function(mutation) {
        for (var i = 0; i < mutation.addedNodes.length; i++) {
            var node = mutation.addedNodes[i];
            if ((node.nodeName == "LINK" && node.rel == "stylesheet") || (node.nodeName == "STYLE")) {
                any_change = true;
                // FIXME: Just do it now?
            }
        }
    });
    if (any_change) {
        check_all();
    }
});

function pause_observers() {
    body_observer.disconnect();
    stylesheet_observer.disconnect();
}

function resume_observers() {
    var bod = document.body || document; // might not have document.body when very early
    if (bod) {
        body_observer.observe(bod, body_observer_config);
    }
    if (document.head) {
        stylesheet_observer.observe(document.head, stylesheet_observer_config);
    }
}

resume_observers();
function check_all() {
    pause_observers();
    scan_css_for_trash();
    scan_dom_for_trash();
    update_sinners();
    resume_observers();
}
window.onload = check_all;
document.onload = check_all;
document.onclick = check_all;

// resource://gre/modules/ExtensionContent.jsm -> moz-extension://87324442-0a91-49b5-b84e-b1aecf07adc6/gtfo.js



// Allow position:fixed to appear after anything has been clicked?
// Some classess should be whitelisted depending on domain?
// Anything that has position:fixed should perhaps have its node moved to the front? Uh. Like, the issue is if there's a thing at the bottom, but it's an infinite page.
// Okay, here we go.
// We add our own nice li'l position:fixed element ;)
// It's a button. If hovered over, it reveals everything that is position:fixed.
//
//
// https://developer.mozilla.org/en-US/docs/Web/API/MutationRecord

// If a user has manually navigated to a webpage using a bookmark or by typing in the URL, they are probably interested enough in the webpage to want to see the stuff.
// Some pages might emulate position:fixed by using position:absolute & animating it downwards. (position: absolutely not?)

console.log("position:gtfo ran");
