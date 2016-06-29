#!/usr/bin/env node
'use strict';

var _datadogLog = require('./datadogLog');

process.stdin.pipe(new _datadogLog.DatadogLog())
// output to console only in case of errors
.pipe(process.stderr);