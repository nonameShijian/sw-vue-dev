const http = require("http");
const path = require("path");
const url = require("url");
const fs = require("fs");

// 生成importmap
const generate = require("./generate-importmap.cjs");
generate();

let port;
try {
  port = Number(process.argv.slice(2)[0].split("=")[1]);
} catch (error) {
  port = 8080;
}

// 创建HTTP服务器
const server = http.createServer((request, response) => {
  if (!request.url) {
    response.writeHead(400, { "Content-Type": getType("txt") });
    response.write("error");
    response.end();
    return;
  }
  var u = url.parse(request.url);
  if (!u.pathname) {
    response.writeHead(400, { "Content-Type": getType("txt") });
    response.write("error");
    response.end();
    return;
  }

  // 新增：SSE 连接路径
  if (u.pathname === "/sse") {
    handleSSE(request, response);
    return;
  }

  switch (u.pathname) {
    case "/":
      fs.readFile(
        path.join(__dirname, "../", "./index.html"),
        function (err, content) {
          if (err) {
            response.writeHead(404, {
              "Content-Type": 'text/plain; charset="UTF-8"',
            });
            response.write(err.message);
            response.end();
          } else {
            response.writeHead(200, {
              "Content-Type": "text/html; charset=UTF-8",
            });
            response.write(content);
            response.end();
          }
        }
      );
      break;
    default:
      var filename = u.pathname.substring(1);
      var type = getType(filename.substring(filename.lastIndexOf(".") + 1));
      fs.readFile(
        path.join(__dirname, "../", filename),
        function (err, content) {
          if (err) {
            response.writeHead(404, {
              "Content-Type": getType("txt"),
            });
            response.write(err.message);
            response.end();
          } else {
            response.writeHead(200, { "Content-Type": type });
            response.write(content);
            response.end();
          }
        }
      );
  }
});

function getType(endTag) {
  var type = null;
  switch (endTag) {
    case "html":
    case "htm":
      type = "text/html; charset=UTF-8";
      break;
    case "js":
    case "mjs":
    case "cjs":
      type = 'application/javascript; charset="UTF-8"';
      break;
    case "css":
      type = 'text/css; charset="UTF-8"';
      break;
    case "txt":
      type = 'text/plain; charset="UTF-8"';
      break;
    case "manifest":
      type = 'text/cache-manifest; charset="UTF-8"';
      break;
    default:
      type = "application/octet-stream";
      break;
  }
  return type;
}

let address;

/**
 * @param { (addressInfo: import("net").AddressInfo | string | null) => any } callback
 */
const listen = function (callback) {
  if (!address) {
    server.listen(port, () => {
      address = server.address();
      callback(address);
    });
  } else {
    callback(address);
  }
};

// 启动http端口并唤起浏览器
listen((addressInfo) => {
  const child_process = require("child_process");
  if (addressInfo) {
    if (typeof addressInfo === "string") {
      console.log(`server start at ${addressInfo}`);
      child_process.exec(`start ${addressInfo}`);
    } else {
      let ad;
      if (addressInfo.address === "::") {
        ad = `http://localhost:${addressInfo.port}`;
      } else {
        ad = `http://${addressInfo.address}:${addressInfo.port}`;
      }
      console.log(`server start at ${ad}`);
      child_process.exec(`start ${ad}`);
    }
  }
});

// 使用Server-Sent Events (SSE) 实现文件变化通知
// 存储所有连接的客户端
let clients = [];

// SSE 路由处理
function handleSSE(request, response) {
  response.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // 将客户端加入列表
  const clientId = Date.now();
  clients.push({
    id: clientId,
    write: (data) => {
      response.write(`data: ${data}\n\n`);
    },
  });

  // 当客户端断开连接时移除
  request.on("close", () => {
    clients = clients.filter((client) => client.id !== clientId);
  });
}

// 监听指定目录下的非importmap.js文件变化，并通知客户端
function watchDirectory(directory) {
  fs.watch(directory, { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith("importmap.js")) {
      return;
    }
    console.log(`${filename} changed`);
    // 重新生成importmap
    generate();
    // 向所有连接的客户端发送消息
    clients.forEach((client) =>
      client.write(JSON.stringify({ event: "file_change", file: filename }))
    );
  });
}

// 监听 ../ 目录下的文件变化
watchDirectory(path.join(__dirname, "../"));
