import { join } from "@std/path/join";
import { asta } from "@rawrxd/asta";
import { ExecLog, Package } from "./type.ts";
import { Repository, StreamData, Task } from "./type.ts";
import filterPackages from "./filterPackages.ts";
import findGitRepositories from "./findGitRepositories.ts";
import getPackageManager from "./getPackageManager.ts";
import { cloneObj, getCommits, isSameGitOrigin } from "./util.ts";
import { resolve } from "@std/path/resolve";
import Notify from "./Notify.ts";

const dir = resolve(Deno.cwd(), "..", "ola");

export default class Builder {
  static workspace = findGitRepositories(dir);

  static mitt = asta<{ data: StreamData }>();
  private static async installPackage(
    absolutePackagePath: string,
    onStream: (data: string) => void,
  ) {
    const packageManager = getPackageManager(absolutePackagePath);
    const abortController = new AbortController();
    setTimeout(() => abortController.abort(), 5 * 60 * 1000); // 5分钟超时
    const process = new Deno.Command(packageManager, {
      cwd: absolutePackagePath,
      args: [packageManager === "npm" ? "ci" : "--frozen-lockfile", "install"],
      stderr: "piped",
      stdout: "piped",
      signal: abortController.signal,
    }).spawn();

    let stdout = "";
    let stderr = "";

    this.read(process.stdout.getReader(), (data) => {
      onStream(data);
      stdout += data;
    });

    this.read(process.stderr.getReader(), (data) => {
      onStream(data);
      stderr += data;
    });
    const { signal, success } = await process.status;
    if (!success) throw { signal, stdout, stderr };
  }

  private static async buildPackage(
    absolutePackagePath: string,
    onStream: (data: string) => void,
  ) {
    const packageManager = getPackageManager(absolutePackagePath);
    const process = new Deno.Command(packageManager, {
      cwd: absolutePackagePath,
      args: ["run", "build"],
      stderr: "piped",
      stdout: "piped",
    }).spawn();

    let stdout = "";
    let stderr = "";

    this.read(process.stdout.getReader(), (data) => {
      onStream(data);
      stdout += data;
    });

    this.read(process.stderr.getReader(), (data) => {
      onStream(data);
      stderr += data;
    });
    const { success, signal } = await process.status;
    if (!success) throw { signal, stdout, stderr };
  }

  // 检查打包产物是否污染仓库
  private static checkRepositoryDirty(repository: Repository) {
    const process = new Deno.Command("git", {
      args: ["status", "-s", repository.path],
      stderr: "piped",
      stdout: "piped",
    }).outputSync();
    const isDirty = process.success && !process.stdout;
    if (!isDirty) return;
    new Deno.Command("git", {
      args: ["reset", "HEAD", "--hard"],
      cwd: repository.path,
    }).outputSync();
    const a = new Deno.Command("git", {
      args: ["clean", "-fd"],
      cwd: repository.path,
    }).outputSync();

    new TextDecoder().decode(a.stdout);

    throw new Error(`源码仓库工作区有变更: \n${process.stdout}`);
  }

  static async run(task: Task) {
    const repository = this.workspace.find((repo) =>
      isSameGitOrigin(repo.origin, task.origin)
    );
    if (!repository) {
      throw new Error(`repository ${task.origin} not found`);
    }
    if (repository.branch !== task.branch) {
      throw new Error(`branch ${task.branch} not found`);
    }
    const packages: Package[] = filterPackages(repository, task).map((item) => (
      { ...item, status: "pending" }
    ));

    const commits = getCommits(repository.path, task.selector);

    Notify.register(cloneObj({ task, status: "pending", packages, commits }));

    for (const item of packages) {
      const packagePath = join(repository.path, item.path);
      try {
        await this.installPackage(
          packagePath,
          (data) => this.mitt.emit("data", { task, data, packagePath }),
        );
        await this.buildPackage(
          packagePath,
          (data) =>
            this.mitt.emit("data", { task, data, packagePath: item.path }),
        );
        item.status = "resolved";
      } catch (err) {
        item.status = "rejected";
        item.logs = err as ExecLog | Error;
        continue;
      }
      await this.checkRepositoryDirty(repository);
    }

    Notify.register(cloneObj({ task, status: "resolved", packages, commits }));
  }

  private static async read(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    onData: (data: string) => void,
  ) {
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onData(decoder.decode(value));
    }
  }
}
