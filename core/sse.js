const eventSource = new EventSource("/sse");

eventSource.onmessage = function (event) {
  const data = JSON.parse(event.data);
  console.log("文件已修改:", data.file);
  location.reload();
};
