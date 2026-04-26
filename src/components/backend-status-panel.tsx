import type { BackendStatus } from "@/lib/backend-status";

const envLabels: Record<string, string> = {
  DATABASE_URL: "PostgreSQL DATABASE_URL",
  ALIYUN_ACCESS_KEY_ID: "阿里云 AccessKey ID",
  ALIYUN_ACCESS_KEY_SECRET: "阿里云 AccessKey Secret",
  ALIYUN_OSS_ROLE_ARN: "阿里云 OSS RoleArn",
  ALIYUN_OSS_BUCKET: "阿里云 OSS Bucket",
  ALIYUN_OSS_REGION: "阿里云 OSS Region",
  ALIYUN_OSS_ENDPOINT: "阿里云 OSS Endpoint",
};

type BackendStatusPanelProps = {
  status: BackendStatus;
};

function getDatabasePill(status: BackendStatus) {
  if (!status.configured.database) {
    return { ok: false, detail: "\u672a\u914d\u7f6e" };
  }

  if (status.database.reachable === false) {
    return { ok: false, detail: "\u8fde\u63a5\u5f02\u5e38" };
  }

  if (status.database.schemaReady === false) {
    return { ok: false, detail: "\u672a\u8fc1\u79fb" };
  }

  if (status.database.schemaReady === true) {
    return { ok: true, detail: "\u5df2\u5c31\u7eea" };
  }

  return { ok: true, detail: "\u5df2\u914d\u7f6e" };
}

export function BackendStatusPanel({ status }: BackendStatusPanelProps) {
  if (status.ready) {
    return null;
  }

  const missing = status.missingEnv.map((name) => envLabels[name] ?? name);
  const databasePill = getDatabasePill(status);

  return (
    <section
      data-testid="backend-status-panel"
      className="rounded-lg border border-[#d7a24f]/40 bg-[#fffaf1] p-4 text-[#3b3027] shadow-sm ring-1 ring-black/5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-black text-[#b6682e]">后端未完全接通</p>
          <h2 className="mt-1 text-lg font-black text-[#17120d]">
            当前运行在本地预览模式
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#6b5847]">
            现在可以浏览演示动态；发布、图片上传和资料编辑会在服务准备好后开放。
          </p>
        </div>
        <div className="grid min-w-56 gap-2 text-sm font-semibold">
          <StatusPill
            label="数据库"
            ok={databasePill.ok}
            detail={databasePill.detail}
          />
          <StatusPill
            label="Clerk 登录"
            ok={status.configured.clerk}
            detail={status.configured.clerkKeyless ? "Keyless" : undefined}
          />
          <StatusPill label="阿里云 OSS" ok={status.configured.oss} />
        </div>
      </div>

      {missing.length > 0 ? (
        <p className="mt-4 rounded-md bg-white/70 px-3 py-2 text-xs font-semibold leading-5 text-[#7f4f2a] ring-1 ring-black/5">
          缺少：{missing.join("、")}
        </p>
      ) : null}
      {status.database.error ? (
        <p className="mt-3 rounded-md bg-white/70 px-3 py-2 text-xs font-semibold leading-5 text-[#7f4f2a] ring-1 ring-black/5">
          数据库状态：{status.database.error}
        </p>
      ) : null}
    </section>
  );
}

function StatusPill({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail?: string;
}) {
  return (
    <span className="inline-flex items-center justify-between gap-3 rounded-full bg-white/75 px-3 py-1.5 ring-1 ring-black/10">
      <span>{label}</span>
      <span className={ok ? "text-[#52733d]" : "text-[#b23b2b]"}>
        {detail ?? (ok ? "已配置" : "缺失")}
      </span>
    </span>
  );
}
