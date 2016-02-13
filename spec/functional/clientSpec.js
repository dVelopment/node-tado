'use strict';

import Client from '../../src/client';
import _ from 'lodash';
import fs from 'fs';
import path from 'path';

const configFile = path.join(__dirname, '../config.json');

if (fs.existsSync(configFile)) {
    const config = require('../config.json');

    describe('functional tests', () => {
        let client;

        beforeEach((done) => {
            client = new Client();
            client.login(config.username, config.password).then(() => {
                done();
            });
        });

        it('should fetch user data', (done) => {
            client.me().then((result) => {
                expect(!!result).toBe(true);
                expect(result.username).toEqual(config.username);
                expect(!!_.find(result.homes, (h) => h.id === config.home)).toBe(true);

                done();
            }, () => fail('there shouldn\'t have been an error'));
        });

        it('should fetch a single home', (done) => {
            client.home(config.home).then((home) => {
                expect(home.id).toEqual(config.home);
                done();
            }, () => fail('there shouldn\'t have been an error'));
        });

        it('should fetch zones data', (done) => {
            client.zones(config.home).then((zones) => {
                expect(_.isArray(zones)).toBe(true);

                done();
            });
        });
    });
}
