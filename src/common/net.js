
import { createWriteStream, unlink } from 'mode:fs';
import https from 'node:https';
const OK = 200;

/**
 * Retrieves file from provided url, saving to destination
 *
 * @param {String} url
 * @param {String} filePath
 * @returns {Promise}
 */
const download = async (url, filePath) => {

    return new Promise((resolve, reject) => {
        const file = createWriteStream(filePath);
        let fileInfo = null;

        const request = https.get(url, response => {
            if(response.statusCode !== OK) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }

            fileInfo = {
                mime: response.headers['content-type']
                , size: parseInt(response.headers['content-length'], 10),
            };

            response.pipe(file);
        });

        // The destination stream is ended by the time it's called
        file
            .on('finish', () => resolve(fileInfo))
            .on('error', err => {
                unlink(filePath, () => reject(err));
            });

        request
            .on('error', err => {
                unlink(filePath, () => reject(err));
            });

        request.end();
    });
};

export {
    download
};
