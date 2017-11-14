// FIXME: "use strict";
function openPage() {
    browser.tabs.query({
        currentWindow: true,
        active: true,
    }).then(tabs => {
        tabs.forEach(tab => {
            browser.tabs.sendMessage(tab.id, { toggle: true });
        });
    });
}

function updateBadge(message, sender, reply) {
    var title = ("Rule: " + message.trash_styles + "\n" +
                "Style: " + message.trash_elements + "\n" +
                "CDN: " + message.requires_security_hack);
    browser.browserAction.setTitle({
        title,
        tabId: sender.tab.id,
    });

    var count = message.trash_styles + message.trash_elements;
    var icon;
    var show_count = false;
    if (count == 0) {
        icon = "icons/clean.svg";
    } else if (message.trash_visible) {
        icon = "icons/trash-shown.svg";
    } else {
        icon = "icons/trash-hidden.svg";
        show_count = true;
    }
    browser.browserAction.setIcon({
        path: {
            "16": icon,
            "32": icon,
            "48": icon,
            "96": icon,
        },
        tabId: sender.tab.id,
    });

    show_count = false; // I prefer the minimalism. FIXME: Config option.
    if (show_count) {
        var n = message.trash_styles + "/" + message.trash_elements;
        browser.browserAction.setBadgeText({ text: n });
    }
}

browser.browserAction.onClicked.addListener(openPage);
browser.runtime.onMessage.addListener(updateBadge);
