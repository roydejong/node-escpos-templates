export class ArgValidation {
  constructor(type, value) {
    this.type = type;
    this.value = parseInt(value);

    if (isNaN(this.value))
      throw new Error("Invalid value argument: must be integer")
  }

  validate(args) {
    const len = args.length;

    if (this.type === ArgValidation.TypeAtMost) {
      return len <= this.value;
    } else if (this.type === ArgValidation.TypeAtLeast) {
      return len >= this.value;
    } else if (this.type === ArgValidation.TypeExactly) {
      return len === this.value;
    } else {
      throw new Error("Invalid ArgValidation type");
    }
  }

  getErrorMessage(args) {
    const len = args.length;

    switch (this.type) {
      case ArgValidation.TypeExactly:
        return `Got ${len} args, but expected exactly ${this.value}`;
      case ArgValidation.TypeAtLeast:
        return `Got ${len} args, but expected at least ${this.value}`;
      case ArgValidation.TypeAtMost:
        return `Got ${len} args, but expected at most ${this.value}`;
      default:
        throw new Error("Invalid ArgValidation type");
    }
  }

  static Exactly(amount) {
    return new ArgValidation(ArgValidation.TypeAtMost, amount);
  }

  static AtLeast(amount) {
    return new ArgValidation(ArgValidation.TypeAtLeast, amount);
  }

  static AtMost(amount) {
    return new ArgValidation(ArgValidation.TypeAtMost, amount);
  }
}

ArgValidation.TypeExactly = "exactly";
ArgValidation.TypeAtLeast = "atleast";
ArgValidation.TypeAtMost = "atmost";