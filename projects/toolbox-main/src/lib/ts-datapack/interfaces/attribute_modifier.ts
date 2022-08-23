import { INumberProvider } from './number_provider';

type IAttributeModifierSlot = "mainhand" | "offhand" | "feet" | "legs" | "chest" | "head";

export type IAttributeModifier = {
	name: string;
	attribute: string; //Resource location
	operation: "add" | "multiply_base" | "multiply_total";
	amount: INumberProvider; //Float
	id?: string; //UUID
	slot: IAttributeModifierSlot | IAttributeModifierSlot[];
}