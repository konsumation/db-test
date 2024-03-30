import {
  Master,
  SCHEMA_VERSION_CURRENT,
  fractionalDigits
} from "@konsumation/model";

/**
 *
 * @param {*} t
 * @param {Master} driver
 * @param {Object|string} options
 */
export async function testInitializeAndReopen(t, driver, options) {
  const master = await driver.initialize(options);

  t.truthy(master);
  t.is(master.description,options.description, "description");
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

/**
 * Create and test several Categories.
 * @param {*} t
 * @param {Master} master
 * @param {*} categoryFactory
 * @param {string[]} names
 * @param {*} extraAsserts
 * @returns {Promise<Category[]>}
 */
export async function testCreateCategories(
  t,
  master,
  categoryFactory,
  names,
  extraAsserts = async (t, category) => {}
) {
  const categories = [];

  for (const name of names) {
    const description = `Category ${name}`;
    const category = new categoryFactory({
      name,
      description
    });
    await category.write(master.context);
    t.is(category.name, name);
    t.is(category.description, description);
    await extraAsserts(t, category);
  }

  return categories;
}

function testAttributes(t, factory, values) {
  const object = new factory(values);

  const inverseMapping = Object.fromEntries(
    Object.entries(factory.attributeNameMapping).map(kv => [kv[1], kv[0]])
  );

  if (values) {
    for (let [k, v] of Object.entries(values)) {
      if (inverseMapping[k]) {
        t.deepEqual(
          object[inverseMapping[k]],
          v,
          `${factory.name} attribute ${k}(${inverseMapping[k]})`
        );
      } else {
        t.deepEqual(object[k], v, `${factory.name} attribute ${k}`);
      }
    }

    values = Object.fromEntries(
      Object.entries(values).filter(
        kv => factory.attributeNameMapping[kv[0]] === undefined
      )
    );

    t.deepEqual(object.attributeValues, values);
  }

  return object;
}

export function testCategoryConstructor(t, factory, extraValues) {
  testAttributes(t, factory, undefined);

  const object = testAttributes(t, factory, {
    name: "CAT-constructor",
    description: "Category insert",
    ...extraValues
  });

  let o = new factory();

  t.is(
    o.fractionalDigits,
    fractionalDigits.default,
    "default fractionalDigits"
  );
}

export function testMeterConstructor(t, factory, extraValues) {
  testAttributes(t, factory, undefined);

  const object = testAttributes(t, factory, {
    serial: "12345",
    description: `meter for category CAT1`,
    unit: "kwh",
    fractionalDigits: 2,
    validFrom: new Date(),
    ...extraValues
  });
}

export function testNoteConstructor(t, factory, extraValues) {
  testAttributes(t, factory, undefined);

  testAttributes(t, factory, {
    description: "Note insert",
    ...extraValues
  });
}
