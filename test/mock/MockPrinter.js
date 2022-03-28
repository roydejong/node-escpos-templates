export default class MockPrinter {
  constructor() {
    this.reset();
  }

  reset() {
    this.commands = [];
  }

  text(arg0) { this.commands.push(`text:${arg0}`) }
  feed(arg0) { this.commands.push(`feed:${arg0}`) }
  cut(arg0, arg1) { this.commands.push(`cut:${arg0}:${arg1}`) }
  beep(arg0, arg1) { this.commands.push(`beep:${arg0}:${arg1}`) }
  cashdraw(arg0) { this.commands.push(`cashdraw:${arg0}`) }
  align(arg0) { this.commands.push(`align:${arg0}`) }
}