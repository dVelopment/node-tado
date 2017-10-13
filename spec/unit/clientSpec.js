'use strict';

import Client from '../../src/client';
import request from 'request';
import moment from 'moment';
import _ from 'lodash';

const BASE_URL = 'https://my.tado.com';
const AUTH_URL = 'https://auth.tado.com';

describe('client', () => {
    const TOKEN = {
        access_token: 'asdf',
        token_type: 'bearer',
        refresh_token: 'asdf',
        expires_in: 599,
        scope: 'home.user'
    };

    function createToken() {
        return _.extend(TOKEN, {
            expires_in: moment().add(500, 'seconds').toDate()
        });
    }

    function mockRequest(result, method = 'get') {
        return spyOn(request, method).and.callFake((options, cb) => {
            cb(null, { statusCode: 200 }, result);
        });
    }

    function createLoggedInClient() {
        let client = new Client();
        client.token = createToken();

        return client;
    }

    describe('authentication', () => {
        function fakeLogin(successful) {
            if (successful) {
                return mockRequest(_.extend({}, TOKEN), 'post');
            } else {
                return spyOn(request, 'post').and.callFake((options, cb) => {
                    cb({
                        statusCode: 400,
                        error: 'bad credentials'
                    });
                });
            }
        }

        it('should perform a login', (done) => {
            let spy = fakeLogin(true);
            let client = new Client();
            client.login('user', 'password').then((result) => {
                expect(result).toBe(true);

                expect(spy.calls.count()).toEqual(1);
                let args = spy.calls.argsFor(0);
                let options = args[0];
                expect(options.qs).not.toBe(undefined);
                expect(options.qs).toEqual({
                    client_id: 'tado-web-app',
                    client_secret: 'wZaRN7rpjn3FoNyF5IFuxg9uMzYJcvOoQ8QWiIqS3hfk6gLhVlG57j5YNoZL2Rtc',
                    grant_type: 'password',
                    password: 'password',
                    username: 'user',
                    scope: 'home.user'
                });
                expect(options.url).toEqual(AUTH_URL + '/oauth/token');

                done();
            }, () => fail('there shouldn\'t have been an error'));
        });

        it('should store the given token', (done) => {
            fakeLogin(true);
            let client = new Client();
            client.login('user', 'password').then((result) => {
                expect(result).toBe(true);

                let token = client.token;

                expect(token).not.toBe(undefined);
                expect(token.access_token).toEqual(TOKEN.access_token);
                expect(token.token_type).toEqual(TOKEN.token_type);
                expect(token.refresh_token).toEqual(TOKEN.refresh_token);
                expect(token.scope).toEqual(TOKEN.scope);
                expect(moment().add(600, 'seconds').isAfter(token.expires_in)).toBe(true);
                expect(moment().add(290, 'seconds').isAfter(token.expires_in)).toBe(false);

                done();
            }, () => fail('there shouldn\'t have been an error'));
        });

        it('should handle an invalid login properly', (done) => {
            let client = new Client();

            client.login('someuser', 'invalidasdf').then(() => {
                fail('error expected');
            }, (err) => {
                expect(err).not.toBe(null);
                expect(client.token).toBe(undefined);
                done();
            });
        });

        it('should refresh a token', (done) => {
            let spyPost = mockRequest(TOKEN, 'post');
            let spyGet = mockRequest(TOKEN, 'get');
            let client = new Client();
            client.token = {
                access_token: 'asdf',
                token_type: 'bearer',
                refresh_token: 'asdf',
                expires_in: moment().subtract(60, 'seconds').toDate(),
                scope: 'home.user'
            };

            client.me().then(() => {
                expect(spyPost.calls.count()).toEqual(1);
                expect(spyGet.calls.count()).toEqual(1);
                let [options] = spyPost.calls.argsFor(0);
                expect(options.qs).not.toBe(undefined);
                expect(options.qs).toEqual({
                    client_id: 'tado-web-app',
                    client_secret: 'wZaRN7rpjn3FoNyF5IFuxg9uMzYJcvOoQ8QWiIqS3hfk6gLhVlG57j5YNoZL2Rtc',
                    grant_type: 'refresh_token',
                    refresh_token: 'asdf',
                    scope: 'home.user'
                });
                expect(options.url).toEqual(AUTH_URL + '/oauth/token');

                [options] = spyGet.calls.argsFor(0);
                expect(options.url).toEqual(BASE_URL + '/api/v2/me');

                done();
            }, () => fail('there shouldn\'t have been an error'));
        });

        it('should not refresh a still valid token', (done) => {
            let client = createLoggedInClient();
            let spy = mockRequest({});
            client.me().then(() => {
                expect(spy.calls.count()).toEqual(1);
                let [options] = spy.calls.argsFor(0);
                expect(options.url).toEqual(BASE_URL + '/api/v2/me');

                done();
            }, () => fail('there shouldn\'t have been an error'));
        });
    });

    describe('api', () => {
        it('should fetch user data', (done) => {
            let client = createLoggedInClient();

            let ME = {
                email: 'fake@example.com',
                enabled: true,
                homeId: 42,
                locale: 'de_DE',
                name: 'Jane Doe',
                type: 'WEB_USER',
                username: 'fake@example.com'
            };

            let spy = mockRequest(ME);


            client.me().then((result) => {
                expect(result).toEqual(ME);
                expect(spy.calls.count()).toEqual(1);

                let [options] = spy.calls.argsFor(0);
                expect(options.url).toEqual(BASE_URL + '/api/v2/me');

                done();
            }, () => fail('there shouldn\'t have been an error'));
        });

        it('should fetch a single home', (done) => {
            let client = createLoggedInClient();
            const HOME = {
                address: {
                    name: 'Jane Doe'
                },
                dateTimeZone: 'Europe/Vienna',
                id: 42,
                installationCompleted: true,
                name: 'Office',
                temperatureUnit: 'CELSIUS'
            };
            let spy = mockRequest(HOME);

            client.home(42).then((result) => {
                expect(result).toEqual(HOME);
                expect(spy.calls.count()).toEqual(1);

                let [options] = spy.calls.argsFor(0);
                expect(options.url).toEqual(BASE_URL + '/api/v2/homes/42');

                done();
            });
        });

        it('should fetch zones', (done) => {
            let client = createLoggedInClient();
            const ZONES = [
                {
                    id: 1,
                    name: 'Heating',
                    type: 'HEATING'
                }
            ];
            let spy = mockRequest(ZONES);

            client.zones(42).then((result) => {
                expect(result).toEqual(ZONES);
                expect(spy.calls.count()).toEqual(1);

                let [options] = spy.calls.argsFor(0);
                expect(options.url).toEqual(BASE_URL + '/api/v2/homes/42/zones');

                done();
            });
        });

        it('should fetch weather data', (done) => {
            let client = createLoggedInClient();
            const WEATHER = {
                "solarIntensity": {
                    "type": "PERCENTAGE",
                    "percentage": 80.06,
                    "timestamp": "2016-02-13T13:13:05.695Z"
                },
                "outsideTemperature": {
                    "celsius": 5.95,
                    "fahrenheit": 42.71,
                    "timestamp": "2016-02-13T13:13:05.695Z",
                    "type": "TEMPERATURE"
                },
                "weatherState": {
                    "value": "SUN",
                    "timestamp": "2016-02-13T13:13:05.695Z"
                }
            };
            let spy = mockRequest(WEATHER);

            client.weather(42).then((result) => {
                expect(result).toEqual(WEATHER);
                let [options] = spy.calls.argsFor(0);
                expect(options.url).toEqual(BASE_URL + '/api/v2/homes/42/weather');

                done();
            });
        });

        it('should fetch current state data', (done) => {
            let client = createLoggedInClient();
            const STATE = {
                "tadoMode": "HOME",
                "geolocationOverride": true,
                "geolocationOverrideDisableTime": "2016-02-13T19:00:00Z",
                "preparation": null,
                "setting": {
                    "type": "HEATING",
                    "power": "ON",
                    "temperature": {
                        "celsius": 22.5,
                        "fahrenheit": 72.5
                    }
                },
                "overlayType": null,
                "overlay": null,
                "link": {
                    "state": "ONLINE"
                },
                "activityDataPoints": {
                    "heatingPower": {
                        "type": "PERCENTAGE",
                        "percentage": 0,
                        "timestamp": "2016-02-13T13:14:33.914Z"
                    }
                },
                "sensorDataPoints": {
                    "insideTemperature": {
                        "celsius": 22.55,
                        "fahrenheit": 72.59,
                        "timestamp": "2016-02-13T13:14:33.914Z",
                        "type": "TEMPERATURE"
                    },
                    "humidity": {
                        "type": "PERCENTAGE",
                        "percentage": 34,
                        "timestamp": "2016-02-13T13:14:33.914Z"
                    }
                }
            };

            let spy = mockRequest(STATE);

            client.state(42, 1).then((result) => {
                expect(result).toEqual(STATE);
                let [options] = spy.calls.argsFor(0);
                expect(options.url).toEqual(BASE_URL + '/api/v2/homes/42/zones/1/state');

                done();
            });
        });
    });
});
