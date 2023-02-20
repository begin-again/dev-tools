const chai = require('chai');
const { expect } = chai;
const sinon = require('sinon');
chai.use(require('sinon-chai'));

/**
 * @param {*|null} error
 * @param {*=} payload
 * @param {function=} cb
 * @return {function|Promise}
 */
const optionalPromise = function(error, payload, cb) {
    const isCallback = typeof cb === 'function';
    if(error) {
        return isCallback ? cb(error) : Promise.reject(error);
    }
    return isCallback ? cb(null, payload) : Promise.resolve(payload);
};


const infoscanFunction = function(data, cb) {
    let err = null;
    let result;
    // do stuff
    optionalPromise(err, result, cb);
};

describe.only('Optional Promise', () => {
    it('should resolve', async function() {
        const result = await optionalPromise(null, 'payload');

        expect(result).to.equal('payload');
    });
    it('should reject', async function() {
        const result = await optionalPromise('my error', 'payload').catch(err => err);

        expect(result).to.equal('my error');
    });
    it('should be callback', function() {
        const cb = sinon.stub();

        optionalPromise(null, 'payload', cb);

        expect(cb).calledOnceWith(null, 'payload');
    });
    it('should be callback w/error', function() {
        const cb = sinon.stub();

        optionalPromise('my error', 'payload', cb);

        expect(cb).calledOnceWith('my error');
    });

});
