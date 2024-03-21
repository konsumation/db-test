
async function testInitializeAndReopen(t,driver,options) {
  const master = await driver.initialize(options);

  t.is(master.schemaVersion, "2");
  t.truthy(master.db);

  const categories = [];
  for await (const c of master.categories()) {
    categories.push(c);
  }
  t.deepEqual(categories, []);

  master.db.close();

  const master2 = await driver.initialize(options);
  t.is(master2.schemaVersion, "2");
  t.truthy(master2.db);
}