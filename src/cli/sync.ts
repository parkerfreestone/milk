import { generateTypes } from "./generate-types";
import { sync as syncSchema } from "../db";
import { loadModels } from "../orm";

export const sync = async () => {
  await loadModels();
  await syncSchema();
  await generateTypes();
};
