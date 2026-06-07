"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WasmSandbox = void 0;
exports.createWasmSandbox = createWasmSandbox;
class WasmSandbox {
    plugins = new Map();
    moduleCache = new Map();
    globalExports = new Map();
    async loadPlugin(name, wasmBytes) {
        try {
            const module = await WebAssembly.compile(wasmBytes);
            const memory = new WebAssembly.Memory({ initial: 256, maximum: 512 });
            const importObject = this.createImportObject(memory);
            const instance = await WebAssembly.instantiate(module, importObject);
            const plugin = this.validatePlugin(instance, name);
            this.moduleCache.set(name, module);
            this.plugins.set(name, plugin);
            this.registerPlugin(plugin);
            console.log(`插件加载成功: ${name}`);
            return plugin;
        }
        catch (error) {
            console.error(`插件加载失败: ${name}`, error);
            throw error;
        }
    }
    createImportObject(memory) {
        return {
            env: {
                memory,
                table: new WebAssembly.Table({ initial: 0, element: 'anyfunc' }),
                __stack_pointer: () => { },
                __data_end: 0,
                __global_base: 0,
                console_log: (ptr, len) => {
                    const str = this.readString(memory, ptr, len);
                    console.log(`[Plugin] ${str}`);
                },
                alloc: (size) => {
                    const offset = memory.buffer._allocOffset || 0;
                    memory.buffer._allocOffset = offset + size;
                    return offset;
                },
                register_component: (typePtr, typeLen) => {
                    const type = this.readString(memory, typePtr, typeLen);
                    console.log(`注册组件类型: ${type}`);
                },
            },
        };
    }
    readString(memory, ptr, len) {
        const buffer = new Uint8Array(memory.buffer, ptr, len);
        return new TextDecoder().decode(buffer);
    }
    validatePlugin(instance, name) {
        const exports = instance.exports;
        if (typeof exports.init !== 'function') {
            throw new Error('插件缺少 init 函数');
        }
        if (typeof exports.get_metadata !== 'function') {
            throw new Error('插件缺少 get_metadata 函数');
        }
        if (typeof exports.render !== 'function') {
            throw new Error('插件缺少 render 函数');
        }
        exports.init();
        const metadata = exports.get_metadata();
        return {
            name,
            instance,
            metadata,
            exports,
            status: 'loaded',
        };
    }
    registerPlugin(plugin) {
        if (plugin.metadata?.components) {
            for (const component of plugin.metadata.components) {
                this.globalExports.set(component.name, {
                    type: 'component',
                    pluginName: plugin.name,
                    component,
                });
            }
        }
    }
    getPlugin(name) {
        return this.plugins.get(name);
    }
    listPlugins() {
        return Array.from(this.plugins.values());
    }
    unloadPlugin(name) {
        const plugin = this.plugins.get(name);
        if (plugin) {
            if (plugin.metadata?.components) {
                for (const component of plugin.metadata.components) {
                    this.globalExports.delete(component.name);
                }
            }
            this.plugins.delete(name);
            this.moduleCache.delete(name);
            console.log(`插件已卸载: ${name}`);
        }
    }
    callPluginMethod(pluginName, methodName, ...args) {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
            throw new Error(`插件不存在: ${pluginName}`);
        }
        const method = plugin.exports[methodName];
        if (typeof method !== 'function') {
            throw new Error(`方法不存在: ${methodName}`);
        }
        return method(...args);
    }
    getGlobalComponents() {
        return Array.from(this.globalExports.values())
            .filter(item => item.type === 'component');
    }
    renderComponent(componentName, props) {
        const component = this.globalExports.get(componentName);
        if (!component) {
            throw new Error(`组件不存在: ${componentName}`);
        }
        const plugin = this.plugins.get(component.pluginName);
        if (!plugin) {
            throw new Error(`插件不存在: ${component.pluginName}`);
        }
        return plugin.exports.render(componentName, JSON.stringify(props));
    }
}
exports.WasmSandbox = WasmSandbox;
function createWasmSandbox() {
    return new WasmSandbox();
}
//# sourceMappingURL=WasmSandbox.js.map