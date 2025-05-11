import { generateTypes } from "./generate-types";
import { sync as syncSchema } from "../db";

export const sync = async () => {
  await syncSchema();
  await generateTypes();
};
