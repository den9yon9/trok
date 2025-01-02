import Builder from "../Builder.ts";
import Dispatcher from "../Dispatcher.ts";

export default function Workspace() {
  return (
    <html>
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/daisyui@4.12.23/dist/full.min.css"
          rel="stylesheet"
          type="text/css"
        />
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <div className="flex">
          <div className="flex gap-2 w-2/5">
            <div className="bg-base-300 flex flex-col gap-2 h-screen overflow-y-scroll p-2">
              {Builder.workspace.map((item) => {
                const list = Dispatcher.queue.filter(({ origin, branch }) =>
                  item.origin === origin && item.branch === branch
                );

                return (
                  <form
                    className="shadow bg-base-100 rounded-2xl p-2 flex flex-col gap-2 border-primary"
                    method="post"
                    action="/"
                    enctype="application/x-www-form-urlencoded"
                  >
                    <div
                      tabIndex={0}
                      className="collapse bg-base-200 collapse-arrow border"
                    >
                      <div className="collapse-title">
                        <a href="">{item.origin}</a>
                        <span className="badge badge-primary badge ml-2">
                          {item.branch}
                        </span>
                      </div>
                      <div className="collapse-content flex flex-wrap gap-1">
                        {item.packages.map((item) => {
                          return (
                            <div
                              className="badge badge-outline badge-accent-content"
                              value={item}
                            >
                              {item}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {list.length !== 0 && (
                      <div className="flex flex-wrap p-5 min-h-32 shadow rounded bg-primary-content rounded-2xl">
                        {list.map((item) => {
                          return (
                            <div className="badge badge-primary">
                              {item.selector}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <input type="hidden" name="origin" value={item.origin} />
                    <input type="hidden" name="branch" value={item.branch} />
                    <input
                      type="text"
                      name="selector"
                      required
                      placeholder="HEAD^...HEAD"
                      className="input input-bordered input"
                    />
                    <button
                      class="btn btn-primary self-end"
                      onClick={() => {
                        fetch("/", {
                          method: "POST",
                          body: JSON.stringify({
                            origin: item.origin,
                            branch: item.branch,
                            selector: "HEAD^...HEAD",
                          }),
                          headers: {
                            "Content-Type": "application/json",
                          },
                        });
                      }}
                    >
                      添加任务
                    </button>
                  </form>
                );
              })}
            </div>
          </div>
          <iframe src="/static/notify.html" class="w-3/5" frameborder="0">
          </iframe>
        </div>
        <script type="module" src="/static/notify.js"></script>
      </body>
    </html>
  );
}
