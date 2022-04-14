const iconv = require('iconv-lite');

class MockPrinter {
  constructor() {
    this.reset();
  }

  reset() {
    this.commands = [];
  }

  print(arg0) { this.commands.push(`text:${arg0}`) }
  text(arg0, arg1) { arg0 = iconv.encode(arg0, arg1 || 'CP437'); this.commands.push(`text:${arg0}`) }
  feed(arg0) { this.commands.push(`feed:${arg0}`) }
  beep(arg0, arg1) { this.commands.push(`beep:${arg0}:${arg1}`) }
  cashdraw(arg0) { this.commands.push(`cashdraw:${arg0}`) }
  align(arg0) { this.commands.push(`align:${arg0}`) }
}

module.exports = MockPrinter;