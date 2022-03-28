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
const printer = new Printer(device);

const template = new EscPosTemplate(`print \"Hello {{theName}}!"; feed 2; cut;`);
const myVars = {theName: "Bob"};

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

### Advanced example with formatting and loop


## Supported commands

These are the commands that are currently implemented for use in the templates:

| Syntax         | Details                                    |
|----------------|--------------------------------------------|
| `print [text]` | Prints one line of `text`                  |
| `feed [n]`     | Feed `n` amount of lines.                  |
| `beep [n] [t]` | Beep `n` times for `t` × 100 ms duration   |
| `cut`          | Feeds one line then performs a full cut    |
| `cashdraw [p]` | Pulses the cash drawer kick on pin `p`     | 
| `align [a]`    | Align text `left`, `center` or `right`     | 
