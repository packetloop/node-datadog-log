#!/usr/bin/env node

import {DatadogLog} from './datadogLog';

process.stdin
  .pipe(new DatadogLog())
  // output to console only in case of errors
  .pipe(process.stderr);
