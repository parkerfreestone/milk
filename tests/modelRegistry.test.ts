import { expect, test } from "bun:test";
import { Column, getModel, getSchema, registerModel } from "../src/orm";

class FakeModel {
  title = new Column("TEXT", { unique: true });
  notAcolumn = "should be ignored.";
}

test("[modelRegistry] - registerModel + getModel", () => {
  registerModel("FakeModel", new FakeModel(), "fake_model");

  const model = getModel("FakeModel");
  expect(model?.tableName).toBe("fake_model");
  expect(model?.instance).toBeInstanceOf(FakeModel);
});

test("[modelRegistry] getSchema only returns Column fields", () => {
  const instance = new FakeModel();
  const schema = getSchema(instance);

  expect(Object.keys(schema)).toEqual(["title"]);
  expect(schema.title).toBeInstanceOf(Column);
});
