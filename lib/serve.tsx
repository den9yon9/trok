import { Hono } from "hono";
import { serveStatic, upgradeWebSocket } from "hono/deno";
import Dispatcher from "./Dispatcher.ts";
import Hub from "./Hub.ts";
import { Task, TaskState } from "./type.ts";
import Builder from "./Builder.ts";
import Notify from "./Notify.ts";
import Workspace from "./ui/Workspace.tsx";

export default function serve(port: number) {
  Dispatcher.start();
  const app = new Hono();
  app.use("/static/*", serveStatic({ root: "./" }));

  /**
   * @description 首页
   */
  app.get("/", (ctx) => ctx.html(<Workspace />));

  /**
   * @description 提交任务
   */
  app.post("/", async (ctx) => {
    const task = await ctx.req.parseBody() as Omit<Omit<Task, "id">, "commits">;
    const id = Math.round(Math.random() * 100000000).toString();
    Dispatcher.register({ ...task, id });
    return ctx.redirect("/");
  });

  /**
   * @description 获取任务列表
   */
  app.get("/task", (ctx) => ctx.json(Dispatcher.queue));

  /**
   * @description 获取仓库列表
   */
  app.get("/workspace", (ctx) => ctx.json(Builder.workspace));

  /**
   * @description 获取消息列表
   */
  app.get("/messages", (ctx) => ctx.json(Notify.messages));

  /**
   * @description 消息中心, 汇聚其他tork提交的信息，集中展示
   */
  app.get("/hub", (ctx) => ctx.redirect("/static/hub.html"));

  /**
   * @description 向其他服务的消息中心提交消息
   */
  app.post("/hub", async (ctx) => {
    const message = await ctx.req.json<TaskState>(); // 从请求体中解析任务数据
    Hub.register(message);
  });

  app.get(
    "/hub/ws",
    upgradeWebSocket(() => ({
      onOpen(_, ws) {
        Notify.mitt.on(
          "message",
          (message) => ws.send(JSON.stringify(message)),
        );
      },
    })),
  );

  /**
   * @description 向websocket推送最新消息
   */
  app.get(
    "/ws",
    upgradeWebSocket(() => ({
      onOpen(_, ws) {
        Notify.mitt.on(
          "message",
          (message) => ws.send(JSON.stringify(message)),
        );
      },
    })),
  );

  app.get("/hub/message", (ctx) => ctx.json(Hub.messages));

  Deno.serve({ port }, app.fetch);
}
