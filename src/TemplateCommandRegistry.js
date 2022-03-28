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
        printer.text(parseInt(args[0])),
      1
    ));

    this.add(new TemplateCommand(
      "beep",
      (printer, args) =>
        printer.beep(parseInt(args[1]), parseInt(args[2])),
      2
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