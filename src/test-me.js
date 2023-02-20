


const optionalPromise = function(error, payload, cb) {
    const isCallback = typeof cb === 'function';
    if(error) {
        return isCallback ? cb(error) : Promise.reject(error);
    }
    return isCallback ? cb(null, payload) : Promise.resolve(payload);
};

module.exports = optionalPromise;
