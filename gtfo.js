// Please forgive my javascript, I am but a humble systems programmer unfamiliar with your j-ways.
// FIXME: "use strict";

// HashSet of css rules & element styles that have had trash stylings.
// FIXME: Copy the selectors into our own stylesheet?
var effed_off_styles = new Set();
// If this is true, we must check computedStyles, which can be very slow.
var requires_security_hack = false;
var trash_styles = 0;
var trash_elements = 0;
var trash_class =  "trash_" + Math.random().toString(36).substring(2);
var trusted_css = undefined;
var badge_needs_update = true;

function alert_security_droids(error) {
    if (!requires_security_hack && error.name == "SecurityError") {
        requires_security_hack = true;
        var trusted_style = document.createElement("style");
        trusted_style.type = "text/css"
        trusted_style.innerHTML = "." + trash_class + " { display: none; }";
        document.head.appendChild(trusted_style);
        trusted_css = trusted_style.sheet;
        effed_off_styles.add(trusted_css.cssRules[0].style);
        badge_needs_update = true;
    }
}

function set_foul_trash_display(show) {
    effed_off_styles.forEach(style => {
        if (show) {
            style.display = "";
        } else {
            style.display = "none";
        }
    });
}

function scan_css_for_trash() {
    // FIXME: This isn't necessary, right? We'll get to them from document.head?
    /*
    //var css = window.styleSheets, rules;
    var css = document.styleSheets;
    if (!css) return;

    for (var i in css) { // FIXME: forEach
        if (typeof css[i] === "object") {
            try {
                var rules = css[i].rules || css[i].cssRules;
            } catch (err) {
                alert_security_droids(err);
            }
            scan_for_trash(rules);
        }
    }
    */
}

function scan_dom_for_trash() {
    scan_element_for_trash(document.head);
    scan_element_for_trash(document.body);
}

function scan_element_for_trash(element) {
    if (!element) return;
    scan_for_trash(element.style);
    if (element.sheet) {
        try {
            // wait, wtf, this works? Do the JS guys not know how scopes work?
            var sheet = element.sheet.rules || element.sheet.cssRules;
        } catch (err) {
            alert_security_droids(err);
        }
        scan_for_trash(sheet);
    }
    if (requires_security_hack && element.classList && element.classList.length > 0) {
        var style = window.getComputedStyle(element);
        if (needs_to_gtfo(style)) {
            your_element_it_is_trash(element);
        }
    }
    if (!element.children) return;
    for (var i in element.children) {
        scan_element_for_trash(element.children[i]);
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

function your_style_it_is_trash(style) {
    style.display = "none";
    // style.border = "5px solid cyan";
    // style.opacity = "0.5";
}

function your_element_it_is_trash(element) {
    // function takes care of dupes
    element.classList.add(trash_class);

    //your_style_it_is_trash(element.style);
    trash_elements += 1;
    badge_needs_update = true;
}

function update_sinners() {
    effed_off_styles.forEach(function(style) {
        if (needs_to_gtfo(style)) {
            your_style_it_is_trash(style);
            trash_styles += 1;
            badge_needs_update = true;
        }
    });
}




// https://developer.mozilla.org/en-US/docs/Web/API/MutationRecord
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
            if (!needs_to_gtfo(mutation.target.style)) return;
            effed_off_styles.add(mutation.target.style);
            your_style_it_is_trash(mutation.target.style);
        });
    } catch (e) {
        console.log("body_observer: " + e);
    } finally {
        resume_observers();
    }
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

function check_body_scrolling() {
    if (trash_styles == 0 && trash_elements == 0) return;
    try {
        if (document.body.style.overflow == "hidden") {
            document.body.style.overflow = "visible";
        }
    } catch (e) {
        console.log("check_body_scrolling: " + e);
    }
}

function update_background_script() {
    browser.runtime.sendMessage({
        trash_styles,
        trash_elements,
        requires_security_hack,
        trash_visible,
    });
}

resume_observers();
function check_all() {
    pause_observers();
    scan_css_for_trash();
    scan_dom_for_trash();
    update_sinners();
    check_body_scrolling();
    resume_observers();
    if (badge_needs_update) {
        badge_needs_update = false;
        update_background_script();
    }
}

// FIXME: Which? Both? Uh?
window.onload = check_all;
document.onload = check_all;

var trash_visible = false;
browser.runtime.onMessage.addListener((message, sender, reply) => {
    if (message.toggle) {
        trash_visible = !trash_visible;
        set_foul_trash_display(trash_visible);
        update_background_script();
    }
    if (message.update) {
        update_background_script();
    }
});


// Sometimes the user'll want to actually see stuff, eg menu bars.
// Probably the way to go is to have the trash start out visible, and then fade out.
// So, CSS animations?
// And there'll be a toolbar button to toggle them on & off.
//

// If a user has manually navigated to a webpage using a bookmark or by typing in the URL, they are probably interested enough in the webpage to want to see the stuff.
// Some pages might emulate position:fixed by using position:absolute & animating it downwards. (position: absolutely not?)
