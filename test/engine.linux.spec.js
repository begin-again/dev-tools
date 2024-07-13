
import os from 'os';

describe('Engine Class Linux', function() {
    before(function() {
        if(os.platform() !== 'win32') {
            this.skip();
        }
    });
});