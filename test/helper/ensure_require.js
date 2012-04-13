/*!
 * tcif - test/support/ensure_require.js, Ensure coverage require.
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var fs = require('fs');
var path = require('path');
var require = require('jscoverage').require(module);
var isCov = process.env.JSCOV === '1';

var APPDIR = path.dirname(path.dirname(__dirname));

var libs = [ 
  'lib' 
];

requireFirst(libs, isCov);

function requireFirst(names, cov) {
  for (var i = 0, l = names.length; i < l; i++) {
    var dirpath = path.join(APPDIR, names[i]);
    if (dirpath.indexOf('.js') > 0) {
      require(dirpath, cov);
      continue;
    } 
    requireDir(dirpath, cov);
  }
}

function requireDir(dirpath, cov) {
  var names = fs.readdirSync(dirpath);
  for (var j = 0, jl = names.length; j < jl; j++) {
    var name = names[j];
    if (name[0] === '.') {
      continue;
    }
    var filepath = path.join(dirpath, name);
    if (fs.statSync(filepath).isDirectory()) {
      requireDir(filepath);
    } else if (path.extname(filepath) === '.js') {
      require(filepath, cov);
    }
  }
}
