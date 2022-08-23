import { Enchantment } from '../enums/resource_locations/enchantment';
import { INumberProvider } from './number_provider';
import { IRange } from './range';

export type IPredicate = IPredicate_Alternative
	| IPredicate_BlockStateProperty
	| IPredicate_DamageSourceProperties
	| IPredicate_EntityProperties
	| IPredicate_EntityScores
	| IPredicate_Inverted
	| IPredicate_KilledByPlayer
	| IPredicate_LocationCheck
	| IPredicate_MatchTool
	| IPredicate_RandomChance
	| IPredicate_RandomChanceWithLooting
	| IPredicate_Reference
	| IPredicate_SurvivesExplosion
	| IPredicate_TableBonus
	| IPredicate_TimeCheck
	| IPredicate_ValueCheck
	| IPredicate_WeatherCheck;

type IPredicate_Alternative = {
	condition: "minecraft:alternative";
	terms: IPredicate[];
}

type BlockStatePropertyValue = boolean | number /* Integer */ | string;

type IPredicate_BlockStateProperty = {
	condition: "minecraft:block_state_property";
	block: string;
	properties?: { [key: string]: BlockStatePropertyValue | IRange<BlockStatePropertyValue> };
}

type IPredicate_DamageSourceProperties = {
	condition: "minecraft:damage_source_properties";
	predicate: IPredicate_DamageSourceProperties_Predicate_Base
}

type IPredicate_DamageSourceProperties_Predicate_Base = {
	bypasses_armor: boolean;
	bypasses_invulnerability: boolean;
	bypasses_magic: boolean;
	direct_entity: any; //TODO: Implement this
	is_explosion: boolean;
	is_fire: boolean;
	is_magic: boolean;
	is_projectile: boolean;
	is_lightning: boolean;
	source_entity: any; //TODO: Implement this
}

type IPredicate_EntityProperties = {
	condition: "minecraft:entity_properties";
	entity: "this" | "killer" | "killer_player" | "direct_killer";
	predicate: any; //TODO: Implement this
}

type IPredicate_EntityScores = {
	condition: "minecraft:entity_scores";
	entity: "this" | "killer" | "killer_player" | "direct_killer";
	scores: { [key: string]: INumberProvider | IRange<INumberProvider> };
}

type IPredicate_Inverted = {
	condition: "minecraft:inverted";
	term: IPredicate;
}

type IPredicate_KilledByPlayer = {
	condition: "minecraft:killed_by_player";
}

type IPredicate_LocationCheck = {
	condition: "minecraft:location_check";
	offsetX: number; //Integer
	offsetY: number; //Integer
	offsetZ: number; //Integer
	predicate: any; //TODO: Implement this
}

type IPredicate_MatchTool = {
	condition: "minecraft:match_tool";
	predicate: any; //TODO: Implement this
}

type IPredicate_RandomChance = {
	condition: "minecraft:random_chance";
	chance: number; //Float
}

type IPredicate_RandomChanceWithLooting = {
	condition: "minecraft:random_chance_with_looting";
	chance: number; //Float
	looting_multiplier: number; //Float
}

type IPredicate_Reference = {
	condition: "minecraft:reference";
	name: string; //Resource location
}

type IPredicate_SurvivesExplosion = {
	condition: "minecraft:survives_explosion";
}

type IPredicate_TableBonus = {
	condition: "minecraft:table_bonus";
	enchantment: Enchantment;
	chances: any[]; //TODO: Can this be any type or just number?
}

type IPredicate_TimeCheck = {
	condition: "minecraft:time_check";
	value: number | IRange<INumberProvider>; //Integer
	period: number; //Integer
}

type IPredicate_ValueCheck = {
	condition: "minecraft:value_check";
	value: INumberProvider; //Integer
	range: number | IRange<INumberProvider>; //Integer
}

type IPredicate_WeatherCheck = {
	condition: "minecraft:weather_check";
	raining: boolean;
	thundering: boolean;
}