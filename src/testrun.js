import {Network, Printer} from "escpos";
import {EscPosTemplate} from "./EscPosTemplate.js";

const device = new Network("127.0.0.1", 1234);
const printer = new Printer(device);

const templateText =
  `align center; bold on; underline double; feed 2; print "Big boy title";`
  + `feed 2; cut;`
;

const template = new EscPosTemplate(templateText);
const myVars = {theName: "Bob"};

device.open((err) => {
  // Directly drive printer instructions from the template, with optional variables
  template.print(printer, myVars);
  printer.close();
});