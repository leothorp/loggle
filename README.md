# loggle

## An easy-to-use, highly configurable, and tiny logging library for the browser. ##

### Features
* no config required, useful (but overrideable) defaults 
* `sink` options - pass an endpoint URL (or a JS function) to send logs to
* standard set of log levels, with configurable message prefixes and colors
* include arbitrary metadata/tags with logs
* centralized filtering via function (particularly helpful for debug messages in local dev)

### Installation
```
  npm i @leothorp/loggle
```
### Usage
In src/index.js (or another project file):
```javascript
import "loggle";
```
That's it! the overlay will be replaced with the "Show Errors" button from now on.

### Screenshots
Before (overlay):
