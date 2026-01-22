import { TextractClient, AnalyzeDocumentCommand } from "@aws-sdk/client-textract";

const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);

const assertEnv = () => {
  const missing = [];
  if (!process.env.AWS_REGION) missing.push("AWS_REGION");
  if (!process.env.AWS_ACCESS_KEY_ID) missing.push("AWS_ACCESS_KEY_ID");
  if (!process.env.AWS_SECRET_ACCESS_KEY) missing.push("AWS_SECRET_ACCESS_KEY");
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
};

const getClient = () => {
  assertEnv();
  return new TextractClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
};

export const analyzeTables = async ({ bytes, mimeType }) => {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(`Unsupported mime type: ${mimeType}`);
  }

  const client = getClient();
  const command = new AnalyzeDocumentCommand({
    Document: { Bytes: bytes },
    FeatureTypes: ["TABLES"],
  });

  return client.send(command);
};
