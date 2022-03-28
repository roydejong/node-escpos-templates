import TemplateCommand from "./TemplateCommand.js";

export default class TemplateCommandRegistry {
  static init() {
    this.commands = { };

    this.add(new TemplateCommand(
      "print",
      (printer, args) =>
        printer.text(args[0]),
      1
    ));

    this.add(new TemplateCommand(
      "feed",
      (printer, args) =>
        printer.feed(parseInt(args[0])),
      1
    ));

    this.add(new TemplateCommand(
      "beep",
      (printer, args) =>
        printer.beep(parseInt(args[0]), parseInt(args[1])),
      2
    ));

    this.add(new TemplateCommand(
      "cut",
      (printer, args) =>
        printer.cut(false, 1),
      0
    ));

    this.add(new TemplateCommand(
      "cashdraw",
      (printer, args) =>
        printer.cashdraw(parseInt(args[0])),
      1
    ));
  }

  static add(templateCommand) {
    this.commands[templateCommand.opcode] = templateCommand;
  }

  static invoke(printer, opcode, args) {
    const command = this.commands[opcode];

    if (!command)
      throw new Error(`Command not implemented: ${opcode}`);

    if (command.argCount !== null && args.length !== command.argCount)
      throw new Error(`Invalid amount of arguments for ${opcode}: got ${args.length}, expected ${command.argCount}`);

    command.invoke(printer, args);
  }
}

TemplateCommandRegistry.init();