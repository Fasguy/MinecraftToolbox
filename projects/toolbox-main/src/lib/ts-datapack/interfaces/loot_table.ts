export type ILootTable = {
	type: string;
	functions: IItemFunction[];
	pools: IPool[];
}

export type IItemFunction = {

}

export type IPool = {
	conditions: IPredicate[];
	functions: IItemFunction[];
	rolls: number;
	bonus_rolls: number; //Default: 0.0
	entries: IEntry[];
}

export type IPredicate = {
	condition: string;
}

export type IEntry = {
	conditions: IPredicate[];
	type: "item" | "tag" | "loot_table" | "dynamic" | "empty" | "group" | "alternatives" | "sequence";
}