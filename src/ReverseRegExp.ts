

export class ReverseRegExp {
    private regex: RegExp;

    public reversed = true;

    constructor(str: string) {
        this.regex = new RegExp(str);
    }

    test(str: string) {
        return !this.regex.test(str);
    }
}