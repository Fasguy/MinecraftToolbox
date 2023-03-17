import { INumberProvider } from "../number_provider";
import { IPredicate } from "../predicate";
import { IEntry } from "./entry";
import { IItemFunction } from "./item_function";

export type IPool = {
	conditions: IPredicate[];
	functions: IItemFunction[];
	rolls: INumberProvider; //Integer
	bonus_rolls: INumberProvider; //Float, Default: 0.0
	entries: IEntry[];
}