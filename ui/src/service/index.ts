import { useCallback, useEffect, useState } from "preact/hooks";
import type {
  Repository,
  Snapshot,
  SocketData,
  Task,
  TaskHubItem,
} from "../../../lib/type.ts";
import mitt from "../../../lib/mitt.ts";

function notifyMe(message: string) {
  if (!("Notification" in window)) alert("当前浏览器不支持桌面通知");
  else if (Notification.permission === "granted") new Notification(message);
  else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") new Notification(message);
    });
  }
}

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Repository[]>([]);

  const fetchWorkspace = useCallback(
    () => void fetch("/workspace").then((res) => res.json()).then(setWorkspace),
    [],
  );

  useEffect(() => void fetchWorkspace(), []);

  return { workspace, fetchWorkspace };
}

export function useTaskHubList() {
  const [list, setList] = useState<TaskHubItem[]>([]);
  const fetchTasks = useCallback(
    () => fetch("/task").then((res) => res.json()).then(setList),
    [],
  );
  useEffect(() => void fetchTasks(), []);
  return { list, fetchTasks };
}

export class Socket {
  static mitt = mitt<{ data: SocketData }>();
  static client = new WebSocket(location.href.replace("http", "ws"));
  static timer: number;

  static {
    this.client.addEventListener("open", () => this.client.send("PING"));
    this.client.addEventListener("message", (e) => {
      if (e.data === "PONG") {
        setTimeout(() => this.client.send("PING"), 10 * 1000);
      } else {
        const data = JSON.parse(e.data) as SocketData;
        this.mitt.emit("data", data);
      }
    });

    this.client.addEventListener("close", (e) => {
      clearInterval(this.timer);
      if (
        globalThis.confirm(`socket已断开,code: ${e.code}, reason: ${e.reason}`)
      ) globalThis.location.reload();
    });
  }
}

export function useSnapshots() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  useEffect(() => {
    fetch("/snapshot").then((res) => res.json()).then(setSnapshots).then(
      () => {
        Socket.mitt.on("data", (data) => {
          if (data.type === "snapshot") {
            notifyMe(
              {
                pending: "开始处理",
                progress: "开始打包",
                resolved: "处理完成",
                rejected: "处理失败",
              }[data.data.status],
            );
            setSnapshots((snapshot) => [...snapshot!, data.data]);
          }
        });
      },
    );
  }, []);
  return snapshots;
}
