// https://github.com/ejdaly/zx/blob/main/standalone/scripts/build.mjs

import { rollup } from "rollup";
import commonjs from "@rollup/plugin-commonjs";
import node_resolve from "@rollup/plugin-node-resolve";
import ignore from "rollup-plugin-ignore";
import { terser } from "rollup-plugin-terser";
import json from "@rollup/plugin-json";
import fs from "fs";

console.log(` BUILD `)
let i = 0,
  spin = () => process.stdout.write(`  ${'⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'[i++ % 10]}\r`),
  stop = (id => () => clearInterval(id))(setInterval(spin, 100))

const inFile = `./build/cli.js`;
const outFile = `./standalone/build/zx.cjs`;

{
	let data = fs.readFileSync(inFile,'utf8').split('\n');
	if(data[0].startsWith('#!')){
		data = data.slice(1);

    const idMain = data.indexOf('await (async function main() {');
    if(idMain===-1)throw new Error('failed to replace main-1');
    data[idMain] = 'main();\nasync function main() {\ntry{';

    if(data[idMain+1].trim()!=='const globals = \'./globals.js\';')
      throw new Error('failed to replace main-1-1');
    data[idMain+1] = '';
    data[idMain+2]='await import(\'./globals.js\')';

    const idCatch = data.indexOf('})().catch((err) => {');
    if(idCatch===-1)throw new Error('failed to replace main-2');
    data[idCatch] = '}catch(err){';

    const idEnd = data.indexOf('});', idCatch+1);
    if(idEnd===-1)throw new Error('failed to replace main-3');
    data[idEnd]='}\n}';

    const idPackage = data.findIndex(item => item.indexOf('package.json')>=0);
    if(idPackage===-1)throw new Error('failed to repalce main-4');

    const dataPackage = JSON.parse(fs.readFileSync('./package.json','utf8'));
    data[idPackage] = `return '${dataPackage.version} (node '+ process.version + ')';`;

    fs.writeFileSync(inFile, data.join('\n').replace('../package.json','./package.json'));
  }
}

// First, we bundle zx.mjs into a commonjs module, with all dependencies
//
const bundle = await rollup({
  input: inFile,
  plugins: [
	commonjs(), 
    node_resolve({
      preferBuiltins: false
    }),
    //terser(),
    json(),
    //rollupSliceFirstline(),
    rollupIgnoreDynamicImport(),
    //rollupAddDirectEvalZxNode(),
    ignore(["inspector", "source-map-support"])
  ],
  "inlineDynamicImports": true,
});

await bundle.write({
  file: outFile,
  format: "commonjs"
});

{
	const data=fs.readFileSync(outFile,'utf8').replace(/^.+isBlinkBasedBrowser.+navigator.+$/m,'const isBlinkBasedBrowser = false;');
	fs.writeFileSync(outFile,data);
}
await $`./node_modules/.bin/pkg --out-path=./standalone/dist --public --public-packages "*" --no-bytecode --options "experimental-vm-modules,no-warnings" ${outFile} -t node16-win,node16-linux`;
stop();
console.log(`DONE. ${outFile}`);

// We want rollup to ignore the dynamic import in zx.mjs
// See: https://rollupjs.org/guide/en/#renderdynamicimport
//
function rollupIgnoreDynamicImport() {
  return {
    name: 'ignore-dynamic-import',
    renderDynamicImport({ moduleId }) {
      if (path.resolve(moduleId) !== path.resolve(inFile)) return;
      return {
        left: 'import(',
        right: ')'
      };
    }
  };
}