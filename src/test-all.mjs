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

function testAttributes(t, factory, values) {
  const c = new factory(values);

  const inverseMapping = Object.fromEntries(
    Object.entries(factory.attributeNameMapping).map(kv => [kv[1], kv[0]])
  );

  for (let [k, v] of Object.entries(values)) {
    if (inverseMapping[k]) {
      t.deepEqual(
        c[inverseMapping[k]],
        v,
        `attribute ${k}(${inverseMapping[k]})`
      );
    } else {
      t.deepEqual(c[k], v, `attribute ${k}`);
    }
  }

  values = Object.fromEntries(
    Object.entries(values).filter(
      kv => factory.attributeNameMapping[kv[0]] === undefined
    )
  );

  t.deepEqual(c.attributeValues, values);
}

export function testCategoryConstructor(t, factory, extraValues) {
  testAttributes(t, factory, {
    name: "CAT-constructor",
    description: "Category insert",
    ...extraValues
  });
}

export function testMeterConstructor(t, factory, extraValues) {
  testAttributes(t, factory, {
    serial: "12345",
    description: `meter for category CAT1`,
    unit: "kwh",
    fractionalDigits: 2,
    validFrom: new Date(),
    ...extraValues
  });
}

export function testNoteConstructor(t, factory, extraValues) {
  testAttributes(t, factory, {
    description: "Note insert",
    ...extraValues
  });
}
