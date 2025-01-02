import {
  useState,
  useEffect,
  useCallback,
} from "https://esm.sh/preact@10.25.3/hooks";

import htm from "https://esm.sh/htm@3.1.1";
import { h } from "https://esm.sh/preact@10.25.3";
const html = htm.bind(h);

function useWorkspace() {
  const [workspace, setWorkspace] = useState([]);

  const invalidate = useCallback(() => {
    fetch("/workspace")
      .then((res) => res.json())
      .then((data) => setWorkspace(data));
  }, []);
  useEffect(() => void invalidate(), [invalidate]);

  return { workspace, invalidate };
}

function useTasks() {
  const [tasks, setTasks] = useState([]);

  const invalidate = useCallback(() => {
    fetch("/task")
      .then((res) => res.json())
      .then((data) => setTasks(data));
  }, []);
  useEffect(() => void invalidate(), [invalidate]);

  return { tasks, invalidate };
}

export default function Workspace() {
  const { workspace } = useWorkspace();
  const { tasks, invalidate } = useTasks();
  return html` <div className="flex gap-2 w-2/5">
    <div
      className="bg-base-300 flex flex-col gap-2 h-screen overflow-y-scroll p-2"
    >
      ${workspace.map((item) => {
        const list = tasks.filter(
          ({ origin, branch }) =>
            item.origin === origin && item.branch === branch
        );

        return html` <form
          className="shadow bg-base-100 rounded-2xl p-2 flex flex-col gap-2 border-primary"
          onSubmit=${(e) => {
            console.log(e);
            e.preventDefault();
            const formdata = new FormData(e.currentTarget);
            console.log(formdata.get("selector"));

            fetch("/", {
              method: "POST",
              body: JSON.stringify({
                origin: item.origin,
                branch: item.branch,
                selector: formdata.get("selector"),
              }),
              headers: {
                "Content-Type": "application/json",
              },
            }).then(() => invalidate());
          }}
        >
          <div
            tabindex="{0}"
            className="collapse bg-base-200 collapse-arrow border"
          >
            <div className="collapse-title">
              <a href="">${item.origin}</a>
              <span className="badge badge-primary badge ml-2">
                ${item.branch}
              </span>
            </div>
            <div className="collapse-content flex flex-wrap gap-1">
              ${item.packages.map((item) => {
                return html`<div
                  className="badge badge-outline badge-accent-content"
                  value=${item}
                >
                  ${item}
                </div>`;
              })}
            </div>
          </div>

          ${list.length !== 0 &&
          html`<div
            className="flex flex-wrap p-5 min-h-32 shadow rounded bg-primary-content rounded-2xl"
          >
            ${list.map((item) => {
              return html`<div className="badge badge-primary">
                ${item.selector}
              </div>`;
            })}
          </div>`}
          <input
            type="text"
            name="selector"
            required
            placeholder="HEAD^...HEAD"
            className="input input-bordered input"
          />
          <button class="btn btn-primary self-end">添加任务</button>
        </form>`;
      })}
    </div>
  </div>`;
}
