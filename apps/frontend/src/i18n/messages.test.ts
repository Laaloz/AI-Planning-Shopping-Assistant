import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import fi from "../../messages/fi.json";

type Tree = { [key: string]: string | Tree };

function keyPaths(tree: Tree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string" ? [`${prefix}${key}`] : keyPaths(value, `${prefix}${key}.`),
  );
}

describe("message files", () => {
  it("define the same keys in fi and en", () => {
    expect(keyPaths(en).sort()).toEqual(keyPaths(fi).sort());
  });

  it("have no empty strings", () => {
    for (const messages of [fi, en]) {
      expect(keyPaths(messages).length).toBeGreaterThan(0);
      expect(JSON.stringify(messages)).not.toContain('""');
    }
  });
});
