'use strict';

var Client = require('../src/client');
var request = require('request');
var BASE_URL = 'https://my.tado.com';

describe('client', function () {

    descibe('login', function () {

        function fakeLogin(successful) {
            return spyOn(request, 'post').and.callFake(function (options, cb) {
                if (successful) {
                    cb(null, {
                        access_token: 'asdf',
                        token_type: 'bearer',
                        refresh_token: 'asdf',
                        expires_in: 599,
                        scope: options.qs.scope
                    });
                } else {
                    cb({
                        statusCode: 400,
                        error: 'bad credentials'
                    });
                }
            });
        }

        it('should perform a login', function (done) {
            var spy = fakeLogin(true);
            var client = new Client();
            client.login('user', 'password', function(err, result) {
                expect(err).toBe(null);
                expect(result).toBe(true);

                expect(spy.calls.count()).toEqual(1);
                var args = spy.calls.argsFor(0);
                var options = args[0];
                expect(options.qs).not.toBe(undefined);
                expect(options.qs).toEqual({
                    client_id: 'tado-webapp',
                    grant_type: 'password',
                    password: 'password',
                    username: 'user',
                    scope: 'home.user'
                });
                expect(options.url).toEqual(BASE_URL + '/oauth/token');

                done();
            });
        });

        xit('should store the given token', function (done) {

        });

        xit('should handle an invalid login properly', function (done) {

        });
    });

    describe('me', function () {
        xit('should fetch user data', function (done) {
        });
    });

});
