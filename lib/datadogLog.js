'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
const util = require('util');
const spawn = require('child_process').spawn;

var _require = require('packetloop-node-pretty-log');

const LogProcessor = _require.LogProcessor;


const OptionRequired = function OptionRequired(option) {
  this.message = `Missing required option ${ option }`;
  this.name = 'OptionRequired';
  Error.captureStackTrace(this, OptionRequired);
};
OptionRequired.prototype = Object.create(Error.prototype);
OptionRequired.prototype.constructor = Error;

const isRequried = option => {
  throw new OptionRequired(option);
};

var _process$env = process.env;
var _process$env$DATADOG_ = _process$env.DATADOG_HOST;
const DATADOG_HOST = _process$env$DATADOG_ === undefined ? 'app.datadoghq.com' : _process$env$DATADOG_;
var _process$env$DATADOG_2 = _process$env.DATADOG_API_KEY;
const DATADOG_API_KEY = _process$env$DATADOG_2 === undefined ? isRequried('DATADOG_API_KEY') : _process$env$DATADOG_2;


const datadog = (path, data) => spawn('curl', ['--silent', '--show-error', '--request', 'POST', '--header', 'Content-Type: application/json', '--data', data, `https://${ DATADOG_HOST }/api/v1/${ path }?api_key=${ DATADOG_API_KEY }`]);

const DatadogLog = exports.DatadogLog = function DatadogLog() {
  LogProcessor.call(this);
};
util.inherits(DatadogLog, LogProcessor);

DatadogLog.prototype._parse = function (line) {
  let parsed = null;
  try {
    parsed = JSON.parse(line).datadog;
  } catch (error) {
    // just do nothing
  }
  return parsed;
};

DatadogLog.prototype._processLines = function (lines, next) {
  const series = lines.filter(line => line.substr(0, 21) === '{"datadog":{"series":').map(line => this._parse(line)).filter(obj => obj !== null).reduce((result, obj) => ({ series: result.series.concat(obj.series || []) }), { series: [] });

  if (series.series.length < 1) {
    return next();
  }

  const data = JSON.stringify(series);
  const spawned = datadog('series', data);
  spawned.stdout.on('data', chunk => {
    const response = chunk.toString('utf8');
    if (response !== '{"status": "ok"}') {
      this.push(JSON.stringify({ datadogError: response, data }));
      this.push('\n');
    }
  });
  spawned.stderr.on('data', chunk => {
    const error = chunk.toString('utf8');
    this.push(JSON.stringify({ datadogError: error, data }));
    this.push('\n');
  });

  return next();
};