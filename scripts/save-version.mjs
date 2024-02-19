import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import commandLineArgs from 'command-line-args';
import packageJson from 'package-json';

let { version, tag } = commandLineArgs([
    { name: 'version', type: String },
    { name: 'tag', type: String }
]);

(async () => {
    try {
        await fs.writeFile('./src/version.ts', `export const VERSION = '${tag ? `${version}-${tag}` : version}';`, 'utf-8');
    } catch (error) {
        console.warn(error);
    }
})();