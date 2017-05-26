/*jslint node: true */
/*jslint esversion: 6*/
/*jslint eqeqeq: true */

var express = require('express');
var app = express();
var fs = require("fs");
var expressWs = require('express-ws')(app);
var http = require('http');

var simulation = require('./simulation.js');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var cors = require('cors');

var uuid = require('uuid');

var https = require('https');
var twitter = require('twitter');

var user;
var devices;
var invalid_tokens = [];

var system_start = new Date();
var failed_logins = 0;

app.set('secret', "superSecret");
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors());

/**
 * Listet alle Geräte auf
 */
app.get('/listDevices', function (req, res) {
    "use strict";
    var token = getToken(req);

    if (token) {
        // überprüft JWT und ob JWT abgelaufen ist
        jwt.verify(token, app.get('secret'), {ignoreExpiration: false}, function (err, decoded) {
            if (err || typeof decoded === "undefined" || invalid_tokens.indexOf(token) >= 0) {
                res.json({status: 401, message: "Unauthorized"});
            } else {
                res.json({status: 200, message: devices});
            }
        });
    } else {
        res.json({status: 401, message: "Unauthorized"});
    }
});

/**
 * Fügt ein neues Gerät hinzu
 */
app.post("/createDevice", function (req, res) {
    "use strict";
    if (typeof  req === "undefined" || typeof req.body === "undefined" || typeof req.body.device === "undefined") {
        res.json({status: 422, message: "Unprocessable entity"});
        return;
    }

    var token = getToken(req);
    if (token) {
        jwt.verify(token, app.get('secret'), {ignoreExpiration: false}, function (err, decoded) {
            if (err || typeof decoded === "undefined" || invalid_tokens.indexOf(token) >= 0) {
                res.json({status: 401, message: "Unauthorized"});
            } else {
                var device = JSON.parse(req.body.device);
                var id = uuid.v4();
                device.id = id;
                devices.devices.push(device);
                res.json({status: 200, message: devices});
                sendCreate(JSON.stringify(device));
                //TODO erstellen Sie einen Publication String für Twitter und senden Sie diesen über die Twitter Bibliothek ab
                //Tipps:
                //  - die benötigte Bibliothek ist bereits eingebunden
                //  - siehe https://www.npmjs.com/package/twitter für eine Beschreibung der Bibliothek
                //  - verwenden Sie getTwitterPublicationString(groupNum, uuid, date) um den Publication String zu erstellen
            }
        });
    } else {
        res.json({status: 401, message: "Unauthorized"});
    }
});

/**
 * Aktualisiert ein Gerät
 */
app.post("/updateDevice", function (req, res) {
    "use strict";
    if (typeof  req === "undefined" || typeof req.body === "undefined" || typeof req.body.device === "undefined") {
        res.json({status: 422, message: "Unprocessable entity"});
        return;
    }

    var token = getToken(req);
    if (token) {
        jwt.verify(token, app.get('secret'), {ignoreExpiration: false}, function (err, decoded) {
            if (err || typeof decoded === "undefined" || invalid_tokens.indexOf(token) >= 0) {
                res.json({status: 401, message: "Unauthorized"});
            } else {
                var device = JSON.parse(req.body.device);

                var index = getDeviceIndex(device.id);
                if (index < 0) {
                    res.json({status: 422, message: "Unprocessable entity, no such device exists"});
                    return;
                }
                devices.devices[index] = device;
                res.json({status: 200, message: "Device updated"});
                sendUpdate(device.id, device.display_name);
            }
        });
    } else {
        res.json({status: 401, message: "Unauthorized"});
    }
});


/**
 * Aktualisiert den aktuellen Zustand eines Gerätes bzw. den Zustand eines Steuerungselementes
 */
app.post("/updateCurrent", function (req, res) {
    "use strict";
    if (typeof  req === "undefined" || typeof req.body === "undefined" || typeof req.body.id === "undefined" || typeof req.body.value === "undefined" || typeof req.body.unitId === "undefined") {
        res.json({status: 422, message: "Unprocessable entity"});
        return;
    }

    var token = getToken(req);
    if (token) {
        jwt.verify(token, app.get('secret'), {ignoreExpiration: false}, function (err, decoded) {
            if (err || typeof decoded === "undefined" || invalid_tokens.indexOf(token) >= 0) {
                res.json({status: 401, message: "Unauthorized"});
            } else {

                var index = getDeviceIndex(req.body.id);
                if (index < 0) {
                    res.json({status: 422, message: "Unprocessable entity, no such device exists"});
                    return;
                }

                var device = devices.devices[index];
                var control_unit_id = req.body.unitId;

                var control_unit = device.control_units[control_unit_id];
                var old_value = control_unit.current;
                var new_value = req.body.value;

                if (old_value == new_value) {
                    res.json({status: 400, message: "No changes were made"});
                    return;
                }

                var log = control_unit.log;
                if (log === null || typeof log === "undefined") {
                    log = "";
                } else {
                    log += "\n";
                }
                var date = new Date();
                var dateString = date.toLocaleString("de-DE");

                switch (control_unit.type) {
                    case "boolean":
                        log += dateString + ": " + (old_value == 1 ? "An" : "Aus") + " -> " + (new_value == 1 ? "An" : "Aus");
                        break;
                    case "enum":
                        log += dateString + ": " + control_unit.values[old_value] + " -> " + control_unit.values[new_value];
                        break;
                    case "continuous":
                        log += dateString + ": " + old_value + " -> " + new_value;
                        break;
                }
                control_unit.log = log;
                simulation.updatedDeviceValue(device, control_unit, Number(new_value));
                refreshControl_unit(device.id, control_unit_id, control_unit.current, log);

                res.json({status: 200, message: log, value: control_unit.current});
            }
        });
    } else {
        res.json({status: 401, message: "Unauthorized"});
    }
});


/**
 * Löscht ein Gerät
 */
app.post("/deleteDevice", function (req, res) {
    "use strict";
    if (typeof  req === "undefined" || typeof req.body === "undefined" || typeof req.body.id === "undefined") {
        res.json({status: 422, message: "Unprocessable entity"});
        return;
    }

    var token = getToken(req);
    if (token) {
        jwt.verify(token, app.get('secret'), {ignoreExpiration: false}, function (err, decoded) {
            if (err || typeof decoded === "undefined" || invalid_tokens.indexOf(token) >= 0) {
                res.json({status: 401, message: "Unauthorized"});
            } else {

                var index = getDeviceIndex(req.body.id);

                if (index >= 0) {
                    var dev = devices.devices;
                    dev.splice(index, 1);
                    res.json({status: 200, message: "Device removed"});
                    sendDelete(req.body.id);
                } else {
                    res.json({status: 422, message: "Unprocessable entity, device does not exist"});
                }
            }
        });
    } else {
        res.json({status: 401, message: "Unauthorized"});
    }

});

/**
 * Liefert den Index innerhalb des Devices Arrays zurück
 * @param id Identifikationsnummer des Gerätes, welches gesucht werden soll
 * @returns {number}
 */
function getDeviceIndex(id) {
    "use strict";
    var dev = devices.devices;
    for (var i = 0; i < dev.length; i++) {
        if (dev[i].id === id) {
            return i;
        }
    }
    return -1;
}

/*
 Websocket Implementation
 */
/**
 * An den Server bekannt geben, dass Updates über den WebSocket empfangen werden sollen
 */
app.ws('/subscribe', function (ws, req) {
    "use strict";
    ws.on('message', function (msg) {
        var token = JSON.parse(msg).token;
        if (token) {
            // überprüft JWT und ob JWT abgelaufen ist
            jwt.verify(token, app.get('secret'), {ignoreExpiration: false}, function (err, decoded) {
                if (err || typeof decoded === "undefined" || invalid_tokens.indexOf(token) >= 0) {
                    ws.send(JSON.stringify({status: 401, message: "Unauthorized"}));
                    ws.close();
                } else {
                    ws.flag = true;
                    ws.send(JSON.stringify({status: 200, message: "Subscriptions submitted", method: -1}));
                }
            });
        } else {
            ws.send(JSON.stringify({status: 401, message: "Unauthorized"}));
            ws.close();
        }
    });

    ws.on('close', function () {
        ws.close();
    });

});


/*
 login und logout Methoden um den Benutzer über die REST-Schnittstelle zu authentifizieren
 benutzt JSON Web Tokens für die Authentifizierung
 */
/**
 * Einloggen eines Benutzer und erzeugen eines neuen JSON Web Token für diesen
 */
app.post('/login',
    function (req, res) {
        "use strict";
        if (!req.body.username || !req.body.password) {
            res.json({status: 422, message: "Unprocessable entity"});
            return;
        }

        if (req.body.username !== user.username || req.body.password !== user.password) {
            res.json({status: 400, message: "Bad credentials"});
            failed_logins++;
            return;
        }
        failed_logins = 0;
        // create a token
        user.timestamp = new Date().toLocaleString();
        var token = jwt.sign(user, app.get('secret'), {expiresIn: "1d"});
        res.json({status: 200, token: token});
    }
);

/**
 * Ausloggen eines Benutzer und ungültig machen des Tokens
 */
app.post('/logout',
    function (req, res) {
        "use strict";
        var token = getToken(req);
        if (token) {
            // überprüft JWT und ob JWT abgelaufen ist
            jwt.verify(token, app.get('secret'), {ignoreExpiration: false}, function (err, decoded) {
                if (err || typeof decoded === "undefined") {
                    res.json({status: 401, message: "Unauthorized"});
                } else {
                    invalid_tokens.push(token);
                    res.json({status: 200, message: "Logout successfully"});
                }
            });
        } else {
            res.json({status: 401, message: "Unauthorized"});
        }
    }
);

/**
 * Abrufen des Serverstatus
 */
app.get('/getStatus', function (req, res) {
    "use strict";
    var token = getToken(req);

    if (token) {
        // überprüft JWT und ob JWT abgelaufen ist
        jwt.verify(token, app.get('secret'), {ignoreExpiration: false}, function (err, decoded) {
            if (err || typeof decoded === "undefined" || invalid_tokens.indexOf(token) >= 0) {
                res.json({status: 401, message: "Unauthorized"});
            } else {
                res.json({status: 200, date: system_start, failed: failed_logins});
            }
        });
    } else {
        res.json({status: 401, message: "Unauthorized"});
    }
});

/**
 * Aktualisieren des Passworts für den Log-in
 */
app.post('/updatePW', function (req, res) {
    "use strict";
    if (typeof  req === "undefined" || typeof req.body === "undefined" || typeof req.body.new_password === "undefined" || typeof req.body.repeat_password === "undefined" || typeof req.body.old_password === "undefined") {
        res.json({status: 422, message: "Unprocessable entity"});
        return;
    }

    var token = getToken(req);
    if (token) {
        // überprüft JWT und ob JWT abgelaufen ist
        jwt.verify(token, app.get('secret'), {ignoreExpiration: false}, function (err, decoded) {
            if (err || typeof decoded === "undefined" || invalid_tokens.indexOf(token) >= 0) {
                res.json({status: 401, message: "Unauthorized"});
            } else {
                var new_password = req.body.new_password;
                var old_password = req.body.old_password;
                var repeat_password = req.body.repeat_password;

                if (old_password !== user.password) {
                    res.json({status: 401, errorNum: 0, message: "Old password wrong"});
                    return;
                } else if (new_password !== repeat_password) {
                    res.json({status: 401, errorNum: 1, message: "Passwords do not match"})
                    return;
                }
                user.password = new_password;

                var data = "username: " + user.username + "\r\n" + "password: " + user.password;
                fs.writeFile('./resources/login.config', data, {}, function (err) {
                    if (err) {
                        console.log("Error writing user config.");
                        res.json({status: 400, errorNum: 2, message: "Password could not be written"});
                        return;
                    }
                    res.json({status: 200, message: "Password successfully updated"});
                });

            }
        });
    } else {
        res.json({status: 401, message: "Unauthorized"});
    }
});

/**
 * Liest den JWT aus dem Header des angegebenen Requests aus
 * @param req
 * @returns {*}
 */
function getToken(req) {
    "use strict";
    return req.headers['access-token'];
}

/**
 * Liest die Benutzerdaten aus dem login.config File aus
 */
function readUser() {
    "use strict";
    var input = fs.readFileSync('./resources/login.config');

    var data = input.toString().split("\r\n");
    var user_line = data[0];
    var password_line = data[1];

    var password = password_line.substring(password_line.indexOf(":") + 2, password_line.length);
    var username = user_line.substring(user_line.indexOf(":") + 2, user_line.length);

    user = {
        username: username,
        password: password
    };
}

/**
 * Liest die Gerätedaten aus der devices.json Datei aus
 */
function readDevices() {
    "use strict";
    fs.readFile(__dirname + "/resources/" + "devices.json", 'utf8', function (err, data) {
        if (err) {
            return;
        }
        devices = JSON.parse(data);
        var dev = devices.devices;
        for (var i = 0; i < dev.length; i++) {
            dev[i].id = uuid.v4();
        }
        simulation.simulateSmartHome(devices.devices, refreshConnected);
    });
}

/**
 * Aktualisiert für alle verbundenen Clients alle Geräte und deren Steuerungselemente (verwendet für Simulation)
 */
function refreshConnected() {
    "use strict";
    var clients = expressWs.getWss().clients;
    var date = new Date();
    clients.forEach(function (client) {
        if (client.readyState === client.OPEN && client.flag) {
            devices.devices.forEach(function (device) {
                var i = 0;
                device.control_units.forEach(function (control_unit) {
                    var data = {
                        "method": 0,
                        "deviceID": device.id,
                        "control_unitID": i,
                        "value": control_unit.current,
                        "log": control_unit.log,
                        "date": date
                    };
                    client.send(JSON.stringify(data));
                    i++;
                });

            });
        }
    });
}

/**
 * Schickt den aktuellen Wert eines bestimmten Steuerungselements an alle verbundenen Clients
 * @param deviceID
 * @param control_unitID
 * @param value
 * @param log
 */
function refreshControl_unit(deviceID, control_unitID, value, log) {
    "use strict";
    var clients = expressWs.getWss().clients;
    var date = new Date();
    clients.forEach(function (client) {
        if (client.readyState === client.OPEN && client.flag) {
            var data = {
                "method": 0,
                "deviceID": deviceID,
                "control_unitID": control_unitID,
                "value": value,
                "log": log,
                "date": date
            };
            client.send(JSON.stringify(data));
        }
    });
}

/* Geräte aktualisieren (unterschiedliche Modi: display_name von Gerät erneut senden = 2, Gerät löschen = 3) */
/**
 * Schickt die neuen Gerätedaten eines Gerätes an alle verbundenen Clients
 * @param deviceID
 * @param value
 */
function sendUpdate(deviceID, value) {
    "use strict";
    var clients = expressWs.getWss().clients;
    clients.forEach(function (client) {
        if (client.readyState === client.OPEN && client.flag) {
            var data = {
                "method": 1,
                "deviceID": deviceID,
                "value": value
            };
            client.send(JSON.stringify(data));
        }
    });
}

/**
 * Schickt eine Nachricht an alle verbundenen Clients um das Löschen eines Gerätes bekannt zu geben
 * @param deviceID
 */
function sendDelete(deviceID) {
    "use strict";
    var clients = expressWs.getWss().clients;
    clients.forEach(function (client) {
        if (client.readyState === client.OPEN && client.flag) {
            var data = {
                "method": 2,
                "deviceID": deviceID
            };
            client.send(JSON.stringify(data));
        }
    });
}

/**
 * Schickt eine Nachricht an alle verbundenen Clients um das Hinzufügen eines neuen Gerätes bekannt zu geben
 * @param device
 */
function sendCreate(device) {
    "use strict";
    var clients = expressWs.getWss().clients;
    clients.forEach(function (client) {
        if (client.readyState === client.OPEN && client.flag) {
            var data = {
                "method": 3,
                "device": device
            };
            client.send(JSON.stringify(data));
        }
    });
}

/**
 * Erzeugt einen neuen String welcher über die Twitterschnittstelle gepostet werden soll.
 * @param groupNum Gruppennummer
 * @param uuid     uuid des Gerätes
 * @param date     aktuelles Datum, als JavaScript Date
 * @returns {string}
 */
function getTwitterPublicationString(groupNum, uuid, date) {
    return date.toLocaleString() + " - Gruppe " + groupNum + " hat gerade ein Gerät mit folgender UUID hinzugefügt: " + uuid;
}

//TODO Stellen Sie die REST-Schnittstelle sowohl über http, wie auch über https zur Verfügung
//Anmerkungen:
//  - Die Schnittstelle darf weiterhin via http erreicht werden
//  - Der Websocket soll auch weiterhin über http abgewickelt werden
//  - zu https mit node.js siehe https://nodejs.org/api/https.html

/**
 * Programmeinstieg
 * Erzeugt einen http Server auf Port 8081 und stellt die REST-Schnittstelle zur Verfügung
 * @type {http.Server}
 */
var server = app.listen(8081, function () {

    "use strict";
    readUser();
    readDevices();

    var host = server.address().address;
    var port = server.address().port;

    console.log("Big Smart Home Server listening at http://%s:%s", host, port);

});

