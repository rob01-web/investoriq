import assert from "assert";

process.env.SUPABASE_URL ||= "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "dummy-service-role-key";

const module = await import("../../api/generate-client-report.js");

assert.ok(module);
assert.ok(typeof module.default === "function");

console.log("generate-client-report import smoke PASS");
