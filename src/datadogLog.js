const util = require('util');
const spawn = require('child_process').spawn;
const {LogProcessor} = require('packetloop-node-pretty-log');


const OptionRequired = function (option) {
  this.message = `Missing required option ${option}`;
  this.name = 'OptionRequired';
  Error.captureStackTrace(this, OptionRequired);
};
OptionRequired.prototype = Object.create(Error.prototype);
OptionRequired.prototype.constructor = Error;


const isRequried = option => {
  throw new OptionRequired(option);
};


const {
  DATADOG_CURL = 'curl',
  DATADOG_HOST = 'app.datadoghq.com',
  DATADOG_API_KEY = isRequried('DATADOG_API_KEY')
} = process.env;


const datadog = (path, data) => spawn(DATADOG_CURL, [
  '--silent',
  '--show-error',
  '--request', 'POST',
  '--header', 'Content-Type: application/json',
  '--data', data,
  `https://${DATADOG_HOST}/api/v1/${path}?api_key=${DATADOG_API_KEY}`
]);


export const DatadogLog = function () {
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
  const series = lines
    .filter(line => line.substr(0, 21) === '{"datadog":{"series":')
    .map(line => this._parse(line))
    .filter(obj => obj !== null)
    .reduce((result, obj) => ({series: result.series.concat(obj.series || [])}), {series: []});

  if (series.series.length < 1) {
    return next();
  }

  const data = JSON.stringify(series);
  const spawned = datadog('series', data);
  spawned.stdout.on('data', chunk => {
    const response = chunk.toString('utf8');
    if (response !== '{"status": "ok"}') {
      this.push(JSON.stringify({datadogError: response, data}));
      this.push('\n');
    }
  });
  spawned.stderr.on('data', chunk => {
    const error = chunk.toString('utf8');
    this.push(JSON.stringify({datadogError: error, data}));
    this.push('\n');
  });

  return next();
};
