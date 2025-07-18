// 全局错误使用alert处理
"use strict";
(() => {
  window.onerror = function (msg, src, line, column, err) {
    let str = `错误文件: ${
      typeof src == "string" && src.length > 0 ? decodeURI(src) : "未知文件"
    }`;
    str += `\n错误信息: ${msg}`;
    str += `\n行号: ${line}`;
    str += `\n列号: ${column}`;
    if (err && err.stack) str += "\n" + decodeURI(err.stack);
    console.error(str);
    alert(str);
  };
  const STACK_REGEXP = /^\s*at .*(\S+:\d+|\(native\))/m;
  const errorList = [];
  function extractLocation(urlLike) {
    // 不存在地址信息的字符串
    if (!/:/.test(urlLike)) {
      return [urlLike];
    }

    // 捕获位置用到的正则
    const regExp = /(.+?)(?::(\d+))?(?::(\d+))?$/;
    const parts = regExp.exec(urlLike.replace(/[()]/g, ""));

    // @ts-ignore
    return [parts[1], parts[2] || void 0, parts[3] || void 0];
  }
  window.onunhandledrejection = async (event) => {
    event.promise.catch((error) => {
      console.log(error);
      // 如果`error`是个错误，则继续处理
      if (error instanceof Error) {
        // 如果已经处理过该错误，则不再处理
        if (errorList.includes(error)) return;
        errorList.push(error);
        // 如果`error`拥有字符串形式的报错栈堆，且报错栈堆确实符合v8的stack
        if (typeof error.stack === "string" && STACK_REGEXP.test(error.stack)) {
          // 获取符合栈堆信息的字符串，一般来说就是从第二行开始的所有行
          // 为了处理eval的情况，故必须获取完行数
          let lines = error.stack
            .split("\n")
            .filter((line) => STACK_REGEXP.test(line));

          // 提供类型信息防止vscode报错
          /**
           * @type {string | undefined}
           */
          let fileName = void 0;

          /**
           * @type {number | undefined}
           */
          let line = void 0;

          /**
           * @type {number | undefined}
           */
          let column = void 0;

          // 从第一条开始遍历，一直遍历到不存在eval的位置
          for (let currentLine = 0; currentLine < lines.length; ++currentLine) {
            if (/\(eval /.test(lines[currentLine])) continue;

            let formatedLine = lines[currentLine]
              .replace(/^\s+/, "")
              .replace(/\(eval code/g, "(")
              .replace(/^.*?\s+/, "");

            const location = formatedLine.match(/ (\(.+\)$)/);
            if (location) formatedLine = formatedLine.replace(location[0], "");

            const locationParts = extractLocation(
              location ? location[1] : formatedLine
            );

            fileName = ["eval", "<anonymous>"].includes(locationParts[0])
              ? void 0
              : locationParts[0];
            line = Number(locationParts[1]);
            column = Number(locationParts[2]);
            break;
          }

          // @ts-ignore
          window.onerror(error.message, fileName, line, column, error);
        }
        // 反之我们只能不考虑报错文件信息，直接调用onerror
        else {
          try {
            // @ts-ignore
            let [_, src = void 0, line = void 0, column = void 0] =
              /at\s+.*\s+\((.*):(\d*):(\d*)\)/i.exec(
                // @ts-ignore
                error.stack.split("\n")[1]
              );
            if (typeof line == "string") line = Number(line);
            if (typeof column == "string") column = Number(column);
            // @ts-ignore
            window.onerror(error.message, src, line, column, error);
          } catch (e) {
            // @ts-ignore
            window.onerror(error.message, "", 0, 0, error);
          }
        }
      }
    });
  };
})();
