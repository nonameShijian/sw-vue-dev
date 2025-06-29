"use strict";

(async function () {
	// 不支持file协议
	if (location.protocol.startsWith("file")) {
		return alert("本项目不支持以file协议启动，请使用http/s协议启动");
	}

	// 必须启用serviceWorker
	if (!("serviceWorker" in navigator)) {
		return alert("本项目需要使用serviceWorker，请检查浏览器是否支持serviceWorker");
	}

	// 检查 window 对象中是否存在 "__core-js_shared__" 属性
	if (!("__core-js_shared__" in window)) {
		// 如果不存在，则执行以下操作
		await new Promise(resolve => {
			// 创建一个新的 <script> 元素
			const coreJSBundle = document.createElement("script");
			// 为 script 元素设置 onerror 和 onload 事件处理程序
			// 当出错或加载完成时，调用 resolve 函数以解决 Promise
			coreJSBundle.onerror = coreJSBundle.onload = resolve;
			// 设置 script 元素的 src 属性，指向 core-js-bundle.js 文件
			coreJSBundle.src = `/core/core-js-bundle.js`;
			// 将 script 元素添加到 document.head 中
			document.head.appendChild(coreJSBundle);
		});
	}

	// 处理electron中渲染进程开启了node环境下的http情况
	if (typeof window.require == "function" && typeof window.process == "object" && typeof window.__dirname == "string") {
		// 在http环境下修改__dirname和require的逻辑
		if (window.__dirname.endsWith("electron.asar\\renderer") || window.__dirname.endsWith("electron.asar/renderer")) {
			const path = require("path");
			if (window.process.platform === "darwin") {
				// @ts-ignore
				window.__dirname = path.join(window.process.resourcesPath, "app");
			} else {
				window.__dirname = path.join(path.resolve(), "resources/app");
			}
			const oldData = Object.entries(window.require);
			// @ts-ignore
			window.require = function (moduleId) {
				try {
					return module.require(moduleId);
				} catch {
					return module.require(path.join(window.__dirname, moduleId));
				}
			};
			oldData.forEach(([key, value]) => {
				window.require[key] = value;
			});
		}
		// 增加使用require函数导入ts的逻辑
		window.require.extensions[".ts"] = function (module, filename) {
			// @ts-ignore
			const _compile = module._compile;
			// @ts-ignore
			module._compile = function (code, fileName) {
				/**
				 *
				 * @type { import("typescript") }
				 */
				// @ts-ignore
				const ts = require("./game/typescript.js");
				// 使用ts compiler对ts文件进行编译
				const result = ts.transpile(
					code,
					{
						module: ts.ModuleKind.CommonJS,
						target: ts.ScriptTarget.ES2020,
						inlineSourceMap: true,
						resolveJsonModule: true,
						esModuleInterop: true,
					},
					fileName
				);
				// 使用默认的js编译函数获取返回值
				return _compile.call(this, result, fileName);
			};
			// @ts-ignore
			module._compile(require("fs").readFileSync(filename, "utf8"), filename);
		};
	}

	// 加载serviceWorker
	if ("serviceWorker" in navigator) {
		let scope = new URL("./", location.href).toString();
		let registrations = await navigator.serviceWorker.getRegistrations();
		let findServiceWorker = registrations.find(registration => {
			return registration && registration.active && registration.active.scriptURL == `${scope}service-worker.js`;
		});

		try {
			const registration_1 = await navigator.serviceWorker.register(`${scope}service-worker.js`, {
				// firefox不支持module worker
				type: "module",
				updateViaCache: "all",
				scope,
			});
			// 初次加载worker，需要重新启动一次
			if (!findServiceWorker) location.reload();
			// 接收消息
			navigator.serviceWorker.addEventListener("message", e => {
				if (e.data?.type === "reload") {
					window.location.reload();
				}
			});
			// 发送消息
			// navigator.serviceWorker.controller.postMessage({ action: "reload" });
			registration_1.update().catch(e => console.error("worker update失败", e));
			// 测试是否可以正常导入ts文件，如果失败则重新加载页面
			if (!sessionStorage.getItem("canUseTs")) {
				await import("./canUse.ts")
					.then(({ text }) => console.log(text))
					.catch(() => {
						sessionStorage.setItem("canUseTs", "1");
						location.reload();
					});
			}
		} catch (e_1) {
			console.log("serviceWorker加载失败: ", e_1);
			throw e_1;
		}
	}
})();
