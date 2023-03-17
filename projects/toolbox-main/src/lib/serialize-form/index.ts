import { deserialize } from "./deserialize";
import { serialize } from "./serialize";

type Collection = { [key: string]: Collection };

export { Collection, serialize, deserialize };
