import { IPredicate } from '../predicate';
import { IItemFunction } from './item_function';

export type IEntry = IEntry_Base
	& (IEntry_Item
		| IEntry_Tag
		| IEntry_LootTable
		| IEntry_Dynamic
		| IEntry_Empty
		| IEntry_Group
		| IEntry_Alternatives
		| IEntry_Sequence)

type IEntry_Base = {
	conditions: IPredicate[];
}

type IEntry_Item = {
	type: "minecraft:item";
	functions: IItemFunction[];
	weight: number; //Integer
	quality: number; //Integer
	name: string; //Resource location
}

type IEntry_Tag = {
	type: "minecraft:tag";
	functions: IItemFunction[];
	weight: number; //Integer
	quality: number; //Integer
	name: string; //Resource location
	expand: boolean;
}

type IEntry_LootTable = {
	type: "minecraft:loot_table";
	functions: IItemFunction[];
	weight: number; //Integer
	quality: number; //Integer
	name: string; //Resource location
}

type IEntry_Dynamic = {
	type: "minecraft:dynamic";
	functions: IItemFunction[];
	weight: number; //Integer
	quality: number; //Integer
	name: string; //Resource location
}

type IEntry_Empty = {
	type: "minecraft:empty";
	weight: number; //Integer
	quality: number; //Integer
}

type IEntry_Group = {
	type: "minecraft:group";
	children: IEntry[];
}

type IEntry_Alternatives = {
	type: "minecraft:alternatives";
	children: IEntry[];
}

type IEntry_Sequence = {
	type: "minecraft:sequence";
	children: IEntry[];
}