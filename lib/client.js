'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BASE_URL = 'https://my.tado.com';
var CLIENT_ID = 'tado-web-app';
var CLIENT_SECRET = 'wZaRN7rpjn3FoNyF5IFuxg9uMzYJcvOoQ8QWiIqS3hfk6gLhVlG57j5YNoZL2Rtc';
var REFERER = 'https://my.tado.com/';

var Client = function () {
    function Client() {
        _classCallCheck(this, Client);
    }

    _createClass(Client, [{
        key: 'login',
        value: function login(username, password) {
            var _this = this;

            return new Promise(function (resolve, reject) {
                _request2.default.post({
                    url: BASE_URL + '/oauth/token',
                    qs: {
                        client_id: CLIENT_ID,
                        client_secret: CLIENT_SECRET,
                        grant_type: 'password',
                        password: password,
                        username: username,
                        scope: 'home.user'
                    },
                    json: true
                }, function (err, response, result) {
                    if (err || response.statusCode !== 200) {
                        reject(err || result);
                    } else {
                        _this.saveToken(result);
                        resolve(true);
                    }
                });
            });
        }
    }, {
        key: 'saveToken',
        value: function saveToken(token) {
            this.token = token;
            this.token.expires_in = (0, _moment2.default)().add(token.expires_in, 'seconds').toDate();
        }
    }, {
        key: 'refreshToken',
        value: function refreshToken() {
            var _this2 = this;

            return new Promise(function (resolve, reject) {
                if (!_this2.token) {
                    return reject(new Error('not logged in'));
                }

                if ((0, _moment2.default)().subtract(5, 'seconds').isBefore(_this2.token.expires_in)) {
                    return resolve();
                }

                _request2.default.get({
                    url: BASE_URL + '/oauth/token',
                    qs: {
                        client_id: CLIENT_ID,
                        grant_type: 'refresh_token',
                        refresh_token: _this2.token.refresh_token
                    },
                    json: true
                }, function (err, response, result) {
                    if (err || response.statusCode !== 200) {
                        reject(err || result);
                    } else {
                        _this2.saveToken(result);
                        resolve(true);
                    }
                });
            });
        }
    }, {
        key: 'api',
        value: function api(path) {
            var _this3 = this;

            return this.refreshToken().then(function () {
                return new Promise(function (resolve, reject) {
                    _request2.default.get({
                        url: BASE_URL + '/api/v2' + path,
                        json: true,
                        headers: {
                            referer: REFERER
                        },
                        auth: {
                            bearer: _this3.token.access_token
                        }
                    }, function (err, response, result) {
                        if (err || response.statusCode !== 200) {
                            reject(err || result);
                        } else {
                            resolve(result);
                        }
                    });
                });
            });
        }
    }, {
        key: 'me',
        value: function me() {
            return this.api('/me');
        }
    }, {
        key: 'home',
        value: function home(homeId) {
            return this.api('/homes/' + homeId);
        }
    }, {
        key: 'zones',
        value: function zones(homeId) {
            return this.api('/homes/' + homeId + '/zones');
        }
    }, {
        key: 'weather',
        value: function weather(homeId) {
            return this.api('/homes/' + homeId + '/weather');
        }
    }, {
        key: 'state',
        value: function state(homeId, zoneId) {
            return this.api('/homes/' + homeId + '/zones/' + zoneId + '/state');
        }
    }]);

    return Client;
}();

exports.default = Client;
;
