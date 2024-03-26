import { Master, SCHEMA_VERSION_CURRENT } from "@konsumation/model";
import { createReadStream } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 *
 * @param {*} t
 * @param {Master} driver
 * @param {Object|string} options
 */
export async function testInitializeAndReopen(t, driver, options) {
  const master = await driver.initialize(options);

  t.truthy(master);
  t.is(master.schemaVersion, SCHEMA_VERSION_CURRENT);

  const categories = [];
  for await (const c of master.categories(master.context)) {
    categories.push(c);
  }
  t.deepEqual(categories, []);

  await master.close();

  const master2 = await driver.initialize(options);
  t.truthy(master2);
  t.is(master2.schemaVersion, SCHEMA_VERSION_CURRENT);
  await master2.close();
}

export async function testRestoreVersion2(t, driver, options) {
  const master = await driver.initialize(options);

  const input = createReadStream(
    fileURLToPath(new URL("fixtures/database-version-2.txt", import.meta.url)),
    { encoding: "utf8" }
  );
  const { numberOfValues, numberOfCategories } = await master.restore(input);

  t.is(numberOfCategories, 3);
  t.is(numberOfValues, 3 * 10);

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

export function testCategoryConstructor(t, categoryFactory) {
  const c = new categoryFactory({
    name: "CAT-constructor",
    description: "Category insert"
  });
  t.is(c.name, "CAT-constructor");
  t.is(c.description, "Category insert");
}

export function testMeterConstructor(t, meterFactory) {
  const c = new meterFactory({
    serial: "M-constructor",
    description: "Meter insert"
  });
  t.is(c.serial, "M-constructor");
  t.is(c.description, "Meter insert");
}

export function testNoteConstructor(t, noteFactory) {
  const c = new noteFactory({
    description: "Note insert"
  });
  t.is(c.description, "Note insert");
}
