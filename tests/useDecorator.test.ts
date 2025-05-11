import { expect, test } from "bun:test";
import { Column, getModel, Use } from "../src/orm";

@Use()
class UserTest {
  email = new Column("Text", { unique: true });
}

test("[Use] - Decorator registers class with title case table name.", () => {
  const model = getModel("UserTest");

  expect(model?.tableName).toBe("UserTest");
  expect(model?.instance).toBeInstanceOf(UserTest);
});
