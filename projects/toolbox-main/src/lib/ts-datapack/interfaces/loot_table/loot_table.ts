import { IItemFunction } from "./item_function";
import { IPool } from "./pool";

export type ILootTable = ILootTable_Base
	& (ILootTable_Empty
		| ILootTable_Chest
		| ILootTable_Command
		| ILootTable_Selector
		| ILootTable_Fishing
		| ILootTable_Entity
		| ILootTable_Gift
		| ILootTable_Barter
		| ILootTable_AdvancementReward
		| ILootTable_AdvancementEntity
		| ILootTable_Generic
		| ILootTable_Block);

type ILootTable_Base = {
	functions?: IItemFunction[];
	pools?: IPool[];
}

type ILootTable_Empty = {
	type?: "minecraft:empty";
}

type ILootTable_Chest = {
	type: "minecraft:chest";
}

type ILootTable_Command = {
	type: "minecraft:command";
}

type ILootTable_Selector = {
	type: "minecraft:selector";
}

type ILootTable_Fishing = {
	type: "minecraft:fishing";
}

type ILootTable_Entity = {
	type: "minecraft:entity";
}

type ILootTable_Gift = {
	type: "minecraft:gift";
}

type ILootTable_Barter = {
	type: "minecraft:barter";
}

type ILootTable_AdvancementReward = {
	type: "minecraft:advancement_reward";
}

type ILootTable_AdvancementEntity = {
	type: "minecraft:advancement_entity";
}

type ILootTable_Generic = {
	type: "minecraft:generic";
}

type ILootTable_Block = {
	type: "minecraft:block";
}