import {ArgValidation} from "./ArgValidation.js";

export default class TemplateCommand {
  constructor(opcode, handler, argValidation = null) {
    this.opcode = opcode;
    this.handler = handler;
    this.argValidation = argValidation || ArgValidation.AtLeast(0);

    if (this.argValidation && !(this.argValidation instanceof ArgValidation))
      throw new TypeError("Invalid argCount: must be instance of ArgValidation");
  }

  invoke(printer, args) {
    this.handler(printer, args);
  }
}