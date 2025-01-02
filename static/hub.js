import { h, render } from "https://esm.sh/preact@10.25.3";
import {
  useState,
  useEffect,
  useCallback,
} from "https://esm.sh/preact@10.25.3/hooks";
import { Fragment } from "https://esm.sh/preact@10.25.3";

import htm from "https://esm.sh/htm@3.1.1";
const html = htm.bind(h);

function notifyMe(message) {
  if (!("Notification" in window)) alert("当前浏览器不支持桌面通知");
  else if (Notification.permission === "granted") new Notification(message);
  else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") new Notification(message);
    });
  }
}

function useMessages() {
  const [messages, setMessages] = useState([]);

  const invalidate = useCallback(() => {
    fetch("/hub/ws")
      .then((res) => res.json())
      .then((data) => setMessages(data));
  }, []);
  useEffect(() => void invalidate(), [invalidate]);

  useEffect(() => {
    const client = new WebSocket(`ws://${location.host}/ws`);
    client.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      notifyMe(
        { pending: "开始处理", resolved: "处理完成", rejected: "处理失败" }[
          message.status
        ]
      );
      setMessages((messages) => [...messages, message]);
    });
    client.addEventListener("error", (event) => {
      console.log(event);
    });
  }, []);

  return { messages, invalidate };
}

function App() {
  const { messages } = useMessages([]);
  return html`<div class="p-5">
    ${messages.map((item) => {
      return html`<div
        class=${`flex flex-col gap-0 items-start chat chat-start mb-5`}
      >
        <div className="chat-header opacity-50 mb-1">
          ${{
            pending: "开始处理: ",
            resolved: "处理完成: ",
            rejected: "处理失败: ",
          }[item.status]}
        </div>
        <div
          class=${`chat-bubble chat-bubble-${
            { pending: "", resolved: "success", rejected: "error" }[item.status]
          }`}
        >
          ${item.commits &&
          html`<${Fragment}>
            <h6>提交记录</h6>
            <ul class="text-xs">
              ${item.commits.map((commitItem) => {
                return html`<li>✦ ${commitItem}</li>`;
              })}
            </ul>
          </${Fragment}>`}
          <h6 class="mt-2">项目列表</h6>
          <ul class="text-xs">
            ${item.packages.map((packageItem) => {
              return html`<${Fragment}>
	      <li>${
          { pending: "✦", rejected: "✗", resolved: "✓" }[packageItem.status]
        } ${packageItem.path}</li>
	      ${
          packageItem.logs &&
          html`<div class="text-xs">
            ${typeof packageItem.logs === "string"
              ? html`<pre class="bg-error-content rounded text-error p-2 my-2">
${packageItem.logs}</pre
                >`
              : html`<${Fragment}>
		<pre class="overflow-x-scroll bg-info-content rounded text-info"><code>${packageItem.logs.stdout}</code></pre>
		<pre class="overflow-x-scroll bg-error-content rounded text-error p-2 my-2"><code >${packageItem.logs.stderr}</code></pre>
	      </${Fragment}>`}
          </div>`
        }
	      </${Fragment}>`;
            })}
          </ul>
        </div>

        <div className="chat-footer opacity-50">
          ${item.task.origin}
          <span className="text-xs badge badge-xs badge-primary mx-2"
            >${item.task.branch}</span
          >
          <span class="kbd kbd-xs"> ${item.task.selector}</span>
        </div>
      </div>`;
    })}
  </div>`;
}

render(html`<${App} />`, document.getElementById("app"));
