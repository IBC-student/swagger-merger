/**
 * Created by WindomZ on 17-4-11.
 */
'use strict'

const fs = require('fs')
const path = require('path')

const fmtconv = require('fmtconv')

const mergeJSON = require('./merge_json')

function mergerYAML(param) {
  // read file
  let doc = '' + fs.readFileSync(param.input, 'utf8')

  switch (path.extname(param.input).toLowerCase()) {
    case '.json':
      break
    default:
      // parse to JSON
      doc = fmtconv.stringYAML2JSON(doc, true)
      break
  }

  // merge to JSON
  let obj = mergeJSON(param, param.dir, param.input, doc)

  // login -> etc -> logout にsort
  var pairs = Object.entries(obj.paths);
  pairs.sort(function (p1, p2) {
    var p1Key = p1[0], p2Key = p2[0];
    if (p1Key.match("login")) { return -1; }
    return 0;
  })
  pairs.sort(function (p1, p2) {
    var p1Key = p1[0], p2Key = p2[0]
    if (p2Key.match("logout")) { return -1; }
    return 0;
  })
  obj.paths = Object.fromEntries(pairs);

  // tags を削除
  delete obj.tags
  Object.keys(obj.paths).forEach(function (key) {
    Object.keys(obj.paths[key]).forEach(function (aa) {
      delete obj.paths[key][aa].tags
    });
  });

  // requiredを削除
  Object.keys(obj.paths).forEach(function (key) {
    Object.keys(obj.paths[key]).forEach(function (aa) {
      Object.keys(obj.paths[key][aa]).forEach(function (bb) {
        delete obj.paths[key][aa][bb].required
      });
    });
  });

  // STATUSの200以外を削除
  Object.keys(obj.paths).forEach(function (uri) {
    Object.keys(obj.paths[uri]).forEach(function (method) {
      console.log(obj.paths[uri][method])
      Object.keys(obj.paths[uri][method]["responses"]).forEach(function (status_code) {
        if (status_code != '200') {
          delete obj.paths[uri][method]["responses"][status_code];
        }
      });
    });
  });

  console.log(obj);

  let dump
  if (param.output) {
    switch (path.extname(param.output).toLowerCase()) {
      case '.json':
        // parse to JSON
        dump = fmtconv.stringJSON2JSON(obj, param.compact)
        break
      default:
        // parse to YAML
        dump = fmtconv.stringJSON2YAML(obj, param.compact)
        break
    }

    // write to file
    if (dump) {
      fs.writeFileSync(param.output, dump, null)
    }
  }

  return obj
}

module.exports = mergerYAML
