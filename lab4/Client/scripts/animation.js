function initSVG(id, src) {

    var device = $(".device-outer[data-device-id=" + id + "]");
    var image_div = device.find(".device-image")[0];

    $(image_div).svg();
    var svg = $(image_div).svg('get');

    return svg;

}

function addImage(id, src, min, max, current, values) {

    var device = $(".device-outer[data-device-id=" + id + "]");
    var image_div = device.find(".device-image-container");

    while (image_div[0].firstChild) {
        image_div[0].removeChild(image_div[0].firstChild);
    }

    var image = $("<img src='" + src + "' height='100%' width='100%' class='device-image' />");
    image_div.append(image[0]);

}

function drawThermometer(id, src, min, max, current, values) {

    var svg = initSVG(id, src);

    if (typeof svg === "undefined") {
        return;
    }

    svg.load(src, {
        onLoad: function () {
            updateThermometer(id, min, max, current, values);
        }
    });
}


function drawBulb(id, src, min, max, current, values) {
    var svg = initSVG(id, src)

    if (typeof svg === "undefined") {
        return;
    }

    svg.load(src, {
        onLoad: function () {
            updateBulb(id, min, max, current, values);
        }
    });
}

function drawCam(id, src, min, max, current, values) {
    var svg = initSVG(id, src)

    if (typeof svg === "undefined") {
        return;
    }

    svg.load(src, {
        onLoad: function () {
            updateCam(id, min, max, current, values);
        }
    });
}

function drawShutter(id, src, min, max, current, values) {
    var svg = initSVG(id, src)

    if (typeof svg === "undefined") {
        return;
    }

    svg.load(src, {
        onLoad: function () {
            updateShutter(id, min, max, current, values);
        }
    });
}

function updateThermometer(id, min, max, current, values) {

    var device = $(".device-outer[data-device-id=" + id + "]")
    var min_label = device.find("title:contains(min_label)").parent().find("tspan");

    var max_label = device.find("title:contains(max_label)").parent().find("tspan");

    if (typeof device === "undefined" || typeof min_label === "undefined" || typeof max_label === "undefined") {
        return;
    }

    min_label.text(min);
    max_label.text(max);

    var min_y = device.find("title:contains(max_temp)").parent().attr("y") + 1;
    var max_y = device.find("title:contains(min_temp)").parent().attr("y") + 1;


    var div = max - min;
    var delta = Math.abs(max_y - min_y) / div;

    var y = Math.round((max_y - delta * (Math.abs(min) + current)) * 100000) / 100000;

    var path = device.find("title:contains(cur_temp)").parent();

    if(typeof  path === "undefined"){
        return;
    }
    var d = path.attr("d");
    if(typeof  d === "undefined"){
        return;
    }

    d = d.replace(d.split(' ')[4], y);
    path.attr("d", d);
}


function updateBulb(id, min, max, current, values) {

    var device = $(".device-outer[data-device-id=" + id + "]");

    var svg = device.find("svg");

    if (typeof svg === "undefined" || typeof device === "undefined") {
        return;
    }

    var style = svg.attr("style");
    var styles = style.split(";");

    var activated = (current == 1);

    if (activated && (styles.length < 2 || (styles.length == 2 && !styles[1].trim()))) {
        style += "fill:orange;";
    } else if (!activated && styles.length >= 2) {
        style = styles[0] + ";";
    }
    svg.attr("style", style);
}

function updateCam(id, min, max, current, values) {

    var device = $(".device-outer[data-device-id=" + id + "]");
    var lens = device.find($("circle").has("title:contains(lens)"));
    var lens_reflection = device.find($("path").has("title:contains(lens_reflection)"));


    if (typeof device === "undefined" || typeof lens === "undefined" || typeof lens_reflection === "undefined") {
        return;
    }

    var activated = current == 1;

    var cam = lens.parent();

    var lens_new = lens.clone();
    var lens_reflection_new = lens_reflection.clone();

    if (activated) {
        var lens_style = "fill:#42a5f5;";
        var lens_reflection_style = "fill:#90caf9";
    } else {
        var lens_style = "fill:#000000;";
        var lens_reflection_style = "fill:#ffffff";
    }

    lens_new.attr("style", lens_style);
    lens_reflection_new.attr("style", lens_reflection_style);

    lens.remove();
    lens_reflection.remove();
    cam.append(lens_new);
    cam.append(lens_reflection_new);
}

function updateShutter(id, min, max, current, values) {

    var device = $(".device-outer[data-device-id=" + id + "]");

    var levels = device.find("path");

    if (typeof device === "undefined" || typeof levels === "undefined") {
        return;
    }

    var level_2 = levels.has("title:contains(level_2)");
    var level_3 = levels.has("title:contains(level_3)");
    var level_4 = levels.has("title:contains(level_4)");

    var selection = values[current];
    switch (selection) {
        case "offen":
            level_2.hide();
            level_3.hide();
            level_4.hide();
            break;
        case "halb geöffnet":
            level_2.show();
            level_3.hide();
            level_4.hide();
            break;
        case "geschlossen":
            level_2.show();
            level_3.show();
            level_4.show();
            break;
    }
}
