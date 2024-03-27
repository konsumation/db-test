import { Master, SCHEMA_VERSION_CURRENT } from "@konsumation/model";

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
    ...extraValues
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
