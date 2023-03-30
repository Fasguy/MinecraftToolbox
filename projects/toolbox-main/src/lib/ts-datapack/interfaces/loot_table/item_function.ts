import { MapTextID } from "../../enums/map_text_id";
import { Effect } from "../../enums/resource_locations/effect";
import { Enchantment } from "../../enums/resource_locations/enchantment";
import { IAttributeModifier } from "../attribute_modifier";
import { INBTOperation } from "../nbt_operation";
import { INumberProvider } from "../number_provider";
import { IPredicate } from "../predicate";
import { IRange } from "../range";
import { IRawJSONText } from "../rawjsontext";
import { ILootTable } from "./loot_table";
import { IPattern } from "./pattern";

export type IItemFunction = IItemFunction_Base
	& (IItemFunction_ApplyBonus
		| IItemFunction_CopyName
		| IItemFunction_CopyNBT
		| IItemFunction_CopyState
		| IItemFunction_EnchantRandomly
		| IItemFunction_EnchantWithLevels
		| IItemFunction_ExplorationMap
		| IItemFunction_ExplosionDecay
		| IItemFunction_FillPlayerHead
		| IItemFunction_FurnaceSmelt
		| IItemFunction_LimitCount
		| IItemFunction_LootingEnchant
		| IItemFunction_SetAttributes
		| IItemFunction_SetBannerPattern
		| IItemFunction_SetContents
		| IItemFunction_SetCount
		| IItemFunction_SetDamage
		| IItemFunction_SetEnchantments
		| IItemFunction_SetInstrument
		| IItemFunction_SetLootTable
		| IItemFunction_SetLore
		| IItemFunction_SetName
		| IItemFunction_SetNBT
		| IItemFunction_SetPotion
		| IItemFunction_SetStewEffect);

type IItemFunction_Base = {
	conditions?: IPredicate[];
}

type IItemFunction_ApplyBonus = IItemFunction_ApplyBonus_Base
	& (IItemFunction_ApplyBonus_BinomialWithBonusCount
		| IItemFunction_ApplyBonus_UniformBonusCount
		| IItemFunction_ApplyBonus_OreDrops);

type IItemFunction_ApplyBonus_Base = {
	function: "minecraft:apply_bonus";
	enchantment: Enchantment;
}

type IItemFunction_ApplyBonus_BinomialWithBonusCount = {
	formula: "binomial_with_bonus_count";
	parameters: {
		extra: number; //Integer
		probability: number; //Float
	}
}

type IItemFunction_ApplyBonus_UniformBonusCount = {
	formula: "uniform_bonus_count";
	parameters: {
		bonusMultiplier: number; //Float
	}
}

type IItemFunction_ApplyBonus_OreDrops = {
	formula: "ore_drops";
}

type IItemFunction_CopyName = {
	function: "minecraft:copy_name";
	source: "block_entity" | "this" | "killer" | "killer_player";
}

type IItemFunction_CopyNBT = IItemFunction_CopyNBT_Base
	& (IItemFunction_CopyNBT_SourceString
		| IItemFunction_CopyNBT_SourceObject);

type IItemFunction_CopyNBT_Base = {
	function: "minecraft:copy_nbt";
	ops: INBTOperation[];
}

type IItemFunction_CopyNBT_SourceString = {
	source: "block_entity" | "this" | "killer" | "killer_player" | "direct_killer";
}

type IItemFunction_CopyNBT_SourceObject = IItemFunction_CopyNBT_SourceObject_Context | IItemFunction_CopyNBT_SourceObject_Storage;

type IItemFunction_CopyNBT_SourceObject_Context = {
	type: "context";
	target: "block_entity" | "this" | "killer" | "killer_player" | "direct_killer";
}

type IItemFunction_CopyNBT_SourceObject_Storage = {
	type: "storage";
	source: string; //Resource location
}

type IItemFunction_CopyState = {
	function: "minecraft:copy_state";
	block: string; //Resource location
	properties: string[]; //TODO: What exactly does this mean?
}

type IItemFunction_EnchantRandomly = {
	function: "minecraft:enchant_randomly";
	enchantments?: Enchantment[];
}

type IItemFunction_EnchantWithLevels = {
	function: "minecraft:enchant_with_levels";
	treasure: boolean;
	levels: INumberProvider; //Integer
}

type IItemFunction_ExplorationMap = {
	function: "minecraft:exploration_map";
	destination: string; //Default: "on_treasure_maps"
	decoration: MapTextID; //Default: "mansion"
	zoom: number; //Integer, Default: 2
	search_radius: number; //Integer, Default: 50
	skip_existing_chunks: boolean; //Default: true
}

type IItemFunction_ExplosionDecay = {
	function: "minecraft:explosion_decay";
}

type IItemFunction_FillPlayerHead = {
	function: "minecraft:fill_player_head";
	entity: "this" | "killer" | "killer_player" | "direct_killer";
}

type IItemFunction_FurnaceSmelt = {
	function: "minecraft:furnace_smelt";
}

type IItemFunction_LimitCount = {
	function: "minecraft:limit_count";
	limit: number | Partial<IRange<INumberProvider>> //Integer
}

type IItemFunction_LootingEnchant = {
	function: "minecraft:looting_enchant";
	count: INumberProvider; //Integer
	limit: number; //Integer, Default: 0
}

type IItemFunction_SetAttributes = {
	function: "minecraft:set_attributes";
	modifiers: IAttributeModifier[];
}

type IItemFunction_SetBannerPattern = {
	function: "minecraft:set_banner_pattern";
	patterns: IPattern[];
	append: boolean;
}

type IItemFunction_SetContents = {
	function: "minecraft:set_contents";
	entries: ILootTable[];
	type: string;
}

type IItemFunction_SetCount = {
	function: "minecraft:set_count";
	count: INumberProvider; //Integer
	add?: boolean; //Default: false
}

type IItemFunction_SetDamage = {
	function: "minecraft:set_damage";
	damage: INumberProvider; //Float
	add?: boolean; //Default: false
}

type IItemFunction_SetEnchantments = {
	function: "minecraft:set_enchantments";
	enchantments: { [key in Enchantment]?: INumberProvider };
	add?: boolean; //Default: false
}

type IItemFunction_SetInstrument = {
	function: "minecraft:set_instrument";
	options: string;
}

type IItemFunction_SetLootTable = {
	function: "minecraft:set_loot_table";
	name: string; //Resource location
	seed?: number; //Integer
	type: string;
}

type IItemFunction_SetLore = {
	function: "minecraft:set_lore";
	lore: IRawJSONText[];
	entity?: "this" | "killer" | "killer_player" | "direct_killer";
	replace?: boolean; //Default: false
}

type IItemFunction_SetName = {
	function: "minecraft:set_name";
	name: IRawJSONText;
	entity?: "this" | "killer" | "killer_player" | "direct_killer";
}

type IItemFunction_SetNBT = {
	function: "minecraft:set_nbt";
	tag: string; //JSON string
}

type IItemFunction_SetPotion = {
	function: "minecraft:set_potion";
	id: Effect;
}

type IItemFunction_SetStewEffect = {
	function: "minecraft:set_stew_effect";
	effects: {
		type: Effect;
		duration: INumberProvider; //Integer
	}[];
}