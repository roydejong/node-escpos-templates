import {Network, Printer} from "escpos";
import {EscPosTemplate} from "./EscPosTemplate.js";

const device = new Network("127.0.0.1", 1234);
const printer = new Printer(device);

const template = new EscPosTemplate(`print theName; feed 2; cut;`);
const myVars = {theName: "Bob"};

device.open((err) => {
  // Directly drive printer instructions from the template, with optional variables
  template.print(printer, myVars);
  printer.close();
});