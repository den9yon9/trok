import Builder from "./Builder.ts";
import Notify from "./Notify.ts";
import { Task } from "./type.ts";

export default abstract class Dispatcher {
  static queue: Task[] = [];

  static start() {
    this.dispatch();
  }

  static register(task: Task) {
    this.queue.push(task);
  }

  static async dispatch() {
    const task = this.queue.shift();
    try {
      if (task) await Builder.run(task);
    } catch (err) {
      Notify.register({
        task: task!,
        status: "rejected",
        message: (err as Error).message,
      });
    }
    setTimeout(() => this.dispatch(), 3000);
  }
}
