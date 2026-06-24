import { serverUrl } from "../socket/socket";

interface ConnectionHintProps {
  roomId?: string;
}

export function ConnectionHint({ roomId }: ConnectionHintProps) {
  const pageUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareText = roomId
    ? `${pageUrl}  房间号：${roomId}`
    : pageUrl;

  return (
    <section className="connectionHint">
      <strong>联机地址</strong>
      <p>当前页面：{pageUrl}</p>
      <p>后端服务：{serverUrl}</p>
      {roomId && <p>发给朋友：{shareText}</p>}
      <small>如果使用临时隧道或局域网地址打开页面，这里会显示本次可分享的访问地址。</small>
    </section>
  );
}
