import { PackFormat } from "./enums/packformat";
import { IFile } from "./interfaces/file";
import { IRawJSONText } from "./interfaces/rawjsontext";

export class Pack_MCMeta implements IFile {
	public name: string = "pack.mcmeta";
	public packFormat: PackFormat = PackFormat.Invalid;
	public description: IRawJSONText = "";

	public serialize() {
		return JSON.stringify({
			pack: {
				pack_format: this.packFormat,
				description: this.description
			}
		});
	}
}