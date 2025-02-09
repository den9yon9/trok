export type Repository = {
  origin: string;
  path: string;
  branch: string;
  packages: string[];
};

export type Task = {
  id: string;
  origin: string;
  branch: string;
  selector: string;
  from: string;
};

export type StreamData = {
  task: Task;
  data: string;
};

export type ExecLog = {
  signal: Deno.Signal;
  stdout: string;
  stderr: string;
};

export type Package = {
  path: string;
  status: "pending" | "progress" | "resolved" | "rejected";
  logs?: ExecLog | string;
};

export type Snapshot = {
  task: Task;
  timestamp: number;
  status: "pending" | "progress" | "resolved" | "rejected";
  commits?: string[];
  packages?: Package[];
  logs?: ExecLog | string;
};

export type SocketData = {
  type: "snapshot";
  data: Snapshot;
} | {
  type: "stream";
  data: StreamData;
};

export type GithubWebhookBody = {
  ref: string;
  compare: string;
  repository: { html_url: string };
  sender: { login: string };
};
