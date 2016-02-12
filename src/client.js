'use strict';

var request = require('request');
var BASE_URL = 'https://my.tado.com';

var Client = function () {

};

Client.prototype.login = function (username, password, cb) {
    var self = this;
    request.post({
        url: BASE_URL + '/oauth/token',
        qs: {
            client_id: 'tado-webapp',
            grant_type: 'password',
            password: password,
            username: username,
            scope: 'home.user'
        },
        json: true
    }, function(err, response, result) {
        if (err) {
            return cb(err);
        } else {
            self.token = result;
            cb(null, true);
        }
    });
};

module.exports = Client;
