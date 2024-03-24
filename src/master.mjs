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
  t.is(master.schemaVersion, SCHEMA_VERSION_CURRENT);

  const categories = [];
  for await (const c of master.categories()) {
    categories.push(c);
  }
  t.deepEqual(categories, []);

  master.close();

  const master2 = await driver.initialize(options);
  t.truthy(master2);
  t.is(master2.schemaVersion, SCHEMA_VERSION_CURRENT);
}
