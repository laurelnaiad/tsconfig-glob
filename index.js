var fs = require('fs');
var path = require('path');
var glob = require('glob');
var stable = require('stable');
function unique(arr) {
    var keys = {}, out = [];
    for (var i = 0, l = arr.length; i < l; ++i) {
        if (keys.hasOwnProperty(arr[i])) {
            continue;
        }
        out.push(arr[i]);
        keys[arr[i]] = true;
    }
    return out;
}
function sort(a, b) {
    var aTsd = a.indexOf('tsd.d.ts') > -1, bTsd = b.indexOf('tsd.d.ts') > -1, aD = a.indexOf('.d.ts') > -1, bD = b.indexOf('.d.ts') > -1;
    if (aTsd) {
        return -1;
    }
    if (bTsd) {
        return 1;
    }
    if (aD && bD) {
        return 0;
    }
    if (aD) {
        return -1;
    }
    if (bD) {
        return 1;
    }
    return 0;
}
function getFiles(options, configFile) {
    var root = options.cwd || process.cwd(), configDir = path.resolve(root, options.configPath || '.'), filesGlob = configFile.filesGlob || [], files = [];
    files = unique(files.concat(filesGlob));
    var include = files.filter(function (file) {
        return file[0] !== '!';
    }), ignore = files.filter(function (file) {
        return file[0] === '!';
    }), sortedFiles = [];
    for (var _i = 0, include_1 = include; _i < include_1.length; _i++) {
        var pattern = include_1[_i];
        sortedFiles.push(glob.sync(pattern, {
            cwd: configDir,
            root: root,
            ignore: ignore.map(function (file) { return file.slice(1); })
        }));
    }
    sortedFiles = sortedFiles.map(function (files) {
        return stable(files);
    });
    files = unique(sortedFiles.reduce(function (files, current) {
        return files.concat(current);
    }, []));
    return stable(files, sort);
}
function eol(str) {
    var cr = '\r', lf = '\n', r = /\r/.test(str), n = /\n/.test(str);
    if (r && n) {
        return cr + lf;
    }
    return lf;
}
var baseFunc = function (options, done) {
    if (options === void 0) { options = {}; }
    if (done === void 0) { done = function () { }; }
    var root = options.cwd || process.cwd(), configDir = path.resolve(root, options.configPath || '.'), filePath = path.resolve(configDir, 'tsconfig.json'), fileStr = fs.readFileSync(filePath, 'utf8'), configFile = JSON.parse(fileStr), EOL = eol(fileStr);
    if (options.empty) {
        configFile.files = [];
    }
    else {
        configFile.files = getFiles(options, configFile);
    }
    if (!options.indent || Number(options.indent) === 0) {
        options.indent = 4;
    }
    if (options.sync) {
        fs.writeFileSync(filePath, JSON.stringify(configFile, null, options.indent)
            .replace(/\n\r|\n|\r/g, EOL) + EOL);
    }
    else {
        fs.writeFile(filePath, JSON.stringify(configFile, null, options.indent)
            .replace(/\n\r|\n|\r/g, EOL) + EOL, done);
    }
    return configFile;
};
baseFunc['sync'] = function (options, done) {
    if (options === void 0) { options = {}; }
    if (done === void 0) { done = function () { }; }
    options.sync = true;
    return baseFunc(options, done);
};
module.exports = baseFunc;
