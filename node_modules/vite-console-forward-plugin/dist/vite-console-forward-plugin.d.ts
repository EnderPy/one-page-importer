import type { Plugin } from "vite";
export interface ConsoleForwardOptions {
    /**
     * Whether to enable console forwarding (default: true in dev mode)
     */
    enabled?: boolean;
    /**
     * API endpoint path (default: '/api/debug/client-logs')
     */
    endpoint?: string;
    /**
     * Console levels to forward (default: ['log', 'warn', 'error', 'info', 'debug'])
     */
    levels?: ("log" | "warn" | "error" | "info" | "debug")[];
}
export declare function consoleForwardPlugin(options?: ConsoleForwardOptions): Plugin;
