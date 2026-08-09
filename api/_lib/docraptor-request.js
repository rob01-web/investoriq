import axios from "axios";
import { attachDocRaptorProviderDiagnostic } from "./docraptor-provider-diagnostics.js";

// Keep this under the worker's bounded render loop so a hung provider call still leaves cleanup room.
export const DOCRAPTOR_REQUEST_TIMEOUT_MS = 45_000;

function normalizeRequestTimeoutMs(timeoutMs = DOCRAPTOR_REQUEST_TIMEOUT_MS) {
  const parsed = Number.parseInt(String(timeoutMs), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DOCRAPTOR_REQUEST_TIMEOUT_MS;
}

export function createDocRaptorRequestDeadline(timeoutMs = DOCRAPTOR_REQUEST_TIMEOUT_MS) {
  const normalizedTimeoutMs = normalizeRequestTimeoutMs(timeoutMs);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), normalizedTimeoutMs);
  return {
    controller,
    signal: controller.signal,
    timeoutMs: normalizedTimeoutMs,
    clear() {
      clearTimeout(timeout);
    },
  };
}

export async function requestDocRaptorPdf({
  documentContent,
  apiKey = "",
  docraptorMode = "test",
  attempt = "initial",
  timeoutMs = DOCRAPTOR_REQUEST_TIMEOUT_MS,
  post = axios.post,
} = {}) {
  const deadline = createDocRaptorRequestDeadline(timeoutMs);
  try {
    return await post.call(
      axios,
      "https://api.docraptor.com/docs",
      {
        test: docraptorMode !== "production",
        document_content: String(documentContent || ""),
        name: "InvestorIQ-ClientReport.pdf",
        document_type: "pdf",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(String(apiKey || "") + ":").toString("base64")}`,
        },
        responseType: "arraybuffer",
        signal: deadline.signal,
        timeout: deadline.timeoutMs,
      }
    );
  } catch (error) {
    attachDocRaptorProviderDiagnostic(error, {
      attempt,
      timeoutMs: deadline.timeoutMs,
    });
    throw error;
  } finally {
    deadline.clear();
  }
}
