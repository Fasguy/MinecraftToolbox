export type INBTOperation = {
	source: string; //NBT path
	target: string; //NBT path
	op: "replace" | "append" | "merge";
}