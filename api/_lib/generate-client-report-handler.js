import { attachCanonicalDeliveryAction } from "./canonical-delivery-action.js";

const loadImplHandler = async () => (await import("./generate-client-report-impl.js")).default;

export async function runCanonicalReportRenderer({ body, headers = {} }) {
  let statusCode = 200;
  let payload = null;
  const req = {
    method: "POST",
    body: body || {},
    headers,
    query: {},
  };
  const res = {
    status(code) {
      statusCode = Number(code) || 500;
      return this;
    },
    json(value) {
      payload = attachCanonicalDeliveryAction(value);
      return payload;
    },
  };

  const implHandler = await loadImplHandler();
  await implHandler(req, res);
  return Object.freeze({
    ok: statusCode >= 200 && statusCode < 300,
    status: statusCode,
    payload,
  });
}

export default async function handler(req, res) {
  const originalJson = res.json.bind(res);
  res.json = (payload) => originalJson(attachCanonicalDeliveryAction(payload));
  const implHandler = await loadImplHandler();
  return implHandler(req, res);
}
