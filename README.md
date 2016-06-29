# packetloop-node-datadog-log
Shell script to parse standard new-line delimited JSON log and push some of it to Datadog.


## Installation

```sh
npm install --global packetloop/node-datadog-log
```

## Usage

```sh
cat nl-delimited-json-with-datadog.log | packetloop-node-datadog-log
```

## Datadog message example

For details refer to [Datadog API docs](http://docs.datadoghq.com/api/?lang=console)

Only **Metrics** supported at the moment

```json
{
  "datadog": {
    "series": [
      {
        "metric": "my-metric-namespace.responseTime",
        "points": [[1459400134, 27.442]],
        "host": "localhost:3000",
        "tags": [
          "service_name:local",
          "env:development",
          "http_method:get",
          "http_path:/login"
        ]
      },
      {
        "metric": "my-metric-namespace.http_2xx",
        "points": [[1459400134, 1]],
        "host": "localhost:3000",
        "tags": [
          "service_name:local",
          "env:development",
          "http_method:get",
          "http_path:/login"
        ]
      }
    ]
  }
}
```
