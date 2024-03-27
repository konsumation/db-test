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
  //t.truthy(master.context);
  t.is(master.schemaVersion, SCHEMA_VERSION_CURRENT);

  const categories = [];
  for await (const c of master.categories(master.context)) {
    categories.push(c);
  }
  t.deepEqual(categories, []);

  await master.close();
  t.falsy(master.context);

  const master2 = await driver.initialize(options);
  t.truthy(master2);
  t.is(master2.schemaVersion, SCHEMA_VERSION_CURRENT);
  await master2.close();
  t.falsy(master2.context);
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

export function testCategoryConstructor(t, factory, extraValues) {
  const values = {
    name: "CAT-constructor",
    description: "Category insert",
    ...extraValues
  };
  const c = new factory(values);
  for (const [k, v] of Object.entries(values)) {
    t.is(c[k], v, `attribute ${k}`);
  }
  t.deepEqual(c.attributeValues, values);
}

export function testMeterConstructor(t, factory, extraValues) {
  const values = {
    serial: "12345",
    description: `meter for category CAT1`,
    unit: "kwh",
    fractionalDigits: 2,
    validFrom: new Date(),
    ...extraValues,
  };

  const c = new factory(values);
  for (const [k, v] of Object.entries(values)) {
    t.is(c[k], v, `attribute ${k}`);
  }
  t.deepEqual(c.attributeValues, values);
}

export function testNoteConstructor(t, factory, extraValues) {
  const values = {
    description: "Note insert",
    ...extraValues
  };

  const c = new factory(values);
  for (const [k, v] of Object.entries(values)) {
    t.is(c[k], v, `attribute ${k}`);
  }
  t.deepEqual(c.attributeValues, values);
}
