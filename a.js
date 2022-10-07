const dev = {
    "@rollup/plugin-commonjs": "^20.0.0",
    "@rollup/plugin-node-resolve": "^13.0.4",
    "rollup": "^2.56.3",
    "@rollup/plugin-json": "^4.1.0",
    "base32-encode": "^2.0.0",
    "patch-package": "^6.4.7",
    "pkg": "5.5.2",
    "rollup-plugin-ignore": "^1.0.10",
    "rollup-plugin-terser": "^7.0.2",
    "typescript": "^4.5.5"
 };

 let data = JSON.parse(fs.readFileSync('./package.json','utf8'))
 for(const [k,v] of Object.entries(dev)){
    if(!data.devDependencies[k])
        data.devDependencies[k]=v;
 }
 fs.writeFileSync('./package.json',JSON.stringify(data,null,2)+'\n');

 await $`npm i`;
