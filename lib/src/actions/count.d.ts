export interface Flags {
    record?: boolean;
    ci?: boolean;
    verbose?: boolean;
    config?: string;
}
export declare const actionCount: (flags: Flags | undefined, clientVersion: string) => Promise<void>;
