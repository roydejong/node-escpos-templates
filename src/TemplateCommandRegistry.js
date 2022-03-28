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

    this.add(new TemplateCommand(
      "align",
      (printer, args) => {
        switch (args[0]) {
          case "l":
          case "lt":
          case "left":
            printer.align("lt");
            break;
          case "c":
          case "ct":
          case "center":
            printer.align("ct");
            break;
          case "r":
          case "rt":
          case "right":
            printer.align("rt");
            break;
          default:
            throw new Error($`Invalid align mode: ${args[0]}`);
        }
      },
      1
    ));

    this.add(new TemplateCommand(
      "bold",
      (printer, args) => {
        switch (args[0].toString()) {
          case "1":
          case "true":
          case "on":
            printer.text("\x1b\x45\x01"); // Bold font ON
            break;
          case "0":
          case "false":
          case "off":
            printer.text("\x1b\x45\x00"); // Bold font OFF
            break;
          default:
            throw new Error($`Invalid bold mode: ${args[0]}`);
        }
      },
      1
    ));

    this.add(new TemplateCommand(
      "underline",
      (printer, args) => {
        switch (args[0].toString()) {
          case "1":
          case "true":
          case "on":
            printer.text("\x1b\x2d\x01"); // Underline font 1-dot ON
            break;
          case "2":
          case "double":
            printer.text("\x1b\x2d\x02"); // Underline font 2-dot ON
            break;
          case "0":
          case "false":
          case "off":
            printer.text("\x1b\x2d\x00"); // Underline font OFF
            break;
          default:
            throw new Error($`Invalid bold mode: ${args[0]}`);
        }
      },
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