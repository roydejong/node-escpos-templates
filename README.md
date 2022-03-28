# escpos-templates

**Generic template engine for formatting [node-escpos](https://github.com/song940/node-escpos) receipts**.

## Installation

Add the `escpos-templates` package to your project:

```bash
yarn add escpos-templates
# or
npm install escpos-templates
```

## Usage

Instantiate `EscPosTemplate` with the template text, then provide it with a `printer` instance and your variables to
directly drive the printer interface:

```javascript
import {EscPosTemplate} from "node-escpos-templates";
import {Printer, Network} from "escpos";

const device = new Network("127.0.0.1", 1234);
const printer = new escpos.Printer(device);

const template = new EscPosTemplate("<template text>");
const myVars = {varKey: "varValue"};

device.open((err) => {
  // Directly drive printer instructions from the template, with optional variables
  template.print(printer, myVars);
  printer.close();
});
```

## Creating templates

This project uses a simple custom syntax to define print templates.

Each print instruction must be placed on separate line, and/or seperated with a semicolon `;`.

### "Hello world" example

A very simple template that prints some text, feeds two lines, then cuts the paper:

```
print "Hello world!";
feed 2;
beep;
cut;
```

### "Hello world" with variables example

When calling `print()` you can provide an object of template variables.

You can refer to these anywhere in a template string by using the `{{variableName}}` syntax. You can also refer to
variables directly as arguments to print commands.

```
# Print "Hello Bob!"
print "Hello {{name}}!";

# Print "Bob" 
print name;
```

```javascript
template.print(printer, {name: "Bob"});
```

## Supported commands

These are the commands that are currently implemented for use in the templates:

| Syntax                | Details                                                                                                          |
|-----------------------|------------------------------------------------------------------------------------------------------------------|
| `print <string:text>` | Prints one line of text                                                                                          |
| `feed <int:n>` | Feed `n` amount of lines.                                                                                        |
| `beep <int:n> <int:t>` | Printer buzzer (beep), where `n` is the amount of buzzes, and `t` is the duration in (`t * 100`) milliseconds.   |