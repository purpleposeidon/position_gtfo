
var gtfo = "relative"; // Unfortunately 'style.position = "gtfo"' does not work in all contexts, so we use this hack instead.

// HashSet of style objects that are/were position:fixed
var known_sinners = new Set();

function scan_css() {
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
            scan_for_sin(rules);
        }
    }
}

function scan_dom() {
    scan_element(document.body);
}

function scan_element(e) {
    if (!e) return;
    scan_for_sin(e.style);
    if (!e.children) return;
    for (var i in e.children) {
        scan_element(e.children[i]);
    }
}

function scan_for_sin(rules) {
    if (!rules) { return; }
    for (var i = 0; i < rules.length; i++) {
        var rule = rules[i];
        if (!rule.style) continue;
        if (rule.style.position == "fixed" || rule.style.position == "sticky") {
            known_sinners.add(rule.style);
        }
    };
}

function update_sinners() {
    console.log("known_sinners: ", known_sinners);
    Object.keys(known_sinners).forEach(function(rule) {
        if (!typeof rule === "object") {
            return;
        }
        console.log("Checking sinner ", rule);
        if (rule.style.position == "fixed" || rule.style.position == "sticky") {
            update_style(rule.style);
        }
    });
}



function update_style(style) {
    style.position = gtfo;
    style.border = "5px solid orange";
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
            known_sinners.add(mutation.target.style);
            update_style(mutation.target.style);
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
    mutations.forEach(function(mutation) {
        for (var i = 0; i < mutation.addedNodes.length; i++) {
            var node = mutation.addedNodes[i];
            if ((node.nodeName == "LINK" && node.rel == "stylesheet") || (node.nodeName == "STYLE")) {
                any_change = true;
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
    body_observer.observe(document.body || document /* might not have document.body when very early */, body_observer_config);
    stylesheet_observer.observe(document.head, stylesheet_observer_config);
}

resume_observers();
function check_all() {
    pause_observers();
    scan_css();
    scan_dom();
    update_sinners();
    resume_observers();
}
// the script runs very early, so probably little happens here.
check_all();
document.onload = check_all;
document.body.onclick = check_all;

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
// Some pages might emulate position:fixed by using position:absolute & animating it downwards.
