import {
  Master,
  Category,
  Meter,
  Note,
  SCHEMA_VERSION_CURRENT,
  fractionalDigits,
  order
} from "@konsumation/model";

/**
 *
 * @param {*} t
 * @param {Master} driver
 * @param {Object|string} options
 * @param {string} name driver name
 */
export async function testInitializeAndReopen(t, driver, options, name) {
  t.is(driver.name, name, "name");
  const master = await driver.initialize(options);

  t.truthy(master);
  t.is(master.description, options.description, "description");
  //t.truthy(master.context);
  t.is(master.schemaVersion, SCHEMA_VERSION_CURRENT);

  const categories = [];
  for await (const c of master.categories()) {
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

export async function createData(
  master,
  categoryNames,
  meterNames,
  numberOfValues,
  firstDate,
  dateIncrement,
  firstValue,
  valueIncrement
) {
  const context = master.context;

  for (const name of categoryNames) {
    const category = await master.addCategory(context, {
      name,
      unit: "kWh",
      fractionalDigits: 3,
      description: "mains power"
    });
    category.write(context);
    for (const name of meterNames) {
      const meter = await category.addMeter(context, { name });
      meter.write(context);

      for (let i = 0; i < numberOfValues; i++) {
        const value = meter.addValue(context, {
          date: new Date(firstDate.getTime() + i * dateIncrement),
          value: firstValue + i * valueIncrement
        });
        value.write(context);
      }
    }
  }
}

/**
 * Create and test several Categories.
 * @param {*} t
 * @param {Master} master
 * @param {string[]} names
 * @param {Object} attributes
 * @param {*} extraAsserts
 * @returns {Promise<Category[]>}
 */
export async function testCreateCategories(
  t,
  master,
  names,
  attributes,
  extraAsserts = async (t, category) => {}
) {
  const categories = [];

  for (const name of names) {
    const description = `Category ${name}`;
    const category = new master.constructor.factories.category({
      name,
      description,
      ...attributes
    });
    categories.push(category);
    await category.write(master.context);
    t.is(category.name, name);
    t.is(category.description, description);
    await extraAsserts(t, category);
  }

  return categories;
}
export async function testWriteReadUpdateDeleteCategories(t, master) {
  const context = master.context;
  const categories = await testCreateCategories(
    t,
    master,
    Array.from({ length: 10 }, (_, i) => `CAT-${i}`),
    { fractionalDigits: 3, unit: "kWh" }
    // (t, category) => console.log(category)
  );

  t.true(categories.length >= 10);
  t.is(categories[0].unit, "kWh");
  t.is(categories[0].fractionalDigits, 3);

  let category = await master.category(context, "CAT-7");
  t.is(category.name, "CAT-7");
  t.is(category.unit, "kWh");
  t.is(category.fractionalDigits, 3);

  category.description = "update";
  category.name = "bla";
  await category.write(context);

  category = await master.category(context, "bla");
  t.is(category.name, "bla");
  t.is(category.description, "update");

  category = await master.category(context, "CAT-9");
  await category.delete(context);

  const lines = [];
  for await (const line of master.text(context)) {
    lines.push(line);
  }

  t.true(lines.length >= 5 * 10);

  await master.close();
}

/**
 * Create and test several Categories.
 * @param {*} t
 * @param {Master} master
 * @param {string[]} names
 * @param {Object} attributes
 * @param {*} extraAsserts
 * @returns {Promise<Meter[]>}
 */
export async function testCreateMeters(
  t,
  master,
  names,
  category,
  attributes,
  extraAsserts = async (t, meter) => {}
) {
  const meters = [];

  for (const name of names) {
    const description = `Meter ${name}`;
    const meter = new master.constructor.factories.meter({
      name,
      description,
      category,
      ...attributes
    });
    meters.push(meter);
    await meter.write(master.context);
    t.is(meter.name, name);
    t.is(meter.description, description);
    await extraAsserts(t, meter);
  }

  return meters;
}

/**
 * Create and test several Notes.
 * @param {*} t
 * @param {Master} master
 * @param {string[]} names
 * @param {Object} attributes
 * @param {*} extraAsserts
 * @returns {Promise<Note[]>}
 */
export async function testCreateNotes(
  t,
  master,
  names,
  meter,
  attributes,
  extraAsserts = async (t, meter) => {}
) {
  const notes = [];

  for (const name of names) {
    const description = `Note ${name}`;
    const note = new master.constructor.factories.note({
      name,
      description,
      meter,
      ...attributes
    });
    notes.push(note);
    await note.write(master.context);
    t.is(note.name, name);
    t.is(note.description, description);
    await extraAsserts(t, meter);
  }

  return notes;
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
        kv => factory.attributeNameMapping[kv[0]] === undefined // && factory.attributes[kv[0]].default !== kv[1]
      )
    );

    t.deepEqual(object.getAttributes(), values);
  }

  return object;
}

export function testCategoryConstructor(t, factory, extraValues) {
  t.is(factory.type, "category", "type");

  testAttributes(t, factory, undefined);

  const object = testAttributes(t, factory, {
    name: "CAT-constructor",
    description: "Category insert",
    fractionalDigits: fractionalDigits.default, // TODO without defaults
    order: order.default, // TODO without defaults
    ...extraValues
  });

  let o = new factory();

  t.is(o.type, "category", "type");

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

export function testValueConstructor(t, factory, extraValues) {
  testAttributes(t, factory, undefined);

  testAttributes(t, factory, {
    value: 1.2,
    ...extraValues
  });
}

export async function testInsertListValues(t, master, object, values) {
  const written = [];
  for (const value of values) {
    const v = object.addValue(master.context, value);
    await v.write(master.context);
    written.push(v.getAttributes());
  }

  const r = [];
  for await (const value of object.values(master.context)) {
    r.push(value.getAttributes());
  }

  t.deepEqual(r, written);
}
