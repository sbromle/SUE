#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var restler = require('restler');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var HTMLURL_DEFAULT = "";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertURLExists = function(inurl) {
    var instr = inurl.toString();
		/*
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
		*/
    return instr;
};

var printJson = function (checkJson) {
 	var outJson = JSON.stringify(checkJson, null, 4);
 	console.log(outJson);
};

/* loads data into cheerio instance. Checks it
 * using data from checksfile,
 * and then calls 'action' on the result.
 */
var cheerioLoadAndCheck = function(data,checksfile,action) {
  $ = cheerio.load(data);
	var checkJson = checkCheerioHtml($,checksfile);
  action(checkJson);
};

/* Asynchronously reads file, and when done, checks
 * it's contents using Cheerio, and then calls the
 * call back on the results.
 */
var cheerioFile = function(htmlfile,checksfile,callback) {
  fs.readFile(htmlfile,
      function(err,result) {
        if (err) throw err;
        cheerioLoadAndCheck(result,checksfile,callback);
      });
	return;
};

/* Asynchronously reads from a URL, and when done, checks
 * it's contents using Cheerio, and then calls the
 * call back on the results.
 */
var cheerioUrl = function(URL,checksfile,callback) {
	var res = restler.get(URL);
	res.on('complete',function(result) {
		if (result instanceof Error) {
			sys.put('Error: ' + result.message);
		} else {
      cheerioLoadAndCheck(result,checksfile,callback);
		}
	});
	return;
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkCheerioHtml = function(C,checksfile) {
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = C(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var checkHtmlFile = function(htmlfile, checksfile) {
    cheerioFile(htmlfile,checksfile,printJson);
};
var checkHtmlUrl = function(url, checksfile) {
    cheerioUrl(url,checksfile,printJson);
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

/* Takes the following arguments:
 * source -> the filename or the URL of the data source;
 * getdataFn -> A (possibly asynchonous) function that gets data then calls callbackFn
 * callbackFn -> function called after data is sourced.
 */
var checkSourceAndPrint = function(source,getdataFn,callbackFn) {
	return getdataFn(source,callbackFn);
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'URL to index.html', clone(assertURLExists), HTMLURL_DEFAULT)
        .parse(process.argv);
		var checkJson;
		if (program.url.length>0) {
      checkHtmlUrl(program.url,program.checks);
		} else {
      checkHtmlFile(program.file,program.checks);
		}
} else {
    exports.checkHtmlFile = checkHtmlFile;
    exports.checkHtmlUrl = checkHtmlUrl;
}
