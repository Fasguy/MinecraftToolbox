import { IFile } from "../ts-datapack/interfaces/file";
import { ILootTable } from "../ts-datapack/interfaces/loot_table";

export class LootTableFile implements IFile {
	public name: string;
	public data: ILootTable;

	constructor(name: string, data: ILootTable) {
		this.name = name;
		this.data = data;
	}

	public serialize(): string {
		return JSON.stringify(this.data);
	}

	public removeCondition(condition: string) {
		for (const pool of this.data.pools ?? []) {
			for (const predicate of pool.conditions ?? []) {
				if (predicate.condition === condition) {
					pool.conditions.splice(pool.conditions.indexOf(predicate), 1);
				}
			}

			for (const entry of pool.entries ?? []) {
				for (const predicate of entry.conditions ?? []) {
					if (predicate.condition === condition) {
						entry.conditions.splice(entry.conditions.indexOf(predicate), 1);
					}
				}
			}
		}
	}
}