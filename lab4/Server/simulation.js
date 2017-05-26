/*jslint node: true */
/*jslint esversion: 6*/

const _temp = 15;
const _temp_diff = 5;
const _shutter_up = 1;
const _shutter_down = 7;

const _hour = 5000;
const _day = 12;
const _season = 10;

var hour = 0;
var day = 0;
var season = 0;
var temp = _temp;
var temp_diff = _temp_diff;
var shutter_up = 0;
var shutter_down = 7;
var camera = true;

var devices = null;
var refreshCallback = null;

module.exports = {

    simulateSmartHome: function (dev, callback) {
        "use strict";
        devices = dev;
        refreshCallback = callback;
        setInterval(simulateSeason, _hour * _day * _season);
        setInterval(simulateDay, _hour * _day);
        setInterval(simulateHour, _hour);
    },

    updatedDeviceValue: function (device, control_unit, temp) {
        "use strict";
        if (device.type === "Heizkörperthermostat") {
            updateTemp(control_unit, temp);
        } else {
            control_unit.current = Number(temp);
        }
    }
};

function updateTemp(control_unit, temp) {
    "use strict";

    var random_seed = Math.random();
    control_unit.seed = random_seed;
    var counter = 10;
    var dif = (temp - control_unit.current) / 10;
    var id = setInterval(function () {
        if (control_unit.seed !== random_seed) {
            clearInterval(id);
        }

        var new_val = Math.round((control_unit.current + dif) * 100) / 100;

        control_unit.current = new_val > control_unit.max ? control_unit.max : new_val;
        control_unit.current = new_val < control_unit.min ? control_unit.min : new_val;

        counter--;
        if (counter <= 0) {
            clearInterval(id);
        }
    }, 1000);

}


function simulateSeason() {
    "use strict";
    switch (season) {
        case 0:
            temp = _temp;
            shutter_up = _shutter_up;
            shutter_down = _shutter_down;
            camera = true;
            break;
        case 1:
            temp = _temp + random(5, 10);
            shutter_up = randomIntInc(0, 1);
            shutter_down = randomIntInc(7, 9);
            camera = false;
            break;
        case 2:
            temp = _temp + random(3, 5) - random(3, 5);
            shutter_up = _shutter_up;
            shutter_down = _shutter_down;
            camera = true;
            break;
        case 3:
            temp = _temp - random(10, 20);
            shutter_up = randomIntInc(0, 1);
            shutter_down = randomIntInc(6, 8);
            camera = true;
            break;
    }
    season = (season + 1) % 4;
}

function simulateDay() {
    "use strict";
    var x = (Math.PI * (day + 1)) / 10;
    temp_diff = _temp_diff + (Math.round((2 * Math.sin(x) + Math.sin(3 * x)) * random(0.8, 1.2) * 100) / 100);
    day = (day + 1) % 10;
}

function simulateHour() {
    "use strict";
    var t = Math.round((Math.sin(Math.PI * ((2 * (hour + 1)) / _day)) * temp_diff + temp) * random(0.8, 1.2) * 100) / 100;

    devices.forEach(function (dev) {
        for (var i = 0; i < dev.control_units.length; i++) {
            var elem = dev.control_units[i];
            if (elem.primary) {
                var current = elem.current;
                var type = elem.type;
                switch (dev.type) {
                    case "Heizkörperthermostat":
                        if (type === "continuous") {
                            var new_val = Math.round((current + ((t - current) * 0.025)) * 100) / 100;
                            if (new_val > elem.min && new_val < elem.max) {
                                current = new_val;
                            }
                        }
                        break;
                    case "Beleuchtung":
                        if (type === "boolean") {
                            var new_val_b = (hour >= shutter_up && hour <= shutter_down) ? 0 : 1;
                            if (new_val_b !== current) {
                                current = new_val_b;
                            }
                        }
                        break;
                    case "Überwachungskamera":
                        if (type === "boolean") {
                            if ((camera ? 0 : 1) !== current) {
                                current = camera ? 0 : 1;
                            }
                        }
                        break;
                    case "Rollladen":
                        if (type === "enum") {
                            var new_val_e = (hour >= shutter_up && hour <= shutter_down) ? 0 : 2;
                            if (new_val_e !== current) {
                                new_val_e = randomIntInc(1, 100) < 20 ? 1 : new_val_e;
                            }
                            if (new_val_e !== current) {
                                current = new_val_e;
                            }
                        }
                        break;
                }
                elem.current = current;
            }
        }
    });
    hour = (hour + 1) % _day;
    refreshCallback();

}

function random(low, high) {
    "use strict";
    return Math.random() * (high - low) + low;
}

function randomIntInc(low, high) {
    "use strict";
    return Math.floor(Math.random() * (high - low + 1) + low);
}