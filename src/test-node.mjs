import { createReadStream } from "node:fs";
import { fileURLToPath } from "node:url";
export * from "./test-all.mjs";

export async function testRestoreVersion2(t, driver, options) {
  const master = await driver.initialize(options);

  const input = createReadStream(
    fileURLToPath(new URL("fixtures/database-version-2.txt", import.meta.url)),
    "utf8"
  );

  const statistics = await master.fromText(input);

  t.is(statistics.category, 3, "# of categories");
  t.is(statistics.value, 3 * 10, "# of values");

  const categories = [];
  for await (const c of master.categories(master.context)) {
    categories.push(c);
  }

  t.deepEqual(
    categories.map(c => c.name),
    ["CAT-0", "CAT-1", "CAT-2"]
  );

  const meters = [];
  for await (const m of categories[0].meters(master.context)) {
    meters.push(m);
  }
  t.deepEqual(
    meters.map(m => m.name),
    ["M-0", "M-1"]
  );
}

export async function testRestoreVersion3(t, driver, options) {
  const master = await driver.initialize(options);

  const input = createReadStream(
    fileURLToPath(new URL("fixtures/database-version-3.txt", import.meta.url)),
    "utf8"
  );

  const statistics = await master.fromText(input);

  t.is(statistics.category, 3, "# of categories");
  t.is(statistics.value, 3 * 10, "# of values");

  const categories = [];
  for await (const c of master.categories(master.context)) {
    categories.push(c);
  }

  t.deepEqual(
    categories.map(c => c.name),
    ["CAT-0", "CAT-1", "CAT-2"]
  );

  const meters = [];
  for await (const m of categories[0].meters(master.context)) {
    meters.push(m);
  }
  t.deepEqual(
    meters.map(m => m.name),
    ["M-0", "M-1"]
  );
}
