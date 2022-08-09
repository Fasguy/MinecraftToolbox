import { fflateZip } from "../../../../../lib/fflate-zip";
import { Datapack } from "../ts-datapack/datapack";
import { flatten } from "../utils";

export class DatapackSerializer {
	public static packUp(datapack: Datapack) {
		let zip = new fflateZip();

		let serialized = datapack.serialize();

		let flattened = flatten(serialized, "", "/", {});

		for (let [key, value] of Object.entries<any>(flattened)) {
			zip.add(key, value);
		}

		return zip.finalize();
	}
}