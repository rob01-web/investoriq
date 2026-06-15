import assert from "assert";
import fs from "fs";
import path from "path";
import { describe, it } from "node:test";

describe("acquisition memo authority boundary smoke", () => {
  it("projection and renderer do not directly reference forbidden authority fields", () => {
    const files = [
      path.resolve("api/_lib/acquisition-memo-projection.js"),
      path.resolve("api/_lib/acquisition-memo-renderer.js"),
    ];
    const forbiddenStrings = [
      "semantic_doc_role",
      "debt_basis",
      "doc_type",
      "parse_error",
      "document_text_extracted",
      "originalFilename.toLowerCase",
      "filename.toLowerCase",
      ".includes(",
    ];

    for (const filePath of files) {
      const source = fs.readFileSync(filePath, "utf8");
      for (const forbidden of forbiddenStrings) {
        assert.ok(
          !source.includes(forbidden),
          `Forbidden string ${JSON.stringify(forbidden)} found in ${filePath}`
        );
      }
    }
  });
});
