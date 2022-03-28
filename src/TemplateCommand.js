export default class TemplateCommand {
  constructor(opcode, handler, argCount = null) {
    this.opcode = opcode;
    this.handler = handler;
    this.argCount = argCount;
  }

  invoke(printer, args) {
    this.handler(printer, args);
  }
}