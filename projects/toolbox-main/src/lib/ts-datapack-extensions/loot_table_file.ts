import { IFile } from "../ts-datapack/interfaces/file";
import { IEntry } from "../ts-datapack/interfaces/loot_table/entry";
import { IItemFunction } from "../ts-datapack/interfaces/loot_table/item_function";
import { ILootTable } from "../ts-datapack/interfaces/loot_table/loot_table";
import { IPredicate } from "../ts-datapack/interfaces/predicate";
import { spreadOrEmpty } from "../utils";

type ConditionKit = {
	data: IPredicate;
	remove: () => void;
}

type FunctionKit = {
	data: IItemFunction;
	remove: () => void;
}

export class LootTableFile implements IFile {
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

	public getConditions(condition: string) {
		let finalConditions: ConditionKit[] = [];

		function pushConditions(conditions: IPredicate[]) {
			for (const predicate of spreadOrEmpty(conditions)) {
				if (predicate.condition === condition) {
					finalConditions.push({
						data: predicate,
						remove: () => {
							conditions.splice(conditions.indexOf(predicate), 1);
						}
					});
				}
			}
		}

		for (const itemFunction of spreadOrEmpty(this.data.functions)) {
			pushConditions(itemFunction.conditions);
		}

		for (const pool of spreadOrEmpty(this.data.pools)) {
			pushConditions(pool.conditions);

			for (const itemFunction of spreadOrEmpty(pool.functions)) {
				pushConditions(itemFunction.conditions);
			}

			let entries = spreadOrEmpty(pool.entries);
			let currentEntry: IEntry | undefined;
			while (currentEntry = entries.pop()) {
				pushConditions(currentEntry.conditions);

				switch (currentEntry.type) {
					case "minecraft:item":
					case "minecraft:tag":
					case "minecraft:loot_table":
					case "minecraft:dynamic":
						for (const itemFunction of spreadOrEmpty(currentEntry.functions)) {
							pushConditions(itemFunction.conditions);
						}
						break;
					case "minecraft:group":
					case "minecraft:alternatives":
					case "minecraft:sequence":
						entries.push(...spreadOrEmpty(currentEntry.children));
						break;
				}
			}
		}

		return finalConditions;
	}

	public getFunctions(functionDefinition: string) {
		let finalFunctions: FunctionKit[] = [];

		function pushFunctions(functions: IItemFunction[]) {
			for (const itemFunction of spreadOrEmpty(functions)) {
				if (itemFunction.function === functionDefinition) {
					finalFunctions.push({
						data: itemFunction,
						remove: () => {
							functions.splice(functions.indexOf(itemFunction), 1);
						}
					});
				}
			}
		}

		pushFunctions(this.data.functions);

		for (const pool of spreadOrEmpty(this.data.pools)) {
			pushFunctions(pool.functions);

			let entries = spreadOrEmpty(pool.entries);
			let currentEntry: IEntry | undefined;
			while (currentEntry = entries.pop()) {
				switch (currentEntry.type) {
					case "minecraft:item":
					case "minecraft:tag":
					case "minecraft:loot_table":
					case "minecraft:dynamic":
						pushFunctions(currentEntry.functions);
						break;
					case "minecraft:group":
					case "minecraft:alternatives":
					case "minecraft:sequence":
						entries.push(...spreadOrEmpty(currentEntry.children));
						break;
				}
			}
		}

		return finalFunctions;
	}
}