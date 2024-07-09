
import mockFS from 'mock-fs';
import sinon from 'sinon';
import chai, { expect } from 'chai';

let sinonChai;

(async () => {
    sinonChai = await import('sinon-chai');
    // Use sinonChai here
    chai.use(sinonChai.default);
})();

import semver from 'semver';
import { Engine } from '../src/common/engine.js';
import os from 'os';

describe('Engine Class Linux', function() {
    before(function() {
        if(os.platform() !== 'win32') {
            this.skip();
        }
    });
});