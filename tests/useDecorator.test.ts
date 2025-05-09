import { Column } from "../src/core";
import { getModel } from "../src/core/modelRegistry";
import { Use } from "../src/decorators/use";
import { expect, test } from "bun:test";

@Use()
class UserTest {
  email = new Column("Text", { unique: true });
}

test("[Use] - Decorator registers class with title case table name.", () => {
  const model = getModel("UserTest");

  expect(model?.tableName).toBe("UserTest");
  expect(model?.instance).toBeInstanceOf(UserTest);
});
