import { TaskState } from "./type.ts";

// TODO: 只保存最近的100条消息
export default abstract class Hub {
  static messages: TaskState[] = [];
  static register(message: TaskState) {
    this.messages.push(message);
  }
}
