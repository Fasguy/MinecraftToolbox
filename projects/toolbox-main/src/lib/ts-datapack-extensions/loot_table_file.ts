import { IFile } from "../ts-datapack/interfaces/file";
import { ILootTable } from "../ts-datapack/interfaces/loot_table/loot_table";

export class LootTableFile implements IFile {
	[x: string]: any;
	public name: string;
	public data: ILootTable;

	constructor(name: string, data: ILootTable) {
		this.name = name;
		this.data = data;
	}

	public clone() {
		return new LootTableFile(this.name, JSON.parse(JSON.stringify(this.data)));
	}

	public serialize(): string {
		return JSON.stringify(this.data);
	}
}