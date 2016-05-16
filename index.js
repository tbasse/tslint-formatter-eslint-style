'use strict';

var path = require('path');

var ansiEscapeCodes = {
  // Colors
  'white': '\u001b[37m',
  'grey': '\u001b[90m',
  'black': '\u001b[30m',
  'blue': '\u001b[34m',
  'cyan': '\u001b[36m',
  'green': '\u001b[32m',
  'magenta': '\u001b[35m',
  'red': '\u001b[31m',
  'yellow': '\u001b[33m',
  // Styles
  'bold': '\u001b[1m',
  'underlined': '\u001b[0m'
};

function wrapStringAnsiCodes (string, style) {
  string = String(string);

  if (ansiEscapeCodes[style]) {
    var reset = '\u001b[39m';

    return [
      ansiEscapeCodes[style],
      string,
      reset
    ].join('');
  }

  return string;
}

var stylize = {
  warn: function (str) {
    return wrapStringAnsiCodes(str, 'yellow');
  },
  fail: function (str) {
    return wrapStringAnsiCodes(str, 'red');
  },
  ok: function (str) {
    return wrapStringAnsiCodes(str, 'green');
  },
  accent: function (str) {
    return wrapStringAnsiCodes(str, 'bold');
  },
  underlined: function (str) {
    return wrapStringAnsiCodes(str, 'underlined');
  }
};

function repeatString (len, str) {
  return Array.apply(null, new Array(len + 1)).join(str);
}

function sortErrors (a, b) {
  if (a && !b) {
    return -1;
  }
  else if (!a && b) {
    return 1;
  }
  if (a.line < b.line) {
    return -1;
  }
  else if (a.line > b.line) {
    return 1;
  }
  if (a.character < b.character) {
    return -1;
  }
  else if (a.character > b.character) {
    return 1;
  }
  return 0;
}

function TsLintFormatter() {}

TsLintFormatter.prototype = Object.create({
  name: 'tslint-path-formatter',

  getName: function () {
    return this.name;
  },

  format: function (failures) {

    var errors = [];
    var fileName;

    var errCodeMaxLen = 0;
    var errPosMaxLen = 0;

    failures.forEach(function (result) {
      fileName = path.resolve(result.getFileName());

      var lineAndCharacter = result.getStartPosition().getLineAndCharacter();
      lineAndCharacter.line = parseInt(lineAndCharacter.line, 10) + 1;
      lineAndCharacter.character = parseInt(lineAndCharacter.character, 10) + 1;

      var item = {
        file: fileName,
        line: lineAndCharacter.line,
        character: lineAndCharacter.character,
        position: lineAndCharacter.line + ':' + lineAndCharacter.character,
        reason: result.failure,
        code: (result.getRuleName ? result.getRuleName() : ''),
        type: 'error'
      };

      errCodeMaxLen = item.reason ? Math.max(item.reason.length, errCodeMaxLen) : errCodeMaxLen;
      errPosMaxLen = item.position ? Math.max(item.position.length, errPosMaxLen) : errPosMaxLen;

      errors.push(item);
    });

    errors.sort(sortErrors);

    var output = [];

    output.push(stylize.underlined(fileName));

    errors.forEach(function (error) {
      var message = [
        '  ',
        error.position,
        repeatString(errPosMaxLen - error.position.length + 2, ' '),
        stylize.fail(error.type),
        '  ',
        stylize.warn(error.reason ? error.reason : '<undefined reason>'),
        repeatString(errCodeMaxLen - error.reason.length + 2, ' '),
        error.code ? error.code : ''
      ].join('');

      output.push(message);
    });

    output.push('');
    return output.join('\n') + '\n';
  }
});

module.exports = {
  Formatter: TsLintFormatter
};
