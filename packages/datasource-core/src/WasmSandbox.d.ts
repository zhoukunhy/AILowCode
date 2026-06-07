export declare class WasmSandbox {
    private plugins;
    private moduleCache;
    private globalExports;
    loadPlugin(name: string, wasmBytes: Uint8Array): Promise<PluginInstance>;
    private createImportObject;
    private readString;
    private validatePlugin;
    private registerPlugin;
    getPlugin(name: string): PluginInstance | undefined;
    listPlugins(): PluginInstance[];
    unloadPlugin(name: string): void;
    callPluginMethod(pluginName: string, methodName: string, ...args: any[]): any;
    getGlobalComponents(): any[];
    renderComponent(componentName: string, props: Record<string, any>): any;
}
export interface PluginInstance {
    name: string;
    instance: any;
    metadata: PluginMetadata;
    exports: any;
    status: 'loaded' | 'error' | 'unloaded';
}
export interface PluginMetadata {
    name: string;
    version: string;
    description?: string;
    author?: string;
    components: ComponentMetadata[];
    dependencies?: string[];
}
export interface ComponentMetadata {
    name: string;
    type: string;
    props: PropDefinition[];
    description?: string;
}
export interface PropDefinition {
    name: string;
    type: string;
    required: boolean;
    default?: any;
    description?: string;
}
export declare function createWasmSandbox(): WasmSandbox;
//# sourceMappingURL=WasmSandbox.d.ts.map