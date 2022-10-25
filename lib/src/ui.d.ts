export declare function select(prompt: string, questions: {
    [key: string]: unknown;
}): Promise<any>;
export declare function confirm(promptText: string): Promise<any>;
export declare function textInput(promptText: string): Promise<string>;
