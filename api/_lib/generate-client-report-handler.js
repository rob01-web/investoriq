import implHandler from "./generate-client-report-impl.js";
import { attachCanonicalDeliveryAction } from "./canonical-delivery-action.js";

export default async function handler(req, res) {
  const originalJson = res.json.bind(res);
  res.json = (payload) => originalJson(attachCanonicalDeliveryAction(payload));
  return implHandler(req, res);
}
