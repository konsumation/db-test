import test from "ava";
import { Master } from "@konsumation/model";
import { testInitializeAndReopen } from "@konsumation/db-test";

test("initialize", async t =>
  await testInitializeAndReopen(t, Master, { description: "Test db" }, "Master"));
