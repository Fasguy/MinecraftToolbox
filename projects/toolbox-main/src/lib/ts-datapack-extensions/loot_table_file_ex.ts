import { IEntry } from '../ts-datapack/interfaces/loot_table/entry';
import { IItemFunction } from '../ts-datapack/interfaces/loot_table/item_function';
import { IPredicate } from '../ts-datapack/interfaces/predicate';
import { spreadOrEmpty } from '../utils';
import { LootTableFile } from './loot_table_file';

type ConditionKit = {
	data: IPredicate;
	remove: () => void;
}

type FunctionKit = {
	data: IItemFunction;
	remove: () => void;
}

declare module "./loot_table_file" {
	interface LootTableFile {
		getConditions(condition: string): ConditionKit[];
		getConditionsWhenSiblingsExist(condition: string, ...siblings: string[]): ConditionKit[];
		getFunctions(functionDefinition: string): FunctionKit[];
	}
}

function getConditions(this: LootTableFile, condition: string) {
	let finalConditions: ConditionKit[] = [];

	function pushConditions(conditions?: IPredicate[]) {
		if (!conditions) return;

		for (const predicate of [...conditions]) {
			//TODO: This should either bail after a certain amount of recursions, or be turned into a loop instead.
			if (predicate.condition === "minecraft:any_of" || predicate.condition === "minecraft:alternative") {
				pushConditions(predicate.terms);
			}

			if (predicate.condition === "minecraft:inverted") {
				pushConditions([predicate.term]);
			}

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

function getConditionsWhenSiblingsExist(this: LootTableFile, condition: string, ...siblings: string[]) {
	let finalConditions: ConditionKit[] = [];

	function pushConditions(conditions?: IPredicate[]) {
		if (!conditions) return;

		for (const predicate of siblings) {
			if (!conditions.some(x => x.condition === predicate)) return;
		}

		for (const predicate of [...conditions]) {
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

function getFunctions(this: LootTableFile, functionDefinition: string) {
	let finalFunctions: FunctionKit[] = [];

	function pushFunctions(functions?: IItemFunction[]) {
		if (!functions) return;

		for (const itemFunction of [...functions]) {
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

LootTableFile.prototype.getConditions = getConditions;
LootTableFile.prototype.getConditionsWhenSiblingsExist = getConditionsWhenSiblingsExist;
LootTableFile.prototype.getFunctions = getFunctions;