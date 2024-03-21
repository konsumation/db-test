
import { Master} from "@konsumation/model";

/**
 * 
 * @param {*} t 
 * @param {Master} driver 
 * @param {Object|string} options 
 */
export async function testInitializeAndReopen(t,driver,options) {
  const master = await driver.initialize(options);

  t.truthy(master);

  const categories = [];
  for await (const c of master.categories()) {
    categories.push(c);
  }
  t.deepEqual(categories, []);

  master.db.close();

  const master2 = await driver.initialize(options);
  t.truthy(master2);
}
