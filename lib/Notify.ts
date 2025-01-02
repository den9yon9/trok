import { asta } from "@rawrxd/asta";
import { TaskState } from "./type.ts";

// TODO: 只保存最近的100条消息
export default abstract class Notify {
  static mitt = asta<{ message: TaskState }>();
  static messages: TaskState[] = [];
  static register(message: TaskState) {
    this.messages.push(message);
    this.mitt.emit("message", message);
  }
}
