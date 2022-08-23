export type INumberProvider = number
	| (INumberProvider_Constant
		| INumberProvider_Uniform
		| INumberProvider_Binomial
		| INumberProvider_Score)

type INumberProvider_Constant = {
	type: "minecraft:constant";
	value: number;
}

type INumberProvider_Uniform = {
	type: "minecraft:uniform";
	min: INumberProvider; //Integer
	max: INumberProvider; //Integer
}

type INumberProvider_Binomial = {
	type: "minecraft:binomial";
	n: INumberProvider; //Integer
	p: INumberProvider; //Float
}

type INumberProvider_Score = INumberProvider_Score_Base
	& (INumberProvider_Score_TargetFixed
		| INumberProvider_Score_TargetContext);

type INumberProvider_Score_Base = {
	type: "minecraft:score";
	score: string;
	scale?: number; //Float
}

type INumberProvider_Score_TargetFixed = {
	target: {
		type: "fixed";
		name: string;
	}
}

type INumberProvider_Score_TargetContext = {
	target: {
		type: "context";
		target: "this" | "killer" | "direct_killer" | "player_killer";
	}
}