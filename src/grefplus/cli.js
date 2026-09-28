import {main} from './index.js';
try {
    await main();
}
catch (error) {
    console.error(error);
    process.exitCode = 1;
}