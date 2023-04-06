import { fflateZip } from "../../../../../lib/fflate-zip";
import { Datapack } from "../ts-datapack/datapack";

export class DatapackSerializer {
	public static packUp(datapack: Datapack) {
		let zip = new fflateZip();

		for (const filePath of datapack.allFilePaths) {
			zip.add(filePath, datapack.get(filePath)!.serialize());
		}

		return zip.finalize();
	}
}